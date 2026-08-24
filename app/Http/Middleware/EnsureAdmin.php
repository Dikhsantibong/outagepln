<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Menu yang boleh dibuka admin sekaligus super admin.
 *
 * Berbeda dengan [EnsureSuperAdmin] yang hanya melewatkan super admin,
 * pemeriksaan di sini memakai [User::isAdmin()] sehingga keduanya lolos.
 */
class EnsureAdmin
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Akses ditolak. Hanya Admin dan Super Admin yang diizinkan.');
        }

        return $next($request);
    }
}
