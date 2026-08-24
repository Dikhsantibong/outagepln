import { Head, router, useForm } from '@inertiajs/react';
import {
    Download,
    Eye,
    FileArchive,
    FileText,
    Filter,
    HardDrive,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Dokumen {
    id: number;
    judul: string;
    kategori: string;
    label_kategori: string;
    keterangan: string | null;
    nama_asli: string;
    mime: string | null;
    ukuran: number;
    bisa_dipratinjau: boolean;
    pengunggah: string;
    diunggah_pada: string | null;
}

/** Nilai penanda "semua kategori"; SelectItem tidak menerima value kosong. */
const SEMUA = '__semua__';

const WARNA_KATEGORI: Record<string, string> = {
    kontrak: 'border-l-sky-500',
    hasil: 'border-l-emerald-500',
};

const ukuranBerkas = (bytes: number) => {
    if (bytes <= 0) {
        return '—';
    }

    const satuan = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(satuan.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));

    return `${(bytes / 1024 ** i).toLocaleString('id-ID', {
        maximumFractionDigits: i === 0 ? 0 : 1,
    })} ${satuan[i]}`;
};

const tanggal = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '—';

export default function ArsipIndex({
    dokumens,
    kategoriOptions,
    batasUnggah,
}: {
    dokumens: Dokumen[];
    kategoriOptions: Record<string, string>;
    batasUnggah: { kilobytes: number; label: string };
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterKategori, setFilterKategori] = useState(SEMUA);
    const [formTerbuka, setFormTerbuka] = useState(false);
    const [mengubah, setMengubah] = useState<Dokumen | null>(null);
    const [pratinjau, setPratinjau] = useState<Dokumen | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<{
            judul: string;
            kategori: string;
            keterangan: string;
            berkas: File | null;
        }>({
            judul: '',
            kategori: 'kontrak',
            keterangan: '',
            berkas: null,
        });

    const filtered = useMemo(
        () =>
            dokumens.filter((d) => {
                const cocokKategori =
                    filterKategori === SEMUA || d.kategori === filterKategori;
                const cocokCari = [d.judul, d.nama_asli, d.keterangan ?? '', d.pengunggah]
                    .join(' ')
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());

                return cocokKategori && cocokCari;
            }),
        [dokumens, filterKategori, searchQuery],
    );

    const jumlahKontrak = dokumens.filter((d) => d.kategori === 'kontrak').length;
    const jumlahHasil = dokumens.filter((d) => d.kategori === 'hasil').length;
    const totalUkuran = dokumens.reduce((n, d) => n + d.ukuran, 0);

    const bukaUnggah = () => {
        reset();
        clearErrors();
        setMengubah(null);
        setFormTerbuka(true);
    };

    const bukaUbah = (d: Dokumen) => {
        clearErrors();
        setData({
            judul: d.judul,
            kategori: d.kategori,
            keterangan: d.keterangan ?? '',
            berkas: null,
        });
        setMengubah(d);
        setFormTerbuka(true);
    };

    const tutupForm = () => {
        setFormTerbuka(false);
        setMengubah(null);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Mengubah hanya menyentuh keterangannya; berkas tidak diganti di
        // tempat supaya riwayat unggahan tetap satu berkas satu baris.
        if (mengubah) {
            put(`/arsip/${mengubah.id}`, { onSuccess: tutupForm });

            return;
        }

        post('/arsip', { forceFormData: true, onSuccess: tutupForm });
    };

    const hapus = (d: Dokumen) => {
        if (confirm(`Hapus dokumen "${d.judul}"? Berkasnya ikut terhapus.`)) {
            router.delete(`/arsip/${d.id}`);
        }
    };

    return (
        <>
            <Head title="Arsip Dokumen" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Arsip Dokumen
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Kontrak overhaul dan hasil pekerjaan overhaul, diunggah
                            manual dan bisa dibuka langsung di halaman
                        </p>
                    </div>
                    <Button onClick={bukaUnggah} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Unggah Dokumen
                    </Button>
                </div>

                {/* Ringkasan */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <FileArchive className="h-3 w-3" />
                            Total Dokumen
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{dokumens.length}</p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-sky-500 bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Kontrak Overhaul
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{jumlahKontrak}</p>
                    </div>
                    <div className="rounded-md border border-l-[3px] border-l-emerald-500 bg-muted/40 px-4 py-3">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Hasil Pekerjaan
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">{jumlahHasil}</p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <HardDrive className="h-3 w-3" />
                            Total Ukuran
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold">
                            {ukuranBerkas(totalUkuran)}
                        </p>
                    </div>
                </div>

                <Card className="flex flex-1 flex-col overflow-hidden rounded-md border-sidebar-border/60 py-0 shadow-sm">
                    {/* Filter */}
                    <div className="flex flex-col justify-between gap-3 border-b bg-muted/50 px-4 py-3 xl:flex-row xl:items-end">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="mb-1.5 flex items-center gap-2 border-r pr-3">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Filter
                                </span>
                            </div>
                            <div className="w-52">
                                <Select
                                    value={filterKategori}
                                    onValueChange={setFilterKategori}
                                >
                                    <SelectTrigger className="h-8 rounded-sm bg-background text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={SEMUA}>Semua kategori</SelectItem>
                                        {Object.entries(kategoriOptions).map(([k, label]) => (
                                            <SelectItem key={k} value={k}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari judul, nama berkas..."
                                className="h-8 rounded-sm bg-background pl-8 text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b bg-muted/25 px-4 py-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            PDF dan gambar bisa dibuka langsung; Word/Excel hanya bisa
                            diunduh
                        </span>
                        <span className="ml-auto">
                            Batas satu berkas {batasUnggah.label}
                        </span>
                    </div>

                    {/* Tabel */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="w-[42px] border-b px-2 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        No
                                    </th>
                                    <th className="w-[260px] border-b px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Judul
                                    </th>
                                    <th className="w-[180px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Kategori
                                    </th>
                                    <th className="w-[240px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Berkas
                                    </th>
                                    <th className="w-[150px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Pengunggah
                                    </th>
                                    <th className="w-[120px] border-b border-l px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Tanggal
                                    </th>
                                    <th className="w-[140px] border-b border-l px-2 py-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? (
                                    filtered.map((d, i) => (
                                        <tr
                                            key={d.id}
                                            className={`border-b transition-colors hover:bg-muted/40 ${
                                                i % 2 === 1 ? 'bg-muted/20' : ''
                                            }`}
                                        >
                                            <td className="px-2 py-2 text-center align-middle font-mono text-xs text-muted-foreground">
                                                {i + 1}
                                            </td>
                                            <td className="px-3 py-2 align-middle">
                                                <span className="text-[13px] leading-tight font-semibold text-foreground">
                                                    {d.judul}
                                                </span>
                                                {d.keterangan && (
                                                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                        {d.keterangan}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border-l px-3 py-2 align-middle">
                                                <span
                                                    className={`inline-flex items-center rounded border border-l-[3px] bg-background px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase ${
                                                        WARNA_KATEGORI[d.kategori] ??
                                                        'border-l-slate-400'
                                                    }`}
                                                >
                                                    {d.label_kategori}
                                                </span>
                                            </td>
                                            <td className="border-l px-3 py-2 align-middle">
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    <span className="min-w-0 truncate">
                                                        {d.nama_asli}
                                                    </span>
                                                </span>
                                                <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                                                    {ukuranBerkas(d.ukuran)}
                                                </span>
                                            </td>
                                            <td className="border-l px-3 py-2 align-middle text-xs text-muted-foreground">
                                                {d.pengunggah}
                                            </td>
                                            <td className="border-l px-3 py-2 align-middle font-mono text-xs text-muted-foreground">
                                                {tanggal(d.diunggah_pada)}
                                            </td>
                                            <td className="border-l px-2 py-2 align-middle">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        title={
                                                            d.bisa_dipratinjau
                                                                ? 'Lihat dokumen'
                                                                : 'Word/Excel tidak bisa dipratinjau, silakan unduh'
                                                        }
                                                        disabled={!d.bisa_dipratinjau}
                                                        onClick={() => setPratinjau(d)}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {/* Tautan biasa, supaya berkas
                                                        terunduh dengan nama aslinya. */}
                                                    <a
                                                        href={`/arsip/${d.id}/download`}
                                                        title="Unduh dokumen"
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        title="Ubah judul / keterangan"
                                                        onClick={() => bukaUbah(d)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
                                                        title="Hapus dokumen"
                                                        onClick={() => hapus(d)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="h-32 text-center text-sm text-muted-foreground"
                                        >
                                            {dokumens.length === 0
                                                ? 'Belum ada dokumen yang diunggah.'
                                                : 'Tidak ada dokumen yang sesuai dengan pencarian.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
                        <div>
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">
                                {filtered.length}
                            </span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">
                                {dokumens.length}
                            </span>{' '}
                            dokumen
                        </div>
                        <div>
                            <span className="font-semibold text-foreground">
                                {ukuranBerkas(totalUkuran)}
                            </span>{' '}
                            terpakai
                        </div>
                    </div>
                </Card>
            </div>

            {/* Dialog unggah / ubah */}
            <Dialog open={formTerbuka} onOpenChange={(v) => !v && tutupForm()}>
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {mengubah ? 'Ubah Dokumen' : 'Unggah Dokumen'}
                        </DialogTitle>
                        <DialogDescription>
                            {mengubah
                                ? 'Berkasnya tidak diganti — hapus lalu unggah ulang bila berkasnya keliru.'
                                : `PDF, gambar, Word, atau Excel. Maksimal ${batasUnggah.label} per berkas.`}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="judul">Judul Dokumen</Label>
                            <Input
                                id="judul"
                                value={data.judul}
                                onChange={(e) => setData('judul', e.target.value)}
                                placeholder="Contoh: Kontrak Overhaul PLTD Poasia #05"
                                required
                            />
                            {errors.judul && (
                                <p className="text-xs text-destructive">{errors.judul}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Kategori</Label>
                            <Select
                                value={data.kategori}
                                onValueChange={(v) => setData('kategori', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(kategoriOptions).map(([k, label]) => (
                                        <SelectItem key={k} value={k}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.kategori && (
                                <p className="text-xs text-destructive">{errors.kategori}</p>
                            )}
                        </div>

                        {!mengubah && (
                            <div className="space-y-1.5">
                                <Label htmlFor="berkas">Berkas</Label>
                                <Input
                                    id="berkas"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                    className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                                    onChange={(e) =>
                                        setData('berkas', e.target.files?.[0] ?? null)
                                    }
                                    required
                                />
                                {data.berkas && (
                                    <p className="text-[11px] text-muted-foreground">
                                        {data.berkas.name} &middot;{' '}
                                        {ukuranBerkas(data.berkas.size)}
                                    </p>
                                )}
                                {errors.berkas && (
                                    <p className="text-xs text-destructive">
                                        {errors.berkas}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="keterangan">Keterangan (opsional)</Label>
                            <textarea
                                id="keterangan"
                                rows={3}
                                value={data.keterangan}
                                onChange={(e) => setData('keterangan', e.target.value)}
                                placeholder="Catatan singkat tentang dokumen ini..."
                                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                            {errors.keterangan && (
                                <p className="text-xs text-destructive">
                                    {errors.keterangan}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={tutupForm}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="gap-2">
                                <Upload className="h-4 w-4" />
                                {processing
                                    ? 'Menyimpan...'
                                    : mengubah
                                      ? 'Simpan Perubahan'
                                      : 'Unggah'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Pratinjau dokumen — tetap menyediakan tombol unduh */}
            <Dialog open={pratinjau !== null} onOpenChange={(v) => !v && setPratinjau(null)}>
                <DialogContent className="flex h-[92vh] w-[96vw] flex-col gap-3 sm:max-w-[96vw]">
                    <DialogHeader className="pr-10">
                        <DialogTitle className="flex flex-wrap items-center gap-2">
                            {pratinjau?.judul}
                            <span className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                {pratinjau?.label_kategori}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="flex flex-wrap items-center gap-x-2">
                            <span>{pratinjau?.nama_asli}</span>
                            <span>&middot;</span>
                            <span className="font-mono">
                                {pratinjau ? ukuranBerkas(pratinjau.ukuran) : ''}
                            </span>
                            <span>&middot;</span>
                            <span>
                                diunggah {pratinjau?.pengunggah}{' '}
                                {tanggal(pratinjau?.diunggah_pada ?? null)}
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    {pratinjau && (
                        <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30">
                            {pratinjau.mime?.startsWith('image/') ? (
                                <img
                                    src={`/arsip/${pratinjau.id}/preview`}
                                    alt={pratinjau.judul}
                                    className="mx-auto max-h-full object-contain"
                                />
                            ) : (
                                <iframe
                                    src={`/arsip/${pratinjau.id}/preview`}
                                    title={pratinjau.judul}
                                    className="h-full w-full"
                                />
                            )}
                        </div>
                    )}

                    <div className="flex shrink-0 justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPratinjau(null)}
                        >
                            Tutup
                        </Button>
                        {pratinjau && (
                            <a href={`/arsip/${pratinjau.id}/download`}>
                                <Button type="button" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Unduh Dokumen
                                </Button>
                            </a>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

ArsipIndex.layout = {
    breadcrumbs: [
        { title: 'Arsip', href: '#' },
        { title: 'Arsip Dokumen', href: '/arsip' },
    ],
};
