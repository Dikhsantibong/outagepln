import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    Building2,
    CalendarClock,
    CheckCircle2,
    Clock,
    Hourglass,
    Layers,
    RefreshCw,
    Server,
    Wrench,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Bucket = { label: string; total: number };

interface WelcomeProps {
    canLogin: boolean;
    updatedAt: string;
    stats: {
        total: number;
        selesai: number;
        berjalan: number;
        belum: number;
        totalUnit: number;
        totalMesin: number;
        jenis: Bucket[];
        sistem: Bucket[];
        scopeDistribution: Bucket[];
        progressDistribution: { range: string; count: number }[];
        monthlyTimeline: { bulan: string; total: number }[];
    };
    berjalanList: {
        mesin: string;
        jenis: string | null;
        scope: string | null;
        sistem: string | null;
        progress: number;
        mulai: string | null;
        selesai: string | null;
    }[];
    terdekatList: {
        mesin: string;
        jenis: string | null;
        scope: string | null;
        sistem: string | null;
        durasi: number | null;
        mulai: string | null;
        selesai: string | null;
    }[];
    rapatTerdekat: {
        id: number;
        tipe: string;
        mesin: string;
        scope: string;
        tanggal: string | null;
    }[];
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Lebar konten halaman. Sengaja tidak memakai `container` Tailwind: pada layar
 * lebar breakpoint-nya menyisakan margin kiri-kanan yang terlalu jauh.
 */
const SHELL = 'mx-auto w-full max-w-[1680px] px-3 sm:px-5 lg:px-8';

const TOOLTIP = {
    borderRadius: 8,
    border: 'none',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.15)',
    fontSize: 12,
};

const tanggal = (d?: string | null) =>
    d
        ? new Date(d).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : '-';

