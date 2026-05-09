<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OutagePlan extends Model
{
    protected $fillable = [
        'mesin_pembangkit',
        'scope',
        'jenis_pembangkit',
        'durasi_hari',
        'progres_persen',
        'rapat',
        'keterangan',
        'sistem',
    ];
}
