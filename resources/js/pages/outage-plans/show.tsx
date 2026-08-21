import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import {
    OutageDailyTable,
    OutageSCurve,
} from '@/components/outage-detail';
import type { DailyProgress } from '@/components/outage-detail';
import {
    KOLOM_RAPAT,
    TabelRiwayatRevisi,
    tgl,
} from '@/components/outage-revisi';
import type { RevisiRencana } from '@/components/outage-revisi';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';

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
    revisions?: RevisiRencana[];
};

/** Satu baris label/nilai pada tabel informasi. */
function Baris({
    label,
    children,
    mono = false,
}: {
    label: string;
    children: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <tr className="border-b last:border-b-0">
            <th className="w-[38%] px-3 py-2 text-left align-top text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {label}
            </th>
            <td
                className={`px-3 py-2 align-top text-xs font-medium ${mono ? 'font-mono' : ''}`}
            >
                {children}
            </td>
        </tr>
    );
}

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
    const revisi = outagePlan.revisions ?? [];
    const versiBerlaku = revisi.length ? revisi[revisi.length - 1].label : 'RENC';

    return (
        <>
            <Head
                title={`Detail Outage: ${outagePlan.mesin_pembangkit || ''}`}
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <Card>
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-2">
                            <Link
                                href="/outage-plans"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Kembali ke Daftar Outage
                            </Link>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                {outagePlan.mesin_pembangkit || '-'}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    {outagePlan.jenis_pembangkit || '-'}
                                </span>
                                <span className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    {outagePlan.scope || '-'}
                                </span>
                                <span
                                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                                        outagePlan.ket === 'CLOSE'
                                            ? 'border-emerald-300 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-400'
                                            : 'border-amber-300 text-amber-700 dark:border-amber-900/60 dark:text-amber-400'
                                    }`}
                                >
                                    {outagePlan.ket || 'OPEN'}
                                </span>
                                <span className="inline-flex items-center rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                                    {versiBerlaku}
                                </span>
                            </div>
                        </div>

                        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
                            <div>
                                <dt className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Rencana
                                </dt>
                                <dd className="font-mono text-sm font-semibold whitespace-nowrap">
                                    {tgl(outagePlan.start_date)} &rarr; {tgl(outagePlan.selesai)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Total Hari
                                </dt>
                                <dd className="font-mono text-sm font-semibold">
                                    {totalHari ? `${totalHari} hari` : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Progress Plan / Aktual
                                </dt>
                                <dd className="font-mono text-sm font-semibold">
                                    {Number(overallPlan ?? 0).toFixed(0)}% / {Number(overallActual ?? 0).toFixed(0)}%
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Informasi Pekerjaan */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Informasi Pekerjaan</CardTitle>
                        <CardDescription>
                            Rencana, realisasi lapangan, dan status pekerjaan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-x-8 lg:grid-cols-2">
                        <table className="w-full border-collapse border-t">
                            <tbody>
                                <Baris label="Mesin Pembangkit">
                                    {outagePlan.mesin_pembangkit || '—'}
                                </Baris>
                                <Baris label="Scope">{outagePlan.scope || '—'}</Baris>
                                <Baris label="Jenis Pembangkit">
                                    {outagePlan.jenis_pembangkit || '—'}
                                </Baris>
                                <Baris label="Sistem">{outagePlan.sistem || '—'}</Baris>
                                <Baris label="Mulai (Rencana)" mono>
                                    {tgl(outagePlan.start_date)}
                                </Baris>
                                <Baris label="Selesai (Rencana)" mono>
                                    {tgl(outagePlan.selesai)}
                                </Baris>
                            </tbody>
                        </table>

                        <table className="w-full border-collapse lg:border-t">
                            <tbody>
                                <Baris label="Durasi Rencana" mono>
                                    {outagePlan.durasi ? `${outagePlan.durasi} hari` : '—'}
                                </Baris>
                                <Baris label="Real Start" mono>
                                    {tgl(outagePlan.real_start)}
                                </Baris>
                                <Baris label="Real Stop" mono>
                                    {tgl(outagePlan.real_stop)}
                                </Baris>
                                <Baris label="Ket. Realisasi">
                                    {outagePlan.ket_realisasi || '—'}
                                </Baris>
                                <Baris label="Status">{outagePlan.ket || 'OPEN'}</Baris>
                                <Baris label="Versi Rencana">{versiBerlaku}</Baris>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Jadwal Rapat */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Jadwal Rapat</CardTitle>
                        <CardDescription>
                            Dihitung mundur dari rencana start, ikut bergeser setiap
                            rencananya direvisi
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto border-t">
                            <table className="w-full min-w-[520px] border-collapse text-xs">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        {KOLOM_RAPAT.map((r) => (
                                            <th
                                                key={r.kolom}
                                                className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                                            >
                                                Rapat {r.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {KOLOM_RAPAT.map((r) => (
                                            <td
                                                key={r.kolom}
                                                className="px-3 py-2.5 font-mono text-xs font-semibold whitespace-nowrap"
                                            >
                                                {tgl(outagePlan[r.kolom])}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Riwayat Revisi Rencana */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Riwayat Revisi Rencana</CardTitle>
                        <CardDescription>
                            Tiap pergeseran rencana tersimpan sebagai versi tersendiri,
                            termasuk yang dilakukan dari menu Rapat Outage
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="border-t">
                            <TabelRiwayatRevisi revisions={revisi} />
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
