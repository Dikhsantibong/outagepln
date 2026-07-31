import{d as e,f as t,g as n,l as ee,r,s as te,t as i}from"./jsx-runtime-8fWl2XLY.js";import{t as a}from"./circle-check-DPgtVMde.js";import{t as ne}from"./file-text-BwuTfft5.js";import{t as re}from"./info-D04eRr6b.js";import{t as ie}from"./map-pin-Go-RGV5Z.js";import{t as ae}from"./qr-code-BfTbM_jj.js";import{t as oe}from"./video-B95ZgHtF.js";import{A as se,D as ce,F as le,N as ue,T as o,ht as s}from"./app-D_wiY2Rg.js";import{t as c}from"./label-scOnEcYI.js";import{a as de,i as fe,n as l,r as pe,t as me}from"./card-COsw9MM1.js";import{t as he}from"./badge-69X7ORPg.js";import{a as ge,i as u,n as _e,o as ve,r as d,t as ye}from"./table-CexTwBzo.js";import{t as f}from"./textarea-Ee6SiMaL.js";import{n as be,r as xe,t as Se}from"./alert-CMj73emb.js";var Ce=le(`Printer`,[[`path`,{d:`M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2`,key:`143wyd`}],[`path`,{d:`M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6`,key:`1itne7`}],[`rect`,{x:`6`,y:`14`,width:`12`,height:`8`,rx:`1`,key:`1ue0tg`}]]),we=s(),p=n(e(),1),m=i();function Te(e){let n=(0,we.c)(98),{meeting:i,attendees:le,minutes:s}=e,{auth:Te}=ee().props,h=Te?.user?.role===`tamu`,[g,ke]=(0,p.useState)(`hadir`),[_,Ae]=(0,p.useState)(le),v,y;n[0]!==i.id||n[1]!==i.status?(v=()=>{if(i.status!==`active`)return;let e=setInterval(async()=>{try{Ae((await(await fetch(`/daily-meetings/${i.id}/attendees-json`)).json()).attendees)}catch{}},5e3);return()=>clearInterval(e)},y=[i.id,i.status],n[0]=i.id,n[1]=i.status,n[2]=v,n[3]=y):(v=n[2],y=n[3]),(0,p.useEffect)(v,y);let je=s?.agenda||``,Me=s?.latar_belakang||``,Ne=s?.pembahasan||``,Pe=s?.hasil_kesepakatan||``,b;n[4]!==je||n[5]!==Me||n[6]!==Ne||n[7]!==Pe?(b={agenda:je,latar_belakang:Me,pembahasan:Ne,hasil_kesepakatan:Pe},n[4]=je,n[5]=Me,n[6]=Ne,n[7]=Pe,n[8]=b):b=n[8];let x=te(b),S;n[9]!==i.id||n[10]!==x?(S=e=>{e.preventDefault(),x.post(`/daily-meetings/${i.id}/minutes`)},n[9]=i.id,n[10]=x,n[11]=S):S=n[11];let Fe=S,C;n[12]!==_||n[13]!==i.judul||n[14]!==i.lokasi||n[15]!==i.tanggal||n[16]!==i.waktu_mulai||n[17]!==i.waktu_selesai||n[18]!==x.data?(C=()=>{let e=new Date(i.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),t=i.waktu_mulai?`${i.waktu_mulai.slice(0,5)} Wita${i.waktu_selesai?` - `+i.waktu_selesai.slice(0,5)+` Wita`:` - Selesai`}`:``,n=Oe,ee=_.map(De).join(``),r=x.data,te=`<!DOCTYPE html>
<html>
<head>
    <title>Notulen Rapat - ${i.judul}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            color: #000;
            line-height: 1.4;
            background-color: #fff;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm 25mm 20mm;
            margin: 0 auto;
            position: relative;
            background: white;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 2.5px solid #003d7a;
            margin-bottom: 25px;
        }
        .header-left {
            font-size: 10pt;
            font-weight: bold;
            color: #c00000;
            line-height: 1.2;
            text-transform: uppercase;
        }
        .header-right img {
            height: 45px;
            width: auto;
        }
        .title {
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 20px;
            text-align: left;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 11pt;
        }
        .info-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .info-table .label {
            width: 180px;
        }
        .info-table .sep {
            width: 20px;
            text-align: center;
        }
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 15px 0 5px 0;
            display: flex;
        }
        .section-title span { margin-right: 10px; }
        .section-content {
            margin-left: 28px;
            margin-bottom: 15px;
            font-size: 11pt;
            text-align: justify;
            min-height: 20px;
        }
        .attendance-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-top: 15px;
        }
        .attendance-table th, .attendance-table td {
            border: 1px solid #000;
            padding: 8px 10px;
        }
        .attendance-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
        }
        .attendance-table td {
            vertical-align: middle;
        }
        .footer-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #003d7a;
            color: white;
            padding: 5px 20mm;
            font-size: 8.5pt;
            font-weight: bold;
            height: 35px;
        }
        .footer-bar img {
            height: 22px;
            width: auto;
            filter: brightness(0) invert(1);
        }
        .confidential {
            position: absolute;
            bottom: 45px;
            left: 20mm;
            font-size: 8pt;
            font-style: italic;
            color: #666;
        }
        .page-break { page-break-before: always; }
        @media print {
            body { background: none; }
            .page { border: none; box-shadow: none; margin: 0; }
            .footer-bar { position: fixed; }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                PT PLN NUSANTARA POWER<br/>UP KENDARI
            </div>
            <div class="header-right">
                <img src="/sidebar-logo.png" alt="Logo PLN" />
            </div>
        </div>

        <!-- Title -->
        <div class="title">NOTULA RAPAT</div>

        <!-- Info Table -->
        <table class="info-table">
            <tr>
                <td class="label">Hari, Tanggal / Waktu</td>
                <td class="sep">:</td>
                <td>${e}${t?` / `+t:``}</td>
            </tr>
            <tr>
                <td class="label">Tempat</td>
                <td class="sep">:</td>
                <td>${i.lokasi||`-`}</td>
            </tr>
            <tr>
                <td class="label">Perihal</td>
                <td class="sep">:</td>
                <td>${i.judul}</td>
            </tr>
            <tr>
                <td class="label">Lampiran</td>
                <td class="sep">:</td>
                <td>1. &nbsp;Daftar Hadir</td>
            </tr>
        </table>

        <!-- 1. DAFTAR PESERTA -->
        <div class="section-title"><span>1.</span> DAFTAR PESERTA</div>
        <div class="section-content">Terlampir</div>

        <!-- 2. AGENDA RAPAT -->
        <div class="section-title"><span>2.</span> AGENDA RAPAT</div>
        <div class="section-content">${n(r.agenda)}</div>

        <!-- 3. LATAR BELAKANG -->
        <div class="section-title"><span>3.</span> LATAR BELAKANG</div>
        <div class="section-content">${n(r.latar_belakang)}</div>

        <!-- 4. PEMBAHASAN -->
        <div class="section-title"><span>4.</span> PEMBAHASAN</div>
        <div class="section-content">${n(r.pembahasan)}</div>

        <!-- 5. HASIL KESEPAKATAN -->
        <div class="section-title"><span>5.</span> HASIL KESEPAKATAN</div>
        <div class="section-content">${n(r.hasil_kesepakatan)}</div>

        <div class="confidential">Confidential</div>

        <!-- Footer Bar -->
        <div class="footer-bar">
            <span>PT PLN NUSANTARA POWER UP KENDARI</span>
            <img src="/sidebar-logo.png" alt="Logo PLN" />
        </div>
    </div>

    <!-- Page 2: Daftar Hadir -->
    <div class="page-break"></div>
    <div class="page">
        <div class="header">
            <div class="header-left">
                PT PLN NUSANTARA POWER<br/>UP KENDARI
            </div>
            <div class="header-right">
                <img src="/sidebar-logo.png" alt="Logo PLN" />
            </div>
        </div>

        <div class="title">LAMPIRAN - DAFTAR HADIR</div>
        <p style="margin-bottom:10px;font-size:11pt;">
            <strong>${i.judul}</strong><br/>
            ${e}${t?` | `+t:``}${i.lokasi?` | `+i.lokasi:``}
        </p>

        <table class="attendance-table">
            <thead>
                <tr>
                    <th style="width:40px;">No</th>
                    <th>Nama</th>
                    <th>Divisi</th>
                    <th>Jabatan</th>
                    <th style="width:120px;">Tanda Tangan</th>
                </tr>
            </thead>
            <tbody>
                ${ee||`<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">Belum ada peserta</td></tr>`}
            </tbody>
        </table>

        <div class="confidential">Confidential</div>

        <!-- Footer Bar -->
        <div class="footer-bar">
            <span>PT PLN NUSANTARA POWER UP KENDARI</span>
            <img src="/sidebar-logo.png" alt="Logo PLN" />
        </div>
    </div>

    <script>
        window.onload = function() { window.print(); };
    <\/script>
</body>
</html>`,a=window.open(``,`_blank`);a&&(a.document.write(te),a.document.close())},n[12]=_,n[13]=i.judul,n[14]=i.lokasi,n[15]=i.tanggal,n[16]=i.waktu_mulai,n[17]=i.waktu_selesai,n[18]=x.data,n[19]=C):C=n[19];let Ie=C,w;n[20]===i.id?w=n[21]:(w=()=>{confirm(`Selesaikan meeting ini?`)&&t.post(`/daily-meetings/${i.id}/complete`)},n[20]=i.id,n[21]=w);let Le=w,T;n[22]===_.length?T=n[23]:(T={key:`hadir`,label:`Daftar Hadir`,icon:ce,count:_.length},n[22]=_.length,n[23]=T);let E;n[24]===Symbol.for(`react.memo_cache_sentinel`)?(E={key:`notulen`,label:`Notulen Rapat`,icon:ne},n[24]=E):E=n[24];let D;n[25]===T?D=n[26]:(D=[T,E],n[25]=T,n[26]=D);let O=D,k=`Meeting: ${i.judul}`,A;n[27]===k?A=n[28]:(A=(0,m.jsx)(r,{title:k}),n[27]=k,n[28]=A);let j;n[29]===i.judul?j=n[30]:(j=(0,m.jsx)(`h1`,{className:`text-2xl font-bold tracking-tight text-foreground`,children:i.judul}),n[29]=i.judul,n[30]=j);let Re=[`active`,`berlangsung`].includes(i.status)?`default`:`secondary`,ze=i.status===`berlangsung`?`bg-emerald-500 hover:bg-emerald-600 gap-1.5`:i.status===`active`?`bg-blue-500 hover:bg-blue-600 gap-1.5`:`gap-1.5`,M;n[31]===i.status?M=n[32]:(M=i.status===`berlangsung`?(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-white animate-pulse`}),`Berlangsung`]}):i.status===`active`?(0,m.jsx)(m.Fragment,{children:`Akan Datang`}):(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(a,{className:`h-3 w-3`}),`Selesai`]}),n[31]=i.status,n[32]=M);let N;n[33]!==Re||n[34]!==ze||n[35]!==M?(N=(0,m.jsx)(he,{variant:Re,className:ze,children:M}),n[33]=Re,n[34]=ze,n[35]=M,n[36]=N):N=n[36];let P;n[37]!==j||n[38]!==N?(P=(0,m.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[j,N]}),n[37]=j,n[38]=N,n[39]=P):P=n[39];let F;n[40]===Symbol.for(`react.memo_cache_sentinel`)?(F=(0,m.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,m.jsx)(ue,{className:`h-3.5 w-3.5 text-primary`})}),n[40]=F):F=n[40];let I;n[41]===i.tanggal?I=n[42]:(I=new Date(i.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),n[41]=i.tanggal,n[42]=I);let L;n[43]===I?L=n[44]:(L=(0,m.jsxs)(`div`,{className:`flex items-center gap-2`,children:[F,(0,m.jsx)(`span`,{children:I})]}),n[43]=I,n[44]=L);let R;n[45]!==i.waktu_mulai||n[46]!==i.waktu_selesai?(R=i.waktu_mulai&&(0,m.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,m.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,m.jsx)(se,{className:`h-3.5 w-3.5 text-primary`})}),(0,m.jsxs)(`span`,{children:[i.waktu_mulai.slice(0,5),i.waktu_selesai&&` - ${i.waktu_selesai.slice(0,5)}`]})]}),n[45]=i.waktu_mulai,n[46]=i.waktu_selesai,n[47]=R):R=n[47];let z;n[48]===i.lokasi?z=n[49]:(z=i.lokasi&&(0,m.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,m.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,m.jsx)(ie,{className:`h-3.5 w-3.5 text-primary`})}),(0,m.jsx)(`span`,{children:i.lokasi})]}),n[48]=i.lokasi,n[49]=z);let B;n[50]!==L||n[51]!==R||n[52]!==z?(B=(0,m.jsxs)(`div`,{className:`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground`,children:[L,R,z]}),n[50]=L,n[51]=R,n[52]=z,n[53]=B):B=n[53];let V;n[54]!==P||n[55]!==B?(V=(0,m.jsxs)(`div`,{className:`space-y-4`,children:[P,B]}),n[54]=P,n[55]=B,n[56]=V):V=n[56];let H;n[57]===i.link_meeting?H=n[58]:(H=i.link_meeting&&(0,m.jsxs)(o,{variant:`default`,size:`sm`,className:`gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white`,onClick:()=>window.open(i.link_meeting,`_blank`),children:[(0,m.jsx)(oe,{className:`h-4 w-4`}),`Join Zoom Meeting`]}),n[57]=i.link_meeting,n[58]=H);let U;n[59]===Symbol.for(`react.memo_cache_sentinel`)?(U=(0,m.jsx)(Ce,{className:`h-4 w-4`}),n[59]=U):U=n[59];let W;n[60]===Ie?W=n[61]:(W=(0,m.jsxs)(o,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:Ie,children:[U,`Print Notulen`]}),n[60]=Ie,n[61]=W);let G;n[62]!==Le||n[63]!==h||n[64]!==i.id||n[65]!==i.status?(G=[`active`,`berlangsung`].includes(i.status)&&!h&&(0,m.jsxs)(m.Fragment,{children:[(0,m.jsxs)(o,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:()=>window.open(`/daily-meetings/${i.id}/qr`,`_blank`),children:[(0,m.jsx)(ae,{className:`h-4 w-4`}),`QR Code`]}),(0,m.jsxs)(o,{variant:`default`,size:`sm`,className:`gap-2 h-9`,onClick:Le,children:[(0,m.jsx)(a,{className:`h-4 w-4`}),`Selesaikan Rapat`]})]}),n[62]=Le,n[63]=h,n[64]=i.id,n[65]=i.status,n[66]=G):G=n[66];let K;n[67]!==H||n[68]!==W||n[69]!==G?(K=(0,m.jsxs)(`div`,{className:`flex flex-wrap gap-2 shrink-0`,children:[H,W,G]}),n[67]=H,n[68]=W,n[69]=G,n[70]=K):K=n[70];let q;n[71]!==V||n[72]!==K?(q=(0,m.jsx)(me,{className:`border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20`,children:(0,m.jsx)(l,{className:`p-6`,children:(0,m.jsxs)(`div`,{className:`flex flex-col md:flex-row md:items-center justify-between gap-6`,children:[V,K]})})}),n[71]=V,n[72]=K,n[73]=q):q=n[73];let J;n[74]!==g||n[75]!==O?(J=(0,m.jsx)(`div`,{className:`flex p-1 bg-muted/50 rounded-lg w-fit`,children:O.map(e=>(0,m.jsxs)(`button`,{onClick:()=>ke(e.key),className:`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${g===e.key?`bg-background text-foreground shadow-sm`:`text-muted-foreground hover:text-foreground hover:bg-background/50`}`,children:[(0,m.jsx)(e.icon,{className:`h-4 w-4`}),e.label,`count`in e&&e.count!==void 0&&(0,m.jsx)(he,{variant:`secondary`,className:`ml-1.5 h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold`,children:e.count})]},e.key))}),n[74]=g,n[75]=O,n[76]=J):J=n[76];let Y;n[77]!==g||n[78]!==_||n[79]!==i.status?(Y=g===`hadir`&&(0,m.jsxs)(me,{children:[(0,m.jsxs)(fe,{className:`flex flex-row items-center justify-between space-y-0 pb-4`,children:[(0,m.jsxs)(`div`,{children:[(0,m.jsx)(de,{children:`Daftar Hadir Peserta`}),(0,m.jsx)(pe,{children:`Daftar seluruh personil yang telah melakukan absensi`})]}),[`active`,`berlangsung`].includes(i.status)&&(0,m.jsxs)(`div`,{className:`flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium dark:bg-emerald-950/30 dark:text-emerald-400`,children:[(0,m.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse`}),`Auto-refresh 5s`]})]}),(0,m.jsx)(l,{className:`p-0`,children:(0,m.jsxs)(ye,{children:[(0,m.jsx)(ge,{children:(0,m.jsxs)(ve,{className:`bg-muted/50 hover:bg-muted/50`,children:[(0,m.jsx)(u,{className:`w-12 text-center font-bold border-r last:border-r-0`,children:`No`}),(0,m.jsx)(u,{className:`text-center font-bold border-r last:border-r-0`,children:`Nama`}),(0,m.jsx)(u,{className:`text-center font-bold border-r last:border-r-0`,children:`Divisi / Jabatan`}),(0,m.jsx)(u,{className:`text-center font-bold border-r last:border-r-0`,children:`Tanda Tangan`}),(0,m.jsx)(u,{className:`text-center font-bold border-r last:border-r-0`,children:`Waktu Hadir`})]})}),(0,m.jsx)(_e,{children:_.length>0?_.map(Ee):(0,m.jsx)(ve,{children:(0,m.jsx)(d,{colSpan:5,className:`h-48 text-center text-muted-foreground`,children:(0,m.jsxs)(`div`,{className:`flex flex-col items-center justify-center space-y-3`,children:[(0,m.jsx)(`div`,{className:`h-12 w-12 rounded-full bg-muted flex items-center justify-center`,children:(0,m.jsx)(ce,{className:`h-6 w-6 opacity-30`})}),(0,m.jsxs)(`div`,{className:`space-y-1`,children:[(0,m.jsx)(`p`,{className:`font-semibold`,children:`Belum ada peserta hadir`}),(0,m.jsx)(`p`,{className:`text-xs max-w-xs mx-auto`,children:`Silakan tampilkan QR Code agar peserta dapat melakukan absensi melalui perangkat masing-masing.`})]})]})})})})]})})]}),n[77]=g,n[78]=_,n[79]=i.status,n[80]=Y):Y=n[80];let X;n[81]!==g||n[82]!==_.length||n[83]!==h||n[84]!==i.status||n[85]!==x||n[86]!==Fe?(X=g===`notulen`&&(0,m.jsxs)(me,{children:[(0,m.jsxs)(fe,{children:[(0,m.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,m.jsxs)(`div`,{children:[(0,m.jsx)(de,{children:`Notulen Rapat`}),(0,m.jsx)(pe,{children:`Catatan pembahasan dan hasil kesepakatan rapat`})]}),(0,m.jsxs)(`div`,{className:`flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full`,children:[(0,m.jsx)(ce,{className:`h-3 w-3`}),_.length,` Peserta`]})]}),i.status===`completed`&&(0,m.jsxs)(Se,{className:`mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900`,children:[(0,m.jsx)(re,{className:`h-4 w-4 text-blue-600 dark:text-blue-400`}),(0,m.jsx)(xe,{className:`text-blue-800 dark:text-blue-300`,children:`Rapat Telah Selesai`}),(0,m.jsx)(be,{className:`text-blue-700 dark:text-blue-400/80`,children:`Notulen ini telah dikunci dan tidak dapat diedit kembali. Silakan cetak notulen untuk arsip resmi.`})]})]}),(0,m.jsx)(l,{children:(0,m.jsxs)(`form`,{onSubmit:Fe,className:`space-y-8`,children:[(0,m.jsxs)(`div`,{className:`grid gap-6`,children:[(0,m.jsxs)(`div`,{className:`space-y-2`,children:[(0,m.jsx)(c,{htmlFor:`agenda`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Agenda Rapat`}),(0,m.jsx)(f,{id:`agenda`,value:x.data.agenda,onChange:e=>x.setData(`agenda`,e.target.value),placeholder:`Sebutkan poin-poin agenda rapat...`,className:`min-h-[100px] resize-none focus-visible:ring-primary/20`,disabled:i.status===`completed`||h})]}),(0,m.jsxs)(`div`,{className:`space-y-2`,children:[(0,m.jsx)(c,{htmlFor:`latar_belakang`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Latar Belakang`}),(0,m.jsx)(f,{id:`latar_belakang`,value:x.data.latar_belakang,onChange:e=>x.setData(`latar_belakang`,e.target.value),placeholder:`Latar belakang diadakannya rapat ini...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:i.status===`completed`})]}),(0,m.jsxs)(`div`,{className:`space-y-2`,children:[(0,m.jsx)(c,{htmlFor:`pembahasan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Pembahasan`}),(0,m.jsx)(f,{id:`pembahasan`,value:x.data.pembahasan,onChange:e=>x.setData(`pembahasan`,e.target.value),placeholder:`Rincian pembahasan rapat...`,className:`min-h-[200px] resize-none focus-visible:ring-primary/20`,disabled:i.status===`completed`||h})]}),(0,m.jsxs)(`div`,{className:`space-y-2`,children:[(0,m.jsx)(c,{htmlFor:`hasil_kesepakatan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Hasil Kesepakatan`}),(0,m.jsx)(f,{id:`hasil_kesepakatan`,value:x.data.hasil_kesepakatan,onChange:e=>x.setData(`hasil_kesepakatan`,e.target.value),placeholder:`Poin-poin kesepakatan akhir...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:i.status===`completed`})]})]}),[`active`,`berlangsung`].includes(i.status)&&!h&&(0,m.jsx)(`div`,{className:`flex justify-end pt-4 border-t`,children:(0,m.jsxs)(o,{type:`submit`,disabled:x.processing,className:`gap-2 px-8`,children:[(0,m.jsx)(ne,{className:`h-4 w-4`}),`Simpan Notulen`]})})]})})]}),n[81]=g,n[82]=_.length,n[83]=h,n[84]=i.status,n[85]=x,n[86]=Fe,n[87]=X):X=n[87];let Z;n[88]!==Y||n[89]!==X?(Z=(0,m.jsxs)(`div`,{className:`animate-in fade-in slide-in-from-bottom-2 duration-300`,children:[Y,X]}),n[88]=Y,n[89]=X,n[90]=Z):Z=n[90];let Q;n[91]!==q||n[92]!==J||n[93]!==Z?(Q=(0,m.jsxs)(`div`,{className:`flex h-full flex-1 flex-col gap-6 p-4`,children:[q,J,Z]}),n[91]=q,n[92]=J,n[93]=Z,n[94]=Q):Q=n[94];let $;return n[95]!==A||n[96]!==Q?($=(0,m.jsxs)(m.Fragment,{children:[A,Q]}),n[95]=A,n[96]=Q,n[97]=$):$=n[97],$}function Ee(e,t){return(0,m.jsxs)(ve,{className:`hover:bg-muted/30`,children:[(0,m.jsx)(d,{className:`text-center text-muted-foreground font-mono border-r last:border-r-0`,children:t+1}),(0,m.jsx)(d,{className:`font-semibold text-foreground border-r last:border-r-0`,children:e.nama}),(0,m.jsx)(d,{className:`border-r last:border-r-0`,children:(0,m.jsxs)(`div`,{className:`flex flex-col`,children:[(0,m.jsx)(`span`,{className:`text-sm font-medium`,children:e.divisi||`-`}),(0,m.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:e.jabatan||`-`})]})}),(0,m.jsx)(d,{className:`flex justify-center border-r last:border-r-0`,children:e.signature?(0,m.jsx)(`div`,{className:`p-1 rounded border bg-white shadow-sm overflow-hidden flex items-center justify-center`,children:(0,m.jsx)(`img`,{src:e.signature,alt:`TTD`,className:`h-10 w-auto object-contain`})}):(0,m.jsx)(`span`,{className:`text-muted-foreground italic text-xs`,children:`Belum TTD`})}),(0,m.jsx)(d,{className:`text-right text-muted-foreground font-medium border-r last:border-r-0`,children:e.signed_at?new Date(e.signed_at).toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`}):`-`})]},e.id)}function De(e,t){return`<tr>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">${t+1}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.nama}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.divisi||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.jabatan||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">
                    ${e.signature?`<img src="${e.signature}" style="height:35px;width:auto;" />`:`-`}
                </td>
            </tr>`}function Oe(e){return e?e.replace(/\n/g,`<br/>`):`-`}Te.layout={breadcrumbs:[{title:`Daily Meeting`,href:`/daily-meetings`},{title:`Detail Meeting`,href:`#`}]};export{Te as default};