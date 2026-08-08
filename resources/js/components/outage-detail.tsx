import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    CartesianGrid,
    LabelList,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
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
import { formatDMY, statusBadgeClass } from '@/lib/outage-progress';
import type { ProgressStatus } from '@/lib/outage-progress';

export type DailyProgress = {
    id?: number;
    tanggal: string;
    /** null = hari tersebut belum diisi. */
    plan_progress: number | null;
    actual_progress: number | null;
    material_part_number?: string | null;
    material_nama?: string | null;
    uraian_pekerjaan?: string | null;
    keterangan: string | null;
    status: ProgressStatus;
};

const WARNA_PLAN = '#4472C4';
const WARNA_ACTUAL = '#C00000';

/** Warna titik realisasi mengikuti statusnya, sesuai badge di tabel. */
const WARNA_STATUS: Record<string, string> = {
    Leading: '#059669',
    'On Progres': '#2563eb',
    Lagging: '#dc2626',
    '-': '#94a3b8',
};

/** Format desimal Indonesia, mengikuti kurva S acuan (mis. 78,18). */
export const fmtPct = (v: number | string) =>
    Number(v).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

type ChartRow = {
    label: string;
    tanggal: string;
    status: ProgressStatus;
    RENCANA: number | null;
    REALISASI: number | null;
};

/** Titik realisasi diwarnai menurut status hari itu. */
function TitikStatus(props: {
    cx?: number;
    cy?: number;
    payload?: ChartRow;
}) {
    const { cx, cy, payload } = props;

    if (cx === undefined || cy === undefined || payload?.REALISASI === null) {
        return null;
    }

    return (
        <circle
            cx={cx}
            cy={cy}
            r={4}
            fill={WARNA_STATUS[payload?.status ?? '-'] ?? WARNA_ACTUAL}
            stroke="#fff"
            strokeWidth={1}
        />
    );
}

function TooltipKurva({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { payload: ChartRow }[];
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const row = payload[0].payload;

    return (
        <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
            <p className="mb-1 font-mono font-semibold">{formatDMY(row.tanggal)}</p>
            <p style={{ color: WARNA_PLAN }}>
                Rencana : {row.RENCANA === null ? '-' : `${fmtPct(row.RENCANA)} %`}
            </p>
            <p style={{ color: WARNA_ACTUAL }}>
                Realisasi : {row.REALISASI === null ? '-' : `${fmtPct(row.REALISASI)} %`}
            </p>
            <p className="mt-1.5">
                <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(row.status)}`}
                >
                    {row.status}
                </span>
            </p>
        </div>
    );
}

/**
 * Kurva S beserta statusnya.
 *
 * Status ditampilkan di dalam kurva — lewat warna titik realisasi, ringkasan
 * jumlah hari per status, dan tooltip tiap titik — sehingga tabel harian tidak
 * perlu dibuka untuk mengetahui hari mana yang tertinggal.
 */
export function OutageSCurve({
    rows,
    overallPlan,
    overallActual,
    height = 520,
}: {
    rows: DailyProgress[];
    overallPlan: number | null;
    overallActual: number | null;
    height?: number;
}) {
    const chartData: ChartRow[] = useMemo(
        () =>
            rows.map((row) => ({
                // formatDMY memberi DD-MM-YYYY; kurva acuan memakai DD/MM/YY.
                label: formatDMY(row.tanggal).replace(
                    /^(\d{2})-(\d{2})-\d{2}(\d{2})$/,
                    '$1/$2/$3',
                ),
                tanggal: row.tanggal,
                status: row.status,
                // Hari yang belum diisi dibiarkan null agar garis berhenti di
                // titik terakhir, bukan terjun ke 0.
                RENCANA: row.plan_progress === null ? null : Number(row.plan_progress),
                REALISASI:
                    row.actual_progress === null ? null : Number(row.actual_progress),
            })),
        [rows],
    );

    const jumlahStatus = useMemo(() => {
        const hitung: Record<string, number> = {};

        rows.forEach((r) => {
            if (r.status && r.status !== '-') {
                hitung[r.status] = (hitung[r.status] ?? 0) + 1;
            }
        });

        return hitung;
    }, [rows]);

    return (
        <>
            <div className="mb-2 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <div className="flex gap-2">
                    <span className="w-20" style={{ color: WARNA_PLAN }}>
                        Rencana
                    </span>
                    <span className="font-semibold" style={{ color: WARNA_PLAN }}>
                        : {fmtPct(overallPlan ?? 0)} %
                    </span>
                </div>
                <div className="flex gap-2">
                    <span className="w-20" style={{ color: WARNA_ACTUAL }}>
                        Realisasi
                    </span>
                    <span className="font-semibold" style={{ color: WARNA_ACTUAL }}>
                        : {fmtPct(overallActual ?? 0)} %
                    </span>
                </div>

                {/* Rekap status, warnanya sama dengan titik di kurva. */}
                <div className="flex flex-wrap items-center gap-2">
                    {(['Leading', 'On Progres', 'Lagging'] as const).map((s) => (
                        <span
                            key={s}
                            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(s)}`}
                        >
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: WARNA_STATUS[s] }}
                            />
                            {s} {jumlahStatus[s] ?? 0} hari
                        </span>
                    ))}
                </div>
            </div>

            <div className="w-full" style={{ height }}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 28, right: 26, left: 4, bottom: 68 }}
                        >
                            <CartesianGrid vertical={false} stroke="#9BBB59" opacity={0.55} />
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
                            <Tooltip content={<TooltipKurva />} />
                            <Legend
                                verticalAlign="top"
                                height={30}
                                wrapperStyle={{ fontSize: '12px' }}
                            />
                            <Line
                                type="linear"
                                dataKey="RENCANA"
                                stroke={WARNA_PLAN}
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: WARNA_PLAN }}
                            >
                                <LabelList
                                    dataKey="RENCANA"
                                    position="bottom"
                                    offset={8}
                                    fontSize={9}
                                    fill={WARNA_PLAN}
                                    formatter={(v: unknown) => fmtPct(v as number)}
                                />
                            </Line>
                            <Line
                                type="linear"
                                dataKey="REALISASI"
                                stroke={WARNA_ACTUAL}
                                strokeWidth={2.5}
                                dot={<TitikStatus />}
                            >
                                <LabelList
                                    dataKey="REALISASI"
                                    position="top"
                                    offset={8}
                                    fontSize={9}
                                    fill={WARNA_ACTUAL}
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
        </>
    );
}

