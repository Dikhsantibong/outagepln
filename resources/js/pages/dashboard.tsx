import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    BarChart3,
    Calendar,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Clock,
    DollarSign,
    Crosshair,
    Factory,
    HeartPulse,
    Hourglass,
    Layers,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { FilterTahun, TAHUN_SEMUA } from '@/components/data-filter-bar';
import {
    OutageQuickAccess,
    PlanDetailDialog,
    PlanRow,
    usePlanDetail,
} from '@/components/outage-quick-access';
import type { QuickAccessPlan } from '@/components/outage-quick-access';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dashboard } from '@/routes';

type Bucket = { label: string; total: number };
type KinerjaDetail = { label: string; value: string; baik?: boolean };
type KinerjaItem = { nilai: number; terisi: number; detail?: KinerjaDetail[] };

interface DashboardProps {
    scope: { merek: string | null; role: string | null };
    /** `tahun` selalu terisi: tahun yang dipakai, atau 'semua'. */
    filters: { tahun: string };
    tahunOptions: string[];
    stats: {
        total: number;
        status: { selesai: number; berjalan: number; belum: number };
        jenis: Bucket[];
        sistem: Bucket[];
        merek: Bucket[];
        scopeDistribution: Bucket[];
        ket: Bucket[];
        monthlyTimeline: { bulan: string; total: number }[];
        progressDistribution: { range: string; count: number }[];
        durasiByScope: { scope: string; avg_durasi: number; total: number }[];
        kinerja: Record<string, KinerjaItem>;
        meetings: { total: number; hariIni: number; akanDatang: number; selesai: number };
    };
    quickAccessPlans: QuickAccessPlan[];
    ongoingOutages: {
        id: number;
        mesin: string;
        scope: string | null;
        jenis: string | null;
        merek: string | null;
        progress: number;
        start_date: string | null;
        selesai: string | null;
    }[];
    upcomingOutages: {
        id: number;
        mesin: string;
        scope: string | null;
        jenis: string | null;
        start_date: string | null;
        durasi: number | null;
    }[];
    outageMeetings: {
        today: { id: number; mesin: string; scope: string; jenis: string; type: string; date: string }[];
        upcoming: { id: number; mesin: string; scope: string; jenis: string; type: string; date: string }[];
    };
}

const TOOLTIP = {
    borderRadius: 8,
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: 12,
};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Kategori di balik tiap kartu KPI.
 *
 * Difilter dari daftar yang sudah dikirim dashboard, jadi membuka daftarnya
 * tidak perlu permintaan baru ke server.
 */
const KATEGORI = {
    total: {
        judul: 'Seluruh Pekerjaan',
        deskripsi: 'semua rencana outage pada periode ini',
        filter: () => true,
    },
    selesai: {
        judul: 'Pekerjaan Selesai',
        deskripsi: 'progres sudah mencapai 100%',
        filter: (p: QuickAccessPlan) => p.progress >= 100,
    },
    berjalan: {
        judul: 'Sedang Dikerjakan',
        deskripsi: 'progres berjalan, belum mencapai 100%',
        filter: (p: QuickAccessPlan) => p.progress > 0 && p.progress < 100,
    },
    belum: {
        judul: 'Belum Dimulai',
        deskripsi: 'belum ada progres yang tercatat',
        filter: (p: QuickAccessPlan) => p.progress <= 0,
    },
} as const;

type KategoriKpi = keyof typeof KATEGORI;

