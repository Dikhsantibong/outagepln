import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, FileText, QrCode, CheckCircle2, Clock, MapPin, Calendar, Printer, Info } from 'lucide-react';

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
};

export default function DailyMeetingShow({
    meeting,
    attendees: initialAttendees,
    minutes,
}: {
    meeting: Meeting;
    attendees: Attendee[];
    minutes: Minutes;
}) {
    const [activeTab, setActiveTab] = useState<'hadir' | 'notulen'>('hadir');
    const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);

    // Poll for new attendees every 5 seconds
    useEffect(() => {
        if (meeting.status !== 'active') return;
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
            if (!text) return '-';
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
                                    <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'} className={meeting.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600 gap-1.5' : 'gap-1.5'}>
                                        {meeting.status === 'active' ? (
                                            <>
                                                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                Berlangsung
                                            </>
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
                                <Button variant="outline" size="sm" className="gap-2 h-9" onClick={printNotulen}>
                                    <Printer className="h-4 w-4" />
                                    Print Notulen
                                </Button>
                                {meeting.status === 'active' && (
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
                                {meeting.status === 'active' && (
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
                                                disabled={meeting.status === 'completed'}
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
                                                disabled={meeting.status === 'completed'}
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

                                    {meeting.status === 'active' && (
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
                </div>
            </div>
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
