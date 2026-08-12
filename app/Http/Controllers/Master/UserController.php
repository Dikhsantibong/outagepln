<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    const MENUS = [
        'dashboard' => 'Dashboard',
        'outage-plans' => 'Perencanaan & Jadwal Outage',
        'rapat-outage' => 'Rapat Outage & Daily Meeting',
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
            ->get();

        return inertia('master/users/index', [
            'users' => $users,
            'availableMenus' => self::MENUS,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'pengelola', 'tamu'])],
            'merek' => 'nullable|string|max:255',
            'menu_access' => 'nullable|array',
        ]);

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
            'menu_access' => 'nullable|array',
        ]);

        if (!empty($validated['password'])) {
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

    public function destroy(User $user)
    {
        if ($user->isSuperAdmin()) {
            abort(403, 'Tidak dapat menghapus super admin.');
        }

        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }
}
