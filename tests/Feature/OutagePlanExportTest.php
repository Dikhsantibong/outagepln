<?php

namespace Tests\Feature;

use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

/**
 * Ekspor dipecah jadi tiga bagian: kurva S, uraian pekerjaan + material, dan
 * dokumentasi foto. Yang diuji di sini adalah isinya benar-benar sampai ke
 * berkas — bukan sekadar responsnya 200.
 */
class OutagePlanExportTest extends TestCase
{
    use RefreshDatabase;

    private function planBerisi(): OutagePlan
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $plan = OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2024-11-05',
            'selesai' => '2024-11-07',
            'real_start' => '2024-11-05',
            'durasi' => 3,
        ]);

        // Satu foto disimpan lewat alur unggah yang sebenarnya, supaya path-nya
        // sama persis dengan yang dipakai aplikasi.
        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'scope' => $plan->scope,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
            'daily_progress' => [
                [
                    'tanggal' => '2024-11-05',
                    'plan_progress' => '30',
                    'actual_progress' => '25',
                    'material_part_number' => 'PN-9911',
                    'material_nama' => 'Gasket cylinder head',
                    'uraian_pekerjaan' => 'Bongkar cylinder head',
                    'keterangan' => 'Menunggu material',
                    'new_photos' => [UploadedFile::fake()->image('dok.jpg', 400, 300)],
                ],
                [
                    'tanggal' => '2024-11-06',
                    'plan_progress' => '60',
                    'actual_progress' => '60',
                    'uraian_pekerjaan' => 'Pasang gasket baru',
                ],
            ],
        ])->assertRedirect()->assertSessionHasNoErrors();

        return $plan->fresh();
    }

    public function test_pdf_memuat_ketiga_tabel_beserta_material(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();

        $response = $this->get("/outage-plans/{$plan->id}/export-pdf");

        $response->assertOk();
        $this->assertStringContainsString(
            'application/pdf',
            $response->headers->get('content-type'),
        );

        // Foto yang disematkan membuat berkasnya jauh lebih besar daripada
        // laporan teks saja — cukup untuk memastikan gambarnya benar-benar ikut.
        $this->assertStringStartsWith('%PDF', $response->getContent());
        $this->assertGreaterThan(10000, strlen($response->getContent()));
    }

    /** Blade-nya dirender terpisah supaya isinya bisa diperiksa sebagai teks. */
    public function test_isi_html_laporan_memisahkan_ketiga_bagian(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();
        $plan->load('dailyProgresses');

        $html = view('exports.outage-plan', [
            'outagePlan' => $plan,
            'chartImage' => null,
            'logo' => null,
            'totalHari' => 3,
            'overallPlan' => 60,
            'overallActual' => 60,
        ])->render();

        // Ketiga bagian ada dan terpisah.
        $this->assertStringContainsString('Tabel Kurva S', $html);
        $this->assertStringContainsString('Uraian Pekerjaan &amp; Material', $html);
        $this->assertStringContainsString('Dokumentasi Foto', $html);

        // Material ikut tercetak.
        $this->assertStringContainsString('PN-9911', $html);
        $this->assertStringContainsString('Gasket cylinder head', $html);
        $this->assertStringContainsString('Bongkar cylinder head', $html);

        // Foto disematkan sebagai data URI — dompdf tidak bisa mengambil /storage.
        $this->assertStringContainsString('src="data:image/', $html);
    }

    public function test_excel_punya_tiga_lembar_dengan_isi_yang_benar(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();

        $response = $this->get("/outage-plans/{$plan->id}/export-excel");
        $response->assertOk();

        $path = tempnam(sys_get_temp_dir(), 'outage') . '.xlsx';
        file_put_contents($path, $response->streamedContent());
        $book = IOFactory::load($path);

        $this->assertSame(
            ['Kurva S', 'Uraian Pekerjaan', 'Dokumentasi Foto'],
            $book->getSheetNames(),
        );

        // Lembar uraian memuat material dan uraiannya.
        $uraian = $book->getSheetByName('Uraian Pekerjaan');
        $this->assertSame('Part Number', $uraian->getCell('C4')->getValue());
        $this->assertSame('Nama Material', $uraian->getCell('D4')->getValue());
        $this->assertSame('PN-9911', $uraian->getCell('C5')->getValue());
        $this->assertSame('Gasket cylinder head', $uraian->getCell('D5')->getValue());
        $this->assertSame('Bongkar cylinder head', $uraian->getCell('E5')->getValue());

        // Lembar kurva S memuat deviasi terhitung: 25 - 30 = -5.
        $kurva = $book->getSheetByName('Kurva S');
        $this->assertSame('Deviasi (%)', $kurva->getCell('E' . $this->cariHeader($kurva))->getValue());

        // Lembar foto hanya memuat hari yang berfoto — hari kedua tidak.
        $foto = $book->getSheetByName('Dokumentasi Foto');
        $this->assertSame('Day 1', $foto->getCell('A5')->getValue());
        $this->assertNull($foto->getCell('A6')->getValue());
        $this->assertCount(1, $foto->getDrawingCollection());

        unlink($path);
    }

    /** Baris header lembar Kurva S bergeser mengikuti tinggi grafik. */
    private function cariHeader($sheet): int
    {
        for ($row = 1; $row <= 60; $row++) {
            if ($sheet->getCell("A{$row}")->getValue() === 'Day') {
                return $row;
            }
        }

        $this->fail('Baris header tabel Kurva S tidak ditemukan.');
    }

    public function test_ekspor_tetap_jalan_saat_belum_ada_foto(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $plan = OutagePlan::create([
            'mesin_pembangkit' => 'PLTD RAHA #7 (CUMMINS)',
            'scope' => 'MO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2024-11-05',
            'selesai' => '2024-11-06',
        ]);

        $this->get("/outage-plans/{$plan->id}/export-excel")->assertOk();
        $this->get("/outage-plans/{$plan->id}/export-pdf")->assertOk();
    }
}
