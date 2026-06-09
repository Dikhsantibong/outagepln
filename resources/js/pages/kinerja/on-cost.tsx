import { Head } from '@inertiajs/react';
import { Banknote, Construction } from 'lucide-react';

export default function OnCost() {
    return (
        <>
            <Head title="Kinerja - On Cost" />
            <div className="flex flex-1 flex-col items-center justify-center p-8 min-h-[70vh]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Banknote className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">On Cost</h2>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Construction className="h-4 w-4" />
                        <span className="text-sm font-medium">Dalam Pengembangan</span>
                    </div>
                </div>
            </div>
        </>
    );
}
