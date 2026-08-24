<?php

namespace App\Http\Middleware;

use App\Support\UploadLimit;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'appUrl' => rtrim(config('app.url'), '/'),
            'auth' => [
                'user' => $request->user(),
                // Izin dikirim sebagai boolean, bukan dibiarkan UI menebak dari
                // string role. Kalau aturannya berubah, cukup satu tempat yang
                // disesuaikan dan seluruh halaman ikut benar.
                'can' => [
                    'delete' => (bool) $request->user()?->canDeleteRecords(),
                    'write' => (bool) $request->user()?->canWrite(),
                    'viewMeetings' => (bool) $request->user()?->canViewMeetings(),
                ],
                'menu_access' => $request->user()?->menu_access,
                'is_super_admin' => (bool) $request->user()?->isSuperAdmin(),
                // Admin dan super admin sama-sama true; dipakai menu yang
                // terbuka untuk keduanya, seperti Arsip Dokumen.
                'is_admin' => (bool) $request->user()?->isAdmin(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            // Dibagikan ke semua halaman supaya form unggah bisa menolak berkas
            // kebesaran di browser, sebelum PHP menggagalkan seluruh request.
            'uploadLimit' => [
                'bytes' => UploadLimit::bytes(),
                'label' => UploadLimit::label(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
