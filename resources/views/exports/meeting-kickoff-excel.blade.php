@php
    $k = $kickoff;
    $val = fn ($field, $fallback = '') => ($k && filled($k->$field)) ? $k->$field : ($defaults[$field] ?? $fallback);

    // Teks bebas → daftar poin, satu poin per baris tak-kosong (sama seperti PDF).
    $lines = function ($text) {
        if (blank($text)) {
            return [];
        }
        return array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $text)), fn ($l) => $l !== ''));
    };

    $pln = $lines($k->penyampaian_pln ?? null);
    $mitra = $lines($k->penyampaian_mitra ?? null);
    $sepakat = $lines($k->hasil_kesepakatan ?? null);
    $namaMitra = $k && filled($k->nama_mitra) ? $k->nama_mitra : 'Mitra / Vendor';

    $tanggalRapat = \Carbon\Carbon::parse($meeting->tanggal)->locale('id')->isoFormat('dddd, D MMMM Y');
    $tanggalTerbit = $k && $k->tanggal_terbit
        ? \Carbon\Carbon::parse($k->tanggal_terbit)->format('d - m - Y')
        : '.. - .. - ' . now()->year;
    $tanggalTtd = $k && $k->tanggal_ttd
        ? \Carbon\Carbon::parse($k->tanggal_ttd)->locale('id')->isoFormat('D MMMM Y')
        : \Carbon\Carbon::parse($meeting->tanggal)->locale('id')->isoFormat('D MMMM Y');

    $labelKiri = 'font-weight: bold; text-align: right;';
    $judulBagian = 'font-weight: bold;';
    $subJudul = 'font-weight: bold;';
    $kotak = 'border: 1px solid #000;';
    $kop = 'font-weight: bold; text-align: center; border: 1px solid #000;';
