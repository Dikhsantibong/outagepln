<?php

namespace App\Support;

use App\Models\DailyBriefing;
use App\Models\OutagePlan;
use Illuminate\Database\QueryException;

/**
 * Membentuk rapat harian dari pekerjaan yang sedang berjalan.
 *
 * Dulu tiap rapat dan tiap hari lanjutannya dibuat manual. Padahal harinya
 * sudah tertentu: pelaksanaan outage dimulai pada Real Start dan berlangsung
 * selama durasinya, jadi seluruh hari bisa disiapkan sekaligus. Rapat memang
 * kerap dilewat — hari 2, 3, dan 4 kosong lalu berlanjut di hari 5 — karena itu
 * semua hari tetap dibuat sebagai slot kosong, dan hari yang dilewat cukup
 * dibiarkan tanpa isi tanpa memutus penomoran hari.
 *
 * Pembentukannya hanya menambah, tidak pernah menghapus: durasi yang diperpendek
 * tidak boleh ikut membuang notulen dan temuan yang sudah terlanjur diisi.
 */
class RapatHarianOtomatis
{
    /**
     * Siapkan hari rapat untuk seluruh pekerjaan yang sedang berjalan.
     *
     * @return int jumlah hari rapat baru yang dibuat
     */
    public static function sinkronkanYangBerjalan(): int
    {
        $dibuat = 0;

        OutagePlan::sedangBerjalan()
            ->orderBy('id')
            ->chunkById(50, function ($rencana) use (&$dibuat) {
                foreach ($rencana as $plan) {
                    $dibuat += self::sinkronkan($plan);
                }
            });

        return $dibuat;
    }

    /**
     * Siapkan hari rapat satu pekerjaan.
     *
     * @return int jumlah hari rapat baru yang dibuat
     */
    public static function sinkronkan(OutagePlan $plan): int
    {
        $tanggalHarian = $plan->tanggalHarianOutage();

        if ($tanggalHarian === []) {
            return 0;
        }

        self::adopsiRapatManual($plan, $tanggalHarian);
        self::perbaikiHariYatim($plan);

        $sudahAda = DailyBriefing::where('outage_plan_id', $plan->id)
            ->pluck('id', 'hari_ke');

        // Kepala rangkaian selalu hari ke-1; hari lain menggantung padanya
        // supaya navigasi antar hari tetap memakai satu rangkaian yang sama.
        $kepalaId = $sudahAda[1] ?? null;
        $dibuat = 0;

        foreach ($tanggalHarian as $index => $tanggal) {
            $hariKe = $index + 1;

            if (isset($sudahAda[$hariKe])) {
                continue;
            }

            $baru = self::buatHari($plan, $hariKe, $tanggal, $kepalaId);

            if ($baru === null) {
                continue;
            }

            $dibuat++;

            if ($hariKe === 1) {
                $kepalaId = $baru->id;
            }
        }

        return $dibuat;
    }

