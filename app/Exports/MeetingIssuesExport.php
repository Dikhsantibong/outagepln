<?php

namespace App\Exports;

use App\Models\DailyMeeting;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithDrawings;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class MeetingIssuesExport implements FromView, WithColumnWidths, WithStyles, WithDrawings
{
    protected $meeting;

    public function __construct(DailyMeeting $meeting)
    {
        $this->briefing = $meeting;
    }

    public function view(): View
    {
        return view('exports.meeting-issues-excel', [
            'briefing' => $this->briefing,
        ]);
    }

    /**
     * Lebar kolom tetap.
     *
     * Sebelumnya memakai ShouldAutoSize, yang membuat kolom permasalahan/solusi
     * melebar mengikuti teks terpanjang sehingga lembarnya jadi berantakan. Lebar
     * tetap membuat tata letaknya konsisten dan uraian panjang membungkus ke bawah.
     */
    public function columnWidths(): array
    {
        return [
            'A' => 6,   // No
            'B' => 42,  // Permasalahan
            'C' => 42,  // Tindak Lanjut / Solusi
            'D' => 16,  // Target
            'E' => 16,  // PIC
            'F' => 12,  // Status
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Seluruh sel rata atas supaya uraian panjang tidak menggantung di tengah.
        $sheet->getStyle($sheet->calculateWorksheetDimension())
            ->getAlignment()->setVertical(Alignment::VERTICAL_TOP);

        // Kolom uraian yang bisa panjang dibungkus, bukan melebar.
        $sheet->getStyle('B')->getAlignment()->setWrapText(true);
        $sheet->getStyle('C')->getAlignment()->setWrapText(true);

        return [];
    }

    public function drawings(): array
    {
        // Logo PLN pada kop, mengambang di sel logo A1:B3. Tingginya dijaga agar
        // muat dalam ketiga baris kop (masing-masing 22pt ≈ 88px) sehingga tidak
        // turun menimpa baris info di bawahnya.
        $drawing = new Drawing();
        $drawing->setName('Logo');
        $drawing->setDescription('Logo PLN');
        $drawing->setPath(public_path('sidebar-logo.png'));
        $drawing->setHeight(60);
        $drawing->setCoordinates('A1');
        $drawing->setOffsetX(6);
        $drawing->setOffsetY(6);

        return [$drawing];
    }
}
