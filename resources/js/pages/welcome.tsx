import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { login } from '@/routes';
import { ArrowRight, Activity, Calendar, Zap, BarChart3, Users, Building, ChevronRight, LayoutDashboard } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell
} from 'recharts';

interface WelcomeProps {
    canLogin: boolean;
    stats: {
        total: number;
        plantStats: Record<string, { count: number; progress: number }>;
        scopeDistribution: { scope: string; total: number }[];
        progressDistribution: { range: string; count: number }[];
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
            <Head title="Welcome to OutagePLN" />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500/30">
                {/* Navbar */}
                <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                        <div className="flex items-center gap-3">
                            <img src="/sidebar-logo.png" alt="Logo PLN" className="h-12 w-auto object-contain" />
                            <div>
                                <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Outage Monitoring
                                </p>
                                <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                                    PLN Outage Hub
                                </p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-4">
                            {canLogin && (
                                <Link href="/login">
                                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2">
                                        Login
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="relative overflow-hidden pb-20 pt-24 text-white">
                        <div className="absolute inset-0">
                            <img src="/hero.png" alt="Hero Background" className="h-full w-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/90 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40"></div>
                        <div className="container relative z-10 mx-auto px-4 md:px-8 flex flex-col items-center text-center">
                            <div className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm font-medium text-blue-200 backdrop-blur-md mb-6">
                                <Activity className="mr-2 h-4 w-4" />
                                Real-time Outage Monitoring
                            </div>
                            <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                                PLN Outage <br className="hidden sm:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                    Operations System
                                </span>
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg text-blue-100/80 sm:text-xl">
                                Platform terpadu untuk memonitor, mengelola, dan menganalisa seluruh rencana pemeliharaan pembangkit (Outage Plan) secara real-time.
                            </p>

                            <div className="mt-12 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/40">
                                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Rapat Berlangsung</p>
                                    <p className="mt-3 text-3xl font-semibold text-white">{stats.meetings.active}</p>
                                    <p className="mt-2 text-sm text-slate-500">Agenda aktif saat ini</p>
                                </div>
                                <div className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
                                    <p className="text-sm uppercase tracking-[0.24em] text-slate-700">Rapat Mendatang</p>
                                    <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.meetings.upcoming}</p>
                                    <p className="mt-2 text-sm text-slate-500">Total jadwal rapat yang belum berlangsung</p>
                                </div>
                                <div className="rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/30">
                                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Jadwal Terdekat</p>
                                    {stats.meetings.nextMeeting ? (
                                        <>
                                            <p className="mt-3 text-2xl font-semibold text-white">{stats.meetings.nextMeeting.date}</p>
                                            <p className="mt-2 text-sm text-slate-400">{stats.meetings.nextMeeting.label}</p>
                                        </>
                                    ) : (
                                        <p className="mt-3 text-xl font-semibold text-white">Belum ada</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Floating Stats below Hero */}
                        <div className="container relative z-10 mx-auto px-4 md:px-8 mt-20">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                            <Building className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-blue-200">Total Rencana Outage</p>
                                            <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-blue-200">Rapat Aktif (Berlangsung)</p>
                                            <h3 className="text-3xl font-bold text-white">{stats.meetings.active}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-blue-200">Rapat Mendatang</p>
                                            <h3 className="text-3xl font-bold text-white">{stats.meetings.upcoming}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Dashboard Preview Section */}
                    <section className="py-24 bg-white dark:bg-slate-950">
                        <div className="container mx-auto px-4 md:px-8">
                            <div className="mb-16 text-center">
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                                    Overview Data Pembangkit
                                </h2>
                                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                                    Analitik komprehensif mengenai distribusi pekerjaan, progress pelaksanaan, dan jenis pembangkit di seluruh unit.
                                </p>
                            </div>

                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {/* Chart 1: Scope Distribution */}
                                <Card className="lg:col-span-2 shadow-lg border-slate-200/60 dark:border-slate-800">
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

                                {/* Chart 2: Plant Types */}
                                <Card className="shadow-lg border-slate-200/60 dark:border-slate-800 flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                            <Zap className="h-5 w-5 text-amber-500" />
                                            Komposisi Pembangkit
                                        </CardTitle>
                                        <CardDescription>Berdasarkan tipe mesin (PLTD, PLTM, dll)</CardDescription>
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
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-800 bg-slate-950 py-10 text-slate-400">
                    <div className="container mx-auto px-4 md:px-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-4">
                                <img src="/sidebar-logo.png" alt="PLN Logo" className="h-10 w-auto object-contain" />
                                <div>
                                    <p className="text-base font-semibold text-white">PLN Outage Hub</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Monitor jadwal outage dan rapat dengan jelas. Data operasional tersedia 24/7.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span>Support: support@pln.co.id</span>
                                <span className="hidden sm:inline">|</span>
                                <span>Status update real-time</span>
                            </div>
                        </div>
                        <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-600">
                            &copy; {new Date().getFullYear()} PT PLN Nusantara Power. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
