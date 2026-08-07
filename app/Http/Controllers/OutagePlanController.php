<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Inertia\Inertia;
use App\Models\OutagePlan;
use App\Support\SCurveChartRenderer;
use App\Support\TahunFilter;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
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

    public function exportExcel(OutagePlan $outagePlan)
    {
        $outagePlan->load('dailyProgresses');
        $summary = $this->summarize($outagePlan);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Progress Harian');

        $headerFill = [
            'fillType' => Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'F1F5F9'],
        ];

        $sheet->setCellValue('A1', 'LAPORAN PERENCANAAN & REALISASI OUTAGE');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $sheet->setCellValue('A2', $outagePlan->mesin_pembangkit);
        $sheet->mergeCells('A2:F2');
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('64748B'));

        $infoRows = [
            ['Mesin Pembangkit', $outagePlan->mesin_pembangkit ?? '-', 'Scope', $outagePlan->scope ?? '-'],
            ['Jenis Pembangkit', $outagePlan->jenis_pembangkit ?? '-', 'Status', $outagePlan->ket ?? 'OPEN'],
            ['Waktu Mulai', $outagePlan->start_date ? \Carbon\Carbon::parse($outagePlan->start_date)->format('d-m-Y') : '-', 'Waktu Selesai', $outagePlan->selesai ? \Carbon\Carbon::parse($outagePlan->selesai)->format('d-m-Y') : '-'],
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
            $row += 14; // reserve roughly the chart's rendered height in rows
        }

        $row++;
        $headerRow = $row;
        $headers = ['Day', 'Tanggal', 'Plan (%)', 'Actual (%)', 'Status', 'Keterangan'];
        foreach ($headers as $i => $label) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}{$headerRow}", $label);
        }
        $sheet->getStyle("A{$headerRow}:F{$headerRow}")->getFont()->setBold(true);
        $sheet->getStyle("A{$headerRow}:F{$headerRow}")->getFill()->applyFromArray($headerFill);
        $sheet->getStyle("A{$headerRow}:F{$headerRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $row = $headerRow + 1;
        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            $sheet->setCellValue("A{$row}", 'Day ' . ($idx + 1));
            $sheet->setCellValue("B{$row}", \Carbon\Carbon::parse($dp->tanggal)->format('d-m-Y'));
            // Hari yang belum diisi dibiarkan kosong, bukan ditulis 0.
            $sheet->setCellValue("C{$row}", $dp->plan_progress === null ? '' : (float) $dp->plan_progress);
            $sheet->setCellValue("D{$row}", $dp->actual_progress === null ? '' : (float) $dp->actual_progress);
            $sheet->setCellValue("E{$row}", $dp->status);
            $sheet->setCellValue("F{$row}", $dp->keterangan ?: '-');
            $sheet->getStyle("A{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $row++;
        }

        $lastRow = $row - 1;
        if ($lastRow >= $headerRow) {
            $sheet->getStyle("A{$headerRow}:F{$lastRow}")
                ->getBorders()->getAllBorders()
                ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        }

        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = $this->exportFilename($outagePlan, 'xlsx');

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
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
            'ket' => 'nullable|string|max:50',
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
            'ket' => 'nullable|string|max:50',
            'sistem' => 'nullable|string|max:100',
            'real_start' => 'nullable|date',
            'real_stop' => 'nullable|date',
            'ket_realisasi' => 'nullable|string|max:100',
            'daily_progress' => 'nullable|array',
            'daily_progress.*.tanggal' => 'required_with:daily_progress|date',
            'daily_progress.*.plan_progress' => 'nullable|numeric|min:0|max:100',
            'daily_progress.*.actual_progress' => 'nullable|numeric|min:0|max:100',
            'daily_progress.*.keterangan' => 'nullable|string|max:255',
        ]);

        $dailyProgress = $validated['daily_progress'] ?? null;
        unset($validated['daily_progress']);

        $outagePlan->update($validated);

        if ($dailyProgress !== null && count($dailyProgress) > 0) {
            $tanggalList = collect($dailyProgress)->pluck('tanggal')->all();
            $outagePlan->dailyProgresses()->whereNotIn('tanggal', $tanggalList)->delete();

            foreach ($dailyProgress as $row) {
                $outagePlan->dailyProgresses()->updateOrCreate(
                    ['tanggal' => $row['tanggal']],
                    [
                        // Blank stays NULL ("belum diisi"). Coercing it to 0 made
                        // the row look like a drop from the previous day, and the
                        // cumulative-progress rule then blocked every later save.
                        'plan_progress' => $row['plan_progress'] ?? null,
                        'actual_progress' => $row['actual_progress'] ?? null,
                        'keterangan' => $row['keterangan'] ?? null,
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

    public function destroy(OutagePlan $outagePlan)
    {
        $outagePlan->delete();
        return redirect()->back()->with('success', 'Data berhasil dihapus.');
    }
}
