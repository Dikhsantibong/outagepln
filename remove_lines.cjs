const fs = require('fs');
let lines = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8').split('\n');

if (lines[837].includes('className="space-y-2"') && lines[950].includes('</Dialog>')) {
    lines.splice(837, 951 - 838 + 1);
    fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', lines.join('\n'));
    console.log('Removed stray findingForm lines');
} else {
    console.log('Lines mismatch: ', lines[837], lines[950]);
}
