<?php

namespace Tests\Feature;

use App\Models\DailyBriefing;
use App\Models\DailyMeeting;
use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

/**
 * Pemeriksaan menyeluruh dua menu rapat: form inputan, daftar hadir,
 * serta ekspor PDF dan Excel.
 */
class RapatOutageDanDailyMeetingTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        return $user;
    }

    private function meeting(): DailyMeeting
    {
        $plan = OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => now()->format('Y-m-d'),
            'rapat_p3' => '2026-04-15',
        ]);

        return DailyMeeting::where('outage_plan_id', $plan->id)->firstOrFail();
    }

    private function briefing(): DailyBriefing
    {
        return DailyBriefing::create([
            'judul' => 'Daily Meeting PLTD Poasia',
            'tanggal' => '2026-04-15',
            'waktu_mulai' => '09:00',
            'lokasi' => 'Ruang Rapat',
            'status' => 'active',
        ]);
    }

    // ------------------------------------------------------- Rapat Outage

    public function test_halaman_daftar_rapat_outage_terbuka(): void
    {
        $this->admin();
        $this->meeting();

        $this->get('/daily-meetings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('daily-meetings/index'));
    }

    public function test_filter_daftar_rapat_outage_menyaring_hasil(): void
    {
        $this->admin();
        $this->meeting();

        $this->get('/daily-meetings?search=POASIA')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('outagePlans.data', 1));

        $this->get('/daily-meetings?search=TIDAK-ADA')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('outagePlans.data', 0));

        $this->get('/daily-meetings?jenis_rapat=RAPAT P3')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('outagePlans.data', 1));

        $this->get('/daily-meetings?jenis_rapat=RAPAT R3')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('outagePlans.data', 0));
    }

    public function test_halaman_detail_rapat_outage_terbuka(): void
    {
        $this->admin();
        $meeting = $this->meeting();

        $this->get("/daily-meetings/{$meeting->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('daily-meetings/show'));
    }

    public function test_daftar_hadir_rapat_outage_tercatat_dari_qr(): void
    {
        $this->admin();
        $meeting = $this->meeting();

        $this->get("/daily-meetings/{$meeting->id}/qr")->assertOk();

        $this->post("/attend/{$meeting->token}", [
            'nama' => 'Budi Santoso',
            'nid' => '12345',
            'instansi' => 'PLN NP',
            'divisi' => 'Operasi',
            'jabatan' => 'Teknisi',
            'signature' => 'data:image/png;base64,AAAA',
        ])->assertRedirect();

        $this->assertDatabaseHas('meeting_attendees', [
            'nama' => 'Budi Santoso',
            'nid' => '12345',
            'instansi' => 'PLN NP',
        ]);

        // Polling 5 detik menimpa daftar di layar, jadi tanda tangan dan identitas
        // lengkap harus ikut terkirim agar kolomnya tidak mendadak kosong.
        $this->getJson("/daily-meetings/{$meeting->id}/attendees-json")
            ->assertOk()
            ->assertJsonPath('count', 1)
            ->assertJsonPath('attendees.0.nid', '12345')
            ->assertJsonPath('attendees.0.instansi', 'PLN NP')
            ->assertJsonPath('attendees.0.signature', 'data:image/png;base64,AAAA');
    }

    public function test_absensi_ditolak_setelah_rapat_outage_selesai(): void
    {
        $this->admin();
        $meeting = $this->meeting();
        $meeting->update(['status' => 'completed']);

        $this->post("/attend/{$meeting->token}", ['nama' => 'Terlambat'])->assertRedirect();

        $this->assertDatabaseMissing('meeting_attendees', ['nama' => 'Terlambat']);
    }

    public function test_inputan_permasalahan_rapat_outage_bisa_tambah_ubah_hapus(): void
    {
        $this->admin();
        $meeting = $this->meeting();

        $this->post("/daily-meetings/{$meeting->id}/issues", [
            'permasalahan' => 'Kebocoran oli',
            'tindak_lanjut' => 'Ganti seal',
            'target' => '2026-04-20',
            'pic' => 'Rendi',
            'status' => 'Open',
        ])->assertRedirect();

        $issue = $meeting->issues()->firstOrFail();

        $this->put("/daily-meetings/{$meeting->id}/issues/{$issue->id}", [
            'permasalahan' => 'Kebocoran oli parah',
            'tindak_lanjut' => 'Ganti seal',
            'target' => '2026-04-20',
            'pic' => 'Rendi',
            'status' => 'Close',
        ])->assertRedirect();

        $this->assertDatabaseHas('meeting_issues', [
            'permasalahan' => 'Kebocoran oli parah',
            'status' => 'Close',
        ]);

        $this->delete("/daily-meetings/{$meeting->id}/issues/{$issue->id}")->assertRedirect();
        $this->assertDatabaseMissing('meeting_issues', ['id' => $issue->id]);
    }

    public function test_inputan_notulen_kickoff_rapat_outage_tersimpan(): void
    {
        $this->admin();
        $meeting = $this->meeting();

        $this->post("/daily-meetings/{$meeting->id}/kickoff", [
            'tempat' => 'Zoom UP Kendari',
            'agenda' => 'Kick Off OH SO',
            'penyampaian_pln' => 'Poin PLN',
            'hasil_kesepakatan' => 'Sepakat',
        ])->assertRedirect();

        $this->assertDatabaseHas('meeting_kickoffs', [
            'meeting_id' => $meeting->id,
            'agenda' => 'Kick Off OH SO',
        ]);
    }

    public function test_unggah_dokumentasi_rapat_outage_berhasil(): void
    {
        $this->admin();
        $meeting = $this->meeting();

        $this->post("/daily-meetings/{$meeting->id}/kickoff/photos", [
            'foto' => UploadedFile::fake()->image('dokumentasi.jpg', 800, 600),
            'caption' => 'Suasana rapat',
        ])->assertRedirect();

        $this->assertDatabaseHas('meeting_kickoff_photos', [
            'meeting_id' => $meeting->id,
            'caption' => 'Suasana rapat',
        ]);
    }

    public function test_tanggal_realisasi_dan_selesai_rapat_outage(): void
    {
        $this->admin();
        $meeting = $this->meeting();

        $this->post("/daily-meetings/{$meeting->id}/realisasi", ['tanggal_realisasi' => '2026-04-16'])
            ->assertRedirect();

        $this->post("/daily-meetings/{$meeting->id}/complete")->assertRedirect();

        $this->assertSame('completed', $meeting->fresh()->status);
    }

    public function test_ekspor_pdf_dan_excel_rapat_outage(): void
    {
        $this->admin();
        $meeting = $this->meeting();

        $this->get("/daily-meetings/{$meeting->id}/issues/export-pdf")->assertOk();
        $this->get("/daily-meetings/{$meeting->id}/issues/export-excel")->assertOk();
        $this->get("/daily-meetings/{$meeting->id}/kickoff/export-pdf")->assertOk();
        $this->get("/daily-meetings/{$meeting->id}/kickoff/export-excel")->assertOk();
    }

    // ------------------------------------------------------ Daily Meeting

    public function test_halaman_daftar_dan_detail_daily_meeting_terbuka(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $this->get('/daily-briefings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('daily-briefings/index'));

        $this->get("/daily-briefings/{$briefing->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('daily-briefings/show'));
    }

    public function test_filter_daftar_daily_meeting_menyaring_hasil(): void
    {
        $this->admin();
        $this->briefing();

        $this->get('/daily-briefings?search=Poasia')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('briefings.data', 1));

        $this->get('/daily-briefings?search=TIDAK-ADA')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('briefings.data', 0));

        $this->get('/daily-briefings?status=selesai')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('briefings.data', 0));

        $this->get('/daily-briefings?bulan=4&tahun=2026')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('briefings.data', 1));
    }

    /**
     * Rapat tidak lagi dibuat manual — harinya dibentuk otomatis dari pekerjaan
     * yang berjalan — sehingga rute pembuatannya memang sudah tidak ada.
     */
    public function test_pembuatan_rapat_manual_tidak_tersedia_lagi(): void
    {
        $this->admin();

        // 405, bukan 404: alamatnya masih melayani GET untuk daftar rapat,
        // hanya metode POST-nya yang sudah tidak ada.
        $this->post('/daily-briefings', [
            'judul' => 'Daily Meeting Baru',
            'tanggal' => '2026-04-17',
        ])->assertMethodNotAllowed();

        $this->assertSame(0, DailyBriefing::where('judul', 'Daily Meeting Baru')->count());
    }

    public function test_header_daily_meeting_disimpan(): void
    {
        $this->admin();

        $briefing = $this->briefing();

        $this->put("/daily-briefings/{$briefing->id}", [
            'unit' => 'PLTD Poasia',
            'jenis_inspeksi' => 'SO',
            'daya_mampu' => '10 MW',
        ])->assertRedirect();

        $this->assertDatabaseHas('daily_briefings', [
            'id' => $briefing->id,
            'unit' => 'PLTD Poasia',
        ]);
    }

    public function test_daftar_hadir_daily_meeting_tercatat_dari_qr(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $this->get("/daily-briefings/{$briefing->id}/qr")->assertOk();

        $this->post("/daily-briefings/attend/{$briefing->token}", [
            'nama' => 'Siti Aminah',
            'nid' => '54321',
            'instansi' => 'PLN NP',
            'divisi' => 'Har',
            'jabatan' => 'Supervisor',
        ])->assertRedirect();

        $this->assertDatabaseHas('daily_briefing_attendees', ['nama' => 'Siti Aminah']);

        $this->getJson("/daily-briefings/{$briefing->id}/attendees-json")
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_halaman_daily_meeting_menyediakan_link_absensi_manual(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $expected = route('daily-briefings.attend.form', $briefing->token);

        $this->get("/daily-briefings/{$briefing->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('attendUrl', $expected));
    }

    public function test_link_absensi_manual_bisa_dipakai_absen_dan_menampilkan_yang_sudah_hadir(): void
    {
        $briefing = $this->briefing();
        $url = "/daily-briefings/attend/{$briefing->token}";

        // Tautan terbuka tanpa login — peserta tidak punya akun aplikasi.
        $this->post($url, ['nama' => 'Peserta Pertama'])->assertRedirect();

        $this->get($url)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('daily-briefings/attend')
                ->where('briefing.attendees.0.nama', 'Peserta Pertama'));
    }

    public function test_link_absensi_tercantum_pada_notulen_pdf_dan_excel(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $url = route('daily-briefings.attend.form', $briefing->token);

        $pdf = $this->get("/daily-briefings/{$briefing->id}/kickoff/export-pdf");
        $pdf->assertOk();
        $this->assertStringContainsString('application/pdf', $pdf->headers->get('content-type'));

        // Isi PDF diperiksa lewat blade-nya karena keluaran dompdf terkompresi.
        $html = view('exports.briefing-kickoff', [
            'meeting' => $briefing,
            'kickoff' => null,
            'photos' => collect(),
            'attendees' => collect(),
            'defaults' => [],
            'attendUrl' => $url,
            'logo' => null,
        ])->render();

        $this->assertStringContainsString($url, $html);
        $this->assertStringContainsString('href="'.$url.'"', $html);

        $excel = $this->get("/daily-briefings/{$briefing->id}/kickoff/export-excel");
        $excel->assertOk();
        $this->assertStringContainsString($briefing->token, $this->sheetText($excel->streamedContent()));
    }

    public function test_link_absensi_manual_kalah_dari_link_yang_diisi_sendiri(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $this->post("/daily-briefings/{$briefing->id}/kickoff", [
            'link_absensi' => 'https://absensi.internal/rapat-khusus',
        ])->assertRedirect();

        $excel = $this->get("/daily-briefings/{$briefing->id}/kickoff/export-excel");
        $excel->assertOk();

        $teks = $this->sheetText($excel->streamedContent());
        $this->assertStringContainsString('https://absensi.internal/rapat-khusus', $teks);
        $this->assertStringNotContainsString($briefing->token, $teks);
    }

    /** Seluruh teks pada lembar pertama sebuah berkas xlsx. */
    private function sheetText(string $contents): string
    {
        $path = tempnam(sys_get_temp_dir(), 'xlsx').'.xlsx';
        file_put_contents($path, $contents);

        $sheet = IOFactory::load($path)->getActiveSheet();
        $teks = '';

        foreach ($sheet->toArray() as $baris) {
            $teks .= implode(' ', array_map(fn ($sel) => (string) $sel, $baris))."\n";
        }

        unlink($path);

        return $teks;
    }

    public function test_inputan_permasalahan_daily_meeting_bisa_tambah_ubah_hapus(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $this->post("/daily-briefings/{$briefing->id}/issues", [
            'permasalahan' => 'Vibrasi tinggi',
            'tindak_lanjut' => 'Balancing',
            'target' => '2026-04-20',
            'pic' => 'Andi',
            'status' => 'Open',
        ])->assertRedirect();

        $issue = $briefing->issues()->firstOrFail();

        $this->post("/daily-briefings/{$briefing->id}/issues/{$issue->id}", [
            'permasalahan' => 'Vibrasi tinggi sekali',
            'tindak_lanjut' => 'Balancing',
            'target' => '2026-04-20',
            'pic' => 'Andi',
            'status' => 'Close',
        ])->assertRedirect();

        $this->assertDatabaseHas('daily_briefing_issues', ['permasalahan' => 'Vibrasi tinggi sekali']);

        $this->delete("/daily-briefings/{$briefing->id}/issues/{$issue->id}")->assertRedirect();
        $this->assertDatabaseMissing('daily_briefing_issues', ['id' => $issue->id]);
    }

    public function test_inputan_temuan_daily_meeting_bisa_tambah_ubah_hapus(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $this->post("/daily-briefings/{$briefing->id}/findings", [
            'tanggal' => '2026-04-15',
            'uraian' => 'Cylinder head bocor',
            'part_number' => 'PN-001',
            'qty' => 2,
            'satuan' => 'pcs',
            'keterangan' => 'Perlu ganti',
            'tindak_lanjut' => 'Order material',
            'target' => 'Open',
            'foto' => UploadedFile::fake()->image('temuan.jpg', 800, 600),
        ])->assertRedirect();

        $finding = $briefing->findings()->firstOrFail();
        $this->assertStringStartsWith('data:image/jpeg;base64,', $finding->foto);

        $this->post("/daily-briefings/{$briefing->id}/findings/{$finding->id}", [
            'uraian' => 'Cylinder head bocor parah',
            'qty' => 3,
            'target' => 'Close',
        ])->assertRedirect();

        $this->assertDatabaseHas('daily_briefing_findings', [
            'id' => $finding->id,
            'target' => 'Close',
        ]);

        $this->delete("/daily-briefings/{$briefing->id}/findings/{$finding->id}")->assertRedirect();
        $this->assertDatabaseMissing('daily_briefing_findings', ['id' => $finding->id]);
    }

    public function test_inputan_kickoff_dan_dokumentasi_daily_meeting(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $this->post("/daily-briefings/{$briefing->id}/kickoff", [
            'tempat' => 'Ruang A',
            'agenda' => 'Kick Off Harian',
            'hasil_kesepakatan' => 'Sepakat',
        ])->assertRedirect();

        $this->assertDatabaseHas('daily_briefing_kickoffs', ['daily_briefing_id' => $briefing->id]);

        $this->post("/daily-briefings/{$briefing->id}/kickoff/photos", [
            'foto' => UploadedFile::fake()->image('dok.jpg', 800, 600),
            'caption' => 'Dokumentasi',
        ])->assertRedirect();

        $photo = $briefing->kickoffPhotos()->firstOrFail();

        $this->delete("/daily-briefings/{$briefing->id}/kickoff/photos/{$photo->id}")->assertRedirect();
        $this->assertDatabaseMissing('daily_briefing_kickoff_photos', ['id' => $photo->id]);
    }

    public function test_unggah_foto_dokumentasi_daily_meeting(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        Storage::fake('public');

        $this->post("/daily-briefings/{$briefing->id}/photo", [
            'foto_dokumentasi' => UploadedFile::fake()->image('foto.jpg'),
        ])->assertRedirect();

        $this->assertNotNull($briefing->fresh()->foto_dokumentasi);
    }

    public function test_ekspor_pdf_dan_excel_daily_meeting(): void
    {
        $this->admin();
        $briefing = $this->briefing();

        $this->get("/daily-briefings/{$briefing->id}/export-pdf")->assertOk();
        $this->get("/daily-briefings/{$briefing->id}/export-excel")->assertOk();
        $this->get("/daily-briefings/{$briefing->id}/findings/export-pdf")->assertOk();
        $this->get("/daily-briefings/{$briefing->id}/findings/export-excel")->assertOk();
        $this->get("/daily-briefings/{$briefing->id}/kickoff/export-pdf")->assertOk();
        $this->get("/daily-briefings/{$briefing->id}/kickoff/export-excel")->assertOk();
    }
}
