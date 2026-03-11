import React, { useState, useCallback } from 'react';

/* ══════════════════════════════════════════════════════════
   암호화 & 인코더 스튜디오
   - 인코딩 탭: Base64 / URL / HTML Entity / ROT13 (양방향)
   - 해시 탭: MD5(순수 JS) / SHA-1 / SHA-256 / SHA-512 (SubtleCrypto)
   - JWT 디코더: Header / Payload / Signature 파싱 + 만료 표시
══════════════════════════════════════════════════════════ */

// ── 간이 MD5 구현 (라이브러리 없이 브라우저 내장) ──
function md5(str) {
    function safeAdd(x, y) { const lsw = (x & 0xFFFF) + (y & 0xFFFF); const msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }
    function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
    function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
    function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
    function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
    function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
    function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

    const utf8Str = unescape(encodeURIComponent(str));
    const binaryStr = utf8Str.split('').map(c => c.charCodeAt(0));
    const msgLen = binaryStr.length;
    binaryStr.push(0x80);
    while (binaryStr.length % 64 !== 56) binaryStr.push(0);
    const bitLen = msgLen * 8;
    binaryStr.push(bitLen & 0xFF, (bitLen >>> 8) & 0xFF, (bitLen >>> 16) & 0xFF, (bitLen >>> 24) & 0xFF, 0, 0, 0, 0);
    const M = [];
    for (let i = 0; i < binaryStr.length; i += 4) M.push(binaryStr[i] | (binaryStr[i+1] << 8) | (binaryStr[i+2] << 16) | (binaryStr[i+3] << 24));

    let [a, b, c, d] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    for (let i = 0; i < M.length; i += 16) {
        const [A,B,C,D] = [a,b,c,d];
        a=md5ff(a,b,c,d,M[i],7,-680876936); d=md5ff(d,a,b,c,M[i+1],12,-389564586); c=md5ff(c,d,a,b,M[i+2],17,606105819); b=md5ff(b,c,d,a,M[i+3],22,-1044525330);
        a=md5ff(a,b,c,d,M[i+4],7,-176418897); d=md5ff(d,a,b,c,M[i+5],12,1200080426); c=md5ff(c,d,a,b,M[i+6],17,-1473231341); b=md5ff(b,c,d,a,M[i+7],22,-45705983);
        a=md5ff(a,b,c,d,M[i+8],7,1770035416); d=md5ff(d,a,b,c,M[i+9],12,-1958414417); c=md5ff(c,d,a,b,M[i+10],17,-42063); b=md5ff(b,c,d,a,M[i+11],22,-1990404162);
        a=md5ff(a,b,c,d,M[i+12],7,1804603682); d=md5ff(d,a,b,c,M[i+13],12,-40341101); c=md5ff(c,d,a,b,M[i+14],17,-1502002290); b=md5ff(b,c,d,a,M[i+15],22,1236535329);
        a=md5gg(a,b,c,d,M[i+1],5,-165796510); d=md5gg(d,a,b,c,M[i+6],9,-1069501632); c=md5gg(c,d,a,b,M[i+11],14,643717713); b=md5gg(b,c,d,a,M[i],20,-373897302);
        a=md5gg(a,b,c,d,M[i+5],5,-701558691); d=md5gg(d,a,b,c,M[i+10],9,38016083); c=md5gg(c,d,a,b,M[i+15],14,-660478335); b=md5gg(b,c,d,a,M[i+4],20,-405537848);
        a=md5gg(a,b,c,d,M[i+9],5,568446438); d=md5gg(d,a,b,c,M[i+14],9,-1019803690); c=md5gg(c,d,a,b,M[i+3],14,-187363961); b=md5gg(b,c,d,a,M[i+8],20,1163531501);
        a=md5gg(a,b,c,d,M[i+13],5,-1444681467); d=md5gg(d,a,b,c,M[i+2],9,-51403784); c=md5gg(c,d,a,b,M[i+7],14,1735328473); b=md5gg(b,c,d,a,M[i+12],20,-1926607734);
        a=md5hh(a,b,c,d,M[i+5],4,-378558); d=md5hh(d,a,b,c,M[i+8],11,-2022574463); c=md5hh(c,d,a,b,M[i+11],16,1839030562); b=md5hh(b,c,d,a,M[i+14],23,-35309556);
        a=md5hh(a,b,c,d,M[i+1],4,-1530992060); d=md5hh(d,a,b,c,M[i+4],11,1272893353); c=md5hh(c,d,a,b,M[i+7],16,-155497632); b=md5hh(b,c,d,a,M[i+10],23,-1094730640);
        a=md5hh(a,b,c,d,M[i+13],4,681279174); d=md5hh(d,a,b,c,M[i],11,-358537222); c=md5hh(c,d,a,b,M[i+3],16,-722521979); b=md5hh(b,c,d,a,M[i+6],23,76029189);
        a=md5hh(a,b,c,d,M[i+9],4,-640364487); d=md5hh(d,a,b,c,M[i+12],11,-421815835); c=md5hh(c,d,a,b,M[i+15],16,530742520); b=md5hh(b,c,d,a,M[i+2],23,-995338651);
        a=md5ii(a,b,c,d,M[i],6,-198630844); d=md5ii(d,a,b,c,M[i+7],10,1126891415); c=md5ii(c,d,a,b,M[i+14],15,-1416354905); b=md5ii(b,c,d,a,M[i+5],21,-57434055);
        a=md5ii(a,b,c,d,M[i+12],6,1700485571); d=md5ii(d,a,b,c,M[i+3],10,-1894986606); c=md5ii(c,d,a,b,M[i+10],15,-1051523); b=md5ii(b,c,d,a,M[i+1],21,-2054922799);
        a=md5ii(a,b,c,d,M[i+8],6,1873313359); d=md5ii(d,a,b,c,M[i+15],10,-30611744); c=md5ii(c,d,a,b,M[i+6],15,-1560198380); b=md5ii(b,c,d,a,M[i+13],21,1309151649);
        a=md5ii(a,b,c,d,M[i+4],6,-145523070); d=md5ii(d,a,b,c,M[i+11],10,-1120210379); c=md5ii(c,d,a,b,M[i+2],15,718787259); b=md5ii(b,c,d,a,M[i+9],21,-343485551);
        a=safeAdd(a,A); b=safeAdd(b,B); c=safeAdd(c,C); d=safeAdd(d,D);
    }
    return [a,b,c,d].map(n => { let s=''; for(let i=0;i<4;i++) s+=('0'+((n>>>(i*8))&0xFF).toString(16)).slice(-2); return s; }).join('');
}

