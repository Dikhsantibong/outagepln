<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Formulir absensi QR Rapat Outage sudah lama meminta NID dan instansi, tapi
 * kolomnya hanya pernah ditambahkan ke daily_briefing_attendees — sehingga
 * setiap pendaftaran kehadiran gagal. Kolom ini menyamakan keduanya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meeting_attendees', function (Blueprint $table) {
            $table->string('nid')->nullable()->after('nama');
            $table->string('instansi')->nullable()->after('nid');
        });
    }

    public function down(): void
    {
        Schema::table('meeting_attendees', function (Blueprint $table) {
            $table->dropColumn(['nid', 'instansi']);
        });
    }
};
