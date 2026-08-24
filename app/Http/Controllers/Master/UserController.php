<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    const MENUS = [
        'dashboard' => 'Dashboard',
        'outage-plans' => 'Perencanaan & Jadwal',
        'rapat-outage' => 'Rapat Outage',
        'daily-meeting' => 'Daily Meeting',
        'kinerja.on-quality' => 'Kinerja: On Quality',
        'kinerja.on-time' => 'Kinerja: On Time',
        'kinerja.on-cost' => 'Kinerja: On Cost',
        'kinerja.on-scope' => 'Kinerja: On Scope',
        'kinerja.on-safety' => 'Kinerja: On Safety',
        'team-outage' => 'Team Outage',
    ];

    public function index()
    {
        // Don't allow managing other super_admins, but show the current user
        $users = User::where('role', '!=', 'super_admin')
            ->orWhere('id', auth()->id())
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                ...$user->only(['id', 'name', 'email', 'role', 'merek', 'unit', 'menu_access']),
                'label_kelola' => $user->labelKelola(),
            ]);

        return inertia('master/users/index', [
            'users' => $users,
            'availableMenus' => self::MENUS,
            'availableMereks' => $this->mereks(),
            'unitsPerMerek' => $this->unitsPerMerek(),
        ]);
    }

    /**
     * Merek mesin yang benar-benar punya rencana outage, untuk dipilih di form.
     *
     * @return array<int, string>
     */
    private function mereks(): array
    {
        return OutagePlan::query()
            ->whereNotNull('merek')
            ->where('merek', '!=', '')
            ->distinct()
            ->orderBy('merek')
            ->pluck('merek')
            ->all();
    }

    /**
     * Unit tempat tiap merek terpasang, supaya satu merek yang tersebar di
     * beberapa unit — MIRRLEES di PLTD POASIA dan PLTD RAHA — bisa dipecah
     * menjadi akun pengelola terpisah per unit.
     *
     * @return array<string, array<int, string>>
     */
    private function unitsPerMerek(): array
    {
        return OutagePlan::query()
            ->select('merek', 'unit')
            ->whereNotNull('merek')
            ->where('merek', '!=', '')
            ->whereNotNull('unit')
            ->where('unit', '!=', '')
            ->distinct()
            ->orderBy('merek')
            ->orderBy('unit')
            ->get()
            ->groupBy('merek')
            ->map(fn ($baris) => $baris->pluck('unit')->all())
            ->all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'pengelola', 'tamu'])],
            'merek' => 'nullable|string|max:255',
            'unit' => 'nullable|string|max:255',
            'menu_access' => 'nullable|array',
        ]);

        $validated = $this->bersihkanWilayah($validated);
        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return back()->with('success', 'User berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        // Prevent modifying another super_admin
        if ($user->isSuperAdmin() && $user->id !== auth()->id()) {
            abort(403, 'Tidak dapat mengubah data super admin lain.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => ['required', Rule::in(['admin', 'pengelola', 'tamu'])],
            'merek' => 'nullable|string|max:255',
            'unit' => 'nullable|string|max:255',
            'menu_access' => 'nullable|array',
        ]);

        $validated = $this->bersihkanWilayah($validated);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // If the user being edited is the super admin themselves, preserve their role and full menu access
        if ($user->isSuperAdmin()) {
            unset($validated['role']);
            $validated['menu_access'] = null;
        }

        $user->update($validated);

        return back()->with('success', 'Data user berhasil diperbarui.');
    }

    /**
     * Hanya pengelola yang dipatok ke merek dan unit; admin dan tamu melihat
     * seluruh mesin sehingga wilayahnya selalu dikosongkan. Unit tanpa merek
     * ikut dibuang, karena pemisahan akun selalu bertumpu pada mereknya dulu.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function bersihkanWilayah(array $validated): array
    {
        if (($validated['role'] ?? null) !== 'pengelola') {
            return [...$validated, 'merek' => null, 'unit' => null];
        }

        $merek = filled($validated['merek'] ?? null) ? $validated['merek'] : null;
        $unit = $merek !== null && filled($validated['unit'] ?? null) ? $validated['unit'] : null;

        return [...$validated, 'merek' => $merek, 'unit' => $unit];
    }

    public function destroy(User $user)
    {
        if ($user->isSuperAdmin()) {
            abort(403, 'Tidak dapat menghapus super admin.');
        }

        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }
}
