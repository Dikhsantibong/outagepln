<?php

namespace App\Exports;

use App\Support\LaporanMonev;
use App\Support\Pptx\Kanvas;
use RuntimeException;
use ZipArchive;

/**
 * Menulis Laporan MONEV sebagai dek PPTX lanskap bergaya korporat.
 *
 * Ditulis langsung sebagai OOXML di dalam ZIP, bukan lewat pustaka presentasi.
 * Aplikasi ini hanya memasang phpspreadsheet, dan menambah dependensi baru butuh
 * persetujuan lebih dulu — sementara sebuah .pptx pada dasarnya memang arsip ZIP
 * berisi XML, jadi seluruh berkasnya bisa disusun sendiri dengan ZipArchive.
 *
 * Susunannya mendahulukan visual: dasbor KPI, donat, cincin progres, kurva S,
 * batang, dan peringkat per site; tabel hanya dipakai pada lampiran rincian yang
 * memang menuntut bentuk tabular. Tidak ada angka atau grafik yang dikarang —
 * bagian tanpa sumber data ditandai apa adanya.
 *
 * Ukuran slide 12192000 x 6858000 EMU: 16:9 lanskap.
 */
class LaporanMonevPptx
{
    private const LEBAR = 12192000;

    private const TINGGI = 6858000;

    private const CM = Kanvas::CM;

    /** Margin kiri-kanan seluruh slide, dijaga seragam. */
    private const MARGIN = self::CM * 1.1;

    /** @var array<int, string> */
    private array $slides = [];

    private Kanvas $k;

    /** @var array<string, array{path: string, rId: string, target: string}> */
    private array $media = [];

    public function __construct(private readonly array $data)
    {
        $this->k = new Kanvas;
        $this->daftarkanLogo();
    }

    /**
     * Logo dipasang sebagai relasi yang sama di tiap slide, sehingga berkas
     * gambarnya hanya disimpan sekali di dalam arsip.
     */
    private function daftarkanLogo(): void
    {
        $kandidat = [
            'danantara' => public_path('danantara.png'),
            'pln' => public_path('sidebar-logo.png'),
        ];

        $nomor = 1;

        foreach ($kandidat as $nama => $path) {
            if (! is_file($path)) {
                continue;
            }

            $this->media[$nama] = [
                'path' => $path,
                'rId' => 'rId'.($nomor + 1), // rId1 sudah dipakai slideLayout
                'target' => 'image'.$nomor.'.png',
            ];
            $nomor++;
        }
    }

    public function render(): string
    {
        $this->bangunSlides();

        $berkas = tempnam(sys_get_temp_dir(), 'monev').'.pptx';
        $zip = new ZipArchive;

        if ($zip->open($berkas, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Tidak dapat membuat berkas presentasi.');
        }

        $zip->addFromString('[Content_Types].xml', $this->contentTypes());
        $zip->addFromString('_rels/.rels', $this->relsUtama());
        $zip->addFromString('docProps/core.xml', $this->docPropsCore());
        $zip->addFromString('docProps/app.xml', $this->docPropsApp());
        $zip->addFromString('ppt/presentation.xml', $this->presentation());
        $zip->addFromString('ppt/_rels/presentation.xml.rels', $this->presentationRels());
        $zip->addFromString('ppt/theme/theme1.xml', $this->theme());
        $zip->addFromString('ppt/slideMasters/slideMaster1.xml', $this->slideMaster());
        $zip->addFromString('ppt/slideMasters/_rels/slideMaster1.xml.rels', $this->slideMasterRels());
        $zip->addFromString('ppt/slideLayouts/slideLayout1.xml', $this->slideLayout());
        $zip->addFromString('ppt/slideLayouts/_rels/slideLayout1.xml.rels', $this->slideLayoutRels());

        foreach ($this->media as $m) {
            $zip->addFromString('ppt/media/'.$m['target'], (string) file_get_contents($m['path']));
        }

        foreach ($this->slides as $i => $xml) {
            $nomor = $i + 1;
            $zip->addFromString("ppt/slides/slide{$nomor}.xml", $xml);
            $zip->addFromString("ppt/slides/_rels/slide{$nomor}.xml.rels", $this->slideRels());
        }

        $zip->close();

        $isi = (string) file_get_contents($berkas);
        @unlink($berkas);

        return $isi;
    }

    // ------------------------------------------------------- Susunan dek

    private function bangunSlides(): void
    {
        $d = $this->data;

        $this->slideSampul($d['identity']);
        $this->slideDasbor($d);
        $this->slideKurvaS($d['s_curve'], $d['insight']);
        $this->slideProgressOh($d);
        $this->slideJenisPembangkit($d['plants']);
        $this->slidePerSite($d['sites'], $d['insight']);
        $this->slideStatusPekerjaan($d['summary'], $d['exceptions']);
        $this->slideKontrakPembayaran($d['budget'], $d['contract'], $d['payment'], $d['carry_over']);
        $this->slideSfc($d['performance']);
        $this->slideDmp($d['performance']);
        $this->slideDampakOh($d['performance'], $d['insight']);
        $this->slideException($d['exceptions']);
        $this->slideBelumSelesai($d['belum_terlaksana']);
        $this->slideKesimpulan($d['kpi'], $d['conclusion'], $d['insight']);
        $this->slideLampiran($d['maintenance']);
    }

    // ------------------------------------------------------------- Slide

    /** @param array<string, string> $id */
    private function slideSampul(array $id): void
    {
        $isi = $this->k->bentuk('rect', 0, 0, self::LEBAR, self::TINGGI, ['isi' => Kanvas::NAVY]);
        $isi .= $this->k->bentuk('rect', 0, self::TINGGI * 0.62, self::LEBAR, self::CM * 0.12, [
            'isi' => Kanvas::BIRU_MUDA,
        ]);

        $isi .= $this->logoSampul();

        $isi .= $this->k->teks('LAPORAN MONITORING & EVALUASI', self::MARGIN, self::CM * 5.6, self::LEBAR - self::MARGIN * 2, self::CM * 0.8, [
            'ukuran' => 1200, 'tebal' => true, 'warna' => '93C5FD', 'rata' => 'l',
        ]);

        $isi .= $this->k->teks('Pemeliharaan Periodik (HARDIK)', self::MARGIN, self::CM * 6.4, self::LEBAR - self::MARGIN * 2, self::CM * 1.8, [
            'ukuran' => 3600, 'tebal' => true, 'warna' => Kanvas::PUTIH, 'rata' => 'l',
        ]);

        $isi .= $this->k->teks($id['unit'], self::MARGIN, self::CM * 8.4, self::LEBAR - self::MARGIN * 2, self::CM * 0.8, [
            'ukuran' => 1400, 'warna' => 'BFDBFE', 'rata' => 'l',
        ]);

        $isi .= $this->k->teks(
            'Periode '.$id['period'].'   ·   '.$id['cakupan'].'   ·   '.$id['location'].', '.$id['date'],
            self::MARGIN,
            self::CM * 13.2,
            self::LEBAR - self::MARGIN * 2,
            self::CM * 0.7,
            ['ukuran' => 1000, 'warna' => '93C5FD', 'rata' => 'l'],
        );

        $isi .= $this->k->teks(
            'Dokumen ini dibangkitkan otomatis dari data aplikasi Outage Monitoring · fungsi masih dalam pengembangan',
            self::MARGIN,
            self::CM * 14.2,
            self::LEBAR - self::MARGIN * 2,
            self::CM * 0.6,
            ['ukuran' => 800, 'warna' => '60A5FA', 'rata' => 'l'],
        );

        $this->slides[] = $this->bungkusSlide($isi);
    }

    /** @param array<string, mixed> $d */
    private function slideDasbor(array $d): void
    {
        $s = $d['summary'];
        $kpi = $d['kpi'];

        $isi = $this->kepala('Executive Dashboard', 'Ringkasan kinerja pelaksanaan HARDIK pada periode berjalan');

        // --- Baris kartu KPI ---
        $lebar = (self::LEBAR - self::MARGIN * 2 - self::CM * 0.6 * 4) / 5;
        $kartu = [
            ['TOTAL RENCANA OH', (string) $s['total_prk'], 'pekerjaan', Kanvas::BIRU],
            ['SELESAI', (string) $s['finished'], 'FINISH', Kanvas::HIJAU],
            ['SEDANG BERJALAN', (string) $s['on_progress'], 'ON PROGRESS', Kanvas::AMBER],
            ['BELUM DIMULAI', (string) $s['not_started'], 'NOT STARTED', Kanvas::ABU],
            ['LEWAT JADWAL', (string) $s['not_finished'], 'NOT FINISH', Kanvas::MERAH],
        ];

        foreach ($kartu as $i => [$label, $nilai, $satuan, $warna]) {
            $isi .= $this->k->kartuKpi(
                self::MARGIN + $i * ($lebar + self::CM * 0.6),
                self::CM * 3.1,
                $lebar,
                self::CM * 2.3,
                $label,
                $nilai,
                $satuan,
                $warna,
            );
        }

        // --- Donat status + cincin progres + kartu finansial ---
        $isi .= $this->k->teks('Distribusi Status Pekerjaan', self::MARGIN, self::CM * 5.9, self::CM * 6, self::CM * 0.6, [
            'ukuran' => 1000, 'tebal' => true, 'rata' => 'l', 'warna' => Kanvas::NAVY,
        ]);

        $isi .= $this->k->donat(
            self::MARGIN + self::CM * 0.6,
            self::CM * 6.6,
            self::CM * 5.2,
            [
                ['label' => 'Finish', 'nilai' => (float) $s['finished'], 'warna' => Kanvas::HIJAU],
                ['label' => 'On Progress', 'nilai' => (float) $s['on_progress'], 'warna' => Kanvas::AMBER],
                ['label' => 'Not Started', 'nilai' => (float) $s['not_started'], 'warna' => Kanvas::ABU],
                ['label' => 'Not Finish', 'nilai' => (float) $s['not_finished'], 'warna' => Kanvas::MERAH],
            ],
            (string) $s['total_prk'],
            'pekerjaan',
        );

        $isi .= $this->legendaTegak(
            self::MARGIN + self::CM * 6.2,
            self::CM * 7.2,
            [
                ['Finish', (string) $s['finished'], Kanvas::HIJAU],
                ['On Progress', (string) $s['on_progress'], Kanvas::AMBER],
                ['Not Started', (string) $s['not_started'], Kanvas::ABU],
                ['Not Finish', (string) $s['not_finished'], Kanvas::MERAH],
            ],
        );

        $isi .= $this->k->teks('Overall Progress', self::CM * 13.4, self::CM * 5.9, self::CM * 5, self::CM * 0.6, [
            'ukuran' => 1000, 'tebal' => true, 'rata' => 'l', 'warna' => Kanvas::NAVY,
        ]);

        $isi .= $this->k->cincinProgres(
            self::CM * 13.8,
            self::CM * 6.6,
            self::CM * 5.2,
            (float) $kpi['overall_progress'],
            Kanvas::BIRU,
            'progres fisik rata-rata',
        );

        // Realisasi kontrak dan pembayaran belum punya sumber datanya; kartunya
        // tetap ditampilkan agar kerangka laporan utuh, tapi diberi penanda.
        $isi .= $this->kartuTertunda(self::CM * 20, self::CM * 6.3, self::CM * 6.4, self::CM * 1.5, 'CONTRACT REALIZATION');
        $isi .= $this->kartuTertunda(self::CM * 20, self::CM * 8.1, self::CM * 6.4, self::CM * 1.5, 'PAYMENT REALIZATION');
        $isi .= $this->kartuTertunda(self::CM * 20, self::CM * 9.9, self::CM * 6.4, self::CM * 1.5, 'TOTAL ANGGARAN & TERBAYAR');

        $isi .= $this->k->insight(self::MARGIN, self::CM * 12.4, self::LEBAR - self::MARGIN * 2, self::CM * 2.1, $d['insight']['ringkasan']);

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(2, 'Executive Dashboard'));
    }

