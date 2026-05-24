<?php

namespace App\Http\Controllers;

use App\Models\OutagePlan;
use App\Models\DailyMeeting;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

class WelcomeController extends Controller
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

        // Progress distribution (group into ranges: 0%, 1-25%, 26-50%, 51-75%, 76-99%, 100%)
        $progressDistribution = [
            ['range' => '0%', 'count' => OutagePlan::where('progress', 0)->count()],
            ['range' => '1-25%', 'count' => OutagePlan::whereBetween('progress', [1, 25])->count()],
            ['range' => '26-50%', 'count' => OutagePlan::whereBetween('progress', [26, 50])->count()],
            ['range' => '51-75%', 'count' => OutagePlan::whereBetween('progress', [51, 75])->count()],
            ['range' => '76-99%', 'count' => OutagePlan::whereBetween('progress', [76, 99])->count()],
            ['range' => '100%', 'count' => OutagePlan::where('progress', 100)->count()],
        ];

        // Meeting stats
        $activeMeetings = DailyMeeting::where('status', 'active')->count();
        $totalMeetings  = DailyMeeting::count();

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

        $upcomingMeetingsCount = count(array_filter($meetingsList, function($m) use ($todayDate) {
            return $m['date'] > $todayDate;
        }));

        return Inertia::render('welcome', [
            'canLogin' => Route::has('login'),
            'stats' => [
                'total' => $totalOutage,
                'plantStats' => $plantStats,
                'scopeDistribution' => $scopeDistribution,
                'progressDistribution' => $progressDistribution,
                'meetings' => [
                    'active' => $activeMeetings,
                    'total' => $totalMeetings,
                    'upcoming' => $upcomingMeetingsCount,
                ],
            ],
        ]);
    }
}
