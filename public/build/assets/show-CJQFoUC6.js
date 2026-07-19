import{d as e,f as t,g as n,l as r,r as i,s as a,t as o}from"./jsx-runtime-8fWl2XLY.js";import{t as s}from"./utils-AgFXQWXz.js";import{t as ee}from"./circle-check-_HWQm8Ca.js";import{a as te,i as c,n as ne,o as re,r as l,s as ie,t as ae}from"./table-C1l3f18w.js";import{t as oe}from"./map-pin-4ZAR-SUd.js";import{n as se,t as ce}from"./video-DuusGqpI.js";import{A as le,D as ue,M as de,P as u,T as d,pt as fe}from"./app-CBAXml55.js";import{t as f}from"./label-CfYhnmAr.js";import{a as pe,i as me,n as he,r as ge,t as _e}from"./card-DsiNNEu9.js";import{t as ve}from"./badge-BzR9c1EA.js";import{n as ye,r as be,t as xe}from"./alert-D9-Qt9Pc.js";var Se=u(`FileText`,[[`path`,{d:`M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z`,key:`1rqfz7`}],[`path`,{d:`M14 2v4a2 2 0 0 0 2 2h4`,key:`tnqrlb`}],[`path`,{d:`M10 9H8`,key:`b1mrlr`}],[`path`,{d:`M16 13H8`,key:`t4e002`}],[`path`,{d:`M16 17H8`,key:`z1uh3a`}]]),Ce=u(`Printer`,[[`path`,{d:`M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2`,key:`143wyd`}],[`path`,{d:`M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6`,key:`1itne7`}],[`rect`,{x:`6`,y:`14`,width:`12`,height:`8`,rx:`1`,key:`1ue0tg`}]]),we=fe(),Te=n(e(),1),p=o();function m(e){let t=(0,we.c)(8),n,r;t[0]===e?(n=t[1],r=t[2]):({className:n,...r}=e,t[0]=e,t[1]=n,t[2]=r);let i;t[3]===n?i=t[4]:(i=s(`border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`,`focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`,`aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive`,n),t[3]=n,t[4]=i);let a;return t[5]!==r||t[6]!==i?(a=(0,p.jsx)(`textarea`,{"data-slot":`textarea`,className:i,...r}),t[5]=r,t[6]=i,t[7]=a):a=t[7],a}function h(e){let n=(0,we.c)(98),{meeting:o,attendees:s,minutes:u}=e,{auth:fe}=r().props,h=fe?.user?.role===`tamu`,[g,ke]=(0,Te.useState)(`hadir`),[_,Ae]=(0,Te.useState)(s),v,y;n[0]!==o.id||n[1]!==o.status?(v=()=>{if(o.status!==`active`)return;let e=setInterval(async()=>{try{Ae((await(await fetch(`/daily-meetings/${o.id}/attendees-json`)).json()).attendees)}catch{}},5e3);return()=>clearInterval(e)},y=[o.id,o.status],n[0]=o.id,n[1]=o.status,n[2]=v,n[3]=y):(v=n[2],y=n[3]),(0,Te.useEffect)(v,y);let je=u?.agenda||``,Me=u?.latar_belakang||``,b=u?.pembahasan||``,x=u?.hasil_kesepakatan||``,S;n[4]!==je||n[5]!==Me||n[6]!==b||n[7]!==x?(S={agenda:je,latar_belakang:Me,pembahasan:b,hasil_kesepakatan:x},n[4]=je,n[5]=Me,n[6]=b,n[7]=x,n[8]=S):S=n[8];let C=a(S),w;n[9]!==o.id||n[10]!==C?(w=e=>{e.preventDefault(),C.post(`/daily-meetings/${o.id}/minutes`)},n[9]=o.id,n[10]=C,n[11]=w):w=n[11];let Ne=w,T;n[12]!==_||n[13]!==o.judul||n[14]!==o.lokasi||n[15]!==o.tanggal||n[16]!==o.waktu_mulai||n[17]!==o.waktu_selesai||n[18]!==C.data?(T=()=>{let e=new Date(o.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),t=o.waktu_mulai?`${o.waktu_mulai.slice(0,5)} Wita${o.waktu_selesai?` - `+o.waktu_selesai.slice(0,5)+` Wita`:` - Selesai`}`:``,n=Oe,r=_.map(De).join(``),i=C.data,a=`<!DOCTYPE html>
<html>
<head>
    <title>Notulen Rapat - ${o.judul}</title>
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
                <td>${o.lokasi||`-`}</td>
            </tr>
            <tr>
                <td class="label">Perihal</td>
                <td class="sep">:</td>
                <td>${o.judul}</td>
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
            <strong>${o.judul}</strong><br/>
            ${e}${t?` | `+t:``}${o.lokasi?` | `+o.lokasi:``}
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
</html>`,s=window.open(``,`_blank`);s&&(s.document.write(a),s.document.close())},n[12]=_,n[13]=o.judul,n[14]=o.lokasi,n[15]=o.tanggal,n[16]=o.waktu_mulai,n[17]=o.waktu_selesai,n[18]=C.data,n[19]=T):T=n[19];let Pe=T,E;n[20]===o.id?E=n[21]:(E=()=>{confirm(`Selesaikan meeting ini?`)&&t.post(`/daily-meetings/${o.id}/complete`)},n[20]=o.id,n[21]=E);let Fe=E,D;n[22]===_.length?D=n[23]:(D={key:`hadir`,label:`Daftar Hadir`,icon:ue,count:_.length},n[22]=_.length,n[23]=D);let O;n[24]===Symbol.for(`react.memo_cache_sentinel`)?(O={key:`notulen`,label:`Notulen Rapat`,icon:Se},n[24]=O):O=n[24];let k;n[25]===D?k=n[26]:(k=[D,O],n[25]=D,n[26]=k);let Ie=k,Le=`Meeting: ${o.judul}`,A;n[27]===Le?A=n[28]:(A=(0,p.jsx)(i,{title:Le}),n[27]=Le,n[28]=A);let j;n[29]===o.judul?j=n[30]:(j=(0,p.jsx)(`h1`,{className:`text-2xl font-bold tracking-tight text-foreground`,children:o.judul}),n[29]=o.judul,n[30]=j);let Re=[`active`,`berlangsung`].includes(o.status)?`default`:`secondary`,ze=o.status===`berlangsung`?`bg-emerald-500 hover:bg-emerald-600 gap-1.5`:o.status===`active`?`bg-blue-500 hover:bg-blue-600 gap-1.5`:`gap-1.5`,M;n[31]===o.status?M=n[32]:(M=o.status===`berlangsung`?(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-white animate-pulse`}),`Berlangsung`]}):o.status===`active`?(0,p.jsx)(p.Fragment,{children:`Akan Datang`}):(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(ee,{className:`h-3 w-3`}),`Selesai`]}),n[31]=o.status,n[32]=M);let N;n[33]!==Re||n[34]!==ze||n[35]!==M?(N=(0,p.jsx)(ve,{variant:Re,className:ze,children:M}),n[33]=Re,n[34]=ze,n[35]=M,n[36]=N):N=n[36];let P;n[37]!==j||n[38]!==N?(P=(0,p.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[j,N]}),n[37]=j,n[38]=N,n[39]=P):P=n[39];let F;n[40]===Symbol.for(`react.memo_cache_sentinel`)?(F=(0,p.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,p.jsx)(de,{className:`h-3.5 w-3.5 text-primary`})}),n[40]=F):F=n[40];let I;n[41]===o.tanggal?I=n[42]:(I=new Date(o.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),n[41]=o.tanggal,n[42]=I);let L;n[43]===I?L=n[44]:(L=(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[F,(0,p.jsx)(`span`,{children:I})]}),n[43]=I,n[44]=L);let R;n[45]!==o.waktu_mulai||n[46]!==o.waktu_selesai?(R=o.waktu_mulai&&(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,p.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,p.jsx)(le,{className:`h-3.5 w-3.5 text-primary`})}),(0,p.jsxs)(`span`,{children:[o.waktu_mulai.slice(0,5),o.waktu_selesai&&` - ${o.waktu_selesai.slice(0,5)}`]})]}),n[45]=o.waktu_mulai,n[46]=o.waktu_selesai,n[47]=R):R=n[47];let z;n[48]===o.lokasi?z=n[49]:(z=o.lokasi&&(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,p.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,p.jsx)(oe,{className:`h-3.5 w-3.5 text-primary`})}),(0,p.jsx)(`span`,{children:o.lokasi})]}),n[48]=o.lokasi,n[49]=z);let B;n[50]!==L||n[51]!==R||n[52]!==z?(B=(0,p.jsxs)(`div`,{className:`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground`,children:[L,R,z]}),n[50]=L,n[51]=R,n[52]=z,n[53]=B):B=n[53];let V;n[54]!==P||n[55]!==B?(V=(0,p.jsxs)(`div`,{className:`space-y-4`,children:[P,B]}),n[54]=P,n[55]=B,n[56]=V):V=n[56];let H;n[57]===o.link_meeting?H=n[58]:(H=o.link_meeting&&(0,p.jsxs)(d,{variant:`default`,size:`sm`,className:`gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white`,onClick:()=>window.open(o.link_meeting,`_blank`),children:[(0,p.jsx)(ce,{className:`h-4 w-4`}),`Join Zoom Meeting`]}),n[57]=o.link_meeting,n[58]=H);let U;n[59]===Symbol.for(`react.memo_cache_sentinel`)?(U=(0,p.jsx)(Ce,{className:`h-4 w-4`}),n[59]=U):U=n[59];let W;n[60]===Pe?W=n[61]:(W=(0,p.jsxs)(d,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:Pe,children:[U,`Print Notulen`]}),n[60]=Pe,n[61]=W);let G;n[62]!==Fe||n[63]!==h||n[64]!==o.id||n[65]!==o.status?(G=[`active`,`berlangsung`].includes(o.status)&&!h&&(0,p.jsxs)(p.Fragment,{children:[(0,p.jsxs)(d,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:()=>window.open(`/daily-meetings/${o.id}/qr`,`_blank`),children:[(0,p.jsx)(se,{className:`h-4 w-4`}),`QR Code`]}),(0,p.jsxs)(d,{variant:`default`,size:`sm`,className:`gap-2 h-9`,onClick:Fe,children:[(0,p.jsx)(ee,{className:`h-4 w-4`}),`Selesaikan Rapat`]})]}),n[62]=Fe,n[63]=h,n[64]=o.id,n[65]=o.status,n[66]=G):G=n[66];let K;n[67]!==H||n[68]!==W||n[69]!==G?(K=(0,p.jsxs)(`div`,{className:`flex flex-wrap gap-2 shrink-0`,children:[H,W,G]}),n[67]=H,n[68]=W,n[69]=G,n[70]=K):K=n[70];let q;n[71]!==V||n[72]!==K?(q=(0,p.jsx)(_e,{className:`border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20`,children:(0,p.jsx)(he,{className:`p-6`,children:(0,p.jsxs)(`div`,{className:`flex flex-col md:flex-row md:items-center justify-between gap-6`,children:[V,K]})})}),n[71]=V,n[72]=K,n[73]=q):q=n[73];let J;n[74]!==g||n[75]!==Ie?(J=(0,p.jsx)(`div`,{className:`flex p-1 bg-muted/50 rounded-lg w-fit`,children:Ie.map(e=>(0,p.jsxs)(`button`,{onClick:()=>ke(e.key),className:`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${g===e.key?`bg-background text-foreground shadow-sm`:`text-muted-foreground hover:text-foreground hover:bg-background/50`}`,children:[(0,p.jsx)(e.icon,{className:`h-4 w-4`}),e.label,`count`in e&&e.count!==void 0&&(0,p.jsx)(ve,{variant:`secondary`,className:`ml-1.5 h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold`,children:e.count})]},e.key))}),n[74]=g,n[75]=Ie,n[76]=J):J=n[76];let Y;n[77]!==g||n[78]!==_||n[79]!==o.status?(Y=g===`hadir`&&(0,p.jsxs)(_e,{children:[(0,p.jsxs)(me,{className:`flex flex-row items-center justify-between space-y-0 pb-4`,children:[(0,p.jsxs)(`div`,{children:[(0,p.jsx)(pe,{children:`Daftar Hadir Peserta`}),(0,p.jsx)(ge,{children:`Daftar seluruh personil yang telah melakukan absensi`})]}),[`active`,`berlangsung`].includes(o.status)&&(0,p.jsxs)(`div`,{className:`flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium dark:bg-emerald-950/30 dark:text-emerald-400`,children:[(0,p.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse`}),`Auto-refresh 5s`]})]}),(0,p.jsx)(he,{className:`p-0`,children:(0,p.jsxs)(ae,{children:[(0,p.jsx)(te,{children:(0,p.jsxs)(re,{className:`bg-muted/50 hover:bg-muted/50`,children:[(0,p.jsx)(c,{className:`w-12 text-center font-bold border-r last:border-r-0`,children:`No`}),(0,p.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Nama`}),(0,p.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Divisi / Jabatan`}),(0,p.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Tanda Tangan`}),(0,p.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Waktu Hadir`})]})}),(0,p.jsx)(ne,{children:_.length>0?_.map(Ee):(0,p.jsx)(re,{children:(0,p.jsx)(l,{colSpan:5,className:`h-48 text-center text-muted-foreground`,children:(0,p.jsxs)(`div`,{className:`flex flex-col items-center justify-center space-y-3`,children:[(0,p.jsx)(`div`,{className:`h-12 w-12 rounded-full bg-muted flex items-center justify-center`,children:(0,p.jsx)(ue,{className:`h-6 w-6 opacity-30`})}),(0,p.jsxs)(`div`,{className:`space-y-1`,children:[(0,p.jsx)(`p`,{className:`font-semibold`,children:`Belum ada peserta hadir`}),(0,p.jsx)(`p`,{className:`text-xs max-w-xs mx-auto`,children:`Silakan tampilkan QR Code agar peserta dapat melakukan absensi melalui perangkat masing-masing.`})]})]})})})})]})})]}),n[77]=g,n[78]=_,n[79]=o.status,n[80]=Y):Y=n[80];let X;n[81]!==g||n[82]!==_.length||n[83]!==h||n[84]!==o.status||n[85]!==C||n[86]!==Ne?(X=g===`notulen`&&(0,p.jsxs)(_e,{children:[(0,p.jsxs)(me,{children:[(0,p.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,p.jsxs)(`div`,{children:[(0,p.jsx)(pe,{children:`Notulen Rapat`}),(0,p.jsx)(ge,{children:`Catatan pembahasan dan hasil kesepakatan rapat`})]}),(0,p.jsxs)(`div`,{className:`flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full`,children:[(0,p.jsx)(ue,{className:`h-3 w-3`}),_.length,` Peserta`]})]}),o.status===`completed`&&(0,p.jsxs)(xe,{className:`mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900`,children:[(0,p.jsx)(ie,{className:`h-4 w-4 text-blue-600 dark:text-blue-400`}),(0,p.jsx)(be,{className:`text-blue-800 dark:text-blue-300`,children:`Rapat Telah Selesai`}),(0,p.jsx)(ye,{className:`text-blue-700 dark:text-blue-400/80`,children:`Notulen ini telah dikunci dan tidak dapat diedit kembali. Silakan cetak notulen untuk arsip resmi.`})]})]}),(0,p.jsx)(he,{children:(0,p.jsxs)(`form`,{onSubmit:Ne,className:`space-y-8`,children:[(0,p.jsxs)(`div`,{className:`grid gap-6`,children:[(0,p.jsxs)(`div`,{className:`space-y-2`,children:[(0,p.jsx)(f,{htmlFor:`agenda`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Agenda Rapat`}),(0,p.jsx)(m,{id:`agenda`,value:C.data.agenda,onChange:e=>C.setData(`agenda`,e.target.value),placeholder:`Sebutkan poin-poin agenda rapat...`,className:`min-h-[100px] resize-none focus-visible:ring-primary/20`,disabled:o.status===`completed`||h})]}),(0,p.jsxs)(`div`,{className:`space-y-2`,children:[(0,p.jsx)(f,{htmlFor:`latar_belakang`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Latar Belakang`}),(0,p.jsx)(m,{id:`latar_belakang`,value:C.data.latar_belakang,onChange:e=>C.setData(`latar_belakang`,e.target.value),placeholder:`Latar belakang diadakannya rapat ini...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:o.status===`completed`})]}),(0,p.jsxs)(`div`,{className:`space-y-2`,children:[(0,p.jsx)(f,{htmlFor:`pembahasan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Pembahasan`}),(0,p.jsx)(m,{id:`pembahasan`,value:C.data.pembahasan,onChange:e=>C.setData(`pembahasan`,e.target.value),placeholder:`Rincian pembahasan rapat...`,className:`min-h-[200px] resize-none focus-visible:ring-primary/20`,disabled:o.status===`completed`||h})]}),(0,p.jsxs)(`div`,{className:`space-y-2`,children:[(0,p.jsx)(f,{htmlFor:`hasil_kesepakatan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Hasil Kesepakatan`}),(0,p.jsx)(m,{id:`hasil_kesepakatan`,value:C.data.hasil_kesepakatan,onChange:e=>C.setData(`hasil_kesepakatan`,e.target.value),placeholder:`Poin-poin kesepakatan akhir...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:o.status===`completed`})]})]}),[`active`,`berlangsung`].includes(o.status)&&!h&&(0,p.jsx)(`div`,{className:`flex justify-end pt-4 border-t`,children:(0,p.jsxs)(d,{type:`submit`,disabled:C.processing,className:`gap-2 px-8`,children:[(0,p.jsx)(Se,{className:`h-4 w-4`}),`Simpan Notulen`]})})]})})]}),n[81]=g,n[82]=_.length,n[83]=h,n[84]=o.status,n[85]=C,n[86]=Ne,n[87]=X):X=n[87];let Z;n[88]!==Y||n[89]!==X?(Z=(0,p.jsxs)(`div`,{className:`animate-in fade-in slide-in-from-bottom-2 duration-300`,children:[Y,X]}),n[88]=Y,n[89]=X,n[90]=Z):Z=n[90];let Q;n[91]!==q||n[92]!==J||n[93]!==Z?(Q=(0,p.jsxs)(`div`,{className:`flex h-full flex-1 flex-col gap-6 p-4`,children:[q,J,Z]}),n[91]=q,n[92]=J,n[93]=Z,n[94]=Q):Q=n[94];let $;return n[95]!==A||n[96]!==Q?($=(0,p.jsxs)(p.Fragment,{children:[A,Q]}),n[95]=A,n[96]=Q,n[97]=$):$=n[97],$}function Ee(e,t){return(0,p.jsxs)(re,{className:`hover:bg-muted/30`,children:[(0,p.jsx)(l,{className:`text-center text-muted-foreground font-mono border-r last:border-r-0`,children:t+1}),(0,p.jsx)(l,{className:`font-semibold text-foreground border-r last:border-r-0`,children:e.nama}),(0,p.jsx)(l,{className:`border-r last:border-r-0`,children:(0,p.jsxs)(`div`,{className:`flex flex-col`,children:[(0,p.jsx)(`span`,{className:`text-sm font-medium`,children:e.divisi||`-`}),(0,p.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:e.jabatan||`-`})]})}),(0,p.jsx)(l,{className:`flex justify-center border-r last:border-r-0`,children:e.signature?(0,p.jsx)(`div`,{className:`p-1 rounded border bg-white shadow-sm overflow-hidden flex items-center justify-center`,children:(0,p.jsx)(`img`,{src:e.signature,alt:`TTD`,className:`h-10 w-auto object-contain`})}):(0,p.jsx)(`span`,{className:`text-muted-foreground italic text-xs`,children:`Belum TTD`})}),(0,p.jsx)(l,{className:`text-right text-muted-foreground font-medium border-r last:border-r-0`,children:e.signed_at?new Date(e.signed_at).toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`}):`-`})]},e.id)}function De(e,t){return`<tr>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">${t+1}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.nama}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.divisi||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.jabatan||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">
                    ${e.signature?`<img src="${e.signature}" style="height:35px;width:auto;" />`:`-`}
                </td>
            </tr>`}function Oe(e){return e?e.replace(/\n/g,`<br/>`):`-`}h.layout={breadcrumbs:[{title:`Daily Meeting`,href:`/daily-meetings`},{title:`Detail Meeting`,href:`#`}]};export{h as default};