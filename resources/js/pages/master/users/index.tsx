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
import { Checkbox } from '@/components/ui/checkbox';
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
    menu_access: string[] | null;
}

export default function UsersIndex({
    users,
    availableMenus,
}: {
    users: User[];
    availableMenus: Record<string, string>;
}) {
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data, setData, put, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'tamu',
        merek: '',
        menu_access: Object.keys(availableMenus),
    });

    const openEdit = (user: User) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            merek: user.merek || '',
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
        } else {
            post(`/master/users`, {
                onSuccess: () => setEditingUser(null),
            });
        }
    };

    const toggleMenu = (menuKey: string, checked: boolean) => {
        if (checked) {
            setData('menu_access', [...data.menu_access, menuKey]);
        } else {
            setData('menu_access', data.menu_access.filter((k) => k !== menuKey));
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus user ini?')) {
            router.delete(`/master/users/${id}`);
        }
    };

    return (
        <>
            <Head title="Master Users" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Data Users & Hak Akses</h1>
                    <Button onClick={openCreate}>Tambah User</Button>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Merek (Pengelola)</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell className="uppercase">{u.role}</TableCell>
                                    <TableCell>{u.merek || '-'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEdit(u)}
                                        >
                                            Edit
                                        </Button>
                                        {u.role !== 'super_admin' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(u.id)}
                                            >
                                                Hapus
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        Tidak ada data
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={!!editingUser} onOpenChange={(v) => !v && setEditingUser(null)}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser?.id ? 'Edit User' : 'Tambah User'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4 mt-4">
                        <div className="space-y-1">
                            <Label>Nama</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label>Password {editingUser?.id && '(Kosongkan jika tidak ingin diubah)'}</Label>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required={!editingUser?.id}
                            />
                            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                        </div>

                        {editingUser?.role !== 'super_admin' && (
                            <div className="space-y-1">
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
                                {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                            </div>
                        )}

                        {data.role === 'pengelola' && (
                            <div className="space-y-1">
                                <Label>Merek Mesin</Label>
                                <Input
                                    value={data.merek}
                                    onChange={(e) => setData('merek', e.target.value)}
                                    placeholder="Contoh: MAK"
                                />
                                {errors.merek && <p className="text-sm text-red-500">{errors.merek}</p>}
                            </div>
                        )}

                        {editingUser?.role !== 'super_admin' && (
                            <div className="space-y-2 pt-4">
                                <Label className="text-base font-semibold">Izin Akses Menu</Label>
                                <p className="text-xs text-muted-foreground pb-2">
                                    Pilih menu apa saja yang dapat diakses oleh user ini.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(availableMenus).map(([key, label]) => (
                                        <div key={key} className="flex items-start space-x-2">
                                            <Checkbox
                                                id={`menu-${key}`}
                                                checked={data.menu_access.includes(key)}
                                                onCheckedChange={(c) => toggleMenu(key, !!c)}
                                            />
                                            <label
                                                htmlFor={`menu-${key}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
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

UsersIndex.layout = (page: any) => <AppLayout children={page} breadcrumbs={[{ title: 'Data Master', url: '#' }, { title: 'Users' }]} />;
