<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\Ttd;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Data Master → Tanda Tangan.
 *
 * Satu tempat untuk mengatur nama & jabatan penandatangan yang dipakai seluruh
 * berkas cetak/ekspor. Hanya super admin (route berada di grup EnsureSuperAdmin).
 */
class MasterTtdController extends Controller
{
    public function index()
    {
        return Inertia::render('master/ttd', [
            'ttd' => Ttd::data(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'menyetujui_nama' => 'nullable|string|max:255',
            'menyetujui_jabatan' => 'nullable|string|max:255',
            'staf_nama' => 'nullable|string|max:255',
            'staf_jabatan' => 'nullable|string|max:255',
        ]);

        foreach ($validated as $key => $value) {
            Setting::put("ttd_{$key}", $value ?? '');
        }

        return redirect()->back()->with('success', 'Data penandatangan berhasil disimpan.');
    }
}
