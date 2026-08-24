<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rapat harian dibentuk otomatis dari pekerjaan yang sedang berjalan, bukan
 * lagi dibuat manual satu per satu.
 *
 * Sebelumnya rapat hanya terhubung ke mesinnya lewat teks judul, sehingga tidak
 * ada cara pasti mengetahui rapat mana milik pekerjaan mana. `outage_plan_id`
 * mengikatnya secara tegas, dan `hari_ke` menandai hari keberapa dalam rentang
 * pelaksanaan — hari 1 sampai hari terakhir sesuai durasi.
 *
 * Pasangan (outage_plan_id, hari_ke) dibuat unik supaya pembentukan otomatis
 * aman dipanggil berulang, termasuk saat dua permintaan datang bersamaan.
 * Rapat lama yang dibuat manual tetap bernilai null pada kedua kolom dan tidak
 * ikut terpengaruh.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_briefings', function (Blueprint $table) {
            $table->foreignId('outage_plan_id')
                ->nullable()
                ->after('parent_id')
                ->constrained()
                ->nullOnDelete();

            $table->unsignedSmallInteger('hari_ke')->nullable()->after('outage_plan_id');

            $table->unique(['outage_plan_id', 'hari_ke'], 'daily_briefings_rencana_hari_unique');
        });
    }

    public function down(): void
    {
        Schema::table('daily_briefings', function (Blueprint $table) {
            $table->dropUnique('daily_briefings_rencana_hari_unique');
            $table->dropConstrainedForeignId('outage_plan_id');
            $table->dropColumn('hari_ke');
        });
    }
};
