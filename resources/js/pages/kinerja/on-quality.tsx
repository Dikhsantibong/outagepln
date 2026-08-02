import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ShieldCheck,
    FileText,
    CheckCircle2,
    AlertCircle,
    Search,
    Lock,
    Pencil,
    TrendingUp,
    TrendingDown,
    Minus,
    X,
    ListChecks,
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
    dm_sebelum: number | null;
    sfc_sebelum: number | null;
    eviden_sebelum_url: string | null;
    dm_sesudah: number | null;
    sfc_sesudah: number | null;
    eviden_sesudah_url: string | null;
} | null;

type Plan = {
    id: number;
    mesin_pembangkit: string;
    jenis_pembangkit: string | null;
    scope: string | null;
    sistem: string | null;
    progress: number | null;
    kinerja_quality: Kinerja;
};

type PlanOption = {
    id: number;
    mesin_pembangkit: string;
    jenis_pembangkit: string | null;
    scope: string | null;
    sistem: string | null;
    progress: number | null;
};

type Options = {
    tahun: (string | number)[];
    scope: string[];
    jenis: string[];
    sistem: string[];
};

const FILTER_KEYS = ['search', 'tahun', 'scope', 'jenis', 'sistem', 'status'];
const URL = '/kinerja/on-quality';

/** Completion state of a row, used for the badge and the status filter. */
function statusOf(plan: Plan) {
    const k = plan.kinerja_quality;

    if (k?.dm_sebelum != null && k?.dm_sesudah != null) {
        return 'lengkap' as const;
    }

    if (k?.dm_sebelum != null) {
        return 'sebagian' as const;
    }

    return 'belum' as const;
}

