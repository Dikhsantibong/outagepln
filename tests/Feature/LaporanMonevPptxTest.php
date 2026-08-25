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

    /** Kedua logo tertanam di arsip dan dirujuk dari tiap slide. */
    public function test_logo_tertanam_dan_dirujuk_tiap_slide(): void
    {
        $this->rencana();
        $this->admin();

        $isi = $this->isiPptx($this->unduh());

        $this->assertArrayHasKey('ppt/media/image1.png', $isi, 'Logo Danantara tidak tertanam.');
        $this->assertArrayHasKey('ppt/media/image2.png', $isi, 'Logo PLN tidak tertanam.');

        // Berkasnya harus PNG sungguhan, bukan berkas kosong.
        $this->assertSame("\x89PNG", substr((string) $isi['ppt/media/image1.png'], 0, 4));
        $this->assertSame("\x89PNG", substr((string) $isi['ppt/media/image2.png'], 0, 4));

        $rels = (string) $isi['ppt/slides/_rels/slide1.xml.rels'];
        $this->assertStringContainsString('../media/image1.png', $rels);
        $this->assertStringContainsString('../media/image2.png', $rels);

        // Slide benar-benar memakainya lewat p:pic.
        $this->assertStringContainsString('<p:pic>', (string) $isi['ppt/slides/slide2.xml']);
    }

    /** Laporan harus dominan visual: donat, cincin progres, batang, dan kurva. */
    public function test_berisi_grafik_bukan_hanya_tabel(): void
    {
        // Status sengaja dibuat beragam: donat baru menghasilkan irisan pie bila
        // ada lebih dari satu status — satu status penuh digambar lingkaran utuh.
        $plan = $this->rencana(['progress' => 100]);
        $this->rencana(['mesin_pembangkit' => 'PLTD RAHA #01 (CUMMINS)', 'progress' => 40, 'selesai' => '2099-01-01']);
        $this->rencana(['mesin_pembangkit' => 'PLTD RAHA #02 (CUMMINS)', 'progress' => 0, 'selesai' => '2099-01-01']);

        $plan->dailyProgresses()->create([
            'tanggal' => '2026-07-01',
            'plan_progress' => 20,
            'actual_progress' => 15,
        ]);
        $plan->dailyProgresses()->create([
            'tanggal' => '2026-08-01',
            'plan_progress' => 60,
            'actual_progress' => 55,
        ]);

        $this->admin();
        $semua = implode('', array_values($this->isiPptx($this->unduh())));

        // Donat dan pie chart.
        $this->assertStringContainsString('prst="pie"', $semua);
        // Cincin progres.
        $this->assertStringContainsString('prst="blockArc"', $semua);
        // Kurva S digambar sebagai custGeom.
        $this->assertStringContainsString('<a:custGeom>', $semua);
        // Kartu KPI memakai roundRect.
        $this->assertStringContainsString('prst="roundRect"', $semua);
        // Kotak Key Insight.
        $this->assertStringContainsString('KEY INSIGHT', $semua);
    }

    /** Kurva S memakai bulan dari progres harian nyata, bukan data karangan. */
    public function test_kurva_s_memakai_bulan_dari_progres_harian(): void
    {
        $plan = $this->rencana();
        $plan->dailyProgresses()->create([
            'tanggal' => '2026-07-10',
            'plan_progress' => 30,
            'actual_progress' => 25,
        ]);
        $plan->dailyProgresses()->create([
            'tanggal' => '2026-08-10',
            'plan_progress' => 80,
            'actual_progress' => 70,
        ]);

        $sc = (new LaporanMonev(null, null))->data()['s_curve'];

        $this->assertSame(['Jul 26', 'Agu 26'], $sc['labels']);
        $this->assertSame([30.0, 80.0], $sc['planned']);
        $this->assertSame([25.0, 70.0], $sc['actual']);
        $this->assertSame(70.0, $sc['current']);
        $this->assertSame(80.0, $sc['target']);
        $this->assertSame(-10.0, $sc['variance']);
    }

    /** Tanpa progres harian, kurva S dinyatakan kosong — tidak diisi angka palsu. */
    public function test_kurva_s_kosong_saat_belum_ada_progres_harian(): void
    {
        $this->rencana();

        $sc = (new LaporanMonev(null, null))->data()['s_curve'];

        $this->assertSame([], $sc['labels']);
        $this->assertNull($sc['current']);
        $this->assertSame(LaporanMonev::BELUM_ADA, $sc['keterangan']);
    }

    /** Key insight disusun dari angka yang benar-benar ada. */
    public function test_insight_diturunkan_dari_data_nyata(): void
    {
        $this->rencana(['progress' => 100]);
        $this->rencana(['mesin_pembangkit' => 'PLTD RAHA #01 (CUMMINS)', 'progress' => 40, 'selesai' => '2099-01-01']);

        $insight = (new LaporanMonev(null, null))->data()['insight'];

        $this->assertStringContainsString('1 dari 2 pekerjaan selesai', $insight['ringkasan'][0]);
        $this->assertStringContainsString('50%', $insight['ringkasan'][0]);
        $this->assertStringContainsString('1 pekerjaan sedang berjalan', $insight['ringkasan'][1]);
    }

    /** Tiap slide punya kaki halaman bernomor dan identitas unit. */
    public function test_tiap_slide_punya_kaki_halaman(): void
    {
        $this->rencana();
        $this->admin();

        $isi = $this->isiPptx($this->unduh());

        // Slide 2 dan seterusnya memakai kepala/kaki; sampul dikecualikan.
        $this->assertStringContainsString('Slide 2', (string) $isi['ppt/slides/slide2.xml']);
        $this->assertStringContainsString('Executive Dashboard', (string) $isi['ppt/slides/slide2.xml']);
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
