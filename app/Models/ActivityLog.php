<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Satu baris jejak aktivitas. Bersifat tambah-saja: tidak pernah diperbarui,
 * jadi kolom updated_at ditiadakan.
 */
class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    /** Peran yang dipakai saat aksinya datang dari halaman publik tanpa login. */
    public const ROLE_PUBLIK = 'publik';

    protected $guarded = [];

    protected $casts = [
        'perubahan' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Nama pelaku sebagaimana ditampilkan; akun terhapus tetap punya nama. */
    public function getPelakuAttribute(): string
    {
        return $this->user_nama ?: ($this->user?->name ?? 'Sistem');
    }
}
