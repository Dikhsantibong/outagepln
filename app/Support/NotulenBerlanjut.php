<?php

namespace App\Support;

use App\Models\DailyMeeting;

/**
 * Membawa notulen rapat outage ke rapat berikutnya.
 *
 * Rangkaian R2 → R3 → P1 → P2 membahas pekerjaan yang sama, dan permasalahan
 * yang belum tuntas di satu rapat pasti ditinjau lagi di rapat sesudahnya.
 * Sebelumnya daftar itu harus diketik ulang tiap kali; sekarang disalin sendiri
 * begitu rapat berikutnya dibuka, tinggal diperbarui statusnya.
 *
 * Salinannya berdiri sendiri per rapat — bukan satu daftar yang dipakai
 * bersama — supaya notulen rapat lama tetap utuh sebagai rekaman apa yang
 * dibahas saat itu, tidak ikut berubah ketika rapat berikutnya diperbarui.
 *
 * RAPAT P3 tidak ikut: rapat itu memakai Notulen Kick Off, bukan daftar
 * permasalahan.
 */
class NotulenBerlanjut
{
    /**
     * Salin notulen rapat sebelumnya bila rapat ini belum punya isi.
     *
     * Hanya dijalankan saat daftarnya masih kosong, jadi aman dipanggil setiap
     * halaman dibuka: begitu penggunanya mengubah atau menghapus baris, isian
     * itu tidak akan pernah tertimpa salinan baru.
     *
     * @return DailyMeeting|null rapat asal salinan, null bila tidak ada yang disalin
     */
    public static function wariskan(DailyMeeting $rapat): ?DailyMeeting
    {
        if (! $rapat->bolehMewarisiNotulen() || $rapat->issues()->exists()) {
            return null;
        }

        $sumber = $rapat->sumberWarisanNotulen();

        if (! $sumber) {
            return null;
        }

        $baris = $sumber->issues()->orderBy('id')->get();

        if ($baris->isEmpty()) {
            return null;
        }

        $rapat->issues()->createMany(
            $baris->map(fn ($issue) => [
                'permasalahan' => $issue->permasalahan,
                'tindak_lanjut' => $issue->tindak_lanjut,
                'target' => $issue->target,
                'pic' => $issue->pic,
                'status' => $issue->status,
            ])->all(),
        );

        return $sumber;
    }
}
