<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Setiap listing harus terbuka di tahun berjalan, bukan menampilkan seluruh
 * tahun sekaligus, dan pilihan "Semua tahun" harus bertahan.
 */
class TahunFilterTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{0: string}> */
    public static function listingProvider(): array
    {
        return [
            'perencanaan outage' => ['/outage-plans'],
            'on quality' => ['/kinerja/on-quality'],
            'on time' => ['/kinerja/on-time'],
            'on cost' => ['/kinerja/on-cost'],
        ];
    }

    private function seedPlans(): int
    {
        $this->actingAs(User::factory()->create());
        $tahunIni = now()->year;

        foreach (["{$tahunIni}-03-01", "{$tahunIni}-09-01", '2023-05-01'] as $tanggal) {
            OutagePlan::create([
                'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
                'scope' => 'SO',
                'jenis_pembangkit' => 'PLTD',
                'start_date' => $tanggal,
            ]);
        }

        return $tahunIni;
    }

    #[DataProvider('listingProvider')]
    public function test_listing_terbuka_di_tahun_berjalan(string $url): void
    {
        $tahunIni = $this->seedPlans();

        $this->get($url)->assertInertia(fn ($page) => $page
            ->where('filters.tahun', (string) $tahunIni)
            ->where('outagePlans.total', 2));
    }

    #[DataProvider('listingProvider')]
    public function test_semua_tahun_bisa_dipilih(string $url): void
    {
        $this->seedPlans();

        $this->get($url . '?tahun=semua')->assertInertia(fn ($page) => $page
            ->where('filters.tahun', 'semua')
            ->where('outagePlans.total', 3));
    }

    #[DataProvider('listingProvider')]
    public function test_tahun_lain_bisa_dipilih(string $url): void
    {
        $this->seedPlans();

        $this->get($url . '?tahun=2023')->assertInertia(fn ($page) => $page
            ->where('filters.tahun', '2023')
            ->where('outagePlans.total', 1));
    }

    // Catatan: halaman /daily-meetings kini beralih ke alur berpandu (pilih mesin
    // dulu, bukan daftar rapat berfilter tahun), jadi asersi filter tahun untuk
    // halaman itu dihapus — perilakunya memang sudah tidak berlaku di sana.
}
