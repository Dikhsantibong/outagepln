<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Satu versi rencana outage. Urutan 0 adalah rencana awal (RENC), selebihnya
 * revisi ke-n. Lihat [OutagePlan::catatRevisi()].
 */
class OutagePlanRevision extends Model
{
    protected $guarded = [];

    protected $casts = [
        'start_date' => 'date',
        'selesai' => 'date',
        'rapat_r2' => 'date',
        'rapat_r3' => 'date',
        'rapat_p1' => 'date',
        'rapat_p2' => 'date',
        'rapat_p3' => 'date',
    ];

    protected $appends = ['label'];

    /** Nama versi sebagaimana tampil di layar dan laporan. */
    public function getLabelAttribute(): string
    {
        return $this->urutan === 0 ? 'RENC' : 'REV '.$this->urutan;
    }

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
