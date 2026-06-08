<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = \App\Models\User::firstOrCreate(
    ['email' => 'tamu@outage.pln'], 
    ['name' => 'Tamu (Read-Only)', 'password' => bcrypt('tamu'), 'role' => 'tamu']
);
echo "Tamu user ready.\n";
