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
        Schema::create('outage_plans', function (Blueprint $table) {
            $table->id();
            $table->string('mesin_pembangkit');
            $table->enum('scope', ['final stage', 'second tage', 'TO', 'MO', 'PMS 24 K', 'SO', 'PM 20 K', '2 ND STAGE']);
            $table->enum('jenis_pembangkit', ['pltd', 'pltm', 'pltmg']);
            $table->integer('durasi_hari');
            $table->integer('progres_persen');
            $table->date('rapat')->nullable();
            $table->enum('keterangan', ['open', 'close'])->nullable();
            $table->enum('sistem', ['RAHA', 'BAU BAU', 'WAKATOBI', 'WAWONII', 'EREKE', 'DAN SUB.S.KENDARI']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outage_plans');
    }
};
