<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Dua menu yang mirip namanya harus tetap terpisah:
 *
 * - /daily-meeting  (tunggal) — menu baru, masih placeholder
 * - /daily-meetings (jamak)   — Rapat Outage, fitur yang sudah berjalan
 */
class NavigasiMenuTest extends TestCase
{
    use RefreshDatabase;

    public function test_menu_daily_meeting_baru_menampilkan_halaman_placeholder(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/daily-meeting')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('daily-meeting'));
    }

    public function test_rapat_outage_tetap_di_rute_lamanya(): void
    {
        $this->actingAs(User::factory()->create());

        // Rutenya tidak ikut berubah saat menunya diganti nama, jadi tautan
        // lama dan bookmark pengguna tetap bekerja.
        $this->get('/daily-meetings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('daily-meetings/index'));
    }

    public function test_menu_baru_butuh_login(): void
    {
        $this->get('/daily-meeting')->assertRedirect(route('login'));
    }

    /**
     * Akses Rapat Outage / Daily Meeting kini mengikuti Izin Akses Menu, bukan
     * peran. Pengelola yang diberi menu tersebut bisa membukanya.
     */
    public function test_pengelola_dengan_izin_menu_bisa_membuka_rapat(): void
    {
        $pengelola = User::factory()->create([
            'role' => 'pengelola',
            'menu_access' => ['rapat-outage', 'daily-meeting'],
        ]);

        $this->actingAs($pengelola)
            ->get('/daily-meetings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('daily-meetings/index'));

        $this->actingAs($pengelola)
            ->get('/daily-briefings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('daily-briefings/index'));
    }

    /**
     * Akun pengelola lama yang izin menunya belum pernah diatur (null) tidak
     * boleh tiba-tiba mendapat menu rapat — sama seperti sebelum izin menu bisa
     * membuka menu rapat.
     */
    public function test_pengelola_lama_tanpa_izin_menu_tetap_tidak_melihat_rapat(): void
    {
        $pengelola = User::factory()->create([
            'role' => 'pengelola',
            'merek' => 'CUMMINS',
            'menu_access' => null,
        ]);

        $this->actingAs($pengelola)->get('/daily-meetings')->assertForbidden();
        $this->actingAs($pengelola)->get('/daily-briefings')->assertForbidden();

        // Menu lain tetap terbuka, dan sidebar menerima daftar tanpa menu rapat.
        $this->actingAs($pengelola)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('auth.menu_access', fn ($menus) => ! collect($menus)->contains('rapat-outage')
                    && ! collect($menus)->contains('daily-meeting')
                    && collect($menus)->contains('outage-plans')));
    }

    public function test_admin_tanpa_izin_menu_tetap_melihat_seluruh_menu(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'menu_access' => null]);

        $this->actingAs($admin)->get('/daily-meetings')->assertOk();
        $this->actingAs($admin)->get('/daily-briefings')->assertOk();
    }

    /** Tanpa izin menu tersebut, aksesnya tetap ditolak oleh CheckMenuAccess. */
    public function test_pengelola_tanpa_izin_menu_ditolak_dari_rapat(): void
    {
        $pengelola = User::factory()->create([
            'role' => 'pengelola',
            'menu_access' => ['dashboard'],
        ]);

        $this->actingAs($pengelola)->get('/daily-meetings')->assertForbidden();
        $this->actingAs($pengelola)->get('/daily-briefings')->assertForbidden();
    }
}
