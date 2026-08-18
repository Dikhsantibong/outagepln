<?php

$file = 'd:\PROJECT_GROUP\outage\app\Http\Controllers\DailyMeetingController.php';
$content = file_get_contents($file);

// Insert use statement if not exists
if (strpos($content, 'use App\Models\MeetingIssue;') === false) {
    $content = str_replace(
        'use App\Models\MeetingMinute;',
        "use App\Models\MeetingIssue;\nuse App\Models\MeetingMinute;",
        $content
    );
}

$methods = <<<'EOD'

    public function storeIssue(Request $request, DailyMeeting $dailyMeeting)
    {
        $validated = $request->validate([
            'permasalahan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:255',
            'pic' => 'nullable|string|max:255',
            'status' => 'required|in:Open,Close',
        ]);

        $dailyMeeting->issues()->create($validated);
        return redirect()->back()->with('success', 'Permasalahan ditambahkan.');
    }

    public function updateIssue(Request $request, DailyMeeting $dailyMeeting, MeetingIssue $issue)
    {
        $validated = $request->validate([
            'permasalahan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'target' => 'nullable|string|max:255',
            'pic' => 'nullable|string|max:255',
            'status' => 'required|in:Open,Close',
        ]);

        $issue->update($validated);
        return redirect()->back()->with('success', 'Permasalahan diperbarui.');
    }

    public function destroyIssue(DailyMeeting $dailyMeeting, MeetingIssue $issue)
    {
        $issue->delete();
        return redirect()->back()->with('success', 'Permasalahan dihapus.');
    }
EOD;

$content = preg_replace('/}\s*$/', $methods . "\n}\n", $content);
file_put_contents($file, $content);
echo "Injected successfully.";
