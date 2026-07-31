<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KinerjaCost extends Model
{
    protected $fillable = [
        'outage_plan_id',
        'anggaran_rencana',
        'anggaran_aktual',
        'eviden',
    ];

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }
}
