import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
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
import { Edit, Trash2, Search, Plus, Settings, Server, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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

export default function UnitsIndex({ units }: { units: Unit[] }) {
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [viewingMesins, setViewingMesins] = useState<Unit | null>(null);
    const [editingMesin, setEditingMesin] = useState<Mesin | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUnits = units.filter(u => 
        (u.nama_sentral || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.unit_pelaksana || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.nama_rayon || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const unitForm = useForm({
        nama_sentral: '',
        nama_rayon: '',
        unit_pelaksana: '',
        milik: '',
    });

    const mesinForm = useForm({
        no_urut: '',
        nama_mesin: '',
        pgk_merk: '',
        jenis_pembangkit: '',
        daya_terpasang_kw: '',
    });

    const openEditUnit = (unit: Unit) => {
        setEditingUnit(unit);
        unitForm.setData({
            nama_sentral: unit.nama_sentral,
            nama_rayon: unit.nama_rayon || '',
            unit_pelaksana: unit.unit_pelaksana || '',
            milik: unit.milik || '',
        });
    };

    const openCreateUnit = () => {
        setEditingUnit({ id_unit: 0 } as Unit);
        unitForm.reset();
    };

    const submitUnit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUnit?.id_unit) {
            unitForm.put(route('master.units.update', editingUnit.id_unit), {
                onSuccess: () => setEditingUnit(null),
            });
        } else {
            unitForm.post(route('master.units.store'), {
                onSuccess: () => setEditingUnit(null),
            });
        }
    };

    const deleteUnit = (id: number) => {
        if (confirm('Hapus unit ini?')) {
            router.delete(route('master.units.destroy', id));
        }
    };

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
            mesinForm.put(route('master.mesins.update', editingMesin.id_mesin), {
                onSuccess: () => setEditingMesin(null),
            });
        } else {
            mesinForm.post(route('master.mesins.store', viewingMesins?.id_unit), {
                onSuccess: () => setEditingMesin(null),
            });
        }
    };

    const deleteMesin = (id: number) => {
        if (confirm('Hapus mesin ini?')) {
            router.delete(route('master.mesins.destroy', id));
        }
    };

    // Keep the viewingMesins updated when props.units changes
    const currentViewedUnit = units.find(u => u.id_unit === viewingMesins?.id_unit);

    return (
        <>
            <Head title="Master Unit" />

            <div className="flex-1 p-4 md:p-8 pt-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Data Unit & Mesin</h2>
                            <p className="text-muted-foreground text-sm">Kelola master data Unit Pembangkit dan detail mesin.</p>
                        </div>
                    </div>
                    <Button onClick={openCreateUnit} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Tambah Unit
                    </Button>
                </div>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Server className="h-5 w-5 text-muted-foreground" /> 
                                Daftar Unit Pembangkit
                            </CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari Unit, Rayon, Pelaksana..."
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
                                    <TableHead className="w-[250px] pl-6">Nama Sentral</TableHead>
                                    <TableHead>Rayon</TableHead>
                                    <TableHead>Pelaksana</TableHead>
                                    <TableHead>Milik</TableHead>
                                    <TableHead className="text-center">Total Mesin</TableHead>
                                    <TableHead className="text-right pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUnits.map((u) => (
                                    <TableRow key={u.id_unit} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <TableCell className="font-semibold pl-6">{u.nama_sentral}</TableCell>
                                        <TableCell>{u.nama_rayon || '-'}</TableCell>
                                        <TableCell>{u.unit_pelaksana || '-'}</TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {u.milik || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-7 px-3 text-xs font-semibold rounded-full"
                                                onClick={() => setViewingMesins(u)}
                                            >
                                                {u.mesins.length} Mesin
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                                title="Edit Unit"
                                                onClick={() => openEditUnit(u)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                                                title="Hapus Unit"
                                                onClick={() => deleteUnit(u.id_unit)}
                                                disabled={u.mesins.length > 0}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUnits.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Search className="h-8 w-8 mb-2 text-slate-300" />
                                                <p>Tidak ada data unit yang ditemukan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Edit Unit */}
            <Dialog open={!!editingUnit} onOpenChange={(v) => !v && setEditingUnit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {editingUnit?.id_unit ? 'Edit Unit Pembangkit' : 'Tambah Unit Pembangkit'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitUnit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Nama Sentral</Label>
                            <Input
                                value={unitForm.data.nama_sentral}
                                onChange={(e) => unitForm.setData('nama_sentral', e.target.value)}
                                placeholder="Contoh: PLTD Sei Raya"
                                required
                            />
                            {unitForm.errors.nama_sentral && <p className="text-xs text-red-500">{unitForm.errors.nama_sentral}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Rayon (Opsional)</Label>
                            <Input
                                value={unitForm.data.nama_rayon}
                                onChange={(e) => unitForm.setData('nama_rayon', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit Pelaksana (Opsional)</Label>
                            <Input
                                value={unitForm.data.unit_pelaksana}
                                onChange={(e) => unitForm.setData('unit_pelaksana', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Milik (Opsional)</Label>
                            <Input
                                value={unitForm.data.milik}
                                onChange={(e) => unitForm.setData('milik', e.target.value)}
                                placeholder="Contoh: PLN / Sewa"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setEditingUnit(null)}>Batal</Button>
                            <Button type="submit" disabled={unitForm.processing}>Simpan Data Unit</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog List Mesin */}
            <Dialog open={!!viewingMesins} onOpenChange={(v) => !v && setViewingMesins(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Server className="h-5 w-5 text-indigo-500" />
                            Data Mesin - {currentViewedUnit?.nama_sentral}
                        </DialogTitle>
                        <Button size="sm" onClick={openCreateMesin} className="flex items-center gap-1.5 h-8">
                            <Plus className="h-4 w-4" /> Tambah Mesin
                        </Button>
                    </DialogHeader>
                    
                    <div className="rounded-lg border bg-card shadow-sm mt-4 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800">
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">No. Urut</TableHead>
                                    <TableHead>Nama Mesin</TableHead>
                                    <TableHead>Merk</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead className="text-right">Daya (KW)</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentViewedUnit?.mesins?.map((m) => (
                                    <TableRow key={m.id_mesin}>
                                        <TableCell className="text-center font-medium text-slate-500">{m.no_urut}</TableCell>
                                        <TableCell className="font-semibold">{m.nama_mesin}</TableCell>
                                        <TableCell>{m.pgk_merk || '-'}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded text-xs border bg-slate-50 dark:bg-slate-800">
                                                {m.jenis_pembangkit || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{m.daya_terpasang_kw?.toLocaleString('id-ID') || '-'}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditMesin(m)} title="Edit Mesin">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => deleteMesin(m.id_mesin)} title="Hapus Mesin">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {currentViewedUnit?.mesins?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Belum ada mesin yang terdaftar di unit ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

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
                            <Label>Merk Penggerak</Label>
                            <Input value={mesinForm.data.pgk_merk} onChange={(e) => mesinForm.setData('pgk_merk', e.target.value)} placeholder="Contoh: Caterpillar" />
                        </div>
                        <div className="space-y-2">
                            <Label>Jenis Pembangkit</Label>
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

UnitsIndex.layout = (page: any) => <AppLayout children={page} breadcrumbs={[{ title: 'Data Master', url: '#' }, { title: 'Unit & Mesin' }]} />;
