<?php

namespace App\Support;

/**
 * Aturan filter tahun yang dipakai seragam oleh seluruh menu.
 *
 * Setiap halaman terbuka pada tahun berjalan, bukan menampilkan seluruh tahun
 * sekaligus. Pengguna tetap bisa memilih "Semua tahun", tapi itu harus diminta
 * secara eksplisit lewat nilai `semua` — kalau cukup dengan mengosongkan
 * parameter, halaman akan langsung kembali ke tahun berjalan dan pilihan
 * pengguna tampak tidak berfungsi.
 */
class TahunFilter
{
    /** Nilai parameter `tahun` yang berarti "tampilkan semua tahun". */
    public const SEMUA = 'semua';

    /**
     * Tahun yang harus ditampilkan, atau null bila semua tahun.
     *
     * @param  array<int, string>  $options  daftar tahun yang ada datanya
     */
    public static function resolve(mixed $requested, array $options): ?int
    {
        if ((string) $requested === self::SEMUA || $options === []) {
            return null;
        }

        // Tahun di luar data diabaikan, supaya URL sembarangan tidak
        // mengosongkan halaman.
        if (in_array((string) $requested, $options, true)) {
            return (int) $requested;
        }

        $sekarang = (string) now()->year;

        // Tahun berjalan belum punya data sama sekali: jatuh ke tahun terbaru,
        // lebih berguna daripada menampilkan halaman kosong.
        return (int) (in_array($sekarang, $options, true) ? $sekarang : self::terbaru($options));
    }

    /** Nilai yang dikirim balik ke frontend agar dropdown menampilkan pilihan yang benar. */
    public static function label(?int $tahun): string
    {
        return $tahun === null ? self::SEMUA : (string) $tahun;
    }

    /**
     * Daftar tahun unik dari sebuah kolom tanggal, terbaru dulu.
     *
     * substr, bukan YEAR(): kolom DATE selalu terbaca 'YYYY-MM-DD' sehingga
     * query ini jalan di MySQL maupun SQLite (dipakai di test).
     *
     * @return array<int, string>
     */
    public static function options(\Illuminate\Database\Eloquent\Builder $query, string $column): array
    {
        return $query
            ->whereNotNull($column)
            ->selectRaw("DISTINCT substr({$column}, 1, 4) as tahun")
            ->orderByDesc('tahun')
            ->pluck('tahun')
            ->map(fn ($t) => (string) $t)
            ->all();
    }

    /** @param array<int, string> $options */
    private static function terbaru(array $options): string
    {
        // options() sudah terurut menurun, tapi jangan bergantung pada urutan
        // pemanggil yang lain.
        return (string) max(array_map('intval', $options));
    }
}
