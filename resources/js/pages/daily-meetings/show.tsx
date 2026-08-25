import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Users, FileText, QrCode, CheckCircle2, Clock, MapPin, Calendar, Video, ClipboardList, Plus, Edit, Trash2, FileSpreadsheet, ImageOff, Handshake, Link2, Images } from 'lucide-react';
import type { FormEventHandler} from 'react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type Attendee = {
    id: number;
    nama: string;
    divisi: string | null;
    jabatan: string | null;
    signature: string | null;
    signed_at: string;
};

type Meeting = {
    id: number;
    judul: string;
    tanggal: string;
    tanggal_realisasi?: string | null;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    lokasi: string | null;
    token: string;
    status: string;
    link_meeting?: string | null;
    tipe_rapat?: string | null;
};

type Kickoff = {
    nomor_dokumen: string | null;
    revisi: string | null;
    tanggal_terbit: string | null;
    pimpinan_rapat: string | null;
    tempat: string | null;
    waktu: string | null;
    agenda: string | null;
    peserta: string | null;
    penyampaian_pln: string | null;
    nama_mitra: string | null;
    penyampaian_mitra: string | null;
    hasil_kesepakatan: string | null;
    link_absensi: string | null;
    pimpinan_nama: string | null;
    pimpinan_jabatan: string | null;
    notulis_nama: string | null;
    notulis_jabatan: string | null;
    kota_ttd: string | null;
    tanggal_ttd: string | null;
} | null;

type KickoffPhoto = {
    id: number;
    foto: string;
    caption: string | null;
};

type Finding = {
    id: number;
    tanggal: string | null;
    uraian: string;
    part_number: string | null;
    qty: number | null;
    satuan: string | null;
    foto: string | null;
    keterangan: string | null;
    tindak_lanjut: string | null;
    target: string | null;
};

type FindingInfo = {
    judul_rapat: string;
    tipe_rapat: string;
    tanggal_rapat: string;
    unit: string;
    jenis_inspeksi: string;
};


