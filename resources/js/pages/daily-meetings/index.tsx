import { Head, router, Link, useForm, usePage } from '@inertiajs/react';
import {
    Search,
    Filter,
    CalendarClock,
    ChevronDown,
    ChevronRight,
    History,
    Pencil,
    ArrowRight,
    Lock,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type Revision = {
    id: number;
    label: string;
    urutan: number;
    start_date: string | null;
    selesai: string | null;
    rapat_r2: string | null;
    rapat_r3: string | null;
    rapat_p1: string | null;
    rapat_p2: string | null;
    rapat_p3: string | null;
    catatan: string | null;
    created_at: string | null;
    user?: { id: number; name: string } | null;
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
    rapat_r2: string | null;
    rapat_r3: string | null;
    rapat_p1: string | null;
    rapat_p2: string | null;
    rapat_p3: string | null;
    daily_meetings?: Meeting[];
    revisions?: Revision[];
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

const keYmd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Selisih hari antara dua tanggal YYYY-MM-DD. */
const selisihHari = (dari: string, ke: string) => {
    const a = new Date(`${dari.slice(0, 10)}T00:00:00`);
    const b = new Date(`${ke.slice(0, 10)}T00:00:00`);

    return Math.round((b.getTime() - a.getTime()) / 86400000);
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
    const [terbuka, setTerbuka] = useState<number[]>([]);
    const [planDiedit, setPlanDiedit] = useState<OutagePlan | null>(null);

    const revisiForm = useForm({
        start_date: '',
        selesai: '',
        catatan: '',
    });

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

    const toggleRiwayat = (id: number) => {
        setTerbuka((ids) =>
            ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
        );
    };

    /**
     * Riwayat yang ditampilkan. Rencana yang belum pernah direvisi tidak punya
     * baris di basis data, jadi nilai berjalannya ditampilkan sebagai RENC.
     */
    const riwayatPlan = (plan: OutagePlan): Revision[] => {
        if (plan.revisions?.length) {
            return plan.revisions;
        }

        return [
            {
                id: 0,
                label: 'RENC',
                urutan: 0,
                start_date: plan.start_date,
                selesai: plan.selesai,
                rapat_r2: plan.rapat_r2,
                rapat_r3: plan.rapat_r3,
                rapat_p1: plan.rapat_p1,
                rapat_p2: plan.rapat_p2,
                rapat_p3: plan.rapat_p3,
                catatan: 'Rencana awal',
                created_at: null,
                user: null,
            },
        ];
    };

    const versiBerjalan = (plan: OutagePlan) => {
        const riwayat = riwayatPlan(plan);

        return riwayat[riwayat.length - 1];
    };

    /**
     * Jatah revisi sebuah rencana. RENC bukan revisi, jadi tidak ikut dihitung —
     * sama seperti [OutagePlan::jumlahRevisi()] di server.
     */
    const jatahRevisi = (plan: OutagePlan) => {
        const terpakai = Math.max(0, riwayatPlan(plan).length - 1);

        return {
            terpakai,
            sisa: Math.max(0, maksRevisi - terpakai),
            habis: terpakai >= maksRevisi,
        };
    };

    /** Pratinjau tanggal rapat memakai rumus offset yang dikirim server. */
    const jadwalDariStart = (start: string): Record<string, string> => {
        const hasil: Record<string, string> = {};

        if (!start) {
            return hasil;
        }

        Object.entries(offsetRapat).forEach(([kolom, mundur]) => {
            const d = new Date(`${start}T00:00:00`);

            d.setDate(d.getDate() - Number(mundur));
            hasil[kolom] = keYmd(d);
        });

        return hasil;
    };

    const bukaFormRevisi = (plan: OutagePlan) => {
        setPlanDiedit(plan);
        revisiForm.clearErrors();
        revisiForm.setData({
            start_date: (plan.start_date ?? '').slice(0, 10),
            selesai: (plan.selesai ?? '').slice(0, 10),
            catatan: '',
        });
    };

    /** Menggeser start ikut menggeser finish, supaya lama pekerjaan tetap. */
    const ubahStart = (nilai: string) => {
        const lama = revisiForm.data.start_date;
        const finishLama = revisiForm.data.selesai;

        if (lama && finishLama && nilai) {
            const durasi = selisihHari(lama, finishLama);
            const baru = new Date(`${nilai}T00:00:00`);

            baru.setDate(baru.getDate() + durasi);
            revisiForm.setData({
                ...revisiForm.data,
                start_date: nilai,
                selesai: keYmd(baru),
            });

            return;
        }

        revisiForm.setData('start_date', nilai);
    };

    const simpanRevisi = (e: React.FormEvent) => {
        e.preventDefault();

        if (!planDiedit) {
            return;
        }

        revisiForm.post(`/daily-meetings/rencana/${planDiedit.id}/revisi`, {
            preserveScroll: true,
            onSuccess: () => setPlanDiedit(null),
        });
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

    const pratinjau = jadwalDariStart(revisiForm.data.start_date);

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
                        <span className="ml-auto flex items-center gap-1.5">
                            <ChevronRight className="h-3.5 w-3.5" />
                            Klik nama mesin untuk melihat riwayat revisi
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
                                        Mesin & Scope
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
                                            const riwayat = riwayatPlan(plan);
                                            const versi = versiBerjalan(plan);
                                            const dibuka = terbuka.includes(plan.id);
                                            const jatah = jatahRevisi(plan);
                                            const pernahDirevisi = jatah.terpakai > 0;

                                            return (
                                                <Fragment key={plan.id}>
                                                    <tr
                                                        className={`border-b transition-colors hover:bg-muted/40 ${
                                                            index % 2 === 1 ? 'bg-muted/20' : ''
                                                        }`}
                                                    >
                                                        <td className="px-2 py-2 text-center align-middle font-mono text-xs text-muted-foreground">
                                                            {outagePlans.from + index}
                                                        </td>

                                                        <td className="px-3 py-2 align-middle">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleRiwayat(plan.id)}
                                                                aria-expanded={dibuka}
                                                                className="flex w-full items-start gap-1.5 text-left"
                                                            >
                                                                {dibuka ? (
                                                                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                                ) : (
                                                                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                                )}
                                                                <span className="min-w-0 flex-1">
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
                                                                                    : pernahDirevisi
                                                                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-500'
                                                                                      : 'bg-muted-foreground/10 text-muted-foreground'
                                                                            }`}
                                                                        >
                                                                            <History className="h-3 w-3" />
                                                                            {versi.label}
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
                                                                </span>
                                                            </button>
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
                                                            {bolehEdit &&
                                                                (jatah.habis ? (
                                                                    <span
                                                                        title={`Batas ${maksRevisi} kali revisi sudah tercapai`}
                                                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-400"
                                                                    >
                                                                        <Lock className="h-3 w-3" />
                                                                        Terkunci
                                                                    </span>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 gap-1 px-2 text-[11px]"
                                                                        onClick={() => bukaFormRevisi(plan)}
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                        Revisi
                                                                    </Button>
                                                                ))}
                                                        </td>
                                                    </tr>

                                                    {/* Riwayat revisi: tabel sendiri dengan kepala sendiri,
                                                        supaya kolomnya tidak salah dibaca sebagai kolom di atas. */}
                                                    {dibuka && (
                                                        <tr>
                                                            <td
                                                                colSpan={10}
                                                                className="border-b bg-muted/45 p-0"
                                                            >
                                                                <div className="px-4 py-3">
                                                                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                                            <History className="h-3.5 w-3.5" />
                                                                            Riwayat Revisi Rencana
                                                                        </p>
                                                                        <span className="text-[11px] text-muted-foreground">
                                                                            — {riwayat.length} versi, terbaru yang berlaku
                                                                        </span>
                                                                        <span
                                                                            className={`ml-auto inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                                                                                jatah.habis
                                                                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                                                                    : 'bg-muted-foreground/10 text-muted-foreground'
                                                                            }`}
                                                                        >
                                                                            {jatah.habis ? (
                                                                                <>
                                                                                    <Lock className="h-3 w-3" />
                                                                                    Batas {maksRevisi} revisi tercapai
                                                                                </>
                                                                            ) : (
                                                                                `Terpakai ${jatah.terpakai} dari ${maksRevisi} — sisa ${jatah.sisa} kali`
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    <div className="overflow-x-auto rounded border bg-background">
                                                                        <table className="w-full min-w-[860px] border-collapse text-xs">
                                                                            <thead>
                                                                                <tr className="border-b bg-muted/70">
                                                                                    <th className="w-[76px] px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                        Versi
                                                                                    </th>
                                                                                    <th className="w-[86px] px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                        Start
                                                                                    </th>
                                                                                    <th className="w-[86px] px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                        Finish
                                                                                    </th>
                                                                                    {KOLOM_RAPAT.map((r) => (
                                                                                        <th
                                                                                            key={r.kolom}
                                                                                            className="w-[86px] px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground"
                                                                                        >
                                                                                            {r.label}
                                                                                        </th>
                                                                                    ))}
                                                                                    <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                        Alasan &amp; Penyunting
                                                                                    </th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {riwayat.map((rev, idx) => {
                                                                                    const berlaku =
                                                                                        idx ===
                                                                                        riwayat.length - 1;

                                                                                    return (
                                                                                        <tr
                                                                                            key={`${plan.id}-${rev.urutan}`}
                                                                                            className={`border-b last:border-b-0 ${
                                                                                                berlaku
                                                                                                    ? 'bg-emerald-500/[0.07]'
                                                                                                    : ''
                                                                                            }`}
                                                                                        >
                                                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                                                <span
                                                                                                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                                                                                        berlaku
                                                                                                            ? 'bg-emerald-600 text-white'
                                                                                                            : 'bg-muted-foreground/15 text-muted-foreground'
                                                                                                    }`}
                                                                                                >
                                                                                                    {rev.label}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="px-3 py-2 font-mono whitespace-nowrap">
                                                                                                {formatTanggal(rev.start_date)}
                                                                                            </td>
                                                                                            <td className="px-3 py-2 font-mono whitespace-nowrap">
                                                                                                {formatTanggal(rev.selesai)}
                                                                                            </td>
                                                                                            {KOLOM_RAPAT.map((r) => (
                                                                                                <td
                                                                                                    key={r.kolom}
                                                                                                    className="px-3 py-2 font-mono whitespace-nowrap text-muted-foreground"
                                                                                                >
                                                                                                    {formatTanggal(rev[r.kolom])}
                                                                                                </td>
                                                                                            ))}
                                                                                            <td className="px-3 py-2">
                                                                                                <span className="block text-foreground">
                                                                                                    {rev.catatan || '—'}
                                                                                                </span>
                                                                                                <span className="block text-[11px] text-muted-foreground">
                                                                                                    {rev.user?.name ?? 'Sistem'}
                                                                                                    {rev.created_at
                                                                                                        ? ` · ${formatTanggal(rev.created_at)}`
                                                                                                        : ''}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>

                                                                    {!pernahDirevisi && (
                                                                        <p className="mt-2 text-[11px] text-muted-foreground">
                                                                            Rencana ini belum pernah
                                                                            direvisi.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
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

            {/* Formulir revisi rencana */}
            <Dialog
                open={!!planDiedit}
                onOpenChange={(open) => !open && setPlanDiedit(null)}
            >
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" />
                            Revisi Rencana Outage
                        </DialogTitle>
                        <DialogDescription>
                            {planDiedit?.mesin_pembangkit}
                        </DialogDescription>
                    </DialogHeader>

                    {planDiedit && (
                        <p className="rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                            Akan disimpan sebagai{' '}
                            <span className="font-semibold text-foreground">
                                REV {jatahRevisi(planDiedit).terpakai + 1}
                            </span>
                            . Setiap rencana hanya boleh direvisi{' '}
                            <span className="font-semibold text-foreground">
                                {maksRevisi} kali
                            </span>
                            ; setelah ini tersisa{' '}
                            <span className="font-semibold text-foreground">
                                {jatahRevisi(planDiedit).sisa - 1} kali
                            </span>
                            .
                        </p>
                    )}

                    <form onSubmit={simpanRevisi} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="revisi-start">Rencana Start</Label>
                                <Input
                                    id="revisi-start"
                                    type="date"
                                    value={revisiForm.data.start_date}
                                    onChange={(e) => ubahStart(e.target.value)}
                                    required
                                />
                                {revisiForm.errors.start_date && (
                                    <p className="text-xs text-destructive">
                                        {revisiForm.errors.start_date}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="revisi-selesai">Rencana Finish</Label>
                                <Input
                                    id="revisi-selesai"
                                    type="date"
                                    value={revisiForm.data.selesai}
                                    onChange={(e) =>
                                        revisiForm.setData('selesai', e.target.value)
                                    }
                                />
                                {revisiForm.errors.selesai && (
                                    <p className="text-xs text-destructive">
                                        {revisiForm.errors.selesai}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="revisi-catatan">Alasan Revisi</Label>
                            <Input
                                id="revisi-catatan"
                                placeholder="mis. menunggu material impor"
                                value={revisiForm.data.catatan}
                                onChange={(e) =>
                                    revisiForm.setData('catatan', e.target.value)
                                }
                            />
                            {revisiForm.errors.catatan && (
                                <p className="text-xs text-destructive">
                                    {revisiForm.errors.catatan}
                                </p>
                            )}
                        </div>

                        {/* Perbandingan sebelum/sesudah, supaya dampak revisinya terlihat */}
                        <div className="overflow-hidden rounded-md border">
                            <p className="border-b bg-muted px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                Dampak ke jadwal rapat
                            </p>
                            <table className="w-full border-collapse text-xs">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                            Rapat
                                        </th>
                                        <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                            Sekarang
                                        </th>
                                        <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                            Menjadi
                                        </th>
                                        <th className="px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground">
                                            Rumus
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {KOLOM_RAPAT.map((r) => {
                                        const lama = planDiedit?.[r.kolom] ?? null;
                                        const baru = pratinjau[r.kolom];
                                        const berubah =
                                            !!baru && baru !== (lama ?? '').slice(0, 10);

                                        return (
                                            <tr key={r.kolom} className="border-b last:border-b-0">
                                                <td className="px-3 py-1.5 font-semibold">
                                                    {r.label}
                                                </td>
                                                <td className="px-3 py-1.5 font-mono text-muted-foreground">
                                                    {formatTanggal(lama)}
                                                </td>
                                                <td
                                                    className={`px-3 py-1.5 font-mono font-semibold ${
                                                        berubah
                                                            ? 'text-amber-700 dark:text-amber-500'
                                                            : ''
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        {berubah && (
                                                            <ArrowRight className="h-3 w-3 shrink-0" />
                                                        )}
                                                        {formatTanggal(baru)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-1.5 text-right text-[11px] whitespace-nowrap text-muted-foreground">
                                                    start &minus; {offsetRapat[r.kolom]} hari
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPlanDiedit(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={revisiForm.processing}>
                                Simpan Revisi
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
