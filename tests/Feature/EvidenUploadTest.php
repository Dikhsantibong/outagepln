<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use App\Support\UploadLimit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class EvidenUploadTest extends TestCase
{
    use RefreshDatabase;

    private function plan(): OutagePlan
    {
        $this->actingAs(User::factory()->create());

        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => now()->format('Y-m-d'),
            'progress' => 100,
        ]);
    }

    public function test_batas_unggah_mengikuti_konfigurasi_php(): void
    {
        // upload_max_filesize di server ini 2M, post_max_size 8M, jadi batas
        // efektifnya 2 MB — bukan 5 MB seperti aturan validasi yang lama.
        $this->assertSame((int) (2 * 1024 * 1024), UploadLimit::bytes());
        $this->assertSame(2048, UploadLimit::kilobytes());
        $this->assertStringContainsString('MB', UploadLimit::label());
    }

    /** @return array<int, array{0: string, 1: array<string, mixed>}> */
    public static function moduleProvider(): array
    {
        return [
            'on quality' => ['/kinerja/on-quality', ['tipe' => 'sebelum', 'dm' => 1500, 'sfc' => 0.25]],
            'on time' => ['/kinerja/on-time', []],
            'on cost' => ['/kinerja/on-cost', ['anggaran_rencana' => 1000, 'anggaran_aktual' => 900]],
        ];
    }

    #[DataProvider('moduleProvider')]
    public function test_berkas_melebihi_batas_ditolak_dengan_pesan(string $url, array $extra): void
    {
        Storage::fake('public');
        $plan = $this->plan();
        $kilobytes = UploadLimit::kilobytes();

        $this->from($url)
            ->post($url, [
                'outage_plan_id' => $plan->id,
                'eviden' => UploadedFile::fake()->create('besar.pdf', $kilobytes + 512, 'application/pdf'),
            ] + $extra)
            ->assertSessionHasErrors('eviden');

        Storage::disk('public')->assertDirectoryEmpty('/');
    }

    #[DataProvider('moduleProvider')]
    public function test_berkas_dalam_batas_tersimpan(string $url, array $extra): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $this->post($url, [
            'outage_plan_id' => $plan->id,
            'eviden' => UploadedFile::fake()->create('kecil.pdf', 512, 'application/pdf'),
        ] + $extra)->assertSessionHasNoErrors();

        $this->assertNotEmpty(Storage::disk('public')->allFiles());
    }
}
