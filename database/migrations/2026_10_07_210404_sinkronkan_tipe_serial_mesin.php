<?php

use App\Models\OutagePlan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Sinkronkan Type dan Serial Number mesin (Data Master → Unit & Mesin) dengan
 * daftar resmi, lalu isi outage_plans.tipe dari Data Mesin untuk pembagian akun
 * pengelola per tipe.
 *
 * Mesin dicocokkan lewat unit + nomor mesin (lihat [OutagePlan::kunciMesin()]),
 * bukan id, supaya hasilnya sama di semua lingkungan.
 */
return new class extends Migration
{
    /**
     * Kunci mesin => [Type, Serial Number]. Serial null berarti tidak diubah.
     *
     * POASIA #02 sengaja tidak diubah serialnya: daftar sumber menuliskan
     * "01 - 44 - 98" untuk #01 dan #02 sekaligus, padahal nomor seri tidak
     * mungkin kembar — nilai lama (01-44-97) dipertahankan sampai dipastikan.
     *
     * @var array<string, array{0: string, 1: ?string}>
     */
    private array $data = [
        'PLTD WUA-WUA#1' => ['8 M 453 AK', '26881'],
        'PLTD WUA-WUA#2' => ['8 M 453 AK', '26882'],
        'PLTD WUA-WUA#3' => ['8 M 453 AK', '26883'],

        'PLTD POASIA#1' => ['ESL 16 MK 2', '01 - 44 - 98'],
        'PLTD POASIA#2' => ['ESL 16 MK 2', null],
        'PLTD POASIA#4' => ['ESL 16 MK 2', '01 - 37 - 97'],
        'PLTD POASIA#5' => ['ESL 16 MK 2', '01 - 41 - 98'],

        // PLTD Poasia Containerized
        'PLTD POASIA#6' => ['KTA 50-G8', '25426138'],
        'PLTD POASIA#7' => ['KTA 50-G8', '25426233'],
        'PLTD POASIA#8' => ['KTA 50-G8', '25423797'],

        'PLTD KOLAKA#3' => ['6PSHTc-26Dm', '6265143'],
        'PLTD KOLAKA#4' => ['6PSHTc-26D', '6263916'],
        'PLTD KOLAKA#5' => ['6PSHTc-26D', '6263905'],
        'PLTD KOLAKA#7' => ['6L 25 CXE', '17487'],
        'PLTD KOLAKA#8' => ['8M 453 AK', '26879'],
        'PLTD KOLAKA#9' => ['8M 453 AK', '26880'],

        'PLTD LANIPA NIPA#2' => ['BV 8M 628', '7300 369'],
        'PLTD LANIPA NIPA#3' => ['BV 8M 628', '7208 739'],
        'PLTD LANIPA NIPA#4' => ['BV 8M 628', '7208 765'],
    ];

    public function up(): void
    {
        foreach (DB::table('mesin')->get(['id_mesin', 'nama_mesin']) as $mesin) {
            $baris = $this->data[OutagePlan::kunciMesin($mesin->nama_mesin)] ?? null;

            if ($baris === null) {
                continue;
            }

            [$tipe, $seri] = $baris;

            DB::table('mesin')->where('id_mesin', $mesin->id_mesin)->update(array_filter([
                'pgk_type' => $tipe,
                'pgk_seri' => $seri,
            ], fn ($v) => $v !== null));
        }

        // Isi tipe seluruh rencana dari Data Mesin dalam sekali jalan.
        $tipePerKunci = DB::table('mesin')->get(['nama_mesin', 'pgk_type'])
            ->mapWithKeys(fn ($m) => [OutagePlan::kunciMesin($m->nama_mesin) => OutagePlan::normalisasiTipe($m->pgk_type)])
            ->forget('');

        foreach (DB::table('outage_plans')->get(['id', 'mesin_pembangkit']) as $plan) {
            DB::table('outage_plans')->where('id', $plan->id)->update([
                'tipe' => $tipePerKunci[OutagePlan::kunciMesin($plan->mesin_pembangkit)] ?? null,
            ]);
        }
    }

    /** Sinkronisasi data tidak dibalik; nilai lama tidak disimpan. */
    public function down(): void
    {
        //
    }
};
