<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('meeting_kickoffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->unique()->constrained('daily_meetings')->cascadeOnDelete();

            // Document control block
            $table->string('nomor_dokumen')->nullable();
            $table->string('revisi')->nullable();
            $table->date('tanggal_terbit')->nullable();

            // Meeting header
            $table->string('pimpinan_rapat')->nullable();
            $table->string('tempat')->nullable();
            $table->string('waktu')->nullable();
            $table->text('agenda')->nullable();
            $table->string('peserta')->nullable();

            // I. Pembahasan
            $table->longText('penyampaian_pln')->nullable();
            $table->string('nama_mitra')->nullable();
            $table->longText('penyampaian_mitra')->nullable();
            $table->longText('hasil_kesepakatan')->nullable();

            // Lampiran
            $table->string('link_absensi')->nullable();

            // Tanda tangan
            $table->string('pimpinan_nama')->nullable();
            $table->string('pimpinan_jabatan')->nullable();
            $table->string('notulis_nama')->nullable();
            $table->string('notulis_jabatan')->nullable();
            $table->string('kota_ttd')->nullable();
            $table->date('tanggal_ttd')->nullable();

            $table->timestamps();
        });

        Schema::create('meeting_kickoff_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('daily_meetings')->cascadeOnDelete();
            // Stored as a base64 data URI, mirroring meeting signatures and findings.
            $table->longText('foto');
            $table->string('caption')->nullable();
            $table->timestamps();

            $table->index('meeting_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_kickoff_photos');
        Schema::dropIfExists('meeting_kickoffs');
    }
};
