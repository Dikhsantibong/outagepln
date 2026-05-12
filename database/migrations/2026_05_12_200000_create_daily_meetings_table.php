<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_meetings', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->date('tanggal');
            $table->time('waktu_mulai')->nullable();
            $table->time('waktu_selesai')->nullable();
            $table->string('lokasi')->nullable();
            $table->string('token', 64)->unique();
            $table->enum('status', ['draft', 'active', 'completed'])->default('active');
            $table->timestamps();
        });

        Schema::create('meeting_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('daily_meetings')->onDelete('cascade');
            $table->string('nama');
            $table->string('divisi')->nullable();
            $table->string('jabatan')->nullable();
            $table->longText('signature')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('meeting_minutes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->unique()->constrained('daily_meetings')->onDelete('cascade');
            $table->text('agenda')->nullable();
            $table->text('latar_belakang')->nullable();
            $table->text('pembahasan')->nullable();
            $table->text('hasil_kesepakatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_minutes');
        Schema::dropIfExists('meeting_attendees');
        Schema::dropIfExists('daily_meetings');
    }
};
