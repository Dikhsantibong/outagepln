<?php
// trigger

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::redirect('/', '/login')->name('home');

use App\Http\Controllers\OutagePlanController;
use App\Http\Controllers\DailyMeetingController;
use App\Http\Controllers\TagihanOhController;

use App\Http\Controllers\DashboardController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('outage-plans', OutagePlanController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('team-outage', function() {
        return inertia('team-outage');
    })->name('team-outage');
    
    // Daily Meeting routes
    Route::resource('daily-meetings', DailyMeetingController::class)->only(['index', 'store', 'show', 'destroy']);
    Route::get('daily-meetings/{dailyMeeting}/qr', [DailyMeetingController::class, 'qrDisplay'])->name('daily-meetings.qr');
    Route::post('daily-meetings/{dailyMeeting}/minutes', [DailyMeetingController::class, 'storeMinutes'])->name('daily-meetings.minutes');
    Route::post('daily-meetings/{dailyMeeting}/complete', [DailyMeetingController::class, 'complete'])->name('daily-meetings.complete');
    Route::get('daily-meetings/{dailyMeeting}/attendees-json', [DailyMeetingController::class, 'attendeesJson'])->name('daily-meetings.attendees-json');

    // Tagihan OH routes
    Route::resource('tagihan-oh', TagihanOhController::class);
});

// Public attendance routes (no auth - scanned via QR on phone)
Route::get('attend/{token}', [DailyMeetingController::class, 'attendForm'])->name('attend.form');
Route::post('attend/{token}', [DailyMeetingController::class, 'submitAttendance'])->name('attend.submit');

require __DIR__.'/settings.php';