// ── ROT13 ──
const rot13 = str => str.replace(/[A-Za-z]/g, c => {
    const b = c.charCodeAt(0); const base = b < 91 ? 65 : 97;
    return String.fromCharCode(((b - base + 13) % 26) + base);
});

// ── HTML Entity 인코딩/디코딩 ──
const htmlEncode = str => str.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
const htmlDecode = str => str.replace(/&lt;|&gt;|&amp;|&quot;|&#39;/g, m => ({'&lt;':'<','&gt;':'>','&amp;':'&','&quot;':'"','&#39;':"'"}[m]));

// ── SubtleCrypto SHA ──
async function shaHash(algorithm, str) {
    const enc = new TextEncoder();
    const data = enc.encode(str);
    const hashBuf = await crypto.subtle.digest(algorithm, data);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── JWT 디코딩 ──
function decodeJwt(token) {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const decodeB64 = (s) => {
        try {
            const padded = s.replace(/-/g,'+').replace(/_/g,'/').padEnd(s.length + (4 - s.length % 4) % 4, '=');
            return JSON.parse(atob(padded));
        } catch { return null; }
    };
    const header  = decodeB64(parts[0]);
    const payload = decodeB64(parts[1]);
    return { header, payload, signature: parts[2] };
}

// ── 유틸리티 ──
const copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => {}).catch(() => {});

const TABS = [
    { id: 'encoding', label: '🔤 인코딩', desc: 'Base64 / URL / HTML / ROT13' },
    { id: 'hash',     label: '🔐 해시',   desc: 'MD5 / SHA-1 / SHA-256 / SHA-512' },
    { id: 'jwt',      label: '🪪 JWT',    desc: 'Header / Payload / 만료 시간' },
];

const CopyBtn = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button onClick={handleCopy} className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-bold ${copied ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {copied ? '✓ 복사됨' : '복사'}
        </button>
    );
};

