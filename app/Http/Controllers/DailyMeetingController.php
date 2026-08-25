<?php

namespace App\Http\Controllers;

use App\Exports\MeetingIssuesExport;
use App\Exports\MeetingKickoffExport;
use App\Models\DailyMeeting;
use App\Models\MeetingIssue;
use App\Models\MeetingKickoff;
use App\Models\MeetingKickoffPhoto;
use App\Models\Mesin;
use App\Models\OutagePlan;
use App\Models\OutagePlanRevision;
use App\Models\Unit;
use App\Support\JadwalRapatOutage;
use App\Support\NotulenBerlanjut;
use App\Support\TahunFilter;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class DailyMeetingController extends Controller
{
    /** Filter keys accepted by the listing. */
    private const FILTER_KEYS = [
        'search', 'tahun', 'unit', 'scope', 'jenis_rapat',
    ];

    /**
     * Halaman Rapat Outage (Daily Meetings).
     *
     * Menampilkan daftar Outage Plan beserta dengan status/link rapat P1-R3 nya.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = OutagePlan::visibleTo($user);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('mesin_pembangkit', 'like', "%{$search}%")
                    ->orWhere('scope', 'like', "%{$search}%")
                    ->orWhere('sistem', 'like', "%{$search}%");
            });
        }

        // Fetch tahun options first
        $tahunOptions = TahunFilter::options(OutagePlan::visibleTo($user), 'start_date');
        $tahun = TahunFilter::resolve($request->input('tahun'), $tahunOptions);

        if ($tahun !== null) {
            $query->whereYear('start_date', $tahun);
        }

        if ($request->filled('unit')) {
            $unit = $request->input('unit');
            if ($unit !== 'Semua') {
                $mesinsInUnit = Mesin::whereHas('unit', function ($q) use ($unit) {
                    $q->where('nama_sentral', $unit);
                })->pluck('nama_mesin')->toArray();

                $query->whereIn('mesin_pembangkit', $mesinsInUnit);
            }
        }

        if ($request->filled('scope')) {
            $scope = $request->input('scope');
            if ($scope !== 'Semua') {
                $query->where('scope', $scope);
            }
        }

        if ($request->filled('jenis_rapat')) {
            $jenisRapat = $request->input('jenis_rapat');
            if ($jenisRapat !== 'Semua') {
                $query->whereHas('dailyMeetings', function ($q) use ($jenisRapat) {
                    $q->where('tipe_rapat', $jenisRapat);
                });
            }
        }

        // Diambil sebelum paginasi supaya ringkasannya mencakup seluruh hasil
        // filter, bukan hanya halaman yang sedang dibuka.
        $idTersaring = (clone $query)->pluck('id');

        // Ordered by id so the listing mirrors the row order.
        // Riwayat revisinya tidak ikut dimuat — daftar ini cukup tahu sudah
        // berapa kali direvisi, rinciannya ada di halaman revisi.
        $outagePlans = $query->with('dailyMeetings')
            ->withCount(['revisions as jumlah_revisi' => fn ($q) => $q->where('urutan', '>', 0)])
            ->orderBy('id')
            ->paginate(20)
            ->withQueryString();

        // Get filter options
        $tahunOptions = TahunFilter::options(OutagePlan::visibleTo($user), 'start_date');

        $visibleMesin = OutagePlan::visibleTo($user)->pluck('mesin_pembangkit')->toArray();
        $unitOptions = Unit::whereHas('mesins', function ($q) use ($visibleMesin) {
            $q->whereIn('nama_mesin', $visibleMesin);
        })->pluck('nama_sentral')->toArray();

        $scopeOptions = OutagePlan::visibleTo($user)
            ->whereNotNull('scope')
            ->distinct()
            ->orderBy('scope')
            ->pluck('scope')
            ->toArray();

        return Inertia::render('daily-meetings/index', [
            'outagePlans' => $outagePlans,
            'filters' => array_merge(
                $request->only(self::FILTER_KEYS),
                ['tahun' => TahunFilter::label($tahun)]
            ),
            'filterOptions' => [
                'tahun' => array_values(array_unique(array_merge(['semua'], $tahunOptions))),
                'unit' => array_values(array_unique(array_merge(['Semua'], $unitOptions))),
                'scope' => array_values(array_unique(array_merge(['Semua'], $scopeOptions))),
                'jenis_rapat' => ['Semua', 'RAPAT P1', 'RAPAT P2', 'RAPAT P3', 'RAPAT R2', 'RAPAT R3'],
            ],
            // Dikirim ke layar supaya pratinjau tanggal di formulir revisi
            // memakai angka yang sama persis dengan hitungan di server.
            'offsetRapat' => JadwalRapatOutage::OFFSET_HARI,
            'maksRevisi' => OutagePlan::MAKS_REVISI,
            'ringkasan' => $this->ringkasan($idTersaring),
        ]);
    }

    /**
     * Angka ringkas di atas tabel, dihitung dari seluruh hasil filter.
     *
     * @param  Collection<int, int>  $idPlan
     * @return array{mesin: int, rapatSelesai: int, rapatTerjadwal: int, direvisi: int, terkunci: int}
     */
    private function ringkasan(Collection $idPlan): array
    {
        $rapat = fn () => DailyMeeting::whereIn('outage_plan_id', $idPlan);

        $revisi = fn () => OutagePlanRevision::whereIn('outage_plan_id', $idPlan)
            ->where('urutan', '>', 0);

        return [
            'mesin' => $idPlan->count(),
            'rapatSelesai' => $rapat()->where('status', 'completed')->count(),
            'rapatTerjadwal' => $rapat()->where('status', '!=', 'completed')->count(),
            'direvisi' => $revisi()->distinct()->count('outage_plan_id'),
            'terkunci' => $revisi()
                ->groupBy('outage_plan_id')
                ->havingRaw('count(*) >= ?', [OutagePlan::MAKS_REVISI])
                ->pluck('outage_plan_id')
                ->count(),
        ];
    }

    /**
     * Halaman revisi rencana satu mesin.
     *
     * Berdiri sendiri, bukan dialog di atas daftar: formulirnya berdampingan
     * dengan riwayat versinya, sehingga dampak revisi bisa dibaca utuh tanpa
     * membuka-tutup baris tabel.
     */
    public function formRevisiRencana(Request $request, OutagePlan $outagePlan)
    {
        abort_unless($request->user()?->canWrite(), 403);
        abort_unless(
            OutagePlan::visibleTo($request->user())->whereKey($outagePlan->id)->exists(),
            403,
        );

        $outagePlan->load(['revisions.user:id,name', 'dailyMeetings']);

        return Inertia::render('daily-meetings/revisi', [
            'plan' => $outagePlan,
            'offsetRapat' => JadwalRapatOutage::OFFSET_HARI,
            'maksRevisi' => OutagePlan::MAKS_REVISI,
            'jumlahRevisi' => $outagePlan->jumlahRevisi(),
        ]);
    }

    /**
     * Catat revisi rencana outage.
     *
     * Yang diminta hanya rencana start dan finish; tanggal rapat R2-P3 dihitung
     * ulang dari rencana start, dan versi sebelumnya tetap tersimpan sebagai
     * riwayat. Lihat [OutagePlan::catatRevisi()].
     */
    public function storeRevisiRencana(Request $request, OutagePlan $outagePlan)
    {
        abort_unless($request->user()?->canWrite(), 403);

        $validated = $request->validate([
            'start_date' => 'required|date',
            'selesai' => 'nullable|date|after_or_equal:start_date',
            'catatan' => 'nullable|string|max:255',
        ]);

        if ($outagePlan->sudahMencapaiBatasRevisi()) {
            throw ValidationException::withMessages([
                'start_date' => 'Rencana ini sudah direvisi '.OutagePlan::MAKS_REVISI
                    .' kali — batas maksimal revisi tercapai.',
            ]);
        }

        $outagePlan->catatRevisi(
            $validated['start_date'],
            $validated['selesai'] ?? null,
            $validated['catatan'] ?? null,
            $request->user()?->id,
        );

        // Kembali ke daftar: pekerjaannya selesai, dan versi barunya sudah
        // terlihat pada baris mesin yang bersangkutan.
        return redirect()->route('daily-meetings.index')
            ->with('success', 'Revisi rencana tersimpan dan jadwal rapat diperbarui.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'tanggal' => 'required|date',
            'waktu_mulai' => 'nullable|date_format:H:i',
            'lokasi' => 'nullable|string|max:255',
        ]);

        $validated['status'] = 'active';

        DailyMeeting::create($validated);

        return redirect()->back()->with('success', 'Meeting berhasil dibuat.');
    }

    /**
     * Batalkan revisi terakhir sebuah rencana.
     *
     * Yang dibuang selalu revisi paling akhir, sekalian mengembalikan jadwalnya
     * ke versi sebelumnya — lihat [OutagePlan::batalkanRevisiTerakhir()].
     * Membuang revisi di tengah riwayat akan meninggalkan penomoran berlubang
     * dan jadwal yang tidak tercatat di versi mana pun.
     *
     * Hanya admin yang boleh; pengelola mengisi realisasi tapi tidak membuang
     * catatan induk — sealasan dengan [User::canDeleteRecords()].
     */
    public function destroyRevisiRencana(Request $request, OutagePlan $outagePlan)
    {
        abort_unless($request->user()?->canDeleteRecords(), 403);
        abort_unless(
            OutagePlan::visibleTo($request->user())->whereKey($outagePlan->id)->exists(),
            403,
        );

        $dibatalkan = $outagePlan->batalkanRevisiTerakhir();

        if (! $dibatalkan) {
            return redirect()->back()
                ->with('error', 'Rencana ini belum pernah direvisi, jadi tidak ada yang bisa dibatalkan.');
        }

        return redirect()->back()->with(
            'success',
            "{$dibatalkan->label} dibatalkan — jadwal kembali ke versi sebelumnya dan jatah revisinya pulih.",
        );
    }

    public function show(DailyMeeting $dailyMeeting)
    {
        // Notulen rapat sebelumnya dibawa ke sini supaya permasalahan yang
        // belum tuntas tinggal diperbarui, bukan diketik ulang. Hanya berjalan
        // saat notulennya masih kosong — lihat [NotulenBerlanjut].
        $warisanDari = NotulenBerlanjut::wariskan($dailyMeeting);

        $dailyMeeting->load(['attendees', 'findings', 'outagePlan', 'kickoff', 'kickoffPhotos']);

        return Inertia::render('daily-meetings/show', [
            'meeting' => $dailyMeeting,
            'attendees' => $dailyMeeting->attendees,
            'issues' => $dailyMeeting->issues,
            'findingInfo' => $this->findingInfo($dailyMeeting),
            'kickoff' => $dailyMeeting->kickoff,
            'kickoffPhotos' => $dailyMeeting->kickoffPhotos,
            'kickoffDefaults' => $this->kickoffDefaults($dailyMeeting),
            // Diisi hanya pada kunjungan yang benar-benar menyalin, jadi
            // pemberitahuannya muncul sekali — bukan tiap kali dibuka.
            'notulenWarisanDari' => $warisanDari?->tipe_rapat,
        ]);
    }

    /**
     * Sensible starting values for a Kick Off notulen so the form is not blank
     * on first open; derived from the meeting and its outage plan.
     */
    private function kickoffDefaults(DailyMeeting $dailyMeeting): array
    {
        $plan = $dailyMeeting->outagePlan;
        $mesin = $plan->mesin_pembangkit ?? '-';
        $scope = $plan->scope ?? '';

        return [
            'nomor_dokumen' => 'FMKP - 145 - 13.3.4.a.a.i - 001',
            'revisi' => '001',
            'pimpinan_rapat' => 'TL Outage Management UP Kendari',
            'tempat' => $dailyMeeting->lokasi ?: 'Room Zoom UP Kendari',
            'waktu' => ($dailyMeeting->waktu_mulai ? substr($dailyMeeting->waktu_mulai, 0, 5) : '09.00').' WITA - Selesai',
            'agenda' => trim("Kick Off Meeting Pelaksanaan Pekerjaan OH {$scope} {$mesin}"),
            'peserta' => '(Daftar peserta terlampir)',
            // Penanda tangan tetap: Pimpinan Rapat (TL) dan Notulis (OF).
            'pimpinan_nama' => 'ABDUL RAHMAN KADIR',
            'pimpinan_jabatan' => 'TL Outage Management',
            'notulis_nama' => 'FIRMANSYAH',
            'notulis_jabatan' => 'OF Outage Management',
            'kota_ttd' => 'Kendari',
        ];
    }

    public function storeKickoff(Request $request, DailyMeeting $dailyMeeting)
    {
        $validated = $request->validate([
            'nomor_dokumen' => 'nullable|string|max:150',
            'revisi' => 'nullable|string|max:20',
            'tanggal_terbit' => 'nullable|date',
            'pimpinan_rapat' => 'nullable|string|max:255',
            'tempat' => 'nullable|string|max:255',
            'waktu' => 'nullable|string|max:100',
            'agenda' => 'nullable|string',
            'peserta' => 'nullable|string|max:255',
            'penyampaian_pln' => 'nullable|string',
            'nama_mitra' => 'nullable|string|max:255',
            'penyampaian_mitra' => 'nullable|string',
            'hasil_kesepakatan' => 'nullable|string',
            'link_absensi' => 'nullable|string|max:500',
            'pimpinan_nama' => 'nullable|string|max:255',
            'pimpinan_jabatan' => 'nullable|string|max:255',
            'notulis_nama' => 'nullable|string|max:255',
            'notulis_jabatan' => 'nullable|string|max:255',
            'kota_ttd' => 'nullable|string|max:100',
            'tanggal_ttd' => 'nullable|date',
        ]);

        MeetingKickoff::updateOrCreate(
            ['meeting_id' => $dailyMeeting->id],
            $validated
        );

        return redirect()->back()->with('success', 'Notulen Kick Off Meeting berhasil disimpan.');
    }

    public function storeKickoffPhoto(Request $request, DailyMeeting $dailyMeeting)
    {
        $request->validate([
            'foto' => 'required|image|max:8192',
            'caption' => 'nullable|string|max:255',
        ]);

        $encoded = $this->encodePhoto($request->file('foto'));

        if ($encoded === null) {
            return redirect()->back()->with('error', 'Foto tidak dapat diproses.');
        }

        $dailyMeeting->kickoffPhotos()->create([
            'foto' => $encoded,
            'caption' => $request->input('caption'),
        ]);

        return redirect()->back()->with('success', 'Dokumentasi berhasil ditambahkan.');
    }

    /**
     * Kecilkan lalu simpan foto sebagai data URI JPEG.
     *
     * Dokumentasi rapat ikut tertanam di PDF/Excel, jadi disimpan inline di basis
     * data — bukan di disk — supaya ekspor tidak bergantung pada berkas terpisah.
     */
    private function encodePhoto(?UploadedFile $file): ?string
    {
        if (! $file) {
            return null;
        }

        $source = @imagecreatefromstring(file_get_contents($file->getRealPath()));

        if ($source === false) {
            return null;
        }

        $maxW = 640;
        $w = imagesx($source);
        $h = imagesy($source);

        if ($w > $maxW) {
            $newH = (int) round($h * ($maxW / $w));
            $resized = imagecreatetruecolor($maxW, $newH);
            imagecopyresampled($resized, $source, 0, 0, 0, 0, $maxW, $newH, $w, $h);
            imagedestroy($source);
            $source = $resized;
        }

        ob_start();
        imagejpeg($source, null, 72);
        $data = ob_get_clean();
        imagedestroy($source);

        return 'data:image/jpeg;base64,'.base64_encode($data);
    }

    public function destroyKickoffPhoto(DailyMeeting $dailyMeeting, MeetingKickoffPhoto $photo)
    {
        abort_unless($photo->meeting_id === $dailyMeeting->id, 404);

        $photo->delete();

        return redirect()->back()->with('success', 'Dokumentasi berhasil dihapus.');
    }

    public function exportIssuesPdf(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['attendees', 'issues', 'outagePlan']);

        $pdf = Pdf::loadView('exports.meeting-issues', [
            'meeting' => $dailyMeeting,
        ]);

        $pdf->setPaper('A4', 'landscape');

        return $pdf->download("Rapat-Outage-{$dailyMeeting->id}.pdf");
    }

    public function exportIssuesExcel(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['attendees', 'issues', 'outagePlan']);

        return Excel::download(
            new MeetingIssuesExport($dailyMeeting),
            "Rapat-Outage-{$dailyMeeting->id}.xlsx"
        );
    }

    public function exportKickoffPdf(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['kickoff', 'kickoffPhotos', 'attendees', 'outagePlan']);

        $logoPath = public_path('sidebar-logo.png');

        $pdf = Pdf::loadView('exports.meeting-kickoff', [
            'meeting' => $dailyMeeting,
            'kickoff' => $dailyMeeting->kickoff,
            'photos' => $dailyMeeting->kickoffPhotos,
            'attendees' => $dailyMeeting->attendees,
            'issues' => $dailyMeeting->issues,
            'defaults' => $this->kickoffDefaults($dailyMeeting),
            'attendUrl' => route('attend.form', $dailyMeeting->token),
            'logo' => is_file($logoPath)
                ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath))
                : null,
        ])->setPaper('a4', 'portrait');

        $slug = Str::slug($dailyMeeting->outagePlan->mesin_pembangkit ?? $dailyMeeting->judul);

        return $pdf->download("Notulen-Kick-Off-{$slug}-{$dailyMeeting->id}.pdf");
    }

    /**
     * Notulen Kick Off versi Excel — isi dan tata letaknya mengikuti versi PDF
     * (FORMULIR NOTULEN RAPAT), hanya berformat spreadsheet.
     */
    public function exportKickoffExcel(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['kickoff', 'kickoffPhotos', 'attendees', 'outagePlan']);

        $slug = Str::slug($dailyMeeting->outagePlan->mesin_pembangkit ?? $dailyMeeting->judul);

        return Excel::download(
            new MeetingKickoffExport(
                $dailyMeeting,
                $dailyMeeting->kickoff,
                $dailyMeeting->kickoffPhotos,
                $dailyMeeting->attendees,
                $this->kickoffDefaults($dailyMeeting),
            ),
            "Notulen-Kick-Off-{$slug}-{$dailyMeeting->id}.xlsx",
        );
    }

    /**
     * Header context for the "Material Temuan" form.
     *
     * Unit dan jenis inspeksi diwarisi dari outage plan yang menaungi rapat ini,
     * sedangkan judul, jenis, dan tanggal rapat diambil dari rapatnya sendiri —
     * tanpa itu lembar temuan tidak menyebutkan rapat mana yang menghasilkannya.
     */
    private function findingInfo(DailyMeeting $dailyMeeting): array
    {
        $plan = $dailyMeeting->outagePlan;

        return [
            'judul_rapat' => $dailyMeeting->judul ?: '-',
            'tipe_rapat' => $dailyMeeting->tipe_rapat ?: '-',
            'tanggal_rapat' => $dailyMeeting->tanggal
                ? Carbon::parse($dailyMeeting->tanggal)->translatedFormat('d F Y')
                : '-',
            'unit' => $plan->mesin_pembangkit ?? '-',
            'jenis_inspeksi' => $plan->scope ?? '-',
        ];
    }

    public function exportFindingsExcel(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['findings', 'outagePlan']);
        $info = $this->findingInfo($dailyMeeting);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Material Temuan');

        $thin = ['borderStyle' => Border::BORDER_THIN];
        $center = Alignment::HORIZONTAL_CENTER;

        // --- Document control header -------------------------------------
        $sheet->mergeCells('A1:C4');
        $logoPath = public_path('sidebar-logo.png');
        if (is_file($logoPath)) {
            $logo = new Drawing;
            $logo->setPath($logoPath);
            $logo->setHeight(58);
            $logo->setOffsetX(8);
            $logo->setOffsetY(6);
            $logo->setCoordinates('A1');
            $logo->setWorksheet($sheet);
        }

        $titles = [
            'PT PLN NUSANTARA POWER',
            'INTEGRATED MANAGEMENT SYSTEM',
            'FORMULIR',
            'MATERIAL TEMUAN OVERHAUL UP KENDARI',
        ];
        $meta = [
            ['No. Dokumen', ''],
            ['No. Revisi', ': 00'],
            ['Tanggal Terbit', ': '.Carbon::parse($dailyMeeting->tanggal)->format('d-m-Y')],
            ['Jumlah Halaman', ': 1 dari 1'],
        ];

        foreach ($titles as $i => $title) {
            $row = $i + 1;
            $sheet->mergeCells("D{$row}:H{$row}");
            $sheet->setCellValue("D{$row}", $title);
            $sheet->getStyle("D{$row}")->getFont()->setBold(true);
            $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal($center);
            $sheet->setCellValue("I{$row}", $meta[$i][0]);
            $sheet->getStyle("I{$row}")->getFont()->setBold(true);
            $sheet->setCellValue("J{$row}", $meta[$i][1]);
        }
        $sheet->getStyle('A1:J4')->getBorders()->getAllBorders()->applyFromArray($thin);

        // --- Meeting / unit block ------------------------------------------
        // Dua kolom: identitas rapat di kiri, identitas mesin di kanan.
        $kiri = [
            ['JUDUL RAPAT', $info['judul_rapat']],
            ['JENIS RAPAT', $info['tipe_rapat']],
            ['TANGGAL RAPAT', $info['tanggal_rapat']],
        ];
        $kanan = [
            ['UNIT', $info['unit']],
            ['JENIS INSPEKSI', $info['jenis_inspeksi']],
            ['JUMLAH TEMUAN', count($dailyMeeting->findings).' item'],
        ];

        foreach ($kiri as $i => [$label, $value]) {
            $r = 6 + $i;
            $sheet->setCellValue("A{$r}", $label);
            $sheet->setCellValue("C{$r}", ': '.$value);
            $sheet->setCellValue("G{$r}", $kanan[$i][0]);
            $sheet->setCellValue("H{$r}", ': '.$kanan[$i][1]);
        }

        $sheet->getStyle('A6:A8')->getFont()->setBold(true);
        $sheet->getStyle('G6:G8')->getFont()->setBold(true);
        $sheet->getStyle('C6:C8')->getFont()->getColor()->setRGB('C00000');
        $sheet->getStyle('H6:H8')->getFont()->getColor()->setRGB('C00000');

        // --- Table ---------------------------------------------------------
        $headRow = 10;
        $headers = ['NO', 'TGL', 'URAIAN', 'P/N', 'QTY', 'SATUAN', 'FOTO', 'KETERANGAN', 'TINDAK LANJUT', 'TARGET'];
        foreach ($headers as $i => $label) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}{$headRow}", $label);
        }
        $sheet->getStyle("A{$headRow}:J{$headRow}")->getFont()->setBold(true);
        $sheet->getStyle("A{$headRow}:J{$headRow}")->getFill()->applyFromArray([
            'fillType' => Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'BFBFBF'],
        ]);
        $sheet->getStyle("A{$headRow}:J{$headRow}")->getAlignment()
            ->setHorizontal($center)->setVertical(Alignment::VERTICAL_CENTER);

        $row = $headRow + 1;
        foreach ($dailyMeeting->findings as $idx => $f) {
            $sheet->getRowDimension($row)->setRowHeight(90);
            $sheet->setCellValue("A{$row}", $idx + 1);
            $sheet->setCellValue("B{$row}", $f->tanggal ? Carbon::parse($f->tanggal)->format('d-m-Y') : '');
            $sheet->setCellValue("C{$row}", $f->uraian);
            $sheet->setCellValue("D{$row}", $f->part_number);
            $sheet->setCellValue("E{$row}", $f->qty);
            $sheet->setCellValue("F{$row}", $f->satuan);
            $sheet->setCellValue("H{$row}", $f->keterangan);
            $sheet->setCellValue("I{$row}", $f->tindak_lanjut);
            $sheet->setCellValue("J{$row}", $f->target);

            if ($f->foto && str_contains($f->foto, ',')) {
                $binary = base64_decode(explode(',', $f->foto, 2)[1] ?? '');
                $img = $binary ? @imagecreatefromstring($binary) : false;
                if ($img !== false) {
                    $drawing = new MemoryDrawing;
                    $drawing->setImageResource($img);
                    $drawing->setRenderingFunction(MemoryDrawing::RENDERING_JPEG);
                    $drawing->setMimeType(MemoryDrawing::MIMETYPE_JPEG);
                    $drawing->setHeight(110);
                    $drawing->setOffsetX(4);
                    $drawing->setOffsetY(4);
                    $drawing->setCoordinates("G{$row}");
                    $drawing->setWorksheet($sheet);
                }
            }

            $sheet->getStyle("A{$row}:B{$row}")->getAlignment()->setHorizontal($center);
            $sheet->getStyle("D{$row}:F{$row}")->getAlignment()->setHorizontal($center);
            $sheet->getStyle("J{$row}")->getAlignment()->setHorizontal($center);
            $sheet->getStyle("C{$row}:J{$row}")->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("A{$row}:J{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

            if (strtoupper((string) $f->target) === 'CLOSE') {
                $sheet->getStyle("J{$row}")->getFill()->applyFromArray([
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '92D050'],
                ]);
            }
            $row++;
        }

        $lastRow = max($row - 1, $headRow);
        $sheet->getStyle("A{$headRow}:J{$lastRow}")->getBorders()->getAllBorders()->applyFromArray($thin);

        foreach (['A' => 6, 'B' => 12, 'C' => 34, 'D' => 13, 'E' => 7, 'F' => 9, 'G' => 24, 'H' => 28, 'I' => 46, 'J' => 12] as $col => $w) {
            $sheet->getColumnDimension($col)->setWidth($w);
        }
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);

        $writer = new Xlsx($spreadsheet);
        $filename = $this->findingFilename($dailyMeeting, 'xlsx');

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function findingFilename(DailyMeeting $dailyMeeting, string $ext): string
    {
        $slug = Str::slug($dailyMeeting->outagePlan->mesin_pembangkit ?? $dailyMeeting->judul);
        // Jenis rapat ikut di nama berkas supaya beberapa rapat pada satu mesin
        // tidak menghasilkan berkas yang tampak sama.
        $tipe = Str::slug($dailyMeeting->tipe_rapat ?? '');

        return trim("Material-Temuan-{$slug}-{$tipe}", '-')."-{$dailyMeeting->id}.{$ext}";
    }

    public function complete(DailyMeeting $dailyMeeting)
    {
        $updateData = [
            'status' => 'completed',
            'waktu_selesai' => now()->format('H:i'),
        ];

        if (! $dailyMeeting->tanggal_realisasi) {
            $updateData['tanggal_realisasi'] = now()->format('Y-m-d');
        }

        $dailyMeeting->update($updateData);

        return redirect()->back()->with('success', 'Meeting selesai.');
    }

    public function setRealisasi(Request $request, DailyMeeting $dailyMeeting)
    {
        $request->validate([
            'tanggal_realisasi' => 'required|date',
        ]);

        $dailyMeeting->update([
            'tanggal_realisasi' => $request->tanggal_realisasi,
        ]);

        return redirect()->back()->with('success', 'Tanggal realisasi berhasil disimpan.');
    }

    public function qrDisplay(DailyMeeting $dailyMeeting)
    {
        return Inertia::render('daily-meetings/qr', [
            'meeting' => $dailyMeeting,
            'attendUrl' => route('attend.form', $dailyMeeting->token),
        ]);
    }

    public function attendForm(string $token)
    {
        $meeting = DailyMeeting::with('attendees')->where('token', $token)->firstOrFail();

        return Inertia::render('daily-meetings/attend', [
            'meeting' => $meeting,
            'token' => $token,
        ]);
    }

    public function submitAttendance(Request $request, string $token)
    {
        $meeting = DailyMeeting::where('token', $token)->firstOrFail();

        if ($meeting->status === 'completed') {
            return redirect()->back()->with('error', 'Rapat sudah selesai. Tidak dapat mendaftar kehadiran.');
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nid' => 'nullable|string|max:255',
            'instansi' => 'nullable|string|max:255',
            'divisi' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'signature' => 'nullable|string',
        ]);

        $meeting->attendees()->create([
            'nama' => $validated['nama'],
            'nid' => $validated['nid'] ?? null,
            'instansi' => $validated['instansi'] ?? null,
            'divisi' => $validated['divisi'] ?? null,
            'jabatan' => $validated['jabatan'] ?? null,
            'signature' => $validated['signature'] ?? null,
            'signed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Kehadiran berhasil dicatat.');
    }

    public function attendeesJson(DailyMeeting $dailyMeeting)
    {
        return response()->json([
            'count' => $dailyMeeting->attendees()->count(),
            // Tanda tangan ikut dikirim karena tabel Daftar Hadir menampilkannya;
            // tanpa itu paraf peserta hilang begitu polling 5 detik menimpa state.
            'attendees' => $dailyMeeting->attendees()->latest()->get([
                'id', 'nama', 'nid', 'instansi', 'divisi', 'jabatan', 'signature', 'signed_at',
            ]),
        ]);
    }

    /** Hanya admin yang boleh membuang rapat; lihat User::canDeleteRecords(). */
    public function destroy(Request $request, DailyMeeting $dailyMeeting)
    {
        abort_unless($request->user()?->canDeleteRecords(), 403);

        $dailyMeeting->delete();

        return redirect()->route('daily-meetings.index')->with('success', 'Meeting berhasil dihapus.');
    }

    public function storeIssue(Request $request, DailyMeeting $dailyMeeting)
    {
        $validated = $request->validate([
            'permasalahan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:255',
            'pic' => 'nullable|string|max:255',
            'status' => 'required|in:Open,Close',
        ]);

        $dailyMeeting->issues()->create($validated);

        return redirect()->back()->with('success', 'Permasalahan ditambahkan.');
    }

    public function updateIssue(Request $request, DailyMeeting $dailyMeeting, MeetingIssue $issue)
    {
        $validated = $request->validate([
            'permasalahan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:255',
            'pic' => 'nullable|string|max:255',
            'status' => 'required|in:Open,Close',
        ]);

        $issue->update($validated);

        return redirect()->back()->with('success', 'Permasalahan diperbarui.');
    }

    public function destroyIssue(DailyMeeting $dailyMeeting, MeetingIssue $issue)
    {
        $issue->delete();

        return redirect()->back()->with('success', 'Permasalahan dihapus.');
    }
}
