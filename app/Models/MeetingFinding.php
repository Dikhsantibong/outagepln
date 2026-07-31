<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingFinding extends Model
{
    protected $fillable = [
        'meeting_id',
        'tanggal',
        'uraian',
        'part_number',
        'qty',
        'satuan',
        'foto',
        'keterangan',
        'tindak_lanjut',
        'target',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'qty' => 'integer',
    ];

    public function meeting()
    {
        return $this->belongsTo(DailyMeeting::class, 'meeting_id');
    }
}
