/** Satu poin pekerjaan beserta progres poin itu sendiri. */
export type WorkItem = {
    uraian: string;
    progress: string;
};

/** Satu material yang dipakai, beserta jumlahnya. */
export type SparePart = {
    nama: string;
    part_number: string;
    qty: string;
    keterangan: string;
};

export const emptyWorkItem = (): WorkItem => ({ uraian: '', progress: '' });

export const emptySparePart = (): SparePart => ({
    nama: '',
    part_number: '',
    qty: '',
    keterangan: '',
});

export type DailyProgressRow = {
    tanggal: string;
    plan_progress: string;
    actual_progress: string;
    /** Uraian pekerjaan sebagai daftar berpoin, tiap poin punya progresnya. */
    work_items: WorkItem[];
    /** Material yang dipakai hari itu. */
    spare_parts: SparePart[];
    /** Kolom lama; dipertahankan agar data sebelum migrasi tetap terbaca. */
    material_part_number: string;
    material_nama: string;
    uraian_pekerjaan: string;
    keterangan: string;
    photos?: string[];
};

/** Kolom teks pada baris harian, dipakai untuk membangun baris kosong. */
export const DAILY_TEXT_FIELDS = [
    'material_part_number',
    'material_nama',
    'uraian_pekerjaan',
    'keterangan',
] as const;

export type DailyTextField = (typeof DAILY_TEXT_FIELDS)[number];

export type DailyProgressRecord = {
    id?: number;
    tanggal: string;
    /** null = hari tersebut belum diisi. */
    plan_progress: number | string | null;
    actual_progress: number | string | null;
    work_items?: WorkItem[] | null;
    spare_parts?: SparePart[] | null;
    material_part_number?: string | null;
    material_nama?: string | null;
    uraian_pekerjaan?: string | null;
    keterangan: string | null;
    photos?: string[] | null;
    status?: string;
};

function parseDateOnly(dateStr: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);

    if (!match) {
        return null;
    }

    const [, y, m, d] = match;

    return new Date(Number(y), Number(m) - 1, Number(d));
}

function toDateOnlyString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

