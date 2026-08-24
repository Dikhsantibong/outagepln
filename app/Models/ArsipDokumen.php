<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Satu berkas arsip overhaul yang diunggah manual.
 */
class ArsipDokumen extends Model
{
    protected $fillable = [
        'judul',
        'kategori',
        'keterangan',
        'path',
        'nama_asli',
        'mime',
        'ukuran',
        'user_id',
        'user_nama',
    ];

    protected $casts = [
        'ukuran' => 'integer',
    ];

    /**
     * Jenis arsip yang dikelola menu ini.
     *
     * Daftar tertutup supaya arsipnya bisa disaring dengan pasti; menambah
     * jenis baru cukup di sini dan pilihannya ikut muncul di form.
     */
    public const KATEGORI = [
        'kontrak' => 'Kontrak Overhaul',
        'hasil' => 'Hasil Pekerjaan Overhaul',
    ];

    /**
     * Berkas yang bisa ditampilkan langsung di halaman.
     *
     * PDF dan gambar dirender browser apa adanya. Berkas Office tidak, jadi
     * untuk jenis itu hanya tombol unduh yang ditawarkan — lebih jujur daripada
     * membuka pratinjau yang pasti kosong.
     */
    public function bisaDipratinjau(): bool
    {
        return $this->mime === 'application/pdf'
            || str_starts_with((string) $this->mime, 'image/');
    }

    public function labelKategori(): string
    {
        return self::KATEGORI[$this->kategori] ?? $this->kategori;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Nama pengunggah; akun yang sudah dihapus tetap punya nama tercatat. */
    public function getPengunggahAttribute(): string
    {
        return $this->user_nama ?: ($this->user?->name ?? 'Sistem');
    }
}
