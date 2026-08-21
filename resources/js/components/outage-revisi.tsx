import { formatDMY } from '@/lib/outage-progress';

/** Satu versi rencana outage, sebagaimana dikirim dari OutagePlanRevision. */
export type RevisiRencana = {
    id: number;
    label: string;
    urutan: number;
    start_date: string | null;
    selesai: string | null;
    rapat_r2: string | null;
    rapat_r3: string | null;
    rapat_p1: string | null;
    rapat_p2: string | null;
    rapat_p3: string | null;
    catatan: string | null;
    created_at: string | null;
    user?: { id: number; name: string } | null;
};

/** Kolom tanggal rapat, urut sebagaimana ditampilkan. */
export const KOLOM_RAPAT = [
    { kolom: 'rapat_r2', label: 'R2' },
    { kolom: 'rapat_r3', label: 'R3' },
    { kolom: 'rapat_p1', label: 'P1' },
    { kolom: 'rapat_p2', label: 'P2' },
    { kolom: 'rapat_p3', label: 'P3' },
] as const;

export type KolomRapat = (typeof KOLOM_RAPAT)[number]['kolom'];

const keYmd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Tanggal kelima rapat, dihitung mundur dari rencana start.
 *
 * Angka mundurnya datang dari server ([JadwalRapatOutage]) supaya layar dan
 * basis data tidak pernah memakai rumus yang berbeda.
 */
export function jadwalDariStart(
    start: string,
    offset: Record<string, number>,
): Record<string, string> {
    const hasil: Record<string, string> = {};

    if (!start) {
        return hasil;
    }

    Object.entries(offset).forEach(([kolom, mundur]) => {
        const d = new Date(`${start.slice(0, 10)}T00:00:00`);

        d.setDate(d.getDate() - Number(mundur));
        hasil[kolom] = keYmd(d);
    });

    return hasil;
}

/** Selisih hari antara dua tanggal. */
export function selisihHari(dari: string, ke: string): number {
    const a = new Date(`${dari.slice(0, 10)}T00:00:00`);
    const b = new Date(`${ke.slice(0, 10)}T00:00:00`);

    return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Geser sebuah tanggal sekian hari. */
export function tambahHari(tanggal: string, hari: number): string {
    const d = new Date(`${tanggal.slice(0, 10)}T00:00:00`);

    d.setDate(d.getDate() + hari);

    return keYmd(d);
}

/** Tanggal apa pun bentuknya (ISO atau YYYY-MM-DD) menjadi dd-mm-yyyy. */
export const tgl = (nilai?: string | null) =>
    nilai ? formatDMY(nilai.slice(0, 10)) : '—';

/**
 * Riwayat revisi rencana.
 *
 * Baris terakhir adalah rencana yang sedang berlaku; sisanya versi lama yang
 * sengaja tetap ditampilkan supaya pergeseran jadwal bisa ditelusuri.
 */
export function TabelRiwayatRevisi({
    revisions,
    kosongLabel = 'Belum ada revisi. Rencana masih memakai jadwal awal.',
}: {
    revisions: RevisiRencana[];
    kosongLabel?: string;
}) {
    if (revisions.length === 0) {
        return (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {kosongLabel}
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-xs">
                <thead>
                    <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Versi
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Start
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Finish
                        </th>
                        {KOLOM_RAPAT.map((r) => (
                            <th
                                key={r.kolom}
                                className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                            >
                                {r.label}
                            </th>
                        ))}
                        <th className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Keterangan
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {revisions.map((rev, idx) => {
                        const berlaku = idx === revisions.length - 1;

                        return (
                            <tr
                                key={rev.id || rev.urutan}
                                className={`border-b last:border-b-0 ${
                                    berlaku ? 'bg-primary/[0.04]' : ''
                                }`}
                            >
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                                            berlaku
                                                ? 'border-primary/30 bg-primary/10 text-primary'
                                                : 'border-border text-muted-foreground'
                                        }`}
                                    >
                                        {rev.label}
                                    </span>
                                </td>
                                <td className="px-3 py-2 font-mono whitespace-nowrap">
                                    {tgl(rev.start_date)}
                                </td>
                                <td className="px-3 py-2 font-mono whitespace-nowrap">
                                    {tgl(rev.selesai)}
                                </td>
                                {KOLOM_RAPAT.map((r) => (
                                    <td
                                        key={r.kolom}
                                        className="px-3 py-2 font-mono whitespace-nowrap text-muted-foreground"
                                    >
                                        {tgl(rev[r.kolom])}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-muted-foreground">
                                    <span className="block">{rev.catatan || '—'}</span>
                                    <span className="block text-[10px] text-muted-foreground/70">
                                        {rev.user?.name ?? 'Sistem'}
                                        {rev.created_at ? ` · ${tgl(rev.created_at)}` : ''}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
