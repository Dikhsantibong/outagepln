import { useState, useEffect, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wallet, FileText, BarChart3, Search, AlertCircle, TrendingUp, TrendingDown, DollarSign, CheckCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface OutagePlan {
    id: number;
    mesin_pembangkit: string;
    jenis_pembangkit: string;
    progress: number;
    kinerja_cost: {
        anggaran_rencana: number | null;
        anggaran_aktual: number | null;
        eviden_url: string | null;
    } | null;
}

export default function OnCost({ outagePlans }: { outagePlans: OutagePlan[] }) {
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [selectedPlan, setSelectedPlan] = useState<OutagePlan | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const stats = useMemo(() => {
        let lengkap = 0;
        let sebagian = 0;
        let belum = 0;
        outagePlans.forEach(plan => {
            const isFilled = plan.kinerja_cost?.anggaran_rencana && plan.kinerja_cost?.anggaran_aktual;
            const isPartial = plan.kinerja_cost?.anggaran_rencana && !plan.kinerja_cost?.anggaran_aktual;
            if (isFilled) lengkap++;
            else if (isPartial) sebagian++;
            else belum++;
        });
        return [
            { name: 'Lengkap', value: lengkap, color: '#10b981' },
            { name: 'Sebagian', value: sebagian, color: '#f59e0b' },
            { name: 'Belum Diinput', value: belum, color: '#64748b' }
        ];
    }, [outagePlans]);

    const safeSearch = String(searchQuery || '').toLowerCase();
    const filteredPlans = outagePlans.filter(plan => {
        const mesin = String(plan?.mesin_pembangkit || '').toLowerCase();
        const jenis = String(plan?.jenis_pembangkit || '').toLowerCase();
        const matchesSearch = mesin.includes(safeSearch) || jenis.includes(safeSearch);
        
        let matchesStatus = true;
        if (filterStatus !== 'all') {
            const isFilled = plan.kinerja_cost?.anggaran_rencana && plan.kinerja_cost?.anggaran_aktual;
            const isPartial = plan.kinerja_cost?.anggaran_rencana && !plan.kinerja_cost?.anggaran_aktual;
            const status = isFilled ? 'lengkap' : isPartial ? 'sebagian' : 'belum';
            matchesStatus = status === filterStatus;
        }

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    const paginatedPlans = filteredPlans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const { data, setData, post, processing } = useForm({
        outage_plan_id: '',
        anggaran_rencana: '',
        anggaran_aktual: '',
        eviden: null as File | null,
    });

    // Sync form when selection changes
    useEffect(() => {
        if (selectedPlanId) {
            const plan = outagePlans.find(p => p.id.toString() === selectedPlanId) || null;
            setSelectedPlan(plan);
            
            if (plan) {
                setData({
                    outage_plan_id: plan.id.toString(),
                    anggaran_rencana: plan.kinerja_cost?.anggaran_rencana?.toString() || '',
                    anggaran_aktual: plan.kinerja_cost?.anggaran_aktual?.toString() || '',
                    eviden: null,
                });
            }
        } else {
            setSelectedPlan(null);
        }
    }, [selectedPlanId, outagePlans]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('kinerja.on-cost.store'), {
            onSuccess: () => {
                toast.success('Data On Cost berhasil disimpan');
            },
            onError: () => {
                toast.error('Gagal menyimpan data');
            }
        });
    };

    const formatRupiah = (value: number | string) => {
        if (!value) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(value));
    };

    const plannedCost = Number(data.anggaran_rencana || selectedPlan?.kinerja_cost?.anggaran_rencana || 0);
    const actualCost = Number(data.anggaran_aktual || selectedPlan?.kinerja_cost?.anggaran_aktual || 0);
    
    // Calculate percentage
    const costPercentage = plannedCost > 0 ? (actualCost / plannedCost) * 100 : 0;
    const isOverBudget = actualCost > plannedCost;
    const isUnderBudget = actualCost > 0 && actualCost <= plannedCost;

    const comparisonChartData = paginatedPlans.map(plan => {
        const name = plan.mesin_pembangkit.length > 12 ? plan.mesin_pembangkit.substring(0, 12) + '...' : plan.mesin_pembangkit;
        
        return {
            name,
            fullName: plan.mesin_pembangkit,
            'Rencana (Juta)': Math.round((plan.kinerja_cost?.anggaran_rencana || 0) / 1000000),
            'Aktual (Juta)': Math.round((plan.kinerja_cost?.anggaran_aktual || 0) / 1000000)
        };
    });

    const chartData = selectedPlan ? [
        {
            name: 'Anggaran (Rp)',
            'Rencana': plannedCost,
            'Aktual': actualCost,
        }
    ] : [];

    return (
        <>
            <Head title="Kinerja - On Cost" />
            <div className="flex-1 p-4 md:p-8 pt-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">On Cost</h2>
                        <p className="text-muted-foreground text-sm">Pantau efisiensi anggaran Rencana vs Aktual secara otomatis.</p>
                    </div>
                </div>

                <div className="mb-6 max-w-md relative z-50">
                    <Label className="mb-2 block">Cari Mesin Pembangkit</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Ketik nama mesin..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            className="pl-10 h-12 bg-white dark:bg-slate-900 shadow-sm border-slate-300 dark:border-slate-800 focus-visible:ring-primary"
                        />
                    </div>
                    {isDropdownOpen && (
                        <div className="absolute w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-xl max-h-60 overflow-auto">
                            {filteredPlans.length > 0 ? (
                                filteredPlans.map(plan => (
                                    <div
                                        key={plan.id}
                                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-0 border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setSelectedPlanId(plan.id.toString());
                                            setSearchQuery(`${plan.mesin_pembangkit} - ${plan.jenis_pembangkit}`);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <div>
                                            <div className="font-medium text-sm">{plan.mesin_pembangkit}</div>
                                            <div className="text-xs text-muted-foreground">{plan.jenis_pembangkit}</div>
                                        </div>
                                        <div className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-full">
                                            {plan.progress}%
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-center text-muted-foreground italic">Tidak ada mesin yang cocok.</div>
                            )}
                        </div>
                    )}
                </div>

                {selectedPlan ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: INPUT FORMS */}
                        <div className="lg:col-span-5 space-y-6">
                            
                            <Card className="border-blue-100 shadow-md">
                                <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b pb-4">
                                    <CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Input Anggaran (Rp)
                                    </CardTitle>
                                    <CardDescription>Masukkan nilai anggaran Rencana dan realisasi Aktualnya.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={submit} className="space-y-6">
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Anggaran Disepakati (Rencana)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">Rp</span>
                                                    <Input 
                                                        type="number" 
                                                        value={data.anggaran_rencana} 
                                                        onChange={e => setData('anggaran_rencana', e.target.value)} 
                                                        placeholder="0"
                                                        className="pl-9 font-mono"
                                                        required 
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground font-semibold text-right">{formatRupiah(data.anggaran_rencana)}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Realisasi Anggaran (Aktual)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">Rp</span>
                                                    <Input 
                                                        type="number" 
                                                        value={data.anggaran_aktual} 
                                                        onChange={e => setData('anggaran_aktual', e.target.value)} 
                                                        placeholder="0 (Isi saat realisasi)"
                                                        className="pl-9 font-mono"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground font-semibold text-right">{formatRupiah(data.anggaran_aktual)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <Label>Eviden Dokumen (Opsional)</Label>
                                            <div className="flex items-center gap-3">
                                                <Input 
                                                    type="file" 
                                                    className="flex-1"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={e => setData('eviden', e.target.files ? e.target.files[0] : null)} 
                                                />
                                                {selectedPlan.kinerja_cost?.eviden_url && (
                                                    <a href={selectedPlan.kinerja_cost.eviden_url} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-2 rounded-md hover:underline border border-blue-200 whitespace-nowrap">
                                                        <FileText className="h-4 w-4" /> Lihat
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={processing} className="w-full bg-blue-600 hover:bg-blue-700">
                                            {processing ? 'Menyimpan...' : 'Simpan Data Anggaran'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: CHARTS & STATUS */}
                        <div className="lg:col-span-7 space-y-6">
                            <Card className="h-full shadow-md border-slate-200 dark:border-slate-800">
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                                            Perbandingan Anggaran
                                        </CardTitle>
                                        <CardDescription>Visualisasi pengeluaran dan limit Rencana vs Aktual</CardDescription>
                                    </div>
                                    
                                    {/* STATUS BADGE */}
                                    {actualCost > 0 && plannedCost > 0 && (
                                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${isOverBudget ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                            {isOverBudget ? (
                                                <><TrendingUp className="h-4 w-4" /> OVER BUDGET ({costPercentage.toFixed(1)}%)</>
                                            ) : (
                                                <><TrendingDown className="h-4 w-4" /> ON BUDGET ({costPercentage.toFixed(1)}%)</>
                                            )}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-8 pt-6">
                                    
                                    {/* CHART DURASI */}
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                <XAxis dataKey="name" hide />
                                                <YAxis 
                                                    fontSize={10} 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`}
                                                />
                                                <Tooltip 
                                                    cursor={{fill: 'transparent'}}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    formatter={(value: number) => [formatRupiah(value), 'Nominal']}
                                                />
                                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                                <Bar dataKey="Rencana" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={80} />
                                                <Bar dataKey="Aktual" fill={isOverBudget ? '#ef4444' : '#10b981'} radius={[4, 4, 0, 0]} barSize={80} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm text-center border">
                                        <span className="font-semibold text-slate-600 dark:text-slate-300">Total Anggaran Rencana: </span>
                                        <span className="text-blue-600 font-bold">{formatRupiah(plannedCost)}</span>
                                        <span className="mx-4 text-slate-300">|</span>
                                        <span className="font-semibold text-slate-600 dark:text-slate-300">Sisa Anggaran: </span>
                                        <span className={`font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {isOverBudget ? '-' : ''}{formatRupiah(Math.abs(plannedCost - actualCost))}
                                        </span>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="col-span-1 lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">Perbandingan Anggaran Rencana vs Aktual</CardTitle>
                                            <CardDescription>Komparasi data On Cost dari {paginatedPlans.length} mesin pada halaman ini.</CardDescription>
                                        </div>
                                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[250px] w-full mt-2">
                                        {comparisonChartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                                    <Bar dataKey="Rencana (Juta)" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                    <Bar dataKey="Aktual (Juta)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                Tidak ada data untuk ditampilkan
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex flex-col gap-4">
                                <Card className="border-emerald-200 dark:border-emerald-900/50 shadow-sm bg-emerald-50/50 dark:bg-emerald-950/20 flex-1">
                                    <CardContent className="p-4 flex items-center gap-4 h-full">
                                        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <CheckCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-600/80 dark:text-emerald-400/80">Anggaran Rencana & Aktual Terisi</p>
                                            <h4 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats[0].value} <span className="text-sm font-normal text-emerald-600/60">Mesin</span></h4>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-amber-200 dark:border-amber-900/50 shadow-sm bg-amber-50/50 dark:bg-amber-950/20 flex-1">
                                    <CardContent className="p-4 flex items-center gap-4 h-full">
                                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-amber-600/80 dark:text-amber-400/80">Anggaran Aktual Belum Terisi</p>
                                            <h4 className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats[1].value} <span className="text-sm font-normal text-amber-600/60">Mesin</span></h4>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/20 flex-1">
                                    <CardContent className="p-4 flex items-center gap-4 h-full">
                                        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum Diinput</p>
                                            <h4 className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats[2].value} <span className="text-sm font-normal text-slate-500">Mesin</span></h4>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Wallet className="h-5 w-5 text-primary" />
                                        Daftar Mesin Pembangkit
                                    </CardTitle>
                                    <CardDescription>Pilih mesin untuk mengisi data On Cost. Total {filteredPlans.length} data.</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                        <button onClick={() => { setFilterStatus('all'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Semua</button>
                                        <button onClick={() => { setFilterStatus('lengkap'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${filterStatus === 'lengkap' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><CheckCircle className="h-3 w-3" /> Rencana & Aktual</button>
                                        <button onClick={() => { setFilterStatus('sebagian'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${filterStatus === 'sebagian' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><AlertCircle className="h-3 w-3" /> Aktual Kosong</button>
                                        <button onClick={() => { setFilterStatus('belum'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${filterStatus === 'belum' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><FileText className="h-3 w-3" /> Belum Diinput</button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredPlans.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                                            <TableRow>
                                                <TableHead className="w-[300px] pl-6">Mesin Pembangkit</TableHead>
                                                <TableHead>Jenis</TableHead>
                                                <TableHead>Progres</TableHead>
                                                <TableHead>Status Input</TableHead>
                                                <TableHead className="text-right pr-6">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedPlans.map(plan => {
                                                const isFilled = plan.kinerja_cost?.anggaran_rencana && plan.kinerja_cost?.anggaran_aktual;
                                                const isPartial = plan.kinerja_cost?.anggaran_rencana && !plan.kinerja_cost?.anggaran_aktual;
                                                
                                                return (
                                                    <TableRow key={plan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <TableCell className="font-bold pl-6">{plan.mesin_pembangkit}</TableCell>
                                                        <TableCell className="text-muted-foreground font-medium text-xs">{plan.jenis_pembangkit}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${plan.progress}%` }}></div>
                                                                </div>
                                                                <span className="text-xs font-bold">{plan.progress}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isFilled ? (
                                                                <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1.5 shadow-none"><CheckCircle className="h-3 w-3" /> Rencana & Aktual Terisi</Badge>
                                                            ) : isPartial ? (
                                                                <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 gap-1.5 shadow-none"><AlertCircle className="h-3 w-3" /> Aktual Belum Terisi</Badge>
                                                            ) : (
                                                                <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 gap-1.5 shadow-none"><FileText className="h-3 w-3" /> Belum Diinput</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Button size="sm" variant="outline" className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all shadow-sm" onClick={() => {
                                                                setSelectedPlanId(plan.id.toString());
                                                                setSearchQuery(`${plan.mesin_pembangkit} - ${plan.jenis_pembangkit}`);
                                                            }}>
                                                                Isi Data
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                        <Filter className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Tidak Ada Data Ditemukan</h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">Coba sesuaikan kata kunci pencarian atau ubah filter status Anda untuk melihat hasil.</p>
                                    {(searchQuery || filterStatus !== 'all') && (
                                        <Button variant="outline" size="sm" className="mt-6" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>
                                            Reset Semua Filter
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        
                        {filteredPlans.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-slate-800 p-4 px-6 flex flex-col md:flex-row items-center justify-between bg-slate-50/30 dark:bg-slate-900/30 gap-4">
                                <div className="text-xs text-muted-foreground">
                                    Menampilkan <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, filteredPlans.length)}</span> dari total <span className="font-bold text-foreground">{filteredPlans.length}</span> data
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8 bg-white dark:bg-slate-950 shadow-sm" 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1 mx-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum = currentPage;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <Button 
                                                    key={`page-${pageNum}`}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    className={`h-8 w-8 p-0 text-xs shadow-sm ${currentPage === pageNum ? '' : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'}`}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8 bg-white dark:bg-slate-950 shadow-sm" 
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
                )}
            </div>
        </>
    );
}
