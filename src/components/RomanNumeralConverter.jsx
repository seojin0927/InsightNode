import React, { useState } from 'react';

const ROMAN_MAP = [
    [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],
    [50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']
];

const toRoman = (n) => {
    if (!Number.isInteger(n) || n < 1 || n > 3999) return null;
    let result = '';
    for (const [val, sym] of ROMAN_MAP) {
        while (n >= val) { result += sym; n -= val; }
    }
    return result;
};

const fromRoman = (s) => {
    const vals = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
    let result = 0;
    const str = s.toUpperCase().trim();
    for (let i = 0; i < str.length; i++) {
        const curr = vals[str[i]];
        const next = vals[str[i+1]];
        if (!curr) return null;
        if (next && curr < next) result -= curr;
        else result += curr;
    }
    return result;
};

const RomanNumeralConverter = () => {
    const [arabic, setArabic] = useState('');
    const [roman, setRoman] = useState('');
    const [error, setError] = useState('');

    const handleArabic = (v) => {
        setArabic(v);
        setError('');
        const n = parseInt(v);
        if (!v) { setRoman(''); return; }
        const r = toRoman(n);
        if (r === null) { setError('1 ~ 3999 사이의 정수만 변환 가능합니다.'); setRoman(''); }
        else setRoman(r);
    };

    const handleRoman = (v) => {
        setRoman(v);
        setError('');
        if (!v) { setArabic(''); return; }
        const n = fromRoman(v);
        if (!n) { setError('유효한 로마 숫자를 입력하세요.'); setArabic(''); }
        else setArabic(String(n));
    };

    const Table = () => (
        <div className="grid grid-cols-2 gap-2">
            {ROMAN_MAP.map(([val, sym]) => (
                <div key={sym} className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onClick={() => handleArabic(String(val))}>
                    <span className="text-sm font-bold text-amber-400">{sym}</span>
                    <span className="text-sm font-mono text-slate-300">{val}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))', border: '1px solid rgba(251,191,36,0.2)' }}>🏛️</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">로마 숫자 변환기</h1>
                        <p className="text-xs text-slate-500">아라비아 숫자 ↔ 로마 숫자 (1 ~ 3999)</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 flex-1">
                    <div className="flex-1 space-y-4">
                        {/* 아라비아 → 로마 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">아라비아 숫자</label>
                            <input type="number" min={1} max={3999} value={arabic} onChange={e => handleArabic(e.target.value)} placeholder="1 ~ 3999" className="w-full px-4 py-3 text-xl rounded-xl outline-none font-mono text-center" />
                        </div>

                        {error && <div className="px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>⚠️ {error}</div>}

                        {/* 로마 → 아라비아 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">로마 숫자</label>
                            <input type="text" value={roman} onChange={e => handleRoman(e.target.value)} placeholder="예: XIV, MCMXCIX" className="w-full px-4 py-3 text-xl rounded-xl outline-none font-mono text-center tracking-widest uppercase" />
                        </div>

                        {arabic && roman && !error && (
                            <div className="flex items-center justify-center gap-8 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(99,102,241,0.06))', border: '1px solid rgba(251,191,36,0.15)' }}>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-slate-100 font-mono">{arabic}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Arabic</div>
                                </div>
                                <div className="text-2xl text-slate-600">⇔</div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-amber-400 tracking-widest">{roman}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Roman</div>
                                </div>
                            </div>
                        )}

                        {/* 년도 버튼 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">주요 연도</h3>
                            <div className="flex flex-wrap gap-2">
                                {[2024, 2023, 2000, 1999, 1776, 1492, 1066, 753].map(y => (
                                    <button key={y} onClick={() => handleArabic(String(y))}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 참조표 */}
                    <div className="lg:w-64 shrink-0">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">로마 숫자 기본 기호</h3>
                        <Table />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RomanNumeralConverter;
