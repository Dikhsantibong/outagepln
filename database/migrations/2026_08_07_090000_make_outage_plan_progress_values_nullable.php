<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A day that has not been filled in yet must be stored as NULL, not 0.
 *
 * The columns used to be NOT NULL DEFAULT 0, and the update endpoint coerced
 * every blank input to 0. Because progress is cumulative, the form then refused
 * to save: day 12 held 0 while day 11 held 45, which the "tidak boleh turun"
 * rule correctly reported as a decrease. Clearing the field did not help — it
 * came back as 0 on the next save, so such a plan could never be edited again.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outage_plan_progresses', function (Blueprint $table) {
            $table->double('plan_progress')->nullable()->default(null)->change();
            $table->double('actual_progress')->nullable()->default(null)->change();
        });

        $this->clearPlaceholderZeros();
    }

    public function down(): void
    {
        DB::table('outage_plan_progresses')->whereNull('plan_progress')->update(['plan_progress' => 0]);
        DB::table('outage_plan_progresses')->whereNull('actual_progress')->update(['actual_progress' => 0]);

        Schema::table('outage_plan_progresses', function (Blueprint $table) {
            $table->double('plan_progress')->default(0)->nullable(false)->change();
            $table->double('actual_progress')->default(0)->nullable(false)->change();
        });
    }

    /**
     * Repairs rows already written by the old behaviour.
     *
     * Only a 0 that comes after a larger value on an earlier day is provably a
     * placeholder — cumulative progress cannot go back down. A leading run of
     * zeros is genuine "belum mulai" data and is left untouched.
     */
    private function clearPlaceholderZeros(): void
    {
        $planIds = DB::table('outage_plan_progresses')->distinct()->pluck('outage_plan_id');

        foreach ($planIds as $planId) {
            $rows = DB::table('outage_plan_progresses')
                ->where('outage_plan_id', $planId)
                ->orderBy('tanggal')
                ->get(['id', 'plan_progress', 'actual_progress']);

            $maxPlan = 0.0;
            $maxActual = 0.0;

            foreach ($rows as $row) {
                $plan = (float) $row->plan_progress;
                $actual = (float) $row->actual_progress;
                $update = [];

                if ($plan === 0.0 && $maxPlan > 0.0) {
                    $update['plan_progress'] = null;
                } else {
                    $maxPlan = max($maxPlan, $plan);
                }

                if ($actual === 0.0 && $maxActual > 0.0) {
                    $update['actual_progress'] = null;
                } else {
                    $maxActual = max($maxActual, $actual);
                }

                if ($update !== []) {
                    DB::table('outage_plan_progresses')->where('id', $row->id)->update($update);
                }
            }
        }
    }
};
