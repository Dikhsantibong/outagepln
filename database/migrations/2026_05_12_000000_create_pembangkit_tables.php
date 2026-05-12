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
        Schema::create('unit', function (Blueprint $table) {
            $table->integer('id_unit')->autoIncrement();
            $table->string('nama_sentral', 120)->unique('uq_sentral')->comment('Nama sentral (col6)');
            $table->string('nama_rayon', 120)->nullable()->comment('Nama unit/rayon (col5)');
            $table->string('unit_pelaksana', 80)->nullable()->comment('Unit pelaksana (col4)');
            $table->string('milik', 20)->nullable()->comment('Pemilik aset (col3)');
        });

        Schema::create('mesin', function (Blueprint $table) {
            $table->integer('id_mesin')->autoIncrement();
            $table->unsignedTinyInteger('no_urut')->comment('Nomor urut (col2)');
            $table->integer('id_unit')->comment('FK -> unit.id_unit');
            $table->string('nama_mesin', 200)->nullable()->comment('Nama/label mesin (col7)');
            $table->string('sistim', 80)->nullable()->comment('Sistem jaringan (col8)');
            $table->string('pgk_merk', 120)->nullable()->comment('Merk penggerak (col9)');
            $table->string('pgk_type', 100)->nullable()->comment('Type penggerak (col10)');
            $table->string('pgk_seri', 100)->nullable()->comment('Seri penggerak (col11)');
            $table->unsignedSmallInteger('tahun_operasi')->nullable()->comment('Tahun operasi (col12)');
            $table->string('gen_merk', 120)->nullable()->comment('Merk generator (col13)');
            $table->string('gen_tipe', 100)->nullable()->comment('Tipe generator (col14)');
            $table->string('gen_seri', 100)->nullable()->comment('Seri generator (col15)');
            $table->unsignedInteger('gen_tegangan_output')->nullable()->comment('Tegangan output V (col16)');
            $table->string('trafo_nama', 200)->nullable()->comment('Nama trafo (col17)');
            $table->string('trafo_merk', 120)->nullable()->comment('Merk trafo (col18)');
            $table->string('trafo_seri', 100)->nullable()->comment('Seri trafo (col19)');
            $table->string('trafo_tegangan_hvlv', 20)->nullable()->comment('Tegangan HV/LV kV (col20)');
            $table->unsignedSmallInteger('trafo_kapasitas_kva')->nullable()->comment('Kapasitas KVA (col21)');
            $table->string('jenis_pembangkit', 10)->nullable()->comment('PLTD/PLTM dll (col22)');
            $table->string('status', 50)->nullable()->comment('Status operasi (col23)');
            $table->string('jenis_bahan_bakar', 30)->nullable()->comment('Jenis BBM (col24)');
            $table->string('status_tegangan', 10)->nullable()->comment('TM/TR dll (col25)');
            $table->unsignedInteger('beban_puncak_kw')->nullable()->comment('Beban puncak/NDC KW (col26)');
            $table->decimal('daya_terpasang_kw', 8, 1)->nullable()->comment('Daya terpasang KW (col27)');
            $table->unsignedInteger('dmn_kw')->nullable()->comment('DMN KW (col28)');
            $table->string('kota_kabupaten', 60)->nullable()->comment('Kota/kabupaten (col29)');
            $table->string('porsi_neraca_energi', 20)->nullable()->comment('Porsi neraca energi (col30)');

            $table->index('id_unit', 'idx_unit');
            $table->index(['id_unit', 'no_urut'], 'idx_sentral');
            
            $table->foreign('id_unit', 'fk_mesin_unit')
                  ->references('id_unit')
                  ->on('unit')
                  ->onDelete('restrict')
                  ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mesin');
        Schema::dropIfExists('unit');
    }
};
