const fs = require('fs');

let php = fs.readFileSync('app/Exports/DailyBriefingExport.php', 'utf8');
php = php.replace(/DailyBriefingExport/g, 'MeetingIssuesExport');
php = php.replace(/DailyBriefing/g, 'DailyMeeting');
php = php.replace(/\$briefing/g, '$meeting');
php = php.replace(/daily-briefing-excel/g, 'meeting-issues-excel');

fs.writeFileSync('app/Exports/MeetingIssuesExport.php', php);

console.log('Created MeetingIssuesExport.php');
