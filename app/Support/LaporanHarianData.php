<?php

namespace App\Support;

use App\Models\OutagePlan;
use App\Models\OutagePlanProgress;

/**
 * Menyusun data untuk Laporan Kegiatan Harian dan lembar Kurva S.
 *
 * Format laporannya menuntut jauh lebih banyak keterangan daripada yang
 * tersimpan sekarang — penanggung jawab per item, bobot WBS, nomor kontrak,
 * penandatangan. Kolom yang belum ada sengaja dikembalikan kosong, bukan diisi
 * tebakan, supaya jelas mana yang masih perlu dilengkapi.
 *
 * Daftar lengkap kolom yang dibutuhkan ada di KEBUTUHAN_DATA.
 */
class LaporanHarianData
{
    /**
     * Keterangan yang diminta format laporan tapi belum ada tempatnya di
     * basis data. Dipakai controller untuk memberi tahu pengguna.
     *
     * @var array<string, array<int, string>>
     */
    public const KEBUTUHAN_DATA = [
        'Identitas mesin (tabel outage_plans)' => [
            'tipe_mesin — cth "MAK 8M 453 AK"; sekarang hanya ada nama gabungan "PLTD WUA-WUA #02 (MAK)"',
            'nomor_seri — cth "26882"',
            'nomor_unit — cth "#2"',
            'ulpltd — cth "WUA-WUA"',
        ],
        'Kontrak / penunjukan (tabel outage_plans)' => [
            'do_nomor — cth "D26033, DO/612/UPKD/2026"',
            'do_tanggal',
            'surat_penunjukan_nomor — cth "1984/DAN.01.03/PLNNP010000/2025-R"',
            'surat_penunjukan_tanggal',
            'pelaksana — nama konsorsium/vendor pelaksana',
        ],
        'Item pekerjaan harian (tabel baru, mis. outage_plan_work_items)' => [
            'kategori — cth CLEANING / PEMASANGAN',
            'uraian — satu baris pekerjaan',
            'penanggung_jawab — cth "SAIMIN"',
            'progress — persen per item, bukan per hari',
            'urutan',
        ],
        'Spare part per hari (tabel baru, mis. outage_plan_spare_parts)' => [
            'nama_spare_part',
            'part_number',
            'qty',
            'keterangan',
            'Catatan: sekarang hanya ada satu material per hari (material_nama, material_part_number) tanpa qty',
        ],
        'Bobot pekerjaan / WBS (tabel baru, mis. outage_plan_wbs)' => [
            'nomor — penomoran berjenjang, cth 3.1 / 3.2',
            'uraian',
            'bobot_persen — total seluruh baris harus 100',
            'progress_persen — capaian per baris sampai hari ini',
            'Catatan: bobot progress dihitung otomatis dari bobot x progress',
        ],
        'Penandatangan (tabel outage_plans atau pengaturan unit)' => [
            'ttd_nama_1 / ttd_jabatan_1 — cth "RASID" / "Manajer"',
            'ttd_nama_2 / ttd_jabatan_2 — cth "SURYADI PRATAMA" / "Team Leader Pemeliharaan"',
            'ttd_nama_3 / ttd_jabatan_3 — cth "SESEP HERDIANA" / "Site Manager"',
        ],
        'Berkas' => [
            'Logo vendor/konsorsium — simpan di public/, saat ini hanya ada logo PLN',
        ],
    ];

    /** Nama panjang scope untuk judul laporan. */
    private const NAMA_SCOPE = [
        'SO' => 'SEMI OVERHAUL',
        'MO' => 'MAJOR OVERHAUL',
        'TO' => 'TOP OVERHAUL',
        'GI' => 'GENERAL INSPECTION',
        'AI' => 'ANNUAL INSPECTION',
    ];

    public function __construct(
        private OutagePlan $plan,
        private OutagePlanProgress $hari,
        private int $hariKe,
    ) {
    }

