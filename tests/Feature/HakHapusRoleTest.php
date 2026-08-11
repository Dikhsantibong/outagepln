<?php

namespace Tests\Feature;

use App\Models\DailyMeeting;
use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pengelola mengisi dan mengubah data, tapi tidak membuang catatan induk.
 *
 * Yang diuji di sini adalah penegakan di server. Menyembunyikan tombol di layar
 * tidak menghalangi siapa pun memanggil rutenya langsung, jadi pemeriksaan yang
 * sebenarnya harus ada di controller.
 */
class HakHapusRoleTest extends TestCase
{
    use RefreshDatabase;

    private function plan(string $mesin = 'PLTD POASIA #02 (MIRRLEES)'): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => $mesin,
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2024-10-31',
            'selesai' => '2024-11-28',
            'rapat_r2' => '2024-10-01',
        ]);
    }

    public function test_pengelola_tidak_boleh_menghapus_jadwal_outage(): void
    {
        $plan = $this->plan();
        $this->actingAs(User::factory()->create([
            'role' => 'pengelola',
            'merek' => 'MIRRLEES',
        ]));

        $this->delete("/outage-plans/{$plan->id}")->assertForbidden();

        $this->assertDatabaseHas('outage_plans', ['id' => $plan->id]);
    }

    public function test_pengelola_tidak_boleh_menghapus_rapat(): void
    {
        $plan = $this->plan();
        $meeting = DailyMeeting::where('outage_plan_id', $plan->id)->firstOrFail();

        $this->actingAs(User::factory()->create([
            'role' => 'pengelola',
            'merek' => 'MIRRLEES',
        ]));

        $this->delete("/daily-meetings/{$meeting->id}")->assertForbidden();

        $this->assertDatabaseHas('daily_meetings', ['id' => $meeting->id]);
    }

    /** Pengelola tetap boleh mengubah data — yang dicabut hanya penghapusan. */
    public function test_pengelola_masih_boleh_mengubah_jadwal(): void
    {
        $plan = $this->plan();
        $this->actingAs(User::factory()->create([
            'role' => 'pengelola',
            'merek' => 'MIRRLEES',
        ]));

        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'scope' => $plan->scope,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
            'ket_realisasi' => 'Selesai',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame('Selesai', $plan->fresh()->ket_realisasi);
    }

    public function test_admin_tetap_boleh_menghapus(): void
    {
        $plan = $this->plan();
        $meeting = DailyMeeting::where('outage_plan_id', $plan->id)->firstOrFail();

        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $this->delete("/daily-meetings/{$meeting->id}")->assertRedirect();
        $this->assertDatabaseMissing('daily_meetings', ['id' => $meeting->id]);

        $this->delete("/outage-plans/{$plan->id}")->assertRedirect();
        $this->assertDatabaseMissing('outage_plans', ['id' => $plan->id]);
    }

    public function test_tamu_tidak_boleh_menghapus(): void
    {
        $plan = $this->plan();
        $this->actingAs(User::factory()->create(['role' => 'tamu']));

        $this->delete("/outage-plans/{$plan->id}")->assertForbidden();

        $this->assertDatabaseHas('outage_plans', ['id' => $plan->id]);
    }

    /** Admin tidak boleh menghapus mesin di luar mereknya lewat URL langsung. */
    public function test_pengelola_lain_tidak_bisa_menyentuh_merek_orang_lain(): void
    {
        $milikOrangLain = $this->plan('PLTD WUA-WUA #01 (CUMMINS)');

        $this->actingAs(User::factory()->create([
            'role' => 'admin',
            'merek' => 'MIRRLEES',
        ]));

        $this->delete("/outage-plans/{$milikOrangLain->id}")->assertForbidden();

        $this->assertDatabaseHas('outage_plans', ['id' => $milikOrangLain->id]);
    }

    public function test_izin_dibagikan_ke_frontend(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'pengelola', 'merek' => 'MIRRLEES']));

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('auth.can.delete', false)
            ->where('auth.can.write', true)
            // Rapat dikoordinasi terpusat, jadi menunya tidak untuk pengelola.
            ->where('auth.can.viewMeetings', false));

        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('auth.can.delete', true)
            ->where('auth.can.write', true)
            ->where('auth.can.viewMeetings', true));

        $this->actingAs(User::factory()->create(['role' => 'tamu']));

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('auth.can.delete', false)
            ->where('auth.can.write', false)
            ->where('auth.can.viewMeetings', true));
    }
}
