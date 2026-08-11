import { Head } from '@inertiajs/react';
import { CalendarDays, Construction } from 'lucide-react';

/**
 * Menu Daily Meeting yang baru.
 *
 * Berbeda dari Rapat Outage (/daily-meetings) yang sudah berjalan — menu ini
 * masih kosong dan hanya menandai tempatnya. Gayanya mengikuti halaman On Scope
 * dan On Safety supaya semua fitur yang belum jadi terlihat seragam.
 */
export default function DailyMeeting() {
    return (
        <>
            <Head title="Daily Meeting" />
            <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CalendarDays className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Daily Meeting</h2>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Construction className="h-4 w-4" />
                        <span className="text-sm font-medium">Dalam Pengembangan</span>
                    </div>
                </div>
            </div>
        </>
    );
}

DailyMeeting.layout = {
    breadcrumbs: [{ title: 'Daily Meeting', href: '/daily-meeting' }],
};
