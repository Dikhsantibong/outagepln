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
            $table->string('mesin_pembangkit')->nullable();
            $table->string('scope')->nullable();
            $table->string('jenis_pembangkit')->nullable();
            $table->integer('durasi')->nullable();
            $table->date('start_date')->nullable();
            $table->date('selesai')->nullable();
            $table->double('progress')->nullable();
            $table->string('rapat_r2')->nullable();
            $table->string('rapat_r3')->nullable();
            $table->string('rapat_p1')->nullable();
            $table->string('rapat_p2')->nullable();
            $table->string('rapat_p3')->nullable();
            $table->string('ket')->nullable();
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
