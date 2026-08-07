import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Users, FileText, QrCode, CheckCircle2, Clock, MapPin, Calendar, Printer, Info, Video, ClipboardList, Plus, Pencil, Trash2, FileSpreadsheet, ImageOff, Handshake, Link2, Images } from 'lucide-react';
import type { FormEventHandler} from 'react';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

type Minutes = {
    id: number;
    meeting_id: number;
    agenda: string | null;
    latar_belakang: string | null;
    pembahasan: string | null;
    hasil_kesepakatan: string | null;
} | null;

type Meeting = {
    id: number;
    judul: string;
    tanggal: string;
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

const emptyFinding = {
    tanggal: '',
    uraian: '',
    part_number: '',
    qty: '',
    satuan: '',
    keterangan: '',
    tindak_lanjut: '',
    target: 'Open',
    foto: null as File | null,
};

export default function DailyMeetingShow({
    meeting,
    attendees: initialAttendees,
    minutes,
    findings = [],
    findingInfo,
    kickoff = null,
    kickoffPhotos = [],
    kickoffDefaults,
}: {
    meeting: Meeting;
    attendees: Attendee[];
    minutes: Minutes;
    findings?: Finding[];
    findingInfo?: FindingInfo;
    kickoff?: Kickoff;
    kickoffPhotos?: KickoffPhoto[];
    kickoffDefaults?: Record<string, string>;
}) {
    const { auth } = usePage<any>().props;
    const isTamu = auth?.user?.role === 'tamu';

    // Rapat P3 uses the Kick Off notulen; every other type uses Notulen Temuan.
    const isKickoffMeeting = (meeting.tipe_rapat || '').toUpperCase() === 'RAPAT P3';

    const [activeTab, setActiveTab] = useState<'hadir' | 'notulen' | 'temuan' | 'kickoff'>('hadir');
    const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
    const [findingDialogOpen, setFindingDialogOpen] = useState(false);
    const [editingFinding, setEditingFinding] = useState<Finding | null>(null);

    const findingForm = useForm({ ...emptyFinding });

    const openAddFinding = () => {
        setEditingFinding(null);
        findingForm.setData({ ...emptyFinding });
        findingForm.clearErrors();
        setFindingDialogOpen(true);
    };

    const openEditFinding = (f: Finding) => {
        setEditingFinding(f);
        findingForm.setData({
            tanggal: f.tanggal || '',
            uraian: f.uraian || '',
            part_number: f.part_number || '',
            qty: f.qty?.toString() || '',
            satuan: f.satuan || '',
            keterangan: f.keterangan || '',
            tindak_lanjut: f.tindak_lanjut || '',
            target: f.target || 'Open',
            foto: null,
        });
        findingForm.clearErrors();
        setFindingDialogOpen(true);
    };

    const submitFinding: FormEventHandler = (e) => {
        e.preventDefault();
        const url = editingFinding
            ? `/daily-meetings/${meeting.id}/findings/${editingFinding.id}`
            : `/daily-meetings/${meeting.id}/findings`;

        // Always POST: file uploads cannot be sent through a PUT request.
        findingForm.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setFindingDialogOpen(false);
                setEditingFinding(null);
                findingForm.reset();
            },
        });
    };

    const deleteFinding = (f: Finding) => {
        if (confirm(`Hapus temuan "${f.uraian}"?`)) {
            router.delete(`/daily-meetings/${meeting.id}/findings/${f.id}`, { preserveScroll: true });
        }
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
        link_absensi: kickoff?.link_absensi ?? '',
        pimpinan_nama: kickoff?.pimpinan_nama ?? '',
        pimpinan_jabatan: kickoff?.pimpinan_jabatan ?? d.pimpinan_jabatan ?? '',
        notulis_nama: kickoff?.notulis_nama ?? '',
        notulis_jabatan: kickoff?.notulis_jabatan ?? d.notulis_jabatan ?? '',
        kota_ttd: kickoff?.kota_ttd ?? d.kota_ttd ?? '',
        tanggal_ttd: kickoff?.tanggal_ttd ?? '',
    });

    const submitKickoff: FormEventHandler = (e) => {
        e.preventDefault();
        kickoffForm.post(`/daily-meetings/${meeting.id}/kickoff`, { preserveScroll: true });
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

    const minutesForm = useForm({
        agenda: minutes?.agenda || '',
        latar_belakang: minutes?.latar_belakang || '',
        pembahasan: minutes?.pembahasan || '',
        hasil_kesepakatan: minutes?.hasil_kesepakatan || '',
    });

    const submitMinutes: FormEventHandler = (e) => {
        e.preventDefault();
        minutesForm.post(`/daily-meetings/${meeting.id}/minutes`);
    };

    const printNotulen = () => {
        const tanggalFormatted = new Date(meeting.tanggal).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        const waktuStr = meeting.waktu_mulai
            ? `${meeting.waktu_mulai.slice(0, 5)} Wita${meeting.waktu_selesai ? ' - ' + meeting.waktu_selesai.slice(0, 5) + ' Wita' : ' - Selesai'}`
            : '';

        const nl2br = (text: string | null | undefined) => {
            if (!text) {
return '-';
}

            return text.replace(/\n/g, '<br/>');
        };

        const attendeeRows = attendees.map((att, idx) =>
            `<tr>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">${idx + 1}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${att.nama}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${att.divisi || '-'}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${att.jabatan || '-'}</td>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">
                    ${att.signature ? `<img src="${att.signature}" style="height:35px;width:auto;" />` : '-'}
                </td>
            </tr>`
        ).join('');

        const currentMinutes = minutesForm.data;

        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Notulen Rapat - ${meeting.judul}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            color: #000;
            line-height: 1.4;
            background-color: #fff;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm 25mm 20mm;
            margin: 0 auto;
            position: relative;
            background: white;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 2.5px solid #003d7a;
            margin-bottom: 25px;
        }
        .header-left {
            font-size: 10pt;
            font-weight: bold;
            color: #c00000;
            line-height: 1.2;
            text-transform: uppercase;
        }
        .header-right img {
            height: 45px;
            width: auto;
        }
        .title {
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 20px;
            text-align: left;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 11pt;
        }
        .info-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .info-table .label {
            width: 180px;
        }
        .info-table .sep {
            width: 20px;
            text-align: center;
        }
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 15px 0 5px 0;
            display: flex;
        }
        .section-title span { margin-right: 10px; }
        .section-content {
            margin-left: 28px;
            margin-bottom: 15px;
            font-size: 11pt;
            text-align: justify;
            min-height: 20px;
        }
        .attendance-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-top: 15px;
        }
        .attendance-table th, .attendance-table td {
            border: 1px solid #000;
            padding: 8px 10px;
        }
        .attendance-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
        }
        .attendance-table td {
            vertical-align: middle;
        }
        .footer-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #003d7a;
            color: white;
            padding: 5px 20mm;
            font-size: 8.5pt;
            font-weight: bold;
            height: 35px;
        }
        .footer-bar img {
            height: 22px;
            width: auto;
            filter: brightness(0) invert(1);
        }
        .confidential {
            position: absolute;
            bottom: 45px;
            left: 20mm;
            font-size: 8pt;
            font-style: italic;
            color: #666;
        }
        .page-break { page-break-before: always; }
        @media print {
            body { background: none; }
            .page { border: none; box-shadow: none; margin: 0; }
            .footer-bar { position: fixed; }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                PT PLN NUSANTARA POWER<br/>UP KENDARI
            </div>
            <div class="header-right">
                <img src="/sidebar-logo.png" alt="Logo PLN" />
            </div>
        </div>

        <!-- Title -->
        <div class="title">NOTULA RAPAT</div>

        <!-- Info Table -->
        <table class="info-table">
            <tr>
                <td class="label">Hari, Tanggal / Waktu</td>
                <td class="sep">:</td>
                <td>${tanggalFormatted}${waktuStr ? ' / ' + waktuStr : ''}</td>
            </tr>
            <tr>
                <td class="label">Tempat</td>
                <td class="sep">:</td>
                <td>${meeting.lokasi || '-'}</td>
            </tr>
            <tr>
                <td class="label">Perihal</td>
                <td class="sep">:</td>
                <td>${meeting.judul}</td>
            </tr>
            <tr>
                <td class="label">Lampiran</td>
                <td class="sep">:</td>
                <td>1. &nbsp;Daftar Hadir</td>
            </tr>
        </table>

        <!-- 1. DAFTAR PESERTA -->
        <div class="section-title"><span>1.</span> DAFTAR PESERTA</div>
        <div class="section-content">Terlampir</div>

        <!-- 2. AGENDA RAPAT -->
        <div class="section-title"><span>2.</span> AGENDA RAPAT</div>
        <div class="section-content">${nl2br(currentMinutes.agenda)}</div>

        <!-- 3. LATAR BELAKANG -->
        <div class="section-title"><span>3.</span> LATAR BELAKANG</div>
        <div class="section-content">${nl2br(currentMinutes.latar_belakang)}</div>

        <!-- 4. PEMBAHASAN -->
        <div class="section-title"><span>4.</span> PEMBAHASAN</div>
        <div class="section-content">${nl2br(currentMinutes.pembahasan)}</div>

        <!-- 5. HASIL KESEPAKATAN -->
        <div class="section-title"><span>5.</span> HASIL KESEPAKATAN</div>
        <div class="section-content">${nl2br(currentMinutes.hasil_kesepakatan)}</div>

        <div class="confidential">Confidential</div>

        <!-- Footer Bar -->
        <div class="footer-bar">
            <span>PT PLN NUSANTARA POWER UP KENDARI</span>
            <img src="/sidebar-logo.png" alt="Logo PLN" />
        </div>
    </div>

    <!-- Page 2: Daftar Hadir -->
    <div class="page-break"></div>
    <div class="page">
        <div class="header">
            <div class="header-left">
                PT PLN NUSANTARA POWER<br/>UP KENDARI
            </div>
            <div class="header-right">
                <img src="/sidebar-logo.png" alt="Logo PLN" />
            </div>
        </div>

        <div class="title">LAMPIRAN - DAFTAR HADIR</div>
        <p style="margin-bottom:10px;font-size:11pt;">
            <strong>${meeting.judul}</strong><br/>
            ${tanggalFormatted}${waktuStr ? ' | ' + waktuStr : ''}${meeting.lokasi ? ' | ' + meeting.lokasi : ''}
        </p>

        <table class="attendance-table">
            <thead>
                <tr>
                    <th style="width:40px;">No</th>
                    <th>Nama</th>
                    <th>Divisi</th>
                    <th>Jabatan</th>
                    <th style="width:120px;">Tanda Tangan</th>
                </tr>
            </thead>
            <tbody>
                ${attendeeRows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">Belum ada peserta</td></tr>'}
            </tbody>
        </table>

        <div class="confidential">Confidential</div>

        <!-- Footer Bar -->
        <div class="footer-bar">
            <span>PT PLN NUSANTARA POWER UP KENDARI</span>
            <img src="/sidebar-logo.png" alt="Logo PLN" />
        </div>
    </div>

    <script>
        window.onload = function() { window.print(); };
    </script>
</body>
</html>`;

        const printWindow = window.open('', '_blank');

        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    };

    const completeMeeting = () => {
        if (confirm('Selesaikan meeting ini?')) {
            router.post(`/daily-meetings/${meeting.id}/complete`);
        }
    };

    const tabs = [
        { key: 'hadir' as const, label: 'Daftar Hadir', icon: Users, count: attendees.length },
        { key: 'notulen' as const, label: 'Notulen Rapat', icon: FileText },
        isKickoffMeeting
            ? { key: 'kickoff' as const, label: 'Notulen Kick Off Meeting', icon: Handshake }
            : { key: 'temuan' as const, label: 'Notulen Temuan', icon: ClipboardList, count: findings.length },
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
                                    <Badge variant={['active', 'berlangsung'].includes(meeting.status) ? 'default' : 'secondary'} className={meeting.status === 'berlangsung' ? 'bg-emerald-500 hover:bg-emerald-600 gap-1.5' : meeting.status === 'active' ? 'bg-blue-500 hover:bg-blue-600 gap-1.5' : 'gap-1.5'}>
                                        {meeting.status === 'berlangsung' ? (
                                            <>
                                                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                Berlangsung
                                            </>
                                        ) : meeting.status === 'active' ? (
                                            <>Akan Datang</>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-3 w-3" />
                                                Selesai
                                            </>
                                        )}
                                    </Badge>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm">
                                            <Calendar className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <span>{new Date(meeting.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
                                <Button variant="outline" size="sm" className="gap-2 h-9" onClick={printNotulen}>
                                    <Printer className="h-4 w-4" />
                                    Print Notulen
                                </Button>
                                {['active', 'berlangsung'].includes(meeting.status) && !isTamu && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 h-9"
                                            onClick={() => window.open(`/daily-meetings/${meeting.id}/qr`, '_blank')}
                                        >
                                            <QrCode className="h-4 w-4" />
                                            QR Code
                                        </Button>
                                        <Button variant="default" size="sm" className="gap-2 h-9" onClick={completeMeeting}>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Selesaikan Rapat
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

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

                    {activeTab === 'notulen' && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Notulen Rapat</CardTitle>
                                        <CardDescription>Catatan pembahasan dan hasil kesepakatan rapat</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        <Users className="h-3 w-3" />
                                        {attendees.length} Peserta
                                    </div>
                                </div>
                                {meeting.status === 'completed' && (
                                    <Alert className="mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <AlertTitle className="text-blue-800 dark:text-blue-300">Rapat Telah Selesai</AlertTitle>
                                        <AlertDescription className="text-blue-700 dark:text-blue-400/80">
                                            Notulen ini telah dikunci dan tidak dapat diedit kembali. Silakan cetak notulen untuk arsip resmi.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitMinutes} className="space-y-8">
                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="agenda" className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">
                                                Agenda Rapat
                                            </Label>
                                            <Textarea
                                                id="agenda"
                                                value={minutesForm.data.agenda}
                                                onChange={(e) => minutesForm.setData('agenda', e.target.value)}
                                                placeholder="Sebutkan poin-poin agenda rapat..."
                                                className="min-h-[100px] resize-none focus-visible:ring-primary/20"
                                                disabled={meeting.status === 'completed' || isTamu}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="latar_belakang" className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">
                                                Latar Belakang
                                            </Label>
                                            <Textarea
                                                id="latar_belakang"
                                                value={minutesForm.data.latar_belakang}
                                                onChange={(e) => minutesForm.setData('latar_belakang', e.target.value)}
                                                placeholder="Latar belakang diadakannya rapat ini..."
                                                className="min-h-[120px] resize-none focus-visible:ring-primary/20"
                                                disabled={meeting.status === 'completed'}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pembahasan" className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">
                                                Pembahasan
                                            </Label>
                                            <Textarea
                                                id="pembahasan"
                                                value={minutesForm.data.pembahasan}
                                                onChange={(e) => minutesForm.setData('pembahasan', e.target.value)}
                                                placeholder="Rincian pembahasan rapat..."
                                                className="min-h-[200px] resize-none focus-visible:ring-primary/20"
                                                disabled={meeting.status === 'completed' || isTamu}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="hasil_kesepakatan" className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">
                                                Hasil Kesepakatan
                                            </Label>
                                            <Textarea
                                                id="hasil_kesepakatan"
                                                value={minutesForm.data.hasil_kesepakatan}
                                                onChange={(e) => minutesForm.setData('hasil_kesepakatan', e.target.value)}
                                                placeholder="Poin-poin kesepakatan akhir..."
                                                className="min-h-[120px] resize-none focus-visible:ring-primary/20"
                                                disabled={meeting.status === 'completed'}
                                            />
                                        </div>
                                    </div>

                                    {['active', 'berlangsung'].includes(meeting.status) && !isTamu && (
                                        <div className="flex justify-end pt-4 border-t">
                                            <Button type="submit" disabled={minutesForm.processing} className="gap-2 px-8">
                                                <FileText className="h-4 w-4" />
                                                Simpan Notulen
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    )}

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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-meetings/${meeting.id}/findings/export-pdf`, '_blank')}
                                    >
                                        <FileText className="h-4 w-4 text-red-500" />
                                        PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-9"
                                        onClick={() => window.open(`/daily-meetings/${meeting.id}/findings/export-excel`, '_blank')}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        Excel
                                    </Button>
                                    {!isTamu && (
                                        <Button size="sm" className="gap-2 h-9" onClick={openAddFinding}>
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
                                                                    onClick={() => openEditFinding(f)}
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
                                    <CardTitle>Notulen Kick Off Meeting</CardTitle>
                                    <CardDescription>Formulir notulen rapat kick off pelaksanaan pekerjaan overhaul</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 h-9 shrink-0"
                                    onClick={() => window.open(`/daily-meetings/${meeting.id}/kickoff/export-pdf`, '_blank')}
                                >
                                    <FileText className="h-4 w-4 text-red-500" />
                                    Export PDF
                                </Button>
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
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="k_pn">Nama Pimpinan Rapat</Label>
                                                <Input id="k_pn" value={kickoffForm.data.pimpinan_nama}
                                                    onChange={(e) => kickoffForm.setData('pimpinan_nama', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_pj">Jabatan Pimpinan Rapat</Label>
                                                <Input id="k_pj" value={kickoffForm.data.pimpinan_jabatan}
                                                    onChange={(e) => kickoffForm.setData('pimpinan_jabatan', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_nn">Nama Notulis</Label>
                                                <Input id="k_nn" value={kickoffForm.data.notulis_nama}
                                                    onChange={(e) => kickoffForm.setData('notulis_nama', e.target.value)} disabled={isTamu} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="k_nj">Jabatan Notulis</Label>
                                                <Input id="k_nj" value={kickoffForm.data.notulis_jabatan}
                                                    onChange={(e) => kickoffForm.setData('notulis_jabatan', e.target.value)} disabled={isTamu} />
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
                </DialogContent>
            </Dialog>
        </>
    );
}

DailyMeetingShow.layout = {
    breadcrumbs: [
        {
            title: 'Daily Meeting',
            href: '/daily-meetings',
        },
        {
            title: 'Detail Meeting',
            href: '#',
        },
    ],
};