/**
 * Riwayat progress harian.
 *
 * Tertutup secara default: statusnya sudah terbaca dari kurva S, dan tabel
 * puluhan baris ini mendorong seluruh isi halaman lain jauh ke bawah.
 */
export function OutageDailyTable({ rows }: { rows: DailyProgress[] }) {
    const [terbuka, setTerbuka] = useState(false);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle>Riwayat Progress Harian</CardTitle>
                        <CardDescription>
                            {rows.length} hari tercatat &middot; rinciannya disembunyikan
                            karena statusnya sudah tampil di kurva S
                        </CardDescription>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => setTerbuka((v) => !v)}
                    >
                        {terbuka ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        {terbuka ? 'Sembunyikan' : 'Tampilkan'} rincian
                    </Button>
                </div>
            </CardHeader>
            {terbuka && (
                <CardContent className="overflow-x-auto p-0">
                    {/* Tanpa whitespace-nowrap: kolom uraian harus boleh membungkus. */}
                    <Table className="align-top">
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
                                <TableHead className="min-w-[130px] px-4 font-bold">
                                    Part Number
                                </TableHead>
                                <TableHead className="min-w-[180px] px-4 font-bold">
                                    Nama Material
                                </TableHead>
                                <TableHead className="min-w-[260px] px-4 font-bold">
                                    Uraian Pekerjaan
                                </TableHead>
                                <TableHead className="min-w-[180px] px-4 font-bold">
                                    Keterangan
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length > 0 ? (
                                rows.map((row, idx) => (
                                    <TableRow key={row.id ?? row.tanggal} className="hover:bg-muted/30">
                                        <TableCell className="px-4 text-center font-mono text-xs whitespace-nowrap text-muted-foreground">
                                            Day {idx + 1}
                                        </TableCell>
                                        <TableCell className="px-4 text-center font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                                            {formatDMY(row.tanggal)}
                                        </TableCell>
                                        <TableCell className="px-4 text-center text-xs font-semibold">
                                            {row.plan_progress === null
                                                ? '-'
                                                : `${row.plan_progress}%`}
                                        </TableCell>
                                        <TableCell className="px-4 text-center text-xs font-semibold">
                                            {row.actual_progress === null
                                                ? '-'
                                                : `${row.actual_progress}%`}
                                        </TableCell>
                                        <TableCell className="px-4 text-center">
                                            <span
                                                className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold whitespace-nowrap uppercase ${statusBadgeClass(row.status)}`}
                                            >
                                                {row.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 font-mono text-[11px] text-muted-foreground">
                                            {row.material_part_number || '-'}
                                        </TableCell>
                                        <TableCell className="px-4 text-xs">
                                            {row.material_nama || '-'}
                                        </TableCell>
                                        {/* Uraian bisa panjang: dibiarkan membungkus,
                                            bukan dipotong seperti kolom lain. */}
                                        <TableCell className="px-4 text-xs whitespace-pre-line">
                                            {row.uraian_pekerjaan || '-'}
                                        </TableCell>
                                        <TableCell className="px-4 text-xs whitespace-pre-line text-muted-foreground">
                                            {row.keterangan || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Belum ada data progress harian.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            )}
        </Card>
    );
}
