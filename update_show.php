<?php

$file = 'd:\PROJECT_GROUP\outage\app\Http\Controllers\DailyMeetingController.php';
$content = file_get_contents($file);

$content = str_replace(
    "['attendees', 'findings', 'kickoff', 'kickoffPhotos']", 
    "['attendees', 'findings', 'kickoff', 'kickoffPhotos', 'issues']", 
    $content
);

$content = str_replace(
    "'attendees' => \$dailyMeeting->attendees,", 
    "'attendees' => \$dailyMeeting->attendees,\n            'issues' => \$dailyMeeting->issues,", 
    $content
);

file_put_contents($file, $content);
echo "Updated show method\n";
