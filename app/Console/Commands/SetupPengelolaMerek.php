<?php

namespace App\Console\Commands;

use App\Models\DailyMeeting;
use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Sets up per-brand, per-plant machine ownership:
 *   1. removes PLTMG machines (not part of outage management),
 *   2. fills the derived `merek` and `unit` columns on every remaining plan,
 *   3. creates one managing account per brand *and* plant.
 *
 * A brand alone is not an owner: MIRRLEES runs at both PLTD POASIA and
 * PLTD RAHA, and each plant has its own crew. Pass `--per-merek` to fall back
 * to the older one-account-per-brand layout.
 */
class SetupPengelolaMerek extends Command
{
    protected $signature = 'outage:setup-pengelola
                            {--dry-run : Show what would change without writing}
                            {--per-merek : One account per brand instead of per brand+plant}
                            {--password=pengelola123 : Initial password for new accounts}';

    protected $description = 'Hapus mesin PLTMG, isi merek & unit mesin, dan buat akun pengelola per merek + unit';

    public function handle(): int
    {
        $dry = $this->option('dry-run');

        // --- 1. PLTMG -----------------------------------------------------
        $pltmg = OutagePlan::where('jenis_pembangkit', 'PLTMG')
            ->orWhere('mesin_pembangkit', 'like', 'PLTMG%')
            ->get();
        $meetingCount = DailyMeeting::whereIn('outage_plan_id', $pltmg->pluck('id'))->count();

        $this->line("PLTMG akan dihapus : {$pltmg->count()} plan (+{$meetingCount} daily meeting)");

        if (! $dry) {
            // delete() per model so the OutagePlan deleted() hook clears meetings.
            $pltmg->each(fn (OutagePlan $p) => $p->delete());
        }

        // --- 2. merek & unit ------------------------------------------------
        $perUnit = ! $this->option('per-merek');
        $plans = OutagePlan::query()->get(['id', 'mesin_pembangkit', 'merek', 'unit']);
        $counts = [];
        $changed = 0;

        foreach ($plans as $plan) {
            $merek = OutagePlan::extractMerek($plan->mesin_pembangkit);
            $unit = OutagePlan::extractUnit($plan->mesin_pembangkit);
            $kunci = $merek === null
                ? '(tanpa merek)'
                : ($perUnit ? $merek.'|'.(string) $unit : $merek);
            $counts[$kunci] = ($counts[$kunci] ?? 0) + 1;

            if ($plan->merek !== $merek || $plan->unit !== $unit) {
                $changed++;
                if (! $dry) {
                    // saveQuietly avoids re-firing the meeting sync for columns
                    // that have nothing to do with meeting schedules.
                    $plan->merek = $merek;
                    $plan->unit = $unit;
                    $plan->saveQuietly();
                }
            }
        }

        ksort($counts);
        $this->newLine();
        $this->line('Wilayah kelola terdeteksi ('.count($counts).'):');
        foreach ($counts as $kunci => $n) {
            $this->line(sprintf('  %-40s %3d mesin', str_replace('|', ' · ', $kunci), $n));
        }
        $this->line("Plan yang merek/unitnya diperbarui: {$changed}");

        // --- 3. akun pengelola ---------------------------------------------
        $this->newLine();
        $this->line('Akun pengelola:');
        $created = 0;
        $existing = 0;

        foreach (array_keys($counts) as $kunci) {
            if ($kunci === '(tanpa merek)') {
                continue;
            }

            [$merek, $unit] = array_pad(explode('|', $kunci, 2), 2, null);
            $unit = $unit === '' ? null : $unit;
            $label = $unit === null ? $merek : "{$merek} · {$unit}";

            $slug = Str::slug($unit === null ? $merek : "{$merek} {$unit}");
            $email = "{$slug}@outage.pln";
            $user = User::where('email', $email)
                ->orWhere(fn ($q) => $q->where('merek', $merek)->where('unit', $unit))
                ->first();

            if ($user) {
                $existing++;
                if (! $dry && ($user->merek !== $merek || $user->unit !== $unit)) {
                    $user->update(['merek' => $merek, 'unit' => $unit]);
                }
                $this->line(sprintf('  %-40s %-36s (sudah ada)', $label, $email));

                continue;
            }

            $created++;
            $this->line(sprintf('  %-40s %-36s (baru)', $label, $email));

            if (! $dry) {
                User::create([
                    'name' => 'Pengelola '.$label,
                    'email' => $email,
                    'password' => Hash::make($this->option('password')),
                    'role' => 'pengelola',
                    'merek' => $merek,
                    'unit' => $unit,
                    'email_verified_at' => now(),
                ]);
            }
        }

        $this->newLine();
        $this->info("Akun baru: {$created} | sudah ada: {$existing}");
        $this->info('Sisa outage plan: '.OutagePlan::count());

        if ($perUnit) {
            $this->laporkanAkunLintasUnit();
        }

        if ($dry) {
            $this->warn('DRY RUN - tidak ada perubahan yang ditulis.');
        }

        return self::SUCCESS;
    }

    /**
     * Akun pengelola lama masih dipatok ke merek saja, jadi ia tetap melihat
     * mesin merek itu di semua unit dan menutupi pemisahan per unit yang baru
     * dibuat. Perintah ini tidak mempersempitnya diam-diam — cukup ditunjukkan
     * supaya unitnya diisi lewat Data Master atau akunnya dihapus.
     */
    private function laporkanAkunLintasUnit(): void
    {
        $lintasUnit = User::where('role', 'pengelola')
            ->whereNotNull('merek')
            ->whereNull('unit')
            ->orderBy('merek')
            ->get(['name', 'email', 'merek']);

        if ($lintasUnit->isEmpty()) {
            return;
        }

        $this->newLine();
        $this->warn('Akun pengelola berikut masih mencakup seluruh unit mereknya:');
        foreach ($lintasUnit as $user) {
            $this->line(sprintf('  %-22s %-36s %s', $user->merek, $user->email, $user->name));
        }
        $this->line('Isi kolom Unit pada Data Master > Users, atau hapus akunnya.');
    }
}
