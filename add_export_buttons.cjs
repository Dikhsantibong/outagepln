const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

const targetStr = `                                <div>
                                    <CardTitle>Notulen</CardTitle>
                                    <CardDescription>Catatan permasalahan dan tindak lanjut (Notulen Rapat)</CardDescription>
                                </div>
                                {!isTamu && (
                                    <Button onClick={() => openIssueForm()} size="sm" className="h-8 gap-1">
                                        <Plus className="h-3.5 w-3.5" /> Tambah
                                    </Button>
                                )}`;

const replaceStr = `                                <div>
                                    <CardTitle>Notulen</CardTitle>
                                    <CardDescription>Catatan permasalahan dan tindak lanjut (Notulen Rapat)</CardDescription>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(\`/daily-meetings/\${meeting.id}/issues/export-pdf\`, '_blank')}
                                    >
                                        <FileText className="h-4 w-4 text-red-500" />
                                        Export PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(\`/daily-meetings/\${meeting.id}/issues/export-excel\`, '_blank')}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        Export Excel
                                    </Button>
                                    {!isTamu && (
                                        <Button onClick={() => openIssueForm()} size="sm" className="h-9 gap-1">
                                            <Plus className="h-3.5 w-3.5" /> Tambah
                                        </Button>
                                    )}
                                </div>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
    console.log('Successfully added export buttons');
} else {
    console.log('Could not find targetStr to insert export buttons');
}
