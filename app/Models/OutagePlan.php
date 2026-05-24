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
    ];

    public function dailyMeetings()
    {
        return $this->hasMany(DailyMeeting::class);
    }

    protected static function booted(): void
    {
        $syncMeetings = function (OutagePlan $plan) {
            $jenisRapat = ['rapat_r2', 'rapat_r3', 'rapat_p1', 'rapat_p2', 'rapat_p3'];
            $defaultLink = 'https://zoom.us/j/static123456789'; // Default static link

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

        static::deleted(function (OutagePlan $plan) {
            $plan->dailyMeetings()->delete();
        });
    }
}
