<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingIssue extends Model
{
    use HasFactory;

    protected $fillable = [
        'daily_meeting_id',
        'permasalahan',
        'tindak_lanjut',
        'target',
        'pic',
        'status',
    ];

    public function dailyMeeting()
    {
        return $this->belongsTo(DailyMeeting::class);
    }
}
