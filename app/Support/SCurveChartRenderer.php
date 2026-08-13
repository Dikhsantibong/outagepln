<?php

namespace App\Support;

use App\Models\OutagePlan;

/**
 * Rasterizes the Plan vs Actual S-curve as a PNG via GD.
 *
 * dompdf's HTML renderer does not draw inline <svg> shapes (only text nodes
 * inside them), so the chart is rendered as a bitmap image instead. It is drawn
 * at a high internal resolution and scaled down by the PDF, which keeps the
 * per-point value labels legible.
 */
class SCurveChartRenderer
{
    private const COLOR_PLAN = [68, 114, 196];      // RENCANA - blue
    private const COLOR_ACTUAL = [192, 0, 0];       // REALISASI - red
    private const COLOR_GRID = [155, 187, 89];      // horizontal gridlines - green
    private const COLOR_DROP = [141, 180, 226];     // vertical drop lines - light blue
    private const COLOR_AXIS = [90, 90, 90];
    private const COLOR_TEXT = [60, 60, 60];

    public static function renderDataUri(OutagePlan $outagePlan, int $width = 1600, int $height = 880): ?string
    {
        $im = self::buildImage($outagePlan, $width, $height);

        if ($im === null) {
            return null;
        }

        ob_start();
        imagepng($im);
        $data = ob_get_clean();
        imagedestroy($im);

        return 'data:image/png;base64,' . base64_encode($data);
    }

    /**
     * Returns the raw GD image resource (caller is responsible for imagedestroy(),
     * unless it is handed off to something like PhpSpreadsheet's MemoryDrawing).
     */
    public static function buildImage(OutagePlan $outagePlan, int $width = 1600, int $height = 880)
    {
        $rows = $outagePlan->dailyProgresses;
        $n = $rows->count();

        if ($n === 0) {
            return null;
        }

        $font = self::fontPath();

        $padL = 96;
        $padR = 46;
        $padT = 132;
        $padB = 192;
        $plotW = $width - $padL - $padR;
        $plotH = $height - $padT - $padB;

        $im = imagecreatetruecolor($width, $height);
        imagefill($im, 0, 0, imagecolorallocate($im, 255, 255, 255));

        $cPlan = imagecolorallocate($im, ...self::COLOR_PLAN);
        $cActual = imagecolorallocate($im, ...self::COLOR_ACTUAL);
        $cGrid = imagecolorallocate($im, ...self::COLOR_GRID);
        $cDrop = imagecolorallocate($im, ...self::COLOR_DROP);
        $cAxis = imagecolorallocate($im, ...self::COLOR_AXIS);
        $cText = imagecolorallocate($im, ...self::COLOR_TEXT);

        $x = fn (int $i) => $padL + ($n === 1 ? $plotW / 2 : ($i / ($n - 1)) * $plotW);
        $y = fn (float $v) => $padT + $plotH - (min(100, max(0, $v)) / 100 * $plotH);

        // --- horizontal gridlines + Y axis ticks --------------------------
        imagesetthickness($im, 1);
        foreach ([0, 20, 40, 60, 80, 100] as $g) {
            $gy = (int) round($y($g));
            imageline($im, $padL, $gy, $width - $padR, $gy, $cGrid);
            self::text($im, $font, 17, 0, $padL - 46, $gy + 6, $cText, (string) $g);
        }

        // --- axis titles ---------------------------------------------------
        $persenLen = self::textWidth($font, 17, 'Persentase');
        self::text($im, $font, 17, 90, 26, (int) round($padT + $plotH / 2 + $persenLen / 2), $cText, 'Persentase');
        self::text($im, $font, 17, 0, (int) round($padL + $plotW / 2 - 34), $padT + $plotH + 172, $cText, 'Tanggal');

        // --- legend + summary ----------------------------------------------
        // Ambil hari terakhir di mana progress aktual sudah diisi (bukan null)
        $lastRecorded = $rows->last(function ($dp) {
            return $dp->actual_progress !== null;
        });

        if ($lastRecorded) {
            $sumPlan = (float) $lastRecorded->plan_progress;
            $sumActual = (float) $lastRecorded->actual_progress;
        } else {
            $sumPlan = 0.0;
            $sumActual = 0.0;
        }
        imagesetthickness($im, 5);
        imageline($im, $padL + 60, 44, $padL + 118, 44, $cPlan);
        imageline($im, $padL + 250, 44, $padL + 308, 44, $cActual);
        imagesetthickness($im, 1);
        self::marker($im, $padL + 89, 44, $cPlan);
        self::marker($im, $padL + 279, 44, $cActual);
        self::text($im, $font, 18, 0, $padL + 124, 51, $cPlan, 'RENCANA', true);
        self::text($im, $font, 18, 0, $padL + 314, 51, $cActual, 'REALISASI', true);

        self::text($im, $font, 18, 0, $padL, 92, $cPlan, 'Rencana');
        self::text($im, $font, 18, 0, $padL + 150, 92, $cPlan, ': ' . self::fmt($sumPlan) . ' %');
        self::text($im, $font, 18, 0, $padL, 118, $cActual, 'Realisasi');
        self::text($im, $font, 18, 0, $padL + 150, 118, $cActual, ': ' . self::fmt($sumActual) . ' %');

        // --- vertical drop lines + rotated date labels ---------------------
        $everyLabel = (int) ceil($n / 45); // keep date labels readable on long outages
        foreach ($rows as $i => $dp) {
            $px = (int) round($x($i));
            if ($dp->plan_progress !== null || $dp->actual_progress !== null) {
                $top = (int) round(min(
                    $y((float) ($dp->plan_progress ?? $dp->actual_progress)),
                    $y((float) ($dp->actual_progress ?? $dp->plan_progress)),
                ));
                imageline($im, $px, $top, $px, $padT + $plotH, $cDrop);
            }

            if ($i % $everyLabel === 0 || $i === $n - 1) {
                $label = \Carbon\Carbon::parse($dp->tanggal)->format('d/m/y');
                // Rotated text grows upwards from its origin, so anchor the
                // origin at the far end to keep dates clear of the value labels.
                $len = self::textWidth($font, 15, $label);
                self::text($im, $font, 15, 90, $px + 6, $padT + $plotH + 50 + $len, $cText, $label);
            }
        }

        // --- axis lines ------------------------------------------------------
        imagesetthickness($im, 2);
        imageline($im, $padL, $padT, $padL, $padT + $plotH, $cAxis);
        imageline($im, $padL, $padT + $plotH, $width - $padR, $padT + $plotH, $cAxis);

        // --- series ----------------------------------------------------------
        self::series($im, $font, $rows, $n, $x, $y, 'plan_progress', $cPlan, -1);
        self::series($im, $font, $rows, $n, $x, $y, 'actual_progress', $cActual, 1);

        return $im;
    }

