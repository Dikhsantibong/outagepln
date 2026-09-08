<?php

use App\Http\Middleware\CheckMenuAccess;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Support\UploadLimit;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

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
            CheckMenuAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // PHP menolak request yang melebihi post_max_size sebelum Laravel sempat
        // memvalidasi, sehingga aturan `max:` tidak pernah jalan dan pengguna
        // hanya melihat halaman error mentah. Kembalikan sebagai galat form biasa.
        $exceptions->render(function (PostTooLargeException $e, Request $request) {
            $pesan = 'Berkas terlalu besar. Ukuran maksimal '.UploadLimit::label().' per berkas.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $pesan], 413);
            }

            return back()->withErrors(['eviden' => $pesan]);
        });

        // Sesi habis — arahkan ke halaman login dengan penanda query string.
        // Flash session tidak bisa dipakai di sini karena sesinya sudah mati,
        // jadi pesan ditampilkan lewat query parameter `?expired=1`.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Sesi telah berakhir. Silakan login ulang.'], 401);
            }

            return redirect()->guest('/login?expired=1');
        });

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            // CSRF token kedaluwarsa (419) — sesi sudah habis, redirect ke login.
            if ($response->getStatusCode() === 419) {
                if ($request->expectsJson()) {
                    return response()->json(['message' => 'Sesi telah berakhir. Silakan login ulang.'], 419);
                }

                return redirect('/login?expired=1');
            }

            if (! app()->environment(['local', 'testing']) || in_array($response->getStatusCode(), [404, 403, 503])) {
                if (in_array($response->getStatusCode(), [500, 503, 404, 403])) {
                    return Inertia::render('error', ['status' => $response->getStatusCode()])
                        ->toResponse($request)
                        ->setStatusCode($response->getStatusCode());
                }
            }

            return $response;
        });
    })->create();
