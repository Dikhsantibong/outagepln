<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_briefing_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_briefing_id')->constrained('daily_briefings')->cascadeOnDelete();
            $table->date('tanggal')->nullable();
            $table->string('uraian');
            $table->string('part_number')->nullable();
            $table->integer('qty')->nullable();
            $table->string('satuan')->nullable();
            $table->longText('foto')->nullable();
            $table->text('keterangan')->nullable();
            $table->text('tindak_lanjut')->nullable();
            $table->string('target')->default('Open');
            $table->timestamps();

            $table->index('daily_briefing_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_briefing_findings');
    }
};
