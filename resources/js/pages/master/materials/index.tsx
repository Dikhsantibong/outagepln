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
import { Edit, Trash2, Search, Plus, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Material {
    id: number;
    nama: string;
    part_number: string | null;
    satuan: string | null;
}

export default function MaterialsIndex({ materials }: { materials: Material[] }) {
    const [editing, setEditing] = useState<Material | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMaterials = materials.filter(m => 
        (m.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (m.part_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const { data, setData, put, post, processing, errors, reset } = useForm({
        nama: '',
        part_number: '',
        satuan: '',
    });

    const openEdit = (material: Material) => {
        setEditing(material);
        setData({
            nama: material.nama,
            part_number: material.part_number || '',
            satuan: material.satuan || '',
        });
    };

    const openCreate = () => {
        setEditing({ id: 0 } as Material);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing?.id) {
            put(route('master.materials.update', editing.id), {
                onSuccess: () => setEditing(null),
            });
        } else {
            post(route('master.materials.store'), {
                onSuccess: () => setEditing(null),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus material ini?')) {
            router.delete(route('master.materials.destroy', id));
        }
    };

    return (
        <>
            <Head title="Master Material" />

            <div className="flex-1 p-4 md:p-8 pt-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Data Material</h2>
                            <p className="text-muted-foreground text-sm">Kelola master data suku cadang dan material.</p>
                        </div>
                    </div>
                    <Button onClick={openCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Tambah Material
                    </Button>
                </div>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Package className="h-5 w-5 text-muted-foreground" /> 
                                Daftar Material
                            </CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari Nama Material, Part Number..."
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
                                    <TableHead className="w-[300px] pl-6">Nama Material</TableHead>
                                    <TableHead>Part Number</TableHead>
                                    <TableHead>Satuan</TableHead>
                                    <TableHead className="text-right pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMaterials.map((m) => (
                                    <TableRow key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <TableCell className="font-semibold pl-6">{m.nama}</TableCell>
                                        <TableCell className="font-mono">{m.part_number || '-'}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded text-xs border bg-slate-50 dark:bg-slate-800">
                                                {m.satuan || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                                title="Edit Material"
                                                onClick={() => openEdit(m)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                                                title="Hapus Material"
                                                onClick={() => handleDelete(m.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredMaterials.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Search className="h-8 w-8 mb-2 text-slate-300" />
                                                <p>Tidak ada data material yang ditemukan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            {editing?.id ? 'Edit Material' : 'Tambah Material Baru'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Nama Material</Label>
                            <Input
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                placeholder="Contoh: Filter Udara"
                                required
                            />
                            {errors.nama && <p className="text-sm text-red-500">{errors.nama}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Part Number (Opsional)</Label>
                            <Input
                                value={data.part_number}
                                onChange={(e) => setData('part_number', e.target.value)}
                                placeholder="Contoh: CAT-123456"
                            />
                            {errors.part_number && <p className="text-sm text-red-500">{errors.part_number}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Satuan (Opsional)</Label>
                            <Input
                                value={data.satuan}
                                onChange={(e) => setData('satuan', e.target.value)}
                                placeholder="Contoh: Pcs, Set, Liter"
                            />
                            {errors.satuan && <p className="text-sm text-red-500">{errors.satuan}</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Simpan Material
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MaterialsIndex.layout = (page: any) => <AppLayout children={page} breadcrumbs={[{ title: 'Data Master', url: '#' }, { title: 'Material' }]} />;
