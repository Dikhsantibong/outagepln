const fs = require('fs');

// 1. Update PDF Template
let pdfContent = fs.readFileSync('resources/views/exports/meeting-issues.blade.php', 'utf8');

const linkAbsensiPdf = `
    <div style="margin-bottom: 15px; font-size: 11px;">
        <span style="font-weight: bold;">Link Absensi Manual:</span> 
        <a href="{{ url('/attend/' . $meeting->token) }}" style="color: blue; text-decoration: underline;">
            {{ url('/attend/' . $meeting->token) }}
        </a>
    </div>

    <div style="font-weight: bold; margin-bottom: 5px;">NOTULEN RAPAT:</div>
`;
pdfContent = pdfContent.replace('<div style="font-weight: bold; margin-bottom: 5px;">NOTULEN RAPAT:</div>', linkAbsensiPdf);

const docPhotosPdf = `
    <!-- Tanda Tangan -->
    <table class="ttd-table">
        <tr>
            <td>
                Menyetujui,<br><br>
                <div class="ttd-nama">{{ strtoupper($meeting->nama_mengetahui ?: 'ABDUL RAHMAN KADIR') }}</div>
                <div class="ttd-jabatan">{{ strtoupper($meeting->jabatan_mengetahui ?: 'TEAM LEADER OUTAGE MANAGEMENT') }}</div>
            </td>
            <td>
                Kendari, {{ \\Carbon\\Carbon::parse($meeting->tanggal)->translatedFormat('d F Y') }}<br><br>
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
`;
pdfContent = pdfContent.replace(/<!-- Tanda Tangan -->[\s\S]*?<\/table>/, docPhotosPdf);
fs.writeFileSync('resources/views/exports/meeting-issues.blade.php', pdfContent);

// 2. Update Excel Template
let excelContent = fs.readFileSync('resources/views/exports/meeting-issues-excel.blade.php', 'utf8');

const linkAbsensiExcel = `
    <tr>
        <td colspan="2" style="font-weight: bold;">Link Absensi Manual:</td>
        <td colspan="5"><a href="{{ url('/attend/' . $meeting->token) }}">{{ url('/attend/' . $meeting->token) }}</a></td>
    </tr>
    <tr>
        <td colspan="7"></td>
    </tr>
    <tr>
        <td colspan="7" style="font-weight: bold;">NOTULEN RAPAT:</td>
    </tr>
`;
excelContent = excelContent.replace('<tr>\r\n        <td colspan="7" style="font-weight: bold;">NOTULEN RAPAT:</td>\r\n    </tr>', linkAbsensiExcel);
excelContent = excelContent.replace('<tr>\n        <td colspan="7" style="font-weight: bold;">NOTULEN RAPAT:</td>\n    </tr>', linkAbsensiExcel);


const docPhotosExcel = `
    @if(isset($meeting->kickoffPhotos) && $meeting->kickoffPhotos->count() > 0)
    <tr><td colspan="7"></td></tr>
    <tr>
        <td colspan="7" style="font-weight: bold; text-align: center;">DOKUMENTASI FOTO</td>
    </tr>
    <tr>
        <th style="border: 1px solid #000; font-weight: bold; text-align: center;">No</th>
        <th colspan="2" style="border: 1px solid #000; font-weight: bold; text-align: center;">Keterangan</th>
        <th colspan="4" style="border: 1px solid #000; font-weight: bold; text-align: center;">Link / Foto URL</th>
    </tr>
    @foreach($meeting->kickoffPhotos as $index => $photo)
    <tr>
        <td style="border: 1px solid #000; text-align: center;">{{ $index + 1 }}</td>
        <td colspan="2" style="border: 1px solid #000;">{{ $photo->caption ?: 'Dokumentasi ' . ($index + 1) }}</td>
        <td colspan="4" style="border: 1px solid #000;"><a href="{{ url($photo->foto) }}">{{ url($photo->foto) }}</a></td>
    </tr>
    @endforeach
    @endif
    
    <tr><td colspan="7"></td></tr>
    <tr>
        <td></td>
`;
excelContent = excelContent.replace(/<tr>\s*<td><\/td>\s*<td colspan="2" style="text-align: center;">\s*Menyetujui,/, docPhotosExcel + '        <td colspan="2" style="text-align: center;">\n            Menyetujui,');

fs.writeFileSync('resources/views/exports/meeting-issues-excel.blade.php', excelContent);

console.log('Modified blade templates');
