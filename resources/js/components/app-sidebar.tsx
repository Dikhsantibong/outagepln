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
    PenLine,
    PieChart,
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

/** Menu rute /daily-meetings — kini ditampilkan sebagai "Rapat Outage". */
const dailyMeetingsNav: NavItem = {
    title: 'Rapat Outage',
    href: '/daily-meetings',
    icon: MessageSquare,
};

const getFooterNavItems = (canAccess: (m: string) => boolean) => [
    ...(canAccess('team-outage') ? [{
        title: 'Team Outage',
        href: '/team-outage',
        icon: Users,
    }] : []),
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { auth } = usePage<any>().props;

    const canAccess = (menuKey: string) => {
        if (auth?.is_super_admin) return true;
        if (!auth?.menu_access) return true; // null means allow by default
        return auth.menu_access.includes(menuKey);
    };

    // Rapat dikoordinasi terpusat, jadi menunya tidak untuk pengelola.
    const pelaksanaan: NavItem[] = [
        ...(canAccess('outage-plans') ? [{
            title: 'Perencanaan dan Jadwal',
            href: '/outage-plans',
            icon: Calendar,
        }] : []),
        ...((auth?.can?.viewMeetings ?? true) && canAccess('rapat-outage') ? [dailyMeetingsNav] : []),
        ...((auth?.can?.viewMeetings ?? true) && canAccess('daily-meeting') ? [{
            title: 'Daily Meeting',
            href: '/daily-briefings',
            icon: CalendarDays,
        }] : []),
    ];

    // Kelompok datar menggantikan dropdown: seluruh menu langsung terlihat.
    const groups: NavGroup[] = [
        ...(canAccess('dashboard') ? [{
            label: 'Monitoring',
            items: [
                { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
                { title: 'Summary', href: '/summary', icon: PieChart },
            ],
        }] : []),
        ...(pelaksanaan.length > 0 ? [{
            label: 'Perencanaan & Pelaksanaan',
            items: pelaksanaan,
        }] : []),
        {
            label: 'Kinerja Outage',
            items: [
                ...(canAccess('kinerja.on-quality') ? [{ title: 'On Quality', href: '/kinerja/on-quality', icon: ShieldCheck }] : []),
                ...(canAccess('kinerja.on-time') ? [{ title: 'On Time', href: '/kinerja/on-time', icon: Clock }] : []),
                ...(canAccess('kinerja.on-cost') ? [{ title: 'On Cost', href: '/kinerja/on-cost', icon: DollarSign }] : []),
                ...(canAccess('kinerja.on-scope') ? [{ title: 'On Scope', href: '/kinerja/on-scope', icon: Crosshair }] : []),
                ...(canAccess('kinerja.on-safety') ? [{ title: 'On Safety', href: '/kinerja/on-safety', icon: HeartPulse }] : []),
            ],
        },
        ...(auth?.is_super_admin ? [{
            label: 'Data Master',
            items: [
                { title: 'Users & Hak Akses', href: '/master/users', icon: Users },
                { title: 'Data Unit & Mesin', href: '/master/units', icon: LayoutGrid },
                { title: 'Data Material', href: '/master/materials', icon: Crosshair },
                { title: 'Tanda Tangan', href: '/master/ttd', icon: PenLine },
            ],
        }] : []),
    ].filter(g => g.items.length > 0);

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
                <NavFooter items={getFooterNavItems(canAccess)} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
