export type DailyProgressRow = {
    tanggal: string;
    plan_progress: string;
    actual_progress: string;
    keterangan: string;
};

export type DailyProgressRecord = {
    id?: number;
    tanggal: string;
    /** null = hari tersebut belum diisi. */
    plan_progress: number | string | null;
    actual_progress: number | string | null;
    keterangan: string | null;
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

/** A row counts as filled once either value has been entered. */
function hasData(row: DailyProgressRecord): boolean {
    const filled = (v: number | string | null | undefined) =>
        v !== null && v !== undefined && v !== '';

    return filled(row.plan_progress) || filled(row.actual_progress);
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
            keterangan: found?.keterangan ?? '',
        };
    });
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
