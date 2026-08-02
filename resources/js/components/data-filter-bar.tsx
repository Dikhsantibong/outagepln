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

/** Counts how many of the given filter keys currently hold a value. */
export function countActiveFilters(
    filters: Record<string, unknown> | undefined,
    keys: string[],
): number {
    return keys.filter((k) => filters?.[k]).length;
}

export function FilterSelect({
    label,
    value,
    onChange,
    options,
    width = 'w-[140px]',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    width?: string;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={`h-8 ${width} text-xs`}>
                    <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Semua</SelectItem>
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
