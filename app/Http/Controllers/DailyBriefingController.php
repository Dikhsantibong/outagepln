<?php

namespace App\Http\Controllers;

use App\Exports\BriefingKickoffExport;
use App\Exports\DailyBriefingExport;
use App\Models\DailyBriefing;
use App\Models\DailyBriefingAttendee;
use App\Models\DailyBriefingFinding;
use App\Models\DailyBriefingIssue;
use App\Models\DailyBriefingKickoff;
use App\Models\DailyBriefingKickoffPhoto;
use App\Support\RapatHarianOtomatis;
use App\Support\TahunFilter;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

class DailyBriefingController extends Controller
{
    public function index(Request $request)
    {
        // Rapat tidak lagi dibuat manual: harinya disiapkan dari pekerjaan yang
        // sedang berjalan setiap daftar ini dibuka, jadi rapat mesin yang baru
        // mulai langsung muncul tanpa ada yang perlu menambahkannya.
        RapatHarianOtomatis::sinkronkanYangBerjalan();

        // Satu baris per mesin, bukan per hari. Seluruh hari pelaksanaan sudah
        // terbentuk sendiri, jadi menampilkannya satu-satu hanya membuat satu
        // mesin terulang berpuluh kali; harinya dibuka lewat tombol Detail.
        //
        // Rangkaian otomatis diwakili hari paling awal dari rencananya, bukan
        // baris ber-parent_id kosong: kolom itu ikut dikosongkan saat hari
        // pertama dihapus, dan mesin yang sama akan tampil berulang kali.
        $query = DailyBriefing::query()->where(function ($q) {
            $q->where(function ($otomatis) {
                $otomatis->whereNotNull('outage_plan_id')
                    ->whereRaw('daily_briefings.hari_ke = (select min(h.hari_ke) from daily_briefings h'
                        .' where h.outage_plan_id = daily_briefings.outage_plan_id)');
            })->orWhere(function ($manual) {
                // Rapat lama yang belum terikat rencana mana pun.
                $manual->whereNull('outage_plan_id')->whereNull('parent_id');
            });
        });

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('judul', 'like', "%{$search}%")
                    ->orWhere('lokasi', 'like', "%{$search}%")
                    ->orWhere('unit', 'like', "%{$search}%");
            });
        }

        /** Menyaring berdasarkan hari mana pun dalam rangkaian, bukan hari pertamanya saja. */
        $adaHari = function ($q, callable $syarat, bool $negasi = false) {
            $subquery = function ($sub) use ($syarat) {
                $sub->selectRaw('1')
                    ->from('daily_briefings as hari')
                    ->where(function ($w) {
                        $w->whereColumn('hari.id', 'daily_briefings.id')
                            ->orWhereColumn('hari.parent_id', 'daily_briefings.id');
                    });
                $syarat($sub);
            };

            return $negasi ? $q->whereNotExists($subquery) : $q->whereExists($subquery);
        };

        $hariIni = today()->toDateString();

        match ($request->input('status')) {
            // Ada hari yang jatuh hari ini dan belum ditutup.
            'berlangsung' => $adaHari($query, fn ($q) => $q
                ->where('hari.status', 'active')
                ->whereDate('hari.tanggal', $hariIni)),
            // Masih ada hari yang belum ditutup, tapi tidak ada yang hari ini.
            'akan_datang' => $adaHari(
                $adaHari($query, fn ($q) => $q->where('hari.status', 'active')),
                fn ($q) => $q->where('hari.status', 'active')->whereDate('hari.tanggal', $hariIni),
                negasi: true,
            ),
            // Selesai bila tidak ada satu pun hari yang belum ditutup.
            'selesai' => $adaHari($query, fn ($q) => $q->where('hari.status', '!=', 'completed'), negasi: true),
            default => null,
        };

        $tahunOptions = TahunFilter::options(DailyBriefing::query(), 'tanggal');
        $tahun = TahunFilter::resolve($request->input('tahun'), $tahunOptions);

        if ($tahun !== null) {
            $adaHari($query, fn ($q) => $q->whereYear('hari.tanggal', $tahun));
        }

        if ($request->filled('bulan')) {
            $adaHari($query, fn ($q) => $q->whereMonth('hari.tanggal', $request->input('bulan')));
        }

        $briefings = $query
            ->orderByDesc('tanggal')
            ->orderBy('id')
            ->paginate(12)
            ->withQueryString();

        // Ringkasan rangkaian dihitung setelah paginasi — paling 12 baris per
        // halaman, jadi jauh lebih murah daripada menggabungkannya di query.
        $briefings->through(fn (DailyBriefing $kepala) => $this->ringkasanRangkaian($kepala));

        return Inertia::render('daily-briefings/index', [
            'briefings' => $briefings,
            'filters' => array_merge(
                $request->only(['search', 'status', 'tahun', 'bulan']),
                ['tahun' => TahunFilter::label($tahun)],
            ),
            'filterOptions' => [
                'tahun' => $tahunOptions,
            ],
        ]);
    }

    /**
     * Satu baris daftar: rangkaian rapat sebuah mesin, bukan satu hari.
     *
     * Statusnya diringkas dari seluruh harinya — berlangsung bila ada rapat
     * hari ini, selesai bila semua harinya sudah ditutup — dan hari yang sudah
     * terisi dihitung supaya terlihat sejauh mana notulennya sudah diisi.
     *
     * @return array<string, mixed>
     */
    private function ringkasanRangkaian(DailyBriefing $kepala): array
    {
        $hari = $kepala->seriesDays()
            ->withCount(['attendees', 'findings', 'issues'])
            ->with('kickoff:id,daily_briefing_id')
            ->get();

        $terisi = $hari->filter(
            fn ($d) => $d->attendees_count > 0
                || $d->findings_count > 0
                || $d->issues_count > 0
                || $d->kickoff !== null,
        );

        $hariIni = today()->toDateString();
        $adaHariIni = $hari->contains(
            fn ($d) => $d->status === 'active' && $d->tanggal?->toDateString() === $hariIni,
        );
        $semuaSelesai = $hari->every(fn ($d) => $d->status === 'completed');

        return [
            'id' => $kepala->id,
            'judul' => $kepala->judul,
            'lokasi' => $kepala->lokasi,
            'waktu_mulai' => $kepala->waktu_mulai,
            'tanggal' => $hari->min('tanggal')?->toDateString(),
            'tanggal_akhir' => $hari->max('tanggal')?->toDateString(),
            'jumlah_hari' => $hari->count(),
            'hari_terisi' => $terisi->count(),
            'attendees_count' => (int) $hari->sum('attendees_count'),
            'temuan_count' => (int) $hari->sum('findings_count'),
            'status' => match (true) {
                $adaHariIni => 'berlangsung',
                $semuaSelesai => 'completed',
                default => 'active',
            },
        ];
    }

    public function show(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['attendees', 'issues', 'findings', 'kickoff', 'kickoffPhotos']);

        // Pekerjaan yang jalan bisa berubah durasinya setelah rapat dibuka;
        // disinkronkan lagi di sini supaya hari yang baru bertambah langsung
        // ikut terlihat tanpa perlu kembali ke daftar.
        if ($dailyBriefing->outagePlan) {
            RapatHarianOtomatis::sinkronkan($dailyBriefing->outagePlan);
        }

        // Semua hari dalam rangkaian rapat mesin yang sama, untuk navigasi antar
        // hari. Hari yang rapatnya dilewat tetap ada di daftar — kosong, tapi
        // penomorannya tidak melompat — dan tiap hari menyimpan notulen serta
        // temuannya sendiri sehingga hari lama tetap bisa dibuka dan diperbarui.
        $days = $dailyBriefing->seriesDays()
            ->withCount(['attendees', 'findings', 'issues'])
            ->with('kickoff:id,daily_briefing_id')
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'hari_ke' => $d->hari_ke,
                'tanggal' => $d->tanggal?->toDateString(),
                'status' => $d->status,
                'attendees_count' => $d->attendees_count,
                'findings_count' => $d->findings_count,
                'issues_count' => $d->issues_count,
                'ada_isi' => $d->attendees_count > 0
                    || $d->findings_count > 0
                    || $d->issues_count > 0
                    || $d->kickoff !== null,
                'is_current' => $d->id === $dailyBriefing->id,
            ]);

        return Inertia::render('daily-briefings/show', [
            'briefing' => $dailyBriefing,
            'attendees' => $dailyBriefing->attendees,
            'issues' => $dailyBriefing->issues,
            'findings' => $dailyBriefing->findings,
            'kickoff' => $dailyBriefing->kickoff,
            'kickoffPhotos' => $dailyBriefing->kickoffPhotos,
            'findingInfo' => $this->findingInfo($dailyBriefing),
            'kickoffDefaults' => $this->kickoffDefaults($dailyBriefing),
            'attendUrl' => $this->attendUrl($dailyBriefing),
            'days' => $days,
        ]);
    }

    /**
     * Tautan absensi mandiri untuk peserta yang tidak memindai QR.
     *
     * Halaman yang dituju sekaligus menampilkan siapa saja yang sudah hadir,
     * dan tautan yang sama ikut dicantumkan pada lampiran notulen.
     */
    private function attendUrl(DailyBriefing $dailyBriefing): string
    {
        return route('daily-briefings.attend.form', $dailyBriefing->token);
    }

    public function update(Request $request, DailyBriefing $dailyBriefing)
    {
        $validated = $request->validate([
            'unit' => 'nullable|string|max:255',
            'jenis_inspeksi' => 'nullable|string|max:255',
            'rapat_framework' => 'nullable|string|max:255',
            'tgl_performance_test' => 'nullable|string|max:255',
            'jam_setelah_po_terai' => 'nullable|string|max:255',
            'daya_mampu' => 'nullable|string|max:255',
            'nomor_dokumen' => 'nullable|string|max:255',
            'revisi' => 'nullable|string|max:255',
            'tanggal_terbit' => 'nullable|date',
            'nama_mengetahui' => 'nullable|string|max:255',
            'jabatan_mengetahui' => 'nullable|string|max:255',
            'nama_disetujui' => 'nullable|string|max:255',
            'jabatan_disetujui' => 'nullable|string|max:255',
        ]);

        $dailyBriefing->update($validated);

        return redirect()->back()->with('success', 'Data header berhasil disimpan.');
    }

    public function complete(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->update(['status' => 'completed']);

        return redirect()->back()->with('success', 'Status meeting ditandai selesai.');
    }

    /**
     * Membuang satu mesin dari daftar, artinya seluruh hari rapatnya.
     *
     * Menghapus hari pertamanya saja akan menyisakan hari-hari lain tanpa induk
     * — mesin yang sama justru tampil berkali-kali, bukan hilang.
     */
    public function destroy(DailyBriefing $dailyBriefing)
    {
        $jumlah = $dailyBriefing->seriesDays()->count();
        $dailyBriefing->seriesDays()->delete();

        return redirect()->route('daily-briefings.index')
            ->with('success', "Rapat dihapus beserta {$jumlah} hari rapatnya.");
    }

    public function storeIssue(Request $request, DailyBriefing $dailyBriefing)
    {
        $validated = $request->validate([
            'permasalahan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:255',
            'pic' => 'nullable|string|max:255',
            'status' => 'required|in:Open,Close',
        ]);

        $dailyBriefing->issues()->create($validated);

        return redirect()->back()->with('success', 'Permasalahan ditambahkan.');
    }

    public function updateIssue(Request $request, DailyBriefing $dailyBriefing, DailyBriefingIssue $issue)
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

    public function destroyIssue(DailyBriefing $dailyBriefing, DailyBriefingIssue $issue)
    {
        $issue->delete();

        return redirect()->back()->with('success', 'Permasalahan dihapus.');
    }

    public function qrDisplay(DailyBriefing $dailyBriefing)
    {
        return Inertia::render('daily-briefings/qr', [
            'briefing' => $dailyBriefing,
            'attendUrl' => $this->attendUrl($dailyBriefing),
        ]);
    }

    public function attendeesJson(DailyBriefing $dailyBriefing)
    {
        return response()->json($dailyBriefing->attendees);
    }

    public function attendForm(string $token)
    {
        $briefing = DailyBriefing::with('attendees')->where('token', $token)->firstOrFail();

        return Inertia::render('daily-briefings/attend', [
            'briefing' => $briefing,
            'token' => $token,
        ]);
    }

    public function submitAttendance(Request $request, string $token)
    {
        $briefing = DailyBriefing::where('token', $token)->firstOrFail();

        if ($briefing->status === 'completed') {
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

        DailyBriefingAttendee::create([
            'daily_briefing_id' => $briefing->id,
            'nama' => $validated['nama'],
            'nid' => $validated['nid'] ?? null,
            'instansi' => $validated['instansi'] ?? null,
            'divisi' => $validated['divisi'] ?? null,
            'jabatan' => $validated['jabatan'] ?? null,
            'signature' => $validated['signature'] ?? null,
            'signed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Kehadiran berhasil tercatat. Terima kasih!');
    }

    public function uploadPhoto(Request $request, DailyBriefing $dailyBriefing)
    {
        $request->validate([
            'foto_dokumentasi' => 'required|image|max:5120',
        ]);

        if ($request->hasFile('foto_dokumentasi')) {
            if ($dailyBriefing->foto_dokumentasi) {
                Storage::disk('public')->delete($dailyBriefing->foto_dokumentasi);
            }

            $path = $request->file('foto_dokumentasi')->store('daily_briefings', 'public');
            $dailyBriefing->update(['foto_dokumentasi' => $path]);
        }

        return redirect()->back()->with('success', 'Foto dokumentasi berhasil diunggah.');
    }

    public function exportPdf(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['attendees', 'issues']);

        $pdf = Pdf::loadView('exports.daily-briefing', [
            'briefing' => $dailyBriefing,
        ]);

        // A4 Portrait or Landscape? The image looks like landscape given the width.
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download("Daily-Meeting-{$dailyBriefing->id}.pdf");
    }

    public function exportExcel(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['attendees', 'issues']);

        return Excel::download(
            new DailyBriefingExport($dailyBriefing),
            "Daily-Meeting-{$dailyBriefing->id}.xlsx"
        );
    }

    // --- TEMUAN ---
    private function findingInfo(DailyBriefing $dailyBriefing): array
    {
        return [
            'judul_rapat' => $dailyBriefing->judul ?: '-',
            'tipe_rapat' => '-',
            'tanggal_rapat' => $dailyBriefing->tanggal
                ? Carbon::parse($dailyBriefing->tanggal)->translatedFormat('d F Y')
                : '-',
            'unit' => $dailyBriefing->judul,
            'jenis_inspeksi' => '-',
        ];
    }

    public function storeFinding(Request $request, DailyBriefing $dailyBriefing)
    {
        $validated = $request->validate([
            'tanggal' => 'nullable|date',
            'uraian' => 'required|string|max:255',
            'part_number' => 'nullable|string|max:100',
            'qty' => 'nullable|integer|min:0',
            'satuan' => 'nullable|string|max:50',
            'keterangan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:50',
            'foto' => 'nullable|image|max:8192',
        ]);

        $validated['foto'] = $this->encodePhoto($request->file('foto'));
        // Kolom opsional bisa tidak ikut terkirim sama sekali, bukan sekadar
        // kosong — jadi kuncinya diambil dengan ?? agar tidak memicu galat.
        $validated['target'] = ($validated['target'] ?? null) ?: 'Open';
        $validated['tanggal'] = ($validated['tanggal'] ?? null)
            ?: $dailyBriefing->tanggal?->toDateString();

        $dailyBriefing->findings()->create($validated);

        return redirect()->back()->with('success', 'Temuan berhasil ditambahkan.');
    }

    public function updateFinding(Request $request, DailyBriefing $dailyBriefing, DailyBriefingFinding $finding)
    {
        abort_unless($finding->daily_briefing_id === $dailyBriefing->id, 404);

        $validated = $request->validate([
            'tanggal' => 'nullable|date',
            'uraian' => 'required|string|max:255',
            'part_number' => 'nullable|string|max:100',
            'qty' => 'nullable|integer|min:0',
            'satuan' => 'nullable|string|max:50',
            'keterangan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:50',
            'foto' => 'nullable|image|max:8192',
        ]);

        if ($request->hasFile('foto')) {
            $validated['foto'] = $this->encodePhoto($request->file('foto'));
        } else {
            unset($validated['foto']);
        }

        $validated['target'] = ($validated['target'] ?? null) ?: 'Open';
        $finding->update($validated);

        return redirect()->back()->with('success', 'Temuan berhasil diperbarui.');
    }

    public function destroyFinding(DailyBriefing $dailyBriefing, DailyBriefingFinding $finding)
    {
        abort_unless($finding->daily_briefing_id === $dailyBriefing->id, 404);
        $finding->delete();

        return redirect()->back()->with('success', 'Temuan berhasil dihapus.');
    }

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

    public function exportFindingsPdf(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['findings']);
        $logoPath = public_path('sidebar-logo.png');

        $pdf = Pdf::loadView('exports.briefing-findings', [
            'meeting' => $dailyBriefing,
            'findings' => $dailyBriefing->findings,
            'info' => $this->findingInfo($dailyBriefing),
            'logo' => is_file($logoPath)
                ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath))
                : null,
        ])->setPaper('a4', 'landscape');

        $slug = Str::slug($dailyBriefing->judul);

        return $pdf->download("Material-Temuan-{$slug}-{$dailyBriefing->id}.pdf");
    }

    public function exportFindingsExcel(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['findings']);
        $info = $this->findingInfo($dailyBriefing);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Material Temuan');

        $thin = ['borderStyle' => Border::BORDER_THIN];
        $center = Alignment::HORIZONTAL_CENTER;

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
            ['Tanggal Terbit', ': '.Carbon::parse($dailyBriefing->tanggal)->format('d-m-Y')],
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

        $kiri = [
            ['JUDUL RAPAT', $info['judul_rapat']],
            ['JENIS RAPAT', $info['tipe_rapat']],
            ['TANGGAL RAPAT', $info['tanggal_rapat']],
        ];
        $kanan = [
            ['UNIT', $info['unit']],
            ['JENIS INSPEKSI', $info['jenis_inspeksi']],
            ['JUMLAH TEMUAN', count($dailyBriefing->findings).' item'],
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
        foreach ($dailyBriefing->findings as $idx => $f) {
            $sheet->getRowDimension($row)->setRowHeight(90);
            $sheet->setCellValue("A{$row}", $idx + 1);
            $sheet->setCellValue("B{$row}", $f->tanggal ? Carbon::parse($f->tanggal)->format('d-m-Y') : '');
            $sheet->setCellValue("C{$row}", $f->uraian);
            $sheet->setCellValue("D{$row}", $f->part_number);
            $sheet->setCellValue("E{$row}", $f->qty);
            $sheet->setCellValue("F{$row}", $f->satuan);
            $sheet->setCellValue("H{$row}", $f->keterangan);
            $sheet->setCellValue("I{$row}", $f->tindak_lanjut);
            $sheet->setCellValue("J{$row}", strtoupper($f->target));

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
        $slug = Str::slug($dailyBriefing->judul);
        $filename = "Material-Temuan-{$slug}-{$dailyBriefing->id}.xlsx";

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    // --- KICKOFF ---
    private function kickoffDefaults(DailyBriefing $dailyBriefing): array
    {
        return [
            'nomor_dokumen' => 'FMKP - 145 - 13.3.4.a.a.i - 001',
            'revisi' => '001',
            'pimpinan_rapat' => 'TL Outage Management UP Kendari',
            'tempat' => $dailyBriefing->lokasi ?: 'Room Zoom UP Kendari',
            'waktu' => ($dailyBriefing->waktu_mulai ? substr($dailyBriefing->waktu_mulai, 0, 5) : '09.00').' WITA - Selesai',
            'agenda' => trim("Kick Off Meeting {$dailyBriefing->judul}"),
            'peserta' => '(Daftar peserta terlampir)',
            'pimpinan_nama' => 'ABDUL RAHMAN KADIR',
            'pimpinan_jabatan' => 'TL Outage Management',
            'notulis_nama' => 'FIRMANSYAH',
            'notulis_jabatan' => 'OF Outage Management',
            'kota_ttd' => 'Kendari',
        ];
    }

    public function storeKickoff(Request $request, DailyBriefing $dailyBriefing)
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

        DailyBriefingKickoff::updateOrCreate(
            ['daily_briefing_id' => $dailyBriefing->id],
            $validated
        );

        return redirect()->back()->with('success', 'Notulen Kick Off Meeting berhasil disimpan.');
    }

    public function storeKickoffPhoto(Request $request, DailyBriefing $dailyBriefing)
    {
        $request->validate([
            'foto' => 'required|image|max:8192',
            'caption' => 'nullable|string|max:255',
        ]);

        $encoded = $this->encodePhoto($request->file('foto'));
        if ($encoded === null) {
            return redirect()->back()->with('error', 'Foto tidak dapat diproses.');
        }

        $dailyBriefing->kickoffPhotos()->create([
            'foto' => $encoded,
            'caption' => $request->input('caption'),
        ]);

        return redirect()->back()->with('success', 'Dokumentasi berhasil ditambahkan.');
    }

    public function destroyKickoffPhoto(DailyBriefing $dailyBriefing, DailyBriefingKickoffPhoto $photo)
    {
        abort_unless($photo->daily_briefing_id === $dailyBriefing->id, 404);
        $photo->delete();

        return redirect()->back()->with('success', 'Dokumentasi berhasil dihapus.');
    }

    public function exportKickoffPdf(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['kickoff', 'kickoffPhotos', 'attendees']);
        $logoPath = public_path('sidebar-logo.png');

        $pdf = Pdf::loadView('exports.briefing-kickoff', [
            'meeting' => $dailyBriefing,
            'kickoff' => $dailyBriefing->kickoff,
            'photos' => $dailyBriefing->kickoffPhotos,
            'attendees' => $dailyBriefing->attendees,
            'defaults' => $this->kickoffDefaults($dailyBriefing),
            'attendUrl' => $this->attendUrl($dailyBriefing),
            'logo' => is_file($logoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath)) : null,
        ])->setPaper('a4', 'portrait');

        $slug = Str::slug($dailyBriefing->judul);

        return $pdf->download("Notulen-Kick-Off-{$slug}-{$dailyBriefing->id}.pdf");
    }

    public function exportKickoffExcel(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['kickoff', 'kickoffPhotos', 'attendees']);
        $slug = Str::slug($dailyBriefing->judul);

        return Excel::download(
            new BriefingKickoffExport(
                $dailyBriefing,
                $dailyBriefing->kickoff,
                $dailyBriefing->kickoffPhotos,
                $dailyBriefing->attendees,
                $this->kickoffDefaults($dailyBriefing),
                $this->attendUrl($dailyBriefing),
            ),
            "Notulen-Kick-Off-{$slug}-{$dailyBriefing->id}.xlsx"
        );
    }
}
