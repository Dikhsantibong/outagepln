import { Link } from '@inertiajs/react';
import { ExternalLink, Loader2, Search, Zap } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import {
    OutageDailyTable,
    OutageDeviasiChart,
    OutageSCurve,
} from '@/components/outage-detail';
import type { DailyProgress } from '@/components/outage-detail';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatDMY } from '@/lib/outage-progress';

export type QuickAccessPlan = {
    id: number;
    mesin: string;
    scope: string | null;
    jenis: string | null;
    sistem: string | null;
    progress: number;
    start_date: string | null;
    selesai: string | null;
};

type Detail = {
    outagePlan: {
        id: number;
        mesin_pembangkit: string | null;
        scope: string | null;
        jenis_pembangkit: string | null;
        sistem: string | null;
        durasi: number | null;
        start_date: string | null;
        selesai: string | null;
        real_start: string | null;
        real_stop: string | null;
        progress: number | null;
        ket: string | null;
        ket_realisasi: string | null;
        daily_progresses: DailyProgress[];
    };
    totalHari: number | null;
    overallPlan: number | null;
    overallActual: number | null;
};

const warnaProgres = (v: number) =>
    v >= 100 ? '#10b981' : v >= 40 ? '#f59e0b' : v > 0 ? '#3b82f6' : '#94a3b8';

/** Satu kotak label/nilai pada ringkasan identitas pekerjaan. */
function Baris({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border p-2.5">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
        </div>
    );
}

/**
 * State pemuatan detail satu pekerjaan.
 *
 * Dipisahkan sebagai hook supaya beberapa pemicu â€” kartu Quick Access maupun
 * kartu KPI di dashboard â€” memakai satu dialog yang sama, bukan masing-masing
 * membuat salinannya sendiri.
 */
export function usePlanDetail() {
    const [dibuka, setDibuka] = useState<QuickAccessPlan | null>(null);
    const [detail, setDetail] = useState<Detail | null>(null);
    const [memuat, setMemuat] = useState(false);
    const [galat, setGalat] = useState<string | null>(null);
    const permintaanRef = useRef<number | null>(null);

    /**
     * Detail diambil di handler klik, bukan di useEffect: memuat data adalah
     * akibat langsung dari aksi pengguna, dan menaruhnya di effect memicu
     * render berantai.
     */
    const buka = (item: QuickAccessPlan) => {
        const permintaan = item.id;

        setDibuka(item);
        setDetail(null);
        setGalat(null);
        setMemuat(true);

        // Dialog bisa ditutup atau berganti mesin sebelum permintaan selesai;
        // hasil yang sudah tidak relevan diabaikan.
        const masihRelevan = () => permintaanRef.current === permintaan;
        permintaanRef.current = permintaan;

        fetch(`/outage-plans/${item.id}/detail-json`, {
            headers: { Accept: 'application/json' },
        })
            .then((r) => {
                if (!r.ok) {
                    throw new Error(`Gagal memuat detail (${r.status})`);
                }

                return r.json();
            })
            .then((d: Detail) => {
                if (masihRelevan()) {
                    setDetail(d);
                }
            })
            .catch((e: Error) => {
                if (masihRelevan()) {
                    setGalat(e.message);
                }
            })
            .finally(() => {
                if (masihRelevan()) {
                    setMemuat(false);
                }
            });
    };

    const tutup = () => {
        permintaanRef.current = null;
        setDibuka(null);
    };

    return { dibuka, detail, memuat, galat, buka, tutup };
}

export type PlanDetailState = ReturnType<typeof usePlanDetail>;

/** Satu baris mesin yang bisa diklik; dipakai Quick Access maupun daftar KPI. */
export function PlanRow({
    item,
    onClick,
}: {
    item: QuickAccessPlan;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{item.mesin}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                    {item.scope || '-'} &middot; {item.jenis || '-'} &middot;{' '}
                    {item.sistem || '-'}
                    {item.start_date ? ` Â· mulai ${formatDMY(item.start_date)}` : ''}
                </p>
            </div>
            <div className="flex w-24 shrink-0 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${Math.min(100, item.progress)}%`,
                            backgroundColor: warnaProgres(item.progress),
                        }}
                    />
                </div>
                <span
                    className="w-9 text-right text-[11px] font-bold"
                    style={{ color: warnaProgres(item.progress) }}
                >
                    {Math.round(item.progress)}%
                </span>
            </div>
        </button>
    );
}

/**
 * Dialog detail pekerjaan, disusun mendatar.
 *
 * Kolom kiri memuat identitas dan perbandingan rencana/realisasi, kolom kanan
 * kurva S â€” dengan begitu keduanya terbaca sekaligus tanpa menggulir, dan kurva
 * mendapat lebar yang layak pada outage puluhan hari.
 */
