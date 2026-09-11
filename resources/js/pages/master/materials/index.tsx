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
import { Edit, Trash2, Search, Plus, Package, Filter, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Material {
    id: number;
    nama: string;
    jenis_mesin: string | null;
    part_number: string | null;
    satuan: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
}

interface Filters {
    search?: string;
    jenis_mesin?: string;
}

export default function MaterialsIndex({
    materials,
    jenisMesinOptions = [],
    filters,
}: {
    materials: Paginated<Material>;
    jenisMesinOptions?: string[];
    filters: Filters;
}) {
    const [editing, setEditing] = useState<Material | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const terapkanFilter = (next: Filters) => {
        router.get(
            '/master/materials',
            { search: searchQuery, jenis_mesin: filters.jenis_mesin, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const cari = (e: React.FormEvent) => {
        e.preventDefault();
        terapkanFilter({ search: searchQuery });
    };

    const { data, setData, put, post, processing, errors, reset } = useForm({
        nama: '',
        jenis_mesin: '',
        part_number: '',
        satuan: '',
    });

    const openEdit = (material: Material) => {
        setEditing(material);
        setData({
            nama: material.nama,
            jenis_mesin: material.jenis_mesin || '',
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
            put(`/master/materials/${editing.id}`, {
                onSuccess: () => setEditing(null),
            });
        } else {
            post(`/master/materials`, {
                onSuccess: () => setEditing(null),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus material ini?')) {
            router.delete(`/master/materials/${id}`);
        }
    };

    const importForm = useForm<{ file: File | null }>({ file: null });

    const submitImport = (e: React.FormEvent) => {
        e.preventDefault();
        importForm.post('/master/materials/import', {
            forceFormData: true,
            onSuccess: () => {
                importForm.reset();
                setImportOpen(false);
            },
        });
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
                    <div className="flex flex-wrap items-center gap-2">
                        <a href="/master/materials/template">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" /> Template Excel
                            </Button>
                        </a>
                        <Button variant="outline" onClick={() => setImportOpen(true)} className="flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Upload Excel
                        </Button>
                        <Button onClick={openCreate} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Tambah Material
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground" /> 
                            Daftar Material
                        </CardTitle>
                    </CardHeader>
                    
                    {/* Filter Bar */}
                    <div className="flex flex-col justify-between gap-3 border-b bg-muted/50 px-4 py-3 xl:flex-row xl:items-end">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="mb-1 flex items-center gap-2 border-r pr-3">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Filter
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Jenis Mesin
                                </span>
                                <select
                                    value={filters.jenis_mesin || ''}
                                    onChange={(e) => terapkanFilter({ jenis_mesin: e.target.value })}
                                    className="h-8 w-full rounded-sm border bg-background px-2 text-xs sm:w-72"
                                >
                                    <option value="">Semua Mesin</option>
                                    {jenisMesinOptions.map((jenis) => (
                                        <option key={jenis} value={jenis}>
                                            {jenis}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <form onSubmit={cari} className="relative w-full sm:w-64">
                            <Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari Nama Material, Part Number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 rounded-sm bg-background pl-8 text-xs"
                            />
                        </form>
                    </div>

                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow>
                                    <TableHead className="w-[300px] pl-6">Nama Material</TableHead>
                                    <TableHead>Jenis Mesin</TableHead>
                                    <TableHead>Part Number</TableHead>
                                    <TableHead>Satuan</TableHead>
                                    <TableHead className="text-right pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.data.map((m) => (
                                    <TableRow key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <TableCell className="font-semibold pl-6">{m.nama}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{m.jenis_mesin || '-'}</TableCell>
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
                                {materials.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
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

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">{materials.from ?? 0}</span>
                            {' – '}
                            <span className="font-semibold text-foreground">{materials.to ?? 0}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">{materials.total}</span> material
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {materials.links.map((link, idx) => {
                                let label = link.label;
                                if (label.includes('Previous')) {
                                    label = 'Prev';
                                }
                                if (label.includes('Next')) {
                                    label = 'Next';
                                }

                                return (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className={`h-7 px-2.5 text-[11px] ${link.active ? 'font-bold' : 'text-muted-foreground'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(link.url, {}, { preserveScroll: true, preserveState: true });
                                            }
                                        }}
                                    >
                                        {label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
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
                            <Label>Jenis Mesin (Opsional)</Label>
                            <Input
                                value={data.jenis_mesin}
                                onChange={(e) => setData('jenis_mesin', e.target.value)}
                                placeholder="Contoh: Mesin Mitsubishi (Major Overhaul)"
                                list="jenis-mesin-options"
                            />
                            <datalist id="jenis-mesin-options">
                                {jenisMesinOptions.map((jenis) => (
                                    <option key={jenis} value={jenis} />
                                ))}
                            </datalist>
                            {errors.jenis_mesin && <p className="text-sm text-red-500">{errors.jenis_mesin}</p>}
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

            <Dialog open={importOpen} onOpenChange={(v) => { if (!v) { importForm.reset(); setImportOpen(false); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            Upload Material dari Excel
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submitImport} className="space-y-4 mt-4">
                        <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                            Gunakan format sesuai{' '}
                            <a href="/master/materials/template" className="font-semibold text-primary underline">
                                Template Excel
                            </a>{' '}
                            (kolom: Nama Material, Jenis Mesin, Part Number, Satuan). Baris dengan
                            nama material yang sama pada jenis mesin yang sama akan dilewati.
                        </div>

                        <div className="space-y-2">
                            <Label>Berkas Excel / CSV</Label>
                            <Input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)}
                                required
                            />
                            {importForm.progress && (
                                <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${importForm.progress.percentage}%` }} />
                                </div>
                            )}
                            {importForm.errors.file && <p className="text-sm text-red-500">{importForm.errors.file}</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => { importForm.reset(); setImportOpen(false); }}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={importForm.processing || !importForm.data.file}>
                                {importForm.processing ? 'Mengunggah...' : 'Import Material'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MaterialsIndex.layout = (page: any) => <AppLayout children={page} breadcrumbs={[{ title: 'Data Master', href: '#' }, { title: 'Material', href: '#' }]} />;
