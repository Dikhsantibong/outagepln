<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Arsip berkas overhaul — kontrak dan hasil pekerjaan — yang diunggah
     * manual oleh admin.
     *
     * Berkasnya disimpan di disk privat, bukan public/storage, sealasan dengan
     * eviden kinerja: kontrak tidak boleh terbuka lewat URL tebakan. Kolom
     * `path` menyimpan lokasinya, dan penyajiannya lewat rute yang memeriksa
     * peran lebih dulu.
     */
    public function up(): void
    {
        Schema::create('arsip_dokumens', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->string('kategori')->index();
            $table->text('keterangan')->nullable();
            $table->string('path');
            // Nama saat diunggah, dipakai kembali waktu berkasnya diunduh —
            // nama di disk sengaja diacak agar tidak bisa ditebak.
            $table->string('nama_asli');
            $table->string('mime')->nullable();
            $table->unsignedBigInteger('ukuran')->default(0);
            // Pengunggah boleh terhapus tanpa ikut membuang arsipnya, jadi
            // namanya disalin dan relasinya di-null-kan.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_nama')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arsip_dokumens');
    }
};
