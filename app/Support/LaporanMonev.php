<?php

namespace App\Support;

use App\Models\KinerjaCost;
use App\Models\KinerjaQuality;
use App\Models\OutagePlan;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Merakit data Laporan MONEV Pemeliharaan Periodik (HARDIK).
 *
 * Sebagian parameter pada format laporan belum punya sumber datanya di aplikasi
 * ini — PRK, kontrak, pembayaran, dan luncuran belum dicatat di mana pun. Alih-
 * alih menebak angkanya, parameter seperti itu diisi penanda yang tegas
 * ([BELUM_ADA] dan kawan-kawan) supaya berkas yang tercetak jujur menyatakan
 * mana yang sudah terisi dan mana yang menunggu modulnya.
 *
 * Yang sudah bisa dihitung penuh: ringkasan status pekerjaan, sebaran per jenis
 * pembangkit dan per site, rincian pekerjaan, SFC dan daya mampu sebelum/sesudah
 * overhaul, serta kesimpulan otomatis.
 */
class LaporanMonev
{
    /** Sumbernya ada tapi belum diisi operator. */
    public const BELUM_ADA = 'Data belum tersedia';

    /** Kolomnya memang belum ada di basis data. */
    public const TIDAK_TERSEDIA = 'Parameter tidak tersedia';

    /** Modulnya sedang disiapkan. */
    public const DALAM_PENGEMBANGAN = 'Dalam pengembangan';

    public function __construct(
        private readonly ?int $tahun,
        private readonly ?object $user = null,
        private readonly ?string $unitPembangkit = null,
    ) {}

    /** Query rencana yang tercakup laporan, sudah menghormati hak akses akun. */
    private function rencana(): Builder
    {
        $query = OutagePlan::visibleTo($this->user);

        if ($this->tahun !== null) {
            $query->whereYear('start_date', $this->tahun);
        }

        return $query;
    }

    /**
     * Seluruh isi laporan, mengikuti struktur pada format MONEV.
     *
     * @return array<string, mixed>
     */
    public function data(): array
    {
        $plans = $this->rencana()->orderBy('unit')->orderBy('mesin_pembangkit')->get();

        return [
            'identity' => $this->identitas($plans->count()),
            'summary' => $this->ringkasan($plans),
            'plants' => $this->perJenisPembangkit($plans),
            'sites' => $this->perSite($plans),
            'maintenance' => $this->rincianPekerjaan($plans),
            'belum_terlaksana' => $this->belumTerlaksana($plans),
            'performance' => $this->kinerjaSetelahOh($plans),
            'budget' => $this->anggaran($plans),
            'carry_over' => $this->luncuran(),
            'exceptions' => $this->exception($plans),
            'contract' => $this->monitoringKontrak($plans),
            'payment' => $this->monitoringPembayaran(),
            'kpi' => $this->kpi($plans),
            'conclusion' => $this->kesimpulan($plans),
        ];
    }

    // ---------------------------------------------------------- 1. Identitas

    /** @return array<string, string> */
    private function identitas(int $jumlah): array
    {
        return [
            'title' => 'Laporan MONEV Pemeliharaan Periodik (HARDIK)',
            'unit' => $this->unitPembangkit ?: 'PLN Nusantara Power UP Kendari',
            'year' => $this->tahun !== null ? (string) $this->tahun : 'Semua tahun',
            'period' => $this->tahun !== null
                ? 'Januari – Desember '.$this->tahun
                : 'Seluruh periode tercatat',
            'date' => CarbonImmutable::now()->translatedFormat('d F Y'),
            'location' => 'Kendari',
            'cakupan' => $jumlah.' rencana outage',
        ];
    }

    // ------------------------------------------------------ 2. Summary HARDIK

