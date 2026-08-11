<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DailyProgressPhotoTest extends TestCase
{
    use RefreshDatabase;

    private function plan(): OutagePlan
    {
        $this->actingAs(User::factory()->create());

        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2024-10-31',
            'selesai' => '2024-11-28',
        ]);
    }

    private function payload(OutagePlan $plan, array $daily): array
    {
        return [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'scope' => $plan->scope,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
            'daily_progress' => $daily,
        ];
    }

    /** @return array<int, string> path foto yang tersimpan pada tanggal itu */
    private function fotoTersimpan(OutagePlan $plan, string $tanggal): array
    {
        return $plan->dailyProgresses()->where('tanggal', $tanggal)->value('photos') ?? [];
    }

    public function test_foto_baru_tersimpan_pada_baris_hariannya(): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            [
                'tanggal' => '2024-11-05',
                'plan_progress' => '20',
                'actual_progress' => '20',
                'new_photos' => [
                    UploadedFile::fake()->image('sebelum.jpg'),
                    UploadedFile::fake()->image('sesudah.jpg'),
                ],
            ],
        ]))->assertRedirect()->assertSessionHasNoErrors();

        $photos = $this->fotoTersimpan($plan, '2024-11-05');

        $this->assertCount(2, $photos);

        foreach ($photos as $path) {
            Storage::disk('public')->assertExists($path);
        }
    }

    /**
     * Foto yang dilepas harus hilang dari catatan DAN dari disk. Sebelumnya
     * berkasnya tetap tertinggal dan terus memakan penyimpanan meski sudah
     * tidak dirujuk siapa pun.
     */
    public function test_foto_yang_dihapus_ikut_dibuang_dari_disk(): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            [
                'tanggal' => '2024-11-05',
                'plan_progress' => '20',
                'actual_progress' => '20',
                'new_photos' => [
                    UploadedFile::fake()->image('a.jpg'),
                    UploadedFile::fake()->image('b.jpg'),
                ],
            ],
        ]))->assertRedirect();

        [$dibuang, $disimpan] = $this->fotoTersimpan($plan, '2024-11-05');

        // Simpan ulang dengan hanya satu foto yang dipertahankan.
        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            [
                'tanggal' => '2024-11-05',
                'plan_progress' => '20',
                'actual_progress' => '20',
                'retained_photos' => [$disimpan],
            ],
        ]))->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame([$disimpan], $this->fotoTersimpan($plan, '2024-11-05'));
        Storage::disk('public')->assertExists($disimpan);
        Storage::disk('public')->assertMissing($dibuang);
    }

    /** Mengganti foto = melepas yang lama dan mengunggah penggantinya sekaligus. */
    public function test_mengganti_foto_menghapus_yang_lama_dan_menyimpan_yang_baru(): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            [
                'tanggal' => '2024-11-05',
                'plan_progress' => '20',
                'actual_progress' => '20',
                'new_photos' => [UploadedFile::fake()->image('lama.jpg')],
            ],
        ]))->assertRedirect();

        [$lama] = $this->fotoTersimpan($plan, '2024-11-05');

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            [
                'tanggal' => '2024-11-05',
                'plan_progress' => '20',
                'actual_progress' => '20',
                // retained_photos kosong: yang lama dilepas, diganti yang baru.
                'new_photos' => [UploadedFile::fake()->image('baru.jpg')],
            ],
        ]))->assertRedirect()->assertSessionHasNoErrors();

        $photos = $this->fotoTersimpan($plan, '2024-11-05');

        $this->assertCount(1, $photos);
        $this->assertNotSame($lama, $photos[0]);
        Storage::disk('public')->assertMissing($lama);
        Storage::disk('public')->assertExists($photos[0]);
    }

    public function test_berkas_bukan_gambar_ditolak(): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $this->from("/outage-plans/{$plan->id}/edit")
            ->put("/outage-plans/{$plan->id}", $this->payload($plan, [
                [
                    'tanggal' => '2024-11-05',
                    'plan_progress' => '20',
                    'actual_progress' => '20',
                    'new_photos' => [
                        UploadedFile::fake()->create('dokumen.pdf', 100, 'application/pdf'),
                    ],
                ],
            ]))
            ->assertSessionHasErrors();

        $this->assertEmpty(Storage::disk('public')->allFiles());
    }
}
