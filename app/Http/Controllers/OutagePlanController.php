<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Inertia\Inertia;
use App\Models\OutagePlan;

class OutagePlanController extends Controller
{
    public function index(Request $request)
    {
        $query = OutagePlan::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('mesin_pembangkit', 'like', "%{$search}%")
                  ->orWhere('scope', 'like', "%{$search}%");
            });
        }

        $outagePlans = $query->latest()->paginate(10)->withQueryString();
        $units = \App\Models\Unit::with('mesins')->get();
        
        return Inertia::render('outage-plans/index', [
            'outagePlans' => $outagePlans,
            'units' => $units,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_pembangkit' => 'nullable|string|max:255',
            'scope' => 'nullable|string|max:100',
            'jenis_pembangkit' => 'nullable|string|max:50',
            'durasi' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'selesai' => 'nullable|date',
            'progress' => 'nullable|numeric',
            'rapat_r2' => 'nullable|string',
            'rapat_r3' => 'nullable|string',
            'rapat_p1' => 'nullable|string',
            'rapat_p2' => 'nullable|string',
            'rapat_p3' => 'nullable|string',
            'ket' => 'nullable|string|max:50',
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
