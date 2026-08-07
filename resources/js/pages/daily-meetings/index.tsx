import { Head, router, usePage, Link } from '@inertiajs/react';
import { Calendar, Users, Eye, QrCode, Trash2, CheckCircle2, Video, Filter, X, Search } from 'lucide-react';
import { useState } from 'react';
import { FilterTahun } from '@/components/data-filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
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
    tanggal: string;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    lokasi: string | null;
    token: string;
    status: 'draft' | 'active' | 'completed' | 'berlangsung';
    link_meeting: string | null;
    attendees_count: number;
    created_at: string;
};

type FilterOptions = {
    tipe_rapat: string[];
    lokasi: string[];
    tahun: (string | number)[];
};

/** Sentinel for "no filter" - Radix Select does not allow an empty item value. */
const ALL = '__all__';

const BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

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

export default function DailyMeetingsIndex({
    meetings,
    filters,
    filterOptions,
}: {
    meetings: any;
    filters?: any;
    filterOptions?: FilterOptions;
}) {
    const { auth } = usePage<any>().props;
    const isTamu = auth?.user?.role === 'tamu';
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const opts: FilterOptions = filterOptions ?? {
        tipe_rapat: [],
        lokasi: [],
        tahun: [],
    };

    // Sorting, filtering and pagination all happen server-side now; the list
    // used to load every meeting at once which does not scale past a few hundred.
    const paginatedMeetings: Meeting[] = meetings.data || [];

    const applyFilter = (patch: Record<string, string>) => {
        const next: Record<string, string> = {
            search: searchTerm,
            tipe_rapat: filters?.tipe_rapat ?? '',
            status: filters?.status ?? '',
            tahun: filters?.tahun ?? '',
            bulan: filters?.bulan ?? '',
            lokasi: filters?.lokasi ?? '',
            dari: filters?.dari ?? '',
            sampai: filters?.sampai ?? '',
            ...patch,
        };

        const clean = Object.fromEntries(
            Object.entries(next).filter(([, v]) => v !== '' && v !== ALL),
        );

        router.get('/daily-meetings', clean, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        router.get('/daily-meetings', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // `tahun` sengaja tidak dihitung: sejak listing terbuka di tahun berjalan,
    // filter tahun selalu terisi sehingga menghitungnya tidak memberi informasi.
    const activeFilterCount = [
        'search', 'tipe_rapat', 'status', 'bulan', 'lokasi', 'dari', 'sampai',
    ].filter((k) => filters?.[k]).length;

    const selectValue = (key: string) => filters?.[key] || ALL;

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus meeting ini?')) {
            router.delete(`/daily-meetings/${id}`);
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'berlangsung':
                return (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 gap-1.5 border-none">
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Berlangsung
                    </Badge>
                );
            case 'active':
                return (
                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 gap-1.5 border-none">
                        Akan Datang
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge variant="secondary" className="gap-1.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Selesai
                    </Badge>
                );
            default:
                return <Badge variant="outline">Draft</Badge>;
        }
    };

    return (
        <>
            <Head title="Daily Meeting" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily Meeting</h1>
                        <p className="text-sm text-muted-foreground mt-1">Kelola rapat harian, daftar hadir, dan notulen</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-56">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari judul/lokasi... (enter)"
                                className="h-9 pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilter({ search: searchTerm });
                                    }
                                }}
                            />
                        </div>
                        <div className="rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">
                            Total: {meetings.total || 0}
                        </div>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-2.5">
                    <div className="flex items-center gap-1.5 pb-1.5 text-xs font-semibold text-muted-foreground">
                        <Filter className="h-3.5 w-3.5" />
                        Filter
                    </div>

                    <FilterSelect
                        label="Tipe Rapat"
                        value={selectValue('tipe_rapat')}
                        onChange={(v) => applyFilter({ tipe_rapat: v })}
                        options={opts.tipe_rapat.map((t) => ({ value: t, label: t }))}
                        width="w-[140px]"
                    />
                    <FilterSelect
                        label="Status"
                        value={selectValue('status')}
                        onChange={(v) => applyFilter({ status: v })}
                        options={[
                            { value: 'berlangsung', label: 'Berlangsung' },
                            { value: 'akan_datang', label: 'Akan Datang' },
                            { value: 'selesai', label: 'Selesai' },
                        ]}
                        width="w-[140px]"
                    />
                    <FilterTahun
                        value={filters?.tahun}
                        onChange={(v) => applyFilter({ tahun: v })}
                        options={opts.tahun}
                    />
                    <FilterSelect
                        label="Bulan"
                        value={selectValue('bulan')}
                        onChange={(v) => applyFilter({ bulan: v })}
                        options={BULAN.map((b, i) => ({ value: String(i + 1), label: b }))}
                        width="w-[130px]"
                    />
                    <FilterSelect
                        label="Lokasi"
                        value={selectValue('lokasi')}
                        onChange={(v) => applyFilter({ lokasi: v })}
                        options={opts.lokasi.map((l) => ({ value: l, label: l }))}
                        width="w-[130px]"
                    />

                    <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Tanggal dari
                        </Label>
                        <Input
                            type="date"
                            className="h-8 w-[150px] text-xs"
                            value={filters?.dari ?? ''}
                            onChange={(e) => applyFilter({ dari: e.target.value })}
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
                            onChange={(e) => applyFilter({ sampai: e.target.value })}
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

                {/* Meeting List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {paginatedMeetings.length > 0 ? (
                        paginatedMeetings.map((meeting) => (
                            <Card
                                key={meeting.id}
                                className="group transition-all duration-300 hover:shadow-md hover:border-primary/50 overflow-hidden border-sidebar-border/60 bg-card flex flex-col"
                            >
                                <div className="p-4 flex flex-col h-full gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors flex-1">
                                            {meeting.judul}
                                        </h3>
                                        <div className="shrink-0 scale-90 origin-top-right">
                                            {renderStatusBadge(meeting.status)}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                            <span className="truncate">
                                                {new Date(meeting.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 text-primary/70" />
                                            <span className="font-medium text-foreground">{meeting.attendees_count} Peserta</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-sidebar-border/30 mt-auto">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-8 flex-1 text-xs font-bold"
                                            onClick={() => router.visit(`/daily-meetings/${meeting.id}`)}
                                        >
                                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                                            Detail
                                        </Button>
                                        {meeting.link_meeting && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0"
                                                onClick={() => window.open(meeting.link_meeting!, '_blank')}
                                            >
                                                <Video className="h-4 w-4 text-blue-500" />
                                            </Button>
                                        )}
                                        {['active', 'berlangsung'].includes(meeting.status) && !isTamu && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0"
                                                onClick={() => window.open(`/daily-meetings/${meeting.id}/qr`, '_blank')}
                                            >
                                                <QrCode className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {!isTamu && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(meeting.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                                {activeFilterCount > 0 ? <Calendar className="h-8 w-8 text-muted-foreground opacity-40" /> : <QrCode className="h-8 w-8 text-muted-foreground opacity-40" />}
                            </div>
                            <CardTitle className="text-lg mb-2">{activeFilterCount > 0 ? 'Tidak ada meeting' : 'Belum ada meeting'}</CardTitle>
                            <CardDescription className="text-sm max-w-[300px] mb-6">
                                {activeFilterCount > 0
                                    ? 'Tidak ada rapat yang cocok dengan filter yang dipilih.'
                                    : 'Silakan buat meeting baru untuk mulai mendata kehadiran.'}
                            </CardDescription>
                            {activeFilterCount > 0 && (
                                <Button variant="outline" onClick={resetFilters}>
                                    Hapus Filter
                                </Button>
                            )}
                        </Card>
                    )}
                </div>

                {/* Pagination Controls */}
                {meetings.links && meetings.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-center gap-1 mt-4 pt-4 border-t">
                        {meetings.links.map((link: any, k: number) => (
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
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

DailyMeetingsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Daily Meeting',
            href: '/daily-meetings',
        },
    ],
};
