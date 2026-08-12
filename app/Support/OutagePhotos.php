<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Memuat foto dokumentasi harian untuk keperluan ekspor.
 *
 * Kolom `photos` menyimpan path relatif pada disk `public`. Baik dompdf maupun
 * PhpSpreadsheet tidak bisa mengambilnya lewat URL /storage — dompdf butuh data
 * URI, PhpSpreadsheet butuh berkas nyata — jadi keduanya dilayani dari satu
 * tempat di sini.
 */
class OutagePhotos
{
    /** Batas foto per hari pada berkas ekspor, supaya lebar tabel tetap wajar. */
    public const MAKS_PER_HARI = 4;

    /**
     * Path absolut foto sebuah baris harian, hanya yang berkasnya benar-benar ada.
     *
     * @param  array<int, string>|null  $photos
     * @return array<int, string>
     */
    public static function paths(?array $photos): array
    {
        $ada = [];

        foreach (array_slice($photos ?? [], 0, self::MAKS_PER_HARI) as $path) {
            // Berkas bisa hilang dari disk sementara catatannya tertinggal;
            // ekspor tidak boleh gagal gara-gara itu.
            if (is_string($path) && Storage::disk('public')->exists($path)) {
                $ada[] = Storage::disk('public')->path($path);
            }
        }

        return $ada;
    }

    /**
     * Foto sebagai data URI, untuk disematkan di PDF.
     *
     * @param  array<int, string>|null  $photos
     * @return array<int, string>
     */
    public static function dataUris(?array $photos): array
    {
        $uris = [];

        foreach (self::paths($photos) as $path) {
            $isi = @file_get_contents($path);

            if ($isi === false) {
                continue;
            }

            $mime = @mime_content_type($path) ?: 'image/jpeg';
            $uris[] = 'data:' . $mime . ';base64,' . base64_encode($isi);
        }

        return $uris;
    }

    /** Berapa hari yang punya dokumentasi foto. */
    public static function jumlahHariBerfoto($dailyProgresses): int
    {
        return $dailyProgresses
            ->filter(fn ($dp) => self::paths($dp->photos) !== [])
            ->count();
    }
}
