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
