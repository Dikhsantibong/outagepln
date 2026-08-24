<?php

namespace App\Http\Controllers;

use App\Models\OutagePlan;
use App\Models\OutagePlanProgress;
use App\Models\Unit;
use App\Support\DailyRingkas;
use App\Support\JadwalRapatOutage;
use App\Support\LaporanHarianData;
use App\Support\OutagePhotos;
use App\Support\SCurveChartRenderer;
use App\Support\TahunFilter;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;

class OutagePlanController extends Controller
{
    /** Filter keys accepted by the listing, in the order they appear in the UI. */
    private const FILTER_KEYS = [
        'search', 'tahun', 'scope', 'jenis', 'sistem', 'ket',
        'ket_realisasi', 'progres', 'dari', 'sampai',
    ];

    /** @var array<int, string> Berkas PNG grafik sementara yang perlu dihapus setelah workbook ditulis. */
    private array $chartTempFiles = [];

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
        $units = Unit::with('mesins')->get();

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
        $outagePlan->load(['dailyProgresses', 'revisions.user:id,name']);
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

        $outagePlan->load(['dailyProgresses', 'revisions.user:id,name']);

        return Inertia::render('outage-plans/edit', [
            'outagePlan' => $outagePlan,
            'units' => Unit::with('mesins')->get(),
            // Rumus yang sama dengan halaman Rapat Outage, supaya tanggal rapat
            // yang tergenerate di kedua layar selalu identik.
            'offsetRapat' => JadwalRapatOutage::OFFSET_HARI,
            'maksRevisi' => OutagePlan::MAKS_REVISI,
            'bolehUbahJadwal' => (bool) $request->user()?->canEditJadwalRapat(),
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
     * Hitung tinggi dinamis untuk grafik Kurva S agar proporsional dengan tabel WBS.
     */
    private function getDynamicChartHeight(array $wbs): int
    {
        $targetHeight = 1600 * ((20 + count($wbs) * 12) / 455);

        return (int) max(880, min(1600, $targetHeight));
    }

    /**
     * Compute the total duration and overall plan/actual progress shared by
     * the detail page and the PDF/Excel exports.
     */
    private function summarize(OutagePlan $outagePlan): array
    {
        $totalHari = null;
        if ($outagePlan->start_date && $outagePlan->selesai) {
            $totalHari = Carbon::parse($outagePlan->start_date)
                ->diffInDays(Carbon::parse($outagePlan->selesai)) + 1;
        }

        // Cari hari terakhir di mana progress aktual sudah diisi
        $lastRecorded = $outagePlan->dailyProgresses->last(function ($dp) {
            return $dp->actual_progress !== null;
        });

        if ($lastRecorded) {
            $overallPlan = $lastRecorded->plan_progress;
            $overallActual = $lastRecorded->actual_progress;
        } else {
            $overallPlan = 0;
            $overallActual = 0;
        }

        return [
            'totalHari' => $totalHari,
            'overallPlan' => $overallPlan ?? $outagePlan->progress ?? 0,
            'overallActual' => $overallActual ?? $outagePlan->progress ?? 0,
        ];
    }

    public function exportPdf(OutagePlan $outagePlan)
    {
        if (function_exists('set_time_limit')) {
            @set_time_limit(120);
        }
        $outagePlan->load('dailyProgresses');
        $summary = $this->summarize($outagePlan);

        // Data dummy LaporanHarianData untuk mengambil Kop, WBS, dsb.
        $lastDp = $outagePlan->dailyProgresses->last() ?? new OutagePlanProgress;
        $data = new LaporanHarianData($outagePlan, $lastDp, $outagePlan->dailyProgresses->count());
        $wbs = $data->wbs();
        $chartHeight = $this->getDynamicChartHeight($wbs);

        $pdfPortrait = Pdf::loadView('exports.outage-plan', [
            'outagePlan' => $outagePlan,
            'info' => $data->info(),
            'logoPln' => $this->logoDataUri(),
            'logoVendor' => null,
            ...$summary,
        ])->setPaper('a4', 'portrait')->output();

        $pdfLandscape = Pdf::loadView('exports.laporan-kurva-s', [
            'info' => $data->info(),
            'kontrak' => $data->kontrak(),
            'wbs' => $wbs,
            'wbsTotal' => $data->wbsTotal(),
            'chartImage' => SCurveChartRenderer::renderDataUri($outagePlan, 1600, $chartHeight),
            'logoPln' => $this->logoDataUri(),
            'logoVendor' => null,
        ])->setPaper('a4', 'landscape')->output();

        $fpdi = new Fpdi;

        $pageCount1 = $fpdi->setSourceFile(StreamReader::createByString($pdfPortrait));
        for ($pageNo = 1; $pageNo <= $pageCount1; $pageNo++) {
            $templateId = $fpdi->importPage($pageNo);
            $size = $fpdi->getTemplateSize($templateId);
            $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $fpdi->useTemplate($templateId);
        }

        $pageCount2 = $fpdi->setSourceFile(StreamReader::createByString($pdfLandscape));
        for ($pageNo = 1; $pageNo <= $pageCount2; $pageNo++) {
            $templateId = $fpdi->importPage($pageNo);
            $size = $fpdi->getTemplateSize($templateId);
            $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $fpdi->useTemplate($templateId);
        }

        $mergedPdf = $fpdi->Output('S');
        $filename = $this->exportFilename($outagePlan, 'pdf');

        return response($mergedPdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    private function logoDataUri(): ?string
    {
        $path = public_path('sidebar-logo.png');

        if (! is_file($path)) {
            return null;
        }

        return 'data:image/png;base64,'.base64_encode(file_get_contents($path));
    }

    /**
     * Laporan Kegiatan Harian: lembar kegiatan + lembar dokumentasi (portrait).
     *
     * Laporannya per hari, bukan per outage plan — satu berkas untuk satu
     * tanggal, mengikuti formulir yang dipakai di lapangan.
     */
    public function laporanHarianPdf(Request $request, OutagePlan $outagePlan, string $tanggal)
    {
        if (function_exists('set_time_limit')) {
            @set_time_limit(120);
        }
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
        $wbs = $data->wbs();
        $chartHeight = $this->getDynamicChartHeight($wbs);

        $pdfKurva = Pdf::loadView('exports.laporan-kurva-s', [
            'info' => $data->info(),
            'kontrak' => $data->kontrak(),
            'wbs' => $wbs,
            'wbsTotal' => $data->wbsTotal(),
            'chartImage' => SCurveChartRenderer::renderDataUri($outagePlan, 1600, $chartHeight),
            'logoPln' => $this->logoDataUri(),
            'logoVendor' => null,
        ])->setPaper('a4', 'landscape')->output();

        // 3. Merge them using FPDI
        $fpdi = new Fpdi;

        // Add pages from Laporan Harian
        $pageCount1 = $fpdi->setSourceFile(StreamReader::createByString($pdfHarian));
        for ($pageNo = 1; $pageNo <= $pageCount1; $pageNo++) {
            $templateId = $fpdi->importPage($pageNo);
            $size = $fpdi->getTemplateSize($templateId);
            $fpdi->AddPage($size['orientation'], $size);
            $fpdi->useTemplate($templateId);
        }

        // Add pages from Kurva S
        $pageCount2 = $fpdi->setSourceFile(StreamReader::createByString($pdfKurva));
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
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
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

        $spreadsheet = new Spreadsheet;

        $this->sheetLaporanHarian($spreadsheet->getActiveSheet(), $data);
        $this->sheetLaporanFoto($spreadsheet->createSheet(), $data, $hari);
        $this->sheetLaporanKurvaS($spreadsheet->createSheet(), $data, $outagePlan);

        $spreadsheet->setActiveSheetIndex(0);

        $writer = new Xlsx($spreadsheet);
        $filename = $this->laporanFilename($outagePlan, $hariKe, 'Laporan-Harian', 'xlsx');

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
            $this->cleanupChartTempFiles();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /** Kop laporan harian, dipakai bersama seluruh lembarnya. */
    private function kopLaporan($sheet, array $info, array $hari, string $judulLembar): int
    {
        $logoPath = public_path('sidebar-logo.png');
        if (is_file($logoPath)) {
            $drawing = new Drawing;
            $drawing->setName('Logo');
            $drawing->setDescription('Logo');
            $drawing->setPath($logoPath);
            $drawing->setHeight(60);
            $drawing->setCoordinates('E1');
            $drawing->setOffsetX(20);
            $drawing->setOffsetY(5);
            $drawing->setWorksheet($sheet);
        }

        $sheet->setCellValue('A1', 'LAPORAN KEGIATAN HARIAN '.$info['jenis_pekerjaan']);
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
        $sheet->setCellValue('B5', ': '.$hari['ke']);
        $sheet->setCellValue('C5', 'PROGRESS HARI KE '.$hari['ke']);
        $sheet->setCellValue('D5', ': '.$hari['progress'].' %');

        $sheet->setCellValue('A6', 'TANGGAL');
        $sheet->setCellValue('B6', ': '.$hari['tanggal']);
        $sheet->setCellValue('C6', 'LEMBAR');
        $sheet->setCellValue('D6', ': '.$judulLembar);

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

        $this->beriGaris($sheet, "A{$headerRow}:D".($row - 1));
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

        $this->beriGaris($sheet, "A{$headerRow}:E".($row - 1));
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
            $nama = $ttd['nama_'.($i + 1)] ?? null;
            $jabatan = $ttd['jabatan_'.($i + 1)] ?? null;

            if ($nama === null && $jabatan === null) {
                continue;
            }

            $sheet->setCellValue("{$kol}{$row}", $nama ?? '');
            $sheet->getStyle("{$kol}{$row}")->getFont()->setBold(true)->setUnderline(true);
            $sheet->setCellValue("{$kol}".($row + 1), $jabatan ?? '');
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
                $drawing = new Drawing;
                $drawing->setName('Foto Dokumentasi');
                $drawing->setDescription('Foto Dokumentasi');
                $drawing->setPath($path);
                $drawing->setHeight(140);
                $drawing->setOffsetX(6);
                $drawing->setOffsetY(4);
                $drawing->setCoordinates(($i === 0 ? 'A' : 'C').$row);
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
            $sheet->setCellValue("B{$row}", ': '.$baris[1]);
            $sheet->setCellValue("C{$row}", $baris[2]);
            $sheet->setCellValue("D{$row}", ': '.$baris[3]);
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

        $this->beriGaris($sheet, "A{$headerRow}:E".($row - 1));
        $row += 2;

        // ── Grafik ──────────────────────────────────────────────────────
        $sheet->setCellValue("A{$row}", 'KURVA S - PLAN VS ACTUAL');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        // Generate chart with dynamic height
        $wbs = $data->wbs();
        $chartHeight = $this->getDynamicChartHeight($wbs);
        $chart = $this->chartDrawing($outagePlan, 1600, $chartHeight);

        if ($chart !== null) {
            $chart->setCoordinates("A{$row}");
            // Scale it down for Excel display proportionally
            $displayHeight = (int) ($chartHeight / 2.2);
            $chart->setHeight($displayHeight);
            $chart->setWorksheet($sheet);

            // Calculate how many rows the chart takes up (approx 20px per row)
            $rowsTaken = (int) ceil($displayHeight / 20) + 2;
            $row += $rowsTaken;
        }

        // ── Data Kurva S sebagai tabel ──────────────────────────────────
        // Grafik hanyalah gambar; angkanya tetap ditulis di sini agar seluruh
        // data ada di dalam sheet dan bisa diolah kembali, sekaligus menjadi
        // cadangan bila gambar tidak dirender oleh pembaca tertentu.
        $this->tabelKurvaS($sheet, $outagePlan, $row);

        $sheet->getColumnDimension('A')->setWidth(10);
        $sheet->getColumnDimension('B')->setWidth(48);
        foreach (['C', 'D', 'E'] as $col) {
            $sheet->getColumnDimension($col)->setWidth(18);
        }
    }

    /** Tabel angka Plan vs Actual harian, sumber data grafik Kurva S. */
    private function tabelKurvaS($sheet, OutagePlan $outagePlan, int $row): void
    {
        $sheet->setCellValue("A{$row}", 'DATA KURVA S');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        $headerRow = $row;
        $kolomAkhir = $this->tulisHeader(
            $sheet,
            ['Hari', 'Tanggal', 'Plan (%)', 'Actual (%)', 'Deviasi (%)'],
            $headerRow,
        );
        $row++;

        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            // Hari yang belum diisi dibiarkan kosong, bukan ditulis 0.
            $plan = $dp->plan_progress === null ? null : (float) $dp->plan_progress;
            $actual = $dp->actual_progress === null ? null : (float) $dp->actual_progress;

            $sheet->setCellValue("A{$row}", 'Hari '.($idx + 1));
            $sheet->setCellValue("B{$row}", $this->tgl($dp->tanggal));
            $sheet->setCellValue("C{$row}", $plan ?? '');
            $sheet->setCellValue("D{$row}", $actual ?? '');
            // Deviasi hanya bermakna bila kedua nilainya sudah terisi.
            $sheet->setCellValue("E{$row}", ($plan === null || $actual === null) ? '' : $actual - $plan);
            $sheet->getStyle("A{$row}:E{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $row++;
        }

        $this->beriGaris($sheet, "A{$headerRow}:{$kolomAkhir}".($row - 1));
    }

    /**
     * Baris harian pada tanggal tertentu, beserta nomor harinya.
     *
     * @return array{0: OutagePlanProgress, 1: int}
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
        $slug = Str::slug($outagePlan->mesin_pembangkit ?: 'outage');

        return "{$jenis}-{$slug}-hari-{$hariKe}.{$ext}";
    }

    /**
     * Ekspor Excel dalam satu lembar gabungan.
     *
     * Bagiannya ditumpuk ke bawah dengan urutan yang sama seperti versi PDF —
     * identitas, uraian pekerjaan, material, dokumentasi, lalu kurva S di akhir —
     * sehingga seluruh rekap ada dalam satu tab yang tinggal digulir.
     */
    public function exportExcel(OutagePlan $outagePlan)
    {
        $outagePlan->load('dailyProgresses');
        $summary = $this->summarize($outagePlan);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Rekap Outage');

        // Semua bagian ditumpuk dalam satu lembar, berurutan seperti versi PDF:
        // identitas → uraian → material → dokumentasi → kurva S.
        $row = $this->rekapKop($sheet, $outagePlan, $summary);
        $row = $this->rekapUraian($sheet, $outagePlan, $row);
        $row = $this->rekapMaterial($sheet, $outagePlan, $row);
        $row = $this->rekapDokumentasi($sheet, $outagePlan, $row);
        $this->rekapKurvaS($sheet, $outagePlan, $row);

        $this->aturKolomRekap($sheet);

        $writer = new Xlsx($spreadsheet);
        $filename = $this->exportFilename($outagePlan, 'xlsx');

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
            $this->cleanupChartTempFiles();
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
            $sheet->setCellValue(chr(65 + $i).$row, $label);
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
            ->setBorderStyle(Border::BORDER_THIN);
    }

    /**
     * Menyiapkan grafik Kurva S sebagai Drawing berbasis berkas.
     *
     * Sebelumnya grafik dipasang lewat MemoryDrawing langsung dari resource GD.
     * Medianya memang ikut tertanam di berkas, tetapi sejumlah versi Microsoft
     * Excel tidak menampilkan gambar MemoryDrawing sama sekali — itulah sebabnya
     * logo dan foto (yang memakai Drawing berkas) tampil, sedangkan kurva S tidak.
     * Dengan menulis PNG ke berkas sementara lalu memuatnya sebagai Drawing biasa,
     * gambarnya tampil di semua pembaca. Berkasnya dihapus lewat
     * cleanupChartTempFiles() setelah workbook selesai ditulis.
     */
    private function chartDrawing(OutagePlan $outagePlan, int $width, int $height): ?Drawing
    {
        $image = SCurveChartRenderer::buildImage($outagePlan, $width, $height);

        if ($image === null) {
            return null;
        }

        // tempnam menjamin nama unik; ekstensinya diganti ke .png agar part
        // media di dalam xlsx dikenali sebagai gambar oleh semua pembaca —
        // di Windows tempnam menghasilkan berkas .tmp yang tidak semua Excel
        // perlakukan sebagai gambar.
        $base = tempnam(sys_get_temp_dir(), 'kurva-s');
        $path = $base.'.png';
        @rename($base, $path);
        imagepng($image, $path);
        imagedestroy($image);
        $this->chartTempFiles[] = $path;

        $drawing = new Drawing;
        $drawing->setName('Kurva S');
        $drawing->setDescription('Kurva S - Plan vs Actual');
        $drawing->setPath($path);

        return $drawing;
    }

    /** Menghapus berkas PNG grafik sementara; dipanggil setelah workbook ditulis. */
    private function cleanupChartTempFiles(): void
    {
        foreach ($this->chartTempFiles as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }

        $this->chartTempFiles = [];
    }

    private function tgl($value): string
    {
        return $value ? Carbon::parse($value)->format('d-m-Y') : '-';
    }

    /** Judul satu bagian rekap, dilatarbelakangi abu-abu selebar A:F. */
    private function judulBagian($sheet, string $judul, int $row): int
    {
        $sheet->setCellValue("A{$row}", $judul);
        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle("A{$row}")->getFill()->applyFromArray([
            'fillType' => Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'E2E8F0'],
        ]);

        return $row + 1;
    }

    /** Kop rekap: judul, nama mesin, lalu tabel identitas. Mengembalikan baris berikutnya. */
    private function rekapKop($sheet, OutagePlan $outagePlan, array $summary): int
    {
        $sheet->setCellValue('A1', 'LAPORAN PERENCANAAN & REALISASI OUTAGE');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A2', $outagePlan->mesin_pembangkit);
        $sheet->mergeCells('A2:F2');
        $sheet->getStyle('A2')->getFont()->setItalic(true)
            ->setColor(new Color('64748B'));
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $infoRows = [
            ['Mesin Pembangkit', $outagePlan->mesin_pembangkit ?? '-', 'Scope', $outagePlan->scope ?? '-'],
            ['Jenis Pembangkit', $outagePlan->jenis_pembangkit ?? '-', 'Status', $outagePlan->ket ?? 'OPEN'],
            ['Waktu Mulai', $this->tgl($outagePlan->start_date), 'Waktu Selesai', $this->tgl($outagePlan->selesai)],
            ['Real Start', $this->tgl($outagePlan->real_start), 'Real Stop', $this->tgl($outagePlan->real_stop)],
            ['Total Hari', $summary['totalHari'] ? $summary['totalHari'].' Hari' : '-', 'Progress Keseluruhan', 'Plan '.number_format($summary['overallPlan'], 0).'% / Actual '.number_format($summary['overallActual'], 0).'%'],
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

        return $row + 1;
    }

    /** Bagian uraian pekerjaan harian. Mengembalikan baris kosong berikutnya. */
    private function rekapUraian($sheet, OutagePlan $outagePlan, int $row): int
    {
        $row = $this->judulBagian($sheet, 'URAIAN PEKERJAAN', $row);

        $headerRow = $row;
        $kolomAkhir = $this->tulisHeader(
            $sheet,
            ['Day', 'Tanggal', 'Uraian Pekerjaan', 'Progres (%)', 'Keterangan'],
            $headerRow,
        );
        $row++;

        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            $items = collect($dp->work_items ?? [])
                ->filter(fn ($w) => filled($w['uraian'] ?? null))
                ->values();

            if ($items->isEmpty()) {
                // Hari tanpa work items: satu baris biasa
                $sheet->setCellValue("A{$row}", 'Day '.($idx + 1));
                $sheet->setCellValue("B{$row}", $this->tgl($dp->tanggal));
                $sheet->setCellValue("C{$row}", $dp->uraian_pekerjaan ?: '-');
                $sheet->setCellValue("D{$row}", '-');
                $sheet->setCellValue("E{$row}", $dp->keterangan ?: '-');
                $sheet->getStyle("A{$row}:B{$row}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$row}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("C{$row}:E{$row}")->getAlignment()->setWrapText(true);
                $sheet->getStyle("A{$row}:E{$row}")->getAlignment()
                    ->setVertical(Alignment::VERTICAL_TOP);
                $row++;
            } else {
                // Hari dengan work items: satu baris per item, merge Day/Tanggal/Keterangan
                $startRow = $row;
                $count = $items->count();

                foreach ($items as $itemIdx => $w) {
                    $sheet->setCellValue("C{$row}", ($itemIdx + 1).'. '.$w['uraian']);
                    $progress = $w['progress'] ?? null;
                    $sheet->setCellValue("D{$row}", filled($progress) ? number_format((float) $progress, 2, ',', '.').'%' : '-');
                    $sheet->getStyle("D{$row}")->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("C{$row}:E{$row}")->getAlignment()->setWrapText(true);
                    $sheet->getStyle("A{$row}:E{$row}")->getAlignment()
                        ->setVertical(Alignment::VERTICAL_TOP);
                    $row++;
                }

                $endRow = $row - 1;
                $sheet->setCellValue("A{$startRow}", 'Day '.($idx + 1));
                $sheet->setCellValue("B{$startRow}", $this->tgl($dp->tanggal));
                $sheet->setCellValue("E{$startRow}", $dp->keterangan ?: '-');
                $sheet->getStyle("A{$startRow}:B{$startRow}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);

                if ($count > 1) {
                    $sheet->mergeCells("A{$startRow}:A{$endRow}");
                    $sheet->mergeCells("B{$startRow}:B{$endRow}");
                    $sheet->mergeCells("E{$startRow}:E{$endRow}");
                }
            }
        }

        if ($outagePlan->dailyProgresses->isEmpty()) {
            $sheet->setCellValue("A{$row}", 'Belum ada data progress harian.');
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true);
            $row++;
        }

        $this->beriGaris($sheet, "A{$headerRow}:{$kolomAkhir}".($row - 1));

        return $row + 2;
    }

    /** Bagian material/spare part — satu baris per material. */
    private function rekapMaterial($sheet, OutagePlan $outagePlan, int $row): int
    {
        $row = $this->judulBagian($sheet, 'MATERIAL / SPARE PART', $row);

        $headerRow = $row;
        $kolomAkhir = $this->tulisHeader(
            $sheet,
            ['Day', 'Tanggal', 'Nama Material', 'Part Number', 'Qty', 'Keterangan'],
            $headerRow,
        );
        $row++;

        $ada = false;
        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            foreach (DailyRingkas::materialRows($dp) as $m) {
                $ada = true;
                $sheet->setCellValue("A{$row}", 'Day '.($idx + 1));
                $sheet->setCellValue("B{$row}", $this->tgl($dp->tanggal));
                $sheet->setCellValue("C{$row}", $m['nama'] ?: '-');
                $sheet->setCellValue("D{$row}", $m['part_number'] ?: '-');
                $sheet->setCellValue("E{$row}", $m['qty'] ?: '-');
                $sheet->setCellValue("F{$row}", $m['keterangan'] ?: '-');
                $sheet->getStyle("A{$row}:B{$row}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("E{$row}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("C{$row}:F{$row}")->getAlignment()->setWrapText(true);
                $row++;
            }
        }

        if (! $ada) {
            $sheet->setCellValue("A{$row}", 'Tidak ada penggantian material.');
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true);
            $row++;
        }

        $this->beriGaris($sheet, "A{$headerRow}:{$kolomAkhir}".($row - 1));

        return $row + 2;
    }

    /**
     * Bagian dokumentasi foto.
     *
     * Foto diletakkan mengambang di atas baris tinggi, digeser ke kanan agar
     * berjajar; hanya hari berfoto yang ditulis.
     */
    private function rekapDokumentasi($sheet, OutagePlan $outagePlan, int $row): int
    {
        $row = $this->judulBagian($sheet, 'DOKUMENTASI FOTO', $row);

        $ada = false;
        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            $fotos = OutagePhotos::paths($dp->photos);

            if ($fotos === []) {
                continue;
            }

            $ada = true;
            $sheet->setCellValue("A{$row}", 'Day '.($idx + 1).' · '.$this->tgl($dp->tanggal));
            $sheet->mergeCells("A{$row}:F{$row}");
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;

            $uraian = DailyRingkas::pekerjaan($dp);
            if ($uraian !== '') {
                $sheet->setCellValue("A{$row}", $uraian);
                $sheet->mergeCells("A{$row}:F{$row}");
                $sheet->getStyle("A{$row}")->getAlignment()->setWrapText(true)
                    ->setVertical(Alignment::VERTICAL_TOP);
                $sheet->getRowDimension($row)->setRowHeight(48);
                $row++;
            }

            $sheet->getRowDimension($row)->setRowHeight(120);
            foreach ($fotos as $i => $path) {
                $drawing = new Drawing;
                $drawing->setName('Foto Dokumentasi');
                $drawing->setDescription('Foto Dokumentasi');
                $drawing->setPath($path);
                $drawing->setHeight(110);
                $drawing->setOffsetX(6 + ($i * 150));
                $drawing->setOffsetY(4);
                $drawing->setCoordinates("A{$row}");
                $drawing->setWorksheet($sheet);
            }

            $row += 2;
        }

        if (! $ada) {
            $sheet->setCellValue("A{$row}", 'Belum ada dokumentasi foto yang diunggah.');
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true);
            $row++;
        }

        return $row + 2;
    }

    /** Bagian kurva S di akhir: grafik lalu tabel angkanya. */
    private function rekapKurvaS($sheet, OutagePlan $outagePlan, int $row): int
    {
        $row = $this->judulBagian($sheet, 'KURVA S - PLAN VS ACTUAL', $row);

        // Calculate dynamic height based on WBS size
        $lastDp = $outagePlan->dailyProgresses->last() ?? new OutagePlanProgress;
        $data = new LaporanHarianData($outagePlan, $lastDp, $outagePlan->dailyProgresses->count());
        $wbs = $data->wbs();
        $chartHeight = $this->getDynamicChartHeight($wbs);

        $chart = $this->chartDrawing($outagePlan, 1600, $chartHeight);
        if ($chart !== null) {
            $chart->setCoordinates("A{$row}");
            $displayHeight = (int) ($chartHeight / 2.2);
            $chart->setHeight($displayHeight);
            $chart->setWorksheet($sheet);

            $rowsTaken = (int) ceil($displayHeight / 20) + 2;
            $row += $rowsTaken;
        }

        $headerRow = $row;
        $kolomAkhir = $this->tulisHeader(
            $sheet,
            ['Day', 'Tanggal', 'Plan (%)', 'Actual (%)', 'Deviasi (%)', 'Status'],
            $headerRow,
        );
        $row++;

        foreach ($outagePlan->dailyProgresses as $idx => $dp) {
            // Hari yang belum diisi dibiarkan kosong, bukan ditulis 0.
            $plan = $dp->plan_progress === null ? null : (float) $dp->plan_progress;
            $actual = $dp->actual_progress === null ? null : (float) $dp->actual_progress;

            $sheet->setCellValue("A{$row}", 'Day '.($idx + 1));
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

        if ($outagePlan->dailyProgresses->isEmpty()) {
            $sheet->setCellValue("A{$row}", 'Belum ada data progress harian.');
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true);
            $row++;
        }

        $this->beriGaris($sheet, "A{$headerRow}:{$kolomAkhir}".($row - 1));

        return $row;
    }

    /**
     * Lebar kolom lembar rekap gabungan.
     *
     * Satu lembar dipakai bersama beberapa tabel berbeda, jadi lebarnya dipilih
     * sebagai kompromi: C lebar untuk uraian/nama material, sisanya secukupnya.
     */
    private function aturKolomRekap($sheet): void
    {
        foreach (['A' => 10, 'B' => 15, 'C' => 40, 'D' => 14, 'E' => 26, 'F' => 22] as $col => $lebar) {
            $sheet->getColumnDimension($col)->setWidth($lebar);
        }
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
            Storage::disk('public')->delete($path);
        }
    }

    private function exportFilename(OutagePlan $outagePlan, string $extension): string
    {
        $slug = Str::slug($outagePlan->mesin_pembangkit ?: 'outage-plan');

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

        // Pengelola tidak menetapkan jadwal. Kolomnya dibuang dari payload —
        // bukan ditolak — supaya menyimpan progres harian tidak pernah gagal
        // hanya karena formulirnya ikut membawa tanggal rencana.
        if (! $request->user()?->canEditJadwalRapat()) {
            $validated = Arr::except($validated, OutagePlan::KOLOM_JADWAL);
        }

        // Riwayat hanya disentuh kalau jadwalnya memang bergeser; menyimpan
        // progres harian saja tidak boleh meninggalkan jejak revisi.
        $jadwalBerubah = $outagePlan->jadwalBerubah($validated);

        if ($jadwalBerubah) {
            // Batas revisi berlaku di jalur ini juga; kalau tidak, jadwal bisa
            // digeser terus dari sini tanpa pernah tercatat sebagai revisi.
            if ($outagePlan->sudahMencapaiBatasRevisi()) {
                throw ValidationException::withMessages([
                    'start_date' => 'Rencana ini sudah direvisi '.OutagePlan::MAKS_REVISI
                        .' kali — jadwal tidak dapat diubah lagi. Data lain tetap bisa disimpan.',
                ]);
            }

            // Rencana lama diabadikan lebih dulu; setelah update nilainya sudah
            // tertimpa dan riwayatnya kehilangan titik awal.
            $outagePlan->pastikanRencanaAwalTercatat();
        }

        $outagePlan->update($validated);

        if ($jadwalBerubah && $outagePlan->wasChanged(OutagePlan::KOLOM_JADWAL)) {
            $outagePlan->catatVersiBerjalan(
                'Diubah dari halaman Ubah Data Pekerjaan',
                $request->user()?->id,
            );
        }

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
            //
            // Recomputed unconditionally, including back down to null: clearing
            // the last actual means the work has no recorded progress any more,
            // and a stale value would keep the machine counted as "sedang
            // berjalan" on the dashboard long after its progress was removed.
            $outagePlan->update([
                'progress' => $outagePlan->dailyProgresses()->max('actual_progress'),
            ]);
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
