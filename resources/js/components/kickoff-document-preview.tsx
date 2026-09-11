
interface KickoffPreviewData {
    nomor_dokumen?: string;
    revisi?: string;
    tanggal_terbit?: string;
    pimpinan_rapat?: string;
    tempat?: string;
    waktu?: string;
    agenda?: string;
    peserta?: string;
    penyampaian_pln?: string;
    nama_mitra?: string;
    penyampaian_mitra?: string;
    hasil_kesepakatan?: string;
    link_absensi?: string;
    pimpinan_nama?: string;
    pimpinan_jabatan?: string;
    notulis_nama?: string;
    notulis_jabatan?: string;
    kota_ttd?: string;
    tanggal_ttd?: string;
}

export default function KickoffDocumentPreview({
    data,
    meetingDate,
    attendeesCount,
    photos = [],
    masterTtds = [],
    className,
}: {
    data: KickoffPreviewData;
    meetingDate?: string;
    attendeesCount: number;
    photos?: any[];
    masterTtds?: any[];
    className?: string;
}) {
    const parseLines = (text?: string) => {
        if (!text) return [];
        return text.split(/\r?\n/).filter(line => line.trim() !== '');
    };

    const plnLines = parseLines(data.penyampaian_pln);
    const mitraLines = parseLines(data.penyampaian_mitra);
    const sepakatLines = parseLines(data.hasil_kesepakatan);

    const formattedTanggalTerbit = data.tanggal_terbit
        ? new Date(data.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' - ')
        : '.. - .. - ' + new Date().getFullYear();

    const formattedMeetingDate = meetingDate
        ? new Date(meetingDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '...';

    const formattedTtdDate = data.tanggal_ttd
        ? new Date(data.tanggal_ttd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : meetingDate
        ? new Date(meetingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : '...';

    return (
        <div className={`letter-preview-frame ${className || ''} bg-muted/30 p-4 sm:p-8 overflow-auto h-full w-full`}>
            <style>{`
                .tiptap-preview ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 0.5rem; }
                .tiptap-preview ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 0.5rem; }
                .tiptap-preview p { margin-bottom: 0.5rem; }
                .tiptap-preview strong { font-weight: bold; }
                .tiptap-preview em { font-style: italic; }
                .tiptap-preview u { text-decoration: underline; }
            `}</style>
            <div className="relative mx-auto w-full max-w-[794px] shrink-0 bg-white shadow-sm border font-sans text-[11px] leading-relaxed text-black h-fit min-h-[1123px] mb-8"
                style={{ padding: '40px 40px 40px 50px' }}>
                
                {/* Header Table */}
                <table className="w-full border-collapse border border-gray-400 mb-4">
                    <tbody>
                        <tr>
                            <td className="w-[27%] text-center align-middle border border-gray-400 p-2" rowSpan={4}>
                                <img src="/sidebar-logo.png" alt="Logo PLN NP" className="h-10 mx-auto object-contain" />
                            </td>
                            <td className="w-[36%] text-center font-bold text-gray-600 border border-gray-400 p-1">
                                PT PLN NUSANTARA POWER
                            </td>
                            <td className="w-[17%] border border-gray-400 p-1 px-2 font-medium">Nomor Dokumen</td>
                            <td className="w-[20%] border border-gray-400 p-1 px-2">: {data.nomor_dokumen || '...'}</td>
                        </tr>
                        <tr>
                            <td className="text-center font-bold text-gray-600 border border-gray-400 p-1">
                                INTEGRATED MANAGEMENT SYSTEM
                            </td>
                            <td className="border border-gray-400 p-1 px-2 font-medium">Revisi</td>
                            <td className="border border-gray-400 p-1 px-2">: {data.revisi || '...'}</td>
                        </tr>
                        <tr>
                            <td className="text-center font-bold text-black text-[13px] border border-gray-400 p-1" rowSpan={2}>
                                FORMULIR NOTULEN RAPAT
                            </td>
                            <td className="border border-gray-400 p-1 px-2 font-medium">Tanggal Terbit</td>
                            <td className="border border-gray-400 p-1 px-2">: {formattedTanggalTerbit}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-1 px-2 font-medium">Halaman</td>
                            <td className="border border-gray-400 p-1 px-2">: 1 dari 1</td>
                        </tr>
                    </tbody>
                </table>

                {/* Meta Table */}
                <table className="w-full border-collapse mb-4">
                    <tbody>
                        <tr>
                            <td className="w-[90px] py-0.5 align-top">Pimpinan Rapat</td>
                            <td className="w-2 py-0.5 align-top">:</td>
                            <td className="py-0.5 align-top">{data.pimpinan_rapat || '...'}</td>
                            <td className="w-[85px] py-0.5 align-top pl-4">Hari/Tanggal</td>
                            <td className="w-2 py-0.5 align-top">:</td>
                            <td className="py-0.5 align-top">{formattedMeetingDate}</td>
                        </tr>
                        <tr>
                            <td className="py-0.5 align-top">Tempat</td>
                            <td className="py-0.5 align-top">:</td>
                            <td className="py-0.5 align-top">{data.tempat || '...'}</td>
                            <td className="py-0.5 align-top pl-4">Waktu</td>
                            <td className="py-0.5 align-top">:</td>
                            <td className="py-0.5 align-top">{data.waktu || '...'}</td>
                        </tr>
                        <tr>
                            <td className="py-0.5 align-top">Agenda</td>
                            <td className="py-0.5 align-top">:</td>
                            <td className="py-0.5 align-top" colSpan={4}>{data.agenda || '...'}</td>
                        </tr>
                        <tr>
                            <td className="py-0.5 align-top">Peserta</td>
                            <td className="py-0.5 align-top">:</td>
                            <td className="py-0.5 align-top" colSpan={4}>{data.peserta || '(Daftar peserta terlampir)'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Box Content */}
                <div className="border border-black p-3 pb-6">
                    <div className="font-bold mb-1">I.&nbsp;&nbsp;&nbsp;Pembahasan</div>
                    
                    <div className="font-bold underline ml-4 mb-1 mt-2">A.&nbsp;&nbsp;Penyampaian PLN NP UP Kendari</div>
                    {data.penyampaian_pln && /<\w+[^>]*>/.test(data.penyampaian_pln) ? (
                        <div className="ml-4 text-justify tiptap-preview" dangerouslySetInnerHTML={{ __html: data.penyampaian_pln }} />
                    ) : plnLines.length > 0 ? (
                        <ol className="list-decimal pl-10 ml-1 mb-1">
                            {plnLines.map((line, idx) => (
                                <li key={idx} className="mb-0.5 text-justify">{line}</li>
                            ))}
                        </ol>
                    ) : (
                        <div className="italic text-gray-500 ml-10 text-[10px]">Belum ada pembahasan.</div>
                    )}

                    <div className="font-bold underline ml-4 mb-1 mt-2">B.&nbsp;&nbsp;Penyampaian {data.nama_mitra || 'Mitra / Vendor'}</div>
                    {data.penyampaian_mitra && /<\w+[^>]*>/.test(data.penyampaian_mitra) ? (
                        <div className="ml-4 text-justify tiptap-preview" dangerouslySetInnerHTML={{ __html: data.penyampaian_mitra }} />
                    ) : mitraLines.length > 0 ? (
                        <ol className="list-decimal pl-10 ml-1 mb-1">
                            {mitraLines.map((line, idx) => (
                                <li key={idx} className="mb-0.5 text-justify">{line}</li>
                            ))}
                        </ol>
                    ) : (
                        <div className="italic text-gray-500 ml-10 text-[10px]">Belum ada penyampaian mitra.</div>
                    )}

                    <div className="font-bold underline ml-4 mb-1 mt-2">C.&nbsp;&nbsp;Hasil Kesepakatan</div>
                    {data.hasil_kesepakatan && /<\w+[^>]*>/.test(data.hasil_kesepakatan) ? (
                        <div className="ml-4 text-justify tiptap-preview" dangerouslySetInnerHTML={{ __html: data.hasil_kesepakatan }} />
                    ) : sepakatLines.length > 0 ? (
                        <ol className="list-decimal pl-10 ml-1 mb-1">
                            {sepakatLines.map((line, idx) => (
                                <li key={idx} className="mb-0.5 text-justify">{line}</li>
                            ))}
                        </ol>
                    ) : (
                        <div className="italic text-gray-500 ml-10 text-[10px]">Belum ada hasil kesepakatan.</div>
                    )}

                    <div className="font-bold mt-4 mb-1">II.&nbsp;&nbsp;Lampiran</div>

                    <div className="font-bold underline ml-4 mb-1">A.&nbsp;&nbsp;Daftar Hadir / Absensi</div>
                    <div className="ml-10 mb-2">
                        {data.link_absensi && (
                            <><a href={data.link_absensi} className="text-blue-600 underline break-all">{data.link_absensi}</a><br/></>
                        )}
                        Daftar hadir terlampir ({attendeesCount} peserta tercatat).
                    </div>

                    <div className="font-bold underline ml-4 mb-1 mt-2">B.&nbsp;&nbsp;Dokumentasi Rapat</div>
                    {photos.length > 0 ? (
                        <div className="ml-4 mt-1 pr-4">
                            <table className="w-full border-collapse">
                                <tbody>
                                {Array.from({ length: Math.ceil(photos.length / 2) }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="w-1/2 p-2 text-center align-top">
                                            {photos[i * 2] && (
                                                <>
                                                    <img src={photos[i * 2].foto} alt="doc" className="max-w-full max-h-[150px] border border-gray-400 mx-auto" />
                                                    {photos[i * 2].caption && <div className="text-[9px] text-gray-700 mt-1">{photos[i * 2].caption}</div>}
                                                </>
                                            )}
                                        </td>
                                        <td className="w-1/2 p-2 text-center align-top">
                                            {photos[i * 2 + 1] && (
                                                <>
                                                    <img src={photos[i * 2 + 1].foto} alt="doc" className="max-w-full max-h-[150px] border border-gray-400 mx-auto" />
                                                    {photos[i * 2 + 1].caption && <div className="text-[9px] text-gray-700 mt-1">{photos[i * 2 + 1].caption}</div>}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="italic text-gray-500 ml-10 mb-2 text-[10px]">Belum ada dokumentasi rapat.</div>
                    )}

                    <table className="w-full mt-8">
                        <tbody>
                            <tr>
                                <td className="w-1/2 text-center align-top">
                                    Pimpinan Rapat,
                                    <div className="h-[70px] flex items-center justify-center">
                                        {masterTtds.find(t => t.nama === data.pimpinan_nama)?.signature && (
                                            <img src={masterTtds.find(t => t.nama === data.pimpinan_nama).signature} className="max-h-[60px] max-w-[150px] object-contain" />
                                        )}
                                    </div>
                                    <span className="font-bold underline">{data.pimpinan_nama || '...'}</span><br/>
                                    {data.pimpinan_jabatan || '...'}
                                </td>
                                <td className="w-1/2 text-center align-top">
                                    {data.kota_ttd || 'Kendari'}, {formattedTtdDate}<br/>
                                    Notulis,
                                    <div className="h-[70px] flex items-center justify-center">
                                        {masterTtds.find(t => t.nama === data.notulis_nama)?.signature && (
                                            <img src={masterTtds.find(t => t.nama === data.notulis_nama).signature} className="max-h-[60px] max-w-[150px] object-contain" />
                                        )}
                                    </div>
                                    <span className="font-bold underline">{data.notulis_nama || '...'}</span><br/>
                                    {data.notulis_jabatan || '...'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
