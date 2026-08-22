<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Jejak aktivitas tambah/ubah/hapus seluruh modul.
 *
 * Nama dan peran pelaku ikut disalin ke barisnya, bukan hanya direferensikan
 * lewat user_id — supaya catatan lama tetap terbaca setelah akunnya dihapus
 * atau perannya berganti.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_nama')->nullable();
            $table->string('user_role', 50)->nullable();

            $table->string('event', 20);
            $table->string('subject_type');
            $table->string('subject_label', 100);
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('deskripsi')->nullable();

            $table->json('perubahan')->nullable();

            $table->string('url', 500)->nullable();
            $table->string('method', 10)->nullable();
            $table->string('ip', 45)->nullable();

            $table->timestamp('created_at')->nullable()->index();

            $table->index(['subject_type', 'subject_id']);
            $table->index(['user_role', 'event']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
