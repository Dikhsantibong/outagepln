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
        Schema::create('daily_briefings', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->date('tanggal');
            $table->time('waktu_mulai')->nullable();
            $table->time('waktu_selesai')->nullable();
            $table->string('lokasi')->nullable();
            $table->string('token', 64)->unique();
            $table->enum('status', ['draft', 'active', 'completed'])->default('active');
            
            // Header Form Fields
            $table->string('unit')->nullable();
            $table->string('jenis_inspeksi')->nullable();
            $table->string('rapat_framework')->nullable();
            $table->string('tgl_performance_test')->nullable();
            $table->string('jam_setelah_po_terai')->nullable();
            $table->string('daya_mampu')->nullable();
            
            // Dokumen Fields
            $table->string('nomor_dokumen')->nullable();
            $table->string('revisi')->nullable();
            $table->date('tanggal_terbit')->nullable();
            
            // Signatures Names
            $table->string('nama_mengetahui')->nullable();
            $table->string('jabatan_mengetahui')->nullable();
            $table->string('nama_disetujui')->nullable();
            $table->string('jabatan_disetujui')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_briefings');
    }
};
