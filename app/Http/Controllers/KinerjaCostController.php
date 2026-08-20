<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\FiltersOutagePlans;
use App\Models\OutagePlan;
use App\Models\KinerjaCost;
use App\Support\UploadLimit;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class KinerjaCostController extends Controller
{
    use FiltersOutagePlans;

    public function index(Request $request)
    {
        $query = OutagePlan::with('kinerjaCost');

        $this->applyPlanFilters($query, $request);
        $this->applyStatusFilter(
            $query,
            $request,
            'kinerjaCost',
            // Lengkap = both the planned and the actual budget are recorded.
            fn ($q) => $q->whereNotNull('anggaran_rencana')->whereNotNull('anggaran_aktual'),
            fn ($q) => $q->whereNotNull('anggaran_rencana')->whereNull('anggaran_aktual'),
        );

        $outagePlans = $query
            ->orderBy('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($plan) => $this->mapPlan($plan));

        // The picker can select a plan from any page, so its full record is
        // resolved server-side rather than looked up in the current page.
        $selected = $request->filled('plan')
            ? OutagePlan::with('kinerjaCost')->find($request->input('plan'))
            : null;

        return Inertia::render('kinerja/on-cost', [
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
        $k = $plan->kinerjaCost;
        $ev = $this->evidenPayload($k?->eviden, 'cost', $k?->id ?? 0);

        return [
            'id' => $plan->id,
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'scope' => $plan->scope,
            'sistem' => $plan->sistem,
            'progress' => $plan->progress,
            'kinerja_cost' => $k ? [
                'anggaran_rencana' => $k->anggaran_rencana,
                'anggaran_aktual' => $k->anggaran_aktual,
                'eviden_url' => $ev['url'],
                'eviden_type' => $ev['type'],
            ] : null,
        ];
    }

    /** Completion counts across every plan, independent of the active filters. */
    private function summary(): array
    {
        $user = request()->user();
        $total = OutagePlan::visibleTo($user)->count();
        $lengkap = OutagePlan::visibleTo($user)->whereHas('kinerjaCost', fn ($q) => $q->whereNotNull('anggaran_rencana')->whereNotNull('anggaran_aktual'))->count();
        $sebagian = OutagePlan::visibleTo($user)->whereHas('kinerjaCost', fn ($q) => $q->whereNotNull('anggaran_rencana')->whereNull('anggaran_aktual'))->count();

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
            'anggaran_rencana' => 'nullable|numeric|min:0',
            'anggaran_aktual' => 'nullable|numeric|min:0',
            'eviden' => UploadLimit::evidenRules(),
        ]);

        $kinerja = KinerjaCost::firstOrNew(['outage_plan_id' => $request->outage_plan_id]);
        
        if ($request->has('anggaran_rencana')) {
            $kinerja->anggaran_rencana = $request->anggaran_rencana;
        }
        
        if ($request->has('anggaran_aktual')) {
            $kinerja->anggaran_aktual = $request->anggaran_aktual;
        }

        if ($request->hasFile('eviden')) {
            if ($kinerja->eviden) {
                Storage::disk('public')->delete($kinerja->eviden);
            }
            // Disk privat: berkas eviden tidak boleh diakses langsung lewat /storage.
            $path = $request->file('eviden')->store('kinerja-cost', 'local');
            $kinerja->eviden = $path;
        }

        $kinerja->save();

        return redirect()->back()->with('success', 'Data On Cost berhasil disimpan');
    }
}
