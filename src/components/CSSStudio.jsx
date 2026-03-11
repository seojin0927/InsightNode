import React, { useState, useMemo, useCallback } from 'react';
import StudioLayout, { S, CopyBtn, Slider } from './StudioLayout';

const ACCENT = '#a855f7';

// ══════════════════════════════════════════════════════════════════
// TAB 1: Box Shadow
function ShadowTab() {
    const [shadows, setShadows] = useState([{ x:0, y:8, blur:24, spread:0, color:'#6366f1', opacity:40, inset:false }]);
    const [bg, setBg] = useState('#1e293b');
    const [boxBg, setBoxBg] = useState('#334155');
    const [radius, setRadius] = useState(16);
    const [active, setActive] = useState(0);

    const shadowStr = useMemo(() => shadows.map(s => {
        const hex = s.color.replace('#','');
        const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
        const a = (s.opacity/100).toFixed(2);
        return `${s.inset?'inset ':''} ${s.x}px ${s.y}px ${s.blur}px ${s.spread}px rgba(${r},${g},${b},${a})`;
    }).join(',\n'), [shadows]);

    const css = `box-shadow: ${shadowStr};`;
    const cur = shadows[active] || shadows[0];

    const update = useCallback((key, val) => setShadows(prev => prev.map((s,i) => i===active ? {...s,[key]:val} : s)), [active]);
    const addShadow = () => { setShadows(p=>[...p,{x:4,y:4,blur:16,spread:0,color:'#000000',opacity:30,inset:false}]); setActive(shadows.length); };
    const removeShadow = (i) => { const n=shadows.filter((_,idx)=>idx!==i); setShadows(n); setActive(Math.min(active,n.length-1)); };

    const presets = [
        {label:'Soft', shadows:[{x:0,y:4,blur:24,spread:-2,color:'#000000',opacity:25,inset:false}]},
        {label:'Medium', shadows:[{x:0,y:8,blur:24,spread:0,color:'#000000',opacity:40,inset:false}]},
        {label:'Strong', shadows:[{x:0,y:20,blur:60,spread:-5,color:'#000000',opacity:70,inset:false}]},
        {label:'Glow', shadows:[{x:0,y:0,blur:30,spread:5,color:'#6366f1',opacity:60,inset:false}]},
        {label:'Neumorphism', shadows:[{x:-6,y:-6,blur:12,spread:0,color:'#ffffff',opacity:8,inset:false},{x:6,y:6,blur:12,spread:0,color:'#000000',opacity:40,inset:false}]},
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 미리보기 */}
                <div className={`${S.card} p-5 flex flex-col gap-3`}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">미리보기</h3>
                    <div className="flex-1 min-h-[160px] rounded-xl flex items-center justify-center" style={{background:bg}}>
                        <div className="w-28 h-28 rounded-[16px] transition-all duration-300" style={{background:boxBg, boxShadow:shadowStr, borderRadius:`${radius}px`}} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className={S.label}>배경색</label><input type="color" value={bg} onChange={e=>setBg(e.target.value)} className="w-full h-9 rounded-lg border border-slate-700 cursor-pointer bg-transparent" /></div>
                        <div><label className={S.label}>박스색</label><input type="color" value={boxBg} onChange={e=>setBoxBg(e.target.value)} className="w-full h-9 rounded-lg border border-slate-700 cursor-pointer bg-transparent" /></div>
                    </div>
                    <Slider label="Border Radius" value={radius} setValue={setRadius} min={0} max={80} unit="px" />
                </div>
                {/* 컨트롤 */}
                <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                        {shadows.map((s,i) => (
                            <div key={i} className="flex items-center gap-1">
                                <button onClick={()=>setActive(i)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${active===i?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700'}`}>레이어 {i+1}</button>
                                {shadows.length>1 && <button onClick={()=>removeShadow(i)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all">×</button>}
                            </div>
                        ))}
                        <button onClick={addShadow} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700 hover:border-emerald-500/50">+ 추가</button>
                    </div>
                    <div className={`${S.card} p-4 space-y-3`}>
                        {cur && <>
                            <Slider label="X 오프셋" value={cur.x} setValue={v=>update('x',v)} min={-100} max={100} unit="px" />
                            <Slider label="Y 오프셋" value={cur.y} setValue={v=>update('y',v)} min={-100} max={100} unit="px" />
                            <Slider label="블러" value={cur.blur} setValue={v=>update('blur',v)} min={0} max={200} unit="px" />
                            <Slider label="스프레드" value={cur.spread} setValue={v=>update('spread',v)} min={-100} max={100} unit="px" />
                            <Slider label="투명도" value={cur.opacity} setValue={v=>update('opacity',v)} min={0} max={100} unit="%" />
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className={S.label}>색상</label><input type="color" value={cur.color} onChange={e=>update('color',e.target.value)} className="w-full h-9 rounded-lg border border-slate-700 cursor-pointer bg-transparent" /></div>
                                <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={cur.inset} onChange={e=>update('inset',e.target.checked)} className="w-4 h-4 accent-indigo-500" /><span className="text-xs font-bold text-slate-300">inset</span></label></div>
                            </div>
                        </>}
                    </div>
                </div>
            </div>
            {/* 프리셋 */}
            <div className="flex gap-2 flex-wrap">
                {presets.map(p=><button key={p.label} onClick={()=>setShadows(p.shadows)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs border border-slate-700 hover:text-white hover:border-indigo-500/50 transition-all font-bold">{p.label}</button>)}
            </div>
            {/* CSS 코드 */}
            <div className={`${S.card} p-4`}>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSS 코드</span><CopyBtn text={css} /></div>
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{css}</pre>
            </div>
        </div>
    );
}

// TAB 2: Border Radius
function BorderRadiusTab() {
    const [linked, setLinked] = useState(true);
    const [tl, setTl] = useState(16); const [tr, setTr] = useState(16);
    const [bl, setBl] = useState(16); const [br, setBr] = useState(16);
    const [unit, setUnit] = useState('px');
    const [boxBg, setBoxBg] = useState('#6366f1');

    const setAll = v => { setTl(v); setTr(v); setBl(v); setBr(v); };
    const hSet = linked ? setAll : null;

    const radStr = `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;
    const css = `border-radius: ${radStr};`;

    const presets = [
        {label:'Square',v:[0,0,0,0]},{label:'Soft',v:[8,8,8,8]},{label:'Card',v:[16,16,16,16]},
        {label:'Button',v:[999,999,999,999]},{label:'Circle',v:[999,999,999,999]},
        {label:'Leaf',v:[0,80,0,80]},{label:'Squircle',v:[30,30,30,30]},{label:'Wave',v:[80,20,80,20]},
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`${S.card} p-5 flex flex-col gap-3`}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">미리보기</h3>
                    <div className="flex-1 min-h-[140px] bg-slate-950 rounded-xl flex items-center justify-center">
                        <div className="w-32 h-32 transition-all duration-300 flex items-center justify-center text-xs font-bold text-white" style={{ background:boxBg, borderRadius:radStr }}>
                            {radStr}
                        </div>
                    </div>
                    <div><label className={S.label}>배경색</label><input type="color" value={boxBg} onChange={e=>setBoxBg(e.target.value)} className="w-full h-9 rounded-lg border border-slate-700 cursor-pointer bg-transparent" /></div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">{['px','%','rem'].map(u=><button key={u} onClick={()=>setUnit(u)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${unit===u?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700'}`}>{u}</button>)}</div>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={linked} onChange={e=>setLinked(e.target.checked)} className="w-4 h-4 accent-indigo-500" /><span className="text-xs font-bold text-slate-300">전체 동일</span></label>
                    </div>
                    <div className={`${S.card} p-4 space-y-3`}>
                        {[['↖ 상단 좌', tl, linked ? setAll : setTl],['↗ 상단 우', tr, linked ? setAll : setTr],['↙ 하단 좌', bl, linked ? setAll : setBl],['↘ 하단 우', br, linked ? setAll : setBr]].map(([label,val,set])=>(
                            <Slider key={label} label={label} value={val} setValue={set} min={0} max={unit==='%'?50:200} unit={unit} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex gap-2 flex-wrap">
                {presets.map(p=><button key={p.label} onClick={()=>{setTl(p.v[0]);setTr(p.v[1]);setBl(p.v[2]);setBr(p.v[3]);}} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs border border-slate-700 hover:text-white hover:border-indigo-500/50 transition-all font-bold">{p.label}</button>)}
            </div>
            <div className={`${S.card} p-4`}>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSS 코드</span><CopyBtn text={css} /></div>
                <pre className="text-xs text-emerald-400 font-mono">{css}</pre>
            </div>
        </div>
    );
}

// TAB 3: Glassmorphism
function GlassTab() {
    const [blur, setBlur] = useState(16);
    const [opacity, setOpacity] = useState(15);
    const [saturation, setSaturation] = useState(180);
    const [borderOpacity, setBorderOpacity] = useState(20);
    const [shadowBlur, setShadowBlur] = useState(24);
    const [bg, setBg] = useState(0);

    const bgs = [
        'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        'linear-gradient(135deg, #0d1117, #161b22, #21262d)',
        'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
        'linear-gradient(135deg, #052e16, #14532d, #166534)',
        'linear-gradient(135deg, #450a0a, #7f1d1d, #b91c1c)',
    ];

    const css = `.glass-card {\n  background: rgba(255, 255, 255, ${(opacity/100).toFixed(2)});\n  backdrop-filter: blur(${blur}px) saturate(${saturation}%);\n  -webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);\n  border: 1px solid rgba(255, 255, 255, ${(borderOpacity/100).toFixed(2)});\n  box-shadow: 0 8px ${shadowBlur}px rgba(0, 0, 0, 0.3);\n  border-radius: 16px;\n}`;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`${S.card} p-5`}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">미리보기</h3>
                    <div className="rounded-xl min-h-[180px] relative overflow-hidden flex items-center justify-center p-4" style={{background:bgs[bg]}}>
                        <div className="absolute inset-0 opacity-20" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} />
                        {[{w:'w-24',h:'h-24',bg:'bg-indigo-500/40',y:'-translate-y-8'},{w:'w-16',h:'h-16',bg:'bg-cyan-500/40',y:'translate-y-8 translate-x-10'}].map((c,i)=>
                            <div key={i} className={`absolute ${c.w} ${c.h} rounded-full blur-2xl ${c.bg} ${c.y}`} />
                        )}
                        <div className="relative rounded-2xl p-5 text-white text-center" style={{
                            background:`rgba(255,255,255,${(opacity/100).toFixed(2)})`,
                            backdropFilter:`blur(${blur}px) saturate(${saturation}%)`,
                            WebkitBackdropFilter:`blur(${blur}px) saturate(${saturation}%)`,
                            border:`1px solid rgba(255,255,255,${(borderOpacity/100).toFixed(2)})`,
                            boxShadow:`0 8px ${shadowBlur}px rgba(0,0,0,0.3)`,
                        }}>
                            <div className="text-sm font-bold">Glass Card</div>
                            <div className="text-[10px] opacity-70 mt-1">Glassmorphism Effect</div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        {bgs.map((_,i)=><button key={i} onClick={()=>setBg(i)} className={`flex-1 h-8 rounded-lg transition-all ${bg===i?'ring-2 ring-indigo-500 scale-95':''}`} style={{background:bgs[i]}} />)}
                    </div>
                </div>
                <div className={`${S.card} p-4 space-y-3`}>
                    <Slider label="블러 강도" value={blur} setValue={setBlur} min={0} max={80} unit="px" />
                    <Slider label="배경 투명도" value={opacity} setValue={setOpacity} min={0} max={80} unit="%" />
                    <Slider label="채도" value={saturation} setValue={setSaturation} min={100} max={250} unit="%" />
                    <Slider label="테두리 투명도" value={borderOpacity} setValue={setBorderOpacity} min={0} max={80} unit="%" />
                    <Slider label="그림자 블러" value={shadowBlur} setValue={setShadowBlur} min={0} max={100} unit="px" />
                </div>
            </div>
            <div className={`${S.card} p-4`}>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSS 코드</span><CopyBtn text={css} /></div>
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{css}</pre>
            </div>
        </div>
    );
}

// TAB 4: Flexbox Helper
function FlexboxTab() {
    const [dir, setDir] = useState('row');
    const [wrap, setWrap] = useState('wrap');
    const [justify, setJustify] = useState('flex-start');
    const [align, setAlign] = useState('stretch');
    const [alignContent, setAlignContent] = useState('flex-start');
    const [gap, setGap] = useState(8);
    const [items, setItems] = useState(5);

    const css = `.flex-container {\n  display: flex;\n  flex-direction: ${dir};\n  flex-wrap: ${wrap};\n  justify-content: ${justify};\n  align-items: ${align};\n  align-content: ${alignContent};\n  gap: ${gap}px;\n}`;

    const colors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#84cc16'];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`${S.card} p-5 flex flex-col gap-2`}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">미리보기</h3>
                    <div className="flex-1 min-h-[160px] bg-slate-950 rounded-xl p-3 overflow-hidden" style={{display:'flex',flexDirection:dir,flexWrap:wrap,justifyContent:justify,alignItems:align,alignContent:alignContent,gap:gap+'px'}}>
                        {Array.from({length:Math.min(items,8)}).map((_,i)=>(
                            <div key={i} className="rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{width:dir.includes('row')?44:72,height:dir.includes('row')?44:36,background:colors[i%colors.length],opacity:0.9}}>{i+1}</div>
                        ))}
                    </div>
                    <Slider label="아이템 수" value={items} setValue={setItems} min={1} max={8} />
                    <Slider label="Gap" value={gap} setValue={setGap} min={0} max={40} unit="px" />
                </div>
                <div className="space-y-3">
                    {[
                        {label:'flex-direction', val:dir, set:setDir, opts:['row','row-reverse','column','column-reverse']},
                        {label:'flex-wrap', val:wrap, set:setWrap, opts:['nowrap','wrap','wrap-reverse']},
                        {label:'justify-content', val:justify, set:setJustify, opts:['flex-start','flex-end','center','space-between','space-around','space-evenly']},
                        {label:'align-items', val:align, set:setAlign, opts:['flex-start','flex-end','center','stretch','baseline']},
                        {label:'align-content', val:alignContent, set:setAlignContent, opts:['flex-start','flex-end','center','stretch','space-between','space-around']},
                    ].map(({label,val,set,opts})=>(
                        <div key={label} className={`${S.card} p-3`}>
                            <label className={S.label}>{label}</label>
                            <div className="flex flex-wrap gap-1.5">
                                {opts.map(o=><button key={o} onClick={()=>set(o)} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all ${val===o?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>{o}</button>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={`${S.card} p-4`}>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSS 코드</span><CopyBtn text={css} /></div>
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{css}</pre>
            </div>
        </div>
    );
}

// TAB 5: CSS 애니메이션 빌더
function AnimationTab() {
    const [preset, setPreset] = useState(0);
    const [duration, setDuration] = useState(1);
    const [delay, setDelay] = useState(0);
    const [iterCount, setIterCount] = useState('infinite');
    const [timing, setTiming] = useState('ease-in-out');
    const [playing, setPlaying] = useState(true);

    const presets = [
        { name: '페이드 인', kf: '@keyframes fadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}', an: 'fadeIn' },
        { name: '슬라이드 업', kf: '@keyframes slideUp {\n  from { transform: translateY(30px); opacity: 0; }\n  to { transform: translateY(0); opacity: 1; }\n}', an: 'slideUp' },
        { name: '바운스', kf: '@keyframes bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-20px); }\n}', an: 'bounce' },
        { name: '회전', kf: '@keyframes spin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}', an: 'spin' },
        { name: '펄스', kf: '@keyframes pulse {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.1); }\n}', an: 'pulse' },
        { name: '흔들기', kf: '@keyframes shake {\n  0%, 100% { transform: translateX(0); }\n  25% { transform: translateX(-10px); }\n  75% { transform: translateX(10px); }\n}', an: 'shake' },
        { name: '플립', kf: '@keyframes flip {\n  from { transform: rotateY(0deg); }\n  to { transform: rotateY(360deg); }\n}', an: 'flip' },
        { name: '글로우', kf: '@keyframes glow {\n  0%, 100% { box-shadow: 0 0 5px rgba(99,102,241,0.3); }\n  50% { box-shadow: 0 0 30px rgba(99,102,241,0.8); }\n}', an: 'glow' },
    ];
    const p = presets[preset];
    const css = `${p.kf}\n\n.animated {\n  animation: ${p.an} ${duration}s ${timing} ${delay}s ${iterCount};\n}`;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presets.map((pr,i)=><button key={pr.name} onClick={()=>setPreset(i)} className={`py-2 rounded-xl text-xs font-bold transition-all ${preset===i?'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>{pr.name}</button>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`${S.card} p-5 flex flex-col gap-4`}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">실전 예시</h3>
                    <div className="rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e293b 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <div className="w-24 h-24 rounded-2xl bg-indigo-500/30 border-2 border-indigo-400/50 flex items-center justify-center text-white font-bold text-lg shadow-xl" style={playing ? { animation:`${p.an} ${duration}s ${timing} ${delay}s ${iterCount}` } : {}}>박스</div>
                        <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/40 border border-cyan-400/50 flex items-center justify-center text-[10px] font-bold text-white" style={playing ? { animation:`${p.an} ${duration}s ${timing} ${delay}s ${iterCount}` } : {}}>1</div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/40 border border-emerald-400/50 flex items-center justify-center text-[10px] font-bold text-white" style={playing ? { animation:`${p.an} ${duration}s ${timing} ${delay}s ${iterCount}`, animationDelay: '0.1s' } : {}}>2</div>
                            <div className="w-12 h-12 rounded-xl bg-amber-500/40 border border-amber-400/50 flex items-center justify-center text-[10px] font-bold text-white" style={playing ? { animation:`${p.an} ${duration}s ${timing} ${delay}s ${iterCount}`, animationDelay: '0.2s' } : {}}>3</div>
                        </div>
                        <p className="text-xs text-slate-400">버튼·카드·아이콘에 적용 가능</p>
                    </div>
                    <button onClick={()=>setPlaying(!playing)} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:border-indigo-500/50">{playing?'⏸ 일시정지':'▶ 재생'}</button>
                </div>
                <div className={`${S.card} p-4 space-y-3`}>
                    <Slider label="지속 시간" value={duration} setValue={setDuration} min={0.1} max={5} step={0.1} unit="s" />
                    <Slider label="딜레이" value={delay} setValue={setDelay} min={0} max={3} step={0.1} unit="s" />
                    <div>
                        <label className={S.label}>반복 횟수</label>
                        <div className="flex gap-1.5">
                            {['infinite','1','2','3'].map(v=><button key={v} onClick={()=>setIterCount(v)} className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${iterCount===v?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>{v}</button>)}
                        </div>
                    </div>
                    <div>
                        <label className={S.label}>타이밍 함수</label>
                        <div className="flex flex-wrap gap-1.5">
                            {['ease','ease-in','ease-out','ease-in-out','linear'].map(v=><button key={v} onClick={()=>setTiming(v)} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all ${timing===v?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>{v}</button>)}
                        </div>
                    </div>
                </div>
            </div>
            <div className={`${S.card} p-4`}>
                <div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSS 코드</span><CopyBtn text={css} /></div>
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{css}</pre>
            </div>
            <style>{playing ? `${p.kf}` : ''}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'shadow', label: '박스 그림자', icon: '🌑', desc: 'box-shadow · 레이어 · 프리셋 편집기', component: ShadowTab, chipLabel: '그림자' },
    { id: 'radius', label: '모서리 둥글게', icon: '⬛', desc: '4개 모서리 개별 제어 Border Radius 빌더', component: BorderRadiusTab, chipLabel: '모서리' },
    { id: 'glass', label: '글래스모피즘', icon: '🔮', desc: '유리 효과 CSS · 블러 · 투명도 조절', component: GlassTab, chipLabel: '글래스' },
    { id: 'flexbox', label: '플렉스박스', icon: '📐', desc: 'Flexbox 레이아웃 인터랙티브 빌더', component: FlexboxTab, chipLabel: '플렉스' },
    { id: 'animation', label: '애니메이션', icon: '🎬', desc: 'CSS @keyframes 애니메이션 빌더', component: AnimationTab, chipLabel: '애니메이션' },
];

export default function CSSStudio() {
    const [tab, setTab] = useState('shadow');
    const Comp = TABS.find(t => t.id === tab)?.component;
    return (
        <StudioLayout
            color={ACCENT}
            icon="🎨"
            title="CSS Studio"
            description="Box Shadow, Border Radius, Glassmorphism, Flexbox 레이아웃, CSS Animation 시각적 생성기"
            tabs={TABS}
            tab={tab}
            setTab={setTab}>
            {Comp && <Comp />}
        </StudioLayout>
    );
}
