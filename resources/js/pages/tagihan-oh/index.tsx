import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ReceiptText, Search, LayoutGrid } from 'lucide-react';

type Tagihan = {
    id: number;
    pekerjaan: string;
    pembangkit: 'PLTD' | 'PLTMG' | 'PLTM';
    no_kontrak: string;
    tahun: number;
    nilai_kontrak: number;
    terbayar: number;
    belum_terbayar: number;
    keterangan: string | null;
    created_at: string;
};

export default function TagihanOhIndex({ tagihan }: { tagihan: Tagihan[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPembangkit, setFilterPembangkit] = useState<string>('all');
    const [filterTahun, setFilterTahun] = useState<string>('all');
    const [showForm, setShowForm] = useState(true);
    const [editingItem, setEditingItem] = useState<Tagihan | null>(null);

    const uniqueYears = Array.from(new Set(tagihan.map(item => String(item.tahun)))).sort((a, b) => b.localeCompare(a));

    const { data, setData, post, put, processing, errors, reset } = useForm({
        pekerjaan: '',
        pembangkit: '' as any,
        no_kontrak: '',
        tahun: new Date().getFullYear(),
        nilai_kontrak: 0,
        terbayar: 0,
        belum_terbayar: 0,
        keterangan: '',
    });

    const filteredTagihan = tagihan.filter((item) => {
        const matchesSearch = item.pekerjaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.no_kontrak.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPembangkit = filterPembangkit === 'all' || item.pembangkit === filterPembangkit;
        const matchesTahun = filterTahun === 'all' || String(item.tahun) === filterTahun;
        
        return matchesSearch && matchesPembangkit && matchesTahun;
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(`/tagihan-oh/${editingItem.id}`, {
                onSuccess: () => {
                    setEditingItem(null);
                    reset();
                },
            });
        } else {
            post('/tagihan-oh', {
                onSuccess: () => {
                    reset();
                },
            });
        }
    };

    const handleEdit = (item: Tagihan) => {
        setEditingItem(item);
        setData({
            pekerjaan: item.pekerjaan,
            pembangkit: item.pembangkit,
            no_kontrak: item.no_kontrak,
            tahun: item.tahun,
            nilai_kontrak: item.nilai_kontrak,
            terbayar: item.terbayar,
            belum_terbayar: item.belum_terbayar,
            keterangan: item.keterangan || '',
        });
        if (!showForm) setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            router.delete(`/tagihan-oh/${id}`);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <>
            <Head title="Tagihan OH" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tagihan OH</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manajemen tagihan dan pembayaran Overhaul</p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowForm(!showForm)}
                        className="gap-2"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        {showForm ? 'Sembunyikan Form' : 'Tampilkan Form'}
                    </Button>
                </div>

                <div className={`grid grid-cols-1 ${showForm ? 'xl:grid-cols-4' : 'xl:grid-cols-1'} gap-6 transition-all duration-300`}>
                    {/* Form Section */}
                    {showForm && (
                        <div className="xl:col-span-1 animate-in slide-in-from-left duration-300">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle className="text-lg">{editingItem ? 'Edit Tagihan' : 'Tambah Tagihan'}</CardTitle>
                                    <CardDescription>Input detail tagihan overhaul</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pekerjaan">Pekerjaan</Label>
                                            <Input
                                                id="pekerjaan"
                                                value={data.pekerjaan}
                                                onChange={(e) => setData('pekerjaan', e.target.value)}
                                                placeholder="Nama pekerjaan OH..."
                                                required
                                            />
                                            {errors.pekerjaan && <p className="text-xs text-destructive">{errors.pekerjaan}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pembangkit">Pembangkit</Label>
                                            <Select
                                                value={data.pembangkit}
                                                onValueChange={(value) => setData('pembangkit', value as any)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Pembangkit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PLTD">PLTD</SelectItem>
                                                    <SelectItem value="PLTMG">PLTMG</SelectItem>
                                                    <SelectItem value="PLTM">PLTM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tahun">Tahun</Label>
                                            <Input
                                                id="tahun"
                                                type="number"
                                                value={data.tahun}
                                                onChange={(e) => setData('tahun', parseInt(e.target.value))}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="no_kontrak">No Kontrak</Label>
                                            <Input
                                                id="no_kontrak"
                                                value={data.no_kontrak}
                                                onChange={(e) => setData('no_kontrak', e.target.value)}
                                                placeholder="Nomor kontrak..."
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="nilai_kontrak">Nilai Kontrak</Label>
                                            <Input
                                                id="nilai_kontrak"
                                                type="number"
                                                value={data.nilai_kontrak}
                                                onChange={(e) => setData('nilai_kontrak', parseFloat(e.target.value))}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="terbayar">Terbayar</Label>
                                            <Input
                                                id="terbayar"
                                                type="number"
                                                value={data.terbayar}
                                                onChange={(e) => setData('terbayar', parseFloat(e.target.value))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="belum_terbayar">Belum Terbayar</Label>
                                            <Input
                                                id="belum_terbayar"
                                                type="number"
                                                value={data.belum_terbayar}
                                                onChange={(e) => setData('belum_terbayar', parseFloat(e.target.value))}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="keterangan">Keterangan</Label>
                                            <Textarea
                                                id="keterangan"
                                                value={data.keterangan}
                                                onChange={(e) => setData('keterangan', e.target.value)}
                                                placeholder="Catatan tambahan..."
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button type="submit" disabled={processing} className="flex-1">
                                                {editingItem ? 'Simpan' : 'Tambah'}
                                            </Button>
                                            {editingItem && (
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    onClick={() => {
                                                        setEditingItem(null);
                                                        reset();
                                                    }}
                                                >
                                                    Batal
                                                </Button>
                                            )}
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Table Section */}
                    <div className={showForm ? 'xl:col-span-3' : 'xl:col-span-1'}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <CardTitle className="text-lg">Data Tagihan</CardTitle>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Select value={filterPembangkit} onValueChange={setFilterPembangkit}>
                                        <SelectTrigger className="h-9 w-[130px]">
                                            <SelectValue placeholder="Pembangkit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Jenis</SelectItem>
                                            <SelectItem value="PLTD">PLTD</SelectItem>
                                            <SelectItem value="PLTMG">PLTMG</SelectItem>
                                            <SelectItem value="PLTM">PLTM</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={filterTahun} onValueChange={setFilterTahun}>
                                        <SelectTrigger className="h-9 w-[140px]">
                                            <SelectValue placeholder="Tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tahun</SelectItem>
                                            {uniqueYears.map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="relative w-48">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari..."
                                            className="pl-9 h-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border">
                                        Total: {filteredTagihan.length}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-12 text-center font-bold border-r last:border-r-0">No</TableHead>
                                            <TableHead className="font-bold text-center border-r last:border-r-0">Pekerjaan</TableHead>
                                            <TableHead className="font-bold text-center border-r last:border-r-0">Pembangkit</TableHead>
                                            <TableHead className="font-bold text-center border-r last:border-r-0">No Kontrak</TableHead>
                                            <TableHead className="font-bold text-center border-r last:border-r-0">Tahun</TableHead>
                                            <TableHead className="font-bold text-center border-r last:border-r-0">Nilai Kontrak</TableHead>
                                            <TableHead className="font-bold text-center border-r last:border-r-0">Terbayar</TableHead>
                                            <TableHead className="font-bold text-center text-destructive border-r last:border-r-0">Belum Terbayar</TableHead>
                                            <TableHead className="w-[100px] text-center font-bold border-r last:border-r-0">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTagihan.length > 0 ? (
                                            filteredTagihan.map((item, idx) => (
                                                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell className="text-center border-r last:border-r-0 font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                                                    <TableCell className="font-medium border-r last:border-r-0">{item.pekerjaan}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center">
                                                        <div className="flex justify-center">
                                                            {item.pembangkit === 'PLTD' ? (
                                                                <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">PLTD</Badge>
                                                            ) : item.pembangkit === 'PLTMG' ? (
                                                                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">PLTMG</Badge>
                                                            ) : (
                                                                <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">PLTM</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-mono text-muted-foreground border-r last:border-r-0">{item.no_kontrak}</TableCell>
                                                    <TableCell className="text-center border-r last:border-r-0">{item.tahun}</TableCell>
                                                    <TableCell className="text-right font-semibold border-r last:border-r-0">{formatCurrency(item.nilai_kontrak)}</TableCell>
                                                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium border-r last:border-r-0">{formatCurrency(item.terbayar)}</TableCell>
                                                    <TableCell className="text-right text-destructive font-bold border-r last:border-r-0">{formatCurrency(item.belum_terbayar)}</TableCell>
                                                    <TableCell className="text-right border-r last:border-r-0">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                                    <ReceiptText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                                    <p>Belum ada data tagihan.</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

TagihanOhIndex.layout = {
    breadcrumbs: [
        {
            title: 'Tagihan OH',
            href: '/tagihan-oh',
        },
    ],
};
