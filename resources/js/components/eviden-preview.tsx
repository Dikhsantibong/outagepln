import { useState } from 'react';
import { FileText, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type EvidenFile = {
    label: string;
    url: string | null | undefined;
    /** Jenis berkas dari server ('image' | 'pdf' | 'other'); jika kosong, ditebak dari ekstensi URL. */
    type?: string | null;
};

const extOf = (url: string) => {
    const clean = url.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
};

const isImage = (url: string) =>
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(extOf(url));
const isPdf = (url: string) => extOf(url) === 'pdf';

/**
 * Tombol + dialog pratinjau berkas eviden yang sudah diunggah.
 *
 * Dipakai pada tampilan monitoring (role admin) di halaman kinerja: gambar
 * ditampilkan langsung, PDF ditanam dalam iframe, jenis lain disajikan sebagai
 * tautan buka/unduh. Menerima beberapa berkas sekaligus (mis. eviden sebelum &
 * sesudah pada On Quality).
 */
export function EvidenPreview({
    files,
    label = 'Eviden',
    variant = 'outline',
    className = 'h-7 gap-1.5 text-xs',
}: {
    files: EvidenFile[];
    label?: string;
    variant?: 'outline' | 'default' | 'ghost' | 'secondary';
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const ada = files.filter(
        (f): f is { label: string; url: string; type?: string | null } =>
            Boolean(f.url),
    );

    const kindOf = (f: { url: string; type?: string | null }) =>
        f.type ?? (isImage(f.url) ? 'image' : isPdf(f.url) ? 'pdf' : 'other');

    if (ada.length === 0) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className={`${className} text-muted-foreground`}
                disabled
            >
                <FileText className="h-3 w-3" />
                Belum ada
            </Button>
        );
    }

    return (
        <>
            <Button
                variant={variant}
                size="sm"
                className={className}
                onClick={() => setOpen(true)}
            >
                <Eye className="h-3 w-3" />
                {label}
                {ada.length > 1 ? ` (${ada.length})` : ''}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Pratinjau Eviden</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {ada.map((f) => (
                            <div key={f.url} className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold">
                                        {f.label}
                                    </span>
                                    <a
                                        href={f.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Buka di tab baru
                                    </a>
                                </div>

                                {kindOf(f) === 'image' ? (
                                    <img
                                        src={f.url}
                                        alt={f.label}
                                        className="max-h-[70vh] w-full rounded-md border object-contain"
                                    />
                                ) : kindOf(f) === 'pdf' ? (
                                    <iframe
                                        src={f.url}
                                        title={f.label}
                                        className="h-[70vh] w-full rounded-md border"
                                    />
                                ) : (
                                    <a
                                        href={f.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted"
                                    >
                                        <FileText className="h-5 w-5" />
                                        Berkas tidak dapat dipratinjau di sini — klik untuk
                                        membuka atau mengunduh.
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
