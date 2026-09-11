<?php

namespace Tests\Feature\Master;

use App\Imports\MaterialsImport;
use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

/**
 * Master data material overhaul.
 *
 * Yang diuji: kolom jenis_mesin tersimpan saat membuat/memperbarui material,
 * nama material yang sama boleh dipakai ulang di mesin berbeda namun tidak
 * boleh ganda dalam satu jenis mesin.
 */
class MaterialTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => 'super_admin']);
    }

    public function test_daftar_material_dipaginasi_25_per_halaman(): void
    {
        Material::factory()->count(30)->create();

        $this->actingAs($this->superAdmin());

        $this->get('/master/materials')
            ->assertInertia(fn ($page) => $page
                ->component('master/materials/index')
                ->has('materials.data', 25)
                ->where('materials.total', 30)
                ->has('materials.links')
            );
    }

    public function test_daftar_material_dapat_dicari_dan_difilter_jenis_mesin(): void
    {
        Material::create(['nama' => 'GASKET KHUSUS', 'jenis_mesin' => 'Mesin Mitsubishi (Major Overhaul)']);
        Material::create(['nama' => 'O-SEAL', 'jenis_mesin' => 'Mesin Deutz Type BV 8M 628 (Major Overhaul)']);

        $this->actingAs($this->superAdmin());

        $this->get('/master/materials?search=KHUSUS')
            ->assertInertia(fn ($page) => $page
                ->has('materials.data', 1)
                ->where('materials.data.0.nama', 'GASKET KHUSUS')
            );

        $this->get('/master/materials?jenis_mesin='.urlencode('Mesin Deutz Type BV 8M 628 (Major Overhaul)'))
            ->assertInertia(fn ($page) => $page
                ->has('materials.data', 1)
                ->where('materials.data.0.nama', 'O-SEAL')
            );
    }

    public function test_super_admin_menyimpan_material_dengan_jenis_mesin(): void
    {
        $this->actingAs($this->superAdmin());

        $this->post('/master/materials', [
            'nama' => 'GASKET',
            'jenis_mesin' => 'Mesin Mitsubishi (Major Overhaul)',
            'part_number' => '02086208',
            'satuan' => 'Pcs',
        ])->assertRedirect();

        $this->assertDatabaseHas('materials', [
            'nama' => 'GASKET',
            'jenis_mesin' => 'Mesin Mitsubishi (Major Overhaul)',
            'part_number' => '02086208',
            'satuan' => 'Pcs',
        ]);
    }

    public function test_nama_sama_diizinkan_pada_jenis_mesin_berbeda(): void
    {
        $this->actingAs($this->superAdmin());

        Material::create(['nama' => 'O-SEAL', 'jenis_mesin' => 'Mesin Deutz Type BV 8M 628 (Major Overhaul)']);

        $this->post('/master/materials', [
            'nama' => 'O-SEAL',
            'jenis_mesin' => 'Mesin Cummins Type KTA 50 G8 (Final Stage)',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame(2, Material::where('nama', 'O-SEAL')->count());
    }

    public function test_nama_ganda_dalam_satu_jenis_mesin_ditolak(): void
    {
        $this->actingAs($this->superAdmin());

        Material::create(['nama' => 'O-SEAL', 'jenis_mesin' => 'Mesin Deutz Type BV 8M 628 (Major Overhaul)']);

        $this->post('/master/materials', [
            'nama' => 'O-SEAL',
            'jenis_mesin' => 'Mesin Deutz Type BV 8M 628 (Major Overhaul)',
        ])->assertSessionHasErrors('nama');

        $this->assertSame(1, Material::where('nama', 'O-SEAL')->count());
    }

    public function test_template_excel_dapat_diunduh(): void
    {
        $this->actingAs($this->superAdmin());

        $this->get('/master/materials/template')
            ->assertOk()
            ->assertHeader(
                'content-disposition',
                'attachment; filename=Template-Import-Material.xlsx'
            );
    }

    public function test_impor_excel_menambahkan_material_dan_melewati_duplikat(): void
    {
        Material::create(['nama' => 'GASKET', 'jenis_mesin' => 'Mesin Mitsubishi (Major Overhaul)']);

        $rows = new MaterialsImport;
        $rows->collection(collect([
            // Duplikat dengan yang sudah ada -> dilewati.
            collect(['nama_material' => 'GASKET', 'jenis_mesin' => 'Mesin Mitsubishi (Major Overhaul)', 'part_number' => '02086208', 'satuan' => 'Pcs']),
            // Nama sama tapi mesin berbeda -> masuk.
            collect(['nama_material' => 'GASKET', 'jenis_mesin' => 'Mesin Cummins Type KTA 50 G8 (Final Stage)', 'part_number' => '3049368', 'satuan' => 'Bh']),
            // Baru -> masuk.
            collect(['nama_material' => 'O-SEAL', 'jenis_mesin' => 'Mesin Mitsubishi (Major Overhaul)', 'part_number' => null, 'satuan' => 'Pcs']),
            // Kosong -> dilewati diam-diam.
            collect(['nama_material' => '', 'jenis_mesin' => '', 'part_number' => '', 'satuan' => '']),
        ]));

        $this->assertSame(2, $rows->imported);
        $this->assertSame(1, $rows->skipped);
        $this->assertSame(3, Material::count());
        $this->assertDatabaseHas('materials', [
            'nama' => 'O-SEAL',
            'jenis_mesin' => 'Mesin Mitsubishi (Major Overhaul)',
            'part_number' => null,
        ]);
    }

    public function test_endpoint_impor_memproses_berkas_yang_diunggah(): void
    {
        Excel::fake();

        $this->actingAs($this->superAdmin());

        $this->post('/master/materials/import', [
            'file' => UploadedFile::fake()->create('material.xlsx', 20, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        ])->assertRedirect()->assertSessionHas('success');

        Excel::assertImported('material.xlsx');
    }

    public function test_endpoint_impor_menolak_berkas_bukan_excel(): void
    {
        $this->actingAs($this->superAdmin());

        $this->post('/master/materials/import', [
            'file' => UploadedFile::fake()->create('material.pdf', 20, 'application/pdf'),
        ])->assertSessionHasErrors('file');
    }

    public function test_material_dapat_diperbarui_termasuk_jenis_mesin(): void
    {
        $this->actingAs($this->superAdmin());

        $material = Material::create([
            'nama' => 'BUSHING',
            'jenis_mesin' => 'Mesin MaK 8M 453 Tipe AK (Major Overhaul)',
        ]);

        $this->put("/master/materials/{$material->id}", [
            'nama' => 'BUSHING',
            'jenis_mesin' => 'Mesin MaK 8M 453 Tipe C (Major Overhaul)',
            'part_number' => '205230',
            'satuan' => 'Bh',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('materials', [
            'id' => $material->id,
            'jenis_mesin' => 'Mesin MaK 8M 453 Tipe C (Major Overhaul)',
            'part_number' => '205230',
        ]);
    }
}
