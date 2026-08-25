<?php

namespace App\Models;

use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DailyMeeting extends Model
{
    protected $guarded = [];

    protected $casts = [
        'tanggal' => 'date',
        'tanggal_realisasi' => 'date',
    ];

    /**
     * Rangkaian rapat pra-outage yang notulennya berlanjut, urut waktu.
     *
     * Urutannya mengikuti [JadwalRapatOutage::OFFSET_HARI]: R2 paling awal
     * (365 hari sebelum start) sampai P2 (30 hari). Permasalahan yang dibahas
     * di satu rapat dibawa ke rapat berikutnya untuk ditinjau ulang, sehingga
     * daftarnya tidak perlu diketik ulang tiap kali.
     *
     * RAPAT P3 sengaja tidak masuk: rapat itu memakai Notulen Kick Off, bukan
     * daftar permasalahan, jadi tidak ada yang diwariskan ke sana.
     */
    public const URUTAN_NOTULEN = ['RAPAT R2', 'RAPAT R3', 'RAPAT P1', 'RAPAT P2'];

    /** Posisi rapat ini dalam rangkaian; null bila di luar rangkaian (P3). */
    public function posisiNotulen(): ?int
    {
        $posisi = array_search(strtoupper((string) $this->tipe_rapat), self::URUTAN_NOTULEN, true);

        return $posisi === false ? null : $posisi;
    }

    /** Apakah notulen rapat ini boleh mewarisi dari rapat sebelumnya? */
    public function bolehMewarisiNotulen(): bool
    {
        return $this->posisiNotulen() > 0;
    }

    /**
     * Rapat terdekat sebelum ini yang notulennya sudah terisi.
     *
     * Ditelusuri mundur, bukan hanya satu langkah: rapat kerap dilewat, dan
     * bila R3 tidak sempat digelar maka P1 mewarisi langsung dari R2.
     */
    public function sumberWarisanNotulen(): ?self
    {
        $posisi = $this->posisiNotulen();

        if ($posisi === null || $posisi === 0 || blank($this->outage_plan_id)) {
            return null;
        }

        $sebelumnya = array_slice(self::URUTAN_NOTULEN, 0, $posisi);

        foreach (array_reverse($sebelumnya) as $tipe) {
            $rapat = static::where('outage_plan_id', $this->outage_plan_id)
                ->where('tipe_rapat', $tipe)
                ->has('issues')
                ->first();

            if ($rapat) {
                return $rapat;
            }
        }

        return null;
    }

    protected static function booted(): void
    {
        static::creating(function (DailyMeeting $meeting) {
            if (empty($meeting->token)) {
                $meeting->token = Str::random(32);
            }
        });

        static::created(function (DailyMeeting $meeting) {
            $target = env('FONNTE_TARGET_GROUP');
            if ($target) {
                // Convert date to readable format
                $tanggal = Carbon::parse($meeting->tanggal)->isoFormat('dddd, D MMMM Y');
                $waktuMulai = $meeting->waktu_mulai ? Carbon::parse($meeting->waktu_mulai)->format('H:i') : '09:00';

                $message = "*[NOTIFIKASI RAPAT BARU]*\n\n";
                $message .= "Agenda: {$meeting->judul}\n";
                $message .= "Tanggal: {$tanggal}\n";
                $message .= "Waktu: {$waktuMulai} Wita\n";
                $message .= 'Lokasi: '.($meeting->lokasi ?? 'Online')."\n\n";
                $message .= "*Link Zoom:*\n".($meeting->link_meeting ?? 'Tidak ada link')."\n\n";
                $message .= 'Mohon kehadiran Bapak/Ibu tepat waktu.';

                WhatsAppService::sendMessage($target, $message);
            }
        });
    }

    public function attendees()
    {
        return $this->hasMany(MeetingAttendee::class, 'meeting_id');
    }

    public function minutes()
    {
        return $this->hasOne(MeetingMinute::class, 'meeting_id');
    }

    public function findings()
    {
        return $this->hasMany(MeetingFinding::class, 'meeting_id');
    }

    public function kickoff()
    {
        return $this->hasOne(MeetingKickoff::class, 'meeting_id');
    }

    public function issues()
    {
        return $this->hasMany(MeetingIssue::class);
    }

    public function kickoffPhotos()
    {
        return $this->hasMany(MeetingKickoffPhoto::class, 'meeting_id');
    }

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }
}
