import { Head, useForm, router, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Users, Eye, QrCode, Trash2, CheckCircle2, Info, Video } from 'lucide-react';

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

export default function DailyMeetingsIndex({ meetings }: { meetings: Meeting[] }) {
    const { auth } = usePage<any>().props;
    const isTamu = auth?.user?.role === 'tamu';
    const [filterDate, setFilterDate] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const sortedMeetings = [...meetings].sort((a, b) => {
        const getPriority = (status: string) => {
            if (status === 'berlangsung') return 1;
            if (status === 'active') return 2;
            return 3; // completed or draft
        };
        
        const priorityA = getPriority(a.status);
        const priorityB = getPriority(b.status);
        
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        // If 'active', sort ascending by date (closest date first)
        // Otherwise (e.g. completed), sort descending by date (most recent first)
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        
        if (priorityA === 2) {
            return dateA - dateB;
        }
        return dateB - dateA;
    });

    const filteredMeetings = sortedMeetings.filter((meeting) => {
        if (!filterDate) return true;
        return meeting.tanggal === filterDate;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredMeetings.length / itemsPerPage);
    const paginatedMeetings = filteredMeetings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterDate]);

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
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="filter-date" className="text-xs text-muted-foreground whitespace-nowrap">Filter Tanggal:</Label>
                            <Input
                                id="filter-date"
                                type="date"
                                className="h-9 w-[160px] text-sm"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                            {filterDate && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-9 px-2 text-xs"
                                    onClick={() => setFilterDate('')}
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
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
                                {filterDate ? <Calendar className="h-8 w-8 text-muted-foreground opacity-40" /> : <QrCode className="h-8 w-8 text-muted-foreground opacity-40" />}
                            </div>
                            <CardTitle className="text-lg mb-2">{filterDate ? 'Tidak ada meeting' : 'Belum ada meeting'}</CardTitle>
                            <CardDescription className="text-sm max-w-[300px] mb-6">
                                {filterDate 
                                    ? 'Tidak ada rapat yang ditemukan pada tanggal tersebut.' 
                                    : 'Silakan buat meeting baru untuk mulai mendata kehadiran.'}
                            </CardDescription>
                            {filterDate && (
                                <Button variant="outline" onClick={() => setFilterDate('')}>
                                    Hapus Filter
                                </Button>
                            )}
                        </Card>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                            Sebelumnya
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => page === 1 || page === totalPages || Math.abs(currentPage - page) <= 2)
                                .map((page, index, array) => {
                                    return (
                                        <div key={page} className="flex items-center">
                                            {index > 0 && array[index - 1] !== page - 1 && (
                                                <span className="px-2 text-muted-foreground">...</span>
                                            )}
                                            <Button
                                                variant={currentPage === page ? 'default' : 'ghost'}
                                                size="sm"
                                                className="w-8 h-8 p-0 text-xs cursor-pointer"
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </Button>
                                        </div>
                                    );
                                })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                            Berikutnya
                        </Button>
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