    /**
     * Identitas di kop laporan.
     *
     * Sebagian besar masih diturunkan dari `mesin_pembangkit` karena tipe mesin,
     * nomor seri, dan unit belum punya kolom sendiri.
     */
    public function info(): array
    {
        $nama = (string) $this->plan->mesin_pembangkit;
        $scope = strtoupper((string) $this->plan->scope);

        return [
            'jenis_pekerjaan' => self::NAMA_SCOPE[$scope] ?? $scope,
            'mesin' => $nama,
            'lokasi' => $this->lokasi($nama),
            // Belum ada kolomnya — dikosongkan, bukan ditebak dari nama mesin.
            'tipe_mesin' => '',
            'nomor_seri' => '',
            'unit' => $this->unitDariNama($nama),
            'ulpltd' => $this->ulpltdDariNama($nama),
            'pelaksana_baris_1' => '',
            'pelaksana_baris_2' => '',
        ];
    }

    public function hari(): array
    {
        return [
            'ke' => $this->hariKe,
            'tanggal' => strtoupper(
                \Carbon\Carbon::parse($this->hari->tanggal)->translatedFormat('j F Y')
            ),
            'progress' => $this->hari->actual_progress === null
                ? '-'
                : number_format((float) $this->hari->actual_progress, 2, ',', '.'),
        ];
    }

    /**
     * Poin pekerjaan hari ini beserta progres masing-masing.
     *
     * Kategori (CLEANING / PEMASANGAN) belum dipisahkan, jadi seluruh poin
     * masuk satu kelompok tanpa judul.
     *
     * @return array<int, array<string, mixed>>
     */
    public function pekerjaan(): array
    {
        $items = collect($this->hari->work_items ?? [])
            ->map(fn ($item) => [
                'uraian' => $item['uraian'] ?? '',
                'progress' => ($item['progress'] ?? null) === null || $item['progress'] === ''
                    ? null
                    : (float) $item['progress'],
                'penanggung_jawab' => null,
            ])
            ->filter(fn ($item) => filled($item['uraian']))
            ->values()
            ->all();

        if ($items === []) {
            return [];
        }

        return [[
            'kategori' => '',
            'penanggung_jawab' => null,
            'items' => $items,
        ]];
    }

    /**
     * Material yang dipakai hari ini.
     *
     * Kolom lama (satu material per hari tanpa qty) tetap dibaca sebagai
     * cadangan, supaya data sebelum migrasi tidak hilang dari laporan.
     *
     * @return array<int, array<string, mixed>>
     */
    public function spareParts(): array
    {
        $parts = collect($this->hari->spare_parts ?? [])
            ->map(fn ($p) => [
                'nama' => $p['nama'] ?? '',
                'part_number' => $p['part_number'] ?? '',
                'qty' => $p['qty'] ?? '',
                'keterangan' => $p['keterangan'] ?? '',
            ])
            ->filter(fn ($p) => filled($p['nama']) || filled($p['part_number']))
            ->values()
            ->all();

        if ($parts !== []) {
            return $parts;
        }

        if (blank($this->hari->material_nama) && blank($this->hari->material_part_number)) {
            return [];
        }

        return [[
            'nama' => $this->hari->material_nama ?: '',
            'part_number' => $this->hari->material_part_number ?: '',
            'qty' => '',
            'keterangan' => $this->hari->keterangan ?: '',
        ]];
    }

