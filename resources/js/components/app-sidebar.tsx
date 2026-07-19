import { Link } from '@inertiajs/react';
import { LayoutGrid, Calendar, Users, MessageSquare, ReceiptText, Activity } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Perencanaan dan Jadwal Outage',
        href: '/outage-plans',
        icon: Calendar,
    },
    {
        title: 'Daily Meeting',
        href: '/daily-meetings',
        icon: MessageSquare,
    },
    {
        title: 'Kinerja Outage',
        href: '#',
        icon: Activity,
        items: [
            { title: 'On Quality', href: '/kinerja/on-quality' },
            { title: 'On Time', href: '/kinerja/on-time' },
            { title: 'On Cost', href: '/kinerja/on-cost' },
            { title: 'On Scope', href: '/kinerja/on-scope' },
            { title: 'On Safety', href: '/kinerja/on-safety' },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Team Outage',
        href: '/team-outage',
        icon: Users,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <div className="px-4 py-6 group-data-[collapsible=icon]:hidden">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
                        Application
                    </h2>
                    <p className="mt-1 text-lg font-extrabold tracking-tight text-sidebar-foreground">
                        Outage Monitoring
                    </p>
                </div>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
