<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Inertia\Inertia;
use App\Models\OutagePlan;
use App\Support\OutagePhotos;
use App\Support\SCurveChartRenderer;
use App\Support\TahunFilter;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class OutagePlanController extends Controller
{
    /** Filter keys accepted by the listing, in the order they appear in the UI. */
    private const FILTER_KEYS = [
        'search', 'tahun', 'scope', 'jenis', 'sistem', 'ket',
        'ket_realisasi', 'progres', 'dari', 'sampai',
    ];

    public function index(Request $request)
    {
        // Each account manages one engine brand; admin/tamu see everything.
        $query = OutagePlan::visibleTo($request->user());

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('mesin_pembangkit', 'like', "%{$search}%")
                    ->orWhere('scope', 'like', "%{$search}%")
                    ->orWhere('sistem', 'like', "%{$search}%")
                    ->orWhere('jenis_pembangkit', 'like', "%{$search}%");
            });
        }

        // Tanpa parameter, listing terbuka di tahun berjalan — bukan seluruh tahun.
        $tahun = TahunFilter::resolve($request->input('tahun'), $this->tahunOptions());

        if ($tahun !== null) {
            $query->whereYear('start_date', $tahun);
        }

        foreach (['scope' => 'scope', 'jenis' => 'jenis_pembangkit', 'sistem' => 'sistem', 'ket' => 'ket', 'ket_realisasi' => 'ket_realisasi'] as $param => $column) {
            if ($request->filled($param)) {
                $query->where($column, $request->input($param));
            }
        }

        // Date range applies to the planned start date.
        if ($request->filled('dari')) {
            $query->whereDate('start_date', '>=', $request->input('dari'));
        }
        if ($request->filled('sampai')) {
            $query->whereDate('start_date', '<=', $request->input('sampai'));
        }

        match ($request->input('progres')) {
            'belum' => $query->where(fn ($q) => $q->whereNull('progress')->orWhere('progress', '<=', 0)),
            'berjalan' => $query->where('progress', '>', 0)->where('progress', '<', 100),
            'selesai' => $query->where('progress', '>=', 100),
            default => null,
        };

        // Ordered by id so the listing mirrors the row order of the source sheet.
        $outagePlans = $query->with('dailyProgresses')->orderBy('id')->paginate(20)->withQueryString();
        $units = \App\Models\Unit::with('mesins')->get();

        return Inertia::render('outage-plans/index', [
            'outagePlans' => $outagePlans,
            'units' => $units,
            'filters' => array_merge(
                $request->only(self::FILTER_KEYS),
                ['tahun' => TahunFilter::label($tahun)],
            ),
            'filterOptions' => $this->filterOptions(),
        ]);
    }

    /** @return array<int, string> */
    private function tahunOptions(): array
    {
        return TahunFilter::options(OutagePlan::visibleTo(request()->user()), 'start_date');
    }

    /**
     * Distinct values straight from the table, so every option is guaranteed to
     * match something and stays in sync when new data is imported.
     */
    private function filterOptions(): array
    {
        // Options are scoped to what this account manages, so it never sees a
        // choice that would return nothing.
        $user = request()->user();

        $distinct = fn (string $column) => OutagePlan::visibleTo($user)
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->values();

        return [
            'tahun' => $this->tahunOptions(),
            'scope' => $distinct('scope'),
            'jenis' => $distinct('jenis_pembangkit'),
            'sistem' => $distinct('sistem'),
            'ket' => $distinct('ket'),
            'ket_realisasi' => $distinct('ket_realisasi'),
        ];
    }

    public function show(OutagePlan $outagePlan)
    {
        $outagePlan->load('dailyProgresses');
        $summary = $this->summarize($outagePlan);

        return Inertia::render('outage-plans/show', [
            'outagePlan' => $outagePlan,
            ...$summary,
        ]);
    }

    /**
     * Halaman edit tersendiri.
     *
     * Sebelumnya edit dilakukan di dalam modal, dan tabel progress harian yang
     * bisa puluhan baris membuat pengguna harus menggulir dua lapis — isi modal
     * dan isi tabel — hanya untuk mengisi satu angka.
     */
    public function edit(Request $request, OutagePlan $outagePlan)
    {
        abort_unless(
            OutagePlan::visibleTo($request->user())->whereKey($outagePlan->id)->exists(),
            403,
        );

        $outagePlan->load('dailyProgresses');

        return Inertia::render('outage-plans/edit', [
            'outagePlan' => $outagePlan,
            'units' => \App\Models\Unit::with('mesins')->get(),
        ]);
    }

    /**
     * Detail satu pekerjaan sebagai JSON, untuk Quick Access di dashboard.
     *
     * Isinya sama persis dengan halaman detail, hanya tanpa render Inertia,
     * supaya dialog di dashboard memakai sumber angka yang sama.
     */
    public function detailJson(Request $request, OutagePlan $outagePlan)
    {
        // Akun pengelola hanya boleh membuka mesin merek yang dikelolanya.
        abort_unless(
            OutagePlan::visibleTo($request->user())->whereKey($outagePlan->id)->exists(),
            403,
        );

        $outagePlan->load('dailyProgresses');

        return response()->json([
            'outagePlan' => $outagePlan,
            ...$this->summarize($outagePlan),
        ]);
    }

    /**
     * Compute the total duration and overall plan/actual progress shared by
     * the detail page and the PDF/Excel exports.
     */
    private function summarize(OutagePlan $outagePlan): array
    {
        $totalHari = null;
        if ($outagePlan->start_date && $outagePlan->selesai) {
            $totalHari = \Carbon\Carbon::parse($outagePlan->start_date)
                ->diffInDays(\Carbon\Carbon::parse($outagePlan->selesai)) + 1;
        }

        // Progress is cumulative, so the highest recorded value is the current progress.
        $overallPlan = $outagePlan->dailyProgresses->max('plan_progress');
        $overallActual = $outagePlan->dailyProgresses->max('actual_progress');

        return [
            'totalHari' => $totalHari,
            'overallPlan' => $overallPlan ?? $outagePlan->progress ?? 0,
            'overallActual' => $overallActual ?? $outagePlan->progress ?? 0,
        ];
    }

    public function exportPdf(OutagePlan $outagePlan)
    {
        $outagePlan->load('dailyProgresses');
        $summary = $this->summarize($outagePlan);

        $pdf = Pdf::loadView('exports.outage-plan', [
            'outagePlan' => $outagePlan,
            'chartImage' => SCurveChartRenderer::renderDataUri($outagePlan),
            'logo' => $this->logoDataUri(),
            ...$summary,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($this->exportFilename($outagePlan, 'pdf'));
    }

    private function logoDataUri(): ?string
    {
        $path = public_path('sidebar-logo.png');

        if (! is_file($path)) {
            return null;
        }

        return 'data:image/png;base64,' . base64_encode(file_get_contents($path));
    }

    /**
     * Ekspor Excel, dipecah menjadi tiga lembar sesuai topiknya.
     *
     * Satu lembar berisi sembilan kolom membuat uraian dan foto berdesakan
     * dengan angka progres. Memisahkannya membuat tiap lembar bisa memakai
     * lebar kolom dan tinggi baris yang sesuai isinya.
     */
    public function exportExcel(OutagePlan $outagePlan)
    {
        $outagePlan->load('dailyProgresses');
        $summary = $this->summarize($outagePlan);

        $spreadsheet = new Spreadsheet();

        $this->sheetKurvaS($spreadsheet->getActiveSheet(), $outagePlan, $summary);
        $this->sheetUraian($spreadsheet->createSheet(), $outagePlan);
        $this->sheetFoto($spreadsheet->createSheet(), $outagePlan);

        $spreadsheet->setActiveSheetIndex(0);

        $writer = new Xlsx($spreadsheet);
        $filename = $this->exportFilename($outagePlan, 'xlsx');

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /** @return array{fillType: string, startColor: array{rgb: string}} */
    private function headerFill(): array
    {
        return [
            'fillType' => Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'F1F5F9'],
        ];
    }

    /** Menulis baris header tabel dan mengembalikan huruf kolom terakhirnya. */
    private function tulisHeader($sheet, array $headers, int $row): string
    {
        foreach ($headers as $i => $label) {
            $sheet->setCellValue(chr(65 + $i) . $row, $label);
        }

        $kolomAkhir = chr(65 + count($headers) - 1);

        $sheet->getStyle("A{$row}:{$kolomAkhir}{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:{$kolomAkhir}{$row}")->getFill()->applyFromArray($this->headerFill());
        $sheet->getStyle("A{$row}:{$kolomAkhir}{$row}")->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER);

        return $kolomAkhir;
    }

    private function beriGaris($sheet, string $range): void
    {
        $sheet->getStyle($range)->getBorders()->getAllBorders()
            ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
    }

    private function tgl($value): string
    {
        return $value ? \Carbon\Carbon::parse($value)->format('d-m-Y') : '-';
    }

    /** Lembar 1: identitas pekerjaan, grafik kurva S, lalu angkanya sebagai tabel. */
    private function sheetKurvaS($sheet, OutagePlan $outagePlan, array $summary): void
    {
        $sheet->setTitle('Kurva S');

        $sheet->setCellValue('A1', 'LAPORAN PERENCANAAN & REALISASI OUTAGE');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $sheet->setCellValue('A2', $outagePlan->mesin_pembangkit);
        $sheet->mergeCells('A2:F2');
        $sheet->getStyle('A2')->getFont()->setItalic(true)
            ->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('64748B'));

        $infoRows = [
            ['Mesin Pembangkit', $outagePlan->mesin_pembangkit ?? '-', 'Scope', $outagePlan->scope ?? '-'],
            ['Jenis Pembangkit', $outagePlan->jenis_pembangkit ?? '-', 'Status', $outagePlan->ket ?? 'OPEN'],
            ['Waktu Mulai', $this->tgl($outagePlan->start_date), 'Waktu Selesai', $this->tgl($outagePlan->selesai)],
            ['Real Start', $this->tgl($outagePlan->real_start), 'Real Stop', $this->tgl($outagePlan->real_stop)],
            ['Total Hari', $summary['totalHari'] ? $summary['totalHari'] . ' Hari' : '-', 'Progress Keseluruhan', 'Plan ' . number_format($summary['overallPlan'], 0) . '% / Actual ' . number_format($summary['overallActual'], 0) . '%'],
        ];

        $row = 4;
        foreach ($infoRows as $info) {
            $sheet->setCellValue("A{$row}", $info[0]);
            $sheet->setCellValue("B{$row}", $info[1]);
            $sheet->setCellValue("D{$row}", $info[2]);
            $sheet->setCellValue("E{$row}", $info[3]);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $sheet->getStyle("D{$row}")->getFont()->setBold(true);
            $row++;
        }

        $row++;
        $sheet->setCellValue("A{$row}", 'Kurva S - Plan vs Actual');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(11);
        $row++;

        $chartImage = SCurveChartRenderer::buildImage($outagePlan, 640, 260);
        if ($chartImage !== null) {
            $drawing = new MemoryDrawing();
            $drawing->setName('Kurva S');
            $drawing->setDescription('Kurva S - Plan vs Actual');
            $drawing->setImageResource($chartImage);
            $drawing->setRenderingFunction(MemoryDrawing::RENDERING_PNG);
            $drawing->setMimeType(MemoryDrawing::MIMETYPE_PNG);
            $drawing->setCoordinates("A{$row}");
            $drawing->setWorksheet($sheet);
            $row += 14; // kira-kira setinggi grafik saat dirender
        }

        $row++;
        $headerRow = $row;
        $kolomAkhir = $this->tulisHeader(
            $sheet,
            ['Day', 'Tanggal', 'Plan (%)', 'Actual (%)', 'Deviasi (%)', 'Status'],
            $headerRow,
        );

        $row = $headerRow + 1;
        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            // Hari yang belum diisi dibiarkan kosong, bukan ditulis 0.
            $plan = $dp->plan_progress === null ? null : (float) $dp->plan_progress;
            $actual = $dp->actual_progress === null ? null : (float) $dp->actual_progress;

            $sheet->setCellValue("A{$row}", 'Day ' . ($idx + 1));
            $sheet->setCellValue("B{$row}", $this->tgl($dp->tanggal));
            $sheet->setCellValue("C{$row}", $plan ?? '');
            $sheet->setCellValue("D{$row}", $actual ?? '');
            // Deviasi hanya bermakna bila kedua nilainya sudah terisi.
            $sheet->setCellValue("E{$row}", ($plan === null || $actual === null) ? '' : $actual - $plan);
            $sheet->setCellValue("F{$row}", $dp->status);
            $sheet->getStyle("A{$row}:F{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $row++;
        }

        $lastRow = $row - 1;
        if ($lastRow >= $headerRow) {
            $this->beriGaris($sheet, "A{$headerRow}:{$kolomAkhir}{$lastRow}");
        }

        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /** Lembar 2: material yang dipakai dan uraian pekerjaannya. */
    private function sheetUraian($sheet, OutagePlan $outagePlan): void
    {
        $sheet->setTitle('Uraian Pekerjaan');

        $sheet->setCellValue('A1', 'URAIAN PEKERJAAN & MATERIAL');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(13);
        $sheet->setCellValue('A2', $outagePlan->mesin_pembangkit);
        $sheet->getStyle('A2')->getFont()->setItalic(true);

        $headerRow = 4;
        $kolomAkhir = $this->tulisHeader(
            $sheet,
            ['Day', 'Tanggal', 'Part Number', 'Nama Material', 'Uraian Pekerjaan', 'Keterangan'],
            $headerRow,
        );

        $row = $headerRow + 1;
        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            $sheet->setCellValue("A{$row}", 'Day ' . ($idx + 1));
            $sheet->setCellValue("B{$row}", $this->tgl($dp->tanggal));
            $sheet->setCellValue("C{$row}", $dp->material_part_number ?: '-');
            $sheet->setCellValue("D{$row}", $dp->material_nama ?: '-');
            $sheet->setCellValue("E{$row}", $dp->uraian_pekerjaan ?: '-');
            $sheet->setCellValue("F{$row}", $dp->keterangan ?: '-');
            $sheet->getStyle("A{$row}:B{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
            // Uraian dan keterangan bisa panjang: dibungkus, bukan melebar.
            $sheet->getStyle("E{$row}:F{$row}")->getAlignment()->setWrapText(true);
            $sheet->getStyle("A{$row}:F{$row}")->getAlignment()
                ->setVertical(Alignment::VERTICAL_TOP);
            $row++;
        }

        $lastRow = $row - 1;
        if ($lastRow >= $headerRow) {
            $this->beriGaris($sheet, "A{$headerRow}:{$kolomAkhir}{$lastRow}");
        }

        foreach (['A', 'B', 'C', 'D'] as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Lebar tetap: autoSize pada teks panjang menghasilkan kolom raksasa.
        $sheet->getColumnDimension('E')->setWidth(52);
        $sheet->getColumnDimension('F')->setWidth(32);
    }

    /**
     * Lembar 3: dokumentasi foto.
     *
     * Hanya hari yang berfoto yang ditulis, supaya lembarnya tidak berisi
     * puluhan baris kosong setinggi foto.
     */
    private function sheetFoto($sheet, OutagePlan $outagePlan): void
    {
        $sheet->setTitle('Dokumentasi Foto');

        $sheet->setCellValue('A1', 'DOKUMENTASI FOTO');
        $sheet->mergeCells('A1:D1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(13);
        $sheet->setCellValue('A2', $outagePlan->mesin_pembangkit);
        $sheet->getStyle('A2')->getFont()->setItalic(true);

        $headerRow = 4;
        $kolomAkhir = $this->tulisHeader(
            $sheet,
            ['Day', 'Tanggal', 'Uraian Pekerjaan', 'Foto'],
            $headerRow,
        );

        $row = $headerRow + 1;
        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            $fotos = OutagePhotos::paths($dp->photos);

            if ($fotos === []) {
                continue;
            }

            $sheet->getRowDimension($row)->setRowHeight(110);
            $sheet->setCellValue("A{$row}", 'Day ' . ($idx + 1));
            $sheet->setCellValue("B{$row}", $this->tgl($dp->tanggal));
            $sheet->setCellValue("C{$row}", $dp->uraian_pekerjaan ?: '-');
            $sheet->getStyle("A{$row}:B{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("C{$row}")->getAlignment()->setWrapText(true)
                ->setVertical(Alignment::VERTICAL_TOP);

            foreach ($fotos as $i => $path) {
                $drawing = new Drawing();
                $drawing->setPath($path);
                $drawing->setHeight(100);
                // Digeser ke kanan supaya beberapa foto pada satu hari berjajar,
                // bukan bertumpuk di titik yang sama.
                $drawing->setOffsetX(6 + ($i * 140));
                $drawing->setOffsetY(4);
                $drawing->setCoordinates("D{$row}");
                $drawing->setWorksheet($sheet);
            }

            $row++;
        }

        $lastRow = $row - 1;

        if ($lastRow >= $headerRow + 1) {
            $this->beriGaris($sheet, "A{$headerRow}:{$kolomAkhir}{$lastRow}");
        } else {
            $sheet->setCellValue("A{$headerRow}", 'Belum ada dokumentasi foto yang diunggah.');
            $sheet->mergeCells("A{$headerRow}:D{$headerRow}");
            $sheet->getStyle("A{$headerRow}")->getFont()->setItalic(true)->setBold(false);
        }

        foreach (['A', 'B'] as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sheet->getColumnDimension('C')->setWidth(40);
        // Cukup lebar untuk MAKS_PER_HARI foto berjajar.
        $sheet->getColumnDimension('D')->setWidth(85);
    }

    /**
     * Membuang berkas foto yang tidak lagi dipakai sebuah baris harian.
     *
     * @param  array<int, string>  $photosBaru  daftar path yang akan disimpan
     */
    private function hapusFotoYatim(OutagePlan $outagePlan, string $tanggal, array $photosBaru): void
    {
        $lama = $outagePlan->dailyProgresses()
            ->where('tanggal', $tanggal)
            ->value('photos') ?? [];

        foreach (array_diff($lama, $photosBaru) as $path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
        }
    }

    private function exportFilename(OutagePlan $outagePlan, string $extension): string
    {
        $slug = \Illuminate\Support\Str::slug($outagePlan->mesin_pembangkit ?: 'outage-plan');

        return "Outage-{$slug}-{$outagePlan->id}.{$extension}";
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_pembangkit' => 'nullable|string|max:255',
            'scope' => 'nullable|string|max:100',
            'jenis_pembangkit' => 'nullable|string|max:50',
            'durasi' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'selesai' => 'nullable|date',
            'progress' => 'nullable|numeric',
            'rapat_r2' => 'nullable|string',
            'rapat_r3' => 'nullable|string',
            'rapat_p1' => 'nullable|string',
            'rapat_p2' => 'nullable|string',
            'rapat_p3' => 'nullable|string',
            // Hanya OPEN/CLOSE. Seluruh data yang ada memang sudah begitu, dan
            // membatasinya di sini mencegah variasi ejaan baru masuk lewat
            // request langsung — yang akan membuat filter Ket meleset.
            'ket' => ['nullable', Rule::in(OutagePlan::KET_OPTIONS)],
            'sistem' => 'nullable|string|max:100',
            'real_start' => 'nullable|date',
            'real_stop' => 'nullable|date',
            'ket_realisasi' => 'nullable|string|max:100',
        ]);

        OutagePlan::create($validated);

        return redirect()->back()->with('success', 'Data berhasil ditambahkan.');
    }

    public function update(Request $request, OutagePlan $outagePlan)
    {
        $validated = $request->validate([
            'mesin_pembangkit' => 'nullable|string|max:255',
            'scope' => 'nullable|string|max:100',
            'jenis_pembangkit' => 'nullable|string|max:50',
            'durasi' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'selesai' => 'nullable|date',
            'progress' => 'nullable|numeric',
            'rapat_r2' => 'nullable|string',
            'rapat_r3' => 'nullable|string',
            'rapat_p1' => 'nullable|string',
            'rapat_p2' => 'nullable|string',
            'rapat_p3' => 'nullable|string',
            // Hanya OPEN/CLOSE. Seluruh data yang ada memang sudah begitu, dan
            // membatasinya di sini mencegah variasi ejaan baru masuk lewat
            // request langsung — yang akan membuat filter Ket meleset.
            'ket' => ['nullable', Rule::in(OutagePlan::KET_OPTIONS)],
            'sistem' => 'nullable|string|max:100',
            'real_start' => 'nullable|date',
            'real_stop' => 'nullable|date',
            'ket_realisasi' => 'nullable|string|max:100',
            'daily_progress' => 'nullable|array',
            'daily_progress.*.tanggal' => 'required_with:daily_progress|date',
            'daily_progress.*.plan_progress' => 'nullable|numeric|min:0|max:100',
            'daily_progress.*.actual_progress' => 'nullable|numeric|min:0|max:100',
            'daily_progress.*.material_part_number' => 'nullable|string|max:100',
            'daily_progress.*.material_nama' => 'nullable|string|max:255',
            'daily_progress.*.uraian_pekerjaan' => 'nullable|string',
            'daily_progress.*.keterangan' => 'nullable|string|max:255',
            'daily_progress.*.new_photos.*' => 'nullable|image|max:5120',
            'daily_progress.*.retained_photos' => 'nullable|array',
            'daily_progress.*.retained_photos.*' => 'nullable|string',
        ]);

        $dailyProgress = $validated['daily_progress'] ?? null;
        unset($validated['daily_progress']);

        $outagePlan->update($validated);

        if ($dailyProgress !== null && count($dailyProgress) > 0) {
            $tanggalList = collect($dailyProgress)->pluck('tanggal')->all();
            $outagePlan->dailyProgresses()->whereNotIn('tanggal', $tanggalList)->delete();

            foreach ($dailyProgress as $index => $row) {
                // Determine photos for this row
                $photos = $row['retained_photos'] ?? [];

                if ($request->hasFile("daily_progress.{$index}.new_photos")) {
                    foreach ($request->file("daily_progress.{$index}.new_photos") as $file) {
                        if ($file->isValid()) {
                            $path = $file->store('outage-photos', 'public');
                            $photos[] = $path;
                        }
                    }
                }

                // Foto yang dilepas dari baris ini ikut dibuang dari disk.
                // Tanpa ini setiap penghapusan menyisakan berkas yatim yang
                // tidak lagi dirujuk siapa pun tapi terus memakan penyimpanan.
                $this->hapusFotoYatim($outagePlan, $row['tanggal'], $photos);

                $outagePlan->dailyProgresses()->updateOrCreate(
                    ['tanggal' => $row['tanggal']],
                    [
                        'plan_progress' => $row['plan_progress'] ?? null,
                        'actual_progress' => $row['actual_progress'] ?? null,
                        'material_part_number' => $row['material_part_number'] ?? null,
                        'material_nama' => $row['material_nama'] ?? null,
                        'uraian_pekerjaan' => $row['uraian_pekerjaan'] ?? null,
                        'keterangan' => $row['keterangan'] ?? null,
                        'photos' => array_values($photos),
                    ]
                );
            }

            // Progress is cumulative, so the highest recorded actual value is the
            // current overall progress. Keep it authoritative on the plan itself
            // so every listing/dashboard that reads `progress` stays in sync.
            $overallActual = $outagePlan->dailyProgresses()->max('actual_progress');
            if ($overallActual !== null) {
                $outagePlan->update(['progress' => $overallActual]);
            }
        }

        return redirect()->back()->with('success', 'Data berhasil diperbarui.');
    }

    /**
     * Hanya admin yang boleh membuang jadwal outage.
     *
     * Menyembunyikan tombolnya di layar tidak cukup — rutenya tetap bisa
     * dipanggil langsung. Pemeriksaannya harus di sini.
     */
    public function destroy(Request $request, OutagePlan $outagePlan)
    {
        abort_unless($request->user()?->canDeleteRecords(), 403);

        abort_unless(
            OutagePlan::visibleTo($request->user())->whereKey($outagePlan->id)->exists(),
            403,
        );

        $outagePlan->delete();

        return redirect()->back()->with('success', 'Data berhasil dihapus.');
    }
}
