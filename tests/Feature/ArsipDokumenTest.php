<?php

namespace Tests\Feature;

use App\Models\ArsipDokumen;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Arsip kontrak dan hasil pekerjaan overhaul.
 *
 * Yang diuji: hanya admin dan super admin yang bisa masuk, berkasnya tersimpan
 * di disk privat (bukan public/storage), serta pratinjau dan unduhan memakai
 * Content-Disposition yang benar.
 */
class ArsipDokumenTest extends TestCase
{
    use RefreshDatabase;

    private function admin(string $role = 'admin'): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function unggah(string $nama = 'kontrak.pdf'): ArsipDokumen
    {
        Storage::fake('local');

        $this->actingAs($this->admin());

        $this->post('/arsip', [
            'judul' => 'Kontrak Overhaul PLTD Poasia',
            'kategori' => 'kontrak',
            'keterangan' => 'Kontrak tahap awal',
            'berkas' => UploadedFile::fake()->create($nama, 40, 'application/pdf'),
        ])->assertRedirect();

        return ArsipDokumen::firstOrFail();
    }

    /** @return array<string, array{0: string, 1: bool}> */
    public static function peranProvider(): array
    {
        return [
            'super admin boleh' => ['super_admin', true],
            'admin boleh' => ['admin', true],
            'pengelola ditolak' => ['pengelola', false],
            'tamu ditolak' => ['tamu', false],
        ];
    }

    #[DataProvider('peranProvider')]
    public function test_menu_arsip_hanya_untuk_admin_dan_super_admin(
        string $role,
        bool $boleh,
    ): void {
        $this->actingAs(User::factory()->create(['role' => $role]));

        $response = $this->get('/arsip');

        $boleh ? $response->assertOk() : $response->assertForbidden();
    }

    public function test_tamu_tidak_bisa_mengunggah_dokumen(): void
    {
        Storage::fake('local');

        $this->actingAs(User::factory()->create(['role' => 'tamu']));

        $this->post('/arsip', [
            'judul' => 'Selundupan',
            'kategori' => 'kontrak',
            'berkas' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf'),
        ])->assertForbidden();

        $this->assertSame(0, ArsipDokumen::count());
    }

    public function test_dokumen_tersimpan_di_disk_privat_bukan_public(): void
    {
        $dokumen = $this->unggah();

        Storage::disk('local')->assertExists($dokumen->path);
        $this->assertStringStartsWith('arsip-dokumen/', $dokumen->path);

        // Nama di disk diacak; nama aslinya disimpan terpisah.
        $this->assertSame('kontrak.pdf', $dokumen->nama_asli);
        $this->assertStringNotContainsString('kontrak.pdf', $dokumen->path);
    }

    public function test_pengunggah_tercatat_pada_arsipnya(): void
    {
        $dokumen = $this->unggah();

        $this->assertNotNull($dokumen->user_id);
        $this->assertNotSame('', $dokumen->pengunggah);
        $this->assertSame('Kontrak Overhaul', $dokumen->labelKategori());
    }

    public function test_kategori_di_luar_daftar_ditolak(): void
    {
        Storage::fake('local');
        $this->actingAs($this->admin());

        $this->post('/arsip', [
            'judul' => 'Dokumen',
            'kategori' => 'entah-apa',
            'berkas' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf'),
        ])->assertSessionHasErrors('kategori');

        $this->assertSame(0, ArsipDokumen::count());
    }

    public function test_format_berkas_yang_tidak_diizinkan_ditolak(): void
    {
        Storage::fake('local');
        $this->actingAs($this->admin());

        $this->post('/arsip', [
            'judul' => 'Skrip',
            'kategori' => 'kontrak',
            'berkas' => UploadedFile::fake()->create('jahat.exe', 10),
        ])->assertSessionHasErrors('berkas');

        $this->assertSame(0, ArsipDokumen::count());
    }

    public function test_pratinjau_disajikan_inline(): void
    {
        $dokumen = $this->unggah();

        $this->get("/arsip/{$dokumen->id}/preview")
            ->assertOk()
            ->assertHeader('Content-Disposition', 'inline; filename="kontrak.pdf"');
    }

    public function test_unduhan_memakai_nama_asli_berkas(): void
    {
        $dokumen = $this->unggah();

        $this->get("/arsip/{$dokumen->id}/download")
            ->assertOk()
            ->assertHeader('Content-Disposition', 'attachment; filename="kontrak.pdf"');
    }

    /** Berkas arsip tidak boleh terbuka untuk akun tanpa hak, sekalipun id-nya ditebak. */
    public function test_pengelola_tidak_bisa_membuka_berkas_arsip(): void
    {
        $dokumen = $this->unggah();

        $this->actingAs(User::factory()->create(['role' => 'pengelola']));

        $this->get("/arsip/{$dokumen->id}/preview")->assertForbidden();
        $this->get("/arsip/{$dokumen->id}/download")->assertForbidden();
    }

    public function test_judul_dan_keterangan_bisa_diubah_tanpa_mengganti_berkas(): void
    {
        $dokumen = $this->unggah();
        $pathAwal = $dokumen->path;

        $this->put("/arsip/{$dokumen->id}", [
            'judul' => 'Kontrak Overhaul (Revisi)',
            'kategori' => 'hasil',
            'keterangan' => 'Sudah ditandatangani',
        ])->assertRedirect();

        $segar = $dokumen->fresh();

        $this->assertSame('Kontrak Overhaul (Revisi)', $segar->judul);
        $this->assertSame('hasil', $segar->kategori);
        $this->assertSame($pathAwal, $segar->path);
        Storage::disk('local')->assertExists($pathAwal);
    }

    public function test_menghapus_arsip_ikut_membuang_berkasnya(): void
    {
        $dokumen = $this->unggah();

        $this->delete("/arsip/{$dokumen->id}")->assertRedirect();

        $this->assertSame(0, ArsipDokumen::count());
        Storage::disk('local')->assertMissing($dokumen->path);
    }

    public function test_berkas_office_ditandai_tidak_bisa_dipratinjau(): void
    {
        Storage::fake('local');
        $this->actingAs($this->admin());

        $this->post('/arsip', [
            'judul' => 'Hasil Pekerjaan',
            'kategori' => 'hasil',
            'berkas' => UploadedFile::fake()->create(
                'hasil.docx',
                20,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ),
        ])->assertRedirect();

        $this->assertFalse(ArsipDokumen::firstOrFail()->bisaDipratinjau());
    }

    public function test_halaman_arsip_mengirim_daftar_dokumen_dan_kategori(): void
    {
        $this->unggah();

        $this->get('/arsip')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('arsip/index')
                ->has('dokumens', 1)
                ->where('dokumens.0.judul', 'Kontrak Overhaul PLTD Poasia')
                ->where('dokumens.0.bisa_dipratinjau', true)
                ->where('kategoriOptions.kontrak', 'Kontrak Overhaul')
                ->where('kategoriOptions.hasil', 'Hasil Pekerjaan Overhaul')
            );
    }
}