function Kpi({
    label,
    value,
    sub,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    sub: string;
    icon: typeof Activity;
    tone: 'blue' | 'emerald' | 'amber' | 'slate';
}) {
    const tones = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };

    return (
        <Card className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-3xl leading-tight font-bold">{value}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function Komposisi({ judul, data, total, warna }: { judul: string; data: Bucket[]; total: number; warna: string }) {
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{judul}</CardTitle>
                <CardDescription>{data.length} kategori</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
                {data.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground italic">Data tidak tersedia.</p>
                ) : (
                    data.slice(0, 6).map((b) => (
                        <div key={b.label} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="truncate font-medium">{b.label}</span>
                                <span className="shrink-0 font-bold">
                                    {b.total}
                                    <span className="ml-1 font-normal text-muted-foreground">({pct(b.total)}%)</span>
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div className={`h-full rounded-full ${warna}`} style={{ width: `${pct(b.total)}%` }} />
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

export default function Welcome({
    canLogin,
    updatedAt,
    stats,
    berjalanList,
    terdekatList,
    rapatTerdekat,
}: WelcomeProps) {
    const s = stats;
    const pct = (n: number) => (s.total > 0 ? Math.round((n / s.total) * 100) : 0);

    const timeline = s.monthlyTimeline.map((m) => {
        const [y, mo] = m.bulan.split('-');

        return { name: `${BULAN[parseInt(mo, 10) - 1]} ${y.slice(2)}`, outage: m.total };
    });

    const progres = s.progressDistribution.map((d) => ({
        name: d.range,
        jumlah: d.count,
        warna: d.range === '100%' ? '#10b981' : d.range === '0%' ? '#94a3b8' : '#3b82f6',
    }));

    const scopeData = s.scopeDistribution.slice(0, 10).map((b) => ({ name: b.label, jumlah: b.total }));

    const warnaProgres = (v: number) => (v >= 75 ? '#10b981' : v >= 40 ? '#f59e0b' : '#3b82f6');

    return (
        <>
            <Head title="Informasi Publik - Kondisi Mesin Pembangkit" />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                {/* Navbar korporat */}
                <header className="sticky top-0 z-50 w-full shadow-sm">
                    {/* Strip identitas unit */}
                    <div className="bg-[#0b4c8c] text-white">
                        <div className={`${SHELL} flex h-8 items-center justify-between gap-4`}>
                            <p className="truncate text-[10px] font-medium tracking-[0.2em] uppercase">
                                PT PLN Nusantara Power &middot; Unit Pembangkitan Kendari
                            </p>
                            <p className="hidden shrink-0 items-center gap-1.5 text-[10px] text-white/80 sm:flex">
                                <RefreshCw className="h-3 w-3" />
                                Diperbarui {updatedAt}
                            </p>
                        </div>
                    </div>

                    {/* Bar utama */}
                    <div className="border-b bg-background/95 backdrop-blur">
                        <div className={`${SHELL} flex h-16 items-center justify-between gap-4`}>
                            <div className="flex min-w-0 items-center gap-3">
                                <img
                                    src="/sidebar-logo.png"
                                    alt="Logo PT PLN Nusantara Power"
                                    className="h-9 w-auto shrink-0 object-contain md:h-10"
                                />
                                <span className="hidden h-9 w-px bg-border sm:block" />
                                <div className="min-w-0">
                                    <p className="truncate text-base leading-tight font-bold tracking-tight">
                                        Outage Monitoring System
                                    </p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        Informasi publik kondisi mesin pembangkit
                                    </p>
                                </div>
                            </div>
                            {canLogin && (
                                <Link href="/login" className="shrink-0">
                                    <Button className="gap-2 bg-[#0b4c8c] px-5 text-white hover:bg-[#093c6f]">
                                        Login Sistem
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                    {/* Aksen korporat */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#0b4c8c] via-[#14a2dc] to-[#f8b02b]" />
                </header>

                <main className={`${SHELL} space-y-6 py-8`}>
                    {/* Judul */}
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                                Kondisi Pemeliharaan Mesin Pembangkit
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Informasi publik mengenai rencana dan pelaksanaan pemeliharaan (outage)
                                pembangkit di wilayah UP Kendari.
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground sm:hidden">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Diperbarui {updatedAt}
                        </div>
                    </div>

                    {/* Ringkasan status */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Kpi
                            label="Total Pekerjaan"
                            value={s.total}
                            sub={`${s.totalUnit} unit · ${s.totalMesin} mesin terdaftar`}
                            icon={Layers}
                            tone="blue"
                        />
                        <Kpi
                            label="Selesai"
                            value={s.selesai}
                            sub={`${pct(s.selesai)}% dari total pekerjaan`}
                            icon={CheckCircle2}
                            tone="emerald"
                        />
                        <Kpi
                            label="Sedang Berjalan"
                            value={s.berjalan}
                            sub={`${pct(s.berjalan)}% dari total pekerjaan`}
                            icon={Hourglass}
                            tone="amber"
                        />
                        <Kpi
                            label="Belum Mulai"
                            value={s.belum}
                            sub={`${pct(s.belum)}% dari total pekerjaan`}
                            icon={CalendarClock}
                            tone="slate"
                        />
                    </div>

                    {/* Bar status keseluruhan */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Status Keseluruhan</CardTitle>
                            <CardDescription>
                                Proporsi pekerjaan pemeliharaan berdasarkan tahap penyelesaian
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
                                {[
                                    { n: s.selesai, c: 'bg-emerald-500', l: 'Selesai' },
                                    { n: s.berjalan, c: 'bg-amber-500', l: 'Berjalan' },
                                    { n: s.belum, c: 'bg-slate-400', l: 'Belum mulai' },
                                ].map(
                                    (seg) =>
                                        seg.n > 0 && (
                                            <div
                                                key={seg.l}
                                                className={`${seg.c} flex items-center justify-center transition-all`}
                                                style={{ width: `${pct(seg.n)}%` }}
                                                title={`${seg.l}: ${seg.n}`}
                                            >
                                                {pct(seg.n) >= 8 && (
                                                    <span className="text-[10px] font-bold text-white">
                                                        {pct(seg.n)}%
                                                    </span>
                                                )}
                                            </div>
                                        ),
                                )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs">
                                {[
                                    { c: 'bg-emerald-500', l: 'Selesai', n: s.selesai },
                                    { c: 'bg-amber-500', l: 'Sedang berjalan', n: s.berjalan },
                                    { c: 'bg-slate-400', l: 'Belum mulai', n: s.belum },
                                ].map((seg) => (
                                    <div key={seg.l} className="flex items-center gap-1.5">
                                        <span className={`h-2.5 w-2.5 rounded-full ${seg.c}`} />
                                        <span className="text-muted-foreground">{seg.l}</span>
                                        <span className="font-bold">{seg.n}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grafik */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Wrench className="h-4 w-4 text-indigo-500" />
                                    Jenis Pekerjaan Pemeliharaan
                                </CardTitle>
                                <CardDescription>Jumlah pekerjaan per ruang lingkup (scope)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[260px] w-full">
                                    {scopeData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={scopeData} margin={{ top: 18, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                                <Bar dataKey="jumlah" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={44}>
                                                    <LabelList dataKey="jumlah" position="top" fontSize={11} fontWeight="bold" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground italic">
                                            Data tidak tersedia.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    Sebaran Tingkat Penyelesaian
                                </CardTitle>
                                <CardDescription>Berapa banyak mesin di tiap rentang progres</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[260px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={progres} margin={{ top: 18, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                            <Bar dataKey="jumlah" radius={[5, 5, 0, 0]} maxBarSize={52}>
                                                {progres.map((d, i) => (
                                                    <Cell key={i} fill={d.warna} />
                                                ))}
                                                <LabelList dataKey="jumlah" position="top" fontSize={11} fontWeight="bold" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Komposisi + timeline */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Komposisi judul="Jenis Pembangkit" data={s.jenis} total={s.total} warna="bg-blue-500" />
                        <Komposisi judul="Sistem Kelistrikan" data={s.sistem} total={s.total} warna="bg-teal-500" />
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Rencana per Bulan</CardTitle>
                                <CardDescription>Jumlah pekerjaan yang dimulai tiap bulan</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[190px] w-full">
                                    {timeline.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={timeline} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                <XAxis
                                                    dataKey="name"
                                                    fontSize={9}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip contentStyle={TOOLTIP} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="outage"
                                                    stroke="#14b8a6"
                                                    strokeWidth={2.5}
                                                    dot={{ r: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                                            Data tidak tersedia.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabel: sedang berjalan */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Hourglass className="h-4 w-4 text-amber-500" />
                                Pemeliharaan Sedang Berjalan
                            </CardTitle>
                            <CardDescription>Pekerjaan yang saat ini sedang dikerjakan di lapangan</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <Table className="whitespace-nowrap">
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="min-w-[220px] px-4 font-bold">Mesin</TableHead>
                                        <TableHead className="px-4 text-center font-bold">Jenis</TableHead>
                                        <TableHead className="px-4 text-center font-bold">Scope</TableHead>
                                        <TableHead className="px-4 text-center font-bold">Sistem</TableHead>
                                        <TableHead className="px-4 text-center font-bold">Periode</TableHead>
                                        <TableHead className="min-w-[150px] px-4 text-center font-bold">Progres</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {berjalanList.length > 0 ? (
                                        berjalanList.map((p, i) => (
                                            <TableRow key={i} className="hover:bg-muted/20">
                                                <TableCell className="px-4 text-xs font-semibold">{p.mesin}</TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {p.jenis || '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-4 text-center text-[11px] text-muted-foreground uppercase">
                                                    {p.scope || '-'}
                                                </TableCell>
                                                <TableCell className="px-4 text-center text-[11px] text-muted-foreground">
                                                    {p.sistem || '-'}
                                                </TableCell>
                                                <TableCell className="px-4 text-center font-mono text-[11px] text-muted-foreground">
                                                    {tanggal(p.mulai)} &ndash; {tanggal(p.selesai)}
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${Math.min(100, p.progress)}%`,
                                                                    backgroundColor: warnaProgres(p.progress),
                                                                }}
                                                            />
                                                        </div>
                                                        <span
                                                            className="w-10 shrink-0 text-right text-xs font-bold"
                                                            style={{ color: warnaProgres(p.progress) }}
                                                        >
                                                            {p.progress}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                                                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 opacity-20" />
                                                Tidak ada pemeliharaan yang sedang berjalan saat ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Jadwal terdekat + rapat */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="shadow-sm lg:col-span-2">
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CalendarClock className="h-4 w-4 text-blue-500" />
                                    Jadwal Pemeliharaan Terdekat
                                </CardTitle>
                                <CardDescription>Pekerjaan yang akan segera dimulai</CardDescription>
                            </CardHeader>
                            <CardContent className="overflow-x-auto p-0">
                                <Table className="whitespace-nowrap">
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="min-w-[220px] px-4 font-bold">Mesin</TableHead>
                                            <TableHead className="px-4 text-center font-bold">Scope</TableHead>
                                            <TableHead className="px-4 text-center font-bold">Mulai</TableHead>
                                            <TableHead className="px-4 text-center font-bold">Durasi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {terdekatList.length > 0 ? (
                                            terdekatList.map((p, i) => (
                                                <TableRow key={i} className="hover:bg-muted/20">
                                                    <TableCell className="px-4 text-xs font-semibold">
                                                        {p.mesin}
                                                        <div className="text-[10px] font-normal text-muted-foreground">
                                                            {p.jenis} · {p.sistem || '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 text-center text-[11px] text-muted-foreground uppercase">
                                                        {p.scope || '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 text-center font-mono text-[11px]">
                                                        {tanggal(p.mulai)}
                                                    </TableCell>
                                                    <TableCell className="px-4 text-center text-xs">
                                                        {p.durasi ? `${p.durasi} hari` : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                                                    Belum ada jadwal terdekat.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock className="h-4 w-4 text-teal-500" />
                                    Agenda Rapat
                                </CardTitle>
                                <CardDescription>Rapat koordinasi yang akan datang</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {rapatTerdekat.length > 0 ? (
                                    rapatTerdekat.map((m) => (
                                        <div key={m.id} className="flex items-start gap-3 rounded-lg border p-2.5">
                                            <div className="flex w-12 shrink-0 flex-col items-center rounded-md border bg-muted/30 py-1">
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                                    {m.tanggal
                                                        ? new Date(m.tanggal).toLocaleDateString('id-ID', { month: 'short' })
                                                        : '-'}
                                                </span>
                                                <span className="text-base leading-none font-bold">
                                                    {m.tanggal ? new Date(m.tanggal).getDate() : '-'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <Badge variant="outline" className="mb-1 text-[9px]">
                                                    {m.tipe}
                                                </Badge>
                                                <p className="truncate text-xs font-semibold">{m.mesin}</p>
                                                <p className="truncate text-[10px] text-muted-foreground">{m.scope}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-8 text-center text-xs text-muted-foreground italic">
                                        Tidak ada agenda rapat terdekat.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info unit */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card className="shadow-sm">
                            <CardContent className="flex items-center gap-3 p-5">
                                <Building2 className="h-8 w-8 text-emerald-500" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Unit Pembangkit Terdaftar</p>
                                    <p className="text-2xl font-bold">{s.totalUnit}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardContent className="flex items-center gap-3 p-5">
                                <Server className="h-8 w-8 text-amber-500" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Mesin Pembangkit Terdaftar</p>
                                    <p className="text-2xl font-bold">{s.totalMesin}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>

                <footer className="mt-8 border-t bg-background py-8">
                    <div className={`${SHELL} text-center text-sm text-muted-foreground`}>
                        <p>&copy; {new Date().getFullYear()} PT PLN Nusantara Power &middot; UP Kendari</p>
                        <p className="mt-1 text-xs">
                            Halaman informasi publik &middot; data diperbarui otomatis dari sistem Outage Monitoring
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
