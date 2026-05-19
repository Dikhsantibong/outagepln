<?php

namespace App\Http\Controllers;

use App\Models\TagihanOh;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TagihanOhController extends Controller
{
    public function index()
    {
        $tagihan = TagihanOh::latest()->get();

        return Inertia::render('tagihan-oh/index', [
            'tagihan' => $tagihan,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pekerjaan' => 'required|string|max:255',
            'pembangkit' => 'required|in:PLTD,PLTMG,PLTM',
            'no_kontrak' => 'required|string|max:255',
            'tahun' => 'required|integer',
            'nilai_kontrak' => 'required|numeric|min:0',
            'terbayar' => 'required|numeric|min:0',
            'belum_terbayar' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string',
        ]);

        TagihanOh::create($validated);

        return redirect()->back()->with('success', 'Tagihan OH berhasil ditambahkan.');
    }

    public function update(Request $request, TagihanOh $tagihanOh)
    {
        $validated = $request->validate([
            'pekerjaan' => 'required|string|max:255',
            'pembangkit' => 'required|in:PLTD,PLTMG,PLTM',
            'no_kontrak' => 'required|string|max:255',
            'tahun' => 'required|integer',
            'nilai_kontrak' => 'required|numeric|min:0',
            'terbayar' => 'required|numeric|min:0',
            'belum_terbayar' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string',
        ]);

        $tagihanOh->update($validated);

        return redirect()->back()->with('success', 'Tagihan OH berhasil diperbarui.');
    }

    public function destroy(TagihanOh $tagihanOh)
    {
        $tagihanOh->delete();

        return redirect()->back()->with('success', 'Tagihan OH berhasil dihapus.');
    }
}
