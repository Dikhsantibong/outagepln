<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutagePlanDailyProgressTest extends TestCase
{
    use RefreshDatabase;

    private function plan(): OutagePlan
    {
        $this->actingAs(User::factory()->create());

        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2024-10-31',
            'selesai' => '2024-11-28',
        ]);
    }

    private function payload(OutagePlan $plan, array $daily): array
    {
        return [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'scope' => $plan->scope,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
            'daily_progress' => $daily,
        ];
    }

    public function test_hari_yang_belum_diisi_disimpan_sebagai_null(): void
    {
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-10', 'plan_progress' => '45', 'actual_progress' => '44', 'keterangan' => ''],
            ['tanggal' => '2024-11-11', 'plan_progress' => '', 'actual_progress' => '', 'keterangan' => ''],
        ]))->assertRedirect();

        $rows = $plan->dailyProgresses()->orderBy('tanggal')->get();

        $this->assertSame(45.0, $rows[0]->plan_progress);
        $this->assertNull($rows[1]->plan_progress);
        $this->assertNull($rows[1]->actual_progress);
    }

    public function test_bisa_disimpan_ulang_walau_hari_terakhir_belum_diisi(): void
    {
        $plan = $this->plan();
        $daily = [
            ['tanggal' => '2024-11-10', 'plan_progress' => '45', 'actual_progress' => '44', 'keterangan' => ''],
            ['tanggal' => '2024-11-11', 'plan_progress' => '', 'actual_progress' => '', 'keterangan' => ''],
        ];

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, $daily))->assertRedirect();

        // Simpan kedua kali: dulu terblokir karena hari kosong kembali sebagai 0
        // sehingga terbaca sebagai penurunan progres kumulatif.
        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, $daily))
            ->assertSessionHasNoErrors();

        $this->assertSame(44.0, (float) $plan->fresh()->progress);
        $this->assertNull($plan->dailyProgresses()->orderBy('tanggal')->get()[1]->actual_progress);
    }

    /**
     * Menghapus kembali aktual yang sudah diisi harus menarik plan-nya keluar
     * dari hitungan "sedang berjalan" di dashboard.
     *
     * Dulu kolom `progress` hanya ditimpa kalau aktualnya ada isinya, jadi
     * mengosongkan isian meninggalkan angka lama — mesinnya terus terhitung
     * berjalan padahal progresnya sudah dihapus.
     */
    public function test_menghapus_aktual_mengembalikan_progress_ke_nol(): void
    {
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-10', 'plan_progress' => '45', 'actual_progress' => '44', 'keterangan' => ''],
        ]))->assertRedirect();

        $this->assertSame(44.0, (float) $plan->fresh()->progress);

        // Aktual dikosongkan lagi dari halaman edit.
        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-10', 'plan_progress' => '45', 'actual_progress' => '', 'keterangan' => ''],
        ]))->assertRedirect();

        $this->assertSame(0.0, (float) $plan->fresh()->progress);
    }

    /** Setelah aktual dihapus, mesinnya tidak lagi masuk hitungan berjalan. */
    public function test_mesin_tanpa_aktual_tidak_terhitung_sedang_berjalan(): void
    {
        $plan = $this->plan();
        $berjalan = fn () => OutagePlan::where('progress', '>', 0)
            ->where('progress', '<', 100)
            ->whereKey($plan->id)
            ->count();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-10', 'plan_progress' => '45', 'actual_progress' => '44', 'keterangan' => ''],
        ]))->assertRedirect();

        $this->assertSame(1, $berjalan());

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-10', 'plan_progress' => '45', 'actual_progress' => '', 'keterangan' => ''],
        ]))->assertRedirect();

        $this->assertSame(0, $berjalan());
    }

    /** Menurunkan aktual juga harus menurunkan progres, bukan menahan yang lama. */
    public function test_menurunkan_aktual_ikut_menurunkan_progress(): void
    {
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-10', 'plan_progress' => '50', 'actual_progress' => '80', 'keterangan' => ''],
        ]))->assertRedirect();

        $this->assertSame(80.0, (float) $plan->fresh()->progress);

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-10', 'plan_progress' => '50', 'actual_progress' => '30', 'keterangan' => ''],
        ]))->assertRedirect();

        $this->assertSame(30.0, (float) $plan->fresh()->progress);
    }

    /**
     * Rencana hasil impor membawa progres dari lembar sumber tanpa baris
     * harian. Menyimpan tanpa menyertakan daily_progress sama sekali tidak
     * boleh menghapus angka itu.
     */
    public function test_progress_impor_tidak_terhapus_saat_daily_progress_tidak_dikirim(): void
    {
        $plan = $this->plan();
        $plan->update(['progress' => 98]);

        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'scope' => $plan->scope,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
        ])->assertRedirect();

        $this->assertSame(98.0, (float) $plan->fresh()->progress);
    }

    /**
     * Hari tambahan di luar durasi rencana harus ikut tersimpan — aktual bisa
     * melewati rencana, dan barisnya dikirim apa adanya oleh form.
     */
    public function test_hari_tambahan_di_luar_durasi_ikut_tersimpan(): void
    {
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-05', 'plan_progress' => '50', 'actual_progress' => '40', 'keterangan' => ''],
            ['tanggal' => '2024-11-06', 'plan_progress' => '100', 'actual_progress' => '80', 'keterangan' => ''],
            // Hari ke-3: di luar durasi, ditambahkan lewat tombol Tambah Hari.
            ['tanggal' => '2024-11-07', 'plan_progress' => '100', 'actual_progress' => '100', 'keterangan' => 'Hari tambahan'],
        ]))->assertRedirect();

        $rows = $plan->dailyProgresses()->orderBy('tanggal')->get();

        $this->assertCount(3, $rows);
        $this->assertSame('2024-11-07', $rows[2]->tanggal->toDateString());
        $this->assertSame('Hari tambahan', $rows[2]->keterangan);
        $this->assertSame(100.0, (float) $plan->fresh()->progress);
    }

    public function test_halaman_edit_memuat_rencana_dan_progress_hariannya(): void
    {
        $plan = $this->plan();
        $plan->update(['real_start' => '2024-11-05', 'durasi' => 3]);
        $plan->dailyProgresses()->create([
            'tanggal' => '2024-11-05',
            'plan_progress' => 30,
            'actual_progress' => 25,
        ]);

        $this->get("/outage-plans/{$plan->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('outage-plans/edit')
                ->where('outagePlan.id', $plan->id)
                ->where('outagePlan.real_start', '2024-11-05')
                ->where('outagePlan.daily_progresses.0.plan_progress', 30));
    }

    /** Pengelola tidak boleh mengedit mesin merek lain lewat URL langsung. */
    public function test_halaman_edit_menolak_mesin_di_luar_merek_pengelola(): void
    {
        $milikOrangLain = OutagePlan::create([
            'mesin_pembangkit' => 'PLTD WUA-WUA #01 (CUMMINS)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2024-10-31',
        ]);

        $this->actingAs(User::factory()->create(['merek' => 'MIRRLEES']));

        $this->get("/outage-plans/{$milikOrangLain->id}/edit")->assertForbidden();
    }

    /** Material dan uraian pekerjaan per hari; material masih diketik manual. */
    public function test_material_dan_uraian_pekerjaan_tersimpan(): void
    {
        $plan = $this->plan();
        $uraian = "Bongkar cylinder head\nGanti gasket dan periksa dudukan katup";

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            [
                'tanggal' => '2024-11-10',
                'plan_progress' => '45',
                'actual_progress' => '44',
                'material_part_number' => '1234-5678',
                'material_nama' => 'Gasket cylinder head',
                'uraian_pekerjaan' => $uraian,
                'keterangan' => 'Menunggu material',
            ],
            // Hari tanpa material tetap boleh disimpan.
            ['tanggal' => '2024-11-11', 'plan_progress' => '50', 'actual_progress' => '50', 'keterangan' => ''],
        ]))->assertRedirect()->assertSessionHasNoErrors();

        $rows = $plan->dailyProgresses()->orderBy('tanggal')->get();

        $this->assertSame('1234-5678', $rows[0]->material_part_number);
        $this->assertSame('Gasket cylinder head', $rows[0]->material_nama);
        $this->assertSame($uraian, $rows[0]->uraian_pekerjaan);
        $this->assertSame('Menunggu material', $rows[0]->keterangan);
        $this->assertNull($rows[1]->material_part_number);
        $this->assertNull($rows[1]->uraian_pekerjaan);
    }

    public function test_status_on_progres_saat_plan_dan_actual_sama(): void
    {
        $plan = $this->plan();

        $this->put("/outage-plans/{$plan->id}", $this->payload($plan, [
            ['tanggal' => '2024-11-10', 'plan_progress' => '30', 'actual_progress' => '30', 'keterangan' => ''],
            ['tanggal' => '2024-11-11', 'plan_progress' => '40', 'actual_progress' => '45', 'keterangan' => ''],
            ['tanggal' => '2024-11-12', 'plan_progress' => '60', 'actual_progress' => '50', 'keterangan' => ''],
            ['tanggal' => '2024-11-13', 'plan_progress' => '', 'actual_progress' => '', 'keterangan' => ''],
        ]))->assertRedirect();

        $status = $plan->dailyProgresses()->orderBy('tanggal')->get()->pluck('status')->all();

        $this->assertSame(['On Progres', 'Leading', 'Lagging', '-'], $status);
    }
}