/** Generates an inclusive list of ISO (YYYY-MM-DD) dates between start and end. */
export function generateDateRange(start: string, end: string): string[] {
    const startDate = parseDateOnly(start);
    const endDate = parseDateOnly(end);

    if (!startDate || !endDate || endDate < startDate) {
        return [];
    }

    const dates: string[] = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
        dates.push(toDateOnlyString(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
}

/** Generates `count` consecutive ISO dates starting at `start`. */
export function generateDateRangeByCount(start: string, count: number): string[] {
    const startDate = parseDateOnly(start);

    if (!startDate || count <= 0) {
        return [];
    }

    const dates: string[] = [];
    const cursor = new Date(startDate);

    for (let i = 0; i < count; i++) {
        dates.push(toDateOnlyString(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
}

/**
 * Sebuah hari dianggap terisi bila ada nilai apa pun di dalamnya — termasuk
 * material dan uraian pekerjaan, bukan hanya angka progres. Kalau tidak, catatan
 * material yang sudah diketik bisa hilang saat Real Start diubah.
 */
function hasData(row: DailyProgressRecord): boolean {
    const filled = (v: number | string | null | undefined) =>
        v !== null && v !== undefined && v !== '';

    return (
        filled(row.plan_progress) ||
        filled(row.actual_progress) ||
        (row.work_items?.length ?? 0) > 0 ||
        (row.spare_parts?.length ?? 0) > 0 ||
        (row.photos?.length ?? 0) > 0 ||
        filled(row.material_part_number) ||
        filled(row.material_nama) ||
        filled(row.uraian_pekerjaan) ||
        filled(row.keterangan)
    );
}

export type ProgressDateOptions = {
    /** Tanggal mulai sebenarnya di lapangan; jadi acuan utama. */
    realStart: string;
    /** Rencana mulai, dipakai bila real start belum diisi. */
    startDate: string;
    /** Rencana selesai, dipakai bila durasi belum diisi. */
    selesai: string;
    durasi: number;
    /** Hari tambahan yang diminta pengguna saat aktual melewati rencana. */
    extraDays: number;
    existing: DailyProgressRecord[];
};

/**
 * Menentukan hari-hari yang muncul di tabel progress harian.
 *
 * Barisnya dihitung dari Real Start sebanyak Durasi hari — begitu Real Start
 * diisi, seluruh harinya langsung terbentuk dan rencananya bisa diisi di muka.
 * Real Start yang masih kosong memakai Waktu Mulai sebagai acuan sementara,
 * sehingga data lama yang dibuat sebelum aturan ini tetap tampil.
 *
 * Hari yang sudah terisi tetap dipertahankan walau jatuh di luar rentang —
 * mengubah Real Start tidak boleh menghapus aktual yang sudah dicatat.
 */
export function buildProgressDates(opts: ProgressDateOptions): string[] {
    const anchor = opts.realStart || opts.startDate;
    const count = opts.durasi > 0
        ? opts.durasi
        : generateDateRange(opts.startDate, opts.selesai).length;

    const generated = generateDateRangeByCount(anchor, count + Math.max(0, opts.extraDays));
    const terisi = opts.existing.filter(hasData).map((row) => row.tanggal);

    return [...new Set([...generated, ...terisi])].sort();
}

/**
 * Berapa hari yang sudah tercatat melewati rentang rencana — dipakai untuk
 * memulihkan jumlah "hari tambahan" saat form dibuka kembali.
 */
export function countExtraDays(
    opts: Omit<ProgressDateOptions, 'extraDays'>,
): number {
    const withoutExtra = buildProgressDates({ ...opts, extraDays: 0 });
    const planned = opts.durasi > 0
        ? opts.durasi
        : generateDateRange(opts.startDate, opts.selesai).length;

    return Math.max(0, withoutExtra.length - planned);
}

/** Formats an ISO (YYYY-MM-DD) date string as DD-MM-YYYY. */
export function formatDMY(dateStr: string): string {
    const date = parseDateOnly(dateStr);

    if (!date) {
        return dateStr;
    }

    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');

    return `${d}-${m}-${date.getFullYear()}`;
}

export type ProgressStatus = 'Leading' | 'On Progres' | 'Lagging' | '-';

/**
 * Leading bila aktual melampaui rencana, On Progres bila keduanya sama persis,
 * Lagging bila aktual tertinggal. Hari yang belum diisi sama sekali tidak
 * berstatus apa pun.
 */
export function computeStatus(
    plan: number | string,
    actual: number | string,
): ProgressStatus {
    if (plan === '' && actual === '') {
        return '-';
    }

    const planNum = Number(plan) || 0;
    const actualNum = Number(actual) || 0;

    if (actualNum === planNum) {
        return 'On Progres';
    }

    return actualNum > planNum ? 'Leading' : 'Lagging';
}

/** Kelas badge per status, dipakai di form edit maupun halaman detail. */
export function statusBadgeClass(status: ProgressStatus): string {
    switch (status) {
        case 'Leading':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
        case 'On Progres':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
        case 'Lagging':
            return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
        default:
            return 'bg-muted text-muted-foreground';
    }
}

export type SebaranStatus = {
    /** Hari yang rencana dan realisasinya sudah diisi — jadi penyebutnya. */
    hariTerisi: number;
    leadingHari: number;
    laggingHari: number;
    /** Porsi hari leading/lagging terhadap hari terisi, dalam persen. */
    leadingPersen: number;
    laggingPersen: number;
};

/**
 * Berapa besar porsi hari yang unggul dan yang tertinggal.
 *
 * Dinyatakan dalam persen, bukan jumlah hari: outage 10 hari dan outage 40 hari
 * tidak sebanding kalau dibaca sebagai "5 hari lagging", tapi langsung
 * sebanding begitu dibaca sebagai "50%" lawan "12,5%". Hari yang belum diisi
 * tidak ikut dihitung supaya porsinya tidak mengecil hanya karena laporannya
 * belum lengkap.
 */
export function hitungSebaranStatus(statuses: ProgressStatus[]): SebaranStatus {
    const terisi = statuses.filter((s) => s !== '-');
    const leading = terisi.filter((s) => s === 'Leading').length;
    const lagging = terisi.filter((s) => s === 'Lagging').length;
    const porsi = (n: number) =>
        terisi.length === 0 ? 0 : Math.round((n / terisi.length) * 1000) / 10;

    return {
        hariTerisi: terisi.length,
        leadingHari: leading,
        laggingHari: lagging,
        leadingPersen: porsi(leading),
        laggingPersen: porsi(lagging),
    };
}

export type DeviasiStatus = 'Leading' | 'Lagging' | 'Tepat';

export type Deviasi = {
    /** Realisasi dikurangi rencana, dalam poin persen. */
    selisih: number;
    status: DeviasiStatus;
};

/**
 * Seberapa jauh realisasi menyimpang dari rencana, dalam persen.
 *
 * Dipakai sebagai ganti hitungan "berapa hari leading/lagging": yang menjadi
 * ukuran keterlambatan sebuah outage adalah jarak antara kurva rencana dan
 * kurva realisasi pada hari yang sama, bukan banyaknya hari yang berstatus
 * tertinggal. Keduanya dibandingkan di hari terakhir yang realisasinya terisi.
 */
export function hitungDeviasi(
    plan: number | null | undefined,
    actual: number | null | undefined,
): Deviasi {
    const selisih = Math.round(((actual ?? 0) - (plan ?? 0)) * 100) / 100;

    return {
        selisih,
        status: selisih > 0 ? 'Leading' : selisih < 0 ? 'Lagging' : 'Tepat',
    };
}

/** Label yang ditampilkan untuk tiap status deviasi. */
export function labelDeviasi(status: DeviasiStatus): string {
    return status === 'Tepat' ? 'Tepat Rencana' : status;
}

/**
 * Selisih bertanda dalam format Indonesia, mis. "+12,45 %" atau "−12,45 %".
 *
 * Memakai minus tipografis, bukan tanda hubung, supaya angka negatif tidak
 * terbaca sebagai rentang saat berdampingan dengan angka lain.
 */
export function formatSelisih(selisih: number): string {
    const tanda = selisih > 0 ? '+' : selisih < 0 ? '−' : '';
    const angka = Math.abs(selisih).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `${tanda}${angka} %`;
}

/** Kelas badge deviasi; warnanya sejalan dengan status harian. */
export function deviasiBadgeClass(status: DeviasiStatus): string {
    switch (status) {
        case 'Leading':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
        case 'Lagging':
            return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
        default:
            return 'bg-muted text-muted-foreground';
    }
}

export function buildDailyRows(
    dateList: string[],
    existing: DailyProgressRecord[],
): DailyProgressRow[] {
    return dateList.map((tanggal) => {
        const found = existing.find((d) => d.tanggal === tanggal);

        return {
            tanggal,
            plan_progress:
                found?.plan_progress !== undefined &&
                found?.plan_progress !== null
                    ? String(found.plan_progress)
                    : '',
            actual_progress:
                found?.actual_progress !== undefined &&
                found?.actual_progress !== null
                    ? String(found.actual_progress)
                    : '',
            // Nilai numerik dari server dijadikan string, karena input HTML
            // selalu bekerja dengan string.
            work_items: (found?.work_items ?? []).map((w) => ({
                uraian: w.uraian ?? '',
                progress: w.progress === null || w.progress === undefined
                    ? ''
                    : String(w.progress),
            })),
            spare_parts: (found?.spare_parts ?? []).map((s) => ({
                nama: s.nama ?? '',
                part_number: s.part_number ?? '',
                qty: s.qty === null || s.qty === undefined ? '' : String(s.qty),
                keterangan: s.keterangan ?? '',
            })),
            material_part_number: found?.material_part_number ?? '',
            material_nama: found?.material_nama ?? '',
            uraian_pekerjaan: found?.uraian_pekerjaan ?? '',
            keterangan: found?.keterangan ?? '',
            photos: found?.photos ?? [],
        };
    });
}

/** Baris kosong untuk satu tanggal, dipakai saat hari baru ditambahkan. */
export function emptyDailyRow(tanggal: string): DailyProgressRow {
    return {
        tanggal,
        plan_progress: '',
        actual_progress: '',
        work_items: [],
        spare_parts: [],
        material_part_number: '',
        material_nama: '',
        uraian_pekerjaan: '',
        keterangan: '',
        photos: [],
    };
}

/** Progress is cumulative, so the highest recorded actual value is the current overall progress. */
export function getLatestActualProgress(rows: DailyProgressRow[]): number {
    return rows.reduce((max, row) => {
        const actualNum = row.actual_progress === '' ? 0 : Number(row.actual_progress);

        return Number.isNaN(actualNum) ? max : Math.max(max, actualNum);
    }, 0);
}

export type DailyProgressValidationError = {
    index: number;
    tanggal: string;
    message: string;
};

/** Validates 0-100 bounds and that cumulative values never decrease day over day. */
export function validateDailyProgress(
    rows: DailyProgressRow[],
): DailyProgressValidationError[] {
    const errors: DailyProgressValidationError[] = [];
    let prevPlan = 0;
    let prevActual = 0;

    rows.forEach((row, idx) => {
        const label = `Day ${idx + 1} (${formatDMY(row.tanggal)})`;
        const planNum =
            row.plan_progress === '' ? null : Number(row.plan_progress);
        const actualNum =
            row.actual_progress === '' ? null : Number(row.actual_progress);

        if (
            planNum !== null &&
            (Number.isNaN(planNum) || planNum < 0 || planNum > 100)
        ) {
            errors.push({
                index: idx,
                tanggal: row.tanggal,
                message: `${label}: Plan Progress harus berupa angka 0-100.`,
            });
        }

        if (
            actualNum !== null &&
            (Number.isNaN(actualNum) || actualNum < 0 || actualNum > 100)
        ) {
            errors.push({
                index: idx,
                tanggal: row.tanggal,
                message: `${label}: Actual Progress harus berupa angka 0-100.`,
            });
        }

        if (planNum !== null && !Number.isNaN(planNum) && planNum < prevPlan) {
            errors.push({
                index: idx,
                tanggal: row.tanggal,
                message: `${label}: Plan Progress tidak boleh turun dari hari sebelumnya.`,
            });
        }

        if (
            actualNum !== null &&
            !Number.isNaN(actualNum) &&
            actualNum < prevActual
        ) {
            errors.push({
                index: idx,
                tanggal: row.tanggal,
                message: `${label}: Actual Progress tidak boleh turun dari hari sebelumnya.`,
            });
        }

        if (planNum !== null && !Number.isNaN(planNum)) {
            prevPlan = planNum;
        }

        if (actualNum !== null && !Number.isNaN(actualNum)) {
            prevActual = actualNum;
        }
    });

    return errors;
}
