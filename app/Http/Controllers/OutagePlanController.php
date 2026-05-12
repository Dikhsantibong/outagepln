<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Inertia\Inertia;
use App\Models\OutagePlan;

class OutagePlanController extends Controller
{
    public function index()
    {
        $outagePlans = OutagePlan::latest()->get();
        // Fetch all units with their related machines
        $units = \App\Models\Unit::with('mesins')->get();
        
        return Inertia::render('outage-plans/index', [
            'outagePlans' => $outagePlans,
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_pembangkit' => 'required|string|max:255',
            'scope' => 'required|in:final stage,second tage,TO,MO,PMS 24 K,SO,PM 20 K,2 ND STAGE',
            'jenis_pembangkit' => 'required|in:pltd,pltm,pltmg',
            'durasi_hari' => 'required|integer|min:0',
            'progres_persen' => 'required|integer|min:0|max:100',
            'rapat' => 'nullable|date',
            'keterangan' => 'nullable|in:open,close',
            'sistem' => 'required|in:RAHA,BAU BAU,WAKATOBI,WAWONII,EREKE,DAN SUB.S.KENDARI',
        ]);

        OutagePlan::create($validated);

        return redirect()->back()->with('success', 'Data berhasil ditambahkan.');
    }

    public function destroy(OutagePlan $outagePlan)
    {
        $outagePlan->delete();
        return redirect()->back()->with('success', 'Data berhasil dihapus.');
    }
}
