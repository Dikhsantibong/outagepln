<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Rekap Outage - {{ $info['mesin'] }}</title>
    <style>
        @page { margin: 10mm; }
        body { margin: 0; padding: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 9px; color: #000; }
        div, p, table, thead, tbody, tr, th, td, img, span { margin: 0; padding: 0; box-sizing: border-box; }

        table.frame { width: 100%; border-collapse: collapse; border: 2px solid #000; }
        table.frame td, table.frame th { border: 1px solid #000; padding: 3px 5px; }

        .kop-logo { width: 15%; text-align: center; vertical-align: middle; }
        .kop-judul { width: 62%; text-align: center; vertical-align: middle; font-weight: bold; font-size: 10px; line-height: 1.6; }
        .kop-logo img { max-height: 42px; max-width: 100%; }

        .meta { font-size: 8.5px; }
        .meta-label { width: 12%; font-weight: bold; }

        th.head { background-color: #fff; font-weight: bold; text-align: center; font-size: 8.5px; }
        td.c { text-align: center; }
        td.l { text-align: left; }
        .kategori { font-weight: bold; padding-top: 4px; }
        .kosong-hint { color: #94a3b8; font-style: italic; font-size: 8px; }
        .nowrap-pre { white-space: pre-line; }

        .page-break { page-break-before: always; }
        .dok-grup { margin-bottom: 10px; }
        .dok-judul { font-weight: bold; font-size: 9px; margin-bottom: 1px; }
        .dok-item { font-size: 8.5px; font-weight: bold; margin-bottom: 4px; }
        table.dok-grid { width: 100%; border-collapse: collapse; }
        table.dok-grid td { width: 50%; padding: 4px; text-align: center; vertical-align: top; border: none; }
        table.dok-grid img { width: 100%; height: auto; border: 1px solid #d4d4d4; }
    </style>
</head>
<body>

@foreach (['kegiatan', 'material', 'dokumentasi'] as $lembar)
    @if ($lembar !== 'kegiatan')
        <div class="page-break"></div>
    @endif

    <table class="frame">
        <tr>
            <td class="kop-logo" rowspan="3">
                @if ($logoVendor)
                    <img src="{{ $logoVendor }}">
                @else
                    <span class="kosong-hint">logo<br>vendor</span>
                @endif
            </td>
            <td class="kop-judul" colspan="4">LAPORAN REKAP OUTAGE {{ $info['jenis_pekerjaan'] }}</td>
            <td class="kop-logo" rowspan="3">
                @if ($logoPln)
                    <img src="{{ $logoPln }}">
                @endif
            </td>
        </tr>
        <tr>
            <td class="kop-judul" colspan="4">{{ $info['mesin'] }}</td>
        </tr>
        <tr>
            <td class="kop-judul" colspan="4">{{ $info['lokasi'] }}</td>
        </tr>

        <tr class="meta">
            <td class="meta-label">WAKTU PELAKSANAAN</td>
            <td colspan="2">: {{ $outagePlan->real_start ? \Carbon\Carbon::parse($outagePlan->real_start)->format('d/m/Y') : '-' }} s.d {{ $outagePlan->real_stop ? \Carbon\Carbon::parse($outagePlan->real_stop)->format('d/m/Y') : '-' }}</td>
            <td colspan="2">TOTAL HARI : {{ $totalHari ?? '-' }}</td>
            <td class="c">PROGRESS : {{ number_format($overallActual, 0) }} %</td>
        </tr>

        @if ($lembar === 'kegiatan')
            <tr>
                <th class="head" style="width: 7%;">DAY</th>
                <th class="head" style="width: 12%;">TANGGAL</th>
                <th class="head" style="width: 5%;">NO.</th>
                <th class="head" style="width: 44%;">URAIAN PEKERJAAN</th>
                <th class="head" style="width: 10%;">PROGRESS</th>
                <th class="head" style="width: 22%;">KETERANGAN</th>
            </tr>

            @forelse ($outagePlan->dailyProgresses as $idx => $dp)
                @php
                    $items = collect($dp->work_items ?? [])->filter(fn ($w) => filled($w['uraian'] ?? null))->values();
                @endphp

                @if ($items->isEmpty())
                    <tr>
                        <td class="c">Day {{ $idx + 1 }}</td>
                        <td class="c">{{ \Carbon\Carbon::parse($dp->tanggal)->format('d-m-Y') }}</td>
                        <td></td>
                        <td class="l nowrap-pre">{{ $dp->uraian_pekerjaan ?: '-' }}</td>
                        <td class="c">-</td>
                        <td class="l nowrap-pre">{{ $dp->keterangan ?: '-' }}</td>
                    </tr>
                @else
                    @foreach ($items as $itemIdx => $w)
                        <tr>
                            <td class="c">{{ $itemIdx === 0 ? 'Day ' . ($idx + 1) : '' }}</td>
                            <td class="c">{{ $itemIdx === 0 ? \Carbon\Carbon::parse($dp->tanggal)->format('d-m-Y') : '' }}</td>
                            <td class="c">{{ $itemIdx + 1 }}</td>
                            <td class="l">{{ $w['uraian'] }}</td>
                            <td class="c">{{ filled($w['progress'] ?? null) ? number_format((float) $w['progress'], 2, ',', '.') . '%' : '-' }}</td>
                            <td class="l nowrap-pre">{{ $itemIdx === 0 ? ($dp->keterangan ?: '-') : '' }}</td>
                        </tr>
                    @endforeach
                @endif
            @empty
                <tr>
                    <td colspan="6" style="height: 240px; vertical-align: top; text-align: center;">
                        <span class="kosong-hint">Belum ada data progress harian.</span>
                    </td>
                </tr>
            @endforelse
        @elseif ($lembar === 'material')
            <tr>
                <th class="head" colspan="6">MATERIAL / SPARE PART YANG DIGANTI</th>
            </tr>
            <tr>
                <th class="head" style="width: 7%;">DAY</th>
                <th class="head" style="width: 12%;">TANGGAL</th>
                <th class="head" style="width: 32%;">NAMA MATERIAL</th>
                <th class="head" style="width: 24%;">PART NUMBER</th>
                <th class="head" style="width: 7%;">QTY</th>
                <th class="head" style="width: 18%;">KETERANGAN</th>
            </tr>
            @php $adaMaterial = false; @endphp
            @foreach ($outagePlan->dailyProgresses as $idx => $dp)
                @foreach (\App\Support\DailyRingkas::materialRows($dp) as $m)
                    @php $adaMaterial = true; @endphp
                    <tr>
                        <td class="c">Day {{ $idx + 1 }}</td>
                        <td class="c">{{ \Carbon\Carbon::parse($dp->tanggal)->format('d-m-Y') }}</td>
                        <td class="l">{{ $m['nama'] ?: '-' }}</td>
                        <td class="l">{{ $m['part_number'] ?: '-' }}</td>
                        <td class="c">{{ $m['qty'] ?: '-' }}</td>
                        <td class="l nowrap-pre">{{ $m['keterangan'] ?: '-' }}</td>
                    </tr>
                @endforeach
            @endforeach
            @if (!$adaMaterial)
                <tr>
                    <td colspan="6" style="height: 240px; vertical-align: top; text-align: center;">
                        <span class="kosong-hint">Tidak ada pemakaian material.</span>
                    </td>
                </tr>
            @endif
        @elseif ($lembar === 'dokumentasi')
            <tr>
                <th class="head" colspan="6">DOKUMENTASI FOTO HARIAN</th>
            </tr>
            <tr>
                <td colspan="6" style="padding: 10px; vertical-align: top; border: none;">
                    @php
                        $daysWithPhotos = $outagePlan->dailyProgresses->filter(fn ($dp) => filled($dp->photos));
                    @endphp
                    @if ($daysWithPhotos->isNotEmpty())
                        @foreach ($daysWithPhotos as $idx => $dp)
                            @php
                                $uris = \App\Support\OutagePhotos::dataUris($dp->photos);
                            @endphp
                            @if (count($uris) > 0)
                                <div class="dok-grup">
                                    <div class="dok-judul">Day {{ $idx + 1 }} — {{ \Carbon\Carbon::parse($dp->tanggal)->format('l, d F Y') }}</div>
                                    @if ($dp->uraian_pekerjaan)
                                        <div class="dok-item">{{ $dp->uraian_pekerjaan }}</div>
                                    @endif
                                    <table class="dok-grid">
                                        @foreach (array_chunk($uris, 2) as $rowUris)
                                            <tr>
                                                @foreach ($rowUris as $uri)
                                                    <td><img src="{{ $uri }}"></td>
                                                @endforeach
                                                @if (count($rowUris) === 1)
                                                    <td></td>
                                                @endif
                                            </tr>
                                        @endforeach
                                    </table>
                                </div>
                            @endif
                        @endforeach
                    @else
                        <div class="kosong-hint" style="text-align: center; margin-top: 50px;">Tidak ada dokumentasi foto.</div>
                    @endif
                </td>
            </tr>
        @endif
    </table>
@endforeach

</body>
</html>