@endphp
<table>
    {{-- ══════════════ KOP ══════════════ --}}
    {{-- Sel A1:B3 dikosongkan; logo ditempel mengambang lewat WithDrawings. --}}
    <tr height="18">
        <td rowspan="3" colspan="2" style="{{ $kotak }}"></td>
        <td colspan="2" style="{{ $kop }}">PT PLN NUSANTARA POWER</td>
        <td style="{{ $kotak }}">Nomor Dokumen</td>
        <td style="{{ $kotak }}">: {{ $val('nomor_dokumen') }}</td>
    </tr>
    <tr height="18">
        <td colspan="2" style="{{ $kop }}">INTEGRATED MANAGEMENT SYSTEM</td>
        <td style="{{ $kotak }}">Revisi</td>
        <td style="{{ $kotak }}">: {{ $val('revisi') }}</td>
    </tr>
    <tr height="18">
        <td colspan="2" style="{{ $kop }} font-size: 13px;">FORMULIR NOTULEN RAPAT</td>
        <td style="{{ $kotak }}">Tanggal Terbit</td>
        <td style="{{ $kotak }}">: {{ $tanggalTerbit }}</td>
    </tr>

    <tr height="6"><td colspan="6"></td></tr>

    {{-- ══════════════ META ══════════════ --}}
    <tr>
        <td colspan="2" style="{{ $labelKiri }}">Pimpinan Rapat :</td>
        <td colspan="4">{{ $val('pimpinan_rapat') }}</td>
    </tr>
    <tr>
        <td colspan="2" style="{{ $labelKiri }}">Hari / Tanggal :</td>
        <td colspan="4">{{ $tanggalRapat }}</td>
    </tr>
    <tr>
        <td colspan="2" style="{{ $labelKiri }}">Tempat :</td>
        <td colspan="4">{{ $val('tempat') }}</td>
    </tr>
    <tr>
        <td colspan="2" style="{{ $labelKiri }}">Waktu :</td>
        <td colspan="4">{{ $val('waktu') }}</td>
    </tr>
    <tr>
        <td colspan="2" style="{{ $labelKiri }}">Agenda :</td>
        <td colspan="4">{{ $val('agenda') }}</td>
    </tr>
    <tr>
        <td colspan="2" style="{{ $labelKiri }}">Peserta :</td>
        <td colspan="4">{{ $val('peserta', '(Daftar peserta terlampir)') }}</td>
    </tr>

    <tr height="6"><td colspan="6"></td></tr>

    {{-- ══════════════ I. PEMBAHASAN ══════════════ --}}
    <tr><td colspan="6" style="{{ $judulBagian }}">I. Pembahasan</td></tr>

    <tr><td colspan="6" style="{{ $subJudul }}">&nbsp;&nbsp;A. Penyampaian PLN NP UP Kendari</td></tr>
    @forelse ($pln as $i => $baris)
        <tr>
            <td style="text-align: right;">{{ $i + 1 }}.</td>
            <td colspan="5">{{ $baris }}</td>
        </tr>
    @empty
        <tr><td colspan="6" style="font-style: italic; color: #888;">&nbsp;&nbsp;&nbsp;&nbsp;Belum ada pembahasan.</td></tr>
    @endforelse

    <tr><td colspan="6" style="{{ $subJudul }}">&nbsp;&nbsp;B. Penyampaian {{ $namaMitra }}</td></tr>
    @forelse ($mitra as $i => $baris)
        <tr>
            <td style="text-align: right;">{{ $i + 1 }}.</td>
            <td colspan="5">{{ $baris }}</td>
        </tr>
    @empty
        <tr><td colspan="6" style="font-style: italic; color: #888;">&nbsp;&nbsp;&nbsp;&nbsp;Belum ada penyampaian mitra.</td></tr>
    @endforelse

    <tr><td colspan="6" style="{{ $subJudul }}">&nbsp;&nbsp;C. Hasil Kesepakatan</td></tr>
    @forelse ($sepakat as $i => $baris)
        <tr>
            <td style="text-align: right;">{{ $i + 1 }}.</td>
            <td colspan="5">{{ $baris }}</td>
        </tr>
    @empty
        <tr><td colspan="6" style="font-style: italic; color: #888;">&nbsp;&nbsp;&nbsp;&nbsp;Belum ada hasil kesepakatan.</td></tr>
    @endforelse

    <tr height="6"><td colspan="6"></td></tr>

    {{-- ══════════════ II. LAMPIRAN ══════════════ --}}
    <tr><td colspan="6" style="{{ $judulBagian }}">II. Lampiran</td></tr>

    <tr><td colspan="6" style="{{ $subJudul }}">&nbsp;&nbsp;A. Daftar Hadir / Absensi</td></tr>
    <tr>
        <td></td>
        <td colspan="5">
            @php($absensi = $k && filled($k->link_absensi) ? $k->link_absensi : ($attendUrl ?? null))
            @if (filled($absensi))
                {{ $absensi }}
            @else
                Daftar hadir terlampir ({{ $attendees->count() }} peserta tercatat).
            @endif
        </td>
    </tr>

    {{-- Daftar hadir peserta ikut dicantumkan di berkas. --}}
    <tr height="4"><td colspan="6"></td></tr>
    <tr>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">No</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Nama</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">NID</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Instansi / Divisi</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Jabatan</th>
        <th style="font-weight: bold; background-color: #f2f2f2; border: 1px solid #000; text-align: center;">Tanda Tangan</th>
    </tr>
    @forelse ($attendees as $i => $att)
        <tr height="42">
            <td style="border: 1px solid #000; text-align: center;">{{ $i + 1 }}</td>
            <td style="border: 1px solid #000;">{{ $att->nama }}</td>
            <td style="border: 1px solid #000; text-align: center;">{{ $att->nid ?: '-' }}</td>
            <td style="border: 1px solid #000;">{{ $att->instansi ?: ($att->divisi ?: '-') }}</td>
            <td style="border: 1px solid #000;">{{ $att->jabatan ?: '-' }}</td>
            <td style="border: 1px solid #000; text-align: center;">
                @if ($att->signature)<img src="{{ $att->signature }}" width="110" alt="TTD">@endif
            </td>
        </tr>
    @empty
        <tr>
            <td colspan="6" style="border: 1px solid #000; text-align: center; font-style: italic; color: #888;">Belum ada peserta yang mengisi daftar hadir.</td>
        </tr>
    @endforelse

    <tr height="6"><td colspan="6"></td></tr>
    <tr><td colspan="6" style="{{ $subJudul }}">&nbsp;&nbsp;B. Dokumentasi Rapat</td></tr>
    @forelse ($photos->chunk(2) as $pair)
        <tr height="120">
            @foreach ($pair as $p)
                <td colspan="3" style="text-align: center;">
                    <img src="{{ $p->foto }}" width="200" alt="Dokumentasi">
                </td>
            @endforeach
            @if ($pair->count() === 1)
                <td colspan="3"></td>
            @endif
        </tr>
        <tr>
            @foreach ($pair as $p)
                <td colspan="3" style="text-align: center; font-size: 10px; color: #444;">{{ $p->caption }}</td>
            @endforeach
            @if ($pair->count() === 1)
                <td colspan="3"></td>
            @endif
        </tr>
    @empty
        <tr><td colspan="6" style="font-style: italic; color: #888;">&nbsp;&nbsp;&nbsp;&nbsp;Belum ada dokumentasi rapat.</td></tr>
    @endforelse

    <tr height="10"><td colspan="6"></td></tr>

    {{-- ══════════════ TANDA TANGAN ══════════════ --}}
    <tr>
        <td colspan="3"></td>
        <td colspan="3" style="text-align: center;">{{ $val('kota_ttd', 'Kendari') }}, {{ $tanggalTtd }}</td>
    </tr>
    <tr>
        <td colspan="3" style="text-align: center;">Pimpinan Rapat,</td>
        <td colspan="3" style="text-align: center;">Notulis,</td>
    </tr>
    <tr height="66"><td colspan="3"></td><td colspan="3"></td></tr>
    <tr>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">{{ $penandatangan['menyetujui_nama'] }}</td>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">{{ $penandatangan['staf_nama'] }}</td>
    </tr>
    <tr>
        <td colspan="3" style="text-align: center; font-weight: bold;">{{ $penandatangan['menyetujui_jabatan'] }}</td>
        <td colspan="3" style="text-align: center; font-weight: bold;">{{ $penandatangan['staf_jabatan'] }}</td>
    </tr>
</table>
