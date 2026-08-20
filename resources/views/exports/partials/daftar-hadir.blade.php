{{--
    Lembar Daftar Hadir peserta rapat.

    Dipakai bersama oleh notulen temuan (meeting-issues) dan notulen kick off
    (meeting-kickoff) agar setiap berkas cetak selalu menyertakan daftar hadir.
    Butuh variabel $meeting yang relasi attendees-nya sudah dimuat.
--}}
@php($__peserta = $meeting->attendees ?? collect())
<div style="page-break-before: always;"></div>

<div style="text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 4px;">DAFTAR HADIR PESERTA RAPAT</div>
<div style="text-align: center; font-size: 10px; margin-bottom: 10px; color: #333;">
    {{ $meeting->judul ?? '' }}
    @if(!empty($meeting->tanggal))
        &middot; {{ \Carbon\Carbon::parse($meeting->tanggal)->translatedFormat('d F Y') }}
    @endif
</div>

<table style="width: 100%; border-collapse: collapse; font-size: 9px;">
    <thead>
        <tr>
            <th style="border: 1px solid #000; padding: 4px; background-color: #f2f2f2; width: 4%; text-align: center;">No</th>
            <th style="border: 1px solid #000; padding: 4px; background-color: #f2f2f2; text-align: center;">Nama</th>
            <th style="border: 1px solid #000; padding: 4px; background-color: #f2f2f2; width: 12%; text-align: center;">NID</th>
            <th style="border: 1px solid #000; padding: 4px; background-color: #f2f2f2; text-align: center;">Instansi / Divisi</th>
            <th style="border: 1px solid #000; padding: 4px; background-color: #f2f2f2; text-align: center;">Jabatan</th>
            <th style="border: 1px solid #000; padding: 4px; background-color: #f2f2f2; width: 20%; text-align: center;">Tanda Tangan</th>
        </tr>
    </thead>
    <tbody>
        @forelse($__peserta as $i => $att)
            <tr>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">{{ $i + 1 }}</td>
                <td style="border: 1px solid #000; padding: 4px;">{{ $att->nama }}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">{{ $att->nid ?: '-' }}</td>
                <td style="border: 1px solid #000; padding: 4px;">{{ $att->instansi ?: ($att->divisi ?: '-') }}</td>
                <td style="border: 1px solid #000; padding: 4px;">{{ $att->jabatan ?: '-' }}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center; height: 34px;">
                    @if($att->signature)
                        <img src="{{ $att->signature }}" style="max-height: 32px; max-width: 130px;" alt="TTD">
                    @endif
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="6" style="border: 1px solid #000; padding: 24px; text-align: center; color: #777; font-style: italic;">
                    Belum ada peserta yang mengisi daftar hadir.
                </td>
            </tr>
        @endforelse
    </tbody>
</table>
