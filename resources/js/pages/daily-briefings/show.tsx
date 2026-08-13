import { Head, router, usePage, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Calendar, Users, QrCode, FileText, CheckCircle2, ChevronLeft, Plus, Edit, Trash2, Printer } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function DailyBriefingsShow({
    briefing,
    attendees,
    issues,
}: {
    briefing: any;
    attendees: any[];
    issues: any[];
}) {
    const { auth } = usePage<any>().props;
    const isTamu = !(auth?.can?.write ?? false);
    
    // Header Form
    const headerForm = useForm({
        unit: briefing.unit || '',
        jenis_inspeksi: briefing.jenis_inspeksi || '',
        rapat_framework: briefing.rapat_framework || 'P1',
        tgl_performance_test: briefing.tgl_performance_test || '-',
        jam_setelah_po_terai: briefing.jam_setelah_po_terai || '',
        daya_mampu: briefing.daya_mampu || '',
        nomor_dokumen: briefing.nomor_dokumen || '',
        revisi: briefing.revisi || '00',
        tanggal_terbit: briefing.tanggal_terbit || '',
        nama_mengetahui: briefing.nama_mengetahui || '',
        jabatan_mengetahui: briefing.jabatan_mengetahui || 'MANAJER BAGIAN ...',
        nama_disetujui: briefing.nama_disetujui || '',
        jabatan_disetujui: briefing.jabatan_disetujui || 'MANAGER UP ...',
    });

    const submitHeader = (e: React.FormEvent) => {
        e.preventDefault();
        headerForm.put(`/daily-briefings/${briefing.id}`, {
            preserveScroll: true,
        });
    };

    // Issue Form
    const [activeTab, setActiveTab] = useState('header');
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

    const submitIssue = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingIssue) {
            issueForm.post(`/daily-briefings/${briefing.id}/issues/${editingIssue.id}`, {
                preserveScroll: true,
                onSuccess: () => setIssueModal(false),
            });
        } else {
            issueForm.post(`/daily-briefings/${briefing.id}/issues`, {
                preserveScroll: true,
                onSuccess: () => setIssueModal(false),
            });
        }
    };

    const deleteIssue = (id: number) => {
        if (confirm('Hapus permasalahan ini?')) {
            router.delete(`/daily-briefings/${briefing.id}/issues/${id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={`Daily Meeting - ${briefing.judul}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.visit('/daily-briefings')}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{briefing.judul}</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {new Date(briefing.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                {briefing.waktu_mulai ? ` • ${briefing.waktu_mulai.substring(0, 5)}` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {briefing.status !== 'completed' && !isTamu && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (confirm('Tandai meeting selesai? Absensi tidak akan bisa diisi lagi.')) {
                                        router.post(`/daily-briefings/${briefing.id}/complete`);
                                    }
                                }}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Selesaikan Meeting
                            </Button>
                        )}
                        <Button
                            variant="default"
                            onClick={() => window.open(`/daily-briefings/${briefing.id}/export-pdf`, '_blank')}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Cetak Notulen
                        </Button>
                    </div>
                </div>

                <div className="w-full">
                    <div className="grid w-full grid-cols-3 h-12 bg-muted p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('header')} 
                            className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${activeTab === 'header' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}`}
                        >
                            <FileText className="h-4 w-4" /> Header & Info
                        </button>
                        <button 
                            onClick={() => setActiveTab('issues')} 
                            className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${activeTab === 'issues' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}`}
                        >
                            <CheckCircle2 className="h-4 w-4" /> Permasalahan & Solusi
                        </button>
                        <button 
                            onClick={() => setActiveTab('attendees')} 
                            className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${activeTab === 'attendees' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}`}
                        >
                            <Users className="h-4 w-4" /> Daftar Hadir ({attendees.length})
                        </button>
                    </div>
                    
                    {activeTab === 'header' && (
                        <div className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Data Header Notulen</CardTitle>
                                <CardDescription>Data ini akan muncul di bagian atas PDF Cetak Notulen.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitHeader} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Unit / Mesin</Label>
                                            <Input value={headerForm.data.unit} onChange={e => headerForm.setData('unit', e.target.value)} placeholder="PLTD WANGI-WANGI #2" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Jenis Inspeksi</Label>
                                            <Input value={headerForm.data.jenis_inspeksi} onChange={e => headerForm.setData('jenis_inspeksi', e.target.value)} placeholder="SO" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rapat Framework</Label>
                                            <Input value={headerForm.data.rapat_framework} onChange={e => headerForm.setData('rapat_framework', e.target.value)} placeholder="P1" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tgl Performance Test</Label>
                                            <Input value={headerForm.data.tgl_performance_test} onChange={e => headerForm.setData('tgl_performance_test', e.target.value)} placeholder="-" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Jam Setelah PO Terai</Label>
                                            <Input value={headerForm.data.jam_setelah_po_terai} onChange={e => headerForm.setData('jam_setelah_po_terai', e.target.value)} placeholder="7.456 / 16.365" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Daya Mampu</Label>
                                            <Input value={headerForm.data.daya_mampu} onChange={e => headerForm.setData('daya_mampu', e.target.value)} placeholder="0.128 MW" />
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nomor Dokumen</Label>
                                            <Input value={headerForm.data.nomor_dokumen} onChange={e => headerForm.setData('nomor_dokumen', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Revisi</Label>
                                            <Input value={headerForm.data.revisi} onChange={e => headerForm.setData('revisi', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tanggal Terbit (Dokumen)</Label>
                                            <Input type="date" value={headerForm.data.tanggal_terbit} onChange={e => headerForm.setData('tanggal_terbit', e.target.value)} />
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nama Mengetahui</Label>
                                            <Input value={headerForm.data.nama_mengetahui} onChange={e => headerForm.setData('nama_mengetahui', e.target.value)} placeholder="Nama" />
                                            <Input className="mt-2 text-xs text-muted-foreground" value={headerForm.data.jabatan_mengetahui} onChange={e => headerForm.setData('jabatan_mengetahui', e.target.value)} placeholder="Jabatan" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nama Disetujui</Label>
                                            <Input value={headerForm.data.nama_disetujui} onChange={e => headerForm.setData('nama_disetujui', e.target.value)} placeholder="Nama" />
                                            <Input className="mt-2 text-xs text-muted-foreground" value={headerForm.data.jabatan_disetujui} onChange={e => headerForm.setData('jabatan_disetujui', e.target.value)} placeholder="Jabatan" />
                                        </div>
                                    </div>

                                    {!isTamu && (
                                        <Button type="submit" disabled={headerForm.processing}>Simpan Perubahan Header</Button>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                        </div>
                    )}

                    {activeTab === 'issues' && (
                        <div className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Daftar Permasalahan & Solusi</CardTitle>
                                    <CardDescription>Tabel utama di dalam notulen.</CardDescription>
                                </div>
                                {!isTamu && (
                                    <Button size="sm" onClick={() => openIssueForm()}>
                                        <Plus className="h-4 w-4 mr-2" /> Tambah Baris
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">No</TableHead>
                                                <TableHead>Permasalahan</TableHead>
                                                <TableHead>Tindak Lanjut / Solusi</TableHead>
                                                <TableHead>Target</TableHead>
                                                <TableHead>PIC</TableHead>
                                                <TableHead>Status</TableHead>
                                                {!isTamu && <TableHead className="w-[100px]"></TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {issues.map((issue, idx) => (
                                                <TableRow key={issue.id}>
                                                    <TableCell>{idx + 1}</TableCell>
                                                    <TableCell className="whitespace-pre-wrap">{issue.permasalahan}</TableCell>
                                                    <TableCell className="whitespace-pre-wrap">{issue.tindak_lanjut}</TableCell>
                                                    <TableCell>{issue.target}</TableCell>
                                                    <TableCell>{issue.pic}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={issue.status === 'Open' ? 'destructive' : 'default'}>
                                                            {issue.status}
                                                        </Badge>
                                                    </TableCell>
                                                    {!isTamu && (
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openIssueForm(issue)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteIssue(issue.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                            {issues.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                        Belum ada permasalahan ditambahkan.
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

                    {activeTab === 'attendees' && (
                        <div className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Daftar Hadir</CardTitle>
                                    <CardDescription>Peserta yang memindai QR Code akan muncul di sini otomatis.</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => window.open(`/daily-briefings/${briefing.id}/qr`, '_blank')}>
                                    <QrCode className="h-4 w-4 mr-2" /> Buka Tampilan QR
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Jabatan</TableHead>
                                                <TableHead>Divisi / Instansi</TableHead>
                                                <TableHead>Waktu Hadir</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attendees.map(a => (
                                                <TableRow key={a.id}>
                                                    <TableCell className="font-medium">{a.nama}</TableCell>
                                                    <TableCell>{a.jabatan || '-'}</TableCell>
                                                    <TableCell>{a.divisi || '-'}</TableCell>
                                                    <TableCell>{new Date(a.signed_at).toLocaleString('id-ID')}</TableCell>
                                                </TableRow>
                                            ))}
                                            {attendees.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                        Belum ada peserta yang hadir.
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
                </div>
            </div>

            <Dialog open={issueModal} onOpenChange={setIssueModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingIssue ? 'Edit Permasalahan' : 'Tambah Permasalahan'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitIssue} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Permasalahan</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={issueForm.data.permasalahan}
                                onChange={e => issueForm.setData('permasalahan', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tindak Lanjut / Solusi</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
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
        </>
    );
}

DailyBriefingsShow.layout = {
    breadcrumbs: [
        { title: 'Daily Meeting', href: '/daily-briefings' },
        { title: 'Detail', href: '#' },
    ],
};
