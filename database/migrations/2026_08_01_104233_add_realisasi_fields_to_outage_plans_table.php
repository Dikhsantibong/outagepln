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
        Schema::table('outage_plans', function (Blueprint $table) {
            // Columns O-R of the PERENCANAAN sheet.
            $table->string('sistem')->nullable()->after('ket');
            $table->date('real_start')->nullable()->after('sistem');
            $table->date('real_stop')->nullable()->after('real_start');
            $table->string('ket_realisasi')->nullable()->after('real_stop');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('outage_plans', function (Blueprint $table) {
            $table->dropColumn(['sistem', 'real_start', 'real_stop', 'ket_realisasi']);
        });
    }
};
