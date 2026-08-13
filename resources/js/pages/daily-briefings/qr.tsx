import { Head, usePage } from '@inertiajs/react';
import { Users, Calendar, MapPin, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

type Briefing = {
    id: number;
    judul: string;
    tanggal: string;
    waktu_mulai: string | null;
    lokasi: string | null;
    token: string;
    status: string;
};

export default function QrDisplay({
    briefing,
    attendUrl,
}: {
    briefing: Briefing;
    attendUrl: string;
}) {
    const [count, setCount] = useState(0);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch(`/daily-briefings/${briefing.id}/attendees-json`);
                const data = await res.json();
                setCount(data.length || 0);
            } catch { /* ignore */ }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 3000);
        return () => clearInterval(interval);
    }, [briefing.id]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <Head title={`QR - ${briefing.judul}`} />

            <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-blue-950 to-zinc-900 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

                <div className="relative z-10 mb-6">
                    <img src="/logo.png" alt="Logo" className="h-16 w-auto mx-auto" />
                </div>

                <div className="relative z-10 text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tight mb-2">{briefing.judul}</h1>
                    <div className="flex items-center justify-center gap-6 text-lg text-zinc-300">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {new Date(briefing.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {briefing.waktu_mulai && (
                            <span className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                {briefing.waktu_mulai.slice(0, 5)}
                            </span>
                        )}
                        {briefing.lokasi && (
                            <span className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                {briefing.lokasi}
                            </span>
                        )}
                    </div>
                </div>

                <div className="relative z-10 bg-white rounded-3xl p-8 shadow-2xl shadow-black/30 mb-8">
                    <QRCodeSVG
                        value={attendUrl}
                        size={320}
                        level="H"
                        includeMargin={false}
                    />
                </div>

                <div className="relative z-10 text-center mb-6">
                    <p className="text-2xl font-bold text-zinc-100 mb-2">
                        Scan QR Code untuk Daftar Hadir
                    </p>
                    <p className="text-zinc-400 text-lg">
                        Buka kamera ponsel Anda dan arahkan ke QR Code di atas
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/10">
                    <Users className="h-8 w-8 text-blue-400" />
                    <div>
                        <div className="text-5xl font-black tabular-nums">{count}</div>
                        <div className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Peserta Hadir</div>
                    </div>
                    <div className="ml-8 border-l border-white/20 pl-8">
                        <div className="text-3xl font-bold tabular-nums">
                            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Waktu Saat Ini</div>
                    </div>
                </div>

                <div className="relative z-10 mt-8 text-zinc-500 text-sm font-medium">
                    Outage Monitoring System
                </div>
            </div>
        </>
    );
}

QrDisplay.layout = null;
