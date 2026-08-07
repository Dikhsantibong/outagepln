<?php

namespace App\Http\Controllers\Concerns;

use App\Models\OutagePlan;
use App\Support\TahunFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Shared filtering for the Kinerja Outage pages (On Quality / On Time / On Cost),
 * which all list the same outage plans with a different performance relation.
 */
trait FiltersOutagePlans
{
    /** Filter keys accepted by every Kinerja listing. */
    protected array $kinerjaFilterKeys = [
        'search', 'tahun', 'scope', 'jenis', 'sistem', 'status',
    ];

    protected function applyPlanFilters(Builder $query, Request $request): Builder
    {
        // Each account manages one engine brand; admin/tamu see everything.
        $query->visibleTo($request->user());

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('mesin_pembangkit', 'like', "%{$search}%")
                    ->orWhere('scope', 'like', "%{$search}%")
                    ->orWhere('sistem', 'like', "%{$search}%");
            });
        }

        // Tanpa parameter, listing terbuka di tahun berjalan — bukan seluruh tahun.
        $tahun = $this->tahunAktif($request);

        if ($tahun !== null) {
            $query->whereYear('start_date', $tahun);
        }

        foreach (['scope' => 'scope', 'jenis' => 'jenis_pembangkit', 'sistem' => 'sistem'] as $param => $column) {
            if ($request->filled($param)) {
                $query->where($column, $request->input($param));
            }
        }

        return $query;
    }

    /**
     * Filters by how complete the performance data is. $filled/$partial receive
     * the query and add the conditions specific to each Kinerja module.
     */
    protected function applyStatusFilter(
        Builder $query,
        Request $request,
        string $relation,
        callable $lengkap,
        ?callable $sebagian = null
    ): Builder {
        return match ($request->input('status')) {
            'lengkap' => $query->whereHas($relation, $lengkap),
            'sebagian' => $sebagian
                ? $query->whereHas($relation, $sebagian)
                : $query,
            'belum' => $query->where(function ($q) use ($relation, $lengkap) {
                $q->whereDoesntHave($relation)
                    ->orWhereHas($relation, fn ($r) => $r->whereNot($lengkap));
            }),
            default => $query,
        };
    }

    /** Tahun yang sedang ditampilkan, atau null bila pengguna memilih semua tahun. */
    protected function tahunAktif(Request $request): ?int
    {
        return TahunFilter::resolve($request->input('tahun'), $this->tahunOptions());
    }

    /**
     * Nilai filter yang dikirim balik ke frontend, dengan tahun yang sudah
     * diselesaikan supaya dropdown menampilkan pilihan yang benar-benar dipakai.
     */
    protected function filterState(Request $request, array $extraKeys = []): array
    {
        return array_merge(
            $request->only([...$this->kinerjaFilterKeys, ...$extraKeys]),
            ['tahun' => TahunFilter::label($this->tahunAktif($request))],
        );
    }

    /** @return array<int, string> */
    protected function tahunOptions(): array
    {
        return TahunFilter::options(OutagePlan::visibleTo(request()->user()), 'start_date');
    }

    protected function planFilterOptions(): array
    {
        // Options are scoped too, so an account never sees choices that would
        // return nothing for it.
        $user = request()->user();

        $distinct = fn (string $column) => OutagePlan::visibleTo($user)
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->values();

        return [
            'tahun' => $this->tahunOptions(),
            'scope' => $distinct('scope'),
            'jenis' => $distinct('jenis_pembangkit'),
            'sistem' => $distinct('sistem'),
        ];
    }

    /**
     * Lightweight list used by the plan picker, so the dropdown can search every
     * plan without shipping the full records for all of them.
     */
    protected function planPickerList(): \Illuminate\Support\Collection
    {
        return OutagePlan::visibleTo(request()->user())
            ->orderBy('mesin_pembangkit')
            ->get(['id', 'mesin_pembangkit', 'jenis_pembangkit', 'scope', 'sistem', 'progress', 'start_date', 'selesai'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'mesin_pembangkit' => $p->mesin_pembangkit,
                'jenis_pembangkit' => $p->jenis_pembangkit,
                'scope' => $p->scope,
                'sistem' => $p->sistem,
                'progress' => $p->progress,
                'start_date' => $p->start_date,
                'selesai' => $p->selesai,
            ]);
    }
}
