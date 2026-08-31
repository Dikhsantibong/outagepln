import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, FileQuestion, ServerCrash, AlertTriangle } from 'lucide-react';

export default function ErrorPage({ status }: { status: number }) {
    const title = {
        503: 'Layanan Tidak Tersedia',
        500: 'Kesalahan Server',
        404: 'Halaman Tidak Ditemukan',
        403: 'Akses Ditolak',
    }[status] || 'Terjadi Kesalahan';

    const description = {
        503: 'Maaf, kami sedang melakukan pemeliharaan. Silakan periksa kembali beberapa saat lagi.',
        500: 'Oops, terjadi kesalahan pada server kami. Tim kami akan segera memperbaikinya.',
        404: 'Maaf, halaman yang Anda cari tidak dapat ditemukan.',
        403: 'Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.',
    }[status] || 'Terjadi kesalahan yang tidak diketahui.';

    const Icon = {
        503: AlertTriangle,
        500: ServerCrash,
        404: FileQuestion,
        403: ShieldAlert,
    }[status] || AlertTriangle;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center sm:px-6 lg:px-8">
            <Head title={title} />
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted/50 mb-8">
                <Icon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4">
                {status}
            </h1>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
                {title}
            </h2>
            <p className="max-w-lg text-muted-foreground mb-8 text-lg">
                {description}
            </p>
            <div className="flex gap-4">
                <Button onClick={() => window.history.back()} variant="outline">
                    Kembali
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                    Ke Beranda
                </Button>
            </div>
        </div>
    );
}
