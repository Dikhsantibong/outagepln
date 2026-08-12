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
 * Laporan Kegiatan Harian dalam bentuk Excel.
 *
 * Yang diuji: uraian pekerjaan berpoin dan material berikut jumlahnya benar
 * sampai ke sel yang tepat — bukan sekadar responsnya 200.
 */
class LaporanHarianExcelTest extends TestCase
{
    use RefreshDatabase;

    private function planBerisi(): OutagePlan
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));

        $plan = OutagePlan::create([
            'mesin_pembangkit' => 'PLTD WUA-WUA #02 (MAK)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2026-08-08',
            'selesai' => '2026-08-09',
            'real_start' => '2026-08-08',
            'durasi' => 2,
        ]);

        $this->put("/outage-plans/{$plan->id}", [
            'mesin_pembangkit' => $plan->mesin_pembangkit,
            'scope' => $plan->scope,
            'jenis_pembangkit' => $plan->jenis_pembangkit,
            'start_date' => $plan->start_date,
            'selesai' => $plan->selesai,
            'daily_progress' => [
                // Hari pertama sengaja dibiarkan kosong, untuk menguji laporan
                // pada hari yang belum diisi.
                ['tanggal' => '2026-08-08'],
                [
                    'tanggal' => '2026-08-09',
                    'plan_progress' => '45',
                    'actual_progress' => '63.2',
                    'work_items' => [
                        ['uraian' => 'Pretest beban 1.700 kW', 'progress' => '40'],
                        ['uraian' => 'Pengukuran Defleksi Crankshaft', 'progress' => '75'],
                        // Baris kosong harus dibuang, tidak ikut tersimpan.
                        ['uraian' => '', 'progress' => ''],
                    ],
                    'spare_parts' => [
                        [
                            'nama' => 'Gasket cylinder head',
                            'part_number' => 'PN-9911',
                            'qty' => '2 Bh',
                            'keterangan' => 'Terpasang',
                        ],
                    ],
                    'new_photos' => [UploadedFile::fake()->image('dok.jpg', 800, 600)],
                ],
            ],
        ])->assertRedirect()->assertSessionHasNoErrors();

        return $plan->fresh();
    }

    public function test_poin_pekerjaan_dan_material_tersimpan_terstruktur(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();

        $hari = $plan->dailyProgresses()->where('tanggal', '2026-08-09')->first();

        $this->assertCount(2, $hari->work_items, 'Poin kosong harus dibuang.');
        $this->assertSame('Pretest beban 1.700 kW', $hari->work_items[0]['uraian']);
        $this->assertSame('40', $hari->work_items[0]['progress']);
        $this->assertSame('75', $hari->work_items[1]['progress']);

        $this->assertCount(1, $hari->spare_parts);
        $this->assertSame('Gasket cylinder head', $hari->spare_parts[0]['nama']);
        $this->assertSame('PN-9911', $hari->spare_parts[0]['part_number']);
        $this->assertSame('2 Bh', $hari->spare_parts[0]['qty']);
    }

    public function test_excel_laporan_harian_punya_tiga_lembar(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();

        $response = $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-08-09/excel");
        $response->assertOk();

        $path = tempnam(sys_get_temp_dir(), 'lap') . '.xlsx';
        file_put_contents($path, $response->streamedContent());
        $book = IOFactory::load($path);

        $this->assertSame(
            ['Laporan Harian', 'Dokumentasi', 'Kurva S'],
            $book->getSheetNames(),
        );

        $sheet = $book->getSheetByName('Laporan Harian');

        // Kop laporan.
        $this->assertSame(
            'LAPORAN KEGIATAN HARIAN SEMI OVERHAUL',
            $sheet->getCell('A1')->getValue(),
        );
        $this->assertSame('PLTD WUA-WUA #02 (MAK)', $sheet->getCell('A2')->getValue());
        $this->assertSame(': 2', $sheet->getCell('B5')->getValue());
        $this->assertSame(': 9 AGUSTUS 2026', $sheet->getCell('B6')->getValue());

        // Poin pekerjaan bernomor, progres sebagai angka agar bisa dihitung.
        $this->assertSame('URAIAN PEKERJAAN', $sheet->getCell('A8')->getValue());
        $this->assertSame('NO.', $sheet->getCell('A9')->getValue());
        $this->assertSame(1, $sheet->getCell('A10')->getValue());
        $this->assertSame('Pretest beban 1.700 kW', $sheet->getCell('B10')->getValue());
        $this->assertSame(40.0, $sheet->getCell('D10')->getValue());
        $this->assertSame('Pengukuran Defleksi Crankshaft', $sheet->getCell('B11')->getValue());
        $this->assertSame(75.0, $sheet->getCell('D11')->getValue());

        unlink($path);
    }

    public function test_lembar_material_memuat_qty(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();

        $response = $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-08-09/excel");
        $path = tempnam(sys_get_temp_dir(), 'lap') . '.xlsx';
        file_put_contents($path, $response->streamedContent());
        $sheet = IOFactory::load($path)->getSheetByName('Laporan Harian');

        // Blok spare part berada di bawah blok pekerjaan; dicari agar test
        // tidak patah saat jumlah poin pekerjaannya berubah.
        $baris = null;
        for ($r = 1; $r <= 60; $r++) {
            if ($sheet->getCell("A{$r}")->getValue() === 'SPARE PART YANG DIGANTI') {
                $baris = $r;
                break;
            }
        }

        $this->assertNotNull($baris, 'Blok spare part tidak ditemukan.');
        $this->assertSame('QTY', $sheet->getCell('D' . ($baris + 1))->getValue());
        $this->assertSame('Gasket cylinder head', $sheet->getCell('B' . ($baris + 2))->getValue());
        $this->assertSame('PN-9911', $sheet->getCell('C' . ($baris + 2))->getValue());
        $this->assertSame('2 Bh', $sheet->getCell('D' . ($baris + 2))->getValue());

        unlink($path);
    }

    public function test_lembar_dokumentasi_memuat_foto(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();

        $response = $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-08-09/excel");
        $path = tempnam(sys_get_temp_dir(), 'lap') . '.xlsx';
        file_put_contents($path, $response->streamedContent());
        $book = IOFactory::load($path);

        $this->assertCount(1, $book->getSheetByName('Dokumentasi')->getDrawingCollection());
        // Kurva S memuat grafiknya.
        $this->assertCount(1, $book->getSheetByName('Kurva S')->getDrawingCollection());

        unlink($path);
    }

    public function test_excel_tetap_jalan_saat_hari_belum_diisi(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();

        // Hari pertama sengaja tidak diisi apa pun.
        $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-08-08/excel")
            ->assertOk();
    }

    public function test_pengelola_merek_lain_ditolak(): void
    {
        Storage::fake('public');
        $plan = $this->planBerisi();

        $this->actingAs(User::factory()->create(['role' => 'pengelola', 'merek' => 'CUMMINS']));

        $this->get("/outage-plans/{$plan->id}/laporan-harian/2026-08-09/excel")
            ->assertForbidden();
    }
}
