<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Penyimpanan pengaturan aplikasi sederhana (key-value).
 *
 * Dipakai antara lain untuk data penandatangan global (lihat App\Support\Ttd),
 * yang bisa diubah kapan saja oleh super admin lewat modul Data Master.
 */
class Setting extends Model
{
    protected $guarded = [];

    public static function get(string $key, ?string $default = null): ?string
    {
        $value = static::query()->where('key', $key)->value('value');

        return ($value === null || $value === '') ? $default : $value;
    }

    public static function put(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
