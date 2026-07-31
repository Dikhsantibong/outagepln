import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
    ArrowRight, Activity, Calendar, Zap, BarChart3, Users, Building, 
    Server, ClipboardList, Clock, Video
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell
} from 'recharts';

interface WelcomeProps {
    canLogin: boolean;
    stats: {
        total: number;
        totalUnit: number;
        totalMesin: number;
        totalUser: number;
        plantStats: Record<string, { count: number; progress: number }>;
        scopeDistribution: { scope: string; total: number }[];
        progressDistribution: { range: string; count: number }[];
        recentOutages: any[];
        activeMeetingsList: any[];
        meetings: {
            active: number;
            total: number;
            upcoming: number;
            nextMeeting: {
                date: string;
                label: string;
            } | null;
        };
    };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltipStyle = {
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(15, 23, 42, 0.9)',
    color: '#fff',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
    fontSize: '12px',
    backdropFilter: 'blur(8px)',
};

export default function Welcome({ canLogin, stats }: WelcomeProps) {
    const scopeBarData = stats.scopeDistribution.map(s => ({
        name: s.scope || '-',
        jumlah: s.total,
    }));

    const pieData = Object.entries(stats.plantStats).map(([jenis, data]) => ({
        name: jenis,
        value: data.count,
    }));

    return (
        <>
            <Head title="Public Dashboard - Outage Monitoring" />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500/30">
                {/* Navbar */}
                <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Public Dashboard
                                </p>
                                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                    Outage Monitoring
                                </p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-4">
                            {canLogin && (
                                <Link href="/login">
                                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2">
                                        Login Sistem
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="container mx-auto px-4 md:px-8 py-8 space-y-8">
                    {/* Header Section */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Overview Operasional</h1>
                        <p className="text-muted-foreground mt-1">Data terkini operasional pemeliharaan pembangkit (Outage) secara real-time.</p>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total Outage</p>
                                    <ClipboardList className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl font-bold">{stats.total}</h2>
                                    <span className="text-xs text-muted-foreground">Pekerjaan</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total Unit</p>
                                    <Building className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl font-bold">{stats.totalUnit}</h2>
                                    <span className="text-xs text-muted-foreground">Unit PLT</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total Mesin</p>
                                    <Server className="h-4 w-4 text-amber-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl font-bold">{stats.totalMesin}</h2>
                                    <span className="text-xs text-muted-foreground">Mesin Aktif</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Tim Operasional</p>
                                    <Users className="h-4 w-4 text-purple-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl font-bold">{stats.totalUser}</h2>
                                    <span className="text-xs text-muted-foreground">Personel</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm bg-primary text-primary-foreground border-none">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-primary-foreground/80">Rapat Aktif</p>
                                    <Video className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl font-bold">{stats.meetings.active}</h2>
                                    <span className="text-xs text-primary-foreground/70">Berlangsung</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="lg:col-span-2 shadow-sm border-slate-200/60 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                                    Distribusi Scope Outage
                                </CardTitle>
                                <CardDescription>Berdasarkan jenis ruang lingkup pemeliharaan</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full h-[300px] min-h-[300px]">
                                    {scopeBarData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={scopeBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#64748b' }} />
                                                <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                                                <Bar dataKey="jumlah" name="Total Outage" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 italic">Data tidak tersedia</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800 flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                    <Zap className="h-5 w-5 text-amber-500" />
                                    Komposisi Pembangkit
                                </CardTitle>
                                <CardDescription>Berdasarkan tipe mesin</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-center">
                                <div className="w-full h-[250px] min-h-[250px]">
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={CustomTooltipStyle} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 italic">Data tidak tersedia</div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {pieData.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <div className="text-sm">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{entry.name}</span>
                                                <span className="text-slate-500 ml-1">({entry.value})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tables Row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Outage Table */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Jadwal Outage Terdekat</CardTitle>
                                    <CardDescription>Pekerjaan pemeliharaan yang belum selesai</CardDescription>
                                </div>
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="px-4 text-xs font-semibold">Mesin</TableHead>
                                                <TableHead className="px-4 text-xs font-semibold text-center">Scope</TableHead>
                                                <TableHead className="px-4 text-xs font-semibold text-center">Tgl Mulai</TableHead>
                                                <TableHead className="px-4 text-xs font-semibold text-center">Progres</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats.recentOutages.length > 0 ? (
                                                stats.recentOutages.map((plan: any) => (
                                                    <TableRow key={plan.id} className="hover:bg-muted/20 text-sm">
                                                        <TableCell className="px-4 font-medium py-3">
                                                            {plan.mesin_pembangkit}
                                                            <div className="text-[10px] text-muted-foreground mt-0.5">{plan.jenis_pembangkit}</div>
                                                        </TableCell>
                                                        <TableCell className="px-4 text-center">
                                                            <Badge variant="outline" className="text-[10px]">{plan.scope}</Badge>
                                                        </TableCell>
                                                        <TableCell className="px-4 text-center font-mono text-xs text-muted-foreground">
                                                            {plan.start_date || '-'}
                                                        </TableCell>
                                                        <TableCell className="px-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="text-xs font-bold w-8">{plan.progress}%</span>
                                                                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full rounded-full bg-blue-500" 
                                                                        style={{ width: `${Math.min(100, Math.max(0, Number(plan.progress) || 0))}%` }} 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                                                        Tidak ada data outage aktif.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Meetings Table */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Agenda Rapat Aktif</CardTitle>
                                    <CardDescription>Daftar pertemuan harian yang sedang atau akan berlangsung</CardDescription>
                                </div>
                                <Video className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="px-4 text-xs font-semibold">Judul Rapat</TableHead>
                                                <TableHead className="px-4 text-xs font-semibold text-center">Tanggal</TableHead>
                                                <TableHead className="px-4 text-xs font-semibold text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats.activeMeetingsList.length > 0 ? (
                                                stats.activeMeetingsList.map((meeting: any) => (
                                                    <TableRow key={meeting.id} className="hover:bg-muted/20 text-sm">
                                                        <TableCell className="px-4 font-medium py-3">
                                                            <div className="line-clamp-2 leading-snug">{meeting.judul}</div>
                                                        </TableCell>
                                                        <TableCell className="px-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                {meeting.tanggal}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-4 text-center">
                                                            {meeting.status === 'berlangsung' ? (
                                                                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 gap-1 border-none text-[10px]">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                                    Berlangsung
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 border-none text-[10px]">
                                                                    Akan Datang
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">
                                                        Tidak ada rapat aktif saat ini.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 text-slate-500 mt-12">
                    <div className="container mx-auto px-4 md:px-8 text-center text-sm">
                        <p>&copy; {new Date().getFullYear()} PT PLN Nusantara Power. All rights reserved.</p>
                        <p className="mt-1 text-xs text-slate-400">Public Outage Monitoring Dashboard - Sistem Berjalan Otomatis</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
