<?php

namespace App\Http\Controllers;

use App\Models\OutagePlan;
use App\Models\TagihanOh;
use App\Models\DailyMeeting;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Progress by plant type (PLTD, PLTM, PLTMG)
        $progressByType = OutagePlan::select('jenis_pembangkit', DB::raw('AVG(progres_persen) as avg_progress'), DB::raw('COUNT(*) as total'))
            ->groupBy('jenis_pembangkit')
            ->get()
            ->keyBy('jenis_pembangkit');

        $plantProgress = [
            'PLTD'  => ['progress' => round($progressByType->get('pltd')?->avg_progress ?? 0, 1), 'count' => $progressByType->get('pltd')?->total ?? 0],
            'PLTM'  => ['progress' => round($progressByType->get('pltm')?->avg_progress ?? 0, 1), 'count' => $progressByType->get('pltm')?->total ?? 0],
            'PLTMG' => ['progress' => round($progressByType->get('pltmg')?->avg_progress ?? 0, 1), 'count' => $progressByType->get('pltmg')?->total ?? 0],
        ];

        // Financial stats — use actual DB columns
        $totalNilaiKontrak  = TagihanOh::sum('nilai_kontrak');
        $totalTerbayar      = TagihanOh::sum('terbayar');
        $totalBelumTerbayar = TagihanOh::sum('belum_terbayar');

        // Financial by pembangkit for grouped bar chart
        $financialByUnit = TagihanOh::select(
                'pembangkit',
                DB::raw('SUM(nilai_kontrak) as nilai_kontrak'),
                DB::raw('SUM(terbayar) as terbayar'),
                DB::raw('SUM(belum_terbayar) as belum_terbayar')
            )
            ->groupBy('pembangkit')
            ->get();

        // Financial by tahun for trend line chart
        $financialByYear = TagihanOh::select(
                'tahun',
                DB::raw('SUM(nilai_kontrak) as nilai_kontrak'),
                DB::raw('SUM(terbayar) as terbayar'),
                DB::raw('SUM(belum_terbayar) as belum_terbayar')
            )
            ->groupBy('tahun')
            ->orderBy('tahun')
            ->get();

        // Scope distribution for pie chart
        $scopeDistribution = OutagePlan::select('scope', DB::raw('COUNT(*) as total'))
            ->groupBy('scope')
            ->get();

        // Meeting stats
        $activeMeetings = DailyMeeting::where('status', 'active')->count();
        $totalMeetings  = DailyMeeting::count();

        // Recent Activity
        $recentOutages = OutagePlan::latest()->take(3)->get()->map(fn($item) => [
            'title' => "{$item->mesin_pembangkit} — Progres {$item->progres_persen}%",
            'time'  => $item->created_at->diffForHumans(),
            'type'  => 'Outage',
        ]);

        $recentTagihan = TagihanOh::latest()->take(3)->get()->map(fn($item) => [
            'title' => "{$item->pekerjaan} ({$item->pembangkit})",
            'time'  => $item->created_at->diffForHumans(),
            'type'  => 'Tagihan',
        ]);

        $recentActivities = $recentOutages->concat($recentTagihan)
            ->sortByDesc('time')
            ->values()
            ->take(6);

        return Inertia::render('dashboard', [
            'stats' => [
                'outage' => [
                    'total'    => OutagePlan::count(),
                    'progress' => $plantProgress,
                    'byScope'  => $scopeDistribution,
                ],
                'tagihan' => [
                    'nilai_kontrak'   => $totalNilaiKontrak,
                    'terbayar'        => $totalTerbayar,
                    'belum_terbayar'  => $totalBelumTerbayar,
                    'byUnit'          => $financialByUnit,
                    'byYear'          => $financialByYear,
                ],
                'meetings' => [
                    'active' => $activeMeetings,
                    'total'  => $totalMeetings,
                ],
            ],
            'recentActivities' => $recentActivities,
        ]);
    }
}
