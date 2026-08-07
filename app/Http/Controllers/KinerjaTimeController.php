<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Controllers\Concerns\FiltersOutagePlans;
use App\Models\OutagePlan;
use App\Models\KinerjaTime;
use App\Support\UploadLimit;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class KinerjaTimeController extends Controller
{
    use FiltersOutagePlans;

    public function index(Request $request)
    {
        $query = OutagePlan::with('kinerjaTime');

        $this->applyPlanFilters($query, $request);
        $this->applyStatusFilter(
            $query,
            $request,
            'kinerjaTime',
            // Lengkap = the actual finish date is recorded.
            fn ($q) => $q->whereNotNull('selesai_aktual'),
            fn ($q) => $q->whereNotNull('start_date_aktual')->whereNull('selesai_aktual'),
        );

        $outagePlans = $query
            ->orderBy('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($plan) => $this->mapPlan($plan));

        // The picker can select a plan from any page, so its full record is
        // resolved server-side rather than looked up in the current page.
        $selected = $request->filled('plan')
            ? OutagePlan::with('kinerjaTime')->find($request->input('plan'))
            : null;

        return Inertia::render('kinerja/on-time', [
            'outagePlans' => $outagePlans,
            'planOptions' => $this->planPickerList(),
            'selectedPlan' => $selected ? $this->mapPlan($selected) : null,
            'filters' => $this->filterState($request, ['plan']),
            'filterOptions' => $this->planFilterOptions(),
            'summary' => $this->summary(),
        ]);
    }

    private function mapPlan(OutagePlan $plan): array
    {
        $k = $plan->kinerjaTime;

        return [
            'id' => $plan->id,
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'scope' => $plan->scope,
            'sistem' => $plan->sistem,
            'progress' => $plan->progress,
            'durasi' => $plan->durasi,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
            'kinerja_time' => $k ? [
                'start_date_aktual' => $k->start_date_aktual,
                'selesai_aktual' => $k->selesai_aktual,
                'catatan' => $k->catatan,
                'eviden_url' => $k->eviden ? Storage::url($k->eviden) : null,
            ] : null,
        ];
    }

    /** Completion counts across every plan, independent of the active filters. */
    private function summary(): array
    {
        $user = request()->user();
        $total = OutagePlan::visibleTo($user)->count();
        $lengkap = OutagePlan::visibleTo($user)->whereHas('kinerjaTime', fn ($q) => $q->whereNotNull('selesai_aktual'))->count();
        $sebagian = OutagePlan::visibleTo($user)->whereHas('kinerjaTime', fn ($q) => $q->whereNotNull('start_date_aktual')->whereNull('selesai_aktual'))->count();

        return [
            'total' => $total,
            'lengkap' => $lengkap,
            'sebagian' => $sebagian,
            'belum' => $total - $lengkap - $sebagian,
        ];
    }

    public function store(Request $request)
    {
        $request->validate([
            'outage_plan_id' => 'required|exists:outage_plans,id',
            'start_date_aktual' => 'nullable|date',
            'selesai_aktual' => 'nullable|date',
            'catatan' => 'nullable|string',
            'eviden' => UploadLimit::evidenRules(),
        ]);

        $kinerja = KinerjaTime::firstOrNew(['outage_plan_id' => $request->outage_plan_id]);
        
        if ($request->has('start_date_aktual')) {
            $kinerja->start_date_aktual = $request->start_date_aktual;
        }
        
        if ($request->has('selesai_aktual')) {
            $kinerja->selesai_aktual = $request->selesai_aktual;
        }

        if ($request->has('catatan')) {
            $kinerja->catatan = $request->catatan;
        }

        if ($request->hasFile('eviden')) {
            if ($kinerja->eviden) {
                Storage::disk('public')->delete($kinerja->eviden);
            }
            $path = $request->file('eviden')->store('kinerja-time', 'public');
            $kinerja->eviden = $path;
        }

        $kinerja->save();

        return redirect()->back()->with('success', 'Data On Time berhasil disimpan');
    }
}
