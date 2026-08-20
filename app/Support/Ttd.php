<?php

namespace App\Support;

use App\Models\Setting;

/**
 * Data penandatangan global untuk seluruh berkas yang butuh tanda tangan
 * (notulen temuan, notulen kick off, dsб — PDF maupun Excel).
 *
 * Nilainya tersimpan di tabel settings dan bisa diubah kapan saja oleh super
 * admin lewat modul Data Master → Tanda Tangan. Nilai bawaan dipertahankan
 * sama seperti sebelumnya, jadi berkas lama tidak berubah tampilannya.
 *
 * - "menyetujui" = penandatangan kiri (Menyetujui / Pimpinan Rapat)
 * - "staf"       = penandatangan kanan (Dibuat oleh / Notulis)
 */
class Ttd
{
    /**
     * @return array{menyetujui_nama: string, menyetujui_jabatan: string, staf_nama: string, staf_jabatan: string}
     */
    public static function data(): array
    {
        return [
            'menyetujui_nama' => Setting::get('ttd_menyetujui_nama', 'ABDUL RAHMAN KADIR'),
            'menyetujui_jabatan' => Setting::get('ttd_menyetujui_jabatan', 'TEAM LEADER OUTAGE MANAGEMENT'),
            'staf_nama' => Setting::get('ttd_staf_nama', 'FIRMANSYAH'),
            'staf_jabatan' => Setting::get('ttd_staf_jabatan', 'OF OUTAGE MANAGEMENT'),
        ];
    }
}
