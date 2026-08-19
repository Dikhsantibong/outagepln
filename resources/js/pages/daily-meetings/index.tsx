import { Head, router, Link } from '@inertiajs/react';
import {
    Search,
    Filter,
    ExternalLink,
    Activity,
    CheckCircle2,
    Circle,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card } from '@/components/ui/card';

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
    daily_meetings?: Meeting[];
};

const getScopeColor = (scope: string | null) => {
    if (!scope) return 'border-border text-muted-foreground bg-muted/20';
    const s = scope.toLowerCase();
    
    // Warna tetap untuk scope yang sering muncul
    if (s.includes('major') || s.includes('overhaul') || s.includes('se')) return 'border-red-200 text-red-700 bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:bg-red-950/30';
    if (s.includes('minor') || s.includes('me')) return 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:bg-blue-950/30';
    
    // Warna beragam namun tetap profesional (Jira tag style)
    const colors = [
        'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-950/30',
        'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-950/30',
        'border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-900/50 dark:text-purple-400 dark:bg-purple-950/30',
        'border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-900/50 dark:text-teal-400 dark:bg-teal-950/30',
        'border-pink-200 text-pink-700 bg-pink-50 dark:border-pink-900/50 dark:text-pink-400 dark:bg-pink-950/30',
        'border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 dark:bg-indigo-950/30',
        'border-cyan-200 text-cyan-700 bg-cyan-50 dark:border-cyan-900/50 dark:text-cyan-400 dark:bg-cyan-950/30',
        'border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:bg-orange-950/30',
    ];
    
    const hash = scope.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

export default function DailyMeetingsIndex({
    outagePlans,
    filters,
    filterOptions,
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
}) {
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

    const renderMeetingCell = (plan: OutagePlan, tipe: string) => {
        const meeting = plan.daily_meetings?.find((m) => m.tipe_rapat === tipe);
        if (!meeting) {
            return (
                <div className="flex h-full w-full items-center justify-center rounded-sm border border-dashed border-border/60 bg-muted/5 p-2 text-[10px] text-muted-foreground/30 transition-colors hover:bg-muted/20">
                    Kosong
                </div>
            );
        }

        const isCompleted = meeting.status === 'completed';

        let icon = (
            <Circle className="h-2 w-2 fill-muted-foreground text-muted-foreground" />
        );
        let statusText = 'Terjadwal';
        let containerClass =
            'border-border hover:bg-muted/50 border-l-[3px] border-l-blue-500 bg-card text-foreground';

        if (isCompleted) {
            icon = (
                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
            );
            statusText = 'Selesai';
            containerClass =
                'border-border hover:bg-muted/50 border-l-[3px] border-l-emerald-500 bg-muted/20 text-foreground';
        }

        const displayDate = meeting.tanggal_realisasi || meeting.tanggal;
        const isRealisasi = !!meeting.tanggal_realisasi;

        return (
            <Link
                href={`/daily-meetings/${meeting.id}`}
                className={`group flex w-full flex-col items-start gap-1.5 rounded-sm border p-2 shadow-sm transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none ${containerClass}`}
            >
                <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex flex-col">
                        {isRealisasi ? (
                            <>
                                <span className="text-[9px] text-muted-foreground/60 line-through">
                                    {new Date(meeting.tanggal).toLocaleDateString('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: '2-digit',
                                    })}
                                </span>
                                <span className="font-mono text-[11px] font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                                    {new Date(meeting.tanggal_realisasi!).toLocaleDateString('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: '2-digit',
                                    })}
                                </span>
                            </>
                        ) : (
                            <span className="font-mono text-[11px] font-bold tracking-tight text-foreground">
                                {new Date(meeting.tanggal).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: '2-digit',
                                })}
                            </span>
                        )}
                    </div>
                    <ExternalLink className="h-3 w-3 mt-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="flex items-center gap-1.5">
                    {icon}
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        {statusText}
                    </span>
                </div>
            </Link>
        );
    };

    return (
        <>
            <Head title="Rapat Outage" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                            Rapat Outage
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Pemantauan & Pengendalian Jadwal Rapat P1, P2, P3,
                            R2, R3
                        </p>
                    </div>
                </div>

                <Card className="flex flex-1 flex-col overflow-hidden rounded-sm border-sidebar-border/60 shadow-sm">
                    {/* Toolbar / Filters */}
                    <div className="flex flex-col justify-between gap-4 border-b bg-muted/30 px-4 py-3 xl:flex-row xl:items-center">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="mb-1 flex items-center gap-2 border-r pr-4">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Filter
                                </span>
                            </div>

                            <div className="flex flex-col items-start gap-1.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Tahun
                                </span>
                                <Select
                                    value={filters.tahun || 'semua'}
                                    onValueChange={(val) =>
                                        applyFilters('tahun', val)
                                    }
                                >
                                    <SelectTrigger className="h-8 w-[100px] rounded-sm bg-background text-xs">
                                        <SelectValue placeholder="Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterOptions.tahun.map((t) => (
                                            <SelectItem
                                                key={t}
                                                value={t}
                                                className="text-xs"
                                            >
                                                {t === 'semua' ? 'Semua' : t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col items-start gap-1.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Unit
                                </span>
                                <Select
                                    value={filters.unit || 'Semua'}
                                    onValueChange={(val) =>
                                        applyFilters('unit', val)
                                    }
                                >
                                    <SelectTrigger className="h-8 w-[140px] rounded-sm bg-background text-xs">
                                        <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterOptions.unit.map((s) => (
                                            <SelectItem
                                                key={s}
                                                value={s}
                                                className="text-xs"
                                            >
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col items-start gap-1.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Scope
                                </span>
                                <Select
                                    value={filters.scope || 'Semua'}
                                    onValueChange={(val) =>
                                        applyFilters('scope', val)
                                    }
                                >
                                    <SelectTrigger className="h-8 w-[140px] rounded-sm bg-background text-xs">
                                        <SelectValue placeholder="Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterOptions.scope.map((s) => (
                                            <SelectItem
                                                key={s}
                                                value={s}
                                                className="text-xs"
                                            >
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col items-start gap-1.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Jenis Rapat
                                </span>
                                <Select
                                    value={filters.jenis_rapat || 'Semua'}
                                    onValueChange={(val) =>
                                        applyFilters('jenis_rapat', val)
                                    }
                                >
                                    <SelectTrigger className="h-8 w-[120px] rounded-sm bg-background text-xs">
                                        <SelectValue placeholder="Jenis Rapat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterOptions.jenis_rapat.map((jr) => (
                                            <SelectItem
                                                key={jr}
                                                value={jr}
                                                className="text-xs"
                                            >
                                                {jr}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSearch}
                            className="relative w-full sm:w-64"
                        >
                            <Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari mesin, scope..."
                                className="h-8 rounded-sm bg-background pl-8 text-xs"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>

                    {/* Datatable */}
                    <div className="flex-1 overflow-x-auto">
                        <Table className="min-w-[1000px] text-sm">
                            <TableHeader>
                                <TableRow className="border-b border-border/50 hover:bg-muted/30">
                                    <TableHead className="w-[40px] text-center text-[10px] font-bold tracking-widest uppercase">
                                        No
                                    </TableHead>
                                    <TableHead className="w-[150px] text-[10px] font-bold tracking-widest uppercase">
                                        Mesin
                                    </TableHead>
                                    <TableHead className="w-[100px] text-[10px] font-bold tracking-widest uppercase">
                                        Scope
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        R2
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        R3
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P1
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P2
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P3
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {outagePlans.data.length > 0 ? (
                                    outagePlans.data.map(
                                        (plan: OutagePlan, index: number) => (
                                            <TableRow
                                                key={plan.id}
                                                className="group border-b border-border/40 transition-colors hover:bg-muted/20"
                                            >
                                                <TableCell className="py-2 text-center align-top font-mono text-xs text-muted-foreground">
                                                    {outagePlans.from + index}
                                                </TableCell>
                                                <TableCell className="px-3 py-3 align-top font-medium">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs leading-tight font-semibold">
                                                            {
                                                                plan.mesin_pembangkit
                                                            }
                                                        </span>
                                                        <span className="mt-0.5 font-mono text-[10px] tracking-wide text-muted-foreground">
                                                            {new Date(
                                                                plan.start_date ||
                                                                    new Date().toISOString(),
                                                            ).toLocaleDateString(
                                                                'id-ID',
                                                                {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                },
                                                            )}{' '}
                                                            -{' '}
                                                            {new Date(
                                                                plan.selesai ||
                                                                    new Date().toISOString(),
                                                            ).toLocaleDateString(
                                                                'id-ID',
                                                                {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-3 py-3 align-top">
                                                    <div
                                                        className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-bold tracking-wider whitespace-nowrap uppercase ${getScopeColor(plan.scope)}`}
                                                    >
                                                        {plan.scope || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT R2',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT R3',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P1',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P2',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P3',
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            Tidak ada data rapat yang sesuai
                                            dengan filter.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between border-t bg-muted/10 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        <div>
                            Menampilkan{' '}
                            <span className="text-foreground">
                                {outagePlans.from ?? 0}
                            </span>{' '}
                            s/d{' '}
                            <span className="text-foreground">
                                {outagePlans.to ?? 0}
                            </span>{' '}
                            dari{' '}
                            <span className="text-foreground">
                                {outagePlans.total}
                            </span>{' '}
                            data
                        </div>
                        <div className="flex items-center gap-1.5">
                            {outagePlans.links.map((link: any, idx: number) => {
                                const isPrev = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');
                                let label = link.label;
                                if (isPrev) label = 'Prev';
                                if (isNext) label = 'Next';

                                return (
                                    <Button
                                        key={idx}
                                        variant={
                                            link.active ? 'secondary' : 'ghost'
                                        }
                                        size="sm"
                                        className={`h-7 px-2.5 text-[11px] ${link.active ? 'bg-muted/80 font-bold' : 'text-muted-foreground'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url)
                                                router.get(
                                                    link.url,
                                                    {},
                                                    { preserveScroll: true },
                                                );
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
