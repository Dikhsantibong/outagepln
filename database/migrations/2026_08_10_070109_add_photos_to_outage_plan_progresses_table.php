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
        Schema::table('outage_plan_progresses', function (Blueprint $table) {
            $table->json('photos')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('outage_plan_progresses', function (Blueprint $table) {
            $table->dropColumn('photos');
        });
    }
};
