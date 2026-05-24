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
        Schema::table('daily_meetings', function (Blueprint $table) {
            $table->foreignId('outage_plan_id')->nullable()->constrained('outage_plans')->nullOnDelete();
            $table->string('tipe_rapat')->nullable(); // e.g. R2, R3, P1, P2, P3
            $table->string('link_meeting')->nullable(); // static zoom link
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_meetings', function (Blueprint $table) {
            $table->dropForeign(['outage_plan_id']);
            $table->dropColumn(['outage_plan_id', 'tipe_rapat', 'link_meeting']);
        });
    }
};
