import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OutagePlansIndex({ outagePlans }: { outagePlans: any[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        mesin_pembangkit: '',
        scope: 'final stage',
        jenis_pembangkit: 'pltd',
        durasi_hari: '',
        progres_persen: '',
        rapat: '',
        keterangan: 'open',
        sistem: 'RAHA',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/outage-plans', {
            onSuccess: () => reset(),
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            router.delete(`/outage-plans/${id}`);
        }
    };

    return (
        <>
            <Head title="Perencanaan dan Jadwal Outage" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="col-span-1 border border-sidebar-border/70 dark:border-sidebar-border rounded-xl p-6 bg-card">
                        <h2 className="text-lg font-semibold mb-4">Tambah Jadwal Outage</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Label htmlFor="mesin_pembangkit">Mesin Pembangkit</Label>
                                <Input
                                    id="mesin_pembangkit"
                                    value={data.mesin_pembangkit}
                                    onChange={(e) => setData('mesin_pembangkit', e.target.value)}
                                    className="mt-1"
                                />
                                {errors.mesin_pembangkit && <div className="text-red-500 text-sm mt-1">{errors.mesin_pembangkit}</div>}
                            </div>

                            <div>
                                <Label htmlFor="scope">Scope</Label>
                                <select
                                    id="scope"
                                    value={data.scope}
                                    onChange={(e) => setData('scope', e.target.value)}
                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                >
                                    <option value="final stage">Final Stage</option>
                                    <option value="second tage">Second Tage</option>
                                    <option value="TO">TO</option>
                                    <option value="MO">MO</option>
                                    <option value="PMS 24 K">PMS 24 K</option>
                                    <option value="SO">SO</option>
                                    <option value="PM 20 K">PM 20 K</option>
                                    <option value="2 ND STAGE">2 ND STAGE</option>
                                </select>
                                {errors.scope && <div className="text-red-500 text-sm mt-1">{errors.scope}</div>}
                            </div>

                            <div>
                                <Label htmlFor="jenis_pembangkit">Jenis Pembangkit</Label>
                                <select
                                    id="jenis_pembangkit"
                                    value={data.jenis_pembangkit}
                                    onChange={(e) => setData('jenis_pembangkit', e.target.value)}
                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                >
                                    <option value="pltd">PLTD</option>
                                    <option value="pltm">PLTM</option>
                                    <option value="pltmg">PLTMG</option>
                                </select>
                                {errors.jenis_pembangkit && <div className="text-red-500 text-sm mt-1">{errors.jenis_pembangkit}</div>}
                            </div>

                            <div>
                                <Label htmlFor="durasi_hari">Durasi (Hari)</Label>
                                <Input
                                    id="durasi_hari"
                                    type="number"
                                    value={data.durasi_hari}
                                    onChange={(e) => setData('durasi_hari', e.target.value)}
                                    className="mt-1"
                                />
                                {errors.durasi_hari && <div className="text-red-500 text-sm mt-1">{errors.durasi_hari}</div>}
                            </div>

                            <div>
                                <Label htmlFor="progres_persen">Progres (%)</Label>
                                <Input
                                    id="progres_persen"
                                    type="number"
                                    value={data.progres_persen}
                                    onChange={(e) => setData('progres_persen', e.target.value)}
                                    className="mt-1"
                                />
                                {errors.progres_persen && <div className="text-red-500 text-sm mt-1">{errors.progres_persen}</div>}
                            </div>

                            <div>
                                <Label htmlFor="rapat">Tanggal Rapat</Label>
                                <Input
                                    id="rapat"
                                    type="date"
                                    value={data.rapat}
                                    onChange={(e) => setData('rapat', e.target.value)}
                                    className="mt-1"
                                />
                                {errors.rapat && <div className="text-red-500 text-sm mt-1">{errors.rapat}</div>}
                            </div>

                            <div>
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <select
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                >
                                    <option value="open">Open</option>
                                    <option value="close">Close</option>
                                </select>
                                {errors.keterangan && <div className="text-red-500 text-sm mt-1">{errors.keterangan}</div>}
                            </div>

                            <div>
                                <Label htmlFor="sistem">Sistem</Label>
                                <select
                                    id="sistem"
                                    value={data.sistem}
                                    onChange={(e) => setData('sistem', e.target.value)}
                                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                >
                                    <option value="RAHA">RAHA</option>
                                    <option value="BAU BAU">BAU BAU</option>
                                    <option value="WAKATOBI">WAKATOBI</option>
                                    <option value="WAWONII">WAWONII</option>
                                    <option value="EREKE">EREKE</option>
                                    <option value="DAN SUB.S.KENDARI">DAN SUB.S.KENDARI</option>
                                </select>
                                {errors.sistem && <div className="text-red-500 text-sm mt-1">{errors.sistem}</div>}
                            </div>

                            <Button type="submit" disabled={processing} className="w-full">
                                Simpan Data
                            </Button>
                        </form>
                    </div>

                    {/* Table Section */}
                    <div className="col-span-1 md:col-span-2 border border-sidebar-border/70 dark:border-sidebar-border rounded-xl p-6 bg-card overflow-hidden">
                        <h2 className="text-lg font-semibold mb-4">Data Jadwal Outage</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 border-b">Mesin Pembangkit</th>
                                        <th className="px-4 py-3 border-b">Scope</th>
                                        <th className="px-4 py-3 border-b">Jenis</th>
                                        <th className="px-4 py-3 border-b">Durasi</th>
                                        <th className="px-4 py-3 border-b">Progres</th>
                                        <th className="px-4 py-3 border-b">Tgl Rapat</th>
                                        <th className="px-4 py-3 border-b">Ket</th>
                                        <th className="px-4 py-3 border-b">Sistem</th>
                                        <th className="px-4 py-3 border-b">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outagePlans.length > 0 ? (
                                        outagePlans.map((plan) => (
                                            <tr key={plan.id} className="border-b dark:border-sidebar-border/70 hover:bg-muted/50">
                                                <td className="px-4 py-3">{plan.mesin_pembangkit}</td>
                                                <td className="px-4 py-3">{plan.scope}</td>
                                                <td className="px-4 py-3 uppercase">{plan.jenis_pembangkit}</td>
                                                <td className="px-4 py-3">{plan.durasi_hari} Hari</td>
                                                <td className="px-4 py-3">{plan.progres_persen}%</td>
                                                <td className="px-4 py-3">{plan.rapat || '-'}</td>
                                                <td className="px-4 py-3 capitalize">{plan.keterangan || '-'}</td>
                                                <td className="px-4 py-3">{plan.sistem}</td>
                                                <td className="px-4 py-3">
                                                    <Button 
                                                        variant="destructive" 
                                                        size="sm"
                                                        onClick={() => handleDelete(plan.id)}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                                                Belum ada data.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
