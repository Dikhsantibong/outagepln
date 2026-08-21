<?php

namespace App\Support;

use Carbon\CarbonImmutable;

/**
 * Penjadwalan rapat pra-outage dari tanggal rencana start.
 *
 * Seluruh rapat dihitung mundur dari rencana start, sehingga sekali rencana
 * start digeser semua rapatnya ikut bergeser. Angka offset ditaruh di sini
 * supaya backend, formulir revisi, dan pratinjau di layar memakai satu rumus
 * yang sama — bukan tiga salinan yang bisa berbeda diam-diam.
 */
class JadwalRapatOutage
{
    /**
     * Mundur berapa hari tiap rapat dari rencana start.
     *
     * @var array<string, int>
     */
    public const OFFSET_HARI = [
        'rapat_r2' => 365,
        'rapat_r3' => 180,
        'rapat_p1' => 90,
        'rapat_p2' => 30,
        'rapat_p3' => 7,
    ];

    /**
     * Tanggal kelima rapat untuk sebuah rencana start.
     *
     * @return array{rapat_r2: string, rapat_r3: string, rapat_p1: string, rapat_p2: string, rapat_p3: string}
     */
    public static function dariStart(string $startDate): array
    {
        $start = CarbonImmutable::parse($startDate)->startOfDay();

        $jadwal = [];

        foreach (self::OFFSET_HARI as $kolom => $mundur) {
            $jadwal[$kolom] = $start->subDays($mundur)->format('Y-m-d');
        }

        return $jadwal;
    }
}
