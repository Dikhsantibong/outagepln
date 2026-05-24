import{d as e,f as t,g as n,r,s as i,t as a}from"./jsx-runtime-8fWl2XLY.js";import{t as o}from"./utils-AgFXQWXz.js";import{t as s}from"./circle-check-BBmZLXRV.js";import{a as ee,i as c,n as te,o as l,r as u,s as ne,t as re}from"./table-DPokjwJX.js";import{t as ie}from"./map-pin-1gmWdf_a.js";import{n as ae,t as oe}from"./video-KKCThKq3.js";import{A as se,D as ce,M as le,N as d,T as f,ft as p}from"./app-CcPEkydR.js";import{t as m}from"./label-DbR8jLDz.js";import{a as ue,i as de,n as fe,r as pe,t as me}from"./card-Bct5ffjM.js";import{t as he}from"./badge-DOSGUFdZ.js";import{n as ge,r as _e,t as ve}from"./alert-FqOpKlWC.js";var ye=d(`FileText`,[[`path`,{d:`M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z`,key:`1rqfz7`}],[`path`,{d:`M14 2v4a2 2 0 0 0 2 2h4`,key:`tnqrlb`}],[`path`,{d:`M10 9H8`,key:`b1mrlr`}],[`path`,{d:`M16 13H8`,key:`t4e002`}],[`path`,{d:`M16 17H8`,key:`z1uh3a`}]]),be=d(`Printer`,[[`path`,{d:`M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2`,key:`143wyd`}],[`path`,{d:`M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6`,key:`1itne7`}],[`rect`,{x:`6`,y:`14`,width:`12`,height:`8`,rx:`1`,key:`1ue0tg`}]]),xe=p(),Se=n(e(),1),h=a();function g(e){let t=(0,xe.c)(8),n,r;t[0]===e?(n=t[1],r=t[2]):({className:n,...r}=e,t[0]=e,t[1]=n,t[2]=r);let i;t[3]===n?i=t[4]:(i=o(`border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`,`focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`,`aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive`,n),t[3]=n,t[4]=i);let a;return t[5]!==r||t[6]!==i?(a=(0,h.jsx)(`textarea`,{"data-slot":`textarea`,className:i,...r}),t[5]=r,t[6]=i,t[7]=a):a=t[7],a}function Ce(e){let n=(0,xe.c)(96),{meeting:a,attendees:o,minutes:d}=e,[p,Ce]=(0,Se.useState)(`hadir`),[_,De]=(0,Se.useState)(o),v,y;n[0]!==a.id||n[1]!==a.status?(v=()=>{if(a.status!==`active`)return;let e=setInterval(async()=>{try{De((await(await fetch(`/daily-meetings/${a.id}/attendees-json`)).json()).attendees)}catch{}},5e3);return()=>clearInterval(e)},y=[a.id,a.status],n[0]=a.id,n[1]=a.status,n[2]=v,n[3]=y):(v=n[2],y=n[3]),(0,Se.useEffect)(v,y);let Oe=d?.agenda||``,ke=d?.latar_belakang||``,b=d?.pembahasan||``,Ae=d?.hasil_kesepakatan||``,x;n[4]!==Oe||n[5]!==ke||n[6]!==b||n[7]!==Ae?(x={agenda:Oe,latar_belakang:ke,pembahasan:b,hasil_kesepakatan:Ae},n[4]=Oe,n[5]=ke,n[6]=b,n[7]=Ae,n[8]=x):x=n[8];let S=i(x),C;n[9]!==a.id||n[10]!==S?(C=e=>{e.preventDefault(),S.post(`/daily-meetings/${a.id}/minutes`)},n[9]=a.id,n[10]=S,n[11]=C):C=n[11];let w=C,T;n[12]!==_||n[13]!==a.judul||n[14]!==a.lokasi||n[15]!==a.tanggal||n[16]!==a.waktu_mulai||n[17]!==a.waktu_selesai||n[18]!==S.data?(T=()=>{let e=new Date(a.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),t=a.waktu_mulai?`${a.waktu_mulai.slice(0,5)} Wita${a.waktu_selesai?` - `+a.waktu_selesai.slice(0,5)+` Wita`:` - Selesai`}`:``,n=Ee,r=_.map(Te).join(``),i=S.data,o=`<!DOCTYPE html>
<html>
<head>
    <title>Notulen Rapat - ${a.judul}</title>
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
                <td>${a.lokasi||`-`}</td>
            </tr>
            <tr>
                <td class="label">Perihal</td>
                <td class="sep">:</td>
                <td>${a.judul}</td>
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
        <div class="section-content">${n(i.agenda)}</div>

        <!-- 3. LATAR BELAKANG -->
        <div class="section-title"><span>3.</span> LATAR BELAKANG</div>
        <div class="section-content">${n(i.latar_belakang)}</div>

        <!-- 4. PEMBAHASAN -->
        <div class="section-title"><span>4.</span> PEMBAHASAN</div>
        <div class="section-content">${n(i.pembahasan)}</div>

        <!-- 5. HASIL KESEPAKATAN -->
        <div class="section-title"><span>5.</span> HASIL KESEPAKATAN</div>
        <div class="section-content">${n(i.hasil_kesepakatan)}</div>

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
            <strong>${a.judul}</strong><br/>
            ${e}${t?` | `+t:``}${a.lokasi?` | `+a.lokasi:``}
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
                ${r||`<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">Belum ada peserta</td></tr>`}
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
</html>`,s=window.open(``,`_blank`);s&&(s.document.write(o),s.document.close())},n[12]=_,n[13]=a.judul,n[14]=a.lokasi,n[15]=a.tanggal,n[16]=a.waktu_mulai,n[17]=a.waktu_selesai,n[18]=S.data,n[19]=T):T=n[19];let je=T,E;n[20]===a.id?E=n[21]:(E=()=>{confirm(`Selesaikan meeting ini?`)&&t.post(`/daily-meetings/${a.id}/complete`)},n[20]=a.id,n[21]=E);let Me=E,D;n[22]===_.length?D=n[23]:(D={key:`hadir`,label:`Daftar Hadir`,icon:ce,count:_.length},n[22]=_.length,n[23]=D);let O;n[24]===Symbol.for(`react.memo_cache_sentinel`)?(O={key:`notulen`,label:`Notulen Rapat`,icon:ye},n[24]=O):O=n[24];let k;n[25]===D?k=n[26]:(k=[D,O],n[25]=D,n[26]=k);let Ne=k,Pe=`Meeting: ${a.judul}`,A;n[27]===Pe?A=n[28]:(A=(0,h.jsx)(r,{title:Pe}),n[27]=Pe,n[28]=A);let j;n[29]===a.judul?j=n[30]:(j=(0,h.jsx)(`h1`,{className:`text-2xl font-bold tracking-tight text-foreground`,children:a.judul}),n[29]=a.judul,n[30]=j);let Fe=[`active`,`berlangsung`].includes(a.status)?`default`:`secondary`,Ie=a.status===`berlangsung`?`bg-emerald-500 hover:bg-emerald-600 gap-1.5`:a.status===`active`?`bg-blue-500 hover:bg-blue-600 gap-1.5`:`gap-1.5`,M;n[31]===a.status?M=n[32]:(M=a.status===`berlangsung`?(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-white animate-pulse`}),`Berlangsung`]}):a.status===`active`?(0,h.jsx)(h.Fragment,{children:`Akan Datang`}):(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)(s,{className:`h-3 w-3`}),`Selesai`]}),n[31]=a.status,n[32]=M);let N;n[33]!==Fe||n[34]!==Ie||n[35]!==M?(N=(0,h.jsx)(he,{variant:Fe,className:Ie,children:M}),n[33]=Fe,n[34]=Ie,n[35]=M,n[36]=N):N=n[36];let P;n[37]!==j||n[38]!==N?(P=(0,h.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[j,N]}),n[37]=j,n[38]=N,n[39]=P):P=n[39];let F;n[40]===Symbol.for(`react.memo_cache_sentinel`)?(F=(0,h.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,h.jsx)(le,{className:`h-3.5 w-3.5 text-primary`})}),n[40]=F):F=n[40];let I;n[41]===a.tanggal?I=n[42]:(I=new Date(a.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),n[41]=a.tanggal,n[42]=I);let L;n[43]===I?L=n[44]:(L=(0,h.jsxs)(`div`,{className:`flex items-center gap-2`,children:[F,(0,h.jsx)(`span`,{children:I})]}),n[43]=I,n[44]=L);let R;n[45]!==a.waktu_mulai||n[46]!==a.waktu_selesai?(R=a.waktu_mulai&&(0,h.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,h.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,h.jsx)(se,{className:`h-3.5 w-3.5 text-primary`})}),(0,h.jsxs)(`span`,{children:[a.waktu_mulai.slice(0,5),a.waktu_selesai&&` - ${a.waktu_selesai.slice(0,5)}`]})]}),n[45]=a.waktu_mulai,n[46]=a.waktu_selesai,n[47]=R):R=n[47];let z;n[48]===a.lokasi?z=n[49]:(z=a.lokasi&&(0,h.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,h.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,h.jsx)(ie,{className:`h-3.5 w-3.5 text-primary`})}),(0,h.jsx)(`span`,{children:a.lokasi})]}),n[48]=a.lokasi,n[49]=z);let B;n[50]!==L||n[51]!==R||n[52]!==z?(B=(0,h.jsxs)(`div`,{className:`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground`,children:[L,R,z]}),n[50]=L,n[51]=R,n[52]=z,n[53]=B):B=n[53];let V;n[54]!==P||n[55]!==B?(V=(0,h.jsxs)(`div`,{className:`space-y-4`,children:[P,B]}),n[54]=P,n[55]=B,n[56]=V):V=n[56];let H;n[57]===a.link_meeting?H=n[58]:(H=a.link_meeting&&(0,h.jsxs)(f,{variant:`default`,size:`sm`,className:`gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white`,onClick:()=>window.open(a.link_meeting,`_blank`),children:[(0,h.jsx)(oe,{className:`h-4 w-4`}),`Join Zoom Meeting`]}),n[57]=a.link_meeting,n[58]=H);let U;n[59]===Symbol.for(`react.memo_cache_sentinel`)?(U=(0,h.jsx)(be,{className:`h-4 w-4`}),n[59]=U):U=n[59];let W;n[60]===je?W=n[61]:(W=(0,h.jsxs)(f,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:je,children:[U,`Print Notulen`]}),n[60]=je,n[61]=W);let G;n[62]!==Me||n[63]!==a.id||n[64]!==a.status?(G=[`active`,`berlangsung`].includes(a.status)&&(0,h.jsxs)(h.Fragment,{children:[(0,h.jsxs)(f,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:()=>window.open(`/daily-meetings/${a.id}/qr`,`_blank`),children:[(0,h.jsx)(ae,{className:`h-4 w-4`}),`QR Code`]}),(0,h.jsxs)(f,{variant:`default`,size:`sm`,className:`gap-2 h-9`,onClick:Me,children:[(0,h.jsx)(s,{className:`h-4 w-4`}),`Selesaikan Rapat`]})]}),n[62]=Me,n[63]=a.id,n[64]=a.status,n[65]=G):G=n[65];let K;n[66]!==H||n[67]!==W||n[68]!==G?(K=(0,h.jsxs)(`div`,{className:`flex flex-wrap gap-2 shrink-0`,children:[H,W,G]}),n[66]=H,n[67]=W,n[68]=G,n[69]=K):K=n[69];let q;n[70]!==V||n[71]!==K?(q=(0,h.jsx)(me,{className:`border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20`,children:(0,h.jsx)(fe,{className:`p-6`,children:(0,h.jsxs)(`div`,{className:`flex flex-col md:flex-row md:items-center justify-between gap-6`,children:[V,K]})})}),n[70]=V,n[71]=K,n[72]=q):q=n[72];let J;n[73]!==p||n[74]!==Ne?(J=(0,h.jsx)(`div`,{className:`flex p-1 bg-muted/50 rounded-lg w-fit`,children:Ne.map(e=>(0,h.jsxs)(`button`,{onClick:()=>Ce(e.key),className:`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${p===e.key?`bg-background text-foreground shadow-sm`:`text-muted-foreground hover:text-foreground hover:bg-background/50`}`,children:[(0,h.jsx)(e.icon,{className:`h-4 w-4`}),e.label,`count`in e&&e.count!==void 0&&(0,h.jsx)(he,{variant:`secondary`,className:`ml-1.5 h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold`,children:e.count})]},e.key))}),n[73]=p,n[74]=Ne,n[75]=J):J=n[75];let Y;n[76]!==p||n[77]!==_||n[78]!==a.status?(Y=p===`hadir`&&(0,h.jsxs)(me,{children:[(0,h.jsxs)(de,{className:`flex flex-row items-center justify-between space-y-0 pb-4`,children:[(0,h.jsxs)(`div`,{children:[(0,h.jsx)(ue,{children:`Daftar Hadir Peserta`}),(0,h.jsx)(pe,{children:`Daftar seluruh personil yang telah melakukan absensi`})]}),[`active`,`berlangsung`].includes(a.status)&&(0,h.jsxs)(`div`,{className:`flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium dark:bg-emerald-950/30 dark:text-emerald-400`,children:[(0,h.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse`}),`Auto-refresh 5s`]})]}),(0,h.jsx)(fe,{className:`p-0`,children:(0,h.jsxs)(re,{children:[(0,h.jsx)(ee,{children:(0,h.jsxs)(l,{className:`bg-muted/50 hover:bg-muted/50`,children:[(0,h.jsx)(c,{className:`w-12 text-center font-bold border-r last:border-r-0`,children:`No`}),(0,h.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Nama`}),(0,h.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Divisi / Jabatan`}),(0,h.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Tanda Tangan`}),(0,h.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Waktu Hadir`})]})}),(0,h.jsx)(te,{children:_.length>0?_.map(we):(0,h.jsx)(l,{children:(0,h.jsx)(u,{colSpan:5,className:`h-48 text-center text-muted-foreground`,children:(0,h.jsxs)(`div`,{className:`flex flex-col items-center justify-center space-y-3`,children:[(0,h.jsx)(`div`,{className:`h-12 w-12 rounded-full bg-muted flex items-center justify-center`,children:(0,h.jsx)(ce,{className:`h-6 w-6 opacity-30`})}),(0,h.jsxs)(`div`,{className:`space-y-1`,children:[(0,h.jsx)(`p`,{className:`font-semibold`,children:`Belum ada peserta hadir`}),(0,h.jsx)(`p`,{className:`text-xs max-w-xs mx-auto`,children:`Silakan tampilkan QR Code agar peserta dapat melakukan absensi melalui perangkat masing-masing.`})]})]})})})})]})})]}),n[76]=p,n[77]=_,n[78]=a.status,n[79]=Y):Y=n[79];let X;n[80]!==p||n[81]!==_.length||n[82]!==a.status||n[83]!==S||n[84]!==w?(X=p===`notulen`&&(0,h.jsxs)(me,{children:[(0,h.jsxs)(de,{children:[(0,h.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,h.jsxs)(`div`,{children:[(0,h.jsx)(ue,{children:`Notulen Rapat`}),(0,h.jsx)(pe,{children:`Catatan pembahasan dan hasil kesepakatan rapat`})]}),(0,h.jsxs)(`div`,{className:`flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full`,children:[(0,h.jsx)(ce,{className:`h-3 w-3`}),_.length,` Peserta`]})]}),a.status===`completed`&&(0,h.jsxs)(ve,{className:`mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900`,children:[(0,h.jsx)(ne,{className:`h-4 w-4 text-blue-600 dark:text-blue-400`}),(0,h.jsx)(_e,{className:`text-blue-800 dark:text-blue-300`,children:`Rapat Telah Selesai`}),(0,h.jsx)(ge,{className:`text-blue-700 dark:text-blue-400/80`,children:`Notulen ini telah dikunci dan tidak dapat diedit kembali. Silakan cetak notulen untuk arsip resmi.`})]})]}),(0,h.jsx)(fe,{children:(0,h.jsxs)(`form`,{onSubmit:w,className:`space-y-8`,children:[(0,h.jsxs)(`div`,{className:`grid gap-6`,children:[(0,h.jsxs)(`div`,{className:`space-y-2`,children:[(0,h.jsx)(m,{htmlFor:`agenda`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Agenda Rapat`}),(0,h.jsx)(g,{id:`agenda`,value:S.data.agenda,onChange:e=>S.setData(`agenda`,e.target.value),placeholder:`Sebutkan poin-poin agenda rapat...`,className:`min-h-[100px] resize-none focus-visible:ring-primary/20`,disabled:a.status===`completed`})]}),(0,h.jsxs)(`div`,{className:`space-y-2`,children:[(0,h.jsx)(m,{htmlFor:`latar_belakang`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Latar Belakang`}),(0,h.jsx)(g,{id:`latar_belakang`,value:S.data.latar_belakang,onChange:e=>S.setData(`latar_belakang`,e.target.value),placeholder:`Latar belakang diadakannya rapat ini...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:a.status===`completed`})]}),(0,h.jsxs)(`div`,{className:`space-y-2`,children:[(0,h.jsx)(m,{htmlFor:`pembahasan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Pembahasan`}),(0,h.jsx)(g,{id:`pembahasan`,value:S.data.pembahasan,onChange:e=>S.setData(`pembahasan`,e.target.value),placeholder:`Rincian pembahasan rapat...`,className:`min-h-[200px] resize-none focus-visible:ring-primary/20`,disabled:a.status===`completed`})]}),(0,h.jsxs)(`div`,{className:`space-y-2`,children:[(0,h.jsx)(m,{htmlFor:`hasil_kesepakatan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Hasil Kesepakatan`}),(0,h.jsx)(g,{id:`hasil_kesepakatan`,value:S.data.hasil_kesepakatan,onChange:e=>S.setData(`hasil_kesepakatan`,e.target.value),placeholder:`Poin-poin kesepakatan akhir...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:a.status===`completed`})]})]}),[`active`,`berlangsung`].includes(a.status)&&(0,h.jsx)(`div`,{className:`flex justify-end pt-4 border-t`,children:(0,h.jsxs)(f,{type:`submit`,disabled:S.processing,className:`gap-2 px-8`,children:[(0,h.jsx)(ye,{className:`h-4 w-4`}),`Simpan Notulen`]})})]})})]}),n[80]=p,n[81]=_.length,n[82]=a.status,n[83]=S,n[84]=w,n[85]=X):X=n[85];let Z;n[86]!==Y||n[87]!==X?(Z=(0,h.jsxs)(`div`,{className:`animate-in fade-in slide-in-from-bottom-2 duration-300`,children:[Y,X]}),n[86]=Y,n[87]=X,n[88]=Z):Z=n[88];let Q;n[89]!==q||n[90]!==J||n[91]!==Z?(Q=(0,h.jsxs)(`div`,{className:`flex h-full flex-1 flex-col gap-6 p-4`,children:[q,J,Z]}),n[89]=q,n[90]=J,n[91]=Z,n[92]=Q):Q=n[92];let $;return n[93]!==A||n[94]!==Q?($=(0,h.jsxs)(h.Fragment,{children:[A,Q]}),n[93]=A,n[94]=Q,n[95]=$):$=n[95],$}function we(e,t){return(0,h.jsxs)(l,{className:`hover:bg-muted/30`,children:[(0,h.jsx)(u,{className:`text-center text-muted-foreground font-mono border-r last:border-r-0`,children:t+1}),(0,h.jsx)(u,{className:`font-semibold text-foreground border-r last:border-r-0`,children:e.nama}),(0,h.jsx)(u,{className:`border-r last:border-r-0`,children:(0,h.jsxs)(`div`,{className:`flex flex-col`,children:[(0,h.jsx)(`span`,{className:`text-sm font-medium`,children:e.divisi||`-`}),(0,h.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:e.jabatan||`-`})]})}),(0,h.jsx)(u,{className:`flex justify-center border-r last:border-r-0`,children:e.signature?(0,h.jsx)(`div`,{className:`p-1 rounded border bg-white shadow-sm overflow-hidden flex items-center justify-center`,children:(0,h.jsx)(`img`,{src:e.signature,alt:`TTD`,className:`h-10 w-auto object-contain`})}):(0,h.jsx)(`span`,{className:`text-muted-foreground italic text-xs`,children:`Belum TTD`})}),(0,h.jsx)(u,{className:`text-right text-muted-foreground font-medium border-r last:border-r-0`,children:e.signed_at?new Date(e.signed_at).toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`}):`-`})]},e.id)}function Te(e,t){return`<tr>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">${t+1}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.nama}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.divisi||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.jabatan||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">
                    ${e.signature?`<img src="${e.signature}" style="height:35px;width:auto;" />`:`-`}
                </td>
            </tr>`}function Ee(e){return e?e.replace(/\n/g,`<br/>`):`-`}Ce.layout={breadcrumbs:[{title:`Daily Meeting`,href:`/daily-meetings`},{title:`Detail Meeting`,href:`#`}]};export{Ce as default};