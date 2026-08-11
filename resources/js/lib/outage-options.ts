/**
 * Pilihan tetap untuk form outage.
 *
 * Dipusatkan di sini karena daftar yang sama dipakai halaman Edit dan modal
 * Tambah. Sebelumnya keduanya menuliskannya sendiri-sendiri, sehingga menambah
 * satu scope berarti mengubah dua tempat — dan satu tempat pasti terlupa.
 */

export const SCOPES = [
    'FINAL STAGE',
    'SECOND STAGE',
    '2ND STAGE',
    'TO',
    'MO',
    'SO',
    'AI',
    'GI',
    'PMS 20 K',
    'PMS 24 K',
    'PMS 32K',
    'PMS 40K',
] as const;

export const JENIS_PEMBANGKIT = ['PLTD', 'PLTMG', 'PLTM'] as const;

/**
 * Status penyelesaian pekerjaan.
 *
 * Sebelumnya diketik bebas, padahal seluruh 293 data hanya berisi OPEN atau
 * CLOSE. Dijadikan pilihan supaya tidak ada lagi variasi ejaan yang membuat
 * filter dan hitungan status meleset.
 */
export const KET_OPTIONS = ['OPEN', 'CLOSE'] as const;

export type KetOption = (typeof KET_OPTIONS)[number];
