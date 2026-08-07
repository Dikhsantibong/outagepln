<?php
// trigger

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\OutagePlanController;
use App\Http\Controllers\DailyMeetingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KinerjaQualityController;
use App\Http\Controllers\KinerjaTimeController;
use App\Http\Controllers\KinerjaCostController;

Route::get('/', [WelcomeController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('outage-plans', OutagePlanController::class)->only(['index', 'show', 'edit', 'store', 'update', 'destroy']);
    Route::get('outage-plans/{outage_plan}/detail-json', [OutagePlanController::class, 'detailJson'])->name('outage-plans.detail-json');
    Route::get('outage-plans/{outage_plan}/export-pdf', [OutagePlanController::class, 'exportPdf'])->name('outage-plans.export-pdf');
    Route::get('outage-plans/{outage_plan}/export-excel', [OutagePlanController::class, 'exportExcel'])->name('outage-plans.export-excel');
    Route::get('team-outage', function() {
        return inertia('team-outage');
    })->name('team-outage');
    
    // Daily Meeting routes
    Route::resource('daily-meetings', DailyMeetingController::class)->only(['index', 'store', 'show', 'destroy']);
    Route::get('daily-meetings/{dailyMeeting}/qr', [DailyMeetingController::class, 'qrDisplay'])->name('daily-meetings.qr');
    Route::post('daily-meetings/{dailyMeeting}/minutes', [DailyMeetingController::class, 'storeMinutes'])->name('daily-meetings.minutes');
    Route::post('daily-meetings/{dailyMeeting}/complete', [DailyMeetingController::class, 'complete'])->name('daily-meetings.complete');
    Route::get('daily-meetings/{dailyMeeting}/attendees-json', [DailyMeetingController::class, 'attendeesJson'])->name('daily-meetings.attendees-json');

    // Notulen Temuan (material temuan overhaul)
    Route::post('daily-meetings/{dailyMeeting}/findings', [DailyMeetingController::class, 'storeFinding'])->name('daily-meetings.findings.store');
    Route::post('daily-meetings/{dailyMeeting}/findings/{finding}', [DailyMeetingController::class, 'updateFinding'])->name('daily-meetings.findings.update');
    Route::delete('daily-meetings/{dailyMeeting}/findings/{finding}', [DailyMeetingController::class, 'destroyFinding'])->name('daily-meetings.findings.destroy');
    Route::get('daily-meetings/{dailyMeeting}/findings/export-pdf', [DailyMeetingController::class, 'exportFindingsPdf'])->name('daily-meetings.findings.export-pdf');
    Route::get('daily-meetings/{dailyMeeting}/findings/export-excel', [DailyMeetingController::class, 'exportFindingsExcel'])->name('daily-meetings.findings.export-excel');

    // Notulen Kick Off Meeting (rapat P3)
    Route::post('daily-meetings/{dailyMeeting}/kickoff', [DailyMeetingController::class, 'storeKickoff'])->name('daily-meetings.kickoff.store');
    Route::post('daily-meetings/{dailyMeeting}/kickoff/photos', [DailyMeetingController::class, 'storeKickoffPhoto'])->name('daily-meetings.kickoff.photos.store');
    Route::delete('daily-meetings/{dailyMeeting}/kickoff/photos/{photo}', [DailyMeetingController::class, 'destroyKickoffPhoto'])->name('daily-meetings.kickoff.photos.destroy');
    Route::get('daily-meetings/{dailyMeeting}/kickoff/export-pdf', [DailyMeetingController::class, 'exportKickoffPdf'])->name('daily-meetings.kickoff.export-pdf');

    // Kinerja Outage routes
    Route::get('kinerja/on-quality', [KinerjaQualityController::class, 'index'])->name('kinerja.on-quality');
    Route::post('kinerja/on-quality', [KinerjaQualityController::class, 'store'])->name('kinerja.on-quality.store');
    
    Route::get('kinerja/on-time', [KinerjaTimeController::class, 'index'])->name('kinerja.on-time');
    Route::post('kinerja/on-time', [KinerjaTimeController::class, 'store'])->name('kinerja.on-time.store');
    
    Route::get('kinerja/on-cost', [KinerjaCostController::class, 'index'])->name('kinerja.on-cost');
    Route::post('kinerja/on-cost', [KinerjaCostController::class, 'store'])->name('kinerja.on-cost.store');
    Route::get('kinerja/on-scope', fn() => inertia('kinerja/on-scope'))->name('kinerja.on-scope');
    Route::get('kinerja/on-safety', fn() => inertia('kinerja/on-safety'))->name('kinerja.on-safety');
});

// Public attendance routes (no auth - scanned via QR on phone)
Route::get('attend/{token}', [DailyMeetingController::class, 'attendForm'])->name('attend.form');
Route::post('attend/{token}', [DailyMeetingController::class, 'submitAttendance'])->name('attend.submit');

require __DIR__.'/settings.php';
