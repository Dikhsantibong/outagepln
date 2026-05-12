<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $table = 'unit';
    protected $primaryKey = 'id_unit';
    public $timestamps = false;

    protected $guarded = [];

    public function mesins()
    {
        return $this->hasMany(Mesin::class, 'id_unit', 'id_unit');
    }
}

