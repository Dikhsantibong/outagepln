<?php

namespace App\Models;

use Database\Factories\MaterialFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    /** @use HasFactory<MaterialFactory> */
    use HasFactory;

    protected $fillable = ['nama', 'jenis_mesin', 'part_number', 'satuan'];
}