    /** @return array<string, mixed> */
    private function ringkasan($plans): array
    {
        return [
            'total_prk' => $plans->count(),
            // PRK murni vs luncuran membutuhkan penanda tahun anggaran asal,
            // yang belum dicatat pada rencana outage.
            'total_murni' => self::TIDAK_TERSEDIA,
            'total_luncuran' => self::TIDAK_TERSEDIA,
            'contracted' => self::TIDAK_TERSEDIA,
            'not_contracted' => self::TIDAK_TERSEDIA,
            'finished' => $plans->filter(fn ($p) => $this->status($p) === 'FINISH')->count(),
            'on_progress' => $plans->filter(fn ($p) => $this->status($p) === 'ON_PROGRESS')->count(),
            'not_started' => $plans->filter(fn ($p) => $this->status($p) === 'NOT_STARTED')->count(),
            'not_finished' => $plans->filter(fn ($p) => $this->status($p) === 'NOT_FINISH')->count(),
            'progress_fisik' => $this->rerataProgres($plans),
        ];
    }

    /**
     * Status satu pekerjaan menurut daftar tertutup pada format laporan.
     *
     * NOT_FINISH dipisahkan dari ON_PROGRESS: keduanya belum 100%, tapi yang
     * pertama sudah melewati rencana selesainya — itulah yang perlu disorot.
     */
    private function status(OutagePlan $plan): string
    {
        $progress = (float) ($plan->progress ?? 0);

        if ($progress >= 100) {
            return 'FINISH';
        }

        $lewatJadwal = filled($plan->selesai)
            && CarbonImmutable::parse($plan->selesai)->isBefore(CarbonImmutable::today());

        if ($lewatJadwal) {
            return 'NOT_FINISH';
        }

        return $progress > 0 ? 'ON_PROGRESS' : 'NOT_STARTED';
    }

    private function rerataProgres($plans): float
    {
        return $plans->isEmpty()
            ? 0.0
            : round($plans->avg(fn ($p) => (float) ($p->progress ?? 0)), 2);
    }

    // ------------------------------------------- 3. Per jenis pembangkit

    /** @return array<int, array<string, mixed>> */
    private function perJenisPembangkit($plans): array
    {
        return $plans
            ->groupBy(fn ($p) => $p->jenis_pembangkit ?: 'TIDAK DIISI')
            ->map(fn ($grup, $jenis) => [
                'plant_type' => $jenis,
                'planned' => $grup->count(),
                'realized' => $grup->filter(fn ($p) => $this->status($p) === 'FINISH')->count(),
                'on_progress' => $grup->filter(fn ($p) => $this->status($p) === 'ON_PROGRESS')->count(),
                'not_started' => $grup->filter(fn ($p) => $this->status($p) === 'NOT_STARTED')->count(),
                'progress' => $this->rerataProgres($grup),
            ])
            ->sortByDesc('planned')
            ->values()
            ->all();
    }

    // ------------------------------------------------- 4. Progress per site

    /** @return array<int, array<string, mixed>> */
    private function perSite($plans): array
    {
        return $plans
            ->groupBy(fn ($p) => $p->unit ?: 'TIDAK DIISI')
            ->map(function ($grup, $site) {
                $selesai = $grup->filter(fn ($p) => $this->status($p) === 'FINISH')->count();

                return [
                    'site_name' => $site,
                    'plant_type' => $grup->pluck('jenis_pembangkit')->filter()->unique()->implode(', ') ?: '—',
                    'planned' => $grup->count(),
                    'realized' => $selesai,
                    'on_progress' => $grup->filter(fn ($p) => $this->status($p) === 'ON_PROGRESS')->count(),
                    'not_started' => $grup->filter(fn ($p) => $this->status($p) === 'NOT_STARTED')->count(),
                    'progress' => $this->rerataProgres($grup),
                    'status' => match (true) {
                        $selesai === $grup->count() => 'FINISH',
                        $grup->contains(fn ($p) => $this->status($p) === 'NOT_FINISH') => 'NOT_FINISH',
                        $grup->contains(fn ($p) => $this->status($p) === 'ON_PROGRESS') => 'ON_PROGRESS',
                        default => 'NOT_STARTED',
                    },
                ];
            })
            ->sortByDesc('planned')
            ->values()
            ->all();
    }

    // ------------------------------------------------ 5. Detail pekerjaan OH

