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
        Schema::create('kinerja_qualities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outage_plan_id')->constrained()->onDelete('cascade');
            $table->decimal('dm_sebelum', 8, 2)->nullable();
            $table->decimal('sfc_sebelum', 8, 2)->nullable();
            $table->string('eviden_sebelum')->nullable();
            $table->decimal('dm_sesudah', 8, 2)->nullable();
            $table->decimal('sfc_sesudah', 8, 2)->nullable();
            $table->string('eviden_sesudah')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kinerja_qualities');
    }
};
