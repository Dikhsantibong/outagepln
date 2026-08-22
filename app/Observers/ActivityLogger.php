<?php

namespace App\Observers;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

/**
 * Mencatat tambah/ubah/hapus seluruh modul ke [ActivityLog].
 *
 * Pengamat ini menempel lewat AppServiceProvider, jadi tidak ada controller
 * yang perlu diubah. Prinsipnya: pencatatan tidak boleh pernah menggagalkan
 * operasi aslinya — seluruh isinya dibungkus try/catch dan kegagalannya cukup
 * masuk log aplikasi.
 */
class ActivityLogger
{
    /** Saklar untuk mematikan pencatatan sementara, mis. saat impor massal. */
    private static bool $aktif = true;

    /** Panjang maksimal satu nilai yang disimpan pada rincian perubahan. */
    private const BATAS_NILAI = 200;

    /**
     * Kolom yang isinya besar atau rahasia, jadi hanya ditandai berubah tanpa
     * ikut disalin: data URI foto/tanda tangan, kata sandi, dan token.
     */
    private const KOLOM_DISENSOR = [
        'foto', 'photos', 'foto_dokumentasi', 'signature', 'eviden',
        'eviden_sebelum', 'eviden_sesudah', 'password', 'remember_token',
        'token', 'two_factor_secret', 'two_factor_recovery_codes',
    ];

    /** Kolom yang berubah pada hampir setiap simpan dan tidak bermakna dibaca. */
    private const KOLOM_DIABAIKAN = ['created_at', 'updated_at'];

    /**
     * Nama modul yang terbaca manusia, per kelas model.
     *
     * @var array<string, string>
     */
    private const NAMA_MODUL = [
        'OutagePlan' => 'Outage Plan',
        'OutagePlanProgress' => 'Progress Harian',
        'OutagePlanRevision' => 'Revisi Rencana',
        'DailyMeeting' => 'Rapat Outage',
        'MeetingAttendee' => 'Daftar Hadir Rapat Outage',
        'MeetingIssue' => 'Notulen Rapat Outage',
        'MeetingFinding' => 'Temuan Rapat Outage',
        'MeetingKickoff' => 'Notulen Kick Off Rapat Outage',
        'MeetingKickoffPhoto' => 'Dokumentasi Rapat Outage',
        'MeetingMinute' => 'Notulen Rapat',
        'DailyBriefing' => 'Daily Meeting',
        'DailyBriefingAttendee' => 'Daftar Hadir Daily Meeting',
        'DailyBriefingIssue' => 'Notulen Daily Meeting',
        'DailyBriefingFinding' => 'Temuan Daily Meeting',
        'DailyBriefingKickoff' => 'Notulen Kick Off Daily Meeting',
        'DailyBriefingKickoffPhoto' => 'Dokumentasi Daily Meeting',
        'KinerjaQuality' => 'Kinerja On Quality',
        'KinerjaTime' => 'Kinerja On Time',
        'KinerjaCost' => 'Kinerja On Cost',
        'User' => 'Pengguna',
        'Unit' => 'Data Unit',
        'Mesin' => 'Data Mesin',
        'Material' => 'Data Material',
    ];

    /** Kolom yang dipakai sebagai judul baris, dicoba berurutan. */
    private const KOLOM_JUDUL = [
        'mesin_pembangkit', 'judul', 'nama', 'name', 'nama_mesin',
        'nama_sentral', 'uraian', 'permasalahan', 'email',
    ];

    /**
     * Jalankan sesuatu tanpa mencatat aktivitasnya.
     *
     * @template T
     *
     * @param  callable(): T  $aksi
     * @return T
     */
    public static function tanpaMencatat(callable $aksi)
    {
        $sebelumnya = self::$aktif;
        self::$aktif = false;

        try {
            return $aksi();
        } finally {
            self::$aktif = $sebelumnya;
        }
    }

    public function created(Model $model): void
    {
        $this->catat('created', $model, $this->ringkasNilai($model->getAttributes()));
    }

