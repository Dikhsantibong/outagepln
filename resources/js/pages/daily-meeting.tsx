import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

export default function DailyMeeting() {
    return (
        <>
            <Head title="Daily Meeting" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h1 className="text-2xl font-bold text-muted-foreground">Daily Meeting Page (Coming Soon)</h1>
                    </div>
                </div>
            </div>
        </>
    );
}

DailyMeeting.layout = {
    breadcrumbs: [
        {
            title: 'Daily Meeting',
            href: '/daily-meeting',
        },
    ],
};
