<?php

namespace Tests\Feature;

use App\Models\Mesin;
use App\Models\OutagePlan;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Satu merek bisa terdiri dari beberapa tipe — CUMMINS ada KTA 50-G8 dan
 * QSK23-G3 — jadi akun pengelola bisa dipatok ke satu tipe.
 *
 * Yang diuji: tipe rencana diturunkan dari Data Mesin, penyaringan per tipe di
 * [OutagePlan::scopeVisibleTo()], pembuatan akun per tipe lewat Data Master,
 * dan sinkronisasi Type/Serial Number mesin.
 */
class PengelolaPerTipeMesinTest extends TestCase
{
    use RefreshDatabase;

    private function mesin(string $unit, int $nomor, string $nama, ?string $tipe, ?string $seri = null): Mesin
    {
        $unitModel = Unit::firstOrCreate(['nama_sentral' => $unit]);

        return Mesin::create([
            'id_unit' => $unitModel->id_unit,
            'no_urut' => $nomor,
            'nama_mesin' => $nama,
            'pgk_merk' => 'CUMMINS',
            'pgk_type' => $tipe,
            'pgk_seri' => $seri,
        ]);
    }

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

    /** Armada CUMMINS: QSK di Langara #11, #12 dan Ereke #11; KTA di Poasia #06. */
    private function armadaCummins(): void
    {
        $this->mesin('PLTD LANGARA', 72, 'PLTD LANGARA #11 (CUMMINS)', 'QSK23-G3');
        $this->mesin('PLTD LANGARA', 73, 'PLTD LANGARA #12 (CUMMINS)', 'QSK23-G3');
        $this->mesin('PLTD EREKE', 57, 'PLTD EREKE #11 (CUMMINS)', 'QSK23 - G3');
        $this->mesin('PLTD EREKE', 58, 'PLTD EREKE #12 (CUMMINS) EX PLTD BAU-BAU #18', 'KTA 50-G8');
        $this->mesin('PLTD POASIA', 10, 'PLTD POASIA #06 (CUMMINS) EX PLTD BAUBAU #14', 'KTA-50-G8');

        $this->plan('PLTD LANGARA #11 (CUMMINS)');
        $this->plan('PLTD LANGARA #12 (CUMMINS)');
        $this->plan('PLTD EREKE #11 (CUMMINS)');
        $this->plan('PLTD EREKE #12 (CUMMINS) (EX PLTD BAUBAU #18)');
        $this->plan('PLTD POASIA #06 (CUMMINS) EX PLTD BAUBAU #14');
    }

    public function test_tipe_dinormalisasi_agar_penulisan_berbeda_jatuh_ke_satu_kelompok(): void
    {
        $this->assertSame('KTA50G8', OutagePlan::normalisasiTipe('KTA 50-G8'));
        $this->assertSame('KTA50G8', OutagePlan::normalisasiTipe('KTA-50-G8'));
        $this->assertSame('QSK23G3', OutagePlan::normalisasiTipe('QSK23 - G3'));
        $this->assertNull(OutagePlan::normalisasiTipe('  '));
        $this->assertNull(OutagePlan::normalisasiTipe(null));
    }

    public function test_kunci_mesin_mengabaikan_catatan_lokasi_lama(): void
    {
        $this->assertSame('PLTD EREKE#12', OutagePlan::kunciMesin('PLTD EREKE #12 (CUMMINS) (EX PLTD BAUBAU #18)'));
        $this->assertSame('PLTD EREKE#12', OutagePlan::kunciMesin('PLTD EREKE #12 (CUMMINS) EX PLTD BAU-BAU #18'));
        $this->assertSame('PLTD WUA-WUA#1', OutagePlan::kunciMesin('PLTD WUA- WUA #01 (MAK)'));
        $this->assertNull(OutagePlan::kunciMesin('PLTM MIKUASI'));
    }

    public function test_tipe_rencana_terisi_otomatis_dari_data_mesin(): void
    {
        $this->armadaCummins();

        $this->assertSame('QSK23G3', OutagePlan::where('mesin_pembangkit', 'PLTD EREKE #11 (CUMMINS)')->value('tipe'));
        $this->assertSame('KTA50G8', OutagePlan::where('mesin_pembangkit', 'like', 'PLTD EREKE #12%')->value('tipe'));
        $this->assertSame('KTA50G8', OutagePlan::where('mesin_pembangkit', 'like', 'PLTD POASIA #06%')->value('tipe'));
    }

    public function test_rencana_tanpa_data_mesin_tidak_bertipe(): void
    {
        $this->assertNull($this->plan('PLTM MIKUASI')->tipe);
    }