    /**
     * Dokumentasi foto hari ini.
     *
     * Foto tersimpan per hari, belum terkait ke item pekerjaan tertentu, jadi
     * seluruhnya masuk satu kelompok dengan uraian hari itu sebagai judulnya.
     *
     * @return array<int, array<string, mixed>>
     */
    public function dokumentasi(): array
    {
        $fotos = OutagePhotos::dataUris($this->hari->photos);

        if ($fotos === []) {
            return [];
        }

        // Poin pekerjaan hari itu jadi keterangan fotonya; foto belum terkait
        // ke poin tertentu, jadi seluruhnya masuk satu kelompok.
        $poin = collect($this->hari->work_items ?? [])
            ->pluck('uraian')
            ->filter()
            ->map(fn ($u, $i) => ($i + 1) . '. ' . $u)
            ->implode("\n");

        return [[
            'kategori' => 'DOKUMENTASI PEKERJAAN',
            'item' => $poin ?: ($this->hari->uraian_pekerjaan ?: ''),
            'fotos' => $fotos,
        ]];
    }

    /** @return array<string, string> */
    public function ttd(): array
    {
        return [
            'pihak_pertama' => 'PT. PLN NUSANTARA POWER',
            'pihak_kedua' => '',
            'nama_1' => '', 'jabatan_1' => 'Manager',
            'nama_2' => '', 'jabatan_2' => 'Team Leader',
            'nama_3' => '', 'jabatan_3' => 'Pemeliharaan',
            'nama_4' => '', 'jabatan_4' => 'Site Manager',
        ];
    }

    /** @return array<string, string> */
    public function kontrak(): array
    {
        return [
            'do_nomor' => '',
            'do_tanggal' => '',
            'surat_nomor' => '',
            'surat_tanggal' => '',
        ];
    }

    /**
     * Rincian bobot pekerjaan untuk lembar kurva S.
     *
     * Belum ada tabelnya sama sekali; tanpa bobot per pekerjaan, kolom
     * "Bobot Progress" tidak bisa dihitung.
     *
     * @return array<int, array<string, mixed>>
     */
    public function wbs(): array
    {
        $allProgresses = \App\Models\OutagePlanProgress::where('outage_plan_id', $this->plan->id)
            ->where('tanggal', '<=', $this->hari->tanggal)
            ->orderBy('tanggal')
            ->get();
            
        $items = [];
        
        foreach ($allProgresses as $dp) {
            $workItems = $dp->work_items ?? [];
            foreach ($workItems as $wi) {
                $uraian = trim($wi['uraian'] ?? '');
                if ($uraian === '') {
                    continue;
                }

                // Hanya panggil uraian pekerjaan yang progresnya sudah terisi.
                // Item tanpa progress dilewati, tidak ikut tampil di lembar Kurva S.
                $progress = $wi['progress'] ?? null;
                if ($progress === null || $progress === '') {
                    continue;
                }

                $items[$uraian] = (float) $progress;
            }
        }
        
        $wbsArray = [];
        $no = 1;
        foreach ($items as $uraian => $progress) {
            $wbsArray[] = [
                'no' => $no++,
                'uraian' => $uraian,
                'bobot' => null,
                'progress' => $progress,
                'bobot_progress' => null,
                'induk' => false,
            ];
        }

        return $wbsArray;
    }

    /** @return array{bobot: float|null, bobot_progress: float|null} */
    public function wbsTotal(): array
    {
        // Without proper weights, total is just 0 or null
        return [
            'bobot' => null,
            'bobot_progress' => null,
        ];
    }

    /** "PLTD WUA-WUA #02 (MAK)" -> "ULPLTD WUA-WUA PLN NP UP KENDARI" */
    private function lokasi(string $nama): string
    {
        $ulpltd = $this->ulpltdDariNama($nama);

        return $ulpltd === '' ? '' : "ULPLTD {$ulpltd} PLN NP UP KENDARI";
    }

    /** Bagian nama antara jenis pembangkit dan nomor unit. */
    private function ulpltdDariNama(string $nama): string
    {
        if (preg_match('/^PLT[A-Z]*\s+(.+?)\s*#/i', $nama, $m)) {
            return strtoupper(trim($m[1]));
        }

        return '';
    }

    private function unitDariNama(string $nama): string
    {
        if (preg_match('/#\s*0*(\d+)/', $nama, $m)) {
            return $m[1];
        }

        return '';
    }
}
