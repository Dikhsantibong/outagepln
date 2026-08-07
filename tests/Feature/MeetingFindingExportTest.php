<?php

namespace Tests\Feature;

use App\Models\DailyMeeting;
use App\Models\MeetingFinding;
use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class MeetingFindingExportTest extends TestCase
{
    use RefreshDatabase;

    private function meeting(): DailyMeeting
    {
        $this->actingAs(User::factory()->create());

        $plan = OutagePlan::create([
            'mesin_pembangkit' => 'PLTD POASIA #02 (MIRRLEES)',
            'scope' => 'SO',
            'jenis_pembangkit' => 'PLTD',
            'start_date' => now()->format('Y-m-d'),
            'rapat_r2' => '2026-04-15',
        ]);

        // Rapat dibuat otomatis oleh OutagePlan saat tanggal rapat diisi.
        $meeting = DailyMeeting::where('outage_plan_id', $plan->id)->firstOrFail();

        MeetingFinding::create([
            'meeting_id' => $meeting->id,
            'tanggal' => '2026-04-15',
            'uraian' => 'Kebocoran pada cylinder head',
            'qty' => 2,
            'satuan' => 'pcs',
            'target' => 'Open',
        ]);

        return $meeting->fresh();
    }

    public function test_halaman_rapat_mengirim_identitas_rapat_untuk_notulen_temuan(): void
    {
        $meeting = $this->meeting();

        $this->get("/daily-meetings/{$meeting->id}")->assertInertia(fn ($page) => $page
            ->where('findingInfo.judul_rapat', $meeting->judul)
            ->where('findingInfo.tipe_rapat', 'RAPAT R2')
            ->where('findingInfo.tanggal_rapat', '15 April 2026')
            ->where('findingInfo.unit', 'PLTD POASIA #02 (MIRRLEES)')
            ->where('findingInfo.jenis_inspeksi', 'SO'));
    }

    public function test_pdf_temuan_memuat_judul_rapat(): void
    {
        $meeting = $this->meeting();

        $response = $this->get("/daily-meetings/{$meeting->id}/findings/export-pdf");

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('rapat-r2', $response->headers->get('content-disposition'));
    }

    public function test_excel_temuan_memuat_judul_jenis_dan_tanggal_rapat(): void
    {
        $meeting = $this->meeting();

        $response = $this->get("/daily-meetings/{$meeting->id}/findings/export-excel");
        $response->assertOk();

        $path = tempnam(sys_get_temp_dir(), 'temuan') . '.xlsx';
        file_put_contents($path, $response->streamedContent());
        $sheet = IOFactory::load($path)->getActiveSheet();

        $this->assertSame('JUDUL RAPAT', $sheet->getCell('A6')->getValue());
        $this->assertSame(': ' . $meeting->judul, $sheet->getCell('C6')->getValue());
        $this->assertSame(': RAPAT R2', $sheet->getCell('C7')->getValue());
        $this->assertSame(': 15 April 2026', $sheet->getCell('C8')->getValue());
        $this->assertSame(': PLTD POASIA #02 (MIRRLEES)', $sheet->getCell('H6')->getValue());
        $this->assertSame(': 1 item', $sheet->getCell('H8')->getValue());

        // Tabel temuan tetap utuh setelah blok identitas ditambah.
        $this->assertSame('NO', $sheet->getCell('A10')->getValue());
        $this->assertSame('Kebocoran pada cylinder head', $sheet->getCell('C11')->getValue());

        unlink($path);
    }
}
