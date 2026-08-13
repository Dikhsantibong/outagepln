<?php

namespace App\Http\Controllers;

use App\Models\DailyBriefing;
use App\Models\DailyBriefingAttendee;
use App\Models\DailyBriefingIssue;
use App\Support\TahunFilter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailyBriefingController extends Controller
{
    public function index(Request $request)
    {
        $query = DailyBriefing::withCount('attendees');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('judul', 'like', "%{$search}%")
                    ->orWhere('lokasi', 'like', "%{$search}%")
                    ->orWhere('unit', 'like', "%{$search}%");
            });
        }

        match ($request->input('status')) {
            'berlangsung' => $query->where('status', 'active')->whereDate('tanggal', today()),
            'akan_datang' => $query->where('status', 'active')->whereDate('tanggal', '!=', today()),
            'selesai' => $query->where('status', 'completed'),
            default => null,
        };

        $tahunOptions = TahunFilter::options(DailyBriefing::query(), 'tanggal');
        $tahun = TahunFilter::resolve($request->input('tahun'), $tahunOptions);

        if ($tahun !== null) {
            $query->whereYear('tanggal', $tahun);
        }

        if ($request->filled('bulan')) {
            $query->whereMonth('tanggal', $request->input('bulan'));
        }

        $hariIni = today()->toDateString();
        $prio = "CASE WHEN status = 'active' AND DATE(tanggal) = '{$hariIni}' THEN 1"
            . " WHEN status = 'active' THEN 2 ELSE 3 END";

        $briefings = $query
            ->orderByRaw($prio)
            ->orderByRaw("CASE WHEN {$prio} = 2 THEN tanggal END ASC")
            ->orderByRaw("CASE WHEN {$prio} <> 2 THEN tanggal END DESC")
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('daily-briefings/index', [
            'briefings' => $briefings,
            'filters' => array_merge(
                $request->only(['search', 'status', 'tahun', 'bulan']),
                ['tahun' => TahunFilter::label($tahun)],
            ),
            'filterOptions' => [
                'tahun' => $tahunOptions,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'tanggal' => 'required|date',
            'waktu_mulai' => 'nullable|date_format:H:i',
            'lokasi' => 'nullable|string|max:255',
        ]);

        $validated['status'] = 'active';

        DailyBriefing::create($validated);

        return redirect()->back()->with('success', 'Meeting berhasil dibuat.');
    }

    public function show(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['attendees', 'issues']);

        return Inertia::render('daily-briefings/show', [
            'briefing' => $dailyBriefing,
            'attendees' => $dailyBriefing->attendees,
            'issues' => $dailyBriefing->issues,
        ]);
    }

    public function update(Request $request, DailyBriefing $dailyBriefing)
    {
        $validated = $request->validate([
            'unit' => 'nullable|string|max:255',
            'jenis_inspeksi' => 'nullable|string|max:255',
            'rapat_framework' => 'nullable|string|max:255',
            'tgl_performance_test' => 'nullable|string|max:255',
            'jam_setelah_po_terai' => 'nullable|string|max:255',
            'daya_mampu' => 'nullable|string|max:255',
            'nomor_dokumen' => 'nullable|string|max:255',
            'revisi' => 'nullable|string|max:255',
            'tanggal_terbit' => 'nullable|date',
            'nama_mengetahui' => 'nullable|string|max:255',
            'jabatan_mengetahui' => 'nullable|string|max:255',
            'nama_disetujui' => 'nullable|string|max:255',
            'jabatan_disetujui' => 'nullable|string|max:255',
        ]);

        $dailyBriefing->update($validated);

        return redirect()->back()->with('success', 'Data header berhasil disimpan.');
    }

    public function complete(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->update(['status' => 'completed']);
        return redirect()->back()->with('success', 'Status meeting ditandai selesai.');
    }

    public function destroy(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->delete();
        return redirect()->route('daily-briefings.index')->with('success', 'Meeting dihapus.');
    }

    public function storeIssue(Request $request, DailyBriefing $dailyBriefing)
    {
        $validated = $request->validate([
            'permasalahan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:255',
            'pic' => 'nullable|string|max:255',
            'status' => 'required|in:Open,Close',
        ]);

        $dailyBriefing->issues()->create($validated);
        return redirect()->back()->with('success', 'Permasalahan ditambahkan.');
    }

    public function updateIssue(Request $request, DailyBriefing $dailyBriefing, DailyBriefingIssue $issue)
    {
        $validated = $request->validate([
            'permasalahan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:255',
            'pic' => 'nullable|string|max:255',
            'status' => 'required|in:Open,Close',
        ]);

        $issue->update($validated);
        return redirect()->back()->with('success', 'Permasalahan diperbarui.');
    }

    public function destroyIssue(DailyBriefing $dailyBriefing, DailyBriefingIssue $issue)
    {
        $issue->delete();
        return redirect()->back()->with('success', 'Permasalahan dihapus.');
    }

    public function qrDisplay(DailyBriefing $dailyBriefing)
    {
        return Inertia::render('daily-briefings/qr', [
            'briefing' => $dailyBriefing,
            'attendUrl' => route('daily-briefings.attend.form', $dailyBriefing->token),
        ]);
    }

    public function attendeesJson(DailyBriefing $dailyBriefing)
    {
        return response()->json($dailyBriefing->attendees);
    }

    public function attendForm(string $token)
    {
        $briefing = DailyBriefing::with('attendees')->where('token', $token)->firstOrFail();

        return Inertia::render('daily-briefings/attend', [
            'briefing' => $briefing,
            'token' => $token,
        ]);
    }

    public function submitAttendance(Request $request, string $token)
    {
        $briefing = DailyBriefing::where('token', $token)->firstOrFail();

        if ($briefing->status === 'completed') {
            return redirect()->back()->with('error', 'Rapat sudah selesai. Tidak dapat mendaftar kehadiran.');
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nid' => 'nullable|string|max:255',
            'instansi' => 'nullable|string|max:255',
            'divisi' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'signature' => 'nullable|string',
        ]);

        DailyBriefingAttendee::create([
            'daily_briefing_id' => $briefing->id,
            'nama' => $validated['nama'],
            'nid' => $validated['nid'] ?? null,
            'instansi' => $validated['instansi'] ?? null,
            'divisi' => $validated['divisi'] ?? null,
            'jabatan' => $validated['jabatan'] ?? null,
            'signature' => $validated['signature'] ?? null,
            'signed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Kehadiran berhasil tercatat. Terima kasih!');
    }

    public function uploadPhoto(Request $request, DailyBriefing $dailyBriefing)
    {
        $request->validate([
            'foto_dokumentasi' => 'required|image|max:5120',
        ]);

        if ($request->hasFile('foto_dokumentasi')) {
            if ($dailyBriefing->foto_dokumentasi) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($dailyBriefing->foto_dokumentasi);
            }
            
            $path = $request->file('foto_dokumentasi')->store('daily_briefings', 'public');
            $dailyBriefing->update(['foto_dokumentasi' => $path]);
        }

        return redirect()->back()->with('success', 'Foto dokumentasi berhasil diunggah.');
    }

    public function exportPdf(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['attendees', 'issues']);

        $pdf = Pdf::loadView('exports.daily-briefing', [
            'briefing' => $dailyBriefing,
        ]);

        // A4 Portrait or Landscape? The image looks like landscape given the width.
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download("Daily-Meeting-{$dailyBriefing->id}.pdf");
    }

    public function exportExcel(DailyBriefing $dailyBriefing)
    {
        $dailyBriefing->load(['attendees', 'issues']);
        
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\DailyBriefingExport($dailyBriefing), 
            "Daily-Meeting-{$dailyBriefing->id}.xlsx"
        );
    }
}
