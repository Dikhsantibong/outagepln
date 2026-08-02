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
        .status-lagging { color: #b91c1c; font-weight: bold; }

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

    <div class="section-title">Riwayat Progress Harian (Perencanaan vs Realisasi)</div>
    <table class="data">
        <thead>
            <tr>
                <th style="width: 8%;">Day</th>
                <th style="width: 12%;">Tanggal</th>
                <th style="width: 10%;">Plan (%)</th>
                <th style="width: 10%;">Actual (%)</th>
                <th style="width: 12%;">Status</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($outagePlan->dailyProgresses as $idx => $dp)
                <tr>
                    <td>Day {{ $idx + 1 }}</td>
                    <td>{{ \Carbon\Carbon::parse($dp->tanggal)->format('d-m-Y') }}</td>
                    <td>{{ number_format($dp->plan_progress, 2) }}%</td>
                    <td>{{ number_format($dp->actual_progress, 2) }}%</td>
                    <td class="{{ $dp->status === 'Leading' ? 'status-leading' : 'status-lagging' }}">{{ $dp->status }}</td>
                    <td class="left">{{ $dp->keterangan ?: '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6">Belum ada data progress harian.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">Dokumen ini dibuat otomatis oleh sistem Outage Monitoring PT PLN Nusantara Power UP Kendari.</div>
</body>
</html>
