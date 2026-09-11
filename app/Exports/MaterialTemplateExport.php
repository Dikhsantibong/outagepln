<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Template Excel untuk impor master material.
 *
 * Baris header memakai judul yang ramah dibaca; saat diimpor, Laravel Excel
 * meng-slug-kan judul menjadi kunci (nama_material, jenis_mesin, dst.) yang
 * dibaca oleh MaterialsImport. Dua baris contoh disertakan sebagai panduan
 * pengisian dan boleh dihapus oleh pengguna sebelum mengunggah.
 */
class MaterialTemplateExport implements FromArray, WithColumnWidths, WithHeadings, WithStyles
{
    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Nama Material', 'Jenis Mesin', 'Part Number', 'Satuan'];
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function array(): array
    {
        return [
            ['GASKET', 'Mesin Mitsubishi (Major Overhaul)', '02086208', 'Pcs'],
            ['O-SEAL', 'Mesin Deutz Type BV 8M 628 (Major Overhaul)', '01166140', 'Pcs'],
        ];
    }

    /**
     * @return array<string, int>
     */
    public function columnWidths(): array
    {
        return [
            'A' => 45,
            'B' => 45,
            'C' => 22,
            'D' => 12,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
