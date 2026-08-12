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

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Data Unit Pembangkit</h1>
                    <Button onClick={openCreateUnit}>Tambah Unit</Button>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Sentral</TableHead>
                                <TableHead>Rayon</TableHead>
                                <TableHead>Pelaksana</TableHead>
                                <TableHead>Milik</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {units.map((u) => (
                                <TableRow key={u.id_unit}>
                                    <TableCell className="font-medium">{u.nama_sentral}</TableCell>
                                    <TableCell>{u.nama_rayon || '-'}</TableCell>
                                    <TableCell>{u.unit_pelaksana || '-'}</TableCell>
                                    <TableCell>{u.milik || '-'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setViewingMesins(u)}
                                        >
                                            Mesin ({u.mesins.length})
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditUnit(u)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteUnit(u.id_unit)}
                                            disabled={u.mesins.length > 0}
                                        >
                                            Hapus
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {units.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        Tidak ada data
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Dialog Edit Unit */}
            <Dialog open={!!editingUnit} onOpenChange={(v) => !v && setEditingUnit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingUnit?.id_unit ? 'Edit Unit' : 'Tambah Unit'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitUnit} className="space-y-4 mt-4">
                        <div className="space-y-1">
                            <Label>Nama Sentral</Label>
                            <Input
                                value={unitForm.data.nama_sentral}
                                onChange={(e) => unitForm.setData('nama_sentral', e.target.value)}
                                required
                            />
                            {unitForm.errors.nama_sentral && <p className="text-sm text-red-500">{unitForm.errors.nama_sentral}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Nama Rayon</Label>
                            <Input
                                value={unitForm.data.nama_rayon}
                                onChange={(e) => unitForm.setData('nama_rayon', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Unit Pelaksana</Label>
                            <Input
                                value={unitForm.data.unit_pelaksana}
                                onChange={(e) => unitForm.setData('unit_pelaksana', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Milik</Label>
                            <Input
                                value={unitForm.data.milik}
                                onChange={(e) => unitForm.setData('milik', e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditingUnit(null)}>Batal</Button>
                            <Button type="submit" disabled={unitForm.processing}>Simpan</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog List Mesin */}
            <Dialog open={!!viewingMesins} onOpenChange={(v) => !v && setViewingMesins(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Data Mesin - {currentViewedUnit?.nama_sentral}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="mt-4 flex justify-end">
                        <Button size="sm" onClick={openCreateMesin}>Tambah Mesin</Button>
                    </div>

                    <div className="rounded-md border bg-card mt-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Urut</TableHead>
                                    <TableHead>Nama Mesin</TableHead>
                                    <TableHead>Merk</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Daya (KW)</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentViewedUnit?.mesins?.map((m) => (
                                    <TableRow key={m.id_mesin}>
                                        <TableCell>{m.no_urut}</TableCell>
                                        <TableCell>{m.nama_mesin}</TableCell>
                                        <TableCell>{m.pgk_merk || '-'}</TableCell>
                                        <TableCell>{m.jenis_pembangkit || '-'}</TableCell>
                                        <TableCell>{m.daya_terpasang_kw || '-'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => openEditMesin(m)}>Edit</Button>
                                            <Button variant="destructive" size="sm" onClick={() => deleteMesin(m.id_mesin)}>Hapus</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {currentViewedUnit?.mesins?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">Belum ada mesin.</TableCell>
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
                        <DialogTitle>{editingMesin?.id_mesin ? 'Edit Mesin' : 'Tambah Mesin'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitMesin} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>No Urut</Label>
                                <Input type="number" value={mesinForm.data.no_urut} onChange={(e) => mesinForm.setData('no_urut', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label>Daya Terpasang (KW)</Label>
                                <Input type="number" step="0.1" value={mesinForm.data.daya_terpasang_kw} onChange={(e) => mesinForm.setData('daya_terpasang_kw', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Nama Mesin</Label>
                            <Input value={mesinForm.data.nama_mesin} onChange={(e) => mesinForm.setData('nama_mesin', e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                            <Label>Merk Penggerak</Label>
                            <Input value={mesinForm.data.pgk_merk} onChange={(e) => mesinForm.setData('pgk_merk', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Jenis Pembangkit</Label>
                            <Input value={mesinForm.data.jenis_pembangkit} onChange={(e) => mesinForm.setData('jenis_pembangkit', e.target.value)} placeholder="PLTD / PLTM" />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditingMesin(null)}>Batal</Button>
                            <Button type="submit" disabled={mesinForm.processing}>Simpan</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

UnitsIndex.layout = (page: any) => <AppLayout children={page} breadcrumbs={[{ title: 'Data Master', url: '#' }, { title: 'Unit & Mesin' }]} />;
