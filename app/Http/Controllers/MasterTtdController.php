<?php

namespace App\Http\Controllers;

use App\Models\MasterTtd;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Data Master → Tanda Tangan.
 *
 * Satu tempat untuk mengatur penandatangan (beserta gambar tanda tangannya)
 * yang dipakai seluruh berkas cetak/ekspor. Hanya super admin (route berada di grup EnsureSuperAdmin).
 */
class MasterTtdController extends Controller
{
    public function index()
    {
        return Inertia::render('master/ttd', [
            'penandatangans' => MasterTtd::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'tipe' => 'nullable|string|max:255',
            'signature' => 'nullable|string', // base64 string
        ]);

        MasterTtd::create($validated);

        return redirect()->back()->with('success', 'Data penandatangan berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'tipe' => 'nullable|string|max:255',
            'signature' => 'nullable|string',
        ]);

        $ttd = MasterTtd::findOrFail($id);
        $ttd->update($validated);

        return redirect()->back()->with('success', 'Data penandatangan berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $ttd = MasterTtd::findOrFail($id);
        $ttd->delete();

        return redirect()->back()->with('success', 'Data penandatangan berhasil dihapus.');
    }
}
