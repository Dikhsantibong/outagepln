<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * decimal(8,2) membulatkan setiap input ke dua angka di belakang koma, padahal
 * SFC lazim ditulis sampai tiga atau empat desimal (mis. 0,2145 liter/kWh) dan
 * pembulatan di situ langsung menggeser hasil perhitungan persentasenya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kinerja_qualities', function (Blueprint $table) {
            $table->decimal('dm_sebelum', 14, 4)->nullable()->change();
            $table->decimal('sfc_sebelum', 14, 4)->nullable()->change();
            $table->decimal('dm_sesudah', 14, 4)->nullable()->change();
            $table->decimal('sfc_sesudah', 14, 4)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('kinerja_qualities', function (Blueprint $table) {
            $table->decimal('dm_sebelum', 8, 2)->nullable()->change();
            $table->decimal('sfc_sebelum', 8, 2)->nullable()->change();
            $table->decimal('dm_sesudah', 8, 2)->nullable()->change();
            $table->decimal('sfc_sesudah', 8, 2)->nullable()->change();
        });
    }
};
