<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Satu merek mesin dipegang beberapa unit — MIRRLEES ada di PLTD POASIA dan di
 * PLTD RAHA — sehingga merek saja tidak cukup untuk menentukan pemiliknya.
 *
 * Yang diuji: unit diturunkan dari nama mesin, penyaringan gabungan merek+unit
 * di [OutagePlan::scopeVisibleTo()], dan pemisahan akun lewat Data Master.
 */
class PengelolaPerUnitTest extends TestCase
{
    use RefreshDatabase;

    private function plan(string $mesin): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => $mesin,
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2024-10-31',
            'selesai' => '2024-11-28',
        ]);
    }

    private function pengelola(?string $merek, ?string $unit = null): User
    {
        return User::factory()->create([
            'role' => 'pengelola',
            'merek' => $merek,
            'unit' => $unit,
        ]);
    }

    /** @return array<string, array{0: string, 1: ?string}> */
    public static function namaMesinProvider(): array
    {
        return [
            'merek dalam kurung' => ['PLTD POASIA #01 (MIRRLEES)', 'PLTD POASIA'],
            'tanpa merek' => ['PLTM WINNING #02', 'PLTM WINNING'],
            'nomor tanpa nol' => ['PLTG KOLAKA #1', 'PLTG KOLAKA'],
            'unit berstrip' => ['PLTD WUA-WUA #01 (MAK)', 'PLTD WUA-WUA'],
            'spasi di sekitar strip' => ['PLTD WUA- WUA #01 (MAK)', 'PLTD WUA-WUA'],
            'catatan lokasi lama dibuang' => ['PLTD RAHA #15 (Mitsubishi) EX PLTD BAU-BAU #21', 'PLTD RAHA'],
            'kurung tanpa nomor mesin' => ['PLTD LADUMPI (MITSUBISHI)', 'PLTD LADUMPI'],
            'nama kosong' => ['   ', null],
        ];
    }

    #[DataProvider('namaMesinProvider')]
    public function test_unit_diturunkan_dari_nama_mesin(string $mesin, ?string $unit): void
    {
        $this->assertSame($unit, OutagePlan::extractUnit($mesin));
    }

    public function test_unit_terisi_otomatis_saat_rencana_disimpan(): void
    {
        $plan = $this->plan('PLTD RAHA #05 (MIRRLEES)');

        $this->assertSame('MIRRLEES', $plan->merek);
        $this->assertSame('PLTD RAHA', $plan->unit);
    }

    public function test_unit_ikut_berubah_saat_mesin_dipindahkan(): void
    {
        $plan = $this->plan('PLTD RAHA #05 (MIRRLEES)');

        $plan->update(['mesin_pembangkit' => 'PLTD POASIA #05 (MIRRLEES)']);

        $this->assertSame('PLTD POASIA', $plan->fresh()->unit);
    }

    public function test_pengelola_satu_unit_hanya_melihat_mesin_unitnya(): void
    {
        $poasia = $this->plan('PLTD POASIA #01 (MIRRLEES)');
        $raha = $this->plan('PLTD RAHA #05 (MIRRLEES)');

        $terlihat = OutagePlan::visibleTo($this->pengelola('MIRRLEES', 'PLTD POASIA'))
            ->pluck('id');

        $this->assertEqualsCanonicalizing([$poasia->id], $terlihat->all());
        $this->assertNotContains($raha->id, $terlihat->all());
    }

    public function test_dua_akun_mirrlees_terpisah_per_unit(): void
    {
        $poasia = $this->plan('PLTD POASIA #01 (MIRRLEES)');
        $raha = $this->plan('PLTD RAHA #05 (MIRRLEES)');

        $this->assertSame(
            [$poasia->id],
            OutagePlan::visibleTo($this->pengelola('MIRRLEES', 'PLTD POASIA'))->pluck('id')->all(),
        );
        $this->assertSame(
            [$raha->id],
            OutagePlan::visibleTo($this->pengelola('MIRRLEES', 'PLTD RAHA'))->pluck('id')->all(),
        );
    }

    /** Akun lama yang cuma punya merek tetap memegang seluruh unit mereknya. */
    public function test_pengelola_tanpa_unit_tetap_melihat_seluruh_unit_mereknya(): void
    {
        $this->plan('PLTD POASIA #01 (MIRRLEES)');
        $this->plan('PLTD RAHA #05 (MIRRLEES)');
        $this->plan('PLTD RAHA #07 (CUMMINS)');

        $this->assertSame(
            2,
            OutagePlan::visibleTo($this->pengelola('MIRRLEES'))->count(),
        );
    }

    public function test_admin_tidak_terbatas_merek_maupun_unit(): void
    {
        $this->plan('PLTD POASIA #01 (MIRRLEES)');
        $this->plan('PLTD RAHA #07 (CUMMINS)');

        $admin = User::factory()->create(['role' => 'admin', 'merek' => null, 'unit' => null]);

        $this->assertSame(2, OutagePlan::visibleTo($admin)->count());
    }

    public function test_pengelola_unit_lain_ditolak_membuka_detail_mesin(): void
    {
        $raha = $this->plan('PLTD RAHA #05 (MIRRLEES)');

        $this->actingAs($this->pengelola('MIRRLEES', 'PLTD POASIA'));

        $this->getJson("/outage-plans/{$raha->id}/detail-json")->assertForbidden();
    }

    public function test_akun_pengelola_bisa_dibuat_per_unit_lewat_data_master(): void
    {
        $this->plan('PLTD POASIA #01 (MIRRLEES)');
        $this->plan('PLTD RAHA #05 (MIRRLEES)');

        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        foreach (['PLTD POASIA', 'PLTD RAHA'] as $unit) {
            $this->post('/master/users', [
                'name' => "Pengelola MIRRLEES {$unit}",
                'email' => str($unit)->slug().'@outage.pln',
                'password' => 'rahasia123',
                'role' => 'pengelola',
                'merek' => 'MIRRLEES',
                'unit' => $unit,
                'menu_access' => ['dashboard'],
            ])->assertRedirect();
        }

        $this->assertDatabaseHas('users', ['merek' => 'MIRRLEES', 'unit' => 'PLTD POASIA']);
        $this->assertDatabaseHas('users', ['merek' => 'MIRRLEES', 'unit' => 'PLTD RAHA']);
        $this->assertSame(2, User::where('merek', 'MIRRLEES')->count());
    }

    public function test_unit_bisa_dilepas_agar_akun_kembali_memegang_seluruh_merek(): void
    {
        $pengelola = $this->pengelola('MIRRLEES', 'PLTD RAHA');

        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->put("/master/users/{$pengelola->id}", [
            'name' => $pengelola->name,
            'email' => $pengelola->email,
            'password' => '',
            'role' => 'pengelola',
            'merek' => 'MIRRLEES',
            'unit' => '',
            'menu_access' => ['dashboard'],
        ])->assertRedirect();

        $this->assertNull($pengelola->fresh()->unit);
    }

    /** Admin dan tamu melihat seluruh mesin, jadi wilayah kelolanya dikosongkan. */
    public function test_wilayah_kelola_dibuang_saat_role_bukan_pengelola(): void
    {
        $pengelola = $this->pengelola('MIRRLEES', 'PLTD RAHA');

        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->put("/master/users/{$pengelola->id}", [
            'name' => $pengelola->name,
            'email' => $pengelola->email,
            'password' => '',
            'role' => 'admin',
            'merek' => 'MIRRLEES',
            'unit' => 'PLTD RAHA',
            'menu_access' => ['dashboard'],
        ])->assertRedirect();

        $segar = $pengelola->fresh();
        $this->assertNull($segar->merek);
        $this->assertNull($segar->unit);
    }

    /** Unit tanpa merek tidak berarti apa-apa; pemisahan selalu mulai dari merek. */
    public function test_unit_diabaikan_bila_mereknya_kosong(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->post('/master/users', [
            'name' => 'Pengelola Tanpa Merek',
            'email' => 'tanpa-merek@outage.pln',
            'password' => 'rahasia123',
            'role' => 'pengelola',
            'merek' => '',
            'unit' => 'PLTD RAHA',
            'menu_access' => ['dashboard'],
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'tanpa-merek@outage.pln',
            'merek' => null,
            'unit' => null,
        ]);
    }

    public function test_halaman_data_master_mengirim_daftar_unit_per_merek(): void
    {
        $this->plan('PLTD POASIA #01 (MIRRLEES)');
        $this->plan('PLTD RAHA #05 (MIRRLEES)');
        $this->plan('PLTD RAHA #07 (CUMMINS)');

        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->get('/master/users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('availableMereks', ['CUMMINS', 'MIRRLEES'])
                ->where('unitsPerMerek.MIRRLEES', ['PLTD POASIA', 'PLTD RAHA'])
                ->where('unitsPerMerek.CUMMINS', ['PLTD RAHA'])
            );
    }
}
