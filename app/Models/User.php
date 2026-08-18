<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'password', 'role', 'merek', 'menu_access'])]
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
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
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
}
