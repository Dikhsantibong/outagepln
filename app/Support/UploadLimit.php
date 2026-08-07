<?php

namespace App\Support;

/**
 * Batas ukuran unggahan yang benar-benar berlaku di server ini.
 *
 * Aturan validasi sebelumnya dipatok 5 MB, padahal PHP di server hanya menerima
 * upload_max_filesize 2 MB dengan post_max_size 8 MB. Akibatnya berkas 3 MB
 * ditolak PHP sebelum Laravel sempat memvalidasi, dan berkas di atas post_max_size
 * memunculkan PostTooLargeException — halaman error mentah, bukan pesan yang
 * bisa dimengerti pengguna.
 *
 * Nilainya dibaca dari konfigurasi PHP supaya batas di aturan validasi, pesan
 * kesalahan, dan pengecekan di browser selalu sama dan ikut berubah kalau
 * konfigurasi server diubah.
 */
class UploadLimit
{
    /** Batas efektif satu berkas, dalam byte. */
    public static function bytes(): int
    {
        $upload = self::parseIni(ini_get('upload_max_filesize'));
        $post = self::parseIni(ini_get('post_max_size'));

        // post_max_size mencakup seluruh isi form, bukan hanya berkasnya, jadi
        // sisakan ruang untuk field lain.
        $post = $post > 0 ? $post - 262144 : 0;

        $candidates = array_filter([$upload, $post], fn ($v) => $v > 0);

        return $candidates === [] ? 2 * 1024 * 1024 : (int) min($candidates);
    }

    /** Batas dalam kilobyte, satuan yang dipakai aturan `max:` Laravel. */
    public static function kilobytes(): int
    {
        return intdiv(self::bytes(), 1024);
    }

    /** Label untuk pesan kesalahan, mis. "1,7 MB". */
    public static function label(): string
    {
        return number_format(self::bytes() / 1048576, 1, ',', '.') . ' MB';
    }

    /** Aturan validasi eviden yang dipakai seluruh modul Kinerja. */
    public static function evidenRules(): array
    {
        return ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:' . self::kilobytes()];
    }

    /** Nilai ini PHP seperti "8M" atau "512K" menjadi byte. */
    private static function parseIni(string|false $value): int
    {
        $value = trim((string) $value);

        if ($value === '') {
            return 0;
        }

        $unit = strtolower(substr($value, -1));
        $number = (int) $value;

        return match ($unit) {
            'g' => $number * 1024 * 1024 * 1024,
            'm' => $number * 1024 * 1024,
            'k' => $number * 1024,
            default => $number,
        };
    }
}
