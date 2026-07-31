<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OutagePlan;
use App\Models\KinerjaCost;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class KinerjaCostController extends Controller
{
    public function index()
    {
        $outagePlans = OutagePlan::with('kinerjaCost')->get()->map(function($plan) {
            if ($plan->kinerjaCost && $plan->kinerjaCost->eviden) {
                $plan->kinerjaCost->eviden_url = Storage::url($plan->kinerjaCost->eviden);
            }
            return $plan;
        });

        return Inertia::render('kinerja/on-cost', [
            'outagePlans' => $outagePlans
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'outage_plan_id' => 'required|exists:outage_plans,id',
            'anggaran_rencana' => 'nullable|numeric|min:0',
            'anggaran_aktual' => 'nullable|numeric|min:0',
            'eviden' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // 5MB max
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
            $path = $request->file('eviden')->store('kinerja-cost', 'public');
            $kinerja->eviden = $path;
        }

        $kinerja->save();

        return redirect()->back()->with('success', 'Data On Cost berhasil disimpan');
    }
}
