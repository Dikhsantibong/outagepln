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
        Schema::create('daily_briefing_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_briefing_id')->constrained('daily_briefings')->onDelete('cascade');
            $table->text('permasalahan')->nullable();
            $table->text('tindak_lanjut')->nullable();
            $table->string('target')->nullable();
            $table->string('pic')->nullable();
            $table->enum('status', ['Open', 'Close'])->default('Open');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_briefing_issues');
    }
};
