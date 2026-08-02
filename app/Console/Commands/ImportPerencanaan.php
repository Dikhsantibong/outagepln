<?php

namespace App\Console\Commands;

use App\Models\OutagePlan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Imports the PERENCANAAN sheet (columns A-R) into outage_plans.
 *
 * The sheet mixes date conventions heavily: English and Indonesian month names,
 * `/`, `-` and space separators, 2- and 4-digit years, and — most importantly —
 * numeric dates that are d/m/Y on some rows and m/d/Y on others. The day/month
 * order is therefore resolved per row, using in-row evidence first and the
 * chronological order of the meeting columns as a tie-breaker.
 */
class ImportPerencanaan extends Command
{
    protected $signature = 'outage:import-perencanaan
                            {file : Path to the CSV file}
                            {--fresh : Delete all existing outage plans first}
                            {--dry-run : Parse and report without writing}';

    protected $description = 'Import outage plans from the PERENCANAAN CSV (columns A-R)';

    /** Column indexes A-R (0-based). */
    private const C_MESIN = 1;
    private const C_SCOPE = 2;
    private const C_JENIS = 3;
    private const C_DURASI = 4;
    private const C_START = 5;
    private const C_SELESAI = 6;
    private const C_PROGRESS = 7;
    private const C_R2 = 8;
    private const C_R3 = 9;
    private const C_P1 = 10;
    private const C_P2 = 11;
    private const C_P3 = 12;
    private const C_KET = 13;
    private const C_SISTEM = 14;
    private const C_REAL_START = 15;
    private const C_REAL_STOP = 16;
    private const C_KET2 = 17;

    /** Date columns, in the chronological order used to break d/m vs m/d ties. */
    private const DATE_COLS = [
        self::C_R2, self::C_R3, self::C_P1, self::C_P2, self::C_P3,
        self::C_START, self::C_SELESAI, self::C_REAL_START, self::C_REAL_STOP,
    ];

    private const MONTHS = [
        'jan' => 1, 'januari' => 1, 'january' => 1,
        'feb' => 2, 'februari' => 2, 'february' => 2, 'peb' => 2,
        'mar' => 3, 'maret' => 3, 'march' => 3,
        'apr' => 4, 'april' => 4,
        'mei' => 5, 'may' => 5,
        'jun' => 6, 'juni' => 6, 'june' => 6,
        'jul' => 7, 'juli' => 7, 'july' => 7,
        'agu' => 8, 'agt' => 8, 'agust' => 8, 'agustus' => 8, 'aug' => 8, 'august' => 8,
        'sep' => 9, 'sept' => 9, 'september' => 9,
        'okt' => 10, 'oct' => 10, 'oktober' => 10, 'october' => 10,
        'nov' => 11, 'nop' => 11, 'november' => 11, 'nopember' => 11,
        'des' => 12, 'dec' => 12, 'desember' => 12, 'december' => 12,
    ];

    private array $unparsed = [];
    private array $ambiguous = [];

    public function handle(): int
    {
        $file = $this->argument('file');

        if (! is_file($file)) {
            $this->error("File tidak ditemukan: {$file}");

            return self::FAILURE;
        }

        $rows = $this->readCsv($file);
        $this->info('Baris terbaca: ' . count($rows));

        $parsed = [];
        foreach ($rows as $sheetRow => $row) {
            $mesin = trim($row[self::C_MESIN] ?? '');

            // Skip separator/blank rows.
            if ($mesin === '') {
                continue;
            }

            $dayFirst = $this->resolveDayFirst($row, $sheetRow);

            $parsed[] = [
                'mesin_pembangkit' => $mesin,
                'scope' => $this->str($row[self::C_SCOPE] ?? null),
                'jenis_pembangkit' => $this->str($row[self::C_JENIS] ?? null),
                'durasi' => $this->int($row[self::C_DURASI] ?? null),
                'start_date' => $this->date($row[self::C_START] ?? null, $dayFirst, $sheetRow, 'START'),
                'selesai' => $this->date($row[self::C_SELESAI] ?? null, $dayFirst, $sheetRow, 'SELESAI'),
                'progress' => $this->percent($row[self::C_PROGRESS] ?? null),
                'rapat_r2' => $this->date($row[self::C_R2] ?? null, $dayFirst, $sheetRow, 'RAPAT R2'),
                'rapat_r3' => $this->date($row[self::C_R3] ?? null, $dayFirst, $sheetRow, 'RAPAT R3'),
                'rapat_p1' => $this->date($row[self::C_P1] ?? null, $dayFirst, $sheetRow, 'RAPAT P1'),
                'rapat_p2' => $this->date($row[self::C_P2] ?? null, $dayFirst, $sheetRow, 'RAPAT P2'),
                'rapat_p3' => $this->date($row[self::C_P3] ?? null, $dayFirst, $sheetRow, 'RAPAT P3'),
                'ket' => $this->str($row[self::C_KET] ?? null),
                'sistem' => $this->str($row[self::C_SISTEM] ?? null),
                'real_start' => $this->date($row[self::C_REAL_START] ?? null, $dayFirst, $sheetRow, 'REAL START'),
                'real_stop' => $this->date($row[self::C_REAL_STOP] ?? null, $dayFirst, $sheetRow, 'REAL STOP'),
                'ket_realisasi' => $this->str($row[self::C_KET2] ?? null),
            ];
        }

        $this->info('Baris valid (ada mesin): ' . count($parsed));
        $this->reportIssues();

        if ($this->option('dry-run')) {
            $this->warn('DRY RUN - tidak ada data yang ditulis.');
            $this->table(
                ['Mesin', 'Scope', 'Durasi', 'Start', 'Selesai', 'Prog', 'R2', 'Sistem'],
                collect($parsed)->take(5)->map(fn ($p) => [
                    mb_strimwidth($p['mesin_pembangkit'], 0, 28, '…'),
                    $p['scope'], $p['durasi'], $p['start_date'], $p['selesai'],
                    $p['progress'], $p['rapat_r2'], $p['sistem'],
                ])->all()
            );

            return self::SUCCESS;
        }

        if ($this->option('fresh')) {
            $this->warn('Menghapus seluruh data outage plan lama...');
            // Meetings are removed by the model's deleted() hook; progresses cascade.
            OutagePlan::query()->each(fn (OutagePlan $p) => $p->delete());
            DB::table('daily_meetings')->delete();
            $this->info('Data lama terhapus.');
        }

        $bar = $this->output->createProgressBar(count($parsed));
        $bar->start();
        foreach ($parsed as $attrs) {
            OutagePlan::create($attrs);
            $bar->advance();
        }
        $bar->finish();
        $this->newLine(2);

        $this->info('Selesai. Total outage plan: ' . OutagePlan::count());
        $this->info('Daily meeting ter-generate: ' . DB::table('daily_meetings')->count());

        return self::SUCCESS;
    }

