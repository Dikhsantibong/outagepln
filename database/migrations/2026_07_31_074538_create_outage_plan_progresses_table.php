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
        Schema::create('outage_plan_progresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outage_plan_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->double('plan_progress')->default(0);
            $table->double('actual_progress')->default(0);
            $table->string('keterangan')->nullable();
            $table->timestamps();

            $table->unique(['outage_plan_id', 'tanggal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outage_plan_progresses');
    }
};
