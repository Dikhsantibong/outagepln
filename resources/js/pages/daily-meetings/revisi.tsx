import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CalendarClock, History, Lock } from 'lucide-react';
import {
    KOLOM_RAPAT,
    TabelRiwayatRevisi,
    jadwalDariStart,
    selisihHari,
    tambahHari,
    tgl,
} from '@/components/outage-revisi';
import type { RevisiRencana } from '@/components/outage-revisi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Plan = {
    id: number;
    mesin_pembangkit: string;
    scope: string | null;
    jenis_pembangkit: string | null;
    sistem: string | null;
    start_date: string | null;
    selesai: string | null;
    durasi: number | null;
    rapat_r2: string | null;
    rapat_r3: string | null;
    rapat_p1: string | null;
    rapat_p2: string | null;
    rapat_p3: string | null;
    revisions?: RevisiRencana[];
};

export default function RevisiRencana({
    plan,
    offsetRapat,
    maksRevisi,
    jumlahRevisi,
}: {
    plan: Plan;
    offsetRapat: Record<string, number>;
    maksRevisi: number;
    jumlahRevisi: number;
}) {
    const revisi = plan.revisions ?? [];
    const sisa = Math.max(0, maksRevisi - jumlahRevisi);
    const terkunci = sisa === 0;

    const form = useForm({
        start_date: (plan.start_date ?? '').slice(0, 10),
        selesai: (plan.selesai ?? '').slice(0, 10),
        catatan: '',
    });

    /** Menggeser start ikut menggeser finish, supaya lama pekerjaan tetap. */
    const ubahStart = (nilai: string) => {
        const lama = form.data.start_date;
        const finishLama = form.data.selesai;

        if (lama && finishLama && nilai) {
            form.setData({
                ...form.data,
                start_date: nilai,
                selesai: tambahHari(finishLama, selisihHari(lama, nilai)),
            });

            return;
        }

        form.setData('start_date', nilai);
    };

    const simpan = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/daily-meetings/rencana/${plan.id}/revisi`);
    };

    const pratinjau = jadwalDariStart(form.data.start_date, offsetRapat);

    return (
        <>
            <Head title={`Revisi Rencana — ${plan.mesin_pembangkit}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div>
                    <Link
                        href="/daily-meetings"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Rapat Outage
                    </Link>
                    <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                        Revisi Rencana Outage
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {plan.mesin_pembangkit} — menggeser rencana start otomatis
                        menghitung ulang jadwal rapat R2 sampai P3
                    </p>
                </div>

                {/* Ringkasan rencana berjalan */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Scope
                        </p>
                        <p className="mt-0.5 text-sm font-bold">{plan.scope || '—'}</p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Rencana Berjalan
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-bold whitespace-nowrap">
                            {tgl(plan.start_date)} &rarr; {tgl(plan.selesai)}
                        </p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Durasi
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-bold">
                            {plan.durasi ? `${plan.durasi} hari` : '—'}
                        </p>
                    </div>
                    <div
                        className={`rounded-md border border-l-[3px] bg-muted/40 px-4 py-3 ${
                            terkunci ? 'border-l-rose-500' : 'border-l-amber-500'
                        }`}
                    >
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            {terkunci ? (
                                <Lock className="h-3 w-3" />
                            ) : (
                                <History className="h-3 w-3" />
                            )}
                            Jatah Revisi
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-bold">
                            {jumlahRevisi} / {maksRevisi}
                            <span className="ml-1 font-sans text-[11px] font-normal text-muted-foreground">
                                {terkunci ? 'habis' : `sisa ${sisa}`}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                    {/* Formulir */}
                    <Card className="flex flex-col overflow-hidden rounded-md border-sidebar-border/60 py-0 shadow-sm">
                        <div className="border-b bg-muted/50 px-4 py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <CalendarClock className="h-4 w-4" />
                                Formulir Revisi
                            </p>
                        </div>

                        {terkunci ? (
                            <div className="p-4">
                                <p className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/[0.07] px-3 py-2.5 text-xs text-rose-700 dark:text-rose-400">
                                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>
                                        Rencana ini sudah direvisi {maksRevisi} kali — batas
                                        maksimal tercapai, jadwalnya tidak dapat digeser lagi.
                                        Riwayat versinya tetap bisa dibaca di sebelah.
                                    </span>
                                </p>
                                <Link href="/daily-meetings">
                                    <Button variant="outline" className="mt-3 w-full">
                                        Kembali ke Rapat Outage
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={simpan} className="flex flex-col gap-4 p-4">
                                <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                    Akan disimpan sebagai{' '}
                                    <span className="font-semibold text-foreground">
                                        REV {jumlahRevisi + 1}
                                    </span>
                                    ; setelah ini tersisa{' '}
                                    <span className="font-semibold text-foreground">
                                        {sisa - 1} kali
                                    </span>{' '}
                                    revisi.
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="start_date">Rencana Start</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={form.data.start_date}
                                            onChange={(e) => ubahStart(e.target.value)}
                                            required
                                        />
                                        {form.errors.start_date && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.start_date}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="selesai">Rencana Finish</Label>
                                        <Input
                                            id="selesai"
                                            type="date"
                                            value={form.data.selesai}
                                            onChange={(e) =>
                                                form.setData('selesai', e.target.value)
                                            }
                                        />
                                        {form.errors.selesai && (
                                            <p className="text-xs text-destructive">
                                                {form.errors.selesai}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="catatan">Alasan Revisi</Label>
                                    <Input
                                        id="catatan"
                                        placeholder="mis. menunggu material impor"
                                        value={form.data.catatan}
                                        onChange={(e) => form.setData('catatan', e.target.value)}
                                    />
                                    {form.errors.catatan && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.catatan}
                                        </p>
                                    )}
                                </div>

                                {/* Dampak ke jadwal rapat */}
                                <div className="overflow-hidden rounded-md border">
                                    <p className="border-b bg-muted px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                        Dampak ke jadwal rapat
                                    </p>
                                    <table className="w-full border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b bg-muted/40">
                                                <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                    Rapat
                                                </th>
                                                <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                    Sekarang
                                                </th>
                                                <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground">
                                                    Menjadi
                                                </th>
                                                <th className="px-3 py-1.5 text-right text-[11px] font-semibold text-muted-foreground">
                                                    Rumus
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {KOLOM_RAPAT.map((r) => {
                                                const lama = plan[r.kolom] ?? null;
                                                const baru = pratinjau[r.kolom];
                                                const berubah =
                                                    !!baru && baru !== (lama ?? '').slice(0, 10);

                                                return (
                                                    <tr
                                                        key={r.kolom}
                                                        className="border-b last:border-b-0"
                                                    >
                                                        <td className="px-3 py-1.5 font-semibold">
                                                            {r.label}
                                                        </td>
                                                        <td className="px-3 py-1.5 font-mono text-muted-foreground">
                                                            {tgl(lama)}
                                                        </td>
                                                        <td
                                                            className={`px-3 py-1.5 font-mono font-semibold ${
                                                                berubah
                                                                    ? 'text-amber-700 dark:text-amber-500'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <span className="flex items-center gap-1.5">
                                                                {berubah && (
                                                                    <ArrowRight className="h-3 w-3 shrink-0" />
                                                                )}
                                                                {tgl(baru)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-1.5 text-right text-[11px] whitespace-nowrap text-muted-foreground">
                                                            &minus;{offsetRapat[r.kolom]} hari
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Link href="/daily-meetings">
                                        <Button type="button" variant="outline">
                                            Batal
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={form.processing}>
                                        {form.processing ? 'Menyimpan...' : 'Simpan Revisi'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>

                    {/* Riwayat */}
                    <Card className="flex flex-col overflow-hidden rounded-md border-sidebar-border/60 py-0 shadow-sm">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b bg-muted/50 px-4 py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <History className="h-4 w-4" />
                                Riwayat Revisi
                            </p>
                            <span className="text-[11px] text-muted-foreground">
                                {revisi.length > 0
                                    ? `— ${revisi.length} versi, terbaru yang berlaku`
                                    : '— belum pernah direvisi'}
                            </span>
                        </div>

                        <TabelRiwayatRevisi revisions={revisi} />
                    </Card>
                </div>
            </div>
        </>
    );
}

RevisiRencana.layout = {
    breadcrumbs: [
        { title: 'Rapat Outage', href: '/daily-meetings' },
        { title: 'Revisi Rencana', href: '#' },
    ],
};
