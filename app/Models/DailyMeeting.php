<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DailyMeeting extends Model
{
    protected $guarded = [];

    protected $casts = [
        'tanggal' => 'date',
        'tanggal_realisasi' => 'date',
    ];

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
                $tanggal = \Carbon\Carbon::parse($meeting->tanggal)->isoFormat('dddd, D MMMM Y');
                $waktuMulai = $meeting->waktu_mulai ? \Carbon\Carbon::parse($meeting->waktu_mulai)->format('H:i') : '09:00';
                
                $message = "*[NOTIFIKASI RAPAT BARU]*\n\n";
                $message .= "Agenda: {$meeting->judul}\n";
                $message .= "Tanggal: {$tanggal}\n";
                $message .= "Waktu: {$waktuMulai} Wita\n";
                $message .= "Lokasi: " . ($meeting->lokasi ?? 'Online') . "\n\n";
                $message .= "*Link Zoom:*\n" . ($meeting->link_meeting ?? 'Tidak ada link') . "\n\n";
                $message .= "Mohon kehadiran Bapak/Ibu tepat waktu.";

                \App\Services\WhatsAppService::sendMessage($target, $message);
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
