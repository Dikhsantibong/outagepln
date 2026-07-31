<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OutagePlanProgress extends Model
{
    protected $table = 'outage_plan_progresses';

    protected $fillable = [
        'outage_plan_id',
        'tanggal',
        'plan_progress',
        'actual_progress',
        'keterangan',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'plan_progress' => 'float',
        'actual_progress' => 'float',
    ];

    protected $appends = [
        'status',
    ];

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }

    public function getStatusAttribute(): string
    {
        return ($this->actual_progress ?? 0) >= ($this->plan_progress ?? 0) ? 'Leading' : 'Lagging';
    }
}
