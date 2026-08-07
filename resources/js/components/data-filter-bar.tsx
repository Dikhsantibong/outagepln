import { Filter, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

/** Sentinel for "no filter" — Radix Select does not allow an empty item value. */
export const ALL = '__all__';

/**
 * Nilai filter tahun yang berarti "semua tahun".
 *
 * Berbeda dari ALL: setiap listing kini terbuka di tahun berjalan, jadi
 * mengosongkan parameter berarti "pakai default" dan halaman akan kembali ke
 * tahun berjalan. "Semua tahun" harus dikirim sebagai nilai tersendiri agar
 * pilihan itu bertahan.
 */
export const TAHUN_SEMUA = 'semua';

export type FilterOption = { value: string; label: string };

/**
 * Builds the query object for a filtered listing: merges the current filters
 * with a patch and drops empty values so URLs stay short and shareable.
 */
export function buildFilterQuery(
    current: Record<string, unknown> | undefined,
    keys: string[],
    patch: Record<string, string>,
): Record<string, string> {
    const next: Record<string, string> = {};

    keys.forEach((k) => {
        next[k] = (current?.[k] as string) ?? '';
    });

    Object.assign(next, patch);

    return Object.fromEntries(
        Object.entries(next).filter(([, v]) => v !== '' && v !== ALL),
    );
}

/**
 * Counts how many of the given filter keys currently hold a value.
 *
 * `tahun` is skipped on purpose: sejak setiap listing terbuka di tahun berjalan,
 * filter tahun selalu terisi, jadi menghitungnya hanya membuat tombol reset
 * seolah-olah selalu ada filter aktif.
 */
export function countActiveFilters(
    filters: Record<string, unknown> | undefined,
    keys: string[],
): number {
    return keys.filter((k) => k !== 'tahun' && filters?.[k]).length;
}

export function FilterSelect({
    label,
    value,
    onChange,
    options,
    width = 'w-[140px]',
    allValue = ALL,
    allLabel = 'Semua',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    width?: string;
    /** Nilai untuk pilihan "semua"; filter tahun memakai TAHUN_SEMUA. */
    allValue?: string;
    allLabel?: string;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={`h-8 ${width} text-xs`}>
                    <SelectValue placeholder={allLabel} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={allValue}>{allLabel}</SelectItem>
                    {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

/**
 * Filter tahun, dipakai seragam di semua listing.
 *
 * Nilainya tidak pernah kosong: server selalu mengembalikan tahun yang sedang
 * dipakai, atau `semua` bila pengguna memilih seluruh tahun.
 */
export function FilterTahun({
    value,
    onChange,
    options,
}: {
    value: string | null | undefined;
    onChange: (value: string) => void;
    options: (string | number)[];
}) {
    return (
        <FilterSelect
            label="Tahun"
            value={value || TAHUN_SEMUA}
            onChange={onChange}
            options={options.map((t) => ({ value: String(t), label: String(t) }))}
            width="w-[120px]"
            allValue={TAHUN_SEMUA}
            allLabel="Semua tahun"
        />
    );
}

export function FilterDate({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                {label}
            </Label>
            <Input
                type="date"
                className="h-8 w-[150px] text-xs"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

export function FilterBar({
    children,
    activeCount,
    onReset,
}: {
    children: ReactNode;
    activeCount: number;
    onReset: () => void;
}) {
    return (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-2.5">
            <div className="flex items-center gap-1.5 pb-1.5 text-xs font-semibold text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Filter
            </div>

            {children}

            {activeCount > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                    <X className="h-3.5 w-3.5" />
                    Reset ({activeCount})
                </Button>
            )}
        </div>
    );
}
