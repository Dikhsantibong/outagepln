<?php
// Temporary script to append methods
$file = 'd:\PROJECT_GROUP\outage\app\Http\Controllers\DailyBriefingController.php';
$content = file_get_contents($file);
$methods = <<<'EOD'

    // --- TEMUAN ---
    private function findingInfo(DailyBriefing $dailyBriefing): array
    {
        return [
            'judul_rapat' => $dailyBriefing->judul ?: '-',
            'tipe_rapat' => '-', 
            'tanggal_rapat' => $dailyBriefing->tanggal
                ? \Carbon\Carbon::parse($dailyBriefing->tanggal)->translatedFormat('d F Y')
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
        $validated['target'] = $validated['target'] ?: 'Open';

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

        $validated['target'] = $validated['target'] ?: 'Open';
        $finding->update($validated);

        return redirect()->back()->with('success', 'Temuan berhasil diperbarui.');
    }

    public function destroyFinding(DailyBriefing $dailyBriefing, DailyBriefingFinding $finding)
    {
        abort_unless($finding->daily_briefing_id === $dailyBriefing->id, 404);
        $finding->delete();
        return redirect()->back()->with('success', 'Temuan berhasil dihapus.');
    }

    private function encodePhoto(?\Illuminate\Http\UploadedFile $file): ?string
    {
        if (! $file) return null;
        $source = @imagecreatefromstring(file_get_contents($file->getRealPath()));
        if ($source === false) return null;

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

    public function exportFindingsPdf(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['findings']);
        $logoPath = public_path('sidebar-logo.png');

        $pdf = Pdf::loadView('exports.briefing-findings', [
            'meeting' => $dailyBriefing,
            'findings' => $dailyBriefing->findings,
            'info' => $this->findingInfo($dailyBriefing),
            'logo' => is_file($logoPath)
                ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
                : null,
        ])->setPaper('a4', 'landscape');

        $slug = \Illuminate\Support\Str::slug($dailyBriefing->judul);
        return $pdf->download("Material-Temuan-{$slug}-{$dailyBriefing->id}.pdf");
    }

    public function exportFindingsExcel(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['findings']);
        $info = $this->findingInfo($dailyBriefing);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Material Temuan');

        $thin = ['borderStyle' => Border::BORDER_THIN];
        $center = Alignment::HORIZONTAL_CENTER;

        $sheet->mergeCells('A1:C4');
        $logoPath = public_path('sidebar-logo.png');
        if (is_file($logoPath)) {
            $logo = new MemoryDrawing();
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
            ['Tanggal Terbit', ': ' . \Carbon\Carbon::parse($dailyBriefing->tanggal)->format('d-m-Y')],
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
            ['JUMLAH TEMUAN', count($dailyBriefing->findings) . ' item'],
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
            $sheet->setCellValue("B{$row}", $f->tanggal ? \Carbon\Carbon::parse($f->tanggal)->format('d-m-Y') : '');
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
        $slug = \Illuminate\Support\Str::slug($dailyBriefing->judul);
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
            'waktu' => ($dailyBriefing->waktu_mulai ? substr($dailyBriefing->waktu_mulai, 0, 5) : '09.00') . ' WITA - Selesai',
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
        if ($encoded === null) return redirect()->back()->with('error', 'Foto tidak dapat diproses.');

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
            'logo' => is_file($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : null,
        ])->setPaper('a4', 'portrait');

        $slug = \Illuminate\Support\Str::slug($dailyBriefing->judul);
        return $pdf->download("Notulen-Kick-Off-{$slug}-{$dailyBriefing->id}.pdf");
    }

    public function exportKickoffExcel(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['kickoff', 'kickoffPhotos', 'attendees']);
        $slug = \Illuminate\Support\Str::slug($dailyBriefing->judul);

        return \Maatwebsite\Excel\Facades\Excel::download(
            new BriefingKickoffExport(
                $dailyBriefing,
                $dailyBriefing->kickoff,
                $dailyBriefing->kickoffPhotos,
                $dailyBriefing->attendees,
                $this->kickoffDefaults($dailyBriefing)
            ),
            "Notulen-Kick-Off-{$slug}-{$dailyBriefing->id}.xlsx"
        );
    }
EOD;

$content = preg_replace('/}\s*$/', $methods . "\n}\n", $content);
file_put_contents($file, $content);
echo "Appended methods successfully.";
