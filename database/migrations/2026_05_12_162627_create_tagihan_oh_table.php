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
        Schema::create('tagihan_oh', function (Blueprint $table) {
            $table->id();
            $table->string('pekerjaan');
            $table->enum('pembangkit', ['PLTD', 'PLTMG', 'PLTM']);
            $table->string('no_kontrak');
            $table->integer('tahun');
            $table->decimal('nilai_kontrak', 20, 2);
            $table->decimal('terbayar', 20, 2)->default(0);
            $table->decimal('belum_terbayar', 20, 2)->default(0);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tagihan_oh');
    }
};
