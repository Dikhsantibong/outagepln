<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KinerjaQuality extends Model
{
    protected $fillable = [
        'outage_plan_id',
        'dm_sebelum',
        'sfc_sebelum',
        'eviden_sebelum',
        'dm_sesudah',
        'sfc_sesudah',
        'eviden_sesudah',
    ];

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }
}
