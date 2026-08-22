import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Filter,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
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

type Perubahan = Record<string, unknown>;

type Aktivitas = {
    id: number;
    user_id: number | null;
    user_nama: string | null;
    user_role: string | null;
    event: 'created' | 'updated' | 'deleted';
    subject_type: string;
    subject_label: string;
    subject_id: number | null;
    deskripsi: string | null;
    perubahan: Perubahan | null;
    url: string | null;
    method: string | null;
    ip: string | null;
    created_at: string;
};

type Pelaku = { id: number; nama: string; role: string | null };

/** Tampilan tiap jenis aksi: satu warna, satu ikon, konsisten di seluruh halaman. */
const GAYA_EVENT = {
    created: {
        label: 'Tambah',
        ikon: Plus,
        kelas: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        garis: 'border-l-emerald-500',
    },
    updated: {
        label: 'Ubah',
        ikon: Pencil,
        kelas: 'bg-amber-500/15 text-amber-700 dark:text-amber-500',
        garis: 'border-l-amber-500',
    },
    deleted: {
        label: 'Hapus',
        ikon: Trash2,
        kelas: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
        garis: 'border-l-rose-500',
    },
} as const;

const gayaEvent = (event: string) =>
    GAYA_EVENT[event as keyof typeof GAYA_EVENT] ?? {
        label: event,
        ikon: Pencil,
        kelas: 'bg-muted text-muted-foreground',
        garis: 'border-l-border',
    };

const LABEL_ROLE: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    pengelola: 'Pengelola',
    tamu: 'Tamu',
    publik: 'Publik (tanpa login)',
};

const labelRole = (role: string | null) =>
    role ? (LABEL_ROLE[role] ?? role) : 'Sistem';

const waktu = (nilai: string) =>
    new Date(nilai).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

/** Nilai apa pun dijadikan teks yang aman ditampilkan di sel tabel. */
const keTeks = (nilai: unknown): string => {
    if (nilai === null || nilai === undefined || nilai === '') {
        return '—';
    }

    if (typeof nilai === 'boolean') {
        return nilai ? 'ya' : 'tidak';
    }

    if (typeof nilai === 'object') {
        return JSON.stringify(nilai);
    }

    return String(nilai);
};

/** Apakah nilai perubahan berbentuk {sebelum, sesudah}? */
const adalahPasangan = (
    nilai: unknown,
): nilai is { sebelum: unknown; sesudah: unknown } =>
    typeof nilai === 'object' &&
    nilai !== null &&
    'sebelum' in (nilai as Record<string, unknown>);

