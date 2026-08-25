<?php

namespace App\Models;

use App\Support\JadwalRapatOutage;
use Carbon\CarbonImmutable;
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
        'unit',
        'sistem',
        'real_start',
        'real_stop',
        'ket_realisasi',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
    ];

    /**
     * Status penyelesaian pekerjaan.
     *
     * Dulu kolom teks bebas, tapi seluruh datanya memang hanya OPEN atau CLOSE.
     * Dijadikan daftar tertutup supaya filter dan hitungan status tidak meleset
     * gara-gara variasi ejaan.
     */
    public const KET_OPTIONS = ['OPEN', 'CLOSE'];

    /**
     * Kolom yang membentuk satu versi rencana; sekali salah satunya berubah,
     * versinya dicatat utuh ke riwayat.
     */
    public const KOLOM_JADWAL = [
        'start_date', 'selesai', 'rapat_r2', 'rapat_r3', 'rapat_p1', 'rapat_p2', 'rapat_p3',
    ];

    /**
     * Batas jumlah revisi rencana: RENC lalu REV 1 sampai REV 3.
     *
     * Rencana yang sudah tiga kali digeser dianggap perlu ditinjau ulang, bukan
     * direvisi lagi diam-diam.
     */
    public const MAKS_REVISI = 3;

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

    /**
     * Derives the plant (unit) a machine belongs to from its name.
     *
     * The plant is everything before the machine number, e.g.
     * "PLTD POASIA #01 (MIRRLEES)" -> PLTD POASIA. Anything after the number is
     * dropped, which also throws away brand and former-location notes
     * ("PLTD RAHA #15 (Mitsubishi) EX PLTD BAU-BAU #21" -> PLTD RAHA) so a
     * relocated machine is attributed to where it runs now, not where it came
     * from. Spacing around hyphens is normalised because the same plant is
     * spelled both "PLTD WUA-WUA" and "PLTD WUA- WUA" in the source sheet.
     */
    public static function extractUnit(?string $nama): ?string
    {
        $nama = trim((string) $nama);

        if ($nama === '') {
            return null;
        }

        // Cut at the machine number; when there is none, drop the brackets.
        $unit = preg_split('/#/', $nama)[0];
        $unit = preg_replace('/\([^)]*\)/', '', $unit);

        $unit = strtoupper(trim($unit));
        $unit = preg_replace('/\s*-\s*/', '-', $unit);
        $unit = preg_replace('/\s+/', ' ', $unit);

        return $unit === '' ? null : $unit;
    }

    /** The accounts that manage this machine — one brand may span several plants. */
    public function pengelolas()
    {
        return $this->hasMany(User::class, 'merek', 'merek');
    }

    /**
     * Limits a listing to what the given user manages. Admin and tamu (read-only
     * observer) are tied to neither a brand nor a plant and keep seeing
     * everything, so existing dashboards and reports are unaffected.
     *
     * The two filters stack: a pengelola holding only a brand manages it at
     * every plant, while one that also holds a plant — MIRRLEES at PLTD POASIA —
     * sees just that plant's machines of that brand.
     */
    public function scopeVisibleTo($query, $user)
    {
        if (! $user) {
            return $query;
        }

        if (filled($user->merek)) {
            $query->where('merek', $user->merek);
        }

        if (filled($user->unit)) {
            $query->where('unit', $user->unit);
        }

        return $query;
    }

    public function dailyMeetings()
    {
        return $this->hasMany(DailyMeeting::class);
    }

    /**
     * Pekerjaan yang sedang berjalan di lapangan.
     *
     * Yang menandai sebuah pekerjaan benar-benar berjalan adalah adanya laporan
     * progres harian — bukan sekadar kolom `progress` yang terisi. Rencana hasil
     * impor membawa angka progres dari lembar sumber tanpa satu pun baris
     * harian; pekerjaan seperti itu belum dikerjakan dan tidak boleh ikut
     * terhitung berjalan.
     *
     * Pekerjaan yang progresnya sudah penuh dianggap selesai dan keluar dari
     * daftar ini.
     */
    public function scopeSedangBerjalan($query)
    {
        return $query
            ->where(fn ($q) => $q->whereNull('progress')->orWhere('progress', '<', 100))
            ->whereHas('dailyProgresses', fn ($q) => $q->whereNotNull('actual_progress'));
    }

    /**
     * Tanggal tiap hari pelaksanaan outage, hari ke-1 sampai hari terakhir.
     *
     * Titik mulanya Real Start — tanggal pekerjaan benar-benar dimulai — dan
     * jatuh kembali ke rencana start selama Real Start belum diisi. Banyaknya
     * hari diambil dari kolom durasi; bila durasi kosong, rentang rencana
     * start sampai rencana selesai yang dipakai.
     *
     * Aturan ini sengaja sama persis dengan pembentukan baris progres harian di
     * halaman Ubah Data Pekerjaan, sehingga hari rapat dan hari progres selalu
     * jatuh pada tanggal yang sama.
     *
     * @return array<int, string> daftar tanggal Y-m-d, terurut
     */
    public function tanggalHarianOutage(): array
    {
        $awal = $this->real_start ?: $this->start_date;

        if (blank($awal)) {
            return [];
        }

        $jumlah = (int) $this->durasi;

        if ($jumlah <= 0) {
            $jumlah = blank($this->selesai)
                ? 0
                : self::hitungDurasi((string) $this->start_date, (string) $this->selesai) ?? 0;
        }

        if ($jumlah <= 0) {
            return [];
        }

        $mulai = CarbonImmutable::parse($awal)->startOfDay();

        return array_map(
            fn (int $i) => $mulai->addDays($i)->toDateString(),
            range(0, $jumlah - 1),
        );
    }

    /**
     * Baris harian terakhir yang realisasinya sudah diisi.
     *
     * Titik inilah yang dipakai membandingkan rencana dengan realisasi: hari
     * setelahnya belum dilaporkan, jadi membandingkannya hanya akan terbaca
     * sebagai tertinggal padahal waktunya memang belum tiba.
     */
    public function progresHarianTerakhir(): ?OutagePlanProgress
    {
        return $this->dailyProgresses->last(
            fn (OutagePlanProgress $dp) => $dp->actual_progress !== null,
        );
    }

    /** Riwayat revisi rencana, urut dari rencana awal ke revisi terbaru. */
    public function revisions()
    {
        return $this->hasMany(OutagePlanRevision::class)->orderBy('urutan');
    }

    /**
     * Berapa kali rencana sudah direvisi.
     *
     * Urutan 0 adalah rencana awal (RENC), bukan revisi, jadi tidak ikut dihitung.
     */
    public function jumlahRevisi(): int
    {
        return $this->revisions()->where('urutan', '>', 0)->count();
    }

    public function sisaRevisi(): int
    {
        return max(0, self::MAKS_REVISI - $this->jumlahRevisi());
    }

    public function sudahMencapaiBatasRevisi(): bool
    {
        return $this->sisaRevisi() === 0;
    }

    /**
     * Apakah nilai yang masuk benar-benar menggeser jadwal yang berlaku?
     *
     * Hanya kunci yang ada di payload yang dibandingkan, sehingga penyimpanan
     * yang tidak menyentuh jadwal tidak dianggap sebagai revisi. Tanggal
     * dipotong ke bagian YYYY-MM-DD supaya beda format tidak terbaca sebagai
     * perubahan.
     *
     * @param  array<string, mixed>  $nilai
     */
    public function jadwalBerubah(array $nilai): bool
    {
        $samakan = fn ($v) => substr((string) $v, 0, 10);

        foreach (self::KOLOM_JADWAL as $kolom) {
            if (! array_key_exists($kolom, $nilai)) {
                continue;
            }

            if ($samakan($nilai[$kolom]) !== $samakan($this->{$kolom})) {
                return true;
            }
        }

        return false;
    }

    /**
     * Simpan rencana baru sebagai revisi berikutnya, lalu terapkan.
     *
     * Rencana yang sedang berlaku dicatat lebih dulu sebagai RENC bila riwayatnya
     * masih kosong, supaya revisi pertama tetap punya pembanding. Tanggal kelima
     * rapat tidak diminta dari pemanggil melainkan dihitung dari rencana start —
     * lihat [JadwalRapatOutage]. Memperbarui kolom rapat_* di sini otomatis
     * menyinkronkan DailyMeeting lewat hook `updated` di bawah.
     */
    public function catatRevisi(
        string $startDate,
        ?string $selesai = null,
        ?string $catatan = null,
        ?int $userId = null,
    ): OutagePlanRevision {
        $this->pastikanRencanaAwalTercatat();

        $this->update([
            'start_date' => $startDate,
            'selesai' => $selesai,
            'durasi' => self::hitungDurasi($startDate, $selesai),
            ...JadwalRapatOutage::dariStart($startDate),
        ]);

        return $this->catatVersiBerjalan($catatan, $userId);
    }

    /**
     * Abadikan rencana yang sedang berlaku sebagai versi awal (RENC).
     *
     * Tidak melakukan apa pun bila riwayatnya sudah ada. Panggil sebelum
     * rencananya diubah, supaya yang terekam benar-benar kondisi sebelumnya.
     */
    public function pastikanRencanaAwalTercatat(): void
    {
        if ($this->revisions()->exists()) {
            return;
        }

        $this->revisions()->create([
            'urutan' => 0,
            'catatan' => 'Rencana awal',
            ...$this->only(self::KOLOM_JADWAL),
        ]);
    }

    /**
     * Catat kondisi rencana saat ini sebagai versi berikutnya.
     *
     * Dipakai halaman Ubah Data Pekerjaan, yang menyimpan tanggalnya lebih dulu
     * lalu merekam hasilnya — berbeda dengan [catatRevisi()] yang menghitung
     * jadwal rapatnya sendiri dari rencana start.
     */
    public function catatVersiBerjalan(?string $catatan = null, ?int $userId = null): OutagePlanRevision
    {
        return $this->revisions()->create([
            'urutan' => (int) $this->revisions()->max('urutan') + 1,
            'catatan' => $catatan,
            'user_id' => $userId,
            ...$this->only(self::KOLOM_JADWAL),
        ]);
    }

    /** Lama pekerjaan dalam hari, menghitung hari start dan finish. */
    private static function hitungDurasi(string $startDate, ?string $selesai): ?int
    {
        if (blank($selesai)) {
            return null;
        }

        return CarbonImmutable::parse($startDate)->startOfDay()
            ->diffInDays(CarbonImmutable::parse($selesai)->startOfDay()) + 1;
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

            if ($plan->isDirty('mesin_pembangkit') || blank($plan->unit)) {
                $plan->unit = self::extractUnit($plan->mesin_pembangkit);
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
                            'judul' => strtoupper(str_replace('_', ' ', $jenis)).' - '.($plan->mesin_pembangkit ?? 'Unit'),
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