    public function test_pengelola_cummins_qsk_hanya_melihat_mesin_qsk_di_semua_unit(): void
    {
        $this->armadaCummins();

        $pengelola = User::factory()->create(['role' => 'pengelola', 'merek' => 'CUMMINS', 'tipe' => 'QSK23G3']);

        $terlihat = OutagePlan::visibleTo($pengelola)->orderBy('mesin_pembangkit')->pluck('mesin_pembangkit')->all();

        $this->assertSame([
            'PLTD EREKE #11 (CUMMINS)',
            'PLTD LANGARA #11 (CUMMINS)',
            'PLTD LANGARA #12 (CUMMINS)',
        ], $terlihat);
    }

    public function test_tipe_dan_unit_bisa_dipakai_bersamaan(): void
    {
        $this->armadaCummins();

        $pengelola = User::factory()->create([
            'role' => 'pengelola', 'merek' => 'CUMMINS', 'tipe' => 'KTA50G8', 'unit' => 'PLTD EREKE',
        ]);

        $this->assertSame(
            ['PLTD EREKE #12 (CUMMINS) (EX PLTD BAUBAU #18)'],
            OutagePlan::visibleTo($pengelola)->pluck('mesin_pembangkit')->all(),
        );
    }

    public function test_satu_akun_bisa_memegang_beberapa_unit_sekaligus(): void
    {
        $this->armadaCummins();

        $pengelola = User::factory()->create([
            'role' => 'pengelola', 'merek' => 'CUMMINS', 'units' => ['PLTD EREKE', 'PLTD POASIA'],
        ]);

        $this->assertSame([
            'PLTD EREKE #11 (CUMMINS)',
            'PLTD EREKE #12 (CUMMINS) (EX PLTD BAUBAU #18)',
            'PLTD POASIA #06 (CUMMINS) EX PLTD BAUBAU #14',
        ], OutagePlan::visibleTo($pengelola)->orderBy('mesin_pembangkit')->pluck('mesin_pembangkit')->all());

        // Lebih dari satu unit: kolom lama users.unit dikosongkan.
        $this->assertNull($pengelola->fresh()->unit);
    }

    public function test_akun_lama_satu_unit_tetap_berlaku(): void
    {
        $this->armadaCummins();

        $pengelola = User::factory()->create(['role' => 'pengelola', 'merek' => 'CUMMINS', 'unit' => 'PLTD LANGARA']);

        $this->assertSame(['PLTD LANGARA'], $pengelola->fresh()->unitKelola());
        $this->assertSame(2, OutagePlan::visibleTo($pengelola)->count());
    }

