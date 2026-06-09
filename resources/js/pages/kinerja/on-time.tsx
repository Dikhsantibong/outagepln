import { Head } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Construction } from 'lucide-react';

export default function OnTime() {
    return (
        <AppSidebarLayout breadcrumbs={[
            { title: 'Kinerja Outage', href: '#' },
            { title: 'On Time', href: '/kinerja/on-time' },
        ]}>
            <Head title="Kinerja - On Time" />
            <div className="flex flex-1 flex-col items-center justify-center p-8 min-h-[70vh]">
                <Card className="w-full max-w-lg border-dashed border-2 border-primary/20 bg-primary/5 shadow-none">
                    <CardContent className="flex flex-col items-center text-center py-16 px-8 gap-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <Clock className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                On Time
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                                <Construction className="h-4 w-4" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Dalam Pengembangan</span>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                            Modul pemantauan ketepatan waktu pelaksanaan outage sedang dalam tahap pengembangan. 
                            Fitur ini akan menyajikan analisis realisasi jadwal terhadap perencanaan, 
                            deviasi waktu, serta performa ketepatan penyelesaian pekerjaan.
                        </p>
                        <div className="mt-2 rounded-full bg-muted px-4 py-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Estimasi Rilis: Segera Hadir</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
