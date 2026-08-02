import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Clock,
    FileText,
    CheckCircle2,
    AlertCircle,
    Search,
    Pencil,
    X,
    ListChecks,
    CalendarClock,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';
import {
    ALL,
    FilterBar,
    FilterSelect,
    buildFilterQuery,
    countActiveFilters,
} from '@/components/data-filter-bar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDMY } from '@/lib/outage-progress';

type Kinerja = {
    start_date_aktual: string | null;
    selesai_aktual: string | null;
    catatan: string | null;
    eviden_url: string | null;
} | null;

type Plan = {
    id: number;
    mesin_pembangkit: string;
    jenis_pembangkit: string | null;
    scope: string | null;
    sistem: string | null;
    progress: number | null;
    durasi: number | null;
    start_date: string | null;
    selesai: string | null;
    kinerja_time: Kinerja;
};

type PlanOption = {
    id: number;
    mesin_pembangkit: string;
    jenis_pembangkit: string | null;
    scope: string | null;
    progress: number | null;
};

type Options = {
    tahun: (string | number)[];
    scope: string[];
    jenis: string[];
    sistem: string[];
};

const FILTER_KEYS = ['search', 'tahun', 'scope', 'jenis', 'sistem', 'status'];
const URL = '/kinerja/on-time';

/** Inclusive day count between two ISO dates. */
function daysBetween(a?: string | null, b?: string | null): number | null {
    if (!a || !b) {
        return null;
    }

    const d = (new Date(b).getTime() - new Date(a).getTime()) / 86400000;

    return Math.round(d) + 1;
}

function fmt(d?: string | null) {
    return d ? formatDMY(String(d).slice(0, 10)) : '-';
}

function StatusBadge({ plan }: { plan: Plan }) {
    const k = plan.kinerja_time;
    let label = 'Belum diinput';
    let cls = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

    if (k?.selesai_aktual) {
        // On Time when the actual finish is not later than the planned finish.
        const telat =
            plan.selesai &&
            new Date(k.selesai_aktual).getTime() > new Date(plan.selesai).getTime();
        label = telat ? 'Delay' : 'On Time';
        cls = telat
            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    } else if (k?.start_date_aktual) {
        label = 'Sedang berjalan';
        cls = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    }

    return (
        <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}
        >
            {label}
        </span>
    );
}

