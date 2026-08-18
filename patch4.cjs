const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

// Replace activeTab state
content = content.replace(
    /const \[activeTab, setActiveTab\] = useState\('header'\);/,
    "const [activeTab, setActiveTab] = useState(meeting.tipe_rapat === 'RAPAT P3' ? 'kickoff' : 'issues');"
);

// Add missing props for issues
content = content.replace(
    /attendees,\n    findings = \[\],\n    kickoff = null,\n    kickoffPhotos = \[\],\n    kickoffDefaults,\n\}: \{/,
    "attendees,\n    issues = [],\n    findings = [],\n    kickoff = null,\n    kickoffPhotos = [],\n    kickoffDefaults,\n}: {"
);

content = content.replace(
    /attendees: any\[\];\n    findings\?: any\[\];\n    kickoff\?: any;\n    kickoffPhotos\?: any\[\];\n    kickoffDefaults\?: any;\n\}\) \{/,
    "attendees: any[];\n    issues?: any[];\n    findings?: any[];\n    kickoff?: any;\n    kickoffPhotos?: any[];\n    kickoffDefaults?: any;\n}) {"
);

// Add issue state logic
const issueStates = `
    const [issueModal, setIssueModal] = useState(false);
    const [editingIssue, setEditingIssue] = useState<any>(null);
    const issueForm = useForm({
        permasalahan: '',
        tindak_lanjut: '',
        target: '',
        pic: '',
        status: 'Open',
    });

    const openIssueForm = (issue?: any) => {
        if (issue) {
            setEditingIssue(issue);
            issueForm.setData({
                permasalahan: issue.permasalahan,
                tindak_lanjut: issue.tindak_lanjut,
                target: issue.target,
                pic: issue.pic,
                status: issue.status,
            });
        } else {
            setEditingIssue(null);
            issueForm.reset();
        }
        setIssueModal(true);
    };

    const submitIssue: React.FormEventHandler = (e) => {
        e.preventDefault();
        const url = editingIssue
            ? \`/daily-meetings/\${meeting.id}/issues/\${editingIssue.id}\`
            : \`/daily-meetings/\${meeting.id}/issues\`;
        
        if (editingIssue) {
            issueForm.put(url, { preserveScroll: true, onSuccess: () => setIssueModal(false) });
        } else {
            issueForm.post(url, { preserveScroll: true, onSuccess: () => setIssueModal(false) });
        }
    };

    const deleteIssue = (id: number) => {
        if (confirm('Hapus permasalahan ini?')) {
            router.delete(\`/daily-meetings/\${meeting.id}/issues/\${id}\`, { preserveScroll: true });
        }
    };
`;

// Insert issue state right after the kickOffForm
content = content.replace(/const photoForm = useForm\(\{ foto: null as File \| null, caption: '' \}\);/, issueStates + '\n    const photoForm = useForm({ foto: null as File | null, caption: \'\' });');

// Rebuild Navigation
const newNav = `
                        <button 
                            onClick={() => setActiveTab('header')} 
                            className={\`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all \${activeTab === 'header' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}\`}
                        >
                            <FileText className="h-4 w-4" /> Header & Info
                        </button>
                        <button 
                            onClick={() => setActiveTab('attendees')} 
                            className={\`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all \${activeTab === 'attendees' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}\`}
                        >
                            <Users className="h-4 w-4" /> Daftar Hadir ({attendees.length})
                        </button>
                        {meeting.tipe_rapat !== 'RAPAT P3' && (
                            <button 
                                onClick={() => setActiveTab('issues')} 
                                className={\`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all \${activeTab === 'issues' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}\`}
                            >
                                <ClipboardList className="h-4 w-4" /> Permasalahan & Solusi
                            </button>
                        )}
                        {meeting.tipe_rapat === 'RAPAT P3' && (
                            <button 
                                onClick={() => setActiveTab('kickoff')} 
                                className={\`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all \${activeTab === 'kickoff' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}\`}
                            >
                                <Handshake className="h-4 w-4" /> Kick Off Meeting
                            </button>
                        )}
                        <button 
                            onClick={() => setActiveTab('dokumentasi')} 
                            className={\`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all \${activeTab === 'dokumentasi' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}\`}
                        >
                            <Images className="h-4 w-4" /> Dokumentasi
                        </button>
`;

