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
    const [filterKeterangan, setFilterKeterangan] = useState('all');
    const [filterSistem, setFilterSistem] = useState('all');
    const [editingItem, setEditingItem] = useState<any>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        mesin_pembangkit: '',
        scope: 'final stage',
        jenis_pembangkit: 'pltd',
        durasi_hari: '',
        progres_persen: '',
        rapat: '',
        keterangan: 'open',
        sistem: 'RAHA',
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
                plan.scope?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                plan.sistem?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesScope = filterScope === 'all' || plan.scope === filterScope;
            const matchesJenis = filterJenis === 'all' || plan.jenis_pembangkit?.toLowerCase() === filterJenis.toLowerCase();
            const matchesKeterangan = filterKeterangan === 'all' || plan.keterangan === filterKeterangan;
            const matchesSistem = filterSistem === 'all' || plan.sistem === filterSistem;

            return matchesSearch && matchesScope && matchesJenis && matchesKeterangan && matchesSistem;
        });
    }, [outagePlans, searchTerm, filterScope, filterJenis, filterKeterangan, filterSistem]);

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
            scope: plan.scope || 'final stage',
            jenis_pembangkit: plan.jenis_pembangkit || 'pltd',
            durasi_hari: plan.durasi_hari?.toString() || '',
            progres_persen: plan.progres_persen?.toString() || '',
            rapat: plan.rapat || '',
            keterangan: plan.keterangan || 'open',
            sistem: plan.sistem || 'RAHA',
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
                                            <Select value={data.scope} onValueChange={(val) => setData('scope', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Scope" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="final stage">Final Stage</SelectItem>
                                                    <SelectItem value="second tage">Second Tage</SelectItem>
                                                    <SelectItem value="TO">TO</SelectItem>
                                                    <SelectItem value="MO">MO</SelectItem>
                                                    <SelectItem value="PMS 24 K">PMS 24 K</SelectItem>
                                                    <SelectItem value="SO">SO</SelectItem>
                                                    <SelectItem value="PM 20 K">PM 20 K</SelectItem>
                                                    <SelectItem value="2 ND STAGE">2 ND STAGE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.scope && <p className="text-xs text-destructive">{errors.scope}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="jenis_pembangkit">Jenis</Label>
                                            <Select value={data.jenis_pembangkit} onValueChange={(val) => setData('jenis_pembangkit', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Jenis" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pltd">PLTD</SelectItem>
                                                    <SelectItem value="pltm">PLTM</SelectItem>
                                                    <SelectItem value="pltmg">PLTMG</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="durasi_hari">Durasi (Hari)</Label>
                                            <Input
                                                id="durasi_hari"
                                                type="number"
                                                value={data.durasi_hari}
                                                onChange={(e) => setData('durasi_hari', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="progres_persen">Progres (%)</Label>
                                            <Input
                                                id="progres_persen"
                                                type="number"
                                                value={data.progres_persen}
                                                onChange={(e) => setData('progres_persen', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="rapat">Tanggal Rapat</Label>
                                            <Input
                                                id="rapat"
                                                type="date"
                                                value={data.rapat}
                                                onChange={(e) => setData('rapat', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="keterangan">Keterangan</Label>
                                            <Select value={data.keterangan} onValueChange={(val) => setData('keterangan', val)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="close">Close</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sistem">Sistem</Label>
                                            <Select value={data.sistem} onValueChange={(val) => setData('sistem', val)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="RAHA">RAHA</SelectItem>
                                                    <SelectItem value="BAU BAU">BAU BAU</SelectItem>
                                                    <SelectItem value="WAKATOBI">WAKATOBI</SelectItem>
                                                    <SelectItem value="WAWONII">WAWONII</SelectItem>
                                                    <SelectItem value="EREKE">EREKE</SelectItem>
                                                    <SelectItem value="SUB. SISTEM KENDARI">SUB. SISTEM KENDARI</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                    <Select value={filterScope} onValueChange={setFilterScope}>
                                        <SelectTrigger className="h-9 w-[130px] text-xs">
                                            <SelectValue placeholder="Scope" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Scope</SelectItem>
                                            <SelectItem value="final stage">Final Stage</SelectItem>
                                            <SelectItem value="second tage">Second Tage</SelectItem>
                                            <SelectItem value="TO">TO</SelectItem>
                                            <SelectItem value="MO">MO</SelectItem>
                                            <SelectItem value="PMS 24 K">PMS 24 K</SelectItem>
                                            <SelectItem value="SO">SO</SelectItem>
                                            <SelectItem value="PM 20 K">PM 20 K</SelectItem>
                                            <SelectItem value="2 ND STAGE">2 ND STAGE</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={filterJenis} onValueChange={setFilterJenis}>
                                        <SelectTrigger className="h-9 w-[120px] text-xs">
                                            <SelectValue placeholder="Jenis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Jenis</SelectItem>
                                            <SelectItem value="pltd">PLTD</SelectItem>
                                            <SelectItem value="pltm">PLTM</SelectItem>
                                            <SelectItem value="pltmg">PLTMG</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={filterKeterangan} onValueChange={setFilterKeterangan}>
                                        <SelectTrigger className="h-9 w-[120px] text-xs">
                                            <SelectValue placeholder="Ket" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Ket</SelectItem>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="close">Close</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={filterSistem} onValueChange={setFilterSistem}>
                                        <SelectTrigger className="h-9 w-[140px] text-xs">
                                            <SelectValue placeholder="Sistem" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Sistem</SelectItem>
                                            <SelectItem value="RAHA">RAHA</SelectItem>
                                            <SelectItem value="BAU BAU">BAU BAU</SelectItem>
                                            <SelectItem value="WAKATOBI">WAKATOBI</SelectItem>
                                            <SelectItem value="WAWONII">WAWONII</SelectItem>
                                            <SelectItem value="EREKE">EREKE</SelectItem>
                                            <SelectItem value="SUB. SISTEM KENDARI">SUB. SISTEM KENDARI</SelectItem>
                                        </SelectContent>
                                    </Select>

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
                            <CardContent className="p-0">
                                <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-12 text-center font-bold border-r last:border-r-0">No</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0">Mesin Pembangkit</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0">Scope</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0">Jenis</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0">Durasi</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0">Progres</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0">Tgl Rapat</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0">Ket</TableHead>
                                                <TableHead className="font-bold text-center border-r last:border-r-0">Sistem</TableHead>
                                                <TableHead className="w-[80px] text-center font-bold border-r last:border-r-0">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                    <TableBody>
                                        {filteredOutagePlans.length > 0 ? (
                                            filteredOutagePlans.map((plan, idx) => (
                                                <TableRow key={plan.id} className="hover:bg-muted/30">
                                                    <TableCell className="text-center border-r last:border-r-0 font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                                                    <TableCell className="font-medium whitespace-nowrap border-r last:border-r-0">{plan.mesin_pembangkit}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center">
                                                        <div className="flex justify-center">
                                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                                                                {plan.scope}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="uppercase text-xs font-semibold border-r last:border-r-0 text-center">{plan.jenis_pembangkit}</TableCell>
                                                    <TableCell className="whitespace-nowrap border-r last:border-r-0 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                            {plan.durasi_hari} Hari
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-r last:border-r-0">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${parseInt(plan.progres_persen) >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                                                                    style={{ width: `${plan.progres_persen}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-medium">{plan.progres_persen}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap border-r last:border-r-0 text-center">{plan.rapat || '-'}</TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-center">
                                                        <div className="flex justify-center">
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                                                                plan.keterangan === 'open' 
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' 
                                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-amber-800'
                                                            }`}>
                                                                {plan.keterangan}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground border-r last:border-r-0 text-center">{plan.sistem}</TableCell>
                                                    <TableCell className="text-center border-r last:border-r-0">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                                onClick={() => handleEdit(plan)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDelete(plan.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
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
