<?php

namespace App\Http\Controllers;

use App\Models\DailyMeeting;
use App\Models\Mesin;
use App\Models\OutagePlan;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    /**
     * Public landing page: condition of the machines, open to anyone.
     *
     * Everything here is deliberately mapped field by field. Passing Eloquent
     * models straight through would publish columns that must stay internal —
     * most importantly DailyMeeting::token, which grants attendance submission
     * through the public /attend/{token} route.
     */
    public function index()
    {
        $total = OutagePlan::count();
        $selesai = OutagePlan::where('progress', '>=', 100)->count();
        $berjalan = OutagePlan::where('progress', '>', 0)->where('progress', '<', 100)->count();

        return Inertia::render('welcome', [
            'canLogin' => Route::has('login'),
            'updatedAt' => now()->translatedFormat('d F Y, H:i') . ' WITA',
            'stats' => [
                'total' => $total,
                'selesai' => $selesai,
                'berjalan' => $berjalan,
                'belum' => $total - $selesai - $berjalan,
                'totalUnit' => Unit::count(),
                'totalMesin' => Mesin::count(),
                'jenis' => $this->groupCount('jenis_pembangkit'),
                'sistem' => $this->groupCount('sistem'),
                'scopeDistribution' => $this->groupCount('scope'),
                'progressDistribution' => $this->progressDistribution(),
                'monthlyTimeline' => $this->monthlyTimeline(),
            ],
            'berjalanList' => $this->berjalanList(),
            'terdekatList' => $this->terdekatList(),
            'rapatTerdekat' => $this->rapatTerdekat(),
        ]);
    }

    /** @return array<int, array{label: string, total: int}> */
    private function groupCount(string $column): array
    {
        return OutagePlan::query()
            ->select($column . ' as label', DB::raw('COUNT(*) as total'))
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->groupBy($column)
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['label' => (string) $r->label, 'total' => (int) $r->total])
            ->all();
    }

    /**
     * Buckets use decimal-safe boundaries; the previous integer ranges silently
     * dropped values such as 25.5 and counted a null progress as not-zero.
     */
    private function progressDistribution(): array
    {
        $buckets = [
            '0%' => fn ($q) => $q->where(fn ($w) => $w->whereNull('progress')->orWhere('progress', '<=', 0)),
            '1-25%' => fn ($q) => $q->whereBetween('progress', [0.01, 25]),
            '26-50%' => fn ($q) => $q->whereBetween('progress', [25.01, 50]),
            '51-75%' => fn ($q) => $q->whereBetween('progress', [50.01, 75]),
            '76-99%' => fn ($q) => $q->whereBetween('progress', [75.01, 99.99]),
            '100%' => fn ($q) => $q->where('progress', '>=', 100),
        ];

        $out = [];
        foreach ($buckets as $range => $filter) {
            $out[] = ['range' => $range, 'count' => $filter(OutagePlan::query())->count()];
        }

        return $out;
    }

    private function monthlyTimeline(): array
    {
        return OutagePlan::query()
            ->select(DB::raw("DATE_FORMAT(start_date, '%Y-%m') as bulan"), DB::raw('COUNT(*) as total'))
            ->whereNotNull('start_date')
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get()
            ->map(fn ($r) => ['bulan' => $r->bulan, 'total' => (int) $r->total])
            ->all();
    }

    private function berjalanList(): array
    {
        return OutagePlan::query()
            ->where('progress', '>', 0)->where('progress', '<', 100)
            ->orderByDesc('progress')
            ->take(8)
            ->get()
            ->map(fn ($p) => [
                'mesin' => $p->mesin_pembangkit,
                'jenis' => $p->jenis_pembangkit,
                'scope' => $p->scope,
                'sistem' => $p->sistem,
                'progress' => (float) ($p->progress ?? 0),
                'mulai' => $p->start_date,
                'selesai' => $p->selesai,
            ])
            ->all();
    }

    private function terdekatList(): array
    {
        return OutagePlan::query()
            ->whereNotNull('start_date')
            ->whereDate('start_date', '>=', today())
            ->where(fn ($q) => $q->whereNull('progress')->orWhere('progress', '<=', 0))
            ->orderBy('start_date')
            ->take(8)
            ->get()
            ->map(fn ($p) => [
                'mesin' => $p->mesin_pembangkit,
                'jenis' => $p->jenis_pembangkit,
                'scope' => $p->scope,
                'sistem' => $p->sistem,
                'durasi' => $p->durasi,
                'mulai' => $p->start_date,
                'selesai' => $p->selesai,
            ])
            ->all();
    }

    /** Meeting agenda without the attendance token or the join link. */
    private function rapatTerdekat(): array
    {
        return DailyMeeting::query()
            ->where('status', 'active')
            ->whereDate('tanggal', '>=', today())
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
