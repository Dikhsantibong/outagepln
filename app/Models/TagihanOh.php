<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TagihanOh extends Model
{
    protected $table = 'tagihan_oh';

    protected $fillable = [
        'pekerjaan',
        'pembangkit',
        'no_kontrak',
        'tahun',
        'nilai_kontrak',
        'terbayar',
        'belum_terbayar',
        'keterangan',
    ];

    protected $casts = [
        'nilai_kontrak' => 'float',
        'terbayar' => 'float',
        'belum_terbayar' => 'float',
    ];
}
