import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { Check, ChevronsUpDown, Info, Trash2, Clock, Search, Pencil, Plus } from 'lucide-react';

export default function OutagePlansIndex({ outagePlans, units = [], filters }: { outagePlans: any, units?: any[], filters?: any }) {
    const { auth } = usePage<any>().props;
    const isTamu = auth?.user?.role === 'tamu';
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [editingItem, setEditingItem] = useState<any>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        mesin_pembangkit: '',
        scope: '',
        jenis_pembangkit: '',
        durasi: '',
        start_date: '',
        selesai: '',
        progress: '',
        rapat_r2: '',
        rapat_r3: '',
        rapat_p1: '',
        rapat_p2: '',
        rapat_p3: '',
        ket: '',
    });

    const [query, setQuery] = useState('');

    const allMesins = useMemo(() => {
        const list: any[] = [];
        if (units && Array.isArray(units)) {
            units.forEach((u: any) => {
                if (u.mesins && Array.isArray(u.mesins)) {
                    u.mesins.forEach((m: any) => {
                        list.push({
                            id: m.id_mesin,
                            name: m.nama_mesin,
                            unitName: u.nama_sentral,
                            searchString: `${u.nama_sentral} ${m.nama_mesin}`.toLowerCase(),
                        });
                    });
                }
            });
        }
        return list;
    }, [units]);

    const filteredMesins = query === ''
        ? allMesins
        : allMesins.filter((m) => m.searchString.includes(query.toLowerCase()));

    const filteredOutagePlans = outagePlans.data || [];

    const openAddDialog = () => {
        setEditingItem(null);
        reset();
        setQuery('');
        setDialogOpen(true);
    };

    const openEditDialog = (plan: any) => {
        setEditingItem(plan);
        setData({
            mesin_pembangkit: plan.mesin_pembangkit || '',
            scope: plan.scope ? plan.scope.toUpperCase() : '',
            jenis_pembangkit: plan.jenis_pembangkit ? plan.jenis_pembangkit.toUpperCase() : '',
            durasi: plan.durasi?.toString() || '',
            start_date: plan.start_date || '',
            selesai: plan.selesai || '',
            progress: plan.progress?.toString() || '',
            rapat_r2: plan.rapat_r2 || '',
            rapat_r3: plan.rapat_r3 || '',
            rapat_p1: plan.rapat_p1 || '',
            rapat_p2: plan.rapat_p2 || '',
            rapat_p3: plan.rapat_p3 || '',
            ket: plan.ket || '',
        });
        setQuery('');
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingItem(null);
        reset();
        setQuery('');
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(`/outage-plans/${editingItem.id}`, {
                onSuccess: () => closeDialog(),
            });
        } else {
            post('/outage-plans', {
                onSuccess: () => closeDialog(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            router.delete(`/outage-plans/${id}`);
        }
    };

    return (
        <>
            <Head title="Perencanaan dan Jadwal Outage" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Perencanaan dan Jadwal Outage</h1>
                        <p className="text-sm text-muted-foreground mt-1">Monitoring dan penjadwalan pemeliharaan unit pembangkit</p>
                    </div>
                    {!isTamu && (
                        <Button onClick={openAddDialog} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tambah Jadwal
                        </Button>
                    )}
                </div>

                {/* Table Section - Full Width */}
                <Card className="h-fit">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg">Data Jadwal Outage</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-48">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari... (tekan enter)"
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            router.get('/outage-plans', { search: searchTerm }, { preserveState: true, preserveScroll: true });
                                        }
                                    }}
                                />
                            </div>
                            <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border">
                                Total: {outagePlans.total || 0}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <Table className="whitespace-nowrap">
                                <TableHeader>
                                    <TableRow className="bg-muted/30 border-y">
                                        <TableHead className="text-center font-bold px-4 w-12">No</TableHead>
                                        <TableHead className="font-bold px-4 min-w-[200px]">Mesin</TableHead>
                                        <TableHead className="font-bold text-center px-4">Scope</TableHead>
                                        <TableHead className="font-bold text-center px-4">Jenis</TableHead>
                                        <TableHead className="font-bold text-center px-4">Durasi</TableHead>
                                        <TableHead className="font-bold text-center px-4">Mulai</TableHead>
                                        <TableHead className="font-bold text-center px-4">Selesai</TableHead>
                                        <TableHead className="font-bold text-center px-4 w-24">Progres</TableHead>
                                        <TableHead className="font-bold text-center px-4">R2</TableHead>
                                        <TableHead className="font-bold text-center px-4">R3</TableHead>
                                        <TableHead className="font-bold text-center px-4">P1</TableHead>
                                        <TableHead className="font-bold text-center px-4">P2</TableHead>
                                        <TableHead className="font-bold text-center px-4">P3</TableHead>
                                        <TableHead className="font-bold text-center px-4">Ket</TableHead>
                                        {!isTamu && <TableHead className="text-center font-bold px-4">Aksi</TableHead>}
                                    </TableRow>
                                </TableHeader>
                            <TableBody>
                                {filteredOutagePlans.length > 0 ? (
                                    filteredOutagePlans.map((plan: any, idx: number) => (
                                        <TableRow key={plan.id} className="hover:bg-muted/30 group">
                                            <TableCell className="text-center font-mono text-xs text-muted-foreground px-4">{idx + 1}</TableCell>
                                            <TableCell className="font-medium px-4 text-xs">{plan.mesin_pembangkit}</TableCell>
                                            <TableCell className="text-center text-[11px] font-semibold text-muted-foreground px-4 uppercase">{plan.scope}</TableCell>
                                            <TableCell className="text-center px-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground uppercase">
                                                    {plan.jenis_pembangkit}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center px-4">
                                                <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {plan.durasi}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-muted-foreground px-4">{plan.start_date || '-'}</TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-muted-foreground px-4">{plan.selesai || '-'}</TableCell>
                                            <TableCell className="text-center px-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-bold leading-none">{plan.progress}%</span>
                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${Number(plan.progress) >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                                            style={{ width: `${Math.min(100, Math.max(0, Number(plan.progress) || 0))}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-muted-foreground px-4">{plan.rapat_r2 || '-'}</TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-muted-foreground px-4">{plan.rapat_r3 || '-'}</TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-muted-foreground px-4">{plan.rapat_p1 || '-'}</TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-muted-foreground px-4">{plan.rapat_p2 || '-'}</TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-muted-foreground px-4">{plan.rapat_p3 || '-'}</TableCell>
                                            <TableCell className="text-center px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${plan.ket === 'CLOSE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                                                    {plan.ket || 'OPEN'}
                                                </span>
                                            </TableCell>
                                            {!isTamu && (
                                                <TableCell className="text-center px-4">
                                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-7 w-7 text-primary hover:bg-primary/10"
                                                            onClick={() => openEditDialog(plan)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDelete(plan.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={15} className="h-32 text-center text-muted-foreground">
                                            <Info className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                            <p>{searchTerm ? 'Tidak ada hasil pencarian.' : 'Belum ada data perencanaan.'}</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {outagePlans.links && outagePlans.links.length > 3 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 p-4 border-t">
                            {outagePlans.links.map((link: any, k: number) => (
                                <Link
                                    key={k}
                                    href={link.url || '#'}
                                    preserveState
                                    preserveScroll
                                    className={`px-3 py-1.5 text-xs border rounded-md transition-colors ${
                                        link.active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Dialog Popup for Add / Edit Form */}
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Jadwal Outage' : 'Tambah Jadwal Outage'}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? 'Perbarui data perencanaan outage yang sudah ada.' : 'Input data perencanaan outage baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        {/* Mesin Pembangkit */}
                        <div className="space-y-2">
                            <Label htmlFor="mesin_pembangkit">Mesin Pembangkit</Label>
                            <Combobox value={data.mesin_pembangkit} onChange={(val) => setData('mesin_pembangkit', val || '')}>
                                <div className="relative">
                                    <div className="relative w-full cursor-default overflow-hidden rounded-md border border-input bg-transparent text-left shadow-sm transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] outline-none sm:text-sm">
                                        <ComboboxInput
                                            className="w-full border-none bg-transparent py-2 pl-3 pr-10 text-sm leading-5 focus:outline-none focus:ring-0"
                                            displayValue={(mesinName: string) => mesinName}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Cari unit (cth: pltd poasia)..."
                                        />
                                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                        </ComboboxButton>
                                    </div>
                                    <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-md ring-1 ring-black/5 focus:outline-none sm:text-sm z-[100] border">
                                        {filteredMesins.length === 0 && query !== '' ? (
                                            <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                                                Mesin tidak ditemukan.
                                            </div>
                                        ) : (
                                            filteredMesins.map((mesin) => (
                                                <ComboboxOption
                                                    key={mesin.id}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                            active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                                                        }`
                                                    }
                                                    value={mesin.name}
                                                >
                                                    {({ selected, active }) => (
                                                        <>
                                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                {mesin.name}
                                                            </span>
                                                            {selected ? (
                                                                <span
                                                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                        active ? 'text-accent-foreground' : 'text-primary'
                                                                    }`}
                                                                >
                                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </ComboboxOption>
                                            ))
                                        )}
                                    </ComboboxOptions>
                                </div>
                            </Combobox>
                            {errors.mesin_pembangkit && <p className="text-xs text-destructive">{errors.mesin_pembangkit}</p>}
                        </div>

                        {/* Scope & Jenis */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scope">Scope</Label>
                                <Select value={data.scope} onValueChange={(val) => setData('scope', val)}>
                                    <SelectTrigger id="scope">
                                        <SelectValue placeholder="Pilih Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FINAL STAGE">FINAL STAGE</SelectItem>
                                        <SelectItem value="SECOND STAGE">SECOND STAGE</SelectItem>
                                        <SelectItem value="2ND STAGE">2ND STAGE</SelectItem>
                                        <SelectItem value="TO">TO</SelectItem>
                                        <SelectItem value="MO">MO</SelectItem>
                                        <SelectItem value="SO">SO</SelectItem>
                                        <SelectItem value="AI">AI</SelectItem>
                                        <SelectItem value="GI">GI</SelectItem>
                                        <SelectItem value="PMS 20 K">PMS 20 K</SelectItem>
                                        <SelectItem value="PMS 24 K">PMS 24 K</SelectItem>
                                        <SelectItem value="PMS 32K">PMS 32K</SelectItem>
                                        <SelectItem value="PMS 40K">PMS 40K</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.scope && <p className="text-xs text-destructive">{errors.scope}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jenis_pembangkit">Jenis</Label>
                                <Select value={data.jenis_pembangkit} onValueChange={(val) => setData('jenis_pembangkit', val)}>
                                    <SelectTrigger id="jenis_pembangkit">
                                        <SelectValue placeholder="Pilih Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PLTD">PLTD</SelectItem>
                                        <SelectItem value="PLTMG">PLTMG</SelectItem>
                                        <SelectItem value="PLTM">PLTM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Durasi & Progres */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="durasi">Durasi (Hari)</Label>
                                <Input
                                    id="durasi"
                                    type="number"
                                    value={data.durasi}
                                    onChange={(e) => setData('durasi', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="progress">Progres</Label>
                                <Input
                                    id="progress"
                                    type="number"
                                    step="0.01"
                                    value={data.progress}
                                    onChange={(e) => setData('progress', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Tanggal Mulai & Selesai */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Mulai</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selesai">Selesai</Label>
                                <Input
                                    id="selesai"
                                    type="date"
                                    value={data.selesai}
                                    onChange={(e) => setData('selesai', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Jadwal Rapat R2 & R3 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rapat_r2">Rapat R2</Label>
                                <Input
                                    id="rapat_r2"
                                    type="date"
                                    value={data.rapat_r2}
                                    onChange={(e) => setData('rapat_r2', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rapat_r3">Rapat R3</Label>
                                <Input
                                    id="rapat_r3"
                                    type="date"
                                    value={data.rapat_r3}
                                    onChange={(e) => setData('rapat_r3', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Jadwal Rapat P1, P2, P3 */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="rapat_p1">Rapat P1</Label>
                                <Input
                                    id="rapat_p1"
                                    type="date"
                                    value={data.rapat_p1}
                                    onChange={(e) => setData('rapat_p1', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rapat_p2">Rapat P2</Label>
                                <Input
                                    id="rapat_p2"
                                    type="date"
                                    value={data.rapat_p2}
                                    onChange={(e) => setData('rapat_p2', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rapat_p3">Rapat P3</Label>
                                <Input
                                    id="rapat_p3"
                                    type="date"
                                    value={data.rapat_p3}
                                    onChange={(e) => setData('rapat_p3', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-2">
                            <Label htmlFor="ket">Keterangan</Label>
                            <Input
                                id="ket"
                                type="text"
                                value={data.ket}
                                onChange={(e) => setData('ket', e.target.value)}
                            />
                        </div>

                        {/* Action Buttons */}
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={closeDialog}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingItem ? 'Simpan Perubahan' : 'Simpan Perencanaan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

OutagePlansIndex.layout = {
    breadcrumbs: [
        {
            title: 'Perencanaan dan Jadwal Outage',
            href: '/outage-plans',
        },
    ],
};
