<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyBriefingIssue extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function dailyBriefing()
    {
        return $this->belongsTo(DailyBriefing::class);
    }
}
