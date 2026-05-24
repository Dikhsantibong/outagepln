import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        meetings: { active: number; total: number; upcoming: number };
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
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <Zap className="h-5 w-5 fill-current" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                Outage<span className="text-blue-600">PLN</span>
                            </span>
                        </div>
                        <nav className="flex items-center gap-4">
                            {canLogin && (
                                <Link href={route('login')}>
                                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30">
                                        Login Access
                                    </Button>
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pb-20 pt-24 text-white">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                        <div className="container relative z-10 mx-auto px-4 md:px-8 flex flex-col items-center text-center">
                            <div className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm font-medium text-blue-200 backdrop-blur-md mb-6">
                                <Activity className="mr-2 h-4 w-4" />
                                Real-time Outage Monitoring
                            </div>
                            <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                                Corporate Outage <br className="hidden sm:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                    Management System
                                </span>
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg text-blue-100/80 sm:text-xl">
                                Platform terpadu untuk memonitor, mengelola, dan menganalisa seluruh rencana pemeliharaan pembangkit (Outage Plan) secara real-time.
                            </p>
                            <div className="mt-10 flex flex-wrap justify-center gap-4">
                                {canLogin && (
                                    <Link href={route('login')}>
                                        <Button size="lg" className="rounded-full bg-white text-blue-900 hover:bg-blue-50 hover:text-blue-900 h-12 px-8 font-semibold shadow-xl">
                                            Masuk ke Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
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
                                        <div className="h-[300px]">
                                            {scopeBarData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
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
                                        <div className="h-[250px]">
                                            {pieData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
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
                <footer className="border-t border-border/40 bg-slate-900 py-12 text-slate-400">
                    <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2 text-white">
                            <Zap className="h-5 w-5 fill-current text-blue-500" />
                            <span className="text-lg font-bold tracking-tight">Outage<span className="text-blue-500">PLN</span></span>
                        </div>
                        <p className="text-sm">
                            &copy; {new Date().getFullYear()} PT PLN Nusantara Power UP Kendari. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
