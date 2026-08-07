import { Search, Bell, Clock, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [time, setTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setTime(new Date()), 1000);

        return () => clearInterval(timer);
    }, []);

    const formattedTime = mounted ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';
    const formattedDate = mounted ? time.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) : '---';

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-6">
                {/* Search Bar */}
                <div className="relative hidden lg:block w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                        placeholder="Search monitoring data..." 
                        className="h-9 w-full bg-muted/50 pl-10 focus-visible:ring-primary/20"
                    />
                </div>

                {/* Clock & Status */}
                <div className="hidden items-center gap-4 border-l border-sidebar-border/50 pl-6 md:flex">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {formattedTime}
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {formattedDate}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        SYSTEM ONLINE
                    </div>
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                        <ShieldCheck className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
