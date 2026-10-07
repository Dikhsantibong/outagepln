<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mesin extends Model
{
    protected $table = 'mesin';

    protected $primaryKey = 'id_mesin';

    public $timestamps = false;

    protected $guarded = [];

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'id_unit', 'id_unit');
    }

    protected static function booted(): void
    {
        // Pembagian akun pengelola per tipe membaca outage_plans.tipe, jadi
        // perubahan Type di Data Mesin langsung diteruskan ke rencananya.
        static::saved(function (Mesin $mesin) {
            if ($mesin->wasChanged(['pgk_type', 'nama_mesin']) || $mesin->wasRecentlyCreated) {
                OutagePlan::sinkronkanTipeMesin($mesin);
            }
        });
    }
}
