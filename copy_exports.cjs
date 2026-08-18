const fs = require('fs');

let pdf = fs.readFileSync('resources/views/exports/daily-briefing.blade.php', 'utf8');
pdf = pdf.replace(/\$briefing/g, '$meeting');
fs.writeFileSync('resources/views/exports/meeting-issues.blade.php', pdf);

let excel = fs.readFileSync('resources/views/exports/daily-briefing-excel.blade.php', 'utf8');
excel = excel.replace(/\$briefing/g, '$meeting');
fs.writeFileSync('resources/views/exports/meeting-issues-excel.blade.php', excel);

console.log('Copied export templates');
