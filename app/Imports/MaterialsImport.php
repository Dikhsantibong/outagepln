<?php

namespace App\Imports;

use App\Models\Material;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Impor master material dari berkas Excel/CSV berdasarkan template
 * MaterialTemplateExport (kolom: Nama Material, Jenis Mesin, Part Number, Satuan).
 *
 * Baris tanpa nama dilewati. Material dianggap ganda — dan ikut dilewati — bila
 * kombinasi nama + jenis mesin sudah ada di basis data atau sudah muncul pada
 * berkas yang sama, mengikuti aturan keunikan pada MaterialController.
 */
class MaterialsImport implements ToCollection, WithHeadingRow
{
    public int $imported = 0;

    public int $skipped = 0;

    /**
     * Kunci unik (nama|jenis_mesin) yang sudah ada di basis data, dinormalisasi.
     *
     * @var array<string, true>
     */
    private array $existingKeys = [];

    public function __construct()
    {
        Material::query()
            ->select('nama', 'jenis_mesin')
            ->get()
            ->each(fn (Material $material) => $this->existingKeys[$this->key($material->nama, $material->jenis_mesin)] = true);
    }

    public function collection(Collection $rows): void
    {
        $now = Carbon::now();
        $batch = [];

        foreach ($rows as $row) {
            $nama = trim((string) ($row['nama_material'] ?? $row['nama'] ?? ''));

            if ($nama === '') {
                continue;
            }

            $jenisMesin = $this->clean($row['jenis_mesin'] ?? null);
            $key = $this->key($nama, $jenisMesin);

            if (isset($this->existingKeys[$key])) {
                $this->skipped++;

                continue;
            }

            $this->existingKeys[$key] = true;

            $batch[] = [
                'nama' => $nama,
                'jenis_mesin' => $jenisMesin,
                'part_number' => $this->clean($row['part_number'] ?? null),
                'satuan' => $this->clean($row['satuan'] ?? null),
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $this->imported++;
        }

        foreach (array_chunk($batch, 200) as $chunk) {
            Material::insert($chunk);
        }
    }

    /**
     * Rapikan nilai sel opsional menjadi string terpangkas atau null.
     */
    private function clean(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));

        return $value === '' ? null : $value;
    }

    /**
     * Bentuk kunci unik yang tidak sensitif huruf besar/kecil.
     */
    private function key(string $nama, ?string $jenisMesin): string
    {
        return mb_strtolower(trim($nama)).'|'.mb_strtolower(trim((string) $jenisMesin));
    }
}
