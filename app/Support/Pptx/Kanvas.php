<?php

namespace App\Support\Pptx;

/**
 * Perangkat gambar DrawingML: kartu KPI, batang, donat, cincin progres, dan
 * kurva — seluruhnya sebagai shape asli PowerPoint.
 *
 * Grafik digambar sebagai bentuk, bukan sebagai objek chart (c:chart). Objek
 * chart menuntut bagian workbook tersendiri di dalam arsip beserta rantai
 * relasinya, dan satu kesalahan kecil di sana membuat PowerPoint menolak seluruh
 * berkas. Bentuk geometri tidak punya risiko itu: hasilnya sama persis di layar,
 * hanya saja angkanya tidak bisa disunting ulang dari dalam PowerPoint — dan
 * laporan ini memang selalu dibangkitkan ulang dari data, bukan disunting tangan.
 *
 * Seluruh koordinat memakai EMU. Sudut pada geometri bawaan memakai satuan
 * 1/60000 derajat, dihitung searah jarum jam dari arah jam 3.
 */
class Kanvas
{
    public const CM = 360000;

    /** Palet korporat; dipakai seragam di seluruh slide. */
    public const NAVY = '0F2A5F';

    public const BIRU = '1E40AF';

    public const BIRU_MUDA = '3B82F6';

    public const BIRU_PUCAT = 'DBEAFE';

    public const HIJAU = '059669';

    public const AMBER = 'D97706';

    public const MERAH = 'DC2626';

    public const ABU = '94A3B8';

    public const ABU_TUA = '475569';

    public const ABU_MUDA = 'F1F5F9';

    public const TEKS = '0F172A';

    public const PUTIH = 'FFFFFF';

    private int $id = 100;

    public function idBaru(): int
    {
        return ++$this->id;
    }

