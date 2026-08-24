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
    menu_access: string[] | null;
    label_kelola: string | null;
}

/** Nilai penanda "tidak dipatok", karena SelectItem tidak menerima value kosong. */
const SEMUA_UNIT = '__semua__';

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
}: {
    users: User[];
    availableMenus: Record<string, string>;
    availableMereks: string[];
    unitsPerMerek: Record<string, string[]>;
}) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, put, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'tamu',
        merek: '',
        unit: '',
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
        (u) => u.role === 'pengelola' && u.unit,
    ).length;

    /** Unit yang tersedia mengikuti merek yang sedang dipilih di form. */
    const unitOptions = useMemo(
        () => unitsPerMerek[data.merek] ?? [],
        [unitsPerMerek, data.merek],
    );

    const openEdit = (user: User) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            merek: user.merek || '',
            unit: user.unit || '',
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
        setData((sebelumnya) => ({ ...sebelumnya, merek, unit: '' }));
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
                                                </td>
                                                <td className="border-l px-3 py-2 align-middle text-xs">
                                                    {u.unit ? (
                                                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                                            <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                            {u.unit}
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
                                    onValueChange={(val) => setData('role', val)}
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
                                    <Label>Unit</Label>
                                    <Select
                                        value={data.unit || SEMUA_UNIT}
                                        onValueChange={(val) =>
                                            setData('unit', val === SEMUA_UNIT ? '' : val)
                                        }
                                        disabled={!data.merek}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Pilih unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={SEMUA_UNIT}>
                                                Semua unit merek ini
                                            </SelectItem>
                                            {unitOptions.map((unit) => (
                                                <SelectItem key={unit} value={unit}>
                                                    {unit}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.unit && (
                                        <p className="text-xs text-destructive">
                                            {errors.unit}
                                        </p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground">
                                        {data.merek
                                            ? `Pilih satu unit agar akun ini hanya memegang mesin ${data.merek} di unit tersebut. ${unitOptions.length} unit tersedia.`
                                            : 'Pilih merek mesin lebih dulu untuk melihat daftar unitnya.'}
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
