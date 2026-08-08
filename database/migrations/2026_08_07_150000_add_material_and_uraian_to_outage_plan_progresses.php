<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Material yang dipakai dan uraian pekerjaan per hari.
 *
 * Material sementara diketik manual. Kolomnya sengaja dibuat sebagai teks biasa,
 * bukan foreign key ke tabel master, karena data master material belum ada —
 * begitu tersedia, kolom `material_id` bisa ditambahkan tanpa membuang data yang
 * sudah terlanjur diketik di sini.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outage_plan_progresses', function (Blueprint $table) {
            $table->string('material_part_number', 100)->nullable()->after('actual_progress');
            $table->string('material_nama', 255)->nullable()->after('material_part_number');
            $table->text('uraian_pekerjaan')->nullable()->after('material_nama');
        });
    }

    public function down(): void
    {
        Schema::table('outage_plan_progresses', function (Blueprint $table) {
            $table->dropColumn(['material_part_number', 'material_nama', 'uraian_pekerjaan']);
        });
    }
};