    /**
     * Tarik rapat manual lama ke dalam rangkaian mesinnya.
     *
     * Sebelum rapat dibentuk otomatis, rapat dibuat sendiri satu per satu dan
     * tidak terikat rencana outage mana pun. Bila dibiarkan, mesin yang sama
     * tampil dua kali di daftar: sekali dari rapat manualnya, sekali dari
     * rangkaian otomatisnya.
     *
     * Rapat manual itu sudah berisi daftar hadir dan notulen, jadi tidak dibuang
     * melainkan diangkat menjadi hari yang bersesuaian dengan tanggalnya. Bila
     * hari itu sudah terlanjur dibuatkan versi kosongnya, versi kosong itulah
     * yang dibuang — bukan rapat manual yang ada isinya.
     *
     * @param  array<int, string>  $tanggalHarian
     */
    private static function adopsiRapatManual(OutagePlan $plan, array $tanggalHarian): void
    {
        $mesin = trim((string) $plan->mesin_pembangkit);

        if ($mesin === '') {
            return;
        }

        $nomorHari = array_flip($tanggalHarian);

        $manual = DailyBriefing::whereNull('outage_plan_id')
            ->where('judul', 'like', '%'.$mesin.'%')
            ->orderBy('tanggal')
            ->get();

        foreach ($manual as $rapat) {
            $tanggal = $rapat->tanggal?->toDateString();

            // Di luar rentang pelaksanaan: biarkan berdiri sendiri, karena tidak
            // ada hari yang bisa ditempatinya tanpa menggeser penomoran.
            if ($tanggal === null || ! isset($nomorHari[$tanggal])) {
                continue;
            }

            $hariKe = $nomorHari[$tanggal] + 1;
            $penghuni = DailyBriefing::where('outage_plan_id', $plan->id)
                ->where('hari_ke', $hariKe)
                ->first();

            if ($penghuni) {
                // Hari itu sudah ada isinya — dua-duanya berharga, jadi rapat
                // manualnya dibiarkan apa adanya daripada salah satu hilang.
                if ($penghuni->adaIsi()) {
                    continue;
                }

                $penghuni->delete();
            }

            $rapat->update([
                'outage_plan_id' => $plan->id,
                'hari_ke' => $hariKe,
                'parent_id' => null,
            ]);
        }
    }

    /**
     * Sambungkan kembali hari yang kehilangan induknya.
     *
     * `parent_id` bersifat nullOnDelete: menghapus hari pertama membuat seluruh
     * hari sisanya menggantung. Penyambungan ini menjaga navigasi antar hari
     * tetap utuh bagi rapat lama yang masih mengandalkan `parent_id`.
     */
    private static function perbaikiHariYatim(OutagePlan $plan): void
    {
        $hariPertama = DailyBriefing::where('outage_plan_id', $plan->id)
            ->orderBy('hari_ke')
            ->first();

        if (! $hariPertama) {
            return;
        }

        DailyBriefing::where('outage_plan_id', $plan->id)
            ->whereKeyNot($hariPertama->id)
            ->where(fn ($q) => $q->whereNull('parent_id')->orWhere('parent_id', '!=', $hariPertama->id))
            ->update(['parent_id' => $hariPertama->id]);

        if ($hariPertama->parent_id !== null) {
            $hariPertama->update(['parent_id' => null]);
        }
    }

    /**
     * Buat satu hari rapat.
     *
     * Mengembalikan null bila hari itu ternyata sudah dibuat permintaan lain —
     * indeks unik (outage_plan_id, hari_ke) yang menjaganya, sehingga dua
     * permintaan bersamaan tidak menghasilkan hari kembar.
     */
    private static function buatHari(
        OutagePlan $plan,
        int $hariKe,
        string $tanggal,
        ?int $kepalaId,
    ): ?DailyBriefing {
        try {
            return DailyBriefing::create([
                'outage_plan_id' => $plan->id,
                'hari_ke' => $hariKe,
                'parent_id' => $hariKe === 1 ? null : $kepalaId,
                'judul' => 'Daily Meeting - '.($plan->mesin_pembangkit ?: 'Unit'),
                'tanggal' => $tanggal,
                'waktu_mulai' => '08:00',
                'lokasi' => 'Via Zoom',
                'status' => 'active',
                'unit' => $plan->mesin_pembangkit,
                'jenis_inspeksi' => $plan->scope,
            ]);
        } catch (QueryException $e) {
            if (self::bentrokHariKembar($e)) {
                return null;
            }

            throw $e;
        }
    }

    /** Pelanggaran indeks unik hari rapat, bukan galat basis data lain. */
    private static function bentrokHariKembar(QueryException $e): bool
    {
        return (int) ($e->errorInfo[1] ?? 0) === 1062
            || str_contains($e->getMessage(), 'daily_briefings_rencana_hari_unique');
    }
}
