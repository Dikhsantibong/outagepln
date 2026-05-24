<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$plan = \App\Models\OutagePlan::create([
    'mesin_pembangkit' => 'Test Mesin', 
    'rapat_r2' => now()->toDateString(), 
    'rapat_r3' => now()->addDays(2)->toDateString()
]);

echo \App\Models\DailyMeeting::where('outage_plan_id', $plan->id)->count() . ' meetings created.' . PHP_EOL;

$meetings = \App\Models\DailyMeeting::where('outage_plan_id', $plan->id)->get();
foreach ($meetings as $m) {
    echo $m->judul . ' - Status: ' . $m->status . PHP_EOL;
}
