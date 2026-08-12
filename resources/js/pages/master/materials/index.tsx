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

interface Material {
    id: number;
    nama: string;
    part_number: string | null;
    satuan: string | null;
}

export default function MaterialsIndex({ materials }: { materials: Material[] }) {
    const [editing, setEditing] = useState<Material | null>(null);

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

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Data Master Material</h1>
                    <Button onClick={openCreate}>Tambah Material</Button>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Material</TableHead>
                                <TableHead>Part Number</TableHead>
                                <TableHead>Satuan</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">{m.nama}</TableCell>
                                    <TableCell>{m.part_number || '-'}</TableCell>
                                    <TableCell>{m.satuan || '-'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEdit(m)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(m.id)}
                                        >
                                            Hapus
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {materials.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4">
                                        Tidak ada data material
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing?.id ? 'Edit Material' : 'Tambah Material'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4 mt-4">
                        <div className="space-y-1">
                            <Label>Nama Material</Label>
                            <Input
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                required
                            />
                            {errors.nama && <p className="text-sm text-red-500">{errors.nama}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label>Part Number</Label>
                            <Input
                                value={data.part_number}
                                onChange={(e) => setData('part_number', e.target.value)}
                            />
                            {errors.part_number && <p className="text-sm text-red-500">{errors.part_number}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label>Satuan</Label>
                            <Input
                                value={data.satuan}
                                onChange={(e) => setData('satuan', e.target.value)}
                                placeholder="Pcs, Set, Ltr, dll"
                            />
                            {errors.satuan && <p className="text-sm text-red-500">{errors.satuan}</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MaterialsIndex.layout = (page: any) => <AppLayout children={page} breadcrumbs={[{ title: 'Data Master', url: '#' }, { title: 'Material' }]} />;
