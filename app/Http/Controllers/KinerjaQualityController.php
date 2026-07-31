<?php

namespace App\Http\Controllers;

use App\Models\OutagePlan;
use App\Models\KinerjaQuality;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class KinerjaQualityController extends Controller
{
    public function index()
    {
        $outagePlans = OutagePlan::with('kinerjaQuality')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'mesin_pembangkit' => $plan->mesin_pembangkit,
                    'jenis_pembangkit' => $plan->jenis_pembangkit,
                    'progress' => $plan->progress,
                    'kinerja_quality' => $plan->kinerjaQuality ? [
                        'dm_sebelum' => $plan->kinerjaQuality->dm_sebelum,
                        'sfc_sebelum' => $plan->kinerjaQuality->sfc_sebelum,
                        'eviden_sebelum_url' => $plan->kinerjaQuality->eviden_sebelum ? Storage::url($plan->kinerjaQuality->eviden_sebelum) : null,
                        'dm_sesudah' => $plan->kinerjaQuality->dm_sesudah,
                        'sfc_sesudah' => $plan->kinerjaQuality->sfc_sesudah,
                        'eviden_sesudah_url' => $plan->kinerjaQuality->eviden_sesudah ? Storage::url($plan->kinerjaQuality->eviden_sesudah) : null,
                    ] : null,
                ];
            });

        return Inertia::render('kinerja/on-quality', [
            'outagePlans' => $outagePlans,
        ]);
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
