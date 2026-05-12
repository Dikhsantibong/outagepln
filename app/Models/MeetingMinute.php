<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingMinute extends Model
{
    protected $guarded = [];

    public function meeting()
    {
        return $this->belongsTo(DailyMeeting::class, 'meeting_id');
    }
}
