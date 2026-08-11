import { ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type FotoItem = {
    /** URL yang bisa dipasang di <img>. */
    src: string;
    /** true = berkas baru yang belum tersimpan di server. */
    baru: boolean;
    /** Posisi di dalam daftarnya masing-masing (retained atau baru). */
    index: number;
};

/**
 * Kolom foto pada satu baris progress harian.
 *
 * Sebelumnya tombol hapus hanya muncul saat kursor melayang di atas thumbnail,
 * jadi praktis tak terlihat — apalagi di layar sentuh yang tidak punya hover.
 * Di sini setiap foto punya tombol Hapus dan Ganti yang selalu tampak, dan
 * thumbnail bisa diklik untuk melihat versi besarnya, karena kotak 48px tidak
 * cukup untuk memastikan foto yang terunggah memang yang dimaksud.
 */
export function DailyPhotoCell({
    fotos,
    onTambah,
    onHapus,
    onGanti,
    label,
}: {
    fotos: FotoItem[];
    onTambah: (files: File[]) => void;
    onHapus: (foto: FotoItem) => void;
    onGanti: (foto: FotoItem, file: File) => void;
    /** Dipakai sebagai judul pratinjau, mis. tanggal barisnya. */
    label: string;
}) {
    const [pratinjau, setPratinjau] = useState<number | null>(null);
    const gantiRef = useRef<HTMLInputElement>(null);
    const [gantiTarget, setGantiTarget] = useState<FotoItem | null>(null);

    const mintaGanti = (foto: FotoItem) => {
        setGantiTarget(foto);
        gantiRef.current?.click();
    };

    const terimaGanti = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file && gantiTarget) {
            onGanti(gantiTarget, file);
        }

        // Input direset supaya memilih berkas yang sama dua kali tetap terdeteksi.
        e.target.value = '';
        setGantiTarget(null);
    };

    const geser = (arah: number) => {
        if (pratinjau === null) {
            return;
        }

        setPratinjau((pratinjau + arah + fotos.length) % fotos.length);
    };

    return (
        <>
            <div className="flex flex-wrap items-start gap-2">
                {fotos.map((foto, i) => (
                    <div key={`${foto.baru ? 'baru' : 'ada'}-${foto.index}`} className="space-y-1">
                        <button
                            type="button"
                            onClick={() => setPratinjau(i)}
                            title="Klik untuk melihat lebih besar"
                            className={`block h-14 w-14 overflow-hidden rounded border transition-opacity hover:opacity-80 ${
                                foto.baru ? 'border-dashed border-primary' : 'bg-muted'
                            }`}
                        >
                            <img
                                src={foto.src}
                                alt={`Foto ${i + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>

                        {/* Selalu tampak: hover-only membuat aksinya tidak ketemu. */}
                        <div className="flex items-center justify-center gap-0.5">
                            <button
                                type="button"
                                onClick={() => mintaGanti(foto)}
                                title="Ganti foto ini"
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <RefreshCw className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onHapus(foto)}
                                title="Hapus foto ini"
                                className="rounded p-1 text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                ))}

                <label
                    title="Tambah foto"
                    className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded border border-dashed text-muted-foreground hover:bg-muted"
                >
                    <Plus className="h-4 w-4" />
                    <span className="text-[9px]">Foto</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);

                            if (files.length > 0) {
                                onTambah(files);
                            }

                            e.target.value = '';
                        }}
                    />
                </label>
            </div>

            {/* Satu input tersembunyi dipakai bersama untuk semua tombol Ganti. */}
            <input
                ref={gantiRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={terimaGanti}
            />

            <Dialog
                open={pratinjau !== null}
                onOpenChange={(o) => !o && setPratinjau(null)}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Foto {label}</DialogTitle>
                        <DialogDescription>
                            {pratinjau !== null ? pratinjau + 1 : 0} dari {fotos.length}
                            {fotos[pratinjau ?? 0]?.baru && ' · belum tersimpan'}
                        </DialogDescription>
                    </DialogHeader>

                    {pratinjau !== null && fotos[pratinjau] && (
                        <div className="space-y-3">
                            <div className="relative flex max-h-[70vh] items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                                <img
                                    src={fotos[pratinjau].src}
                                    alt={`Foto ${pratinjau + 1}`}
                                    className="max-h-[70vh] w-auto object-contain"
                                />

                                {fotos.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => geser(-1)}
                                            className="absolute left-2 rounded-full bg-background/80 p-2 shadow hover:bg-background"
                                            title="Sebelumnya"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => geser(1)}
                                            className="absolute right-2 rounded-full bg-background/80 p-2 shadow hover:bg-background"
                                            title="Berikutnya"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => mintaGanti(fotos[pratinjau])}
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Ganti
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        onHapus(fotos[pratinjau]);
                                        setPratinjau(null);
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Hapus
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => setPratinjau(null)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
