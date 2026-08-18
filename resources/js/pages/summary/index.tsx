import { Head } from '@inertiajs/react';
import { Construction } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SummaryIndex() {
    return (
        <>
            <Head title="Summary" />
            <div className="flex h-[calc(100vh-6rem)] items-center justify-center p-8">
                <Card className="flex max-w-md flex-col items-center justify-center p-12 text-center shadow-md">
                    <div className="mb-6 rounded-full bg-primary/10 p-4">
                        <Construction className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold tracking-tight">Dalam Pengembangan</h1>
                    <p className="text-muted-foreground">
                        Halaman Summary sedang disiapkan. Fitur ini akan segera tersedia.
                    </p>
                </Card>
            </div>
        </>
    );
}

SummaryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Summary',
            href: '/summary',
        },
    ],
};
