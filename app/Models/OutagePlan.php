<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OutagePlan extends Model
{
    protected $fillable = [
        'mesin_pembangkit',
        'scope',
        'jenis_pembangkit',
        'durasi',
        'start_date',
        'selesai',
        'progress',
        'rapat_r2',
        'rapat_r3',
        'rapat_p1',
        'rapat_p2',
        'rapat_p3',
        'ket',
    ];
}
