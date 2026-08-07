<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Support\UploadLimit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // PHP menolak request yang melebihi post_max_size sebelum Laravel sempat
        // memvalidasi, sehingga aturan `max:` tidak pernah jalan dan pengguna
        // hanya melihat halaman error mentah. Kembalikan sebagai galat form biasa.
        $exceptions->render(function (PostTooLargeException $e, Request $request) {
            $pesan = 'Berkas terlalu besar. Ukuran maksimal ' . UploadLimit::label() . ' per berkas.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $pesan], 413);
            }

            return back()->withErrors(['eviden' => $pesan]);
        });
    })->create();
