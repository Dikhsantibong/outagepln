import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    ChevronDown,
    ChevronRight,
    Filter,
    Pencil,
    Plus,
    Search,
    Server,
    Trash2,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

const angka = (nilai: number | null) =>
    nilai === null ? '—' : nilai.toLocaleString('id-ID');

export default function UnitsIndex({ units }: { units: Unit[] }) {
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [terbuka, setTerbuka] = useState<number[]>([]);

    const filteredUnits = units.filter(
        (u) =>
            (u.nama_sentral || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.unit_pelaksana || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.nama_rayon || '').toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const totalMesin = units.reduce((n, u) => n + u.mesins.length, 0);
    const unitKosong = units.filter((u) => u.mesins.length === 0).length;

    const unitForm = useForm({
        nama_sentral: '',
        nama_rayon: '',
        unit_pelaksana: '',
        milik: '',
    });

    const toggle = (id: number) => {
        setTerbuka((ids) =>
            ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
        );
    };

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
            unitForm.put(`/master/units/${editingUnit.id_unit}`, {
                onSuccess: () => setEditingUnit(null),
            });

            return;
        }

        unitForm.post('/master/units', {
            onSuccess: () => setEditingUnit(null),
        });
    };

    const deleteUnit = (id: number) => {
        if (confirm('Hapus unit ini?')) {
            router.delete(`/master/units/${id}`);
        }
    };

    return (
        <>
            <Head title="Data Unit & Mesin" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Data Unit &amp; Mesin
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Master data unit pembangkit beserta mesin yang berada di
                            bawahnya
                        </p>
                    </div>
                    <Button onClick={openCreateUnit} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Unit
                    </Button>
                </div>

                {/* Ringkasan */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <Building2 className="h-3 w-3" />
                            Total Unit
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{units.length}</p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <Server className="h-3 w-3" />
                            Total Mesin
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{totalMesin}</p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-emerald-500 bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Unit Bermesin
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {units.length - unitKosong}
                        </p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-amber-500 bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Unit Kosong
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{unitKosong}</p>
                    </div>
                </div>

                <Card className="flex flex-1 flex-col overflow-hidden rounded-md border-sidebar-border/60 py-0 shadow-sm">
                    {/* Filter */}
                    <div className="flex flex-col justify-between gap-3 border-b bg-muted/50 px-4 py-3 xl:flex-row xl:items-end">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="mb-1.5 flex items-center gap-2 border-r pr-3">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Filter
                                </span>
                            </div>
                            <p className="mb-1.5 text-[11px] text-muted-foreground">
                                Ketik pada kotak pencarian untuk menyaring unit, rayon,
                                atau pelaksana.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari unit, rayon, pelaksana..."
                                className="h-8 rounded-sm bg-background pl-8 text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b bg-muted/25 px-4 py-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <ChevronRight className="h-3.5 w-3.5" />
                            Klik nama unit untuk melihat mesin di dalamnya
                        </span>
                        <span className="ml-auto">
                            Unit yang masih punya mesin tidak dapat dihapus
                        </span>
                    </div>

                    {/* Tabel */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="w-[42px] border-b px-2 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        No
                                    </th>
                                    <th className="w-[260px] border-b px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Nama Sentral
                                    </th>
                                    <th className="w-[160px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Rayon
                                    </th>
                                    <th className="w-[170px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Pelaksana
                                    </th>
                                    <th className="w-[110px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Milik
                                    </th>
                                    <th className="w-[110px] border-b border-l px-3 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Mesin
                                    </th>
                                    <th className="w-[100px] border-b border-l px-2 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUnits.length > 0 ? (
                                    filteredUnits.map((u, i) => {
                                        const dibuka = terbuka.includes(u.id_unit);
                                        const punyaMesin = u.mesins.length > 0;

                                        return (
                                            <Fragment key={u.id_unit}>
                                                <tr
                                                    className={`border-b transition-colors hover:bg-muted/40 ${
                                                        i % 2 === 1 ? 'bg-muted/20' : ''
                                                    }`}
                                                >
                                                    <td className="px-2 py-2 text-center align-middle font-mono text-xs text-muted-foreground">
                                                        {i + 1}
                                                    </td>
                                                    <td className="px-3 py-2 align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggle(u.id_unit)}
                                                            aria-expanded={dibuka}
                                                            disabled={!punyaMesin}
                                                            className="flex w-full items-center gap-1.5 text-left disabled:cursor-default"
                                                        >
                                                            {punyaMesin ? (
                                                                dibuka ? (
                                                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                )
                                                            ) : (
                                                                <span className="w-4 shrink-0" />
                                                            )}
                                                            <span className="min-w-0 flex-1 text-[13px] leading-tight font-semibold text-foreground">
                                                                {u.nama_sentral}
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td className="border-l px-3 py-2 align-middle text-xs">
                                                        {u.nama_rayon || '—'}
                                                    </td>
                                                    <td className="border-l px-3 py-2 align-middle text-xs">
                                                        {u.unit_pelaksana || '—'}
                                                    </td>
                                                    <td className="border-l px-3 py-2 align-middle">
                                                        <span className="inline-flex items-center rounded border bg-background px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                                            {u.milik || 'tidak diisi'}
                                                        </span>
                                                    </td>
                                                    <td className="border-l px-3 py-2 text-center align-middle">
                                                        <Link
                                                            href={`/master/units/${u.id_unit}/mesins`}
                                                            className="inline-flex items-center gap-1 rounded bg-muted-foreground/10 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted-foreground/20 hover:text-foreground"
                                                        >
                                                            <Server className="h-3 w-3" />
                                                            {u.mesins.length} mesin
                                                        </Link>
                                                    </td>
                                                    <td className="border-l px-2 py-2 align-middle">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                title="Ubah unit"
                                                                onClick={() => openEditUnit(u)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
                                                                title={
                                                                    punyaMesin
                                                                        ? 'Kosongkan mesinnya dulu sebelum menghapus unit'
                                                                        : 'Hapus unit'
                                                                }
                                                                onClick={() => deleteUnit(u.id_unit)}
                                                                disabled={punyaMesin}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {dibuka && punyaMesin && (
                                                    <tr>
                                                        <td
                                                            colSpan={7}
                                                            className="border-b bg-muted/45 p-0"
                                                        >
                                                            <div className="px-4 py-3">
                                                                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                                        <Server className="h-3.5 w-3.5" />
                                                                        Mesin di {u.nama_sentral}
                                                                    </p>
                                                                    <span className="text-[11px] text-muted-foreground">
                                                                        — {u.mesins.length} mesin
                                                                    </span>
                                                                    <Link
                                                                        href={`/master/units/${u.id_unit}/mesins`}
                                                                        className="ml-auto text-[11px] font-semibold text-foreground underline underline-offset-2"
                                                                    >
                                                                        Kelola mesin
                                                                    </Link>
                                                                </div>

                                                                <div className="overflow-x-auto rounded border bg-background">
                                                                    <table className="w-full min-w-[620px] border-collapse text-xs">
                                                                        <thead>
                                                                            <tr className="border-b bg-muted/70">
                                                                                <th className="w-[60px] px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                    Urut
                                                                                </th>
                                                                                <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                    Nama Mesin
                                                                                </th>
                                                                                <th className="w-[150px] px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                    Merk
                                                                                </th>
                                                                                <th className="w-[120px] px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                                                    Jenis
                                                                                </th>
                                                                                <th className="w-[130px] px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground">
                                                                                    Daya (kW)
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {u.mesins.map((m) => (
                                                                                <tr
                                                                                    key={m.id_mesin}
                                                                                    className="border-b last:border-b-0"
                                                                                >
                                                                                    <td className="px-3 py-2 font-mono text-muted-foreground">
                                                                                        {m.no_urut}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 font-medium text-foreground">
                                                                                        {m.nama_mesin}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-muted-foreground">
                                                                                        {m.pgk_merk || '—'}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-muted-foreground">
                                                                                        {m.jenis_pembangkit || '—'}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right font-mono">
                                                                                        {angka(m.daya_terpasang_kw)}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="h-32 text-center text-sm text-muted-foreground"
                                        >
                                            Tidak ada unit yang sesuai dengan pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
                        <div>
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">
                                {filteredUnits.length}
                            </span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">
                                {units.length}
                            </span>{' '}
                            unit
                        </div>
                        <div>
                            <span className="font-semibold text-foreground">{totalMesin}</span>{' '}
                            mesin terdaftar
                        </div>
                    </div>
                </Card>
            </div>

            {/* Dialog tambah / ubah unit */}
            <Dialog open={!!editingUnit} onOpenChange={(v) => !v && setEditingUnit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {editingUnit?.id_unit
                                ? 'Ubah Unit Pembangkit'
                                : 'Tambah Unit Pembangkit'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submitUnit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="nama_sentral">Nama Sentral</Label>
                            <Input
                                id="nama_sentral"
                                value={unitForm.data.nama_sentral}
                                onChange={(e) =>
                                    unitForm.setData('nama_sentral', e.target.value)
                                }
                                placeholder="Contoh: PLTD Sei Raya"
                                required
                            />
                            {unitForm.errors.nama_sentral && (
                                <p className="text-xs text-destructive">
                                    {unitForm.errors.nama_sentral}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="nama_rayon">Nama Rayon (opsional)</Label>
                            <Input
                                id="nama_rayon"
                                value={unitForm.data.nama_rayon}
                                onChange={(e) =>
                                    unitForm.setData('nama_rayon', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="unit_pelaksana">
                                Unit Pelaksana (opsional)
                            </Label>
                            <Input
                                id="unit_pelaksana"
                                value={unitForm.data.unit_pelaksana}
                                onChange={(e) =>
                                    unitForm.setData('unit_pelaksana', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="milik">Milik (opsional)</Label>
                            <Input
                                id="milik"
                                value={unitForm.data.milik}
                                onChange={(e) => unitForm.setData('milik', e.target.value)}
                                placeholder="Contoh: PLN / Sewa"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingUnit(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={unitForm.processing}>
                                Simpan Data Unit
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

UnitsIndex.layout = {
    breadcrumbs: [
        { title: 'Data Master', href: '#' },
        { title: 'Unit & Mesin', href: '/master/units' },
    ],
};
