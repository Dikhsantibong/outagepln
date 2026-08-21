<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Riwayat revisi rencana outage.
 *
 * Tiap baris adalah satu versi rencana (RENC, REV 1, REV 2, ... tanpa batas),
 * menyimpan rencana start/finish beserta kelima tanggal rapat hasil hitungan
 * saat itu — supaya jadwal lama tetap terbaca setelah rencananya digeser.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outage_plan_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outage_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('urutan')->default(0);
            $table->date('start_date')->nullable();
            $table->date('selesai')->nullable();
            $table->date('rapat_r2')->nullable();
            $table->date('rapat_r3')->nullable();
            $table->date('rapat_p1')->nullable();
            $table->date('rapat_p2')->nullable();
            $table->date('rapat_p3')->nullable();
            $table->string('catatan')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['outage_plan_id', 'urutan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outage_plan_revisions');
    }
};
