<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Outage - {{ $outagePlan->mesin_pembangkit }}</title>
    <style>
        /*
         * NOTE: never reset margins via `*` or `html` here.
         * dompdf maps both the universal selector and the root `html` element
         * onto the page box, so either one silently wipes out the @page margin
         * and the report prints edge-to-edge with no margins at all.
         * Reset only `body` and the concrete elements this document uses.
         */
        @page { margin: 18mm 15mm 16mm 18mm; }
        body { margin: 0; padding: 0; }
        div, p, h1, h2, h3, table, thead, tbody, tr, th, td, img, span {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body { font-family: 'Helvetica', Arial, sans-serif; font-size: 11px; color: #1e293b; }
        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #003d7a;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .header-left { display: table-cell; font-size: 9px; font-weight: bold; color: #c00000; text-transform: uppercase; vertical-align: middle; }
        .header-right { display: table-cell; text-align: right; vertical-align: middle; font-size: 9px; color: #64748b; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
        .subtitle { font-size: 10px; color: #64748b; margin-bottom: 14px; }

        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .info-table td { padding: 4px 6px; font-size: 10.5px; vertical-align: top; }
        .info-table .label { width: 110px; color: #64748b; }
        .info-table .sep { width: 10px; }
        .info-box {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 10px;
            width: 32%;
            display: inline-block;
            margin-right: 1%;
        }

        .summary { width: 100%; margin-bottom: 16px; }
        .summary-cell {
            display: table-cell;
            width: 25%;
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: center;
        }
        .summary-row { display: table; width: 100%; border-collapse: collapse; }
        .summary-label { font-size: 8.5px; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
        .summary-value { font-size: 13px; font-weight: bold; color: #0f172a; }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            margin: 10px 0 6px 0;
            padding-bottom: 3px;
            border-bottom: 1px solid #cbd5e1;
        }

        table.data { width: 100%; border-collapse: collapse; font-size: 9.5px; }
        table.data th, table.data td { border: 1px solid #cbd5e1; padding: 4px 6px; }
        table.data th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
        table.data td { text-align: center; }
        table.data td.left { text-align: left; }
        .status-leading { color: #047857; font-weight: bold; }
        .status-onprogres { color: #1d4ed8; font-weight: bold; }
        .status-lagging { color: #b91c1c; font-weight: bold; }
        .status-kosong { color: #94a3b8; }
        /* Uraian pekerjaan menghormati baris baru yang diketik pengguna. */
        .nowrap-pre { white-space: pre-line; }
        /* Tabel dipecah per topik supaya tiap kolom dapat lebar yang layak
           di A4 portrait — satu tabel 9 kolom membuat semuanya sempit. */
        table.rapat { font-size: 8.5px; }
        table.rapat th, table.rapat td { padding: 3px 5px; }

        /*
         * Dokumentasi foto sengaja TIDAK memakai baris tabel.
         *
         * dompdf tidak bisa memecah satu baris tabel yang lebih tinggi dari sisa
         * halaman: barisnya dipindahkan utuh ke halaman berikutnya dan halaman
         * sebelumnya ditinggalkan kosong. Karena itu tiap hari dibuat sebagai
         * blok tersendiri yang boleh berpindah halaman secara wajar.
         */
        .foto-page { page-break-before: always; }
        .foto-hari {
            border: 1px solid #cbd5e1;
            margin-bottom: 10px;
            page-break-inside: avoid;
        }
        .foto-hari-head {
            background-color: #f1f5f9;
            border-bottom: 1px solid #cbd5e1;
            padding: 4px 8px;
            font-size: 9.5px;
            font-weight: bold;
        }
        .foto-hari-uraian {
            padding: 5px 8px;
            font-size: 8.5px;
            color: #334155;
            white-space: pre-line;
            border-bottom: 1px solid #e2e8f0;
        }
        /* Grid dua kolom: lebar sel yang menentukan ukuran foto, sehingga
           gambar tidak pernah meluber melewati batas tabel. */
        table.foto-grid { width: 100%; border-collapse: collapse; }
        table.foto-grid td {
            width: 50%;
            text-align: center;
            padding: 5px;
            vertical-align: top;
        }
        table.foto-grid img { width: 100%; height: auto; }
        .foto-kosong { font-size: 9px; color: #94a3b8; font-style: italic; padding: 8px 0; }

        .footer { margin-top: 8px; font-size: 8.5px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            @if ($logo)
                <img src="{{ $logo }}" style="height: 26px; vertical-align: middle; margin-right: 8px;">
            @endif
            <span style="vertical-align: middle;">UP KENDARI</span>
        </div>
        <div class="header-right">Dicetak: {{ \Carbon\Carbon::now()->translatedFormat('d F Y H:i') }}</div>
    </div>

    <div class="title">Laporan Perencanaan &amp; Realisasi Outage</div>
    <div class="subtitle">{{ $outagePlan->mesin_pembangkit }}</div>

    <table class="info-table">
        <tr>
            <td class="label">Mesin Pembangkit</td>
            <td class="sep">:</td>
            <td>{{ $outagePlan->mesin_pembangkit ?? '-' }}</td>
            <td class="label">Scope</td>
            <td class="sep">:</td>
            <td>{{ $outagePlan->scope ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Jenis Pembangkit</td>
            <td class="sep">:</td>
            <td>{{ $outagePlan->jenis_pembangkit ?? '-' }}</td>
            <td class="label">Status</td>
            <td class="sep">:</td>
            <td>{{ $outagePlan->ket ?? 'OPEN' }}</td>
        </tr>
        <tr>
            <td class="label">Waktu Mulai</td>
            <td class="sep">:</td>
            <td>{{ $outagePlan->start_date ? \Carbon\Carbon::parse($outagePlan->start_date)->format('d-m-Y') : '-' }}</td>
            <td class="label">Waktu Selesai</td>
            <td class="sep">:</td>
            <td>{{ $outagePlan->selesai ? \Carbon\Carbon::parse($outagePlan->selesai)->format('d-m-Y') : '-' }}</td>
        </tr>
        <tr>
            <td class="label">Total Hari</td>
            <td class="sep">:</td>
            <td>{{ $totalHari ? $totalHari . ' Hari' : '-' }}</td>
            <td class="label">Progress Keseluruhan</td>
            <td class="sep">:</td>
            <td>Plan {{ number_format($overallPlan, 0) }}% / Actual {{ number_format($overallActual, 0) }}%</td>
        </tr>
        <tr>
            <td class="label">Sistem</td>
            <td class="sep">:</td>
            <td>{{ $outagePlan->sistem ?? '-' }}</td>
            <td class="label">Realisasi</td>
            <td class="sep">:</td>
            <td>
                {{ $outagePlan->real_start ? \Carbon\Carbon::parse($outagePlan->real_start)->format('d-m-Y') : '-' }}
                s/d
                {{ $outagePlan->real_stop ? \Carbon\Carbon::parse($outagePlan->real_stop)->format('d-m-Y') : '-' }}
                @if ($outagePlan->ket_realisasi)
                    ({{ $outagePlan->ket_realisasi }})
                @endif
            </td>
        </tr>
    </table>

    <div class="section-title">Kurva S - Plan vs Actual</div>
    @if ($chartImage)
        {{-- The chart image carries its own RENCANA/REALISASI legend. --}}
        <img src="{{ $chartImage }}" style="width: 100%; display: block;">
    @else
        <p style="font-size: 10px; color: #94a3b8; font-style: italic;">Belum ada data progress harian.</p>
    @endif

    {{-- 1. Kurva S sebagai tabel: angka di balik grafik di atas. --}}
    <div class="section-title">Tabel Kurva S - Plan vs Actual</div>
    <table class="data rapat">
        <thead>
            <tr>
                <th style="width: 10%;">Day</th>
                <th style="width: 16%;">Tanggal</th>
                <th style="width: 16%;">Plan (%)</th>
                <th style="width: 16%;">Actual (%)</th>
                <th style="width: 16%;">Deviasi</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($outagePlan->dailyProgresses as $idx => $dp)
                @php
                    $statusClass = match ($dp->status) {
                        'Leading' => 'status-leading',
                        'On Progres' => 'status-onprogres',
                        'Lagging' => 'status-lagging',
                        default => 'status-kosong',
                    };
                    // Deviasi hanya bermakna bila kedua nilainya sudah terisi.
                    $deviasi = ($dp->plan_progress === null || $dp->actual_progress === null)
                        ? null
                        : (float) $dp->actual_progress - (float) $dp->plan_progress;
                @endphp
                <tr>
                    <td>Day {{ $idx + 1 }}</td>
                    <td>{{ \Carbon\Carbon::parse($dp->tanggal)->format('d-m-Y') }}</td>
                    <td>{{ $dp->plan_progress === null ? '-' : number_format((float) $dp->plan_progress, 2) . '%' }}</td>
                    <td>{{ $dp->actual_progress === null ? '-' : number_format((float) $dp->actual_progress, 2) . '%' }}</td>
                    <td class="{{ $deviasi === null ? 'status-kosong' : ($deviasi < 0 ? 'status-lagging' : 'status-leading') }}">
                        {{ $deviasi === null ? '-' : ($deviasi > 0 ? '+' : '') . number_format($deviasi, 2) . '%' }}
                    </td>
                    <td class="{{ $statusClass }}">{{ $dp->status }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6">Belum ada data progress harian.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- 2. Uraian pekerjaan beserta material yang dipakai. --}}
    <div class="section-title">Uraian Pekerjaan &amp; Material</div>
    <table class="data rapat">
        <thead>
            <tr>
                <th style="width: 8%;">Day</th>
                <th style="width: 12%;">Tanggal</th>
                <th style="width: 30%;">Uraian Pekerjaan</th>
                <th style="width: 26%;">Material Digunakan</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($outagePlan->dailyProgresses as $idx => $dp)
                <tr>
                    <td>Day {{ $idx + 1 }}</td>
                    <td>{{ \Carbon\Carbon::parse($dp->tanggal)->format('d-m-Y') }}</td>
                    <td class="left nowrap-pre">{{ \App\Support\DailyRingkas::pekerjaan($dp) ?: '-' }}</td>
                    <td class="left nowrap-pre">{{ \App\Support\DailyRingkas::material($dp) ?: '-' }}</td>
                    <td class="left nowrap-pre">{{ $dp->keterangan ?: '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6">Belum ada data progress harian.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- 3. Dokumentasi foto — dimulai di lembar sendiri.

         Tiap hari jadi satu blok, bukan satu baris tabel: baris tabel yang
         tinggi tidak bisa dipecah dompdf dan menyisakan halaman kosong. --}}
    <div class="foto-page">
        <div class="section-title">Dokumentasi Foto</div>

        @php
            // Hanya hari berfoto yang ditampilkan, supaya lembarnya tidak
            // berisi blok kosong berderet.
            $hariBerfoto = $outagePlan->dailyProgresses
                ->map(fn ($dp, $i) => ['no' => $i + 1, 'dp' => $dp, 'fotos' => \App\Support\OutagePhotos::dataUris($dp->photos)])
                ->filter(fn ($r) => $r['fotos'] !== [])
                ->values();
        @endphp

        @forelse ($hariBerfoto as $baris)
            <div class="foto-hari">
                <div class="foto-hari-head">
                    Day {{ $baris['no'] }}
                    &nbsp;&middot;&nbsp;
                    {{ \Carbon\Carbon::parse($baris['dp']->tanggal)->format('d-m-Y') }}
                    @php $material = \App\Support\DailyRingkas::material($baris['dp']); @endphp
                    @if ($material)
                        &nbsp;&middot;&nbsp; {{ str_replace("
", ' · ', $material) }}
                    @endif
                </div>

                @php $uraian = \App\Support\DailyRingkas::pekerjaan($baris['dp']); @endphp
                @if ($uraian)
                    <div class="foto-hari-uraian">{{ $uraian }}</div>
                @endif

                <table class="foto-grid">
                    @foreach (array_chunk($baris['fotos'], 2) as $pasangan)
                        <tr>
                            @foreach ($pasangan as $foto)
                                <td><img src="{{ $foto }}"></td>
                            @endforeach
                            {{-- Sel penyeimbang agar foto ganjil tidak melar selebar tabel. --}}
                            @if (count($pasangan) === 1)
                                <td></td>
                            @endif
                        </tr>
                    @endforeach
                </table>
            </div>
        @empty
            <p class="foto-kosong">Belum ada dokumentasi foto yang diunggah.</p>
        @endforelse
    </div>

    <div class="footer">Dokumen ini dibuat otomatis oleh sistem Outage Monitoring PT PLN Nusantara Power UP Kendari.</div>
</body>
</html>
