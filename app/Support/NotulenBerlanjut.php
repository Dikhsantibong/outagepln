<?php

namespace App\Support;

use App\Models\DailyMeeting;
use App\Models\MeetingKickoff;

/**
 * Membawa notulen rapat outage ke rapat berikutnya.
 *
 * Rangkaian R2 → R3 → P1 → P2 membahas pekerjaan yang sama, dan pembahasan yang
 * belum tuntas di satu rapat pasti ditinjau lagi di rapat sesudahnya. Sebelumnya
 * seluruhnya harus diketik ulang tiap kali; sekarang disalin sendiri begitu
 * rapat berikutnya dibuka, tinggal diperbarui.
 *
 * Dua bagian yang dibawa:
 *   1. Daftar permasalahan — tab "Notulen" pada rapat non-P3.
 *   2. Formulir Notulen Rapat (kick off) — tersedia di semua jenis rapat.
 * Keduanya mencari sumbernya sendiri, karena bisa saja yang satu terisi di R2
 * sementara yang lain baru terisi di R3.
 *
 * Daftar hadir sengaja tidak ikut: kehadiran adalah catatan siapa yang benar-
 * benar datang pada rapat itu, dan menyalinnya akan membuat orang tercatat hadir
 * di rapat yang tidak dihadirinya. Tautan absensi pada formulir notulen ikut
 * dikecualikan sealasan — tautan itu menunjuk ke daftar hadir rapat asalnya.
 *
 * Salinannya berdiri sendiri per rapat — bukan satu berkas yang dipakai bersama
 * — supaya notulen rapat lama tetap utuh sebagai rekaman apa yang dibahas saat
 * itu, tidak ikut berubah ketika rapat berikutnya diperbarui.
 *
 * RAPAT P3 tidak mewarisi apa pun: rapat itu penutup rangkaian.
 */
class NotulenBerlanjut
{
    /**
     * Kolom formulir notulen yang ikut dibawa.
     *
     * Tautan absensi, tanggal terbit, dan tanggal tanda tangan tidak termasuk:
     * ketiganya melekat pada rapat asalnya dan justru menyesatkan bila terbawa.
     */
    private const KOLOM_KICKOFF = [
        'nomor_dokumen',
        'revisi',
        'pimpinan_rapat',
        'tempat',
        'waktu',
        'agenda',
        'peserta',
        'penyampaian_pln',
        'nama_mitra',
        'penyampaian_mitra',
        'hasil_kesepakatan',
        'pimpinan_nama',
        'pimpinan_jabatan',
        'notulis_nama',
        'notulis_jabatan',
        'kota_ttd',
    ];

    /**
     * Salin notulen rapat sebelumnya untuk bagian yang di rapat ini masih kosong.
     *
     * Tiap bagian diperiksa sendiri-sendiri, jadi aman dipanggil setiap halaman
     * dibuka: begitu penggunanya mengubah atau menghapus isian, bagian itu tidak
     * akan pernah tertimpa salinan baru.
     *
     * @return DailyMeeting|null rapat asal salinan, null bila tidak ada yang disalin
     */
    public static function wariskan(DailyMeeting $rapat): ?DailyMeeting
    {
        if (! $rapat->bolehMewarisiNotulen()) {
            return null;
        }

        $asal = self::wariskanPermasalahan($rapat);

        // Formulir notulen tetap dicoba walau daftar permasalahannya sudah ada,
        // karena keduanya diisi terpisah.
        return self::wariskanFormulir($rapat) ?? $asal;
    }

    /** Daftar permasalahan — tab "Notulen". */
    private static function wariskanPermasalahan(DailyMeeting $rapat): ?DailyMeeting
    {
        if ($rapat->issues()->exists()) {
            return null;
        }

        $sumber = $rapat->sumberWarisan('issues');

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

    /** Formulir Notulen Rapat (kick off). */
    private static function wariskanFormulir(DailyMeeting $rapat): ?DailyMeeting
    {
        if ($rapat->kickoff()->exists()) {
            return null;
        }

        $sumber = $rapat->sumberWarisan('kickoff');
        $asal = $sumber?->kickoff;

        if (! $asal) {
            return null;
        }

        $nilai = collect(self::KOLOM_KICKOFF)
            ->mapWithKeys(fn (string $kolom) => [$kolom => $asal->{$kolom}])
            ->filter(fn ($v) => filled($v));

        if ($nilai->isEmpty()) {
            return null;
        }

        MeetingKickoff::create([
            'meeting_id' => $rapat->id,
            ...$nilai->all(),
        ]);

        return $sumber;
    }
}
