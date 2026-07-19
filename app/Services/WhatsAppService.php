<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Send a WhatsApp message using Fonnte API.
     *
     * @param string $target Target phone number or group ID (can be multiple separated by comma)
     * @param string $message The message to send
     * @return bool
     */
    public static function sendMessage(string $target, string $message): bool
    {
        $token = env('FONNTE_TOKEN');
        
        if (empty($token)) {
            Log::warning('Fonnte token is not configured. WhatsApp message not sent.');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post('https://api.fonnte.com/send', [
                'target' => $target,
                'message' => $message,
                'countryCode' => '62', // Default to Indonesia
            ]);

            $result = $response->json();

            if (isset($result['status']) && $result['status'] === true) {
                Log::info('WhatsApp message sent successfully via Fonnte.', ['target' => $target]);
                return true;
            }

            Log::error('Fonnte API returned an error.', ['response' => $result]);
            return false;

        } catch (\Exception $e) {
            Log::error('Exception caught while sending WhatsApp message.', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