    public function test_akun_beberapa_unit_bisa_dibuat_dan_diubah_lewat_data_master(): void
    {
        $this->armadaCummins();
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->post('/master/users', [
            'name' => 'Pengelola CUMMINS QSK',
            'email' => 'cummins-qsk@outage.pln',
            'password' => 'rahasia123',
            'role' => 'pengelola',
            'merek' => 'CUMMINS',
            'tipe' => 'QSK23G3',
            'units' => ['PLTD LANGARA', 'PLTD EREKE'],
            'menu_access' => ['dashboard'],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $akun = User::where('email', 'cummins-qsk@outage.pln')->firstOrFail();
        $this->assertSame(['PLTD LANGARA', 'PLTD EREKE'], $akun->units);
        $this->assertNull($akun->unit);
        $this->assertSame(3, OutagePlan::visibleTo($akun)->count());

        $this->get('/master/users')->assertInertia(fn ($page) => $page
            ->where('users', fn ($users) => collect($users)->firstWhere('email', 'cummins-qsk@outage.pln')['units'] === ['PLTD LANGARA', 'PLTD EREKE']));

        // Dipersempit ke satu unit: kolom lama ikut terisi.
        $this->put("/master/users/{$akun->id}", [
            'name' => $akun->name, 'email' => $akun->email, 'password' => '',
            'role' => 'pengelola', 'merek' => 'CUMMINS', 'tipe' => 'QSK23G3',
            'units' => ['PLTD EREKE'], 'menu_access' => ['dashboard'],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame(['PLTD EREKE'], $akun->fresh()->units);
        $this->assertSame('PLTD EREKE', $akun->fresh()->unit);

        // Dikosongkan: kembali ke seluruh unit.
        $this->put("/master/users/{$akun->id}", [
            'name' => $akun->name, 'email' => $akun->email, 'password' => '',
            'role' => 'pengelola', 'merek' => 'CUMMINS', 'tipe' => 'QSK23G3',
            'units' => [], 'menu_access' => ['dashboard'],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame([], $akun->fresh()->unitKelola());
        $this->assertNull($akun->fresh()->unit);
    }

    public function test_pengelola_tanpa_tipe_tetap_melihat_seluruh_tipe_mereknya(): void
    {
        $this->armadaCummins();

        $pengelola = User::factory()->create(['role' => 'pengelola', 'merek' => 'CUMMINS']);

        $this->assertSame(5, OutagePlan::visibleTo($pengelola)->count());
    }

    public function test_pengelola_tipe_lain_ditolak_membuka_detail_mesin(): void
    {
        $this->armadaCummins();
        $kta = OutagePlan::where('mesin_pembangkit', 'like', 'PLTD POASIA #06%')->firstOrFail();

        $this->actingAs(User::factory()->create(['role' => 'pengelola', 'merek' => 'CUMMINS', 'tipe' => 'QSK23G3']));

        $this->getJson("/outage-plans/{$kta->id}/detail-json")->assertForbidden();
    }

    public function test_ubah_type_di_data_mesin_ikut_memperbarui_tipe_rencana(): void
    {
        $mesin = $this->mesin('PLTD RAHA', 30, 'PLTD RAHA #08 (CUMMINS)', 'KTA 50-G8');
        $plan = $this->plan('PLTD RAHA #08 (CUMMINS)');
        $this->assertSame('KTA50G8', $plan->tipe);

        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->put("/master/mesins/{$mesin->id_mesin}", [
            'no_urut' => 30,
            'nama_mesin' => 'PLTD RAHA #08 (CUMMINS)',
            'pgk_merk' => 'CUMMINS',
            'pgk_type' => 'QSK23-G3',
            'pgk_seri' => '85000001',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame('QSK23-G3', $mesin->fresh()->pgk_type);
        $this->assertSame('85000001', $mesin->fresh()->pgk_seri);
        $this->assertSame('QSK23G3', $plan->fresh()->tipe);
    }

    public function test_akun_pengelola_bisa_dibuat_per_tipe_lewat_data_master(): void
    {
        $this->armadaCummins();
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->get('/master/users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('tipePerMerek.CUMMINS', [
                    ['value' => 'KTA50G8', 'label' => 'KTA-50-G8'],
                    ['value' => 'QSK23G3', 'label' => 'QSK23 - G3'],
                ])
                ->where('unitsPerMerekTipe.CUMMINS|QSK23G3', ['PLTD EREKE', 'PLTD LANGARA']));

        $this->post('/master/users', [
            'name' => 'Pengelola CUMMINS QSK',
            'email' => 'cummins-qsk@outage.pln',
            'password' => 'rahasia123',
            'role' => 'pengelola',
            'merek' => 'CUMMINS',
            'tipe' => 'QSK23G3',
            'unit' => '',
            'menu_access' => ['dashboard'],
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'cummins-qsk@outage.pln',
            'merek' => 'CUMMINS',
            'tipe' => 'QSK23G3',
            'unit' => null,
        ]);
    }

    public function test_tipe_dibuang_saat_role_bukan_pengelola_atau_tanpa_merek(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->post('/master/users', [
            'name' => 'Admin', 'email' => 'admin2@outage.pln', 'password' => 'rahasia123',
            'role' => 'admin', 'merek' => 'CUMMINS', 'tipe' => 'QSK23G3', 'menu_access' => ['dashboard'],
        ])->assertRedirect();

        $this->post('/master/users', [
            'name' => 'Tanpa Merek', 'email' => 'tanpa@outage.pln', 'password' => 'rahasia123',
            'role' => 'pengelola', 'merek' => '', 'tipe' => 'QSK23G3', 'menu_access' => ['dashboard'],
        ])->assertRedirect();

        $this->assertDatabaseHas('users', ['email' => 'admin2@outage.pln', 'tipe' => null]);
        $this->assertDatabaseHas('users', ['email' => 'tanpa@outage.pln', 'tipe' => null]);
    }

    public function test_migrasi_sinkron_mengisi_type_dan_serial_number(): void
    {
        $wua = $this->mesin('PLTD WUA- WUA', 1, 'PLTD WUA-WUA #01 (MAK)', '8 M 453 AK', '268 81');
        $poasia2 = $this->mesin('PLTD POASIA', 7, 'PLTD POASIA #02 (MIRRLEES)', 'ESL 16 MK', '01-44-97');
        $lanipa3 = $this->mesin('PLTD LANIPA- NIPA', 20, 'PLTD LANIPA NIPA #03 (DEUTZ)', 'BV 8M 628', '7708758');
        $lain = $this->mesin('PLTD RAHA', 30, 'PLTD RAHA #08 (CUMMINS)', 'KTA 50-G8', '111');
        $plan = $this->plan('PLTD POASIA #02 (MIRRLEES)');

        $migrasi = require database_path('migrations/2026_10_07_210404_sinkronkan_tipe_serial_mesin.php');
        $migrasi->up();

        $this->assertSame('26881', $wua->fresh()->pgk_seri);
        $this->assertSame('7208 739', $lanipa3->fresh()->pgk_seri);
        // Type diperbarui, serial kembar di daftar sumber tidak ditimpakan.
        $this->assertSame('ESL 16 MK 2', $poasia2->fresh()->pgk_type);
        $this->assertSame('01-44-97', $poasia2->fresh()->pgk_seri);
        // Mesin di luar daftar tidak disentuh.
        $this->assertSame('111', $lain->fresh()->pgk_seri);
        // Tipe rencana ikut diisi ulang dari Data Mesin.
        $this->assertSame('ESL16MK2', $plan->fresh()->tipe);
    }
}
