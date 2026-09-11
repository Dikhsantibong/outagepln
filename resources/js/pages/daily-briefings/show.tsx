import { Head, router, usePage, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Calendar, Users, QrCode, FileText, CheckCircle2, ChevronLeft, ChevronRight, Plus, Edit, Pencil, Trash2, Copy, FileSpreadsheet, ImageOff, Handshake, Link2, Images, ClipboardList, Eye } from 'lucide-react';
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
import KickoffDocumentPreview from '@/components/kickoff-document-preview';
import LetterEditor from '@/components/letter-editor';

export default function DailyBriefingsShow({
    briefing,
    attendees,
    issues,
    findings = [],
    kickoff = null,
    kickoffPhotos = [],
    findingInfo,
    kickoffDefaults,
    masterTtds = [],
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
    /** Daftar penandatangan dari Data Master → Tanda Tangan. */
    masterTtds?: Array<{
        id: number;
        nama: string;
        jabatan: string | null;
        tipe: string | null;
        signature: string | null;
    }>;
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

    // Pagination tabel temuan (client-side) — data temuan dikirim penuh dari
    // controller sebagai array, jadi halamannya dibagi di sisi klien.
    const FINDINGS_PER_PAGE = 10;
    const [findingsPage, setFindingsPage] = useState(1);
    const findingsTotalPages = Math.max(1, Math.ceil(findings.length / FINDINGS_PER_PAGE));
    const currentFindingsPage = Math.min(findingsPage, findingsTotalPages);
    const paginatedFindings = findings.slice(
        (currentFindingsPage - 1) * FINDINGS_PER_PAGE,
        currentFindingsPage * FINDINGS_PER_PAGE,
    );
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
        kickoffForm.post(`/daily-briefings/${briefing.id}/kickoff`, { 
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => alert('Notulen berhasil disimpan!')
        });
    };

    const [previewModal, setPreviewModal] = useState(false);

    // Dokumentasi rapat — berkas terpisah dari formulir notulen supaya unggahan
    // foto tidak ikut mengirim ulang seluruh isian notulen.
    const kickoffPhotoForm = useForm({ foto: null as File | null, caption: '' });
    const submitKickoffPhoto = (e: React.FormEvent) => {
        e.preventDefault();

        if (!kickoffPhotoForm.data.foto) {
            return;
        }

        kickoffPhotoForm.post(`/daily-briefings/${briefing.id}/kickoff/photos`, {
            forceFormData: true,
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
                                                    <span className="font-medium text-foreground">
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
                            <CardContent className="p-0">
                                <div className="overflow-x-auto border-y">
                                    <Table className="min-w-[900px] text-sm [&_td]:align-top">
                                        <TableHeader>
                                            <TableRow className="border-b bg-muted/60 hover:bg-muted/60">
                                                <TableHead className="h-10 w-12 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">No</TableHead>
                                                <TableHead className="h-10 whitespace-nowrap text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tgl</TableHead>
                                                <TableHead className="h-10 min-w-[180px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Uraian</TableHead>
                                                <TableHead className="h-10 whitespace-nowrap text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">P/N</TableHead>
                                                <TableHead className="h-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qty</TableHead>
                                                <TableHead className="h-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Satuan</TableHead>
                                                <TableHead className="h-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Foto</TableHead>
                                                <TableHead className="h-10 min-w-[150px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Keterangan</TableHead>
                                                <TableHead className="h-10 min-w-[220px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tindak Lanjut</TableHead>
                                                <TableHead className="h-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Target</TableHead>
                                                {!isTamu && <TableHead className="h-10 w-20 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Aksi</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {findings.length > 0 ? (
                                                paginatedFindings.map((f, idx) => (
                                                    <TableRow key={f.id} className="border-b transition-colors even:bg-muted/20 hover:bg-muted/40">
                                                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                            {(currentFindingsPage - 1) * FINDINGS_PER_PAGE + idx + 1}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap text-center font-mono text-[11px] text-muted-foreground">
                                                            {f.tanggal ? new Date(f.tanggal).toLocaleDateString('id-ID') : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-medium leading-relaxed">{f.uraian}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-center font-mono text-[11px] text-muted-foreground">{f.part_number || '-'}</TableCell>
                                                        <TableCell className="text-center text-xs tabular-nums">{f.qty ?? '-'}</TableCell>
                                                        <TableCell className="text-center text-xs">{f.satuan || '-'}</TableCell>
                                                        <TableCell className="text-center">
                                                            {f.foto ? (
                                                                <img
                                                                    src={f.foto}
                                                                    alt={f.uraian}
                                                                    className="mx-auto h-16 w-24 cursor-zoom-in rounded-md border object-cover transition-transform hover:scale-105"
                                                                    onClick={() => window.open(f.foto!, '_blank')}
                                                                />
                                                            ) : (
                                                                <ImageOff className="mx-auto h-5 w-5 opacity-20" />
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs leading-relaxed text-muted-foreground">{f.keterangan || '-'}</TableCell>
                                                        <TableCell className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{f.tindak_lanjut || '-'}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                                (f.target || '').toUpperCase() === 'CLOSE'
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                            }`}>
                                                                {f.target || 'Open'}
                                                            </span>
                                                        </TableCell>
                                                        {!isTamu && (
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center gap-1">
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
                                                                        onClick={() => deleteFinding(f.id)}
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
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                                                <ClipboardList className="h-6 w-6 opacity-30" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="font-semibold">Belum ada temuan</p>
                                                                <p className="mx-auto max-w-xs text-xs">
                                                                    Tambahkan material temuan overhaul beserta foto dan tindak lanjutnya.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Kontrol pagination — hanya tampil bila datanya lebih
                                    dari satu halaman. */}
                                {findings.length > 0 && (
                                    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
                                        <p className="text-xs text-muted-foreground">
                                            Menampilkan{' '}
                                            <span className="font-medium text-foreground">
                                                {(currentFindingsPage - 1) * FINDINGS_PER_PAGE + 1}
                                            </span>
                                            {' '}–{' '}
                                            <span className="font-medium text-foreground">
                                                {Math.min(currentFindingsPage * FINDINGS_PER_PAGE, findings.length)}
                                            </span>
                                            {' '}dari{' '}
                                            <span className="font-medium text-foreground">{findings.length}</span>
                                            {' '}temuan
                                        </p>
                                        {findingsTotalPages > 1 && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2"
                                                    disabled={currentFindingsPage <= 1}
                                                    onClick={() => setFindingsPage((p) => Math.max(1, p - 1))}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    <span className="ml-1 hidden sm:inline">Sebelumnya</span>
                                                </Button>
                                                {Array.from({ length: findingsTotalPages }, (_, i) => i + 1).map((page) => (
                                                    <Button
                                                        key={page}
                                                        variant={page === currentFindingsPage ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-xs"
                                                        onClick={() => setFindingsPage(page)}
                                                    >
                                                        {page}
                                                    </Button>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2"
                                                    disabled={currentFindingsPage >= findingsTotalPages}
                                                    onClick={() => setFindingsPage((p) => Math.min(findingsTotalPages, p + 1))}
                                                >
                                                    <span className="mr-1 hidden sm:inline">Berikutnya</span>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    
                    {activeTab === 'kickoff' && (
                        <div className="space-y-6">
                            <Card className="border-none shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 gap-4 border-b mb-6">
                                <div>
                                    <CardTitle>Notulen</CardTitle>
                                    <CardDescription>Formulir notulen rapat kick off pelaksanaan pekerjaan overhaul</CardDescription>
                                </div>
                                <div className="flex shrink-0 gap-2 items-center">
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
                            <CardContent className="space-y-8 pt-6">
                                <form onSubmit={submitKickoff} className="grid gap-6 md:grid-cols-3 items-start">
                                    
                                    {/* Left Column: Metadata */}
                                    <div className="space-y-6 md:col-span-1">
                                        <Card className="shadow-none">
                                            <CardHeader className="pb-4 border-b">
                                                <CardTitle className="text-base">Metadata Notulen</CardTitle>
                                                <CardDescription className="text-xs">Informasi dasar dokumen dan rapat.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4 pt-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="k_nodok">Nomor Dokumen</Label>
                                                    <Input id="k_nodok" value={kickoffForm.data.nomor_dokumen}
                                                        onChange={(e) => kickoffForm.setData('nomor_dokumen', e.target.value)} disabled={isTamu} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
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
                                                
                                                <div className="border-t pt-4 space-y-4">
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
                                                    <div className="space-y-2">
                                                        <Label htmlFor="k_mitra_nama">Nama Mitra / Vendor</Label>
                                                        <Input id="k_mitra_nama" placeholder="PT SINAR TIMUR UTAMA RAYA" value={kickoffForm.data.nama_mitra}
                                                            onChange={(e) => kickoffForm.setData('nama_mitra', e.target.value)} disabled={isTamu} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="k_agenda">Agenda</Label>
                                                        <Textarea id="k_agenda" className="min-h-[70px] resize-none" value={kickoffForm.data.agenda}
                                                            onChange={(e) => kickoffForm.setData('agenda', e.target.value)} disabled={isTamu} />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-none">
                                            <CardHeader className="pb-4 border-b">
                                                <CardTitle className="text-base">Pengaturan Tambahan</CardTitle>
                                                <CardDescription className="text-xs">Lampiran dan penandatangan.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4 pt-4">
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
                                                <div className="border-t pt-4 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Menyetujui (Pimpinan Rapat)</Label>
                                                        <Select
                                                            value={kickoffForm.data.pimpinan_nama}
                                                            onValueChange={(val) => {
                                                                kickoffForm.setData('pimpinan_nama', val);
                                                                const ttd = masterTtds?.find((t: any) => t.nama === val);
                                                                if (ttd) kickoffForm.setData('pimpinan_jabatan', ttd.jabatan || '');
                                                            }}
                                                            disabled={isTamu}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Pimpinan Rapat" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {masterTtds?.map((t: any) => (
                                                                    <SelectItem key={t.id} value={t.nama}>
                                                                        {t.nama} {t.tipe ? `(${t.tipe})` : ''}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Dibuat / Notulis</Label>
                                                        <Select
                                                            value={kickoffForm.data.notulis_nama}
                                                            onValueChange={(val) => {
                                                                kickoffForm.setData('notulis_nama', val);
                                                                const ttd = masterTtds?.find((t: any) => t.nama === val);
                                                                if (ttd) kickoffForm.setData('notulis_jabatan', ttd.jabatan || '');
                                                            }}
                                                            disabled={isTamu}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Notulis" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {masterTtds?.map((t: any) => (
                                                                    <SelectItem key={t.id} value={t.nama}>
                                                                        {t.nama} {t.tipe ? `(${t.tipe})` : ''}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
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
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column: Editor & Preview */}
                                    <div className="space-y-6 md:col-span-2">
                                        <Card className="h-full flex flex-col shadow-none">
                                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b gap-4">
                                                <div>
                                                    <CardTitle className="text-base">Isi Notulen</CardTitle>
                                                    <CardDescription className="text-xs">Kop surat, tanggal, dan tanda tangan otomatis ditambahkan pada PDF.</CardDescription>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1 bg-muted p-1 rounded-lg w-fit border shadow-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewModal(false)}
                                                        className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${!previewModal ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        <Edit className="h-3.5 w-3.5" /> Editor
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewModal(true)}
                                                        className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${previewModal ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" /> Pratinjau
                                                    </button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4 flex-1 flex flex-col pt-4 p-0 sm:p-6">
                                                {previewModal ? (
                                                    <div className="w-full rounded-md border overflow-hidden bg-gray-50 flex-1 min-h-[500px]">
                                                        <KickoffDocumentPreview 
                                                            data={kickoffForm.data} 
                                                            meetingDate={briefing.tanggal}
                                                            attendeesCount={attendees.length}
                                                            photos={kickoffPhotos}
                                                            className="max-h-[800px]"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex flex-col space-y-8">
                                                        <div className="space-y-2">
                                                            <h4 className="font-bold underline text-sm">A. Penyampaian PLN NP UP Kendari</h4>
                                                            {isTamu ? (
                                                                <div className="min-h-[150px] p-3 border rounded-md bg-muted/50 text-sm overflow-hidden tiptap-preview" dangerouslySetInnerHTML={{ __html: kickoffForm.data.penyampaian_pln }} />
                                                            ) : (
                                                                <LetterEditor 
                                                                    value={kickoffForm.data.penyampaian_pln} 
                                                                    onChange={(val) => kickoffForm.setData('penyampaian_pln', val)} 
                                                                    className="min-h-[150px] border shadow-sm rounded-md"
                                                                    placeholder="Ketik pembahasan PLN di sini..."
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="font-bold underline text-sm">B. Penyampaian {kickoffForm.data.nama_mitra || 'Mitra / Vendor'}</h4>
                                                            {isTamu ? (
                                                                <div className="min-h-[150px] p-3 border rounded-md bg-muted/50 text-sm overflow-hidden tiptap-preview" dangerouslySetInnerHTML={{ __html: kickoffForm.data.penyampaian_mitra }} />
                                                            ) : (
                                                                <LetterEditor 
                                                                    value={kickoffForm.data.penyampaian_mitra} 
                                                                    onChange={(val) => kickoffForm.setData('penyampaian_mitra', val)} 
                                                                    className="min-h-[150px] border shadow-sm rounded-md"
                                                                    placeholder="Ketik penyampaian mitra di sini..."
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="font-bold underline text-sm">C. Hasil Kesepakatan</h4>
                                                            {isTamu ? (
                                                                <div className="min-h-[150px] p-3 border rounded-md bg-muted/50 text-sm overflow-hidden tiptap-preview" dangerouslySetInnerHTML={{ __html: kickoffForm.data.hasil_kesepakatan }} />
                                                            ) : (
                                                                <LetterEditor 
                                                                    value={kickoffForm.data.hasil_kesepakatan} 
                                                                    onChange={(val) => kickoffForm.setData('hasil_kesepakatan', val)} 
                                                                    className="min-h-[150px] border shadow-sm rounded-md"
                                                                    placeholder="Ketik hasil kesepakatan di sini..."
                                                                />
                                                            )}
                                                        </div>
                                                        {!isTamu && (
                                                            <div className="flex justify-end pt-4 border-t">
                                                                <Button type="submit" disabled={kickoffForm.processing} className="gap-2 px-8">
                                                                    <FileText className="h-4 w-4" />
                                                                    Simpan Notulen Kick Off
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </form>

                                {/* Dokumentasi rapat — ikut tercetak pada notulen
                                    PDF/Excel, jadi unggahannya disediakan di sini.
                                    Formulirnya sengaja di luar <form> notulen agar
                                    keduanya bisa disimpan sendiri-sendiri. */}
                                <div className="space-y-4 border-t pt-6">
                                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-primary/80">
                                        <Images className="h-3.5 w-3.5" />
                                        Dokumentasi Rapat
                                    </h4>

                                    {!isTamu && (
                                        <form onSubmit={submitKickoffPhoto} className="flex flex-wrap items-end gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="k_foto">Foto</Label>
                                                <Input
                                                    id="k_foto"
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-64"
                                                    onChange={(e) => kickoffPhotoForm.setData('foto', e.target.files?.[0] ?? null)}
                                                />
                                                {kickoffPhotoForm.errors.foto && (
                                                    <p className="text-xs text-destructive">{kickoffPhotoForm.errors.foto}</p>
                                                )}
                                            </div>
                                            <div className="min-w-[200px] flex-1 space-y-2">
                                                <Label htmlFor="k_cap">Keterangan</Label>
                                                <Input
                                                    id="k_cap"
                                                    placeholder="cth: Pembukaan rapat"
                                                    value={kickoffPhotoForm.data.caption}
                                                    onChange={(e) => kickoffPhotoForm.setData('caption', e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                className="gap-2"
                                                disabled={kickoffPhotoForm.processing || !kickoffPhotoForm.data.foto}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tambah Foto
                                            </Button>
                                        </form>
                                    )}

                                    {kickoffPhotos.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {kickoffPhotos.map((p: any) => (
                                                <div key={p.id} className="group relative overflow-hidden rounded-lg border bg-card">
                                                    <img
                                                        src={p.foto}
                                                        alt={p.caption || 'Dokumentasi'}
                                                        className="h-40 w-full cursor-zoom-in object-cover"
                                                        onClick={() => window.open(p.foto, '_blank')}
                                                    />
                                                    <div className="p-2 text-xs text-muted-foreground">{p.caption || '-'}</div>
                                                    {!isTamu && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                                            onClick={() => deleteKickoffPhoto(p.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                            <ImageOff className="mb-2 h-8 w-8 opacity-20" />
                                            <p className="text-sm italic text-muted-foreground">
                                                Belum ada dokumentasi rapat.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        </div>
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
