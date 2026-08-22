import { Head, router, Link, usePage } from '@inertiajs/react';
import { Search, Filter, History, Pencil, Lock } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Meeting = {
    id: number;
    judul: string;
    tipe_rapat: string | null;
    tanggal: string;
    tanggal_realisasi?: string | null;
    waktu_mulai: string | null;
    lokasi: string | null;
    status: 'draft' | 'active' | 'completed' | 'berlangsung';
    link_meeting: string | null;
    attendees_count: number;
};

type OutagePlan = {
    id: number;
    mesin_pembangkit: string;
    scope: string | null;
    jenis_pembangkit: string | null;
    sistem: string | null;
    merek: string | null;
    start_date: string | null;
    selesai: string | null;
    /** Jumlah revisi (RENC tidak dihitung), dikirim sebagai withCount. */
    jumlah_revisi?: number;
    daily_meetings?: Meeting[];
};

/** Kolom tanggal rapat, urut seperti kolomnya di layar. */
const KOLOM_RAPAT = [
    { kolom: 'rapat_r2', tipe: 'RAPAT R2', label: 'R2' },
    { kolom: 'rapat_r3', tipe: 'RAPAT R3', label: 'R3' },
    { kolom: 'rapat_p1', tipe: 'RAPAT P1', label: 'P1' },
    { kolom: 'rapat_p2', tipe: 'RAPAT P2', label: 'P2' },
    { kolom: 'rapat_p3', tipe: 'RAPAT P3', label: 'P3' },
] as const;

/**
 * Tanggal ditampilkan dari bagian YYYY-MM-DD saja lalu dirakit sebagai tanggal
 * lokal. Kalau string ISO-nya diserahkan langsung ke `new Date`, zona waktu
 * WITA menggesernya satu hari.
 */
const formatTanggal = (nilai?: string | null) => {
    const ymd = (nilai ?? '').slice(0, 10);
    const [y, b, h] = ymd.split('-').map(Number);

    if (!y || !b || !h) {
        return '–';
    }

    return new Date(y, b - 1, h).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    });
};

/** Label kolom pada kepala tabel bertingkat. */
function KepalaGrup({
    children,
    colSpan,
    className = '',
}: {
    children: React.ReactNode;
    colSpan: number;
    className?: string;
}) {
    return (
        <th
            colSpan={colSpan}
            className={`border-b border-l px-3 py-1.5 text-center text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase ${className}`}
        >
            {children}
        </th>
    );
}

