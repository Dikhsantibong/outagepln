<?php

namespace App\Providers;

use App\Models\DailyBriefing;
use App\Models\DailyBriefingAttendee;
use App\Models\DailyBriefingFinding;
use App\Models\DailyBriefingIssue;
use App\Models\DailyBriefingKickoff;
use App\Models\DailyBriefingKickoffPhoto;
use App\Models\DailyMeeting;
use App\Models\KinerjaCost;
use App\Models\KinerjaQuality;
use App\Models\KinerjaTime;
use App\Models\Material;
use App\Models\MeetingAttendee;
use App\Models\MeetingFinding;
use App\Models\MeetingIssue;
use App\Models\MeetingKickoff;
use App\Models\MeetingKickoffPhoto;
use App\Models\MeetingMinute;
use App\Models\Mesin;
use App\Models\OutagePlan;
use App\Models\OutagePlanProgress;
use App\Models\OutagePlanRevision;
use App\Models\Unit;
use App\Models\User;
use App\Observers\ActivityLogger;
use App\Support\Ttd;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->pasangJejakAktivitas();
    }

    /**
     * Model yang aktivitas tambah/ubah/hapusnya direkam ke menu Aktivitas.
     *
     * Didaftarkan di sini, bukan disebar ke tiap controller, supaya perekaman
     * ikut berjalan dari jalur mana pun — form, impor, maupun perintah artisan
     * — tanpa satu pun kode yang sudah ada perlu disentuh.
     *
     * @var array<int, class-string<Model>>
     */
    private const MODEL_DIREKAM = [
        OutagePlan::class,
        OutagePlanProgress::class,
        OutagePlanRevision::class,
        DailyMeeting::class,
        MeetingAttendee::class,
        MeetingIssue::class,
        MeetingFinding::class,
        MeetingKickoff::class,
        MeetingKickoffPhoto::class,
        MeetingMinute::class,
        DailyBriefing::class,
        DailyBriefingAttendee::class,
        DailyBriefingIssue::class,
        DailyBriefingFinding::class,
        DailyBriefingKickoff::class,
        DailyBriefingKickoffPhoto::class,
        KinerjaQuality::class,
        KinerjaTime::class,
        KinerjaCost::class,
        User::class,
        Unit::class,
        Mesin::class,
        Material::class,
    ];

    protected function pasangJejakAktivitas(): void
    {
        foreach (self::MODEL_DIREKAM as $model) {
            $model::observe(ActivityLogger::class);
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        // Nama bulan dan hari ditulis dalam bahasa Indonesia di seluruh
        // aplikasi: laporan cetak, notulen, dan halaman publik. Sebelumnya
        // translatedFormat() mengikuti APP_LOCALE=en sehingga menghasilkan
        // "9 AUGUST 2026". Locale aplikasi sendiri tidak diubah, supaya pesan
        // validasi bawaan Laravel tidak kehilangan terjemahannya.
        Carbon::setLocale('id');
        CarbonImmutable::setLocale('id');

        Gate::define('viewMeetings', function (User $user) {
            return $user->canViewMeetings();
        });

        // Data penandatangan global dibagikan ke seluruh blade notulen/ekspor,
        // supaya nama & jabatannya cukup diatur sekali di modul Data Master.
        View::composer([
            'exports.daily-briefing',
            'exports.daily-briefing-excel',
            'exports.briefing-kickoff',
            'exports.briefing-kickoff-excel',
            'exports.meeting-issues',
            'exports.meeting-issues-excel',
            'exports.meeting-kickoff',
            'exports.meeting-kickoff-excel',
        ], function ($view) {
            $view->with('penandatangan', Ttd::data());
        });

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
