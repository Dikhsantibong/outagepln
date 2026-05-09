<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

use App\Http\Controllers\OutagePlanController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('outage-plans', OutagePlanController::class)->only(['index', 'store', 'destroy']);
    Route::inertia('daily-meeting', 'daily-meeting')->name('daily-meeting');
});

require __DIR__.'/settings.php';
