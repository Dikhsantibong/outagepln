<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kurva S - {{ $info['mesin'] }}</title>
    <style>
        /*
         * Lembar ini dicetak landscape tersendiri.
         *
         * dompdf hanya mengenal satu ukuran halaman per dokumen, jadi orientasi
         * campuran dalam satu berkas tidak bisa dilakukan — lembar kurva S
         * dirender sebagai dokumen landscape terpisah. Jangan reset margin lewat
         * `*` atau `html`: dompdf memetakan keduanya ke page box dan @page
         * margin akan terhapus diam-diam.
         */
        @page { margin: 10mm; }
        body { margin: 0; padding: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 8px; color: #000; }
        div, p, table, thead, tbody, tr, th, td, img, span { margin: 0; padding: 0; box-sizing: border-box; }

        .kop { width: 100%; display: table; margin-bottom: 8px; }
        .kop-sel { display: table-cell; vertical-align: middle; }
        .kop-logo { width: 12%; text-align: center; }
        .kop-logo img { max-height: 40px; }
        .kop-teks { text-align: center; font-weight: bold; font-size: 12px; line-height: 1.5; }

        /* Dua kolom: WBS di kiri, grafik dan identitas di kanan. */
        table.layout { width: 100%; border-collapse: collapse; }
        table.layout > tr > td { vertical-align: top; }
        .kol-wbs { width: 42%; padding-right: 8px; }
        .kol-grafik { width: 58%; }

        table.wbs { width: 100%; border-collapse: collapse; font-size: 6.5px; }
        table.wbs th, table.wbs td { border: 1px solid #94a3b8; padding: 1px 3px; }
        table.wbs th { background-color: #dbeafe; font-weight: bold; text-align: center; font-size: 6.5px; }
        table.wbs td.c { text-align: center; }
        table.wbs tr.induk td { font-weight: bold; background-color: #f1f5f9; }
        table.wbs tr.total td { font-weight: bold; background-color: #dbeafe; }
        .lunas { background-color: #92d050; }
        .sebagian { background-color: #ffe699; }

        table.identitas { width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 6px; }
        table.identitas td { padding: 1px 3px; }
        table.identitas .lbl { width: 18%; font-weight: bold; }
        table.identitas .sep { width: 2%; }

        .judul-kurva { text-align: center; font-weight: bold; font-size: 11px; line-height: 1.5; margin-bottom: 6px; }
        .grafik { border: 1px solid #94a3b8; padding: 4px; }
        .grafik img { width: 100%; height: auto; }
        .kosong-hint { color: #94a3b8; font-style: italic; }
    </style>
</head>
<body>

<div class="kop">
    <div class="kop-sel kop-logo">
        @if ($logoVendor)
            <img src="{{ $logoVendor }}">
        @else
            <span class="kosong-hint">logo vendor</span>
        @endif
    </div>
    <div class="kop-sel kop-teks">
        {{ $info['pelaksana_baris_1'] }}<br>
        {{ $info['pelaksana_baris_2'] }}
    </div>
    <div class="kop-sel kop-logo">
        @if ($logoPln)
            <img src="{{ $logoPln }}">
        @endif
    </div>
</div>

<table class="layout">
    <tr>
        {{-- ─────────── Kiri: rincian bobot pekerjaan (WBS) ─────────── --}}
        <td class="kol-wbs">
            <table class="wbs">
                <thead>
                    <tr>
                        <th style="width: 8%;">NO.</th>
                        <th>URAIAN PEKERJAAN</th>
                        <th style="width: 12%;">BOBOT (%)</th>
                        <th style="width: 16%;">Progress s.d hari ini</th>
                        <th style="width: 16%;">Bobot Progress s.d hari ini (%)</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($wbs as $baris)
                        <tr class="{{ $baris['induk'] ? 'induk' : '' }}">
                            <td class="c">{{ $baris['no'] }}</td>
                            <td>{{ $baris['uraian'] }}</td>
                            <td class="c">{{ $baris['bobot'] === null ? '' : number_format($baris['bobot'], 2) }}</td>
                            @php
                                $p = $baris['progress'];
                                $kelas = $p === null ? '' : ($p >= 100 ? 'lunas' : ($p > 0 ? 'sebagian' : ''));
                            @endphp
                            <td class="c {{ $kelas }}">{{ $p === null ? '' : number_format($p, 2) . '%' }}</td>
                            <td class="c">{{ $baris['bobot_progress'] === null ? '' : number_format($baris['bobot_progress'], 2) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" style="height: 300px; vertical-align: top;">
                                <span class="kosong-hint">
                                    Belum ada rincian bobot pekerjaan (WBS).
                                    Lihat catatan kebutuhan data.
                                </span>
                            </td>
                        </tr>
                    @endforelse

                    @if ($wbs)
                        <tr class="total">
                            <td colspan="2" class="c">TOTAL</td>
                            <td class="c">{{ $wbsTotal['bobot'] === null ? '' : number_format($wbsTotal['bobot'], 2) }}</td>
                            <td></td>
                            <td class="c">{{ $wbsTotal['bobot_progress'] === null ? '' : number_format($wbsTotal['bobot_progress'], 2) }}</td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </td>

        {{-- ─────────── Kanan: identitas dan grafik ─────────── --}}
        <td class="kol-grafik">
            <div class="judul-kurva">
                KURVA S<br>
                PEKERJAAN {{ $info['jenis_pekerjaan'] }} {{ $info['mesin'] }}<br>
                {{ $info['lokasi'] }}
            </div>

            <table class="identitas">
                <tr>
                    <td class="lbl">MESIN</td><td class="sep">:</td><td>{{ $info['tipe_mesin'] }}</td>
                    <td class="lbl">D/O NOMOR</td><td class="sep">:</td><td>{{ $kontrak['do_nomor'] }}</td>
                </tr>
                <tr>
                    <td class="lbl">NO. SERI</td><td class="sep">:</td><td>{{ $info['nomor_seri'] }}</td>
                    <td class="lbl">TANGGAL</td><td class="sep">:</td><td>{{ $kontrak['do_tanggal'] }}</td>
                </tr>
                <tr>
                    <td class="lbl">UNIT</td><td class="sep">:</td><td>{{ $info['unit'] }}</td>
                    <td class="lbl">NO. SURAT PENUNJUKAN</td><td class="sep">:</td><td>{{ $kontrak['surat_nomor'] }}</td>
                </tr>
                <tr>
                    <td class="lbl">ULPLTD</td><td class="sep">:</td><td>{{ $info['ulpltd'] }}</td>
                    <td class="lbl">TANGGAL</td><td class="sep">:</td><td>{{ $kontrak['surat_tanggal'] }}</td>
                </tr>
            </table>

            <div class="grafik">
                @if ($chartImage)
                    <img src="{{ $chartImage }}">
                @else
                    <p class="kosong-hint" style="padding: 40px; text-align: center;">
                        Belum ada data progress harian untuk menggambar kurva S.
                    </p>
                @endif
            </div>
        </td>
    </tr>
</table>

</body>
</html>
