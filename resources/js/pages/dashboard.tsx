import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Calendar, Clock, Activity, Zap, BarChart3 } from 'lucide-react';
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

export default function Dashboard({ stats, recentOutages, outageMeetings }: DashboardProps) {
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
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                </div>

                {/* ROW 1: Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Outage Plan</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">Seluruh rencana pemeliharaan</p>
                        </CardContent>
                    </Card>
                    {Object.entries(stats.plantStats).map(([jenis, data]) => (
                        <Card key={jenis}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{jenis}</CardTitle>
                                <Zap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.count}</div>
                                <p className="text-xs text-muted-foreground">
                                    Rata-rata progres {data.progress}%
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ROW 2: Highlighted Jadwal Rapat */}
                <Card className="border-t-4 border-t-blue-500 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                Jadwal Rapat Outage
                            </CardTitle>
                            <CardDescription className="mt-1">Rapat persiapan outage hari ini dan yang akan datang</CardDescription>
                        </div>
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
                            <div className="grid divide-y lg:divide-y-0 lg:divide-x lg:grid-cols-2">
                                {/* Hari Ini */}
                                <div className="p-6">
                                    <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-5 flex items-center gap-2">
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
                                                        <p className="text-sm font-bold text-foreground mb-0.5">{mtg.mesin}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{mtg.jenis} · {mtg.scope}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed">
                                            <p className="text-sm text-muted-foreground italic">Tidak ada rapat hari ini.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Mendatang */}
                                <div className="p-6 bg-muted/5">
                                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        AKAN DATANG
                                    </div>
                                    {outageMeetings.upcoming.length > 0 ? (
                                        <div className="space-y-4">
                                            {outageMeetings.upcoming.map((mtg, i) => (
                                                <div key={`u-${i}`} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-accent-foreground/10 transition-all">
                                                    <div className="flex flex-col items-center justify-center w-12 shrink-0 py-1 border rounded-lg bg-muted/30">
                                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{new Date(mtg.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                        <span className="text-lg font-bold text-foreground leading-none mt-0.5">{new Date(mtg.date).getDate()}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border bg-amber-50/50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50">
                                                                {mtg.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-foreground truncate">{mtg.mesin}</p>
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{mtg.jenis} · {mtg.scope}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed">
                                            <p className="text-sm text-muted-foreground italic">Tidak ada rapat mendatang.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ROW 3: Scope Distribution (Bar) & Monthly Timeline (Line) */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-indigo-500" />
                                Distribusi Scope Outage
                            </CardTitle>
                            <CardDescription>Jumlah rencana outage berdasarkan scope pekerjaan</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                {scopeBarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={scopeBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip contentStyle={CustomTooltipStyle} />
                                            <Bar dataKey="jumlah" name="Jumlah" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">Belum ada data.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-teal-500" />
                                Timeline Outage Bulanan
                            </CardTitle>
                            <CardDescription>Jumlah outage dimulai per bulan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {timelineData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip contentStyle={CustomTooltipStyle} />
                                            <Line
                                                type="monotone"
                                                dataKey="outage"
                                                name="Outage"
                                                stroke="#14b8a6"
                                                strokeWidth={2.5}
                                                dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#14b8a6' }}
                                                activeDot={{ r: 6, fill: '#14b8a6' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">Belum ada data.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ROW 4: Progress Distribution (Bar) & Durasi Rata-rata per Scope (Line) */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-amber-500" />
                                Distribusi Progres
                            </CardTitle>
                            <CardDescription>Jumlah outage berdasarkan rentang progres</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={progressBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="range" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={CustomTooltipStyle} />
                                        <Bar dataKey="count" name="Jumlah" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-rose-500" />
                                Rata-rata Durasi per Scope
                            </CardTitle>
                            <CardDescription>Durasi rata-rata hari pemeliharaan per jenis scope</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[280px]">
                                {durasiLineData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={durasiLineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} unit=" hr" />
                                            <Tooltip contentStyle={CustomTooltipStyle} formatter={(val: any) => `${val} hari`} />
                                            <Line
                                                type="monotone"
                                                dataKey="durasi"
                                                name="Durasi (hari)"
                                                stroke="#f43f5e"
                                                strokeWidth={2.5}
                                                dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#f43f5e' }}
                                                activeDot={{ r: 6, fill: '#f43f5e' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">Belum ada data.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ROW 5: Recent Outage Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aktivitas Outage Terbaru</CardTitle>
                        <CardDescription>Rencana outage yang terakhir ditambahkan ke sistem</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOutages.length > 0 ? recentOutages.map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted shrink-0">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <p className="text-sm font-medium leading-none truncate">{item.mesin}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.jenis} · {item.scope} · Mulai {item.start_date || '-'}
                                        </p>
                                    </div>
                                    <div className={`text-sm font-bold shrink-0 ${progressColor(item.progress)}`}>
                                        {item.progress}%
                                    </div>
                                    <div className="text-xs text-muted-foreground shrink-0 w-24 text-right">
                                        {item.time}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground italic text-center py-4">Belum ada data.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
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
