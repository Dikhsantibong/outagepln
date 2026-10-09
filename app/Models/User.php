<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Http\Controllers\Master\UserController;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'password', 'role', 'merek', 'unit', 'units', 'tipe', 'menu_access'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'menu_access' => 'array',
            'units' => 'array',
        ];
    }

    protected static function booted(): void
    {
        // users.units adalah daftar unit kelola; users.unit dipertahankan untuk
        // akun satu unit. Keduanya diselaraskan apa pun jalur penulisannya —
        // form Data Master, perintah artisan, maupun factory di tes.
        static::saving(function (User $user) {
            if ($user->isDirty('units')) {
                $units = array_values(array_unique(array_filter((array) $user->units, fn ($u) => filled($u))));
                $user->units = $units === [] ? null : $units;
                $user->unit = count($units) === 1 ? $units[0] : null;
            } elseif ($user->isDirty('unit')) {
                $user->units = filled($user->unit) ? [$user->unit] : null;
            }
        });
    }

    /**
     * Unit yang dipegang akun ini; kosong berarti seluruh unit mereknya.
     *
     * @return array<int, string>
     */
    public function unitKelola(): array
    {
        if (filled($this->units)) {
            return array_values($this->units);
        }

        return filled($this->unit) ? [$this->unit] : [];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Menu rapat dikoordinasi terpusat, jadi pengelola baru mendapatkannya bila
     * super admin mencentangnya secara eksplisit di Izin Akses Menu.
     */
    public const MENU_RAPAT = ['rapat-outage', 'daily-meeting'];

    /**
     * Menu yang benar-benar boleh dibuka akun ini; null berarti seluruh menu.
     *
     * menu_access null ("belum pernah diatur") berarti seluruh menu, kecuali
     * untuk pengelola: baginya seluruh menu tanpa [MENU_RAPAT] — sama dengan
     * perilaku sebelum izin menu bisa membuka menu rapat, sehingga akun lama
     * tidak tiba-tiba mendapat akses yang tidak pernah diberikan.
     *
     * @return array<int, string>|null
     */
    public function menuEfektif(): ?array
    {
        if ($this->isSuperAdmin()) {
            return null;
        }

        if (is_array($this->menu_access)) {
            return array_values($this->menu_access);
        }

        if ($this->role === 'pengelola') {
            return array_values(array_diff(array_keys(UserController::MENUS), self::MENU_RAPAT));
        }

        return null;
    }

    public function bolehMenu(string $menu): bool
    {
        $menus = $this->menuEfektif();

        return $menus === null || in_array($menu, $menus, true);
    }

    /**
     * Label wilayah kelola akun ini: merek mesin, dipersempit ke satu tipe
     * dan/atau beberapa unit bila akunnya memang dipatok ke sana —
     * "CUMMINS · QSK23G3 · PLTD EREKE, PLTD LANGARA" atau "MIRRLEES · PLTD POASIA".
     *
     * Akun tanpa merek maupun unit (admin, tamu, super admin) tidak dibatasi,
     * jadi labelnya null.
     */
    public function labelKelola(): ?string
    {
        $bagian = array_filter(
            [$this->merek, $this->tipe, implode(', ', $this->unitKelola())],
            fn (?string $v) => filled($v),
        );

        return $bagian === [] ? null : implode(' · ', $bagian);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin' || $this->role === 'super_admin';
    }

    /** Tamu hanya boleh melihat; tidak boleh menambah maupun mengubah apa pun. */
    public function isTamu(): bool
    {
        return $this->role === 'tamu';
    }

    /**
     * Pengelola mengisi dan mengubah data mesin merek yang dikelolanya, tapi
     * tidak boleh membuang catatan induk — jadwal outage dan rapat. Menghapus
     * satu jadwal ikut membuang seluruh riwayat progres harian, foto, dan
     * notulennya, dan itu tidak bisa dibatalkan.
     *
     * Menghapus temuan atau foto notulen tetap boleh, karena itu bagian dari
     * mengoreksi isian mereka sendiri.
     */
    public function canDeleteRecords(): bool
    {
        return $this->isAdmin();
    }

    /** Tamu tidak boleh menulis apa pun. */
    public function canWrite(): bool
    {
        return ! $this->isTamu();
    }

    /**
     * Rapat outage dikoordinasi terpusat, bukan per merek mesin, jadi menunya
     * tidak relevan untuk pengelola.
     */
    public function canViewMeetings(): bool
    {
        return $this->role !== 'pengelola';
    }

    /**
     * Rencana outage dan jadwal rapatnya ditetapkan terpusat, sealasan dengan
     * [canViewMeetings()]. Pengelola mengisi realisasi dan progres harian mesin
     * yang dikelolanya, tapi tidak menggeser tanggal rencananya — jadwal itu
     * cukup dibacanya di halaman detail.
     */
    public function canEditJadwalRapat(): bool
    {
        return $this->role !== 'pengelola';
    }
}
