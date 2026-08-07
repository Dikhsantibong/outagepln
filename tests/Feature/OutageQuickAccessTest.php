<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutageQuickAccessTest extends TestCase
{
    use RefreshDatabase;

    private function plan(string $mesin = 'PLTD POASIA #02 (MIRRLEES)'): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => $mesin,
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'sistem' => 'KENDARI',
            'start_date' => now()->format('Y-m-d'),
            'selesai' => now()->addDays(2)->format('Y-m-d'),
            'durasi' => 3,
            'progress' => 60,
        ]);
    }

    public function test_dashboard_mengirim_daftar_quick_access(): void
    {
        $this->actingAs(User::factory()->create());
        $plan = $this->plan();

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('quickAccessPlans.0.id', $plan->id)
            ->where('quickAccessPlans.0.mesin', $plan->mesin_pembangkit)
            ->where('quickAccessPlans.0.sistem', 'KENDARI')
            ->where('quickAccessPlans.0.progress', 60));
    }

    public function test_detail_json_memuat_progress_harian_dan_ringkasan(): void
    {
        $this->actingAs(User::factory()->create());
        $plan = $this->plan();

        $plan->dailyProgresses()->createMany([
            ['tanggal' => now()->format('Y-m-d'), 'plan_progress' => 30, 'actual_progress' => 30],
            ['tanggal' => now()->addDay()->format('Y-m-d'), 'plan_progress' => 60, 'actual_progress' => 50],
        ]);

        $response = $this->getJson("/outage-plans/{$plan->id}/detail-json");

        $response->assertOk()
            ->assertJsonPath('outagePlan.id', $plan->id)
            ->assertJsonPath('overallPlan', 60)
            ->assertJsonPath('overallActual', 50)
            ->assertJsonPath('outagePlan.daily_progresses.0.status', 'On Progres')
            ->assertJsonPath('outagePlan.daily_progresses.1.status', 'Lagging');
    }

    /** Pengelola hanya boleh membuka detail mesin merek yang dikelolanya. */
    public function test_detail_json_menolak_mesin_di_luar_merek_pengelola(): void
    {
        $milikOrangLain = $this->plan('PLTD WUA-WUA #01 (CUMMINS)');

        $this->actingAs(User::factory()->create(['merek' => 'MIRRLEES']));

        $this->getJson("/outage-plans/{$milikOrangLain->id}/detail-json")
            ->assertForbidden();

        $milikSendiri = $this->plan();

        $this->getJson("/outage-plans/{$milikSendiri->id}/detail-json")
            ->assertOk();
    }
}
