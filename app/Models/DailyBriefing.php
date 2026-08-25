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

    /** Apakah hari ini sudah punya isi — daftar hadir, temuan, atau notulen? */
    public function adaIsi(): bool
    {
        return $this->attendees()->exists()
            || $this->findings()->exists()
            || $this->issues()->exists()
            || $this->kickoff()->exists();
    }

    /**
     * Seluruh hari dalam satu rangkaian, terurut hari.
     *
     * Rangkaian yang terbentuk otomatis dikenali dari rencana outage-nya, bukan
     * dari `parent_id`. Kolom itu bersifat nullOnDelete, jadi begitu hari
     * pertama terhapus seluruh hari sisanya kehilangan induk dan — bila
     * dijadikan penanda rangkaian — tiap hari akan berdiri sendiri, membuat satu
     * mesin tampil berulang di daftar.
     *
     * Rapat lama yang dibuat manual belum terikat rencana, jadi untuk itu
     * `parent_id` tetap dipakai.
     *
     * Nomor hari jadi acuan urutan: rapat yang dilewat tetap memegang nomornya,
     * sehingga urutannya tidak bergeser.
     */
    public function seriesDays()
    {
        $query = static::query();

        if (filled($this->outage_plan_id)) {
            $query->where('outage_plan_id', $this->outage_plan_id);
        } else {
            $head = $this->seriesHeadId();
            $query->where(fn ($q) => $q->where('id', $head)->orWhere('parent_id', $head));
        }

        return $query
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
