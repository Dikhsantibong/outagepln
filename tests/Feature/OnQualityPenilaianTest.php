<?php

namespace Tests\Feature;

use App\Models\KinerjaQuality;
use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnQualityPenilaianTest extends TestCase
{
    use RefreshDatabase;

    private function plan(float $progress = 100): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => now()->format('Y-m-d'),
            'progress' => $progress,
        ]);
    }

    private function kinerja(array $attrs): KinerjaQuality
    {
        return KinerjaQuality::create(['outage_plan_id' => $this->plan()->id] + $attrs);
    }

    public function test_kenaikan_daya_mampu_dihitung_dalam_persen(): void
    {
        // Contoh dari spesifikasi: 1500 -> 2100 adalah kenaikan 40%.
        $k = $this->kinerja([
            'dm_sebelum' => 1500, 'dm_sesudah' => 2100,
            'sfc_sebelum' => 0.25, 'sfc_sesudah' => 0.24,
        ]);

        $this->assertSame(40.0, $k->dm_naik_persen);
        $this->assertTrue($k->dm_tercapai);
    }

    public function test_sfc_harus_turun_untuk_tercapai(): void
    {
        $turun = $this->kinerja([
            'dm_sebelum' => 1500, 'dm_sesudah' => 2100,
            'sfc_sebelum' => 0.25, 'sfc_sesudah' => 0.20,
        ]);

        $this->assertSame(20.0, $turun->sfc_turun_persen);
        $this->assertTrue($turun->sfc_tercapai);
        $this->assertTrue($turun->tercapai);

        // Daya mampu naik, tapi SFC ikut naik: belum tercapai.
        $naik = $this->kinerja([
            'dm_sebelum' => 1500, 'dm_sesudah' => 2100,
            'sfc_sebelum' => 0.20, 'sfc_sesudah' => 0.25,
        ]);

        $this->assertSame(-25.0, $naik->sfc_turun_persen);
        $this->assertFalse($naik->sfc_tercapai);
        $this->assertFalse($naik->tercapai);
    }

    public function test_daya_mampu_sama_besar_belum_tercapai(): void
    {
        $k = $this->kinerja([
            'dm_sebelum' => 1500, 'dm_sesudah' => 1500,
            'sfc_sebelum' => 0.25, 'sfc_sesudah' => 0.20,
        ]);

        $this->assertFalse($k->dm_tercapai);
        $this->assertFalse($k->tercapai);
    }

    public function test_data_belum_lengkap_tidak_dinilai(): void
    {
        $k = $this->kinerja(['dm_sebelum' => 1500, 'sfc_sebelum' => 0.25]);

        $this->assertNull($k->tercapai);
        $this->assertNull($k->dm_naik_persen);
        $this->assertFalse($k->is_lengkap);
    }

    public function test_input_tidak_dibulatkan(): void
    {
        $k = $this->kinerja([
            'dm_sebelum' => 1500.5678, 'dm_sesudah' => 2100.1234,
            'sfc_sebelum' => 0.2145, 'sfc_sesudah' => 0.2088,
        ]);

        $k->refresh();

        // decimal(8,2) dulu memotong ini menjadi 0,21 dan 0,21 — SFC jadi
        // tampak tidak berubah padahal turun.
        $this->assertSame(0.2145, $k->sfc_sebelum);
        $this->assertSame(0.2088, $k->sfc_sesudah);
        $this->assertSame(1500.5678, $k->dm_sebelum);
        $this->assertTrue($k->sfc_tercapai);
    }

    public function test_dashboard_menampilkan_parameter_on_quality(): void
    {
        $this->actingAs(User::factory()->create());

        $this->kinerja([
            'dm_sebelum' => 1500, 'dm_sesudah' => 2100,   // +40%
            'sfc_sebelum' => 0.25, 'sfc_sesudah' => 0.20, // -20%
        ]);
        $this->kinerja([
            'dm_sebelum' => 1000, 'dm_sesudah' => 1200,   // +20%
            'sfc_sebelum' => 0.20, 'sfc_sesudah' => 0.25, // SFC naik -> gagal
        ]);

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('stats.kinerja.onQuality.terisi', 2)
            ->where('stats.kinerja.onQuality.nilai', 50)
            ->where('stats.kinerja.onQuality.detail.0.value', '1/2 mesin')
            ->where('stats.kinerja.onQuality.detail.1.value', '2/2 mesin')
            ->where('stats.kinerja.onQuality.detail.2.value', '+30,00%')
            ->where('stats.kinerja.onQuality.detail.3.value', '-2,50%'));
    }

    /**
     * Satu data tercapai dari puluhan mesin tidak boleh terbaca 100%. Penyebutnya
     * adalah seluruh mesin yang overhaulnya sudah selesai, bukan jumlah data yang
     * kebetulan sudah diisi.
     */
    public function test_nilai_dihitung_terhadap_seluruh_mesin_selesai_overhaul(): void
    {
        $this->actingAs(User::factory()->create());

        // Sembilan mesin selesai overhaul tapi belum diukur sama sekali.
        for ($i = 0; $i < 9; $i++) {
            $this->plan();
        }

        // Satu mesin sudah diukur dan tercapai.
        $this->kinerja([
            'dm_sebelum' => 1500, 'dm_sesudah' => 2100,
            'sfc_sebelum' => 0.25, 'sfc_sesudah' => 0.20,
        ]);

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('stats.kinerja.onQuality.terisi', 1)
            ->where('stats.kinerja.onQuality.nilai', 10)   // 1 dari 10, bukan 100%
            ->where('stats.kinerja.onQuality.detail.0.value', '1/10 mesin')
            ->where('stats.kinerja.onQuality.detail.1.value', '1/10 mesin'));
    }

    /** Mesin yang overhaulnya belum selesai belum wajib diukur, jadi tidak ikut penyebut. */
    public function test_mesin_belum_selesai_overhaul_tidak_ikut_penyebut(): void
    {
        $this->actingAs(User::factory()->create());

        $this->plan(40);
        $this->plan(0);
        $this->kinerja([
            'dm_sebelum' => 1500, 'dm_sesudah' => 2100,
            'sfc_sebelum' => 0.25, 'sfc_sesudah' => 0.20,
        ]);

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('stats.kinerja.onQuality.nilai', 100)
            ->where('stats.kinerja.onQuality.detail.0.value', '1/1 mesin'));
    }
}
