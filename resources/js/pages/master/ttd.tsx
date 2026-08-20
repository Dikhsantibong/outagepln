import { Head, useForm } from '@inertiajs/react';
import { PenLine, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Ttd = {
    menyetujui_nama: string;
    menyetujui_jabatan: string;
    staf_nama: string;
    staf_jabatan: string;
};

export default function MasterTtd({ ttd }: { ttd: Ttd }) {
    const form = useForm({
        menyetujui_nama: ttd?.menyetujui_nama ?? '',
        menyetujui_jabatan: ttd?.menyetujui_jabatan ?? '',
        staf_nama: ttd?.staf_nama ?? '',
        staf_jabatan: ttd?.staf_jabatan ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put('/master/ttd', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Data Master - Tanda Tangan" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <PenLine className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Penandatangan</h1>
                        <p className="text-sm text-muted-foreground">
                            Nama & jabatan yang dipakai pada seluruh berkas bertanda tangan
                            (notulen temuan, notulen kick off, PDF &amp; Excel).
                        </p>
                    </div>
                </div>

                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Data Tanda Tangan</CardTitle>
                        <CardDescription>
                            Perubahan langsung berlaku untuk berkas yang dicetak/diekspor setelahnya.
                            Kiri = "Menyetujui / Pimpinan Rapat", kanan = "Dibuat / Notulis".
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Penandatangan kiri */}
                                <div className="space-y-4 rounded-lg border p-4">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">
                                        Menyetujui (Kiri)
                                    </h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="m_nama">Nama</Label>
                                        <Input
                                            id="m_nama"
                                            value={form.data.menyetujui_nama}
                                            onChange={(e) => form.setData('menyetujui_nama', e.target.value)}
                                            placeholder="ABDUL RAHMAN KADIR"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="m_jab">Jabatan</Label>
                                        <Input
                                            id="m_jab"
                                            value={form.data.menyetujui_jabatan}
                                            onChange={(e) => form.setData('menyetujui_jabatan', e.target.value)}
                                            placeholder="TEAM LEADER OUTAGE MANAGEMENT"
                                        />
                                    </div>
                                </div>

                                {/* Penandatangan kanan */}
                                <div className="space-y-4 rounded-lg border p-4">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-primary/80">
                                        Dibuat / Notulis (Kanan)
                                    </h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="s_nama">Nama</Label>
                                        <Input
                                            id="s_nama"
                                            value={form.data.staf_nama}
                                            onChange={(e) => form.setData('staf_nama', e.target.value)}
                                            placeholder="FIRMANSYAH"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="s_jab">Jabatan</Label>
                                        <Input
                                            id="s_jab"
                                            value={form.data.staf_jabatan}
                                            onChange={(e) => form.setData('staf_jabatan', e.target.value)}
                                            placeholder="OF OUTAGE MANAGEMENT"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t pt-4">
                                <Button type="submit" disabled={form.processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Simpan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MasterTtd.layout = {
    breadcrumbs: [
        { title: 'Data Master', href: '#' },
        { title: 'Tanda Tangan', href: '/master/ttd' },
    ],
};
