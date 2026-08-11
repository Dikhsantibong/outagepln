<?php

namespace App\Support;

use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use App\Models\KinerjaCost;
use App\Models\KinerjaQuality;
use App\Models\KinerjaTime;

/**
 * Sumber tunggal statistik outage untuk dashboard dan halaman publik.
 *
 * Dashboard dan welcome dulu menghitung angka yang sama dengan kode yang
 * disalin — ambang status, bucket progres, timeline. Salinan seperti itu cepat
 * menyimpang: satu halaman diperbaiki, satunya terlupa, dan totalnya jadi
 * berbeda. Semua definisi itu kini di sini, jadi kedua halaman mustahil
 * menampilkan angka yang tidak sama untuk cakupan data yang sama.
 *
 * `$query` adalah pabrik yang mengembalikan builder BARU tiap dipanggil, karena
 * satu figur bisa menjalankan beberapa query agregat pada basis yang sama.
 */
class OutageStats
{
    /** @param Closure(): Builder $query */
    public function __construct(private Closure $query)
    {
    }

    private function base(): Builder
    {
        return ($this->query)();
    }

    public function total(): int
    {
        return $this->base()->count();
    }

    /**
     * Belum mulai / berjalan / selesai, diturunkan dari progres kumulatif.
     *
     * @return array{selesai: int, berjalan: int, belum: int}
     */
    public function statusCounts(): array
    {
        $selesai = $this->base()->where('progress', '>=', 100)->count();
        $berjalan = $this->base()->where('progress', '>', 0)->where('progress', '<', 100)->count();
        $total = $this->base()->count();

        return [
            'selesai' => $selesai,
            'berjalan' => $berjalan,
            'belum' => $total - $selesai - $berjalan,
        ];
    }