    /** @return array<int, array<string, mixed>> */
    private function rincianPekerjaan($plans): array
    {
        return $plans->map(fn ($p) => [
            // Nomor PRK dan work order belum dicatat; id rencana dipakai sebagai
            // rujukan sementara supaya barisnya tetap bisa ditelusuri.
            'prk_number' => self::TIDAK_TERSEDIA,
            'work_order_number' => self::TIDAK_TERSEDIA,
            'ref' => '#'.$p->id,
            'site_name' => $p->unit ?: '—',
            'machine_name' => $p->mesin_pembangkit ?: '—',
            'plant_type' => $p->jenis_pembangkit ?: '—',
            'work_type' => $p->scope ?: '—',
            'planned_date' => $this->tanggal($p->start_date),
            'start_date' => $this->tanggal($p->real_start),
            'finish_date' => $this->tanggal($p->real_stop),
            'progress' => (float) ($p->progress ?? 0),
            'status' => $this->status($p),
            'contract_status' => self::TIDAK_TERSEDIA,
        ])->values()->all();
    }

    // --------------------------------------- 6. HARDIK belum terlaksana

    /** @return array<int, array<string, mixed>> */
    private function belumTerlaksana($plans): array
    {
        return $plans
            ->filter(fn ($p) => in_array($this->status($p), ['NOT_STARTED', 'NOT_FINISH'], true))
            ->map(fn ($p) => [
                'prk_number' => self::TIDAK_TERSEDIA,
                'site_name' => $p->unit ?: '—',
                'machine_name' => $p->mesin_pembangkit ?: '—',
                'planned_date' => $this->tanggal($p->start_date),
                'status' => $this->status($p),
                'progress' => (float) ($p->progress ?? 0),
                // Alasan penundaan belum punya kolomnya; keterangan realisasi
                // dipakai bila operator sempat menuliskannya di sana.
                'reason' => $p->ket_realisasi ?: self::TIDAK_TERSEDIA,
                'is_postponed' => self::TIDAK_TERSEDIA,
            ])
            ->values()
            ->all();
    }

    // --------------------------------------- 7-9. SFC dan daya mampu (DMP)

    /** @return array<string, mixed> */
    private function kinerjaSetelahOh($plans): array
    {
        $baris = KinerjaQuality::whereIn('outage_plan_id', $plans->pluck('id'))
            ->with('outagePlan:id,mesin_pembangkit,unit,real_stop')
            ->get()
            ->filter(fn ($k) => $k->sfc_sebelum !== null || $k->dm_sebelum !== null)
            ->map(function ($k) {
                $sfcSebelum = $k->sfc_sebelum !== null ? (float) $k->sfc_sebelum : null;
                $sfcSesudah = $k->sfc_sesudah !== null ? (float) $k->sfc_sesudah : null;
                $dmpSebelum = $k->dm_sebelum !== null ? (float) $k->dm_sebelum : null;
                $dmpSesudah = $k->dm_sesudah !== null ? (float) $k->dm_sesudah : null;

                return [
                    'machine_name' => $k->outagePlan?->mesin_pembangkit ?: '—',
                    'site_name' => $k->outagePlan?->unit ?: '—',
                    'oh_date' => $this->tanggal($k->outagePlan?->real_stop),
                    'sfc_before' => $sfcSebelum,
                    'sfc_after' => $sfcSesudah,
                    // SFC membaik bila turun, jadi selisihnya sebelum − sesudah.
                    'sfc_difference' => $this->selisih($sfcSebelum, $sfcSesudah),
                    'sfc_improvement' => $this->persenPerbaikan($sfcSebelum, $sfcSesudah, turunLebihBaik: true),
                    'dmp_before' => $dmpSebelum,
                    'dmp_after' => $dmpSesudah,
                    // Daya mampu membaik bila naik, jadi arahnya kebalikan SFC.
                    'dmp_difference' => $this->selisih($dmpSesudah, $dmpSebelum),
                    'dmp_improvement' => $this->persenPerbaikan($dmpSebelum, $dmpSesudah, turunLebihBaik: false),
                ];
            })
            ->values();

        $rerata = fn (string $kunci) => $baris->pluck($kunci)->filter(fn ($v) => $v !== null)->avg();

        return [
            'rows' => $baris->all(),
            'average_sfc_before' => $this->bulat($rerata('sfc_before')),
            'average_sfc_after' => $this->bulat($rerata('sfc_after')),
            'average_sfc_improvement' => $this->bulat($rerata('sfc_improvement')),
            'average_dmp_before' => $this->bulat($rerata('dmp_before')),
            'average_dmp_after' => $this->bulat($rerata('dmp_after')),
            'average_dmp_improvement' => $this->bulat($rerata('dmp_improvement')),
        ];
    }

