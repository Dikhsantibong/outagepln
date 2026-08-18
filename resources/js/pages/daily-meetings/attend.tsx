import { Head, useForm, usePage } from '@inertiajs/react';
import { Copy, Users, CheckCircle2 } from 'lucide-react';
import type { FormEventHandler} from 'react';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type meeting = {
    id: number;
    judul: string;
    tanggal: string;
    waktu_mulai: string | null;
    lokasi: string | null;
    attendees: any[];
    token: string;
};

export default function AttendForm({
    meeting,
    token,
}: {
    meeting: meeting;
    token: string;
}) {
    const { flash } = usePage().props as any;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [num1] = useState(Math.floor(Math.random() * 20) + 1);
    const [num2] = useState(Math.floor(Math.random() * 20) + 1);

    const { data, setData, post, processing, errors } = useForm({
        nama: '',
        nid: '',
        instansi: 'PLN Nusantara Power',
        instansi_lainnya: '',
        divisi: '',
        jabatan: '',
        signature: '',
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
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
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
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
        if (parseInt(captchaAnswer) !== num1 + num2) {
            alert('Captcha salah!');
            return;
        }

        const canvas = canvasRef.current;
        let signatureData = '';
        if (canvas && hasSignature) {
            signatureData = canvas.toDataURL('image/png');
        }
        
        setData('signature', signatureData);
        if (data.instansi === 'Lainnya') {
            setData('instansi', data.instansi_lainnya);
        }

        setTimeout(() => {
            post(`/attend/`, {
                onSuccess: () => {
                    setCaptchaAnswer('');
                    clearSignature();
                }
            });
        }, 100);
    };

    if (flash?.success) {
        return (
            <>
                <Head title="Kehadiran Tercatat" />
                <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                    <div className="bg-white p-8 rounded shadow-md text-center max-w-sm w-full border-t-4 border-green-500">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-green-600 mb-2">Berhasil!</h1>
                        <p className="text-slate-600 mb-6">{flash.success}</p>
                        <Button className="w-full bg-[#4682b4] hover:bg-[#386a94]" onClick={() => window.location.reload()}>
                            Kembali ke Form
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    const tglFormat = new Date(meeting.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const sortedAttendees = [...(meeting.attendees || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <>
            <Head title={`Daftar Hadir - ${meeting.judul}`} />

            <div className="min-h-screen relative py-8 px-4 sm:px-6 lg:px-8" 
                 style={{ 
                     backgroundColor: '#e2e8f0',
                     backgroundImage: "url('https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&q=80&w=2070')",
                     backgroundSize: 'cover',
                     backgroundPosition: 'center',
                     backgroundAttachment: 'fixed'
                 }}>
                
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-6 items-start">
                    
                    {/* LEFT PANEL - FORM */}
                    <div className="bg-white shadow-2xl w-full xl:w-[500px] shrink-0 border border-slate-200 overflow-hidden">
                        <div className="bg-[#6b9e9f] p-6 text-white">
                            <h1 className="text-xl font-bold mb-4">{meeting.judul}</h1>
                            <div className="text-[13px] space-y-1 font-medium opacity-90">
                                <p>Pelaksanaan : {tglFormat} | Waktu : {meeting.waktu_mulai ? meeting.waktu_mulai.substring(0, 5) : '10:00'} - Selesai</p>
                                <p>Tempat : {meeting.lokasi || 'Zoom'}</p>
                                <p>Media : Zoom , ID Meeting : - , Password : -</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700">Nama *</Label>
                                    <Input 
                                        type="text" 
                                        value={data.nama} 
                                        onChange={e => setData('nama', e.target.value)} 
                                        placeholder="Peserta"
                                        className="border-slate-300 focus-visible:ring-[#6b9e9f]" 
                                        required 
                                    />
                                    {errors.nama && <span className="text-xs text-red-500">{errors.nama}</span>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-700">NID</Label>
                                    <Input 
                                        type="text" 
                                        value={data.nid} 
                                        onChange={e => setData('nid', e.target.value)} 
                                        placeholder="NID"
                                        className="border-slate-300 focus-visible:ring-[#6b9e9f]" 
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-700">Instansi *</Label>
                                    <div className="flex flex-wrap items-center gap-4 text-sm mt-1 mb-2">
                                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                                            <input type="radio" name="instansi" value="PLN Nusantara Power" checked={data.instansi === 'PLN Nusantara Power'} onChange={e => setData('instansi', e.target.value)} className="accent-[#4682b4] w-4 h-4" />
                                            PLN Nusantara Power
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                                            <input type="radio" name="instansi" value="PLN" checked={data.instansi === 'PLN'} onChange={e => setData('instansi', e.target.value)} className="accent-[#4682b4] w-4 h-4" />
                                            PLN
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                                            <input type="radio" name="instansi" value="Lainnya" checked={data.instansi === 'Lainnya'} onChange={e => setData('instansi', e.target.value)} className="accent-[#4682b4] w-4 h-4" />
                                            Lainnya
                                        </label>
                                    </div>
                                    {data.instansi === 'Lainnya' && (
                                        <Input 
                                            type="text" 
                                            value={data.instansi_lainnya} 
                                            onChange={e => setData('instansi_lainnya', e.target.value)} 
                                            placeholder="Sebutkan Instansi"
                                            className="border-slate-300 focus-visible:ring-[#6b9e9f]" 
                                            required 
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-700">Divisi / Unit</Label>
                                        <Input 
                                            type="text" 
                                            value={data.divisi} 
                                            onChange={e => setData('divisi', e.target.value)} 
                                            placeholder="Divisi / Unit"
                                            className="border-slate-300 focus-visible:ring-[#6b9e9f]" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-700">Jabatan</Label>
                                        <Input 
                                            type="text" 
                                            value={data.jabatan} 
                                            onChange={e => setData('jabatan', e.target.value)} 
                                            placeholder="Jabatan"
                                            className="border-slate-300 focus-visible:ring-[#6b9e9f]" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-700">email / No Handphone (opsional)</Label>
                                        <Input 
                                            type="text" 
                                            placeholder="e-mail"
                                            className="border-slate-300 focus-visible:ring-[#6b9e9f]" 
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Input 
                                            type="text" 
                                            placeholder="No.HP"
                                            className="border-slate-300 focus-visible:ring-[#6b9e9f]" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-700">Media Kegiatan</Label>
                                    <Select defaultValue="Video Conference">
                                        <SelectTrigger className="border-slate-300 focus-visible:ring-[#6b9e9f] h-9">
                                            <SelectValue placeholder="Pilih media" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Video Conference">Video Conference</SelectItem>
                                            <SelectItem value="Tatap Muka">Tatap Muka</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-700">Captcha</Label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-serif text-blue-800 w-24">{num1} + {num2} =</span>
                                        <Input 
                                            type="text" 
                                            value={captchaAnswer}
                                            onChange={e => setCaptchaAnswer(e.target.value)}
                                            className="w-24 text-center text-lg border-slate-300 focus-visible:ring-[#6b9e9f]" 
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-slate-700">Tanda Tangan</Label>
                                        {hasSignature && <button type="button" onClick={clearSignature} className="text-xs text-red-500 hover:underline">Hapus</button>}
                                    </div>
                                    <div className="border border-slate-300 bg-white rounded-md overflow-hidden">
                                        <canvas
                                            ref={canvasRef}
                                            className="w-full h-32 touch-none cursor-crosshair"
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            onTouchStart={startDrawing}
                                            onTouchMove={draw}
                                            onTouchEnd={stopDrawing}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="w-full bg-[#4682b4] hover:bg-[#386a94] text-white"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT PANEL - TABLE */}
                    <div className="bg-white shadow-2xl flex-1 border border-slate-200 w-full overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-white border-b-slate-100">
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                Show <Input type="number" defaultValue={10} className="w-16 h-8 text-center px-1 border-slate-300" /> entries
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="text-sm flex items-center gap-2 text-slate-600">
                                    Search: 
                                    <Input type="text" className="h-8 w-48 border-slate-300 focus-visible:ring-[#6b9e9f]" />
                                </div>
                                <Button 
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link disalin!');
                                    }}
                                    className="bg-[#4682b4] hover:bg-[#386a94] text-white flex items-center gap-1.5"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy Link
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto p-4">
                            <Table className="border border-slate-200 text-sm">
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700 w-12 border-r border-slate-200">No</TableHead>
                                        <TableHead className="font-semibold text-slate-700 border-r border-slate-200">Nama</TableHead>
                                        <TableHead className="font-semibold text-slate-700 border-r border-slate-200">NID</TableHead>
                                        <TableHead className="font-semibold text-slate-700 border-r border-slate-200">Instansi</TableHead>
                                        <TableHead className="font-semibold text-slate-700 border-r border-slate-200">Divisi/Unit</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Jabatan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAttendees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-slate-500 bg-slate-50/50">Belum ada data</TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedAttendees.map((a, i) => (
                                            <TableRow key={a.id} className="hover:bg-slate-50 border-slate-200">
                                                <TableCell className="border-r border-slate-200 text-slate-600">{i + 1}</TableCell>
                                                <TableCell className="border-r border-slate-200 font-medium text-slate-800">{a.nama}</TableCell>
                                                <TableCell className="border-r border-slate-200 text-slate-600">{a.nid || '-'}</TableCell>
                                                <TableCell className="border-r border-slate-200 text-slate-600">{a.instansi || '-'}</TableCell>
                                                <TableCell className="border-r border-slate-200 text-slate-600">{a.divisi || '-'}</TableCell>
                                                <TableCell className="text-slate-600">{a.jabatan || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            
                            <div className="flex justify-between items-center mt-4 text-sm text-slate-600">
                                <div>Showing 1 to {sortedAttendees.length} of {sortedAttendees.length} entries</div>
                                <div className="flex border border-slate-200 rounded overflow-hidden shadow-sm">
                                    <button className="px-3 py-1.5 bg-slate-50 border-r border-slate-200 text-slate-500 hover:bg-slate-100">Previous</button>
                                    <button className="px-3 py-1.5 bg-[#4682b4] text-white font-medium">1</button>
                                    <button className="px-3 py-1.5 bg-slate-50 border-l border-slate-200 text-slate-500 hover:bg-slate-100">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AttendForm.layout = null;