    /** @return array<int, array<int, string>> keyed by spreadsheet row number */
    private function readCsv(string $file): array
    {
        $handle = fopen($file, 'r');
        fgetcsv($handle, 0, ',', '"', '\\'); // header
        $rows = [];
        $sheetRow = 2;
        while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
            $rows[$sheetRow++] = $row;
        }
        fclose($handle);

        return $rows;
    }

    /**
     * Decides whether numeric dates on this row are d/m/Y (true) or m/d/Y (false).
     * Evidence order: a component > 12 proves it outright; otherwise the reading
     * that keeps R2..SELESAI in chronological order wins; otherwise d/m/Y.
     */
    private function resolveDayFirst(array $row, int $sheetRow): bool
    {
        $numeric = [];
        foreach (self::DATE_COLS as $col) {
            $v = trim($row[$col] ?? '');
            if (preg_match('#^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$#', $v, $m)) {
                $numeric[] = [(int) $m[1], (int) $m[2], $m[3]];
            }
        }

        if (! $numeric) {
            return true;
        }

        foreach ($numeric as [$a, $b]) {
            if ($a > 12) {
                return true;
            }
            if ($b > 12) {
                return false;
            }
        }

        // No decisive component: DURASI is the strongest remaining signal, since
        // SELESAI - START + 1 should equal it.
        $durasi = $this->int($row[self::C_DURASI] ?? null);
        if ($durasi) {
            $span = function (bool $dayFirst) use ($row, $durasi): bool {
                $s = $this->rawDate($row[self::C_START] ?? null, $dayFirst);
                $e = $this->rawDate($row[self::C_SELESAI] ?? null, $dayFirst);
                if (! $s || ! $e) {
                    return false;
                }
                $days = (strtotime($e) - strtotime($s)) / 86400 + 1;

                return abs($days - $durasi) <= 2;
            };
            $dmFit = $span(true);
            $mdFit = $span(false);
            if ($dmFit !== $mdFit) {
                return $dmFit;
            }
        }

        // Otherwise test both readings against chronological order.
        $chronoOk = function (bool $dayFirst) use ($row): bool {
            $prev = '';
            foreach ([self::C_R2, self::C_R3, self::C_P1, self::C_P2, self::C_P3, self::C_START, self::C_SELESAI] as $col) {
                $v = trim($row[$col] ?? '');
                if (! preg_match('#^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$#', $v, $m)) {
                    continue;
                }
                $d = $dayFirst ? (int) $m[1] : (int) $m[2];
                $mo = $dayFirst ? (int) $m[2] : (int) $m[1];
                $iso = sprintf('%04d%02d%02d', $this->year($m[3]), $mo, $d);
                if ($prev !== '' && $iso < $prev) {
                    return false;
                }
                $prev = $iso;
            }

            return true;
        };

        $dm = $chronoOk(true);
        $md = $chronoOk(false);

        if ($dm !== $md) {
            return $dm;
        }

        $this->ambiguous[] = $sheetRow;

        return true; // Indonesian sheets default to d/m/Y.
    }

    /** Parses a date without recording issues; used by the day/month tie-breakers. */
    private function rawDate(?string $raw, bool $dayFirst): ?string
    {
        $v = trim(preg_replace('/\s+/', ' ', (string) $raw));
        if ($v === '' || $v === '-') {
            return null;
        }

        if (preg_match('#^(\d{1,2})\s*[\s/-]\s*([A-Za-z]+)\s*[\s/-]?\s*(\d{2,4})$#', $v, $m)
            || preg_match('#^(\d{1,2})\s*([A-Za-z]+)\s*(\d{2,4})$#', $v, $m)) {
            $mon = self::MONTHS[strtolower($m[2])] ?? null;
            if ($mon && checkdate($mon, (int) $m[1], $this->year($m[3]))) {
                return sprintf('%04d-%02d-%02d', $this->year($m[3]), $mon, (int) $m[1]);
            }
        }

        if (preg_match('#^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$#', $v, $m)) {
            $d = $dayFirst ? (int) $m[1] : (int) $m[2];
            $mo = $dayFirst ? (int) $m[2] : (int) $m[1];
            if (checkdate($mo, $d, $this->year($m[3]))) {
                return sprintf('%04d-%02d-%02d', $this->year($m[3]), $mo, $d);
            }
        }

        return null;
    }

    private function date(?string $raw, bool $dayFirst, int $sheetRow, string $label): ?string
    {
        $v = trim((string) $raw);
        if ($v === '' || $v === '-') {
            return null;
        }

        $v = preg_replace('/\s+/', ' ', $v);

        // 1) day + month-name + year, e.g. "27 May 24", "10/Sep/24", "14-Jul-26", "13 May26"
        if (preg_match('#^(\d{1,2})\s*[\s/-]\s*([A-Za-z]+)\s*[\s/-]?\s*(\d{2,4})$#', $v, $m)
            || preg_match('#^(\d{1,2})\s*([A-Za-z]+)\s*(\d{2,4})$#', $v, $m)) {
            $mon = self::MONTHS[strtolower($m[2])] ?? null;
            if ($mon) {
                return $this->build((int) $m[1], $mon, $this->year($m[3]), $v, $sheetRow, $label);
            }
        }

        // 2) fully numeric, order decided per row
        if (preg_match('#^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$#', $v, $m)) {
            $d = $dayFirst ? (int) $m[1] : (int) $m[2];
            $mo = $dayFirst ? (int) $m[2] : (int) $m[1];

            return $this->build($d, $mo, $this->year($m[3]), $v, $sheetRow, $label);
        }

        // 3) day + month-name but no year - cannot be placed on a timeline
        if (preg_match('#^(\d{1,2})\s*([A-Za-z]+)$#', $v, $m) && isset(self::MONTHS[strtolower($m[2])])) {
            $this->unparsed[] = "baris {$sheetRow} {$label}: \"{$v}\" (tahun tidak ada)";

            return null;
        }

        $this->unparsed[] = "baris {$sheetRow} {$label}: \"{$v}\"";

        return null;
    }

    private function build(int $d, int $m, int $y, string $raw, int $sheetRow, string $label): ?string
    {
        if (! checkdate($m, $d, $y)) {
            $this->unparsed[] = "baris {$sheetRow} {$label}: \"{$raw}\" (tanggal tidak valid)";

            return null;
        }

        return sprintf('%04d-%02d-%02d', $y, $m, $d);
    }

    private function year(string $y): int
    {
        $n = (int) $y;

        return $n >= 100 ? $n : ($n < 70 ? 2000 + $n : 1900 + $n);
    }

    private function str(?string $v): ?string
    {
        $v = trim((string) $v);

        return ($v === '' || $v === '-') ? null : $v;
    }

    private function int(?string $v): ?int
    {
        $v = trim((string) $v);

        return is_numeric($v) ? (int) $v : null;
    }

    private function percent(?string $v): ?float
    {
        $v = trim((string) $v);
        if ($v === '') {
            return null;
        }
        $v = str_replace(['%', ' '], '', $v);
        $v = str_replace(',', '.', $v);

        return is_numeric($v) ? round((float) $v, 2) : null;
    }

    private function reportIssues(): void
    {
        if ($this->ambiguous) {
            $this->warn('Baris dengan tanggal ambigu d/m vs m/d (dipakai d/m/Y): '
                . implode(', ', array_unique($this->ambiguous)));
        }

        if ($this->unparsed) {
            $this->warn('Nilai tanggal yang tidak bisa dibaca (' . count($this->unparsed) . ') - disimpan kosong:');
            foreach (array_slice($this->unparsed, 0, 20) as $u) {
                $this->line('  - ' . $u);
            }
            if (count($this->unparsed) > 20) {
                $this->line('  ... dan ' . (count($this->unparsed) - 20) . ' lainnya');
            }
        }
    }
}
