import { useState, useEffect, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Upload, FileText, CheckCircle, BarChart3, AlertCircle, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface OutagePlan {
    id: number;
    mesin_pembangkit: string;
    jenis_pembangkit: string;
    progress: number;
    kinerja_quality: {
        dm_sebelum: number | null;
        sfc_sebelum: number | null;
        eviden_sebelum_url: string | null;
        dm_sesudah: number | null;
        sfc_sesudah: number | null;
        eviden_sesudah_url: string | null;
    } | null;
}

export default function OnQuality({ outagePlans }: { outagePlans: OutagePlan[] }) {
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
            const isFilled = plan.kinerja_quality?.dm_sebelum && plan.kinerja_quality?.dm_sesudah;
            const isPartial = plan.kinerja_quality?.dm_sebelum && !plan.kinerja_quality?.dm_sesudah;
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
            const isFilled = plan.kinerja_quality?.dm_sebelum && plan.kinerja_quality?.dm_sesudah;
            const isPartial = plan.kinerja_quality?.dm_sebelum && !plan.kinerja_quality?.dm_sesudah;
            const status = isFilled ? 'lengkap' : isPartial ? 'sebagian' : 'belum';
            matchesStatus = status === filterStatus;
        }

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    const paginatedPlans = filteredPlans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const { data: formSebelum, setData: setFormSebelum, post: postSebelum, processing: processingSebelum, reset: resetSebelum } = useForm({
        outage_plan_id: '',
        tipe: 'sebelum',
        dm: '',
        sfc: '',
        eviden: null as File | null,
    });

    const { data: formSesudah, setData: setFormSesudah, post: postSesudah, processing: processingSesudah, reset: resetSesudah } = useForm({
        outage_plan_id: '',
        tipe: 'sesudah',
        dm: '',
        sfc: '',
        eviden: null as File | null,
    });

    // Sync forms when selection changes
    useEffect(() => {
        if (selectedPlanId) {
            const plan = outagePlans.find(p => p.id.toString() === selectedPlanId) || null;
            setSelectedPlan(plan);
            
            if (plan) {
                setFormSebelum({
                    outage_plan_id: plan.id.toString(),
                    tipe: 'sebelum',
                    dm: plan.kinerja_quality?.dm_sebelum?.toString() || '',
                    sfc: plan.kinerja_quality?.sfc_sebelum?.toString() || '',
                    eviden: null,
                });
                setFormSesudah({
                    outage_plan_id: plan.id.toString(),
                    tipe: 'sesudah',
                    dm: plan.kinerja_quality?.dm_sesudah?.toString() || '',
                    sfc: plan.kinerja_quality?.sfc_sesudah?.toString() || '',
                    eviden: null,
                });
            }
        } else {
            setSelectedPlan(null);
        }
    }, [selectedPlanId, outagePlans]);

    const submitSebelum = (e: React.FormEvent) => {
        e.preventDefault();
        postSebelum('/kinerja/on-quality', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data Sebelum Overhaul berhasil disimpan');
            },
            onError: () => {
                toast.error('Gagal menyimpan data');
            }
        });
    };

    const submitSesudah = (e: React.FormEvent) => {
        e.preventDefault();
        postSesudah('/kinerja/on-quality', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data Sesudah Overhaul berhasil disimpan');
            },
            onError: () => {
                toast.error('Gagal menyimpan data');
            }
        });
    };

    // Chart Data Preparation
    const dmChartData = selectedPlan ? [
        {
            name: 'Daya Mampu',
            'Sebelum OH': Number(formSebelum.dm || selectedPlan.kinerja_quality?.dm_sebelum || 0),
            'Sesudah OH': Number(formSesudah.dm || selectedPlan.kinerja_quality?.dm_sesudah || 0),
        }
    ] : [];

    const comparisonChartData = paginatedPlans.map(plan => {
        const name = plan.mesin_pembangkit.length > 12 ? plan.mesin_pembangkit.substring(0, 12) + '...' : plan.mesin_pembangkit;
        
        return {
            name,
            fullName: plan.mesin_pembangkit,
            'Sebelum (MW)': plan.kinerja_quality?.dm_sebelum || 0,
            'Sesudah (MW)': plan.kinerja_quality?.dm_sesudah || 0
        };
    });

    const sfcChartData = selectedPlan ? [
        {
            name: 'SFC',
            'Sebelum OH': Number(formSebelum.sfc || selectedPlan.kinerja_quality?.sfc_sebelum || 0),
            'Sesudah OH': Number(formSesudah.sfc || selectedPlan.kinerja_quality?.sfc_sesudah || 0),
        }
    ] : [];

    return (
        <>
            <Head title="Kinerja - On Quality" />
            <div className="flex-1 p-4 md:p-8 pt-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">On Quality</h2>
                        <p className="text-muted-foreground text-sm">Input dan pantau evaluasi Daya Mampu & SFC sebelum dan sesudah Overhaul.</p>
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
                                            e.preventDefault(); // Prevent focus loss on input
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
                            {/* FORM SEBELUM OH */}
                            <Card className="border-blue-100 shadow-md">
                                <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b pb-4">
                                    <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Sebelum Overhaul (OH)</CardTitle>
                                    <CardDescription>Data historis / evaluasi sebelum pekerjaan dimulai</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={submitSebelum} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Daya Mampu (MW)</Label>
                                                <Input 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={formSebelum.dm} 
                                                    onChange={e => setFormSebelum('dm', e.target.value)} 
                                                    placeholder="Contoh: 10.5" 
                                                    required 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>SFC</Label>
                                                <Input 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={formSebelum.sfc} 
                                                    onChange={e => setFormSebelum('sfc', e.target.value)} 
                                                    placeholder="Contoh: 0.25" 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Eviden Dokumen (PDF/JPG)</Label>
                                            <div className="flex items-center gap-3">
                                                <Input 
                                                    type="file" 
                                                    className="flex-1"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={e => setFormSebelum('eviden', e.target.files ? e.target.files[0] : null)} 
                                                />
                                                {selectedPlan.kinerja_quality?.eviden_sebelum_url && (
                                                    <a href={selectedPlan.kinerja_quality.eviden_sebelum_url} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-2 rounded-md hover:underline border border-blue-200">
                                                        <FileText className="h-4 w-4" /> Lihat
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={processingSebelum} className="w-full bg-blue-600 hover:bg-blue-700">
                                            {processingSebelum ? 'Menyimpan...' : 'Simpan Data Sebelum OH'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* FORM SESUDAH OH */}
                            <Card className={selectedPlan.progress < 100 ? "opacity-75 border-slate-200" : "border-emerald-200 shadow-md"}>
                                <CardHeader className={`border-b pb-4 ${selectedPlan.progress < 100 ? "bg-slate-50 dark:bg-slate-900" : "bg-emerald-50/50 dark:bg-emerald-900/10"}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className={`text-lg ${selectedPlan.progress < 100 ? "text-slate-500" : "text-emerald-700 dark:text-emerald-400"}`}>Sesudah Overhaul (OH)</CardTitle>
                                            <CardDescription>Data aktual setelah pekerjaan selesai</CardDescription>
                                        </div>
                                        {selectedPlan.progress < 100 && (
                                            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                                                <AlertCircle className="h-3 w-3" /> Progres belum 100%
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 relative">
                                    {/* Overlay if not 100% */}
                                    {selectedPlan.progress < 100 && (
                                        <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg border">
                                                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                                <p className="font-semibold text-sm">Form Terkunci</p>
                                                <p className="text-xs text-muted-foreground mt-1">Pekerjaan harus 100% selesai untuk mengisi hasil.</p>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={submitSesudah} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Daya Mampu (MW)</Label>
                                                <Input 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={formSesudah.dm} 
                                                    onChange={e => setFormSesudah('dm', e.target.value)} 
                                                    placeholder="Contoh: 12.0" 
                                                    required 
                                                    disabled={selectedPlan.progress < 100}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>SFC</Label>
                                                <Input 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={formSesudah.sfc} 
                                                    onChange={e => setFormSesudah('sfc', e.target.value)} 
                                                    placeholder="Contoh: 0.22" 
                                                    required 
                                                    disabled={selectedPlan.progress < 100}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Eviden Dokumen (PDF/JPG)</Label>
                                            <div className="flex items-center gap-3">
                                                <Input 
                                                    type="file" 
                                                    className="flex-1"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={e => setFormSesudah('eviden', e.target.files ? e.target.files[0] : null)} 
                                                    disabled={selectedPlan.progress < 100}
                                                />
                                                {selectedPlan.kinerja_quality?.eviden_sesudah_url && (
                                                    <a href={selectedPlan.kinerja_quality.eviden_sesudah_url} target="_blank" className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-2 rounded-md hover:underline border border-emerald-200">
                                                        <FileText className="h-4 w-4" /> Lihat
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={processingSesudah || selectedPlan.progress < 100} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                            {processingSesudah ? 'Menyimpan...' : 'Simpan Data Sesudah OH'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: CHARTS */}
                        <div className="lg:col-span-7 space-y-6">
                            <Card className="h-full shadow-md border-slate-200 dark:border-slate-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                                        Visualisasi Perbandingan
                                    </CardTitle>
                                    <CardDescription>Grafik komparasi *real-time* sebelum dan sesudah OH</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8 pt-4">
                                    
                                    {/* CHART DAYA MAMPU */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-center border-b pb-2">Perbandingan Daya Mampu (MW)</h4>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={dmChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                    <XAxis dataKey="name" hide />
                                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip 
                                                        cursor={{fill: 'transparent'}}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                                    <Bar dataKey="Sebelum OH" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} label={{ position: 'top', fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                                    <Bar dataKey="Sesudah OH" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} label={{ position: 'top', fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* CHART SFC */}
                                    <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-bold text-center border-b pb-2">Perbandingan SFC</h4>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={sfcChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                    <XAxis dataKey="name" hide />
                                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip 
                                                        cursor={{fill: 'transparent'}}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                                    <Bar dataKey="Sebelum OH" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} label={{ position: 'top', fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                                    <Bar dataKey="Sesudah OH" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} label={{ position: 'top', fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
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
                                            <CardTitle className="text-lg">Perbandingan Daya Mampu Sebelum vs Sesudah</CardTitle>
                                            <CardDescription>Komparasi data On Quality dari {paginatedPlans.length} mesin pada halaman ini.</CardDescription>
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
                                                    <Bar dataKey="Sebelum (MW)" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                    <Bar dataKey="Sesudah (MW)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
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
                                            <p className="text-sm font-bold text-emerald-600/80 dark:text-emerald-400/80">Data Sebelum & Sesudah Terisi</p>
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
                                            <p className="text-sm font-bold text-amber-600/80 dark:text-amber-400/80">Data Sesudah Belum Terisi</p>
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
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        Daftar Mesin Pembangkit
                                    </CardTitle>
                                    <CardDescription>Pilih mesin untuk mengisi data On Quality. Total {filteredPlans.length} data.</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                        <button onClick={() => { setFilterStatus('all'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Semua</button>
                                        <button onClick={() => { setFilterStatus('lengkap'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${filterStatus === 'lengkap' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><CheckCircle className="h-3 w-3" /> Sebelum & Sesudah</button>
                                        <button onClick={() => { setFilterStatus('sebagian'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${filterStatus === 'sebagian' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><AlertCircle className="h-3 w-3" /> Sesudah Kosong</button>
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
                                                const isFilled = plan.kinerja_quality?.dm_sebelum && plan.kinerja_quality?.dm_sesudah;
                                                const isPartial = plan.kinerja_quality?.dm_sebelum && !plan.kinerja_quality?.dm_sesudah;
                                                
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
                                                                <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1.5 shadow-none"><CheckCircle className="h-3 w-3" /> Sebelum & Sesudah Terisi</Badge>
                                                            ) : isPartial ? (
                                                                <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 gap-1.5 shadow-none"><AlertCircle className="h-3 w-3" /> Sesudah Belum Terisi</Badge>
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
