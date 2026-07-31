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
        Schema::create('kinerja_times', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outage_plan_id')->constrained()->onDelete('cascade');
            $table->date('start_date_aktual')->nullable();
            $table->date('selesai_aktual')->nullable();
            $table->string('eviden')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kinerja_times');
    }
};
