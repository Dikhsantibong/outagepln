<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMenuAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Super admin always has full access
        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        // Determine the requested menu based on route name
        $routeName = $request->route() ? $request->route()->getName() : '';
        $menu = null;

        if (str_starts_with($routeName, 'dashboard')) {
            $menu = 'dashboard';
        } elseif (str_starts_with($routeName, 'outage-plans')) {
            $menu = 'outage-plans';
        } elseif (str_starts_with($routeName, 'daily-meeting')) {
            $menu = 'rapat-outage';
        } elseif (str_starts_with($routeName, 'kinerja.on-quality')) {
            $menu = 'kinerja.on-quality';
        } elseif (str_starts_with($routeName, 'kinerja.on-time')) {
            $menu = 'kinerja.on-time';
        } elseif (str_starts_with($routeName, 'kinerja.on-cost')) {
            $menu = 'kinerja.on-cost';
        } elseif (str_starts_with($routeName, 'kinerja.on-scope')) {
            $menu = 'kinerja.on-scope';
        } elseif (str_starts_with($routeName, 'kinerja.on-safety')) {
            $menu = 'kinerja.on-safety';
        } elseif (str_starts_with($routeName, 'team-outage')) {
            $menu = 'team-outage';
        }

        // If it's a known menu and the user's menu_access is explicitly set as an array
        if ($menu && is_array($user->menu_access)) {
            if (!in_array($menu, $user->menu_access)) {
                // Deny access if they don't have the menu in their allowed array
                abort(403, 'Anda tidak memiliki hak akses ke menu ini.');
            }
        }

        return $next($request);
    }
}
