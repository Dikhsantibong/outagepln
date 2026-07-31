import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Calendar, Clock, Activity, Zap, BarChart3, ShieldCheck, DollarSign, Crosshair, HeartPulse } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, Legend
} from 'recharts';

interface DashboardProps {
    stats: {
        total: number;
        plantStats: Record<string, { count: number; progress: number }>;
        scopeDistribution: { scope: string; total: number }[];
        monthlyTimeline: { bulan: string; total: number }[];
        progressDistribution: { range: string; count: number }[];
        durasiByScope: { scope: string; avg_durasi: number; total: number }[];
        eksekusi: { pltd: number; pltm: number };
        kinerja: { onQuality: number; onTime: number; onCost: number; onScope: number; onSafety: number };
        meetings: { active: number; total: number };
    };
    recentOutages: {
        mesin: string;
        scope: string;
        jenis: string;
        progress: number;
        start_date: string;
        time: string;
    }[];
    ongoingOutages: {
        mesin: string;
        scope: string;
        jenis: string;
        progress: number;
        start_date: string;
    }[];
    outageMeetings: {
        today: { id: number; mesin: string; scope: string; jenis: string; type: string; date: string }[];
        upcoming: { id: number; mesin: string; scope: string; jenis: string; type: string; date: string }[];
    };
}

const CustomTooltipStyle = {
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '12px',
};

