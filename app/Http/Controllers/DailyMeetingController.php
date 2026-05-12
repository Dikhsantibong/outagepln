<?php

namespace App\Http\Controllers;

use App\Models\DailyMeeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingMinute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailyMeetingController extends Controller
{
    public function index()
    {
        $meetings = DailyMeeting::withCount('attendees')
            ->latest()
            ->get();

        return Inertia::render('daily-meetings/index', [
            'meetings' => $meetings,
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

        DailyMeeting::create($validated);

        return redirect()->back()->with('success', 'Meeting berhasil dibuat.');
    }

    public function show(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['attendees', 'minutes']);

        return Inertia::render('daily-meetings/show', [
            'meeting' => $dailyMeeting,
            'attendees' => $dailyMeeting->attendees,
            'minutes' => $dailyMeeting->minutes,
        ]);
    }

    public function qrDisplay(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->loadCount('attendees');

        return Inertia::render('daily-meetings/qr-display', [
            'meeting' => $dailyMeeting,
            'attendCount' => $dailyMeeting->attendees_count,
        ]);
    }

    public function attendForm(string $token)
    {
        $meeting = DailyMeeting::where('token', $token)->firstOrFail();

        return Inertia::render('attend', [
            'meeting' => $meeting,
            'token' => $token,
        ]);
    }

    public function submitAttendance(Request $request, string $token)
    {
        $meeting = DailyMeeting::where('token', $token)->firstOrFail();

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'divisi' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'signature' => 'nullable|string',
        ]);

        MeetingAttendee::create([
            'meeting_id' => $meeting->id,
            'nama' => $validated['nama'],
            'divisi' => $validated['divisi'] ?? null,
            'jabatan' => $validated['jabatan'] ?? null,
            'signature' => $validated['signature'] ?? null,
            'signed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Kehadiran berhasil tercatat. Terima kasih!');
    }

    public function storeMinutes(Request $request, DailyMeeting $dailyMeeting)
    {
        $validated = $request->validate([
            'agenda' => 'nullable|string',
            'latar_belakang' => 'nullable|string',
            'pembahasan' => 'nullable|string',
            'hasil_kesepakatan' => 'nullable|string',
        ]);

        MeetingMinute::updateOrCreate(
            ['meeting_id' => $dailyMeeting->id],
            $validated
        );

        return redirect()->back()->with('success', 'Notulen berhasil disimpan.');
    }

    public function complete(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->update([
            'status' => 'completed',
            'waktu_selesai' => now()->format('H:i'),
        ]);

        return redirect()->back()->with('success', 'Meeting selesai.');
    }

    public function attendeesJson(DailyMeeting $dailyMeeting)
    {
        return response()->json([
            'count' => $dailyMeeting->attendees()->count(),
            'attendees' => $dailyMeeting->attendees()->latest()->get(['id', 'nama', 'divisi', 'jabatan', 'signed_at']),
        ]);
    }

    public function destroy(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->delete();
        return redirect()->route('daily-meetings.index')->with('success', 'Meeting berhasil dihapus.');
    }
}
