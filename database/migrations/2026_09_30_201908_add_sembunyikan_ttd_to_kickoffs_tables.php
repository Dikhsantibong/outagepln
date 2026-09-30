<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel formulir notulen yang punya blok tanda tangan.
     *
     * @var array<int, string>
     */
    private array $tabel = ['daily_briefing_kickoffs', 'meeting_kickoffs'];

    /**
     * Opsi menyembunyikan penandatangan pada notulen. Bawaannya false, jadi
     * notulen yang sudah ada tetap menampilkan Pimpinan Rapat dan Notulis.
     */
    public function up(): void
    {
        foreach ($this->tabel as $tabel) {
            Schema::table($tabel, function (Blueprint $table) {
                $table->boolean('sembunyikan_pimpinan')->default(false)->after('pimpinan_jabatan');
                $table->boolean('sembunyikan_notulis')->default(false)->after('notulis_jabatan');
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tabel as $tabel) {
            Schema::table($tabel, function (Blueprint $table) {
                $table->dropColumn(['sembunyikan_pimpinan', 'sembunyikan_notulis']);
            });
        }
    }
};