function StatusBadge({ plan }: { plan: Plan }) {
    const s = statusOf(plan);
    const map = {
        lengkap: {
            label: 'Lengkap',
            cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
        },
        sebagian: {
            label: 'Sesudah kosong',
            cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
        },
        belum: {
            label: 'Belum diinput',
            cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        },
    }[s];

    return (
        <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${map.cls}`}
        >
            {map.label}
        </span>
    );
}

/** Shows the change between two readings; SFC improves when it goes down. */
function Delta({
    before,
    after,
    lowerIsBetter = false,
    suffix = '',
}: {
    before: number | null | undefined;
    after: number | null | undefined;
    lowerIsBetter?: boolean;
    suffix?: string;
}) {
    if (before == null || after == null) {
        return <span className="text-xs text-muted-foreground">-</span>;
    }

    const diff = Number(after) - Number(before);
    const better = lowerIsBetter ? diff < 0 : diff > 0;
    const same = Math.abs(diff) < 0.0001;
    const Icon = same ? Minus : better ? TrendingUp : TrendingDown;
    const cls = same
        ? 'text-muted-foreground'
        : better
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400';

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${cls}`}>
            <Icon className="h-3.5 w-3.5" />
            {diff > 0 ? '+' : ''}
            {Number(diff.toFixed(2))}
            {suffix}
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
    icon: typeof ShieldCheck;
    active?: boolean;
    onClick?: () => void;
}) {
    const tones = {
        primary: 'bg-primary/10 text-primary',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
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

export default function OnQuality({
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

    // Filtering, sorting and pagination are all server-side; this page used to
    // load every plan and slice it in the browser.
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

    const closePlan = () => {
        const q = buildFilterQuery(filters, FILTER_KEYS, { search: searchTerm });
        go(q);
    };

    // The picker searches across every plan, not just the current page.
    const pickerMatches = useMemo(() => {
        const q = pickerQuery.trim().toLowerCase();
        const list = q
            ? planOptions.filter((p) =>
                  `${p.mesin_pembangkit ?? ''} ${p.jenis_pembangkit ?? ''} ${p.scope ?? ''} ${p.sistem ?? ''}`
                      .toLowerCase()
                      .includes(q),
              )
            : planOptions;

        return list.slice(0, 50);
    }, [planOptions, pickerQuery]);

    const k = selectedPlan?.kinerja_quality ?? null;
    const locked = (selectedPlan?.progress ?? 0) < 100;

    const formSebelum = useForm({
        outage_plan_id: '',
        tipe: 'sebelum',
        dm: '',
        sfc: '',
        eviden: null as File | null,
    });

    const formSesudah = useForm({
        outage_plan_id: '',
        tipe: 'sesudah',
        dm: '',
        sfc: '',
        eviden: null as File | null,
    });

    // Re-seed both forms whenever a different plan is opened.
    const [seededFor, setSeededFor] = useState<number | null>(null);

    if (selectedPlan && seededFor !== selectedPlan.id) {
        setSeededFor(selectedPlan.id);
        formSebelum.setData({
            outage_plan_id: String(selectedPlan.id),
            tipe: 'sebelum',
            dm: k?.dm_sebelum?.toString() ?? '',
            sfc: k?.sfc_sebelum?.toString() ?? '',
            eviden: null,
        });
        formSesudah.setData({
            outage_plan_id: String(selectedPlan.id),
            tipe: 'sesudah',
            dm: k?.dm_sesudah?.toString() ?? '',
            sfc: k?.sfc_sesudah?.toString() ?? '',
            eviden: null,
        });
    }

    // Charts follow what is being typed so the comparison updates live.
    const dmChart = [
        {
            name: 'Sebelum',
            nilai: Number(formSebelum.data.dm || k?.dm_sebelum || 0),
            warna: '#3b82f6',
        },
        {
            name: 'Sesudah',
            nilai: Number(formSesudah.data.dm || k?.dm_sesudah || 0),
            warna: '#10b981',
        },
    ];

    const sfcChart = [
        {
            name: 'Sebelum',
            nilai: Number(formSebelum.data.sfc || k?.sfc_sebelum || 0),
            warna: '#3b82f6',
        },
        {
            name: 'Sesudah',
            nilai: Number(formSesudah.data.sfc || k?.sfc_sesudah || 0),
            warna: '#10b981',
        },
    ];

    // Overview across the current page, skipping machines with no readings yet.
    const overviewChart = useMemo(
        () =>
            rows
                .filter((p) => p.kinerja_quality?.dm_sebelum != null)
                .map((p) => ({
                    name:
                        p.mesin_pembangkit.length > 18
                            ? p.mesin_pembangkit.slice(0, 18) + '…'
                            : p.mesin_pembangkit,
                    Sebelum: Number(p.kinerja_quality?.dm_sebelum ?? 0),
                    Sesudah: Number(p.kinerja_quality?.dm_sesudah ?? 0),
                })),
        [rows],
    );

    const submit = (which: 'sebelum' | 'sesudah') => (e: React.FormEvent) => {
        e.preventDefault();
        const form = which === 'sebelum' ? formSebelum : formSesudah;
        form.post(URL, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () =>
                toast.success(
                    `Data ${which === 'sebelum' ? 'Sebelum' : 'Sesudah'} Overhaul tersimpan`,
                ),
            onError: (errs) =>
                toast.error(
                    (Object.values(errs)[0] as string) || 'Gagal menyimpan data',
                ),
        });
    };

    return (
        <>
            <Head title="Kinerja - On Quality" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Judul */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">On Quality</h1>
                        <p className="text-sm text-muted-foreground">
                            Catat Daya Mampu &amp; SFC sebelum dan sesudah overhaul
                        </p>
                    </div>
                </div>

                {/* Ringkasan - juga berfungsi sebagai filter cepat */}
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
                        label="Sesudah kosong"
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

                {/* Panel input - hanya muncul saat sebuah mesin dibuka */}
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
                                    <span
                                        className={`font-bold ${locked ? 'text-amber-600' : 'text-emerald-600'}`}
                                    >
                                        Progres {selectedPlan.progress ?? 0}%
                                    </span>
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
                            {/* SEBELUM */}
                            <form
                                onSubmit={submit('sebelum')}
                                className="space-y-4 rounded-lg border border-blue-200 p-4 dark:border-blue-900/50"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-blue-700 dark:text-blue-400">
                                        Sebelum Overhaul
                                    </h3>
                                    {k?.eviden_sebelum_url && (
                                        <a
                                            href={k.eviden_sebelum_url}
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
                                        <Label htmlFor="dm_seb">Daya Mampu (MW)</Label>
                                        <Input
                                            id="dm_seb"
                                            type="number"
                                            step="0.01"
                                            placeholder="10.50"
                                            value={formSebelum.data.dm}
                                            onChange={(e) =>
                                                formSebelum.setData('dm', e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="sfc_seb">SFC</Label>
                                        <Input
                                            id="sfc_seb"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.25"
                                            value={formSebelum.data.sfc}
                                            onChange={(e) =>
                                                formSebelum.setData('sfc', e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ev_seb">Eviden (PDF/JPG/PNG)</Label>
                                    <Input
                                        id="ev_seb"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                            formSebelum.setData(
                                                'eviden',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={formSebelum.processing}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {formSebelum.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Sebelum OH'}
                                </Button>
                            </form>

                            {/* SESUDAH */}
                            <form
                                onSubmit={submit('sesudah')}
                                className={`space-y-4 rounded-lg border p-4 ${locked ? 'border-slate-200 bg-muted/30 dark:border-slate-800' : 'border-emerald-200 dark:border-emerald-900/50'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <h3
                                        className={`font-bold ${locked ? 'text-muted-foreground' : 'text-emerald-700 dark:text-emerald-400'}`}
                                    >
                                        Sesudah Overhaul
                                    </h3>
                                    {k?.eviden_sesudah_url && (
                                        <a
                                            href={k.eviden_sesudah_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-600 hover:underline dark:border-emerald-900 dark:bg-emerald-950/40"
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Lihat eviden
                                        </a>
                                    )}
                                </div>

                                {locked && (
                                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            Terkunci sampai progres pekerjaan 100%. Saat ini{' '}
                                            {selectedPlan.progress ?? 0}%.
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="dm_ses">Daya Mampu (MW)</Label>
                                        <Input
                                            id="dm_ses"
                                            type="number"
                                            step="0.01"
                                            placeholder="12.00"
                                            value={formSesudah.data.dm}
                                            onChange={(e) =>
                                                formSesudah.setData('dm', e.target.value)
                                            }
                                            required
                                            disabled={locked}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="sfc_ses">SFC</Label>
                                        <Input
                                            id="sfc_ses"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.22"
                                            value={formSesudah.data.sfc}
                                            onChange={(e) =>
                                                formSesudah.setData('sfc', e.target.value)
                                            }
                                            required
                                            disabled={locked}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ev_ses">Eviden (PDF/JPG/PNG)</Label>
                                    <Input
                                        id="ev_ses"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        disabled={locked}
                                        onChange={(e) =>
                                            formSesudah.setData(
                                                'eviden',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={formSesudah.processing || locked}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {formSesudah.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Sesudah OH'}
                                </Button>
                            </form>

                            {/* Ringkasan hasil */}
                            <div className="lg:col-span-2">
                                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            Perubahan Daya Mampu
                                        </span>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-mono">
                                                {k?.dm_sebelum ?? '-'} &rarr;{' '}
                                                {k?.dm_sesudah ?? '-'}
                                            </span>
                                            <Delta
                                                before={k?.dm_sebelum}
                                                after={k?.dm_sesudah}
                                                suffix=" MW"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            Perubahan SFC
                                        </span>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-mono">
                                                {k?.sfc_sebelum ?? '-'} &rarr;{' '}
                                                {k?.sfc_sesudah ?? '-'}
                                            </span>
                                            <Delta
                                                before={k?.sfc_sebelum}
                                                after={k?.sfc_sesudah}
                                                lowerIsBetter
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Daya Mampu naik dan SFC turun berarti membaik.
                                </p>
                            </div>

                            {/* Grafik perbandingan sebelum vs sesudah */}
                            <div className="grid gap-4 lg:col-span-2 sm:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <h4 className="mb-1 text-sm font-bold">
                                        Daya Mampu (MW)
                                    </h4>
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        Semakin tinggi semakin baik
                                    </p>
                                    <div className="h-[190px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={dmChart}
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
                                                    formatter={(v) => [`${v} MW`, 'Daya Mampu']}
                                                />
                                                <Bar dataKey="nilai" radius={[6, 6, 0, 0]} barSize={70}>
                                                    {dmChart.map((d, i) => (
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

                                <div className="rounded-lg border p-4">
                                    <h4 className="mb-1 text-sm font-bold">SFC</h4>
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        Semakin rendah semakin baik
                                    </p>
                                    <div className="h-[190px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={sfcChart}
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
                                                    formatter={(v) => [`${v}`, 'SFC']}
                                                />
                                                <Bar dataKey="nilai" radius={[6, 6, 0, 0]} barSize={70}>
                                                    {sfcChart.map((d, i) => (
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
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Grafik perbandingan seluruh mesin di halaman ini */}
                {overviewChart.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Perbandingan Daya Mampu Antar Mesin
                            </CardTitle>
                            <CardDescription>
                                {overviewChart.length} mesin dengan data pada halaman ini
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
                                            dataKey="Sebelum"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={26}
                                        />
                                        <Bar
                                            dataKey="Sesudah"
                                            fill="#10b981"
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
                                {/* Pemilih cepat lintas halaman */}
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

                        <FilterBar
                            activeCount={activeFilterCount}
                            onReset={resetFilters}
                        >
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
                                    { value: 'sebagian', label: 'Sesudah kosong' },
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
                                    <TableHead className="px-4 text-center font-bold">
                                        Progres
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        DM (Seb &rarr; Ses)
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        SFC (Seb &rarr; Ses)
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
                                        const kq = plan.kinerja_quality;
                                        const isOpen = selectedPlan?.id === plan.id;

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
                                                <TableCell className="px-4 text-center">
                                                    <span
                                                        className={`text-[11px] font-bold ${(plan.progress ?? 0) >= 100 ? 'text-emerald-600' : 'text-muted-foreground'}`}
                                                    >
                                                        {plan.progress ?? 0}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 text-center font-mono text-[11px]">
                                                    {kq?.dm_sebelum ?? '-'} &rarr;{' '}
                                                    {kq?.dm_sesudah ?? '-'}
                                                </TableCell>
                                                <TableCell className="px-4 text-center font-mono text-[11px]">
                                                    {kq?.sfc_sebelum ?? '-'} &rarr;{' '}
                                                    {kq?.sfc_sesudah ?? '-'}
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
                                            <ShieldCheck className="mx-auto mb-2 h-10 w-10 opacity-20" />
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
                            {outagePlans.links.map((link: any, k2: number) => (
                                <Link
                                    key={k2}
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

OnQuality.layout = {
    breadcrumbs: [
        { title: 'Kinerja Outage', href: '#' },
        { title: 'On Quality', href: '/kinerja/on-quality' },
    ],
};
