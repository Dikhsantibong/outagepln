<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DailyBriefing extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'tanggal_terbit' => 'date',
        ];
    }

    /** Hari pertama (kepala) dari rangkaian rapat multi-hari. */
    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** Hari-hari lanjutan yang menunjuk ke rapat ini sebagai kepala rangkaian. */
    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /** Id kepala rangkaian: dirinya sendiri bila hari pertama. */
    public function seriesHeadId(): int
    {
        return $this->parent_id ?? $this->id;
    }

    /** Pekerjaan outage yang rapat ini dibentuk untuknya. */
    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }

    /**
     * Seluruh hari dalam satu rangkaian (kepala + lanjutan), terurut hari.
     *
     * Nomor hari yang jadi acuan utama, bukan tanggal: rapat yang dilewat tetap
     * memegang nomornya sendiri, jadi urutannya tidak bergeser. Rapat lama yang
     * dibuat manual belum bernomor, dan untuk itu tanggal yang dipakai.
     */
    public function seriesDays()
    {
        $head = $this->seriesHeadId();

        return static::query()
            ->where(fn ($q) => $q->where('id', $head)->orWhere('parent_id', $head))
            ->orderByRaw('hari_ke IS NULL')
            ->orderBy('hari_ke')
            ->orderBy('tanggal')
            ->orderBy('id');
    }

    public function attendees()
    {
        return $this->hasMany(DailyBriefingAttendee::class);
    }

    public function issues()
    {
        return $this->hasMany(DailyBriefingIssue::class);
    }

    public function findings()
    {
        return $this->hasMany(DailyBriefingFinding::class);
    }

    public function kickoff()
    {
        return $this->hasOne(DailyBriefingKickoff::class);
    }

    public function kickoffPhotos()
    {
        return $this->hasMany(DailyBriefingKickoffPhoto::class);
    }

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->token)) {
                $model->token = Str::random(64);
            }
        });
    }
}
