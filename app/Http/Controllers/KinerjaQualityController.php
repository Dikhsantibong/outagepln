<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltersOutagePlans;
use App\Models\OutagePlan;
use App\Models\KinerjaQuality;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class KinerjaQualityController extends Controller
{
    use FiltersOutagePlans;

    public function index(Request $request)
    {
        $query = OutagePlan::with('kinerjaQuality');

        $this->applyPlanFilters($query, $request);
        $this->applyStatusFilter(
            $query,
            $request,
            'kinerjaQuality',
            // Lengkap = both the "sebelum" and "sesudah" readings are recorded.
            fn ($q) => $q->whereNotNull('dm_sebelum')->whereNotNull('dm_sesudah'),
            fn ($q) => $q->whereNotNull('dm_sebelum')->whereNull('dm_sesudah'),
        );

        $outagePlans = $query
            ->orderBy('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($plan) => $this->mapPlan($plan));

        // The picker can select a plan from any page, so its full record is
        // resolved server-side rather than looked up in the current page.
        $selected = $request->filled('plan')
            ? OutagePlan::with('kinerjaQuality')->find($request->input('plan'))
            : null;

        return Inertia::render('kinerja/on-quality', [
            'outagePlans' => $outagePlans,
            'planOptions' => $this->planPickerList(),
            'selectedPlan' => $selected ? $this->mapPlan($selected) : null,
            'filters' => $request->only([...$this->kinerjaFilterKeys, 'plan']),
            'filterOptions' => $this->planFilterOptions(),
            'summary' => $this->summary(),
        ]);
    }

    private function mapPlan(OutagePlan $plan): array
    {
        $k = $plan->kinerjaQuality;

        return [
            'id' => $plan->id,
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'scope' => $plan->scope,
            'sistem' => $plan->sistem,
            'progress' => $plan->progress,
            'kinerja_quality' => $k ? [
                'dm_sebelum' => $k->dm_sebelum,
                'sfc_sebelum' => $k->sfc_sebelum,
                'eviden_sebelum_url' => $k->eviden_sebelum ? Storage::url($k->eviden_sebelum) : null,
                'dm_sesudah' => $k->dm_sesudah,
                'sfc_sesudah' => $k->sfc_sesudah,
                'eviden_sesudah_url' => $k->eviden_sesudah ? Storage::url($k->eviden_sesudah) : null,
            ] : null,
        ];
    }

    /** Completion counts across every plan, independent of the active filters. */
    private function summary(): array
    {
        $user = request()->user();
        $total = OutagePlan::visibleTo($user)->count();
        $lengkap = OutagePlan::visibleTo($user)->whereHas('kinerjaQuality', fn ($q) => $q->whereNotNull('dm_sebelum')->whereNotNull('dm_sesudah'))->count();
        $sebagian = OutagePlan::visibleTo($user)->whereHas('kinerjaQuality', fn ($q) => $q->whereNotNull('dm_sebelum')->whereNull('dm_sesudah'))->count();

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
            'tipe' => 'required|in:sebelum,sesudah',
            'dm' => 'required|numeric',
            'sfc' => 'required|numeric',
            'eviden' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // 5MB max
        ]);

        $kinerja = KinerjaQuality::firstOrNew(['outage_plan_id' => $request->outage_plan_id]);

        $evidenPath = null;
        if ($request->hasFile('eviden')) {
            $evidenPath = $request->file('eviden')->store('eviden_kinerja', 'public');
        }

        if ($request->tipe === 'sebelum') {
            $kinerja->dm_sebelum = $request->dm;
            $kinerja->sfc_sebelum = $request->sfc;
            if ($evidenPath) {
                $kinerja->eviden_sebelum = $evidenPath;
            }
        } else {
            // Ensure progress is 100 before saving 'sesudah'
            $outagePlan = OutagePlan::find($request->outage_plan_id);
            if ($outagePlan->progress < 100) {
                return redirect()->back()->withErrors(['message' => 'Progres belum 100%, data Sesudah Overhaul belum dapat disimpan.']);
            }

            $kinerja->dm_sesudah = $request->dm;
            $kinerja->sfc_sesudah = $request->sfc;
            if ($evidenPath) {
                $kinerja->eviden_sesudah = $evidenPath;
            }
        }

        $kinerja->save();

        return redirect()->back()->with('success', 'Data Kinerja Quality berhasil disimpan.');
    }
}
