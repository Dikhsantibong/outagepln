<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyBriefing extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'tanggal_terbit' => 'date',
        ];
    }

    public function attendees()
    {
        return $this->hasMany(DailyBriefingAttendee::class);
    }

    public function issues()
    {
        return $this->hasMany(DailyBriefingIssue::class);
    }

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->token)) {
                $model->token = \Illuminate\Support\Str::random(64);
            }
        });
    }
}
