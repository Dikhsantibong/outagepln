<?php

namespace Tests\Feature;

use App\Models\DailyMeeting;
use App\Models\OutagePlan;
use App\Models\User;
use App\Support\NotulenBerlanjut;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Notulen rapat outage berlanjut ke rapat berikutnya.
 *
 * Rangkaian R2 → R3 → P1 → P2 membahas pekerjaan yang sama, jadi permasalahan
 * yang belum tuntas dibawa ke rapat sesudahnya untuk diperbarui. RAPAT P3 tidak
 * ikut karena memakai Notulen Kick Off, bukan daftar permasalahan.
 */
class NotulenBerlanjutTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        return $user;
    }

    /**
     * Rencana beserta kelima rapatnya — dibuat otomatis oleh hook di
     * [OutagePlan::booted()] begitu tanggal rapatnya terisi.
     */
    private function rencana(): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #05 (MIRRLEES)',
            'scope' => 'MO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2027-07-01',
            'rapat_r2' => '2026-07-01',
            'rapat_r3' => '2027-01-02',
            'rapat_p1' => '2027-04-02',
            'rapat_p2' => '2027-06-01',
            'rapat_p3' => '2027-06-24',
        ]);
    }

    private function rapat(OutagePlan $plan, string $tipe): DailyMeeting
    {
        return DailyMeeting::where('outage_plan_id', $plan->id)
            ->where('tipe_rapat', $tipe)
            ->firstOrFail();
    }

    private function isiNotulen(DailyMeeting $rapat, string $permasalahan, string $status = 'Open'): void
    {
        $rapat->issues()->create([
            'permasalahan' => $permasalahan,
            'tindak_lanjut' => 'Koordinasi dengan mitra',
            'target' => 'Jul-27',
            'pic' => 'Rendal HAR',
            'status' => $status,
        ]);
    }

    public function test_notulen_r2_terbawa_saat_rapat_r3_dibuka(): void
    {
        $plan = $this->rencana();
        $this->isiNotulen($this->rapat($plan, 'RAPAT R2'), 'Material belum datang');
        $this->admin();

        $r3 = $this->rapat($plan, 'RAPAT R3');
        $this->assertSame(0, $r3->issues()->count());

        $this->get("/daily-meetings/{$r3->id}")->assertOk();

        $this->assertSame(1, $r3->issues()->count());
        $this->assertSame('Material belum datang', $r3->issues()->first()->permasalahan);
    }

    /** Rantainya berlanjut: R2 → R3 → P1 → P2. */
    public function test_notulen_berlanjut_sampai_rapat_p2(): void
    {
        $plan = $this->rencana();
        $this->isiNotulen($this->rapat($plan, 'RAPAT R2'), 'Material belum datang');
        $this->admin();

        foreach (['RAPAT R3', 'RAPAT P1', 'RAPAT P2'] as $tipe) {
            $rapat = $this->rapat($plan, $tipe);
            $this->get("/daily-meetings/{$rapat->id}")->assertOk();

            $this->assertSame(1, $rapat->issues()->count(), "notulen {$tipe} kosong");
            $this->assertSame(
                'Material belum datang',
                $rapat->issues()->first()->permasalahan,
            );
        }
    }

    /** RAPAT P3 memakai Notulen Kick Off, jadi tidak mewarisi apa pun. */
    public function test_rapat_p3_tidak_mewarisi_notulen(): void
    {
        $plan = $this->rencana();
        $this->isiNotulen($this->rapat($plan, 'RAPAT P2'), 'Sisa pekerjaan mekanik');
        $this->admin();

        $p3 = $this->rapat($plan, 'RAPAT P3');

        $this->get("/daily-meetings/{$p3->id}")->assertOk();

        $this->assertSame(0, $p3->issues()->count());
    }

    /** R2 paling awal — tidak ada rapat sebelumnya untuk diwarisi. */
    public function test_rapat_r2_tidak_mewarisi_apa_pun(): void
    {
        $plan = $this->rencana();
        $this->admin();

        $r2 = $this->rapat($plan, 'RAPAT R2');

        $this->get("/daily-meetings/{$r2->id}")->assertOk();

        $this->assertSame(0, $r2->issues()->count());
    }

    /**
     * Rapat kerap dilewat. Bila R3 tidak digelar, P1 mewarisi langsung dari R2.
     */
    public function test_rapat_yang_dilewat_dilangkahi_saat_mencari_sumber(): void
    {
        $plan = $this->rencana();
        $this->isiNotulen($this->rapat($plan, 'RAPAT R2'), 'Temuan dari R2');
        $this->admin();

        // R3 tidak pernah dibuka, jadi notulennya tetap kosong.
        $p1 = $this->rapat($plan, 'RAPAT P1');

        $this->get("/daily-meetings/{$p1->id}")->assertOk();

        $this->assertSame('Temuan dari R2', $p1->issues()->first()->permasalahan);
        $this->assertSame(0, $this->rapat($plan, 'RAPAT R3')->issues()->count());
    }

    /** Sumbernya rapat terdekat yang terisi, bukan yang paling awal. */
    public function test_sumber_warisan_adalah_rapat_terisi_terdekat(): void
    {
        $plan = $this->rencana();
        $this->isiNotulen($this->rapat($plan, 'RAPAT R2'), 'Dari R2');
        $this->isiNotulen($this->rapat($plan, 'RAPAT R3'), 'Dari R3');
        $this->admin();

        $p1 = $this->rapat($plan, 'RAPAT P1');
        $this->get("/daily-meetings/{$p1->id}")->assertOk();

        $this->assertSame('Dari R3', $p1->issues()->first()->permasalahan);
    }

    /** Notulen rapat lama tidak ikut berubah saat salinannya diperbarui. */
    public function test_memperbarui_salinan_tidak_mengubah_notulen_rapat_asal(): void
    {
        $plan = $this->rencana();
        $r2 = $this->rapat($plan, 'RAPAT R2');
        $this->isiNotulen($r2, 'Material belum datang');
        $this->admin();

        $r3 = $this->rapat($plan, 'RAPAT R3');
        $this->get("/daily-meetings/{$r3->id}")->assertOk();

        $salinan = $r3->issues()->firstOrFail();

        $this->put("/daily-meetings/{$r3->id}/issues/{$salinan->id}", [
            'permasalahan' => 'Material sudah datang',
            'tindak_lanjut' => 'Selesai',
            'target' => 'Jul-27',
            'pic' => 'Rendal HAR',
            'status' => 'Close',
        ])->assertRedirect();

        $this->assertSame('Material sudah datang', $salinan->fresh()->permasalahan);
        $this->assertSame('Material belum datang', $r2->issues()->first()->permasalahan);
        $this->assertSame('Open', $r2->issues()->first()->status);
    }

    /** Membuka berulang tidak menggandakan barisnya. */
    public function test_membuka_berulang_tidak_menggandakan_notulen(): void
    {
        $plan = $this->rencana();
        $this->isiNotulen($this->rapat($plan, 'RAPAT R2'), 'Material belum datang');
        $this->admin();

        $r3 = $this->rapat($plan, 'RAPAT R3');

        $this->get("/daily-meetings/{$r3->id}")->assertOk();
        $this->get("/daily-meetings/{$r3->id}")->assertOk();
        $this->get("/daily-meetings/{$r3->id}")->assertOk();

        $this->assertSame(1, $r3->issues()->count());
    }

    /** Baris yang sengaja dihapus tidak dimunculkan lagi oleh salinan baru. */
    public function test_notulen_yang_sudah_disunting_tidak_tertimpa(): void
    {
        $plan = $this->rencana();
        $this->isiNotulen($this->rapat($plan, 'RAPAT R2'), 'Material belum datang');
        $this->admin();

        $r3 = $this->rapat($plan, 'RAPAT R3');
        $this->get("/daily-meetings/{$r3->id}")->assertOk();

        $this->isiNotulen($r3, 'Permasalahan baru di R3');
        $r3->issues()->where('permasalahan', 'Material belum datang')->delete();

        $this->get("/daily-meetings/{$r3->id}")->assertOk();

        $this->assertSame(1, $r3->issues()->count());
        $this->assertSame('Permasalahan baru di R3', $r3->issues()->first()->permasalahan);
    }

    /** Status ikut terbawa apa adanya, termasuk yang sudah Close. */
    public function test_status_notulen_ikut_terbawa(): void
    {
        $plan = $this->rencana();
        $r2 = $this->rapat($plan, 'RAPAT R2');
        $this->isiNotulen($r2, 'Sudah tuntas', 'Close');
        $this->isiNotulen($r2, 'Masih berjalan', 'Open');
        $this->admin();

        $r3 = $this->rapat($plan, 'RAPAT R3');
        $this->get("/daily-meetings/{$r3->id}")->assertOk();

        $this->assertSame(
            ['Close', 'Open'],
            $r3->issues()->orderBy('id')->pluck('status')->all(),
        );
    }

    /** Layar diberi tahu asal salinannya, dan hanya pada kunjungan penyalinan. */
    public function test_layar_diberi_tahu_asal_salinan_sekali_saja(): void
    {
        $plan = $this->rencana();
        $this->isiNotulen($this->rapat($plan, 'RAPAT R2'), 'Material belum datang');
        $this->admin();

        $r3 = $this->rapat($plan, 'RAPAT R3');

        $this->get("/daily-meetings/{$r3->id}")
            ->assertInertia(fn ($page) => $page->where('notulenWarisanDari', 'RAPAT R2'));

        $this->get("/daily-meetings/{$r3->id}")
            ->assertInertia(fn ($page) => $page->where('notulenWarisanDari', null));
    }

    /** Notulen rapat mesin lain tidak boleh ikut tersalin. */
    public function test_notulen_mesin_lain_tidak_ikut_tersalin(): void
    {
        $plan = $this->rencana();
        $lain = OutagePlan::create([
            'mesin_pembangkit' => 'PLTD RAHA #08 (CUMMINS)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2027-07-01',
            'rapat_r2' => '2026-07-01',
        ]);

        $this->isiNotulen($this->rapat($lain, 'RAPAT R2'), 'Punya mesin lain');
        $this->admin();

        $r3 = $this->rapat($plan, 'RAPAT R3');
        $this->get("/daily-meetings/{$r3->id}")->assertOk();

        $this->assertSame(0, $r3->issues()->count());
    }

    public function test_urutan_rangkaian_notulen_tidak_memuat_p3(): void
    {
        $this->assertSame(
            ['RAPAT R2', 'RAPAT R3', 'RAPAT P1', 'RAPAT P2'],
            DailyMeeting::URUTAN_NOTULEN,
        );

        $plan = $this->rencana();

        $this->assertFalse($this->rapat($plan, 'RAPAT P3')->bolehMewarisiNotulen());
        $this->assertFalse($this->rapat($plan, 'RAPAT R2')->bolehMewarisiNotulen());
        $this->assertTrue($this->rapat($plan, 'RAPAT R3')->bolehMewarisiNotulen());
        $this->assertTrue($this->rapat($plan, 'RAPAT P2')->bolehMewarisiNotulen());
    }

    /**
     * Yang berlanjut hanya notulennya — daftar hadir tidak ikut.
     *
     * Notulen memang dibawa supaya permasalahan tinggal diperbarui, tapi
     * kehadiran adalah catatan siapa yang datang di rapat itu. Menyalinnya akan
     * membuat orang tercatat hadir di rapat yang tidak dihadirinya.
     */
    public function test_daftar_hadir_tidak_ikut_berlanjut_ke_rapat_berikutnya(): void
    {
        $plan = $this->rencana();
        $r2 = $this->rapat($plan, 'RAPAT R2');
        $this->isiNotulen($r2, 'Material belum datang');
        $r2->attendees()->create(['nama' => 'Budi', 'signed_at' => now()]);
        $this->admin();

        $r3 = $this->rapat($plan, 'RAPAT R3');
        $this->get("/daily-meetings/{$r3->id}")->assertOk();

        // Notulennya terbawa...
        $this->assertSame(1, $r3->issues()->count());
        // ...tapi daftar hadirnya tetap kosong.
        $this->assertSame(0, $r3->attendees()->count());
        $this->assertSame(1, $r2->attendees()->count());
    }

    /** Absen di rapat berikutnya tidak menyentuh daftar hadir rapat sebelumnya. */
    public function test_absensi_tiap_rapat_berdiri_sendiri(): void
    {
        $plan = $this->rencana();
        $r2 = $this->rapat($plan, 'RAPAT R2');
        $r3 = $this->rapat($plan, 'RAPAT R3');
        $this->admin();

        $this->post("/attend/{$r2->token}", ['nama' => 'Budi'])->assertRedirect();
        $this->post("/attend/{$r3->token}", ['nama' => 'Siti'])->assertRedirect();

        $this->assertSame(['Budi'], $r2->attendees()->pluck('nama')->all());
        $this->assertSame(['Siti'], $r3->attendees()->pluck('nama')->all());
    }

    /** Dipanggil langsung, layanan mengembalikan rapat asalnya. */
    public function test_layanan_mengembalikan_rapat_asal_salinan(): void
    {
        $plan = $this->rencana();
        $r2 = $this->rapat($plan, 'RAPAT R2');
        $this->isiNotulen($r2, 'Material belum datang');

        $r3 = $this->rapat($plan, 'RAPAT R3');

        $this->assertSame($r2->id, NotulenBerlanjut::wariskan($r3)?->id);
        $this->assertNull(NotulenBerlanjut::wariskan($r3->fresh()));
    }
}
