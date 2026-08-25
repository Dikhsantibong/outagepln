<?php

namespace Tests\Feature;

use App\Models\KinerjaQuality;
use App\Models\OutagePlan;
use App\Models\User;
use App\Support\LaporanMonev;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use ZipArchive;

/**
 * Halaman Summary dan berkas Laporan MONEV (HARDIK) berformat PPTX lanskap.
 *
 * Berkasnya disusun sendiri sebagai OOXML di dalam ZIP — aplikasi ini tidak
 * memasang pustaka presentasi — jadi keabsahan arsipnya ikut diuji, bukan hanya
 * status responsnya.
 */
class LaporanMonevPptxTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        return $user;
    }

    private function rencana(array $ubah = []): OutagePlan
    {
        return OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #05 (MIRRLEES)',
            'scope' => 'MO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => '2026-07-01',
            'selesai' => '2026-07-10',
            'real_start' => '2026-07-01',
            'durasi' => 10,
            'progress' => 100,
            ...$ubah,
        ]);
    }

    /** Isi berkas PPTX sebagai peta nama berkas → isinya. */
    private function isiPptx(string $biner): array
    {
        $tmp = tempnam(sys_get_temp_dir(), 'uji').'.pptx';
        file_put_contents($tmp, $biner);

        $zip = new ZipArchive;
        $this->assertTrue($zip->open($tmp) === true, 'Berkas PPTX tidak dapat dibuka sebagai ZIP.');

        $isi = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $nama = $zip->getNameIndex($i);
            $isi[$nama] = $zip->getFromIndex($i);
        }

        $zip->close();
        @unlink($tmp);

        return $isi;
    }

    private function unduh(): string
    {
        $response = $this->get('/summary/export-pptx');
        $response->assertOk();

        return $response->streamedContent();
    }

    public function test_halaman_summary_terbuka_dengan_data_laporan(): void
    {
        $this->rencana();
        $this->admin();

        $this->get('/summary')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('summary/index')
                ->has('laporan.identity')
                ->has('kesiapan', 14)
                ->where('laporan.summary.total_prk', 1)
            );
    }

    public function test_berkas_pptx_terunduh_dengan_tipe_yang_benar(): void
    {
        $this->rencana();
        $this->admin();

        $this->get('/summary/export-pptx')
            ->assertOk()
            ->assertHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            );
    }

    /** Berkasnya harus benar-benar arsip PPTX yang lengkap, bukan sekadar byte. */
    public function test_berkas_adalah_arsip_pptx_yang_sah(): void
    {
        $this->rencana();
        $this->admin();

        $isi = $this->isiPptx($this->unduh());

        foreach ([
            '[Content_Types].xml',
            '_rels/.rels',
            'ppt/presentation.xml',
            'ppt/_rels/presentation.xml.rels',
            'ppt/slideMasters/slideMaster1.xml',
            'ppt/slideLayouts/slideLayout1.xml',
            'ppt/theme/theme1.xml',
            'ppt/slides/slide1.xml',
            'docProps/core.xml',
        ] as $berkas) {
            $this->assertArrayHasKey($berkas, $isi, "Bagian {$berkas} tidak ada di dalam PPTX.");
        }
    }

    /** Tiap slide harus XML yang sah, kalau tidak PowerPoint menolak berkasnya. */
    public function test_seluruh_slide_berisi_xml_yang_sah(): void
    {
        $this->rencana();
        $this->admin();

        $isi = $this->isiPptx($this->unduh());
        $slide = array_filter(
            array_keys($isi),
            fn ($n) => str_starts_with($n, 'ppt/slides/slide') && str_ends_with($n, '.xml'),
        );

        $this->assertGreaterThanOrEqual(10, count($slide), 'Slide laporan kurang dari yang diharapkan.');

        foreach ($isi as $nama => $xml) {
            if (! str_ends_with($nama, '.xml')) {
                continue;
            }

            $this->assertNotFalse(
                simplexml_load_string($xml),
                "Bagian {$nama} bukan XML yang sah.",
            );
        }
    }

    /** Ukuran slide harus lanskap: lebar lebih besar daripada tingginya. */
    public function test_ukuran_slide_lanskap(): void
    {
        $this->rencana();
        $this->admin();

        $isi = $this->isiPptx($this->unduh());

        $this->assertMatchesRegularExpression(
            '/<p:sldSz cx="12192000" cy="6858000"\/>/',
            $isi['ppt/presentation.xml'],
        );
    }

    /** Tiap slide terdaftar di presentation.xml beserta relasinya. */
    public function test_tiap_slide_terdaftar_dan_punya_relasi(): void
    {
        $this->rencana();
        $this->admin();

        $isi = $this->isiPptx($this->unduh());
        $jumlah = count(array_filter(
            array_keys($isi),
            fn ($n) => preg_match('#^ppt/slides/slide\d+\.xml$#', $n) === 1,
        ));

        $this->assertSame($jumlah, substr_count($isi['ppt/presentation.xml'], '<p:sldId '));
        $this->assertSame(
            $jumlah,
            substr_count($isi['ppt/_rels/presentation.xml.rels'], 'relationships/slide"'),
        );

        for ($i = 1; $i <= $jumlah; $i++) {
            $this->assertArrayHasKey("ppt/slides/_rels/slide{$i}.xml.rels", $isi);
        }
    }

    /**
     * Parameter yang belum ada sumbernya harus tercetak sebagai penanda, bukan
     * dibiarkan kosong atau diisi angka tebakan.
     */
    public function test_parameter_yang_belum_ada_ditandai_di_berkas(): void
    {
        $this->rencana();
        $this->admin();

        $isi = $this->isiPptx($this->unduh());
        $semua = implode('', array_values($isi));

        $this->assertStringContainsString(LaporanMonev::TIDAK_TERSEDIA, $semua);
        $this->assertStringContainsString(LaporanMonev::DALAM_PENGEMBANGAN, $semua);
        $this->assertStringContainsString('masih dalam pengembangan', $semua);
    }

    /** SFC dan daya mampu dihitung dari data On Quality yang sudah ada. */
    public function test_perbaikan_sfc_dan_daya_mampu_dihitung(): void
    {
        $plan = $this->rencana();

        KinerjaQuality::create([
            'outage_plan_id' => $plan->id,
            'sfc_sebelum' => 100,
            'sfc_sesudah' => 80,   // turun 20% → membaik
            'dm_sebelum' => 50,
            'dm_sesudah' => 60,    // naik 20% → membaik
        ]);

        $data = (new LaporanMonev(null, null))->data();

        $this->assertSame(20.0, $data['performance']['average_sfc_improvement']);
        $this->assertSame(20.0, $data['performance']['average_dmp_improvement']);
        $this->assertSame(-20.0, $data['performance']['rows'][0]['sfc_difference'] * -1);
        $this->assertSame(10.0, $data['performance']['rows'][0]['dmp_difference']);
    }

    /** Status pekerjaan mengikuti daftar tertutup pada format laporan. */
    public function test_status_pekerjaan_dipetakan_sesuai_format(): void
    {
        $this->rencana(['progress' => 100]);
        $this->rencana(['mesin_pembangkit' => 'PLTD RAHA #01 (CUMMINS)', 'progress' => 40, 'selesai' => '2099-01-01']);
        $this->rencana(['mesin_pembangkit' => 'PLTD RAHA #02 (CUMMINS)', 'progress' => 0, 'selesai' => '2099-01-01']);
        // Lewat rencana selesai tapi belum 100% → NOT_FINISH.
        $this->rencana(['mesin_pembangkit' => 'PLTD RAHA #03 (CUMMINS)', 'progress' => 60, 'selesai' => '2020-01-01']);

        $s = (new LaporanMonev(null, null))->data()['summary'];

        $this->assertSame(4, $s['total_prk']);
        $this->assertSame(1, $s['finished']);
        $this->assertSame(1, $s['on_progress']);
        $this->assertSame(1, $s['not_started']);
        $this->assertSame(1, $s['not_finished']);
    }

    /** Site diturunkan dari nama mesin, sama dengan pemisahan unit di aplikasi. */
    public function test_ringkasan_per_site_dan_jenis_pembangkit(): void
    {
        $this->rencana();
        $this->rencana(['mesin_pembangkit' => 'PLTD RAHA #01 (CUMMINS)']);
        $this->rencana(['mesin_pembangkit' => 'PLTM WINNING #01', 'jenis_pembangkit' => 'PLTM']);

        $data = (new LaporanMonev(null, null))->data();

        $site = collect($data['sites'])->pluck('planned', 'site_name');
        $this->assertSame(1, $site['PLTD POASIA']);
        $this->assertSame(1, $site['PLTD RAHA']);
        $this->assertSame(1, $site['PLTM WINNING']);

        $jenis = collect($data['plants'])->pluck('planned', 'plant_type');
        $this->assertSame(2, $jenis['PLTD']);
        $this->assertSame(1, $jenis['PLTM']);
    }

    /** Laporan tanpa satu pun rencana tetap menghasilkan berkas yang sah. */
    public function test_laporan_kosong_tetap_menghasilkan_berkas(): void
    {
        $this->admin();

        $isi = $this->isiPptx($this->unduh());

        $this->assertArrayHasKey('ppt/slides/slide1.xml', $isi);
        $this->assertStringContainsString(
            'Belum ada rencana outage',
            implode('', array_values($isi)),
        );
    }

    /** Pengelola hanya melihat mesin yang dikelolanya, termasuk di laporan ini. */
    public function test_laporan_menghormati_hak_akses_pengelola(): void
    {
        $this->rencana();
        $this->rencana(['mesin_pembangkit' => 'PLTD RAHA #01 (CUMMINS)']);

        $pengelola = User::factory()->create([
            'role' => 'pengelola',
            'merek' => 'MIRRLEES',
        ]);

        $data = (new LaporanMonev(null, $pengelola))->data();

        $this->assertSame(1, $data['summary']['total_prk']);
        $this->assertSame('PLTD POASIA', $data['sites'][0]['site_name']);
    }
}