export default function DailyMeetingsIndex({
    outagePlans,
    filters,
    filterOptions,
    offsetRapat,
    maksRevisi = 3,
    ringkasan,
}: {
    outagePlans: any; // Paginated data
    filters: {
        search?: string;
        tahun?: string;
        unit?: string;
        scope?: string;
        jenis_rapat?: string;
    };
    filterOptions: {
        tahun: string[];
        unit: string[];
        scope: string[];
        jenis_rapat: string[];
    };
    offsetRapat: Record<string, number>;
    maksRevisi?: number;
    ringkasan: {
        mesin: number;
        rapatSelesai: number;
        rapatTerjadwal: number;
        direvisi: number;
        terkunci: number;
    };
}) {
    const { auth } = usePage<any>().props;
    const bolehEdit = auth?.can?.write ?? false;

    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = (key: string, value: string) => {
        const newFilters = { ...filters, search, [key]: value };

        router.get('/daily-meetings', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters('search', search);
    };

    /**
     * Jatah revisi sebuah rencana. RENC bukan revisi, jadi tidak ikut dihitung —
     * sama seperti [OutagePlan::jumlahRevisi()] di server.
     */
    const jatahRevisi = (plan: OutagePlan) => {
        const terpakai = plan.jumlah_revisi ?? 0;

        return {
            terpakai,
            label: terpakai === 0 ? 'RENC' : `REV ${terpakai}`,
            habis: terpakai >= maksRevisi,
        };
    };

    /**
     * Satu sel jadwal rapat.
     *
     * Statusnya diwarnai pada selnya sendiri, bukan lewat kartu bertumpuk, agar
     * satu baris berisi lima rapat tetap terbaca sebagai satu deret tanggal.
     */
    const renderMeetingCell = (plan: OutagePlan, tipe: string) => {
        const meeting = plan.daily_meetings?.find((m) => m.tipe_rapat === tipe);

        if (!meeting) {
            return (
                <td className="border-l px-2 py-2 text-center align-middle">
                    <span className="text-xs text-muted-foreground/40">
                        belum dijadwalkan
                    </span>
                </td>
            );
        }

        const selesai = meeting.status === 'completed';
        const digeser = !!meeting.tanggal_realisasi;

        return (
            <td
                className={`border-l p-0 align-middle ${
                    selesai ? 'bg-emerald-500/[0.07]' : ''
                }`}
            >
                <Link
                    href={`/daily-meetings/${meeting.id}`}
                    title={`Buka ${meeting.judul}`}
                    className="flex h-full flex-col items-center justify-center gap-1 px-2 py-2 transition-colors hover:bg-primary/[0.07] focus:bg-primary/[0.07] focus:outline-none"
                >
                    {digeser && (
                        <span className="font-mono text-[11px] text-muted-foreground/60 line-through">
                            {formatTanggal(meeting.tanggal)}
                        </span>
                    )}
                    <span
                        className={`font-mono text-xs font-semibold whitespace-nowrap ${
                            digeser
                                ? 'text-amber-700 dark:text-amber-500'
                                : 'text-foreground'
                        }`}
                    >
                        {formatTanggal(meeting.tanggal_realisasi ?? meeting.tanggal)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                selesai ? 'bg-emerald-600' : 'bg-muted-foreground/50'
                            }`}
                        />
                        <span
                            className={`text-[11px] font-medium ${
                                selesai
                                    ? 'text-emerald-700 dark:text-emerald-500'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {selesai ? 'Selesai' : 'Terjadwal'}
                        </span>
                    </span>
                </Link>
            </td>
        );
    };

    return (
        <>
            <Head title="Rapat Outage" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                        Rapat Outage
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Jadwal rapat R2, R3, P1, P2, dan P3 tiap mesin — dihitung
                        mundur dari rencana start
                    </p>
                </div>

                {/* Ringkasan — dihitung dari seluruh hasil filter, bukan halaman ini saja */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Mesin
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {ringkasan.mesin}
                        </p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-emerald-500 bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Rapat Selesai
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {ringkasan.rapatSelesai}
                        </p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Rapat Terjadwal
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {ringkasan.rapatTerjadwal}
                        </p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-amber-500 bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <History className="h-3 w-3" />
                            Pernah Direvisi
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {ringkasan.direvisi}
                        </p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-rose-500 bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <Lock className="h-3 w-3" />
                            Revisi Habis
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {ringkasan.terkunci}
                        </p>
                    </div>
                </div>

                <Card className="flex flex-1 flex-col overflow-hidden rounded-md border-sidebar-border/60 py-0 shadow-sm">
                    {/* Filter */}
                    <div className="flex flex-col justify-between gap-3 border-b bg-muted/50 px-4 py-3 xl:flex-row xl:items-end">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="mb-1.5 flex items-center gap-2 border-r pr-3">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Filter
                                </span>
                            </div>

                            {(
                                [
                                    ['tahun', 'Tahun', filterOptions.tahun, 'semua', 'w-[104px]'],
                                    ['unit', 'Unit', filterOptions.unit, 'Semua', 'w-[150px]'],
                                    ['scope', 'Scope', filterOptions.scope, 'Semua', 'w-[150px]'],
                                    [
                                        'jenis_rapat',
                                        'Jenis Rapat',
                                        filterOptions.jenis_rapat,
                                        'Semua',
                                        'w-[130px]',
                                    ],
                                ] as [string, string, string[], string, string][]
                            ).map(([key, label, opsi, bawaan, lebar]) => (
                                <div key={key} className="flex flex-col items-start gap-1">
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        {label}
                                    </span>
                                    <Select
                                        value={
                                            (filters[key as keyof typeof filters] as string) ||
                                            bawaan
                                        }
                                        onValueChange={(val) => applyFilters(key, val)}
                                    >
                                        <SelectTrigger
                                            className={`h-8 rounded-sm bg-background text-xs ${lebar}`}
                                        >
                                            <SelectValue placeholder={label} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {opsi.map((o) => (
                                                <SelectItem key={o} value={o} className="text-xs">
                                                    {o === 'semua' ? 'Semua' : o}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                            <Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari mesin, scope..."
                                className="h-8 rounded-sm bg-background pl-8 text-xs"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>

                    {/* Keterangan simbol */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b bg-muted/25 px-4 py-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Rapat sudah selesai
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                            Terjadwal, belum dilaksanakan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="font-mono text-muted-foreground/60 line-through">
                                07 Jan 26
                            </span>
                            tanggal rencana yang digeser ke realisasi
                        </span>
                        <span className="ml-auto">
                            Tombol Revisi membuka halaman revisi beserta riwayat versinya
                        </span>
                    </div>

                    {/* Tabel */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full min-w-[1080px] border-collapse">
                            <thead>
                                {/* Kepala bertingkat: rencana pekerjaan dipisahkan dari jadwal rapatnya */}
                                <tr className="bg-muted">
                                    <th
                                        rowSpan={2}
                                        className="w-[42px] border-b px-2 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                                    >
                                        No
                                    </th>
                                    <th
                                        rowSpan={2}
                                        className="w-[230px] border-b px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                                    >
                                        Mesin &amp; Scope
                                    </th>
                                    <KepalaGrup colSpan={2}>Rencana Outage</KepalaGrup>
                                    <KepalaGrup colSpan={5} className="bg-primary/[0.06]">
                                        Jadwal Rapat Pra-Outage
                                    </KepalaGrup>
                                    <th
                                        rowSpan={2}
                                        className="w-[74px] border-b border-l px-2 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                                    >
                                        Aksi
                                    </th>
                                </tr>
                                <tr className="bg-muted">
                                    <th className="w-[92px] border-b border-l px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                        Start
                                    </th>
                                    <th className="w-[92px] border-b border-l px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                        Finish
                                    </th>
                                    {KOLOM_RAPAT.map((r) => (
                                        <th
                                            key={r.kolom}
                                            className="w-[110px] border-b border-l bg-primary/[0.06] px-2 py-1.5 text-center"
                                        >
                                            <span className="block text-xs font-bold text-foreground">
                                                {r.label}
                                            </span>
                                            <span className="block text-[10px] font-normal text-muted-foreground">
                                                H&minus;{offsetRapat[r.kolom] ?? 0}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {outagePlans.data.length > 0 ? (
                                    outagePlans.data.map(
                                        (plan: OutagePlan, index: number) => {
                                            const jatah = jatahRevisi(plan);

                                            return (
                                                <tr
                                                    key={plan.id}
                                                    className={`border-b transition-colors hover:bg-muted/40 ${
                                                        index % 2 === 1 ? 'bg-muted/20' : ''
                                                    }`}
                                                >
                                                    <td className="px-2 py-2 text-center align-middle font-mono text-xs text-muted-foreground">
                                                        {outagePlans.from + index}
                                                    </td>

                                                    <td className="px-3 py-2 align-middle">
                                                        <span className="block text-[13px] leading-tight font-semibold text-foreground">
                                                            {plan.mesin_pembangkit}
                                                        </span>
                                                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                                            <span className="inline-flex items-center rounded border bg-background px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                                                {plan.scope || 'tanpa scope'}
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                                                    jatah.habis
                                                                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                                                        : jatah.terpakai > 0
                                                                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-500'
                                                                          : 'bg-muted-foreground/10 text-muted-foreground'
                                                                }`}
                                                            >
                                                                <History className="h-3 w-3" />
                                                                {jatah.label}
                                                            </span>
                                                            <span
                                                                className={`text-[10px] font-medium ${
                                                                    jatah.habis
                                                                        ? 'text-rose-700 dark:text-rose-400'
                                                                        : 'text-muted-foreground'
                                                                }`}
                                                            >
                                                                {jatah.terpakai}/{maksRevisi} revisi
                                                            </span>
                                                        </span>
                                                    </td>

                                                    <td className="border-l px-3 py-2 align-middle font-mono text-xs font-semibold whitespace-nowrap">
                                                        {formatTanggal(plan.start_date)}
                                                    </td>
                                                    <td className="border-l px-3 py-2 align-middle font-mono text-xs font-semibold whitespace-nowrap">
                                                        {formatTanggal(plan.selesai)}
                                                    </td>

                                                    {KOLOM_RAPAT.map((r) => (
                                                        <Fragment key={r.kolom}>
                                                            {renderMeetingCell(plan, r.tipe)}
                                                        </Fragment>
                                                    ))}

                                                    <td className="border-l px-2 py-2 text-center align-middle">
                                                        {bolehEdit && (
                                                            <Button
                                                                asChild
                                                                variant={
                                                                    jatah.habis ? 'ghost' : 'outline'
                                                                }
                                                                size="sm"
                                                                className={`h-7 gap-1 px-2 text-[11px] ${
                                                                    jatah.habis
                                                                        ? 'text-rose-700 dark:text-rose-400'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <Link
                                                                    href={`/daily-meetings/rencana/${plan.id}/revisi`}
                                                                    title={
                                                                        jatah.habis
                                                                            ? `Batas ${maksRevisi} revisi tercapai — buka untuk melihat riwayatnya`
                                                                            : 'Buka halaman revisi rencana'
                                                                    }
                                                                >
                                                                    {jatah.habis ? (
                                                                        <>
                                                                            <Lock className="h-3 w-3" />
                                                                            Terkunci
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Pencil className="h-3 w-3" />
                                                                            Revisi
                                                                        </>
                                                                    )}
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="h-32 text-center text-sm text-muted-foreground"
                                        >
                                            Tidak ada data rapat yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
                        <div>
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">
                                {outagePlans.from ?? 0}
                            </span>
                            {' – '}
                            <span className="font-semibold text-foreground">
                                {outagePlans.to ?? 0}
                            </span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">
                                {outagePlans.total}
                            </span>{' '}
                            mesin
                        </div>
                        <div className="flex items-center gap-1.5">
                            {outagePlans.links.map((link: any, idx: number) => {
                                const isPrev = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');
                                let label = link.label;

                                if (isPrev) {
                                    label = 'Prev';
                                }

                                if (isNext) {
                                    label = 'Next';
                                }

                                return (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className={`h-7 px-2.5 text-[11px] ${link.active ? 'font-bold' : 'text-muted-foreground'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(
                                                    link.url,
                                                    {},
                                                    { preserveScroll: true },
                                                );
                                            }
                                        }}
                                    >
                                        {label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

DailyMeetingsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Rapat Outage',
            href: '/daily-meetings',
        },
    ],
};
