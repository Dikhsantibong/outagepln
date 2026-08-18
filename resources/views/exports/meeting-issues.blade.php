<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daily Meeting - {{ $meeting->judul }}</title>
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
            border: 1px solid #000;
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
            max-width: 150px;
            height: auto;
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
            border: 1px solid #000;
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
        .page-break { page-break-after: always; }
    </style>
</head>
<body>

    <!-- Header Box -->
    <table class="header-table">
        <tr>
            <td class="logo-cell" rowspan="3">
                <img src="{{ public_path('sidebar-logo.png') }}" alt="Logo PLN">
            </td>
            <td class="title-cell" colspan="2">PT PLN NUSANTARA POWER</td>
            <td class="meta-cell">No. Dokumen: {{ $meeting->nomor_dokumen }}</td>
        </tr>
        <tr>
            <td class="title-cell" colspan="2">INTEGRATED MANAGEMENT SYSTEM</td>
            <td class="meta-cell">No. Revisi: {{ $meeting->revisi }}</td>
        </tr>
        <tr>
            <td class="title-cell" colspan="2">FORMULIR RAPAT PERSIAPAN OUTAGE {{ $meeting->rapat_framework ? '[' . $meeting->rapat_framework . ']' : '' }}</td>
            <td class="meta-cell">Tanggal Terbit: {{ $meeting->tanggal_terbit ? \Carbon\Carbon::parse($meeting->tanggal_terbit)->format('d/m/Y') : '' }}</td>
        </tr>
    </table>

    <!-- Info Detail -->
    <table class="info-grid">
        <tr>
            <td style="width: 15%;">UNIT</td>
            <td style="width: 2%;">:</td>
            <td style="width: 33%;">{{ $meeting->unit }}</td>
            <td style="width: 25%;">TGL PERFORMANCE TEST</td>
            <td style="width: 2%;">:</td>
            <td style="width: 23%;">{{ $meeting->tgl_performance_test }}</td>
        </tr>
        <tr>
            <td>JENIS INSPEKSI</td>
            <td>:</td>
            <td>{{ $meeting->jenis_inspeksi }}</td>
            <td>JAM SETELAH PO TERAI</td>
            <td>:</td>
            <td>{{ $meeting->jam_setelah_po_terai }}</td>
        </tr>
        <tr>
            <td>WAKTU PELAKSANAAN</td>
            <td>:</td>
            <td>{{ \Carbon\Carbon::parse($meeting->tanggal)->format('d/m/Y') }}</td>
            <td>DAYA MAMPU</td>
            <td>:</td>
            <td>{{ $meeting->daya_mampu }}</td>
        </tr>
        <tr>
            <td>RAPAT FRAMEWORK</td>
            <td>:</td>
            <td>{{ $meeting->rapat_framework }}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>
    
    
    <div style="margin-bottom: 15px; font-size: 11px;">
        <span style="font-weight: bold;">Link Absensi Manual:</span> 
        <a href="{{ url('/attend/' . $meeting->token) }}" style="color: blue; text-decoration: underline;">
            {{ url('/attend/' . $meeting->token) }}
        </a>
    </div>

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
            @forelse($meeting->issues as $index => $issue)
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
                Menyetujui,<br><br>
                <div class="ttd-nama">{{ strtoupper($meeting->nama_mengetahui ?: 'ABDUL RAHMAN KADIR') }}</div>
                <div class="ttd-jabatan">{{ strtoupper($meeting->jabatan_mengetahui ?: 'TEAM LEADER OUTAGE MANAGEMENT') }}</div>
            </td>
            <td>
                Kendari, {{ \Carbon\Carbon::parse($meeting->tanggal)->translatedFormat('d F Y') }}<br><br>
                <div class="ttd-nama">{{ strtoupper($meeting->nama_disetujui ?: 'FIRMANSYAH') }}</div>
                <div class="ttd-jabatan">{{ strtoupper($meeting->jabatan_disetujui ?: 'OF OUTAGE MANAGEMENT') }}</div>
            </td>
        </tr>
    </table>

    @if(isset($meeting->kickoffPhotos) && $meeting->kickoffPhotos->count() > 0)
    <div class="page-break"></div>
    <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 20px;">DOKUMENTASI FOTO</div>
    
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
        @foreach($meeting->kickoffPhotos as $index => $photo)
            @if($index > 0 && $index % 2 == 0)
                </tr><tr>
            @endif
            <td style="width: 50%; padding: 10px; text-align: center; vertical-align: top;">
                <img src="{{ public_path(str_replace(url('/'), '', $photo->foto)) }}" style="max-width: 90%; height: auto; max-height: 250px; border: 1px solid #ddd; padding: 5px;" alt="Dokumentasi">
                <div style="margin-top: 5px; font-size: 11px;">{{ $photo->caption ?: 'Dokumentasi ' . ($index + 1) }}</div>
            </td>
        @endforeach
        </tr>
    </table>
    @endif


    <!-- Lembar Dokumentasi & Link Absensi -->
    <div style="page-break-before: always;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
                <td style="text-align: center; font-weight: bold; font-size: 14px; background-color: #f2f2f2; border: 1px solid #000; padding: 10px;">
                    DOKUMENTASI RAPAT & LINK ABSENSI
                </td>
            </tr>
        </table>
        
        <div style="text-align: center; margin-bottom: 40px;">
            @if($meeting->foto_dokumentasi)
                <div style="border: 1px solid #000; padding: 10px; display: inline-block; background: #fff;">
                    <img src="{{ public_path('storage/' . $meeting->foto_dokumentasi) }}" style="max-width: 90%; max-height: 500px;" alt="Dokumentasi">
                </div>
            @else
                <div style="padding: 100px; border: 1px solid #000; color: #555; background-color: #f9f9f9;">Belum ada foto dokumentasi yang diunggah.</div>
            @endif
        </div>

        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="border: 1px solid #000; padding: 15px; text-align: center; background-color: #f9f9f9;">
                    <div style="font-weight: bold; font-size: 13px; margin-bottom: 8px;">LINK ABSENSI MANUAL PESERTA RAPAT</div>
                    <div style="margin-bottom: 8px; font-size: 11px; color: #333;">Silakan akses tautan di bawah ini melalui peramban (browser) untuk mengisi daftar hadir:</div>
                    <div style="word-wrap: break-word; word-break: break-all;">
                        <a href="{{ url('/daily-briefings/attend/' . $meeting->token) }}" style="color: #0056b3; text-decoration: underline; font-size: 13px; font-weight: bold;">
                            {{ url('/daily-briefings/attend/' . $meeting->token) }}
                        </a>
                    </div>
                </td>
            </tr>
        </table>
    </div>


    <div style="margin-top: 30px; font-size: 11pt;">
        <strong>Link Absensi Rapat:</strong> <br/>
        <a href="{{ url('/attend/' . $meeting->token) }}">{{ url('/attend/' . $meeting->token) }}</a>
    </div>

    @if($meeting->kickoffPhotos->count() > 0)
    <div class="page-break"></div>
    <div class="header">
        <h2>DOKUMENTASI RAPAT</h2>
        <p><strong>{{ $meeting->judul }}</strong></p>
    </div>
    
    <div style="margin-top: 20px; text-align: center;">
        @foreach($meeting->kickoffPhotos as $photo)
            <div style="margin-bottom: 20px; display: inline-block; width: 45%; margin-right: 2%; vertical-align: top;">
                <img src="{{ public_path(str_replace(url('/'), '', $photo->foto)) }}" style="max-width: 100%; height: auto; max-height: 300px; border: 1px solid #ddd; padding: 5px;" />
                <p style="font-size: 10pt; margin-top: 5px;">{{ $photo->caption ?? 'Dokumentasi' }}</p>
            </div>
        @endforeach
    </div>
    @endif

</body>
</html>
