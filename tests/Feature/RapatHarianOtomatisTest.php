<?php

namespace Tests\Feature;

use App\Models\DailyBriefing;
use App\Models\OutagePlan;
use App\Models\User;
use App\Support\RapatHarianOtomatis;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Rapat harian dibentuk otomatis dari pekerjaan yang sedang berjalan.
 *
 * Yang diuji: harinya dihitung dari Real Start sepanjang durasi, penomorannya
 * tidak melompat walau rapat dilewat, isi hari lama tetap utuh saat hari
 * berikutnya dipakai, dan pembentukannya aman dipanggil berulang.
 */
class RapatHarianOtomatisTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        return $user;
    }

    /** Pekerjaan yang sedang berjalan: progres di antara 0 dan 100. */
    private function rencanaBerjalan(array $ubah = []): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #05 (MIRRLEES)',
            'scope' => 'MO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2026-07-01',
            'selesai' => '2026-07-10',
            'real_start' => '2026-07-05',
            'durasi' => 5,
            'progress' => 40,
            ...$ubah,
        ]);
    }

    public function test_hari_dihitung_dari_real_start_sepanjang_durasi(): void
    {
        $plan = $this->rencanaBerjalan();

        $this->assertSame([
            '2026-07-05',
            '2026-07-06',
            '2026-07-07',
            '2026-07-08',
            '2026-07-09',
        ], $plan->tanggalHarianOutage());
    }

    /** Selama Real Start belum diisi, rencana start yang jadi acuan. */
    public function test_tanpa_real_start_hari_dimulai_dari_rencana_start(): void
    {
        $plan = $this->rencanaBerjalan(['real_start' => null, 'durasi' => 3]);

        $this->assertSame(
            ['2026-07-01', '2026-07-02', '2026-07-03'],
            $plan->tanggalHarianOutage(),
        );
    }

    public function test_durasi_kosong_memakai_rentang_rencana(): void
    {
        $plan = $this->rencanaBerjalan([
            'real_start' => null,
            'durasi' => null,
            'start_date' => '2026-07-01',
            'selesai' => '2026-07-04',
        ]);

        $this->assertCount(4, $plan->tanggalHarianOutage());
    }

    public function test_rapat_terbentuk_otomatis_saat_daftar_dibuka(): void
    {
        $plan = $this->rencanaBerjalan();
        $this->admin();

        $this->assertSame(0, DailyBriefing::count());

        $this->get('/daily-briefings')->assertOk();

        $this->assertSame(5, DailyBriefing::where('outage_plan_id', $plan->id)->count());
        $this->assertSame(
            [1, 2, 3, 4, 5],
            DailyBriefing::where('outage_plan_id', $plan->id)
                ->orderBy('hari_ke')->pluck('hari_ke')->all(),
        );
    }

    /** Hari pertama jadi kepala rangkaian; sisanya menggantung padanya. */
    public function test_hari_lanjutan_tergabung_dalam_satu_rangkaian(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);

        $hari1 = DailyBriefing::where('outage_plan_id', $plan->id)->where('hari_ke', 1)->firstOrFail();
        $hari5 = DailyBriefing::where('outage_plan_id', $plan->id)->where('hari_ke', 5)->firstOrFail();

        $this->assertNull($hari1->parent_id);
        $this->assertSame($hari1->id, $hari5->parent_id);
        $this->assertSame($hari1->id, $hari5->seriesHeadId());
        $this->assertSame(5, $hari5->seriesDays()->count());
    }

    public function test_pekerjaan_yang_belum_atau_sudah_selesai_tidak_dibuatkan_rapat(): void
    {
        $this->rencanaBerjalan(['progress' => 0, 'mesin_pembangkit' => 'PLTD RAHA #01 (CUMMINS)']);
        $this->rencanaBerjalan(['progress' => 100, 'mesin_pembangkit' => 'PLTD RAHA #02 (CUMMINS)']);

        RapatHarianOtomatis::sinkronkanYangBerjalan();

        $this->assertSame(0, DailyBriefing::count());
    }

    public function test_sinkronisasi_berulang_tidak_menggandakan_hari(): void
    {
        $plan = $this->rencanaBerjalan();

        RapatHarianOtomatis::sinkronkan($plan);
        $kedua = RapatHarianOtomatis::sinkronkan($plan);

        $this->assertSame(0, $kedua);
        $this->assertSame(5, DailyBriefing::where('outage_plan_id', $plan->id)->count());
    }

    /** Durasi bertambah hanya menambah hari, tidak menyentuh yang sudah ada. */
    public function test_durasi_bertambah_menambah_hari_baru(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);

        $plan->update(['durasi' => 7]);
        $tambahan = RapatHarianOtomatis::sinkronkan($plan->fresh());

        $this->assertSame(2, $tambahan);
        $this->assertSame(7, DailyBriefing::where('outage_plan_id', $plan->id)->count());
    }

    /** Durasi diperpendek tidak boleh membuang hari yang notulennya sudah diisi. */
    public function test_durasi_diperpendek_tidak_menghapus_hari_yang_sudah_ada(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);

        $plan->update(['durasi' => 2]);
        RapatHarianOtomatis::sinkronkan($plan->fresh());

        $this->assertSame(5, DailyBriefing::where('outage_plan_id', $plan->id)->count());
    }

    /**
     * Rapat kerap dilewat: hari 1 diisi, hari 2–4 kosong, lalu berlanjut di
     * hari 5. Isi hari 1 harus tetap utuh dan tetap bisa dibuka.
     */
    public function test_isi_hari_pertama_tetap_utuh_saat_rapat_dilanjutkan_di_hari_kelima(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        $hari = fn (int $n) => DailyBriefing::where('outage_plan_id', $plan->id)
            ->where('hari_ke', $n)->firstOrFail();

        $hari1 = $hari(1);
        $hari5 = $hari(5);

        // Rapat hari pertama: satu temuan dicatat.
        $this->post("/daily-briefings/{$hari1->id}/findings", [
            'uraian' => 'STUD BOLT CYLINDER HEAD NO. 7',
            'target' => 'Open',
        ])->assertRedirect();

        // Hari 2–4 dilewat, rapat berlanjut di hari kelima.
        $this->post("/daily-briefings/{$hari5->id}/findings", [
            'uraian' => 'KEBOCORAN OLI',
            'target' => 'Open',
        ])->assertRedirect();

        $this->assertSame(1, $hari1->findings()->count());
        $this->assertSame(1, $hari5->findings()->count());
        $this->assertSame(0, $hari(3)->findings()->count());

        // Hari pertama tetap terbuka dan temuannya masih tampil.
        $this->get("/daily-briefings/{$hari1->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('findings', 1)
                ->where('findings.0.uraian', 'STUD BOLT CYLINDER HEAD NO. 7')
                ->has('days', 5)
            );
    }

    /** Hari yang sudah ada isinya ditandai, hari yang dilewat tidak. */
    public function test_hari_yang_terisi_ditandai_pada_navigasi(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        $hari1 = DailyBriefing::where('outage_plan_id', $plan->id)->where('hari_ke', 1)->firstOrFail();

        $this->post("/daily-briefings/{$hari1->id}/findings", [
            'uraian' => 'Temuan hari pertama',
            'target' => 'Open',
        ])->assertRedirect();

        $this->get("/daily-briefings/{$hari1->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('days.0.hari_ke', 1)
                ->where('days.0.ada_isi', true)
                ->where('days.1.hari_ke', 2)
                ->where('days.1.ada_isi', false)
            );
    }

    /** Rute penambahan hari manual sudah ditiadakan. */
    public function test_penambahan_hari_manual_tidak_tersedia_lagi(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        $hari1 = DailyBriefing::where('outage_plan_id', $plan->id)->where('hari_ke', 1)->firstOrFail();

        $this->post("/daily-briefings/{$hari1->id}/add-day")->assertNotFound();

        $this->assertSame(5, DailyBriefing::where('outage_plan_id', $plan->id)->count());
    }

    /** Rapat lama yang dulu dibuat manual tidak ikut terganggu. */
    public function test_rapat_lama_tanpa_rencana_tetap_bisa_dibuka(): void
    {
        $this->admin();

        $lama = DailyBriefing::create([
            'judul' => 'Rapat manual lama',
            'tanggal' => '2026-04-15',
            'status' => 'active',
        ]);

        $this->get("/daily-briefings/{$lama->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('days', 1));
    }
}
