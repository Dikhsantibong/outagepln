<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyBriefingKickoffPhoto extends Model
{
    protected $fillable = [
        'daily_briefing_id',
        'foto',
        'caption',
    ];

    public function briefing()
    {
        return $this->belongsTo(DailyBriefing::class, 'daily_briefing_id');
    }
}