    private function selisih(?float $a, ?float $b): ?float
    {
        return $a === null || $b === null ? null : round($a - $b, 2);
    }

    /** Persentase perbaikan terhadap kondisi sebelum overhaul. */
    private function persenPerbaikan(?float $sebelum, ?float $sesudah, bool $turunLebihBaik): ?float
    {
        if ($sebelum === null || $sesudah === null || $sebelum == 0.0) {
            return null;
        }

        $delta = $turunLebihBaik ? $sebelum - $sesudah : $sesudah - $sebelum;

        return round(($delta / abs($sebelum)) * 100, 2);
    }

    // ------------------------------------------------ 10-11. Anggaran AI/AO

    /** @return array<string, mixed> */
    private function anggaran($plans): array
    {
        $biaya = KinerjaCost::whereIn('outage_plan_id', $plans->pluck('id'))->get();

        $rencana = (float) $biaya->sum(fn ($c) => (float) ($c->anggaran_rencana ?? 0));
        $aktual = (float) $biaya->sum(fn ($c) => (float) ($c->anggaran_aktual ?? 0));

        return [
            // Anggaran tercatat sebagai satu angka; pemisahan Investasi (AI) dan
            // Operasi (AO) belum ada penandanya di basis data.
            'terisi' => $biaya->filter(fn ($c) => $c->anggaran_rencana !== null)->count(),
            'gabungan_rencana' => $rencana,
            'gabungan_aktual' => $aktual,
            'gabungan_realisasi_persen' => $rencana > 0 ? round(($aktual / $rencana) * 100, 2) : null,
            'ai' => [
                'prk_budget' => self::TIDAK_TERSEDIA,
                'contract_value' => self::TIDAK_TERSEDIA,
                'paid_value' => self::TIDAK_TERSEDIA,
                'unpaid_value' => self::TIDAK_TERSEDIA,
            ],
            'ao' => [
                'prk_budget' => self::TIDAK_TERSEDIA,
                'contract_value' => self::TIDAK_TERSEDIA,
                'paid_value' => self::TIDAK_TERSEDIA,
                'unpaid_value' => self::TIDAK_TERSEDIA,
            ],
        ];
    }

    // ---------------------------------------------------- 12. Luncuran

    /** @return array<string, string> */
    private function luncuran(): array
    {
        return [
            'keterangan' => self::DALAM_PENGEMBANGAN,
            'carry_over_prk' => self::TIDAK_TERSEDIA,
            'carry_over_contract_value' => self::TIDAK_TERSEDIA,
            'carry_over_paid_value' => self::TIDAK_TERSEDIA,
            'carry_over_unpaid_value' => self::TIDAK_TERSEDIA,
        ];
    }

    // ------------------------------------------------- 13. Exception

    /** @return array<string, mixed> */
    private function exception($plans): array
    {
        return [
            'total_not_started' => $plans->filter(fn ($p) => $this->status($p) === 'NOT_STARTED')->count(),
            'total_on_progress' => $plans->filter(fn ($p) => $this->status($p) === 'ON_PROGRESS')->count(),
            'total_not_finish' => $plans->filter(fn ($p) => $this->status($p) === 'NOT_FINISH')->count(),
            'total_not_contracted' => self::TIDAK_TERSEDIA,
            'total_postponed' => self::TIDAK_TERSEDIA,
            'total_unpaid' => self::TIDAK_TERSEDIA,
            'total_budget_recomposition' => self::TIDAK_TERSEDIA,
            'rows' => $plans
                ->filter(fn ($p) => $this->status($p) === 'NOT_FINISH')
                ->map(fn ($p) => [
                    'exception_type' => 'NOT_FINISH',
                    'site_name' => $p->unit ?: '—',
                    'machine_name' => $p->mesin_pembangkit ?: '—',
                    'description' => 'Melewati rencana selesai '.$this->tanggal($p->selesai)
                        .', progres '.(float) ($p->progress ?? 0).'%',
                    'reason' => $p->ket_realisasi ?: self::TIDAK_TERSEDIA,
                ])
                ->values()
                ->all(),
        ];
    }

