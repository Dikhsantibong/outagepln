<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_briefing_kickoff_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_briefing_id')->constrained('daily_briefings')->cascadeOnDelete();
            $table->longText('foto');
            $table->string('caption')->nullable();
            $table->timestamps();

            $table->index('daily_briefing_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_briefing_kickoff_photos');
    }
};
