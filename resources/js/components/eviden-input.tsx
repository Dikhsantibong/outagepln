import { usePage } from '@inertiajs/react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SharedUploadLimit = {
    uploadLimit?: { bytes: number; label: string };
};

/**
 * Batas unggah yang berlaku di server, dibagikan lewat shared props Inertia.
 * Nilai cadangan 2 MB dipakai bila prop belum tersedia (mis. saat render awal
 * halaman yang belum melewati middleware).
 */
export function useUploadLimit() {
    const { uploadLimit } = usePage<SharedUploadLimit>().props;

    return uploadLimit ?? { bytes: 2 * 1024 * 1024, label: '2,0 MB' };
}

/**
 * Input eviden dengan pemeriksaan ukuran di browser.
 *
 * PHP menolak berkas yang melebihi post_max_size sebelum Laravel sempat
 * memvalidasi, sehingga aturan `max:` di controller tidak pernah jalan dan
 * pengguna hanya melihat halaman error PostTooLargeException. Menolaknya di
 * sini membuat berkas kebesaran tidak pernah dikirim.
 */
export function EvidenInput({
    id,
    label = 'Eviden (PDF/JPG/PNG)',
    disabled = false,
    onChange,
}: {
    id: string;
    label?: string;
    disabled?: boolean;
    onChange: (file: File | null) => void;
}) {
    const limit = useUploadLimit();
    const ref = useRef<HTMLInputElement>(null);

    const handle = (file: File | null) => {
        if (file && file.size > limit.bytes) {
            toast.error(
                `Berkas "${file.name}" berukuran ${(file.size / 1048576).toFixed(1).replace('.', ',')} MB, melebihi batas ${limit.label}.`,
            );

            // Kosongkan input supaya tidak ada berkas tergantung yang tidak akan terkirim.
            if (ref.current) {
                ref.current.value = '';
            }

            onChange(null);

            return;
        }

        onChange(file);
    };

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                ref={ref}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={disabled}
                onChange={(e) => handle(e.target.files?.[0] ?? null)}
            />
            <p className="text-[11px] text-muted-foreground">
                Maksimal {limit.label} per berkas.
            </p>
        </div>
    );
}
