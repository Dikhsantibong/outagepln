import { createInertiaApp, router } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Tangkap respons non-Inertia (419 / 401) yang menandakan sesi habis.
// Ini jaring pengaman di sisi klien — biasanya backend sudah redirect
// ke /login?expired=1, tapi jika Inertia menerima respons mentah yang
// bukan halaman Inertia, listener ini yang mengambil alih.
router.on('httpException', (event) => {
    const status = event.detail?.response?.status;

    if (status === 419 || status === 401) {
        event.preventDefault();
        window.location.href = '/login?expired=1';
    }
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'attend':
            case name === 'daily-meetings/attend':
            case name === 'daily-meetings/qr-display':
            case name === 'daily-meetings/qr':
            case name === 'daily-briefings/attend':
            case name === 'daily-briefings/qr':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
