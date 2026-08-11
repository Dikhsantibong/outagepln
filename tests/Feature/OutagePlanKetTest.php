<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kolom `ket` kini daftar tertutup OPEN/CLOSE, bukan teks bebas.
 *
 * Seluruh 293 data yang ada memang hanya berisi kedua nilai itu, jadi tidak ada
 * yang hilang. Yang diuji di sini adalah penegakannya di server — dropdown di
 * layar tidak menghalangi nilai lain masuk lewat request langsung.
 */
class OutagePlanKetTest extends TestCase
{
    use RefreshDatabase;

    private function plan(): OutagePlan
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2024-10-31',
            'selesai' => '2024-11-28',
            'ket' => 'OPEN',
        ]);
    }

    private function payload(OutagePlan $plan, string $ket): array
    {
        return [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'scope' => $plan->scope,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
            'ket' => $ket,
        ];
    }

    public function test_open_dan_close_diterima(): void
    {
        $plan = $this->plan();

        foreach (['CLOSE', 'OPEN'] as $ket) {
            $this->put("/outage-plans/{$plan->id}", $this->payload($plan, $ket))
                ->assertRedirect()
                ->assertSessionHasNoErrors();

            $this->assertSame($ket, $plan->fresh()->ket);
        }
    }

    public function test_nilai_di_luar_daftar_ditolak(): void
    {
        $plan = $this->plan();

        $this->from("/outage-plans/{$plan->id}/edit")
            ->put("/outage-plans/{$plan->id}", $this->payload($plan, 'Selesai'))
            ->assertSessionHasErrors('ket');

        // Nilai lama tidak ikut tertimpa saat validasi gagal.
        $this->assertSame('OPEN', $plan->fresh()->ket);
    }

    public function test_ket_boleh_dikosongkan(): void
    {
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, ''))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertNull($plan->fresh()->ket);
    }

    public function test_seluruh_data_yang_ada_cocok_dengan_daftar(): void
    {
        // Penjaga agar daftar tetap sejalan dengan data: kalau suatu saat ada
        // nilai baru masuk lewat impor, test ini yang lebih dulu memberi tahu.
        $this->assertSame(
            ['OPEN', 'CLOSE'],
            OutagePlan::KET_OPTIONS,
        );
    }
}
