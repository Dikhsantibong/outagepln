<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Material Temuan Overhaul - {{ $info['judul_rapat'] }}</title>
    <style>
        /*
         * NOTE: never reset margins via `*` or `html` here.
         * dompdf maps both onto the page box and that silently wipes out the
         * @page margin, printing the form edge-to-edge.
         */
        @page { margin: 10mm 10mm 10mm 12mm; }
        body { margin: 0; padding: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 9px; color: #000; }
        div, p, table, thead, tbody, tr, th, td, img, span { margin: 0; padding: 0; box-sizing: border-box; }

        table.doc-head { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        table.doc-head td { border: 1px solid #000; padding: 4px 6px; vertical-align: middle; }
        table.doc-head .logo-cell { width: 24%; text-align: center; }
        table.doc-head .title-cell { width: 52%; text-align: center; font-weight: bold; font-size: 10px; }
        table.doc-head .meta-label { width: 12%; font-weight: bold; }
        table.doc-head .meta-value { width: 12%; }

        table.info { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        table.info td { padding: 2px 4px; font-size: 9.5px; vertical-align: top; }
        table.info .lbl { font-weight: bold; width: 110px; }
        table.info .val { color: #c00000; width: 290px; }

        table.data { width: 100%; border-collapse: collapse; }
        table.data th, table.data td { border: 1px solid #000; padding: 4px 5px; vertical-align: middle; }
        table.data th {
            background-color: #bfbfbf;
            font-weight: bold;
            text-align: center;
            font-size: 9px;
        }
        table.data td { font-size: 8.5px; }
        table.data td.c { text-align: center; }
        table.data td.foto { text-align: center; padding: 3px; }
        table.data td.foto img { max-height: 92px; max-width: 150px; }
        .target-close { background-color: #92d050; text-align: center; font-weight: bold; }
        .target-open  { background-color: #ffe699; text-align: center; font-weight: bold; }
        .nowrap-pre { white-space: pre-line; }
    </style>
</head>
<body>
    <table class="doc-head">
        <tr>
            <td class="logo-cell" rowspan="4">
                @if ($logo)
                    <img src="{{ $logo }}" style="height: 42px;">
                @endif
            </td>
            <td class="title-cell">PT PLN NUSANTARA POWER</td>
            <td class="meta-label">No. Dokumen</td>
            <td class="meta-value"></td>
        </tr>
        <tr>
            <td class="title-cell">INTEGRATED MANAGEMENT SYSTEM</td>
            <td class="meta-label">No. Revisi</td>
            <td class="meta-value">: 00</td>
        </tr>
        <tr>
            <td class="title-cell">FORMULIR</td>
            <td class="meta-label">Tanggal Terbit</td>
            <td class="meta-value">: {{ \Carbon\Carbon::parse($meeting->tanggal)->format('d-m-Y') }}</td>
        </tr>
        <tr>
            <td class="title-cell">MATERIAL TEMUAN OVERHAUL UP KENDARI</td>
            <td class="meta-label">Jumlah Halaman</td>
            <td class="meta-value">: 1 dari 1</td>
        </tr>
    </table>

    <table class="info">
        <tr>
            <td class="lbl">JUDUL RAPAT</td>
            <td class="val">: {{ $info['judul_rapat'] }}</td>
            <td class="lbl">UNIT</td>
            <td class="val">: {{ $info['unit'] }}</td>
        </tr>
        <tr>
            <td class="lbl">JENIS RAPAT</td>
            <td class="val">: {{ $info['tipe_rapat'] }}</td>
            <td class="lbl">JENIS INSPEKSI</td>
            <td class="val">: {{ $info['jenis_inspeksi'] }}</td>
        </tr>
        <tr>
            <td class="lbl">TANGGAL RAPAT</td>
            <td class="val">: {{ $info['tanggal_rapat'] }}</td>
            <td class="lbl">JUMLAH TEMUAN</td>
            <td class="val">: {{ count($findings) }} item</td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th style="width: 3%;">NO</th>
                <th style="width: 7%;">TGL</th>
                <th style="width: 16%;">URAIAN</th>
                <th style="width: 8%;">P/N</th>
                <th style="width: 4%;">QTY</th>
                <th style="width: 6%;">SATUAN</th>
                <th style="width: 14%;">FOTO</th>
                <th style="width: 14%;">KETERANGAN</th>
                <th style="width: 21%;">TINDAK LANJUT</th>
                <th style="width: 7%;">TARGET</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($findings as $i => $f)
                <tr>
                    <td class="c">{{ $i + 1 }}</td>
                    <td class="c">{{ $f->tanggal ? \Carbon\Carbon::parse($f->tanggal)->format('d-m-Y') : '-' }}</td>
                    <td>{{ $f->uraian }}</td>
                    <td class="c">{{ $f->part_number ?: '-' }}</td>
                    <td class="c">{{ $f->qty ?? '-' }}</td>
                    <td class="c">{{ $f->satuan ?: '-' }}</td>
                    <td class="foto">
                        @if ($f->foto)
                            <img src="{{ $f->foto }}">
                        @else
                            -
                        @endif
                    </td>
                    <td>{{ $f->keterangan ?: '-' }}</td>
                    <td class="nowrap-pre">{{ $f->tindak_lanjut ?: '-' }}</td>
                    <td class="{{ strtoupper((string) $f->target) === 'CLOSE' ? 'target-close' : 'target-open' }}">
                        {{ $f->target ?: 'Open' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="10" style="text-align: center; padding: 14px;">Belum ada data temuan.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
