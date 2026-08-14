<?php

namespace App\Http\Controllers;

use App\Models\DailyMeeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingFinding;
use App\Models\MeetingKickoff;
use App\Models\MeetingKickoffPhoto;
use App\Models\OutagePlan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class DailyMeetingController extends Controller
{
    /**
     * Halaman depan Daily Meeting: alur berpandu, bukan daftar semua rapat.
     *
     * Sebelumnya seluruh rapat (ribuan) ditumpahkan sekaligus. Kini pengguna
     * memilih mesin dulu (langkah 1); setelah itu lima jadwal rapat mesin
     * tersebut (P1–P3, R2, R3) ditampilkan untuk dipilih lalu dimulai (langkah 2).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        // Akun pengelola merek hanya melihat mesin merek yang dikelolanya.
        $merek = $user && filled($user->merek) ? $user->merek : null;

        // Langkah 1 — daftar mesin: satu kartu per outage plan yang punya rapat,
        // dikelompokkan agar halaman tidak menumpahkan seluruh rapat sekaligus.
        $machines = DB::table('daily_meetings as dm')
            ->join('outage_plans as op', 'dm.outage_plan_id', '=', 'op.id')
            ->when($merek, fn ($q) => $q->where('op.merek', $merek))
            ->groupBy('op.id', 'op.mesin_pembangkit', 'op.scope', 'op.jenis_pembangkit')
            ->orderBy('op.mesin_pembangkit')
            ->get([
                'op.id as plan_id',
                'op.mesin_pembangkit as mesin',
                'op.scope as scope',
                'op.jenis_pembangkit as jenis',
                DB::raw('COUNT(dm.id) as jumlah'),
                DB::raw('MIN(dm.tanggal) as mulai'),
                DB::raw("SUM(CASE WHEN dm.status = 'completed' THEN 1 ELSE 0 END) as selesai"),
            ]);

        // Langkah 2 — mesin terpilih beserta jadwal rapatnya, terurut P1→R3.
        $selected = null;
        if ($request->filled('plan')) {
            $plan = OutagePlan::find($request->input('plan'));

            if ($plan && (! $merek || $plan->merek === $merek)) {
                // Diurutkan di PHP (lima baris) agar tidak bergantung FIELD() yang
                // hanya ada di MySQL — SQLite dipakai pada test.
                $urutan = ['RAPAT P1' => 1, 'RAPAT P2' => 2, 'RAPAT P3' => 3, 'RAPAT R2' => 4, 'RAPAT R3' => 5];

                $meetings = DailyMeeting::where('outage_plan_id', $plan->id)
                    ->withCount('attendees')
                    ->get()
                    ->sortBy(fn ($m) => $urutan[$m->tipe_rapat] ?? 99)
                    ->values();

                $selected = [
                    'plan_id' => $plan->id,
                    'mesin' => $plan->mesin_pembangkit,
                    'scope' => $plan->scope,
                    'jenis' => $plan->jenis_pembangkit,
                    'meetings' => $meetings,
                ];
            }
        }

        return Inertia::render('daily-meetings/index', [
            'machines' => $machines,
            'selected' => $selected,
        ]);
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

    public function show(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['attendees', 'findings', 'outagePlan', 'kickoff', 'kickoffPhotos']);

        return Inertia::render('daily-meetings/show', [
            'meeting' => $dailyMeeting,
            'attendees' => $dailyMeeting->attendees,
            'findings' => $dailyMeeting->findings,
            'findingInfo' => $this->findingInfo($dailyMeeting),
            'kickoff' => $dailyMeeting->kickoff,
            'kickoffPhotos' => $dailyMeeting->kickoffPhotos,
            'kickoffDefaults' => $this->kickoffDefaults($dailyMeeting),
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
            'waktu' => ($dailyMeeting->waktu_mulai ? substr($dailyMeeting->waktu_mulai, 0, 5) : '09.00') . ' WITA - Selesai',
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

    public function destroyKickoffPhoto(DailyMeeting $dailyMeeting, MeetingKickoffPhoto $photo)
    {
        abort_unless($photo->meeting_id === $dailyMeeting->id, 404);

        $photo->delete();

        return redirect()->back()->with('success', 'Dokumentasi berhasil dihapus.');
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
            'defaults' => $this->kickoffDefaults($dailyMeeting),
            'logo' => is_file($logoPath)
                ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
                : null,
        ])->setPaper('a4', 'portrait');

        $slug = \Illuminate\Support\Str::slug($dailyMeeting->outagePlan->mesin_pembangkit ?? $dailyMeeting->judul);

        return $pdf->download("Notulen-Kick-Off-{$slug}-{$dailyMeeting->id}.pdf");
    }

    /**
     * Notulen Kick Off versi Excel — isi dan tata letaknya mengikuti versi PDF
     * (FORMULIR NOTULEN RAPAT), hanya berformat spreadsheet.
     */
    public function exportKickoffExcel(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['kickoff', 'kickoffPhotos', 'attendees', 'outagePlan']);

        $slug = \Illuminate\Support\Str::slug($dailyMeeting->outagePlan->mesin_pembangkit ?? $dailyMeeting->judul);

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\MeetingKickoffExport(
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
                ? \Carbon\Carbon::parse($dailyMeeting->tanggal)->translatedFormat('d F Y')
                : '-',
            'unit' => $plan->mesin_pembangkit ?? '-',
            'jenis_inspeksi' => $plan->scope ?? '-',
        ];
    }

    public function storeFinding(Request $request, DailyMeeting $dailyMeeting)
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
        $validated['target'] = $validated['target'] ?: 'Open';

        $dailyMeeting->findings()->create($validated);

        return redirect()->back()->with('success', 'Temuan berhasil ditambahkan.');
    }

    public function updateFinding(Request $request, DailyMeeting $dailyMeeting, MeetingFinding $finding)
    {
        abort_unless($finding->meeting_id === $dailyMeeting->id, 404);

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

        // Keep the existing photo when no replacement is uploaded.
        if ($request->hasFile('foto')) {
            $validated['foto'] = $this->encodePhoto($request->file('foto'));
        } else {
            unset($validated['foto']);
        }

        $validated['target'] = $validated['target'] ?: 'Open';
        $finding->update($validated);

        return redirect()->back()->with('success', 'Temuan berhasil diperbarui.');
    }

    public function destroyFinding(DailyMeeting $dailyMeeting, MeetingFinding $finding)
    {
        abort_unless($finding->meeting_id === $dailyMeeting->id, 404);

        $finding->delete();

        return redirect()->back()->with('success', 'Temuan berhasil dihapus.');
    }

    /**
     * Downscales an uploaded photo and returns it as a base64 data URI, keeping
     * rows light enough to embed directly into the PDF/Excel exports.
     */
    private function encodePhoto(?\Illuminate\Http\UploadedFile $file): ?string
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

        return 'data:image/jpeg;base64,' . base64_encode($data);
    }

    public function qrDisplay(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->loadCount('attendees');

        return Inertia::render('daily-meetings/qr-display', [
            'meeting' => $dailyMeeting,
            'attendCount' => $dailyMeeting->attendees_count,
        ]);
    }

    public function attendForm(string $token)
    {
        $meeting = DailyMeeting::where('token', $token)->firstOrFail();

        return Inertia::render('attend', [
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
            'divisi' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'signature' => 'nullable|string',
        ]);

        MeetingAttendee::create([
            'meeting_id' => $meeting->id,
            'nama' => $validated['nama'],
            'divisi' => $validated['divisi'] ?? null,
            'jabatan' => $validated['jabatan'] ?? null,
            'signature' => $validated['signature'] ?? null,
            'signed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Kehadiran berhasil tercatat. Terima kasih!');
    }

    public function exportFindingsPdf(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['findings', 'outagePlan']);

        $logoPath = public_path('sidebar-logo.png');

        $pdf = Pdf::loadView('exports.meeting-findings', [
            'meeting' => $dailyMeeting,
            'findings' => $dailyMeeting->findings,
            'info' => $this->findingInfo($dailyMeeting),
            'logo' => is_file($logoPath)
                ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
                : null,
        ])->setPaper('a4', 'landscape');

        return $pdf->download($this->findingFilename($dailyMeeting, 'pdf'));
    }

    public function exportFindingsExcel(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['findings', 'outagePlan']);
        $info = $this->findingInfo($dailyMeeting);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Material Temuan');

        $thin = ['borderStyle' => Border::BORDER_THIN];
        $center = Alignment::HORIZONTAL_CENTER;

        // --- Document control header -------------------------------------
        $sheet->mergeCells('A1:C4');
        $logoPath = public_path('sidebar-logo.png');
        if (is_file($logoPath)) {
            $logo = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
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
            ['Tanggal Terbit', ': ' . \Carbon\Carbon::parse($dailyMeeting->tanggal)->format('d-m-Y')],
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
            ['JUMLAH TEMUAN', count($dailyMeeting->findings) . ' item'],
        ];

        foreach ($kiri as $i => [$label, $value]) {
            $r = 6 + $i;
            $sheet->setCellValue("A{$r}", $label);
            $sheet->setCellValue("C{$r}", ': ' . $value);
            $sheet->setCellValue("G{$r}", $kanan[$i][0]);
            $sheet->setCellValue("H{$r}", ': ' . $kanan[$i][1]);
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
            $sheet->setCellValue("B{$row}", $f->tanggal ? \Carbon\Carbon::parse($f->tanggal)->format('d-m-Y') : '');
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
                    $drawing = new MemoryDrawing();
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
        $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);

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
        $slug = \Illuminate\Support\Str::slug($dailyMeeting->outagePlan->mesin_pembangkit ?? $dailyMeeting->judul);
        // Jenis rapat ikut di nama berkas supaya beberapa rapat pada satu mesin
        // tidak menghasilkan berkas yang tampak sama.
        $tipe = \Illuminate\Support\Str::slug($dailyMeeting->tipe_rapat ?? '');

        return trim("Material-Temuan-{$slug}-{$tipe}", '-') . "-{$dailyMeeting->id}.{$ext}";
    }

    public function complete(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->update([
            'status' => 'completed',
            'waktu_selesai' => now()->format('H:i'),
        ]);

        return redirect()->back()->with('success', 'Meeting selesai.');
    }

    public function attendeesJson(DailyMeeting $dailyMeeting)
    {
        return response()->json([
            'count' => $dailyMeeting->attendees()->count(),
            'attendees' => $dailyMeeting->attendees()->latest()->get(['id', 'nama', 'divisi', 'jabatan', 'signed_at']),
        ]);
    }

    /** Hanya admin yang boleh membuang rapat; lihat User::canDeleteRecords(). */
    public function destroy(Request $request, DailyMeeting $dailyMeeting)
    {
        abort_unless($request->user()?->canDeleteRecords(), 403);

        $dailyMeeting->delete();

        return redirect()->route('daily-meetings.index')->with('success', 'Meeting berhasil dihapus.');
    }
}
