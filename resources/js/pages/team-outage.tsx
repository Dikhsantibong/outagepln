import { Head } from '@inertiajs/react';
import { User, ShieldCheck, Zap, Award, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TeamMember {
    name: string;
    role: string;
    level: 'asmen' | 'tl' | 'officer' | 'junior';
    description?: string;
    avatar?: string;
}

const teamData: Record<string, TeamMember[]> = {
    asmen: [
        { name: 'Assistant Manager', role: 'Asmen Pemeliharaan', level: 'asmen', description: 'Penanggung jawab utama operasional dan strategi pemeliharaan.' }
    ],
    tl: [
        { name: 'Team Leader 1', role: 'TL Mekanik', level: 'tl', description: 'Mengkoordinasi pekerjaan mekanik di lapangan.' },
        { name: 'Team Leader 2', role: 'TL Listrik & Kontrol', level: 'tl', description: 'Mengkoordinasi sistem kelistrikan dan instrumen.' }
    ],
    officer: [
        { name: 'Officer 1', role: 'Planning Officer', level: 'officer' },
        { name: 'Officer 2', role: 'Safety Officer', level: 'officer' },
        { name: 'Officer 3', role: 'Technical Officer', level: 'officer' }
    ],
    junior: [
        { name: 'Junior Officer 1', role: 'Mechanical Support', level: 'junior' },
        { name: 'Junior Officer 2', role: 'Electrical Support', level: 'junior' },
        { name: 'Junior Officer 3', role: 'Admin Support', level: 'junior' },
        { name: 'Junior Officer 4', role: 'Field Assistant', level: 'junior' }
    ]
};

const LevelBadge = ({ level }: { level: string }) => {
    switch (level) {
        case 'asmen': return <Badge className="bg-primary text-[10px] uppercase tracking-wider">Management</Badge>;
        case 'tl': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] uppercase tracking-wider">Supervisor</Badge>;
        case 'officer': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-wider">Officer</Badge>;
        default: return <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Junior</Badge>;
    }
};

const MemberCard = ({ member }: { member: TeamMember }) => (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-sidebar-border/60">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-5">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 border border-sidebar-border/40 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                        <User className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border border-sidebar-border flex items-center justify-center">
                        {member.level === 'asmen' ? <ShieldCheck className="h-3 w-3 text-primary" /> : 
                         member.level === 'tl' ? <Award className="h-3 w-3 text-amber-500" /> :
                         <Zap className="h-3 w-3 text-blue-500" />}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{member.name}</h4>
                        <LevelBadge level={member.level} />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{member.role}</p>
                </div>
            </div>
            {member.description && (
                <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed italic border-t border-sidebar-border/20 pt-3">
                    "{member.description}"
                </p>
            )}
        </CardContent>
    </Card>
);

export default function TeamOutage() {
    return (
        <>
            <Head title="Team Outage Structure" />
            <div className="flex h-full flex-1 flex-col gap-8 p-6 bg-muted/10">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl font-extrabold tracking-tight">Struktur Organisasi Divisi</h1>
                    <p className="text-muted-foreground mt-2">Pilar utama dalam menjaga kehandalan sistem pembangkit melalui manajemen outage yang terintegrasi.</p>
                </div>

                <div className="space-y-12 pb-12">
                    {/* Level 1: ASMEN */}
                    <section className="relative">
                        <div className="flex flex-col items-center">
                            <div className="w-full max-w-sm">
                                {teamData.asmen.map((m, i) => <MemberCard key={i} member={m} />)}
                            </div>
                            <div className="h-12 w-px bg-gradient-to-b from-primary to-transparent my-2" />
                        </div>
                    </section>

                    {/* Level 2: TL */}
                    <section>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto relative px-4">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-1/2 h-px bg-sidebar-border hidden md:block" />
                            {teamData.tl.map((m, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-sidebar-border hidden md:block" />
                                    <MemberCard member={m} />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center mt-8">
                             <div className="h-8 w-px bg-sidebar-border" />
                        </div>
                    </section>

                    {/* Level 3: Officers */}
                    <section>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 relative">
                            <div className="absolute -top-8 left-1/4 right-1/4 h-px bg-sidebar-border hidden lg:block" />
                            {teamData.officer.map((m, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-sidebar-border hidden lg:block" />
                                    <MemberCard member={m} />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center mt-8">
                             <div className="h-8 w-px bg-sidebar-border" />
                        </div>
                    </section>

                    {/* Level 4: Junior Officers */}
                    <section>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto px-4">
                            {teamData.junior.map((m, i) => <MemberCard key={i} member={m} />)}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

TeamOutage.layout = {
    breadcrumbs: [
        { title: 'Team Outage', href: '/team-outage' }
    ],
};
