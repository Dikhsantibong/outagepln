<?php

namespace App\Http\Controllers;

use App\Models\KinerjaCost;
use App\Models\KinerjaQuality;
use App\Models\KinerjaTime;
use App\Models\OutagePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KinerjaEvidenController extends Controller
{
    /**
     * Menyajikan berkas eviden kinerja dari disk privat.
     *
     * Berkas eviden tidak lagi ditaruh di public/storage. Route ini membaca path
     * dari basis data lalu mengalirkan berkasnya (inline) hanya untuk akun yang
     * berhak melihat mesin terkait. Disk `public` tetap diperiksa sebagai
     * cadangan agar berkas lama (sebelum pindah ke privat) tetap bisa dibuka.
     */
    public function show(Request $request, string $jenis, int $id, ?string $tipe = null)
    {
        // Pemetaan jenis → [model, field eviden per tipe].
        $config = [
            'quality' => [KinerjaQuality::class, ['sebelum' => 'eviden_sebelum', 'sesudah' => 'eviden_sesudah']],
            'time' => [KinerjaTime::class, ['' => 'eviden']],
            'cost' => [KinerjaCost::class, ['' => 'eviden']],
        ];

        abort_unless(isset($config[$jenis]), 404);

        [$modelClass, $fields] = $config[$jenis];
        $field = $fields[$tipe ?? ''] ?? null;
        abort_if($field === null, 404);

        $record = $modelClass::findOrFail($id);

        // Hanya boleh dilihat akun yang berhak atas mesinnya (pengelola per merek,
        // admin/tamu semua). Menghindari tebak-id membuka eviden mesin lain.
        abort_unless(
            OutagePlan::visibleTo($request->user())->whereKey($record->outage_plan_id)->exists(),
            403,
        );

        $path = $record->{$field};
        abort_if(blank($path), 404);

        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->response($path);
            }
        }

        abort(404);
    }
}
