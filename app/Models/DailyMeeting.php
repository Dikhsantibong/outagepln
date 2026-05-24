<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DailyMeeting extends Model
{
    protected $guarded = [];

    protected $casts = [
        'tanggal' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (DailyMeeting $meeting) {
            if (empty($meeting->token)) {
                $meeting->token = Str::random(32);
            }
        });
    }

    public function attendees()
    {
        return $this->hasMany(MeetingAttendee::class, 'meeting_id');
    }

    public function minutes()
    {
        return $this->hasOne(MeetingMinute::class, 'meeting_id');
    }

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }

    public function getStatusAttribute($value)
    {
        if ($value !== 'completed' && $this->tanggal && $this->tanggal->isToday()) {
            return 'berlangsung';
        }
        return $value;
    }
}
