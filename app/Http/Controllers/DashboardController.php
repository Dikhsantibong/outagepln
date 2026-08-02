<?php

namespace App\Http\Controllers;

use App\Models\DailyMeeting;
use App\Models\KinerjaCost;
use App\Models\KinerjaQuality;
use App\Models\KinerjaTime;
use App\Models\OutagePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        // Every figure below is scoped: a pengelola only ever sees its own
        // brand, while admin/tamu (merek = null) still see everything.
        $plans = fn () => OutagePlan::visibleTo($user);
        $planIds = $plans()->pluck('id');

        return Inertia::render('dashboard', [
            'scope' => [
                'merek' => $user?->merek,
                'role' => $user?->role,
            ],
            'stats' => [
                'total' => $plans()->count(),
                'status' => $this->statusCounts($plans),
                'jenis' => $this->groupCount($plans, 'jenis_pembangkit'),
                'sistem' => $this->groupCount($plans, 'sistem'),
                'merek' => $this->groupCount($plans, 'merek'),
                'scopeDistribution' => $this->groupCount($plans, 'scope'),
                'ket' => $this->groupCount($plans, 'ket'),
                'monthlyTimeline' => $this->monthlyTimeline($plans),
                'progressDistribution' => $this->progressDistribution($plans),
                'durasiByScope' => $this->durasiByScope($plans),
                'kinerja' => $this->kinerja($planIds),
                'meetings' => $this->meetings($planIds),
            ],
            'ongoingOutages' => $this->ongoing($plans),
            'upcomingOutages' => $this->upcoming($plans),
            'outageMeetings' => $this->outageMeetings($plans),
        ]);
    }

    /** Belum mulai / berjalan / selesai, derived from the cumulative progress. */
    private function statusCounts(callable $plans): array
    {
        $selesai = $plans()->where('progress', '>=', 100)->count();
        $berjalan = $plans()->where('progress', '>', 0)->where('progress', '<', 100)->count();
        $total = $plans()->count();

        return [
            'selesai' => $selesai,
            'berjalan' => $berjalan,
            'belum' => $total - $selesai - $berjalan,
        ];
    }

    /** @return array<int, array{label: string, total: int}> */
    private function groupCount(callable $plans, string $column): array
    {
        return $plans()
            ->select($column . ' as label', DB::raw('COUNT(*) as total'))
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->groupBy($column)
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['label' => (string) $r->label, 'total' => (int) $r->total])
            ->all();
    }

    private function monthlyTimeline(callable $plans): array
    {
        return $plans()
            ->select(DB::raw("DATE_FORMAT(start_date, '%Y-%m') as bulan"), DB::raw('COUNT(*) as total'))
            ->whereNotNull('start_date')
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get()
            ->map(fn ($r) => ['bulan' => $r->bulan, 'total' => (int) $r->total])
            ->all();
    }

    private function progressDistribution(callable $plans): array
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
            $out[] = ['range' => $range, 'count' => $filter($plans())->count()];
        }

        return $out;
    }

    private function durasiByScope(callable $plans): array
    {
        return $plans()
            ->select('scope', DB::raw('AVG(durasi) as avg_durasi'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('scope')->where('scope', '!=', '')
            ->whereNotNull('durasi')
            ->groupBy('scope')
            ->orderByDesc('avg_durasi')
            ->get()
            ->map(fn ($r) => [
                'scope' => (string) $r->scope,
                'avg_durasi' => round((float) $r->avg_durasi, 1),
                'total' => (int) $r->total,
            ])
            ->all();
    }

    /**
     * Share of machines whose performance data has been recorded and meets the
     * target, limited to the plans this account can see.
     */
    private function kinerja($planIds): array
    {
        $pct = fn (int $good, int $of) => $of > 0 ? round(($good / $of) * 100, 1) : 0;

        $qTotal = KinerjaQuality::whereIn('outage_plan_id', $planIds)->whereNotNull('dm_sesudah')->count();
        $qGood = KinerjaQuality::whereIn('outage_plan_id', $planIds)
            ->whereNotNull('dm_sesudah')->whereColumn('dm_sesudah', '>=', 'dm_sebelum')->count();

        $tTotal = KinerjaTime::whereIn('outage_plan_id', $planIds)->whereNotNull('selesai_aktual')->count();
        $tGood = KinerjaTime::whereIn('outage_plan_id', $planIds)
            ->join('outage_plans', 'kinerja_times.outage_plan_id', '=', 'outage_plans.id')
            ->whereNotNull('kinerja_times.selesai_aktual')
            ->whereNotNull('outage_plans.selesai')
            ->whereColumn('kinerja_times.selesai_aktual', '<=', 'outage_plans.selesai')
            ->count();

        $cTotal = KinerjaCost::whereIn('outage_plan_id', $planIds)->whereNotNull('anggaran_aktual')->count();
        $cGood = KinerjaCost::whereIn('outage_plan_id', $planIds)
            ->whereNotNull('anggaran_aktual')->whereNotNull('anggaran_rencana')
            ->whereColumn('anggaran_aktual', '<=', 'anggaran_rencana')->count();

        return [
            // `terisi` lets the UI say "0% of 0 recorded" instead of implying failure.
            'onQuality' => ['nilai' => $pct($qGood, $qTotal), 'terisi' => $qTotal],
            'onTime' => ['nilai' => $pct($tGood, $tTotal), 'terisi' => $tTotal],
            'onCost' => ['nilai' => $pct($cGood, $cTotal), 'terisi' => $cTotal],
            'onScope' => ['nilai' => 0, 'terisi' => 0],   // modul belum tersedia
            'onSafety' => ['nilai' => 0, 'terisi' => 0],  // modul belum tersedia
        ];
    }

    private function meetings($planIds): array
    {
        $base = fn () => DailyMeeting::whereIn('outage_plan_id', $planIds);

        return [
            'total' => $base()->count(),
            'hariIni' => $base()->where('status', 'active')->whereDate('tanggal', today())->count(),
            'akanDatang' => $base()->where('status', 'active')->whereDate('tanggal', '>', today())->count(),
            'selesai' => $base()->where('status', 'completed')->count(),
        ];
    }

    private function ongoing(callable $plans): array
    {
        return $plans()
            ->where('progress', '>', 0)->where('progress', '<', 100)
            ->orderByDesc('progress')
            ->take(8)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'mesin' => $p->mesin_pembangkit,
                'scope' => $p->scope,
                'jenis' => $p->jenis_pembangkit,
                'merek' => $p->merek,
                'progress' => (float) ($p->progress ?? 0),
                'start_date' => $p->start_date,
                'selesai' => $p->selesai,
            ])
            ->all();
    }

    /** Work that has not started yet and is closest on the calendar. */
    private function upcoming(callable $plans): array
    {
        return $plans()
            ->whereNotNull('start_date')
            ->whereDate('start_date', '>=', today())
            ->where(fn ($q) => $q->whereNull('progress')->orWhere('progress', '<=', 0))
            ->orderBy('start_date')
            ->take(6)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'mesin' => $p->mesin_pembangkit,
                'scope' => $p->scope,
                'jenis' => $p->jenis_pembangkit,
                'start_date' => $p->start_date,
                'durasi' => $p->durasi,
            ])
            ->all();
    }

    private function outageMeetings(callable $plans): array
    {
        $today = today()->toDateString();

        $rows = DailyMeeting::query()
            ->whereIn('outage_plan_id', $plans()->pluck('id'))
            ->whereNotNull('tanggal')
            ->with('outagePlan:id,mesin_pembangkit,scope,jenis_pembangkit')
            ->orderBy('tanggal')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'mesin' => $m->outagePlan->mesin_pembangkit ?? $m->judul,
                'scope' => $m->outagePlan->scope ?? '-',
                'jenis' => $m->outagePlan->jenis_pembangkit ?? '-',
                'type' => $m->tipe_rapat ?? 'RAPAT',
                'date' => $m->tanggal->toDateString(),
            ]);

        return [
            'today' => $rows->where('date', $today)->values()->all(),
            'upcoming' => $rows->where('date', '>', $today)->take(8)->values()->all(),
        ];
    }
}
