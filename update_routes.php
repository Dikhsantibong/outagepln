<?php

$file = 'd:\PROJECT_GROUP\outage\routes\web.php';
$content = file_get_contents($file);

$routes = <<<'EOD'
        Route::post('daily-meetings/{dailyMeeting}/issues', [DailyMeetingController::class, 'storeIssue'])->name('daily-meetings.issues.store');
        Route::put('daily-meetings/{dailyMeeting}/issues/{issue}', [DailyMeetingController::class, 'updateIssue'])->name('daily-meetings.issues.update');
        Route::delete('daily-meetings/{dailyMeeting}/issues/{issue}', [DailyMeetingController::class, 'destroyIssue'])->name('daily-meetings.issues.destroy');

        // Notulen Temuan (material temuan overhaul)
EOD;

$content = str_replace('// Notulen Temuan (material temuan overhaul)', $routes, $content);

file_put_contents($file, $content);
echo "Injected routes\n";
