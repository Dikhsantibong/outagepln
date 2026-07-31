import{d as e,f as t,g as n,l as ee,r as te,s as ne,t as r}from"./jsx-runtime-8fWl2XLY.js";import{a as re,i as ie,n as ae,r as oe,t as se}from"./select-D9KE6v5h.js";import{t as ce}from"./circle-check-CrbRCF_b.js";import{t as le}from"./clipboard-list-DNABE-MR.js";import{n as ue,r as de,t as fe}from"./plus-BDHDRJ3y.js";import{t as pe}from"./file-text-Dz_bV4Ss.js";import{t as me}from"./info-Bx0h7XNX.js";import{t as he}from"./map-pin-BitCP6mN.js";import{t as ge}from"./qr-code-Ck7D0yo4.js";import{t as _e}from"./trash-2-DrvlM2JE.js";import{t as ve}from"./video-BN5pV06Y.js";import{L as ye,O as i,P as be,j as xe,k as a,yt as Se,z as o}from"./app-Ciylr5a_.js";import{t as s}from"./label-4GTi5A9L.js";import{a as Ce,i as we,n as Te,r as Ee,t as De}from"./card-DYz4Xjix.js";import{t as Oe}from"./badge-CPH4wTSy.js";import{a as ke,i as c,n as Ae,o as l,r as u,t as je}from"./table-BVzUKnlr.js";import{t as d}from"./textarea-C9QzaC1c.js";import{n as Me,r as Ne,t as Pe}from"./alert-DjCMAv2_.js";import{a as Fe,i as Ie,o as Le,r as Re,s as ze,t as Be}from"./dialog-C24YBvAj.js";var Ve=o(`ImageOff`,[[`line`,{x1:`2`,x2:`22`,y1:`2`,y2:`22`,key:`a6p6uj`}],[`path`,{d:`M10.41 10.41a2 2 0 1 1-2.83-2.83`,key:`1bzlo9`}],[`line`,{x1:`13.5`,x2:`6`,y1:`13.5`,y2:`21`,key:`1q0aeu`}],[`line`,{x1:`18`,x2:`21`,y1:`12`,y2:`15`,key:`5mozeu`}],[`path`,{d:`M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59`,key:`mmje98`}],[`path`,{d:`M21 15V5a2 2 0 0 0-2-2H9`,key:`43el77`}]]),He=o(`Printer`,[[`path`,{d:`M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2`,key:`143wyd`}],[`path`,{d:`M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6`,key:`1itne7`}],[`rect`,{x:`6`,y:`14`,width:`12`,height:`8`,rx:`1`,key:`1ue0tg`}]]),Ue=Se(),We=n(e(),1),f=r(),Ge={tanggal:``,uraian:``,part_number:``,qty:``,satuan:``,keterangan:``,tindak_lanjut:``,target:`Open`,foto:null};function p(e){let n=(0,Ue.c)(229),{meeting:r,attendees:Se,minutes:o,findings:p,findingInfo:Ye}=e,Xe;n[0]===p?Xe=n[1]:(Xe=p===void 0?[]:p,n[0]=p,n[1]=Xe);let m=Xe,{auth:Ze}=ee().props,h=Ze?.user?.role===`tamu`,[g,Qe]=(0,We.useState)(`hadir`),[_,$e]=(0,We.useState)(Se),[et,tt]=(0,We.useState)(!1),[v,nt]=(0,We.useState)(null),rt;n[2]===Symbol.for(`react.memo_cache_sentinel`)?(rt={...Ge},n[2]=rt):rt=n[2];let y=ne(rt),it;n[3]===y?it=n[4]:(it=()=>{nt(null),y.setData({...Ge}),y.clearErrors(),tt(!0)},n[3]=y,n[4]=it);let at=it,ot;n[5]===y?ot=n[6]:(ot=e=>{nt(e),y.setData({tanggal:e.tanggal||``,uraian:e.uraian||``,part_number:e.part_number||``,qty:e.qty?.toString()||``,satuan:e.satuan||``,keterangan:e.keterangan||``,tindak_lanjut:e.tindak_lanjut||``,target:e.target||`Open`,foto:null}),y.clearErrors(),tt(!0)},n[5]=y,n[6]=ot);let st=ot,ct;n[7]!==v||n[8]!==y||n[9]!==r.id?(ct=e=>{e.preventDefault();let t=v?`/daily-meetings/${r.id}/findings/${v.id}`:`/daily-meetings/${r.id}/findings`;y.post(t,{forceFormData:!0,preserveScroll:!0,onSuccess:()=>{tt(!1),nt(null),y.reset()}})},n[7]=v,n[8]=y,n[9]=r.id,n[10]=ct):ct=n[10];let lt=ct,ut;n[11]===r.id?ut=n[12]:(ut=e=>{confirm(`Hapus temuan "${e.uraian}"?`)&&t.delete(`/daily-meetings/${r.id}/findings/${e.id}`,{preserveScroll:!0})},n[11]=r.id,n[12]=ut);let dt=ut,ft,pt;n[13]!==r.id||n[14]!==r.status?(ft=()=>{if(r.status!==`active`)return;let e=setInterval(async()=>{try{$e((await(await fetch(`/daily-meetings/${r.id}/attendees-json`)).json()).attendees)}catch{}},5e3);return()=>clearInterval(e)},pt=[r.id,r.status],n[13]=r.id,n[14]=r.status,n[15]=ft,n[16]=pt):(ft=n[15],pt=n[16]),(0,We.useEffect)(ft,pt);let mt=o?.agenda||``,ht=o?.latar_belakang||``,gt=o?.pembahasan||``,_t=o?.hasil_kesepakatan||``,vt;n[17]!==mt||n[18]!==ht||n[19]!==gt||n[20]!==_t?(vt={agenda:mt,latar_belakang:ht,pembahasan:gt,hasil_kesepakatan:_t},n[17]=mt,n[18]=ht,n[19]=gt,n[20]=_t,n[21]=vt):vt=n[21];let b=ne(vt),yt;n[22]!==r.id||n[23]!==b?(yt=e=>{e.preventDefault(),b.post(`/daily-meetings/${r.id}/minutes`)},n[22]=r.id,n[23]=b,n[24]=yt):yt=n[24];let bt=yt,xt;n[25]!==_||n[26]!==r.judul||n[27]!==r.lokasi||n[28]!==r.tanggal||n[29]!==r.waktu_mulai||n[30]!==r.waktu_selesai||n[31]!==b.data?(xt=()=>{let e=new Date(r.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),t=r.waktu_mulai?`${r.waktu_mulai.slice(0,5)} Wita${r.waktu_selesai?` - `+r.waktu_selesai.slice(0,5)+` Wita`:` - Selesai`}`:``,n=Je,ee=_.map(qe).join(``),te=b.data,ne=`<!DOCTYPE html>
<html>
<head>
    <title>Notulen Rapat - ${r.judul}</title>
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
                <td>${r.lokasi||`-`}</td>
            </tr>
            <tr>
                <td class="label">Perihal</td>
                <td class="sep">:</td>
                <td>${r.judul}</td>
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
        <div class="section-content">${n(te.agenda)}</div>

        <!-- 3. LATAR BELAKANG -->
        <div class="section-title"><span>3.</span> LATAR BELAKANG</div>
        <div class="section-content">${n(te.latar_belakang)}</div>

        <!-- 4. PEMBAHASAN -->
        <div class="section-title"><span>4.</span> PEMBAHASAN</div>
        <div class="section-content">${n(te.pembahasan)}</div>

        <!-- 5. HASIL KESEPAKATAN -->
        <div class="section-title"><span>5.</span> HASIL KESEPAKATAN</div>
        <div class="section-content">${n(te.hasil_kesepakatan)}</div>

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
            <strong>${r.judul}</strong><br/>
            ${e}${t?` | `+t:``}${r.lokasi?` | `+r.lokasi:``}
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
</html>`,re=window.open(``,`_blank`);re&&(re.document.write(ne),re.document.close())},n[25]=_,n[26]=r.judul,n[27]=r.lokasi,n[28]=r.tanggal,n[29]=r.waktu_mulai,n[30]=r.waktu_selesai,n[31]=b.data,n[32]=xt):xt=n[32];let St=xt,Ct;n[33]===r.id?Ct=n[34]:(Ct=()=>{confirm(`Selesaikan meeting ini?`)&&t.post(`/daily-meetings/${r.id}/complete`)},n[33]=r.id,n[34]=Ct);let wt=Ct,x;n[35]===_.length?x=n[36]:(x={key:`hadir`,label:`Daftar Hadir`,icon:xe,count:_.length},n[35]=_.length,n[36]=x);let Tt;n[37]===Symbol.for(`react.memo_cache_sentinel`)?(Tt={key:`notulen`,label:`Notulen Rapat`,icon:pe},n[37]=Tt):Tt=n[37];let S;n[38]===m.length?S=n[39]:(S={key:`temuan`,label:`Notulen Temuan`,icon:le,count:m.length},n[38]=m.length,n[39]=S);let Et;n[40]!==x||n[41]!==S?(Et=[x,Tt,S],n[40]=x,n[41]=S,n[42]=Et):Et=n[42];let Dt=Et,Ot=`Meeting: ${r.judul}`,C;n[43]===Ot?C=n[44]:(C=(0,f.jsx)(te,{title:Ot}),n[43]=Ot,n[44]=C);let w;n[45]===r.judul?w=n[46]:(w=(0,f.jsx)(`h1`,{className:`text-2xl font-bold tracking-tight text-foreground`,children:r.judul}),n[45]=r.judul,n[46]=w);let kt=[`active`,`berlangsung`].includes(r.status)?`default`:`secondary`,At=r.status===`berlangsung`?`bg-emerald-500 hover:bg-emerald-600 gap-1.5`:r.status===`active`?`bg-blue-500 hover:bg-blue-600 gap-1.5`:`gap-1.5`,T;n[47]===r.status?T=n[48]:(T=r.status===`berlangsung`?(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-white animate-pulse`}),`Berlangsung`]}):r.status===`active`?(0,f.jsx)(f.Fragment,{children:`Akan Datang`}):(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(ce,{className:`h-3 w-3`}),`Selesai`]}),n[47]=r.status,n[48]=T);let E;n[49]!==kt||n[50]!==At||n[51]!==T?(E=(0,f.jsx)(Oe,{variant:kt,className:At,children:T}),n[49]=kt,n[50]=At,n[51]=T,n[52]=E):E=n[52];let D;n[53]!==w||n[54]!==E?(D=(0,f.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[w,E]}),n[53]=w,n[54]=E,n[55]=D):D=n[55];let jt;n[56]===Symbol.for(`react.memo_cache_sentinel`)?(jt=(0,f.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,f.jsx)(ye,{className:`h-3.5 w-3.5 text-primary`})}),n[56]=jt):jt=n[56];let O;n[57]===r.tanggal?O=n[58]:(O=new Date(r.tanggal).toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),n[57]=r.tanggal,n[58]=O);let k;n[59]===O?k=n[60]:(k=(0,f.jsxs)(`div`,{className:`flex items-center gap-2`,children:[jt,(0,f.jsx)(`span`,{children:O})]}),n[59]=O,n[60]=k);let A;n[61]!==r.waktu_mulai||n[62]!==r.waktu_selesai?(A=r.waktu_mulai&&(0,f.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,f.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,f.jsx)(be,{className:`h-3.5 w-3.5 text-primary`})}),(0,f.jsxs)(`span`,{children:[r.waktu_mulai.slice(0,5),r.waktu_selesai&&` - ${r.waktu_selesai.slice(0,5)}`]})]}),n[61]=r.waktu_mulai,n[62]=r.waktu_selesai,n[63]=A):A=n[63];let j;n[64]===r.lokasi?j=n[65]:(j=r.lokasi&&(0,f.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,f.jsx)(`div`,{className:`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 shadow-sm`,children:(0,f.jsx)(he,{className:`h-3.5 w-3.5 text-primary`})}),(0,f.jsx)(`span`,{children:r.lokasi})]}),n[64]=r.lokasi,n[65]=j);let M;n[66]!==k||n[67]!==A||n[68]!==j?(M=(0,f.jsxs)(`div`,{className:`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground`,children:[k,A,j]}),n[66]=k,n[67]=A,n[68]=j,n[69]=M):M=n[69];let N;n[70]!==D||n[71]!==M?(N=(0,f.jsxs)(`div`,{className:`space-y-4`,children:[D,M]}),n[70]=D,n[71]=M,n[72]=N):N=n[72];let P;n[73]===r.link_meeting?P=n[74]:(P=r.link_meeting&&(0,f.jsxs)(a,{variant:`default`,size:`sm`,className:`gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white`,onClick:()=>window.open(r.link_meeting,`_blank`),children:[(0,f.jsx)(ve,{className:`h-4 w-4`}),`Join Zoom Meeting`]}),n[73]=r.link_meeting,n[74]=P);let Mt;n[75]===Symbol.for(`react.memo_cache_sentinel`)?(Mt=(0,f.jsx)(He,{className:`h-4 w-4`}),n[75]=Mt):Mt=n[75];let F;n[76]===St?F=n[77]:(F=(0,f.jsxs)(a,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:St,children:[Mt,`Print Notulen`]}),n[76]=St,n[77]=F);let I;n[78]!==wt||n[79]!==h||n[80]!==r.id||n[81]!==r.status?(I=[`active`,`berlangsung`].includes(r.status)&&!h&&(0,f.jsxs)(f.Fragment,{children:[(0,f.jsxs)(a,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:()=>window.open(`/daily-meetings/${r.id}/qr`,`_blank`),children:[(0,f.jsx)(ge,{className:`h-4 w-4`}),`QR Code`]}),(0,f.jsxs)(a,{variant:`default`,size:`sm`,className:`gap-2 h-9`,onClick:wt,children:[(0,f.jsx)(ce,{className:`h-4 w-4`}),`Selesaikan Rapat`]})]}),n[78]=wt,n[79]=h,n[80]=r.id,n[81]=r.status,n[82]=I):I=n[82];let L;n[83]!==P||n[84]!==F||n[85]!==I?(L=(0,f.jsxs)(`div`,{className:`flex flex-wrap gap-2 shrink-0`,children:[P,F,I]}),n[83]=P,n[84]=F,n[85]=I,n[86]=L):L=n[86];let R;n[87]!==N||n[88]!==L?(R=(0,f.jsx)(De,{className:`border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20`,children:(0,f.jsx)(Te,{className:`p-6`,children:(0,f.jsxs)(`div`,{className:`flex flex-col md:flex-row md:items-center justify-between gap-6`,children:[N,L]})})}),n[87]=N,n[88]=L,n[89]=R):R=n[89];let z;n[90]!==g||n[91]!==Dt?(z=(0,f.jsx)(`div`,{className:`flex p-1 bg-muted/50 rounded-lg w-fit`,children:Dt.map(e=>(0,f.jsxs)(`button`,{onClick:()=>Qe(e.key),className:`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${g===e.key?`bg-background text-foreground shadow-sm`:`text-muted-foreground hover:text-foreground hover:bg-background/50`}`,children:[(0,f.jsx)(e.icon,{className:`h-4 w-4`}),e.label,`count`in e&&e.count!==void 0&&(0,f.jsx)(Oe,{variant:`secondary`,className:`ml-1.5 h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold`,children:e.count})]},e.key))}),n[90]=g,n[91]=Dt,n[92]=z):z=n[92];let B;n[93]!==g||n[94]!==_||n[95]!==r.status?(B=g===`hadir`&&(0,f.jsxs)(De,{children:[(0,f.jsxs)(we,{className:`flex flex-row items-center justify-between space-y-0 pb-4`,children:[(0,f.jsxs)(`div`,{children:[(0,f.jsx)(Ce,{children:`Daftar Hadir Peserta`}),(0,f.jsx)(Ee,{children:`Daftar seluruh personil yang telah melakukan absensi`})]}),[`active`,`berlangsung`].includes(r.status)&&(0,f.jsxs)(`div`,{className:`flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium dark:bg-emerald-950/30 dark:text-emerald-400`,children:[(0,f.jsx)(`div`,{className:`h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse`}),`Auto-refresh 5s`]})]}),(0,f.jsx)(Te,{className:`p-0`,children:(0,f.jsxs)(je,{children:[(0,f.jsx)(ke,{children:(0,f.jsxs)(l,{className:`bg-muted/50 hover:bg-muted/50`,children:[(0,f.jsx)(c,{className:`w-12 text-center font-bold border-r last:border-r-0`,children:`No`}),(0,f.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Nama`}),(0,f.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Divisi / Jabatan`}),(0,f.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Tanda Tangan`}),(0,f.jsx)(c,{className:`text-center font-bold border-r last:border-r-0`,children:`Waktu Hadir`})]})}),(0,f.jsx)(Ae,{children:_.length>0?_.map(Ke):(0,f.jsx)(l,{children:(0,f.jsx)(u,{colSpan:5,className:`h-48 text-center text-muted-foreground`,children:(0,f.jsxs)(`div`,{className:`flex flex-col items-center justify-center space-y-3`,children:[(0,f.jsx)(`div`,{className:`h-12 w-12 rounded-full bg-muted flex items-center justify-center`,children:(0,f.jsx)(xe,{className:`h-6 w-6 opacity-30`})}),(0,f.jsxs)(`div`,{className:`space-y-1`,children:[(0,f.jsx)(`p`,{className:`font-semibold`,children:`Belum ada peserta hadir`}),(0,f.jsx)(`p`,{className:`text-xs max-w-xs mx-auto`,children:`Silakan tampilkan QR Code agar peserta dapat melakukan absensi melalui perangkat masing-masing.`})]})]})})})})]})})]}),n[93]=g,n[94]=_,n[95]=r.status,n[96]=B):B=n[96];let V;n[97]!==g||n[98]!==_.length||n[99]!==h||n[100]!==r.status||n[101]!==b||n[102]!==bt?(V=g===`notulen`&&(0,f.jsxs)(De,{children:[(0,f.jsxs)(we,{children:[(0,f.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,f.jsxs)(`div`,{children:[(0,f.jsx)(Ce,{children:`Notulen Rapat`}),(0,f.jsx)(Ee,{children:`Catatan pembahasan dan hasil kesepakatan rapat`})]}),(0,f.jsxs)(`div`,{className:`flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full`,children:[(0,f.jsx)(xe,{className:`h-3 w-3`}),_.length,` Peserta`]})]}),r.status===`completed`&&(0,f.jsxs)(Pe,{className:`mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900`,children:[(0,f.jsx)(me,{className:`h-4 w-4 text-blue-600 dark:text-blue-400`}),(0,f.jsx)(Ne,{className:`text-blue-800 dark:text-blue-300`,children:`Rapat Telah Selesai`}),(0,f.jsx)(Me,{className:`text-blue-700 dark:text-blue-400/80`,children:`Notulen ini telah dikunci dan tidak dapat diedit kembali. Silakan cetak notulen untuk arsip resmi.`})]})]}),(0,f.jsx)(Te,{children:(0,f.jsxs)(`form`,{onSubmit:bt,className:`space-y-8`,children:[(0,f.jsxs)(`div`,{className:`grid gap-6`,children:[(0,f.jsxs)(`div`,{className:`space-y-2`,children:[(0,f.jsx)(s,{htmlFor:`agenda`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Agenda Rapat`}),(0,f.jsx)(d,{id:`agenda`,value:b.data.agenda,onChange:e=>b.setData(`agenda`,e.target.value),placeholder:`Sebutkan poin-poin agenda rapat...`,className:`min-h-[100px] resize-none focus-visible:ring-primary/20`,disabled:r.status===`completed`||h})]}),(0,f.jsxs)(`div`,{className:`space-y-2`,children:[(0,f.jsx)(s,{htmlFor:`latar_belakang`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Latar Belakang`}),(0,f.jsx)(d,{id:`latar_belakang`,value:b.data.latar_belakang,onChange:e=>b.setData(`latar_belakang`,e.target.value),placeholder:`Latar belakang diadakannya rapat ini...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:r.status===`completed`})]}),(0,f.jsxs)(`div`,{className:`space-y-2`,children:[(0,f.jsx)(s,{htmlFor:`pembahasan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Pembahasan`}),(0,f.jsx)(d,{id:`pembahasan`,value:b.data.pembahasan,onChange:e=>b.setData(`pembahasan`,e.target.value),placeholder:`Rincian pembahasan rapat...`,className:`min-h-[200px] resize-none focus-visible:ring-primary/20`,disabled:r.status===`completed`||h})]}),(0,f.jsxs)(`div`,{className:`space-y-2`,children:[(0,f.jsx)(s,{htmlFor:`hasil_kesepakatan`,className:`text-xs font-bold uppercase tracking-[0.1em] text-primary/80`,children:`Hasil Kesepakatan`}),(0,f.jsx)(d,{id:`hasil_kesepakatan`,value:b.data.hasil_kesepakatan,onChange:e=>b.setData(`hasil_kesepakatan`,e.target.value),placeholder:`Poin-poin kesepakatan akhir...`,className:`min-h-[120px] resize-none focus-visible:ring-primary/20`,disabled:r.status===`completed`})]})]}),[`active`,`berlangsung`].includes(r.status)&&!h&&(0,f.jsx)(`div`,{className:`flex justify-end pt-4 border-t`,children:(0,f.jsxs)(a,{type:`submit`,disabled:b.processing,className:`gap-2 px-8`,children:[(0,f.jsx)(pe,{className:`h-4 w-4`}),`Simpan Notulen`]})})]})})]}),n[97]=g,n[98]=_.length,n[99]=h,n[100]=r.status,n[101]=b,n[102]=bt,n[103]=V):V=n[103];let H;n[104]!==g||n[105]!==dt||n[106]!==Ye||n[107]!==m||n[108]!==h||n[109]!==r.id||n[110]!==at||n[111]!==st?(H=g===`temuan`&&(0,f.jsxs)(De,{children:[(0,f.jsxs)(we,{className:`flex flex-row items-start justify-between space-y-0 pb-4 gap-4`,children:[(0,f.jsxs)(`div`,{children:[(0,f.jsx)(Ce,{children:`Notulen Temuan`}),(0,f.jsx)(Ee,{children:`Daftar material temuan overhaul beserta tindak lanjutnya`}),Ye&&(0,f.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-x-8 gap-y-1 text-xs`,children:[(0,f.jsxs)(`div`,{children:[(0,f.jsx)(`span`,{className:`font-semibold text-muted-foreground`,children:`UNIT`}),(0,f.jsx)(`span`,{className:`mx-2 text-muted-foreground`,children:`:`}),(0,f.jsx)(`span`,{className:`font-medium text-red-600 dark:text-red-400`,children:Ye.unit})]}),(0,f.jsxs)(`div`,{children:[(0,f.jsx)(`span`,{className:`font-semibold text-muted-foreground`,children:`JENIS INSPEKSI`}),(0,f.jsx)(`span`,{className:`mx-2 text-muted-foreground`,children:`:`}),(0,f.jsx)(`span`,{className:`font-medium text-red-600 dark:text-red-400`,children:Ye.jenis_inspeksi})]})]})]}),(0,f.jsxs)(`div`,{className:`flex flex-wrap gap-2 shrink-0`,children:[(0,f.jsxs)(a,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:()=>window.open(`/daily-meetings/${r.id}/findings/export-pdf`,`_blank`),children:[(0,f.jsx)(pe,{className:`h-4 w-4 text-red-500`}),`PDF`]}),(0,f.jsxs)(a,{variant:`outline`,size:`sm`,className:`gap-2 h-9`,onClick:()=>window.open(`/daily-meetings/${r.id}/findings/export-excel`,`_blank`),children:[(0,f.jsx)(de,{className:`h-4 w-4 text-emerald-600`}),`Excel`]}),!h&&(0,f.jsxs)(a,{size:`sm`,className:`gap-2 h-9`,onClick:at,children:[(0,f.jsx)(fe,{className:`h-4 w-4`}),`Tambah Temuan`]})]})]}),(0,f.jsx)(Te,{className:`p-0 overflow-x-auto`,children:(0,f.jsxs)(je,{children:[(0,f.jsx)(ke,{children:(0,f.jsxs)(l,{className:`bg-muted/50 hover:bg-muted/50`,children:[(0,f.jsx)(c,{className:`w-12 text-center font-bold border-r`,children:`NO`}),(0,f.jsx)(c,{className:`text-center font-bold border-r whitespace-nowrap`,children:`TGL`}),(0,f.jsx)(c,{className:`font-bold border-r min-w-[180px]`,children:`URAIAN`}),(0,f.jsx)(c,{className:`text-center font-bold border-r whitespace-nowrap`,children:`P/N`}),(0,f.jsx)(c,{className:`text-center font-bold border-r`,children:`QTY`}),(0,f.jsx)(c,{className:`text-center font-bold border-r`,children:`SATUAN`}),(0,f.jsx)(c,{className:`text-center font-bold border-r`,children:`FOTO`}),(0,f.jsx)(c,{className:`font-bold border-r min-w-[150px]`,children:`KETERANGAN`}),(0,f.jsx)(c,{className:`font-bold border-r min-w-[220px]`,children:`TINDAK LANJUT`}),(0,f.jsx)(c,{className:`text-center font-bold border-r`,children:`TARGET`}),!h&&(0,f.jsx)(c,{className:`text-center font-bold w-20`,children:`AKSI`})]})}),(0,f.jsx)(Ae,{children:m.length>0?m.map((e,t)=>(0,f.jsxs)(l,{className:`hover:bg-muted/30 group`,children:[(0,f.jsx)(u,{className:`text-center font-mono text-xs text-muted-foreground border-r`,children:t+1}),(0,f.jsx)(u,{className:`text-center font-mono text-[11px] text-muted-foreground border-r whitespace-nowrap`,children:e.tanggal?new Date(e.tanggal).toLocaleDateString(`id-ID`):`-`}),(0,f.jsx)(u,{className:`text-xs font-medium border-r`,children:e.uraian}),(0,f.jsx)(u,{className:`text-center font-mono text-[11px] border-r whitespace-nowrap`,children:e.part_number||`-`}),(0,f.jsx)(u,{className:`text-center text-xs border-r`,children:e.qty??`-`}),(0,f.jsx)(u,{className:`text-center text-xs border-r`,children:e.satuan||`-`}),(0,f.jsx)(u,{className:`text-center border-r`,children:e.foto?(0,f.jsx)(`img`,{src:e.foto,alt:e.uraian,className:`h-16 w-24 object-cover rounded border mx-auto cursor-zoom-in`,onClick:()=>window.open(e.foto,`_blank`)}):(0,f.jsx)(Ve,{className:`h-5 w-5 mx-auto opacity-20`})}),(0,f.jsx)(u,{className:`text-xs border-r`,children:e.keterangan||`-`}),(0,f.jsx)(u,{className:`text-xs border-r whitespace-pre-line`,children:e.tindak_lanjut||`-`}),(0,f.jsx)(u,{className:`text-center border-r`,children:(0,f.jsx)(`span`,{className:`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(e.target||``).toUpperCase()===`CLOSE`?`bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400`:`bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400`}`,children:e.target||`Open`})}),!h&&(0,f.jsx)(u,{className:`text-center`,children:(0,f.jsxs)(`div`,{className:`flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`,children:[(0,f.jsx)(a,{variant:`ghost`,size:`icon`,className:`h-7 w-7 text-primary hover:bg-primary/10`,onClick:()=>st(e),children:(0,f.jsx)(ue,{className:`h-3.5 w-3.5`})}),(0,f.jsx)(a,{variant:`ghost`,size:`icon`,className:`h-7 w-7 text-destructive hover:bg-destructive/10`,onClick:()=>dt(e),children:(0,f.jsx)(_e,{className:`h-3.5 w-3.5`})})]})})]},e.id)):(0,f.jsx)(l,{children:(0,f.jsx)(u,{colSpan:h?10:11,className:`h-48 text-center text-muted-foreground`,children:(0,f.jsxs)(`div`,{className:`flex flex-col items-center justify-center space-y-3`,children:[(0,f.jsx)(`div`,{className:`h-12 w-12 rounded-full bg-muted flex items-center justify-center`,children:(0,f.jsx)(le,{className:`h-6 w-6 opacity-30`})}),(0,f.jsxs)(`div`,{className:`space-y-1`,children:[(0,f.jsx)(`p`,{className:`font-semibold`,children:`Belum ada temuan`}),(0,f.jsx)(`p`,{className:`text-xs max-w-xs mx-auto`,children:`Tambahkan material temuan overhaul beserta foto dan tindak lanjutnya.`})]})]})})})})]})})]}),n[104]=g,n[105]=dt,n[106]=Ye,n[107]=m,n[108]=h,n[109]=r.id,n[110]=at,n[111]=st,n[112]=H):H=n[112];let U;n[113]!==B||n[114]!==V||n[115]!==H?(U=(0,f.jsxs)(`div`,{className:`animate-in fade-in slide-in-from-bottom-2 duration-300`,children:[B,V,H]}),n[113]=B,n[114]=V,n[115]=H,n[116]=U):U=n[116];let W;n[117]!==R||n[118]!==z||n[119]!==U?(W=(0,f.jsxs)(`div`,{className:`flex h-full flex-1 flex-col gap-6 p-4`,children:[R,z,U]}),n[117]=R,n[118]=z,n[119]=U,n[120]=W):W=n[120];let Nt;n[121]===Symbol.for(`react.memo_cache_sentinel`)?(Nt=e=>{e||(tt(!1),nt(null))},n[121]=Nt):Nt=n[121];let Pt=v?`Edit Temuan`:`Tambah Temuan`,G;n[122]===Pt?G=n[123]:(G=(0,f.jsx)(ze,{children:Pt}),n[122]=Pt,n[123]=G);let Ft=v?`Perbarui data material temuan overhaul.`:`Input data material temuan overhaul baru.`,K;n[124]===Ft?K=n[125]:(K=(0,f.jsx)(Ie,{children:Ft}),n[124]=Ft,n[125]=K);let q;n[126]!==G||n[127]!==K?(q=(0,f.jsxs)(Le,{children:[G,K]}),n[126]=G,n[127]=K,n[128]=q):q=n[128];let It;n[129]===Symbol.for(`react.memo_cache_sentinel`)?(It=(0,f.jsx)(s,{htmlFor:`f_tanggal`,children:`Tanggal`}),n[129]=It):It=n[129];let Lt;n[130]===y?Lt=n[131]:(Lt=e=>y.setData(`tanggal`,e.target.value),n[130]=y,n[131]=Lt);let J;n[132]!==y.data.tanggal||n[133]!==Lt?(J=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[It,(0,f.jsx)(i,{id:`f_tanggal`,type:`date`,value:y.data.tanggal,onChange:Lt})]}),n[132]=y.data.tanggal,n[133]=Lt,n[134]=J):J=n[134];let Rt;n[135]===Symbol.for(`react.memo_cache_sentinel`)?(Rt=(0,f.jsx)(s,{htmlFor:`f_target`,children:`Target`}),n[135]=Rt):Rt=n[135];let Y;n[136]===y?Y=n[137]:(Y=e=>y.setData(`target`,e),n[136]=y,n[137]=Y);let zt;n[138]===Symbol.for(`react.memo_cache_sentinel`)?(zt=(0,f.jsx)(ie,{id:`f_target`,children:(0,f.jsx)(re,{placeholder:`Pilih Target`})}),n[138]=zt):zt=n[138];let Bt;n[139]===Symbol.for(`react.memo_cache_sentinel`)?(Bt=(0,f.jsxs)(ae,{children:[(0,f.jsx)(oe,{value:`Open`,children:`Open`}),(0,f.jsx)(oe,{value:`Close`,children:`Close`})]}),n[139]=Bt):Bt=n[139];let X;n[140]!==y.data.target||n[141]!==Y?(X=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[Rt,(0,f.jsxs)(se,{value:y.data.target,onValueChange:Y,children:[zt,Bt]})]}),n[140]=y.data.target,n[141]=Y,n[142]=X):X=n[142];let Z;n[143]!==J||n[144]!==X?(Z=(0,f.jsxs)(`div`,{className:`grid grid-cols-2 gap-4`,children:[J,X]}),n[143]=J,n[144]=X,n[145]=Z):Z=n[145];let Vt;n[146]===Symbol.for(`react.memo_cache_sentinel`)?(Vt=(0,f.jsx)(s,{htmlFor:`f_uraian`,children:`Uraian`}),n[146]=Vt):Vt=n[146];let Q;n[147]===y?Q=n[148]:(Q=e=>y.setData(`uraian`,e.target.value),n[147]=y,n[148]=Q);let Ht;n[149]!==y.data.uraian||n[150]!==Q?(Ht=(0,f.jsx)(i,{id:`f_uraian`,type:`text`,placeholder:`cth: STUD BOLT CYLINDER HEAD NO. 7`,value:y.data.uraian,onChange:Q}),n[149]=y.data.uraian,n[150]=Q,n[151]=Ht):Ht=n[151];let Ut;n[152]===y.errors.uraian?Ut=n[153]:(Ut=y.errors.uraian&&(0,f.jsx)(`p`,{className:`text-xs text-destructive`,children:y.errors.uraian}),n[152]=y.errors.uraian,n[153]=Ut);let Wt;n[154]!==Ht||n[155]!==Ut?(Wt=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[Vt,Ht,Ut]}),n[154]=Ht,n[155]=Ut,n[156]=Wt):Wt=n[156];let Gt;n[157]===Symbol.for(`react.memo_cache_sentinel`)?(Gt=(0,f.jsx)(s,{htmlFor:`f_pn`,children:`P/N`}),n[157]=Gt):Gt=n[157];let Kt;n[158]===y?Kt=n[159]:(Kt=e=>y.setData(`part_number`,e.target.value),n[158]=y,n[159]=Kt);let qt;n[160]!==y.data.part_number||n[161]!==Kt?(qt=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[Gt,(0,f.jsx)(i,{id:`f_pn`,type:`text`,placeholder:`1.1110-007`,value:y.data.part_number,onChange:Kt})]}),n[160]=y.data.part_number,n[161]=Kt,n[162]=qt):qt=n[162];let Jt;n[163]===Symbol.for(`react.memo_cache_sentinel`)?(Jt=(0,f.jsx)(s,{htmlFor:`f_qty`,children:`Qty`}),n[163]=Jt):Jt=n[163];let Yt;n[164]===y?Yt=n[165]:(Yt=e=>y.setData(`qty`,e.target.value),n[164]=y,n[165]=Yt);let Xt;n[166]!==y.data.qty||n[167]!==Yt?(Xt=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[Jt,(0,f.jsx)(i,{id:`f_qty`,type:`number`,min:0,value:y.data.qty,onChange:Yt})]}),n[166]=y.data.qty,n[167]=Yt,n[168]=Xt):Xt=n[168];let Zt;n[169]===Symbol.for(`react.memo_cache_sentinel`)?(Zt=(0,f.jsx)(s,{htmlFor:`f_satuan`,children:`Satuan`}),n[169]=Zt):Zt=n[169];let Qt;n[170]===y?Qt=n[171]:(Qt=e=>y.setData(`satuan`,e.target.value),n[170]=y,n[171]=Qt);let $t;n[172]!==y.data.satuan||n[173]!==Qt?($t=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[Zt,(0,f.jsx)(i,{id:`f_satuan`,type:`text`,placeholder:`Bh`,value:y.data.satuan,onChange:Qt})]}),n[172]=y.data.satuan,n[173]=Qt,n[174]=$t):$t=n[174];let en;n[175]!==qt||n[176]!==Xt||n[177]!==$t?(en=(0,f.jsxs)(`div`,{className:`grid grid-cols-3 gap-4`,children:[qt,Xt,$t]}),n[175]=qt,n[176]=Xt,n[177]=$t,n[178]=en):en=n[178];let tn;n[179]===Symbol.for(`react.memo_cache_sentinel`)?(tn=(0,f.jsx)(s,{htmlFor:`f_foto`,children:`Foto`}),n[179]=tn):tn=n[179];let nn;n[180]===y?nn=n[181]:(nn=(0,f.jsx)(i,{id:`f_foto`,type:`file`,accept:`image/*`,onChange:e=>y.setData(`foto`,e.target.files?.[0]??null)}),n[180]=y,n[181]=nn);let rn;n[182]!==v||n[183]!==y.data.foto?(rn=v?.foto&&!y.data.foto&&(0,f.jsxs)(`div`,{className:`flex items-center gap-2 pt-1`,children:[(0,f.jsx)(`img`,{src:v.foto,alt:`Foto saat ini`,className:`h-14 w-20 object-cover rounded border`}),(0,f.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:`Foto saat ini. Pilih file baru untuk mengganti.`})]}),n[182]=v,n[183]=y.data.foto,n[184]=rn):rn=n[184];let an;n[185]===y.errors.foto?an=n[186]:(an=y.errors.foto&&(0,f.jsx)(`p`,{className:`text-xs text-destructive`,children:y.errors.foto}),n[185]=y.errors.foto,n[186]=an);let on;n[187]!==nn||n[188]!==rn||n[189]!==an?(on=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[tn,nn,rn,an]}),n[187]=nn,n[188]=rn,n[189]=an,n[190]=on):on=n[190];let sn;n[191]===Symbol.for(`react.memo_cache_sentinel`)?(sn=(0,f.jsx)(s,{htmlFor:`f_ket`,children:`Keterangan`}),n[191]=sn):sn=n[191];let cn;n[192]===y?cn=n[193]:(cn=e=>y.setData(`keterangan`,e.target.value),n[192]=y,n[193]=cn);let $;n[194]!==y.data.keterangan||n[195]!==cn?($=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[sn,(0,f.jsx)(d,{id:`f_ket`,placeholder:`cth: Stud Bolt Patah`,className:`min-h-[70px] resize-none`,value:y.data.keterangan,onChange:cn})]}),n[194]=y.data.keterangan,n[195]=cn,n[196]=$):$=n[196];let ln;n[197]===Symbol.for(`react.memo_cache_sentinel`)?(ln=(0,f.jsx)(s,{htmlFor:`f_tl`,children:`Tindak Lanjut`}),n[197]=ln):ln=n[197];let un;n[198]===y?un=n[199]:(un=e=>y.setData(`tindak_lanjut`,e.target.value),n[198]=y,n[199]=un);let dn;n[200]!==y.data.tindak_lanjut||n[201]!==un?(dn=(0,f.jsx)(d,{id:`f_tl`,placeholder:`Perlu dilakukan penggantian
Akan menggunakan stok unit`,className:`min-h-[100px] resize-none`,value:y.data.tindak_lanjut,onChange:un}),n[200]=y.data.tindak_lanjut,n[201]=un,n[202]=dn):dn=n[202];let fn;n[203]===Symbol.for(`react.memo_cache_sentinel`)?(fn=(0,f.jsx)(`p`,{className:`text-xs text-muted-foreground`,children:`Gunakan baris baru untuk memisahkan tiap poin.`}),n[203]=fn):fn=n[203];let pn;n[204]===dn?pn=n[205]:(pn=(0,f.jsxs)(`div`,{className:`space-y-2`,children:[ln,dn,fn]}),n[204]=dn,n[205]=pn);let mn;n[206]===Symbol.for(`react.memo_cache_sentinel`)?(mn=(0,f.jsx)(a,{type:`button`,variant:`outline`,onClick:()=>{tt(!1),nt(null)},children:`Batal`}),n[206]=mn):mn=n[206];let hn=v?`Simpan Perubahan`:`Simpan Temuan`,gn;n[207]!==y.processing||n[208]!==hn?(gn=(0,f.jsxs)(Fe,{className:`pt-2`,children:[mn,(0,f.jsx)(a,{type:`submit`,disabled:y.processing,children:hn})]}),n[207]=y.processing,n[208]=hn,n[209]=gn):gn=n[209];let _n;n[210]!==lt||n[211]!==Z||n[212]!==Wt||n[213]!==en||n[214]!==on||n[215]!==$||n[216]!==pn||n[217]!==gn?(_n=(0,f.jsxs)(`form`,{onSubmit:lt,className:`space-y-4`,children:[Z,Wt,en,on,$,pn,gn]}),n[210]=lt,n[211]=Z,n[212]=Wt,n[213]=en,n[214]=on,n[215]=$,n[216]=pn,n[217]=gn,n[218]=_n):_n=n[218];let vn;n[219]!==q||n[220]!==_n?(vn=(0,f.jsxs)(Re,{className:`sm:max-w-2xl max-h-[90vh] overflow-y-auto`,children:[q,_n]}),n[219]=q,n[220]=_n,n[221]=vn):vn=n[221];let yn;n[222]!==et||n[223]!==vn?(yn=(0,f.jsx)(Be,{open:et,onOpenChange:Nt,children:vn}),n[222]=et,n[223]=vn,n[224]=yn):yn=n[224];let bn;return n[225]!==C||n[226]!==W||n[227]!==yn?(bn=(0,f.jsxs)(f.Fragment,{children:[C,W,yn]}),n[225]=C,n[226]=W,n[227]=yn,n[228]=bn):bn=n[228],bn}function Ke(e,t){return(0,f.jsxs)(l,{className:`hover:bg-muted/30`,children:[(0,f.jsx)(u,{className:`text-center text-muted-foreground font-mono border-r last:border-r-0`,children:t+1}),(0,f.jsx)(u,{className:`font-semibold text-foreground border-r last:border-r-0`,children:e.nama}),(0,f.jsx)(u,{className:`border-r last:border-r-0`,children:(0,f.jsxs)(`div`,{className:`flex flex-col`,children:[(0,f.jsx)(`span`,{className:`text-sm font-medium`,children:e.divisi||`-`}),(0,f.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:e.jabatan||`-`})]})}),(0,f.jsx)(u,{className:`flex justify-center border-r last:border-r-0`,children:e.signature?(0,f.jsx)(`div`,{className:`p-1 rounded border bg-white shadow-sm overflow-hidden flex items-center justify-center`,children:(0,f.jsx)(`img`,{src:e.signature,alt:`TTD`,className:`h-10 w-auto object-contain`})}):(0,f.jsx)(`span`,{className:`text-muted-foreground italic text-xs`,children:`Belum TTD`})}),(0,f.jsx)(u,{className:`text-right text-muted-foreground font-medium border-r last:border-r-0`,children:e.signed_at?new Date(e.signed_at).toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`}):`-`})]},e.id)}function qe(e,t){return`<tr>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">${t+1}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.nama}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.divisi||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;">${e.jabatan||`-`}</td>
                <td style="border:1px solid #000;padding:6px 10px;text-align:center;">
                    ${e.signature?`<img src="${e.signature}" style="height:35px;width:auto;" />`:`-`}
                </td>
            </tr>`}function Je(e){return e?e.replace(/\n/g,`<br/>`):`-`}p.layout={breadcrumbs:[{title:`Daily Meeting`,href:`/daily-meetings`},{title:`Detail Meeting`,href:`#`}]};export{p as default};