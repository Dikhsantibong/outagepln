<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Menu Aktivitas — hanya untuk Super Admin, lihat rute di routes/web.php.
 *
 * Bacaan saja: jejak aktivitas tidak boleh disunting maupun dihapus dari
 * antarmuka, karena justru itu gunanya.
 */
class ActivityLogController extends Controller
{
    /** Filter yang dikenali daftar. */
    private const FILTER_KEYS = ['search', 'event', 'role', 'user', 'modul', 'dari', 'sampai'];

    public function index(Request $request)
    {
        $query = ActivityLog::query()->with('user:id,name,role');

        if ($request->filled('search')) {
            $cari = $request->input('search');
            $query->where(function ($q) use ($cari) {
                $q->where('deskripsi', 'like', "%{$cari}%")
                    ->orWhere('user_nama', 'like', "%{$cari}%")
                    ->orWhere('subject_label', 'like', "%{$cari}%");
            });
        }

        foreach (['event' => 'event', 'role' => 'user_role', 'modul' => 'subject_label'] as $param => $kolom) {
            if ($request->filled($param) && $request->input($param) !== 'Semua') {
                $query->where($kolom, $request->input($param));
            }
        }

        if ($request->filled('user') && $request->input('user') !== 'Semua') {
            $query->where('user_id', $request->input('user'));
        }

        if ($request->filled('dari')) {
            $query->whereDate('created_at', '>=', $request->input('dari'));
        }

        if ($request->filled('sampai')) {
            $query->whereDate('created_at', '<=', $request->input('sampai'));
        }

        $aktivitas = $query->latest('created_at')->latest('id')->paginate(30)->withQueryString();

        return Inertia::render('aktivitas/index', [
            'aktivitas' => $aktivitas,
            'filters' => $request->only(self::FILTER_KEYS),
            'filterOptions' => [
                'event' => ['Semua', 'created', 'updated', 'deleted'],
                'role' => array_merge(['Semua'], $this->nilaiUnik('user_role')),
                'modul' => array_merge(['Semua'], $this->nilaiUnik('subject_label')),
                'user' => $this->daftarPelaku(),
            ],
            'ringkasan' => $this->ringkasan(),
        ]);
    }

    /**
     * Nilai yang benar-benar ada di tabel, supaya tidak ada pilihan filter
     * yang hasilnya pasti kosong.
     *
     * @return array<int, string>
     */
    private function nilaiUnik(string $kolom): array
    {
        return ActivityLog::query()
            ->whereNotNull($kolom)
            ->distinct()
            ->orderBy($kolom)
            ->pluck($kolom)
            ->all();
    }

    /**
     * Pelaku yang pernah tercatat, beserta perannya.
     *
     * @return array<int, array{id: int, nama: string, role: string|null}>
     */
    private function daftarPelaku(): array
    {
        return ActivityLog::query()
            ->whereNotNull('user_id')
            ->select('user_id', 'user_nama', 'user_role')
            ->distinct()
            ->orderBy('user_nama')
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->user_id,
                'nama' => $log->user_nama ?? '(tanpa nama)',
                'role' => $log->user_role,
            ])
            ->all();
    }

    /**
     * Hitungan per jenis aksi untuk hari ini dan keseluruhan.
     *
     * @return array{hariIni: int, total: int, perEvent: array<string, int>}
     */
    private function ringkasan(): array
    {
        return [
            'hariIni' => ActivityLog::whereDate('created_at', today())->count(),
            'total' => ActivityLog::count(),
            'perEvent' => ActivityLog::query()
                ->selectRaw('event, count(*) as jumlah')
                ->groupBy('event')
                ->pluck('jumlah', 'event')
                ->all(),
        ];
    }
}
