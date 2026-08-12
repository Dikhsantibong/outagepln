<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Inertia\Inertia;
use App\Models\OutagePlan;
use App\Support\DailyRingkas;
use App\Support\LaporanHarianData;
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
     * Laporan Kegiatan Harian: lembar kegiatan + lembar dokumentasi (portrait).
     *
     * Laporannya per hari, bukan per outage plan — satu berkas untuk satu
     * tanggal, mengikuti formulir yang dipakai di lapangan.
     */
    public function laporanHarianPdf(Request $request, OutagePlan $outagePlan, string $tanggal)
    {
        [$hari, $hariKe] = $this->cariHari($request, $outagePlan, $tanggal);
        $data = new LaporanHarianData($outagePlan, $hari, $hariKe);

        // 1. Generate Laporan Harian (Portrait)
        $pdfHarian = Pdf::loadView('exports.laporan-harian', [
            'info' => $data->info(),
            'hari' => $data->hari(),
            'pekerjaan' => $data->pekerjaan(),
            'spareParts' => $data->spareParts(),
            'dokumentasi' => $data->dokumentasi(),
            'ttd' => $data->ttd(),
            'logoPln' => $this->logoDataUri(),
            'logoVendor' => null,
            'chartImage' => null,
        ])->setPaper('a4', 'portrait')->output();

        // 2. Generate Kurva S (Landscape)
        $pdfKurva = Pdf::loadView('exports.laporan-kurva-s', [
            'info' => $data->info(),
            'kontrak' => $data->kontrak(),
            'wbs' => $data->wbs(),
            'wbsTotal' => $data->wbsTotal(),
            'chartImage' => SCurveChartRenderer::renderDataUri($outagePlan),
            'logoPln' => $this->logoDataUri(),
            'logoVendor' => null,
        ])->setPaper('a4', 'landscape')->output();

        // 3. Merge them using FPDI
        $fpdi = new \setasign\Fpdi\Fpdi();

        // Add pages from Laporan Harian
        $pageCount1 = $fpdi->setSourceFile(\setasign\Fpdi\PdfParser\StreamReader::createByString($pdfHarian));
        for ($pageNo = 1; $pageNo <= $pageCount1; $pageNo++) {
            $templateId = $fpdi->importPage($pageNo);
            $size = $fpdi->getTemplateSize($templateId);
            $fpdi->AddPage($size['orientation'], $size);
            $fpdi->useTemplate($templateId);
        }

        // Add pages from Kurva S
        $pageCount2 = $fpdi->setSourceFile(\setasign\Fpdi\PdfParser\StreamReader::createByString($pdfKurva));
        for ($pageNo = 1; $pageNo <= $pageCount2; $pageNo++) {
            $templateId = $fpdi->importPage($pageNo);
            $size = $fpdi->getTemplateSize($templateId);
            $fpdi->AddPage($size['orientation'], $size);
            $fpdi->useTemplate($templateId);
        }

        $mergedPdf = $fpdi->Output('S');

        $filename = $this->laporanFilename($outagePlan, $hariKe, 'Laporan-Harian', 'pdf');

        return response($mergedPdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Laporan Kegiatan Harian dalam bentuk Excel.
     *
     * Isinya sama persis dengan versi PDF — dirakit dari LaporanHarianData yang
     * sama — hanya dipecah per lembar supaya angkanya bisa diolah lebih lanjut.
     */
    public function laporanHarianExcel(Request $request, OutagePlan $outagePlan, string $tanggal)
    {
        [$hari, $hariKe] = $this->cariHari($request, $outagePlan, $tanggal);
        $data = new LaporanHarianData($outagePlan, $hari, $hariKe);

        $spreadsheet = new Spreadsheet();

        $this->sheetLaporanHarian($spreadsheet->getActiveSheet(), $data);
        $this->sheetLaporanFoto($spreadsheet->createSheet(), $data, $hari);
        $this->sheetLaporanKurvaS($spreadsheet->createSheet(), $data, $outagePlan);

        $spreadsheet->setActiveSheetIndex(0);

        $writer = new Xlsx($spreadsheet);
        $filename = $this->laporanFilename($outagePlan, $hariKe, 'Laporan-Harian', 'xlsx');

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /** Kop laporan harian, dipakai bersama seluruh lembarnya. */
    private function kopLaporan($sheet, array $info, array $hari, string $judulLembar): int
    {
        $logoPath = public_path('sidebar-logo.png');
        if (is_file($logoPath)) {
            $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
            $drawing->setName('Logo');
            $drawing->setDescription('Logo');
            $drawing->setPath($logoPath);
            $drawing->setHeight(60);
            $drawing->setCoordinates('E1');
            $drawing->setOffsetX(20);
            $drawing->setOffsetY(5);
            $drawing->setWorksheet($sheet);
        }

        $sheet->setCellValue('A1', 'LAPORAN KEGIATAN HARIAN ' . $info['jenis_pekerjaan']);
        $sheet->mergeCells('A1:E1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(13);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A2', $info['mesin']);
        $sheet->mergeCells('A2:E2');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A3', $info['lokasi']);
        $sheet->mergeCells('A3:E3');
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A5', 'HARI KE');
        $sheet->setCellValue('B5', ': ' . $hari['ke']);
        $sheet->setCellValue('C5', 'PROGRESS HARI KE ' . $hari['ke']);
        $sheet->setCellValue('D5', ': ' . $hari['progress'] . ' %');

        $sheet->setCellValue('A6', 'TANGGAL');
        $sheet->setCellValue('B6', ': ' . $hari['tanggal']);
        $sheet->setCellValue('C6', 'LEMBAR');
        $sheet->setCellValue('D6', ': ' . $judulLembar);

        $sheet->getStyle('A5:A6')->getFont()->setBold(true);
        $sheet->getStyle('C5:C6')->getFont()->setBold(true);

        return 8;
    }

    /** Lembar 1: uraian pekerjaan berpoin, material, dan tanda tangan. */
    private function sheetLaporanHarian($sheet, LaporanHarianData $data): void
    {
        $sheet->setTitle('Laporan Harian');

        $row = $this->kopLaporan($sheet, $data->info(), $data->hari(), 'Kegiatan');

        // ── Uraian pekerjaan ────────────────────────────────────────────
        $sheet->setCellValue("A{$row}", 'URAIAN PEKERJAAN');
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        $headerRow = $row;
        $this->tulisHeader($sheet, ['NO.', 'URAIAN PEKERJAAN', 'PENANGGUNG JAWAB', 'PROGRESS (%)'], $headerRow);
        $row++;

        $adaPekerjaan = false;
        foreach ($data->pekerjaan() as $grup) {
            if ($grup['kategori'] !== '') {
                $sheet->setCellValue("B{$row}", $grup['kategori']);
                $sheet->getStyle("B{$row}")->getFont()->setBold(true);
                $row++;
            }

            foreach ($grup['items'] as $i => $item) {
                $adaPekerjaan = true;
                $sheet->setCellValue("A{$row}", $i + 1);
                $sheet->setCellValue("B{$row}", $item['uraian']);
                $sheet->setCellValue("C{$row}", $item['penanggung_jawab'] ?? '');
                // Ditulis sebagai angka, bukan teks, supaya bisa dihitung.
                $sheet->setCellValue("D{$row}", $item['progress'] ?? '');
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $row++;
            }
        }

        if (! $adaPekerjaan) {
            $sheet->setCellValue("B{$row}", 'Belum ada poin pekerjaan pada hari ini.');
            $sheet->getStyle("B{$row}")->getFont()->setItalic(true);
            $row++;
        }

        $this->beriGaris($sheet, "A{$headerRow}:D" . ($row - 1));
        $row += 2;

        // ── Spare part ──────────────────────────────────────────────────
        $sheet->setCellValue("A{$row}", 'SPARE PART YANG DIGANTI');
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        $headerRow = $row;
        $this->tulisHeader($sheet, ['NO.', 'NAMA SPARE PART', 'PART NUMBER', 'QTY', 'KETERANGAN'], $headerRow);
        $row++;

        $parts = $data->spareParts();

        if ($parts === []) {
            $sheet->setCellValue("B{$row}", 'Tidak ada penggantian spare part.');
            $sheet->getStyle("B{$row}")->getFont()->setItalic(true);
            $row++;
        } else {
            foreach ($parts as $i => $sp) {
                $sheet->setCellValue("A{$row}", $i + 1);
                $sheet->setCellValue("B{$row}", $sp['nama']);
                $sheet->setCellValue("C{$row}", $sp['part_number']);
                $sheet->setCellValue("D{$row}", $sp['qty'] ?? '');
                $sheet->setCellValue("E{$row}", $sp['keterangan'] ?? '');
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $row++;
            }
        }

        $this->beriGaris($sheet, "A{$headerRow}:E" . ($row - 1));
        $row += 2;

        // ── Tanda tangan ────────────────────────────────────────────────
        $ttd = $data->ttd();
        $sheet->setCellValue("A{$row}", 'Mengetahui,');
        $sheet->setCellValue("D{$row}", 'Dibuat Oleh,');
        $row++;
        $sheet->setCellValue("A{$row}", $ttd['pihak_pertama']);
        $sheet->setCellValue("D{$row}", $ttd['pihak_kedua']);
        $row += 4;

        // Empat penandatangan, kolomnya mengikuti urutan pada lembar cetak.
        // Jumlahnya dibaca dari data, bukan dipatok, supaya PDF dan Excel tidak
        // pernah menampilkan penandatangan yang berbeda.
        foreach (['A', 'B', 'C', 'D'] as $i => $kol) {
            $nama = $ttd['nama_' . ($i + 1)] ?? null;
            $jabatan = $ttd['jabatan_' . ($i + 1)] ?? null;

            if ($nama === null && $jabatan === null) {
                continue;
            }

            $sheet->setCellValue("{$kol}{$row}", $nama ?? '');
            $sheet->getStyle("{$kol}{$row}")->getFont()->setBold(true)->setUnderline(true);
            $sheet->setCellValue("{$kol}" . ($row + 1), $jabatan ?? '');
        }

        $sheet->getColumnDimension('A')->setWidth(8);
        $sheet->getColumnDimension('B')->setWidth(52);
        $sheet->getColumnDimension('C')->setWidth(24);
        $sheet->getColumnDimension('D')->setWidth(18);
        $sheet->getColumnDimension('E')->setWidth(28);
    }

    /** Lembar 2: dokumentasi foto hari itu. */
    private function sheetLaporanFoto($sheet, LaporanHarianData $data, $hari): void
    {
        $sheet->setTitle('Dokumentasi');

        $row = $this->kopLaporan($sheet, $data->info(), $data->hari(), 'Dokumentasi');

        $fotos = OutagePhotos::paths($hari->photos);

        if ($fotos === []) {
            $sheet->setCellValue("A{$row}", 'Belum ada dokumentasi foto untuk hari ini.');
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true);

            return;
        }

        $uraian = DailyRingkas::pekerjaan($hari);

        if ($uraian !== '') {
            $sheet->setCellValue("A{$row}", $uraian);
            $sheet->mergeCells("A{$row}:D{$row}");
            $sheet->getStyle("A{$row}")->getAlignment()->setWrapText(true)
                ->setVertical(Alignment::VERTICAL_TOP);
            $sheet->getRowDimension($row)->setRowHeight(60);
            $row += 2;
        }

        // Dua foto per baris, mengikuti tata letak lembar cetaknya.
        foreach (array_chunk($fotos, 2) as $pasangan) {
            $sheet->getRowDimension($row)->setRowHeight(150);

            foreach ($pasangan as $i => $path) {
                $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                $drawing->setName('Foto Dokumentasi');
                $drawing->setDescription('Foto Dokumentasi');
                $drawing->setPath($path);
                $drawing->setHeight(140);
                $drawing->setOffsetX(6);
                $drawing->setOffsetY(4);
                $drawing->setCoordinates(($i === 0 ? 'A' : 'C') . $row);
                $drawing->setWorksheet($sheet);
            }

            $row += 2;
        }

        foreach (['A', 'B', 'C', 'D'] as $col) {
            $sheet->getColumnDimension($col)->setWidth(30);
        }
    }

    /** Lembar 3: rincian bobot pekerjaan dan grafik kurva S. */
    private function sheetLaporanKurvaS($sheet, LaporanHarianData $data, OutagePlan $outagePlan): void
    {
        $sheet->setTitle('Kurva S');

        $row = $this->kopLaporan($sheet, $data->info(), $data->hari(), 'Kurva S');

        $kontrak = $data->kontrak();
        $info = $data->info();

        foreach ([
            ['MESIN', $info['tipe_mesin'], 'D/O NOMOR', $kontrak['do_nomor']],
            ['NO. SERI', $info['nomor_seri'], 'TANGGAL', $kontrak['do_tanggal']],
            ['UNIT', $info['unit'], 'NO. SURAT PENUNJUKAN', $kontrak['surat_nomor']],
            ['ULPLTD', $info['ulpltd'], 'TANGGAL', $kontrak['surat_tanggal']],
        ] as $baris) {
            $sheet->setCellValue("A{$row}", $baris[0]);
            $sheet->setCellValue("B{$row}", ': ' . $baris[1]);
            $sheet->setCellValue("C{$row}", $baris[2]);
            $sheet->setCellValue("D{$row}", ': ' . $baris[3]);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $sheet->getStyle("C{$row}")->getFont()->setBold(true);
            $row++;
        }

        $row++;

        // ── Rincian bobot (WBS) ─────────────────────────────────────────
        $headerRow = $row;
        $this->tulisHeader(
            $sheet,
            ['NO.', 'URAIAN PEKERJAAN', 'BOBOT (%)', 'PROGRESS (%)', 'BOBOT PROGRESS (%)'],
            $headerRow,
        );
        $row++;

        $wbs = $data->wbs();

        if ($wbs === []) {
            $sheet->setCellValue("B{$row}", 'Belum ada rincian bobot pekerjaan (WBS).');
            $sheet->getStyle("B{$row}")->getFont()->setItalic(true);
            $row++;
        } else {
            foreach ($wbs as $baris) {
                $sheet->setCellValue("A{$row}", $baris['no']);
                $sheet->setCellValue("B{$row}", $baris['uraian']);
                $sheet->setCellValue("C{$row}", $baris['bobot'] ?? '');
                $sheet->setCellValue("D{$row}", $baris['progress'] ?? '');
                $sheet->setCellValue("E{$row}", $baris['bobot_progress'] ?? '');
                $row++;
            }

            $total = $data->wbsTotal();
            $sheet->setCellValue("B{$row}", 'TOTAL');
            $sheet->setCellValue("C{$row}", $total['bobot']);
            $sheet->setCellValue("E{$row}", $total['bobot_progress']);
            $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
            $row++;
        }

        $this->beriGaris($sheet, "A{$headerRow}:E" . ($row - 1));
        $row += 2;

        // ── Grafik ──────────────────────────────────────────────────────
        $sheet->setCellValue("A{$row}", 'KURVA S - PLAN VS ACTUAL');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        $chart = SCurveChartRenderer::buildImage($outagePlan, 900, 360);

        if ($chart !== null) {
            $drawing = new MemoryDrawing();
            $drawing->setName('Kurva S');
            $drawing->setImageResource($chart);
            $drawing->setRenderingFunction(MemoryDrawing::RENDERING_PNG);
            $drawing->setMimeType(MemoryDrawing::MIMETYPE_PNG);
            $drawing->setCoordinates("A{$row}");
            $drawing->setWorksheet($sheet);
        }

        $sheet->getColumnDimension('A')->setWidth(10);
        $sheet->getColumnDimension('B')->setWidth(48);
        foreach (['C', 'D', 'E'] as $col) {
            $sheet->getColumnDimension($col)->setWidth(18);
        }
    }

    /**
     * Baris harian pada tanggal tertentu, beserta nomor harinya.
     *
     * @return array{0: \App\Models\OutagePlanProgress, 1: int}
     */
    private function cariHari(Request $request, OutagePlan $outagePlan, string $tanggal): array
    {
        abort_unless(
            OutagePlan::visibleTo($request->user())->whereKey($outagePlan->id)->exists(),
            403,
        );

        $outagePlan->load('dailyProgresses');

        $index = $outagePlan->dailyProgresses
            ->search(fn ($dp) => $dp->tanggal->toDateString() === $tanggal);

        abort_if($index === false, 404, 'Tidak ada progress harian pada tanggal tersebut.');

        return [$outagePlan->dailyProgresses[$index], $index + 1];
    }

    private function laporanFilename(OutagePlan $outagePlan, int $hariKe, string $jenis, string $ext): string
    {
        $slug = \Illuminate\Support\Str::slug($outagePlan->mesin_pembangkit ?: 'outage');

        return "{$jenis}-{$slug}-hari-{$hariKe}.{$ext}";
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
            ['Day', 'Tanggal', 'Uraian Pekerjaan', 'Material Digunakan', 'Keterangan'],
            $headerRow,
        );

        $row = $headerRow + 1;
        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            $sheet->setCellValue("A{$row}", 'Day ' . ($idx + 1));
            $sheet->setCellValue("B{$row}", $this->tgl($dp->tanggal));
            $sheet->setCellValue("C{$row}", DailyRingkas::pekerjaan($dp) ?: '-');
            $sheet->setCellValue("D{$row}", DailyRingkas::material($dp) ?: '-');
            $sheet->setCellValue("E{$row}", $dp->keterangan ?: '-');
            $sheet->getStyle("A{$row}:B{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
            // Daftar berpoin dan keterangan bisa panjang: dibungkus, bukan melebar.
            $sheet->getStyle("C{$row}:E{$row}")->getAlignment()->setWrapText(true);
            $sheet->getStyle("A{$row}:E{$row}")->getAlignment()
                ->setVertical(Alignment::VERTICAL_TOP);
            $row++;
        }

        $lastRow = $row - 1;
        if ($lastRow >= $headerRow) {
            $this->beriGaris($sheet, "A{$headerRow}:{$kolomAkhir}{$lastRow}");
        }

        foreach (['A', 'B'] as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Lebar tetap: autoSize pada teks panjang menghasilkan kolom raksasa.
        $sheet->getColumnDimension('C')->setWidth(52);
        $sheet->getColumnDimension('D')->setWidth(40);
        $sheet->getColumnDimension('E')->setWidth(30);
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
            $sheet->setCellValue("C{$row}", DailyRingkas::pekerjaan($dp) ?: '-');
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
     * Membuang baris daftar yang tidak berisi apa pun.
     *
     * Sebuah baris dianggap kosong bila seluruh kolom penentunya kosong —
     * progres saja tanpa uraian bukan data yang berguna.
     *
     * @param  array<int, array<string, mixed>>  $daftar
     * @param  array<int, string>  $kolomPenentu
     * @return array<int, array<string, mixed>>|null
     */
    private function bersihkanDaftar($daftar, array $kolomPenentu): ?array
    {
        if (! is_array($daftar)) {
            return null;
        }

        $bersih = array_values(array_filter(
            $daftar,
            function ($baris) use ($kolomPenentu) {
                foreach ($kolomPenentu as $kolom) {
                    if (filled($baris[$kolom] ?? null)) {
                        return true;
                    }
                }

                return false;
            },
        ));

        return $bersih === [] ? null : $bersih;
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
            // Poin pekerjaan: tiap poin punya progresnya sendiri.
            'daily_progress.*.work_items' => 'nullable|array',
            'daily_progress.*.work_items.*.uraian' => 'nullable|string|max:500',
            'daily_progress.*.work_items.*.progress' => 'nullable|numeric|min:0|max:100',
            // Material yang dipakai, beserta jumlahnya.
            'daily_progress.*.spare_parts' => 'nullable|array',
            'daily_progress.*.spare_parts.*.nama' => 'nullable|string|max:255',
            'daily_progress.*.spare_parts.*.part_number' => 'nullable|string|max:100',
            'daily_progress.*.spare_parts.*.qty' => 'nullable|string|max:50',
            'daily_progress.*.spare_parts.*.keterangan' => 'nullable|string|max:255',
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
                        // Baris yang seluruh kolomnya kosong dibuang, supaya
                        // menambah poin lalu membatalkannya tidak meninggalkan
                        // baris hampa di laporan.
                        'work_items' => $this->bersihkanDaftar(
                            $row['work_items'] ?? [],
                            ['uraian'],
                        ),
                        'spare_parts' => $this->bersihkanDaftar(
                            $row['spare_parts'] ?? [],
                            ['nama', 'part_number', 'qty'],
                        ),
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
