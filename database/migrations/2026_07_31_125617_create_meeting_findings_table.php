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
        Schema::create('meeting_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('daily_meetings')->cascadeOnDelete();
            $table->date('tanggal')->nullable();
            $table->string('uraian');
            $table->string('part_number')->nullable();
            $table->integer('qty')->nullable();
            $table->string('satuan')->nullable();
            // Stored as a base64 data URI, mirroring how meeting signatures are kept.
            $table->longText('foto')->nullable();
            $table->text('keterangan')->nullable();
            $table->text('tindak_lanjut')->nullable();
            $table->string('target')->default('Open');
            $table->timestamps();

            $table->index('meeting_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_findings');
    }
};
