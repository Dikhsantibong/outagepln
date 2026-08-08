import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarClock,
    ChevronDown,
    ChevronRight,
    Plus,
    Save,
    Sparkles,
    X,
} from 'lucide-react';
import type { FormEventHandler, KeyboardEvent } from 'react';
import { useMemo, useState } from 'react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    buildDailyRows,
    buildProgressDates,
    computeStatus,
    countExtraDays,
    formatDMY,
    getLatestActualProgress,
    statusBadgeClass,
    validateDailyProgress,
} from '@/lib/outage-progress';
import type { DailyProgressRow } from '@/lib/outage-progress';

const SCOPES = [
    'FINAL STAGE', 'SECOND STAGE', '2ND STAGE', 'TO', 'MO', 'SO', 'AI', 'GI',
    'PMS 20 K', 'PMS 24 K', 'PMS 32K', 'PMS 40K',
];

const JENIS = ['PLTD', 'PLTMG', 'PLTM'];

type OutagePlan = {
    id: number;
    mesin_pembangkit: string | null;
    scope: string | null;
    jenis_pembangkit: string | null;
    durasi: number | null;
    start_date: string | null;
    selesai: string | null;
    progress: number | null;
    rapat_r2: string | null;
    rapat_r3: string | null;
    rapat_p1: string | null;
    rapat_p2: string | null;
    rapat_p3: string | null;
    ket: string | null;
    sistem: string | null;
    real_start: string | null;
    real_stop: string | null;
    ket_realisasi: string | null;
    daily_progresses: {
        tanggal: string;
        plan_progress: number | null;
        actual_progress: number | null;
        keterangan: string | null;
    }[];
};

/**
 * Textarea yang tingginya mengikuti isi.
 *
 * Uraian pekerjaan panjangnya tidak menentu — satu kalimat atau satu paragraf —
 * jadi tingginya dihitung ulang tiap perubahan, dengan batas atas supaya satu
 * baris yang panjang tidak mendorong seluruh tabel.
 */
function AutoTextarea({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const atur = (el: HTMLTextAreaElement | null) => {
        if (!el) {
            return;
        }

        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };

    return (
        <textarea
            ref={atur}
            rows={1}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
                atur(e.currentTarget);
                onChange(e.target.value);
            }}
            className="min-h-8 w-full resize-none rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
    );
}

function Field({
    label,
    htmlFor,
    children,
    hint,
}: {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
    hint?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor} className="text-xs">
                {label}
            </Label>
            {children}
            {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
    );
}