const ResultBox = ({ label, value, mono = true }) => (
    <div className="bg-slate-900/60 border border-white/[0.07] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">{label}</span>
            {value && <CopyBtn text={value} />}
        </div>
        <div className={`text-sm text-slate-200 break-all leading-relaxed min-h-[2rem] ${mono ? 'font-mono' : ''}`}>
            {value || <span className="text-slate-700">—</span>}
        </div>
    </div>
);

export default function CryptoEncoderStudio() {
    const [activeTab, setActiveTab] = useState('encoding');

    // ── 인코딩 탭 상태 ──
    const [encInput, setEncInput]     = useState('Hello, VaultSheet!');
    const [encMode, setEncMode]       = useState('base64');
    const [encDirection, setEncDirection] = useState('encode');
    const [encOutput, setEncOutput]   = useState('');

    // ── 해시 탭 상태 ──
    const [hashInput, setHashInput]   = useState('');
    const [hashes, setHashes]         = useState({});
    const [hashLoading, setHashLoading] = useState(false);

    // ── JWT 탭 상태 ──
    const [jwtInput, setJwtInput]     = useState('');
    const [jwtResult, setJwtResult]   = useState(null);
    const [jwtError, setJwtError]     = useState('');

    // ── 인코딩 실행 ──
    const runEncoding = useCallback(() => {
        if (!encInput) { setEncOutput(''); return; }
        try {
            let result = '';
            if (encMode === 'base64') {
                result = encDirection === 'encode'
                    ? btoa(unescape(encodeURIComponent(encInput)))
                    : decodeURIComponent(escape(atob(encInput)));
            } else if (encMode === 'url') {
                result = encDirection === 'encode' ? encodeURIComponent(encInput) : decodeURIComponent(encInput);
            } else if (encMode === 'html') {
                result = encDirection === 'encode' ? htmlEncode(encInput) : htmlDecode(encInput);
            } else if (encMode === 'rot13') {
                result = rot13(encInput);
            }
            setEncOutput(result);
        } catch (e) {
            setEncOutput(`오류: ${e.message}`);
        }
    }, [encInput, encMode, encDirection]);

    React.useEffect(() => { runEncoding(); }, [runEncoding]);

    // ── 해시 계산 ──
    const computeHashes = useCallback(async () => {
        if (!hashInput) { setHashes({}); return; }
        setHashLoading(true);
        const results = {};
        results['MD5'] = md5(hashInput);
        results['SHA-1']   = await shaHash('SHA-1',   hashInput);
        results['SHA-256'] = await shaHash('SHA-256', hashInput);
        results['SHA-512'] = await shaHash('SHA-512', hashInput);
        setHashes(results);
        setHashLoading(false);
    }, [hashInput]);

    React.useEffect(() => {
        const timer = setTimeout(() => computeHashes(), 300);
        return () => clearTimeout(timer);
    }, [computeHashes]);

    // ── JWT 디코딩 ──
    const decodeJwtToken = () => {
        if (!jwtInput.trim()) { setJwtResult(null); setJwtError(''); return; }
        const result = decodeJwt(jwtInput.trim());
        if (!result) { setJwtError('유효하지 않은 JWT 형식입니다. (xxx.yyy.zzz 형식이어야 합니다)'); setJwtResult(null); }
        else { setJwtResult(result); setJwtError(''); }
    };

    const getExpInfo = (payload) => {
        if (!payload?.exp) return null;
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        const expired = expDate < now;
        const diffMs = Math.abs(expDate - now);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        return { date: expDate.toLocaleString(), expired, diffHours, diffMins };
    };

    const encModes = [
        { id: 'base64', label: 'Base64' },
        { id: 'url',    label: 'URL' },
        { id: 'html',   label: 'HTML Entity' },
        { id: 'rot13',  label: 'ROT13' },
    ];

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08] text-lg">🔐</div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">암호화 & 인코더 스튜디오</h2>
                        <p className="text-xs text-slate-500">Base64 · URL · HTML · ROT13 · SHA · MD5 · JWT — 100% 오프라인</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[11px] text-emerald-400 font-bold">Offline Ready</span>
                </div>
            </div>

            {/* 탭 */}
            <div className="flex gap-2 mb-5 flex-shrink-0">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all ${
                            activeTab === tab.id
                                ? 'bg-sky-600/15 border-sky-500/40 text-sky-300'
                                : 'bg-slate-900/60 border-white/[0.07] text-slate-500 hover:text-slate-300 hover:border-slate-600'
                        }`}
                    >
                        <span className="text-sm font-bold">{tab.label}</span>
                        <span className="text-[10px] text-current opacity-60 mt-0.5">{tab.desc}</span>
                    </button>
                ))}
            </div>

            {/* ── 인코딩 탭 ── */}
            {activeTab === 'encoding' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    {/* 모드 선택 */}
                    <div className="flex gap-2 flex-wrap">
                        {encModes.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setEncMode(m.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                    encMode === m.id
                                        ? 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                                        : 'bg-slate-900/60 border-white/[0.07] text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                        {encMode !== 'rot13' && (
                            <div className="ml-auto flex bg-slate-900 rounded-xl p-1 border border-white/[0.05]">
                                {['encode', 'decode'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setEncDirection(d)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                            encDirection === d ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        {d === 'encode' ? '인코딩' : '디코딩'}
                                    </button>
                                ))}
                            </div>
                        )}
                        {encMode === 'rot13' && (
                            <span className="ml-auto text-xs text-slate-600 self-center">ROT13은 양방향 동일</span>
                        )}
                    </div>

                    {/* 입력 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wide">입력</label>
                            <button onClick={() => setEncInput('')} className="text-[10px] text-slate-600 hover:text-red-400">초기화</button>
                        </div>
                        <textarea
                            value={encInput}
                            onChange={e => setEncInput(e.target.value)}
                            placeholder="변환할 텍스트를 입력하세요..."
                            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 font-mono outline-none focus:border-sky-500 resize-none custom-scrollbar"
                        />
                    </div>

                    {/* 화살표 */}
                    <div className="flex items-center justify-center text-slate-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </div>

                    {/* 출력 */}
                    <ResultBox
                        label={`${encModes.find(m => m.id === encMode)?.label} ${encMode !== 'rot13' ? (encDirection === 'encode' ? '인코딩 결과' : '디코딩 결과') : '변환 결과'}`}
                        value={encOutput}
                    />
                </div>
            )}

            {/* ── 해시 탭 ── */}
            {activeTab === 'hash' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wide block mb-2">해시할 텍스트</label>
                        <textarea
                            value={hashInput}
                            onChange={e => setHashInput(e.target.value)}
                            placeholder="해시를 계산할 텍스트 또는 데이터를 입력하세요..."
                            className="w-full h-28 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 font-mono outline-none focus:border-sky-500 resize-none custom-scrollbar"
                        />
                    </div>

                    {hashLoading && (
                        <div className="text-xs text-slate-500 text-center">계산 중...</div>
                    )}

                    {Object.keys(hashes).length > 0 && (
                        <div className="space-y-3">
                            {Object.entries(hashes).map(([algo, hash]) => (
                                <div key={algo} className="bg-slate-900/60 border border-white/[0.07] rounded-xl p-3.5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                                            algo === 'MD5' ? 'bg-orange-500/15 text-orange-400' :
                                            algo === 'SHA-1' ? 'bg-amber-500/15 text-amber-400' :
                                            algo === 'SHA-256' ? 'bg-sky-500/15 text-sky-400' :
                                            'bg-violet-500/15 text-violet-400'
                                        }`}>{algo}</span>
                                        <CopyBtn text={hash} />
                                    </div>
                                    <code className="text-xs font-mono text-slate-300 break-all leading-relaxed block">{hash}</code>
                                    <div className="mt-1.5 text-[10px] text-slate-700">{hash.length * 4}bit · {hash.length}자</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!hashInput && (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-700 text-sm">
                            위에 텍스트를 입력하면 실시간으로 해시가 계산됩니다
                        </div>
                    )}

                    <div className="p-3 bg-amber-500/8 border border-amber-500/15 rounded-xl text-xs text-amber-400/70 leading-relaxed">
                        ⚠️ MD5, SHA-1은 보안상 취약합니다. 비밀번호 저장에는 SHA-256 이상을 권장합니다. 모든 계산은 브라우저에서만 이루어집니다.
                    </div>
                </div>
            )}

            {/* ── JWT 디코더 탭 ── */}
            {activeTab === 'jwt' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wide block mb-2">JWT 토큰 붙여넣기</label>
                        <textarea
                            value={jwtInput}
                            onChange={e => setJwtInput(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 font-mono outline-none focus:border-sky-500 resize-none custom-scrollbar"
                        />
                        <button
                            onClick={decodeJwtToken}
                            className="mt-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20"
                        >
                            디코딩
                        </button>
                    </div>

                    {jwtError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{jwtError}</div>
                    )}

                    {jwtResult && (
                        <div className="space-y-3">
                            {/* 만료 상태 */}
                            {jwtResult.payload && (() => {
                                const info = getExpInfo(jwtResult.payload);
                                if (!info) return null;
                                return (
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                                        info.expired
                                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                                            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                    }`}>
                                        <span className="text-xl">{info.expired ? '⏰' : '✅'}</span>
                                        <div>
                                            <div className="text-sm font-bold">{info.expired ? '토큰 만료됨' : '토큰 유효'}</div>
                                            <div className="text-xs opacity-75">
                                                만료: {info.date} {!info.expired && `(${info.diffHours}시간 ${info.diffMins}분 남음)`}
                                                {info.expired && `(${info.diffHours}시간 ${info.diffMins}분 경과)`}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Header */}
                            <div className="bg-slate-900/60 border border-white/[0.07] rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/10 border-b border-white/[0.07]">
                                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wide">Header</span>
                                    <CopyBtn text={JSON.stringify(jwtResult.header, null, 2)} />
                                </div>
                                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">{JSON.stringify(jwtResult.header, null, 2)}</pre>
                            </div>

                            {/* Payload */}
                            <div className="bg-slate-900/60 border border-white/[0.07] rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-sky-500/10 border-b border-white/[0.07]">
                                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">Payload</span>
                                    <CopyBtn text={JSON.stringify(jwtResult.payload, null, 2)} />
                                </div>
                                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">{JSON.stringify(jwtResult.payload, null, 2)}</pre>
                            </div>

                            {/* Signature */}
                            <div className="bg-slate-900/60 border border-white/[0.07] rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-orange-500/10 border-b border-white/[0.07]">
                                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Signature (미검증)</span>
                                    <CopyBtn text={jwtResult.signature} />
                                </div>
                                <div className="p-4 text-xs font-mono text-slate-500 break-all">{jwtResult.signature}</div>
                            </div>

                            <div className="text-[11px] text-slate-700 text-center">서명 검증에는 Secret Key가 필요합니다. 이 도구는 페이로드 파싱만 수행합니다.</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
