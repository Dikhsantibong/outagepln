<?php

namespace Database\Factories;

use App\Models\Material;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    protected $model = Material::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama' => strtoupper($this->faker->unique()->words(2, true)),
            'jenis_mesin' => $this->faker->randomElement([
                'Mesin Deutz Type BV 8M 628 (Major Overhaul)',
                'Mesin Mitsubishi (Major Overhaul)',
                'Mesin Cummins Type KTA 50 G8 (Final Stage)',
            ]),
            'part_number' => $this->faker->numerify('########'),
            'satuan' => $this->faker->randomElement(['Pcs', 'Set', 'Bh', 'Liter']),
        ];
    }
}
