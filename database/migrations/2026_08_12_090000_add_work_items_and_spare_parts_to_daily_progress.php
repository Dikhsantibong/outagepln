<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Uraian pekerjaan dan material jadi daftar berpoin.
 *
 * Sebelumnya uraian hanya satu kotak teks bebas, sehingga progres tiap poin
 * terpaksa dititipkan di kolom Keterangan — yang bukan tempatnya. Material pun
 * hanya muat satu per hari dan tanpa jumlah.
 *
 * Disimpan sebagai JSON, bukan tabel terpisah: isinya selalu dibaca utuh
 * bersama barisnya dan tidak pernah dicari per item, sama seperti kolom
 * `photos` yang sudah ada. Tabel relasional hanya akan menambah join tanpa
 * memberi manfaat.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outage_plan_progresses', function (Blueprint $table) {
            $table->json('work_items')->nullable()->after('actual_progress');
            $table->json('spare_parts')->nullable()->after('work_items');
        });

        $this->pindahkanUraianLama();
    }

    public function down(): void
    {
        Schema::table('outage_plan_progresses', function (Blueprint $table) {
            $table->dropColumn(['work_items', 'spare_parts']);
        });
    }

    /**
     * Memindahkan data lama ke bentuk berpoin.
     *
     * Tiap baris `uraian_pekerjaan` jadi satu poin; progresnya dikosongkan
     * karena nilai per poin memang belum pernah tercatat — menebaknya dari
     * progres harian akan menghasilkan angka yang salah. Material yang ada
     * dipindah jadi satu baris spare part tanpa qty.
     *
     * Kolom lama tidak dihapus, sehingga data aslinya tetap bisa dirujuk.
     */
    private function pindahkanUraianLama(): void
    {
        $rows = DB::table('outage_plan_progresses')
            ->where(function ($q) {
                $q->whereNotNull('uraian_pekerjaan')
                    ->orWhereNotNull('material_nama')
                    ->orWhereNotNull('material_part_number');
            })
            ->get(['id', 'uraian_pekerjaan', 'material_nama', 'material_part_number']);

        foreach ($rows as $row) {
            $items = [];

            foreach (preg_split('/\R/', (string) $row->uraian_pekerjaan) as $baris) {
                $baris = trim($baris);

                if ($baris === '') {
                    continue;
                }

                // Buang penomoran yang terlanjur diketik manual ("1. ", "2) ").
                $items[] = [
                    'uraian' => preg_replace('/^\s*\d+\s*[.)-]\s*/', '', $baris),
                    'progress' => null,
                ];
            }

            $parts = [];

            if (filled($row->material_nama) || filled($row->material_part_number)) {
                $parts[] = [
                    'nama' => (string) $row->material_nama,
                    'part_number' => (string) $row->material_part_number,
                    'qty' => '',
                    'keterangan' => '',
                ];
            }

            DB::table('outage_plan_progresses')->where('id', $row->id)->update([
                'work_items' => $items === [] ? null : json_encode($items),
                'spare_parts' => $parts === [] ? null : json_encode($parts),
            ]);
        }
    }
};