    public function updated(Model $model): void
    {
        $perubahan = [];

        foreach ($model->getChanges() as $kolom => $sesudah) {
            if (in_array($kolom, self::KOLOM_DIABAIKAN, true)) {
                continue;
            }

            $perubahan[$kolom] = [
                'sebelum' => $this->ringkasSatuNilai($kolom, $model->getOriginal($kolom)),
                'sesudah' => $this->ringkasSatuNilai($kolom, $sesudah),
            ];
        }

        // Simpan yang benar-benar berubah saja; kalau tidak ada, tidak ada yang
        // perlu dicatat.
        if ($perubahan === []) {
            return;
        }

        $this->catat('updated', $model, $perubahan);
    }

    public function deleted(Model $model): void
    {
        $this->catat('deleted', $model, $this->ringkasNilai($model->getAttributes()));
    }

    /**
     * @param  array<string, mixed>  $perubahan
     */
    private function catat(string $event, Model $model, array $perubahan): void
    {
        try {
            if (! self::$aktif || $model instanceof ActivityLog) {
                return;
            }

            // Migrasi dan pemasangan awal berjalan sebelum tabelnya ada.
            if (! Schema::hasTable('activity_logs')) {
                return;
            }

            $pengguna = Auth::user();
            $request = request();

            // PHPUnit juga "running in console", padahal request-nya disimulasikan
            // penuh — tanpa pengecualian ini asal aksi pada pengujian tercatat
            // sebagai perintah konsol.
            $dariHttp = ! app()->runningInConsole() || app()->runningUnitTests();

            ActivityLog::create([
                'user_id' => $pengguna?->id,
                'user_nama' => $pengguna?->name,
                'user_role' => $pengguna?->role
                    ?? ($dariHttp ? ActivityLog::ROLE_PUBLIK : null),
                'event' => $event,
                'subject_type' => $model::class,
                'subject_label' => $this->namaModul($model),
                'subject_id' => $model->getKey(),
                'deskripsi' => $this->judulBaris($model),
                'perubahan' => $perubahan,
                'url' => $dariHttp ? Str::limit($request->fullUrl(), 490, '') : null,
                'method' => $dariHttp ? $request->method() : null,
                'ip' => $dariHttp ? $request->ip() : null,
                'created_at' => now(),
            ]);
        } catch (Throwable $e) {
            // Jejak aktivitas tidak boleh menggagalkan pekerjaan penggunanya.
            Log::warning('Gagal mencatat aktivitas: '.$e->getMessage(), [
                'model' => $model::class,
                'event' => $event,
            ]);
        }
    }

    private function namaModul(Model $model): string
    {
        $kelas = class_basename($model);

        return self::NAMA_MODUL[$kelas] ?? Str::headline($kelas);
    }

    private function judulBaris(Model $model): string
    {
        foreach (self::KOLOM_JUDUL as $kolom) {
            $nilai = $model->getAttribute($kolom);

            if (filled($nilai) && is_scalar($nilai)) {
                return Str::limit((string) $nilai, 120);
            }
        }

        return '#'.$model->getKey();
    }

    /**
     * @param  array<string, mixed>  $atribut
     * @return array<string, mixed>
     */
    private function ringkasNilai(array $atribut): array
    {
        $hasil = [];

        foreach ($atribut as $kolom => $nilai) {
            if (in_array($kolom, self::KOLOM_DIABAIKAN, true)) {
                continue;
            }

            $hasil[$kolom] = $this->ringkasSatuNilai($kolom, $nilai);
        }

        return $hasil;
    }

    private function ringkasSatuNilai(string $kolom, mixed $nilai): mixed
    {
        if (in_array($kolom, self::KOLOM_DISENSOR, true)) {
            return blank($nilai) ? null : '[data]';
        }

        if (is_array($nilai)) {
            return Str::limit(json_encode($nilai) ?: '', self::BATAS_NILAI);
        }

        if (is_string($nilai)) {
            return Str::limit($nilai, self::BATAS_NILAI);
        }

        return $nilai;
    }
}
