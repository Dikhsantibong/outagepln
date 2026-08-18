const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-briefings/show.tsx', 'utf8');

// Add icons
content = content.replace(
    /import \{ Calendar, Users, QrCode, FileText, CheckCircle2, ChevronLeft, Plus, Edit, Trash2, Printer, Copy \} from 'lucide-react';/,
    `import { Calendar, Users, QrCode, FileText, CheckCircle2, ChevronLeft, Plus, Edit, Trash2, Printer, Copy, FileSpreadsheet, ImageOff, Handshake, Link2, Images, ClipboardList } from 'lucide-react';\nimport { Textarea } from '@/components/ui/textarea';`
);

// Add props
content = content.replace(
    /issues: any\[\];\n\}\) \{/,
    `issues: any[];\n    findings?: any[];\n    kickoff?: any;\n    kickoffPhotos?: any[];\n    findingInfo?: any;\n    kickoffDefaults?: any;\n}) {\n`
);

content = content.replace(
    /briefing,\n    attendees,\n    issues,\n\}: \{/,
    `briefing,\n    attendees,\n    issues,\n    findings = [],\n    kickoff = null,\n    kickoffPhotos = [],\n    findingInfo,\n    kickoffDefaults,\n}: {`
);

// Add forms
const formsCode = `
    const [findingDialogOpen, setFindingDialogOpen] = useState(false);
    const [editingFinding, setEditingFinding] = useState<any>(null);
    const findingForm = useForm({
        tanggal: '',
        uraian: '',
        part_number: '',
        qty: '',
        satuan: '',
        keterangan: '',
        tindak_lanjut: '',
        target: 'Open',
        foto: null as File | null,
    });

    const openFindingForm = (finding?: any) => {
        if (finding) {
            setEditingFinding(finding);
            findingForm.setData({
                tanggal: finding.tanggal || '',
                uraian: finding.uraian || '',
                part_number: finding.part_number || '',
                qty: finding.qty || '',
                satuan: finding.satuan || '',
                keterangan: finding.keterangan || '',
                tindak_lanjut: finding.tindak_lanjut || '',
                target: finding.target || 'Open',
                foto: null,
            });
        } else {
            setEditingFinding(null);
            findingForm.reset();
        }
        setFindingDialogOpen(true);
    };

    const submitFinding = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingFinding 
            ? \`/daily-briefings/\${briefing.id}/findings/\${editingFinding.id}\`
            : \`/daily-briefings/\${briefing.id}/findings\`;
            
        findingForm.post(url, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setFindingDialogOpen(false),
        });
    };

    const deleteFinding = (id: number) => {
        if (confirm('Hapus temuan ini?')) {
            router.delete(\`/daily-briefings/\${briefing.id}/findings/\${id}\`, { preserveScroll: true });
        }
    };

    const kickoffForm = useForm({
        nomor_dokumen: kickoff?.nomor_dokumen ?? kickoffDefaults?.nomor_dokumen ?? '',
        revisi: kickoff?.revisi ?? kickoffDefaults?.revisi ?? '',
        tanggal_terbit: kickoff?.tanggal_terbit ?? '',
        pimpinan_rapat: kickoff?.pimpinan_rapat ?? kickoffDefaults?.pimpinan_rapat ?? '',
        tempat: kickoff?.tempat ?? kickoffDefaults?.tempat ?? '',
        waktu: kickoff?.waktu ?? kickoffDefaults?.waktu ?? '',
        agenda: kickoff?.agenda ?? kickoffDefaults?.agenda ?? '',
        peserta: kickoff?.peserta ?? kickoffDefaults?.peserta ?? '',
        penyampaian_pln: kickoff?.penyampaian_pln ?? '',
        nama_mitra: kickoff?.nama_mitra ?? '',
        penyampaian_mitra: kickoff?.penyampaian_mitra ?? '',
        hasil_kesepakatan: kickoff?.hasil_kesepakatan ?? '',
        link_absensi: kickoff?.link_absensi ?? '',
        pimpinan_nama: kickoff?.pimpinan_nama ?? kickoffDefaults?.pimpinan_nama ?? '',
        pimpinan_jabatan: kickoff?.pimpinan_jabatan ?? kickoffDefaults?.pimpinan_jabatan ?? '',
        notulis_nama: kickoff?.notulis_nama ?? kickoffDefaults?.notulis_nama ?? '',
        notulis_jabatan: kickoff?.notulis_jabatan ?? kickoffDefaults?.notulis_jabatan ?? '',
        kota_ttd: kickoff?.kota_ttd ?? kickoffDefaults?.kota_ttd ?? '',
        tanggal_ttd: kickoff?.tanggal_ttd ?? '',
    });

    const submitKickoff = (e: React.FormEvent) => {
        e.preventDefault();
        kickoffForm.post(\`/daily-briefings/\${briefing.id}/kickoff\`, { preserveScroll: true });
    };

    const kickoffPhotoForm = useForm({ foto: null as File | null, caption: '' });
    const submitKickoffPhoto = (e: React.FormEvent) => {
        e.preventDefault();
        kickoffPhotoForm.post(\`/daily-briefings/\${briefing.id}/kickoff/photos\`, {
            preserveScroll: true,
            onSuccess: () => kickoffPhotoForm.reset(),
        });
    };
    const deleteKickoffPhoto = (id: number) => {
        if (confirm('Hapus dokumentasi?')) {
            router.delete(\`/daily-briefings/\${briefing.id}/kickoff/photos/\${id}\`, { preserveScroll: true });
        }
    };
`;

content = content.replace(
    /const issueForm = useForm\(\{/,
    formsCode + '\n    const issueForm = useForm({'
);

// Add buttons to nav
const newNavButtons = `
                        <button 
                            onClick={() => setActiveTab('temuan')} 
                            className={\`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all \${activeTab === 'temuan' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}\`}
                        >
                            <ClipboardList className="h-4 w-4" /> Notulen Temuan
                        </button>
                        <button 
                            onClick={() => setActiveTab('kickoff')} 
                            className={\`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all \${activeTab === 'kickoff' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}\`}
                        >
                            <Handshake className="h-4 w-4" /> Kick Off Meeting
                        </button>
`;
content = content.replace(
    /<button \n                            onClick=\{\(\) => setActiveTab\('dokumentasi'\)\} /,
    newNavButtons + '\n                        <button \n                            onClick={() => setActiveTab(\'dokumentasi\')} '
);

fs.writeFileSync('resources/js/pages/daily-briefings/show.tsx', content);
