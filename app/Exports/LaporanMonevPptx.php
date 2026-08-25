<?php

namespace App\Exports;

use App\Support\LaporanMonev;
use RuntimeException;
use ZipArchive;

/**
 * Menulis Laporan MONEV sebagai berkas PPTX lanskap.
 *
 * Ditulis langsung sebagai OOXML di dalam ZIP, bukan lewat pustaka presentasi.
 * Aplikasi ini hanya memasang phpspreadsheet, dan menambah dependensi baru butuh
 * persetujuan lebih dulu — sementara sebuah .pptx pada dasarnya memang arsip ZIP
 * berisi XML, jadi seluruh berkasnya bisa disusun sendiri dengan ZipArchive yang
 * sudah tersedia.
 *
 * Ukuran slide 12192000 x 6858000 EMU: 16:9 lanskap, ukuran baku PowerPoint.
 */
class LaporanMonevPptx
{
    private const LEBAR = 12192000;

    private const TINGGI = 6858000;

    /** 1 cm dalam EMU, dipakai menempatkan kotak teks dan tabel. */
    private const CM = 360000;

    private const WARNA_JUDUL = '1E3A8A';

    private const WARNA_KEPALA = '1E40AF';

    private const WARNA_CATATAN = 'B45309';

    /** @var array<int, string> XML tiap slide, urut tampil. */
    private array $slides = [];

    public function __construct(private readonly array $data) {}

    /** Susun berkasnya lalu kembalikan sebagai string biner. */
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

    // ------------------------------------------------------------- Slide

    private function bangunSlides(): void
    {
        $d = $this->data;

        $this->slideJudul($d['identity']);
        $this->slideRingkasan($d['summary'], $d['identity']);
        $this->slideJenisPembangkit($d['plants']);
        $this->slidePerSite($d['sites']);
        $this->slideRincianPekerjaan($d['maintenance']);
        $this->slideBelumTerlaksana($d['belum_terlaksana']);
        $this->slideKinerja($d['performance']);
        $this->slideAnggaran($d['budget'], $d['contract'], $d['payment'], $d['carry_over']);
        $this->slideException($d['exceptions']);
        $this->slideKpi($d['kpi']);
        $this->slideKesimpulan($d['conclusion']);
    }

    /** @param array<string, string> $id */
    private function slideJudul(array $id): void
    {
        $isi = $this->kotakTeks(
            $id['title'],
            self::CM * 2,
            self::CM * 5,
            self::LEBAR - self::CM * 4,
            self::CM * 2,
            ukuran: 3200,
            tebal: true,
            warna: self::WARNA_JUDUL,
            rata: 'ctr',
        );

        $baris = [
            $id['unit'],
            'Periode: '.$id['period'],
            'Cakupan: '.$id['cakupan'],
            $id['location'].', '.$id['date'],
        ];

        $isi .= $this->kotakTeks(
            implode("\n", $baris),
            self::CM * 2,
            self::CM * 8,
            self::LEBAR - self::CM * 4,
            self::CM * 5,
            ukuran: 1400,
            rata: 'ctr',
        );

        $isi .= $this->catatanPengembangan();

        $this->slides[] = $this->bungkusSlide($isi);
    }

