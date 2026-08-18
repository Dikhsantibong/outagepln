const fs = require('fs');

let content = fs.readFileSync('app/Http/Controllers/DailyMeetingController.php', 'utf8');

const exportMethods = `
    public function exportIssuesPdf(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['attendees', 'issues', 'outagePlan']);

        $pdf = Pdf::loadView('exports.meeting-issues', [
            'meeting' => $dailyMeeting,
        ]);

        $pdf->setPaper('A4', 'landscape');

        return $pdf->download("Rapat-Outage-{$dailyMeeting->id}.pdf");
    }

    public function exportIssuesExcel(DailyMeeting $dailyMeeting)
    {
        $dailyMeeting->load(['attendees', 'issues', 'outagePlan']);
        
        return \\Maatwebsite\\Excel\\Facades\\Excel::download(
            new \\App\\Exports\\MeetingIssuesExport($dailyMeeting), 
            "Rapat-Outage-{$dailyMeeting->id}.xlsx"
        );
    }
`;

content = content.replace(
    'public function exportKickoffPdf(DailyMeeting $dailyMeeting)',
    exportMethods + '\n    public function exportKickoffPdf(DailyMeeting $dailyMeeting)'
);

fs.writeFileSync('app/Http/Controllers/DailyMeetingController.php', content);
console.log('Added export methods to DailyMeetingController');
