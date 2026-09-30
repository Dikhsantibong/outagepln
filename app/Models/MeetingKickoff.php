<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingKickoff extends Model
{
    protected $fillable = [
        'meeting_id',
        'nomor_dokumen',
        'revisi',
        'tanggal_terbit',
        'pimpinan_rapat',
        'tempat',
        'waktu',
        'agenda',
        'peserta',
        'penyampaian_pln',
        'nama_mitra',
        'penyampaian_mitra',
        'hasil_kesepakatan',
        'link_absensi',
        'pimpinan_nama',
        'pimpinan_jabatan',
        'notulis_nama',
        'notulis_jabatan',
        'sembunyikan_pimpinan',
        'sembunyikan_notulis',
        'kota_ttd',
        'tanggal_ttd',
    ];

    protected $casts = [
        'tanggal_terbit' => 'date:Y-m-d',
        'tanggal_ttd' => 'date:Y-m-d',
        'sembunyikan_pimpinan' => 'boolean',
        'sembunyikan_notulis' => 'boolean',
    ];

    public function meeting()
    {
        return $this->belongsTo(DailyMeeting::class, 'meeting_id');
    }
}
