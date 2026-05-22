import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { Check, ChevronsUpDown, Calendar as CalendarIcon, MapPin, Gauge, Info, Trash2, Clock, LayoutGrid, Search, Pencil, X } from 'lucide-react';

export default function OutagePlansIndex({ outagePlans, units = [] }: { outagePlans: any[], units?: any[] }) {
    const [showForm, setShowForm] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScope, setFilterScope] = useState('all');
    const [filterJenis, setFilterJenis] = useState('all');
    const [filterKet, setFilterKet] = useState('all');
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

    const filteredOutagePlans = useMemo(() => {
        return outagePlans.filter((plan) => {
            const matchesSearch = plan.mesin_pembangkit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                plan.scope?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesScope = filterScope === 'all' || plan.scope === filterScope;
            const matchesJenis = filterJenis === 'all' || plan.jenis_pembangkit?.toLowerCase() === filterJenis.toLowerCase();
            const matchesKet = filterKet === 'all' || plan.ket === filterKet;

            return matchesSearch && matchesScope && matchesJenis && matchesKet;
        });
    }, [outagePlans, searchTerm, filterScope, filterJenis, filterKet]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(`/outage-plans/${editingItem.id}`, {
                onSuccess: () => {
                    reset();
                    setEditingItem(null);
                },
            });
        } else {
            post('/outage-plans', {
                onSuccess: () => reset(),
            });
        }
    };

    const handleEdit = (plan: any) => {
        setEditingItem(plan);
        setData({
            mesin_pembangkit: plan.mesin_pembangkit || '',
            scope: plan.scope || '',
            jenis_pembangkit: plan.jenis_pembangkit || '',
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
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        reset();
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
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{editingItem ? 'Edit Jadwal' : 'Tambah Jadwal'}</CardTitle>
                                        {editingItem && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEdit}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <CardDescription>{editingItem ? 'Perbarui data perencanaan outage' : 'Input data perencanaan outage baru'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submit} className="space-y-4">
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
                                                    <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-md ring-1 ring-black/5 focus:outline-none sm:text-sm z-50 border">
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

                                        <div className="space-y-2">
                                            <Label htmlFor="scope">Scope</Label>
                                            <Input
                                                id="scope"
                                                type="text"
                                                value={data.scope}
                                                onChange={(e) => setData('scope', e.target.value)}
                                            />
                                            {errors.scope && <p className="text-xs text-destructive">{errors.scope}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="jenis_pembangkit">Jenis</Label>
                                            <Input
                                                id="jenis_pembangkit"
                                                type="text"
                                                value={data.jenis_pembangkit}
                                                onChange={(e) => setData('jenis_pembangkit', e.target.value)}
                                            />
                                        </div>

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

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="rapat_r2">Rapat R2</Label>
                                                <Input
                                                    id="rapat_r2"
                                                    type="text"
                                                    value={data.rapat_r2}
                                                    onChange={(e) => setData('rapat_r2', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rapat_r3">Rapat R3</Label>
                                                <Input
                                                    id="rapat_r3"
                                                    type="text"
                                                    value={data.rapat_r3}
                                                    onChange={(e) => setData('rapat_r3', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="rapat_p1">Rapat P1</Label>
                                                <Input
                                                    id="rapat_p1"
                                                    type="text"
                                                    value={data.rapat_p1}
                                                    onChange={(e) => setData('rapat_p1', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rapat_p2">Rapat P2</Label>
                                                <Input
                                                    id="rapat_p2"
                                                    type="text"
                                                    value={data.rapat_p2}
                                                    onChange={(e) => setData('rapat_p2', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rapat_p3">Rapat P3</Label>
                                                <Input
                                                    id="rapat_p3"
                                                    type="text"
                                                    value={data.rapat_p3}
                                                    onChange={(e) => setData('rapat_p3', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ket">Keterangan</Label>
                                            <Input
                                                id="ket"
                                                type="text"
                                                value={data.ket}
                                                onChange={(e) => setData('ket', e.target.value)}
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            {editingItem && (
                                                <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1">
                                                    Batal
                                                </Button>
                                            )}
                                            <Button type="submit" disabled={processing} className={editingItem ? 'flex-[2]' : 'w-full'}>
                                                {editingItem ? 'Simpan Perubahan' : 'Simpan Perencanaan'}
                                            </Button>
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
                                <CardTitle className="text-lg">Data Jadwal Outage</CardTitle>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative w-40">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari..."
                                            className="pl-9 h-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border">
                                        Total: {filteredOutagePlans.length}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table className="whitespace-nowrap">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="text-center font-bold border-r last:border-r-0 px-2">No</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">Mesin</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">Scope</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">Jenis</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">Durasi</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">Mulai</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">Selesai</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">Progres</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">R2</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">R3</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">P1</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">P2</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">P3</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0 px-2">Ket</TableHead>
                                                <TableHead className="text-center font-bold border-r last:border-r-0 px-2">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                    <TableBody>
                                        {filteredOutagePlans.length > 0 ? (
                                            filteredOutagePlans.map((plan, idx) => (
                                                <TableRow key={plan.id} className="hover:bg-muted/30">
                                                    <TableCell className="text-center border-r last:border-r-0 font-mono text-xs text-muted-foreground px-2">{idx + 1}</TableCell>
                                                    <TableCell className="font-medium border-r last:border-r-0 px-2 text-xs">{plan.mesin_pembangkit}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.scope}</TableCell>
                                                    <TableCell className="uppercase text-xs font-semibold border-r last:border-r-0 text-center px-2">{plan.jenis_pembangkit}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center px-2">
                                                        <div className="flex items-center justify-center gap-1 text-xs">
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                            {plan.durasi}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.start_date}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.selesai}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs font-medium px-2">
                                                        {plan.progress}
                                                    </TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.rapat_r2 || '-'}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.rapat_r3 || '-'}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.rapat_p1 || '-'}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.rapat_p2 || '-'}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.rapat_p3 || '-'}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center text-xs px-2">{plan.ket}</TableCell>
                                                    <TableCell className="text-center border-r last:border-r-0 px-2">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                                                                onClick={() => handleEdit(plan)}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDelete(plan.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
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
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

OutagePlansIndex.layout = {
    breadcrumbs: [
        {
            title: 'Perencanaan dan Jadwal Outage',
            href: '/outage-plans', // This should match your route
        },
    ],
};
