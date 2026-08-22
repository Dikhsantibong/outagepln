<?php

namespace Tests\Feature;

use App\Models\DailyMeeting;
use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Revisi rencana outage di halaman Rapat Outage: tanggal rapat R2-P3 selalu
 * dihitung mundur dari rencana start, dan versi lamanya tetap terbaca.
 */
class RevisiRencanaRapatTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_revisi_menghitung_tanggal_rapat_mundur_dari_rencana_start(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
            'start_date' => '2027-01-07',
            'selesai' => '2027-01-26',
        ])->assertRedirect();

        $plan->refresh();

        // 2027-01-07 dikurangi 365 / 180 / 90 / 30 / 7 hari.
        $this->assertSame('2026-01-07', $plan->rapat_r2);
        $this->assertSame('2026-07-11', $plan->rapat_r3);
        $this->assertSame('2026-10-09', $plan->rapat_p1);
        $this->assertSame('2026-12-08', $plan->rapat_p2);
        $this->assertSame('2026-12-31', $plan->rapat_p3);
    }

    public function test_rencana_start_finish_dan_durasi_ikut_diperbarui(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
            'start_date' => '2027-01-07',
            'selesai' => '2027-01-26',
        ])->assertRedirect();

        $plan->refresh();

        $this->assertSame('2027-01-07', $plan->start_date);
        $this->assertSame('2027-01-26', $plan->selesai);
        $this->assertSame(20, (int) $plan->durasi);
    }

    public function test_riwayat_menyimpan_rencana_awal_lalu_tiap_revisi(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        foreach (['2027-01-07', '2027-02-07', '2027-03-07'] as $start) {
            $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
                'start_date' => $start,
                'selesai' => $start,
            ])->assertRedirect();
        }

        $riwayat = $plan->revisions()->get();

        // Rencana awal + tiga revisi.
        $this->assertCount(4, $riwayat);
        $this->assertSame(['RENC', 'REV 1', 'REV 2', 'REV 3'], $riwayat->pluck('label')->all());

        // Rencana awal menyimpan tanggal sebelum revisi pertama.
        $this->assertSame('2026-01-07', $riwayat->first()->start_date->format('Y-m-d'));
        $this->assertSame('2027-03-07', $riwayat->last()->start_date->format('Y-m-d'));
    }

    public function test_revisi_keempat_ditolak_karena_melewati_batas(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        foreach (['2027-01-07', '2027-02-07', '2027-03-07'] as $start) {
            $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => $start])
                ->assertRedirect();
        }

        $this->assertSame(3, $plan->jumlahRevisi());
        $this->assertTrue($plan->sudahMencapaiBatasRevisi());

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => '2027-04-07'])
            ->assertSessionHasErrors('start_date');

        // Jadwalnya tidak ikut bergeser oleh percobaan yang ditolak.
        $this->assertSame(3, $plan->jumlahRevisi());
        $this->assertSame('2027-03-07', $plan->fresh()->start_date);
    }

    public function test_sisa_jatah_revisi_dihitung_dari_batas(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->assertSame(3, $plan->sisaRevisi());

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => '2027-01-07'])
            ->assertRedirect();

        $this->assertSame(2, $plan->sisaRevisi());
        $this->assertFalse($plan->sudahMencapaiBatasRevisi());
    }

    public function test_ubah_jadwal_dari_halaman_pekerjaan_ditolak_setelah_batas(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        foreach (['2027-01-07', '2027-02-07', '2027-03-07'] as $start) {
            $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => $start])
                ->assertRedirect();
        }

        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'start_date' => '2028-01-07',
        ])->assertSessionHasErrors('start_date');

        $this->assertSame(3, $plan->jumlahRevisi());
        $this->assertSame('2027-03-07', $plan->fresh()->start_date);
    }

    public function test_data_non_jadwal_tetap_bisa_disimpan_setelah_batas(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        foreach (['2027-01-07', '2027-02-07', '2027-03-07'] as $start) {
            $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => $start])
                ->assertRedirect();
        }

        $terkini = $plan->fresh();

        // Jadwal dikirim apa adanya, hanya kolom lain yang berubah.
        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'start_date' => $terkini->start_date,
            'selesai' => $terkini->selesai,
            'sistem' => 'KENDARI',
        ])->assertSessionHasNoErrors();

        $this->assertSame('KENDARI', $plan->fresh()->sistem);
        $this->assertSame(3, $plan->jumlahRevisi());
    }

    public function test_pengelola_tidak_diberi_kendali_jadwal_di_halaman_ubah(): void
    {
        $plan = $this->plan();

        $this->actingAs(User::factory()->create([
            'role' => 'pengelola',
            'merek' => $plan->merek,
        ]));

        $this->get("/outage-plans/{$plan->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('bolehUbahJadwal', false));

        // Admin tetap mendapat kendalinya.
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $this->get("/outage-plans/{$plan->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('bolehUbahJadwal', true));
    }

    public function test_pengelola_tidak_dapat_menggeser_jadwal_lewat_simpan(): void
    {
        $plan = $this->plan();

        $this->actingAs(User::factory()->create([
            'role' => 'pengelola',
            'merek' => $plan->merek,
        ]));

        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'start_date' => '2030-01-07',
            'selesai' => '2030-01-26',
            'rapat_p3' => '2029-12-31',
            'sistem' => 'KENDARI',
        ])->assertRedirect();

        $terkini = $plan->fresh();

        // Jadwalnya tidak bergeser, dan tidak ada revisi yang tercatat.
        $this->assertSame('2026-01-07', $terkini->start_date);
        $this->assertSame('2026-01-26', $terkini->selesai);
        $this->assertSame(0, $plan->revisions()->count());

        // Data yang memang miliknya tetap tersimpan.
        $this->assertSame('KENDARI', $terkini->sistem);
    }

    public function test_ringkasan_dihitung_dari_seluruh_hasil_filter(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => '2027-01-07'])
            ->assertRedirect();

        $this->get('/daily-meetings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('ringkasan.mesin', 1)
                ->where('ringkasan.direvisi', 1)
                ->where('ringkasan.terkunci', 0)
                ->where('ringkasan.rapatSelesai', 0)
                ->where('ringkasan.rapatTerjadwal', DailyMeeting::where('outage_plan_id', $plan->id)->count()));

        // Filter yang tidak cocok membuat seluruh angkanya nol.
        $this->get('/daily-meetings?search=TIDAK-ADA')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('ringkasan.mesin', 0)
                ->where('ringkasan.direvisi', 0));
    }

    public function test_ringkasan_menghitung_rencana_yang_jatah_revisinya_habis(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        foreach (['2027-01-07', '2027-02-07', '2027-03-07'] as $start) {
            $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => $start])
                ->assertRedirect();
        }

        $this->get('/daily-meetings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('ringkasan.direvisi', 1)
                ->where('ringkasan.terkunci', 1));
    }

    public function test_halaman_mengirim_batas_revisi_ke_layar(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->get('/daily-meetings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('maksRevisi', 3));

        $this->get("/outage-plans/{$plan->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('maksRevisi', 3));
    }

    public function test_revisi_mencatat_penyunting_dan_catatan(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'name' => 'Budi']);
        $this->actingAs($user);
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
            'start_date' => '2027-01-07',
            'catatan' => 'Menunggu material impor',
        ])->assertRedirect();

        $revisi = $plan->revisions()->where('urutan', 1)->firstOrFail();

        $this->assertSame('Menunggu material impor', $revisi->catatan);
        $this->assertSame($user->id, $revisi->user_id);
        $this->assertSame('Budi', $revisi->user->name);
    }

    public function test_jadwal_rapat_di_daily_meeting_ikut_bergeser(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
            'start_date' => '2027-01-07',
        ])->assertRedirect();

        $rapatP3 = DailyMeeting::where('outage_plan_id', $plan->id)
            ->where('tipe_rapat', 'RAPAT P3')
            ->firstOrFail();

        $this->assertSame('2026-12-31', $rapatP3->tanggal->format('Y-m-d'));
    }

    public function test_finish_tidak_boleh_mendahului_start(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
            'start_date' => '2027-01-07',
            'selesai' => '2027-01-01',
        ])->assertSessionHasErrors('selesai');

        $this->assertSame(0, $plan->revisions()->count());
    }

    public function test_tamu_tidak_boleh_merevisi_rencana(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'tamu']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
            'start_date' => '2027-01-07',
        ])->assertForbidden();

        $this->assertSame(0, $plan->revisions()->count());
    }

    public function test_ubah_jadwal_dari_halaman_pekerjaan_ikut_tercatat_sebagai_revisi(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'start_date' => '2027-01-07',
            'selesai' => '2027-01-26',
            'rapat_r2' => '2026-01-07',
            'rapat_r3' => '2026-07-11',
            'rapat_p1' => '2026-10-09',
            'rapat_p2' => '2026-12-08',
            'rapat_p3' => '2026-12-31',
        ])->assertRedirect();

        $riwayat = $plan->revisions()->get();

        // Rencana awal terekam sebelum ditimpa, lalu versi barunya menyusul.
        $this->assertCount(2, $riwayat);
        $this->assertSame('2026-01-07', $riwayat->first()->start_date->format('Y-m-d'));
        $this->assertSame('2027-01-07', $riwayat->last()->start_date->format('Y-m-d'));
        $this->assertSame($user->id, $riwayat->last()->user_id);
    }

    public function test_menyimpan_pekerjaan_tanpa_mengubah_jadwal_tidak_menambah_revisi(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'start_date' => '2026-01-07',
            'selesai' => '2026-01-26',
            'sistem' => 'KENDARI',
        ])->assertRedirect();

        // Riwayat tidak tersentuh sama sekali; menyimpan hal lain tidak boleh
        // meninggalkan jejak revisi, RENC sekalipun.
        $this->assertSame(0, $plan->revisions()->count());
        $this->assertSame('KENDARI', $plan->fresh()->sistem);
    }

    public function test_revisi_dari_rapat_outage_terlihat_di_halaman_pekerjaan(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
            'start_date' => '2027-01-07',
            'catatan' => 'Digeser dari Rapat Outage',
        ])->assertRedirect();

        foreach (["/outage-plans/{$plan->id}", "/outage-plans/{$plan->id}/edit"] as $url) {
            $this->get($url)
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->has('outagePlan.revisions', 2)
                    ->where('outagePlan.revisions.1.label', 'REV 1')
                    ->where('outagePlan.revisions.1.catatan', 'Digeser dari Rapat Outage'));
        }
    }

    public function test_halaman_ubah_pekerjaan_mengirim_rumus_offset(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->get("/outage-plans/{$plan->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('offsetRapat.rapat_r2', 365)
                ->where('offsetRapat.rapat_r3', 180)
                ->where('offsetRapat.rapat_p1', 90)
                ->where('offsetRapat.rapat_p2', 30)
                ->where('offsetRapat.rapat_p3', 7));
    }

    public function test_halaman_daftar_mengirim_riwayat_dan_rumus_offset(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => '2027-01-07'])
            ->assertRedirect();

        // Daftar hanya membawa jumlahnya; rinciannya ada di halaman revisi.
        $this->get('/daily-meetings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('outagePlans.data.0.jumlah_revisi', 1)
                ->missing('outagePlans.data.0.revisions')
                ->where('offsetRapat.rapat_r2', 365)
                ->where('offsetRapat.rapat_p3', 7));
    }

    // ------------------------------------------- Halaman revisi tersendiri

    public function test_halaman_revisi_menampilkan_rencana_dan_riwayatnya(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", [
            'start_date' => '2027-01-07',
            'catatan' => 'Menunggu material',
        ])->assertRedirect();

        $this->get("/daily-meetings/rencana/{$plan->id}/revisi")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('daily-meetings/revisi')
                ->where('plan.id', $plan->id)
                ->where('plan.mesin_pembangkit', 'PLTD POASIA #02 (MIRRLEES)')
                ->where('jumlahRevisi', 1)
                ->where('maksRevisi', 3)
                ->where('offsetRapat.rapat_r2', 365)
                ->has('plan.revisions', 2)
                ->where('plan.revisions.1.catatan', 'Menunggu material'));
    }

    public function test_halaman_revisi_tetap_terbuka_saat_jatahnya_habis(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        foreach (['2027-01-07', '2027-02-07', '2027-03-07'] as $start) {
            $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => $start])
                ->assertRedirect();
        }

        // Halamannya tetap bisa dibuka untuk membaca riwayat, hanya formulirnya
        // yang dikunci — itu ditentukan dari jumlahRevisi.
        $this->get("/daily-meetings/rencana/{$plan->id}/revisi")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('jumlahRevisi', 3));
    }

    public function test_simpan_revisi_mengembalikan_ke_daftar_rapat(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $plan = $this->plan();

        $this->post("/daily-meetings/rencana/{$plan->id}/revisi", ['start_date' => '2027-01-07'])
            ->assertRedirect(route('daily-meetings.index'));
    }

    public function test_tamu_tidak_boleh_membuka_halaman_revisi(): void
    {
        $plan = $this->plan();

        $this->actingAs(User::factory()->create(['role' => 'tamu']));
        $this->get("/daily-meetings/rencana/{$plan->id}/revisi")->assertForbidden();

        $this->get('/daily-meetings')->assertOk();
    }
}
