<?php

namespace App\Http\Controllers;

use App\Models\DailyMeeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingFinding;
use App\Models\MeetingMinute;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class DailyMeetingController extends Controller
{
    public function index()
    {
        $meetings = DailyMeeting::withCount('attendees')
            ->latest()
            ->get();

        return Inertia::render('daily-meetings/index', [
            'meetings' => $meetings,
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
        $dailyMeeting->load(['attendees', 'minutes', 'findings', 'outagePlan']);

        return Inertia::render('daily-meetings/show', [
            'meeting' => $dailyMeeting,
            'attendees' => $dailyMeeting->attendees,
            'minutes' => $dailyMeeting->minutes,
            'findings' => $dailyMeeting->findings,
            'findingInfo' => $this->findingInfo($dailyMeeting),
        ]);
    }

    /**
     * Header context for the "Material Temuan" form: the unit and inspection
     * type are inherited from the outage plan this meeting belongs to.
     */
    private function findingInfo(DailyMeeting $dailyMeeting): array
    {
        $plan = $dailyMeeting->outagePlan;

        return [
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

    public function storeMinutes(Request $request, DailyMeeting $dailyMeeting)
    {
        if ($dailyMeeting->status === 'completed') {
            return redirect()->back()->with('error', 'Rapat sudah selesai. Notulen tidak dapat diedit.');
        }

        $validated = $request->validate([
            'agenda' => 'nullable|string',
            'latar_belakang' => 'nullable|string',
            'pembahasan' => 'nullable|string',
            'hasil_kesepakatan' => 'nullable|string',
        ]);

        MeetingMinute::updateOrCreate(
            ['meeting_id' => $dailyMeeting->id],
            $validated
        );

        return redirect()->back()->with('success', 'Notulen berhasil disimpan.');
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

        // --- Unit / inspection block -------------------------------------
        $sheet->setCellValue('B6', 'UNIT');
        $sheet->setCellValue('D6', ': ' . $info['unit']);
        $sheet->setCellValue('B7', 'JENIS INSPEKSI');
        $sheet->setCellValue('D7', ': ' . $info['jenis_inspeksi']);
        $sheet->getStyle('B6:B7')->getFont()->setBold(true);
        $sheet->getStyle('D6:D7')->getFont()->getColor()->setRGB('C00000');

        // --- Table ---------------------------------------------------------
        $headRow = 9;
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

        return "Material-Temuan-{$slug}-{$dailyMeeting->id}.{$ext}";
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

    public function destroy(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->delete();
        return redirect()->route('daily-meetings.index')->with('success', 'Meeting berhasil dihapus.');
    }
}