    // ------------------------------------- 14-15. Kontrak dan pembayaran

    /** @return array<string, mixed> */
    private function monitoringKontrak($plans): array
    {
        return [
            'total_prk' => $plans->count(),
            'total_contracted' => self::TIDAK_TERSEDIA,
            'total_not_contracted' => self::TIDAK_TERSEDIA,
            'total_prk_value' => self::TIDAK_TERSEDIA,
            'total_contract_value' => self::TIDAK_TERSEDIA,
            'realization_percentage' => self::TIDAK_TERSEDIA,
            'keterangan' => self::DALAM_PENGEMBANGAN,
        ];
    }

    /** @return array<string, string> */
    private function monitoringPembayaran(): array
    {
        return [
            'total_contract_value' => self::TIDAK_TERSEDIA,
            'total_paid_value' => self::TIDAK_TERSEDIA,
            'total_unpaid_value' => self::TIDAK_TERSEDIA,
            'realization_percentage' => self::TIDAK_TERSEDIA,
            'keterangan' => self::DALAM_PENGEMBANGAN,
        ];
    }

    // ---------------------------------------------------------- 16. KPI

    /** @return array<string, mixed> */
    private function kpi($plans): array
    {
        $kinerja = $this->kinerjaSetelahOh($plans);

        return [
            'overall_progress' => $this->rerataProgres($plans),
            'total_finished' => $plans->filter(fn ($p) => $this->status($p) === 'FINISH')->count(),
            'total_on_progress' => $plans->filter(fn ($p) => $this->status($p) === 'ON_PROGRESS')->count(),
            'total_not_finished' => $plans->filter(fn ($p) => $this->status($p) === 'NOT_FINISH')->count(),
            'total_not_started' => $plans->filter(fn ($p) => $this->status($p) === 'NOT_STARTED')->count(),
            'average_sfc_improvement' => $kinerja['average_sfc_improvement'],
            'average_dmp_improvement' => $kinerja['average_dmp_improvement'],
            'contract_realization' => self::TIDAK_TERSEDIA,
            'payment_realization' => self::TIDAK_TERSEDIA,
        ];
    }

    // -------------------------------------------- 18. Kesimpulan otomatis

    /** @return array<string, mixed> */
    private function kesimpulan($plans): array
    {
        $kpi = $this->kpi($plans);
        $total = $plans->count();

        $kalimat = $total === 0
            ? 'Belum ada rencana outage pada periode ini, sehingga kesimpulan belum dapat disusun.'
            : sprintf(
                'Dari %d rencana outage, %d selesai (%s%%), %d sedang berjalan, %d belum dimulai, '
                .'dan %d melewati rencana selesai. Rata-rata progres fisik %s%%.',
                $total,
                $kpi['total_finished'],
                $total > 0 ? round(($kpi['total_finished'] / $total) * 100, 1) : 0,
                $kpi['total_on_progress'],
                $kpi['total_not_started'],
                $kpi['total_not_finished'],
                $kpi['overall_progress'],
            );

        $catatanKinerja = $kpi['average_sfc_improvement'] === null
            ? 'Perbaikan SFC dan daya mampu belum dapat disimpulkan karena pengukurannya belum lengkap.'
            : sprintf(
                'Rata-rata perbaikan SFC %s%% dan daya mampu %s%% setelah overhaul.',
                $kpi['average_sfc_improvement'],
                $kpi['average_dmp_improvement'] ?? 0,
            );

        return [
            'ringkasan' => $kalimat,
            'kinerja' => $catatanKinerja,
            'anggaran' => 'Realisasi kontrak dan pembayaran belum dapat disimpulkan — '
                .strtolower(self::DALAM_PENGEMBANGAN).'.',
        ];
    }

    private function tanggal(mixed $nilai): string
    {
        if (blank($nilai)) {
            return '—';
        }

        return CarbonImmutable::parse((string) $nilai)->format('d-m-Y');
    }

    private function bulat(mixed $nilai): ?float
    {
        return $nilai === null ? null : round((float) $nilai, 2);
    }
}
