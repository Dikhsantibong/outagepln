<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingAttendee extends Model
{
    protected $guarded = [];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    public function meeting()
    {
        return $this->belongsTo(DailyMeeting::class, 'meeting_id');
    }
}
