<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sebuah rapat bisa berlangsung beberapa hari. Tiap hari adalah catatan rapat
 * tersendiri (notulen & daftar hadir terpisah) namun tetap satu rangkaian untuk
 * mesin yang sama. `parent_id` menunjuk ke hari pertama (kepala rangkaian);
 * hari pertama sendiri bernilai null.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_briefings', function (Blueprint $table) {
            $table->foreignId('parent_id')
                ->nullable()
                ->after('id')
                ->constrained('daily_briefings')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('daily_briefings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