function SummaryCard({
    label,
    value,
    tone,
    icon: Icon,
    active,
    onClick,
}: {
    label: string;
    value: number;
    tone: 'slate' | 'emerald' | 'amber' | 'primary';
    icon: typeof Clock;
    active?: boolean;
    onClick?: () => void;
}) {
    const tones = {
        primary: 'bg-primary/10 text-primary',
        emerald:
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };

    return (
        <Card
            onClick={onClick}
            className={`transition-all ${onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-sm' : ''} ${active ? 'border-primary ring-1 ring-primary/30' : ''}`}
        >
            <CardContent className="flex items-center gap-3 p-4">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function OnTime({
    outagePlans,
    planOptions = [],
    selectedPlan = null,
    filters,
    filterOptions,
    summary,
}: {
    outagePlans: any;
    planOptions?: PlanOption[];
    selectedPlan?: Plan | null;
    filters?: any;
    filterOptions?: Options;
    summary?: { total: number; lengkap: number; sebagian: number; belum: number };
}) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerQuery, setPickerQuery] = useState('');

    const opts: Options = filterOptions ?? {
        tahun: [],
        scope: [],
        jenis: [],
        sistem: [],
    };
    const sum = summary ?? { total: 0, lengkap: 0, sebagian: 0, belum: 0 };
    const rows: Plan[] = useMemo(
        () => outagePlans?.data ?? [],
        [outagePlans?.data],
    );

    const go = (query: Record<string, string>) =>
        router.get(URL, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });

    const applyFilter = (patch: Record<string, string>) =>
        go(
            buildFilterQuery(filters, [...FILTER_KEYS, 'plan'], {
                search: searchTerm,
                ...patch,
            }),
        );

    const resetFilters = () => {
        setSearchTerm('');
        go(filters?.plan ? { plan: String(filters.plan) } : {});
    };

    const activeFilterCount = countActiveFilters(filters, FILTER_KEYS);
    const selectValue = (key: string) => filters?.[key] || ALL;

    const openPlan = (id: number | string) => {
        setPickerOpen(false);
        setPickerQuery('');
        applyFilter({ plan: String(id) });
    };

    const closePlan = () =>
        go(buildFilterQuery(filters, FILTER_KEYS, { search: searchTerm }));

    const pickerMatches = useMemo(() => {
        const q = pickerQuery.trim().toLowerCase();
        const list = q
            ? planOptions.filter((p) =>
                  `${p.mesin_pembangkit ?? ''} ${p.jenis_pembangkit ?? ''} ${p.scope ?? ''}`
                      .toLowerCase()
                      .includes(q),
              )
            : planOptions;

        return list.slice(0, 50);
    }, [planOptions, pickerQuery]);

    const k = selectedPlan?.kinerja_time ?? null;

    const form = useForm({
        outage_plan_id: '',
        start_date_aktual: '',
        selesai_aktual: '',
        catatan: '',
        eviden: null as File | null,
    });

    const [seededFor, setSeededFor] = useState<number | null>(null);

    if (selectedPlan && seededFor !== selectedPlan.id) {
        setSeededFor(selectedPlan.id);
        form.setData({
            outage_plan_id: String(selectedPlan.id),
            start_date_aktual: k?.start_date_aktual
                ? String(k.start_date_aktual).slice(0, 10)
                : '',
            selesai_aktual: k?.selesai_aktual
                ? String(k.selesai_aktual).slice(0, 10)
                : '',
            catatan: k?.catatan ?? '',
            eviden: null,
        });
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(URL, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => toast.success('Data On Time tersimpan'),
            onError: (errs) =>
                toast.error(
                    (Object.values(errs)[0] as string) || 'Gagal menyimpan data',
                ),
        });
    };

    // Live comparison while the user types, falling back to what is stored.
    const rencanaHari = selectedPlan
        ? daysBetween(selectedPlan.start_date, selectedPlan.selesai)
        : null;
    const aktualHari = daysBetween(
        form.data.start_date_aktual || k?.start_date_aktual,
        form.data.selesai_aktual || k?.selesai_aktual,
    );
    const selisih =
        rencanaHari != null && aktualHari != null ? aktualHari - rencanaHari : null;

    // Chart follows what is being typed so the comparison updates live.
    const durasiChart = [
        { name: 'Rencana', nilai: rencanaHari ?? 0, warna: '#3b82f6' },
        {
            name: 'Aktual',
            nilai: aktualHari ?? 0,
            warna: selisih != null && selisih > 0 ? '#ef4444' : '#10b981',
        },
    ];

    // Overview across the current page, skipping machines with no actual dates.
    const overviewChart = useMemo(
        () =>
            rows
                .filter((p) => p.kinerja_time?.selesai_aktual)
                .map((p) => ({
                    name:
                        p.mesin_pembangkit.length > 18
                            ? p.mesin_pembangkit.slice(0, 18) + '…'
                            : p.mesin_pembangkit,
                    Rencana: daysBetween(p.start_date, p.selesai) ?? 0,
                    Aktual:
                        daysBetween(
                            p.kinerja_time?.start_date_aktual,
                            p.kinerja_time?.selesai_aktual,
                        ) ?? 0,
                })),
        [rows],
    );

    return (
        <>
            <Head title="Kinerja - On Time" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">On Time</h1>
                        <p className="text-sm text-muted-foreground">
                            Catat waktu pelaksanaan aktual dan bandingkan dengan rencana
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <SummaryCard
                        label="Total Mesin"
                        value={sum.total}
                        tone="primary"
                        icon={ListChecks}
                        active={!filters?.status}
                        onClick={() => applyFilter({ status: ALL })}
                    />
                    <SummaryCard
                        label="Selesai dicatat"
                        value={sum.lengkap}
                        tone="emerald"
                        icon={CheckCircle2}
                        active={filters?.status === 'lengkap'}
                        onClick={() => applyFilter({ status: 'lengkap' })}
                    />
                    <SummaryCard
                        label="Sedang berjalan"
                        value={sum.sebagian}
                        tone="amber"
                        icon={AlertCircle}
                        active={filters?.status === 'sebagian'}
                        onClick={() => applyFilter({ status: 'sebagian' })}
                    />
                    <SummaryCard
                        label="Belum diinput"
                        value={sum.belum}
                        tone="slate"
                        icon={FileText}
                        active={filters?.status === 'belum'}
                        onClick={() => applyFilter({ status: 'belum' })}
                    />
                </div>

                {selectedPlan && (
                    <Card className="border-primary/40 shadow-sm">
                        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b bg-primary/5 pb-4">
                            <div className="min-w-0">
                                <CardTitle className="truncate text-lg">
                                    {selectedPlan.mesin_pembangkit}
                                </CardTitle>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span>{selectedPlan.jenis_pembangkit || '-'}</span>
                                    <span>Scope: {selectedPlan.scope || '-'}</span>
                                    <span>Sistem: {selectedPlan.sistem || '-'}</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closePlan}
                                className="shrink-0 gap-1.5"
                            >
                                <X className="h-4 w-4" />
                                Tutup
                            </Button>
                        </CardHeader>

                        <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
                            {/* Rencana - hanya baca */}
                            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                                <h3 className="flex items-center gap-2 font-bold text-muted-foreground">
                                    <CalendarClock className="h-4 w-4" />
                                    Rencana
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Mulai</p>
                                        <p className="font-mono font-semibold">
                                            {fmt(selectedPlan.start_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Selesai</p>
                                        <p className="font-mono font-semibold">
                                            {fmt(selectedPlan.selesai)}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <p className="text-xs text-muted-foreground">Durasi rencana</p>
                                    <p className="text-lg font-bold">
                                        {rencanaHari != null ? `${rencanaHari} hari` : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Aktual - form */}
                            <form
                                onSubmit={submit}
                                className="space-y-4 rounded-lg border border-blue-200 p-4 dark:border-blue-900/50"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-blue-700 dark:text-blue-400">
                                        Aktual
                                    </h3>
                                    {k?.eviden_url && (
                                        <a
                                            href={k.eviden_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:underline dark:border-blue-900 dark:bg-blue-950/40"
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Lihat eviden
                                        </a>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="mulai_akt">Mulai aktual</Label>
                                        <Input
                                            id="mulai_akt"
                                            type="date"
                                            value={form.data.start_date_aktual}
                                            onChange={(e) =>
                                                form.setData(
                                                    'start_date_aktual',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="selesai_akt">Selesai aktual</Label>
                                        <Input
                                            id="selesai_akt"
                                            type="date"
                                            value={form.data.selesai_aktual}
                                            onChange={(e) =>
                                                form.setData('selesai_aktual', e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="catatan">Catatan</Label>
                                    <Textarea
                                        id="catatan"
                                        className="min-h-[70px] resize-none"
                                        placeholder="Alasan keterlambatan / kendala di lapangan..."
                                        value={form.data.catatan}
                                        onChange={(e) => form.setData('catatan', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ev_time">Eviden (PDF/JPG/PNG)</Label>
                                    <Input
                                        id="ev_time"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                            form.setData('eviden', e.target.files?.[0] ?? null)
                                        }
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Simpan Data On Time'}
                                </Button>
                            </form>

                            {/* Ringkasan perbandingan */}
                            <div className="lg:col-span-2">
                                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Durasi rencana
                                        </p>
                                        <p className="text-lg font-bold">
                                            {rencanaHari != null ? `${rencanaHari} hari` : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Durasi aktual
                                        </p>
                                        <p className="text-lg font-bold">
                                            {aktualHari != null ? `${aktualHari} hari` : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Selisih</p>
                                        <p
                                            className={`text-lg font-bold ${
                                                selisih == null
                                                    ? ''
                                                    : selisih > 0
                                                      ? 'text-red-600 dark:text-red-400'
                                                      : 'text-emerald-600 dark:text-emerald-400'
                                            }`}
                                        >
                                            {selisih == null
                                                ? '-'
                                                : selisih > 0
                                                  ? `+${selisih} hari (delay)`
                                                  : selisih === 0
                                                    ? 'Tepat waktu'
                                                    : `${selisih} hari (lebih cepat)`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Grafik perbandingan durasi */}
                            <div className="rounded-lg border p-4 lg:col-span-2">
                                <h4 className="mb-1 text-sm font-bold">
                                    Perbandingan Durasi (hari)
                                </h4>
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Batang aktual berwarna merah bila melebihi rencana
                                </p>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={durasiChart}
                                            margin={{ top: 22, right: 10, left: -18, bottom: 0 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                opacity={0.3}
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                }}
                                                formatter={(v) => [`${v} hari`, 'Durasi']}
                                            />
                                            <Bar dataKey="nilai" radius={[6, 6, 0, 0]} barSize={80}>
                                                {durasiChart.map((d, i) => (
                                                    <Cell key={i} fill={d.warna} />
                                                ))}
                                                <LabelList
                                                    dataKey="nilai"
                                                    position="top"
                                                    fontSize={12}
                                                    fontWeight="bold"
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Grafik perbandingan seluruh mesin di halaman ini */}
                {overviewChart.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Durasi Rencana vs Aktual Antar Mesin
                            </CardTitle>
                            <CardDescription>
                                {overviewChart.length} mesin yang sudah selesai pada halaman ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={overviewChart}
                                        margin={{ top: 10, right: 10, left: -18, bottom: 40 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            opacity={0.3}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            angle={-25}
                                            textAnchor="end"
                                            interval={0}
                                            height={60}
                                            tick={{ fontSize: 10 }}
                                        />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                            contentStyle={{
                                                borderRadius: 8,
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar
                                            dataKey="Rencana"
                                            fill="#94a3b8"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={26}
                                        />
                                        <Bar
                                            dataKey="Aktual"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={26}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Daftar mesin */}
                <Card className="h-fit gap-0 py-4">
                    <CardHeader className="space-y-3 pb-3">
                        <div className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-lg">Daftar Mesin</CardTitle>
                                <CardDescription>
                                    Klik <span className="font-semibold">Isi Data</span> untuk
                                    membuka form input
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buka mesin (semua halaman)..."
                                        className="h-9 pl-9"
                                        value={pickerQuery}
                                        onChange={(e) => {
                                            setPickerQuery(e.target.value);
                                            setPickerOpen(true);
                                        }}
                                        onFocus={() => setPickerOpen(true)}
                                        onBlur={() =>
                                            setTimeout(() => setPickerOpen(false), 180)
                                        }
                                    />
                                    {pickerOpen && (
                                        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover shadow-lg">
                                            {pickerMatches.length > 0 ? (
                                                pickerMatches.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left last:border-0 hover:bg-accent"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            openPlan(p.id);
                                                        }}
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-xs font-medium">
                                                                {p.mesin_pembangkit}
                                                            </span>
                                                            <span className="block truncate text-[10px] text-muted-foreground">
                                                                {p.jenis_pembangkit} ·{' '}
                                                                {p.scope || '-'}
                                                            </span>
                                                        </span>
                                                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                            {p.progress ?? 0}%
                                                        </span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-xs text-muted-foreground italic">
                                                    Tidak ada mesin yang cocok.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-md border bg-muted px-2 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground">
                                    Total: {outagePlans?.total ?? 0}
                                </div>
                            </div>
                        </div>

                        <FilterBar activeCount={activeFilterCount} onReset={resetFilters}>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                                    Cari
                                </Label>
                                <Input
                                    placeholder="Mesin / scope... (enter)"
                                    className="h-8 w-[190px] text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilter({ search: searchTerm });
                                        }
                                    }}
                                />
                            </div>
                            <FilterSelect
                                label="Tahun"
                                value={selectValue('tahun')}
                                onChange={(v) => applyFilter({ tahun: v })}
                                options={opts.tahun.map((t) => ({
                                    value: String(t),
                                    label: String(t),
                                }))}
                                width="w-[110px]"
                            />
                            <FilterSelect
                                label="Scope"
                                value={selectValue('scope')}
                                onChange={(v) => applyFilter({ scope: v })}
                                options={opts.scope.map((s) => ({
                                    value: s,
                                    label: s.toUpperCase(),
                                }))}
                                width="w-[150px]"
                            />
                            <FilterSelect
                                label="Jenis"
                                value={selectValue('jenis')}
                                onChange={(v) => applyFilter({ jenis: v })}
                                options={opts.jenis.map((s) => ({ value: s, label: s }))}
                                width="w-[110px]"
                            />
                            <FilterSelect
                                label="Sistem"
                                value={selectValue('sistem')}
                                onChange={(v) => applyFilter({ sistem: v })}
                                options={opts.sistem.map((s) => ({ value: s, label: s }))}
                                width="w-[160px]"
                            />
                            <FilterSelect
                                label="Status Input"
                                value={selectValue('status')}
                                onChange={(v) => applyFilter({ status: v })}
                                options={[
                                    { value: 'lengkap', label: 'Selesai dicatat' },
                                    { value: 'sebagian', label: 'Sedang berjalan' },
                                    { value: 'belum', label: 'Belum diinput' },
                                ]}
                                width="w-[160px]"
                            />
                        </FilterBar>
                    </CardHeader>

                    <CardContent className="overflow-x-auto p-0">
                        <Table className="whitespace-nowrap [&_td]:py-1.5 [&_th]:h-9">
                            <TableHeader>
                                <TableRow className="border-y bg-muted/30">
                                    <TableHead className="min-w-[220px] px-4 font-bold">
                                        Mesin
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Jenis
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Rencana (Mulai &rarr; Selesai)
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Aktual (Mulai &rarr; Selesai)
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Durasi R / A
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Status
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length > 0 ? (
                                    rows.map((plan) => {
                                        const kt = plan.kinerja_time;
                                        const isOpen = selectedPlan?.id === plan.id;
                                        const dR = daysBetween(plan.start_date, plan.selesai);
                                        const dA = daysBetween(
                                            kt?.start_date_aktual,
                                            kt?.selesai_aktual,
                                        );

                                        return (
                                            <TableRow
                                                key={plan.id}
                                                className={`hover:bg-muted/30 ${isOpen ? 'bg-primary/5' : ''}`}
                                            >
                                                <TableCell className="px-4 text-xs font-medium">
                                                    {plan.mesin_pembangkit}
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <span className="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground uppercase">
                                                        {plan.jenis_pembangkit || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 text-center font-mono text-[11px] text-muted-foreground">
                                                    {fmt(plan.start_date)} &rarr;{' '}
                                                    {fmt(plan.selesai)}
                                                </TableCell>
                                                <TableCell className="px-4 text-center font-mono text-[11px]">
                                                    {fmt(kt?.start_date_aktual)} &rarr;{' '}
                                                    {fmt(kt?.selesai_aktual)}
                                                </TableCell>
                                                <TableCell className="px-4 text-center font-mono text-[11px]">
                                                    {dR ?? '-'} / {dA ?? '-'}
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <StatusBadge plan={plan} />
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <Button
                                                        variant={isOpen ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-7 gap-1.5 text-xs"
                                                        onClick={() => openPlan(plan.id)}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                        Isi Data
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <Clock className="mx-auto mb-2 h-10 w-10 opacity-20" />
                                            <p>
                                                {activeFilterCount > 0
                                                    ? 'Tidak ada mesin yang cocok dengan filter.'
                                                    : 'Belum ada data mesin.'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {outagePlans?.links && outagePlans.links.length > 3 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 border-t px-4 pt-3">
                            {outagePlans.links.map((link: any, i: number) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    preserveState
                                    preserveScroll
                                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                        link.active
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'bg-background hover:bg-muted'
                                    } ${!link.url ? 'pointer-events-none cursor-not-allowed opacity-50' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}

OnTime.layout = {
    breadcrumbs: [
        { title: 'Kinerja Outage', href: '#' },
        { title: 'On Time', href: '/kinerja/on-time' },
    ],
};
