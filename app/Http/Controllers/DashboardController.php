<?php

namespace App\Http\Controllers;

use App\Models\OutagePlan;
use App\Models\DailyMeeting;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Total outage plans
        $totalOutage = OutagePlan::count();

        // Count by jenis pembangkit
        $countByJenis = OutagePlan::select('jenis_pembangkit', DB::raw('COUNT(*) as total'))
            ->groupBy('jenis_pembangkit')
            ->get()
            ->keyBy('jenis_pembangkit');

        // Average progress by jenis pembangkit
        $progressByType = OutagePlan::select('jenis_pembangkit', DB::raw('AVG(progress) as avg_progress'))
            ->groupBy('jenis_pembangkit')
            ->get()
            ->keyBy('jenis_pembangkit');

        $plantStats = [];
        foreach (['PLTD', 'PLTM', 'PLTMG'] as $jenis) {
            $plantStats[$jenis] = [
                'count' => $countByJenis->get($jenis)?->total ?? 0,
                'progress' => round($progressByType->get($jenis)?->avg_progress ?? 0, 1),
            ];
        }

        // Scope distribution for bar chart
        $scopeDistribution = OutagePlan::select('scope', DB::raw('COUNT(*) as total'))
            ->whereNotNull('scope')
            ->where('scope', '!=', '')
            ->groupBy('scope')
            ->orderByDesc('total')
            ->get();

        // Monthly outage timeline (how many outages start per month)
        $monthlyTimeline = OutagePlan::select(
                DB::raw("DATE_FORMAT(start_date, '%Y-%m') as bulan"),
                DB::raw('COUNT(*) as total')
            )
            ->whereNotNull('start_date')
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get();

        // Progress distribution (group into ranges: 0%, 1-25%, 26-50%, 51-75%, 76-99%, 100%)
        $progressDistribution = [
            ['range' => '0%', 'count' => OutagePlan::where('progress', 0)->count()],
            ['range' => '1-25%', 'count' => OutagePlan::whereBetween('progress', [1, 25])->count()],
            ['range' => '26-50%', 'count' => OutagePlan::whereBetween('progress', [26, 50])->count()],
            ['range' => '51-75%', 'count' => OutagePlan::whereBetween('progress', [51, 75])->count()],
            ['range' => '76-99%', 'count' => OutagePlan::whereBetween('progress', [76, 99])->count()],
            ['range' => '100%', 'count' => OutagePlan::where('progress', 100)->count()],
        ];

        // Durasi average by scope
        $durasiByScope = OutagePlan::select('scope', DB::raw('AVG(durasi) as avg_durasi'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('scope')
            ->where('scope', '!=', '')
            ->whereNotNull('durasi')
            ->groupBy('scope')
            ->orderByDesc('avg_durasi')
            ->get();

        // Meeting stats
        $activeMeetings = DailyMeeting::where('status', 'active')->count();
        $totalMeetings  = DailyMeeting::count();

        // Recent outage activity
        $recentOutages = OutagePlan::latest()->take(5)->get()->map(fn($item) => [
            'mesin' => $item->mesin_pembangkit,
            'scope' => $item->scope,
            'jenis' => $item->jenis_pembangkit,
            'progress' => $item->progress ?? 0,
            'start_date' => $item->start_date,
            'time' => $item->created_at ? $item->created_at->diffForHumans() : '-',
        ]);

        // Calculate Meetings from Outage Plans
        $todayDate = date('Y-m-d');
        $allWithMeetings = OutagePlan::where(function($q) {
                $q->whereNotNull('rapat_r2')
                  ->orWhereNotNull('rapat_r3')
                  ->orWhereNotNull('rapat_p1')
                  ->orWhereNotNull('rapat_p2')
                  ->orWhereNotNull('rapat_p3');
            })->get();

        $meetingsList = [];
        foreach ($allWithMeetings as $plan) {
            $types = [
                'R2' => $plan->rapat_r2,
                'R3' => $plan->rapat_r3,
                'P1' => $plan->rapat_p1,
                'P2' => $plan->rapat_p2,
                'P3' => $plan->rapat_p3,
            ];
            foreach ($types as $type => $date) {
                if ($date) {
                    $meetingsList[] = [
                        'id' => $plan->id,
                        'mesin' => $plan->mesin_pembangkit,
                        'scope' => $plan->scope,
                        'jenis' => $plan->jenis_pembangkit,
                        'type' => $type,
                        'date' => $date,
                    ];
                }
            }
        }

        usort($meetingsList, function($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });

        $todayMeetings = array_values(array_filter($meetingsList, function($m) use ($todayDate) {
            return $m['date'] === $todayDate;
        }));

        $upcomingMeetings = array_values(array_filter($meetingsList, function($m) use ($todayDate) {
            return $m['date'] > $todayDate;
        }));

        $upcomingMeetings = array_slice($upcomingMeetings, 0, 8);

        return Inertia::render('dashboard', [
            'stats' => [
                'total' => $totalOutage,
                'plantStats' => $plantStats,
                'scopeDistribution' => $scopeDistribution,
                'monthlyTimeline' => $monthlyTimeline,
                'progressDistribution' => $progressDistribution,
                'durasiByScope' => $durasiByScope,
                'meetings' => [
                    'active' => $activeMeetings,
                    'total' => $totalMeetings,
                ],
            ],
            'recentOutages' => $recentOutages,
            'outageMeetings' => [
                'today' => $todayMeetings,
                'upcoming' => $upcomingMeetings,
            ],
        ]);
    }
}
