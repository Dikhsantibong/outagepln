import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TextareaAutosize from 'react-textarea-autosize';
import type { SparePart, WorkItem } from '@/lib/outage-progress';
import { emptySparePart, emptyWorkItem } from '@/lib/outage-progress';

/**
 * Nomor urut poin, ditampilkan seperti daftar bernomor pada laporan cetak
 * sehingga hubungan antara isian di layar dan hasil cetaknya langsung terlihat.
 */
function Nomor({ i }: { i: number }) {
    return (
        <span className="mt-1.5 w-4 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
            {i + 1}.
        </span>
    );
}

function TombolTambah({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className="h-7 w-full justify-start gap-1.5 text-[11px] text-primary hover:bg-primary/10"
        >
            <Plus className="h-3 w-3" />
            {label}
        </Button>
    );
}

function TombolHapus({ onClick, title }: { onClick: () => void; title: string }) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            title={title}
            onClick={onClick}
            className="mt-0.5 h-7 w-7 shrink-0 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
            <Trash2 className="h-3 w-3" />
        </Button>
    );
}

/**
 * Kotak berlabel untuk satu kelompok isian.
 *
 * Tabel harian punya banyak kolom berdampingan; tanpa penanda kelompok, orang
 * harus menebak bahwa part number, nama material, dan qty adalah satu kesatuan.
 * Judul dan garis kotak membuat batasnya terlihat sekali lihat.
 */
function Kelompok({
    judul,
    petunjuk,
    children,
}: {
    judul: string;
    petunjuk: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-md border border-dashed bg-muted/20 p-2">
            <p className="mb-1.5 text-[10px] font-bold tracking-wide text-foreground uppercase">
                {judul}
            </p>
            {children}
            <p className="mt-1 text-[9px] text-muted-foreground italic">{petunjuk}</p>
        </div>
    );
}

/**
 * Uraian pekerjaan sebagai daftar berpoin, tiap poin dengan progresnya sendiri.
 *
 * Sebelumnya uraian hanya satu kotak teks bebas sehingga progres per poin
 * terpaksa dititipkan di kolom Keterangan. Di sini keduanya berdampingan pada
 * baris yang sama, jadi tidak ada lagi tempat menyimpan yang keliru.
 */
export function WorkItemsInput({
    items,
    onChange,
}: {
    items: WorkItem[];
    onChange: (items: WorkItem[]) => void;
}) {
    const ubah = (i: number, field: keyof WorkItem, value: string) =>
        onChange(items.map((it, k) => (k === i ? { ...it, [field]: value } : it)));

    return (
        <Kelompok
            judul="Uraian Pekerjaan"
            petunjuk="Satu baris = satu poin pekerjaan, dengan progres poin itu sendiri."
        >
        <div className="space-y-1">
            {items.length > 0 && (
                <div className="flex gap-1 pl-5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <span className="flex-1">Uraian pekerjaan</span>
                    <span className="w-[76px] text-center">Progres</span>
                    <span className="w-7" />
                </div>
            )}

            {items.map((item, i) => (
                <div key={i} className="flex items-start gap-1">
                    <Nomor i={i} />
                    <TextareaAutosize
                        className="min-h-[32px] flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-[16px] md:text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        minRows={1}
                        placeholder="cth: Pretest beban 1.700 kW"
                        value={item.uraian}
                        onChange={(e) => ubah(i, 'uraian', e.target.value)}
                    />
                    <div className="relative w-[76px] shrink-0">
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            className="h-8 pr-5 text-center text-[16px] md:text-xs"
                            placeholder="0"
                            value={item.progress}
                            onChange={(e) => ubah(i, 'progress', e.target.value)}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[10px] text-muted-foreground">
                            %
                        </span>
                    </div>
                    <TombolHapus
                        title="Hapus poin ini"
                        onClick={() => onChange(items.filter((_, k) => k !== i))}
                    />
                </div>
            ))}

            <TombolTambah
                label={items.length === 0 ? 'Tambah poin pekerjaan' : 'Tambah poin'}
                onClick={() => onChange([...items, emptyWorkItem()])}
            />
        </div>
        </Kelompok>
    );
}

/**
 * Material yang dipakai: nama, part number, dan jumlahnya.
 *
 * Struktur lama hanya menampung satu material per hari dan tanpa jumlah, jadi
 * pemakaian dua material berbeda pada satu hari tidak bisa dicatat.
 */
export function SparePartsInput({
    items,
    onChange,
}: {
    items: SparePart[];
    onChange: (items: SparePart[]) => void;
}) {
    const ubah = (i: number, field: keyof SparePart, value: string) =>
        onChange(items.map((it, k) => (k === i ? { ...it, [field]: value } : it)));

    return (
        <Kelompok
            judul="Material Digunakan"
            petunjuk="Nama material, part number, dan jumlahnya adalah satu kesatuan data material."
        >
        <div className="space-y-1">
            {items.length > 0 && (
                <div className="flex gap-1 pl-5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <span className="flex-1">Nama material</span>
                    <span className="w-[104px]">Part number</span>
                    <span className="w-[56px] text-center">Qty</span>
                    <span className="w-7" />
                </div>
            )}

            {items.map((item, i) => (
                <div key={i} className="flex items-start gap-1">
                    <Nomor i={i} />
                    <Input
                        type="text"
                        className="h-8 flex-1 text-[16px] md:text-xs"
                        placeholder="cth: Gasket cylinder head"
                        value={item.nama}
                        onChange={(e) => ubah(i, 'nama', e.target.value)}
                    />
                    <Input
                        type="text"
                        className="h-8 w-[104px] shrink-0 font-mono text-[16px] md:text-xs"
                        placeholder="cth: 1234-5678"
                        value={item.part_number}
                        onChange={(e) => ubah(i, 'part_number', e.target.value)}
                    />
                    <Input
                        type="text"
                        className="h-8 w-[56px] shrink-0 text-center text-[16px] md:text-xs"
                        placeholder="2 Bh"
                        value={item.qty}
                        onChange={(e) => ubah(i, 'qty', e.target.value)}
                    />
                    <TombolHapus
                        title="Hapus material ini"
                        onClick={() => onChange(items.filter((_, k) => k !== i))}
                    />
                </div>
            ))}

            <TombolTambah
                label="Tambah material"
                onClick={() => onChange([...items, emptySparePart()])}
            />
        </div>
        </Kelompok>
    );
}