export function PlanDetailDialog({
    dibuka,
    detail,
    memuat,
    galat,
    tutup,
}: PlanDetailState) {
    const p = detail?.outagePlan;

    return (
        <Dialog open={dibuka !== null} onOpenChange={(o) => !o && tutup()}>
            <DialogContent className="max-h-[94vh] w-[97vw] overflow-y-auto sm:max-w-[97vw]">
                <DialogHeader>
                    <DialogTitle className="pr-8">
                        {dibuka?.mesin ?? 'Detail Pekerjaan'}
                    </DialogTitle>
                    <DialogDescription>
                        {dibuka?.scope || '-'} &middot; {dibuka?.jenis || '-'} &middot;{' '}
                        {dibuka?.sistem || '-'}
                    </DialogDescription>
                </DialogHeader>

                {memuat && (
                    <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat detail...
                    </div>
                )}

                {galat && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                        {galat}
                    </div>
                )}

                {p && detail && (
                    <div className="space-y-4">
                        <div className="grid gap-4 xl:grid-cols-[minmax(320px,1fr)_2fr]">
                            {/* Kolom kiri: identitas + perbandingan keseluruhan */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <Baris
                                        label="Rencana"
                                        value={`${p.start_date ? formatDMY(p.start_date) : '-'} â†’ ${p.selesai ? formatDMY(p.selesai) : '-'}`}
                                    />
                                    <Baris
                                        label="Realisasi"
                                        value={`${p.real_start ? formatDMY(p.real_start) : '-'} â†’ ${p.real_stop ? formatDMY(p.real_stop) : '-'}`}
                                    />
                                    <Baris
                                        label="Durasi"
                                        value={`${p.durasi ?? detail.totalHari ?? '-'} hari`}
                                    />
                                    <Baris
                                        label="Keterangan"
                                        value={p.ket || p.ket_realisasi || '-'}
                                    />
                                </div>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">
                                            Kurva Leading &amp; Lagging
                                        </CardTitle>
                                        <CardDescription>
                                            Selisih realisasi terhadap rencana tiap hari
                                            — di atas garis nol unggul, di bawahnya
                                            tertinggal
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <OutageDeviasiChart
                                            rows={p.daily_progresses ?? []}
                                            height={240}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Kolom kanan: kurva S */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        Kurva S - Plan vs Actual
                                    </CardTitle>
                                    <CardDescription>
                                        Warna titik realisasi mengikuti status hari itu
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <OutageSCurve
                                        rows={p.daily_progresses ?? []}
                                        overallPlan={detail.overallPlan}
                                        overallActual={detail.overallActual}
                                        height={440}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <OutageDailyTable rows={p.daily_progresses ?? []} />

                        <div className="flex justify-end">
                            <Link href={`/outage-plans/${p.id}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Buka halaman detail
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Quick Access: cari mesin lalu buka detailnya tanpa meninggalkan dashboard.
 *
 * Detailnya diambil dari endpoint yang memakai perhitungan sama dengan halaman
 * detail, dan dirender dengan komponen kurva S serta tabel harian yang sama â€”
 * jadi tidak ada dua versi angka yang bisa berbeda.
 */
export function OutageQuickAccess({
    plans,
    onOpen,
}: {
    plans: QuickAccessPlan[];
    onOpen: (item: QuickAccessPlan) => void;
}) {
    const [cari, setCari] = useState('');

    const hasil = useMemo(() => {
        const q = cari.trim().toLowerCase();
        const cocok = q
            ? plans.filter((p) =>
                  `${p.mesin} ${p.scope ?? ''} ${p.jenis ?? ''} ${p.sistem ?? ''}`
                      .toLowerCase()
                      .includes(q),
              )
            : plans;

        return cocok.slice(0, 40);
    }, [plans, cari]);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Quick Access
                </CardTitle>
                <CardDescription>
                    Cari mesin, lalu buka grafik, tabel, dan kurva S lengkapnya tanpa
                    pindah halaman
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={cari}
                        onChange={(e) => setCari(e.target.value)}
                        placeholder="Cari mesin, scope, atau sistem..."
                        className="h-9 pl-9 text-sm"
                    />
                </div>

                <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
                    {hasil.length > 0 ? (
                        hasil.map((item) => (
                            <PlanRow
                                key={item.id}
                                item={item}
                                onClick={() => onOpen(item)}
                            />
                        ))
                    ) : (
                        <p className="py-8 text-center text-xs text-muted-foreground italic">
                            Tidak ada mesin yang cocok.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
