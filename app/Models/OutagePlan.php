<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OutagePlan extends Model
{
    protected $fillable = [
        'mesin_pembangkit',
        'scope',
        'jenis_pembangkit',
        'durasi',
        'start_date',
        'selesai',
        'progress',
        'rapat_r2',
        'rapat_r3',
        'rapat_p1',
        'rapat_p2',
        'rapat_p3',
        'ket',
        'merek',
        'sistem',
        'real_start',
        'real_stop',
        'ket_realisasi',
    ];

    /**
     * Spelling variants found in the source sheet, folded onto one brand so a
     * machine is never split across two managing accounts.
     */
    private const MEREK_ALIAS = [
        'MIRRLESS' => 'MIRRLEES',
        'CUMMINS QSK' => 'CUMMINS',
        'DEUTZ BV' => 'DEUTZ',
    ];

    /**
     * Derives the engine brand from a machine name.
     *
     * The brand is the first parenthesised group, e.g.
     * "PLTD POASIA #02 (MIRRLEES)" -> MIRRLEES. Groups starting with "EX" are
     * former-location notes, not brands ("PLTD WANGI-WANGI #08 (MITSUBISHI)
     * (EX-PLTD GI TELLO)"), so they are skipped. Machines with no brand at all
     * ("PLTM WINNING #02") fall back to their plant type, so PLTM/PLTD/PLTG each
     * get one managing account too.
     */
    public static function extractMerek(?string $nama): ?string
    {
        $nama = trim((string) $nama);

        if ($nama === '') {
            return null;
        }

        if (preg_match_all('/\(([^)]+)\)/', $nama, $m)) {
            foreach ($m[1] as $group) {
                $g = strtoupper(trim($group));

                if (str_starts_with($g, 'EX')) {
                    continue;
                }

                return self::MEREK_ALIAS[$g] ?? $g;
            }
        }

        // No brand in the name: group by plant type instead.
        if (preg_match('/^(PLT[A-Z]*)/i', $nama, $p)) {
            return strtoupper($p[1]);
        }

        return null;
    }

    /** The account that manages this machine's brand. */
    public function pengelola()
    {
        return $this->belongsTo(User::class, 'merek', 'merek');
    }

    /**
     * Limits a listing to what the given user manages. Admin and tamu (read-only
     * observer) are not tied to a brand and keep seeing everything, so existing
     * dashboards and reports are unaffected.
     */
    public function scopeVisibleTo($query, $user)
    {
        if (! $user || blank($user->merek)) {
            return $query;
        }

        return $query->where('merek', $user->merek);
    }

    public function dailyMeetings()
    {
        return $this->hasMany(DailyMeeting::class);
    }

    public function dailyProgresses()
    {
        return $this->hasMany(OutagePlanProgress::class)->orderBy('tanggal');
    }

    public function kinerjaQuality()
    {
        return $this->hasOne(KinerjaQuality::class);
    }

    public function kinerjaTime()
    {
        return $this->hasOne(KinerjaTime::class);
    }

    public function kinerjaCost()
    {
        return $this->hasOne(KinerjaCost::class);
    }

    protected static function booted(): void
    {
        // Keep the brand in sync with the machine name on every write, so plans
        // created through the UI or an import are always attributable.
        static::saving(function (OutagePlan $plan) {
            if ($plan->isDirty('mesin_pembangkit') || blank($plan->merek)) {
                $plan->merek = self::extractMerek($plan->mesin_pembangkit);
            }
        });

        $syncMeetings = function (OutagePlan $plan) {
            $jenisRapat = ['rapat_r2', 'rapat_r3', 'rapat_p1', 'rapat_p2', 'rapat_p3'];
            $defaultLink = 'https://us06web.zoom.us/j/3581038593?pwd=7kztGUbcQepuqwTsgfXr72CkIptiI3.1&omn=82322217212'; // Default static link

            foreach ($jenisRapat as $jenis) {
                if ($plan->$jenis) {
                    // Update or Create meeting for this type
                    DailyMeeting::updateOrCreate(
                        [
                            'outage_plan_id' => $plan->id,
                            'tipe_rapat' => strtoupper(str_replace('_', ' ', $jenis)),
                        ],
                        [
                            'judul' => strtoupper(str_replace('_', ' ', $jenis)) . ' - ' . ($plan->mesin_pembangkit ?? 'Unit'),
                            'tanggal' => $plan->$jenis,
                            'waktu_mulai' => '09:00', // Default time
                            'lokasi' => 'Online',
                            'link_meeting' => $defaultLink,
                            'status' => 'active',
                        ]
                    );
                } else {
                    // If date is removed, delete the associated meeting
                    DailyMeeting::where('outage_plan_id', $plan->id)
                        ->where('tipe_rapat', strtoupper(str_replace('_', ' ', $jenis)))
                        ->delete();
                }
            }
        };

        static::created($syncMeetings);
        static::updated($syncMeetings);

        // Must run on `deleting`, not `deleted`: the daily_meetings foreign key
        // is nullOnDelete, so by the time `deleted` fires the database has
        // already cleared outage_plan_id and the relation returns nothing,
        // leaving the meetings orphaned instead of removed.
        static::deleting(function (OutagePlan $plan) {
            $plan->dailyMeetings()->delete();
        });
    }
}