content = content.replace(
    /<div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted\/50 p-1">[\s\S]*?<\/div>\n\s*<\/div>\n\s*\{activeTab === 'header'/,
    `<div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-1">\n${newNav}\n</div>\n                    </div>\n\n                    {activeTab === 'header'`
);

// We need to append the issues tab UI block.
const issuesUI = `
                    {activeTab === 'issues' && (
                        <div className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Permasalahan & Solusi</CardTitle>
                                    <CardDescription>Catatan permasalahan dan tindak lanjut (Notulen Rapat)</CardDescription>
                                </div>
                                {!isTamu && (
                                    <Button onClick={() => openIssueForm()} size="sm" className="h-8 gap-1">
                                        <Plus className="h-3.5 w-3.5" /> Tambah
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[50px] text-center">No</TableHead>
                                                <TableHead>Permasalahan</TableHead>
                                                <TableHead>Tindak Lanjut / Solusi</TableHead>
                                                <TableHead>Target</TableHead>
                                                <TableHead>PIC</TableHead>
                                                <TableHead>Status</TableHead>
                                                {!isTamu && <TableHead className="w-[100px] text-right">Aksi</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {issues && issues.length > 0 ? (
                                                issues.map((issue: any, index: number) => (
                                                    <TableRow key={issue.id}>
                                                        <TableCell className="text-center">{index + 1}</TableCell>
                                                        <TableCell className="whitespace-pre-wrap">{issue.permasalahan}</TableCell>
                                                        <TableCell className="whitespace-pre-wrap">{issue.tindak_lanjut}</TableCell>
                                                        <TableCell>{issue.target}</TableCell>
                                                        <TableCell>{issue.pic}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={issue.status === 'Close' ? 'success' : 'secondary'} className={issue.status === 'Close' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                                                {issue.status}
                                                            </Badge>
                                                        </TableCell>
                                                        {!isTamu && (
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openIssueForm(issue)}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteIssue(issue.id)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={isTamu ? 6 : 7} className="h-24 text-center text-muted-foreground">
                                                        Belum ada permasalahan dicatat.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                        </div>
                    )}
`;

content = content.replace(
    /\{activeTab === 'kickoff' && \(/,
    issuesUI + "\n                    {activeTab === 'kickoff' && ("
);

// We need to append the issueModal dialog at the end
const dialogUI = `
            <Dialog open={issueModal} onOpenChange={setIssueModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingIssue ? 'Edit Permasalahan' : 'Tambah Permasalahan'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitIssue} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Permasalahan</Label>
                            <Textarea
                                value={issueForm.data.permasalahan}
                                onChange={e => issueForm.setData('permasalahan', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tindak Lanjut / Solusi</Label>
                            <Textarea
                                value={issueForm.data.tindak_lanjut}
                                onChange={e => issueForm.setData('tindak_lanjut', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Target (Misal: Jul-26)</Label>
                                <Input value={issueForm.data.target} onChange={e => issueForm.setData('target', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>PIC (Misal: Unit / Rendal HAR)</Label>
                                <Input value={issueForm.data.pic} onChange={e => issueForm.setData('pic', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={issueForm.data.status} onValueChange={v => issueForm.setData('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Close">Close</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIssueModal(false)}>Batal</Button>
                            <Button type="submit" disabled={issueForm.processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
`;

content = content.replace(/<\/Dialog>\n\s*<\/>/, `</Dialog>\n${dialogUI}\n        </>`);

fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
console.log('Patched UI Daily Meeting');
