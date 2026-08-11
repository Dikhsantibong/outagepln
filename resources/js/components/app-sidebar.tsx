import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Clock,
    Crosshair,
    DollarSign,
    HeartPulse,
    LayoutGrid,
    MessageSquare,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import type { NavGroup } from '@/components/nav-main';
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

/** Rapat Outage — dulu bernama "Daily Meeting"; rutenya tetap /daily-meetings. */
const rapatOutageNav: NavItem = {
    title: 'Rapat Outage',
    href: '/daily-meetings',
    icon: MessageSquare,
};

const footerNavItems: NavItem[] = [
    {
        title: 'Team Outage',
        href: '/team-outage',
        icon: Users,
    },
];

export function AppSidebar() {
    const { auth } = usePage<any>().props;

    // Rapat dikoordinasi terpusat, jadi menunya tidak untuk pengelola.
    const pelaksanaan: NavItem[] = [
        {
            title: 'Perencanaan dan Jadwal Outage',
            href: '/outage-plans',
            icon: Calendar,
        },
        ...((auth?.can?.viewMeetings ?? true) ? [rapatOutageNav] : []),
        {
            title: 'Daily Meeting',
            href: '/daily-meeting',
            icon: CalendarDays,
        },
    ];

    // Kelompok datar menggantikan dropdown: seluruh menu langsung terlihat.
    const groups: NavGroup[] = [
        {
            label: 'Monitoring',
            items: [{ title: 'Dashboard', href: dashboard(), icon: LayoutGrid }],
        },
        {
            label: 'Perencanaan & Pelaksanaan',
            items: pelaksanaan,
        },
        {
            label: 'Kinerja Outage',
            items: [
                { title: 'On Quality', href: '/kinerja/on-quality', icon: ShieldCheck },
                { title: 'On Time', href: '/kinerja/on-time', icon: Clock },
                { title: 'On Cost', href: '/kinerja/on-cost', icon: DollarSign },
                { title: 'On Scope', href: '/kinerja/on-scope', icon: Crosshair },
                { title: 'On Safety', href: '/kinerja/on-safety', icon: HeartPulse },
            ],
        },
    ];

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

            <SidebarContent className="gap-4">
                <div className="px-4 pt-6 group-data-[collapsible=icon]:hidden">
                    <h2 className="text-xs font-bold tracking-[0.2em] text-primary/70 uppercase">
                        Application
                    </h2>
                    <p className="mt-1 text-lg font-extrabold tracking-tight text-sidebar-foreground">
                        Outage Monitoring
                    </p>
                </div>
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
