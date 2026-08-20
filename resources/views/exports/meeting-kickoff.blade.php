@php
    $k = $kickoff;
    $val = fn ($field, $fallback = '') => ($k && filled($k->$field)) ? $k->$field : ($defaults[$field] ?? $fallback);

    // Renders a free-text block as an ordered list, one item per non-empty line.
    $lines = function ($text) {
        if (blank($text)) {
            return [];
        }
        return array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $text)), fn ($l) => $l !== ''));
    };
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Notulen Kick Off Meeting</title>
    <style>
        /*
         * NOTE: never reset margins via `*` or `html`.
         * dompdf maps both onto the page box and that wipes out the @page margin.
         */
        @page { margin: 14mm 14mm 14mm 16mm; }
        body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000; line-height: 1.45; }
        div, p, table, thead, tbody, tr, th, td, img, span, ol, ul, li { margin: 0; padding: 0; box-sizing: border-box; }

        table.doc-head { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.doc-head td { border: 1px solid #808080; padding: 3px 6px; vertical-align: middle; }
        table.doc-head .logo-cell { width: 27%; text-align: center; }
        table.doc-head .title-cell { width: 36%; text-align: center; font-weight: bold; color: #555; }
        table.doc-head .title-main { font-size: 12px; color: #000; }
        table.doc-head .meta-label { width: 17%; }
        table.doc-head .meta-value { width: 20%; }

        table.meta { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        table.meta td { padding: 1.5px 0; vertical-align: top; font-size: 10px; }
        table.meta .lbl { width: 90px; }
        table.meta .sep { width: 8px; }
        table.meta .lbl2 { width: 85px; }

        .box { border: 1px solid #000; padding: 10px 12px; }
        .sec-title { font-weight: bold; margin: 0 0 5px 0; }
        .sub-title { font-weight: bold; text-decoration: underline; margin: 7px 0 4px 14px; }
        ol.items { margin: 0 0 4px 34px; }
        ol.items li { margin-bottom: 3px; text-align: justify; }
        .empty { color: #888; font-style: italic; margin-left: 34px; }

        .lampiran { margin-left: 14px; }
        .lampiran a { color: #1155cc; }

        table.docs { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.docs td { width: 50%; padding: 5px; text-align: center; vertical-align: top; }
        table.docs img { max-width: 100%; max-height: 150px; border: 1px solid #999; }
        table.docs .cap { font-size: 8.5px; color: #444; margin-top: 3px; }

        table.sign { width: 100%; margin-top: 26px; }
        table.sign td { width: 50%; text-align: center; vertical-align: top; font-size: 10px; }
        .sign-space { height: 58px; }
        .sign-name { font-weight: bold; text-decoration: underline; }
    </style>
</head>
<body>
    <table class="doc-head">
        <tr>
            <td class="logo-cell" rowspan="4">
                @if ($logo)
                    <img src="{{ $logo }}" style="height: 40px;">
                @endif
            </td>
            <td class="title-cell">PT PLN NUSANTARA POWER</td>
            <td class="meta-label">Nomor Dokumen</td>
            <td class="meta-value">: {{ $val('nomor_dokumen') }}</td>
        </tr>
        <tr>
            <td class="title-cell">INTEGRATED MANAGEMENT SYSTEM</td>
            <td class="meta-label">Revisi</td>
            <td class="meta-value">: {{ $val('revisi') }}</td>
        </tr>
        <tr>
            <td class="title-cell title-main" rowspan="2">FORMULIR NOTULEN RAPAT</td>
            <td class="meta-label">Tanggal Terbit</td>
            <td class="meta-value">
                : {{ $k && $k->tanggal_terbit ? \Carbon\Carbon::parse($k->tanggal_terbit)->format('d - m - Y') : '.. - .. - ' . now()->year }}
            </td>
        </tr>
        <tr>
            <td class="meta-label">Halaman</td>
            <td class="meta-value">: 1 dari 1</td>
        </tr>
    </table>

    <table class="meta">
        <tr>
            <td class="lbl">Pimpinan Rapat</td>
            <td class="sep">:</td>
            <td>{{ $val('pimpinan_rapat') }}</td>
            <td class="lbl2">Hari/Tanggal</td>
            <td class="sep">:</td>
            <td>{{ \Carbon\Carbon::parse($meeting->tanggal)->locale('id')->isoFormat('dddd, D MMMM Y') }}</td>
        </tr>
        <tr>
            <td class="lbl">Tempat</td>
            <td class="sep">:</td>
            <td>{{ $val('tempat') }}</td>
            <td class="lbl2">Waktu</td>
            <td class="sep">:</td>
            <td>{{ $val('waktu') }}</td>
        </tr>
        <tr>
            <td class="lbl">Agenda</td>
            <td class="sep">:</td>
            <td colspan="4">{{ $val('agenda') }}</td>
        </tr>
        <tr>
            <td class="lbl">Peserta</td>
            <td class="sep">:</td>
            <td colspan="4">{{ $val('peserta', '(Daftar peserta terlampir)') }}</td>
        </tr>
    </table>

    <div class="box">
        <div class="sec-title">I.&nbsp;&nbsp;&nbsp;Pembahasan</div>

        <div class="sub-title">A.&nbsp;&nbsp;Penyampaian PLN NP UP Kendari</div>
        @php $pln = $lines($k->penyampaian_pln ?? null); @endphp
        @if (count($pln))
            <ol class="items">
                @foreach ($pln as $line)
                    <li>{{ $line }}</li>
                @endforeach
            </ol>
        @else
            <div class="empty">Belum ada pembahasan.</div>
        @endif

        <div class="sub-title">B.&nbsp;&nbsp;Penyampaian {{ $k && filled($k->nama_mitra) ? $k->nama_mitra : 'Mitra / Vendor' }}</div>
        @php $mitra = $lines($k->penyampaian_mitra ?? null); @endphp
        @if (count($mitra))
            <ol class="items">
                @foreach ($mitra as $line)
                    <li>{{ $line }}</li>
                @endforeach
            </ol>
        @else
            <div class="empty">Belum ada penyampaian mitra.</div>
        @endif

        <div class="sub-title">C.&nbsp;&nbsp;Hasil Kesepakatan</div>
        @php $sepakat = $lines($k->hasil_kesepakatan ?? null); @endphp
        @if (count($sepakat))
            <ol class="items">
                @foreach ($sepakat as $line)
                    <li>{{ $line }}</li>
                @endforeach
            </ol>
        @else
            <div class="empty">Belum ada hasil kesepakatan.</div>
        @endif

        <div class="sec-title" style="margin-top: 10px;">II.&nbsp;&nbsp;Lampiran</div>

        <div class="sub-title">A.&nbsp;&nbsp;Daftar Hadir / Absensi</div>
        <div class="lampiran" style="margin-left: 34px;">
            @php($absensi = $k && filled($k->link_absensi) ? $k->link_absensi : ($attendUrl ?? null))
            @if (filled($absensi))
                <a href="{{ $absensi }}">{{ $absensi }}</a>
            @else
                Daftar hadir terlampir ({{ $attendees->count() }} peserta tercatat).
            @endif
        </div>

        <div class="sub-title">B.&nbsp;&nbsp;Dokumentasi Rapat</div>
        @if ($photos->count())
            <table class="docs">
                @foreach ($photos->chunk(2) as $pair)
                    <tr>
                        @foreach ($pair as $p)
                            <td>
                                <img src="{{ $p->foto }}">
                                @if ($p->caption)
                                    <div class="cap">{{ $p->caption }}</div>
                                @endif
                            </td>
                        @endforeach
                        @if ($pair->count() === 1)
                            <td></td>
                        @endif
                    </tr>
                @endforeach
            </table>
        @else
            <div class="empty">Belum ada dokumentasi rapat.</div>
        @endif

        <table class="sign">
            <tr>
                <td>
                    Pimpinan Rapat,
                    <div class="sign-space"></div>
                    <span class="sign-name">{{ $penandatangan['menyetujui_nama'] }}</span><br>
                    {{ $penandatangan['menyetujui_jabatan'] }}
                </td>
                <td>
                    {{ $val('kota_ttd', 'Kendari') }},
                    {{ $k && $k->tanggal_ttd
                        ? \Carbon\Carbon::parse($k->tanggal_ttd)->locale('id')->isoFormat('D MMMM Y')
                        : \Carbon\Carbon::parse($meeting->tanggal)->locale('id')->isoFormat('D MMMM Y') }}<br>
                    Notulis,
                    <div class="sign-space"></div>
                    <span class="sign-name">{{ $penandatangan['staf_nama'] }}</span><br>
                    {{ $penandatangan['staf_jabatan'] }}
                </td>
            </tr>
        </table>
    </div>

    @include('exports.partials.daftar-hadir')
</body>
</html>
