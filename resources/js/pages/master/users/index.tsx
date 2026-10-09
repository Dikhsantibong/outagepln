import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Factory,
    Filter,
    KeyRound,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    merek: string | null;
    unit: string | null;
    /** Seluruh unit kelola akun; kosong = semua unit mereknya. */
    units: string[];
    tipe: string | null;
    menu_access: string[] | null;
    label_kelola: string | null;
}

/** Nilai penanda "tidak dipatok", karena SelectItem tidak menerima value kosong. */
const SEMUA_TIPE = '__semua_tipe__';

/** Sama dengan User::MENU_RAPAT di server. */
const MENU_RAPAT = ['rapat-outage', 'daily-meeting'];

const ROLE_LABEL: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    pengelola: 'Pengelola',
    tamu: 'Tamu',
};

const ROLE_WARNA: Record<string, string> = {
    super_admin: 'border-l-violet-500',
    admin: 'border-l-sky-500',
    pengelola: 'border-l-emerald-500',
    tamu: 'border-l-slate-400',
};

export default function UsersIndex({
    users,
    availableMenus,
    availableMereks,
    unitsPerMerek,
    tipePerMerek = {},
    unitsPerMerekTipe = {},
}: {
    users: User[];
    availableMenus: Record<string, string>;
    availableMereks: string[];
    unitsPerMerek: Record<string, string[]>;
    /** Tipe mesin per merek; value = bentuk baku, label = tulisan di Data Mesin. */
    tipePerMerek?: Record<string, { value: string; label: string }[]>;
    /** Unit per kombinasi "MEREK|TIPE". */
    unitsPerMerekTipe?: Record<string, string[]>;
}) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, put, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'tamu',
        merek: '',
        units: [] as string[],
        tipe: '',
        menu_access: Object.keys(availableMenus),
    });

    const totalMenu = Object.keys(availableMenus).length;

    const filteredUsers = users.filter((u) =>
        [u.name, u.email, ROLE_LABEL[u.role] ?? u.role, u.label_kelola ?? '']
            .join(' ')
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
    );

    const jumlahPengelola = users.filter((u) => u.role === 'pengelola').length;
    const jumlahPerUnit = users.filter(
        (u) => u.role === 'pengelola' && u.units.length > 0,
    ).length;

    /** Unit yang tersedia mengikuti merek yang sedang dipilih di form. */
    /** Tipe yang tersedia mengikuti merek yang sedang dipilih. */
    const tipeOptions = useMemo(
        () => tipePerMerek[data.merek] ?? [],
        [tipePerMerek, data.merek],
    );

    /** Label tipe untuk ditampilkan, mis. "QSK23G3" → "QSK23-G3". */
    const labelTipe = (merek: string | null, tipe: string | null) =>
        (merek && tipePerMerek[merek]?.find((t) => t.value === tipe)?.label) || tipe;

    /** Unit menyempit ke tempat tipe tersebut terpasang bila tipenya dipilih. */
    const unitOptions = useMemo(
        () =>
            data.tipe
                ? (unitsPerMerekTipe[`${data.merek}|${data.tipe}`] ?? [])
                : (unitsPerMerek[data.merek] ?? []),
        [unitsPerMerek, unitsPerMerekTipe, data.merek, data.tipe],
    );

    const openEdit = (user: User) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            merek: user.merek || '',
            units: user.units ?? [],
            tipe: user.tipe || '',
            menu_access: user.menu_access || Object.keys(availableMenus),
        });
    };

    const openCreate = () => {
        setEditingUser({ id: 0 } as User);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser?.id) {
            put(`/master/users/${editingUser.id}`, {
                onSuccess: () => setEditingUser(null),
            });

            return;
        }

        post('/master/users', {
            onSuccess: () => setEditingUser(null),
        });
    };

    /** Ganti merek membatalkan unit lama, karena unitnya belum tentu ada di merek baru. */
    const pilihMerek = (merek: string) => {
        setData((sebelumnya) => ({ ...sebelumnya, merek, units: [], tipe: '' }));
    };

    /** Ganti tipe membatalkan unit yang tidak memasang tipe itu. */
    const pilihTipe = (val: string) => {
        const tipe = val === SEMUA_TIPE ? '' : val;
        const unitTersedia = tipe
            ? (unitsPerMerekTipe[`${data.merek}|${tipe}`] ?? [])
            : (unitsPerMerek[data.merek] ?? []);

        setData((sebelumnya) => ({
            ...sebelumnya,
            tipe,
            units: sebelumnya.units.filter((u) => unitTersedia.includes(u)),
        }));
    };

    /** Centang/lepas satu unit; tanpa centang berarti seluruh unit mereknya. */
    const toggleUnit = (unit: string, checked: boolean) => {
        setData(
            'units',
            checked
                ? [...data.units, unit]
                : data.units.filter((u) => u !== unit),
        );
    };

    /** Keterangan di bawah daftar unit. */
    const keteranganUnit = () => {
        if (!data.merek) {
            return 'Pilih merek mesin lebih dulu untuk melihat daftar unitnya.';
        }

        const mesin = data.tipe
            ? `${data.merek} tipe ${labelTipe(data.merek, data.tipe)}`
            : data.merek;

        return data.units.length > 0
            ? `Akun ini memegang mesin ${mesin} di ${data.units.length} unit terpilih.`
            : `Tanpa centang: akun memegang mesin ${mesin} di seluruh unit (${unitOptions.length} unit). Centang satu atau beberapa unit untuk membatasinya.`;
    };

    const toggleMenu = (menuKey: string, checked: boolean) => {
        setData(
            'menu_access',
            checked
                ? [...data.menu_access, menuKey]
                : data.menu_access.filter((k) => k !== menuKey),
        );
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus user ini?')) {
            router.delete(`/master/users/${id}`);
        }
    };

    return (
        <>
            <Head title="Data Users & Hak Akses" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Data Users &amp; Hak Akses
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Master data akun beserta wilayah kelola dan menu yang
                            boleh dibukanya
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah User
                    </Button>
                </div>

                {/* Ringkasan */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <Users className="h-3 w-3" />
                            Total User
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{users.length}</p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <UserCog className="h-3 w-3" />
                            Pengelola
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{jumlahPengelola}</p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-emerald-500 bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Dipatok Per Unit
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{jumlahPerUnit}</p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-amber-500 bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Lintas Unit
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {jumlahPengelola - jumlahPerUnit}
                        </p>
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
                                Ketik pada kotak pencarian untuk menyaring nama,
                                email, role, atau wilayah kelola.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, email, merek, unit..."
                                className="h-8 rounded-sm bg-background pl-8 text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b bg-muted/25 px-4 py-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Factory className="h-3.5 w-3.5" />
                            Pengelola tanpa unit melihat mereknya di seluruh unit
                        </span>
                        <span className="ml-auto">Super admin tidak dapat dihapus</span>
                    </div>

                    {/* Tabel */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="w-[42px] border-b px-2 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        No
                                    </th>
                                    <th className="w-[220px] border-b px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Nama
                                    </th>
                                    <th className="w-[230px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Email
                                    </th>
                                    <th className="w-[120px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Role
                                    </th>
                                    <th className="w-[150px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Merek
                                    </th>
                                    <th className="w-[170px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Unit
                                    </th>
                                    <th className="w-[110px] border-b border-l px-3 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Menu
                                    </th>
                                    <th className="w-[100px] border-b border-l px-2 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((u, i) => {
                                        const superAdmin = u.role === 'super_admin';
                                        const jumlahMenu = superAdmin
                                            ? totalMenu
                                            : (u.menu_access?.length ?? totalMenu);

                                        return (
                                            <tr
                                                key={u.id}
                                                className={`border-b transition-colors hover:bg-muted/40 ${
                                                    i % 2 === 1 ? 'bg-muted/20' : ''
                                                }`}
                                            >
                                                <td className="px-2 py-2 text-center align-middle font-mono text-xs text-muted-foreground">
                                                    {i + 1}
                                                </td>
                                                <td className="px-3 py-2 align-middle">
                                                    <span className="text-[13px] leading-tight font-semibold text-foreground">
                                                        {u.name}
                                                    </span>
                                                </td>
                                                <td className="border-l px-3 py-2 align-middle text-xs text-muted-foreground">
                                                    {u.email}
                                                </td>
                                                <td className="border-l px-3 py-2 align-middle">
                                                    <span
                                                        className={`inline-flex items-center rounded border border-l-[3px] bg-background px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase ${
                                                            ROLE_WARNA[u.role] ??
                                                            'border-l-slate-400'
                                                        }`}
                                                    >
                                                        {ROLE_LABEL[u.role] ?? u.role}
                                                    </span>
                                                </td>
                                                <td className="border-l px-3 py-2 align-middle text-xs">
                                                    {u.merek || '—'}
                                                    {u.tipe && (
                                                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                            Tipe {labelTipe(u.merek, u.tipe)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="border-l px-3 py-2 align-middle text-xs">
                                                    {u.units.length > 0 ? (
                                                        <span className="flex flex-col gap-0.5">
                                                            {u.units.map((unit) => (
                                                                <span key={unit} className="inline-flex items-center gap-1 font-medium text-foreground">
                                                                    <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                                    {unit}
                                                                </span>
                                                            ))}
                                                        </span>
                                                    ) : u.merek ? (
                                                        <span className="text-muted-foreground">
                                                            Semua unit
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="border-l px-3 py-2 text-center align-middle">
                                                    <span className="inline-flex items-center gap-1 rounded bg-muted-foreground/10 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        {jumlahMenu}/{totalMenu}
                                                    </span>
                                                </td>
                                                <td className="border-l px-2 py-2 align-middle">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                            title="Ubah user"
                                                            onClick={() => openEdit(u)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
                                                            title={
                                                                superAdmin
                                                                    ? 'Super admin tidak dapat dihapus'
                                                                    : 'Hapus user'
                                                            }
                                                            onClick={() => handleDelete(u.id)}
                                                            disabled={superAdmin}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="h-32 text-center text-sm text-muted-foreground"
                                        >
                                            Tidak ada user yang sesuai dengan pencarian.
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
                                {filteredUsers.length}
                            </span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">
                                {users.length}
                            </span>{' '}
                            user
                        </div>
                        <div>
                            <span className="font-semibold text-foreground">
                                {jumlahPerUnit}
                            </span>{' '}
                            akun pengelola terpisah per unit
                        </div>
                    </div>
                </Card>
            </div>

            {/* Dialog tambah / ubah user */}
            <Dialog open={!!editingUser} onOpenChange={(v) => !v && setEditingUser(null)}>
                <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            {editingUser?.id ? 'Ubah User' : 'Tambah User'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Nama</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Pengelola MIRRLEES PLTD POASIA"
                                required
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5" />
                                Password
                                {editingUser?.id ? (
                                    <span className="font-normal text-muted-foreground">
                                        (kosongkan bila tidak diubah)
                                    </span>
                                ) : null}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required={!editingUser?.id}
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                        {editingUser?.role !== 'super_admin' && (
                            <div className="space-y-1.5">
                                <Label>Role</Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(val) =>
                                        setData((sebelumnya) => ({
                                            ...sebelumnya,
                                            role: val,
                                            // Akun pengelola baru tidak otomatis mendapat menu
                                            // rapat; super admin mencentangnya bila memang perlu.
                                            menu_access:
                                                val === 'pengelola' && !editingUser?.id
                                                    ? sebelumnya.menu_access.filter(
                                                          (m) => !MENU_RAPAT.includes(m),
                                                      )
                                                    : sebelumnya.menu_access,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tamu">Tamu</SelectItem>
                                        <SelectItem value="pengelola">Pengelola</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-xs text-destructive">{errors.role}</p>
                                )}
                            </div>
                        )}

                        {data.role === 'pengelola' && (
                            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                                <div className="flex items-center gap-2">
                                    <Factory className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-semibold">Wilayah Kelola</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Merek Mesin</Label>
                                    <Select value={data.merek} onValueChange={pilihMerek}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Pilih merek mesin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableMereks.map((merek) => (
                                                <SelectItem key={merek} value={merek}>
                                                    {merek}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.merek && (
                                        <p className="text-xs text-destructive">
                                            {errors.merek}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Tipe Mesin</Label>
                                    <Select
                                        value={data.tipe || SEMUA_TIPE}
                                        onValueChange={pilihTipe}
                                        disabled={!data.merek}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Pilih tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={SEMUA_TIPE}>
                                                Semua tipe merek ini
                                            </SelectItem>
                                            {tipeOptions.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.tipe && (
                                        <p className="text-xs text-destructive">
                                            {errors.tipe}
                                        </p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground">
                                        {data.merek
                                            ? `Pilih satu tipe agar akun ini hanya memegang mesin ${data.merek} bertipe tersebut — di unit mana pun, kecuali unitnya juga dipilih. ${tipeOptions.length} tipe tersedia.`
                                            : 'Pilih merek mesin lebih dulu untuk melihat daftar tipenya.'}
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label>Unit (bisa lebih dari satu)</Label>
                                        {data.units.length > 0 && (
                                            <button
                                                type="button"
                                                className="text-[11px] text-primary hover:underline"
                                                onClick={() => setData('units', [])}
                                            >
                                                Kosongkan (semua unit)
                                            </button>
                                        )}
                                    </div>
                                    {data.merek &&
                                        (unitOptions.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2 rounded-md border bg-background p-2.5 sm:grid-cols-2">
                                                {unitOptions.map((unit) => (
                                                    <div key={unit} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`unit-${unit}`}
                                                            checked={data.units.includes(unit)}
                                                            onCheckedChange={(c) => toggleUnit(unit, c === true)}
                                                        />
                                                        <label htmlFor={`unit-${unit}`} className="text-xs">
                                                            {unit}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="rounded-md border border-dashed p-2.5 text-xs text-muted-foreground">
                                                Belum ada unit untuk pilihan ini.
                                            </p>
                                        ))}
                                    {errors.units && (
                                        <p className="text-xs text-destructive">
                                            {errors.units}
                                        </p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground">
                                        {keteranganUnit()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {editingUser?.role !== 'super_admin' && (
                            <div className="space-y-2 pt-1">
                                <Label className="text-base font-semibold">
                                    Izin Akses Menu
                                </Label>
                                <p className="pb-2 text-xs text-muted-foreground">
                                    Pilih menu apa saja yang dapat diakses oleh user ini.
                                </p>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {Object.entries(availableMenus).map(([key, label]) => (
                                        <div key={key} className="flex items-start space-x-2">
                                            <Checkbox
                                                id={`menu-${key}`}
                                                checked={data.menu_access.includes(key)}
                                                onCheckedChange={(c) => toggleMenu(key, !!c)}
                                            />
                                            <label
                                                htmlFor={`menu-${key}`}
                                                className="text-sm leading-none font-medium"
                                            >
                                                {label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingUser(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Simpan Data User
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        { title: 'Data Master', href: '#' },
        { title: 'Users & Hak Akses', href: '/master/users' },
    ],
};
