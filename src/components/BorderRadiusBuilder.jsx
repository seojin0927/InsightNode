import React, { useState } from 'react';

export default function BorderRadiusBuilder() {
    const [tl, setTl] = useState(16);
    const [tr, setTr] = useState(16);
    const [br, setBr] = useState(16);
    const [bl, setBl] = useState(16);
    const [linked, setLinked] = useState(true);
    const [unit, setUnit] = useState('px');
    const [boxSize, setBoxSize] = useState(160);
    const [bgColor, setBgColor] = useState('#6366f1');
    const [copied, setCopied] = useState(false);

    const set = (corner, val) => {
        const v = Math.min(200, Math.max(0, Number(val)));
        if (linked) { setTl(v); setTr(v); setBr(v); setBl(v); }
        else { if(corner==='tl') setTl(v); if(corner==='tr') setTr(v); if(corner==='br') setBr(v); if(corner==='bl') setBl(v); }
    };

    const cssValue = tl===tr&&tr===br&&br===bl ? `${tl}${unit}` : `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;
    const cssCode = `border-radius: ${cssValue};`;
    const copy = () => { navigator.clipboard.writeText(cssCode); setCopied(true); setTimeout(()=>setCopied(false),1500); };

    const PRESETS = [
        { name: '정사각형', vals: [0,0,0,0] }, { name: '소프트', vals: [8,8,8,8] }, { name: '카드', vals: [16,16,16,16] },
        { name: '원형', vals: [50,50,50,50] }, { name: '말풍선', vals: [16,16,16,4] }, { name: '물방울', vals: [60,40,60,40] },
        { name: '사탕', vals: [50,10,50,10] }, { name: '비대칭', vals: [30,0,30,0] },
    ];

    const corners = [
        { id:'tl', label:'좌상', val:tl, row:0, col:0 },
        { id:'tr', label:'우상', val:tr, row:0, col:2 },
        { id:'bl', label:'좌하', val:bl, row:2, col:0 },
        { id:'br', label:'우하', val:br, row:2, col:2 },
    ];

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white">Border Radius Builder</h1>
                    <p className="text-sm text-slate-500 mt-1">CSS border-radius를 시각적으로 조절합니다</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 미리보기 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-center bg-slate-900/80 rounded-2xl p-8 border border-slate-800 min-h-56">
                            <div style={{ width: boxSize, height: boxSize, background: bgColor, borderRadius: cssValue, transition: 'border-radius 0.3s ease' }}
                                className="flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-black/50">
                                미리보기
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">색상</label>
                                <div className="flex gap-2">
                                    <input type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)} className="w-10 h-10 rounded-lg p-1 border border-slate-700 cursor-pointer" />
                                    <div className="flex flex-wrap gap-1">
                                        {['#6366f1','#22c55e','#ef4444','#f59e0b','#06b6d4','#ec4899'].map(c => (
                                            <button key={c} onClick={()=>setBgColor(c)} className="w-6 h-6 rounded-lg border border-transparent hover:border-white/30" style={{background:c}} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">단위</label>
                                <div className="flex gap-1">
                                    {['px','%','rem'].map(u => (
                                        <button key={u} onClick={()=>setUnit(u)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${unit===u?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>{u}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-slate-300">CSS 코드</label>
                                <button onClick={copy} className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${copied?'bg-emerald-600 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{copied?'복사됨!':'복사'}</button>
                            </div>
                            <code className="block bg-slate-900 rounded-xl px-4 py-3 text-sm text-emerald-300 font-mono border border-slate-700">{cssCode}</code>
                        </div>
                    </div>

                    {/* 컨트롤 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-300">모서리 설정</label>
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                <input type="checkbox" checked={linked} onChange={e=>setLinked(e.target.checked)} className="accent-indigo-500" /> 균등
                            </label>
                        </div>

                        {/* 3x3 그리드 컨트롤 */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                            {['tl','','tr','','center','','bl','','br'].map((id, i) => {
                                if (id === 'center') return <div key={i} className="h-12 rounded-xl bg-slate-800/40 border border-slate-700/30" />;
                                if (!id) return <div key={i} />;
                                const corner = corners.find(c=>c.id===id);
                                if (!corner) return <div key={i} />;
                                return (
                                    <div key={i} className="text-center">
                                        <div className="text-[9px] text-slate-500 mb-1">{corner.label}</div>
                                        <input type="number" min="0" max="200" value={corner.val} onChange={e=>set(id, e.target.value)}
                                            className="w-full bg-slate-800 text-white font-mono text-sm px-2 py-2 rounded-lg border border-slate-700 outline-none text-center" />
                                    </div>
                                );
                            })}
                        </div>

                        {/* 슬라이더 */}
                        {!linked && corners.map(c => (
                            <div key={c.id}>
                                <div className="flex justify-between mb-1"><label className="text-[10px] text-slate-400">{c.label} ({c.id.toUpperCase()})</label><span className="text-[10px] font-mono text-slate-300">{c.val}{unit}</span></div>
                                <input type="range" min="0" max="100" value={c.val} onChange={e=>set(c.id, e.target.value)} className="w-full accent-indigo-500 h-1.5" />
                            </div>
                        ))}
                        {linked && (
                            <div>
                                <div className="flex justify-between mb-1"><label className="text-[10px] text-slate-400">전체 모서리</label><span className="text-[10px] font-mono text-slate-300">{tl}{unit}</span></div>
                                <input type="range" min="0" max="100" value={tl} onChange={e=>set('tl', e.target.value)} className="w-full accent-indigo-500 h-2" />
                            </div>
                        )}

                        {/* 프리셋 */}
                        <div>
                            <label className="text-xs font-bold text-slate-300 block mb-2">프리셋</label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {PRESETS.map(p => (
                                    <button key={p.name} onClick={()=>{ setLinked(false); setTl(p.vals[0]); setTr(p.vals[1]); setBr(p.vals[2]); setBl(p.vals[3]); }}
                                        className="py-2 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700 hover:bg-slate-700 hover:text-white transition-all">{p.name}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
