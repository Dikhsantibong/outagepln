<?php

namespace App\Support;

use App\Models\MasterTtd;
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
    public static function data(): array
    {
        // Try to find the default Menyetujui (usually the first TL or Pimpinan)
        $menyetujui = MasterTtd::where('tipe', 'like', '%TL%')
            ->orWhere('tipe', 'like', '%Manager%')
            ->orWhere('jabatan', 'like', '%Pimpinan%')
            ->first() ?? MasterTtd::first();

        // Try to find the default Staf (usually Officer or Notulis)
        $staf = MasterTtd::where('id', '!=', $menyetujui?->id ?? 0)
            ->first();

        return [
            'menyetujui_nama' => $menyetujui?->nama ?? Setting::get('ttd_menyetujui_nama', 'ABDUL RAHMAN KADIR'),
            'menyetujui_jabatan' => $menyetujui?->jabatan ?? Setting::get('ttd_menyetujui_jabatan', 'TEAM LEADER OUTAGE MANAGEMENT'),
            'menyetujui_signature' => $menyetujui?->signature ?? null,
            'staf_nama' => $staf?->nama ?? Setting::get('ttd_staf_nama', 'FIRMANSYAH'),
            'staf_jabatan' => $staf?->jabatan ?? Setting::get('ttd_staf_jabatan', 'OF OUTAGE MANAGEMENT'),
            'staf_signature' => $staf?->signature ?? null,
        ];
    }
}
