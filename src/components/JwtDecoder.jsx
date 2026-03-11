import React, { useState, useMemo } from 'react';

function base64Decode(str) {
    try {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '==='.slice((base64.length + 3) % 4);
        return JSON.parse(decodeURIComponent(atob(padded).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    } catch { return null; }
}

const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuOCquuFiOuyiCIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNzM2MTIzMDAwLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export default function JwtDecoder() {
    const [token, setToken] = useState('');
    const [copied, setCopied] = useState('');

    const decoded = useMemo(() => {
        const t = token.trim();
        if (!t) return null;
        const parts = t.split('.');
        if (parts.length !== 3) return { error: '올바른 JWT 형식이 아닙니다 (헤더.페이로드.서명)' };
        const header = base64Decode(parts[0]);
        const payload = base64Decode(parts[1]);
        if (!header || !payload) return { error: '디코딩 중 오류가 발생했습니다' };
        return { header, payload, signature: parts[2], raw: parts };
    }, [token]);

    const copyVal = (val, key) => { navigator.clipboard.writeText(JSON.stringify(val, null, 2)); setCopied(key); setTimeout(() => setCopied(''), 1500); };

    const isExpired = decoded?.payload?.exp ? decoded.payload.exp * 1000 < Date.now() : null;
    const expDate = decoded?.payload?.exp ? new Date(decoded.payload.exp * 1000).toLocaleString('ko-KR') : null;
    const iatDate = decoded?.payload?.iat ? new Date(decoded.payload.iat * 1000).toLocaleString('ko-KR') : null;

    const Part = ({ label, data, colorClass, copyKey }) => (
        <div className={`rounded-2xl border overflow-hidden ${colorClass}`}>
            <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-xs font-black uppercase tracking-wider">{label}</span>
                {data && <button onClick={() => copyVal(data, copyKey)} className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${copied === copyKey ? 'bg-white/20' : 'hover:bg-white/10'}`}>{copied === copyKey ? '복사됨' : '복사'}</button>}
            </div>
            <pre className="px-4 pb-4 text-xs font-mono overflow-x-auto leading-relaxed">
                {data ? JSON.stringify(data, null, 2) : '—'}
            </pre>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-white">JWT Decoder</h1>
                        <p className="text-sm text-slate-500 mt-1">JSON Web Token을 헤더·페이로드·서명으로 분해합니다</p>
                    </div>
                    <button onClick={() => setToken(SAMPLE)} className="text-xs px-3 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 shrink-0">예시 불러오기</button>
                </div>

                <div className="relative mb-4">
                    <textarea value={token} onChange={e => setToken(e.target.value)} placeholder="JWT 토큰을 붙여넣으세요..."
                        className="w-full h-28 bg-slate-900 text-slate-200 font-mono text-xs px-4 py-3 rounded-2xl border border-slate-700 outline-none focus:border-indigo-500 resize-none" />
                    {token && <button onClick={() => setToken('')} className="absolute top-2 right-2 text-slate-500 hover:text-white bg-slate-800 rounded-lg p-1 transition-colors">✕</button>}
                </div>

                {/* 구조 시각화 */}
                {decoded && !decoded.error && (
                    <div className="flex gap-1 mb-4 p-3 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto">
                        <span className="text-red-400 break-all">{decoded.raw[0]}</span>
                        <span className="text-slate-600">.</span>
                        <span className="text-emerald-400 break-all">{decoded.raw[1]}</span>
                        <span className="text-slate-600">.</span>
                        <span className="text-blue-400 break-all">{decoded.raw[2]}</span>
                    </div>
                )}

                {decoded?.error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">{decoded.error}</div>
                )}

                {decoded && !decoded.error && (<>
                    {/* 토큰 상태 */}
                    <div className="flex gap-3 mb-4 flex-wrap">
                        {expDate && (
                            <div className={`px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 ${isExpired ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                <span>{isExpired ? '⏰ 만료됨' : '✅ 유효'}</span>
                                <span className="font-normal text-xs opacity-70">만료: {expDate}</span>
                            </div>
                        )}
                        {iatDate && <div className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs">발급: {iatDate}</div>}
                        {decoded.header?.alg && <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">알고리즘: {decoded.header.alg}</div>}
                    </div>

                    <div className="space-y-3">
                        <Part label="🔴 Header (헤더)" data={decoded.header} colorClass="bg-red-500/5 border-red-500/20 text-red-300" copyKey="header" />
                        <Part label="🟢 Payload (페이로드)" data={decoded.payload} colorClass="bg-emerald-500/5 border-emerald-500/20 text-emerald-300" copyKey="payload" />
                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                            <div className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-blue-300">🔵 Signature (서명)</div>
                            <p className="px-4 pb-3 font-mono text-xs text-blue-400 break-all">{decoded.signature}</p>
                            <p className="px-4 pb-4 text-[10px] text-slate-600">⚠️ 서명 검증은 서버 측 비밀키가 필요합니다. 이 도구는 디코딩만 수행합니다.</p>
                        </div>
                    </div>
                </>)}
            </div>
        </div>
    );
}
