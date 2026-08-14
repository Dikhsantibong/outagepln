import { Head, router, Link } from '@inertiajs/react';
import {
    Search, ChevronRight, ChevronLeft, Calendar, Users, Factory,
    CheckCircle2, ArrowRight, Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Machine = {
    plan_id: number;
    mesin: string;
    scope: string | null;
    jenis: string | null;
    jumlah: number;
    mulai: string | null;
    selesai: number;
};

type Meeting = {
    id: number;
    judul: string;
    tipe_rapat: string | null;
    tanggal: string;
    waktu_mulai: string | null;
    lokasi: string | null;
    status: 'draft' | 'active' | 'completed' | 'berlangsung';
    link_meeting: string | null;
    attendees_count: number;
};

type Selected = {
    plan_id: number;
    mesin: string;
    scope: string | null;
    jenis: string | null;
    meetings: Meeting[];
};

/** Berapa banyak kartu mesin yang dirender sebelum pengguna diarahkan mencari. */
const MAX_MACHINE_CARDS = 30;

const tanggalPanjang = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

/** Label pendek jenis rapat, mis. "RAPAT P1" → "P1". */
const kodeTipe = (t: string | null) => (t ? t.replace(/^RAPAT\s*/i, '').trim() : '—');

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'berlangsung':
            return (
                <Badge className="gap-1.5 border-none bg-emerald-500 hover:bg-emerald-600">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    Berlangsung
                </Badge>
            );
        case 'active':
            return <Badge className="border-none bg-blue-500 hover:bg-blue-600">Akan Datang</Badge>;
        case 'completed':
            return (
                <Badge variant="secondary" className="gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Selesai
                </Badge>
            );
        default:
            return <Badge variant="outline">Draft</Badge>;
    }
}

/** Penanda langkah 1 → 2 di bagian atas halaman. */
function Steps({ step }: { step: 1 | 2 }) {
    const item = (n: 1 | 2, label: string) => {
        const active = step === n;
        const done = step > n;
        return (
            <div className="flex items-center gap-2">
                <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        active
                            ? 'bg-primary text-primary-foreground'
                            : done
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground'
                    }`}
                >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                </span>
                <span className={`text-xs font-semibold ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                </span>
            </div>
        );
    };

    return (
        <div className="flex items-center gap-3">
            {item(1, 'Pilih Mesin')}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {item(2, 'Pilih Jenis Rapat')}
        </div>
    );
}

// ── Langkah 1: pilih mesin ────────────────────────────────────────────────
function PilihMesin({ machines }: { machines: Machine[] }) {
    const [q, setQ] = useState('');

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return machines;
        return machines.filter(
            (m) =>
                m.mesin?.toLowerCase().includes(term) ||
                (m.scope ?? '').toLowerCase().includes(term) ||
                (m.jenis ?? '').toLowerCase().includes(term),
        );
    }, [q, machines]);

    const shown = filtered.slice(0, MAX_MACHINE_CARDS);

    const pilih = (planId: number) =>
        router.get('/daily-meetings', { plan: planId }, { preserveScroll: true });

    return (
        <>
            {/* Kotak pencarian */}
            <Card className="border-sidebar-border/60 bg-gradient-to-br from-primary/5 to-transparent p-6">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Factory className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">Mulai dari mesin pembangkit</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Ketik nama mesin untuk melihat jadwal rapatnya, lalu pilih jenis rapat.
                    </p>
                    <div className="relative mx-auto mt-5 max-w-xl">
                        <Search className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Cari nama mesin, mis. PLTD RAHA #7..."
                            className="h-12 rounded-xl pl-12 text-base shadow-sm"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        {filtered.length} mesin
                        {filtered.length > MAX_MACHINE_CARDS && ` — menampilkan ${MAX_MACHINE_CARDS} teratas, persempit dengan pencarian`}
                    </p>
                </div>
            </Card>

            {/* Daftar mesin */}
            {shown.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((m) => (
                        <button
                            key={m.plan_id}
                            onClick={() => pilih(m.plan_id)}
                            className="group flex items-center gap-3 rounded-xl border border-sidebar-border/60 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Factory className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-bold group-hover:text-primary">{m.mesin}</div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                    {m.scope && <span>{m.scope}</span>}
                                    {m.jenis && <span>· {m.jenis}</span>}
                                    <span>· {m.jumlah} rapat</span>
                                    {m.selesai > 0 && <span className="text-emerald-600">· {m.selesai} selesai</span>}
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </button>
                    ))}
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
                        <Search className="h-7 w-7 text-muted-foreground opacity-40" />
                    </div>
                    <CardTitle className="mb-1 text-base">Mesin tidak ditemukan</CardTitle>
                    <CardDescription className="max-w-[320px] text-sm">
                        Tidak ada mesin yang cocok dengan "{q}". Coba kata kunci lain.
                    </CardDescription>
                </Card>
            )}
        </>
    );
}

// ── Langkah 2: pilih jenis rapat mesin terpilih ───────────────────────────
function PilihJenisRapat({ selected }: { selected: Selected }) {
    return (
        <>
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-3 gap-1.5 text-muted-foreground"
                    onClick={() => router.get('/daily-meetings', {}, { preserveScroll: true })}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Pilih mesin lain
                </Button>

                {/* Kepala mesin terpilih */}
                <Card className="flex items-center gap-4 border-sidebar-border/60 bg-card p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Factory className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-lg font-bold leading-tight">{selected.mesin}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {selected.scope && <Badge variant="secondary">{selected.scope}</Badge>}
                            {selected.jenis && <Badge variant="outline">{selected.jenis}</Badge>}
                            <span>{selected.meetings.length} jadwal rapat</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Pilih jenis rapat untuk memulai
                </h3>
                {selected.meetings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selected.meetings.map((m) => (
                            <Card
                                key={m.id}
                                className="group flex cursor-pointer flex-col gap-3 border-sidebar-border/60 bg-card p-4 transition-all hover:border-primary/60 hover:shadow-md"
                                onClick={() => router.visit(`/daily-meetings/${m.id}`)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-base font-extrabold text-primary">
                                        {kodeTipe(m.tipe_rapat)}
                                    </div>
                                    <StatusBadge status={m.status} />
                                </div>

                                <div>
                                    <div className="text-sm font-bold group-hover:text-primary">
                                        Rapat {kodeTipe(m.tipe_rapat)}
                                    </div>
                                    <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                            {tanggalPanjang(m.tanggal)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-primary/70" />
                                            <span className="font-medium text-foreground">{m.attendees_count} Peserta</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center gap-2 border-t border-sidebar-border/30 pt-3">
                                    <span className="flex-1 text-sm font-bold text-primary">Mulai Rapat</span>
                                    {m.link_meeting && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(m.link_meeting!, '_blank');
                                            }}
                                        >
                                            <Video className="h-4 w-4 text-blue-500" />
                                        </Button>
                                    )}
                                    <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
                        <Calendar className="mb-3 h-8 w-8 text-muted-foreground opacity-40" />
                        <CardDescription>Belum ada jadwal rapat untuk mesin ini.</CardDescription>
                    </Card>
                )}
            </div>
        </>
    );
}

export default function DailyMeetingsIndex({
    machines = [],
    selected = null,
}: {
    machines?: Machine[];
    selected?: Selected | null;
}) {
    return (
        <>
            <Head title="Daily Meeting" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily Meeting</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola rapat harian, daftar hadir, dan notulen
                        </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 px-3 py-2">
                        <Steps step={selected ? 2 : 1} />
                    </div>
                </div>

                {selected ? <PilihJenisRapat selected={selected} /> : <PilihMesin machines={machines} />}
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
