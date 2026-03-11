import React, { useState } from 'react';

const PRESETS = [
    { name: 'Ocean', stops: [{ color: '#0ea5e9', pos: 0 }, { color: '#6366f1', pos: 100 }] },
    { name: 'Sunset', stops: [{ color: '#f97316', pos: 0 }, { color: '#ec4899', pos: 100 }] },
    { name: 'Forest', stops: [{ color: '#22c55e', pos: 0 }, { color: '#0d9488', pos: 100 }] },
    { name: 'Candy', stops: [{ color: '#f472b6', pos: 0 }, { color: '#a78bfa', pos: 50 }, { color: '#38bdf8', pos: 100 }] },
    { name: 'Fire', stops: [{ color: '#fbbf24', pos: 0 }, { color: '#ef4444', pos: 100 }] },
    { name: 'Night', stops: [{ color: '#1e1b4b', pos: 0 }, { color: '#312e81', pos: 50 }, { color: '#0f172a', pos: 100 }] },
    { name: 'Mint', stops: [{ color: '#a7f3d0', pos: 0 }, { color: '#06b6d4', pos: 100 }] },
    { name: 'Aurora', stops: [{ color: '#4ade80', pos: 0 }, { color: '#60a5fa', pos: 50 }, { color: '#c084fc', pos: 100 }] },
];

const GradientGenerator = () => {
    const [type, setType] = useState('linear');
    const [angle, setAngle] = useState(135);
    const [stops, setStops] = useState([
        { color: '#0ea5e9', pos: 0 },
        { color: '#6366f1', pos: 100 },
    ]);
    const [copied, setCopied] = useState(false);

    const sortedStops = [...stops].sort((a, b) => a.pos - b.pos);

    const getCss = () => {
        const stopsStr = sortedStops.map(s => `${s.color} ${s.pos}%`).join(', ');
        if (type === 'linear') return `linear-gradient(${angle}deg, ${stopsStr})`;
        if (type === 'radial') return `radial-gradient(circle, ${stopsStr})`;
        return `conic-gradient(from ${angle}deg, ${stopsStr})`;
    };

    const css = getCss();

    const copy = (text) => {
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(()=>{});
    };

    const addStop = () => setStops(p => [...p, { color: '#ffffff', pos: 50 }]);
    const removeStop = (i) => { if (stops.length <= 2) return; setStops(p => p.filter((_, j) => j !== i)); };
    const updateStop = (i, field, val) => setStops(p => p.map((s, j) => j === i ? { ...s, [field]: val } : s));

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(236,72,153,0.2)' }}>🎨</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">CSS 그라데이션 생성기</h1>
                        <p className="text-xs text-slate-500">아름다운 CSS 그라데이션 즉시 생성 · 복사</p>
                    </div>
                </div>

                {/* 미리보기 */}
                <div className="h-40 rounded-2xl mb-5 shrink-0 flex items-end p-4" style={{ background: css, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                    <div className="w-full rounded-xl p-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                        <code className="text-xs font-mono text-white truncate">{css}</code>
                        <button onClick={() => copy(css)} className="ml-2 shrink-0 px-3 py-1 rounded-lg text-xs font-bold text-white transition-all" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            {copied ? '✓ 복사됨' : '복사'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5">
                    {/* 컨트롤 */}
                    <div className="lg:w-72 shrink-0 space-y-4">
                        {/* 유형 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">유형</h3>
                            <div className="flex gap-1">
                                {[{ id: 'linear', l: 'Linear' }, { id: 'radial', l: 'Radial' }, { id: 'conic', l: 'Conic' }].map(t => (
                                    <button key={t.id} onClick={() => setType(t.id)}
                                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                                        style={type === t.id ? { background: 'rgba(236,72,153,0.2)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)' } : { color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {t.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 각도 */}
                        {(type === 'linear' || type === 'conic') && (
                            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">각도</h3>
                                    <span className="text-xs font-mono text-pink-400">{angle}°</span>
                                </div>
                                <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full accent-pink-500" style={{ background: 'transparent', border: 'none' }} />
                            </div>
                        )}

                        {/* 색상 중지점 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">색상 중지점</h3>
                                <button onClick={addStop} className="text-xs text-pink-400 hover:text-pink-300 transition-colors">+ 추가</button>
                            </div>
                            <div className="space-y-3">
                                {stops.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input type="color" value={s.color} onChange={e => updateStop(i, 'color', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer" style={{ background: 'transparent', border: 'none', padding: 0 }} />
                                        <div className="flex-1">
                                            <input type="range" min={0} max={100} value={s.pos} onChange={e => updateStop(i, 'pos', Number(e.target.value))} className="w-full accent-pink-500" style={{ background: 'transparent', border: 'none' }} />
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-500 w-8 text-right">{s.pos}%</span>
                                        <button onClick={() => removeStop(i)} disabled={stops.length <= 2} className="text-slate-700 hover:text-red-400 disabled:opacity-20 transition-colors">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CSS 전체 코드 */}
                        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">CSS 코드</h3>
                                <button onClick={() => copy(`background: ${css};`)} className="text-[10px] text-slate-500 hover:text-slate-300">{copied ? '✓' : '복사'}</button>
                            </div>
                            <code className="text-[11px] font-mono text-slate-400 break-all">background: {css};</code>
                        </div>
                    </div>

                    {/* 프리셋 */}
                    <div className="flex-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🎨 프리셋 갤러리</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {PRESETS.map(p => {
                                const pg = `linear-gradient(135deg, ${p.stops.map(s => `${s.color} ${s.pos}%`).join(', ')})`;
                                return (
                                    <button key={p.name} onClick={() => setStops(p.stops)}
                                        className="rounded-xl overflow-hidden group transition-all hover:scale-105 hover:shadow-lg"
                                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="h-16" style={{ background: pg }} />
                                        <div className="p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{p.name}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradientGenerator;
