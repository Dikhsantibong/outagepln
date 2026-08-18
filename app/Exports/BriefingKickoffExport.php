<?php

namespace App\Exports;

use App\Models\DailyBriefing;
use App\Models\DailyBriefingKickoff;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Notulen Kick Off (FORMULIR NOTULEN RAPAT) versi Excel.
 *
 * Isi dan tata letaknya mengikuti versi PDF (exports.meeting-kickoff): kop,
 * meta, pembahasan berpoin (PLN / mitra / hasil kesepakatan), lampiran, dan
 * tanda tangan. Foto dokumentasi (data URI) tertanam lewat <img> di blade,
 * sedangkan logo ditempel sebagai gambar mengambang di sel kop.
 */
class BriefingKickoffExport implements FromView, WithColumnWidths, WithDrawings, WithStyles
{
    public function __construct(
        protected DailyBriefing $meeting,
        protected ?DailyBriefingKickoff $kickoff,
        protected $photos,
        protected $attendees,
        protected array $defaults,
        protected string $attendUrl = ''
    ) {}

    public function view(): View
    {
        return view('exports.briefing-kickoff-excel', [
            'meeting' => $this->meeting,
            'kickoff' => $this->kickoff,
            'photos' => $this->photos,
            'attendees' => $this->attendees,
            'defaults' => $this->defaults,
            'attendUrl' => $this->attendUrl,
        ]);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,   // nomor poin
            'B' => 34,  // isi poin / label meta
            'C' => 16,
            'D' => 16,
            'E' => 16,
            'F' => 18,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getStyle($sheet->calculateWorksheetDimension())
            ->getAlignment()->setVertical(Alignment::VERTICAL_TOP);

        // Kolom isi poin dibungkus agar uraian panjang turun ke bawah.
        $sheet->getStyle('B')->getAlignment()->setWrapText(true);

        return [];
    }

    public function drawings(): array
    {
        $logo = public_path('sidebar-logo.png');

        if (! is_file($logo)) {
            return [];
        }

        // Logo pada kop, mengambang di sel A1 (baris kop dibuat cukup tinggi
        // di blade agar logo tidak turun menimpa isi).
        $drawing = new Drawing;
        $drawing->setName('Logo');
        $drawing->setDescription('Logo PLN');
        $drawing->setPath($logo);
        $drawing->setHeight(46);
        $drawing->setCoordinates('A1');
        $drawing->setOffsetX(6);
        $drawing->setOffsetY(5);

        return [$drawing];
    }
}
