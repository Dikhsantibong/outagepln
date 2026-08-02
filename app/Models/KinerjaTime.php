    <?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KinerjaTime extends Model
{
    protected $fillable = [
        'outage_plan_id',
        'start_date_aktual',
        'selesai_aktual',
        'eviden',
        'catatan',
    ];

    public function outagePlan()
    {
        return $this->belongsTo(OutagePlan::class);
    }
}
