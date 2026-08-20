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
use App\Http\Controllers\Master\UserController as MasterUserController;
use App\Http\Controllers\Master\UnitController as MasterUnitController;
use App\Http\Controllers\Master\MaterialController as MasterMaterialController;

Route::get('/', [WelcomeController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('outage-plans', OutagePlanController::class)->only(['index', 'show', 'edit', 'store', 'update', 'destroy']);
    Route::get('outage-plans/{outage_plan}/detail-json', [OutagePlanController::class, 'detailJson'])->name('outage-plans.detail-json');
    // Laporan Kegiatan Harian: satu berkas per tanggal, bukan per outage plan.
    // Kurva S terpisah karena dicetak landscape — dompdf hanya mengenal satu
    // ukuran halaman per dokumen.
    Route::get('outage-plans/{outage_plan}/laporan-harian/{tanggal}/pdf', [OutagePlanController::class, 'laporanHarianPdf'])->name('outage-plans.laporan-harian');
    Route::get('outage-plans/{outage_plan}/laporan-harian/{tanggal}/excel', [OutagePlanController::class, 'laporanHarianExcel'])->name('outage-plans.laporan-harian-excel');
    Route::get('outage-plans/{outage_plan}/export-pdf', [OutagePlanController::class, 'exportPdf'])->name('outage-plans.export-pdf');
    Route::get('outage-plans/{outage_plan}/export-excel', [OutagePlanController::class, 'exportExcel'])->name('outage-plans.export-excel');
    Route::get('team-outage', function() {
        return inertia('team-outage');
    })->name('team-outage');
    Route::get('summary', function() {
        return inertia('summary/index');
    })->name('summary');

    // Menu Daily Meeting dan Rapat Outage (tidak boleh diakses pengelola)
    Route::middleware(['can:viewMeetings'])->group(function () {
        
        // Daily Meeting (Manual Briefing) routes
        Route::resource('daily-briefings', \App\Http\Controllers\DailyBriefingController::class)->parameters(['daily-briefings' => 'dailyBriefing']);
        Route::post('daily-briefings/{dailyBriefing}/complete', [\App\Http\Controllers\DailyBriefingController::class, 'complete'])->name('daily-briefings.complete');
        Route::get('daily-briefings/{dailyBriefing}/qr', [\App\Http\Controllers\DailyBriefingController::class, 'qrDisplay'])->name('daily-briefings.qr');
        Route::get('daily-briefings/{dailyBriefing}/attendees-json', [\App\Http\Controllers\DailyBriefingController::class, 'attendeesJson'])->name('daily-briefings.attendees-json');
        Route::post('daily-briefings/{dailyBriefing}/issues', [\App\Http\Controllers\DailyBriefingController::class, 'storeIssue'])->name('daily-briefings.issues.store');
        Route::post('daily-briefings/{dailyBriefing}/issues/{issue}', [\App\Http\Controllers\DailyBriefingController::class, 'updateIssue'])->name('daily-briefings.issues.update');
        Route::delete('daily-briefings/{dailyBriefing}/issues/{issue}', [\App\Http\Controllers\DailyBriefingController::class, 'destroyIssue'])->name('daily-briefings.issues.destroy');
        Route::post('daily-briefings/{dailyBriefing}/photo', [\App\Http\Controllers\DailyBriefingController::class, 'uploadPhoto'])->name('daily-briefings.photo.store');
        Route::get('daily-briefings/{dailyBriefing}/export-pdf', [\App\Http\Controllers\DailyBriefingController::class, 'exportPdf'])->name('daily-briefings.export-pdf');
        Route::get('daily-briefings/{dailyBriefing}/export-excel', [\App\Http\Controllers\DailyBriefingController::class, 'exportExcel'])->name('daily-briefings.export-excel');

        // Notulen Temuan (Daily Briefing)
        Route::post('daily-briefings/{dailyBriefing}/findings', [\App\Http\Controllers\DailyBriefingController::class, 'storeFinding'])->name('daily-briefings.findings.store');
        Route::post('daily-briefings/{dailyBriefing}/findings/{finding}', [\App\Http\Controllers\DailyBriefingController::class, 'updateFinding'])->name('daily-briefings.findings.update');
        Route::delete('daily-briefings/{dailyBriefing}/findings/{finding}', [\App\Http\Controllers\DailyBriefingController::class, 'destroyFinding'])->name('daily-briefings.findings.destroy');
        Route::get('daily-briefings/{dailyBriefing}/findings/export-pdf', [\App\Http\Controllers\DailyBriefingController::class, 'exportFindingsPdf'])->name('daily-briefings.findings.export-pdf');
        Route::get('daily-briefings/{dailyBriefing}/findings/export-excel', [\App\Http\Controllers\DailyBriefingController::class, 'exportFindingsExcel'])->name('daily-briefings.findings.export-excel');

        // Notulen Kick Off Meeting (Daily Briefing)
        Route::post('daily-briefings/{dailyBriefing}/kickoff', [\App\Http\Controllers\DailyBriefingController::class, 'storeKickoff'])->name('daily-briefings.kickoff.store');
        Route::post('daily-briefings/{dailyBriefing}/kickoff/photos', [\App\Http\Controllers\DailyBriefingController::class, 'storeKickoffPhoto'])->name('daily-briefings.kickoff.photos.store');
        Route::delete('daily-briefings/{dailyBriefing}/kickoff/photos/{photo}', [\App\Http\Controllers\DailyBriefingController::class, 'destroyKickoffPhoto'])->name('daily-briefings.kickoff.photos.destroy');
        Route::get('daily-briefings/{dailyBriefing}/kickoff/export-pdf', [\App\Http\Controllers\DailyBriefingController::class, 'exportKickoffPdf'])->name('daily-briefings.kickoff.export-pdf');
        Route::get('daily-briefings/{dailyBriefing}/kickoff/export-excel', [\App\Http\Controllers\DailyBriefingController::class, 'exportKickoffExcel'])->name('daily-briefings.kickoff.export-excel');

        // Rapat Outage routes
        Route::resource('daily-meetings', DailyMeetingController::class)->only(['index', 'store', 'show', 'destroy']);
        Route::get('daily-meetings/{dailyMeeting}/qr', [DailyMeetingController::class, 'qrDisplay'])->name('daily-meetings.qr');
        Route::post('daily-meetings/{dailyMeeting}/complete', [DailyMeetingController::class, 'complete'])->name('daily-meetings.complete');
        Route::post('daily-meetings/{dailyMeeting}/realisasi', [DailyMeetingController::class, 'setRealisasi'])->name('daily-meetings.realisasi');
        Route::get('daily-meetings/{dailyMeeting}/attendees-json', [DailyMeetingController::class, 'attendeesJson'])->name('daily-meetings.attendees-json');

                Route::post('daily-meetings/{dailyMeeting}/issues', [DailyMeetingController::class, 'storeIssue'])->name('daily-meetings.issues.store');
        Route::put('daily-meetings/{dailyMeeting}/issues/{issue}', [DailyMeetingController::class, 'updateIssue'])->name('daily-meetings.issues.update');
        Route::delete('daily-meetings/{dailyMeeting}/issues/{issue}', [DailyMeetingController::class, 'destroyIssue'])->name('daily-meetings.issues.destroy');
        Route::get('daily-meetings/{dailyMeeting}/issues/export-pdf', [DailyMeetingController::class, 'exportIssuesPdf'])->name('daily-meetings.issues.export-pdf');
        Route::get('daily-meetings/{dailyMeeting}/issues/export-excel', [DailyMeetingController::class, 'exportIssuesExcel'])->name('daily-meetings.issues.export-excel');

        // Notulen Temuan (material temuan overhaul)

        // Notulen Kick Off Meeting (rapat P3)
        Route::post('daily-meetings/{dailyMeeting}/kickoff', [DailyMeetingController::class, 'storeKickoff'])->name('daily-meetings.kickoff.store');
        Route::post('daily-meetings/{dailyMeeting}/kickoff/photos', [DailyMeetingController::class, 'storeKickoffPhoto'])->name('daily-meetings.kickoff.photos.store');
        Route::delete('daily-meetings/{dailyMeeting}/kickoff/photos/{photo}', [DailyMeetingController::class, 'destroyKickoffPhoto'])->name('daily-meetings.kickoff.photos.destroy');
        Route::get('daily-meetings/{dailyMeeting}/kickoff/export-pdf', [DailyMeetingController::class, 'exportKickoffPdf'])->name('daily-meetings.kickoff.export-pdf');
        Route::get('daily-meetings/{dailyMeeting}/kickoff/export-excel', [DailyMeetingController::class, 'exportKickoffExcel'])->name('daily-meetings.kickoff.export-excel');
    });

    // Kinerja Outage routes
    Route::get('kinerja/on-quality', [KinerjaQualityController::class, 'index'])->name('kinerja.on-quality');
    Route::post('kinerja/on-quality', [KinerjaQualityController::class, 'store'])->name('kinerja.on-quality.store');
    
    Route::get('kinerja/on-time', [KinerjaTimeController::class, 'index'])->name('kinerja.on-time');
    Route::post('kinerja/on-time', [KinerjaTimeController::class, 'store'])->name('kinerja.on-time.store');
    
    Route::get('kinerja/on-cost', [KinerjaCostController::class, 'index'])->name('kinerja.on-cost');
    Route::post('kinerja/on-cost', [KinerjaCostController::class, 'store'])->name('kinerja.on-cost.store');
    // Penyaji berkas eviden kinerja dari disk privat (bukan /storage publik).
    Route::get('kinerja/eviden/{jenis}/{id}/{tipe?}', [\App\Http\Controllers\KinerjaEvidenController::class, 'show'])
        ->where('jenis', 'quality|time|cost')
        ->name('kinerja.eviden');
    Route::get('kinerja/on-scope', fn() => inertia('kinerja/on-scope'))->name('kinerja.on-scope');
    Route::get('kinerja/on-safety', fn() => inertia('kinerja/on-safety'))->name('kinerja.on-safety');

    // Data Master (Super Admin Only)
    Route::middleware([\App\Http\Middleware\EnsureSuperAdmin::class])->prefix('master')->name('master.')->group(function () {
        Route::resource('users', MasterUserController::class)->except(['create', 'show', 'edit']);
        
        Route::get('units', [MasterUnitController::class, 'index'])->name('units.index');
        Route::post('units', [MasterUnitController::class, 'storeUnit'])->name('units.store');
        Route::put('units/{unit}', [MasterUnitController::class, 'updateUnit'])->name('units.update');
        Route::delete('units/{unit}', [MasterUnitController::class, 'destroyUnit'])->name('units.destroy');

        Route::post('units/{unit}/mesins', [MasterUnitController::class, 'storeMesin'])->name('mesins.store');
        Route::put('mesins/{mesin}', [MasterUnitController::class, 'updateMesin'])->name('mesins.update');
        Route::delete('mesins/{mesin}', [MasterUnitController::class, 'destroyMesin'])->name('mesins.destroy');

        Route::resource('materials', MasterMaterialController::class)->except(['create', 'show', 'edit']);
    });
});

// Public attendance routes (no auth - scanned via QR on phone)
Route::get('attend/{token}', [DailyMeetingController::class, 'attendForm'])->name('attend.form');
Route::post('attend/{token}', [DailyMeetingController::class, 'submitAttendance'])->name('attend.submit');

Route::get('daily-briefings/attend/{token}', [\App\Http\Controllers\DailyBriefingController::class, 'attendForm'])->name('daily-briefings.attend.form');
Route::post('daily-briefings/attend/{token}', [\App\Http\Controllers\DailyBriefingController::class, 'submitAttendance'])->name('daily-briefings.attend.submit');

require __DIR__.'/settings.php';
