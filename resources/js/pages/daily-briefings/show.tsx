import { Head, router, usePage, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Calendar, Users, QrCode, FileText, CheckCircle2, ChevronLeft, Plus, Edit, Pencil, Trash2, Copy, FileSpreadsheet, ImageOff, Handshake, Link2, Images, ClipboardList } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
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
    DialogDescription,
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
    findings = [],
    kickoff = null,
    kickoffPhotos = [],
    findingInfo,
    kickoffDefaults,
    attendUrl = '',
    days = [],
}: {
    briefing: any;
    attendees: any[];
    issues: any[];
    findings?: any[];
    kickoff?: any;
    kickoffPhotos?: any[];
    findingInfo?: any;
    kickoffDefaults?: any;
    attendUrl?: string;
    days?: Array<{
        id: number;
        hari_ke: number | null;
        tanggal: string | null;
        status: string;
        attendees_count: number;
        findings_count: number;
        issues_count: number;
        ada_isi: boolean;
        is_current: boolean;
    }>;
}) {

    const { auth } = usePage<any>().props;
    const isTamu = !(auth?.can?.write ?? false);

    // Link absensi manual — dibagikan ke peserta yang tidak bisa memindai QR.
    const [linkTersalin, setLinkTersalin] = useState(false);

    const salinLinkAbsensi = async () => {
        try {
            await navigator.clipboard.writeText(attendUrl);
        } catch {
            // Clipboard API butuh HTTPS/izin; jatuhkan ke seleksi manual.
            document.getElementById('link-absensi')?.focus();
            return;
        }
        setLinkTersalin(true);
        setTimeout(() => setLinkTersalin(false), 2000);
    };

    // Header Form. Nama penandatangan tidak lagi di sini — diatur terpusat di
    // Data Master → Tanda Tangan (super admin).
    const [headerModal, setHeaderModal] = useState(false);
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
    });

    const submitHeader = (e: React.FormEvent) => {
        e.preventDefault();
        headerForm.put(`/daily-briefings/${briefing.id}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setHeaderModal(false),
        });
    };

    // Photo Form
    const photoForm = useForm({
        foto_dokumentasi: null as File | null,
    });

    const submitPhoto = (e: React.FormEvent) => {
        e.preventDefault();
        photoForm.post(`/daily-briefings/${briefing.id}/photo`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => photoForm.reset(),
        });
    };

    // Issue Form
    const [activeTab, setActiveTab] = useState('temuan');
    const [issueModal, setIssueModal] = useState(false);
    const [editingIssue, setEditingIssue] = useState<any>(null);
    
    const [findingDialogOpen, setFindingDialogOpen] = useState(false);
    const [addDayDialogOpen, setAddDayDialogOpen] = useState(false);
    const [editingFinding, setEditingFinding] = useState<any>(null);
    const briefingTanggal = briefing.tanggal ? new Date(briefing.tanggal).toISOString().split('T')[0] : '';
    const findingForm = useForm({
        tanggal: briefingTanggal,
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
            findingForm.setData({
                tanggal: briefingTanggal,
                uraian: '',
                part_number: '',
                qty: '',
                satuan: '',
                keterangan: '',
                tindak_lanjut: '',
                target: 'Open',
                foto: null,
            });
        }
        setFindingDialogOpen(true);
    };

    const submitFinding = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingFinding 
            ? `/daily-briefings/${briefing.id}/findings/${editingFinding.id}`
            : `/daily-briefings/${briefing.id}/findings`;
            
        findingForm.post(url, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setFindingDialogOpen(false),
        });
    };

    const deleteFinding = (id: number) => {
        if (confirm('Hapus temuan ini?')) {
            router.delete(`/daily-briefings/${briefing.id}/findings/${id}`, { preserveScroll: true });
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
        link_absensi: kickoff?.link_absensi ?? (typeof window !== 'undefined' ? `${window.location.origin}/daily-briefings/attend/${briefing.token}` : ''),
        pimpinan_nama: kickoff?.pimpinan_nama ?? kickoffDefaults?.pimpinan_nama ?? '',
        pimpinan_jabatan: kickoff?.pimpinan_jabatan ?? kickoffDefaults?.pimpinan_jabatan ?? '',
        notulis_nama: kickoff?.notulis_nama ?? kickoffDefaults?.notulis_nama ?? '',
        notulis_jabatan: kickoff?.notulis_jabatan ?? kickoffDefaults?.notulis_jabatan ?? '',
        kota_ttd: kickoff?.kota_ttd ?? kickoffDefaults?.kota_ttd ?? '',
        tanggal_ttd: kickoff?.tanggal_ttd ?? '',
    });

    const submitKickoff = (e: React.FormEvent) => {
        e.preventDefault();
        kickoffForm.post(`/daily-briefings/${briefing.id}/kickoff`, { preserveScroll: true });
    };

    const kickoffPhotoForm = useForm({ foto: null as File | null, caption: '' });
    const submitKickoffPhoto = (e: React.FormEvent) => {
        e.preventDefault();
        kickoffPhotoForm.post(`/daily-briefings/${briefing.id}/kickoff/photos`, {
            preserveScroll: true,
            onSuccess: () => kickoffPhotoForm.reset(),
        });
    };
    const deleteKickoffPhoto = (id: number) => {
        if (confirm('Hapus dokumentasi?')) {
            router.delete(`/daily-briefings/${briefing.id}/kickoff/photos/${id}`, { preserveScroll: true });
        }
    };

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
                preserveState: true,
                onSuccess: () => setIssueModal(false),
            });
        } else {
            issueForm.post(`/daily-briefings/${briefing.id}/issues`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setIssueModal(false),
            });
        }
    };

    const deleteIssue = (id: number) => {
        if (confirm('Hapus permasalahan ini?')) {
            router.delete(`/daily-briefings/${briefing.id}/issues/${id}`, { 
                preserveScroll: true,
                preserveState: true, 
            });
        }
    };

    return (
        <>
            <Head title={`Daily Meeting - ${briefing.judul}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.visit('/daily-briefings')} className="h-9 w-9 shrink-0 shadow-sm">
                            <ChevronLeft className="h-4 w-4" />
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
                    </div>
                </div>

                {/* Navigasi hari. Seluruh hari pelaksanaan sudah terbentuk dari
                    Real Start dan durasinya, jadi tidak ada penambahan manual.
                    Hari yang rapatnya dilewat tetap muncul dalam keadaan kosong,
                    dan hari yang sudah terisi ditandai supaya mudah dibuka lagi
                    untuk diperbarui. */}
                <div className="rounded-lg border bg-muted/30 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-1 text-xs font-semibold text-muted-foreground">
                            Hari rapat:
                        </span>
                        {days.map((d, i) => (
                            <button
                                key={d.id}
                                onClick={() => {
                                    if (!d.is_current) router.visit(`/daily-briefings/${d.id}`);
                                }}
                                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                    d.is_current
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : d.ada_isi
                                          ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50'
                                          : 'bg-background hover:bg-muted'
                                }`}
                                title={
                                    d.ada_isi
                                        ? `Sudah ada isi — ${d.attendees_count} hadir, ${d.findings_count} temuan`
                                        : 'Belum ada rapat pada hari ini'
                                }
                            >
                                <span className="font-bold">Hari {d.hari_ke ?? i + 1}</span>
                                {d.tanggal && (
                                    <span
                                        className={
                                            d.is_current
                                                ? 'text-primary-foreground/80'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {new Date(d.tanggal).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </span>
                                )}
                                {d.ada_isi && !d.is_current && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                )}
                                {d.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                            </button>
                        ))}
                        {!isTamu && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-[30px] text-xs gap-1 ml-2" 
                                onClick={() => setAddDayDialogOpen(true)}
                            >
                                <Plus className="h-3.5 w-3.5" /> Tambah Hari
                            </Button>
                        )}
                    </div>
                    <p className="mt-2 px-1 text-[11px] text-muted-foreground">
                        Hari terbentuk otomatis dari Real Start sepanjang durasi
                        pekerjaan. Anda dapat menambahkan hari di luar rencana jika pekerjaan tertunda. Rapat yang dilewat boleh dibiarkan kosong — notulen
                        dan temuan tiap hari tersimpan sendiri dan tetap bisa dibuka
                        kembali untuk diperbarui.
                    </p>
                </div>

                <div className="w-full">
                    <div className="flex flex-wrap items-center gap-1 bg-muted p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab('attendees')}
                            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'attendees' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}`}
                        >
                            <Users className="h-4 w-4" /> Daftar Hadir ({attendees.length})
                        </button>
                        
                        <button 
                            onClick={() => setActiveTab('temuan')} 
                            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'temuan' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}`}
                        >
                            <ClipboardList className="h-4 w-4" /> Notulen Temuan
                        </button>
                        <button 
                            onClick={() => setActiveTab('kickoff')} 
                            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'kickoff' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}`}
                        >
                            <Handshake className="h-4 w-4" /> Notulen
                        </button>


                    </div>
                    

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
                                    <CardDescription>Peserta yang telah melakukan absensi.</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 justify-end">

                                    <Button variant="outline" onClick={() => window.open(`/daily-briefings/${briefing.id}/qr`, '_blank')}>
                                        <QrCode className="h-4 w-4 mr-2" /> Tampilan QR
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 rounded-md border bg-muted/40 p-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <input
                                                id="link-absensi"
                                                readOnly
                                                value={attendUrl}
                                                onFocus={(e) => e.currentTarget.select()}
                                                className="w-full min-w-0 bg-transparent text-sm outline-none"
                                            />
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <Button variant="outline" size="sm" onClick={salinLinkAbsensi}>
                                                <Copy className="h-3.5 w-3.5 mr-2" />
                                                {linkTersalin ? 'Tersalin' : 'Salin Link'}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => window.open(attendUrl, '_blank')}>
                                                <Link2 className="h-3.5 w-3.5 mr-2" /> Buka
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Bagikan tautan ini agar peserta dapat mengisi daftar hadir sendiri dan melihat siapa saja yang sudah absen. Tautan yang sama ikut tercantum pada lampiran notulen.
                                    </p>
                                </div>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>NID</TableHead>
                                                <TableHead>Instansi</TableHead>
                                                <TableHead>Jabatan</TableHead>
                                                <TableHead>Divisi / Unit</TableHead>
                                                <TableHead>Waktu Hadir</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attendees.map(a => (
                                                <TableRow key={a.id}>
                                                    <TableCell className="font-medium">{a.nama}</TableCell>
                                                    <TableCell>{a.nid || '-'}</TableCell>
                                                    <TableCell>{a.instansi || '-'}</TableCell>
                                                    <TableCell>{a.jabatan || '-'}</TableCell>
                                                    <TableCell>{a.divisi || '-'}</TableCell>
                                                    <TableCell>{new Date(a.signed_at).toLocaleString('id-ID')}</TableCell>
                                                </TableRow>
                                            ))}
                                            {attendees.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                    
                    {activeTab === 'temuan' && (
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 gap-4">
                                <div>
                                    <CardTitle>Notulen Temuan</CardTitle>
                                    <CardDescription>Daftar material temuan overhaul beserta tindak lanjutnya</CardDescription>
                                    {/* Identitas rapat + mesin, sama dengan kepala berkas PDF/Excel */}
                                    {findingInfo && (
                                        <div className="mt-3 grid gap-x-8 gap-y-1 text-xs sm:grid-cols-2">
                                            {[
                                                ['JUDUL RAPAT', findingInfo.judul_rapat],
                                                ['UNIT', findingInfo.unit],
                                                ['JENIS RAPAT', findingInfo.tipe_rapat],
                                                ['JENIS INSPEKSI', findingInfo.jenis_inspeksi],
                                                ['TANGGAL RAPAT', findingInfo.tanggal_rapat],
                                                ['JUMLAH TEMUAN', `${findings.length} item`],
                                            ].map(([label, value]) => (
                                                <div key={label} className="flex gap-2">
                                                    <span className="w-[110px] shrink-0 font-semibold text-muted-foreground">
                                                        {label}
                                                    </span>
                                                    <span className="text-muted-foreground">:</span>
                                                    <span className="font-medium text-red-600 dark:text-red-400">
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 shrink-0">
                                    {!isTamu && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 h-9"
                                            onClick={() => setHeaderModal(true)}
                                        >
                                            <Edit className="h-4 w-4" />
                                            Header
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-briefings/${briefing.id}/findings/export-pdf`, '_blank')}
                                    >
                                        <FileText className="h-4 w-4 text-red-500" />
                                        PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-briefings/${briefing.id}/findings/export-excel`, '_blank')}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        Excel
                                    </Button>
                                    {!isTamu && (
                                        <Button size="sm" className="gap-2 h-9" onClick={() => openFindingForm()}>
                                            <Plus className="h-4 w-4" />
                                            Tambah Temuan
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="w-12 text-center font-bold border-r">NO</TableHead>
                                            <TableHead className="text-center font-bold border-r whitespace-nowrap">TGL</TableHead>
                                            <TableHead className="font-bold border-r min-w-[180px]">URAIAN</TableHead>
                                            <TableHead className="text-center font-bold border-r whitespace-nowrap">P/N</TableHead>
                                            <TableHead className="text-center font-bold border-r">QTY</TableHead>
                                            <TableHead className="text-center font-bold border-r">SATUAN</TableHead>
                                            <TableHead className="text-center font-bold border-r">FOTO</TableHead>
                                            <TableHead className="font-bold border-r min-w-[150px]">KETERANGAN</TableHead>
                                            <TableHead className="font-bold border-r min-w-[220px]">TINDAK LANJUT</TableHead>
                                            <TableHead className="text-center font-bold border-r">TARGET</TableHead>
                                            {!isTamu && <TableHead className="text-center font-bold w-20">AKSI</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {findings.length > 0 ? (
                                            findings.map((f, idx) => (
                                                <TableRow key={f.id} className="hover:bg-muted/30 group">
                                                    <TableCell className="text-center font-mono text-xs text-muted-foreground border-r">{idx + 1}</TableCell>
                                                    <TableCell className="text-center font-mono text-[11px] text-muted-foreground border-r whitespace-nowrap">
                                                        {f.tanggal ? new Date(f.tanggal).toLocaleDateString('id-ID') : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium border-r">{f.uraian}</TableCell>
                                                    <TableCell className="text-center font-mono text-[11px] border-r whitespace-nowrap">{f.part_number || '-'}</TableCell>
                                                    <TableCell className="text-center text-xs border-r">{f.qty ?? '-'}</TableCell>
                                                    <TableCell className="text-center text-xs border-r">{f.satuan || '-'}</TableCell>
                                                    <TableCell className="text-center border-r">
                                                        {f.foto ? (
                                                            <img
                                                                src={f.foto}
                                                                alt={f.uraian}
                                                                className="h-16 w-24 object-cover rounded border mx-auto cursor-zoom-in"
                                                                onClick={() => window.open(f.foto!, '_blank')}
                                                            />
                                                        ) : (
                                                            <ImageOff className="h-5 w-5 mx-auto opacity-20" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs border-r">{f.keterangan || '-'}</TableCell>
                                                    <TableCell className="text-xs border-r whitespace-pre-line">{f.tindak_lanjut || '-'}</TableCell>
                                                    <TableCell className="text-center border-r">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            (f.target || '').toUpperCase() === 'CLOSE'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                        }`}>
                                                            {f.target || 'Open'}
                                                        </span>
                                                    </TableCell>
                                                    {!isTamu && (
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-primary hover:bg-primary/10"
                                                                    onClick={() => openFindingForm(f)}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                                    onClick={() => deleteFinding(f)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={isTamu ? 10 : 11} className="h-48 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                            <ClipboardList className="h-6 w-6 opacity-30" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-semibold">Belum ada temuan</p>
                                                            <p className="text-xs max-w-xs mx-auto">
                                                                Tambahkan material temuan overhaul beserta foto dan tindak lanjutnya.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                    
                    {activeTab === 'kickoff' && (
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 gap-4">
                                <div>
                                    <CardTitle>Notulen</CardTitle>
                                    <CardDescription>Formulir notulen rapat kick off pelaksanaan pekerjaan overhaul</CardDescription>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-briefings/${briefing.id}/kickoff/export-pdf`, '_blank')}
                                    >
                                        <FileText className="h-4 w-4 text-red-500" />
                                        Export PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-briefings/${briefing.id}/kickoff/export-excel`, '_blank')}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        Export Excel
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <form onSubmit={submitKickoff} className="space-y-8">
                                    {/* Identitas dokumen */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">Identitas Dokumen</h4>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="k_nodok">Nomor Dokumen</Label>
                                                <Input id="k_nodok" value={kickoffForm.data.nomor_dokumen}
                                                    onChange={(e) => kickoffForm.setData('nomor_dokumen', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_rev">Revisi</Label>
                                                <Input id="k_rev" value={kickoffForm.data.revisi}
                                                    onChange={(e) => kickoffForm.setData('revisi', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_terbit">Tanggal Terbit</Label>
                                                <Input id="k_terbit" type="date" value={kickoffForm.data.tanggal_terbit}
                                                    onChange={(e) => kickoffForm.setData('tanggal_terbit', e.target.value)} disabled={isTamu} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Identitas rapat */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">Identitas Rapat</h4>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="k_pimpinan">Pimpinan Rapat</Label>
                                                <Input id="k_pimpinan" value={kickoffForm.data.pimpinan_rapat}
                                                    onChange={(e) => kickoffForm.setData('pimpinan_rapat', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_tempat">Tempat</Label>
                                                <Input id="k_tempat" value={kickoffForm.data.tempat}
                                                    onChange={(e) => kickoffForm.setData('tempat', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_waktu">Waktu</Label>
                                                <Input id="k_waktu" placeholder="09.15 WITA - Selesai" value={kickoffForm.data.waktu}
                                                    onChange={(e) => kickoffForm.setData('waktu', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_peserta">Peserta</Label>
                                                <Input id="k_peserta" value={kickoffForm.data.peserta}
                                                    onChange={(e) => kickoffForm.setData('peserta', e.target.value)} disabled={isTamu} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="k_agenda">Agenda</Label>
                                            <Textarea id="k_agenda" className="min-h-[70px] resize-none" value={kickoffForm.data.agenda}
                                                onChange={(e) => kickoffForm.setData('agenda', e.target.value)} disabled={isTamu} />
                                        </div>
                                    </div>

                                    {/* I. Pembahasan */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">I. Pembahasan</h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="k_pln">A. Penyampaian PLN NP UP Kendari</Label>
                                            <Textarea id="k_pln" className="min-h-[150px] resize-none"
                                                placeholder={'Satu poin per baris.\nContoh:\nTerkait rencana pelaksanaan Major Overhaul...\nUntuk mesin Deutz BV 8M 628...'}
                                                value={kickoffForm.data.penyampaian_pln}
                                                onChange={(e) => kickoffForm.setData('penyampaian_pln', e.target.value)} disabled={isTamu} />
                                            <p className="text-xs text-muted-foreground">Tiap baris akan menjadi poin bernomor pada dokumen.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="k_mitra_nama">Nama Mitra / Vendor</Label>
                                            <Input id="k_mitra_nama" placeholder="PT SINAR TIMUR UTAMA RAYA" value={kickoffForm.data.nama_mitra}
                                                onChange={(e) => kickoffForm.setData('nama_mitra', e.target.value)} disabled={isTamu} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="k_mitra">B. Penyampaian Mitra / Vendor</Label>
                                            <Textarea id="k_mitra" className="min-h-[130px] resize-none" placeholder="Satu poin per baris."
                                                value={kickoffForm.data.penyampaian_mitra}
                                                onChange={(e) => kickoffForm.setData('penyampaian_mitra', e.target.value)} disabled={isTamu} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="k_sepakat">C. Hasil Kesepakatan</Label>
                                            <Textarea id="k_sepakat" className="min-h-[130px] resize-none" placeholder="Satu poin per baris."
                                                value={kickoffForm.data.hasil_kesepakatan}
                                                onChange={(e) => kickoffForm.setData('hasil_kesepakatan', e.target.value)} disabled={isTamu} />
                                        </div>
                                    </div>

                                    {/* II. Lampiran - link absensi */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">II. Lampiran</h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="k_absensi" className="flex items-center gap-1.5">
                                                <Link2 className="h-3.5 w-3.5" />
                                                Link Daftar Hadir / Absensi
                                            </Label>
                                            <Input id="k_absensi" type="url" placeholder="https://..." value={kickoffForm.data.link_absensi}
                                                onChange={(e) => kickoffForm.setData('link_absensi', e.target.value)} disabled={isTamu} />
                                            <p className="text-xs text-muted-foreground">
                                                Kosongkan untuk memakai link absensi bawaan rapat ini ({attendees.length} peserta tercatat).
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tanda tangan */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">Tanda Tangan</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Nama &amp; jabatan penandatangan diatur terpusat di
                                            <span className="font-medium"> Data Master → Tanda Tangan</span> (super admin).
                                        </p>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="k_kota">Kota Tanda Tangan</Label>
                                                <Input id="k_kota" value={kickoffForm.data.kota_ttd}
                                                    onChange={(e) => kickoffForm.setData('kota_ttd', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_tglttd">Tanggal Tanda Tangan</Label>
                                                <Input id="k_tglttd" type="date" value={kickoffForm.data.tanggal_ttd}
                                                    onChange={(e) => kickoffForm.setData('tanggal_ttd', e.target.value)} disabled={isTamu} />
                                            </div>
                                        </div>
                                    </div>

                                    {!isTamu && (
                                        <div className="flex justify-end pt-4 border-t">
                                            <Button type="submit" disabled={kickoffForm.processing} className="gap-2 px-8">
                                                <FileText className="h-4 w-4" />
                                                Simpan Notulen Kick Off
                                            </Button>
                                        </div>
                                    )}
                                </form>

                                </CardContent>
                        </Card>
                    )}
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

            {/* Dialog Tambah / Edit Temuan */}
            <Dialog open={findingDialogOpen} onOpenChange={(open) => {
 if (!open) {
 setFindingDialogOpen(false); setEditingFinding(null); 
} 
}}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingFinding ? 'Edit Temuan' : 'Tambah Temuan'}</DialogTitle>
                        <DialogDescription>
                            {editingFinding
                                ? 'Perbarui data material temuan overhaul.'
                                : 'Input data material temuan overhaul baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitFinding} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="f_tanggal">Tanggal</Label>
                                <Input
                                    id="f_tanggal"
                                    type="date"
                                    value={findingForm.data.tanggal}
                                    onChange={(e) => findingForm.setData('tanggal', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="f_target">Target</Label>
                                <Select value={findingForm.data.target} onValueChange={(v) => findingForm.setData('target', v)}>
                                    <SelectTrigger id="f_target">
                                        <SelectValue placeholder="Pilih Target" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="Close">Close</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="f_uraian">Uraian</Label>
                            <Input
                                id="f_uraian"
                                type="text"
                                placeholder="cth: STUD BOLT CYLINDER HEAD NO. 7"
                                value={findingForm.data.uraian}
                                onChange={(e) => findingForm.setData('uraian', e.target.value)}
                            />
                            {findingForm.errors.uraian && <p className="text-xs text-destructive">{findingForm.errors.uraian}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="f_pn">P/N</Label>
                                <Input
                                    id="f_pn"
                                    type="text"
                                    placeholder="1.1110-007"
                                    value={findingForm.data.part_number}
                                    onChange={(e) => findingForm.setData('part_number', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="f_qty">Qty</Label>
                                <Input
                                    id="f_qty"
                                    type="number"
                                    min={0}
                                    value={findingForm.data.qty}
                                    onChange={(e) => findingForm.setData('qty', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="f_satuan">Satuan</Label>
                                <Input
                                    id="f_satuan"
                                    type="text"
                                    placeholder="Bh"
                                    value={findingForm.data.satuan}
                                    onChange={(e) => findingForm.setData('satuan', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="f_foto">Foto</Label>
                            <Input
                                id="f_foto"
                                type="file"
                                accept="image/*"
                                onChange={(e) => findingForm.setData('foto', e.target.files?.[0] ?? null)}
                            />
                            {editingFinding?.foto && !findingForm.data.foto && (
                                <div className="flex items-center gap-2 pt-1">
                                    <img src={editingFinding.foto} alt="Foto saat ini" className="h-14 w-20 object-cover rounded border" />
                                    <span className="text-xs text-muted-foreground">
                                        Foto saat ini. Pilih file baru untuk mengganti.
                                    </span>
                                </div>
                            )}
                            {findingForm.errors.foto && <p className="text-xs text-destructive">{findingForm.errors.foto}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="f_ket">Keterangan</Label>
                            <Textarea
                                id="f_ket"
                                placeholder="cth: Stud Bolt Patah"
                                className="min-h-[70px] resize-none"
                                value={findingForm.data.keterangan}
                                onChange={(e) => findingForm.setData('keterangan', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="f_tl">Tindak Lanjut</Label>
                            <Textarea
                                id="f_tl"
                                placeholder={'Perlu dilakukan penggantian\nAkan menggunakan stok unit'}
                                className="min-h-[100px] resize-none"
                                value={findingForm.data.tindak_lanjut}
                                onChange={(e) => findingForm.setData('tindak_lanjut', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Gunakan baris baru untuk memisahkan tiap poin.</p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => {
 setFindingDialogOpen(false); setEditingFinding(null); 
}}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={findingForm.processing}>
                                {editingFinding ? 'Simpan Perubahan' : 'Simpan Temuan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent></Dialog>

            {/* Dialog Data Header Notulen — dipindah dari tab tersendiri agar
                tidak memakan tempat. Nama penandatangan tidak di sini; diatur di
                Data Master → Tanda Tangan. */}
            <Dialog open={headerModal} onOpenChange={setHeaderModal}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Data Header Notulen</DialogTitle>
                        <DialogDescription>Data ini muncul di bagian atas berkas notulen (PDF/Excel).</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitHeader} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Unit / Mesin</Label>
                                <Input value={headerForm.data.unit} onChange={e => headerForm.setData('unit', e.target.value)} placeholder="PLTD WANGI-WANGI #2" disabled={isTamu} />
                            </div>
                            <div className="space-y-2">
                                <Label>Jenis Inspeksi</Label>
                                <Input value={headerForm.data.jenis_inspeksi} onChange={e => headerForm.setData('jenis_inspeksi', e.target.value)} placeholder="SO" disabled={isTamu} />
                            </div>
                            <div className="space-y-2">
                                <Label>Rapat Framework</Label>
                                <Input value={headerForm.data.rapat_framework} onChange={e => headerForm.setData('rapat_framework', e.target.value)} placeholder="P1" disabled={isTamu} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tgl Performance Test</Label>
                                <Input value={headerForm.data.tgl_performance_test} onChange={e => headerForm.setData('tgl_performance_test', e.target.value)} placeholder="-" disabled={isTamu} />
                            </div>
                            <div className="space-y-2">
                                <Label>Jam Setelah PO Terai</Label>
                                <Input value={headerForm.data.jam_setelah_po_terai} onChange={e => headerForm.setData('jam_setelah_po_terai', e.target.value)} placeholder="7.456 / 16.365" disabled={isTamu} />
                            </div>
                            <div className="space-y-2">
                                <Label>Daya Mampu</Label>
                                <Input value={headerForm.data.daya_mampu} onChange={e => headerForm.setData('daya_mampu', e.target.value)} placeholder="0.128 MW" disabled={isTamu} />
                            </div>
                        </div>
                        <hr />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Nomor Dokumen</Label>
                                <Input value={headerForm.data.nomor_dokumen} onChange={e => headerForm.setData('nomor_dokumen', e.target.value)} disabled={isTamu} />
                            </div>
                            <div className="space-y-2">
                                <Label>Revisi</Label>
                                <Input value={headerForm.data.revisi} onChange={e => headerForm.setData('revisi', e.target.value)} disabled={isTamu} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Terbit</Label>
                                <Input type="date" value={headerForm.data.tanggal_terbit} onChange={e => headerForm.setData('tanggal_terbit', e.target.value)} disabled={isTamu} />
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setHeaderModal(false)}>Tutup</Button>
                            {!isTamu && (
                                <Button type="submit" disabled={headerForm.processing}>Simpan Header</Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={addDayDialogOpen} onOpenChange={setAddDayDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Tambah Hari</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menambahkan satu hari rapat lanjutan di luar rencana?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setAddDayDialogOpen(false)}>Batal</Button>
                        <Button 
                            onClick={() => {
                                setAddDayDialogOpen(false);
                                router.post(`/daily-briefings/${briefing.id}/add-day`);
                            }}
                        >
                            Ya, Tambahkan
                        </Button>
                    </DialogFooter>
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
