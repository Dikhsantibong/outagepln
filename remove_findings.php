<?php
$file = 'd:\PROJECT_GROUP\outage\app\Http\Controllers\DailyMeetingController.php';
$content = file_get_contents($file);
$content = str_replace("['attendees', 'findings', 'kickoff', 'kickoffPhotos', 'issues']", "['attendees', 'kickoff', 'kickoffPhotos', 'issues']", $content);
// We can't use preg_replace on `\'findings\' => \$dailyMeeting->findings,\s*` safely if we don't handle new lines, so we use string replace
$content = str_replace("'findings' => \$dailyMeeting->findings,\n", "", $content);
$content = str_replace("'findings' => \$dailyMeeting->findings,\r\n", "", $content);
file_put_contents($file, $content);
echo 'Removed findings from DailyMeetingController';
