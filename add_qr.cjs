const fs = require('fs');
let content = fs.readFileSync('app/Http/Controllers/DailyMeetingController.php', 'utf8');

const newMethod = `    public function qrDisplay(\\App\\Models\\DailyMeeting $dailyMeeting)
    {
        return \\Inertia\\Inertia::render('daily-meetings/qr', [
            'meeting' => $dailyMeeting,
            'attendUrl' => route('attend.form', $dailyMeeting->token),
        ]);
    }

`;

content = content.replace('    public function attendForm(string $token)', newMethod + '    public function attendForm(string $token)');

fs.writeFileSync('app/Http/Controllers/DailyMeetingController.php', content);
console.log('Added qrDisplay to DailyMeetingController');
