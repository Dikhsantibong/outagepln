<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Satu merek bisa terdiri dari beberapa tipe mesin — CUMMINS ada yang KTA 50 dan
 * ada yang QSK 23 — sehingga merek+unit belum cukup untuk memisahkan akun
 * pengelola. Kolom tipe melengkapi pemisahan itu.
 *
 * - outage_plans.tipe: tipe mesin rencana ini, diturunkan dari Data Mesin.
 * - users.tipe: tipe yang dipegang akun pengelola; kosong berarti semua tipe.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outage_plans', function (Blueprint $table) {
            $table->string('tipe')->nullable()->after('unit');
            $table->index('tipe');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('tipe')->nullable()->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('outage_plans', function (Blueprint $table) {
            $table->dropIndex(['tipe']);
            $table->dropColumn('tipe');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('tipe');
        });
    }
};
