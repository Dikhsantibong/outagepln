import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Gauge, Factory } from 'lucide-react';
import {
    OutageDailyTable,
    OutageSCurve,
} from '@/components/outage-detail';
import type { DailyProgress } from '@/components/outage-detail';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { formatDMY } from '@/lib/outage-progress';

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
                            per hari, lengkap dengan status tiap harinya
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OutageSCurve
                            rows={dailyProgresses}
                            overallPlan={overallPlan}
                            overallActual={overallActual}
                        />
                    </CardContent>
                </Card>

                {/* Riwayat Progress Harian - tertutup secara default */}
                <OutageDailyTable rows={dailyProgresses} />
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
