<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingKickoffPhoto extends Model
{
    protected $fillable = [
        'meeting_id',
        'foto',
        'caption',
    ];

    public function meeting()
    {
        return $this->belongsTo(DailyMeeting::class, 'meeting_id');
    }
}