function Kpi({
    label,
    value,
    sub,
    icon: Icon,
    tone,
    onClick,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: typeof Activity;
    tone: 'primary' | 'emerald' | 'amber' | 'slate' | 'blue';
    /** Bila diisi, kartu jadi tombol yang membuka daftar mesinnya. */
    onClick?: () => void;
}) {
    const tones = {
        primary: 'bg-primary/10 text-primary',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
        slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };

    return (
        <Card
            onClick={onClick}
            className={
                onClick
                    ? 'group cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm'
                    : ''
            }
        >
            <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl leading-tight font-bold">{value}</p>
                    {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
                </div>
                {onClick && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
            </CardContent>
        </Card>
    );
}

/** Daftar mesin di balik sebuah kartu KPI. */
function KpiListDialog({
    judul,
    deskripsi,
    plans,
    onClose,
    onOpen,
}: {
    judul: string | null;
    deskripsi: string;
    plans: QuickAccessPlan[];
    onClose: () => void;
    onOpen: (item: QuickAccessPlan) => void;
}) {
    return (
        <Dialog open={judul !== null} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{judul}</DialogTitle>
                    <DialogDescription>
                        {plans.length} mesin &middot; {deskripsi}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                    {plans.length > 0 ? (
                        plans.map((item) => (
                            <PlanRow
                                key={item.id}
                                item={item}
                                onClick={() => onOpen(item)}
                            />
                        ))
                    ) : (
                        <p className="py-10 text-center text-sm text-muted-foreground italic">
                            Tidak ada mesin pada kategori ini.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function KinerjaCard({
    label,
    item,
    icon: Icon,
    color,
}: {
    label: string;
    item?: KinerjaItem;
    icon: typeof ShieldCheck;
    color: string;
}) {
    const nilai = item?.nilai ?? 0;
    const terisi = item?.terisi ?? 0;

    return (
        <Card>
            <CardContent className="p-4 text-center">
                <Icon className={`mx-auto mb-2 h-5 w-5 ${color}`} />
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    {label}
                </p>
                {terisi > 0 ? (
                    <>
                        <p className={`text-2xl font-black ${color}`}>{nilai}%</p>
                        <p className="text-[10px] text-muted-foreground">dari {terisi} data</p>

                        {/* Parameter pembentuk nilai, supaya angka di atas bisa ditelusuri. */}
                        {item?.detail && item.detail.length > 0 && (
                            <div className="mt-2.5 space-y-1 border-t pt-2 text-left">
                                {item.detail.map((d) => (
                                    <div
                                        key={d.label}
                                        className="flex items-baseline justify-between gap-2 text-[10px]"
                                    >
                                        <span className="truncate text-muted-foreground">{d.label}</span>
                                        <span
                                            className={`shrink-0 font-bold ${
                                                d.baik === undefined
                                                    ? ''
                                                    : d.baik
                                                      ? 'text-emerald-600 dark:text-emerald-400'
                                                      : 'text-red-600 dark:text-red-400'
                                            }`}
                                        >
                                            {d.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-2xl font-black text-muted-foreground">–</p>
                        <p className="text-[10px] text-muted-foreground">belum ada data</p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function ChartCard({
    title,
    description,
    icon: Icon,
    children,
    empty,
}: {
    title: string;
    description?: string;
    icon: typeof BarChart3;
    children: React.ReactNode;
    empty: boolean;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {title}
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="h-[230px] w-full">
                    {empty ? (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                            Belum ada data.
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    scope,
    filters,
    tahunOptions,
    stats,
    quickAccessPlans,
    ongoingOutages,
    upcomingOutages,
    outageMeetings,
}: DashboardProps) {
    const s = stats;

    // Tanpa parameter, server memilih tahun berjalan — jadi nilainya selalu
    // dikirim eksplisit, termasuk "semua".
    const setTahun = (value: string) => {
        router.get(
            dashboard.url(),
            { tahun: value },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };
    const pct = (n: number) => (s.total > 0 ? Math.round((n / s.total) * 100) : 0);

    const timeline = s.monthlyTimeline.map((m) => {
        const [y, mo] = m.bulan.split('-');

        return { name: `${BULAN[parseInt(mo, 10) - 1]} ${y.slice(2)}`, outage: m.total };
    });

    const progresData = s.progressDistribution.map((d) => ({
        name: d.range,
        jumlah: d.count,
        warna:
            d.range === '100%' ? '#10b981' : d.range === '0%' ? '#94a3b8' : '#3b82f6',
    }));

    const durasiData = s.durasiByScope.map((d) => ({
        name: d.scope,
        durasi: d.avg_durasi,
    }));

    const top = (arr: Bucket[], n = 8) => arr.slice(0, n).map((b) => ({ name: b.label, jumlah: b.total }));

    // Detail satu pekerjaan, dipakai bersama oleh Quick Access dan daftar KPI.
    const planDetail = usePlanDetail();
    const [kategori, setKategori] = useState<KategoriKpi | null>(null);

    const daftarKategori = useMemo(
        () => (kategori ? quickAccessPlans.filter(KATEGORI[kategori].filter) : []),
        [kategori, quickAccessPlans],
    );

    /** Dari daftar kategori, lanjut membuka detail mesinnya. */
    const bukaDariDaftar = (item: QuickAccessPlan) => {
        setKategori(null);
        planDetail.buka(item);
    };

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Judul + konteks data yang sedang ditampilkan */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Ringkasan perencanaan dan pelaksanaan outage
                            {filters.tahun === TAHUN_SEMUA
                                ? ' semua tahun'
                                : ` tahun ${filters.tahun}`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <FilterTahun
                            value={filters.tahun}
                            onChange={setTahun}
                            options={tahunOptions}
                        />

                        {scope.merek ? (
                            <div className="flex h-8 items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3">
                                <Factory className="h-4 w-4 text-primary" />
                                <div className="text-xs">
                                    <span className="text-muted-foreground">Data mesin merek</span>{' '}
                                    <span className="font-bold text-primary">{scope.merek}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-8 items-center gap-2 rounded-lg border bg-muted/30 px-3 text-xs text-muted-foreground">
                                <Layers className="h-4 w-4" />
                                Seluruh mesin (semua merek)
                            </div>
                        )}
                    </div>
                </div>

                {/* KPI utama - tiap kartu membuka daftar mesin di baliknya */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <Kpi
                        label="Total Mesin"
                        value={s.total}
                        sub="rencana outage · klik untuk melihat"
                        icon={Layers}
                        tone="primary"
                        onClick={() => setKategori('total')}
                    />
                    <Kpi
                        label="Selesai"
                        value={s.status.selesai}
                        sub={`${pct(s.status.selesai)}% dari total · klik untuk melihat`}
                        icon={CheckCircle2}
                        tone="emerald"
                        onClick={() => setKategori('selesai')}
                    />
                    <Kpi
                        label="Sedang Berjalan"
                        value={s.status.berjalan}
                        sub={`${pct(s.status.berjalan)}% dari total · klik untuk melihat`}
                        icon={Hourglass}
                        tone="amber"
                        onClick={() => setKategori('berjalan')}
                    />
                    <Kpi
                        label="Belum Mulai"
                        value={s.status.belum}
                        sub={`${pct(s.status.belum)}% dari total · klik untuk melihat`}
                        icon={AlertCircle}
                        tone="slate"
                        onClick={() => setKategori('belum')}
                    />
                    {/* Rapat punya halamannya sendiri, bukan daftar mesin. */}
                    <Link href="/daily-meetings">
                        <Kpi
                            label="Rapat"
                            value={s.meetings.total}
                            sub={`${s.meetings.hariIni} hari ini · ${s.meetings.akanDatang} akan datang`}
                            icon={Users}
                            tone="blue"
                        />
                    </Link>
                </div>

                {/* Quick Access - buka detail satu pekerjaan tanpa pindah halaman */}
                <OutageQuickAccess plans={quickAccessPlans} onOpen={planDetail.buka} />

                <KpiListDialog
                    judul={kategori ? KATEGORI[kategori].judul : null}
                    deskripsi={kategori ? KATEGORI[kategori].deskripsi : ''}
                    plans={daftarKategori}
                    onClose={() => setKategori(null)}
                    onOpen={bukaDariDaftar}
                />
                <PlanDetailDialog {...planDetail} />

                {/* Kinerja Outage */}
                <div>
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
                        <Activity className="h-4 w-4 text-primary" />
                        Kinerja Outage
                        <span className="font-normal text-muted-foreground">
                            &middot; On Quality tercapai bila daya mampu naik dan SFC turun
                        </span>
                    </h2>
                    <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-5">
                        <KinerjaCard label="On Quality" item={s.kinerja.onQuality} icon={ShieldCheck} color="text-emerald-600" />
                        <KinerjaCard label="On Time" item={s.kinerja.onTime} icon={Clock} color="text-blue-600" />
                        <KinerjaCard label="On Cost" item={s.kinerja.onCost} icon={DollarSign} color="text-amber-600" />
                        <KinerjaCard label="On Scope" item={s.kinerja.onScope} icon={Crosshair} color="text-indigo-600" />
                        <KinerjaCard label="On Safety" item={s.kinerja.onSafety} icon={HeartPulse} color="text-rose-600" />
                    </div>
                </div>

                {/* Grafik */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard
                        title="Sebaran Progres"
                        description="Berapa mesin di tiap rentang penyelesaian"
                        icon={BarChart3}
                        empty={progresData.length === 0}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={progresData} margin={{ top: 18, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} maxBarSize={48}>
                                    {progresData.map((d, i) => (
                                        <Cell key={i} fill={d.warna} />
                                    ))}
                                    <LabelList dataKey="jumlah" position="top" fontSize={11} fontWeight="bold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                        title="Distribusi Scope"
                        description="Jenis pekerjaan yang paling banyak dijadwalkan"
                        icon={Layers}
                        empty={s.scopeDistribution.length === 0}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={top(s.scopeDistribution)} margin={{ top: 18, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                <Bar dataKey="jumlah" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                    <LabelList dataKey="jumlah" position="top" fontSize={11} fontWeight="bold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                        title="Timeline Bulanan"
                        description="Jumlah outage yang dimulai tiap bulan"
                        icon={Activity}
                        empty={timeline.length === 0}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP} />
                                <Line
                                    type="monotone"
                                    dataKey="outage"
                                    stroke="#14b8a6"
                                    strokeWidth={2.5}
                                    dot={{ r: 2.5 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                        title="Rata-rata Durasi per Scope"
                        description="Dalam hari"
                        icon={Clock}
                        empty={durasiData.length === 0}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={durasiData} margin={{ top: 18, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(0,0,0,0.04)' }} formatter={(v) => [`${v} hari`, 'Rata-rata']} />
                                <Bar dataKey="durasi" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                    <LabelList dataKey="durasi" position="top" fontSize={11} fontWeight="bold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* Komposisi: jenis, sistem, merek */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {[
                        { judul: 'Jenis Pembangkit', data: s.jenis, warna: 'bg-blue-500' },
                        { judul: 'Sistem Kelistrikan', data: s.sistem, warna: 'bg-teal-500' },
                        { judul: scope.merek ? 'Status Pekerjaan' : 'Merek Mesin', data: scope.merek ? s.ket : s.merek, warna: 'bg-indigo-500' },
                    ].map(({ judul, data, warna }) => (
                        <Card key={judul}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{judul}</CardTitle>
                                <CardDescription>{data.length} kategori</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-muted-foreground italic">
                                        Belum ada data.
                                    </p>
                                ) : (
                                    data.slice(0, 7).map((b) => (
                                        <div key={b.label} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="truncate font-medium">{b.label}</span>
                                                <span className="shrink-0 font-bold">
                                                    {b.total}
                                                    <span className="ml-1 font-normal text-muted-foreground">
                                                        ({pct(b.total)}%)
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={`h-full rounded-full ${warna}`}
                                                    style={{ width: `${pct(b.total)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Daftar pekerjaan + jadwal rapat */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Hourglass className="h-4 w-4 text-amber-500" />
                                Sedang Berjalan
                            </CardTitle>
                            <CardDescription>
                                Pekerjaan dengan progres antara 1% dan 99%
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {ongoingOutages.length > 0 ? (
                                ongoingOutages.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/outage-plans/${item.id}`}
                                        className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">{item.mesin}</p>
                                            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                                {item.jenis} · {item.scope || '-'}
                                            </p>
                                        </div>
                                        <div className="w-40 shrink-0">
                                            <div className="mb-1 flex items-end justify-between">
                                                <span className="text-[11px] text-muted-foreground">Progres</span>
                                                <span
                                                    className="text-sm leading-none font-bold"
                                                    style={{
                                                        color:
                                                            item.progress >= 75
                                                                ? '#10b981'
                                                                : item.progress >= 40
                                                                  ? '#f59e0b'
                                                                  : '#3b82f6',
                                                    }}
                                                >
                                                    {item.progress}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, item.progress)}%`,
                                                        backgroundColor:
                                                            item.progress >= 75
                                                                ? '#10b981'
                                                                : item.progress >= 40
                                                                  ? '#f59e0b'
                                                                  : '#3b82f6',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <ShieldCheck className="mb-2 h-9 w-9 opacity-20" />
                                    <p className="text-sm text-muted-foreground italic">
                                        Tidak ada pekerjaan yang sedang berjalan.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarClock className="h-4 w-4 text-blue-500" />
                                Outage Terdekat
                            </CardTitle>
                            <CardDescription>Belum mulai, paling dekat jadwalnya</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {upcomingOutages.length > 0 ? (
                                upcomingOutages.map((o) => (
                                    <Link
                                        key={o.id}
                                        href={`/outage-plans/${o.id}`}
                                        className="flex items-start gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/40"
                                    >
                                        <div className="flex w-12 shrink-0 flex-col items-center rounded-md border bg-muted/30 py-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                                {o.start_date
                                                    ? new Date(o.start_date).toLocaleDateString('id-ID', { month: 'short' })
                                                    : '-'}
                                            </span>
                                            <span className="text-base leading-none font-bold">
                                                {o.start_date ? new Date(o.start_date).getDate() : '-'}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold">{o.mesin}</p>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {o.scope || '-'} · {o.durasi ?? '-'} hari
                                            </p>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="py-6 text-center text-xs text-muted-foreground italic">
                                    Tidak ada outage terdekat.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Jadwal rapat */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Jadwal Rapat Outage
                        </CardTitle>
                        <CardDescription>Rapat hari ini dan yang akan datang</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                                Hari Ini ({outageMeetings.today.length})
                            </div>
                            {outageMeetings.today.length > 0 ? (
                                <div className="space-y-2">
                                    {outageMeetings.today.map((m) => (
                                        <Link
                                            key={m.id}
                                            href={`/daily-meetings/${m.id}`}
                                            className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 transition-colors hover:bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20"
                                        >
                                            <span className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                {m.type}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold">{m.mesin}</p>
                                                <p className="truncate text-[10px] text-muted-foreground">
                                                    {m.jenis} · {m.scope}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground italic">
                                    Tidak ada rapat hari ini.
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-widest text-amber-600 uppercase dark:text-amber-500">
                                <Calendar className="h-3.5 w-3.5" />
                                Akan Datang ({outageMeetings.upcoming.length})
                            </div>
                            {outageMeetings.upcoming.length > 0 ? (
                                <div className="space-y-2">
                                    {outageMeetings.upcoming.map((m) => (
                                        <Link
                                            key={m.id}
                                            href={`/daily-meetings/${m.id}`}
                                            className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex w-11 shrink-0 flex-col items-center rounded-md border bg-muted/30 py-1">
                                                <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                                                    {new Date(m.date).toLocaleDateString('id-ID', { month: 'short' })}
                                                </span>
                                                <span className="text-sm leading-none font-bold">
                                                    {new Date(m.date).getDate()}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-0.5">
                                                    <span className="rounded border border-amber-200 bg-amber-50/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                                                        {m.type}
                                                    </span>
                                                </div>
                                                <p className="truncate text-xs font-semibold">{m.mesin}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground italic">
                                    Tidak ada rapat mendatang.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
