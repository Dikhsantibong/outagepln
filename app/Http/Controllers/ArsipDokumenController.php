<?php

namespace App\Http\Controllers;

use App\Models\ArsipDokumen;
use App\Support\UploadLimit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Arsip berkas overhaul: kontrak dan hasil pekerjaan.
 *
 * Berkasnya tidak ditaruh di public/storage. Seluruh akses — pratinjau maupun
 * unduhan — lewat rute di sini, yang sudah dijaga [EnsureAdmin], supaya kontrak
 * tidak bisa dibuka lewat URL tebakan oleh akun yang tidak berhak.
 */
class ArsipDokumenController extends Controller
{
    /** Disk privat tempat seluruh arsip disimpan. */
    private const DISK = 'local';

    private const FOLDER = 'arsip-dokumen';

    public function index(Request $request)
    {
        $dokumens = ArsipDokumen::with('user:id,name')
            ->latest()
            ->get()
            ->map(fn (ArsipDokumen $d) => [
                'id' => $d->id,
                'judul' => $d->judul,
                'kategori' => $d->kategori,
                'label_kategori' => $d->labelKategori(),
                'keterangan' => $d->keterangan,
                'nama_asli' => $d->nama_asli,
                'mime' => $d->mime,
                'ukuran' => $d->ukuran,
                'bisa_dipratinjau' => $d->bisaDipratinjau(),
                'pengunggah' => $d->pengunggah,
                'diunggah_pada' => $d->created_at?->toIso8601String(),
            ]);

        return inertia('arsip/index', [
            'dokumens' => $dokumens,
            'kategoriOptions' => ArsipDokumen::KATEGORI,
            'batasUnggah' => [
                'kilobytes' => UploadLimit::kilobytes(),
                'label' => UploadLimit::label(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'kategori' => ['required', Rule::in(array_keys(ArsipDokumen::KATEGORI))],
            'keterangan' => 'nullable|string|max:1000',
            'berkas' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx',
                'max:'.UploadLimit::kilobytes(),
            ],
        ], [
            'berkas.max' => 'Ukuran berkas melebihi batas server ('.UploadLimit::label().').',
            'berkas.mimes' => 'Format berkas harus PDF, gambar, Word, atau Excel.',
        ]);

        $berkas = $request->file('berkas');
        // Nama di disk diacak Laravel; nama aslinya disimpan terpisah supaya
        // berkas tetap terunduh dengan nama yang dikenali penggunanya.
        $path = $berkas->store(self::FOLDER, self::DISK);

        ArsipDokumen::create([
            'judul' => $validated['judul'],
            'kategori' => $validated['kategori'],
            'keterangan' => $validated['keterangan'] ?? null,
            'path' => $path,
            'nama_asli' => $berkas->getClientOriginalName(),
            'mime' => $berkas->getClientMimeType(),
            'ukuran' => $berkas->getSize(),
            'user_id' => $request->user()?->id,
            'user_nama' => $request->user()?->name,
        ]);

        return back()->with('success', 'Dokumen berhasil diunggah.');
    }

    public function update(Request $request, ArsipDokumen $arsipDokumen)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'kategori' => ['required', Rule::in(array_keys(ArsipDokumen::KATEGORI))],
            'keterangan' => 'nullable|string|max:1000',
        ]);

        $arsipDokumen->update($validated);

        return back()->with('success', 'Dokumen berhasil diperbarui.');
    }

    /** Tampilkan berkas di halaman (inline), untuk pratinjau. */
    public function preview(ArsipDokumen $arsipDokumen)
    {
        return $this->kirimBerkas($arsipDokumen, 'inline');
    }

    /** Kirim berkas sebagai unduhan, memakai nama aslinya. */
    public function download(ArsipDokumen $arsipDokumen)
    {
        return $this->kirimBerkas($arsipDokumen, 'attachment');
    }

    public function destroy(ArsipDokumen $arsipDokumen)
    {
        // Berkasnya ikut dibuang; menyisakannya di disk hanya menumpuk berkas
        // yatim yang tidak lagi dirujuk baris mana pun.
        Storage::disk(self::DISK)->delete($arsipDokumen->path);
        $arsipDokumen->delete();

        return back()->with('success', 'Dokumen berhasil dihapus.');
    }

    /**
     * Alirkan berkas dari disk privat.
     *
     * Disk `public` ikut diperiksa sebagai cadangan agar arsip yang sempat
     * tersimpan di sana pada pemasangan lama tetap terbuka.
     */
    private function kirimBerkas(ArsipDokumen $arsipDokumen, string $disposition)
    {
        foreach ([self::DISK, 'public'] as $disk) {
            if (Storage::disk($disk)->exists($arsipDokumen->path)) {
                return Storage::disk($disk)->response(
                    $arsipDokumen->path,
                    $arsipDokumen->nama_asli,
                    ['Content-Disposition' => $disposition.'; filename="'.$arsipDokumen->nama_asli.'"'],
                );
            }
        }

        abort(404, 'Berkas tidak ditemukan.');
    }
}
