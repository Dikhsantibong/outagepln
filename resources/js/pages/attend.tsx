import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

type Meeting = {
    id: number;
    judul: string;
    tanggal: string;
    waktu_mulai: string | null;
    lokasi: string | null;
};

export default function AttendForm({
    meeting,
    token,
}: {
    meeting: Meeting;
    token: string;
}) {
    const { flash } = usePage().props as any;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        divisi: '',
        jabatan: '',
        signature: '',
    });

    // Setup canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size for retina
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getPos = (e: React.TouchEvent | React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return {
            x: (e as React.MouseEvent).clientX - rect.left,
            y: (e as React.MouseEvent).clientY - rect.top,
        };
    };

    const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        setHasSignature(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Capture signature as base64
        const canvas = canvasRef.current;
        let signatureData = '';
        if (canvas && hasSignature) {
            signatureData = canvas.toDataURL('image/png');
        }
        data.signature = signatureData;
        post(`/attend/${token}`);
    };

    // Show success page
    if (flash?.success) {
        return (
            <>
                <Head title="Kehadiran Tercatat" />
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-6">
                    <div className="text-center max-w-sm">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Kehadiran Tercatat!</h1>
                        <p className="text-zinc-500 mb-6">{flash.success}</p>
                        <div className="bg-white rounded-xl border p-4 text-left text-sm space-y-1">
                            <p className="font-semibold text-zinc-700">{meeting.judul}</p>
                            <p className="text-zinc-500">
                                {new Date(meeting.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Daftar Hadir - ${meeting.judul}`} />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-6 shadow-lg">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Outage Monitoring</span>
                        </div>
                        <h1 className="text-xl font-bold">{meeting.judul}</h1>
                        <p className="text-blue-100 text-sm mt-1">
                            {new Date(meeting.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            {meeting.waktu_mulai && ` • ${meeting.waktu_mulai.slice(0, 5)}`}
                            {meeting.lokasi && ` • ${meeting.lokasi}`}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="max-w-md mx-auto px-6 py-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border p-6">
                        <h2 className="text-lg font-bold text-zinc-900 mb-1">Form Daftar Hadir</h2>
                        <p className="text-sm text-zinc-500 mb-6">Silakan isi data diri dan tanda tangan Anda</p>

                        <form onSubmit={submit} className="space-y-5">
                            {/* Nama */}
                            <div>
                                <label htmlFor="nama" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="nama"
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    required
                                    placeholder="Masukkan nama lengkap"
                                    className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                                {errors.nama && <p className="text-red-500 text-sm mt-1">{errors.nama}</p>}
                            </div>

                            {/* Divisi */}
                            <div>
                                <label htmlFor="divisi" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                    Divisi / Bagian
                                </label>
                                <input
                                    id="divisi"
                                    type="text"
                                    value={data.divisi}
                                    onChange={(e) => setData('divisi', e.target.value)}
                                    placeholder="Contoh: Operasi, Pemeliharaan..."
                                    className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Jabatan */}
                            <div>
                                <label htmlFor="jabatan" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                                    Jabatan
                                </label>
                                <input
                                    id="jabatan"
                                    type="text"
                                    value={data.jabatan}
                                    onChange={(e) => setData('jabatan', e.target.value)}
                                    placeholder="Contoh: Staff, Supervisor..."
                                    className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Signature Canvas */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-semibold text-zinc-700">
                                        Tanda Tangan
                                    </label>
                                    {hasSignature && (
                                        <button
                                            type="button"
                                            onClick={clearSignature}
                                            className="text-xs font-medium text-red-500 hover:text-red-700"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                                <div className="relative border-2 border-dashed border-zinc-300 rounded-xl bg-white overflow-hidden">
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full touch-none cursor-crosshair"
                                        style={{ height: '160px' }}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                    {!hasSignature && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-zinc-300 text-sm font-medium">Tanda tangan di sini</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing || !data.nama}
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Mengirim...' : 'Kirim Kehadiran'}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-zinc-400 mt-6">
                        Outage Monitoring System — UPDK Kendari
                    </p>
                </div>
            </div>
        </>
    );
}

// No layout - public mobile page
AttendForm.layout = null;
