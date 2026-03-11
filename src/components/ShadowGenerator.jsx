import React, { useState, useMemo } from 'react';

const PRESETS = [
    { name: '소프트', shadows: [{ x:0,y:4,blur:6,spread:-1,color:'rgba(0,0,0,0.1)' },{ x:0,y:2,blur:4,spread:-1,color:'rgba(0,0,0,0.06)' }] },
    { name: '미디엄', shadows: [{ x:0,y:10,blur:15,spread:-3,color:'rgba(0,0,0,0.1)' },{ x:0,y:4,blur:6,spread:-2,color:'rgba(0,0,0,0.05)' }] },
    { name: '강한 그림자', shadows: [{ x:0,y:20,blur:25,spread:-5,color:'rgba(0,0,0,0.1)' },{ x:0,y:10,blur:10,spread:-5,color:'rgba(0,0,0,0.04)' }] },
    { name: '글로우 인디고', shadows: [{ x:0,y:0,blur:20,spread:0,color:'rgba(99,102,241,0.6)' }] },
    { name: '글로우 시안', shadows: [{ x:0,y:0,blur:20,spread:0,color:'rgba(6,182,212,0.6)' }] },
    { name: '뉴모피즘', shadows: [{ x:5,y:5,blur:10,spread:0,color:'rgba(0,0,0,0.3)' },{ x:-5,y:-5,blur:10,spread:0,color:'rgba(255,255,255,0.05)' }] },
    { name: '플로팅', shadows: [{ x:0,y:25,blur:50,spread:-12,color:'rgba(0,0,0,0.25)' }] },
    { name: '없음', shadows: [] },
];

function newShadow() { return { x:0, y:4, blur:12, spread:0, color:'rgba(0,0,0,0.2)', inset:false }; }

export default function ShadowGenerator() {
    const [shadows, setShadows] = useState([{ x:0, y:8, blur:24, spread:-4, color:'rgba(99,102,241,0.5)', inset:false }]);
    const [bgColor, setBgColor] = useState('#1e293b');
    const [boxColor, setBoxColor] = useState('#334155');
    const [borderRadius, setBorderRadius] = useState(16);
    const [copied, setCopied] = useState(false);

    const cssValue = shadows.length === 0 ? 'none' : shadows.map(s => `${s.inset?'inset ':''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`).join(', ');
    const cssCode = `box-shadow: ${cssValue};`;

    const copy = () => { navigator.clipboard.writeText(cssCode); setCopied(true); setTimeout(() => setCopied(false), 1500); };

    const update = (i, key, val) => setShadows(s => s.map((sh, idx) => idx === i ? {...sh, [key]: val} : sh));
    const remove = (i) => setShadows(s => s.filter((_,idx) => idx !== i));
    const add = () => setShadows(s => [...s, newShadow()]);

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white">Shadow Generator</h1>
                    <p className="text-sm text-slate-500 mt-1">CSS box-shadow를 시각적으로 디자인합니다</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 미리보기 */}
                    <div className="space-y-4">
                        <div className="rounded-2xl p-8 flex items-center justify-center" style={{ background: bgColor, minHeight: 220 }}>
                            <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400 transition-all duration-300"
                                style={{ background: boxColor, borderRadius: `${borderRadius}px`, boxShadow: cssValue }}>
                                미리보기
                            </div>
                        </div>
                        {/* 배경/박스 색상 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">배경 색상</label>
                                <div className="flex gap-2">
                                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg p-1 border border-slate-700 cursor-pointer" />
                                    <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 bg-slate-900 text-slate-300 font-mono text-xs px-3 rounded-lg border border-slate-700 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">박스 색상</label>
                                <div className="flex gap-2">
                                    <input type="color" value={boxColor} onChange={e => setBoxColor(e.target.value)} className="w-10 h-10 rounded-lg p-1 border border-slate-700 cursor-pointer" />
                                    <input type="text" value={boxColor} onChange={e => setBoxColor(e.target.value)} className="flex-1 bg-slate-900 text-slate-300 font-mono text-xs px-3 rounded-lg border border-slate-700 outline-none" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">모서리 둥글기: {borderRadius}px</label>
                            <input type="range" min="0" max="80" value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} className="w-full accent-indigo-500 h-2" />
                        </div>
                        {/* CSS 코드 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-300">CSS 코드</label>
                                <button onClick={copy} className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{copied ? '복사됨!' : '복사'}</button>
                            </div>
                            <code className="block bg-slate-900 rounded-xl px-4 py-3 text-xs text-emerald-300 font-mono border border-slate-700 break-all">{cssCode}</code>
                        </div>
                    </div>

                    {/* 설정 */}
                    <div className="space-y-4">
                        {/* 프리셋 */}
                        <div>
                            <label className="text-xs font-bold text-slate-300 block mb-2">프리셋</label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {PRESETS.map(p => (
                                    <button key={p.name} onClick={() => setShadows(p.shadows)} className="py-2 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700 hover:bg-slate-700 hover:text-white transition-all">{p.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* 레이어 목록 */}
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-300">그림자 레이어 ({shadows.length})</label>
                            <button onClick={add} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">+ 추가</button>
                        </div>

                        {shadows.map((s, i) => (
                            <div key={i} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-400">레이어 {i+1}</span>
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                                            <input type="checkbox" checked={s.inset} onChange={e => update(i,'inset',e.target.checked)} className="accent-indigo-500" /> 안쪽
                                        </label>
                                        {shadows.length > 1 && <button onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition-colors">✕</button>}
                                    </div>
                                </div>
                                {[['x','X 오프셋',-100,100],['y','Y 오프셋',-100,100],['blur','블러',0,100],['spread','확산',-50,50]].map(([key,label,min,max]) => (
                                    <div key={key}>
                                        <div className="flex justify-between mb-1"><label className="text-[10px] text-slate-500">{label}</label><span className="text-[10px] text-slate-400 font-mono">{s[key]}px</span></div>
                                        <input type="range" min={min} max={max} value={s[key]} onChange={e => update(i, key, Number(e.target.value))} className="w-full accent-indigo-500 h-1.5" />
                                    </div>
                                ))}
                                <div>
                                    <label className="text-[10px] text-slate-500 block mb-1.5">색상</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={s.color.startsWith('rgba') ? '#666666' : s.color} onChange={e => update(i,'color',e.target.value)} className="w-10 h-8 rounded-lg p-0.5 border border-slate-700 cursor-pointer" />
                                        <input type="text" value={s.color} onChange={e => update(i,'color',e.target.value)} className="flex-1 bg-slate-950 text-slate-300 font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
