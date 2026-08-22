import { useState } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Search, Plus, Server, ArrowLeft, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Mesin {
    id_mesin: number;
    id_unit: number;
    no_urut: number;
    nama_mesin: string;
    pgk_merk: string | null;
    jenis_pembangkit: string | null;
    daya_terpasang_kw: number | null;
}

interface Unit {
    id_unit: number;
    nama_sentral: string;
    nama_rayon: string | null;
    unit_pelaksana: string | null;
    milik: string | null;
    mesins: Mesin[];
}

export default function MesinsIndex({ unit }: { unit: Unit }) {
    const [editingMesin, setEditingMesin] = useState<Mesin | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMesins = (unit.mesins || []).filter(m => 
        (m.nama_mesin || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (m.pgk_merk || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.jenis_pembangkit || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const mesinForm = useForm({
        no_urut: '',
        nama_mesin: '',
        pgk_merk: '',
        jenis_pembangkit: '',
        daya_terpasang_kw: '',
    });

    const openEditMesin = (mesin: Mesin) => {
        setEditingMesin(mesin);
        mesinForm.setData({
            no_urut: mesin.no_urut.toString(),
            nama_mesin: mesin.nama_mesin,
            pgk_merk: mesin.pgk_merk || '',
            jenis_pembangkit: mesin.jenis_pembangkit || '',
            daya_terpasang_kw: mesin.daya_terpasang_kw ? mesin.daya_terpasang_kw.toString() : '',
        });
    };

    const openCreateMesin = () => {
        setEditingMesin({ id_mesin: 0 } as Mesin);
        mesinForm.reset();
    };

    const submitMesin = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMesin?.id_mesin) {
            mesinForm.put(`/master/mesins/${editingMesin.id_mesin}`, {
                onSuccess: () => setEditingMesin(null),
            });
        } else {
            mesinForm.post(`/master/units/${unit.id_unit}/mesins`, {
                onSuccess: () => setEditingMesin(null),
            });
        }
    };

    const deleteMesin = (id: number) => {
        if (confirm('Hapus mesin ini?')) {
            router.delete(`/master/mesins/${id}`);
        }
    };

    return (
        <>
            <Head title={`Data Mesin - ${unit.nama_sentral}`} />

            <div className="flex-1 p-4 md:p-8 pt-6 space-y-6">
                
                <div className="mb-4">
                    <Button variant="ghost" className="text-muted-foreground hover:text-slate-900 dark:hover:text-white pl-0" asChild>
                        <Link href={`/master/units`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali ke Daftar Unit
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                            <Server className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Data Mesin Pembangkit</h2>
                            <p className="text-muted-foreground text-sm font-medium">Unit: <span className="text-slate-800 dark:text-slate-200">{unit.nama_sentral}</span></p>
                        </div>
                    </div>
                    <Button onClick={openCreateMesin} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Tambah Mesin
                    </Button>
                </div>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Server className="h-5 w-5 text-muted-foreground" /> 
                                Daftar Mesin terdaftar
                            </CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari Nama Mesin, Merk, Jenis..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow>
                                    <TableHead className="w-[80px] pl-6 text-center">No. Urut</TableHead>
                                    <TableHead>Nama Mesin</TableHead>
                                    <TableHead>Merk</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead className="text-right">Daya (KW)</TableHead>
                                    <TableHead className="text-right pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMesins.map((m) => (
                                    <TableRow key={m.id_mesin} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <TableCell className="text-center font-medium pl-6 text-slate-500">{m.no_urut}</TableCell>
                                        <TableCell className="font-semibold">{m.nama_mesin}</TableCell>
                                        <TableCell>{m.pgk_merk || '-'}</TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {m.jenis_pembangkit || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{m.daya_terpasang_kw?.toLocaleString('id-ID') || '-'}</TableCell>
                                        <TableCell className="text-right pr-6 space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                                title="Edit Mesin"
                                                onClick={() => openEditMesin(m)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                                                title="Hapus Mesin"
                                                onClick={() => deleteMesin(m.id_mesin)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredMesins.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Search className="h-8 w-8 mb-2 text-slate-300" />
                                                <p>Tidak ada mesin yang ditemukan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Edit Mesin */}
            <Dialog open={!!editingMesin} onOpenChange={(v) => !v && setEditingMesin(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-indigo-500" />
                            {editingMesin?.id_mesin ? 'Edit Data Mesin' : 'Tambah Mesin Baru'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitMesin} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>No Urut</Label>
                                <Input type="number" value={mesinForm.data.no_urut} onChange={(e) => mesinForm.setData('no_urut', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Daya Terpasang (KW)</Label>
                                <Input type="number" step="0.1" value={mesinForm.data.daya_terpasang_kw} onChange={(e) => mesinForm.setData('daya_terpasang_kw', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Mesin</Label>
                            <Input value={mesinForm.data.nama_mesin} onChange={(e) => mesinForm.setData('nama_mesin', e.target.value)} placeholder="Contoh: Unit 1" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Merk Penggerak (Opsional)</Label>
                            <Input value={mesinForm.data.pgk_merk} onChange={(e) => mesinForm.setData('pgk_merk', e.target.value)} placeholder="Contoh: Caterpillar" />
                        </div>
                        <div className="space-y-2">
                            <Label>Jenis Pembangkit (Opsional)</Label>
                            <Input value={mesinForm.data.jenis_pembangkit} onChange={(e) => mesinForm.setData('jenis_pembangkit', e.target.value)} placeholder="Contoh: PLTD / PLTM" />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setEditingMesin(null)}>Batal</Button>
                            <Button type="submit" disabled={mesinForm.processing}>Simpan Mesin</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MesinsIndex.layout = (page: any) => <AppLayout children={page} breadcrumbs={[{ title: 'Data Master', url: '#' }, { title: 'Unit & Mesin', url: '/master/units' }, { title: 'Data Mesin' }]} />;
