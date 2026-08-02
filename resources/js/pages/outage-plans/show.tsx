import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Gauge, Factory, Info } from 'lucide-react';
import {
    LineChart,
    Line,
    LabelList,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
} from 'recharts';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDMY } from '@/lib/outage-progress';

type DailyProgress = {
    id: number;
    tanggal: string;
    plan_progress: number;
    actual_progress: number;
    keterangan: string | null;
    status: 'Leading' | 'Lagging';
};

type OutagePlan = {
    id: number;
    mesin_pembangkit: string | null;
    scope: string | null;
    jenis_pembangkit: string | null;
    durasi: number | null;
    start_date: string | null;
    selesai: string | null;
    progress: number | null;
    ket: string | null;
    rapat_r2: string | null;
    rapat_r3: string | null;
    rapat_p1: string | null;
    rapat_p2: string | null;
    rapat_p3: string | null;
    sistem: string | null;
    real_start: string | null;
    real_stop: string | null;
    ket_realisasi: string | null;
    daily_progresses: DailyProgress[];
};

export default function OutagePlanShow({
    outagePlan,
    totalHari,
    overallPlan,
    overallActual,
}: {
    outagePlan: OutagePlan;
    totalHari: number | null;
    overallPlan: number | null;
    overallActual: number | null;
}) {
    const dailyProgresses = outagePlan.daily_progresses || [];

    const chartData = dailyProgresses.map((row) => ({
        // formatDMY gives DD-MM-YYYY; the reference chart uses DD/MM/YY.
        label: formatDMY(row.tanggal).replace(
            /^(\d{2})-(\d{2})-\d{2}(\d{2})$/,
            '$1/$2/$3',
        ),
        RENCANA: Number(row.plan_progress),
        REALISASI: Number(row.actual_progress),
    }));

    // Indonesian decimal format, matching the reference S-curve (e.g. 78,18).
    const fmtPct = (v: number | string) =>
        Number(v).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (
        <>
            <Head
                title={`Detail Outage: ${outagePlan.mesin_pembangkit || ''}`}
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <Card className="border-none bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                            <div className="space-y-3">
                                <Link
                                    href="/outage-plans"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Kembali ke Daftar Outage
                                </Link>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                        {outagePlan.mesin_pembangkit || '-'}
                                    </h1>
                                    <span className="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground uppercase">
                                        {outagePlan.jenis_pembangkit || '-'}
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${outagePlan.ket === 'CLOSE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}
                                    >
                                        {outagePlan.ket || 'OPEN'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Factory className="h-3.5 w-3.5 text-primary" />
                                        <span>
                                            Scope: {outagePlan.scope || '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        <span>
                                            {outagePlan.start_date
                                                ? formatDMY(
                                                      outagePlan.start_date,
                                                  )
                                                : '-'}{' '}
                                            &rarr;{' '}
                                            {outagePlan.selesai
                                                ? formatDMY(outagePlan.selesai)
                                                : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Waktu Mulai
                                </p>
                                <p className="text-sm font-bold">
                                    {outagePlan.start_date
                                        ? formatDMY(outagePlan.start_date)
                                        : '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Waktu Selesai
                                </p>
                                <p className="text-sm font-bold">
                                    {outagePlan.selesai
                                        ? formatDMY(outagePlan.selesai)
                                        : '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Total Hari
                                </p>
                                <p className="text-sm font-bold">
                                    {totalHari ? `${totalHari} Hari` : '-'}
                                    {outagePlan.durasi ? (
                                        <span className="ml-1 font-normal text-muted-foreground">
                                            (durasi {outagePlan.durasi})
                                        </span>
                                    ) : null}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Progress Keseluruhan
                                </p>
                                <p className="text-sm font-bold">
                                    Plan{' '}
                                    {overallPlan !== null &&
                                    overallPlan !== undefined
                                        ? Number(overallPlan).toFixed(0)
                                        : 0}
                                    % / Actual{' '}
                                    {overallActual !== null &&
                                    overallActual !== undefined
                                        ? Number(overallActual).toFixed(0)
                                        : 0}
                                    %
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Realisasi Pelaksanaan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Realisasi Pelaksanaan</CardTitle>
                        <CardDescription>
                            Waktu pelaksanaan aktual di lapangan dan sistem
                            kelistrikan terkait
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="rounded-lg border p-3">
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Sistem
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {outagePlan.sistem || '-'}
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Real Start
                                </p>
                                <p className="mt-1 font-mono text-sm font-semibold">
                                    {outagePlan.real_start
                                        ? formatDMY(outagePlan.real_start)
                                        : '-'}
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Real Stop
                                </p>
                                <p className="mt-1 font-mono text-sm font-semibold">
                                    {outagePlan.real_stop
                                        ? formatDMY(outagePlan.real_stop)
                                        : '-'}
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Keterangan
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {outagePlan.ket_realisasi || '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Jadwal Rapat */}
                <Card>
                    <CardHeader>
                        <CardTitle>Jadwal Rapat</CardTitle>
                        <CardDescription>
                            Tahapan rapat persiapan dan pelaksanaan outage
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            {(
                                [
                                    ['R2', outagePlan.rapat_r2],
                                    ['R3', outagePlan.rapat_r3],
                                    ['P1', outagePlan.rapat_p1],
                                    ['P2', outagePlan.rapat_p2],
                                    ['P3', outagePlan.rapat_p3],
                                ] as [string, string | null][]
                            ).map(([label, tanggal]) => (
                                <div
                                    key={label}
                                    className="rounded-lg border p-3 text-center"
                                >
                                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Rapat {label}
                                    </p>
                                    <p className="mt-1 font-mono text-xs font-semibold">
                                        {tanggal ? formatDMY(tanggal) : '-'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Kurva S */}
                <Card>
                    <CardHeader>
                        <CardTitle>Kurva S - Plan vs Actual</CardTitle>
                        <CardDescription>
                            Perbandingan progress kumulatif rencana dan aktual
                            per hari
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-2 flex flex-wrap gap-x-10 gap-y-1 text-sm">
                            <div className="flex gap-2">
                                <span className="w-20 text-[#4472C4]">
                                    Rencana
                                </span>
                                <span className="font-semibold text-[#4472C4]">
                                    : {fmtPct(overallPlan ?? 0)} %
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <span className="w-20 text-[#C00000]">
                                    Realisasi
                                </span>
                                <span className="font-semibold text-[#C00000]">
                                    : {fmtPct(overallActual ?? 0)} %
                                </span>
                            </div>
                        </div>
                        <div className="h-[520px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{
                                            top: 28,
                                            right: 26,
                                            left: 4,
                                            bottom: 68,
                                        }}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            stroke="#9BBB59"
                                            opacity={0.55}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            angle={-90}
                                            textAnchor="end"
                                            interval={0}
                                            height={60}
                                            tick={{ fontSize: 10 }}
                                            label={{
                                                value: 'Tanggal',
                                                position: 'insideBottom',
                                                offset: -60,
                                                fontSize: 12,
                                            }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            ticks={[0, 20, 40, 60, 80, 100]}
                                            tick={{ fontSize: 11 }}
                                            label={{
                                                value: 'Persentase',
                                                angle: -90,
                                                position: 'insideLeft',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow:
                                                    '0 4px 12px rgba(0,0,0,0.1)',
                                            }}
                                            formatter={(value) => [
                                                `${fmtPct(value as number)} %`,
                                            ]}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={30}
                                            wrapperStyle={{ fontSize: '12px' }}
                                        />
                                        <Line
                                            type="linear"
                                            dataKey="RENCANA"
                                            stroke="#4472C4"
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: '#4472C4' }}
                                        >
                                            <LabelList
                                                dataKey="RENCANA"
                                                position="bottom"
                                                offset={8}
                                                fontSize={9}
                                                fill="#4472C4"
                                                formatter={(v: unknown) => fmtPct(v as number)}
                                            />
                                        </Line>
                                        <Line
                                            type="linear"
                                            dataKey="REALISASI"
                                            stroke="#C00000"
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: '#C00000' }}
                                        >
                                            <LabelList
                                                dataKey="REALISASI"
                                                position="top"
                                                offset={8}
                                                fontSize={9}
                                                fill="#C00000"
                                                formatter={(v: unknown) => fmtPct(v as number)}
                                            />
                                        </Line>
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                                    <Info className="mb-2 h-10 w-10 opacity-20" />
                                    <p>Belum ada data progress harian.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Riwayat Progress Harian */}
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Progress Harian</CardTitle>
                        <CardDescription>
                            Seluruh catatan progress harian yang telah diinput
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <Table className="whitespace-nowrap">
                            <TableHeader>
                                <TableRow className="border-y bg-muted/30">
                                    <TableHead className="w-16 px-4 text-center font-bold">
                                        Day
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Plan (%)
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Actual (%)
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Status
                                    </TableHead>
                                    <TableHead className="min-w-[200px] px-4 font-bold">
                                        Catatan
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyProgresses.length > 0 ? (
                                    dailyProgresses.map((row, idx) => (
                                        <TableRow
                                            key={row.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <TableCell className="px-4 text-center font-mono text-xs text-muted-foreground">
                                                Day {idx + 1}
                                            </TableCell>
                                            <TableCell className="px-4 text-center font-mono text-[11px] text-muted-foreground">
                                                {formatDMY(row.tanggal)}
                                            </TableCell>
                                            <TableCell className="px-4 text-center text-xs font-semibold">
                                                {row.plan_progress}%
                                            </TableCell>
                                            <TableCell className="px-4 text-center text-xs font-semibold">
                                                {row.actual_progress}%
                                            </TableCell>
                                            <TableCell className="px-4 text-center">
                                                <span
                                                    className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                        row.status === 'Leading'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                                    }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 text-xs text-muted-foreground">
                                                {row.keterangan || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <Info className="mx-auto mb-2 h-10 w-10 opacity-20" />
                                            <p>
                                                Belum ada progress harian yang
                                                diinput. Silakan input melalui
                                                form Edit.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OutagePlanShow.layout = {
    breadcrumbs: [
        {
            title: 'Perencanaan dan Jadwal Outage',
            href: '/outage-plans',
        },
        {
            title: 'Detail Outage',
            href: '#',
        },
    ],
};
