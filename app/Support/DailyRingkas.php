<?php

namespace App\Support;

/**
 * Meringkas daftar berpoin sebuah baris harian menjadi teks siap cetak.
 *
 * Uraian pekerjaan dan material kini tersimpan sebagai daftar, sedangkan tabel
 * rekap PDF/Excel butuh satu sel per baris. Diringkas di satu tempat agar PDF
 * dan Excel tidak pernah menampilkan bentuk yang berbeda, dan agar data lama
 * (kolom teks tunggal) tetap terbaca di keduanya.
 */
class DailyRingkas
{
    /**
     * Poin pekerjaan sebagai daftar bernomor, progres masing-masing di ujung.
     *
     * Contoh: "1. Pretest beban 1.700 kW (40%)"
     */
    public static function pekerjaan($dp): string
    {
        $items = collect($dp->work_items ?? [])
            ->filter(fn ($w) => filled($w['uraian'] ?? null))
            ->values();

        if ($items->isEmpty()) {
            // Data sebelum migrasi masih memakai kolom teks tunggal.
            return (string) ($dp->uraian_pekerjaan ?: '');
        }

        return $items
            ->map(function ($w, $i) {
                $progress = $w['progress'] ?? null;
                $suffix = ($progress === null || $progress === '')
                    ? ''
                    : ' (' . number_format((float) $progress, 2, ',', '.') . '%)';

                return ($i + 1) . '. ' . $w['uraian'] . $suffix;
            })
            ->implode("\n");
    }

    /**
     * Material sebagai daftar bernomor beserta part number dan jumlahnya.
     *
     * Contoh: "1. Gasket cylinder head — PN-9911 — 2 Bh"
     */
    public static function material($dp): string
    {
        $parts = collect($dp->spare_parts ?? [])
            ->filter(fn ($p) => filled($p['nama'] ?? null) || filled($p['part_number'] ?? null))
            ->values();

        if ($parts->isEmpty()) {
            $lama = array_filter([$dp->material_nama, $dp->material_part_number]);

            return $lama === [] ? '' : implode(' — ', $lama);
        }

        return $parts
            ->map(function ($p, $i) {
                $bagian = array_filter([
                    $p['nama'] ?? '',
                    $p['part_number'] ?? '',
                    $p['qty'] ?? '',
                ], fn ($v) => filled($v));

                return ($i + 1) . '. ' . implode(' — ', $bagian);
            })
            ->implode("\n");
    }

    /**
     * Material sebagai baris terstruktur — satu entri per spare part.
     *
     * Dipakai lembar/halaman Material tersendiri di rekap PDF dan Excel, yang
     * menampilkannya sebagai tabel berkolom (bukan teks berpoin). Data lama
     * (kolom teks tunggal) tetap terbaca sebagai satu baris.
     *
     * @return array<int, array{nama: string, part_number: string, qty: string, keterangan: string}>
     */
    public static function materialRows($dp): array
    {
        $parts = collect($dp->spare_parts ?? [])
            ->filter(fn ($p) => filled($p['nama'] ?? null) || filled($p['part_number'] ?? null))
            ->values();

        if ($parts->isNotEmpty()) {
            return $parts->map(fn ($p) => [
                'nama' => (string) ($p['nama'] ?? ''),
                'part_number' => (string) ($p['part_number'] ?? ''),
                'qty' => (string) ($p['qty'] ?? ''),
                'keterangan' => (string) ($p['keterangan'] ?? ''),
            ])->all();
        }

        // Data sebelum migrasi masih memakai kolom teks tunggal.
        if (filled($dp->material_nama) || filled($dp->material_part_number)) {
            return [[
                'nama' => (string) ($dp->material_nama ?? ''),
                'part_number' => (string) ($dp->material_part_number ?? ''),
                'qty' => '',
                'keterangan' => '',
            ]];
        }

        return [];
    }
}
