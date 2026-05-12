import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, MapPin, Users, Eye, QrCode, Trash2, CheckCircle2 } from 'lucide-react';

type Meeting = {
    id: number;
    judul: string;
    tanggal: string;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    lokasi: string | null;
    token: string;
    status: 'draft' | 'active' | 'completed';
    attendees_count: number;
    created_at: string;
};

export default function DailyMeetingsIndex({ meetings }: { meetings: Meeting[] }) {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        judul: '',
        tanggal: new Date().toISOString().split('T')[0],
        waktu_mulai: new Date().toTimeString().slice(0, 5),
        lokasi: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/daily-meetings', {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus meeting ini?')) {
            router.delete(`/daily-meetings/${id}`);
        }
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
            completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
            draft: 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
        };
        const labels: Record<string, string> = {
            active: 'Berlangsung',
            completed: 'Selesai',
            draft: 'Draft',
        };
        return (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.draft}`}>
                {status === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                {status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                {labels[status] || status}
            </span>
        );
    };

    return (
        <>
            <Head title="Daily Meeting" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily Meeting</h1>
                        <p className="text-sm text-muted-foreground mt-1">Kelola rapat harian, daftar hadir, dan notulen</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Mulai Meeting Baru
                    </Button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="border border-sidebar-border/70 dark:border-sidebar-border rounded-xl p-6 bg-card animate-in slide-in-from-top-2">
                        <h2 className="text-lg font-semibold mb-4">Buat Meeting Baru</h2>
                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="judul">Judul Meeting</Label>
                                <Input
                                    id="judul"
                                    value={data.judul}
                                    onChange={(e) => setData('judul', e.target.value)}
                                    placeholder="Daily Standup / Rapat Koordinasi..."
                                    className="mt-1"
                                />
                                {errors.judul && <div className="text-red-500 text-sm mt-1">{errors.judul}</div>}
                            </div>
                            <div>
                                <Label htmlFor="tanggal">Tanggal</Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) => setData('tanggal', e.target.value)}
                                    className="mt-1"
                                />
                                {errors.tanggal && <div className="text-red-500 text-sm mt-1">{errors.tanggal}</div>}
                            </div>
                            <div>
                                <Label htmlFor="waktu_mulai">Waktu Mulai</Label>
                                <Input
                                    id="waktu_mulai"
                                    type="time"
                                    value={data.waktu_mulai}
                                    onChange={(e) => setData('waktu_mulai', e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lokasi">Lokasi</Label>
                                <Input
                                    id="lokasi"
                                    value={data.lokasi}
                                    onChange={(e) => setData('lokasi', e.target.value)}
                                    placeholder="Ruang Meeting Utama"
                                    className="mt-1"
                                />
                            </div>
                            <div className="md:col-span-4 flex gap-2">
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <QrCode className="h-4 w-4" />
                                    Mulai & Generate QR Code
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Meeting List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meetings.length > 0 ? (
                        meetings.map((meeting) => (
                            <div
                                key={meeting.id}
                                className="border border-sidebar-border/70 dark:border-sidebar-border rounded-xl p-5 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-bold text-base leading-tight">{meeting.judul}</h3>
                                    {statusBadge(meeting.status)}
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(meeting.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        {meeting.waktu_mulai && ` • ${meeting.waktu_mulai.slice(0, 5)}`}
                                    </div>
                                    {meeting.lokasi && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {meeting.lokasi}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5" />
                                        {meeting.attendees_count} peserta hadir
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-sidebar-border/50">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="gap-1.5 flex-1"
                                        onClick={() => router.visit(`/daily-meetings/${meeting.id}`)}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        Detail
                                    </Button>
                                    {meeting.status === 'active' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5"
                                            onClick={() => window.open(`/daily-meetings/${meeting.id}/qr`, '_blank')}
                                        >
                                            <QrCode className="h-3.5 w-3.5" />
                                            QR
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(meeting.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full border border-dashed border-sidebar-border/70 rounded-xl p-12 text-center text-muted-foreground">
                            <QrCode className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-semibold mb-1">Belum ada meeting</p>
                            <p className="text-sm">Klik tombol "Mulai Meeting Baru" untuk memulai.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

DailyMeetingsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Daily Meeting',
            href: '/daily-meetings',
        },
    ],
};
