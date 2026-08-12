<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Kegiatan Harian - {{ $info['mesin'] }}</title>
    <style>
        /*
         * NOTE: jangan pernah mereset margin lewat `*` atau `html`.
         * dompdf memetakan keduanya ke page box, sehingga @page margin terhapus
         * diam-diam dan dokumen tercetak mepet tepi kertas.
         */
        @page { margin: 10mm; }
        body { margin: 0; padding: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 9px; color: #000; }
        div, p, table, thead, tbody, tr, th, td, img, span { margin: 0; padding: 0; box-sizing: border-box; }

        /* Kerangka luar: seluruh isi laporan berada di dalam satu kotak tebal,
           mengikuti format lembar yang dipakai di lapangan. */
        table.frame { width: 100%; border-collapse: collapse; border: 2px solid #000; }
        table.frame td, table.frame th { border: 1px solid #000; padding: 3px 5px; }

        .kop-logo { width: 15%; text-align: center; vertical-align: middle; }
        .kop-judul { width: 62%; text-align: center; vertical-align: middle; font-weight: bold; font-size: 10px; line-height: 1.6; }
        .kop-logo img { max-height: 42px; max-width: 100%; }

        .meta { font-size: 8.5px; }
        .meta-label { width: 12%; font-weight: bold; }

        th.head { background-color: #fff; font-weight: bold; text-align: center; font-size: 8.5px; }
        td.c { text-align: center; }
        td.r { text-align: right; }
        .kategori { font-weight: bold; padding-top: 4px; }
        .kosong-hint { color: #94a3b8; font-style: italic; font-size: 8px; }

        /* Blok tanda tangan: tinggi tetap agar ada ruang membubuhkan paraf. */
        .ttd { height: 150px; vertical-align: top; text-align: center; font-size: 8.5px; line-height: 1.7; }
        .ttd-nama { font-weight: bold; text-decoration: underline; }

        /* Dokumentasi: tiap kelompok pekerjaan tidak boleh terpotong halaman. */
        .dok-grup { page-break-inside: avoid; margin-bottom: 10px; }
        .dok-judul { font-weight: bold; font-size: 9px; margin-bottom: 1px; }
        .dok-item { font-size: 8.5px; font-weight: bold; margin-bottom: 4px; }
        table.dok-grid { width: 100%; border-collapse: collapse; }
        table.dok-grid td { width: 50%; padding: 4px; text-align: center; vertical-align: top; border: none; }
        table.dok-grid img { width: 100%; height: auto; border: 1px solid #d4d4d4; }
    </style>
</head>
<body>

@foreach (['kegiatan', 'dokumentasi'] as $lembar)
    @if ($lembar === 'dokumentasi')
        <div style="page-break-before: always;"></div>
    @endif

    <table class="frame">
        {{-- ─────────── Kop ─────────── --}}
        <tr>
            <td class="kop-logo" rowspan="3">
                @if ($logoVendor)
                    <img src="{{ $logoVendor }}">
                @else
                    <span class="kosong-hint">logo<br>vendor</span>
                @endif
            </td>
            <td class="kop-judul" colspan="3">LAPORAN KEGIATAN HARIAN {{ $info['jenis_pekerjaan'] }}</td>
            <td class="kop-logo" rowspan="3">
                @if ($logoPln)
                    <img src="{{ $logoPln }}">
                @endif
            </td>
        </tr>
        <tr>
            <td class="kop-judul" colspan="3">{{ $info['mesin'] }}</td>
        </tr>
        <tr>
            <td class="kop-judul" colspan="3">{{ $info['lokasi'] }}</td>
        </tr>

        {{-- ─────────── Baris meta ─────────── --}}
        <tr class="meta">
            <td class="meta-label">HARI KE</td>
            <td>: {{ $hari['ke'] }}</td>
            <td colspan="2">PROGRESS HARI KE {{ $hari['ke'] }} : {{ $hari['progress'] }} %</td>
            <td class="c">PAGE : {{ $lembar === 'kegiatan' ? 1 : 2 }} OF 2</td>
        </tr>
        <tr class="meta">
            <td class="meta-label">TANGGAL</td>
            <td colspan="4">: {{ $hari['tanggal'] }}</td>
        </tr>

        @if ($lembar === 'kegiatan')
            {{-- ─────────── Tabel uraian pekerjaan ─────────── --}}
            <tr>
                <th class="head" style="width: 5%;">NO.</th>
                <th class="head" colspan="2">URAIAN PEKERJAAN</th>
                <th class="head" style="width: 15%;">PENANGGUNG JAWAB</th>
                <th class="head" style="width: 12%;">PROGRESS</th>
            </tr>

            @forelse ($pekerjaan as $grup)
                {{-- Baris kategori hanya dicetak bila kelompoknya diberi nama. --}}
                @if ($grup['kategori'] !== '')
                    <tr>
                        <td></td>
                        <td colspan="2" class="kategori">{{ $grup['kategori'] }}</td>
                        <td class="c">{{ $grup['penanggung_jawab'] ?? '' }}</td>
                        <td></td>
                    </tr>
                @endif
                @foreach ($grup['items'] as $i => $item)
                    <tr>
                        <td class="c">{{ $i + 1 }}</td>
                        <td colspan="2">{{ $item['uraian'] }}</td>
                        <td class="c">{{ $item['penanggung_jawab'] ?? '' }}</td>
                        <td class="c">
                            {{ $item['progress'] === null ? '' : number_format($item['progress'], 2, ',', '.') . ' %' }}
                        </td>
                    </tr>
                @endforeach
            @empty
                <tr>
                    <td colspan="5" style="height: 240px; vertical-align: top;">
                        <span class="kosong-hint">Belum ada rincian item pekerjaan. Lihat catatan kebutuhan data.</span>
                    </td>
                </tr>
            @endforelse

            {{-- Ruang sisa supaya tinggi tabel konsisten seperti formulir cetak. --}}
            <tr><td colspan="5" style="height: 60px;"></td></tr>

            {{-- ─────────── Spare part ─────────── --}}
            <tr>
                <th class="head" colspan="5">SPARE PART YANG DIGANTI</th>
            </tr>
            <tr>
                <th class="head" style="width: 5%;">NO.</th>
                <th class="head">NAMA SPARE PART</th>
                <th class="head" style="width: 20%;">PART NUMBER</th>
                <th class="head" style="width: 10%;">QTY</th>
                <th class="head" style="width: 22%;">KETERANGAN</th>
            </tr>
            @forelse ($spareParts as $i => $sp)
                <tr>
                    <td class="c">{{ $i + 1 }}</td>
                    <td>{{ $sp['nama'] }}</td>
                    <td class="c">{{ $sp['part_number'] }}</td>
                    <td class="c">{{ $sp['qty'] ?? '' }}</td>
                    <td>{{ $sp['keterangan'] }}</td>
                </tr>
            @empty
                <tr><td colspan="5" style="height: 150px;"></td></tr>
            @endforelse

            {{-- ─────────── Tanda tangan ─────────── --}}
            <tr>
                <td class="ttd" colspan="1" style="width: 20%;">
                    Mengetahui,<br>
                    <br><br><br><br><br><br>
                    <span class="ttd-nama">{{ $ttd['nama_1'] ?: '' }}</span><br>
                    {{ $ttd['jabatan_1'] ?: '' }}
                </td>
                <td class="ttd" colspan="1" style="width: 25%;">
                    <br>
                    <br><br><br><br><br><br>
                    <span class="ttd-nama">{{ $ttd['nama_2'] ?: '' }}</span><br>
                    {{ $ttd['jabatan_2'] ?: '' }}
                </td>
                <td class="ttd" colspan="2" style="width: 25%;">
                    <br>
                    <br><br><br><br><br><br>
                    <span class="ttd-nama">{{ $ttd['nama_3'] ?: '' }}</span><br>
                    {{ $ttd['jabatan_3'] ?: '' }}
                </td>
                <td class="ttd" colspan="1" style="width: 30%;">
                    Dibuat Oleh,<br>
                    <br><br><br><br><br><br>
                    <span class="ttd-nama">{{ $ttd['nama_4'] ?: '' }}</span><br>
                    {{ $ttd['jabatan_4'] ?: '' }}
                </td>
            </tr>

            {{-- ─────────── Kurva S ─────────── --}}
            <tr>
                <td colspan="5" style="padding: 10px;">
                    <div style="font-weight: bold; text-align: center; font-size: 10px; margin-bottom: 5px;">KURVA S - PLAN VS ACTUAL</div>
                    @if ($chartImage)
                        <img src="{{ $chartImage }}" style="width: 100%; height: auto;">
                    @else
                        <p class="kosong-hint" style="text-align: center; padding: 20px;">Belum ada data progress harian untuk menggambar kurva S.</p>
                    @endif
                </td>
            </tr>
        @else
            {{-- ─────────── Dokumentasi foto ─────────── --}}
            <tr>
                <td colspan="5" style="padding: 8px;">
                    @forelse ($dokumentasi as $grup)
                        <div class="dok-grup">
                            <div class="dok-judul">{{ $grup['kategori'] }}</div>
                            @if ($grup['item'])
                                <div class="dok-item">{{ $grup['item'] }}</div>
                            @endif
                            <table class="dok-grid">
                                @foreach (array_chunk($grup['fotos'], 2) as $pasangan)
                                    <tr>
                                        @foreach ($pasangan as $foto)
                                            <td><img src="{{ $foto }}"></td>
                                        @endforeach
                                        {{-- Penyeimbang agar foto ganjil tidak melar selebar tabel. --}}
                                        @if (count($pasangan) === 1)
                                            <td></td>
                                        @endif
                                    </tr>
                                @endforeach
                            </table>
                        </div>
                    @empty
                        <div style="height: 400px;">
                            <span class="kosong-hint">Belum ada dokumentasi foto untuk hari ini.</span>
                        </div>
                    @endforelse
                </td>
            </tr>
        @endif
    </table>
@endforeach

</body>
</html>
