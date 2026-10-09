<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Akun pengelola bisa memegang lebih dari satu unit — mis. CUMMINS QSK di PLTD
 * LANGARA dan PLTD EREKE sekaligus. Daftarnya disimpan di users.units; kolom
 * lama users.unit dipertahankan dan tetap terisi bila akunnya hanya satu unit,
 * jadi akun dan perintah lama tidak terpengaruh.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('units')->nullable()->after('unit');
        });

        DB::table('users')->whereNotNull('unit')->where('unit', '!=', '')
            ->get(['id', 'unit'])
            ->each(fn ($user) => DB::table('users')->where('id', $user->id)
                ->update(['units' => json_encode([$user->unit])]));
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('units');
        });
    }
};