export default function DailyMeetingShow({
    meeting,
    attendees: initialAttendees,
    issues: initialIssues = [],
    findings = [],
    findingInfo,
    kickoff = null,
    kickoffPhotos = [],
    kickoffDefaults,
    notulenWarisanDari = null,
}: {
    meeting: Meeting;
    attendees: Attendee[];
    issues?: any[];
    findings?: Finding[];
    findingInfo?: FindingInfo;
    kickoff?: Kickoff;
    kickoffPhotos?: KickoffPhoto[];
    kickoffDefaults?: Record<string, string>;
    /** Jenis rapat asal salinan notulen; hanya terisi saat baru disalin. */
    notulenWarisanDari?: string | null;
}) {
    const { auth } = usePage<any>().props;
    const isTamu = auth?.user?.role === 'tamu';
    const bolehHapus = auth?.can?.delete ?? false;

    // Notulen Kick Off (FORMULIR NOTULEN RAPAT) kini tersedia untuk SEMUA tipe
    // rapat. Flag P3 dipertahankan hanya untuk menentukan apakah Notulen Temuan
    // masih ditampilkan (rapat non-P3 tetap punya lembar temuan).
    const isKickoffMeeting = (meeting.tipe_rapat || '').toUpperCase() === 'RAPAT P3';

    const [activeTab, setActiveTab] = useState<'hadir' | 'kickoff' | 'issues' | 'dokumentasi'>('hadir');
    const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
    const [issues, setIssues] = useState<any[]>(initialIssues);
    const [findingDialogOpen, setFindingDialogOpen] = useState(false);
    const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
    const [realisasiDialogOpen, setRealisasiDialogOpen] = useState(false);

    const realisasiForm = useForm({
        tanggal_realisasi: meeting.tanggal_realisasi || new Date().toISOString().split('T')[0],
    });

    const submitRealisasi: FormEventHandler = (e) => {
        e.preventDefault();
        realisasiForm.post(`/daily-meetings/${meeting.id}/realisasi`, {
            preserveScroll: true,
            onSuccess: () => setRealisasiDialogOpen(false),
        });
    };

    // --- Kick Off Meeting notulen -----------------------------------------
    const d = kickoffDefaults ?? {};
    const kickoffForm = useForm({
        nomor_dokumen: kickoff?.nomor_dokumen ?? d.nomor_dokumen ?? '',
        revisi: kickoff?.revisi ?? d.revisi ?? '',
        tanggal_terbit: kickoff?.tanggal_terbit ?? '',
        pimpinan_rapat: kickoff?.pimpinan_rapat ?? d.pimpinan_rapat ?? '',
        tempat: kickoff?.tempat ?? d.tempat ?? '',
        waktu: kickoff?.waktu ?? d.waktu ?? '',
        agenda: kickoff?.agenda ?? d.agenda ?? '',
        peserta: kickoff?.peserta ?? d.peserta ?? '',
        penyampaian_pln: kickoff?.penyampaian_pln ?? '',
        nama_mitra: kickoff?.nama_mitra ?? '',
        penyampaian_mitra: kickoff?.penyampaian_mitra ?? '',
        hasil_kesepakatan: kickoff?.hasil_kesepakatan ?? '',
        link_absensi: kickoff?.link_absensi ?? (typeof window !== 'undefined' ? `${window.location.origin}/attend/${meeting.token}` : ''),
        pimpinan_nama: kickoff?.pimpinan_nama ?? d.pimpinan_nama ?? '',
        pimpinan_jabatan: kickoff?.pimpinan_jabatan ?? d.pimpinan_jabatan ?? '',
        notulis_nama: kickoff?.notulis_nama ?? d.notulis_nama ?? '',
        notulis_jabatan: kickoff?.notulis_jabatan ?? d.notulis_jabatan ?? '',
        kota_ttd: kickoff?.kota_ttd ?? d.kota_ttd ?? '',
        tanggal_ttd: kickoff?.tanggal_ttd ?? '',
    });

    const submitKickoff: FormEventHandler = (e) => {
        e.preventDefault();
        kickoffForm.post(`/daily-meetings/${meeting.id}/kickoff`, { preserveScroll: true });
    };

    
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
            ? `/daily-meetings/${meeting.id}/issues/${editingIssue.id}`
            : `/daily-meetings/${meeting.id}/issues`;
        
        if (editingIssue) {
            issueForm.put(url, { preserveScroll: true, onSuccess: () => setIssueModal(false) });
        } else {
            issueForm.post(url, { preserveScroll: true, onSuccess: () => setIssueModal(false) });
        }
    };

    const deleteIssue = (id: number) => {
        if (confirm('Hapus permasalahan ini?')) {
            router.delete(`/daily-meetings/${meeting.id}/issues/${id}`, { preserveScroll: true });
        }
    };

    const photoForm = useForm({ foto: null as File | null, caption: '' });

    const submitPhoto: FormEventHandler = (e) => {
        e.preventDefault();

        if (!photoForm.data.foto) {
return;
}

        photoForm.post(`/daily-meetings/${meeting.id}/kickoff/photos`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => photoForm.reset(),
        });
    };

    const deletePhoto = (p: KickoffPhoto) => {
        if (confirm('Hapus dokumentasi ini?')) {
            router.delete(`/daily-meetings/${meeting.id}/kickoff/photos/${p.id}`, { preserveScroll: true });
        }
    };

    // Poll for new attendees every 5 seconds
    useEffect(() => {
        if (meeting.status !== 'active') {
return;
}

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/daily-meetings/${meeting.id}/attendees-json`);
                const data = await res.json();
                setAttendees(data.attendees);
            } catch { /* ignore */ }
        }, 5000);

        return () => clearInterval(interval);
    }, [meeting.id, meeting.status]);

    const completeMeeting = () => {
        if (confirm('Selesaikan meeting ini?')) {
            router.post(`/daily-meetings/${meeting.id}/complete`);
        }
    };

    const deleteMeeting = () => {
        if (confirm('PERINGATAN: Menghapus rapat ini akan membuang SELURUH data di dalamnya (absensi, foto, notulen). Apakah Anda yakin?')) {
            router.delete(`/daily-meetings/${meeting.id}`);
        }
    };

    const tabs = [
        { key: 'hadir' as const, label: 'Daftar Hadir', icon: Users, count: attendees.length },
        ...(isKickoffMeeting
            ? [{ key: 'kickoff' as const, label: 'Notulen Kick Off Meeting', icon: Handshake }]
            : [
                { key: 'issues' as const, label: 'Notulen', icon: ClipboardList, count: issues.length },
                { key: 'dokumentasi' as const, label: 'Dokumentasi', icon: Images }
              ]),
    ];

    return (
        <>
            <Head title={`Meeting: ${meeting.judul}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Meeting Info Header */}
                <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{meeting.judul}</h1>
                                    <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'} className={meeting.status === 'active' ? 'bg-blue-500 hover:bg-blue-600 gap-1.5' : 'gap-1.5'}>
                                        {meeting.status === 'active' ? (
                                            <>Akan Datang</>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-3 w-3" />
                                                Selesai
                                            </>
                                        )}
                                    </Badge>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground mt-2">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Rencana</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm">
                                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <span className="font-medium text-foreground">{new Date(meeting.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Realisasi</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm">
                                                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                                            </div>
                                            {meeting.tanggal_realisasi ? (
                                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                                    {new Date(meeting.tanggal_realisasi).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground/60 italic text-[13px]">Belum direalisasikan</span>
                                            )}
                                        </div>
                                    </div>
                                    {meeting.waktu_mulai && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm">
                                                <Clock className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <span>{meeting.waktu_mulai.slice(0, 5)}{meeting.waktu_selesai && ` - ${meeting.waktu_selesai.slice(0, 5)}`}</span>
                                        </div>
                                    )}
                                    {meeting.lokasi && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm">
                                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <span>{meeting.lokasi}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 shrink-0">
                                {meeting.link_meeting && (
                                    <Button variant="default" size="sm" className="gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.open(meeting.link_meeting!, '_blank')}>
                                        <Video className="h-4 w-4" />
                                        Join Zoom Meeting
                                    </Button>
                                )}
                                {['active'].includes(meeting.status) && !isTamu && (
                                    <>
                                        {bolehHapus && (
                                            <Button variant="outline" size="sm" className="gap-2 h-9 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={deleteMeeting}>
                                                <Trash2 className="h-4 w-4" />
                                                Hapus
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 h-9"
                                            onClick={() => window.open(`/daily-meetings/${meeting.id}/qr`, '_blank')}
                                        >
                                            <QrCode className="h-4 w-4" />
                                            QR Code
                                        </Button>
                                        {!meeting.tanggal_realisasi ? (
                                            <Button variant="default" size="sm" className="gap-2 h-9 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setRealisasiDialogOpen(true)}>
                                                <Calendar className="h-4 w-4" />
                                                Mulai Rapat (Set Realisasi)
                                            </Button>
                                        ) : (
                                            <Button variant="default" size="sm" className="gap-2 h-9" onClick={completeMeeting}>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Selesaikan Rapat
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dialog Set Realisasi */}
                <Dialog open={realisasiDialogOpen} onOpenChange={setRealisasiDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mulai Rapat & Set Realisasi</DialogTitle>
                            <DialogDescription>
                                Silakan tentukan tanggal realisasi untuk rapat ini. Rapat akan ditandai telah terealisasi.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitRealisasi} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tanggal Realisasi</Label>
                                <Input
                                    type="date"
                                    value={realisasiForm.data.tanggal_realisasi}
                                    onChange={(e) => realisasiForm.setData('tanggal_realisasi', e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setRealisasiDialogOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={realisasiForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">Simpan & Mulai</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Tabs Navigation */}
                <div className="flex p-1 bg-muted/50 rounded-lg w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                activeTab === tab.key
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {'count' in tab && tab.count !== undefined && (
                                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold">
                                    {tab.count}
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'hadir' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div>
                                    <CardTitle>Daftar Hadir Peserta</CardTitle>
                                    <CardDescription>Daftar seluruh personil yang telah melakukan absensi</CardDescription>
                                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-dashed">
                                        <Link2 className="h-4 w-4 shrink-0" />
                                        <span>Link Absensi Manual:</span>
                                        <a 
                                            href={typeof window !== 'undefined' ? `${window.location.origin}/attend/${meeting.token}` : ''} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-primary hover:underline font-medium truncate max-w-[200px] sm:max-w-md"
                                        >
                                            {typeof window !== 'undefined' ? `${window.location.origin}/attend/${meeting.token}` : ''}
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 shrink-0 ml-1"
                                            onClick={() => {
                                                navigator.clipboard.writeText(typeof window !== 'undefined' ? `${window.location.origin}/attend/${meeting.token}` : '');
                                                alert('Link absensi disalin ke clipboard!');
                                            }}
                                            title="Salin Link"
                                        >
                                            <ClipboardList className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                {['active', 'berlangsung'].includes(meeting.status) && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium dark:bg-emerald-950/30 dark:text-emerald-400">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Auto-refresh 5s
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="w-12 text-center font-bold border-r last:border-r-0">No</TableHead>
                                            <TableHead className="text-center font-bold border-r last:border-r-0">Nama</TableHead>
                                            <TableHead className="text-center font-bold border-r last:border-r-0">Divisi / Jabatan</TableHead>
                                            <TableHead className="text-center font-bold border-r last:border-r-0">Tanda Tangan</TableHead>
                                            <TableHead className="text-center font-bold border-r last:border-r-0">Waktu Hadir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendees.length > 0 ? (
                                            attendees.map((att, idx) => (
                                                <TableRow key={att.id} className="hover:bg-muted/30">
                                                    <TableCell className="text-center text-muted-foreground font-mono border-r last:border-r-0">{idx + 1}</TableCell>
                                                    <TableCell className="font-semibold text-foreground border-r last:border-r-0">{att.nama}</TableCell>
                                                    <TableCell className="border-r last:border-r-0">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{att.divisi || '-'}</span>
                                                            <span className="text-xs text-muted-foreground">{att.jabatan || '-'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="flex justify-center border-r last:border-r-0">
                                                        {att.signature ? (
                                                            <div className="p-1 rounded border bg-white shadow-sm overflow-hidden flex items-center justify-center">
                                                                <img src={att.signature} alt="TTD" className="h-10 w-auto object-contain" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground italic text-xs">Belum TTD</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground font-medium border-r last:border-r-0">
                                                        {att.signed_at ? new Date(att.signed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                            <Users className="h-6 w-6 opacity-30" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-semibold">Belum ada peserta hadir</p>
                                                            <p className="text-xs max-w-xs mx-auto">Silakan tampilkan QR Code agar peserta dapat melakukan absensi melalui perangkat masing-masing.</p>
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

                    {activeTab === 'issues' && (
                        <div className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Notulen</CardTitle>
                                    <CardDescription>Catatan permasalahan dan tindak lanjut (Notulen Rapat)</CardDescription>
                                    {/* Muncul sekali, pada kunjungan yang benar-benar
                                        menyalin — supaya jelas dari mana barisnya. */}
                                    {notulenWarisanDari && (
                                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                                            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                                            Notulen disalin dari{' '}
                                            <span className="font-semibold">{notulenWarisanDari}</span>
                                            {' '}— perbarui statusnya sesuai hasil rapat ini.
                                        </p>
                                    )}
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-meetings/${meeting.id}/issues/export-pdf`, '_blank')}
                                    >
                                        <FileText className="h-4 w-4 text-red-500" />
                                        Export PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-meetings/${meeting.id}/issues/export-excel`, '_blank')}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        Export Excel
                                    </Button>
                                    {!isTamu && (
                                        <Button onClick={() => openIssueForm()} size="sm" className="h-9 gap-1">
                                            <Plus className="h-3.5 w-3.5" /> Tambah
                                        </Button>
                                    )}
                                </div>
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

                    {activeTab === 'dokumentasi' && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dokumentasi</CardTitle>
                                    <CardDescription>Foto-foto pelaksanaan atau permasalahan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!isTamu && (
                                        <form onSubmit={submitPhoto} className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                                <Label htmlFor="foto">Upload Foto</Label>
                                                <Input
                                                    id="foto"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => photoForm.setData('foto', e.target.files?.[0] || null)}
                                                />
                                            </div>
                                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                                <Label htmlFor="caption">Caption (Opsional)</Label>
                                                <Input
                                                    id="caption"
                                                    value={photoForm.data.caption}
                                                    onChange={(e) => photoForm.setData('caption', e.target.value)}
                                                    placeholder="Keterangan foto..."
                                                />
                                            </div>
                                            <Button type="submit" disabled={photoForm.processing || !photoForm.data.foto}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Tambah Foto
                                            </Button>
                                        </form>
                                    )}

                                    {kickoffPhotos.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {kickoffPhotos.map((p) => (
                                                <div key={p.id} className="group relative rounded-lg border overflow-hidden bg-card">
                                                    <img src={p.foto} alt={p.caption || 'Dokumentasi'} className="h-40 w-full object-cover" />
                                                    <div className="p-2 text-xs text-muted-foreground">{p.caption || '-'}</div>
                                                    {!isTamu && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                                            onClick={() => deletePhoto(p)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/50">
                                            <Images className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                                            <p className="text-sm text-muted-foreground">Belum ada dokumentasi</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'kickoff' && (
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 gap-4">
                                <div>
                                    <CardTitle>Notulen Kick Off Meeting</CardTitle>
                                    <CardDescription>Formulir notulen rapat kick off pelaksanaan pekerjaan overhaul</CardDescription>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-meetings/${meeting.id}/kickoff/export-pdf`, '_blank')}
                                    >
                                        <FileText className="h-4 w-4 text-red-500" />
                                        Export PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-meetings/${meeting.id}/kickoff/export-excel`, '_blank')}
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
                                                Kosongkan untuk memakai daftar hadir yang tercatat di sistem ({attendees.length} peserta).
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

                                {/* Dokumentasi rapat - form terpisah agar upload tidak mengganggu form utama */}
                                <div className="space-y-4 border-t pt-6">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80 flex items-center gap-1.5">
                                        <Images className="h-3.5 w-3.5" />
                                        Dokumentasi Rapat
                                    </h4>

                                    {!isTamu && (
                                        <form onSubmit={submitPhoto} className="flex flex-wrap items-end gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="k_foto">Foto</Label>
                                                <Input
                                                    id="k_foto"
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-64"
                                                    onChange={(e) => photoForm.setData('foto', e.target.files?.[0] ?? null)}
                                                />
                                            </div>
                                            <div className="space-y-2 flex-1 min-w-[200px]">
                                                <Label htmlFor="k_cap">Keterangan</Label>
                                                <Input
                                                    id="k_cap"
                                                    placeholder="cth: Pembukaan rapat"
                                                    value={photoForm.data.caption}
                                                    onChange={(e) => photoForm.setData('caption', e.target.value)}
                                                />
                                            </div>
                                            <Button type="submit" variant="outline" className="gap-2" disabled={photoForm.processing || !photoForm.data.foto}>
                                                <Plus className="h-4 w-4" />
                                                Tambah Foto
                                            </Button>
                                        </form>
                                    )}

                                    {kickoffPhotos.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {kickoffPhotos.map((p) => (
                                                <div key={p.id} className="group relative rounded-lg border overflow-hidden bg-card">
                                                    <img src={p.foto} alt={p.caption || 'Dokumentasi'} className="h-40 w-full object-cover" />
                                                    <div className="p-2 text-xs text-muted-foreground">{p.caption || '-'}</div>
                                                    {!isTamu && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => deletePhoto(p)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed">
                                            <Images className="h-8 w-8 opacity-20 mb-2" />
                                            <p className="text-sm text-muted-foreground italic">Belum ada dokumentasi rapat.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
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

        </>
    );
}

DailyMeetingShow.layout = {
    breadcrumbs: [
        {
            title: 'Rapat Outage',
            href: '/daily-meetings',
        },
        {
            title: 'Detail Rapat',
            href: '#',
        },
    ],
};
