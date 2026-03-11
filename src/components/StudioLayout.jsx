import React from 'react';

// ── 공통 스타일 토큰 ──────────────────────────────────────────────
export const S = {
    label: "text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5",
    input: "w-full bg-slate-800/60 text-slate-200 px-3 py-2 rounded-lg border border-slate-700/60 outline-none focus:border-sky-500/60 transition-all text-sm placeholder:text-slate-600",
    textarea: "w-full bg-slate-800/60 text-slate-200 font-mono text-sm px-3 py-2.5 rounded-lg border border-slate-700/60 outline-none focus:border-sky-500/60 resize-none transition-all placeholder:text-slate-600",
    card: "bg-slate-800/40 rounded-xl border border-white/[0.06]",
    btn: (active) => `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? 'bg-sky-600 text-white' : 'bg-slate-700/50 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'}`,
    btnStyle: (active, color) => active ? { background: `linear-gradient(135deg, ${color}cc, ${color}90)`, color: '#fff', border: 'none' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' },
};

export function CopyBtn({ text, label = '복사' }) {
    const [done, setDone] = React.useState(false);
    const copy = () => { navigator.clipboard.writeText(text ?? ''); setDone(true); setTimeout(() => setDone(false), 1400); };
    return (
        <button onClick={copy}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${done ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'}`}
            style={done ? {} : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {done ? '✓ 복사됨' : label}
        </button>
    );
}

export function Slider({ label, value, setValue, min, max, step = 1, unit = '', accent = '#6366f1' }) {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
                <span className="text-xs font-black" style={{ color: accent }}>{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => setValue(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: accent, background: `linear-gradient(to right, ${accent}80 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%)` }}
            />
        </div>
    );
}

// ── 메인 스튜디오 레이아웃 (PersonalDataMasker 스타일) ──────────────
export default function StudioLayout({ color, icon, title, description, tabs, tab, setTab, children, headerRight }) {
    const activeTab = tabs.find(t => t.id === tab);
    const isMultiTab = tabs.length > 1;

    return (
        <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: '#08101e' }}>

            {/* ── 상단 헤더 (Pdf/UUID 스타일 참조) ── */}
            <div className="flex items-center gap-3 px-5 py-3 mb-3 border-b border-white/[0.06] shrink-0 flex-wrap gap-y-2">
                {/* 아이콘 + 제목 */}
                <div className="flex items-center gap-3 min-w-0" style={{ flex: '0 0 auto' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-black text-white leading-none">{title}</h1>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest leading-none hidden sm:block"
                                style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>STUDIO</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-none hidden md:block">{description}</p>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                {isMultiTab && (
                    <div className="flex gap-1 p-1 rounded-xl ml-auto flex-wrap"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1"
                                style={tab === t.id ? {
                                    background: `linear-gradient(135deg, ${color}cc, ${color}90)`,
                                    color: '#fff', boxShadow: `0 2px 8px ${color}40`
                                } : { color: '#64748b' }}>
                                {t.icon && <span className="text-sm leading-none">{t.icon}</span>}
                                <span>{t.chipLabel || t.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                {headerRight && <div className="ml-auto">{headerRight}</div>}
            </div>

            {/* ── 스크롤 가능한 컨텐츠 영역 ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
