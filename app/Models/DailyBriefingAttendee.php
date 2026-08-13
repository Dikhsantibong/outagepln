<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyBriefingAttendee extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
        ];
    }

    public function dailyBriefing()
    {
        return $this->belongsTo(DailyBriefing::class);
    }
}
