<?php

namespace App\Support;

use App\Models\OutagePlan;

/**
 * Rasterizes the Plan vs Actual S-curve as a PNG data URI via GD.
 *
 * dompdf's HTML renderer does not draw inline <svg> shapes (only text nodes
 * inside them), so the chart is rendered as a bitmap image instead.
 */
class SCurveChartRenderer
{
    public static function renderDataUri(OutagePlan $outagePlan, int $width = 640, int $height = 260): ?string
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
    public static function buildImage(OutagePlan $outagePlan, int $width = 640, int $height = 260)
    {
        $rows = $outagePlan->dailyProgresses;
        $n = $rows->count();

        if ($n === 0) {
            return null;
        }

        $padL = 34;
        $padR = 14;
        $padT = 14;
        $padB = 26;
        $plotW = $width - $padL - $padR;
        $plotH = $height - $padT - $padB;

        $im = imagecreatetruecolor($width, $height);
        imageantialias($im, true);
        imagefill($im, 0, 0, imagecolorallocate($im, 255, 255, 255));

        $grid = imagecolorallocate($im, 226, 232, 240);
        $axis = imagecolorallocate($im, 148, 163, 184);
        $text = imagecolorallocate($im, 71, 85, 105);
        // Deep, high-contrast tones so both curves stay legible in print.
        $planColor = imagecolorallocate($im, 29, 78, 216);
        $actualColor = imagecolorallocate($im, 4, 120, 87);

        imagesetthickness($im, 1);
        foreach ([0, 25, 50, 75, 100] as $g) {
            $y = (int) round($padT + $plotH - ($g / 100 * $plotH));
            imageline($im, $padL, $y, $width - $padR, $y, $grid);
            imagestring($im, 3, 2, $y - 7, str_pad($g . '%', 4, ' ', STR_PAD_LEFT), $text);
        }

        imagesetthickness($im, 1);
        imageline($im, $padL, $padT, $padL, $padT + $plotH, $axis);
        imageline($im, $padL, $padT + $plotH, $width - $padR, $padT + $plotH, $axis);

        $labelStep = max(1, (int) ceil($n / 10));
        foreach ($rows as $i => $dp) {
            if ($i % $labelStep === 0 || $i === $n - 1) {
                $x = (int) round($padL + ($n === 1 ? 0 : ($i / ($n - 1)) * $plotW));
                imagestring($im, 2, $x - 8, $height - $padB + 8, 'D' . ($i + 1), $text);
            }
        }

        // Thick strokes so both curves stay clearly readable once dompdf
        // scales the bitmap down to the page width.
        imagesetthickness($im, 5);
        self::drawLine($im, $rows, $n, $padL, $padT, $plotW, $plotH, 'plan_progress', $planColor);
        self::drawLine($im, $rows, $n, $padL, $padT, $plotW, $plotH, 'actual_progress', $actualColor);

        return $im;
    }

    private static function drawLine($im, $rows, int $n, int $padL, int $padT, int $plotW, int $plotH, string $field, int $color): void
    {
        $prevX = null;
        $prevY = null;

        foreach ($rows as $i => $dp) {
            $x = $padL + ($n === 1 ? 0 : ($i / ($n - 1)) * $plotW);
            $value = min(100, max(0, (float) $dp->$field));
            $y = $padT + $plotH - ($value / 100 * $plotH);

            if ($prevX !== null) {
                imageline($im, (int) round($prevX), (int) round($prevY), (int) round($x), (int) round($y), $color);
            }

            $prevX = $x;
            $prevY = $y;
        }
    }
}
