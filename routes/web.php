<?php

// trigger

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ArsipDokumenController;
use App\Http\Controllers\DailyBriefingController;
use App\Http\Controllers\DailyMeetingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KinerjaCostController;
use App\Http\Controllers\KinerjaEvidenController;
use App\Http\Controllers\KinerjaQualityController;
use App\Http\Controllers\KinerjaTimeController;
use App\Http\Controllers\Master\MaterialController as MasterMaterialController;
use App\Http\Controllers\Master\UnitController as MasterUnitController;
use App\Http\Controllers\Master\UserController as MasterUserController;
use App\Http\Controllers\MasterTtdController;
use App\Http\Controllers\OutagePlanController;
use App\Http\Controllers\WelcomeController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Support\Facades\Route;

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
    Route::get('team-outage', function () {
        return inertia('team-outage');
    })->name('team-outage');
    Route::get('summary', function () {
        return inertia('summary/index');
    })->name('summary');

    // Menu Daily Meeting dan Rapat Outage (tidak boleh diakses pengelola)
    Route::middleware(['can:viewMeetings'])->group(function () {

        // Daily Meeting (Manual Briefing) routes
        Route::resource('daily-briefings', DailyBriefingController::class)->parameters(['daily-briefings' => 'dailyBriefing']);
        Route::post('daily-briefings/{dailyBriefing}/complete', [DailyBriefingController::class, 'complete'])->name('daily-briefings.complete');
        Route::post('daily-briefings/{dailyBriefing}/add-day', [DailyBriefingController::class, 'addDay'])->name('daily-briefings.add-day');
        Route::get('daily-briefings/{dailyBriefing}/qr', [DailyBriefingController::class, 'qrDisplay'])->name('daily-briefings.qr');
        Route::get('daily-briefings/{dailyBriefing}/attendees-json', [DailyBriefingController::class, 'attendeesJson'])->name('daily-briefings.attendees-json');
        Route::post('daily-briefings/{dailyBriefing}/issues', [DailyBriefingController::class, 'storeIssue'])->name('daily-briefings.issues.store');
        Route::post('daily-briefings/{dailyBriefing}/issues/{issue}', [DailyBriefingController::class, 'updateIssue'])->name('daily-briefings.issues.update');
        Route::delete('daily-briefings/{dailyBriefing}/issues/{issue}', [DailyBriefingController::class, 'destroyIssue'])->name('daily-briefings.issues.destroy');
        Route::post('daily-briefings/{dailyBriefing}/photo', [DailyBriefingController::class, 'uploadPhoto'])->name('daily-briefings.photo.store');
        Route::get('daily-briefings/{dailyBriefing}/export-pdf', [DailyBriefingController::class, 'exportPdf'])->name('daily-briefings.export-pdf');
        Route::get('daily-briefings/{dailyBriefing}/export-excel', [DailyBriefingController::class, 'exportExcel'])->name('daily-briefings.export-excel');

        // Notulen Temuan (Daily Briefing)
        Route::post('daily-briefings/{dailyBriefing}/findings', [DailyBriefingController::class, 'storeFinding'])->name('daily-briefings.findings.store');
        Route::post('daily-briefings/{dailyBriefing}/findings/{finding}', [DailyBriefingController::class, 'updateFinding'])->name('daily-briefings.findings.update');
        Route::delete('daily-briefings/{dailyBriefing}/findings/{finding}', [DailyBriefingController::class, 'destroyFinding'])->name('daily-briefings.findings.destroy');
        Route::get('daily-briefings/{dailyBriefing}/findings/export-pdf', [DailyBriefingController::class, 'exportFindingsPdf'])->name('daily-briefings.findings.export-pdf');
        Route::get('daily-briefings/{dailyBriefing}/findings/export-excel', [DailyBriefingController::class, 'exportFindingsExcel'])->name('daily-briefings.findings.export-excel');

        // Notulen Kick Off Meeting (Daily Briefing)
        Route::post('daily-briefings/{dailyBriefing}/kickoff', [DailyBriefingController::class, 'storeKickoff'])->name('daily-briefings.kickoff.store');
        Route::post('daily-briefings/{dailyBriefing}/kickoff/photos', [DailyBriefingController::class, 'storeKickoffPhoto'])->name('daily-briefings.kickoff.photos.store');
        Route::delete('daily-briefings/{dailyBriefing}/kickoff/photos/{photo}', [DailyBriefingController::class, 'destroyKickoffPhoto'])->name('daily-briefings.kickoff.photos.destroy');
        Route::get('daily-briefings/{dailyBriefing}/kickoff/export-pdf', [DailyBriefingController::class, 'exportKickoffPdf'])->name('daily-briefings.kickoff.export-pdf');
        Route::get('daily-briefings/{dailyBriefing}/kickoff/export-excel', [DailyBriefingController::class, 'exportKickoffExcel'])->name('daily-briefings.kickoff.export-excel');

        // Rapat Outage routes
        Route::resource('daily-meetings', DailyMeetingController::class)->only(['index', 'store', 'show', 'destroy']);
        // Revisi rencana: tanggal rapat R2-P3 dihitung ulang dari rencana start.
        // Formulirnya berdiri sendiri, bukan dialog, supaya daftar rapat tetap ringkas.
        Route::get('daily-meetings/rencana/{outage_plan}/revisi', [DailyMeetingController::class, 'formRevisiRencana'])->name('daily-meetings.rencana.form');
        Route::post('daily-meetings/rencana/{outage_plan}/revisi', [DailyMeetingController::class, 'storeRevisiRencana'])->name('daily-meetings.rencana.revisi');
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
    Route::get('kinerja/eviden/{jenis}/{id}/{tipe?}', [KinerjaEvidenController::class, 'show'])
        ->where('jenis', 'quality|time|cost')
        ->name('kinerja.eviden');
    Route::get('kinerja/on-scope', fn () => inertia('kinerja/on-scope'))->name('kinerja.on-scope');
    Route::get('kinerja/on-safety', fn () => inertia('kinerja/on-safety'))->name('kinerja.on-safety');

    // Arsip berkas overhaul — kontrak dan hasil pekerjaan — untuk admin
    // dan super admin. Berkasnya disajikan lewat rute, bukan /storage publik.
    Route::middleware([EnsureAdmin::class])->prefix('arsip')->name('arsip.')->group(function () {
        Route::get('/', [ArsipDokumenController::class, 'index'])->name('index');
        Route::post('/', [ArsipDokumenController::class, 'store'])->name('store');
        Route::put('{arsipDokumen}', [ArsipDokumenController::class, 'update'])->name('update');
        Route::get('{arsipDokumen}/preview', [ArsipDokumenController::class, 'preview'])->name('preview');
        Route::get('{arsipDokumen}/download', [ArsipDokumenController::class, 'download'])->name('download');
        Route::delete('{arsipDokumen}', [ArsipDokumenController::class, 'destroy'])->name('destroy');
    });

    // Jejak aktivitas seluruh peran — bacaan saja, khusus Super Admin.
    Route::middleware([EnsureSuperAdmin::class])
        ->get('aktivitas', [ActivityLogController::class, 'index'])
        ->name('aktivitas.index');

    // Data Master (Super Admin Only)
    Route::middleware([EnsureSuperAdmin::class])->prefix('master')->name('master.')->group(function () {
        Route::resource('users', MasterUserController::class)->except(['create', 'show', 'edit']);

        Route::get('units', [MasterUnitController::class, 'index'])->name('units.index');
        Route::post('units', [MasterUnitController::class, 'storeUnit'])->name('units.store');
        Route::get('units/{unit}/mesins', [MasterUnitController::class, 'mesinsIndex'])->name('units.mesins.index');
        Route::put('units/{unit}', [MasterUnitController::class, 'updateUnit'])->name('units.update');
        Route::delete('units/{unit}', [MasterUnitController::class, 'destroyUnit'])->name('units.destroy');

        Route::post('units/{unit}/mesins', [MasterUnitController::class, 'storeMesin'])->name('mesins.store');
        Route::put('mesins/{mesin}', [MasterUnitController::class, 'updateMesin'])->name('mesins.update');
        Route::delete('mesins/{mesin}', [MasterUnitController::class, 'destroyMesin'])->name('mesins.destroy');

        Route::resource('materials', MasterMaterialController::class)->except(['create', 'show', 'edit']);

        // Penandatangan global untuk seluruh berkas yang butuh tanda tangan.
        Route::get('ttd', [MasterTtdController::class, 'index'])->name('ttd.index');
        Route::put('ttd', [MasterTtdController::class, 'update'])->name('ttd.update');
    });
});

// Public attendance routes (no auth - scanned via QR on phone)
Route::get('attend/{token}', [DailyMeetingController::class, 'attendForm'])->name('attend.form');
Route::post('attend/{token}', [DailyMeetingController::class, 'submitAttendance'])->name('attend.submit');

Route::get('daily-briefings/attend/{token}', [DailyBriefingController::class, 'attendForm'])->name('daily-briefings.attend.form');
Route::post('daily-briefings/attend/{token}', [DailyBriefingController::class, 'submitAttendance'])->name('daily-briefings.attend.submit');

require __DIR__.'/settings.php';