export default function OutagePlanEdit({ outagePlan }: { outagePlan: OutagePlan }) {
    const existing = outagePlan.daily_progresses ?? [];

    const { data, setData, put, processing, errors } = useForm({
        mesin_pembangkit: outagePlan.mesin_pembangkit || '',
        scope: outagePlan.scope ? outagePlan.scope.toUpperCase() : '',
        jenis_pembangkit: outagePlan.jenis_pembangkit
            ? outagePlan.jenis_pembangkit.toUpperCase()
            : '',
        durasi: outagePlan.durasi?.toString() || '',
        start_date: outagePlan.start_date || '',
        selesai: outagePlan.selesai || '',
        rapat_r2: outagePlan.rapat_r2 || '',
        rapat_r3: outagePlan.rapat_r3 || '',
        rapat_p1: outagePlan.rapat_p1 || '',
        rapat_p2: outagePlan.rapat_p2 || '',
        rapat_p3: outagePlan.rapat_p3 || '',
        ket: outagePlan.ket || '',
        sistem: outagePlan.sistem || '',
        real_start: outagePlan.real_start || '',
        real_stop: outagePlan.real_stop || '',
        ket_realisasi: outagePlan.ket_realisasi || '',
        daily_progress: buildDailyRows(
            buildProgressDates({
                realStart: outagePlan.real_start || '',
                startDate: outagePlan.start_date || '',
                selesai: outagePlan.selesai || '',
                durasi: Number(outagePlan.durasi) || 0,
                extraDays: 0,
                existing,
            }),
            existing,
        ) as DailyProgressRow[],
    });

    const [extraDays, setExtraDays] = useState(() =>
        countExtraDays({
            realStart: outagePlan.real_start || '',
            startDate: outagePlan.start_date || '',
            selesai: outagePlan.selesai || '',
            durasi: Number(outagePlan.durasi) || 0,
            existing,
        }),
    );

    // Data pekerjaan tertutup secara default supaya tabel harian langsung
    // terlihat tanpa menggulir — itu yang paling sering diisi.
    const [dataTerbuka, setDataTerbuka] = useState(false);

    const dateList = useMemo(
        () =>
            buildProgressDates({
                realStart: data.real_start,
                startDate: data.start_date,
                selesai: data.selesai,
                durasi: Number(data.durasi) || 0,
                extraDays,
                existing: data.daily_progress,
            }),
        [
            data.real_start,
            data.start_date,
            data.selesai,
            data.durasi,
            data.daily_progress,
            extraDays,
        ],
    );

    const dailyRows = useMemo(
        () => buildDailyRows(dateList, data.daily_progress),
        [dateList, data.daily_progress],
    );

    const dailyErrors = useMemo(() => validateDailyProgress(dailyRows), [dailyRows]);
    const overallActual = useMemo(() => getLatestActualProgress(dailyRows), [dailyRows]);

    const plannedDayCount = Math.max(0, dateList.length - extraDays);
    const lastRow = dailyRows[dailyRows.length - 1];
    const canReduceDays =
        extraDays > 0 &&
        Boolean(lastRow) &&
        lastRow.plan_progress === '' &&
        lastRow.actual_progress === '';

    const setRows = (rows: DailyProgressRow[]) => setData('daily_progress', rows);

    const updateDailyRow = (
        tanggal: string,
        field: keyof DailyProgressRow,
        value: string,
    ) => {
        setRows(
            dailyRows.map((row) =>
                row.tanggal === tanggal ? { ...row, [field]: value } : row,
            ),
        );
    };

    /**
     * Isi Rencana merata 0→100 sepanjang hari yang ada.
     *
     * Rencana memang diisi di muka untuk seluruh hari; mengetiknya satu per satu
     * pada outage 30 hari adalah pekerjaan yang bisa dihilangkan.
     */
    const isiRencanaMerata = () => {
        const n = dailyRows.length;

        if (n === 0) {
            return;
        }

        setRows(
            dailyRows.map((row, i) => ({
                ...row,
                plan_progress:
                    n === 1 ? '100' : String(Math.round(((i + 1) / n) * 10000) / 100),
            })),
        );
    };

    /** Salin nilai baris ini ke seluruh baris di bawahnya yang masih kosong. */
    const salinKeBawah = (
        idx: number,
        field: 'plan_progress' | 'actual_progress',
    ) => {
        const nilai = dailyRows[idx]?.[field] ?? '';

        setRows(
            dailyRows.map((row, i) =>
                i > idx && row[field] === '' ? { ...row, [field]: nilai } : row,
            ),
        );
    };

    /**
     * Enter / panah bawah memindahkan fokus ke kolom yang sama di baris
     * berikutnya, jadi pengisian harian bisa dilakukan tanpa menyentuh mouse.
     */
    const pindahFokus = (
        e: KeyboardEvent<HTMLInputElement>,
        idx: number,
        field: string,
    ) => {
        const arah = e.key === 'Enter' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;

        if (arah === 0) {
            return;
        }

        const target = document.querySelector<HTMLInputElement>(
            `[data-cell="${field}-${idx + arah}"]`,
        );

        if (target) {
            e.preventDefault();
            target.focus();
            target.select();
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (dailyErrors.length > 0) {
            return;
        }

        put(`/outage-plans/${outagePlan.id}`, { preserveScroll: true });
    };

    const hariIni = new Date().toISOString().slice(0, 10);

    return (
        <>
            <Head title={`Edit: ${outagePlan.mesin_pembangkit || 'Outage'}`} />

            <form onSubmit={submit} className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <Link
                            href="/outage-plans"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Kembali ke Daftar Outage
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight">
                            {outagePlan.mesin_pembangkit || 'Edit Jadwal Outage'}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {data.scope || '-'} &middot; {data.jenis_pembangkit || '-'}{' '}
                            &middot; {data.sistem || '-'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2">
                        <div className="text-right">
                            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                Progres
                            </p>
                            <p className="text-xl leading-none font-bold">
                                {Number(overallActual.toFixed(2))}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data pekerjaan - tertutup secara default */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <CardTitle className="text-base">Data Pekerjaan</CardTitle>
                                <CardDescription>
                                    Jadwal, rapat, dan realisasi &middot; Real Start{' '}
                                    {data.real_start ? formatDMY(data.real_start) : 'belum diisi'}
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() => setDataTerbuka((v) => !v)}
                            >
                                {dataTerbuka ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                )}
                                {dataTerbuka ? 'Sembunyikan' : 'Ubah data pekerjaan'}
                            </Button>
                        </div>
                    </CardHeader>

                    {dataTerbuka && (
                        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                            <Field label="Mesin Pembangkit" htmlFor="mesin_pembangkit">
                                <Input
                                    id="mesin_pembangkit"
                                    value={data.mesin_pembangkit}
                                    onChange={(e) =>
                                        setData('mesin_pembangkit', e.target.value)
                                    }
                                />
                            </Field>

                            <Field label="Scope">
                                <Select
                                    value={data.scope}
                                    onValueChange={(v) => setData('scope', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SCOPES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field label="Jenis">
                                <Select
                                    value={data.jenis_pembangkit}
                                    onValueChange={(v) => setData('jenis_pembangkit', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JENIS.map((j) => (
                                            <SelectItem key={j} value={j}>
                                                {j}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field label="Sistem" htmlFor="sistem">
                                <Input
                                    id="sistem"
                                    placeholder="cth: RAHA, BAUBAU"
                                    value={data.sistem}
                                    onChange={(e) => setData('sistem', e.target.value)}
                                />
                            </Field>

                            <Field
                                label="Durasi (Hari)"
                                htmlFor="durasi"
                                hint="Menentukan jumlah baris progress harian."
                            >
                                <Input
                                    id="durasi"
                                    type="number"
                                    min={0}
                                    value={data.durasi}
                                    onChange={(e) => setData('durasi', e.target.value)}
                                />
                            </Field>

                            <Field label="Mulai (Rencana)" htmlFor="start_date">
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                />
                            </Field>

                            <Field label="Selesai (Rencana)" htmlFor="selesai">
                                <Input
                                    id="selesai"
                                    type="date"
                                    value={data.selesai}
                                    onChange={(e) => setData('selesai', e.target.value)}
                                />
                            </Field>

                            <Field label="Keterangan" htmlFor="ket">
                                <Input
                                    id="ket"
                                    value={data.ket}
                                    onChange={(e) => setData('ket', e.target.value)}
                                />
                            </Field>

                            <Field
                                label="Real Start"
                                htmlFor="real_start"
                                hint="Acuan hari pertama progress harian."
                            >
                                <Input
                                    id="real_start"
                                    type="date"
                                    value={data.real_start}
                                    onChange={(e) => setData('real_start', e.target.value)}
                                />
                            </Field>

                            <Field label="Real Stop" htmlFor="real_stop">
                                <Input
                                    id="real_stop"
                                    type="date"
                                    value={data.real_stop}
                                    onChange={(e) => setData('real_stop', e.target.value)}
                                />
                            </Field>

                            <Field label="Ket. Realisasi" htmlFor="ket_realisasi">
                                <Input
                                    id="ket_realisasi"
                                    placeholder="cth: Selesai"
                                    value={data.ket_realisasi}
                                    onChange={(e) =>
                                        setData('ket_realisasi', e.target.value)
                                    }
                                />
                            </Field>

                            <div className="md:col-span-3 lg:col-span-4">
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    Jadwal Rapat
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                    {(
                                        [
                                            ['rapat_r2', 'R2'],
                                            ['rapat_r3', 'R3'],
                                            ['rapat_p1', 'P1'],
                                            ['rapat_p2', 'P2'],
                                            ['rapat_p3', 'P3'],
                                        ] as const
                                    ).map(([key, label]) => (
                                        <Field key={key} label={`Rapat ${label}`} htmlFor={key}>
                                            <Input
                                                id={key}
                                                type="date"
                                                value={data[key]}
                                                onChange={(e) => setData(key, e.target.value)}
                                            />
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Progress harian */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <CardTitle className="text-base">Progress Harian</CardTitle>
                                <CardDescription>
                                    {dateList.length} hari
                                    {extraDays > 0 && ` (+${extraDays} tambahan)`}
                                    {' · '}
                                    {data.real_start
                                        ? `dihitung dari Real Start ${formatDMY(data.real_start)}`
                                        : 'Real Start belum diisi, sementara dari Waktu Mulai'}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                    onClick={isiRencanaMerata}
                                    disabled={dailyRows.length === 0}
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Isi Rencana Merata
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                    onClick={() => setExtraDays((n) => n + 1)}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Tambah Hari
                                </Button>
                                {canReduceDays && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                                        onClick={() =>
                                            setExtraDays((n) => Math.max(0, n - 1))
                                        }
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Kurangi
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {dateList.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground italic">
                                Isi <strong>Real Start</strong> dan <strong>Durasi</strong>{' '}
                                pada Data Pekerjaan untuk membuat daftar hari.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="whitespace-nowrap">
                                    {/* Header menempel saat halaman digulir, jadi kolomnya
                                        tetap terbaca pada outage yang panjang. */}
                                    <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
                                        <TableRow className="bg-muted/40">
                                            <TableHead className="w-20 px-3 text-center font-bold">
                                                Day
                                            </TableHead>
                                            <TableHead className="w-28 px-3 text-center font-bold">
                                                Tanggal
                                            </TableHead>
                                            <TableHead className="w-40 px-3 text-center font-bold">
                                                Plan (%)
                                            </TableHead>
                                            <TableHead className="w-40 px-3 text-center font-bold">
                                                Actual (%)
                                            </TableHead>
                                            <TableHead className="w-28 px-3 text-center font-bold">
                                                Status
                                            </TableHead>
                                            <TableHead className="min-w-[150px] px-3 font-bold">
                                                Part Number
                                            </TableHead>
                                            <TableHead className="min-w-[200px] px-3 font-bold">
                                                Nama Material
                                            </TableHead>
                                            <TableHead className="min-w-[280px] px-3 font-bold">
                                                Uraian Pekerjaan
                                            </TableHead>
                                            <TableHead className="min-w-[200px] px-3 font-bold">
                                                Keterangan
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dailyRows.map((row, idx) => {
                                            const status = computeStatus(
                                                row.plan_progress,
                                                row.actual_progress,
                                            );
                                            const rowHasError = dailyErrors.some(
                                                (err) => err.tanggal === row.tanggal,
                                            );
                                            const isHariIni = row.tanggal === hariIni;

                                            return (
                                                <TableRow
                                                    key={row.tanggal}
                                                    className={
                                                        rowHasError
                                                            ? 'bg-destructive/5'
                                                            : isHariIni
                                                              ? 'bg-primary/5'
                                                              : ''
                                                    }
                                                >
                                                    <TableCell className="px-3 text-center font-mono text-xs">
                                                        Day {idx + 1}
                                                        {idx >= plannedDayCount && (
                                                            <span
                                                                className="ml-1 rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                                                title="Hari tambahan di luar durasi rencana"
                                                            >
                                                                +
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-3 text-center font-mono text-xs text-muted-foreground">
                                                        {formatDMY(row.tanggal)}
                                                        {isHariIni && (
                                                            <span className="ml-1 rounded bg-primary/15 px-1 text-[9px] font-bold text-primary">
                                                                HARI INI
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {(
                                                        [
                                                            ['plan_progress', 'plan'],
                                                            ['actual_progress', 'actual'],
                                                        ] as const
                                                    ).map(([field, cell]) => (
                                                        <TableCell key={field} className="px-3">
                                                            <div className="flex items-center gap-1">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={100}
                                                                    step="0.01"
                                                                    data-cell={`${cell}-${idx}`}
                                                                    className="h-8 text-center text-xs"
                                                                    value={row[field]}
                                                                    onChange={(e) =>
                                                                        updateDailyRow(
                                                                            row.tanggal,
                                                                            field,
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    onKeyDown={(e) =>
                                                                        pindahFokus(e, idx, cell)
                                                                    }
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 shrink-0 p-0 text-[10px] text-muted-foreground"
                                                                    title="Salin ke baris kosong di bawahnya"
                                                                    onClick={() =>
                                                                        salinKeBawah(idx, field)
                                                                    }
                                                                >
                                                                    &darr;
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    ))}

                                                    <TableCell className="px-3 text-center">
                                                        <span
                                                            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold whitespace-nowrap uppercase ${statusBadgeClass(status)}`}
                                                        >
                                                            {status}
                                                        </span>
                                                    </TableCell>
                                                    {/* Material masih diketik manual; nanti dipilih
                                                        dari data master. */}
                                                    <TableCell className="px-3">
                                                        <Input
                                                            type="text"
                                                            className="h-8 font-mono text-xs"
                                                            placeholder="cth: 1234-5678"
                                                            value={row.material_part_number}
                                                            onChange={(e) =>
                                                                updateDailyRow(
                                                                    row.tanggal,
                                                                    'material_part_number',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-3">
                                                        <Input
                                                            type="text"
                                                            className="h-8 text-xs"
                                                            placeholder="cth: Gasket cylinder head"
                                                            value={row.material_nama}
                                                            onChange={(e) =>
                                                                updateDailyRow(
                                                                    row.tanggal,
                                                                    'material_nama',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-3">
                                                        <AutoTextarea
                                                            placeholder="Uraian pekerjaan hari ini..."
                                                            value={row.uraian_pekerjaan}
                                                            onChange={(v) =>
                                                                updateDailyRow(
                                                                    row.tanggal,
                                                                    'uraian_pekerjaan',
                                                                    v,
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-3">
                                                        <AutoTextarea
                                                            placeholder="Catatan..."
                                                            value={row.keterangan}
                                                            onChange={(v) =>
                                                                updateDailyRow(
                                                                    row.tanggal,
                                                                    'keterangan',
                                                                    v,
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bilah simpan menempel di bawah, jadi tidak perlu menggulir
                    sampai ujung tabel hanya untuk menyimpan. */}
                <div className="sticky bottom-0 z-30 -mx-4 mt-auto border-t bg-background/95 px-4 py-3 backdrop-blur">
                    {dailyErrors.length > 0 && (
                        <div className="mb-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Perbaiki {dailyErrors.length} input progress harian:
                            </p>
                            <ul className="mt-1 max-h-20 overflow-y-auto text-[11px] text-destructive">
                                {dailyErrors.slice(0, 5).map((err, i) => (
                                    <li key={i}>{err.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {Object.keys(errors).length > 0 && (
                        <p className="mb-2 text-xs text-destructive">
                            {Object.values(errors).join(' ')}
                        </p>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                            Progres tersimpan otomatis dari Actual tertinggi:{' '}
                            <strong>{Number(overallActual.toFixed(2))}%</strong>
                        </p>
                        <div className="flex gap-2">
                            <Link href="/outage-plans">
                                <Button type="button" variant="outline">
                                    Batal
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing || dailyErrors.length > 0}
                                className="gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

OutagePlanEdit.layout = {
    breadcrumbs: [
        { title: 'Perencanaan dan Jadwal Outage', href: '/outage-plans' },
        { title: 'Edit Jadwal', href: '#' },
    ],
};
