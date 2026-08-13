<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daily Meeting - {{ $briefing->judul }}</title>
    <style>
        @page {
            margin: 1cm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #000;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table {
            margin-bottom: 10px;
            border: 2px solid #000;
        }
        .header-table td, .header-table th {
            border: 1px solid #000;
            padding: 3px 5px;
        }
        .logo-cell {
            width: 15%;
            text-align: center;
            vertical-align: middle;
        }
        .logo-cell img {
            max-width: 90px;
        }
        .title-cell {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            background-color: #f2f2f2;
        }
        .meta-cell {
            width: 30%;
        }
        .content-table {
            border: 2px solid #000;
            margin-bottom: 20px;
        }
        .content-table th, .content-table td {
            border: 1px solid #000;
            padding: 5px;
            vertical-align: top;
        }
        .content-table th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
        }
        .col-no { width: 3%; text-align: center; }
        .col-permasalahan { width: 30%; }
        .col-solusi { width: 35%; }
        .col-target { width: 10%; text-align: center; }
        .col-pic { width: 12%; text-align: center; }
        .col-status { width: 10%; text-align: center; }
        .info-grid {
            margin-bottom: 20px;
            width: 100%;
        }
        .info-grid td {
            padding: 2px 0;
            vertical-align: top;
            font-weight: bold;
        }
        .ttd-table {
            width: 100%;
            margin-top: 30px;
            text-align: center;
        }
        .ttd-table td {
            width: 50%;
            vertical-align: top;
        }
        .ttd-nama {
            font-weight: bold;
            text-decoration: underline;
            margin-top: 60px;
        }
        .ttd-jabatan {
            font-weight: bold;
        }
        .ttd-kota {
            margin-bottom: 60px;
        }
    </style>
</head>
<body>

    <!-- Header Box -->
    <table class="header-table">
        <tr>
            <td class="logo-cell" rowspan="3">
                <img src="{{ public_path('logo.png') }}" alt="Logo PLN">
            </td>
            <td class="title-cell" colspan="2">PT PLN NUSANTARA POWER</td>
            <td class="meta-cell">No. Dokumen: {{ $briefing->nomor_dokumen }}</td>
        </tr>
        <tr>
            <td class="title-cell" colspan="2">INTEGRATED MANAGEMENT SYSTEM</td>
            <td class="meta-cell">No. Revisi: {{ $briefing->revisi }}</td>
        </tr>
        <tr>
            <td class="title-cell" colspan="2">FORMULIR RAPAT PERSIAPAN OUTAGE [{{ $briefing->rapat_framework }}]</td>
            <td class="meta-cell">Tanggal Terbit: {{ $briefing->tanggal_terbit ? \Carbon\Carbon::parse($briefing->tanggal_terbit)->format('d/m/Y') : '' }}</td>
        </tr>
    </table>

    <!-- Info Detail -->
    <table class="info-grid">
        <tr>
            <td style="width: 15%;">UNIT</td>
            <td style="width: 2%;">:</td>
            <td style="width: 33%;">{{ $briefing->unit }}</td>
            <td style="width: 25%;">TGL PERFORMANCE TEST</td>
            <td style="width: 2%;">:</td>
            <td style="width: 23%;">{{ $briefing->tgl_performance_test }}</td>
        </tr>
        <tr>
            <td>JENIS INSPEKSI</td>
            <td>:</td>
            <td>{{ $briefing->jenis_inspeksi }}</td>
            <td>JAM SETELAH PO TERAI</td>
            <td>:</td>
            <td>{{ $briefing->jam_setelah_po_terai }}</td>
        </tr>
        <tr>
            <td>WAKTU PELAKSANAAN</td>
            <td>:</td>
            <td>{{ \Carbon\Carbon::parse($briefing->tanggal)->format('d/m/Y') }}</td>
            <td>DAYA MAMPU</td>
            <td>:</td>
            <td>{{ $briefing->daya_mampu }}</td>
        </tr>
        <tr>
            <td>RAPAT FRAMEWORK</td>
            <td>:</td>
            <td>{{ $briefing->rapat_framework }}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>
    
    <div style="font-weight: bold; margin-bottom: 5px;">NOTULEN RAPAT:</div>

    <!-- Table Content -->
    <table class="content-table">
        <thead>
            <tr>
                <th class="col-no">No</th>
                <th class="col-permasalahan">Permasalahan</th>
                <th class="col-solusi">Tindak Lanjut / Solusi</th>
                <th class="col-target">Target</th>
                <th class="col-pic">PIC</th>
                <th class="col-status">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($briefing->issues as $index => $issue)
            <tr>
                <td class="col-no" style="text-align: center;">{{ $index + 1 }}</td>
                <td class="col-permasalahan">{!! nl2br(e($issue->permasalahan)) !!}</td>
                <td class="col-solusi">{!! nl2br(e($issue->tindak_lanjut)) !!}</td>
                <td class="col-target">{{ $issue->target }}</td>
                <td class="col-pic">{{ $issue->pic }}</td>
                <td class="col-status">{{ $issue->status }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align: center; height: 100px; vertical-align: middle;">Belum ada permasalahan ditambahkan.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Tanda Tangan -->
    <table class="ttd-table">
        <tr>
            <td>
                Mengetahui,<br><br>
                <div class="ttd-nama">{{ $briefing->nama_mengetahui }}</div>
                <div class="ttd-jabatan">{{ $briefing->jabatan_mengetahui }}</div>
            </td>
            <td>
                Kendari, {{ \Carbon\Carbon::parse($briefing->tanggal)->translatedFormat('d F Y') }}<br><br>
                <div class="ttd-nama">{{ $briefing->nama_disetujui }}</div>
                <div class="ttd-jabatan">{{ $briefing->jabatan_disetujui }}</div>
            </td>
        </tr>
    </table>

</body>
</html>
