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
        <td colspan="2" style="border: 1px solid #000;">No. Dokumen: {{ $meeting->nomor_dokumen }}</td>
    </tr>
    <tr height="22">
        <td colspan="2" style="font-weight: bold; background-color: #f2f2f2; text-align: center; border: 1px solid #000;">INTEGRATED MANAGEMENT SYSTEM</td>
        <td colspan="2" style="border: 1px solid #000;">No. Revisi: {{ $meeting->revisi }}</td>
    </tr>
    <tr height="22">
        <td colspan="2" style="font-weight: bold; background-color: #f2f2f2; text-align: center; border: 1px solid #000;">FORMULIR RAPAT PERSIAPAN OUTAGE {{ $meeting->rapat_framework ? '[' . $meeting->rapat_framework . ']' : '' }}</td>
        <td colspan="2" style="border: 1px solid #000;">Tanggal Terbit: {{ $meeting->tanggal_terbit ? \Carbon\Carbon::parse($meeting->tanggal_terbit)->format('d/m/Y') : '' }}</td>
    </tr>

    <tr height="8"><td colspan="6"></td></tr>

    {{-- ════════════════ INFO ════════════════ --}}
    {{-- Label span 2 kolom dan rata kanan agar menempel ke nilainya — tidak
         terpotong seperti saat berada di satu kolom sempit. --}}
    <tr>
        <td colspan="2" style="font-weight: bold; text-align: right;">UNIT :</td>
        <td>{{ $meeting->unit }}</td>
        <td colspan="2" style="font-weight: bold; text-align: right;">TGL PERFORMANCE TEST :</td>
        <td>{{ $meeting->tgl_performance_test }}</td>
    </tr>
    <tr>
        <td colspan="2" style="font-weight: bold; text-align: right;">JENIS INSPEKSI :</td>
        <td>{{ $meeting->jenis_inspeksi }}</td>
        <td colspan="2" style="font-weight: bold; text-align: right;">JAM SETELAH PO TERAI :</td>
        <td>{{ $meeting->jam_setelah_po_terai }}</td>
    </tr>
    <tr>
        <td colspan="2" style="font-weight: bold; text-align: right;">WAKTU PELAKSANAAN :</td>
        <td>{{ \Carbon\Carbon::parse($meeting->tanggal)->format('d/m/Y') }}</td>
        <td colspan="2" style="font-weight: bold; text-align: right;">DAYA MAMPU :</td>
        <td>{{ $meeting->daya_mampu }}</td>
    </tr>
    <tr>
        <td colspan="2" style="font-weight: bold; text-align: right;">RAPAT FRAMEWORK :</td>
        <td>{{ $meeting->rapat_framework }}</td>
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
    @forelse($meeting->issues as $index => $issue)
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
        <td colspan="3" style="text-align: center;">Kendari, {{ \Carbon\Carbon::parse($meeting->tanggal)->translatedFormat('d F Y') }}</td>
    </tr>
    {{-- Ruang untuk paraf/tanda tangan basah. --}}
    <tr height="72"><td colspan="3"></td><td colspan="3"></td></tr>
    <tr>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">{{ strtoupper($penandatangan['menyetujui_nama']) }}</td>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">{{ strtoupper($penandatangan['staf_nama']) }}</td>
    </tr>
    <tr>
        <td colspan="3" style="text-align: center; font-weight: bold;">{{ strtoupper($penandatangan['menyetujui_jabatan']) }}</td>
        <td colspan="3" style="text-align: center; font-weight: bold;">{{ strtoupper($penandatangan['staf_jabatan']) }}</td>
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
            @if($meeting->foto_dokumentasi)
                <img src="{{ public_path('storage/' . $meeting->foto_dokumentasi) }}" width="450" alt="Dokumentasi Rapat">
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
        <td colspan="6" style="border: 1px solid #000;">{{ url('/daily-briefings/attend/' . $meeting->token) }}</td>
    </tr>

    {{-- ════════════════ DAFTAR HADIR ════════════════ --}}
    <tr height="10"><td colspan="6"></td></tr>
    <tr>
        <td colspan="6" style="font-weight: bold; text-align: center; background-color: #f2f2f2; border: 1px solid #000;">DAFTAR HADIR PESERTA RAPAT</td>
    </tr>
    <tr>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">No</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Nama</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">NID</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Instansi / Divisi</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Jabatan</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Tanda Tangan</th>
    </tr>
    @forelse($meeting->attendees as $i => $att)
    <tr height="42">
        <td style="border: 1px solid #000; text-align: center;">{{ $i + 1 }}</td>
        <td style="border: 1px solid #000;">{{ $att->nama }}</td>
        <td style="border: 1px solid #000; text-align: center;">{{ $att->nid ?: '-' }}</td>
        <td style="border: 1px solid #000;">{{ $att->instansi ?: ($att->divisi ?: '-') }}</td>
        <td style="border: 1px solid #000;">{{ $att->jabatan ?: '-' }}</td>
        <td style="border: 1px solid #000; text-align: center;">
            @if($att->signature)<img src="{{ $att->signature }}" width="110" alt="TTD">@endif
        </td>
    </tr>
    @empty
    <tr>
        <td colspan="6" style="border: 1px solid #000; text-align: center; font-style: italic; color: #777;">Belum ada peserta yang mengisi daftar hadir.</td>
    </tr>
    @endforelse
</table>
