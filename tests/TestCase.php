<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    /**
     * Test tidak boleh bergantung pada hasil `npm run build`.
     *
     * Tanpa ini, halaman Inertia yang baru dibuat menggagalkan test dengan
     * "Unable to locate file in Vite manifest" sampai aset dibangun ulang —
     * kegagalan yang tidak ada hubungannya dengan kode yang sedang diuji.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
