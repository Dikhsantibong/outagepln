<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function index()
    {
        $materials = Material::orderBy('nama')->get();
        return inertia('master/materials/index', [
            'materials' => $materials,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:materials',
            'part_number' => 'nullable|string|max:255',
            'satuan' => 'nullable|string|max:255',
        ]);

        Material::create($validated);
        return back()->with('success', 'Material berhasil ditambahkan.');
    }

    public function update(Request $request, Material $material)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:materials,nama,' . $material->id,
            'part_number' => 'nullable|string|max:255',
            'satuan' => 'nullable|string|max:255',
        ]);

        $material->update($validated);
        return back()->with('success', 'Material berhasil diperbarui.');
    }

    public function destroy(Material $material)
    {
        $material->delete();
        return back()->with('success', 'Material berhasil dihapus.');
    }
}
