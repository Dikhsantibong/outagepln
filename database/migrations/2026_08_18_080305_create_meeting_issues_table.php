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
        Schema::create('meeting_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_meeting_id')->constrained('daily_meetings')->cascadeOnDelete();
            $table->text('permasalahan')->nullable();
            $table->text('tindak_lanjut')->nullable();
            $table->string('target')->nullable();
            $table->string('pic')->nullable();
            $table->string('status')->default('Open');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_issues');
    }
};
