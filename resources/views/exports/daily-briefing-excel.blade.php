{{--
    Lembar Excel laporan Daily Meeting.

    Susunannya mengikuti versi PDF (exports.daily-briefing) agar keduanya seragam:
    kop → info → notulen → tanda tangan → dokumentasi & link absensi.

    Dirender lewat Maatwebsite FromView (pembaca HTML PhpSpreadsheet), sehingga
    <img> ikut tertanam sebagai gambar dan atribut height pada <tr> dipakai untuk
    mengatur tinggi baris (mis. ruang paraf).
--}}
<table>
    {{-- ════════════════ KOP ════════════════ --}}
    {{-- Baris kop dibuat lebih tinggi supaya logo (ditempel di sel A1:B3 lewat
         WithDrawings) muat penuh di sini dan tidak turun menimpa baris info. --}}
    <tr height="22">
        <td rowspan="3" colspan="2"></td> {{-- Ruang logo (A:B). --}}
        <td colspan="2" style="font-weight: bold; background-color: #f2f2f2; text-align: center; border: 1px solid #000;">PT PLN NUSANTARA POWER</td>
        <td colspan="2" style="border: 1px solid #000;">No. Dokumen: {{ $briefing->nomor_dokumen }}</td>
    </tr>
    <tr height="22">
        <td colspan="2" style="font-weight: bold; background-color: #f2f2f2; text-align: center; border: 1px solid #000;">INTEGRATED MANAGEMENT SYSTEM</td>
        <td colspan="2" style="border: 1px solid #000;">No. Revisi: {{ $briefing->revisi }}</td>
    </tr>
    <tr height="22">
        <td colspan="2" style="font-weight: bold; background-color: #f2f2f2; text-align: center; border: 1px solid #000;">FORMULIR RAPAT PERSIAPAN OUTAGE {{ $briefing->rapat_framework ? '[' . $briefing->rapat_framework . ']' : '' }}</td>
        <td colspan="2" style="border: 1px solid #000;">Tanggal Terbit: {{ $briefing->tanggal_terbit ? \Carbon\Carbon::parse($briefing->tanggal_terbit)->format('d/m/Y') : '' }}</td>
    </tr>

    <tr height="8"><td colspan="6"></td></tr>

    {{-- ════════════════ INFO ════════════════ --}}
    {{-- Label span 2 kolom dan rata kanan agar menempel ke nilainya — tidak
         terpotong seperti saat berada di satu kolom sempit. --}}
    <tr>
        <td colspan="2" style="font-weight: bold; text-align: right;">UNIT :</td>
        <td>{{ $briefing->unit }}</td>
        <td colspan="2" style="font-weight: bold; text-align: right;">TGL PERFORMANCE TEST :</td>
        <td>{{ $briefing->tgl_performance_test }}</td>
    </tr>
    <tr>
        <td colspan="2" style="font-weight: bold; text-align: right;">JENIS INSPEKSI :</td>
        <td>{{ $briefing->jenis_inspeksi }}</td>
        <td colspan="2" style="font-weight: bold; text-align: right;">JAM SETELAH PO TERAI :</td>
        <td>{{ $briefing->jam_setelah_po_terai }}</td>
    </tr>
    <tr>
        <td colspan="2" style="font-weight: bold; text-align: right;">WAKTU PELAKSANAAN :</td>
        <td>{{ \Carbon\Carbon::parse($briefing->tanggal)->format('d/m/Y') }}</td>
        <td colspan="2" style="font-weight: bold; text-align: right;">DAYA MAMPU :</td>
        <td>{{ $briefing->daya_mampu }}</td>
    </tr>
    <tr>
        <td colspan="2" style="font-weight: bold; text-align: right;">RAPAT FRAMEWORK :</td>
        <td>{{ $briefing->rapat_framework }}</td>
        <td colspan="3"></td>
    </tr>

    <tr height="8"><td colspan="6"></td></tr>
    <tr>
        <td colspan="6" style="font-weight: bold;">NOTULEN RAPAT:</td>
    </tr>

    {{-- ════════════════ NOTULEN ════════════════ --}}
    <tr>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">No</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Permasalahan</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Tindak Lanjut / Solusi</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Target</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">PIC</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Status</th>
    </tr>
    @forelse($briefing->issues as $index => $issue)
    <tr>
        <td style="border: 1px solid #000; text-align: center; vertical-align: top;">{{ $index + 1 }}</td>
        <td style="border: 1px solid #000; vertical-align: top;">{!! nl2br(e($issue->permasalahan)) !!}</td>
        <td style="border: 1px solid #000; vertical-align: top;">{!! nl2br(e($issue->tindak_lanjut)) !!}</td>
        <td style="border: 1px solid #000; text-align: center; vertical-align: top;">{{ $issue->target }}</td>
        <td style="border: 1px solid #000; text-align: center; vertical-align: top;">{{ $issue->pic }}</td>
        <td style="border: 1px solid #000; text-align: center; vertical-align: top;">{{ $issue->status }}</td>
    </tr>
    @empty
    <tr>
        <td colspan="6" style="border: 1px solid #000; text-align: center;">Belum ada permasalahan ditambahkan.</td>
    </tr>
    @endforelse

    {{-- ════════════════ TANDA TANGAN ════════════════ --}}
    {{-- Baris kosong memberi jarak agar tanda tangan tidak menempel ke tabel. --}}
    <tr height="18"><td colspan="6"></td></tr>
    <tr height="18"><td colspan="6"></td></tr>

    <tr>
        <td colspan="3" style="text-align: center;">Menyetujui,</td>
        <td colspan="3" style="text-align: center;">Kendari, {{ \Carbon\Carbon::parse($briefing->tanggal)->translatedFormat('d F Y') }}</td>
    </tr>
    {{-- Ruang untuk paraf/tanda tangan basah. --}}
    <tr height="72"><td colspan="3"></td><td colspan="3"></td></tr>
    <tr>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">{{ strtoupper($briefing->nama_mengetahui ?: 'ABDUL RAHMAN KADIR') }}</td>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">{{ strtoupper($briefing->nama_disetujui ?: 'FIRMANSYAH') }}</td>
    </tr>
    <tr>
        <td colspan="3" style="text-align: center; font-weight: bold;">{{ strtoupper($briefing->jabatan_mengetahui ?: 'TEAM LEADER OUTAGE MANAGEMENT') }}</td>
        <td colspan="3" style="text-align: center; font-weight: bold;">{{ strtoupper($briefing->jabatan_disetujui ?: 'OF OUTAGE MANAGEMENT') }}</td>
    </tr>

    <tr height="16"><td colspan="6"></td></tr>

    {{-- ════════════════ DOKUMENTASI & LINK ABSENSI ════════════════ --}}
    <tr>
        <td colspan="6" style="font-weight: bold; text-align: center; background-color: #f2f2f2; border: 1px solid #000;">DOKUMENTASI RAPAT &amp; LINK ABSENSI</td>
    </tr>
    <tr height="6"><td colspan="6"></td></tr>
    <tr>
        <td colspan="6" style="font-weight: bold;">Foto Dokumentasi:</td>
    </tr>
    <tr>
        <td colspan="6" style="border: 1px solid #000;">
            @if($briefing->foto_dokumentasi)
                <img src="{{ public_path('storage/' . $briefing->foto_dokumentasi) }}" width="450" alt="Dokumentasi Rapat">
            @else
                Belum ada foto dokumentasi yang diunggah.
            @endif
        </td>
    </tr>
    <tr height="6"><td colspan="6"></td></tr>
    <tr>
        <td colspan="6" style="font-weight: bold;">Link Absensi Manual Peserta Rapat:</td>
    </tr>
    <tr>
        <td colspan="6" style="border: 1px solid #000;">{{ url('/daily-briefings/attend/' . $briefing->token) }}</td>
    </tr>
</table>
