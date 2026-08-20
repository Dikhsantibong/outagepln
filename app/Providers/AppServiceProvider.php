<?php

namespace App\Providers;

use App\Models\User;
use App\Support\Ttd;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
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