export default function AktivitasIndex({
    aktivitas,
    filters,
    filterOptions,
    ringkasan,
}: {
    aktivitas: any;
    filters: {
        search?: string;
        event?: string;
        role?: string;
        user?: string;
        modul?: string;
        dari?: string;
        sampai?: string;
    };
    filterOptions: {
        event: string[];
        role: string[];
        modul: string[];
        user: Pelaku[];
    };
    ringkasan: {
        hariIni: number;
        total: number;
        perEvent: Record<string, number>;
    };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [terbuka, setTerbuka] = useState<number[]>([]);

    const terapkan = (key: string, value: string) => {
        router.get(
            '/aktivitas',
            { ...filters, search, [key]: value },
            { preserveState: true, preserveScroll: true },
        );
    };

    const cari = (e: React.FormEvent) => {
        e.preventDefault();
        terapkan('search', search);
    };

    const toggle = (id: number) => {
        setTerbuka((ids) =>
            ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
        );
    };

    return (
        <>
            <Head title="Aktivitas" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                        Aktivitas
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Jejak seluruh penambahan, perubahan, dan penghapusan data
                        beserta pelakunya
                    </p>
                </div>

                {/* Ringkasan */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Hari Ini
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {ringkasan.hariIni}
                        </p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Total Tercatat
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {ringkasan.total}
                        </p>
                    </div>
                    {(['created', 'updated', 'deleted'] as const).map((ev) => {
                        const gaya = gayaEvent(ev);
                        const Ikon = gaya.ikon;

                        return (
                            <div
                                key={ev}
                                className={`rounded-md border border-l-[3px] bg-muted/40 px-4 py-3 ${gaya.garis}`}
                            >
                                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                    <Ikon className="h-3 w-3" />
                                    {gaya.label}
                                </p>
                                <p className="mt-0.5 font-mono text-xl font-bold">
                                    {ringkasan.perEvent[ev] ?? 0}
                                </p>
                            </div>
                        );
                    })}
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

                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Aksi
                                </span>
                                <Select
                                    value={filters.event || 'Semua'}
                                    onValueChange={(v) => terapkan('event', v)}
                                >
                                    <SelectTrigger className="h-8 w-[130px] rounded-sm bg-background text-xs">
                                        <SelectValue placeholder="Aksi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterOptions.event.map((o) => (
                                            <SelectItem key={o} value={o} className="text-xs">
                                                {o === 'Semua' ? 'Semua' : gayaEvent(o).label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Peran
                                </span>
                                <Select
                                    value={filters.role || 'Semua'}
                                    onValueChange={(v) => terapkan('role', v)}
                                >
                                    <SelectTrigger className="h-8 w-[150px] rounded-sm bg-background text-xs">
                                        <SelectValue placeholder="Peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterOptions.role.map((o) => (
                                            <SelectItem key={o} value={o} className="text-xs">
                                                {o === 'Semua' ? 'Semua' : labelRole(o)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Pengguna
                                </span>
                                <Select
                                    value={filters.user || 'Semua'}
                                    onValueChange={(v) => terapkan('user', v)}
                                >
                                    <SelectTrigger className="h-8 w-[170px] rounded-sm bg-background text-xs">
                                        <SelectValue placeholder="Pengguna" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Semua" className="text-xs">
                                            Semua
                                        </SelectItem>
                                        {filterOptions.user.map((u) => (
                                            <SelectItem
                                                key={u.id}
                                                value={String(u.id)}
                                                className="text-xs"
                                            >
                                                {u.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Modul
                                </span>
                                <Select
                                    value={filters.modul || 'Semua'}
                                    onValueChange={(v) => terapkan('modul', v)}
                                >
                                    <SelectTrigger className="h-8 w-[200px] rounded-sm bg-background text-xs">
                                        <SelectValue placeholder="Modul" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterOptions.modul.map((o) => (
                                            <SelectItem key={o} value={o} className="text-xs">
                                                {o}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Dari
                                </span>
                                <Input
                                    type="date"
                                    className="h-8 w-[145px] rounded-sm bg-background text-xs"
                                    value={filters.dari || ''}
                                    onChange={(e) => terapkan('dari', e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                    Sampai
                                </span>
                                <Input
                                    type="date"
                                    className="h-8 w-[145px] rounded-sm bg-background text-xs"
                                    value={filters.sampai || ''}
                                    onChange={(e) => terapkan('sampai', e.target.value)}
                                />
                            </div>
                        </div>

                        <form onSubmit={cari} className="relative w-full sm:w-64">
                            <Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari data, nama, modul..."
                                className="h-8 rounded-sm bg-background pl-8 text-xs"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>

                    {/* Tabel */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full min-w-[960px] border-collapse">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="w-[150px] border-b px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Waktu
                                    </th>
                                    <th className="w-[95px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Aksi
                                    </th>
                                    <th className="w-[190px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Pelaku
                                    </th>
                                    <th className="w-[200px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Modul
                                    </th>
                                    <th className="border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Data
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {aktivitas.data.length > 0 ? (
                                    aktivitas.data.map((row: Aktivitas, i: number) => {
                                        const gaya = gayaEvent(row.event);
                                        const Ikon = gaya.ikon;
                                        const dibuka = terbuka.includes(row.id);
                                        const rincian = Object.entries(row.perubahan ?? {});

                                        return (
                                            <Fragment key={row.id}>
                                                <tr
                                                    className={`border-b border-l-[3px] transition-colors hover:bg-muted/40 ${gaya.garis} ${
                                                        i % 2 === 1 ? 'bg-muted/20' : ''
                                                    }`}
                                                >
                                                    <td className="px-3 py-2 align-middle font-mono text-xs whitespace-nowrap text-muted-foreground">
                                                        {waktu(row.created_at)}
                                                    </td>
                                                    <td className="border-l px-3 py-2 align-middle">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${gaya.kelas}`}
                                                        >
                                                            <Ikon className="h-3 w-3" />
                                                            {gaya.label}
                                                        </span>
                                                    </td>
                                                    <td className="border-l px-3 py-2 align-middle">
                                                        <span className="block text-[13px] font-semibold text-foreground">
                                                            {row.user_nama ?? 'Sistem'}
                                                        </span>
                                                        <span className="block text-[11px] text-muted-foreground">
                                                            {labelRole(row.user_role)}
                                                        </span>
                                                    </td>
                                                    <td className="border-l px-3 py-2 align-middle text-xs">
                                                        {row.subject_label}
                                                        {row.subject_id !== null && (
                                                            <span className="ml-1 font-mono text-[11px] text-muted-foreground">
                                                                #{row.subject_id}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="border-l px-3 py-2 align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggle(row.id)}
                                                            aria-expanded={dibuka}
                                                            disabled={rincian.length === 0}
                                                            className="flex w-full items-center gap-1.5 text-left disabled:cursor-default"
                                                        >
                                                            {rincian.length > 0 &&
                                                                (dibuka ? (
                                                                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                                ) : (
                                                                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                                ))}
                                                            <span className="min-w-0 flex-1 truncate text-xs">
                                                                {row.deskripsi || '—'}
                                                            </span>
                                                            {rincian.length > 0 && (
                                                                <span className="shrink-0 rounded bg-muted-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                                    {rincian.length} kolom
                                                                </span>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {dibuka && rincian.length > 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="border-b bg-muted/45 p-0"
                                                        >
                                                            <div className="px-4 py-3">
                                                                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                                                    <span>
                                                                        {row.method} {row.url ?? '—'}
                                                                    </span>
                                                                    {row.ip && <span>IP {row.ip}</span>}
                                                                </div>

                                                                <div className="overflow-x-auto rounded border bg-background">
                                                                    <table className="w-full min-w-[620px] border-collapse text-xs">
                                                                        <thead>
                                                                            <tr className="border-b bg-muted/70">
                                                                                <th className="w-[220px] px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                    Kolom
                                                                                </th>
                                                                                <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                    {row.event === 'updated'
                                                                                        ? 'Sebelum'
                                                                                        : 'Nilai'}
                                                                                </th>
                                                                                {row.event === 'updated' && (
                                                                                    <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                        Sesudah
                                                                                    </th>
                                                                                )}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {rincian.map(([kolom, nilai]) => (
                                                                                <tr
                                                                                    key={kolom}
                                                                                    className="border-b last:border-b-0"
                                                                                >
                                                                                    <td className="px-3 py-1.5 font-mono text-[11px] font-semibold">
                                                                                        {kolom}
                                                                                    </td>
                                                                                    <td className="px-3 py-1.5 text-muted-foreground">
                                                                                        {adalahPasangan(nilai)
                                                                                            ? keTeks(nilai.sebelum)
                                                                                            : keTeks(nilai)}
                                                                                    </td>
                                                                                    {row.event === 'updated' && (
                                                                                        <td className="px-3 py-1.5 font-medium text-foreground">
                                                                                            {adalahPasangan(nilai)
                                                                                                ? keTeks(nilai.sesudah)
                                                                                                : '—'}
                                                                                        </td>
                                                                                    )}
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="h-32 text-center text-sm text-muted-foreground"
                                        >
                                            Belum ada aktivitas yang sesuai dengan filter.
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
                                {aktivitas.from ?? 0}
                            </span>
                            {' – '}
                            <span className="font-semibold text-foreground">
                                {aktivitas.to ?? 0}
                            </span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">
                                {aktivitas.total}
                            </span>{' '}
                            catatan
                        </div>
                        <div className="flex items-center gap-1.5">
                            {aktivitas.links.map((link: any, idx: number) => {
                                let label = link.label;

                                if (label.includes('Previous')) {
                                    label = 'Prev';
                                }

                                if (label.includes('Next')) {
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
                                                router.get(link.url, {}, { preserveScroll: true });
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

AktivitasIndex.layout = {
    breadcrumbs: [{ title: 'Aktivitas', href: '/aktivitas' }],
};
