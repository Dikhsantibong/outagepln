<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\OutagePlan;
use App\Models\KinerjaTime;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class KinerjaTimeController extends Controller
{
    public function index()
    {
        $outagePlans = OutagePlan::with('kinerjaTime')->get()->map(function($plan) {
            if ($plan->kinerjaTime && $plan->kinerjaTime->eviden) {
                $plan->kinerjaTime->eviden_url = Storage::url($plan->kinerjaTime->eviden);
            }
            return $plan;
        });

        return Inertia::render('kinerja/on-time', [
            'outagePlans' => $outagePlans
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'outage_plan_id' => 'required|exists:outage_plans,id',
            'start_date_aktual' => 'nullable|date',
            'selesai_aktual' => 'nullable|date',
            'catatan' => 'nullable|string',
            'eviden' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // 5MB max
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
