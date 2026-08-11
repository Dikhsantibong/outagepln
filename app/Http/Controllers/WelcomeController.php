<?php

namespace App\Http\Controllers;

use App\Models\DailyMeeting;
use App\Models\Mesin;
use App\Models\OutagePlan;
use App\Models\Unit;
use App\Support\OutageStats;
use App\Support\TahunFilter;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    /**
     * Public landing page: condition of the machines, open to anyone.
     *
     * Angka di sini memakai OutageStats yang sama dengan dashboard, dan
     * cakupan tahunnya juga default ke tahun berjalan seperti dashboard —
     * supaya total di halaman publik dan di dashboard (untuk akun tanpa merek)
     * benar-benar sama, bukan sekadar mirip.
     *
     * Setiap field tetap dipetakan satu per satu. Mengoper model Eloquent mentah
     * akan mempublikasikan kolom yang harus tetap internal — terutama
     * DailyMeeting::token, yang membuka pengiriman absensi lewat rute publik
     * /attend/{token}.
     */
    public function index()
    {
        // Sama seperti dashboard: default tahun berjalan, jatuh ke tahun
        // terbaru bila tahun berjalan belum ada datanya.
        $tahunOptions = TahunFilter::options(OutagePlan::query(), 'start_date');
        $tahun = TahunFilter::resolve(null, $tahunOptions);

        $stats = new OutageStats(function () use ($tahun) {
            $query = OutagePlan::query();

            return $tahun ? $query->whereYear('start_date', $tahun) : $query;
        });

        $status = $stats->statusCounts();

        return Inertia::render('welcome', [
            'canLogin' => Route::has('login'),
            'updatedAt' => now()->translatedFormat('d F Y, H:i') . ' WITA',
            'tahun' => $tahun ? (string) $tahun : null,
            'stats' => [
                'total' => $stats->total(),
                'selesai' => $status['selesai'],
                'berjalan' => $status['berjalan'],
                'belum' => $status['belum'],
                'totalUnit' => Unit::count(),
                'totalMesin' => Mesin::count(),
                'jenis' => $stats->groupCount('jenis_pembangkit'),
                'sistem' => $stats->groupCount('sistem'),
                'scopeDistribution' => $stats->groupCount('scope'),
                'progressDistribution' => $stats->progressDistribution(),
                'monthlyTimeline' => $stats->monthlyTimeline(),
                'durasiByScope' => $stats->durasiByScope(),
                'kinerja' => $stats->kinerja(),
            ],
            'berjalanList' => $stats->ongoing(),
            'terdekatList' => $stats->upcoming(),
            'rapatTerdekat' => $this->rapatTerdekat($tahun),
        ]);
    }

    /**
     * Meeting agenda without the attendance token or the join link.
     *
     * @return array<int, array<string, mixed>>
     */
    private function rapatTerdekat(?int $tahun): array
    {
        return DailyMeeting::query()
            ->where('status', 'active')
            ->whereDate('tanggal', '>=', today())
            ->when($tahun, fn ($q) => $q->whereYear('tanggal', $tahun))
            ->with('outagePlan:id,mesin_pembangkit,scope')
            ->orderBy('tanggal')
            ->take(6)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'tipe' => $m->tipe_rapat ?? 'RAPAT',
                'mesin' => $m->outagePlan->mesin_pembangkit ?? $m->judul,
                'scope' => $m->outagePlan->scope ?? '-',
                'tanggal' => $m->tanggal?->toDateString(),
            ])
            ->all();
    }
}
