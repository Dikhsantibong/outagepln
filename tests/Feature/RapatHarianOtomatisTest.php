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

    /**
     * Pekerjaan yang sedang berjalan: sudah punya laporan progres harian.
     *
     * Barisan harian sengaja ikut dibuat, karena itulah penanda pekerjaan
     * benar-benar dikerjakan — bukan kolom `progress` semata.
     */
    private function rencanaBerjalan(array $ubah = []): OutagePlan
    {
        $plan = OutagePlan::create([
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

        $plan->dailyProgresses()->create([
            'tanggal' => $plan->real_start ?: $plan->start_date,
            'plan_progress' => 20,
            'actual_progress' => $plan->progress,
        ]);

        return $plan->fresh();
    }

    /** Rencana tanpa satu pun laporan harian — belum dikerjakan. */
    private function rencanaTanpaProgresHarian(array $ubah = []): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD RAHA #09 (CUMMINS)',
            'scope' => 'MO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2026-07-01',
            'selesai' => '2026-07-10',
            'real_start' => '2026-07-05',
            'durasi' => 5,
            'progress' => 98,
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

    public function test_pekerjaan_yang_sudah_selesai_tidak_dibuatkan_rapat(): void
    {
        $this->rencanaBerjalan(['progress' => 100, 'mesin_pembangkit' => 'PLTD RAHA #02 (CUMMINS)']);

        RapatHarianOtomatis::sinkronkanYangBerjalan();

        $this->assertSame(0, DailyBriefing::count());
    }

    /**
     * Yang menandai pekerjaan berjalan adalah laporan progres hariannya.
     *
     * Rencana hasil impor membawa angka progres dari lembar sumber tanpa baris
     * harian sama sekali — pekerjaan itu belum dikerjakan, jadi tidak boleh
     * dibuatkan rapat.
     */
    public function test_rencana_tanpa_progres_harian_tidak_dibuatkan_rapat(): void
    {
        $this->rencanaTanpaProgresHarian();

        RapatHarianOtomatis::sinkronkanYangBerjalan();

        $this->assertSame(0, DailyBriefing::count());
    }

    /** Baris harian yang aktualnya masih kosong belum menandai pekerjaan jalan. */
    public function test_baris_harian_tanpa_aktual_belum_menandai_pekerjaan_berjalan(): void
    {
        $plan = $this->rencanaTanpaProgresHarian();
        $plan->dailyProgresses()->create([
            'tanggal' => '2026-07-05',
            'plan_progress' => 20,
            'actual_progress' => null,
        ]);

        RapatHarianOtomatis::sinkronkanYangBerjalan();

        $this->assertSame(0, DailyBriefing::count());
    }

    /** Begitu satu hari dilaporkan, rapatnya langsung terbentuk. */
    public function test_rapat_terbentuk_begitu_progres_harian_pertama_dicatat(): void
    {
        $plan = $this->rencanaTanpaProgresHarian();

        RapatHarianOtomatis::sinkronkanYangBerjalan();
        $this->assertSame(0, DailyBriefing::count());

        $plan->dailyProgresses()->create([
            'tanggal' => '2026-07-05',
            'plan_progress' => 20,
            'actual_progress' => 15,
        ]);

        RapatHarianOtomatis::sinkronkanYangBerjalan();

        $this->assertSame(5, DailyBriefing::where('outage_plan_id', $plan->id)->count());
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

    /**
     * Daftar rapat menampilkan satu baris per mesin, bukan satu baris per hari.
     *
     * Seluruh hari pelaksanaan terbentuk sendiri, jadi menampilkannya satu-satu
     * membuat satu mesin terulang berpuluh kali dan daftarnya tidak terbaca.
     */
    public function test_daftar_menampilkan_satu_baris_per_mesin(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        $this->assertSame(5, DailyBriefing::where('outage_plan_id', $plan->id)->count());

        $this->get('/daily-briefings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('briefings.data', 1)
                ->where('briefings.data.0.judul', 'Daily Meeting - PLTD POASIA #05 (MIRRLEES)')
                ->where('briefings.data.0.jumlah_hari', 5)
                ->where('briefings.data.0.tanggal', '2026-07-05')
                ->where('briefings.data.0.tanggal_akhir', '2026-07-09')
            );
    }

    /** Barisnya menunjuk ke hari pertama, jadi Detail membuka rangkaiannya. */
    public function test_baris_daftar_menunjuk_hari_pertama_rangkaian(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        $hari1 = DailyBriefing::where('outage_plan_id', $plan->id)
            ->where('hari_ke', 1)->firstOrFail();

        $this->get('/daily-briefings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('briefings.data.0.id', $hari1->id));
    }

    /** Hitungan hari terisi ikut naik begitu notulennya diisi. */
    public function test_daftar_menghitung_hari_yang_sudah_terisi(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        $this->get('/daily-briefings')
            ->assertInertia(fn ($page) => $page->where('briefings.data.0.hari_terisi', 0));

        $hari3 = DailyBriefing::where('outage_plan_id', $plan->id)
            ->where('hari_ke', 3)->firstOrFail();

        $this->post("/daily-briefings/{$hari3->id}/findings", [
            'uraian' => 'Temuan hari ketiga',
            'target' => 'Open',
        ])->assertRedirect();

        $this->get('/daily-briefings')
            ->assertInertia(fn ($page) => $page
                ->where('briefings.data.0.hari_terisi', 1)
                ->where('briefings.data.0.jumlah_hari', 5)
            );
    }

    /** Penyaringan tahun memakai hari mana pun, bukan hari pertamanya saja. */
    public function test_filter_tahun_memakai_seluruh_hari_rangkaian(): void
    {
        // Rangkaian melintasi pergantian tahun: mulai 30 Des 2026.
        $plan = $this->rencanaBerjalan([
            'real_start' => '2026-12-30',
            'start_date' => '2026-12-30',
            'durasi' => 5,
        ]);
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        // Hari pertama di 2026, tapi hari ke-3 sampai ke-5 sudah 2027.
        $this->get('/daily-briefings?tahun=2027')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('briefings.data', 1));
    }

    /**
     * Satu mesin tetap satu baris walau hari pertamanya pernah terhapus.
     *
     * Kolom `parent_id` bersifat nullOnDelete: begitu hari pertama dibuang,
     * seluruh hari sisanya kehilangan induk dan — bila rangkaian dikenali dari
     * parent_id — tiap hari berubah menjadi baris tersendiri, sehingga satu
     * mesin tampil berpuluh kali.
     */
    public function test_menghapus_hari_pertama_tidak_menggandakan_baris_mesin(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        DailyBriefing::where('outage_plan_id', $plan->id)->where('hari_ke', 1)->delete();

        $this->get('/daily-briefings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('briefings.data', 1));
    }

    /** Hari yatim disambungkan lagi ke hari pertama saat disinkronkan. */
    public function test_hari_yatim_disambungkan_kembali_ke_hari_pertama(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);

        // Meniru akibat hari pertama terhapus: seluruh induknya dikosongkan.
        DailyBriefing::where('outage_plan_id', $plan->id)->update(['parent_id' => null]);

        RapatHarianOtomatis::sinkronkan($plan->fresh());

        $hari1 = DailyBriefing::where('outage_plan_id', $plan->id)->where('hari_ke', 1)->firstOrFail();

        $this->assertSame(
            4,
            DailyBriefing::where('outage_plan_id', $plan->id)->where('parent_id', $hari1->id)->count(),
        );
        $this->assertSame(5, $hari1->seriesDays()->count());
    }

    /** Menghapus dari daftar membuang seluruh hari mesin itu, bukan satu hari. */
    public function test_menghapus_dari_daftar_membuang_seluruh_rangkaian(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        $hari1 = DailyBriefing::where('outage_plan_id', $plan->id)->where('hari_ke', 1)->firstOrFail();

        $this->delete("/daily-briefings/{$hari1->id}")->assertRedirect();

        $this->assertSame(0, DailyBriefing::where('outage_plan_id', $plan->id)->count());
    }

    /**
     * Rapat manual lama untuk mesin yang sama tidak boleh tampil sebagai baris
     * kedua — mesin yang sedang berjalan cukup sekali di daftar.
     *
     * Meniru keadaan di produksi: "Rapat Harian - <mesin>" dibuat manual
     * sebelum rapat dibentuk otomatis, dan sudah berisi daftar hadir.
     */
    public function test_rapat_manual_lama_digabung_ke_rangkaian_mesinnya(): void
    {
        $plan = $this->rencanaBerjalan();

        $manual = DailyBriefing::create([
            'judul' => 'Rapat Harian - '.$plan->mesin_pembangkit,
            'tanggal' => '2026-07-07',
            'status' => 'active',
        ]);
        $manual->attendees()->create(['nama' => 'Budi', 'signed_at' => now()]);

        $this->admin();
        $this->get('/daily-briefings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('briefings.data', 1));

        $segar = $manual->fresh();
        $this->assertSame($plan->id, $segar->outage_plan_id);
        // 7 Juli adalah hari ke-3 dihitung dari Real Start 5 Juli.
        $this->assertSame(3, $segar->hari_ke);
        $this->assertSame(1, $segar->attendees()->count());
        $this->assertSame(5, DailyBriefing::where('outage_plan_id', $plan->id)->count());
    }

    /** Isinya ikut terbawa: hari itu langsung terhitung sudah terisi. */
    public function test_isi_rapat_manual_tetap_utuh_setelah_digabung(): void
    {
        $plan = $this->rencanaBerjalan();

        $manual = DailyBriefing::create([
            'judul' => 'Rapat Harian - '.$plan->mesin_pembangkit,
            'tanggal' => '2026-07-06',
            'status' => 'active',
        ]);
        $manual->attendees()->create(['nama' => 'Siti', 'signed_at' => now()]);

        $this->admin();

        $this->get('/daily-briefings')
            ->assertInertia(fn ($page) => $page
                ->where('briefings.data.0.hari_terisi', 1)
                ->where('briefings.data.0.jumlah_hari', 5)
                ->where('briefings.data.0.attendees_count', 1)
            );
    }

    /** Rapat manual di luar rentang pelaksanaan tetap berdiri sendiri. */
    public function test_rapat_manual_di_luar_rentang_tidak_digabung(): void
    {
        $plan = $this->rencanaBerjalan();

        $manual = DailyBriefing::create([
            'judul' => 'Rapat Harian - '.$plan->mesin_pembangkit,
            'tanggal' => '2025-01-01',
            'status' => 'completed',
        ]);

        $this->admin();
        $this->get('/daily-briefings?tahun=semua')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('briefings.data', 2));

        $this->assertNull($manual->fresh()->outage_plan_id);
    }

    /** Rapat manual milik mesin lain tidak ikut tertarik. */
    public function test_rapat_manual_mesin_lain_tidak_ikut_digabung(): void
    {
        $plan = $this->rencanaBerjalan();

        $manual = DailyBriefing::create([
            'judul' => 'Rapat Harian - PLTD RAHA #99 (CUMMINS)',
            'tanggal' => '2026-07-07',
            'status' => 'active',
        ]);

        RapatHarianOtomatis::sinkronkan($plan);

        $this->assertNull($manual->fresh()->outage_plan_id);
    }

    /**
     * Daftar hadir tiap hari selalu dimulai kosong.
     *
     * Berbeda dengan notulen rapat outage yang sengaja dibawa ke rapat
     * berikutnya, kehadiran adalah catatan siapa yang benar-benar datang pada
     * hari itu. Menyalinnya akan membuat orang tercatat hadir di hari yang tidak
     * dihadirinya.
     */
    public function test_hari_baru_selalu_dimulai_tanpa_daftar_hadir(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);

        $hari1 = DailyBriefing::where('outage_plan_id', $plan->id)->where('hari_ke', 1)->firstOrFail();
        $hari1->attendees()->create(['nama' => 'Budi', 'signed_at' => now()]);

        // Durasi bertambah — hari 6 dan 7 baru dibuat setelah hari 1 terisi.
        $plan->update(['durasi' => 7]);
        RapatHarianOtomatis::sinkronkan($plan->fresh());

        foreach ([2, 3, 4, 5, 6, 7] as $hariKe) {
            $hari = DailyBriefing::where('outage_plan_id', $plan->id)
                ->where('hari_ke', $hariKe)->firstOrFail();

            $this->assertSame(0, $hari->attendees()->count(), "hari {$hariKe} tidak kosong");
        }

        $this->assertSame(1, $hari1->attendees()->count());
    }

    /** Absen di satu hari tidak muncul di hari lain. */
    public function test_absensi_satu_hari_tidak_bocor_ke_hari_lain(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);
        $this->admin();

        $hari = fn (int $n) => DailyBriefing::where('outage_plan_id', $plan->id)
            ->where('hari_ke', $n)->firstOrFail();

        $hari1 = $hari(1);
        $hari5 = $hari(5);

        $this->post("/daily-briefings/attend/{$hari1->token}", [
            'nama' => 'Budi',
        ])->assertRedirect();

        $this->post("/daily-briefings/attend/{$hari5->token}", [
            'nama' => 'Siti',
        ])->assertRedirect();

        $this->assertSame(['Budi'], $hari1->attendees()->pluck('nama')->all());
        $this->assertSame(['Siti'], $hari5->attendees()->pluck('nama')->all());
        $this->assertSame(0, $hari(3)->attendees()->count());

        // Halaman hari pertama hanya menampilkan pesertanya sendiri.
        $this->get("/daily-briefings/{$hari1->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('attendees', 1)
                ->where('attendees.0.nama', 'Budi')
            );
    }

    /** Tiap hari punya tautan absensi sendiri, jadi QR-nya tidak tertukar. */
    public function test_tiap_hari_punya_tautan_absensi_sendiri(): void
    {
        $plan = $this->rencanaBerjalan();
        RapatHarianOtomatis::sinkronkan($plan);

        $token = DailyBriefing::where('outage_plan_id', $plan->id)->pluck('token');

        $this->assertCount(5, $token);
        $this->assertCount(5, array_unique($token->all()));
        $this->assertNotContains(null, $token->all());
    }

    /** Rapat manual yang digabung membawa pesertanya sendiri, bukan ke hari lain. */
    public function test_peserta_rapat_manual_hanya_ikut_ke_harinya_sendiri(): void
    {
        $plan = $this->rencanaBerjalan();

        $manual = DailyBriefing::create([
            'judul' => 'Rapat Harian - '.$plan->mesin_pembangkit,
            'tanggal' => '2026-07-07',
            'status' => 'active',
        ]);
        $manual->attendees()->create(['nama' => 'Budi', 'signed_at' => now()]);

        RapatHarianOtomatis::sinkronkan($plan);

        $hari = DailyBriefing::where('outage_plan_id', $plan->id)->get()->keyBy('hari_ke');

        $this->assertSame(1, $hari[3]->attendees()->count());

        foreach ([1, 2, 4, 5] as $hariKe) {
            $this->assertSame(0, $hari[$hariKe]->attendees()->count(), "hari {$hariKe} tidak kosong");
        }
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
