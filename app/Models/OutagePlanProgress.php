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

    /**
     * Leading bila aktual melampaui rencana, On Progres bila persis sama,
     * Lagging bila tertinggal. Hari yang belum diisi tidak berstatus apa pun.
     */
    public function getStatusAttribute(): string
    {
        if ($this->plan_progress === null && $this->actual_progress === null) {
            return '-';
        }

        $plan = (float) ($this->plan_progress ?? 0);
        $actual = (float) ($this->actual_progress ?? 0);

        if ($actual === $plan) {
            return 'On Progres';
        }

        return $actual > $plan ? 'Leading' : 'Lagging';
    }
}
