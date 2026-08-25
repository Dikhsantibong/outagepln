import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleDashed,
    Construction,
    FileDown,
    MinusCircle,
    Presentation,
} from 'lucide-react';
import { FilterTahun } from '@/components/data-filter-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Kesiapan = {
    bagian: string;
    status: 'siap' | 'sebagian' | 'belum' | 'kosong';
    catatan: string;
};

type Laporan = {
    identity: Record<string, string>;
    summary: Record<string, string | number>;
    plants: { plant_type: string; planned: number; realized: number; progress: number }[];
    sites: { site_name: string; planned: number; progress: number; status: string }[];
    performance: {
        rows: unknown[];
        average_sfc_improvement: number | null;
        average_dmp_improvement: number | null;
    };
    kpi: Record<string, string | number | null>;
    conclusion: Record<string, string>;
};

const LENCANA: Record<Kesiapan['status'], { label: string; kelas: string; ikon: typeof CheckCircle2 }> = {
    siap: {
        label: 'Siap',
        kelas: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
        ikon: CheckCircle2,
    },
    sebagian: {
        label: 'Sebagian',
        kelas: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
        ikon: CircleDashed,
    },
    kosong: {
        label: 'Belum ada isi',
        kelas: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        ikon: MinusCircle,
    },
    belum: {
        label: 'Dalam pengembangan',
        kelas: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        ikon: Construction,
    },
};

const angka = (v: number | string | null | undefined) =>
    v === null || v === undefined ? '—' : String(v);

export default function SummaryIndex({
    laporan,
    filters,
    tahunOptions,
    kesiapan,
}: {
    laporan: Laporan;
    filters: { tahun: string };
    tahunOptions: string[];
    kesiapan: Kesiapan[];
}) {
    const s = laporan.summary;

    const setTahun = (value: string) => {
        router.get('/summary', { tahun: value }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    // Tahun ikut dibawa ke berkasnya supaya isinya sama dengan yang dipratinjau.
    const unduh = () => {
        window.open(
            `/summary/export-pptx?tahun=${encodeURIComponent(filters.tahun)}`,
            '_blank',
        );
    };

    const siap = kesiapan.filter((k) => k.status === 'siap').length;

    return (
        <>
            <Head title="Summary — Laporan MONEV" />

            <div className="relative flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Laporan MONEV Pemeliharaan Periodik (HARDIK)
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {laporan.identity.unit} · {laporan.identity.period} ·{' '}
                            {laporan.identity.cakupan}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <FilterTahun
                            value={filters.tahun}
                            onChange={setTahun}
                            options={tahunOptions}
                        />
                        <Button onClick={unduh} className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Generate PPTX (Lanskap)
                        </Button>
                    </div>
                </div>

                {/* Ringkasan angka yang akan masuk ke berkas */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {[
                        ['Total Rencana OH', angka(s.total_prk)],
                        ['Selesai', angka(s.finished)],
                        ['Berjalan', angka(s.on_progress)],
                        ['Belum Mulai', angka(s.not_started)],
                        ['Lewat Jadwal', angka(s.not_finished)],
                    ].map(([label, nilai]) => (
                        <div key={label} className="rounded-md border bg-muted/40 px-4 py-3">
                            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                {label}
                            </p>
                            <p className="mt-0.5 font-mono text-xl font-bold">{nilai}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
                    {/* Kesiapan tiap bagian laporan */}
                    <Card className="flex flex-col overflow-hidden rounded-md border-sidebar-border/60 py-0 shadow-sm">
                        <div className="flex flex-wrap items-center gap-x-2 border-b bg-muted/50 px-4 py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <Presentation className="h-4 w-4" />
                                Isi Berkas yang Akan Dihasilkan
                            </p>
                            <span className="text-[11px] text-muted-foreground">
                                — {siap} dari {kesiapan.length} bagian sudah lengkap
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] border-collapse text-xs">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Bagian Laporan
                                        </th>
                                        <th className="w-[150px] px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Status
                                        </th>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Keterangan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kesiapan.map((k, i) => {
                                        const l = LENCANA[k.status];
                                        const Ikon = l.ikon;

                                        return (
                                            <tr
                                                key={k.bagian}
                                                className={`border-b last:border-b-0 ${
                                                    i % 2 === 1 ? 'bg-muted/20' : ''
                                                }`}
                                            >
                                                <td className="px-3 py-2 font-medium">{k.bagian}</td>
                                                <td className="px-3 py-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${l.kelas}`}
                                                    >
                                                        <Ikon className="h-3 w-3" />
                                                        {l.label}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {k.catatan}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <p className="border-t bg-muted/25 px-4 py-2.5 text-[11px] text-muted-foreground">
                            Parameter yang belum ada sumber datanya tetap dicetak di berkas,
                            ditandai <span className="font-semibold">Data belum tersedia</span>,{' '}
                            <span className="font-semibold">Parameter tidak tersedia</span>, atau{' '}
                            <span className="font-semibold">Dalam pengembangan</span> — bukan
                            diisi angka tebakan.
                        </p>
                    </Card>

                    {/* Kesimpulan otomatis */}
                    <Card className="flex flex-col overflow-hidden rounded-md border-sidebar-border/60 py-0 shadow-sm">
                        <div className="border-b bg-muted/50 px-4 py-3">
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Kesimpulan Otomatis
                            </p>
                        </div>
                        <div className="space-y-3 p-4 text-xs leading-relaxed">
                            <p>{laporan.conclusion.ringkasan}</p>
                            <p className="text-muted-foreground">{laporan.conclusion.kinerja}</p>
                            <p className="text-muted-foreground">{laporan.conclusion.anggaran}</p>

                            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-3">
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                        Perbaikan SFC
                                    </p>
                                    <p className="font-mono text-sm font-bold">
                                        {laporan.performance.average_sfc_improvement === null
                                            ? '—'
                                            : `${laporan.performance.average_sfc_improvement}%`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                        Perbaikan Daya Mampu
                                    </p>
                                    <p className="font-mono text-sm font-bold">
                                        {laporan.performance.average_dmp_improvement === null
                                            ? '—'
                                            : `${laporan.performance.average_dmp_improvement}%`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Catatan tetap di sudut halaman, sesuai keadaan fiturnya. */}
                <div className="pointer-events-none sticky bottom-2 z-10 mt-auto flex justify-end">
                    <p className="pointer-events-auto inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-800 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                        <Construction className="h-3.5 w-3.5 shrink-0" />
                        Fungsi laporan ini masih dalam pengembangan
                    </p>
                </div>
            </div>
        </>
    );
}

SummaryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Summary',
            href: '/summary',
        },
    ],
};
