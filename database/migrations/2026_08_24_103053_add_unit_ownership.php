<?php

use App\Models\OutagePlan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One engine brand is maintained at several plants — MIRRLEES sits at both
     * PLTD POASIA and PLTD RAHA — so a brand alone cannot say who manages a
     * machine. The plant is derived from the machine name and stored next to
     * the brand, and a managing account may be pinned to one plant on top of
     * its brand. Accounts left without a plant keep seeing the whole brand.
     */
    public function up(): void
    {
        Schema::table('outage_plans', function (Blueprint $table) {
            $table->string('unit')->nullable()->after('merek');
            $table->index('unit');
        });

        Schema::table('users', function (Blueprint $table) {
            // Null for admin/tamu and for a pengelola that owns every plant.
            $table->string('unit')->nullable()->after('merek');
            $table->index('unit');
        });

        $this->isiUnitRencana();
    }

    public function down(): void
    {
        Schema::table('outage_plans', function (Blueprint $table) {
            $table->dropIndex(['unit']);
            $table->dropColumn('unit');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['unit']);
            $table->dropColumn('unit');
        });
    }

    /** Backfill the derived plant on rows that already exist. */
    private function isiUnitRencana(): void
    {
        DB::table('outage_plans')
            ->select('id', 'mesin_pembangkit')
            ->orderBy('id')
            ->chunk(200, function ($rencana) {
                foreach ($rencana as $baris) {
                    DB::table('outage_plans')
                        ->where('id', $baris->id)
                        ->update(['unit' => OutagePlan::extractUnit($baris->mesin_pembangkit)]);
                }
            });
    }
};
