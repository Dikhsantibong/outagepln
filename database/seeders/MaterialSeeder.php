<?php

namespace Database\Seeders;

use App\Models\Material;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class MaterialSeeder extends Seeder
{
    /**
     * Seed the materials table from the consolidated overhaul material dataset.
     */
    public function run(): void
    {
        $path = __DIR__.'/materials.json';

        /** @var array<int, array{nama: string, jenis_mesin: ?string, part_number: ?string, satuan: ?string}> $materials */
        $materials = json_decode(file_get_contents($path), true);

        $now = Carbon::now();

        $rows = array_map(fn (array $material): array => [
            'nama' => $material['nama'],
            'jenis_mesin' => $material['jenis_mesin'] ?? null,
            'part_number' => $material['part_number'] ?? null,
            'satuan' => $material['satuan'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ], $materials);

        foreach (array_chunk($rows, 200) as $chunk) {
            Material::insert($chunk);
        }
    }
}
