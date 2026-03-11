import React, { useState, useCallback } from 'react';

const CHAR_SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    korean_syll: '가나다라마바사아자차카타파하',
};

const STRENGTH = (score) => {
    if (score < 30) return { label: '매우 약함', color: '#ef4444', w: '20%' };
    if (score < 50) return { label: '약함', color: '#f97316', w: '40%' };
    if (score < 70) return { label: '보통', color: '#eab308', w: '60%' };
    if (score < 85) return { label: '강함', color: '#22c55e', w: '80%' };
    return { label: '매우 강함', color: '#06b6d4', w: '100%' };
};

const calcStrength = (pw, opts) => {
    let s = pw.length * 2;
    if (opts.upper) s += 10;
    if (opts.lower) s += 10;
    if (opts.numbers) s += 15;
    if (opts.symbols) s += 25;
    if (pw.length >= 16) s += 15;
    if (pw.length >= 24) s += 10;
    return Math.min(s, 100);
};

const PasswordGenerator = () => {
    const [length, setLength] = useState(16);
    const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
    const [passwords, setPasswords] = useState([]);
    const [count, setCount] = useState(5);
    const [copied, setCopied] = useState(null);

    const generate = useCallback(() => {
        let charset = '';
        if (opts.upper) charset += CHAR_SETS.upper;
        if (opts.lower) charset += CHAR_SETS.lower;
        if (opts.numbers) charset += CHAR_SETS.numbers;
        if (opts.symbols) charset += CHAR_SETS.symbols;
        if (excludeAmbiguous) charset = charset.replace(/[0O1lI]/g, '');
        if (!charset) { setPasswords(['옵션을 하나 이상 선택하세요']); return; }

        const arr = Array.from({ length: count }, () => {
            const pw = [];
            // 각 선택된 집합에서 최소 1개씩 포함
            if (opts.upper) pw.push(CHAR_SETS.upper[Math.floor(Math.random() * CHAR_SETS.upper.length)]);
            if (opts.lower) pw.push(CHAR_SETS.lower[Math.floor(Math.random() * CHAR_SETS.lower.length)]);
            if (opts.numbers) pw.push(CHAR_SETS.numbers[Math.floor(Math.random() * CHAR_SETS.numbers.length)]);
            if (opts.symbols) pw.push(CHAR_SETS.symbols[Math.floor(Math.random() * CHAR_SETS.symbols.length)]);
            while (pw.length < length) pw.push(charset[Math.floor(Math.random() * charset.length)]);
            return pw.sort(() => Math.random() - 0.5).join('');
        });
        setPasswords(arr);
        setCopied(null);
    }, [length, opts, count, excludeAmbiguous]);

    const copy = (pw, i) => {
        navigator.clipboard.writeText(pw).then(() => { setCopied(i); setTimeout(() => setCopied(null), 2000); }).catch(()=>{});
    };

    const strength = passwords[0] ? STRENGTH(calcStrength(passwords[0], opts)) : null;

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.2), rgba(239,68,68,0.1))', border: '1px solid rgba(248,113,113,0.2)' }}>🔐</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">비밀번호 생성기</h1>
                        <p className="text-xs text-slate-500">강력한 랜덤 비밀번호 즉시 생성</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5">
                    {/* 설정 */}
                    <div className="lg:w-72 shrink-0 space-y-4">
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                                길이: <span className="text-red-400">{length}자</span>
                            </h3>
                            <input type="range" min={4} max={64} value={length} onChange={e => setLength(Number(e.target.value))}
                                className="w-full accent-red-500 cursor-pointer" style={{ background: 'transparent', border: 'none' }} />
                            <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>4</span><span>64</span></div>
                        </div>

                        <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">문자 유형</h3>
                            {[
                                { key: 'upper', label: '대문자 A-Z', sample: 'ABC' },
                                { key: 'lower', label: '소문자 a-z', sample: 'abc' },
                                { key: 'numbers', label: '숫자 0-9', sample: '123' },
                                { key: 'symbols', label: '특수문자 !@#', sample: '!@#' },
                            ].map(o => (
                                <label key={o.key} className="flex items-center gap-3 cursor-pointer p-1 rounded hover:bg-white/5">
                                    <input type="checkbox" checked={opts[o.key]} onChange={e => setOpts(p => ({ ...p, [o.key]: e.target.checked }))} className="accent-red-500 w-4 h-4" style={{ background: 'transparent', border: 'none' }} />
                                    <span className="text-xs text-slate-300 flex-1">{o.label}</span>
                                    <span className="text-[11px] font-mono text-slate-600">{o.sample}</span>
                                </label>
                            ))}
                            <div className="pt-2 border-t border-white/[0.06]">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={excludeAmbiguous} onChange={e => setExcludeAmbiguous(e.target.checked)} className="accent-red-500 w-4 h-4" style={{ background: 'transparent', border: 'none' }} />
                                    <span className="text-xs text-slate-400">혼동 문자 제외 (0, O, 1, l, I)</span>
                                </label>
                            </div>
                        </div>

                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">생성 개수: <span className="text-red-400">{count}</span></h3>
                            <input type="range" min={1} max={20} value={count} onChange={e => setCount(Number(e.target.value))}
                                className="w-full accent-red-500" style={{ background: 'transparent', border: 'none' }} />
                        </div>

                        <button onClick={generate}
                            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.3)' }}>
                            🔐 생성하기
                        </button>
                    </div>

                    {/* 결과 */}
                    <div className="flex-1">
                        {strength && (
                            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-500">보안 강도</span>
                                    <span className="text-xs font-bold" style={{ color: strength.color }}>{strength.label}</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: strength.w, background: strength.color }} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {passwords.map((pw, i) => (
                                <div key={i} className="group flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <span className="flex-1 font-mono text-sm text-slate-100 break-all">{pw}</span>
                                    <button onClick={() => copy(pw, i)}
                                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                        style={copied === i
                                            ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                                            : { background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {copied === i ? '✓' : '복사'}
                                    </button>
                                </div>
                            ))}
                            {passwords.length === 0 && (
                                <div className="h-48 flex flex-col items-center justify-center rounded-xl" style={{ border: '2px dashed rgba(255,255,255,0.07)' }}>
                                    <div className="text-3xl mb-3">🔐</div>
                                    <p className="text-slate-500 text-sm">설정 후 생성 버튼을 눌러주세요</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordGenerator;