    public function esc(string $teks): string
    {
        return htmlspecialchars($teks, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    // ------------------------------------------------------------- Dasar

    /**
     * Sebuah bentuk berisi teks opsional.
     *
     * @param  array<string, mixed>  $opsi
     */
    public function bentuk(
        string $geometri,
        float $x,
        float $y,
        float $w,
        float $h,
        array $opsi = [],
    ): string {
        $isi = $opsi['isi'] ?? null;
        $garis = $opsi['garis'] ?? null;
        $teks = $opsi['teks'] ?? '';
        $adj = $opsi['adj'] ?? '';
        $rot = isset($opsi['rot']) ? ' rot="'.(int) $opsi['rot'].'"' : '';

        $fill = $isi === null
            ? '<a:noFill/>'
            : '<a:solidFill><a:srgbClr val="'.$isi.'"/></a:solidFill>';

        $ln = $garis === null
            ? '<a:ln><a:noFill/></a:ln>'
            : '<a:ln w="'.(int) ($opsi['tebalGaris'] ?? 12700).'"><a:solidFill>'
                .'<a:srgbClr val="'.$garis.'"/></a:solidFill></a:ln>';

        return '<p:sp><p:nvSpPr><p:cNvPr id="'.$this->idBaru().'" name="Bentuk"/>'
            .'<p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            .'<p:spPr><a:xfrm'.$rot.'><a:off x="'.(int) $x.'" y="'.(int) $y.'"/>'
            .'<a:ext cx="'.(int) max(1, $w).'" cy="'.(int) max(1, $h).'"/></a:xfrm>'
            .'<a:prstGeom prst="'.$geometri.'"><a:avLst>'.$adj.'</a:avLst></a:prstGeom>'
            .$fill.$ln.'</p:spPr>'
            .$this->badanTeks($teks, $opsi)
            .'</p:sp>';
    }

    /** @param array<string, mixed> $opsi */
    private function badanTeks(string $teks, array $opsi): string
    {
        if ($teks === '') {
            return '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>';
        }

        $anchor = $opsi['anchor'] ?? 'ctr';
        $paragraf = '';

        foreach (explode("\n", $teks) as $baris) {
            $paragraf .= $this->paragraf($baris, $opsi);
        }

        return '<p:txBody><a:bodyPr wrap="square" anchor="'.$anchor.'"'
            .' lIns="'.(int) ($opsi['padX'] ?? 91440).'" rIns="'.(int) ($opsi['padX'] ?? 91440).'"'
            .' tIns="45720" bIns="45720"><a:normAutofit/></a:bodyPr><a:lstStyle/>'
            .$paragraf.'</p:txBody>';
    }

    /** @param array<string, mixed> $opsi */
    private function paragraf(string $teks, array $opsi): string
    {
        return '<a:p><a:pPr algn="'.($opsi['rata'] ?? 'ctr').'"/><a:r>'
            .'<a:rPr lang="id-ID" sz="'.(int) ($opsi['ukuran'] ?? 1100).'"'
            .' b="'.(($opsi['tebal'] ?? false) ? 1 : 0).'">'
            .'<a:solidFill><a:srgbClr val="'.($opsi['warna'] ?? self::TEKS).'"/></a:solidFill>'
            .'<a:latin typeface="Calibri"/></a:rPr>'
            .'<a:t>'.$this->esc($teks).'</a:t></a:r></a:p>';
    }

    /** @param array<string, mixed> $opsi */
    public function teks(string $isi, float $x, float $y, float $w, float $h, array $opsi = []): string
    {
        return $this->bentuk('rect', $x, $y, $w, $h, [...$opsi, 'teks' => $isi, 'isi' => null]);
    }

    /**
     * Gambar yang sudah terdaftar sebagai relasi slide.
     *
     * `$rId` menunjuk ke berkas di ppt/media lewat rels tiap slide; ukurannya
     * ditentukan pemanggil supaya rasio aslinya bisa dijaga.
     */
    public function gambar(string $rId, float $x, float $y, float $w, float $h): string
    {
        return '<p:pic><p:nvPicPr><p:cNvPr id="'.$this->idBaru().'" name="Logo"/>'
            .'<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
            .'<p:blipFill><a:blip r:embed="'.$rId.'"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
            .'<p:spPr><a:xfrm><a:off x="'.(int) $x.'" y="'.(int) $y.'"/>'
            .'<a:ext cx="'.(int) $w.'" cy="'.(int) $h.'"/></a:xfrm>'
            .'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
    }

    // -------------------------------------------------------- Komponen

    /**
     * Kartu KPI: angka besar dengan label di atas dan satuan di bawah.
     *
     * Pita warna tipis di sisi kiri dipakai sebagai penanda status, sehingga
     * kartu tetap terbaca maknanya tanpa harus mengandalkan warna latar.
     */
    public function kartuKpi(
        float $x,
        float $y,
        float $w,
        float $h,
        string $label,
        string $nilai,
        string $satuan = '',
        string $warna = self::BIRU,
    ): string {
        $out = $this->bentuk('roundRect', $x, $y, $w, $h, [
            'isi' => self::PUTIH,
            'garis' => 'E2E8F0',
            'adj' => '<a:gd name="adj" fmla="val 8000"/>',
        ]);

        $out .= $this->bentuk('rect', $x, $y + $h * 0.18, self::CM * 0.12, $h * 0.64, [
            'isi' => $warna,
        ]);

        $out .= $this->teks($label, $x + self::CM * 0.35, $y + $h * 0.12, $w - self::CM * 0.6, $h * 0.26, [
            'ukuran' => 800, 'tebal' => true, 'warna' => self::ABU_TUA, 'rata' => 'l',
        ]);

        $out .= $this->teks($nilai, $x + self::CM * 0.35, $y + $h * 0.32, $w - self::CM * 0.6, $h * 0.42, [
            'ukuran' => 2000, 'tebal' => true, 'warna' => $warna, 'rata' => 'l', 'anchor' => 'ctr',
        ]);

        if ($satuan !== '') {
            $out .= $this->teks($satuan, $x + self::CM * 0.35, $y + $h * 0.72, $w - self::CM * 0.6, $h * 0.22, [
                'ukuran' => 800, 'warna' => self::ABU, 'rata' => 'l',
            ]);
        }

        return $out;
    }

    /**
     * Donat: irisan pie dengan lubang putih di tengah.
     *
     * @param  array<int, array{label: string, nilai: float, warna: string}>  $bagian
     */
    public function donat(
        float $x,
        float $y,
        float $diameter,
        array $bagian,
        string $tengahAtas = '',
        string $tengahBawah = '',
    ): string {
        $total = array_sum(array_column($bagian, 'nilai'));
        $out = '';

        if ($total <= 0) {
            $out .= $this->bentuk('ellipse', $x, $y, $diameter, $diameter, ['isi' => self::ABU_MUDA]);
        } else {
            // Mulai dari arah jam 12 supaya terbaca seperti diagram baku.
            $mulai = -90.0;

            foreach ($bagian as $b) {
                if ($b['nilai'] <= 0) {
                    continue;
                }

                $sudut = ($b['nilai'] / $total) * 360;
                $akhir = $mulai + $sudut;

                // Satu bagian penuh tidak bisa digambar sebagai pie 360°;
                // lingkaran utuh yang dipakai.
                $out .= $sudut >= 359.9
                    ? $this->bentuk('ellipse', $x, $y, $diameter, $diameter, ['isi' => $b['warna']])
                    : $this->bentuk('pie', $x, $y, $diameter, $diameter, [
                        'isi' => $b['warna'],
                        'adj' => '<a:gd name="adj1" fmla="val '.(int) round($mulai * 60000).'"/>'
                            .'<a:gd name="adj2" fmla="val '.(int) round($akhir * 60000).'"/>',
                    ]);

                $mulai = $akhir;
            }
        }

        $lubang = $diameter * 0.56;
        $geser = ($diameter - $lubang) / 2;
        $out .= $this->bentuk('ellipse', $x + $geser, $y + $geser, $lubang, $lubang, [
            'isi' => self::PUTIH,
        ]);

        if ($tengahAtas !== '') {
            $out .= $this->teks($tengahAtas, $x + $geser, $y + $geser + $lubang * 0.16, $lubang, $lubang * 0.42, [
                'ukuran' => 1600, 'tebal' => true, 'warna' => self::TEKS,
            ]);
        }

        if ($tengahBawah !== '') {
            $out .= $this->teks($tengahBawah, $x + $geser, $y + $geser + $lubang * 0.56, $lubang, $lubang * 0.3, [
                'ukuran' => 800, 'warna' => self::ABU_TUA,
            ]);
        }

        return $out;
    }

    /**
     * Cincin progres: busur sebesar persentase di atas cincin latar.
     */
    public function cincinProgres(
        float $x,
        float $y,
        float $diameter,
        float $persen,
        string $warna = self::BIRU,
        string $keterangan = '',
    ): string {
        $tebal = 22000; // fraksi jari-jari pada blockArc

        $out = $this->bentuk('blockArc', $x, $y, $diameter, $diameter, [
            'isi' => self::ABU_MUDA,
            'adj' => '<a:gd name="adj1" fmla="val 0"/><a:gd name="adj2" fmla="val 21599999"/>'
                .'<a:gd name="adj3" fmla="val '.$tebal.'"/>',
        ]);

        $persen = max(0, min(100, $persen));

        if ($persen > 0) {
            // blockArc: sudut mulai dan akhir, 1/60000 derajat; jam 12 = -90°.
            $mulai = -90 * 60000;
            $akhir = (int) round((-90 + ($persen / 100) * 360) * 60000);

            $out .= $this->bentuk('blockArc', $x, $y, $diameter, $diameter, [
                'isi' => $warna,
                'adj' => '<a:gd name="adj1" fmla="val '.$mulai.'"/>'
                    .'<a:gd name="adj2" fmla="val '.$akhir.'"/>'
                    .'<a:gd name="adj3" fmla="val '.$tebal.'"/>',
            ]);
        }

        $out .= $this->teks(
            number_format($persen, 1, ',', '.').'%',
            $x,
            $y + $diameter * 0.34,
            $diameter,
            $diameter * 0.24,
            ['ukuran' => 1800, 'tebal' => true, 'warna' => $warna],
        );

        if ($keterangan !== '') {
            $out .= $this->teks($keterangan, $x, $y + $diameter * 0.56, $diameter, $diameter * 0.16, [
                'ukuran' => 800, 'warna' => self::ABU_TUA,
            ]);
        }

        return $out;
    }

    /**
     * Batang tegak berkelompok.
     *
     * @param  array<int, string>  $kategori
     * @param  array<int, array{label: string, warna: string, nilai: array<int, float>}>  $seri
     */
    public function batang(
        float $x,
        float $y,
        float $w,
        float $h,
        array $kategori,
        array $seri,
        string $satuan = '',
    ): string {
        $out = $this->bingkaiPlot($x, $y, $w, $h);

        $maks = 0.0;
        foreach ($seri as $s) {
            $maks = max($maks, ...array_map(fn ($v) => (float) $v, $s['nilai'] ?: [0]));
        }
        $maks = $maks > 0 ? $maks : 1;

        $tinggiPlot = $h - self::CM * 0.9;
        $lebarKategori = count($kategori) > 0 ? $w / count($kategori) : $w;
        $jumlahSeri = max(1, count($seri));
        $lebarBatang = ($lebarKategori * 0.62) / $jumlahSeri;

        foreach ($kategori as $i => $nama) {
            $kiri = $x + $i * $lebarKategori + $lebarKategori * 0.19;

            foreach ($seri as $j => $s) {
                $nilai = (float) ($s['nilai'][$i] ?? 0);
                $tinggi = $tinggiPlot * ($nilai / $maks);
                $bx = $kiri + $j * $lebarBatang;

                if ($tinggi > 0) {
                    $out .= $this->bentuk('rect', $bx, $y + $tinggiPlot - $tinggi, $lebarBatang * 0.86, $tinggi, [
                        'isi' => $s['warna'],
                    ]);
                }

                $out .= $this->teks(
                    $this->ringkas($nilai),
                    $bx - self::CM * 0.2,
                    $y + $tinggiPlot - $tinggi - self::CM * 0.45,
                    $lebarBatang * 0.86 + self::CM * 0.4,
                    self::CM * 0.42,
                    ['ukuran' => 700, 'tebal' => true, 'warna' => self::ABU_TUA],
                );
            }

            $out .= $this->teks($nama, $x + $i * $lebarKategori, $y + $tinggiPlot + self::CM * 0.08, $lebarKategori, self::CM * 0.6, [
                'ukuran' => 750, 'warna' => self::ABU_TUA,
            ]);
        }

        return $out.$this->legenda($x, $y + $h - self::CM * 0.2, $w, $seri, $satuan);
    }

    /**
     * Batang mendatar untuk peringkat — nama kategori tetap terbaca.
     *
     * @param  array<int, array{label: string, nilai: float, warna: string, keterangan?: string}>  $baris
     */
    public function batangHorizontal(
        float $x,
        float $y,
        float $w,
        float $h,
        array $baris,
        float $maks = 100,
    ): string {
        if ($baris === []) {
            return $this->teks('Data belum tersedia', $x, $y + $h / 2, $w, self::CM, [
                'ukuran' => 1000, 'warna' => self::AMBER,
            ]);
        }

        $out = '';
        $tinggiBaris = $h / count($baris);
        $lebarLabel = $w * 0.28;
        $lebarBar = $w * 0.56;
        $maks = $maks > 0 ? $maks : 1;

        foreach ($baris as $i => $b) {
            $by = $y + $i * $tinggiBaris;
            $tebal = min($tinggiBaris * 0.52, self::CM * 0.5);
            $tengah = $by + ($tinggiBaris - $tebal) / 2;

            $out .= $this->teks($b['label'], $x, $by, $lebarLabel, $tinggiBaris, [
                'ukuran' => 800, 'rata' => 'l', 'warna' => self::TEKS,
            ]);

            $out .= $this->bentuk('roundRect', $x + $lebarLabel, $tengah, $lebarBar, $tebal, [
                'isi' => self::ABU_MUDA,
                'adj' => '<a:gd name="adj" fmla="val 50000"/>',
            ]);

            $panjang = $lebarBar * (min((float) $b['nilai'], $maks) / $maks);

            if ($panjang > 0) {
                $out .= $this->bentuk('roundRect', $x + $lebarLabel, $tengah, $panjang, $tebal, [
                    'isi' => $b['warna'],
                    'adj' => '<a:gd name="adj" fmla="val 50000"/>',
                ]);
            }

            $out .= $this->teks(
                $b['keterangan'] ?? (number_format((float) $b['nilai'], 1, ',', '.').'%'),
                $x + $lebarLabel + $lebarBar + self::CM * 0.1,
                $by,
                $w - $lebarLabel - $lebarBar - self::CM * 0.1,
                $tinggiBaris,
                ['ukuran' => 800, 'tebal' => true, 'rata' => 'l', 'warna' => self::ABU_TUA],
            );
        }

        return $out;
    }

    /**
     * Batang bertumpuk — komposisi status per kategori.
     *
     * @param  array<int, string>  $kategori
     * @param  array<int, array{label: string, warna: string, nilai: array<int, float>}>  $seri
     */
    public function batangBertumpuk(
        float $x,
        float $y,
        float $w,
        float $h,
        array $kategori,
        array $seri,
    ): string {
        $out = $this->bingkaiPlot($x, $y, $w, $h);
        $tinggiPlot = $h - self::CM * 0.9;

        $total = [];
        foreach ($kategori as $i => $_) {
            $total[$i] = array_sum(array_map(fn ($s) => (float) ($s['nilai'][$i] ?? 0), $seri));
        }
        $maks = max(1, ...$total);

        $lebarKategori = count($kategori) > 0 ? $w / count($kategori) : $w;
        $lebarBatang = $lebarKategori * 0.5;

        foreach ($kategori as $i => $nama) {
            $bx = $x + $i * $lebarKategori + ($lebarKategori - $lebarBatang) / 2;
            $bawah = $y + $tinggiPlot;

            foreach ($seri as $s) {
                $nilai = (float) ($s['nilai'][$i] ?? 0);

                if ($nilai <= 0) {
                    continue;
                }

                $tinggi = $tinggiPlot * ($nilai / $maks);
                $bawah -= $tinggi;

                $out .= $this->bentuk('rect', $bx, $bawah, $lebarBatang, $tinggi, [
                    'isi' => $s['warna'],
                    'teks' => $tinggi > self::CM * 0.4 ? (string) (int) $nilai : '',
                    'ukuran' => 700,
                    'tebal' => true,
                    'warna' => self::PUTIH,
                ]);
            }

            $out .= $this->teks($nama, $x + $i * $lebarKategori, $y + $tinggiPlot + self::CM * 0.08, $lebarKategori, self::CM * 0.6, [
                'ukuran' => 700, 'warna' => self::ABU_TUA,
            ]);
        }

        return $out.$this->legenda($x, $y + $h - self::CM * 0.2, $w, $seri);
    }

    /**
     * Kurva garis banyak seri — dipakai kurva S rencana vs realisasi.
     *
     * @param  array<int, string>  $sumbuX
     * @param  array<int, array{label: string, warna: string, nilai: array<int, float|null>}>  $seri
     */
    public function kurva(
        float $x,
        float $y,
        float $w,
        float $h,
        array $sumbuX,
        array $seri,
        float $maks = 100,
    ): string {
        $tinggiPlot = $h - self::CM * 0.9;
        $out = $this->bingkaiPlot($x, $y, $w, $h);

        // Garis bantu 0/25/50/75/100 supaya nilainya bisa dibaca tanpa sumbu.
        foreach ([0, 25, 50, 75, 100] as $persen) {
            $gy = $y + $tinggiPlot - $tinggiPlot * ($persen / 100);
            $out .= $this->bentuk('line', $x, $gy, $w, 1, ['garis' => 'E2E8F0', 'tebalGaris' => 6350]);
            $out .= $this->teks($persen.'%', $x - self::CM * 0.95, $gy - self::CM * 0.22, self::CM * 0.9, self::CM * 0.44, [
                'ukuran' => 700, 'warna' => self::ABU, 'rata' => 'r',
            ]);
        }

        $jumlah = max(1, count($sumbuX));
        $jarak = $jumlah > 1 ? $w / ($jumlah - 1) : $w;
        $maks = $maks > 0 ? $maks : 1;

        foreach ($seri as $s) {
            $titik = [];

            foreach ($sumbuX as $i => $_) {
                $nilai = $s['nilai'][$i] ?? null;

                if ($nilai === null) {
                    continue;
                }

                $titik[] = [
                    $x + ($jumlah > 1 ? $i * $jarak : $w / 2),
                    $y + $tinggiPlot - $tinggiPlot * (min((float) $nilai, $maks) / $maks),
                ];
            }

            $out .= $this->polyline($titik, $s['warna']);

            foreach ($titik as [$px, $py]) {
                $r = self::CM * 0.11;
                $out .= $this->bentuk('ellipse', $px - $r, $py - $r, $r * 2, $r * 2, [
                    'isi' => $s['warna'], 'garis' => self::PUTIH, 'tebalGaris' => 9525,
                ]);
            }
        }

        foreach ($sumbuX as $i => $nama) {
            $px = $x + ($jumlah > 1 ? $i * $jarak : $w / 2);
            $out .= $this->teks($nama, $px - $jarak / 2, $y + $tinggiPlot + self::CM * 0.08, max($jarak, self::CM), self::CM * 0.5, [
                'ukuran' => 700, 'warna' => self::ABU_TUA,
            ]);
        }

        return $out.$this->legenda($x, $y + $h - self::CM * 0.2, $w, $seri);
    }

    /**
     * Garis patah melalui sederet titik, sebagai satu bentuk custGeom.
     *
     * @param  array<int, array{0: float, 1: float}>  $titik
     */
    private function polyline(array $titik, string $warna): string
    {
        if (count($titik) < 2) {
            return '';
        }

        $xs = array_column($titik, 0);
        $ys = array_column($titik, 1);
        $x0 = min($xs);
        $y0 = min($ys);
        $w = max(1.0, max($xs) - $x0);
        $h = max(1.0, max($ys) - $y0);

        $jalur = '<a:moveTo><a:pt x="'.(int) ($titik[0][0] - $x0).'" y="'.(int) ($titik[0][1] - $y0).'"/></a:moveTo>';

        foreach (array_slice($titik, 1) as [$px, $py]) {
            $jalur .= '<a:lnTo><a:pt x="'.(int) ($px - $x0).'" y="'.(int) ($py - $y0).'"/></a:lnTo>';
        }

        return '<p:sp><p:nvSpPr><p:cNvPr id="'.$this->idBaru().'" name="Kurva"/>'
            .'<p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            .'<p:spPr><a:xfrm><a:off x="'.(int) $x0.'" y="'.(int) $y0.'"/>'
            .'<a:ext cx="'.(int) $w.'" cy="'.(int) $h.'"/></a:xfrm>'
            .'<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/>'
            .'<a:rect l="0" t="0" r="r" b="b"/>'
            .'<a:pathLst><a:path w="'.(int) $w.'" h="'.(int) $h.'">'.$jalur.'</a:path></a:pathLst>'
            .'</a:custGeom><a:noFill/>'
            .'<a:ln w="28575" cap="rnd"><a:solidFill><a:srgbClr val="'.$warna.'"/></a:solidFill>'
            .'<a:round/></a:ln></p:spPr>'
            .'<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>';
    }

    /** Latar area plot, memberi batas visual pada grafik. */
    private function bingkaiPlot(float $x, float $y, float $w, float $h): string
    {
        return $this->bentuk('rect', $x, $y, $w, $h - self::CM * 0.9, ['isi' => 'FAFCFF']);
    }

    /**
     * @param  array<int, array{label: string, warna: string}>  $seri
     */
    private function legenda(float $x, float $y, float $w, array $seri, string $satuan = ''): string
    {
        $out = '';
        $lebar = count($seri) > 0 ? min($w / count($seri), self::CM * 5) : $w;

        foreach ($seri as $i => $s) {
            $lx = $x + $i * $lebar;
            $out .= $this->bentuk('roundRect', $lx, $y + self::CM * 0.06, self::CM * 0.28, self::CM * 0.28, [
                'isi' => $s['warna'],
                'adj' => '<a:gd name="adj" fmla="val 30000"/>',
            ]);
            $out .= $this->teks($s['label'], $lx + self::CM * 0.36, $y, $lebar - self::CM * 0.4, self::CM * 0.42, [
                'ukuran' => 750, 'rata' => 'l', 'warna' => self::ABU_TUA,
            ]);
        }

        if ($satuan !== '') {
            $out .= $this->teks($satuan, $x + $w - self::CM * 3, $y, self::CM * 3, self::CM * 0.42, [
                'ukuran' => 700, 'rata' => 'r', 'warna' => self::ABU,
            ]);
        }

        return $out;
    }

    /**
     * Kotak Key Insight — poin ringkas yang dihitung dari data.
     *
     * @param  array<int, string>  $poin
     */
    public function insight(float $x, float $y, float $w, float $h, array $poin): string
    {
        $out = $this->bentuk('roundRect', $x, $y, $w, $h, [
            'isi' => 'F8FAFC',
            'garis' => 'CBD5E1',
            'adj' => '<a:gd name="adj" fmla="val 6000"/>',
        ]);

        $out .= $this->bentuk('rect', $x, $y + self::CM * 0.15, self::CM * 0.1, $h - self::CM * 0.3, [
            'isi' => self::AMBER,
        ]);

        $out .= $this->teks('KEY INSIGHT', $x + self::CM * 0.35, $y + self::CM * 0.12, $w - self::CM * 0.6, self::CM * 0.42, [
            'ukuran' => 800, 'tebal' => true, 'warna' => self::AMBER, 'rata' => 'l',
        ]);

        $isi = implode("\n", array_map(fn ($p) => '•  '.$p, $poin));

        $out .= $this->teks($isi, $x + self::CM * 0.35, $y + self::CM * 0.6, $w - self::CM * 0.7, $h - self::CM * 0.75, [
            'ukuran' => 850, 'rata' => 'l', 'warna' => self::ABU_TUA, 'anchor' => 't',
        ]);

        return $out;
    }

    /** Angka ringkas untuk label grafik: 1.234 → 1,2 rb; 51.377.500.000 → 51,4 M. */
    public function ringkas(float $nilai): string
    {
        $abs = abs($nilai);

        return match (true) {
            $abs >= 1_000_000_000 => number_format($nilai / 1_000_000_000, 1, ',', '.').' M',
            $abs >= 1_000_000 => number_format($nilai / 1_000_000, 1, ',', '.').' jt',
            $abs >= 10_000 => number_format($nilai / 1_000, 1, ',', '.').' rb',
            $abs >= 100 => number_format($nilai, 0, ',', '.'),
            default => rtrim(rtrim(number_format($nilai, 1, ',', '.'), '0'), ','),
        };
    }
}
