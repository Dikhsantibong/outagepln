import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users, FileText, QrCode, CheckCircle2, Clock, MapPin, Calendar, Printer } from 'lucide-react';

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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Meeting Info Header */}
                <div className="border border-sidebar-border/70 dark:border-sidebar-border rounded-xl p-6 bg-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold tracking-tight">{meeting.judul}</h1>
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                    meeting.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400'
                                }`}>
                                    {meeting.status === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                    {meeting.status === 'active' ? 'Berlangsung' : 'Selesai'}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(meeting.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                {meeting.waktu_mulai && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {meeting.waktu_mulai.slice(0, 5)}
                                        {meeting.waktu_selesai && ` - ${meeting.waktu_selesai.slice(0, 5)}`}
                                    </span>
                                )}
                                {meeting.lokasi && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {meeting.lokasi}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    {attendees.length} peserta
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {meeting.status === 'active' && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => window.open(`/daily-meetings/${meeting.id}/qr`, '_blank')}
                                    >
                                        <QrCode className="h-4 w-4" />
                                        Tampilkan QR
                                    </Button>
                                    <Button variant="default" className="gap-2" onClick={completeMeeting}>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Selesai
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-sidebar-border/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {'count' in tab && tab.count !== undefined && (
                                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'hadir' && (
                    <div className="border border-sidebar-border/70 dark:border-sidebar-border rounded-xl bg-card overflow-hidden">
                        <div className="p-4 border-b border-sidebar-border/50 flex items-center justify-between">
                            <h2 className="font-semibold">Daftar Hadir Peserta</h2>
                            {meeting.status === 'active' && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Auto-refresh setiap 5 detik
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12">No</th>
                                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nama</th>
                                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Divisi</th>
                                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Jabatan</th>
                                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tanda Tangan</th>
                                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Waktu Hadir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendees.length > 0 ? (
                                        attendees.map((att, idx) => (
                                            <tr key={att.id} className="border-t border-sidebar-border/30 hover:bg-muted/30">
                                                <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                                                <td className="px-4 py-3 font-medium">{att.nama}</td>
                                                <td className="px-4 py-3">{att.divisi || '-'}</td>
                                                <td className="px-4 py-3">{att.jabatan || '-'}</td>
                                                <td className="px-4 py-3">
                                                    {att.signature ? (
                                                        <img src={att.signature} alt="TTD" className="h-10 w-auto border rounded bg-white" />
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {att.signed_at ? new Date(att.signed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                Belum ada peserta. Tampilkan QR Code agar peserta dapat melakukan scan kehadiran.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'notulen' && (
                    <div className="border border-sidebar-border/70 dark:border-sidebar-border rounded-xl p-6 bg-card">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold mb-1">Notulen Rapat</h2>
                            <p className="text-sm text-muted-foreground">
                                DAFTAR PESERTA: <span className="font-semibold text-foreground">{attendees.length} orang</span> — <span className="italic">Keterangan terlampir pada daftar hadir</span>
                            </p>
                        </div>

                        <form onSubmit={submitMinutes} className="space-y-6">
                            <div>
                                <Label htmlFor="agenda" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    Agenda Rapat
                                </Label>
                                <textarea
                                    id="agenda"
                                    value={minutesForm.data.agenda}
                                    onChange={(e) => minutesForm.setData('agenda', e.target.value)}
                                    rows={3}
                                    className="mt-2 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Tuliskan agenda rapat..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="latar_belakang" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    Latar Belakang
                                </Label>
                                <textarea
                                    id="latar_belakang"
                                    value={minutesForm.data.latar_belakang}
                                    onChange={(e) => minutesForm.setData('latar_belakang', e.target.value)}
                                    rows={4}
                                    className="mt-2 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Tuliskan latar belakang rapat..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="pembahasan" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    Pembahasan
                                </Label>
                                <textarea
                                    id="pembahasan"
                                    value={minutesForm.data.pembahasan}
                                    onChange={(e) => minutesForm.setData('pembahasan', e.target.value)}
                                    rows={6}
                                    className="mt-2 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Tuliskan hasil pembahasan rapat..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="hasil_kesepakatan" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    Hasil Kesepakatan
                                </Label>
                                <textarea
                                    id="hasil_kesepakatan"
                                    value={minutesForm.data.hasil_kesepakatan}
                                    onChange={(e) => minutesForm.setData('hasil_kesepakatan', e.target.value)}
                                    rows={4}
                                    className="mt-2 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="Tuliskan hasil kesepakatan rapat..."
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="submit" disabled={minutesForm.processing} className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Simpan Notulen
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
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
