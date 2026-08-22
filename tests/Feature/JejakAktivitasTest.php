<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\DailyBriefing;
use App\Models\Material;
use App\Models\OutagePlan;
use App\Models\User;
use App\Observers\ActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Menu Aktivitas: perekaman tambah/ubah/hapus dan pembatasan aksesnya.
 */
class JejakAktivitasTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => 'super_admin', 'name' => 'Bu Super']);
    }

    private function plan(): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2026-01-07',
            'selesai' => '2026-01-26',
        ]);
    }

    // -------------------------------------------------------- Perekaman

    public function test_penambahan_data_tercatat_beserta_pelakunya(): void
    {
        $user = $this->superAdmin();
        $this->actingAs($user);

        $plan = $this->plan();

        $log = ActivityLog::where('subject_type', OutagePlan::class)
            ->where('event', 'created')
            ->firstOrFail();

        $this->assertSame($user->id, $log->user_id);
        $this->assertSame('Bu Super', $log->user_nama);
        $this->assertSame('super_admin', $log->user_role);
        $this->assertSame('Outage Plan', $log->subject_label);
        $this->assertSame($plan->id, $log->subject_id);
        $this->assertSame('PLTD POASIA #02 (MIRRLEES)', $log->deskripsi);
    }

    public function test_perubahan_menyimpan_nilai_sebelum_dan_sesudah(): void
    {
        $this->actingAs($this->superAdmin());
        $plan = $this->plan();

        $plan->update(['scope' => 'ME']);

        $log = ActivityLog::where('subject_type', OutagePlan::class)
            ->where('event', 'updated')
            ->firstOrFail();

        $this->assertSame('SO', $log->perubahan['scope']['sebelum']);
        $this->assertSame('ME', $log->perubahan['scope']['sesudah']);

        // Kolom yang tidak disentuh tidak ikut dicatat.
        $this->assertArrayNotHasKey('mesin_pembangkit', $log->perubahan);
    }

    public function test_penyimpanan_tanpa_perubahan_tidak_menambah_catatan(): void
    {
        $this->actingAs($this->superAdmin());
        $plan = $this->plan();

        $sebelum = ActivityLog::where('event', 'updated')->count();

        $plan->update(['scope' => 'SO']);

        $this->assertSame($sebelum, ActivityLog::where('event', 'updated')->count());
    }

    public function test_penghapusan_tercatat(): void
    {
        $this->actingAs($this->superAdmin());

        $material = Material::create(['nama' => 'Gasket Kepala Silinder']);
        $id = $material->id;
        $material->delete();

        $log = ActivityLog::where('subject_type', Material::class)
            ->where('event', 'deleted')
            ->firstOrFail();

        $this->assertSame($id, $log->subject_id);
        $this->assertSame('Gasket Kepala Silinder', $log->deskripsi);
    }

    public function test_absensi_publik_tercatat_sebagai_peran_publik(): void
    {
        $briefing = DailyBriefing::create([
            'judul' => 'Daily Meeting Poasia',
            'tanggal' => '2026-04-15',
            'status' => 'active',
        ]);

        // Tanpa login — peserta memindai QR dari ponselnya.
        $this->post("/daily-briefings/attend/{$briefing->token}", [
            'nama' => 'Budi',
            'signature' => 'data:image/png;base64,'.str_repeat('A', 500),
        ])->assertRedirect();

        $log = ActivityLog::where('subject_label', 'Daftar Hadir Daily Meeting')
            ->where('event', 'created')
            ->firstOrFail();

        $this->assertNull($log->user_id);
        $this->assertSame(ActivityLog::ROLE_PUBLIK, $log->user_role);
        $this->assertSame('Budi', $log->deskripsi);
    }

    public function test_tanda_tangan_dan_foto_tidak_ikut_disalin_utuh(): void
    {
        $briefing = DailyBriefing::create([
            'judul' => 'Daily Meeting Poasia',
            'tanggal' => '2026-04-15',
            'status' => 'active',
        ]);

        $this->post("/daily-briefings/attend/{$briefing->token}", [
            'nama' => 'Budi',
            'signature' => 'data:image/png;base64,'.str_repeat('A', 5000),
        ])->assertRedirect();

        $log = ActivityLog::where('subject_label', 'Daftar Hadir Daily Meeting')->firstOrFail();

        // Data URI besar hanya ditandai, tidak disimpan — jejak aktivitas tidak
        // boleh ikut menggendong berkas.
        $this->assertSame('[data]', $log->perubahan['signature']);
        $this->assertLessThan(2000, strlen((string) json_encode($log->perubahan)));
    }

    public function test_kolom_rahasia_tidak_pernah_masuk_catatan(): void
    {
        $this->actingAs($this->superAdmin());

        $baru = User::factory()->create(['name' => 'Pengguna Baru']);

        $log = ActivityLog::where('subject_type', User::class)
            ->where('event', 'created')
            ->where('subject_id', $baru->id)
            ->firstOrFail();

        $this->assertSame('[data]', $log->perubahan['password']);
        $this->assertStringNotContainsString($baru->password, (string) json_encode($log->perubahan));
    }

    public function test_pencatatan_bisa_dimatikan_sementara(): void
    {
        $this->actingAs($this->superAdmin());

        $sebelum = ActivityLog::count();

        ActivityLogger::tanpaMencatat(fn () => $this->plan());

        $this->assertSame($sebelum, ActivityLog::count());

        // Setelah blok selesai, pencatatan kembali berjalan.
        $this->plan();
        $this->assertGreaterThan($sebelum, ActivityLog::count());
    }

    // ------------------------------------------------------------ Akses

    public function test_hanya_super_admin_yang_boleh_membuka_menu_aktivitas(): void
    {
        $this->get('/aktivitas')->assertRedirect(route('login'));

        foreach (['admin', 'pengelola', 'tamu'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]));
            $this->get('/aktivitas')->assertForbidden();
        }

        $this->actingAs($this->superAdmin());
        $this->get('/aktivitas')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('aktivitas/index'));
    }

    // ---------------------------------------------------------- Filter

    public function test_daftar_bisa_disaring_per_aksi_dan_peran(): void
    {
        $this->actingAs($this->superAdmin());
        $plan = $this->plan();
        $plan->update(['scope' => 'ME']);

        $this->get('/aktivitas?event=created')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('aktivitas.data.0.event', 'created'));

        $this->get('/aktivitas?event=deleted')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('aktivitas.data', 0));

        $this->get('/aktivitas?role=pengelola')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('aktivitas.data', 0));
    }

    public function test_daftar_bisa_dicari_dan_disaring_per_modul(): void
    {
        $this->actingAs($this->superAdmin());
        $this->plan();
        Material::create(['nama' => 'Gasket Kepala Silinder']);

        $this->get('/aktivitas?search=Gasket')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('aktivitas.data', 1)
                ->where('aktivitas.data.0.deskripsi', 'Gasket Kepala Silinder'));

        $this->get('/aktivitas?modul=Outage Plan')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('aktivitas.data.0.subject_label', 'Outage Plan'));
    }

    public function test_ringkasan_menghitung_per_jenis_aksi(): void
    {
        $this->actingAs($this->superAdmin());
        $plan = $this->plan();
        $plan->update(['scope' => 'ME']);

        $this->get('/aktivitas')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('ringkasan.total', ActivityLog::count())
                ->where('ringkasan.perEvent.created', ActivityLog::where('event', 'created')->count())
                ->where('ringkasan.perEvent.updated', ActivityLog::where('event', 'updated')->count()));
    }
}
