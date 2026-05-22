import{d as e,f as t,g as n,r as ee,s as r,t as i}from"./jsx-runtime-8fWl2XLY.js";import{t as te}from"./circle-check-BxnKtSnh.js";import{t as a}from"./info-C1-2eZai.js";import{t as ne}from"./map-pin-C54Qnr8D.js";import{t as re}from"./qr-code-HkgBJ4JK.js";import{D as ie,F as ae,M as oe,P as se,T as o,mt as s}from"./app-6tXVihpr.js";import{t as c}from"./label-JtGKhLor.js";import{a as ce,i as le,n as ue,r as de,t as fe}from"./card-C0l8jZsF.js";import{t as pe}from"./badge-J2J5wXM_.js";import{a as me,i as l,n as he,o as ge,r as u,t as _e}from"./table-dBqDj9EV.js";import{t as d}from"./textarea-BDagdHM_.js";import{n as ve,r as ye,t as be}from"./alert-C_MHyWrT.js";var xe=ae(`FileText`,[[`path`,{d:`M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z`,key:`1rqfz7`}],[`path`,{d:`M14 2v4a2 2 0 0 0 2 2h4`,key:`tnqrlb`}],[`path`,{d:`M10 9H8`,key:`b1mrlr`}],[`path`,{d:`M16 13H8`,key:`t4e002`}],[`path`,{d:`M16 17H8`,key:`z1uh3a`}]]),Se=ae(`Printer`,[[`path`,{d:`M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2`,key:`143wyd`}],[`path`,{d:`M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6`,key:`1itne7`}],[`rect`,{x:`6`,y:`14`,width:`12`,height:`8`,rx:`1`,key:`1ue0tg`}]]),Ce=s(),we=n(e(),1),f=i();function p(e){let n=(0,Ce.c)(93),{meeting:i,attendees:ae,minutes:s}=e,[p,Oe]=(0,we.useState)(`hadir`),[m,ke]=(0,we.useState)(ae),h,g;n[0]!==i.id||n[1]!==i.status?(h=()=>{if(i.status!==`active`)return;let e=setInterval(async()=>{try{ke((await(await fetch(`/daily-meetings/${i.id}/attendees-json`)).json()).attendees)}catch{}},5e3);return()=>clearInterval(e)},g=[i.id,i.status],n[0]=i.id,n[1]=i.status,n[2]=h,n[3]=g):(h=n[2],g=n[3]),(0,we.useEffect)(h,g);let _=s?.agenda||``,v=s?.latar_belakang||``,y=s?.pembahasan||``,b=s?.hasil_kesepakatan||``,x;n[4]!==_||n[5]!==v||n[6]!==y||n[7]!==b?(x={agenda:_,latar_belakang:v,pembahasan:y,hasil_kesepakatan:b},n[4]=_,n[5]=v,n[6]=y,n[7]=b,n[8]=x):x=n[8];let S=r(x),C;n[9]!==i.id||n[10]!==S?(C=e=>{e.preventDefault(),S.post(`/daily-meetings/${i.id}/minutes`)},n[9]=i.id,n[10]=S,n[11]=C):C=n[11];let w=C,T;n[12]!==m||n[13]!==i.judul||n[14]!==i.lokasi||n[15]!==i.tanggal||n[16]!==i.waktu_mulai||n[17]!==i.waktu_selesai||n[18]!==S.data?(T=()=>{let e=new Date(i.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),t=i.waktu_mulai?`${i.waktu_mulai.slice(0,5)} Wita${i.waktu_selesai?` - `+i.waktu_selesai.slice(0,5)+` Wita`:` - Selesai`}`:``,n=De,ee=m.map(Ee).join(``),r=S.data,te=`<!DOCTYPE html>
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
</html>`,a=window.open(``,`_blank`);a&&(a.document.write(te),a.document.close())},n[12]=m,n[13]=i.judul,n[14]=i.lokasi,n[15]=i.tanggal,n[16]=i.waktu_mulai,n[17]=i.waktu_selesai,n[18]=S.data,n[19]=T):T=n[19];let E=T,D;n[20]===i.id?D=n[21]:(D=()=>{confirm(`Selesaikan meeting ini?`)&&t.post(`/daily-meetings/${i.id}/complete`)},n[20]=i.id,n[21]=D);let Ae=D,O;n[22]===m.length?O=n[23]:(O={key:`hadir`,label:`Daftar Hadir`,icon:ie,count:m.length},n[22]=m.length,n[23]=O);let k;n[24]===Symbol.for(`react.memo_cache_sentinel`)?(k={key:`notulen`,label:`Notulen Rapat`,icon:xe},n[24]=k):k=n[24];let A;n[25]===O?A=n[26]:(A=[O,k],n[25]=O,n[26]=A);let je=A,Me=`Meeting: ${i.judul}`,j;n[27]===Me?j=n[28]:(j=(0,f.jsx)(ee,{title:Me}),n[27]=Me,n[28]=j);let M;n[29]===i.judul?M=n[30]:(M=(0,f.jsx)(`h1`,{className:`text-2xl font-bold tracking-tight text-foreground`,children:i.judul}),n[29]=i.judul,n[30]=M);let Ne=i.status===`active`?`default`:`secondary`,Pe=i.status===`active`?`bg-emerald-500 hover:bg-emerald-600 gap-1.5`:`gap-1.5`,N;n[31]===i.status?N=n[32]:(N=i.status===`active`?(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-white animate-pulse`}),`Berlangsung`]}):(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(te,{className:`h-3 w-3`}),`Selesai`]}),n[31]=i.status,n[32]=N);let P;n[33]!==Ne||n[34]!==Pe||n[35]!==N?(P=(0,f.jsx)(pe,{variant:Ne,className:Pe,children:N}),n[33]=Ne,n[34]=Pe,n[35]=N,n[36]=P):P=n[36];let F;n[37]!==M||n[38]!==P?(F=(0,f.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[M,P]}),n[37]=M,n[38]=P,n[39]=F):F=n[39];let I;n[40]===Symbol.for(`react.memo_cache_sentinel`)?(I=(0,f.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,f.jsx)(se,{className:`h-3.5 w-3.5 text-primary`})}),n[40]=I):I=n[40];let L;n[41]===i.tanggal?L=n[42]:(L=new Date(i.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),n[41]=i.tanggal,n[42]=L);let R;n[43]===L?R=n[44]:(R=(0,f.jsxs)(`div`,{className:`flex items-center gap-2`,children:[I,(0,f.jsx)(`span`,{children:L})]}),n[43]=L,n[44]=R);let z;n[45]!==i.waktu_mulai||n[46]!==i.waktu_selesai?(z=i.waktu_mulai&&(0,f.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,f.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,f.jsx)(oe,{className:`h-3.5 w-3.5 text-primary`})}),(0,f.jsxs)(`span`,{children:[i.waktu_mulai.slice(0,5),i.waktu_selesai&&` - ${i.waktu_selesai.slice(0,5)}`]})]}),n[45]=i.waktu_mulai,n[46]=i.waktu_selesai,n[47]=z):z=n[47];let B;n[48]===i.lokasi?B=n[49]:(B=i.lokasi&&(0,f.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,f.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,f.jsx)(ne,{className:`h-3.5 w-3.5 text-primary`})}),(0,f.jsx)(`span`,{children:i.lokasi})]}),n[48]=i.lokasi,n[49]=B);let V;n[50]!==R||n[51]!==z||n[52]!==B?(V=(0,f.jsxs)(`div`,{className:`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground`,children:[R,z,B]}),n[50]=R,n[51]=z,n[52]=B,n[53]=V):V=n[53];let H;n[54]!==F||n[55]!==V?(H=(0,f.jsxs)(`div`,{className:`space-y-4`,children:[F,V]}),n[54]=F,n[55]=V,n[56]=H):H=n[56];let U;n[57]===Symbol.for(`react.memo_cache_sentinel`)?(U=(0,f.jsx)(Se,{className:`h-4 w-4`}),n[57]=U):U=n[57];let W;n[58]===E?W=n[59]:(W=(0,f.jsxs)(o,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:E,children:[U,`Print Notulen`]}),n[58]=E,n[59]=W);let G;n[60]!==Ae||n[61]!==i.id||n[62]!==i.status?(G=i.status===`active`&&(0,f.jsxs)(f.Fragment,{children:[(0,f.jsxs)(o,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:()=>window.open(`/daily-meetings/${i.id}/qr`,`_blank`),children:[(0,f.jsx)(re,{className:`h-4 w-4`}),`QR Code`]}),(0,f.jsxs)(o,{variant:`default`,size:`sm`,className:`gap-2 h-9`,onClick:Ae,children:[(0,f.jsx)(te,{className:`h-4 w-4`}),`Selesaikan Rapat`]})]}),n[60]=Ae,n[61]=i.id,n[62]=i.status,n[63]=G):G=n[63];let K;n[64]!==W||n[65]!==G?(K=(0,f.jsxs)(`div`,{className:`flex flex-wrap gap-2 shrink-0`,children:[W,G]}),n[64]=W,n[65]=G,n[66]=K):K=n[66];let q;n[67]!==H||n[68]!==K?(q=(0,f.jsx)(fe,{className:`border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20`,children:(0,f.jsx)(ue,{className:`p-6`,children:(0,f.jsxs)(`div`,{className:`flex flex-col md:flex-row md:items-center justify-between gap-6`,children:[H,K]})})}),n[67]=H,n[68]=K,n[69]=q):q=n[69];let J;n[70]!==p||n[71]!==je?(J=(0,f.jsx)(`div`,{className:`flex p-1 bg-muted/50 rounded-lg w-fit`,children:je.map(e=>(0,f.jsxs)(`button`,{onClick:()=>Oe(e.key),className:`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${p===e.key?`bg-background text-foreground shadow-sm`:`text-muted-foreground hover:text-foreground hover:bg-background/50`}`,children:[(0,f.jsx)(e.icon,{className:`h-4 w-4`}),e.label,`count`in e&&e.count!==void 0&&(0,f.jsx)(pe,{variant:`secondary`,className:`ml-1.5 h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold`,children:e.count})]},e.key))}),n[70]=p,n[71]=je,n[72]=J):J=n[72];let Y;n[73]!==p||n[74]!==m||n[75]!==i.status?(Y=p===`hadir`&&(0,f.jsxs)(fe,{children:[(0,f.jsxs)(le,{className:`flex flex-row items-center justify-between space-y-0 pb-4`,children:[(0,f.jsxs)(`div`,{children:[(0,f.jsx)(ce,{children:`Daftar Hadir Peserta`}),(0,f.jsx)(de,{children:`Daftar seluruh personil yang telah melakukan absensi`})]}),i.status===`active`&&(0,f.jsxs)(`div`,{className:`flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium dark:bg-emerald-950/30 dark:text-emerald-400`,children:[(0,f.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse`}),`Auto-refresh 5s`]})]}),(0,f.jsx)(ue,{className:`p-0`,children:(0,f.jsxs)(_e,{children:[(0,f.jsx)(me,{children:(0,f.jsxs)(ge,{className:`bg-muted/50 hover:bg-muted/50`,children:[(0,f.jsx)(l,{className:`w-12 text-center font-bold border-r last:border-r-0`,children:`No`}),(0,f.jsx)(l,{className:`text-center font-bold border-r last:border-r-0`,children:`Nama`}),(0,f.jsx)(l,{className:`text-center font-bold border-r last:border-r-0`,children:`Divisi / Jabatan`}),(0,f.jsx)(l,{className:`text-center font-bold border-r last:border-r-0`,children:`Tanda Tangan`}),(0,f.jsx)(l,{className:`text-center font-bold border-r last:border-r-0`,children:`Waktu Hadir`})]})}),(0,f.jsx)(he,{children:m.length>0?m.map(Te):(0,f.jsx)(ge,{children:(0,f.jsx)(u,{colSpan:5,className:`h-48 text-center text-muted-foreground`,children:(0,f.jsxs)(`div`,{className:`flex flex-col items-center justify-center space-y-3`,children:[(0,f.jsx)(`div`,{className:`h-12 w-12 rounded-full bg-muted flex items-center justify-center`,children:(0,f.jsx)(ie,{className:`h-6 w-6 opacity-30`})}),(0,f.jsxs)(`div`,{className:`space-y-1`,children:[(0,f.jsx)(`p`,{className:`font-semibold`,children:`Belum ada peserta hadir`}),(0,f.jsx)(`p`,{className:`text-xs max-w-xs mx-auto`,children:`Silakan tampilkan QR Code agar peserta dapat melakukan absensi melalui perangkat masing-masing.`})]})]})})})})]})})]}),n[73]=p,n[74]=m,n[75]=i.status,n[76]=Y):Y=n[76];let X;n[77]!==p||n[78]!==m.length||n[79]!==i.status||n[80]!==S||n[81]!==w?(X=p===`notulen`&&(0,f.jsxs)(fe,{children:[(0,f.jsxs)(le,{children:[(0,f.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,f.jsxs)(`div`,{children:[(0,f.jsx)(ce,{children:`Notulen Rapat`}),(0,f.jsx)(de,{children:`Catatan pembahasan dan hasil kesepakatan rapat`})]}),(0,f.jsxs)(`div`,{className:`flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full`,children:[(0,f.jsx)(ie,{className:`h-3 w-3`}),m.length,` Peserta`]})]}),i.status===`completed`&&(0,f.jsxs)(be,{className:`mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900`,children:[(0,f.jsx)(a,{className:`h-4 w-4 text-blue-600 dark:text-blue-400`}),(0,f.jsx)(ye,{className:`text-blue-800 dark:text-blue-300`,children:`Rapat Telah Selesai`}),(0,f.jsx)(ve,{className:`text-blue-700 dark:text-blue-400/80`,children:`Notulen ini telah dikunci dan tidak dapat diedit kembali. Silakan cetak notulen untuk arsip resmi.`})]})]}),(0,f.jsx)(ue,{children:(0,f.jsxs)(`form`,{onSubmit:w,className:`space-y-8`,children:[(0,f.jsxs)(`div`,{className:`grid gap-6`,children:[(0,f.jsxs)(`div`,{className:`space-y-2`,children:[(0,f.jsx)(c,{htmlFor:`agenda`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Agenda Rapat`}),(0,f.jsx)(d,{id:`agenda`,value:S.data.agenda,onChange:e=>S.setData(`agenda`,e.target.value),placeholder:`Sebutkan poin-poin agenda rapat...`,className:`min-h-[100px] resize-none focus-visible:ring-primary/20`,disabled:i.status===`completed`})]}),(0,f.jsxs)(`div`,{className:`space-y-2`,children:[(0,f.jsx)(c,{htmlFor:`latar_belakang`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Latar Belakang`}),(0,f.jsx)(d,{id:`latar_belakang`,value:S.data.latar_belakang,onChange:e=>S.setData(`latar_belakang`,e.target.value),placeholder:`Latar belakang diadakannya rapat ini...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:i.status===`completed`})]}),(0,f.jsxs)(`div`,{className:`space-y-2`,children:[(0,f.jsx)(c,{htmlFor:`pembahasan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Pembahasan`}),(0,f.jsx)(d,{id:`pembahasan`,value:S.data.pembahasan,onChange:e=>S.setData(`pembahasan`,e.target.value),placeholder:`Rincian pembahasan rapat...`,className:`min-h-[200px] resize-none focus-visible:ring-primary/20`,disabled:i.status===`completed`})]}),(0,f.jsxs)(`div`,{className:`space-y-2`,children:[(0,f.jsx)(c,{htmlFor:`hasil_kesepakatan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Hasil Kesepakatan`}),(0,f.jsx)(d,{id:`hasil_kesepakatan`,value:S.data.hasil_kesepakatan,onChange:e=>S.setData(`hasil_kesepakatan`,e.target.value),placeholder:`Poin-poin kesepakatan akhir...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:i.status===`completed`})]})]}),i.status===`active`&&(0,f.jsx)(`div`,{className:`flex justify-end pt-4 border-t`,children:(0,f.jsxs)(o,{type:`submit`,disabled:S.processing,className:`gap-2 px-8`,children:[(0,f.jsx)(xe,{className:`h-4 w-4`}),`Simpan Notulen`]})})]})})]}),n[77]=p,n[78]=m.length,n[79]=i.status,n[80]=S,n[81]=w,n[82]=X):X=n[82];let Z;n[83]!==Y||n[84]!==X?(Z=(0,f.jsxs)(`div`,{className:`animate-in fade-in slide-in-from-bottom-2 duration-300`,children:[Y,X]}),n[83]=Y,n[84]=X,n[85]=Z):Z=n[85];let Q;n[86]!==q||n[87]!==J||n[88]!==Z?(Q=(0,f.jsxs)(`div`,{className:`flex h-full flex-1 flex-col gap-6 p-4`,children:[q,J,Z]}),n[86]=q,n[87]=J,n[88]=Z,n[89]=Q):Q=n[89];let $;return n[90]!==j||n[91]!==Q?($=(0,f.jsxs)(f.Fragment,{children:[j,Q]}),n[90]=j,n[91]=Q,n[92]=$):$=n[92],$}function Te(e,t){return(0,f.jsxs)(ge,{className:`hover:bg-muted/30`,children:[(0,f.jsx)(u,{className:`text-center text-muted-foreground font-mono border-r last:border-r-0`,children:t+1}),(0,f.jsx)(u,{className:`font-semibold text-foreground border-r last:border-r-0`,children:e.nama}),(0,f.jsx)(u,{className:`border-r last:border-r-0`,children:(0,f.jsxs)(`div`,{className:`flex flex-col`,children:[(0,f.jsx)(`span`,{className:`text-sm font-medium`,children:e.divisi||`-`}),(0,f.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:e.jabatan||`-`})]})}),(0,f.jsx)(u,{className:`flex justify-center border-r last:border-r-0`,children:e.signature?(0,f.jsx)(`div`,{className:`p-1 rounded border bg-white shadow-sm overflow-hidden flex items-center justify-center`,children:(0,f.jsx)(`img`,{src:e.signature,alt:`TTD`,className:`h-10 w-auto object-contain`})}):(0,f.jsx)(`span`,{className:`text-muted-foreground italic text-xs`,children:`Belum TTD`})}),(0,f.jsx)(u,{className:`text-right text-muted-foreground font-medium border-r last:border-r-0`,children:e.signed_at?new Date(e.signed_at).toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`}):`-`})]},e.id)}function Ee(e,t){return`<tr>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">${t+1}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.nama}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.divisi||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.jabatan||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">
                    ${e.signature?`<img src="${e.signature}" style="height:35px;width:auto;" />`:`-`}
                </td>
            </tr>`}function De(e){return e?e.replace(/\n/g,`<br/>`):`-`}p.layout={breadcrumbs:[{title:`Daily Meeting`,href:`/daily-meetings`},{title:`Detail Meeting`,href:`#`}]};export{p as default};