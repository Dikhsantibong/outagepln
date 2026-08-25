<?php

namespace App\Http\Controllers;

use App\Exports\LaporanMonevPptx;
use App\Models\OutagePlan;
use App\Support\LaporanMonev;
use App\Support\TahunFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Halaman Summary: pratinjau dan pengunduhan Laporan MONEV Pemeliharaan
 * Periodik (HARDIK) dalam bentuk PPTX lanskap.
 *
 * Sebagian parameter pada format laporan belum punya sumber datanya; halaman ini
 * menyatakannya terbuka supaya jelas mana yang sudah terisi dan mana yang masih
 * menunggu modulnya — lihat [LaporanMonev].
 */
class SummaryController extends Controller
{
    public function index(Request $request)
    {
        $tahunOptions = TahunFilter::options(
            OutagePlan::visibleTo($request->user()),
            'start_date',
        );
        $tahun = TahunFilter::resolve($request->query('tahun'), $tahunOptions);

        $laporan = (new LaporanMonev($tahun, $request->user()))->data();

        return Inertia::render('summary/index', [
            'laporan' => $laporan,
            'filters' => ['tahun' => TahunFilter::label($tahun)],
            'tahunOptions' => $tahunOptions,
            'kesiapan' => $this->kesiapan($laporan),
        ]);
    }

    public function exportPptx(Request $request)
    {
        $tahunOptions = TahunFilter::options(
            OutagePlan::visibleTo($request->user()),
            'start_date',
        );
        $tahun = TahunFilter::resolve($request->query('tahun'), $tahunOptions);

        $laporan = (new LaporanMonev($tahun, $request->user()))->data();
        $isi = (new LaporanMonevPptx($laporan))->render();

        $nama = 'Laporan-MONEV-HARDIK-'
            .Str::slug($laporan['identity']['year'])
            .'-'.now()->format('Ymd')
            .'.pptx';

        return response()->streamDownload(
            fn () => print ($isi),
            $nama,
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        );
    }

    /**
     * Bagian mana dari format laporan yang datanya sudah tersedia.
     *
     * Dipakai halaman untuk menunjukkan lebih dulu apa yang akan terisi dan apa
     * yang akan tercetak sebagai penanda, sehingga tidak perlu mengunduh berkas
     * hanya untuk mengetahuinya.
     *
     * @param  array<string, mixed>  $laporan
     * @return array<int, array<string, string>>
     */
    private function kesiapan(array $laporan): array
    {
        $adaBaris = fn (array $rows) => $rows === [] ? 'kosong' : 'siap';

        return [
            ['bagian' => '1. Identitas laporan', 'status' => 'siap', 'catatan' => 'Unit, periode, tanggal'],
            ['bagian' => '2. Summary HARDIK', 'status' => 'sebagian', 'catatan' => 'PRK murni/luncuran & kontrak belum ada'],
            ['bagian' => '3. Per jenis pembangkit', 'status' => $adaBaris($laporan['plants']), 'catatan' => 'Dari kolom jenis pembangkit'],
            ['bagian' => '4. Progress per site', 'status' => $adaBaris($laporan['sites']), 'catatan' => 'Site diturunkan dari nama mesin'],
            ['bagian' => '5. Detail pekerjaan OH', 'status' => $adaBaris($laporan['maintenance']), 'catatan' => 'Nomor PRK & work order belum ada'],
            ['bagian' => '6. Belum terlaksana', 'status' => $adaBaris($laporan['belum_terlaksana']), 'catatan' => 'Alasan penundaan belum ada kolomnya'],
            ['bagian' => '7–9. SFC & daya mampu', 'status' => $adaBaris($laporan['performance']['rows']), 'catatan' => 'Dari data On Quality'],
            ['bagian' => '10–11. Anggaran AI/AO', 'status' => 'sebagian', 'catatan' => 'Anggaran gabungan; AI/AO belum dipisah'],
            ['bagian' => '12. Luncuran', 'status' => 'belum', 'catatan' => LaporanMonev::DALAM_PENGEMBANGAN],
            ['bagian' => '13. Exception', 'status' => 'sebagian', 'catatan' => 'Exception kontrak & pembayaran belum ada'],
            ['bagian' => '14–15. Kontrak & pembayaran', 'status' => 'belum', 'catatan' => LaporanMonev::DALAM_PENGEMBANGAN],
            ['bagian' => '16. KPI', 'status' => 'sebagian', 'catatan' => 'Realisasi kontrak belum dapat dihitung'],
            ['bagian' => '17. Grafik', 'status' => 'belum', 'catatan' => 'Angkanya sudah ada, grafiknya menyusul'],
            ['bagian' => '18. Kesimpulan otomatis', 'status' => 'siap', 'catatan' => 'Disusun dari angka yang tersedia'],
        ];
    }
}
