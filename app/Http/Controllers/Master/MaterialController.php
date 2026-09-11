<?php

namespace App\Http\Controllers\Master;

use App\Exports\MaterialTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\MaterialsImport;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $query = Material::query();

        if ($request->filled('search')) {
            $cari = $request->input('search');
            $query->where(function ($q) use ($cari) {
                $q->where('nama', 'like', "%{$cari}%")
                    ->orWhere('part_number', 'like', "%{$cari}%");
            });
        }

        if ($request->filled('jenis_mesin')) {
            $query->where('jenis_mesin', $request->input('jenis_mesin'));
        }

        $materials = $query->orderBy('jenis_mesin')
            ->orderBy('nama')
            ->paginate(25)
            ->withQueryString();

        $jenisMesinOptions = Material::query()
            ->whereNotNull('jenis_mesin')
            ->distinct()
            ->orderBy('jenis_mesin')
            ->pluck('jenis_mesin');

        return inertia('master/materials/index', [
            'materials' => $materials,
            'jenisMesinOptions' => $jenisMesinOptions,
            'filters' => $request->only(['search', 'jenis_mesin']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => [
                'required', 'string', 'max:255',
                Rule::unique('materials')->where(fn ($query) => $query->where('jenis_mesin', $request->input('jenis_mesin'))),
            ],
            'jenis_mesin' => 'nullable|string|max:255',
            'part_number' => 'nullable|string|max:255',
            'satuan' => 'nullable|string|max:255',
        ]);

        Material::create($validated);

        return back()->with('success', 'Material berhasil ditambahkan.');
    }

    public function update(Request $request, Material $material)
    {
        $validated = $request->validate([
            'nama' => [
                'required', 'string', 'max:255',
                Rule::unique('materials')
                    ->ignore($material->id)
                    ->where(fn ($query) => $query->where('jenis_mesin', $request->input('jenis_mesin'))),
            ],
            'jenis_mesin' => 'nullable|string|max:255',
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

    /**
     * Unduh template Excel untuk pengisian material sebelum diunggah.
     */
    public function template()
    {
        return Excel::download(new MaterialTemplateExport, 'Template-Import-Material.xlsx');
    }

    /**
     * Impor material dari berkas Excel/CSV sesuai template.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:10240',
        ], [
            'file.mimes' => 'Berkas harus berformat Excel (.xlsx, .xls) atau CSV.',
            'file.max' => 'Ukuran berkas maksimal 10 MB.',
        ]);

        $import = new MaterialsImport;
        Excel::import($import, $request->file('file'));

        return back()->with(
            'success',
            "Import material selesai: {$import->imported} ditambahkan, {$import->skipped} dilewati (duplikat/kosong)."
        );
    }
}
