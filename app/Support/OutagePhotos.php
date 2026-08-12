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
            $isi = self::resizeAndEncode($path);
            if ($isi !== null) {
                $uris[] = $isi;
            }
        }

        return $uris;
    }

    private static function resizeAndEncode(string $path): ?string
    {
        $mime = @mime_content_type($path);
        
        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp'])) {
            $isi = @file_get_contents($path);
            if ($isi === false) return null;
            return 'data:' . ($mime ?: 'image/jpeg') . ';base64,' . base64_encode($isi);
        }

        try {
            $img = null;
            if ($mime === 'image/jpeg') {
                $img = @imagecreatefromjpeg($path);
            } elseif ($mime === 'image/png') {
                $img = @imagecreatefrompng($path);
            } elseif ($mime === 'image/webp') {
                $img = @imagecreatefromwebp($path);
            }

            if (! $img) {
                $isi = @file_get_contents($path);
                if ($isi === false) return null;
                return 'data:' . $mime . ';base64,' . base64_encode($isi);
            }

            $width = imagesx($img);
            $height = imagesy($img);
            $maxDimension = 800; 

            if ($width > $maxDimension || $height > $maxDimension) {
                if ($width > $height) {
                    $newWidth = $maxDimension;
                    $newHeight = (int) ($height * ($maxDimension / $width));
                } else {
                    $newHeight = $maxDimension;
                    $newWidth = (int) ($width * ($maxDimension / $height));
                }

                $newImg = imagecreatetruecolor($newWidth, $newHeight);
                $white = imagecolorallocate($newImg, 255, 255, 255);
                imagefill($newImg, 0, 0, $white);
                imagecopyresampled($newImg, $img, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($img);
                $img = $newImg;
            }

            ob_start();
            imagejpeg($img, null, 75);
            $imageString = ob_get_clean();
            imagedestroy($img);

            return 'data:image/jpeg;base64,' . base64_encode($imageString);
        } catch (\Throwable $e) {
            $isi = @file_get_contents($path);
            if ($isi === false) return null;
            return 'data:' . ($mime ?: 'image/jpeg') . ';base64,' . base64_encode($isi);
        }
    }

    /** Berapa hari yang punya dokumentasi foto. */
    public static function jumlahHariBerfoto($dailyProgresses): int
    {
        return $dailyProgresses
            ->filter(fn ($dp) => self::paths($dp->photos) !== [])
            ->count();
    }
}
