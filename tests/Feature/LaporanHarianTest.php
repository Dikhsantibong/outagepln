<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use App\Support\LaporanHarianData;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Laporan Kegiatan Harian mengikuti formulir yang dipakai di lapangan.
 *
 * Sebagian besar keterangannya belum punya kolom di basis data, jadi yang
 * diuji di sini: bagian yang datanya ada memang terisi, dan bagian yang belum
 * ada tampil kosong dengan penanda — bukan terisi tebakan.
 */
class LaporanHarianTest extends TestCase
{
    use RefreshDatabase;

    private function plan(): OutagePlan
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $plan = OutagePlan::create([
            'mesin_pembangkit' => 'PLTD WUA-WUA #02 (MAK)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2026-08-01',
            'selesai' => '2026-08-14',
            'real_start' => '2026-08-01',
            'durasi' => 14,
        ]);

        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'scope' => $plan->scope,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
            'daily_progress' => [
                ['tanggal' => '2026-08-08', 'plan_progress' => '45', 'actual_progress' => '52.4'],
                [
                    'tanggal' => '2026-08-09',
                    'plan_progress' => '45',
                    'actual_progress' => '63.2',
                    'material_nama' => 'Gasket cylinder head',
                    'material_part_number' => 'PN-9911',
                    'uraian_pekerjaan' => "CLEANING\nMembersihkan Radiator",
                    'keterangan' => 'Terpasang',
                    'new_photos' => [UploadedFile::fake()->image('dok.jpg', 800, 600)],
                ],
            ],
        ])->assertRedirect()->assertSessionHasNoErrors();

        return $plan->fresh();
    }

    public function test_laporan_harian_terbentuk_untuk_tanggal_tertentu(): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $response = $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-08-09/pdf");

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
        $this->assertStringContainsString('hari-2', $response->headers->get('content-disposition'));
    }

    public function test_tanggal_di_luar_data_menghasilkan_404(): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-01-01/pdf")->assertNotFound();
    }

    public function test_pengelola_lain_tidak_bisa_membuka_laporan(): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $this->actingAs(User::factory()->create(['role' => 'pengelola', 'merek' => 'CUMMINS']));

        $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-08-09/pdf")->assertForbidden();
    }

    /**
     * PDF laporan menggabungkan halaman portrait (kegiatan + dokumentasi) dan
     * landscape (kurva S) dalam satu berkas lewat FPDI. dompdf sendiri hanya
     * mengenal satu ukuran halaman per dokumen, jadi keduanya dirender terpisah
     * lalu disatukan.
     */
    public function test_pdf_menggabungkan_portrait_dan_landscape(): void
    {
        Storage::fake('public');
        $plan = $this->plan();

        $isi = $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-08-09/pdf")
            ->assertOk()
            ->getContent();

        $this->assertStringStartsWith('%PDF', $isi);

        preg_match_all(
            '/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/',
            $isi,
            $kotak,
            PREG_SET_ORDER,
        );

        $adaPortrait = false;
        $adaLandscape = false;

        foreach ($kotak as $mb) {
            if ((float) $mb[1] > (float) $mb[2]) {
                $adaLandscape = true;
            } else {
                $adaPortrait = true;
            }
        }

        $this->assertTrue($adaPortrait, 'Halaman kegiatan (portrait) harus ada.');
        $this->assertTrue($adaLandscape, 'Lembar kurva S (landscape) harus ikut tergabung.');
    }

    /** Isi HTML diperiksa langsung supaya nilainya bisa dibaca sebagai teks. */
    public function test_isi_laporan_memakai_data_yang_ada(): void
    {
        Storage::fake('public');
        $plan = $this->plan();
        $plan->load('dailyProgresses');

        $hari = $plan->dailyProgresses->firstWhere('tanggal.timestamp', strtotime('2026-08-09'))
            ?? $plan->dailyProgresses[1];

        $data = new LaporanHarianData($plan, $hari, 2);

        $html = view('exports.laporan-harian', [
            'info' => $data->info(),
            'hari' => $data->hari(),
            'pekerjaan' => $data->pekerjaan(),
            'spareParts' => $data->spareParts(),
            'dokumentasi' => $data->dokumentasi(),
            'ttd' => $data->ttd(),
            'logoPln' => null,
            'logoVendor' => null,
            'chartImage' => null,
        ])->render();

        // Scope diterjemahkan ke nama panjang pada judul.
        $this->assertStringContainsString('LAPORAN KEGIATAN HARIAN SEMI OVERHAUL', $html);
        // Lokasi diturunkan dari nama mesin.
        $this->assertStringContainsString('ULPLTD WUA-WUA PLN NP UP KENDARI', $html);
        // Hari ke dan progres harian.
        $this->assertStringContainsString('PROGRESS HARI KE 2 : 63,20 %', $html);
        $this->assertStringContainsString('9 AGUSTUS 2026', $html);
        // Spare part memakai material yang tersimpan.
        $this->assertStringContainsString('Gasket cylinder head', $html);
        $this->assertStringContainsString('PN-9911', $html);
        // Foto tersemat sebagai data URI.
        $this->assertStringContainsString('src="data:image/', $html);
    }

    /** Kolom yang belum ada tampil kosong, bukan diisi tebakan. */
    public function test_bagian_tanpa_data_dibiarkan_kosong(): void
    {
        Storage::fake('public');
        $plan = $this->plan();
        $plan->load('dailyProgresses');

        $data = new LaporanHarianData($plan, $plan->dailyProgresses[1], 2);

        $this->assertSame([], $data->pekerjaan(), 'Item pekerjaan belum punya tabel.');
        $this->assertSame([], $data->wbs(), 'Bobot WBS belum punya tabel.');
        $this->assertSame('', $data->info()['tipe_mesin']);
        $this->assertSame('', $data->info()['nomor_seri']);
        $this->assertSame('', $data->kontrak()['do_nomor']);
        $this->assertSame('', $data->ttd()['nama_1']);

        // Yang bisa diturunkan dari nama mesin tetap terisi.
        $this->assertSame('WUA-WUA', $data->info()['ulpltd']);
        $this->assertSame('2', $data->info()['unit']);
    }

    public function test_daftar_kebutuhan_data_terdokumentasi(): void
    {
        // Penjaga: daftar ini yang dipakai memberi tahu pengguna apa yang
        // masih perlu dilengkapi, jadi tidak boleh kosong tanpa sadar.
        $this->assertNotEmpty(LaporanHarianData::KEBUTUHAN_DATA);
        $this->assertArrayHasKey(
            'Bobot pekerjaan / WBS (tabel baru, mis. outage_plan_wbs)',
            LaporanHarianData::KEBUTUHAN_DATA,
        );
    }
}
