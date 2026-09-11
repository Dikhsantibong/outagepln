import { Head, useForm, router } from '@inertiajs/react';
import { PenLine, Save, Plus, Edit, Trash2, Eraser } from 'lucide-react';
import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Ttd = {
    id: number;
    nama: string;
    jabatan: string | null;
    tipe: string | null;
    signature: string | null;
};

export default function MasterTtd({ penandatangans }: { penandatangans: Ttd[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTtd, setEditingTtd] = useState<Ttd | null>(null);
    const sigCanvas = useRef<SignatureCanvas>(null);

    const form = useForm({
        nama: '',
        jabatan: '',
        tipe: '',
        signature: '',
    });

    const openDialog = (ttd?: Ttd) => {
        if (ttd) {
            setEditingTtd(ttd);
            form.setData({
                nama: ttd.nama,
                jabatan: ttd.jabatan || '',
                tipe: ttd.tipe || '',
                signature: ttd.signature || '',
            });
        } else {
            setEditingTtd(null);
            form.reset();
        }
        setIsDialogOpen(true);
        setTimeout(() => {
            if (sigCanvas.current) {
                sigCanvas.current.clear();
            }
        }, 100);
    };

    const clearCanvas = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            form.setData('signature', '');
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let signatureData = form.data.signature;
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            signatureData = sigCanvas.current.toDataURL('image/png');
        }

        if (editingTtd) {
            router.put(`/master/ttd/${editingTtd.id}`, {
                ...form.data,
                signature: signatureData
            }, {
                preserveScroll: true,
                onSuccess: () => setIsDialogOpen(false),
            });
        } else {
            router.post('/master/ttd', {
                ...form.data,
                signature: signatureData
            }, {
                preserveScroll: true,
                onSuccess: () => setIsDialogOpen(false),
            });
        }
    };

    const deleteTtd = (id: number) => {
        if (confirm('Yakin ingin menghapus penandatangan ini?')) {
            router.delete(`/master/ttd/${id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Data Master - Tanda Tangan" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <PenLine className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Data Master Penandatangan</h1>
                            <p className="text-sm text-muted-foreground">
                                Kelola daftar orang yang dapat bertanda tangan (Manager, TL, Officer) beserta tanda tangannya.
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => openDialog()} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Penandatangan
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Penandatangan</CardTitle>
                        <CardDescription>
                            Daftar ini akan bisa dipilih pada saat membuat dokumen notulen rapat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Jabatan</TableHead>
                                        <TableHead>Tipe/Role</TableHead>
                                        <TableHead>Tanda Tangan</TableHead>
                                        <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!penandatangans || penandatangans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Belum ada data penandatangan.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        penandatangans.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">{p.nama}</TableCell>
                                                <TableCell>{p.jabatan || '-'}</TableCell>
                                                <TableCell>
                                                    {p.tipe ? <Badge variant="outline">{p.tipe}</Badge> : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {p.signature ? (
                                                        <img src={p.signature} alt="Tanda tangan" className="h-10 object-contain bg-white rounded border px-2" />
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Tidak ada TTD</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openDialog(p)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteTtd(p.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle>{editingTtd ? 'Edit Penandatangan' : 'Tambah Penandatangan'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nama">Nama Lengkap</Label>
                                <Input
                                    id="nama"
                                    value={form.data.nama}
                                    onChange={(e) => form.setData('nama', e.target.value)}
                                    placeholder="Contoh: ABDUL RAHMAN KADIR"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jabatan">Jabatan</Label>
                                <Input
                                    id="jabatan"
                                    value={form.data.jabatan}
                                    onChange={(e) => form.setData('jabatan', e.target.value)}
                                    placeholder="Contoh: TEAM LEADER OUTAGE"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tipe">Tipe / Role (Opsional)</Label>
                                <Input
                                    id="tipe"
                                    value={form.data.tipe}
                                    onChange={(e) => form.setData('tipe', e.target.value)}
                                    placeholder="Contoh: TL, Officer, Manager"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Tanda Tangan</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={clearCanvas} className="h-6 px-2 text-xs gap-1">
                                        <Eraser className="h-3 w-3" /> Bersihkan
                                    </Button>
                                </div>
                                
                                {editingTtd && editingTtd.signature && form.data.signature && (
                                    <div className="mb-2">
                                        <p className="text-xs text-muted-foreground mb-1">Tanda Tangan Saat Ini:</p>
                                        <img src={editingTtd.signature} className="h-20 object-contain bg-muted rounded-md border" />
                                        <p className="text-xs text-muted-foreground mt-1">Gambar di bawah untuk mengganti tanda tangan lama.</p>
                                    </div>
                                )}

                                <div className="border-2 border-dashed border-gray-300 rounded-md bg-white overflow-hidden">
                                    <SignatureCanvas 
                                        ref={sigCanvas}
                                        penColor="black"
                                        canvasProps={{
                                            className: 'signature-canvas w-full h-40 cursor-crosshair'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing} className="gap-2">
                                <Save className="h-4 w-4" /> Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MasterTtd.layout = {
    breadcrumbs: [
        { title: 'Data Master', href: '#' },
        { title: 'Tanda Tangan', href: '/master/ttd' },
    ],
};
