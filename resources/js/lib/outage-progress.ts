export type DailyProgressRow = {
    tanggal: string;
    plan_progress: string;
    actual_progress: string;
    keterangan: string;
};

export type DailyProgressRecord = {
    id?: number;
    tanggal: string;
    plan_progress: number | string;
    actual_progress: number | string;
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

/** Status is Leading whenever actual >= plan (equal counts as Leading), otherwise Lagging. */
export function computeStatus(
    plan: number | string,
    actual: number | string,
): 'Leading' | 'Lagging' {
    const planNum = Number(plan) || 0;
    const actualNum = Number(actual) || 0;

    return actualNum >= planNum ? 'Leading' : 'Lagging';
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