    /**
     * @param  array<string, mixed>  $sc
     * @param  array<string, array<int, string>>  $insight
     */
    private function slideKurvaS(array $sc, array $insight): void
    {
        $isi = $this->kepala('S-Curve Progress', 'Perbandingan progres rencana dan realisasi per bulan pelaporan');

        if ($sc['labels'] === []) {
            $isi .= $this->kotakKosong(
                'Kurva S belum dapat digambar — '.LaporanMonev::BELUM_ADA
                .'. Kurva akan terbentuk sendiri begitu progres harian mulai dilaporkan.',
            );
        } else {
            $isi .= $this->k->kurva(
                self::MARGIN + self::CM * 1,
                self::CM * 3.4,
                self::LEBAR - self::MARGIN * 2 - self::CM * 7.4,
                self::CM * 8.4,
                $sc['labels'],
                [
                    ['label' => 'Rencana', 'warna' => Kanvas::BIRU, 'nilai' => $sc['planned']],
                    ['label' => 'Realisasi', 'warna' => Kanvas::MERAH, 'nilai' => $sc['actual']],
                ],
            );

            $x = self::LEBAR - self::MARGIN - self::CM * 6;
            $isi .= $this->k->kartuKpi($x, self::CM * 3.4, self::CM * 6, self::CM * 2, 'CURRENT PROGRESS',
                $this->persen($sc['current']), 'realisasi terakhir', Kanvas::MERAH);
            $isi .= $this->k->kartuKpi($x, self::CM * 5.7, self::CM * 6, self::CM * 2, 'TARGET PROGRESS',
                $this->persen($sc['target']), 'rencana pada titik sama', Kanvas::BIRU);
            $isi .= $this->k->kartuKpi($x, self::CM * 8, self::CM * 6, self::CM * 2, 'VARIANCE',
                $sc['variance'] === null ? LaporanMonev::BELUM_ADA : $this->bertanda($sc['variance']),
                'realisasi − rencana',
                ($sc['variance'] ?? 0) >= 0 ? Kanvas::HIJAU : Kanvas::MERAH);

            $isi .= $this->k->teks(
                'Forecast / projection '.strtolower(LaporanMonev::DALAM_PENGEMBANGAN).'.',
                $x,
                self::CM * 10.3,
                self::CM * 6,
                self::CM * 0.8,
                ['ukuran' => 750, 'rata' => 'l', 'warna' => Kanvas::AMBER],
            );
        }

        $isi .= $this->k->insight(self::MARGIN, self::CM * 12.4, self::LEBAR - self::MARGIN * 2, self::CM * 2.1, $insight['ringkasan']);

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(3, 'S-Curve Progress'));
    }

    /** @param array<string, mixed> $d */
    private function slideProgressOh(array $d): void
    {
        $s = $d['summary'];
        $sites = $d['sites'];

        $isi = $this->kepala('Progress OH', 'Komposisi status, capaian keseluruhan, dan sebaran per site');

        $isi .= $this->k->donat(
            self::MARGIN,
            self::CM * 3.6,
            self::CM * 4.6,
            [
                ['label' => 'Finish', 'nilai' => (float) $s['finished'], 'warna' => Kanvas::HIJAU],
                ['label' => 'On Progress', 'nilai' => (float) $s['on_progress'], 'warna' => Kanvas::AMBER],
                ['label' => 'Not Started', 'nilai' => (float) $s['not_started'], 'warna' => Kanvas::ABU],
                ['label' => 'Not Finish', 'nilai' => (float) $s['not_finished'], 'warna' => Kanvas::MERAH],
            ],
            (string) $s['total_prk'],
            'total OH',
        );

        $isi .= $this->k->cincinProgres(
            self::MARGIN + self::CM * 5.2,
            self::CM * 3.6,
            self::CM * 4.6,
            (float) $s['progress_fisik'],
            Kanvas::BIRU,
            'overall OH progress',
        );

        $isi .= $this->k->teks('Rencana vs Realisasi', self::CM * 11.4, self::CM * 3.1, self::CM * 8, self::CM * 0.6, [
            'ukuran' => 950, 'tebal' => true, 'rata' => 'l', 'warna' => Kanvas::NAVY,
        ]);

        $isi .= $this->k->batang(
            self::CM * 11.4,
            self::CM * 3.8,
            self::CM * 8,
            self::CM * 5,
            ['Rencana', 'Selesai', 'Berjalan', 'Belum'],
            [[
                'label' => 'Jumlah pekerjaan',
                'warna' => Kanvas::BIRU_MUDA,
                'nilai' => [
                    (float) $s['total_prk'],
                    (float) $s['finished'],
                    (float) $s['on_progress'],
                    (float) $s['not_started'],
                ],
            ]],
            'pekerjaan',
        );

        // Komposisi status per site — dibatasi agar tetap terbaca.
        $teratas = array_slice($sites, 0, 6);

        $isi .= $this->k->teks('Komposisi Status per Site', self::CM * 20.2, self::CM * 3.1, self::CM * 8.4, self::CM * 0.6, [
            'ukuran' => 950, 'tebal' => true, 'rata' => 'l', 'warna' => Kanvas::NAVY,
        ]);

        if ($teratas === []) {
            $isi .= $this->k->teks(LaporanMonev::BELUM_ADA, self::CM * 20.2, self::CM * 6, self::CM * 8.4, self::CM, [
                'ukuran' => 1000, 'warna' => Kanvas::AMBER,
            ]);
        } else {
            $isi .= $this->k->batangBertumpuk(
                self::CM * 20.2,
                self::CM * 3.8,
                self::CM * 8.4,
                self::CM * 5,
                array_map(fn ($s) => $this->pendek($s['site_name']), $teratas),
                [
                    ['label' => 'Finish', 'warna' => Kanvas::HIJAU, 'nilai' => array_column($teratas, 'realized')],
                    ['label' => 'On Progress', 'warna' => Kanvas::AMBER, 'nilai' => array_column($teratas, 'on_progress')],
                    ['label' => 'Not Started', 'warna' => Kanvas::ABU, 'nilai' => array_column($teratas, 'not_started')],
                ],
            );
        }

        $isi .= $this->k->insight(self::MARGIN, self::CM * 12.4, self::LEBAR - self::MARGIN * 2, self::CM * 2.1, $d['insight']['ringkasan']);

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(4, 'Progress OH'));
    }

    /** @param array<int, array<string, mixed>> $plants */
    private function slideJenisPembangkit(array $plants): void
    {
        $isi = $this->kepala('Progress per Jenis Pembangkit', 'Perbandingan capaian antar jenis pembangkit');

        if ($plants === []) {
            $isi .= $this->kotakKosong(LaporanMonev::BELUM_ADA.' untuk pengelompokan jenis pembangkit.');
            $this->slides[] = $this->bungkusSlide($isi.$this->kaki(5, 'Jenis Pembangkit'));

            return;
        }

        $nama = array_column($plants, 'plant_type');

        $isi .= $this->k->batang(
            self::MARGIN + self::CM * 0.6,
            self::CM * 3.4,
            self::LEBAR / 2 - self::MARGIN - self::CM * 1,
            self::CM * 8.4,
            $nama,
            [
                ['label' => 'Total', 'warna' => Kanvas::BIRU, 'nilai' => array_column($plants, 'planned')],
                ['label' => 'Finish', 'warna' => Kanvas::HIJAU, 'nilai' => array_column($plants, 'realized')],
                ['label' => 'On Progress', 'warna' => Kanvas::AMBER, 'nilai' => array_column($plants, 'on_progress')],
                ['label' => 'Belum', 'warna' => Kanvas::ABU, 'nilai' => array_column($plants, 'not_started')],
            ],
            'unit',
        );

        // Cincin progres tiap jenis, maksimal tiga agar tidak berdesakan.
        $x = self::LEBAR / 2 + self::CM * 0.4;
        foreach (array_slice($plants, 0, 3) as $i => $p) {
            $isi .= $this->k->cincinProgres(
                $x + $i * self::CM * 4.6,
                self::CM * 4.4,
                self::CM * 4.2,
                (float) $p['progress'],
                [Kanvas::BIRU, Kanvas::HIJAU, Kanvas::AMBER][$i] ?? Kanvas::BIRU,
                $p['plant_type'],
            );
            $isi .= $this->k->teks(
                $p['realized'].' / '.$p['planned'].' unit selesai',
                $x + $i * self::CM * 4.6,
                self::CM * 8.9,
                self::CM * 4.2,
                self::CM * 0.6,
                ['ukuran' => 800, 'warna' => Kanvas::ABU_TUA],
            );
        }

        $poin = array_map(
            fn ($p) => $p['plant_type'].': '.$p['realized'].' dari '.$p['planned']
                .' unit selesai, progres '.$p['progress'].'%.',
            array_slice($plants, 0, 3),
        );

        $isi .= $this->k->insight(self::MARGIN, self::CM * 12.4, self::LEBAR - self::MARGIN * 2, self::CM * 2.1, $poin);

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(5, 'Jenis Pembangkit'));
    }

    /**
     * @param  array<int, array<string, mixed>>  $sites
     * @param  array<string, array<int, string>>  $insight
     */
    private function slidePerSite(array $sites, array $insight): void
    {
        $urut = collect($sites)->sortByDesc('progress')->values()->all();
        $potongan = $urut === [] ? [[]] : array_chunk($urut, 9);

        foreach ($potongan as $n => $bagian) {
            $judul = count($potongan) > 1
                ? 'Progress per Site ('.($n + 1).'/'.count($potongan).')'
                : 'Progress per Site';

            $isi = $this->kepala($judul, 'Peringkat capaian tiap site, dari tertinggi ke terendah');

            if ($bagian === []) {
                $isi .= $this->kotakKosong(LaporanMonev::BELUM_ADA.' untuk pengelompokan per site.');
            } else {
                $isi .= $this->k->batangHorizontal(
                    self::MARGIN,
                    self::CM * 3.3,
                    self::LEBAR - self::MARGIN * 2,
                    self::CM * 8.7,
                    array_map(fn ($s) => [
                        'label' => $s['site_name'],
                        'nilai' => (float) $s['progress'],
                        'warna' => $this->warnaStatus($s['status']),
                        'keterangan' => number_format((float) $s['progress'], 1, ',', '.').'%'
                            .'  ·  '.$s['realized'].'/'.$s['planned'].' selesai',
                    ], $bagian),
                );
            }

            $isi .= $this->k->insight(self::MARGIN, self::CM * 12.4, self::LEBAR - self::MARGIN * 2, self::CM * 2.1, $insight['site']);

            $this->slides[] = $this->bungkusSlide($isi.$this->kaki(6, 'Progress per Site'));
        }
    }

    /**
     * @param  array<string, mixed>  $s
     * @param  array<string, mixed>  $e
     */
    private function slideStatusPekerjaan(array $s, array $e): void
    {
        $isi = $this->kepala('Work Status Monitoring', 'Jumlah dan porsi tiap status pekerjaan');

        $total = max(1, (int) $s['total_prk']);
        $status = [
            ['FINISH', (int) $s['finished'], Kanvas::HIJAU],
            ['ON PROGRESS', (int) $s['on_progress'], Kanvas::AMBER],
            ['NOT STARTED', (int) $s['not_started'], Kanvas::ABU],
            ['NOT FINISH', (int) $s['not_finished'], Kanvas::MERAH],
        ];

        $lebar = (self::LEBAR - self::MARGIN * 2 - self::CM * 0.6 * 3) / 4;

        foreach ($status as $i => [$label, $nilai, $warna]) {
            $isi .= $this->k->kartuKpi(
                self::MARGIN + $i * ($lebar + self::CM * 0.6),
                self::CM * 3.1,
                $lebar,
                self::CM * 2.3,
                $label,
                (string) $nilai,
                round(($nilai / $total) * 100, 1).'% dari total',
                $warna,
            );
        }

        // Status yang belum punya sumber datanya, ditandai apa adanya.
        $tertunda = ['NOT CONTRACTED', 'POSTPONED'];
        foreach ($tertunda as $i => $label) {
            $isi .= $this->kartuTertunda(
                self::MARGIN + $i * (self::CM * 6.6),
                self::CM * 5.8,
                self::CM * 6.2,
                self::CM * 1.5,
                $label,
            );
        }

        $isi .= $this->k->donat(
            self::CM * 16,
            self::CM * 5.4,
            self::CM * 5,
            array_map(fn ($st) => ['label' => $st[0], 'nilai' => (float) $st[1], 'warna' => $st[2]], $status),
            (string) $s['total_prk'],
            'pekerjaan',
        );

        $isi .= $this->legendaTegak(
            self::CM * 21.6,
            self::CM * 6,
            array_map(fn ($st) => [$st[0], (string) $st[1], $st[2]], $status),
        );

        $poin = [
            $s['finished'].' pekerjaan berstatus FINISH.',
            $s['on_progress'].' ON PROGRESS dan '.$s['not_started'].' NOT STARTED.',
            'Status kontrak dan penundaan '.strtolower(LaporanMonev::DALAM_PENGEMBANGAN).'.',
        ];

        $isi .= $this->k->insight(self::MARGIN, self::CM * 12.4, self::LEBAR - self::MARGIN * 2, self::CM * 2.1, $poin);

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(7, 'Work Status'));
    }

    /**
     * @param  array<string, mixed>  $b
     * @param  array<string, mixed>  $kontrak
     * @param  array<string, mixed>  $bayar
     * @param  array<string, mixed>  $luncuran
     */
    private function slideKontrakPembayaran(array $b, array $kontrak, array $bayar, array $luncuran): void
    {
        $isi = $this->kepala(
            'Contract, Budget & Payment Monitoring',
            'Anggaran tercatat sebagai satu angka; kontrak, pembayaran, AI/AO, dan luncuran belum ada sumber datanya',
        );

        $rencana = (float) $b['gabungan_rencana'];
        $aktual = (float) $b['gabungan_aktual'];

        $isi .= $this->k->kartuKpi(self::MARGIN, self::CM * 3.2, self::CM * 6.4, self::CM * 2.2,
            'ANGGARAN RENCANA', 'Rp '.$this->k->ringkas($rencana), (int) $b['terisi'].' mesin terisi', Kanvas::BIRU);

        $isi .= $this->k->kartuKpi(self::MARGIN + self::CM * 7, self::CM * 3.2, self::CM * 6.4, self::CM * 2.2,
            'ANGGARAN AKTUAL', 'Rp '.$this->k->ringkas($aktual), 'realisasi tercatat', Kanvas::HIJAU);

        $isi .= $this->k->kartuKpi(self::MARGIN + self::CM * 14, self::CM * 3.2, self::CM * 6.4, self::CM * 2.2,
            'REALISASI ANGGARAN',
            $b['gabungan_realisasi_persen'] === null
                ? LaporanMonev::BELUM_ADA
                : $b['gabungan_realisasi_persen'].'%',
            'aktual terhadap rencana',
            Kanvas::AMBER);

        if ($rencana > 0 || $aktual > 0) {
            $isi .= $this->k->batang(
                self::MARGIN + self::CM * 1,
                self::CM * 6.2,
                self::CM * 11,
                self::CM * 5.6,
                ['Rencana', 'Aktual'],
                [['label' => 'Nilai anggaran (Rp)', 'warna' => Kanvas::BIRU_MUDA, 'nilai' => [$rencana, $aktual]]],
                'rupiah',
            );
        } else {
            $isi .= $this->kotakKosong('Nilai anggaran belum diisi — '.LaporanMonev::BELUM_ADA.'.', self::CM * 6.2);
        }

        // Kerangka AI/AO dan pembayaran tetap ditampilkan sebagai kartu tertunda
        // supaya susunan laporan utuh tanpa mengarang angka.
        $tertunda = [
            ['ANGGARAN INVESTASI (AI)', self::CM * 14.4, self::CM * 6.2],
            ['ANGGARAN OPERASI (AO)', self::CM * 21.2, self::CM * 6.2],
            ['MONITORING KONTRAK', self::CM * 14.4, self::CM * 8.2],
            ['MONITORING PEMBAYARAN', self::CM * 21.2, self::CM * 8.2],
            ['LUNCURAN / CARRY OVER', self::CM * 14.4, self::CM * 10.2],
            ['OUTSTANDING PAYMENT', self::CM * 21.2, self::CM * 10.2],
        ];

        foreach ($tertunda as [$label, $x, $y]) {
            $isi .= $this->kartuTertunda($x, $y, self::CM * 6.4, self::CM * 1.7, $label);
        }

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(8, 'Contract & Payment'));
    }

    /** @param array<string, mixed> $p */
    private function slideSfc(array $p): void
    {
        $rows = array_values(array_filter($p['rows'], fn ($r) => $r['sfc_before'] !== null));

        $isi = $this->kepala('SFC Before vs After OH', 'Specific Fuel Consumption sebelum dan sesudah overhaul — semakin turun semakin baik');

        if ($rows === []) {
            $isi .= $this->kotakKosong('Pengukuran SFC belum diisi — '.LaporanMonev::BELUM_ADA.'.');
        } else {
            $tampil = array_slice($rows, 0, 8);

            $isi .= $this->k->batang(
                self::MARGIN + self::CM * 1,
                self::CM * 3.4,
                self::LEBAR - self::MARGIN * 2 - self::CM * 7.4,
                self::CM * 8.4,
                array_map(fn ($r) => $this->pendek($r['machine_name']), $tampil),
                [
                    ['label' => 'SFC Sebelum', 'warna' => Kanvas::ABU, 'nilai' => array_column($tampil, 'sfc_before')],
                    ['label' => 'SFC Sesudah', 'warna' => Kanvas::HIJAU, 'nilai' => array_column($tampil, 'sfc_after')],
                ],
                'L/kWh',
            );

            $x = self::LEBAR - self::MARGIN - self::CM * 6;
            $isi .= $this->k->kartuKpi($x, self::CM * 3.4, self::CM * 6, self::CM * 2,
                'AVERAGE SFC BEFORE', $this->angka($p['average_sfc_before']), 'L/kWh', Kanvas::ABU_TUA);
            $isi .= $this->k->kartuKpi($x, self::CM * 5.7, self::CM * 6, self::CM * 2,
                'AVERAGE SFC AFTER', $this->angka($p['average_sfc_after']), 'L/kWh', Kanvas::HIJAU);
            $isi .= $this->k->kartuKpi($x, self::CM * 8, self::CM * 6, self::CM * 2,
                'AVERAGE REDUCTION', $this->persen($p['average_sfc_improvement']), 'perbaikan SFC', Kanvas::BIRU);
        }

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(9, 'SFC Before vs After'));
    }

    /** @param array<string, mixed> $p */
    private function slideDmp(array $p): void
    {
        $rows = array_values(array_filter($p['rows'], fn ($r) => $r['dmp_before'] !== null));

        $isi = $this->kepala('Daya Mampu (DMP) Before vs After OH', 'Daya mampu netto sebelum dan sesudah overhaul — semakin naik semakin baik');

        if ($rows === []) {
            $isi .= $this->kotakKosong('Pengukuran daya mampu belum diisi — '.LaporanMonev::BELUM_ADA.'.');
        } else {
            $tampil = array_slice($rows, 0, 8);

            $isi .= $this->k->batang(
                self::MARGIN + self::CM * 1,
                self::CM * 3.4,
                self::LEBAR - self::MARGIN * 2 - self::CM * 7.4,
                self::CM * 8.4,
                array_map(fn ($r) => $this->pendek($r['machine_name']), $tampil),
                [
                    ['label' => 'DMP Sebelum', 'warna' => Kanvas::ABU, 'nilai' => array_column($tampil, 'dmp_before')],
                    ['label' => 'DMP Sesudah', 'warna' => Kanvas::BIRU, 'nilai' => array_column($tampil, 'dmp_after')],
                ],
                'kW',
            );

            $x = self::LEBAR - self::MARGIN - self::CM * 6;
            $isi .= $this->k->kartuKpi($x, self::CM * 3.4, self::CM * 6, self::CM * 2,
                'AVERAGE DMP BEFORE', $this->angka($p['average_dmp_before']), 'kW', Kanvas::ABU_TUA);
            $isi .= $this->k->kartuKpi($x, self::CM * 5.7, self::CM * 6, self::CM * 2,
                'AVERAGE DMP AFTER', $this->angka($p['average_dmp_after']), 'kW', Kanvas::BIRU);
            $isi .= $this->k->kartuKpi($x, self::CM * 8, self::CM * 6, self::CM * 2,
                'AVERAGE INCREASE', $this->persen($p['average_dmp_improvement']), 'kenaikan daya mampu', Kanvas::HIJAU);
        }

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(10, 'DMP Before vs After'));
    }

    /**
     * @param  array<string, mixed>  $p
     * @param  array<string, array<int, string>>  $insight
     */
    private function slideDampakOh(array $p, array $insight): void
    {
        $isi = $this->kepala('Performance Impact OH', 'Dampak overhaul terhadap konsumsi bahan bakar dan daya mampu');

        $blok = function (
            string $judul,
            string $panah,
            ?float $sebelum,
            ?float $sesudah,
            ?float $perbaikan,
            string $satuan,
            string $warna,
            float $y,
        ) {
            $out = $this->k->bentuk('roundRect', self::MARGIN, $y, self::LEBAR - self::MARGIN * 2, self::CM * 3.9, [
                'isi' => Kanvas::PUTIH, 'garis' => 'E2E8F0',
                'adj' => '<a:gd name="adj" fmla="val 5000"/>',
            ]);

            $out .= $this->k->teks($panah.'  '.$judul, self::MARGIN + self::CM * 0.5, $y + self::CM * 0.3, self::CM * 8, self::CM * 0.8, [
                'ukuran' => 1300, 'tebal' => true, 'rata' => 'l', 'warna' => $warna,
            ]);

            $out .= $this->k->teks($satuan, self::MARGIN + self::CM * 0.5, $y + self::CM * 1.1, self::CM * 8, self::CM * 0.6, [
                'ukuran' => 800, 'rata' => 'l', 'warna' => Kanvas::ABU,
            ]);

            $kotak = [
                ['BEFORE', $this->angka($sebelum), Kanvas::ABU_TUA, self::CM * 9.5],
                ['AFTER', $this->angka($sesudah), $warna, self::CM * 15.5],
                ['IMPROVEMENT', $this->persen($perbaikan), Kanvas::BIRU, self::CM * 21.5],
            ];

            foreach ($kotak as [$label, $nilai, $w, $x]) {
                $out .= $this->k->teks($label, $x, $y + self::CM * 0.5, self::CM * 5.2, self::CM * 0.5, [
                    'ukuran' => 800, 'tebal' => true, 'warna' => Kanvas::ABU_TUA,
                ]);
                $out .= $this->k->teks($nilai, $x, $y + self::CM * 1.2, self::CM * 5.2, self::CM * 1.6, [
                    'ukuran' => 2000, 'tebal' => true, 'warna' => $w,
                ]);
            }

            // Panah antar kotak, menegaskan arah perubahan.
            foreach ([self::CM * 14.8, self::CM * 20.8] as $ax) {
                $out .= $this->k->bentuk('rightArrow', $ax, $y + self::CM * 1.7, self::CM * 0.7, self::CM * 0.5, [
                    'isi' => 'CBD5E1',
                ]);
            }

            return $out;
        };

        $isi .= $blok('SFC — Specific Fuel Consumption', '↓', $p['average_sfc_before'], $p['average_sfc_after'],
            $p['average_sfc_improvement'], 'rata-rata seluruh mesin terukur · L/kWh', Kanvas::HIJAU, self::CM * 3.2);

        $isi .= $blok('DMP — Daya Mampu Netto', '↑', $p['average_dmp_before'], $p['average_dmp_after'],
            $p['average_dmp_improvement'], 'rata-rata seluruh mesin terukur · kW', Kanvas::BIRU, self::CM * 7.6);

        $isi .= $this->k->insight(self::MARGIN, self::CM * 12.4, self::LEBAR - self::MARGIN * 2, self::CM * 2.1, $insight['kinerja']);

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(11, 'Performance Impact'));
    }

    /** @param array<string, mixed> $e */
    private function slideException(array $e): void
    {
        $isi = $this->kepala('Exception & Risk Dashboard', 'Pekerjaan yang memerlukan perhatian manajemen');

        $kartu = [
            ['NOT STARTED', (string) $e['total_not_started'], Kanvas::ABU],
            ['ON PROGRESS', (string) $e['total_on_progress'], Kanvas::AMBER],
            ['NOT FINISH', (string) $e['total_not_finish'], Kanvas::MERAH],
        ];

        $lebar = self::CM * 6.4;
        foreach ($kartu as $i => [$label, $nilai, $warna]) {
            $isi .= $this->k->kartuKpi(self::MARGIN + $i * (self::CM * 6.9), self::CM * 3.1, $lebar, self::CM * 2.2,
                $label, $nilai, 'pekerjaan', $warna);
        }

        foreach ([['NOT CONTRACTED', self::CM * 21.8], ['POSTPONED / UNPAID', self::CM * 21.8]] as $i => [$label, $x]) {
            $isi .= $this->kartuTertunda($x, self::CM * 3.1 + $i * self::CM * 2.4, self::CM * 6.4, self::CM * 2.2, $label);
        }

        $baris = array_slice($e['rows'], 0, 7);

        $isi .= $this->k->teks('Pekerjaan Melewati Rencana Selesai', self::MARGIN, self::CM * 5.9, self::CM * 12, self::CM * 0.6, [
            'ukuran' => 1000, 'tebal' => true, 'rata' => 'l', 'warna' => Kanvas::NAVY,
        ]);

        $isi .= $baris === []
            ? $this->k->teks('Tidak ada pekerjaan yang melewati rencana selesai.', self::MARGIN, self::CM * 6.8, self::CM * 20, self::CM, [
                'ukuran' => 1000, 'rata' => 'l', 'warna' => Kanvas::HIJAU,
            ])
            : $this->tabel(
                ['Mesin', 'Site', 'Keterangan'],
                array_map(fn ($r) => [$r['machine_name'], $r['site_name'], $r['description']], $baris),
                [7, 4.5, 9.5],
                self::MARGIN,
                self::CM * 6.6,
            );

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(12, 'Exception & Risk'));
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function slideBelumSelesai(array $rows): void
    {
        $potongan = $rows === [] ? [[]] : array_chunk($rows, 9);

        foreach ($potongan as $n => $bagian) {
            $judul = count($potongan) > 1
                ? 'Detail Pekerjaan Belum Selesai ('.($n + 1).'/'.count($potongan).')'
                : 'Detail Pekerjaan Belum Selesai';

            $isi = $this->kepala($judul, 'Progres tiap pekerjaan yang belum tuntas beserta keterangannya');

            if ($bagian === []) {
                $isi .= $this->kotakKosong('Seluruh pekerjaan pada periode ini sudah tuntas.');
            } else {
                $isi .= $this->k->batangHorizontal(
                    self::MARGIN,
                    self::CM * 3.3,
                    self::LEBAR - self::MARGIN * 2,
                    self::CM * 9.6,
                    array_map(fn ($r) => [
                        'label' => $this->pendek($r['machine_name'], 34),
                        'nilai' => (float) $r['progress'],
                        'warna' => $r['status'] === 'NOT_FINISH' ? Kanvas::MERAH : Kanvas::ABU,
                        'keterangan' => number_format((float) $r['progress'], 0).'%  ·  '
                            .$r['site_name'].'  ·  '.$r['status'],
                    ], $bagian),
                );
            }

            $this->slides[] = $this->bungkusSlide($isi.$this->kaki(13, 'Pekerjaan Belum Selesai'));
        }
    }

    /**
     * @param  array<string, mixed>  $kpi
     * @param  array<string, string>  $c
     * @param  array<string, array<int, string>>  $insight
     */
    private function slideKesimpulan(array $kpi, array $c, array $insight): void
    {
        $isi = $this->kepala('Executive Conclusion', 'Ringkasan capaian dan hal yang memerlukan perhatian');

        $kartu = [
            ['OVERALL PROGRESS', $kpi['overall_progress'].'%', Kanvas::BIRU],
            ['SELESAI', (string) $kpi['total_finished'], Kanvas::HIJAU],
            ['BERJALAN', (string) $kpi['total_on_progress'], Kanvas::AMBER],
            ['LEWAT JADWAL', (string) $kpi['total_not_finished'], Kanvas::MERAH],
            ['SFC IMPROVEMENT', $this->persen($kpi['average_sfc_improvement']), Kanvas::HIJAU],
            ['DMP IMPROVEMENT', $this->persen($kpi['average_dmp_improvement']), Kanvas::BIRU],
        ];

        $lebar = (self::LEBAR - self::MARGIN * 2 - self::CM * 0.5 * 5) / 6;

        foreach ($kartu as $i => [$label, $nilai, $warna]) {
            $isi .= $this->k->kartuKpi(
                self::MARGIN + $i * ($lebar + self::CM * 0.5),
                self::CM * 3.1,
                $lebar,
                self::CM * 2.2,
                $label,
                $nilai,
                '',
                $warna,
            );
        }

        $bagian = [
            ['Overall Performance', $c['ringkasan'], Kanvas::BIRU],
            ['Operational Performance', $c['kinerja'], Kanvas::HIJAU],
            ['Financial Performance', $c['anggaran'], Kanvas::AMBER],
        ];

        foreach ($bagian as $i => [$judul, $teks, $warna]) {
            $y = self::CM * 5.9 + $i * self::CM * 2.1;

            $isi .= $this->k->bentuk('rect', self::MARGIN, $y, self::CM * 0.1, self::CM * 1.8, ['isi' => $warna]);
            $isi .= $this->k->teks($judul, self::MARGIN + self::CM * 0.35, $y, self::CM * 8, self::CM * 0.6, [
                'ukuran' => 950, 'tebal' => true, 'rata' => 'l', 'warna' => $warna,
            ]);
            $isi .= $this->k->teks($teks, self::MARGIN + self::CM * 0.35, $y + self::CM * 0.6, self::LEBAR - self::MARGIN * 2 - self::CM, self::CM * 1.2, [
                'ukuran' => 900, 'rata' => 'l', 'warna' => Kanvas::ABU_TUA, 'anchor' => 't',
            ]);
        }

        $isi .= $this->k->insight(self::MARGIN, self::CM * 12.4, self::LEBAR - self::MARGIN * 2, self::CM * 2.1, $insight['ringkasan']);

        $this->slides[] = $this->bungkusSlide($isi.$this->kaki(14, 'Executive Conclusion'));
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function slideLampiran(array $rows): void
    {
        $potongan = $rows === [] ? [[]] : array_chunk($rows, 11);

        foreach ($potongan as $n => $bagian) {
            $judul = count($potongan) > 1
                ? 'Appendix — Detail Pekerjaan OH ('.($n + 1).'/'.count($potongan).')'
                : 'Appendix — Detail Pekerjaan OH';

            $isi = $this->kepala($judul, 'Rincian tabular; nomor PRK, work order, dan kontrak '.strtolower(LaporanMonev::TIDAK_TERSEDIA));

            $isi .= $bagian === []
                ? $this->kotakKosong(LaporanMonev::BELUM_ADA.' untuk periode ini.')
                : $this->tabel(
                    ['Ref', 'Mesin', 'Site', 'Scope', 'Rencana', 'Real Start', 'Progres', 'Status'],
                    array_map(fn ($r) => [
                        $r['ref'], $r['machine_name'], $r['site_name'], $r['work_type'],
                        $r['planned_date'], $r['start_date'], $r['progress'].'%', $r['status'],
                    ], $bagian),
                    [1.4, 6.2, 3.4, 1.6, 2.2, 2.2, 1.6, 2.4],
                    self::MARGIN,
                    self::CM * 3.2,
                );

            $this->slides[] = $this->bungkusSlide($isi.$this->kaki(15, 'Appendix'));
        }
    }

    // -------------------------------------------------------- Kerangka slide

    /** Kepala slide: garis aksen, judul, keterangan, dan kedua logo. */
    private function kepala(string $judul, string $keterangan): string
    {
        $out = $this->k->bentuk('rect', 0, 0, self::LEBAR, self::CM * 2.5, ['isi' => Kanvas::PUTIH]);
        $out .= $this->k->bentuk('rect', 0, 0, self::LEBAR, self::CM * 0.16, ['isi' => Kanvas::NAVY]);

        $out .= $this->logoKepala();

        $out .= $this->k->teks($judul, self::MARGIN + self::CM * 3.4, self::CM * 0.5, self::LEBAR - self::MARGIN * 2 - self::CM * 8, self::CM * 1, [
            'ukuran' => 1800, 'tebal' => true, 'rata' => 'l', 'warna' => Kanvas::NAVY,
        ]);

        $out .= $this->k->teks($keterangan, self::MARGIN + self::CM * 3.4, self::CM * 1.5, self::LEBAR - self::MARGIN * 2 - self::CM * 8, self::CM * 0.7, [
            'ukuran' => 850, 'rata' => 'l', 'warna' => Kanvas::ABU,
        ]);

        $out .= $this->k->bentuk('rect', self::MARGIN, self::CM * 2.42, self::LEBAR - self::MARGIN * 2, self::CM * 0.03, [
            'isi' => 'E2E8F0',
        ]);

        return $out;
    }

    /** Logo Danantara di sudut kiri, logo PLN di sudut kanan. */
    private function logoKepala(): string
    {
        $out = '';

        if (isset($this->media['danantara'])) {
            // 320x93 → rasio dijaga.
            $tinggi = self::CM * 0.85;
            $out .= $this->k->gambar($this->media['danantara']['rId'], self::MARGIN, self::CM * 0.75, $tinggi * (320 / 93), $tinggi);
        }

        if (isset($this->media['pln'])) {
            // 985x253 → rasio dijaga.
            $tinggi = self::CM * 0.85;
            $lebar = $tinggi * (985 / 253);
            $out .= $this->k->gambar($this->media['pln']['rId'], self::LEBAR - self::MARGIN - $lebar, self::CM * 0.75, $lebar, $tinggi);
        }

        return $out;
    }

    /** Logo pada sampul, ukurannya lebih besar. */
    private function logoSampul(): string
    {
        $out = '';

        if (isset($this->media['danantara'])) {
            $tinggi = self::CM * 1.4;
            $out .= $this->k->gambar($this->media['danantara']['rId'], self::MARGIN, self::CM * 1.4, $tinggi * (320 / 93), $tinggi);
        }

        if (isset($this->media['pln'])) {
            $tinggi = self::CM * 1.4;
            $lebar = $tinggi * (985 / 253);
            $out .= $this->k->gambar($this->media['pln']['rId'], self::LEBAR - self::MARGIN - $lebar, self::CM * 1.4, $lebar, $tinggi);
        }

        return $out;
    }

    /** Kaki slide: identitas, periode, penanda pengembangan, dan nomor halaman. */
    private function kaki(int $nomor, string $bagian): string
    {
        $id = $this->data['identity'];
        $y = self::TINGGI - self::CM * 1.05;

        $out = $this->k->bentuk('rect', self::MARGIN, $y, self::LEBAR - self::MARGIN * 2, self::CM * 0.03, [
            'isi' => 'E2E8F0',
        ]);

        $out .= $this->k->teks(
            $id['unit'].'   ·   '.$id['period'].'   ·   '.$bagian,
            self::MARGIN,
            $y + self::CM * 0.12,
            self::LEBAR / 2,
            self::CM * 0.6,
            ['ukuran' => 750, 'rata' => 'l', 'warna' => Kanvas::ABU],
        );

        $out .= $this->k->teks(
            'Dalam pengembangan   ·   Slide '.(count($this->slides) + 1),
            self::LEBAR / 2,
            $y + self::CM * 0.12,
            self::LEBAR / 2 - self::MARGIN,
            self::CM * 0.6,
            ['ukuran' => 750, 'rata' => 'r', 'warna' => Kanvas::AMBER],
        );

        return $out;
    }

    /** Kartu untuk parameter yang belum ada sumber datanya. */
    private function kartuTertunda(float $x, float $y, float $w, float $h, string $label): string
    {
        $out = $this->k->bentuk('roundRect', $x, $y, $w, $h, [
            'isi' => 'FFFBEB',
            'garis' => 'FCD34D',
            'adj' => '<a:gd name="adj" fmla="val 8000"/>',
        ]);

        $out .= $this->k->teks($label, $x + self::CM * 0.3, $y + self::CM * 0.18, $w - self::CM * 0.6, self::CM * 0.5, [
            'ukuran' => 800, 'tebal' => true, 'rata' => 'l', 'warna' => Kanvas::AMBER,
        ]);

        $out .= $this->k->teks(LaporanMonev::TIDAK_TERSEDIA, $x + self::CM * 0.3, $y + $h * 0.42, $w - self::CM * 0.6, $h * 0.4, [
            'ukuran' => 950, 'tebal' => true, 'rata' => 'l', 'warna' => 'B45309',
        ]);

        return $out;
    }

    private function kotakKosong(string $pesan, ?float $y = null): string
    {
        $y ??= self::CM * 6;

        $out = $this->k->bentuk('roundRect', self::MARGIN, $y, self::LEBAR - self::MARGIN * 2, self::CM * 2.4, [
            'isi' => 'FFFBEB', 'garis' => 'FCD34D',
            'adj' => '<a:gd name="adj" fmla="val 4000"/>',
        ]);

        $out .= $this->k->teks($pesan, self::MARGIN + self::CM, $y + self::CM * 0.6, self::LEBAR - self::MARGIN * 2 - self::CM * 2, self::CM * 1.2, [
            'ukuran' => 1100, 'warna' => 'B45309',
        ]);

        return $out;
    }

    /** @param array<int, array{0: string, 1: string, 2: string}> $baris */
    private function legendaTegak(float $x, float $y, array $baris): string
    {
        $out = '';

        foreach ($baris as $i => [$label, $nilai, $warna]) {
            $by = $y + $i * self::CM * 0.85;

            $out .= $this->k->bentuk('roundRect', $x, $by + self::CM * 0.14, self::CM * 0.3, self::CM * 0.3, [
                'isi' => $warna, 'adj' => '<a:gd name="adj" fmla="val 30000"/>',
            ]);
            $out .= $this->k->teks($label, $x + self::CM * 0.45, $by, self::CM * 3.4, self::CM * 0.6, [
                'ukuran' => 850, 'rata' => 'l', 'warna' => Kanvas::ABU_TUA,
            ]);
            $out .= $this->k->teks($nilai, $x + self::CM * 3.9, $by, self::CM * 1.2, self::CM * 0.6, [
                'ukuran' => 850, 'tebal' => true, 'rata' => 'r', 'warna' => Kanvas::TEKS,
            ]);
        }

        return $out;
    }

    /**
     * Tabel — dipakai hanya untuk rincian yang memang tabular.
     *
     * @param  array<int, string>  $kepala
     * @param  array<int, array<int, string>>  $baris
     * @param  array<int, float>  $lebarCm
     */
    private function tabel(array $kepala, array $baris, array $lebarCm, float $x, float $y): string
    {
        $kolom = '';
        foreach ($lebarCm as $cm) {
            $kolom .= '<a:gridCol w="'.(int) ($cm * self::CM).'"/>';
        }

        $isi = '<a:tr h="340000">';
        foreach ($kepala as $teks) {
            $isi .= $this->sel($teks, tebal: true, latar: Kanvas::NAVY, warnaTeks: Kanvas::PUTIH);
        }
        $isi .= '</a:tr>';

        foreach ($baris as $i => $kolomBaris) {
            $latar = $i % 2 === 1 ? Kanvas::ABU_MUDA : Kanvas::PUTIH;
            $isi .= '<a:tr h="300000">';

            foreach ($kolomBaris as $j => $teks) {
                // Angka dan persentase rata kanan, teks rata kiri.
                $rata = preg_match('/^[\d.,%\s-]+$/', (string) $teks) === 1 ? 'r' : 'l';
                $isi .= $this->sel((string) $teks, latar: $latar, rata: $rata);
            }

            $isi .= '</a:tr>';
        }

        return '<p:graphicFrame><p:nvGraphicFramePr>'
            .'<p:cNvPr id="'.$this->k->idBaru().'" name="Tabel"/><p:cNvGraphicFramePr/><p:nvPr/>'
            .'</p:nvGraphicFramePr>'
            .'<p:xfrm><a:off x="'.(int) $x.'" y="'.(int) $y.'"/>'
            .'<a:ext cx="'.(int) (array_sum($lebarCm) * self::CM).'" cy="340000"/></p:xfrm>'
            .'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
            .'<a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>'.$kolom.'</a:tblGrid>'
            .$isi.'</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
    }

    private function sel(
        string $teks,
        bool $tebal = false,
        string $latar = Kanvas::PUTIH,
        string $warnaTeks = Kanvas::TEKS,
        string $rata = 'l',
    ): string {
        return '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p>'
            .'<a:pPr algn="'.$rata.'"/><a:r><a:rPr lang="id-ID" sz="850" b="'.($tebal ? 1 : 0).'">'
            .'<a:solidFill><a:srgbClr val="'.$warnaTeks.'"/></a:solidFill>'
            .'<a:latin typeface="Calibri"/></a:rPr>'
            .'<a:t>'.$this->k->esc($teks).'</a:t></a:r></a:p></a:txBody>'
            .'<a:tcPr marL="68580" marR="68580" marT="27432" marB="27432" anchor="ctr">'
            .'<a:solidFill><a:srgbClr val="'.$latar.'"/></a:solidFill></a:tcPr></a:tc>';
    }

    // ------------------------------------------------------------ Format

    private function warnaStatus(string $status): string
    {
        return match ($status) {
            'FINISH' => Kanvas::HIJAU,
            'ON_PROGRESS' => Kanvas::AMBER,
            'NOT_FINISH' => Kanvas::MERAH,
            default => Kanvas::ABU,
        };
    }

    private function pendek(string $teks, int $maks = 22): string
    {
        return mb_strlen($teks) <= $maks ? $teks : mb_substr($teks, 0, $maks - 1).'…';
    }

    private function angka(?float $v): string
    {
        return $v === null ? LaporanMonev::BELUM_ADA : number_format($v, 2, ',', '.');
    }

    private function persen(?float $v): string
    {
        return $v === null ? LaporanMonev::BELUM_ADA : number_format($v, 2, ',', '.').'%';
    }

    private function bertanda(float $v): string
    {
        return ($v > 0 ? '+' : ($v < 0 ? '−' : '')).number_format(abs($v), 2, ',', '.').'%';
    }

    // --------------------------------------------------- Kerangka berkas

    private function bungkusSlide(string $isi): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
            .' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
            .' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            .'<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            .'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
            .'<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            .$isi
            .'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
    }

    private function contentTypes(): string
    {
        $slide = '';
        foreach (array_keys($this->slides) as $i) {
            $slide .= '<Override PartName="/ppt/slides/slide'.($i + 1).'.xml"'
                .' ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Default Extension="png" ContentType="image/png"/>'
            .'<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
            .'<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
            .'<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
            .'<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
            .$slide
            .'<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
            .'<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
            .'</Types>';
    }

    private function relsUtama(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            .'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
            .'</Relationships>';
    }

    private function presentation(): string
    {
        $daftar = '';
        foreach (array_keys($this->slides) as $i) {
            $daftar .= '<p:sldId id="'.(256 + $i).'" r:id="rId'.($i + 2).'"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
            .' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
            .' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            .'<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
            .'<p:sldIdLst>'.$daftar.'</p:sldIdLst>'
            .'<p:sldSz cx="'.self::LEBAR.'" cy="'.self::TINGGI.'"/>'
            .'<p:notesSz cx="'.self::TINGGI.'" cy="'.self::LEBAR.'"/>'
            .'</p:presentation>';
    }

    private function presentationRels(): string
    {
        $rel = '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>';

        foreach (array_keys($this->slides) as $i) {
            $rel .= '<Relationship Id="rId'.($i + 2).'"'
                .' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"'
                .' Target="slides/slide'.($i + 1).'.xml"/>';
        }

        $rel .= '<Relationship Id="rId'.(count($this->slides) + 2).'"'
            .' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"'
            .' Target="theme/theme1.xml"/>';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .$rel.'</Relationships>';
    }

    /** Tiap slide merujuk layout yang sama dan kedua berkas logo. */
    private function slideRels(): string
    {
        $rel = '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>';

        foreach ($this->media as $m) {
            $rel .= '<Relationship Id="'.$m['rId'].'"'
                .' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"'
                .' Target="../media/'.$m['target'].'"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .$rel.'</Relationships>';
    }

    private function slideMaster(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
            .' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
            .' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            .'<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            .'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
            .'<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            .'</p:spTree></p:cSld>'
            .'<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2"'
            .' accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6"'
            .' hlink="hlink" folHlink="folHlink"/>'
            .'<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
            .'</p:sldMaster>';
    }

    private function slideMasterRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
            .'</Relationships>';
    }

    private function slideLayout(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
            .' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
            .' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">'
            .'<p:cSld name="Kosong"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            .'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
            .'<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            .'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';
    }

    private function slideLayoutRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
            .'</Relationships>';
    }

    private function theme(): string
    {
        $skema = '';
        foreach ([
            'dk1' => '000000', 'lt1' => 'FFFFFF', 'dk2' => Kanvas::NAVY, 'lt2' => Kanvas::ABU_MUDA,
            'accent1' => Kanvas::BIRU, 'accent2' => Kanvas::BIRU_MUDA, 'accent3' => Kanvas::HIJAU,
            'accent4' => Kanvas::AMBER, 'accent5' => Kanvas::MERAH, 'accent6' => Kanvas::ABU,
            'hlink' => Kanvas::BIRU, 'folHlink' => '7C3AED',
        ] as $nama => $warna) {
            $skema .= '<a:'.$nama.'><a:srgbClr val="'.$warna.'"/></a:'.$nama.'>';
        }

        $font = '<a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/>';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Monev">'
            .'<a:themeElements>'
            .'<a:clrScheme name="Monev">'.$skema.'</a:clrScheme>'
            .'<a:fontScheme name="Monev">'
            .'<a:majorFont>'.$font.'</a:majorFont><a:minorFont>'.$font.'</a:minorFont>'
            .'</a:fontScheme>'
            .'<a:fmtScheme name="Monev">'
            .'<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
            .'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
            .'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
            .'<a:lnStyleLst>'
            .'<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
            .'<a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
            .'<a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
            .'</a:lnStyleLst>'
            .'<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle>'
            .'<a:effectStyle><a:effectLst/></a:effectStyle>'
            .'<a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
            .'<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
            .'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
            .'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>'
            .'</a:fmtScheme>'
            .'</a:themeElements></a:theme>';
    }

    private function docPropsCore(): string
    {
        $waktu = gmdate('Y-m-d\TH:i:s\Z');

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"'
            .' xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"'
            .' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            .'<dc:title>'.$this->k->esc($this->data['identity']['title']).'</dc:title>'
            .'<dc:creator>Outage Monitoring</dc:creator>'
            .'<cp:lastModifiedBy>Outage Monitoring</cp:lastModifiedBy>'
            .'<dcterms:created xsi:type="dcterms:W3CDTF">'.$waktu.'</dcterms:created>'
            .'<dcterms:modified xsi:type="dcterms:W3CDTF">'.$waktu.'</dcterms:modified>'
            .'</cp:coreProperties>';
    }

    private function docPropsApp(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"'
            .' xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
            .'<Application>Outage Monitoring</Application>'
            .'<Slides>'.count($this->slides).'</Slides>'
            .'</Properties>';
    }
}
