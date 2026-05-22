import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    Calendar, ReceiptText, ArrowUpRight, TrendingUp, Info,
    AlertTriangle, Zap, CheckCircle, Clock, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
    RadialBarChart, RadialBar
} from 'recharts';

interface PlantProgress {
    progress: number;
    count: number;
}

interface DashboardProps {
    stats: {
        outage: {
            total: number;
            progress: Record<string, PlantProgress>;
            byScope: { scope: string; total: number }[];
        };
        tagihan: {
            nilai_kontrak: number;
            terbayar: number;
            belum_terbayar: number;
            byUnit: { pembangkit: string; nilai_kontrak: number; terbayar: number; belum_terbayar: number }[];
            byYear: { tahun: number; nilai_kontrak: number; terbayar: number; belum_terbayar: number }[];
        };
        meetings: {
            active: number;
            total: number;
        };
    };
    recentActivities: {
        title: string;
        time: string;
        type: string;
    }[];
    outageMeetings: {
        today: { id: number; mesin: string; scope: string; jenis: string; type: string; date: string }[];
        upcoming: { id: number; mesin: string; scope: string; jenis: string; type: string; date: string }[];
    };
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const PLANT_CONFIG: Record<string, { color: string; gradient: string; icon: string }> = {
    PLTD:  { color: '#3b82f6', gradient: 'from-blue-500/10 to-blue-600/5',    icon: '⚡' },
    PLTM:  { color: '#10b981', gradient: 'from-emerald-500/10 to-emerald-600/5', icon: '💧' },
    PLTMG: { color: '#f59e0b', gradient: 'from-amber-500/10 to-amber-600/5',  icon: '🔥' },
};

export default function Dashboard({ stats, recentActivities, outageMeetings }: DashboardProps) {
    const fmt = (value: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const fmtShort = (value: number) => {
        if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
        if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
        if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
        return `Rp ${value}`;
    };

    // Prepare chart data
    const financialByUnit = stats.tagihan.byUnit.map(u => ({
        name: u.pembangkit,
        'Nilai Kontrak': u.nilai_kontrak,
        'Terbayar': u.terbayar,
        'Belum Terbayar': u.belum_terbayar,
    }));

    const financialByYear = stats.tagihan.byYear.map(y => ({
        name: String(y.tahun),
        'Nilai Kontrak': y.nilai_kontrak,
        'Terbayar': y.terbayar,
        'Belum Terbayar': y.belum_terbayar,
    }));

    const scopeData = stats.outage.byScope.map(s => ({ name: s.scope, value: s.total }));

    // Payment ratio for donut
    const paymentDonut = [
        { name: 'Terbayar', value: stats.tagihan.terbayar, color: '#10b981' },
        { name: 'Belum Terbayar', value: stats.tagihan.belum_terbayar, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const paymentRatio = stats.tagihan.nilai_kontrak > 0
        ? ((stats.tagihan.terbayar / stats.tagihan.nilai_kontrak) * 100).toFixed(1)
        : '0';

    return (
        <>
            <Head title="Dashboard Overview" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 pb-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitoring real-time progres outage dan status finansial tagihan
                    </p>
                </div>

                {/* ─── SECTION 0: Akumulasi Data ─── */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Rencana</p>
                                <p className="text-2xl font-bold">{stats.outage.total}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center dark:bg-slate-800 dark:text-slate-400">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Outage PLTD</p>
                                <p className="text-2xl font-bold">{stats.outage.progress['PLTD']?.count || 0}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-400">
                                <span className="text-lg">⚡</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Outage PLTM</p>
                                <p className="text-2xl font-bold">{stats.outage.progress['PLTM']?.count || 0}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center dark:bg-emerald-900/30 dark:text-emerald-400">
                                <span className="text-lg">💧</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Outage PLTMG</p>
                                <p className="text-2xl font-bold">{stats.outage.progress['PLTMG']?.count || 0}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center dark:bg-amber-900/30 dark:text-amber-400">
                                <span className="text-lg">🔥</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── SECTION 1: Plant Progress ─── */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Progres Outage per Jenis Pembangkit</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {Object.entries(stats.outage.progress).map(([type, data]) => {
                            const cfg = PLANT_CONFIG[type] || PLANT_CONFIG.PLTD;
                            const chartData = [{ name: type, value: data.progress, fill: cfg.color }];
                            return (
                                <Card key={type} className={`overflow-hidden bg-gradient-to-br ${cfg.gradient} border shadow-sm hover:shadow-md transition-shadow`}>
                                    <CardContent className="pt-5 pb-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{cfg.icon}</span>
                                                <span className="text-sm font-bold tracking-wide">{type}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                {data.count} unit
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <div className="relative h-[140px] w-[140px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadialBarChart
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius="70%"
                                                        outerRadius="100%"
                                                        startAngle={90}
                                                        endAngle={-270}
                                                        data={chartData}
                                                        barSize={12}
                                                    >
                                                        <RadialBar
                                                            dataKey="value"
                                                            cornerRadius={6}
                                                            background={{ fill: 'hsl(var(--muted))' }}
                                                        />
                                                    </RadialBarChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-black tracking-tight" style={{ color: cfg.color }}>
                                                        {data.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-medium text-center mt-1">Rata-rata penyelesaian</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* ─── SECTION 2: Financial Summary Cards ─── */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <ReceiptText className="h-4 w-4 text-amber-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ringkasan Tagihan OH</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Nilai Kontrak */}
                        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg shadow-blue-600/20">
                            <CardContent className="pt-5 pb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="h-4 w-4 opacity-70" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Total Nilai Kontrak</span>
                                </div>
                                <div className="text-2xl font-black tracking-tight">{fmt(stats.tagihan.nilai_kontrak)}</div>
                                <p className="text-[10px] opacity-60 mt-2">Akumulasi seluruh nilai kontrak</p>
                            </CardContent>
                        </Card>

                        {/* Terbayar */}
                        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10">
                            <CardContent className="pt-5 pb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Sudah Terbayar</span>
                                </div>
                                <div className="text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-300">{fmt(stats.tagihan.terbayar)}</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(Number(paymentRatio), 100)}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600">{paymentRatio}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Belum Terbayar */}
                        <Card className="border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 relative overflow-hidden">
                            <div className="absolute -top-2 -right-2 opacity-[0.06]">
                                <AlertTriangle className="h-20 w-20 text-rose-500" />
                            </div>
                            <CardContent className="pt-5 pb-4 relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Belum Terbayar</span>
                                </div>
                                <div className="text-2xl font-black tracking-tight text-rose-700 dark:text-rose-300">{fmt(stats.tagihan.belum_terbayar)}</div>
                                <p className="text-[10px] text-rose-500/70 mt-2 font-medium">Sisa kewajiban outstanding</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ─── SECTION 3: Charts Row 1 — Financial Comparison & Payment Ratio ─── */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Grouped Bar: Financial by Unit */}
                    <Card className="lg:col-span-3">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-blue-500" />
                                        Perbandingan Finansial per Pembangkit
                                    </CardTitle>
                                    <CardDescription className="mt-1">Nilai kontrak, pembayaran, dan tunggakan per unit</CardDescription>
                                </div>
                                <Badge variant="outline" className="font-mono text-[10px]">{new Date().getFullYear()}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[320px] pt-2">
                            {financialByUnit.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={financialByUnit} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} width={70} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                            formatter={(value: any) => fmt(Number(value))}
                                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '12px' }}
                                        />
                                        <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                        <Bar dataKey="Nilai Kontrak" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Bar dataKey="Terbayar" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Bar dataKey="Belum Terbayar" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">Belum ada data tagihan</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Donut: Payment Ratio */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4 text-emerald-500" />
                                Rasio Pembayaran
                            </CardTitle>
                            <CardDescription className="mt-1">Proporsi terbayar vs belum terbayar</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[320px] pt-2">
                            {paymentDonut.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentDonut}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                            strokeWidth={2}
                                            stroke="var(--background)"
                                        >
                                            {paymentDonut.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => fmt(Number(value))}
                                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '12px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                        <text x="50%" y="43%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-black">
                                            {paymentRatio}%
                                        </text>
                                        <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
                                            Terbayar
                                        </text>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">Belum ada data pembayaran</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ─── SECTION 4: Charts Row 2 — Trend & Scope ─── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Line Chart: Trend per Tahun */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-indigo-500" />
                                Tren Finansial per Tahun
                            </CardTitle>
                            <CardDescription className="mt-1">Perkembangan nilai kontrak dan pembayaran</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] pt-2">
                            {financialByYear.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={financialByYear} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} width={70} />
                                        <Tooltip
                                            formatter={(value: any) => fmt(Number(value))}
                                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '12px' }}
                                        />
                                        <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                        <Line type="monotone" dataKey="Nilai Kontrak" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Terbayar" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Belum Terbayar" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">Belum ada data tren</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pie Chart: Scope Distribution */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4 text-amber-500" />
                                Distribusi Scope Outage
                            </CardTitle>
                            <CardDescription className="mt-1">Jumlah pekerjaan berdasarkan jenis scope</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] pt-2">
                            {scopeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={scopeData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={2}
                                            stroke="var(--background)"
                                        >
                                            {scopeData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '12px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">Belum ada data scope</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ─── SECTION 5: Activity & System Info ─── */}
                <div className="grid gap-6 lg:grid-cols-7">
                    <Card className="lg:col-span-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Aktivitas Terbaru
                            </CardTitle>
                            <CardDescription>Update terakhir dari modul outage dan tagihan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors group">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.type === 'Outage' ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                                                {item.type === 'Outage'
                                                    ? <Calendar className="h-4 w-4 text-blue-500" />
                                                    : <ReceiptText className="h-4 w-4 text-amber-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.title}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                    <span>{item.time}</span>
                                                    <Badge variant="outline" className="text-[9px] py-0 h-4 px-1.5">{item.type}</Badge>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <Info className="h-6 w-6 mb-2 opacity-20" />
                                        <p className="text-sm italic">Belum ada aktivitas tercatat</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                Informasi Sistem
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-medium">Total Outage Plans</span>
                                    </div>
                                    <Badge variant="secondary" className="font-mono">{stats.outage.total}</Badge>
                                </div>
                                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ReceiptText className="h-4 w-4 text-amber-500" />
                                        <span className="text-xs font-medium">Total Tagihan OH</span>
                                    </div>
                                    <Badge variant="secondary" className="font-mono">{stats.tagihan.byUnit.reduce((a, b) => a + 1, 0)}</Badge>
                                </div>
                                <div className="p-3 rounded-lg border flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Rapat Aktif</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">{stats.meetings.active} / {stats.meetings.total}</span>
                                </div>

                                <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-200">
                                        Dashboard menampilkan data real-time dari database. Seluruh metrik diperbarui secara otomatis setiap kali halaman dimuat.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── SECTION 6: Jadwal Rapat Outage ─── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Hari Ini */}
                    <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
                        <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-800/50">
                            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                <Calendar className="h-4 w-4" />
                                Jadwal Rapat Hari Ini
                            </CardTitle>
                            <CardDescription>Rapat persiapan outage yang dijadwalkan hari ini</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {outageMeetings.today.length > 0 ? (
                                    outageMeetings.today.map((mtg, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border shadow-sm">
                                            <div className="h-10 w-10 rounded-md flex flex-col items-center justify-center shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                <span className="text-[10px] font-bold uppercase">{mtg.type}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{mtg.mesin}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5">{mtg.jenis}</Badge>
                                                    <span className="text-[11px] text-muted-foreground font-medium">{mtg.scope}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                        <CheckCircle className="h-6 w-6 mb-2 opacity-20 text-emerald-500" />
                                        <p className="text-sm italic">Tidak ada jadwal rapat hari ini</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Yang Akan Datang */}
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-amber-500" />
                                Jadwal Rapat Mendatang
                            </CardTitle>
                            <CardDescription>5 jadwal rapat persiapan outage terdekat</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {outageMeetings.upcoming.length > 0 ? (
                                    outageMeetings.upcoming.map((mtg, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                                            <div className="text-center w-12 shrink-0">
                                                <span className="block text-xs font-bold text-amber-600 dark:text-amber-500">{new Date(mtg.date).getDate()}</span>
                                                <span className="block text-[10px] uppercase text-muted-foreground">{new Date(mtg.date).toLocaleString('id-ID', { month: 'short' })}</span>
                                            </div>
                                            <div className="h-8 w-px bg-border shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{mtg.mesin}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Badge variant="secondary" className="text-[9px] py-0 h-3.5 px-1 rounded-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{mtg.type}</Badge>
                                                    <span className="text-[10px] text-muted-foreground">{mtg.scope}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                        <Info className="h-6 w-6 mb-2 opacity-20" />
                                        <p className="text-sm italic">Belum ada jadwal rapat mendatang</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
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
