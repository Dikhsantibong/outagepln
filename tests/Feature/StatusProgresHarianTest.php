<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Status harian: Leading, On Progres, atau Lagging.
 *
 * Yang diuji terutama: hari yang rencananya sudah diisi tapi realisasinya belum
 * dilaporkan sama sekali tidak boleh terbaca Lagging. Realisasi yang belum masuk
 * bukan berarti pekerjaannya terlambat, dan bila dianggap 0 seluruh hari yang
 * menunggu laporan akan membengkakkan akumulasi Lagging.
 */
class StatusProgresHarianTest extends TestCase
{
    use RefreshDatabase;

    private function plan(): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #05 (MIRRLEES)',
            'scope' => 'MO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2026-07-01',
            'selesai' => '2026-07-10',
            'real_start' => '2026-07-01',
            'durasi' => 5,
        ]);
    }

    /** @return array<string, array{0: float|null, 1: float|null, 2: string}> */
    public static function statusProvider(): array
    {
        return [
            'rencana terisi, realisasi belum dilaporkan' => [50.0, null, 'On Progres'],
            'realisasi diisi nol — laporan bahwa belum bergerak' => [50.0, 0.0, 'Lagging'],
            'realisasi tertinggal dari rencana' => [50.0, 30.0, 'Lagging'],
            'realisasi sama dengan rencana' => [50.0, 50.0, 'On Progres'],
            'realisasi melampaui rencana' => [50.0, 70.0, 'Leading'],
            'dua-duanya belum diisi' => [null, null, '-'],
            'realisasi ada tanpa rencana' => [null, 20.0, 'Leading'],
            'rencana nol dan realisasi nol' => [0.0, 0.0, 'On Progres'],
        ];
    }

    #[DataProvider('statusProvider')]
    public function test_status_harian_dihitung_dari_rencana_dan_realisasi(
        ?float $rencana,
        ?float $realisasi,
        string $harapan,
    ): void {
        $baris = $this->plan()->dailyProgresses()->create([
            'tanggal' => '2026-07-01',
            'plan_progress' => $rencana,
            'actual_progress' => $realisasi,
        ]);

        $this->assertSame($harapan, $baris->status);
    }

    /**
     * Rencana yang sudah diisi penuh di muka tidak membuat seluruh sisa hari
     * terbaca tertinggal selama realisasinya belum dilaporkan.
     */
    public function test_rencana_terisi_penuh_tidak_membuat_sisa_hari_lagging(): void
    {
        $plan = $this->plan();

        // Rencana diisi merata untuk lima hari, realisasi baru dua hari pertama.
        $rencana = [20, 40, 60, 80, 100];
        $realisasi = [20, 35, null, null, null];

        foreach ($rencana as $i => $nilai) {
            $plan->dailyProgresses()->create([
                'tanggal' => '2026-07-0'.($i + 1),
                'plan_progress' => $nilai,
                'actual_progress' => $realisasi[$i],
            ]);
        }

        $status = $plan->dailyProgresses()->orderBy('tanggal')->get()->pluck('status')->all();

        $this->assertSame(
            ['On Progres', 'Lagging', 'On Progres', 'On Progres', 'On Progres'],
            $status,
        );

        // Hanya satu hari yang benar-benar tertinggal, bukan empat.
        $this->assertSame(1, collect($status)->filter(fn ($s) => $s === 'Lagging')->count());
    }

    /** Halaman detail menerima status yang sama dengan hitungan di atas. */
    public function test_halaman_detail_mengirim_status_yang_benar(): void
    {
        $plan = $this->plan();
        $plan->dailyProgresses()->create([
            'tanggal' => '2026-07-01',
            'plan_progress' => 20,
            'actual_progress' => 20,
        ]);
        $plan->dailyProgresses()->create([
            'tanggal' => '2026-07-02',
            'plan_progress' => 40,
            'actual_progress' => null,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $this->get("/outage-plans/{$plan->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('outagePlan.daily_progresses.0.status', 'On Progres')
                ->where('outagePlan.daily_progresses.1.status', 'On Progres')
            );
    }

    /**
     * Progres keseluruhan tetap diambil dari hari terakhir yang realisasinya
     * terisi, jadi hari yang menunggu laporan tidak menyeret angkanya turun.
     */
    public function test_progres_keseluruhan_memakai_hari_terakhir_yang_terisi(): void
    {
        $plan = $this->plan();
        $plan->dailyProgresses()->create([
            'tanggal' => '2026-07-01',
            'plan_progress' => 20,
            'actual_progress' => 18,
        ]);
        $plan->dailyProgresses()->create([
            'tanggal' => '2026-07-02',
            'plan_progress' => 40,
            'actual_progress' => null,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $this->get("/outage-plans/{$plan->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('overallPlan', fn ($v) => (float) $v === 20.0)
                ->where('overallActual', fn ($v) => (float) $v === 18.0)
            );
    }
}
