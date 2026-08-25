<?php

namespace Tests\Feature;

use App\Models\DailyMeeting;
use App\Models\OutagePlan;
use App\Models\OutagePlanRevision;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Membatalkan revisi rencana outage.
 *
 * Yang dibuang selalu revisi paling akhir, sekalian mengembalikan jadwalnya ke
 * versi sebelumnya. Menghapus baris riwayatnya saja akan meninggalkan rencana
 * dengan jadwal yang tidak tercatat di versi mana pun.
 */
class HapusRevisiRencanaTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        return $user;
    }

    private function rencana(): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #05 (MIRRLEES)',
            'scope' => 'MO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2027-07-01',
            'selesai' => '2027-07-10',
        ]);
    }

    private function hapusRevisi(OutagePlan $plan)
    {
        return $this->delete("/daily-meetings/rencana/{$plan->id}/revisi");
    }

    public function test_revisi_terakhir_dibatalkan_dan_jadwal_kembali_ke_versi_sebelumnya(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $plan->catatRevisi('2027-08-01', '2027-08-10', 'Menunggu material');
        $plan->refresh();

        $this->assertSame('2027-08-01', $plan->start_date);
        $this->assertSame(1, $plan->jumlahRevisi());

        $this->hapusRevisi($plan)->assertRedirect();

        $segar = $plan->fresh();

        // Jadwalnya kembali ke rencana awal, bukan sekadar riwayatnya hilang.
        $this->assertSame('2027-07-01', $segar->start_date);
        $this->assertSame('2027-07-10', $segar->selesai);
        $this->assertSame(0, $segar->jumlahRevisi());
    }

    /** Jatah revisi pulih, sehingga rencana bisa digeser lagi. */
    public function test_jatah_revisi_pulih_setelah_dibatalkan(): void
    {
        $plan = $this->rencana();
        $this->admin();

        foreach (['2027-08-01', '2027-09-01', '2027-10-01'] as $tanggal) {
            $plan->catatRevisi($tanggal, null, 'geser');
            $plan->refresh();
        }

        $this->assertTrue($plan->sudahMencapaiBatasRevisi());

        $this->hapusRevisi($plan)->assertRedirect();

        $segar = $plan->fresh();

        $this->assertSame(2, $segar->jumlahRevisi());
        $this->assertFalse($segar->sudahMencapaiBatasRevisi());
        $this->assertSame(1, $segar->sisaRevisi());
    }

    /** Yang dibuang selalu yang paling akhir, versi lamanya tetap utuh. */
    public function test_hanya_revisi_terakhir_yang_dibuang(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $plan->catatRevisi('2027-08-01', null, 'revisi pertama');
        $plan->refresh();
        $plan->catatRevisi('2027-09-01', null, 'revisi kedua');
        $plan->refresh();

        $this->hapusRevisi($plan)->assertRedirect();

        $urutan = $plan->fresh()->revisions()->pluck('urutan')->all();

        $this->assertSame([0, 1], $urutan);
        $this->assertSame('2027-08-01', $plan->fresh()->start_date);
    }

    /** Jadwal rapat R2–P3 ikut kembali, termasuk DailyMeeting yang mengikutinya. */
    public function test_jadwal_rapat_ikut_dikembalikan(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $plan->catatRevisi('2027-07-01', '2027-07-10', 'rencana awal tercatat');
        $plan->refresh();
        $rapatAwal = $plan->rapat_p3;

        $plan->catatRevisi('2027-09-01', '2027-09-10', 'digeser jauh');
        $plan->refresh();
        $this->assertNotSame($rapatAwal, $plan->rapat_p3);

        $this->hapusRevisi($plan)->assertRedirect();

        $segar = $plan->fresh();

        $this->assertSame($rapatAwal, $segar->rapat_p3);
        // Rapat outage menempel pada tanggal rencananya, jadi ikut mundur.
        $this->assertSame(
            $rapatAwal,
            DailyMeeting::where('outage_plan_id', $plan->id)
                ->where('tipe_rapat', 'RAPAT P3')
                ->first()
                ->tanggal
                ->toDateString(),
        );
    }

    /** RENC adalah rencana awal, bukan revisi — tidak ikut terbuang. */
    public function test_rencana_awal_tidak_ikut_terbuang(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $plan->catatRevisi('2027-08-01', null, 'satu-satunya revisi');
        $plan->refresh();

        $this->hapusRevisi($plan)->assertRedirect();

        $sisa = $plan->fresh()->revisions()->get();

        $this->assertCount(1, $sisa);
        $this->assertSame(0, $sisa->first()->urutan);
        $this->assertSame('RENC', $sisa->first()->label);
    }

    public function test_rencana_yang_belum_pernah_direvisi_ditolak_dengan_pesan(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $this->hapusRevisi($plan)
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame(0, OutagePlanRevision::count());
    }

    /** Pengelola mengisi realisasi tapi tidak membuang catatan induk. */
    public function test_pengelola_tidak_boleh_membatalkan_revisi(): void
    {
        $plan = $this->rencana();
        $plan->catatRevisi('2027-08-01', null, 'geser');
        $plan->refresh();

        $this->actingAs(User::factory()->create([
            'role' => 'pengelola',
            'merek' => 'MIRRLEES',
        ]));

        $this->hapusRevisi($plan)->assertForbidden();

        $this->assertSame(1, $plan->fresh()->jumlahRevisi());
        $this->assertSame('2027-08-01', $plan->fresh()->start_date);
    }

    public function test_tamu_tidak_boleh_membatalkan_revisi(): void
    {
        $plan = $this->rencana();
        $plan->catatRevisi('2027-08-01', null, 'geser');
        $plan->refresh();

        $this->actingAs(User::factory()->create(['role' => 'tamu']));

        $this->hapusRevisi($plan)->assertForbidden();
        $this->assertSame(1, $plan->fresh()->jumlahRevisi());
    }

    /** Admin pengelola merek lain tidak bisa menyentuh mesin di luar haknya. */
    public function test_mesin_di_luar_hak_akses_ditolak(): void
    {
        $plan = $this->rencana();
        $plan->catatRevisi('2027-08-01', null, 'geser');
        $plan->refresh();

        // Admin dengan wilayah kelola merek lain; canDeleteRecords() lolos,
        // tapi mesinnya tidak terlihat olehnya.
        $this->actingAs(User::factory()->create([
            'role' => 'admin',
            'merek' => 'CUMMINS',
        ]));

        $this->hapusRevisi($plan)->assertForbidden();
        $this->assertSame(1, $plan->fresh()->jumlahRevisi());
    }

    /** Dibatalkan dua kali berturut-turut, mundur satu versi tiap kali. */
    public function test_dibatalkan_berulang_mundur_satu_versi_tiap_kali(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $plan->catatRevisi('2027-08-01', null, 'rev 1');
        $plan->refresh();
        $plan->catatRevisi('2027-09-01', null, 'rev 2');
        $plan->refresh();

        $this->hapusRevisi($plan)->assertRedirect();
        $this->assertSame('2027-08-01', $plan->fresh()->start_date);

        $this->hapusRevisi($plan)->assertRedirect();
        $this->assertSame('2027-07-01', $plan->fresh()->start_date);
        $this->assertSame(0, $plan->fresh()->jumlahRevisi());
    }

    /** Durasi ikut dihitung ulang dari jadwal yang dipulihkan. */
    public function test_durasi_ikut_dihitung_ulang(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $plan->catatRevisi('2027-07-01', '2027-07-10', 'awal');
        $plan->refresh();
        $this->assertSame(10, $plan->durasi);

        $plan->catatRevisi('2027-08-01', '2027-08-20', 'diperpanjang');
        $plan->refresh();
        $this->assertSame(20, $plan->durasi);

        $this->hapusRevisi($plan)->assertRedirect();

        $this->assertSame(10, $plan->fresh()->durasi);
    }

    /** Halaman revisi tetap terbuka dan riwayatnya menyusut setelah dibatalkan. */
    public function test_halaman_revisi_menampilkan_riwayat_yang_menyusut(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $plan->catatRevisi('2027-08-01', null, 'geser');
        $plan->refresh();

        $this->get("/daily-meetings/rencana/{$plan->id}/revisi")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('plan.revisions', 2)
                ->where('jumlahRevisi', 1)
            );

        $this->hapusRevisi($plan);

        $this->get("/daily-meetings/rencana/{$plan->id}/revisi")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('plan.revisions', 1)
                ->where('jumlahRevisi', 0)
            );
    }
}