    /**
     * @param  array<string, mixed>  $s
     * @param  array<string, string>  $id
     */
    private function slideRingkasan(array $s, array $id): void
    {
        $baris = [
            ['Total PRK / rencana OH', $this->nilai($s['total_prk'])],
            ['PRK murni', $this->nilai($s['total_murni'])],
            ['PRK luncuran', $this->nilai($s['total_luncuran'])],
            ['Sudah terkontrak', $this->nilai($s['contracted'])],
            ['Belum terkontrak', $this->nilai($s['not_contracted'])],
            ['OH selesai (FINISH)', $this->nilai($s['finished'])],
            ['OH berjalan (ON PROGRESS)', $this->nilai($s['on_progress'])],
            ['OH belum mulai (NOT STARTED)', $this->nilai($s['not_started'])],
            ['OH lewat jadwal (NOT FINISH)', $this->nilai($s['not_finished'])],
            ['Progres fisik rata-rata', $s['progress_fisik'].'%'],
        ];

        $this->slideTabel(
            '1–2. Ringkasan HARDIK',
            $id['unit'].' · '.$id['period'],
            ['Parameter', 'Nilai'],
            $baris,
            [6, 6],
        );
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function slideJenisPembangkit(array $rows): void
    {
        $baris = array_map(fn ($r) => [
            $r['plant_type'],
            (string) $r['planned'],
            (string) $r['realized'],
            (string) $r['on_progress'],
            (string) $r['not_started'],
            $r['progress'].'%',
        ], $rows);

        $this->slideTabel(
            '3. Ringkasan per Jenis Pembangkit',
            'Dihitung dari kolom jenis pembangkit pada rencana outage',
            ['Jenis', 'Rencana', 'Selesai', 'Berjalan', 'Belum', 'Progres'],
            $baris,
            [3, 1.8, 1.8, 1.8, 1.8, 1.8],
        );
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function slidePerSite(array $rows): void
    {
        $baris = array_map(fn ($r) => [
            $r['site_name'],
            $r['plant_type'],
            (string) $r['planned'],
            (string) $r['realized'],
            (string) $r['on_progress'],
            $r['progress'].'%',
            $r['status'],
        ], $rows);

        $this->slideTabel(
            '4. Progress OH per Site',
            'Site diturunkan dari nama mesin pada tiap rencana outage',
            ['Site', 'Jenis', 'Rencana', 'Selesai', 'Berjalan', 'Progres', 'Status'],
            $baris,
            [3.4, 1.6, 1.4, 1.4, 1.4, 1.4, 2],
        );
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function slideRincianPekerjaan(array $rows): void
    {
        $baris = array_map(fn ($r) => [
            $r['ref'],
            $r['machine_name'],
            $r['site_name'],
            $r['work_type'],
            $r['planned_date'],
            $r['start_date'],
            $r['progress'].'%',
            $r['status'],
        ], $rows);

        $this->slideTabel(
            '5. Detail Pekerjaan OH',
            'Nomor PRK, work order, dan status kontrak: '.LaporanMonev::TIDAK_TERSEDIA,
            ['Ref', 'Mesin', 'Site', 'Scope', 'Rencana', 'Real Start', 'Progres', 'Status'],
            $baris,
            [1.2, 3.4, 2.2, 1.3, 1.6, 1.6, 1.3, 1.8],
        );
    }

    /** @param array<int, array<string, mixed>> $rows */
    private function slideBelumTerlaksana(array $rows): void
    {
        $baris = array_map(fn ($r) => [
            $r['machine_name'],
            $r['site_name'],
            $r['planned_date'],
            $r['status'],
            $r['progress'].'%',
            $r['reason'],
        ], $rows);

        $this->slideTabel(
            '6. Rincian HARDIK Belum Terlaksana',
            'Alasan penundaan dan penanda luncuran: '.LaporanMonev::TIDAK_TERSEDIA,
            ['Mesin', 'Site', 'Rencana', 'Status', 'Progres', 'Keterangan'],
            $baris,
            [3.4, 2.2, 1.6, 1.9, 1.3, 3.8],
        );
    }

    /** @param array<string, mixed> $p */
    private function slideKinerja(array $p): void
    {
        $baris = array_map(fn ($r) => [
            $r['machine_name'],
            $r['site_name'],
            $this->angka($r['sfc_before']),
            $this->angka($r['sfc_after']),
            $this->persen($r['sfc_improvement']),
            $this->angka($r['dmp_before']),
            $this->angka($r['dmp_after']),
            $this->persen($r['dmp_improvement']),
        ], $p['rows']);

        $rerata = sprintf(
            'Rata-rata: SFC %s → %s (perbaikan %s) · DMP %s → %s (perbaikan %s)',
            $this->angka($p['average_sfc_before']),
            $this->angka($p['average_sfc_after']),
            $this->persen($p['average_sfc_improvement']),
            $this->angka($p['average_dmp_before']),
            $this->angka($p['average_dmp_after']),
            $this->persen($p['average_dmp_improvement']),
        );

        $this->slideTabel(
            '7–9. SLA Setelah OH: SFC dan Daya Mampu',
            $rerata,
            ['Mesin', 'Site', 'SFC Sblm', 'SFC Ssdh', 'Perbaikan', 'DMP Sblm', 'DMP Ssdh', 'Perbaikan'],
            $baris,
            [3.2, 2, 1.5, 1.5, 1.7, 1.5, 1.5, 1.7],
        );
    }

    /**
     * @param  array<string, mixed>  $b
     * @param  array<string, mixed>  $kontrak
     * @param  array<string, mixed>  $bayar
     * @param  array<string, mixed>  $luncuran
     */
    private function slideAnggaran(array $b, array $kontrak, array $bayar, array $luncuran): void
    {
        $rupiah = fn ($v) => is_numeric($v) ? 'Rp '.number_format((float) $v, 0, ',', '.') : $this->nilai($v);

        $baris = [
            ['Anggaran rencana (gabungan)', $rupiah($b['gabungan_rencana'])],
            ['Anggaran aktual (gabungan)', $rupiah($b['gabungan_aktual'])],
            ['Realisasi anggaran', $b['gabungan_realisasi_persen'] === null
                ? LaporanMonev::BELUM_ADA
                : $b['gabungan_realisasi_persen'].'%'],
            ['Mesin dengan anggaran terisi', (string) $b['terisi']],
            ['AI — PRK / kontrak / dibayar', $this->nilai($b['ai']['prk_budget'])],
            ['AO — PRK / kontrak / dibayar', $this->nilai($b['ao']['prk_budget'])],
            ['Monitoring kontrak', $this->nilai($kontrak['keterangan'])],
            ['Monitoring pembayaran', $this->nilai($bayar['keterangan'])],
            ['Luncuran / carry over', $this->nilai($luncuran['keterangan'])],
        ];

        $this->slideTabel(
            '10–12, 14–15. Anggaran, Kontrak, dan Pembayaran',
            'Anggaran tercatat sebagai satu angka; pemisahan AI dan AO serta data '
                .'kontrak dan pembayaran belum ada sumbernya',
            ['Parameter', 'Nilai'],
            $baris,
            [6, 6],
        );
    }

    /** @param array<string, mixed> $e */
    private function slideException(array $e): void
    {
        $baris = [
            ['Belum dimulai', $this->nilai($e['total_not_started'])],
            ['Sedang berjalan', $this->nilai($e['total_on_progress'])],
            ['Lewat rencana selesai', $this->nilai($e['total_not_finish'])],
            ['Belum terkontrak', $this->nilai($e['total_not_contracted'])],
            ['Ditunda', $this->nilai($e['total_postponed'])],
            ['Belum dibayar', $this->nilai($e['total_unpaid'])],
            ['Rekomposisi anggaran', $this->nilai($e['total_budget_recomposition'])],
        ];

        foreach (array_slice($e['rows'], 0, 8) as $r) {
            $baris[] = [$r['machine_name'].' — '.$r['site_name'], $r['description']];
        }

        $this->slideTabel(
            '13. Exception / Permasalahan',
            'Exception terkait kontrak dan pembayaran belum dapat dihitung',
            ['Jenis', 'Nilai / Keterangan'],
            $baris,
            [4.5, 7.5],
        );
    }

    /** @param array<string, mixed> $k */
    private function slideKpi(array $k): void
    {
        $baris = [
            ['Progres keseluruhan', $k['overall_progress'].'%'],
            ['Selesai', (string) $k['total_finished']],
            ['Sedang berjalan', (string) $k['total_on_progress']],
            ['Belum dimulai', (string) $k['total_not_started']],
            ['Lewat rencana selesai', (string) $k['total_not_finished']],
            ['Rata-rata perbaikan SFC', $this->persen($k['average_sfc_improvement'])],
            ['Rata-rata perbaikan DMP', $this->persen($k['average_dmp_improvement'])],
            ['Realisasi kontrak', $this->nilai($k['contract_realization'])],
            ['Realisasi pembayaran', $this->nilai($k['payment_realization'])],
        ];

        $this->slideTabel(
            '16. KPI Laporan',
            'Angka kontrak dan pembayaran menunggu modulnya',
            ['Indikator', 'Nilai'],
            $baris,
            [6, 6],
        );
    }

    /** @param array<string, string> $c */
    private function slideKesimpulan(array $c): void
    {
        $isi = $this->kotakTeks(
            '17–18. Kesimpulan',
            self::CM * 1.5,
            self::CM * 1,
            self::LEBAR - self::CM * 3,
            self::CM * 1.5,
            ukuran: 2400,
            tebal: true,
            warna: self::WARNA_JUDUL,
        );

        $isi .= $this->kotakTeks(
            implode("\n\n", [$c['ringkasan'], $c['kinerja'], $c['anggaran']]),
            self::CM * 1.5,
            self::CM * 3,
            self::LEBAR - self::CM * 3,
            self::CM * 9,
            ukuran: 1400,
        );

        $isi .= $this->kotakTeks(
            'Grafik pada bagian 17 (progress, PLTD vs PLTM, per site, SFC, DMP, AI, AO) '
                .strtolower(LaporanMonev::DALAM_PENGEMBANGAN)
                .' — angkanya sudah tersedia pada slide sebelumnya.',
            self::CM * 1.5,
            self::CM * 13,
            self::LEBAR - self::CM * 3,
            self::CM * 2,
            ukuran: 1100,
            warna: self::WARNA_CATATAN,
        );

        $isi .= $this->catatanPengembangan();

        $this->slides[] = $this->bungkusSlide($isi);
    }

    // ------------------------------------------------------- Blok bangunan

    /**
     * Satu slide berisi judul, keterangan, dan sebuah tabel.
     *
     * Baris yang melebihi muatan satu slide dipecah otomatis ke slide lanjutan
     * supaya isinya tidak terpotong di luar bidang tampil.
     *
     * @param  array<int, string>  $kepala
     * @param  array<int, array<int, string>>  $baris
     * @param  array<int, float>  $lebarCm
     */
    private function slideTabel(
        string $judul,
        string $keterangan,
        array $kepala,
        array $baris,
        array $lebarCm,
    ): void {
        $perSlide = 12;
        $potongan = $baris === [] ? [[]] : array_chunk($baris, $perSlide);

        foreach ($potongan as $i => $isiBaris) {
            $judulSlide = count($potongan) > 1
                ? $judul.' ('.($i + 1).'/'.count($potongan).')'
                : $judul;

            $isi = $this->kotakTeks(
                $judulSlide,
                self::CM * 1.2,
                self::CM * 0.8,
                self::LEBAR - self::CM * 2.4,
                self::CM * 1.2,
                ukuran: 2200,
                tebal: true,
                warna: self::WARNA_JUDUL,
            );

            $isi .= $this->kotakTeks(
                $keterangan,
                self::CM * 1.2,
                self::CM * 2,
                self::LEBAR - self::CM * 2.4,
                self::CM * 1,
                ukuran: 1000,
                warna: '64748B',
            );

            $isi .= $isiBaris === [] && $baris === []
                ? $this->kotakTeks(
                    LaporanMonev::BELUM_ADA.' untuk bagian ini.',
                    self::CM * 1.2,
                    self::CM * 4,
                    self::LEBAR - self::CM * 2.4,
                    self::CM * 1.2,
                    ukuran: 1400,
                    warna: self::WARNA_CATATAN,
                )
                : $this->tabel($kepala, $isiBaris, $lebarCm, self::CM * 1.2, self::CM * 3.2);

            $isi .= $this->catatanPengembangan();

            $this->slides[] = $this->bungkusSlide($isi);
        }
    }

    /**
     * @param  array<int, string>  $kepala
     * @param  array<int, array<int, string>>  $baris
     * @param  array<int, float>  $lebarCm
     */
    private function tabel(array $kepala, array $baris, array $lebarCm, int $x, int $y): string
    {
        $kolom = '';
        foreach ($lebarCm as $cm) {
            $kolom .= '<a:gridCol w="'.(int) ($cm * self::CM).'"/>';
        }

        $isiTabel = '<a:tr h="370000">';
        foreach ($kepala as $teks) {
            $isiTabel .= $this->selTabel($teks, tebal: true, latar: self::WARNA_KEPALA, warnaTeks: 'FFFFFF');
        }
        $isiTabel .= '</a:tr>';

        foreach ($baris as $i => $kolomBaris) {
            $latar = $i % 2 === 1 ? 'F1F5F9' : 'FFFFFF';
            $isiTabel .= '<a:tr h="330000">';

            foreach ($kolomBaris as $teks) {
                $isiTabel .= $this->selTabel((string) $teks, latar: $latar);
            }

            $isiTabel .= '</a:tr>';
        }

        $lebarTotal = (int) (array_sum($lebarCm) * self::CM);

        return '<p:graphicFrame><p:nvGraphicFramePr>'
            .'<p:cNvPr id="'.$this->idBaru().'" name="Tabel"/><p:cNvGraphicFramePr/><p:nvPr/>'
            .'</p:nvGraphicFramePr>'
            .'<p:xfrm><a:off x="'.$x.'" y="'.$y.'"/><a:ext cx="'.$lebarTotal.'" cy="370000"/></p:xfrm>'
            .'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
            .'<a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>'.$kolom.'</a:tblGrid>'
            .$isiTabel
            .'</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
    }

    private function selTabel(
        string $teks,
        bool $tebal = false,
        string $latar = 'FFFFFF',
        string $warnaTeks = '111827',
    ): string {
        return '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p>'
            .'<a:pPr algn="l"/><a:r><a:rPr lang="id-ID" sz="900" b="'.($tebal ? 1 : 0).'">'
            .'<a:solidFill><a:srgbClr val="'.$warnaTeks.'"/></a:solidFill></a:rPr>'
            .'<a:t>'.$this->esc($teks).'</a:t></a:r></a:p></a:txBody>'
            .'<a:tcPr marL="45720" marR="45720" marT="27432" marB="27432" anchor="ctr">'
            .'<a:solidFill><a:srgbClr val="'.$latar.'"/></a:solidFill></a:tcPr></a:tc>';
    }

    private function kotakTeks(
        string $teks,
        float $x,
        float $y,
        float $lebar,
        float $tinggi,
        int $ukuran = 1200,
        bool $tebal = false,
        string $warna = '111827',
        string $rata = 'l',
    ): string {
        $paragraf = '';

        foreach (explode("\n", $teks) as $baris) {
            $paragraf .= '<a:p><a:pPr algn="'.$rata.'"/><a:r>'
                .'<a:rPr lang="id-ID" sz="'.$ukuran.'" b="'.($tebal ? 1 : 0).'">'
                .'<a:solidFill><a:srgbClr val="'.$warna.'"/></a:solidFill></a:rPr>'
                .'<a:t>'.$this->esc($baris).'</a:t></a:r></a:p>';
        }

        return '<p:sp><p:nvSpPr><p:cNvPr id="'.$this->idBaru().'" name="Teks"/>'
            .'<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            .'<p:spPr><a:xfrm><a:off x="'.(int) $x.'" y="'.(int) $y.'"/>'
            .'<a:ext cx="'.(int) $lebar.'" cy="'.(int) $tinggi.'"/></a:xfrm>'
            .'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            .'<p:txBody><a:bodyPr wrap="square"><a:normAutofit/></a:bodyPr><a:lstStyle/>'
            .$paragraf.'</p:txBody></p:sp>';
    }

    /** Catatan tetap di sudut tiap slide. */
    private function catatanPengembangan(): string
    {
        return $this->kotakTeks(
            'Fungsi laporan ini masih dalam pengembangan — sebagian parameter belum ada sumber datanya.',
            self::CM * 1.2,
            self::TINGGI - self::CM * 1.4,
            self::LEBAR - self::CM * 2.4,
            self::CM * 1,
            ukuran: 900,
            warna: self::WARNA_CATATAN,
        );
    }

    private int $idBerikut = 1;

    private function idBaru(): int
    {
        return ++$this->idBerikut;
    }

    private function nilai(mixed $v): string
    {
        return is_string($v) ? $v : (string) $v;
    }

    private function angka(?float $v): string
    {
        return $v === null ? LaporanMonev::BELUM_ADA : number_format($v, 2, ',', '.');
    }

    private function persen(?float $v): string
    {
        return $v === null ? LaporanMonev::BELUM_ADA : number_format($v, 2, ',', '.').'%';
    }

    private function esc(string $teks): string
    {
        return htmlspecialchars($teks, ENT_XML1 | ENT_QUOTES, 'UTF-8');
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
            // Lanskap: lebar lebih besar daripada tinggi.
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

    private function slideRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
            .'</Relationships>';
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
            'dk1' => '000000', 'lt1' => 'FFFFFF', 'dk2' => '1E293B', 'lt2' => 'F1F5F9',
            'accent1' => '1E40AF', 'accent2' => '0EA5E9', 'accent3' => '10B981',
            'accent4' => 'F59E0B', 'accent5' => 'EF4444', 'accent6' => '8B5CF6',
            'hlink' => '1E40AF', 'folHlink' => '7C3AED',
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
            .'<dc:title>'.$this->esc($this->data['identity']['title']).'</dc:title>'
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
