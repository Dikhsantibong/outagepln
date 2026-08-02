<?php

namespace App\Console\Commands;

use App\Models\DailyMeeting;
use App\Models\OutagePlan;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Sets up per-brand machine ownership:
 *   1. removes PLTMG machines (not part of outage management),
 *   2. fills the derived `merek` column on every remaining plan,
 *   3. creates one managing account per brand.
 */
class SetupPengelolaMerek extends Command
{
    protected $signature = 'outage:setup-pengelola
                            {--dry-run : Show what would change without writing}
                            {--password=pengelola123 : Initial password for new accounts}';

    protected $description = 'Hapus mesin PLTMG, isi merek mesin, dan buat akun pengelola per merek';

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

        // --- 2. merek -----------------------------------------------------
        $plans = OutagePlan::query()->get(['id', 'mesin_pembangkit', 'merek']);
        $counts = [];
        $changed = 0;

        foreach ($plans as $plan) {
            $merek = OutagePlan::extractMerek($plan->mesin_pembangkit);
            $counts[$merek ?? '(tanpa merek)'] = ($counts[$merek ?? '(tanpa merek)'] ?? 0) + 1;

            if ($plan->merek !== $merek) {
                $changed++;
                if (! $dry) {
                    // saveQuietly avoids re-firing the meeting sync for a column
                    // that has nothing to do with meeting schedules.
                    $plan->merek = $merek;
                    $plan->saveQuietly();
                }
            }
        }

        ksort($counts);
        $this->newLine();
        $this->line('Merek terdeteksi (' . count($counts) . '):');
        foreach ($counts as $merek => $n) {
            $this->line(sprintf('  %-22s %3d mesin', $merek, $n));
        }
        $this->line("Plan yang mereknya diperbarui: {$changed}");

        // --- 3. akun pengelola ---------------------------------------------
        $this->newLine();
        $this->line('Akun pengelola:');
        $created = 0;
        $existing = 0;

        foreach (array_keys($counts) as $merek) {
            if ($merek === '(tanpa merek)') {
                continue;
            }

            $slug = Str::slug($merek);
            $email = "{$slug}@outage.pln";
            $user = User::where('merek', $merek)->orWhere('email', $email)->first();

            if ($user) {
                $existing++;
                if (! $dry && $user->merek !== $merek) {
                    $user->update(['merek' => $merek]);
                }
                $this->line(sprintf('  %-22s %-28s (sudah ada)', $merek, $email));

                continue;
            }

            $created++;
            $this->line(sprintf('  %-22s %-28s (baru)', $merek, $email));

            if (! $dry) {
                User::create([
                    'name' => 'Pengelola ' . $merek,
                    'email' => $email,
                    'password' => Hash::make($this->option('password')),
                    'role' => 'pengelola',
                    'merek' => $merek,
                    'email_verified_at' => now(),
                ]);
            }
        }

        $this->newLine();
        $this->info("Akun baru: {$created} | sudah ada: {$existing}");
        $this->info('Sisa outage plan: ' . OutagePlan::count());

        if ($dry) {
            $this->warn('DRY RUN - tidak ada perubahan yang ditulis.');
        }

        return self::SUCCESS;
    }
}
