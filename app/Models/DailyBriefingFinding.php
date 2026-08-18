<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyBriefingFinding extends Model
{
    protected $fillable = [
        'daily_briefing_id',
        'tanggal',
        'uraian',
        'part_number',
        'qty',
        'satuan',
        'foto',
        'keterangan',
        'tindak_lanjut',
        'target',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'qty' => 'integer',
    ];

    public function briefing()
    {
        return $this->belongsTo(DailyBriefing::class, 'daily_briefing_id');
    }
}
