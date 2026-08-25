<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OutagePlanProgress extends Model
{
    protected $table = 'outage_plan_progresses';

    protected $fillable = [
        'outage_plan_id',
        'tanggal',
        'plan_progress',
        'actual_progress',
        // Daftar berpoin: uraian pekerjaan dengan progres tiap poin, dan
        // material dengan jumlahnya.
        'work_items',
        'spare_parts',
        // Kolom lama, dipertahankan agar data sebelum migrasi tetap terbaca.
        'material_part_number',
        'material_nama',
        'uraian_pekerjaan',
        'keterangan',
        'photos',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'plan_progress' => 'float',
        'actual_progress' => 'float',
        'work_items' => 'array',
        'spare_parts' => 'array',
        'photos' => 'array',
    ];

    protected $appends = [
        'status',
    ];

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }

    /**
     * Leading bila aktual melampaui rencana, On Progres bila persis sama,
     * Lagging bila tertinggal. Hari yang belum diisi tidak berstatus apa pun.
     *
     * Hari yang rencananya sudah diisi tapi realisasinya belum dilaporkan sama
     * sekali tidak dihitung tertinggal. Realisasi yang belum masuk bukan berarti
     * pekerjaannya terlambat — laporannya saja yang belum ditulis — dan bila
     * dianggap 0 seluruh hari yang menunggu laporan akan terbaca Lagging lalu
     * membengkakkan akumulasinya.
     *
     * Berbeda dengan aktual yang memang diisi 0: itu laporan bahwa pekerjaannya
     * belum bergerak, jadi tetap dibandingkan seperti biasa.
     */
    public function getStatusAttribute(): string
    {
        if ($this->plan_progress === null && $this->actual_progress === null) {
            return '-';
        }

        if ($this->actual_progress === null) {
            return 'On Progres';
        }

        $plan = (float) ($this->plan_progress ?? 0);
        $actual = (float) $this->actual_progress;

        if ($actual === $plan) {
            return 'On Progres';
        }

        return $actual > $plan ? 'Leading' : 'Lagging';
    }
}
