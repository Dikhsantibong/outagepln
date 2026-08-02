<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Machines are managed per engine brand (CUMMINS, MIRRLEES, ...). The brand
     * is derived from the machine name and stored on the plan so it can be
     * indexed and filtered; a user account is tied to the brand it manages.
     */
    public function up(): void
    {
        Schema::table('outage_plans', function (Blueprint $table) {
            $table->string('merek')->nullable()->after('jenis_pembangkit');
            $table->index('merek');
        });

        Schema::table('users', function (Blueprint $table) {
            // Null for admin/tamu: they are not limited to a single brand.
            $table->string('merek')->nullable()->after('role');
            $table->index('merek');
        });
    }

    public function down(): void
    {
        Schema::table('outage_plans', function (Blueprint $table) {
            $table->dropIndex(['merek']);
            $table->dropColumn('merek');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['merek']);
            $table->dropColumn('merek');
        });
    }
};
