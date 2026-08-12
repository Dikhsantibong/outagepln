<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Mesin;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        $units = Unit::with('mesins')->get();
        return inertia('master/units/index', [
            'units' => $units,
        ]);
    }

    public function storeUnit(Request $request)
    {
        $validated = $request->validate([
            'nama_sentral' => 'required|string|max:120|unique:unit,nama_sentral',
            'nama_rayon' => 'nullable|string|max:120',
            'unit_pelaksana' => 'nullable|string|max:80',
            'milik' => 'nullable|string|max:20',
        ]);

        Unit::create($validated);
        return back()->with('success', 'Unit berhasil ditambahkan.');
    }

    public function updateUnit(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'nama_sentral' => 'required|string|max:120|unique:unit,nama_sentral,' . $unit->id_unit . ',id_unit',
            'nama_rayon' => 'nullable|string|max:120',
            'unit_pelaksana' => 'nullable|string|max:80',
            'milik' => 'nullable|string|max:20',
        ]);

        $unit->update($validated);
        return back()->with('success', 'Unit berhasil diperbarui.');
    }

    public function destroyUnit(Unit $unit)
    {
        if ($unit->mesins()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus unit yang masih memiliki mesin.');
        }

        $unit->delete();
        return back()->with('success', 'Unit berhasil dihapus.');
    }

    public function storeMesin(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'no_urut' => 'required|integer|min:1',
            'nama_mesin' => 'required|string|max:200',
            'pgk_merk' => 'nullable|string|max:120',
            'jenis_pembangkit' => 'nullable|string|max:10',
            'daya_terpasang_kw' => 'nullable|numeric',
        ]);

        $unit->mesins()->create($validated);
        return back()->with('success', 'Mesin berhasil ditambahkan.');
    }

    public function updateMesin(Request $request, Mesin $mesin)
    {
        $validated = $request->validate([
            'no_urut' => 'required|integer|min:1',
            'nama_mesin' => 'required|string|max:200',
            'pgk_merk' => 'nullable|string|max:120',
            'jenis_pembangkit' => 'nullable|string|max:10',
            'daya_terpasang_kw' => 'nullable|numeric',
        ]);

        $mesin->update($validated);
        return back()->with('success', 'Mesin berhasil diperbarui.');
    }

    public function destroyMesin(Mesin $mesin)
    {
        $mesin->delete();
        return back()->with('success', 'Mesin berhasil dihapus.');
    }
}
