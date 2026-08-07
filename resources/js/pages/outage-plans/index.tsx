import {
    Combobox,
    ComboboxInput,
    ComboboxButton,
    ComboboxOptions,
    ComboboxOption,
} from '@headlessui/react';
import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import {
    Check,
    ChevronsUpDown,
    Info,
    Trash2,
    Search,
    Pencil,
    Plus,
    Eye,
    Download,
    FileText,
    FileSpreadsheet,
    Filter,
    X,
} from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useState, useMemo } from 'react';
import { FilterTahun } from '@/components/data-filter-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

type FilterOptions = {
    tahun: (string | number)[];
    scope: string[];
    jenis: string[];
    sistem: string[];
    ket: string[];
    ket_realisasi: string[];
};

/** Sentinel for "no filter" - Radix Select does not allow an empty item value. */
const ALL = '__all__';

function FilterSelect({
    label,
    value,
    onChange,
    options,
    width,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    width: string;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={`h-8 ${width} text-xs`}>
                    <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Semua</SelectItem>
                    {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export default function OutagePlansIndex({
    outagePlans,
    units = [],
    filters,
    filterOptions,
}: {
    outagePlans: any;
    units?: any[];
    filters?: any;
    filterOptions?: FilterOptions;
}) {
    const { auth } = usePage<any>().props;
    const isTamu = auth?.user?.role === 'tamu';
    // Modal ini khusus menambah jadwal baru; pengubahan punya halaman sendiri
    // di /outage-plans/{id}/edit karena progress harian butuh ruang penuh.
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const opts: FilterOptions = filterOptions ?? {
        tahun: [],
        scope: [],
        jenis: [],
        sistem: [],
        ket: [],
        ket_realisasi: [],
    };

    // Every filter except `search` is applied immediately on change; `search`
    // waits for Enter so the user can finish typing.
    const applyFilter = (patch: Record<string, string>) => {
        const next: Record<string, string> = {
            search: searchTerm,
            tahun: filters?.tahun ?? '',
            scope: filters?.scope ?? '',
            jenis: filters?.jenis ?? '',
            sistem: filters?.sistem ?? '',
            ket: filters?.ket ?? '',
            ket_realisasi: filters?.ket_realisasi ?? '',
            progres: filters?.progres ?? '',
            dari: filters?.dari ?? '',
            sampai: filters?.sampai ?? '',
            ...patch,
        };

        // Drop empty values so the URL stays clean and pagination links are short.
        const clean = Object.fromEntries(
            Object.entries(next).filter(([, v]) => v !== '' && v !== ALL),
        );

        router.get('/outage-plans', clean, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        router.get(
            '/outage-plans',
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    // `tahun` sengaja tidak dihitung: sejak listing terbuka di tahun berjalan,
    // filter tahun selalu terisi sehingga menghitungnya tidak memberi informasi.
    const activeFilterCount = [
        'search',
        'scope',
        'jenis',
        'sistem',
        'ket',
        'ket_realisasi',
        'progres',
        'dari',
        'sampai',
    ].filter((k) => filters?.[k]).length;

    const selectValue = (key: string) => filters?.[key] || ALL;
    const { data, setData, post, processing, errors, reset } = useForm({
        mesin_pembangkit: '',
        scope: '',
        jenis_pembangkit: '',
        durasi: '',
        start_date: '',
        selesai: '',
        rapat_r2: '',
        rapat_r3: '',
        rapat_p1: '',
        rapat_p2: '',
        rapat_p3: '',
        ket: '',
        sistem: '',
        real_start: '',
        real_stop: '',
        ket_realisasi: '',
    });

    const [query, setQuery] = useState('');

    const allMesins = useMemo(() => {
        const list: any[] = [];

        if (units && Array.isArray(units)) {
            units.forEach((u: any) => {
                if (u.mesins && Array.isArray(u.mesins)) {
                    u.mesins.forEach((m: any) => {
                        list.push({
                            id: m.id_mesin,
                            name: m.nama_mesin,
                            unitName: u.nama_sentral,
                            searchString:
                                `${u.nama_sentral} ${m.nama_mesin}`.toLowerCase(),
                        });
                    });
                }
            });
        }

        return list;
    }, [units]);

    const filteredMesins =
        query === ''
            ? allMesins
            : allMesins.filter((m) =>
                  m.searchString.includes(query.toLowerCase()),
              );

    const filteredOutagePlans = outagePlans.data || [];

    const openAddDialog = () => {
        reset();
        setQuery('');
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        reset();
        setQuery('');
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/outage-plans', { onSuccess: () => closeDialog() });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            router.delete(`/outage-plans/${id}`);
        }
    };

    return (
        <>
            <Head title="Perencanaan dan Jadwal Outage" />

            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Perencanaan dan Jadwal Outage
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Monitoring dan penjadwalan pemeliharaan unit
                            pembangkit
                        </p>
                    </div>
                    {!isTamu && (
                        <Button onClick={openAddDialog} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tambah Jadwal
                        </Button>
                    )}
                </div>

                {/* Table Section - Full Width */}
                <Card className="h-fit gap-0 py-4">
                    <CardHeader className="space-y-3 pb-3">
                        <div className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-lg">
                                Data Jadwal Outage
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative w-56">
                                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari mesin/scope... (enter)"
                                        className="h-9 pl-9"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                applyFilter({
                                                    search: searchTerm,
                                                });
                                            }
                                        }}
                                    />
                                </div>
                                <div className="rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                    Total: {outagePlans.total || 0}
                                </div>
                            </div>
                        </div>

                        {/* Filter bar */}
                        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-2.5">
                            <div className="flex items-center gap-1.5 pb-1.5 text-xs font-semibold text-muted-foreground">
                                <Filter className="h-3.5 w-3.5" />
                                Filter
                            </div>

                            <FilterTahun
                                value={filters?.tahun}
                                onChange={(v) => applyFilter({ tahun: v })}
                                options={opts.tahun}
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
                                options={opts.jenis.map((s) => ({
                                    value: s,
                                    label: s,
                                }))}
                                width="w-[110px]"
                            />
                            <FilterSelect
                                label="Sistem"
                                value={selectValue('sistem')}
                                onChange={(v) => applyFilter({ sistem: v })}
                                options={opts.sistem.map((s) => ({
                                    value: s,
                                    label: s,
                                }))}
                                width="w-[160px]"
                            />
                            <FilterSelect
                                label="Ket"
                                value={selectValue('ket')}
                                onChange={(v) => applyFilter({ ket: v })}
                                options={opts.ket.map((s) => ({
                                    value: s,
                                    label: s,
                                }))}
                                width="w-[110px]"
                            />
                            <FilterSelect
                                label="Progres"
                                value={selectValue('progres')}
                                onChange={(v) => applyFilter({ progres: v })}
                                options={[
                                    { value: 'belum', label: 'Belum mulai' },
                                    { value: 'berjalan', label: 'Berjalan' },
                                    { value: 'selesai', label: 'Selesai' },
                                ]}
                                width="w-[130px]"
                            />
                            <FilterSelect
                                label="Realisasi"
                                value={selectValue('ket_realisasi')}
                                onChange={(v) =>
                                    applyFilter({ ket_realisasi: v })
                                }
                                options={opts.ket_realisasi.map((s) => ({
                                    value: s,
                                    label: s,
                                }))}
                                width="w-[140px]"
                            />

                            <div className="space-y-1">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                                    Mulai dari
                                </Label>
                                <Input
                                    type="date"
                                    className="h-8 w-[150px] text-xs"
                                    value={filters?.dari ?? ''}
                                    onChange={(e) =>
                                        applyFilter({ dari: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                                    Sampai
                                </Label>
                                <Input
                                    type="date"
                                    className="h-8 w-[150px] text-xs"
                                    value={filters?.sampai ?? ''}
                                    onChange={(e) =>
                                        applyFilter({ sampai: e.target.value })
                                    }
                                />
                            </div>

                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reset ({activeFilterCount})
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        {/* Compact density is scoped here so the shared Table component stays untouched. */}
                        <Table className="whitespace-nowrap [&_td]:py-1.5 [&_th]:h-9">
                            <TableHeader>
                                <TableRow className="border-y bg-muted/30">
                                    <TableHead className="w-12 px-4 text-center font-bold">
                                        No
                                    </TableHead>
                                    <TableHead className="w-32 px-4 text-center font-bold">
                                        Aksi
                                    </TableHead>
                                    <TableHead className="min-w-[200px] px-4 font-bold">
                                        Mesin
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Scope
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Jenis
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Mulai
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Selesai
                                    </TableHead>
                                    <TableHead className="w-32 px-4 text-center font-bold">
                                        Progres
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Ket
                                    </TableHead>
                                    <TableHead className="px-4 text-center font-bold">
                                        Sistem
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOutagePlans.length > 0 ? (
                                    filteredOutagePlans.map(
                                        (plan: any, idx: number) => (
                                            <TableRow
                                                key={plan.id}
                                                className="group hover:bg-muted/30"
                                            >
                                                <TableCell className="px-4 text-center font-mono text-xs text-muted-foreground">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:bg-muted"
                                                            onClick={() =>
                                                                router.get(
                                                                    `/outage-plans/${plan.id}`,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:bg-muted"
                                                                >
                                                                    <Download className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        window.open(
                                                                            `/outage-plans/${plan.id}/export-pdf`,
                                                                            '_blank',
                                                                        )
                                                                    }
                                                                >
                                                                    <FileText className="h-3.5 w-3.5 text-red-500" />
                                                                    Unduh PDF
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        window.open(
                                                                            `/outage-plans/${plan.id}/export-excel`,
                                                                            '_blank',
                                                                        )
                                                                    }
                                                                >
                                                                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                                                    Unduh Excel
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        {!isTamu && (
                                                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                {/* Edit punya halaman sendiri: progress harian
                                                                    tidak muat diisi di dalam modal. */}
                                                                <Link
                                                                    href={`/outage-plans/${plan.id}/edit`}
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-primary hover:bg-primary/10"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            plan.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 text-xs font-medium">
                                                    {plan.mesin_pembangkit}
                                                </TableCell>
                                                <TableCell className="px-4 text-center text-[11px] font-semibold text-muted-foreground uppercase">
                                                    {plan.scope}
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <span className="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground uppercase">
                                                        {plan.jenis_pembangkit}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 text-center font-mono text-[11px] text-muted-foreground">
                                                    {plan.start_date || '-'}
                                                </TableCell>
                                                <TableCell className="px-4 text-center font-mono text-[11px] text-muted-foreground">
                                                    {plan.selesai || '-'}
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className={`h-full rounded-full ${Number(plan.progress) >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                style={{
                                                                    width: `${Math.min(100, Math.max(0, Number(plan.progress) || 0))}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="w-8 shrink-0 text-right text-[11px] leading-none font-bold">
                                                            {plan.progress}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${plan.ket === 'CLOSE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}
                                                    >
                                                        {plan.ket || 'OPEN'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 text-center text-[11px] font-semibold text-muted-foreground uppercase">
                                                    {plan.sistem || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={10}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <Info className="mx-auto mb-2 h-10 w-10 opacity-20" />
                                            <p>
                                                {searchTerm
                                                    ? 'Tidak ada hasil pencarian.'
                                                    : 'Belum ada data perencanaan.'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {outagePlans.links && outagePlans.links.length > 3 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 border-t px-4 pt-3">
                            {outagePlans.links.map((link: any, k: number) => (
                                <Link
                                    key={k}
                                    href={link.url || '#'}
                                    preserveState
                                    preserveScroll
                                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                        link.active
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'bg-background hover:bg-muted'
                                    } ${!link.url ? 'pointer-events-none cursor-not-allowed opacity-50' : ''}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Dialog Popup for Add / Edit Form */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDialog();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tambah Jadwal Outage</DialogTitle>
                        <DialogDescription>
                            Input data perencanaan outage baru. Progress harian diisi
                            setelahnya lewat halaman Edit.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        {/* Mesin Pembangkit */}
                        <div className="space-y-2">
                            <Label htmlFor="mesin_pembangkit">
                                Mesin Pembangkit
                            </Label>
                            <Combobox
                                value={data.mesin_pembangkit}
                                onChange={(val) =>
                                    setData('mesin_pembangkit', val || '')
                                }
                            >
                                <div className="relative">
                                    <div className="relative w-full cursor-default overflow-hidden rounded-md border border-input bg-transparent text-left shadow-sm transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 sm:text-sm">
                                        <ComboboxInput
                                            className="w-full border-none bg-transparent py-2 pr-10 pl-3 text-sm leading-5 focus:ring-0 focus:outline-none"
                                            displayValue={(mesinName: string) =>
                                                mesinName
                                            }
                                            onChange={(event) =>
                                                setQuery(event.target.value)
                                            }
                                            placeholder="Cari unit (cth: pltd poasia)..."
                                        />
                                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronsUpDown
                                                className="h-4 w-4 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                        </ComboboxButton>
                                    </div>
                                    <ComboboxOptions className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-base shadow-md ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                        {filteredMesins.length === 0 &&
                                        query !== '' ? (
                                            <div className="relative cursor-default px-4 py-2 text-muted-foreground select-none">
                                                Mesin tidak ditemukan.
                                            </div>
                                        ) : (
                                            filteredMesins.map((mesin) => (
                                                <ComboboxOption
                                                    key={mesin.id}
                                                    className={({ active }) =>
                                                        `relative cursor-default py-2 pr-4 pl-10 select-none ${
                                                            active
                                                                ? 'bg-accent text-accent-foreground'
                                                                : 'text-foreground'
                                                        }`
                                                    }
                                                    value={mesin.name}
                                                >
                                                    {({ selected, active }) => (
                                                        <>
                                                            <span
                                                                className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                                                            >
                                                                {mesin.name}
                                                            </span>
                                                            {selected ? (
                                                                <span
                                                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                        active
                                                                            ? 'text-accent-foreground'
                                                                            : 'text-primary'
                                                                    }`}
                                                                >
                                                                    <Check
                                                                        className="h-4 w-4"
                                                                        aria-hidden="true"
                                                                    />
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </ComboboxOption>
                                            ))
                                        )}
                                    </ComboboxOptions>
                                </div>
                            </Combobox>
                            {errors.mesin_pembangkit && (
                                <p className="text-xs text-destructive">
                                    {errors.mesin_pembangkit}
                                </p>
                            )}
                        </div>

                        {/* Scope & Jenis */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scope">Scope</Label>
                                <Select
                                    value={data.scope}
                                    onValueChange={(val) =>
                                        setData('scope', val)
                                    }
                                >
                                    <SelectTrigger id="scope">
                                        <SelectValue placeholder="Pilih Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FINAL STAGE">
                                            FINAL STAGE
                                        </SelectItem>
                                        <SelectItem value="SECOND STAGE">
                                            SECOND STAGE
                                        </SelectItem>
                                        <SelectItem value="2ND STAGE">
                                            2ND STAGE
                                        </SelectItem>
                                        <SelectItem value="TO">TO</SelectItem>
                                        <SelectItem value="MO">MO</SelectItem>
                                        <SelectItem value="SO">SO</SelectItem>
                                        <SelectItem value="AI">AI</SelectItem>
                                        <SelectItem value="GI">GI</SelectItem>
                                        <SelectItem value="PMS 20 K">
                                            PMS 20 K
                                        </SelectItem>
                                        <SelectItem value="PMS 24 K">
                                            PMS 24 K
                                        </SelectItem>
                                        <SelectItem value="PMS 32K">
                                            PMS 32K
                                        </SelectItem>
                                        <SelectItem value="PMS 40K">
                                            PMS 40K
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.scope && (
                                    <p className="text-xs text-destructive">
                                        {errors.scope}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jenis_pembangkit">Jenis</Label>
                                <Select
                                    value={data.jenis_pembangkit}
                                    onValueChange={(val) =>
                                        setData('jenis_pembangkit', val)
                                    }
                                >
                                    <SelectTrigger id="jenis_pembangkit">
                                        <SelectValue placeholder="Pilih Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PLTD">
                                            PLTD
                                        </SelectItem>
                                        <SelectItem value="PLTMG">
                                            PLTMG
                                        </SelectItem>
                                        <SelectItem value="PLTM">
                                            PLTM
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Durasi */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="durasi">Durasi (Hari)</Label>
                                <Input
                                    id="durasi"
                                    type="number"
                                    value={data.durasi}
                                    onChange={(e) =>
                                        setData('durasi', e.target.value)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Menentukan jumlah hari progress harian.
                                </p>
                            </div>
                        </div>

                        {/* Tanggal Mulai & Selesai */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Mulai</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData('start_date', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selesai">Selesai</Label>
                                <Input
                                    id="selesai"
                                    type="date"
                                    value={data.selesai}
                                    onChange={(e) =>
                                        setData('selesai', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Jadwal Rapat R2 & R3 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rapat_r2">Rapat R2</Label>
                                <Input
                                    id="rapat_r2"
                                    type="date"
                                    value={data.rapat_r2}
                                    onChange={(e) =>
                                        setData('rapat_r2', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rapat_r3">Rapat R3</Label>
                                <Input
                                    id="rapat_r3"
                                    type="date"
                                    value={data.rapat_r3}
                                    onChange={(e) =>
                                        setData('rapat_r3', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Jadwal Rapat P1, P2, P3 */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="rapat_p1">Rapat P1</Label>
                                <Input
                                    id="rapat_p1"
                                    type="date"
                                    value={data.rapat_p1}
                                    onChange={(e) =>
                                        setData('rapat_p1', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rapat_p2">Rapat P2</Label>
                                <Input
                                    id="rapat_p2"
                                    type="date"
                                    value={data.rapat_p2}
                                    onChange={(e) =>
                                        setData('rapat_p2', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rapat_p3">Rapat P3</Label>
                                <Input
                                    id="rapat_p3"
                                    type="date"
                                    value={data.rapat_p3}
                                    onChange={(e) =>
                                        setData('rapat_p3', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Keterangan & Sistem */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ket">Keterangan</Label>
                                <Input
                                    id="ket"
                                    type="text"
                                    value={data.ket}
                                    onChange={(e) =>
                                        setData('ket', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sistem">Sistem</Label>
                                <Input
                                    id="sistem"
                                    type="text"
                                    placeholder="cth: RAHA, BAUBAU"
                                    value={data.sistem}
                                    onChange={(e) =>
                                        setData('sistem', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Realisasi Pelaksanaan */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="real_start">Real Start</Label>
                                <Input
                                    id="real_start"
                                    type="date"
                                    value={data.real_start}
                                    onChange={(e) =>
                                        setData('real_start', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="real_stop">Real Stop</Label>
                                <Input
                                    id="real_stop"
                                    type="date"
                                    value={data.real_stop}
                                    onChange={(e) =>
                                        setData('real_stop', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ket_realisasi">
                                    Ket. Realisasi
                                </Label>
                                <Input
                                    id="ket_realisasi"
                                    type="text"
                                    placeholder="cth: Selesai"
                                    value={data.ket_realisasi}
                                    onChange={(e) =>
                                        setData('ket_realisasi', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeDialog}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Simpan Perencanaan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

OutagePlansIndex.layout = {
    breadcrumbs: [
        {
            title: 'Perencanaan dan Jadwal Outage',
            href: '/outage-plans',
        },
    ],
};
