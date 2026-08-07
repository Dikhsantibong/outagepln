<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KinerjaQuality extends Model
{
    protected $fillable = [
        'outage_plan_id',
        'dm_sebelum',
        'sfc_sebelum',
        'eviden_sebelum',
        'dm_sesudah',
        'sfc_sesudah',
        'eviden_sesudah',
    ];

    protected $casts = [
        'dm_sebelum' => 'float',
        'sfc_sebelum' => 'float',
        'dm_sesudah' => 'float',
        'sfc_sesudah' => 'float',
    ];

    protected $appends = [
        'dm_naik_persen',
        'sfc_turun_persen',
        'dm_tercapai',
        'sfc_tercapai',
        'tercapai',
    ];

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }

    /**
     * Rekap penilaian atas sekumpulan record.
     *
     * `$wajib` adalah jumlah mesin yang seharusnya dinilai — yaitu yang
     * overhaulnya sudah selesai. Itu yang jadi penyebut nilai On Quality, bukan
     * jumlah data yang kebetulan sudah diisi. Tanpa itu, satu data yang tercapai
     * dari puluhan mesin akan terbaca 100%, seolah semua mesin sudah memenuhi
     * target padahal sisanya belum dinilai sama sekali.
     *
     * @param  \Illuminate\Support\Collection<int, self>  $records
     * @return array{terisi: int, wajib: int, tercapai: int, tidakTercapai: int, dmTercapai: int, sfcTercapai: int, dmNaikRata: float, sfcTurunRata: float, nilai: float, kelengkapan: float}
     */
    public static function ringkasan($records, int $wajib = 0): array
    {
        $lengkap = $records->filter(fn (self $k) => $k->is_lengkap);
        $terisi = $lengkap->count();

        // Data yang terlanjur diisi sebelum aturan progres 100% berlaku tetap
        // ikut dihitung, jadi penyebutnya tidak pernah lebih kecil dari isinya.
        $wajib = max($wajib, $terisi);

        if ($terisi === 0) {
            return [
                'terisi' => 0, 'wajib' => $wajib, 'tercapai' => 0, 'tidakTercapai' => 0,
                'dmTercapai' => 0, 'sfcTercapai' => 0,
                'dmNaikRata' => 0.0, 'sfcTurunRata' => 0.0,
                'nilai' => 0.0, 'kelengkapan' => 0.0,
            ];
        }

        $tercapai = $lengkap->where('tercapai', true)->count();

        return [
            'terisi' => $terisi,
            'wajib' => $wajib,
            'tercapai' => $tercapai,
            'tidakTercapai' => $terisi - $tercapai,
            'dmTercapai' => $lengkap->where('dm_tercapai', true)->count(),
            'sfcTercapai' => $lengkap->where('sfc_tercapai', true)->count(),
            'dmNaikRata' => round((float) $lengkap->avg('dm_naik_persen'), 2),
            'sfcTurunRata' => round((float) $lengkap->avg('sfc_turun_persen'), 2),
            'nilai' => round(($tercapai / $wajib) * 100, 1),
            'kelengkapan' => round(($terisi / $wajib) * 100, 1),
        ];
    }

    /**
     * Kenaikan daya mampu dalam persen terhadap kondisi sebelum overhaul.
     * Positif berarti naik. Null bila datanya belum lengkap.
     */
    public function getDmNaikPersenAttribute(): ?float
    {
        return $this->deltaPersen($this->dm_sebelum, $this->dm_sesudah);
    }

    /**
     * Penurunan SFC dalam persen terhadap kondisi sebelum overhaul.
     * Positif berarti turun — arah yang diinginkan, karena SFC makin kecil
     * makin irit. Null bila datanya belum lengkap.
     */
    public function getSfcTurunPersenAttribute(): ?float
    {
        $delta = $this->deltaPersen($this->sfc_sebelum, $this->sfc_sesudah);

        return $delta === null ? null : -$delta;
    }

    /** Daya mampu harus benar-benar naik; sama besar belum berarti tercapai. */
    public function getDmTercapaiAttribute(): ?bool
    {
        if ($this->dm_sebelum === null || $this->dm_sesudah === null) {
            return null;
        }

        return $this->dm_sesudah > $this->dm_sebelum;
    }

    /** SFC harus benar-benar turun setelah overhaul. */
    public function getSfcTercapaiAttribute(): ?bool
    {
        if ($this->sfc_sebelum === null || $this->sfc_sesudah === null) {
            return null;
        }

        return $this->sfc_sesudah < $this->sfc_sebelum;
    }

    /**
     * On Quality tercapai hanya bila kedua parameter terpenuhi: daya mampu naik
     * DAN SFC turun. Null bila salah satu pasangan datanya belum lengkap.
     */
    public function getTercapaiAttribute(): ?bool
    {
        $dm = $this->dm_tercapai;
        $sfc = $this->sfc_tercapai;

        if ($dm === null || $sfc === null) {
            return null;
        }

        return $dm && $sfc;
    }

    /** Apakah kedua pasangan pengukuran sudah terisi dan bisa dinilai. */
    public function getIsLengkapAttribute(): bool
    {
        return $this->tercapai !== null;
    }

    /**
     * Perubahan sesudah terhadap sebelum, dalam persen.
     * Nilai `sebelum` nol tidak bisa jadi pembagi, jadi dianggap belum terukur.
     */
    private function deltaPersen(?float $sebelum, ?float $sesudah): ?float
    {
        if ($sebelum === null || $sesudah === null || $sebelum == 0.0) {
            return null;
        }

        return round((($sesudah - $sebelum) / $sebelum) * 100, 2);
    }
}