export default function Dashboard({ stats, ongoingOutages, outageMeetings }: DashboardProps) {
    const scopeBarData = stats.scopeDistribution.map(s => ({
        name: s.scope || '-',
        jumlah: s.total,
    }));

    const timelineData = stats.monthlyTimeline.map(m => {
        const [y, mo] = m.bulan.split('-');
        const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        return {
            name: `${monthNames[parseInt(mo) - 1]} ${y.slice(2)}`,
            outage: m.total,
        };
    });

    const progressBarData = stats.progressDistribution;

    const durasiLineData = stats.durasiByScope.map(d => ({
        name: d.scope || '-',
        durasi: Math.round(d.avg_durasi),
    }));

    const progressColor = (val: number) => {
        if (val >= 75) return 'text-emerald-600';
        if (val >= 40) return 'text-amber-600';
        return 'text-rose-600';
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex-1 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Stats, Charts, and Activity */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* KINERJA OUTAGE WIDGET */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-500" />
                                Kinerja Outage
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <ShieldCheck className="h-6 w-6 text-emerald-600 mb-2" />
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">On Quality</p>
                                        <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-400">{stats.kinerja.onQuality}%</h4>
                                    </CardContent>
                                </Card>
                                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50 shadow-sm">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <Clock className="h-6 w-6 text-blue-600 mb-2" />
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">On Time</p>
                                        <h4 className="text-xl font-black text-blue-700 dark:text-blue-400">{stats.kinerja.onTime}%</h4>
                                    </CardContent>
                                </Card>
                                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50 shadow-sm">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <DollarSign className="h-6 w-6 text-amber-600 mb-2" />
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">On Cost</p>
                                        <h4 className="text-xl font-black text-amber-700 dark:text-amber-400">{stats.kinerja.onCost}%</h4>
                                    </CardContent>
                                </Card>
                                <Card className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <Crosshair className="h-6 w-6 text-indigo-600 mb-2" />
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">On Scope</p>
                                        <h4 className="text-xl font-black text-indigo-700 dark:text-indigo-400">{stats.kinerja.onScope}%</h4>
                                    </CardContent>
                                </Card>
                                <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 shadow-sm">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <HeartPulse className="h-6 w-6 text-rose-600 mb-2" />
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">On Safety</p>
                                        <h4 className="text-xl font-black text-rose-700 dark:text-rose-400">{stats.kinerja.onSafety}%</h4>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Outage Plan</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total}</div>
                                    <p className="text-xs text-muted-foreground">Seluruh rencana</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-primary">Rapat Aktif</CardTitle>
                                    <Activity className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-primary">{stats.meetings.active}</div>
                                    <p className="text-xs text-primary/80">Sedang berlangsung</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Eksekusi PLTD</CardTitle>
                                    <Zap className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-600">{stats.eksekusi.pltd}%</div>
                                    <p className="text-xs text-muted-foreground">Tingkat penyelesaian</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Eksekusi PLTM</CardTitle>
                                    <Zap className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">{stats.eksekusi.pltm}%</div>
                                    <p className="text-xs text-muted-foreground">Tingkat penyelesaian</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row 1 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                                        Distribusi Scope
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pl-0">
                                    <div className="h-[220px]">
                                        {scopeBarData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={scopeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                                    <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                                    <Tooltip contentStyle={CustomTooltipStyle} />
                                                    <Bar dataKey="jumlah" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">Belum ada data.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Activity className="h-4 w-4 text-teal-500" />
                                        Timeline Bulanan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pl-0">
                                    <div className="h-[220px]">
                                        {timelineData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                                    <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                                    <Tooltip contentStyle={CustomTooltipStyle} />
                                                    <Line type="monotone" dataKey="outage" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">Belum ada data.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Outage Activity */}
                        <Card className="border-t-4 border-t-amber-500 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-amber-500" />
                                    Progres Sementara Berlangsung
                                </CardTitle>
                                <CardDescription>Pekerjaan pemeliharaan yang saat ini sedang dikerjakan secara aktif</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-5">
                                    {ongoingOutages.length > 0 ? ongoingOutages.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <p className="text-sm font-bold text-foreground leading-none truncate">{item.mesin}</p>
                                                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                                                    {item.jenis} · <span className="text-blue-500">{item.scope}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-400">Mulai: {item.start_date || '-'}</p>
                                            </div>
                                            <div className="flex-1 max-w-[250px]">
                                                <div className="flex justify-between text-xs mb-1.5 items-end">
                                                    <span className="font-semibold text-slate-500">Progres</span>
                                                    <span className="font-black text-lg leading-none" style={{ color: item.progress >= 75 ? '#10b981' : item.progress >= 40 ? '#f59e0b' : '#3b82f6' }}>
                                                        {item.progress}%
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-1000" 
                                                        style={{ 
                                                            width: `${item.progress}%`,
                                                            backgroundColor: item.progress >= 75 ? '#10b981' : item.progress >= 40 ? '#f59e0b' : '#3b82f6'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center py-6">
                                            <ShieldCheck className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
                                            <p className="text-sm text-muted-foreground italic text-center">Tidak ada pekerjaan yang sedang berlangsung.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Sidebar (Jadwal Rapat) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-t-4 border-t-blue-500 shadow-sm overflow-hidden sticky top-6">
                            <CardHeader className="bg-muted/20 border-b pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    Jadwal Rapat Outage
                                </CardTitle>
                                <CardDescription className="mt-1">Rapat persiapan outage hari ini dan yang akan datang</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {outageMeetings.today.length === 0 && outageMeetings.upcoming.length === 0 ? (
                                    <div className="text-sm text-muted-foreground p-10 text-center italic">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                            <Calendar className="h-6 w-6 opacity-30" />
                                        </div>
                                        Belum ada jadwal rapat terdekat.
                                    </div>
                                ) : (
                                    <div className="flex flex-col divide-y">
                                        {/* Hari Ini */}
                                        <div className="p-5">
                                            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                                HARI INI
                                            </div>
                                            {outageMeetings.today.length > 0 ? (
                                                <div className="space-y-4">
                                                    {outageMeetings.today.map((mtg, i) => (
                                                        <div key={`t-${i}`} className="flex items-start gap-4 p-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/50 to-white dark:border-blue-900/30 dark:from-blue-950/20 dark:to-background shadow-sm hover:shadow transition-all relative overflow-hidden group">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shrink-0">
                                                                <Clock className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-sm">
                                                                        {mtg.type}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-bold text-foreground leading-tight mb-1">{mtg.mesin}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{mtg.jenis} · {mtg.scope}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/20 rounded-xl border border-dashed">
                                                    <p className="text-sm text-muted-foreground italic">Tidak ada rapat hari ini.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Mendatang */}
                                        <div className="p-5 bg-muted/5">
                                            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" />
                                                AKAN DATANG
                                            </div>
                                            {outageMeetings.upcoming.length > 0 ? (
                                                <div className="space-y-4">
                                                    {outageMeetings.upcoming.map((mtg, i) => (
                                                        <div key={`u-${i}`} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-accent-foreground/10 transition-all">
                                                            <div className="flex flex-col items-center justify-center w-12 shrink-0 py-1.5 border rounded-lg bg-muted/30">
                                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{new Date(mtg.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                                <span className="text-lg font-bold text-foreground leading-none mt-0.5">{new Date(mtg.date).getDate()}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0 pt-0.5">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50/50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 shadow-sm">
                                                                        {mtg.type}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-bold text-foreground leading-tight mb-1">{mtg.mesin}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{mtg.jenis} · {mtg.scope}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/20 rounded-xl border border-dashed">
                                                    <p className="text-sm text-muted-foreground italic">Tidak ada rapat mendatang.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
