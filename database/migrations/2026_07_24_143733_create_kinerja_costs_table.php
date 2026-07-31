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
        Schema::create('kinerja_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outage_plan_id')->constrained()->onDelete('cascade');
            $table->decimal('anggaran_rencana', 20, 2)->nullable();
            $table->decimal('anggaran_aktual', 20, 2)->nullable();
            $table->string('eviden')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kinerja_costs');
    }
};