    /**
     * Draws one cumulative series: line, point markers and per-point value labels.
     * $side places labels below (-1) or above (+1) the point so the two series
     * do not overwrite each other.
     */
    private static function series($im, ?string $font, $rows, int $n, callable $x, callable $y, string $field, int $color, int $side): void
    {
        $prevX = null;
        $prevY = null;

        // Hari yang belum diisi (null) dilewati: garis berhenti di titik terakhir
        // yang punya data, bukan terjun ke 0.
        imagesetthickness($im, 5);
        foreach ($rows as $i => $dp) {
            if ($dp->$field === null) {
                continue;
            }

            $px = $x($i);
            $py = $y((float) $dp->$field);

            if ($prevX !== null) {
                imageline($im, (int) round($prevX), (int) round($prevY), (int) round($px), (int) round($py), $color);
            }

            $prevX = $px;
            $prevY = $py;
        }

        imagesetthickness($im, 1);
        foreach ($rows as $i => $dp) {
            if ($dp->$field === null) {
                continue;
            }

            $px = (int) round($x($i));
            $py = (int) round($y((float) $dp->$field));
            self::marker($im, $px, $py, $color);

            $label = self::fmt($dp->$field);
            $offset = $side < 0 ? 26 : -14;
            self::text($im, $font, 12, 0, $px - 17, $py + $offset, $color, $label, true);
        }
    }

    private static function marker($im, int $px, int $py, int $color): void
    {
        imagefilledellipse($im, $px, $py, 11, 11, $color);
    }

    /** Indonesian number format, matching the reference chart (e.g. 78,18). */
    private static function fmt($value): string
    {
        return number_format((float) $value, 2, ',', '.');
    }

    /**
     * Draws text with a TrueType font when available, falling back to GD's
     * bitmap fonts so the chart still renders if the font file is missing.
     */
    private static function text($im, ?string $font, int $size, int $angle, int $px, int $py, int $color, string $text, bool $bold = false): void
    {
        if ($font !== null) {
            imagettftext($im, $size, $angle, $px, $py, $color, $font, $text);

            if ($bold) {
                // Poor man's bold: redraw with a 1px offset.
                imagettftext($im, $size, $angle, $px + 1, $py, $color, $font, $text);
            }

            return;
        }

        imagestring($im, 3, $px, $py - 12, $text, $color);
    }

    /** Rendered width of a string in pixels (0 when no TrueType font is available). */
    private static function textWidth(?string $font, int $size, string $text): int
    {
        if ($font === null) {
            return strlen($text) * 7;
        }

        $box = imagettfbbox($size, 0, $font, $text);

        return $box === false ? strlen($text) * 7 : (int) abs($box[2] - $box[0]);
    }

    private static function fontPath(): ?string
    {
        $candidates = [
            base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans.ttf'),
            'C:/Windows/Fonts/arial.ttf',
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }
}