    /** @return array<int, array{label: string, total: int}> */
    public function groupCount(string $column): array
    {
        return $this->base()
            ->select($column . ' as label', DB::raw('COUNT(*) as total'))
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->groupBy($column)
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['label' => (string) $r->label, 'total' => (int) $r->total])
            ->all();
    }

    /**
     * Sebaran progres per rentang.
     *
     * Batasnya aman-desimal: rentang integer lama diam-diam membuang nilai
     * seperti 25,5 dan menghitung progres null sebagai bukan-nol.
     *
     * @return array<int, array{range: string, count: int}>
     */
    public function progressDistribution(): array
    {
        $buckets = [
            '0%' => fn ($q) => $q->where(fn ($w) => $w->whereNull('progress')->orWhere('progress', '<=', 0)),
            '1-25%' => fn ($q) => $q->whereBetween('progress', [0.01, 25]),
            '26-50%' => fn ($q) => $q->whereBetween('progress', [25.01, 50]),
            '51-75%' => fn ($q) => $q->whereBetween('progress', [50.01, 75]),
            '76-99%' => fn ($q) => $q->whereBetween('progress', [75.01, 99.99]),
            '100%' => fn ($q) => $q->where('progress', '>=', 100),
        ];

        $out = [];
        foreach ($buckets as $range => $filter) {
            $out[] = ['range' => $range, 'count' => $filter($this->base())->count()];
        }

        return $out;
    }

    /**
     * Jumlah outage yang dimulai tiap bulan.
     *
     * substr, bukan DATE_FORMAT(): kolom DATE selalu terbaca 'YYYY-MM-DD'
     * sehingga query ini jalan di MySQL maupun SQLite (dipakai di test).
     *
     * @return array<int, array{bulan: string, total: int}>
     */
    public function monthlyTimeline(): array
    {
        return $this->base()
            ->select(DB::raw('substr(start_date, 1, 7) as bulan'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('start_date')
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get()
            ->map(fn ($r) => ['bulan' => $r->bulan, 'total' => (int) $r->total])
            ->all();
    }

    /**
     * Pekerjaan yang sedang dikerjakan (progres 1–99%), progres tertinggi dulu.
     *
     * @return array<int, array<string, mixed>>
     */
    public function ongoing(): array
    {
        return $this->base()
            ->where('progress', '>', 0)->where('progress', '<', 100)
            ->orderByDesc('progress')
            ->take(8)
            ->get()
            ->map(fn ($p) => [
                'mesin' => $p->mesin_pembangkit,
                'jenis' => $p->jenis_pembangkit,
                'scope' => $p->scope,
                'sistem' => $p->sistem,
                'progress' => (float) ($p->progress ?? 0),
                'mulai' => $p->start_date,
                'selesai' => $p->selesai,
            ])
            ->all();
    }

    public function upcoming(): array
    {
        return $this->base()
            ->where(fn ($q) => $q->whereNull('progress')->orWhere('progress', 0))
            ->orderBy('start_date')
            ->take(8)
            ->get()
            ->map(fn ($p) => [
                'mesin' => $p->mesin_pembangkit,
                'jenis' => $p->jenis_pembangkit,
                'scope' => $p->scope,
                'sistem' => $p->sistem,
                'durasi' => $p->durasi,
                'mulai' => $p->start_date,
                'selesai' => $p->selesai,
            ])
            ->all();
    }

    public function durasiByScope(): array
    {
        return $this->base()
            ->select('scope', DB::raw('AVG(durasi) as avg_durasi'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('scope')->where('scope', '!=', '')
            ->whereNotNull('durasi')
            ->groupBy('scope')
            ->orderByDesc('avg_durasi')
            ->get()
            ->map(fn ($r) => [
                'scope' => (string) $r->scope,
                'avg_durasi' => round((float) $r->avg_durasi, 1),
                'total' => (int) $r->total,
            ])
            ->all();
    }

    public function kinerja(): array
    {
        $planIds = $this->base()->pluck('id');
        $pct = fn (int $good, int $of) => $of > 0 ? round(($good / $of) * 100, 1) : 0;

        $tTotal = KinerjaTime::whereIn('outage_plan_id', $planIds)->whereNotNull('selesai_aktual')->count();
        $tGood = KinerjaTime::whereIn('outage_plan_id', $planIds)
            ->join('outage_plans', 'kinerja_times.outage_plan_id', '=', 'outage_plans.id')
            ->whereNotNull('kinerja_times.selesai_aktual')
            ->whereNotNull('outage_plans.selesai')
            ->whereColumn('kinerja_times.selesai_aktual', '<=', 'outage_plans.selesai')
            ->count();

        $cTotal = KinerjaCost::whereIn('outage_plan_id', $planIds)->whereNotNull('anggaran_aktual')->count();
        $cGood = KinerjaCost::whereIn('outage_plan_id', $planIds)
            ->whereNotNull('anggaran_aktual')->whereNotNull('anggaran_rencana')
            ->whereColumn('anggaran_aktual', '<=', 'anggaran_rencana')->count();

        return [
            'onQuality' => $this->onQuality($planIds),
            'onTime' => ['nilai' => $pct($tGood, $tTotal), 'terisi' => $tTotal],
            'onCost' => ['nilai' => $pct($cGood, $cTotal), 'terisi' => $cTotal],
            'onScope' => ['nilai' => 0, 'terisi' => 0],
            'onSafety' => ['nilai' => 0, 'terisi' => 0],
        ];
    }

    private function onQuality($planIds): array
    {
        $r = KinerjaQuality::ringkasan(
            KinerjaQuality::whereIn('outage_plan_id', $planIds)->get(),
            $this->base()->where('progress', '>=', 100)->count(),
        );

        if ($r['terisi'] === 0) {
            return ['nilai' => 0, 'terisi' => 0, 'detail' => []];
        }

        $sign = fn (float $v) => ($v > 0 ? '+' : '') . number_format($v, 2, ',', '.') . '%';

        return [
            'nilai' => $r['nilai'],
            'terisi' => $r['terisi'],
            'detail' => [
                ['label' => 'Tercapai', 'value' => "{$r['tercapai']}/{$r['wajib']} mesin"],
                ['label' => 'Sudah dinilai', 'value' => "{$r['terisi']}/{$r['wajib']} mesin"],
                ['label' => 'Daya mampu naik', 'value' => $sign($r['dmNaikRata']), 'baik' => $r['dmNaikRata'] > 0],
                ['label' => 'SFC turun', 'value' => $sign($r['sfcTurunRata']), 'baik' => $r['sfcTurunRata'] > 0],
            ],
        ];
    }

    /** Bentuk baris yang seragam untuk daftar mesin di kedua halaman. */
    private function rowShape($p): array
    {
        return [
            'id' => $p->id,
            'mesin' => $p->mesin_pembangkit,
            'scope' => $p->scope,
            'jenis' => $p->jenis_pembangkit,
            'sistem' => $p->sistem,
            'merek' => $p->merek,
            'progress' => (float) ($p->progress ?? 0),
            'durasi' => $p->durasi,
            'start_date' => $p->start_date,
            'selesai' => $p->selesai,
        ];
    }
}
