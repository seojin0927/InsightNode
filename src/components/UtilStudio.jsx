import React, { useState, useMemo, useEffect } from 'react';
import StudioLayout, { S, CopyBtn } from './StudioLayout';

const ACCENT = '#10b981';

// ══════════════════════════════════════════════════════════════════
// TAB 1: 해시 생성기
function HashTab() {
    const [input, setInput] = useState('');
    const [hashes, setHashes] = useState({});
    const [encoding, setEncoding] = useState('hex');

    const toHex = (buf) => Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    const toBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

    useEffect(() => {
        if (!input) { setHashes({}); return; }
        const enc = new TextEncoder();
        const data = enc.encode(input);
        const compute = async () => {
            const results = {};
            for (const algo of ['SHA-1','SHA-256','SHA-384','SHA-512']) {
                try {
                    const buf = await crypto.subtle.digest(algo, data);
                    results[algo] = encoding === 'hex' ? toHex(buf) : toBase64(buf);
                } catch {}
            }
            // CRC32 approximation
            let crc = 0xFFFFFFFF;
            for (const byte of data) {
                crc ^= byte;
                for (let j=0;j<8;j++) crc = (crc>>>1) ^ (crc&1 ? 0xEDB88320 : 0);
            }
            results['CRC32'] = ((crc^0xFFFFFFFF)>>>0).toString(16).padStart(8,'0');
            // MD5-like simple hash (not real MD5)
            let h = 0;
            for (let i=0;i<input.length;i++) h = Math.imul(31,h)+input.charCodeAt(i)|0;
            results['Hash32'] = (h>>>0).toString(16).padStart(8,'0');
            setHashes(results);
        };
        compute();
    }, [input, encoding]);

    const b64enc = useMemo(() => { try { return btoa(unescape(encodeURIComponent(input))); } catch { return ''; } }, [input]);
    const b64dec = useMemo(() => { try { return decodeURIComponent(escape(atob(input))); } catch { return ''; } }, [input]);

    return (
        <div className="space-y-4">
            <div>
                <label className={S.label}>입력 텍스트</label>
                <textarea value={input} onChange={e=>setInput(e.target.value)} rows={3} placeholder="해시를 생성할 텍스트를 입력하세요..." className="w-full bg-slate-800/80 text-slate-200 font-mono text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 resize-none transition-colors" />
            </div>
            <div className="flex gap-1.5">
                {['hex','base64'].map(e=><button key={e} onClick={()=>setEncoding(e)} className={S.btn(encoding===e)}>{e.toUpperCase()}</button>)}
            </div>
            <div className="space-y-2">
                {Object.entries(hashes).map(([algo,hash])=>(
                    <div key={algo} className={`${S.card} p-4 flex items-start gap-3`}>
                        <span className="text-xs font-black text-indigo-400 w-16 pt-0.5 shrink-0">{algo}</span>
                        <code className="text-xs text-slate-300 font-mono break-all flex-1 leading-relaxed">{hash}</code>
                        <CopyBtn text={hash} />
                    </div>
                ))}
                {!input && <div className="text-center text-slate-600 py-6 text-sm">텍스트를 입력하면 해시가 생성됩니다</div>}
            </div>
            {input && (
                <div className={`${S.card} p-4`}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Base64 변환</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-3 py-2 bg-slate-800/60 rounded-xl gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">인코딩</span>
                            <code className="text-xs text-emerald-400 font-mono break-all flex-1">{b64enc}</code>
                            <CopyBtn text={b64enc} />
                        </div>
                        <div className="flex justify-between items-center px-3 py-2 bg-slate-800/60 rounded-xl gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">디코딩</span>
                            <code className="text-xs text-cyan-400 font-mono break-all flex-1">{b64dec}</code>
                            <CopyBtn text={b64dec} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// TAB 2: 대출 계산기
function LoanTab() {
    const [principal, setPrincipal] = useState(100000000);
    const [rate, setRate] = useState(4.5);
    const [months, setMonths] = useState(360);
    const [method, setMethod] = useState('equal');

    const result = useMemo(() => {
        const P = Number(principal), r = Number(rate)/100/12, n = Number(months);
        if (!P || !r || !n) return null;
        let rows = [];
        let totalInterest = 0;
        if (method === 'equal') {
            const M = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
            let bal = P;
            for (let i=1;i<=Math.min(n,12);i++) {
                const interest = bal*r, principal_pmt = M-interest;
                totalInterest += interest;
                bal -= principal_pmt;
                rows.push({m:i, payment:M, principal:principal_pmt, interest, balance:Math.max(0,bal)});
            }
            const totalPay = M*n;
            return { monthly: M, total: totalPay, interest: M*n - P, rows };
        } else if (method === 'principal') {
            const monthlyPrincipal = P/n;
            let bal = P;
            let firstMonthly = 0;
            for (let i=1;i<=Math.min(n,12);i++) {
                const interest = bal*r;
                const payment = monthlyPrincipal+interest;
                if(i===1) firstMonthly = payment;
                totalInterest += interest;
                bal -= monthlyPrincipal;
                rows.push({m:i, payment, principal:monthlyPrincipal, interest, balance:Math.max(0,bal)});
            }
            // compute actual total interest
            let realInterest = 0, b = P;
            for(let i=1;i<=n;i++) { realInterest += b*r; b -= P/n; }
            return { monthly: firstMonthly, total: P+realInterest, interest: realInterest, rows };
        } else {
            const interest = P*r*n;
            rows.push({m:1,payment:P*r,principal:0,interest:P*r,balance:P});
            return { monthly: P*r, total: P+interest, interest, rows };
        }
    }, [principal, rate, months, method]);

    const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
    const fmtWon = (n) => {
        const m = Math.round(n);
        if (m >= 100000000) return `${(m/100000000).toFixed(1)}억원`;
        if (m >= 10000) return `${(m/10000).toFixed(0)}만원`;
        return `${m.toLocaleString()}원`;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={S.label}>대출 원금 (원)</label>
                    <input type="number" value={principal} onChange={e=>setPrincipal(e.target.value)} className={S.input} />
                </div>
                <div>
                    <label className={S.label}>연이율 (%)</label>
                    <input type="number" step="0.1" value={rate} onChange={e=>setRate(e.target.value)} className={S.input} />
                </div>
                <div>
                    <label className={S.label}>대출 기간 (개월)</label>
                    <input type="number" value={months} onChange={e=>setMonths(e.target.value)} className={S.input} />
                </div>
                <div>
                    <label className={S.label}>상환 방식</label>
                    <div className="flex gap-1.5">
                        {[['equal','원리금균등'],['principal','원금균등'],['bullet','만기일시']].map(([v,l])=>(
                            <button key={v} onClick={()=>setMethod(v)} className={S.btn(method===v)}>{l}</button>
                        ))}
                    </div>
                </div>
            </div>
            {result && (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        {[['월 납입금',result.monthly,'#6366f1'],['총 상환액',result.total,'#22c55e'],['총 이자',result.interest,'#ef4444']].map(([l,v,c])=>(
                            <div key={l} className={`${S.card} p-4 text-center`}>
                                <div className="text-2xl font-black" style={{color:c}}>{fmtWon(v)}</div>
                                <div className="text-xs text-slate-500 font-bold mt-1">{l}</div>
                            </div>
                        ))}
                    </div>
                    <div className={`${S.card} overflow-hidden`}>
                        <div className="px-4 py-2 border-b border-slate-800">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">납입 일정 (처음 12개월)</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead><tr className="text-slate-600">{['회차','납입금','원금','이자','잔액'].map(h=><th key={h} className="px-3 py-2 text-right font-bold first:text-left">{h}</th>)}</tr></thead>
                                <tbody>
                                    {result.rows.map(r=>(
                                        <tr key={r.m} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="px-3 py-2 text-slate-400 font-mono">{r.m}</td>
                                            <td className="px-3 py-2 text-right text-white font-mono">{fmt(r.payment)}</td>
                                            <td className="px-3 py-2 text-right text-blue-400 font-mono">{fmt(r.principal)}</td>
                                            <td className="px-3 py-2 text-right text-red-400 font-mono">{fmt(r.interest)}</td>
                                            <td className="px-3 py-2 text-right text-slate-400 font-mono">{fmt(r.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// TAB 3: 비밀번호 생성기
function PasswordTab() {
    const [length, setLength] = useState(16);
    const [useUpper, setUseUpper] = useState(true);
    const [useLower, setUseLower] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);
    const [passwords, setPasswords] = useState([]);

    const generate = () => {
        let charset = '';
        if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (useNumbers) charset += '0123456789';
        if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';
        const newPasswords = Array.from({length:5}, () =>
            Array.from(crypto.getRandomValues(new Uint8Array(length))).map(b=>charset[b%charset.length]).join('')
        );
        setPasswords(newPasswords);
    };

    const strength = useMemo(() => {
        const score = [useUpper, useLower, useNumbers, useSymbols].filter(Boolean).length;
        if (length < 8 || score < 2) return {label:'취약',color:'#ef4444',w:'25%'};
        if (length < 12 || score < 3) return {label:'보통',color:'#f59e0b',w:'50%'};
        if (length < 16 || score < 4) return {label:'강함',color:'#22c55e',w:'75%'};
        return {label:'매우 강함',color:'#6366f1',w:'100%'};
    }, [length, useUpper, useLower, useNumbers, useSymbols]);

    useEffect(() => { generate(); }, [length, useUpper, useLower, useNumbers, useSymbols]);

    return (
        <div className="space-y-4">
            <div className={`${S.card} p-4 space-y-4`}>
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className={S.label}>비밀번호 길이</label>
                        <span className="text-xs font-bold text-indigo-400">{length}자</span>
                    </div>
                    <input type="range" min={6} max={64} value={length} onChange={e=>setLength(Number(e.target.value))} className="w-full accent-indigo-500" />
                </div>
                <div>
                    <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">강도</span>
                        <span className="text-xs font-bold" style={{color:strength.color}}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full"><div className="h-full rounded-full transition-all duration-300" style={{background:strength.color,width:strength.w}} /></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[['대문자 (A-Z)',useUpper,setUseUpper],['소문자 (a-z)',useLower,setUseLower],['숫자 (0-9)',useNumbers,setUseNumbers],['특수문자',useSymbols,setUseSymbols]].map(([label,val,set])=>(
                        <label key={label} className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all">
                            <input type="checkbox" checked={val} onChange={e=>set(e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-300">{label}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                {passwords.map((pw,i)=>(
                    <div key={i} className={`${S.card} px-4 py-3 flex items-center justify-between gap-2`}>
                        <code className="text-sm text-slate-200 font-mono break-all">{pw}</code>
                        <CopyBtn text={pw} />
                    </div>
                ))}
            </div>
            <button onClick={generate} className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]" style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
                ↺ 새로 생성
            </button>
        </div>
    );
}

// TAB 4: 파일 해시
function FileHashTab() {
    const [file, setFile] = useState(null);
    const [hashes, setHashes] = useState({});
    const [loading, setLoading] = useState(false);

    const handleFile = async (f) => {
        setFile(f);
        setLoading(true);
        const buf = await f.arrayBuffer();
        const results = {};
        for (const algo of ['SHA-1','SHA-256','SHA-512']) {
            const hashBuf = await crypto.subtle.digest(algo, buf);
            results[algo] = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
        }
        setHashes(results);
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <label className="block cursor-pointer">
                <input type="file" onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])} className="hidden" />
                <div className={`${S.card} p-8 text-center border-dashed hover:border-indigo-500/50 transition-all`}>
                    <div className="text-4xl mb-3">📁</div>
                    <div className="text-sm font-bold text-slate-300">{file ? file.name : '파일을 클릭하거나 드롭하세요'}</div>
                    {file && <div className="text-xs text-slate-500 mt-1">{(file.size/1024).toFixed(1)} KB</div>}
                </div>
            </label>
            {loading && <div className="text-center text-sm text-slate-500">해시 계산 중...</div>}
            {Object.entries(hashes).map(([algo,hash])=>(
                <div key={algo} className={`${S.card} p-4 flex items-start gap-3`}>
                    <span className="text-xs font-black text-indigo-400 w-16 pt-0.5 shrink-0">{algo}</span>
                    <code className="text-xs text-slate-300 font-mono break-all flex-1">{hash}</code>
                    <CopyBtn text={hash} />
                </div>
            ))}
            <div className={`${S.card} p-4`}>
                <label className={S.label}>해시 비교 (다운로드된 파일 검증)</label>
                <input placeholder="공식 해시값을 여기에 붙여넣으세요..." className={S.input} onChange={e=>{
                    const expected = e.target.value.toLowerCase().trim();
                    const match = Object.values(hashes).some(h=>h===expected);
                    e.target.style.borderColor = expected ? (match?'#22c55e':'#ef4444') : '';
                }} />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'hash', label: '해시 생성', icon: '🔑', desc: 'SHA-1/256/384/512 · Base64 인코딩', component: HashTab, chipLabel: '해시' },
    { id: 'loan', label: '대출 계산', icon: '💰', desc: '원리금균등 · 원금균등 상환 계산', component: LoanTab, chipLabel: '대출' },
    { id: 'password', label: '비밀번호 생성', icon: '🔐', desc: '강력한 랜덤 비밀번호 자동 생성', component: PasswordTab, chipLabel: '비밀번호' },
    { id: 'filehash', label: '파일 해시', icon: '📁', desc: '파일 무결성 SHA-256 해시 검증', component: FileHashTab, chipLabel: '파일' },
];

export default function UtilStudio() {
    const [tab, setTab] = useState('hash');
    const Comp = TABS.find(t => t.id === tab)?.component;
    return (
        <StudioLayout
            color={ACCENT}
            icon="⚙️"
            title="Utility Studio"
            description="해시 생성, 대출 이자 계산, 환율 변환, 비밀번호 생성기, 파일 해시 무결성 검증"
            tabs={TABS}
            tab={tab}
            setTab={setTab}>
            {Comp && <Comp />}
        </StudioLayout>
    );
}
