<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    /** @param array<int, string> $tanggalList */
    private function seedPlans(array $tanggalList): void
    {
        foreach ($tanggalList as $tanggal) {
            OutagePlan::create([
                'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
                'scope' => 'SO',
                'jenis_pembangkit' => 'PLTD',
                'start_date' => $tanggal,
            ]);
        }
    }

    public function test_filter_tahun_membatasi_data_dashboard(): void
    {
        $this->actingAs(User::factory()->create());
        $this->seedPlans(['2024-03-01', '2024-08-01', '2025-02-01']);

        $this->get(route('dashboard', ['tahun' => 2024]))
            ->assertInertia(fn ($page) => $page
                ->where('filters.tahun', '2024')
                ->where('tahunOptions', ['2025', '2024'])
                ->where('stats.total', 2));

        $this->get(route('dashboard', ['tahun' => 'semua']))
            ->assertInertia(fn ($page) => $page
                ->where('filters.tahun', 'semua')
                ->where('stats.total', 3));
    }

    public function test_dashboard_terbuka_di_tahun_berjalan_secara_default(): void
    {
        $this->actingAs(User::factory()->create());
        $tahunIni = now()->year;
        $this->seedPlans(["{$tahunIni}-03-01", '2024-08-01', '2024-09-01']);

        $this->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('filters.tahun', (string) $tahunIni)
                ->where('stats.total', 1));
    }

    public function test_jatuh_ke_tahun_terbaru_bila_tahun_berjalan_kosong(): void
    {
        $this->actingAs(User::factory()->create());
        $this->seedPlans(['2024-08-01', '2025-02-01', '2025-06-01']);

        // Tahun di luar data juga tidak boleh mengosongkan dashboard.
        foreach ([route('dashboard'), route('dashboard', ['tahun' => 1999])] as $url) {
            $this->get($url)->assertInertia(fn ($page) => $page
                ->where('filters.tahun', '2025')
                ->where('stats.total', 2));
        }
    }

    public function test_dashboard_tetap_terbuka_saat_belum_ada_data(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.tahun', 'semua')
                ->where('tahunOptions', []));
    }
}
