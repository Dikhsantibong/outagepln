import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    DollarSign,
    FileText,
    CheckCircle2,
    AlertCircle,
    Search,
    Pencil,
    X,
    ListChecks,
    TrendingUp,
    TrendingDown,
    Minus,
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

type Kinerja = {
    anggaran_rencana: number | string | null;
    anggaran_aktual: number | string | null;
    eviden_url: string | null;
} | null;

type Plan = {
    id: number;
    mesin_pembangkit: string;
    jenis_pembangkit: string | null;
    scope: string | null;
    sistem: string | null;
    progress: number | null;
    kinerja_cost: Kinerja;
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
const URL = '/kinerja/on-cost';

const rupiah = (v: number | string | null | undefined) =>
    v == null || v === ''
        ? '-'
        : 'Rp ' + Number(v).toLocaleString('id-ID', { maximumFractionDigits: 0 });

function StatusBadge({ plan }: { plan: Plan }) {
    const k = plan.kinerja_cost;
    let label = 'Belum diinput';
    let cls = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

    if (k?.anggaran_rencana != null && k?.anggaran_aktual != null) {
        // On Cost when the actual spend does not exceed the planned budget.
        const boros = Number(k.anggaran_aktual) > Number(k.anggaran_rencana);
        label = boros ? 'Over Budget' : 'On Cost';
        cls = boros
            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    } else if (k?.anggaran_rencana != null) {
        label = 'Aktual kosong';
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
    icon: typeof DollarSign;
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

export default function OnCost({
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

    const k = selectedPlan?.kinerja_cost ?? null;

    const form = useForm({
        outage_plan_id: '',
        anggaran_rencana: '',
        anggaran_aktual: '',
        eviden: null as File | null,
    });

    const [seededFor, setSeededFor] = useState<number | null>(null);

    if (selectedPlan && seededFor !== selectedPlan.id) {
        setSeededFor(selectedPlan.id);
        form.setData({
            outage_plan_id: String(selectedPlan.id),
            anggaran_rencana: k?.anggaran_rencana?.toString() ?? '',
            anggaran_aktual: k?.anggaran_aktual?.toString() ?? '',
            eviden: null,
        });
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(URL, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => toast.success('Data On Cost tersimpan'),
            onError: (errs) =>
                toast.error(
                    (Object.values(errs)[0] as string) || 'Gagal menyimpan data',
                ),
        });
    };

    // Live comparison while typing, falling back to what is stored.
    const rencanaRaw = form.data.anggaran_rencana || k?.anggaran_rencana;
    const aktualRaw = form.data.anggaran_aktual || k?.anggaran_aktual;
    const punyaKeduanya =
        rencanaRaw != null && rencanaRaw !== '' && aktualRaw != null && aktualRaw !== '';
    const selisih = punyaKeduanya
        ? Number(aktualRaw) - Number(rencanaRaw)
        : null;
    const persen =
        selisih != null && Number(rencanaRaw) > 0
            ? (selisih / Number(rencanaRaw)) * 100
            : null;

    // Charts are in millions so the axis stays readable for large budgets.
    const juta = (v: unknown) => Number(v || 0) / 1_000_000;

    const anggaranChart = [
        { name: 'Rencana', nilai: juta(rencanaRaw), warna: '#3b82f6' },
        {
            name: 'Aktual',
            nilai: juta(aktualRaw),
            warna: selisih != null && selisih > 0 ? '#ef4444' : '#10b981',
        },
    ];

    // Overview across the current page, skipping machines with no budget yet.
    const overviewChart = useMemo(
        () =>
            rows
                .filter((p) => p.kinerja_cost?.anggaran_rencana != null)
                .map((p) => ({
                    name:
                        p.mesin_pembangkit.length > 18
                            ? p.mesin_pembangkit.slice(0, 18) + '…'
                            : p.mesin_pembangkit,
                    Rencana: juta(p.kinerja_cost?.anggaran_rencana),
                    Aktual: juta(p.kinerja_cost?.anggaran_aktual),
                })),
        [rows],
    );

    return (
        <>
            <Head title="Kinerja - On Cost" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">On Cost</h1>
                        <p className="text-sm text-muted-foreground">
                            Catat anggaran rencana dan realisasi biaya overhaul
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
                        label="Lengkap"
                        value={sum.lengkap}
                        tone="emerald"
                        icon={CheckCircle2}
                        active={filters?.status === 'lengkap'}
                        onClick={() => applyFilter({ status: 'lengkap' })}
                    />
                    <SummaryCard
                        label="Aktual kosong"
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
                            <form
                                onSubmit={submit}
                                className="space-y-4 rounded-lg border border-blue-200 p-4 dark:border-blue-900/50"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-blue-700 dark:text-blue-400">
                                        Input Anggaran
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

                                <div className="space-y-1.5">
                                    <Label htmlFor="ang_ren">Anggaran Rencana (Rp)</Label>
                                    <Input
                                        id="ang_ren"
                                        type="number"
                                        min={0}
                                        step="1"
                                        placeholder="500000000"
                                        value={form.data.anggaran_rencana}
                                        onChange={(e) =>
                                            form.setData('anggaran_rencana', e.target.value)
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {rupiah(form.data.anggaran_rencana)}
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="ang_akt">Anggaran Aktual (Rp)</Label>
                                    <Input
                                        id="ang_akt"
                                        type="number"
                                        min={0}
                                        step="1"
                                        placeholder="480000000"
                                        value={form.data.anggaran_aktual}
                                        onChange={(e) =>
                                            form.setData('anggaran_aktual', e.target.value)
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {rupiah(form.data.anggaran_aktual)}
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="ev_cost">Eviden (PDF/JPG/PNG)</Label>
                                    <Input
                                        id="ev_cost"
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
                                    {form.processing ? 'Menyimpan...' : 'Simpan Data On Cost'}
                                </Button>
                            </form>

                            {/* Ringkasan biaya */}
                            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                                <h3 className="font-bold text-muted-foreground">
                                    Ringkasan Biaya
                                </h3>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <span className="text-xs text-muted-foreground">
                                            Anggaran rencana
                                        </span>
                                        <span className="font-mono text-sm font-semibold">
                                            {rupiah(rencanaRaw)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <span className="text-xs text-muted-foreground">
                                            Anggaran aktual
                                        </span>
                                        <span className="font-mono text-sm font-semibold">
                                            {rupiah(aktualRaw)}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground">Selisih</p>
                                    {selisih == null ? (
                                        <p className="text-lg font-bold text-muted-foreground">
                                            -
                                        </p>
                                    ) : (
                                        <div
                                            className={`flex items-center gap-2 ${
                                                selisih > 0
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : selisih === 0
                                                      ? 'text-muted-foreground'
                                                      : 'text-emerald-600 dark:text-emerald-400'
                                            }`}
                                        >
                                            {selisih > 0 ? (
                                                <TrendingUp className="h-5 w-5" />
                                            ) : selisih === 0 ? (
                                                <Minus className="h-5 w-5" />
                                            ) : (
                                                <TrendingDown className="h-5 w-5" />
                                            )}
                                            <span className="text-lg font-bold">
                                                {selisih > 0 ? '+' : selisih < 0 ? '-' : ''}
                                                {rupiah(Math.abs(selisih))}
                                                {persen != null && (
                                                    <span className="ml-1 text-sm font-normal">
                                                        ({persen > 0 ? '+' : ''}
                                                        {persen.toFixed(1)}%)
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {selisih == null
                                            ? 'Isi kedua anggaran untuk melihat selisih.'
                                            : selisih > 0
                                              ? 'Realisasi melebihi anggaran (over budget).'
                                              : selisih === 0
                                                ? 'Realisasi tepat sesuai anggaran.'
                                                : 'Realisasi di bawah anggaran (hemat).'}
                                    </p>
                                </div>
                            </div>

                            {/* Grafik perbandingan anggaran */}
                            <div className="rounded-lg border p-4 lg:col-span-2">
                                <h4 className="mb-1 text-sm font-bold">
                                    Perbandingan Anggaran (juta Rupiah)
                                </h4>
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Batang aktual berwarna merah bila melebihi anggaran
                                </p>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={anggaranChart}
                                            margin={{ top: 22, right: 10, left: -10, bottom: 0 }}
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
                                                formatter={(v) => [
                                                    `Rp ${Number(v).toLocaleString('id-ID', { maximumFractionDigits: 1 })} juta`,
                                                    'Anggaran',
                                                ]}
                                            />
                                            <Bar dataKey="nilai" radius={[6, 6, 0, 0]} barSize={80}>
                                                {anggaranChart.map((d, i) => (
                                                    <Cell key={i} fill={d.warna} />
                                                ))}
                                                <LabelList
                                                    dataKey="nilai"
                                                    position="top"
                                                    fontSize={12}
                                                    fontWeight="bold"
                                                    formatter={(v: unknown) =>
                                                        Number(v).toLocaleString('id-ID', {
                                                            maximumFractionDigits: 1,
                                                        })
                                                    }
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
                                Anggaran Rencana vs Aktual Antar Mesin
                            </CardTitle>
                            <CardDescription>
                                Dalam juta Rupiah &middot; {overviewChart.length} mesin pada
                                halaman ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={overviewChart}
                                        margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
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
                                            formatter={(v) => [
                                                `Rp ${Number(v).toLocaleString('id-ID', { maximumFractionDigits: 1 })} juta`,
                                            ]}
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
                                    { value: 'lengkap', label: 'Lengkap' },
                                    { value: 'sebagian', label: 'Aktual kosong' },
                                    { value: 'belum', label: 'Belum diinput' },
                                ]}
                                width="w-[150px]"
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
                                        Scope
                                    </TableHead>
                                    <TableHead className="px-4 text-right font-bold">
                                        Anggaran Rencana
                                    </TableHead>
                                    <TableHead className="px-4 text-right font-bold">
                                        Anggaran Aktual
                                    </TableHead>
                                    <TableHead className="px-4 text-right font-bold">
                                        Selisih
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
                                        const kc = plan.kinerja_cost;
                                        const isOpen = selectedPlan?.id === plan.id;
                                        const diff =
                                            kc?.anggaran_rencana != null &&
                                            kc?.anggaran_aktual != null
                                                ? Number(kc.anggaran_aktual) -
                                                  Number(kc.anggaran_rencana)
                                                : null;

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
                                                <TableCell className="px-4 text-center text-[11px] font-semibold text-muted-foreground uppercase">
                                                    {plan.scope || '-'}
                                                </TableCell>
                                                <TableCell className="px-4 text-right font-mono text-[11px]">
                                                    {rupiah(kc?.anggaran_rencana)}
                                                </TableCell>
                                                <TableCell className="px-4 text-right font-mono text-[11px]">
                                                    {rupiah(kc?.anggaran_aktual)}
                                                </TableCell>
                                                <TableCell
                                                    className={`px-4 text-right font-mono text-[11px] font-bold ${
                                                        diff == null
                                                            ? 'text-muted-foreground'
                                                            : diff > 0
                                                              ? 'text-red-600 dark:text-red-400'
                                                              : 'text-emerald-600 dark:text-emerald-400'
                                                    }`}
                                                >
                                                    {diff == null
                                                        ? '-'
                                                        : (diff > 0 ? '+' : diff < 0 ? '-' : '') +
                                                          rupiah(Math.abs(diff))}
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
                                            colSpan={8}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <DollarSign className="mx-auto mb-2 h-10 w-10 opacity-20" />
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

OnCost.layout = {
    breadcrumbs: [
        { title: 'Kinerja Outage', href: '#' },
        { title: 'On Cost', href: '/kinerja/on-cost' },
    ],
};
