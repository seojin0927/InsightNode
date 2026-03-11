import React, { useState, useCallback, useRef, useEffect } from 'react';
import StudioLayout from './StudioLayout';

// ─── 색상 변환 헬퍼 ───────────────────────────────────────────────
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return { r, g, b };
}
function rgbToHex(r,g,b) {
    return '#' + [r,g,b].map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
}
function rgbToHsl(r,g,b) {
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){ h=s=0; } else {
        const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
        switch(max){ case r: h=((g-b)/d+(g<b?6:0))/6; break; case g: h=((b-r)/d+2)/6; break; default: h=((r-g)/d+4)/6; }
    }
    return { h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100) };
}
function hslToRgb(h,s,l) {
    s/=100; l/=100;
    const k=n=>(n+h/30)%12, a=s*Math.min(l,1-l);
    const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
    return { r:Math.round(f(0)*255), g:Math.round(f(8)*255), b:Math.round(f(4)*255) };
}
function rgbToCmyk(r,g,b) {
    r/=255; g/=255; b/=255;
    const k=1-Math.max(r,g,b);
    if(k===1) return { c:0,m:0,y:0,k:100 };
    return { c:Math.round((1-r-k)/(1-k)*100), m:Math.round((1-g-k)/(1-k)*100), y:Math.round((1-b-k)/(1-k)*100), k:Math.round(k*100) };
}
function hexToHsl(hex) { const {r,g,b}=hexToRgb(hex); return rgbToHsl(r,g,b); }
function hslToHex(h,s,l) { const {r,g,b}=hslToRgb(h,s,l); return rgbToHex(r,g,b); }

function getHarmony(hex, type) {
    const {h,s,l}=hexToHsl(hex);
    const angles = {
        complementary: [180],
        analogous: [-30,30],
        triadic: [120,240],
        tetradic: [90,180,270],
        splitComp: [150,210],
        monochromatic: [0,0,0,0],
    };
    const baseAngles = angles[type] || [];
    if(type === 'monochromatic') {
        return [20,35,50,65,80].map(newL => hslToHex(h,s,newL));
    }
    return [hex, ...baseAngles.map(a => hslToHex((h+a+360)%360, s, l))];
}

// ─── PANEL HEADER ─────────────────────────────────────────────────
function PanelTitle({ icon, title }) {
    return <h2 className="text-lg font-black text-slate-100 mb-5 flex items-center gap-2"><span className="text-2xl">{icon}</span>{title}</h2>;
}

// ─── 색상 미리보기 캔버스 ───────────────────────────────────────────
function ColorPreviewCanvas({ color, palette, background }) {
    const ref = useRef(null);
    const bg = background || palette?.[0] || '#1e293b';
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth, h = 200;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
        // 글자색 예시
        ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = color; ctx.fillText('제목 텍스트', 20, 45);
        ctx.font = '14px sans-serif'; ctx.fillStyle = color; ctx.globalAlpha = 0.9; ctx.fillText('본문 내용 샘플', 20, 75);
        ctx.globalAlpha = 1;
        // 버튼 예시
        ctx.fillStyle = color; ctx.fillRect(20, 95, 80, 32); ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText('버튼', 45, 115);
        ctx.fillStyle = 'transparent'; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(110, 95, 80, 32); ctx.fillStyle = color; ctx.fillText('아웃라인', 125, 115);
        // 카드/배지
        ctx.fillStyle = color; ctx.globalAlpha = 0.2; ctx.fillRect(20, 140, 60, 24); ctx.globalAlpha = 1; ctx.fillStyle = color; ctx.font = '11px sans-serif'; ctx.fillText('배지', 35, 156);
        if (palette && palette.length > 1) {
            const sw = palette.length > 5 ? 5 : palette.length;
            const bw = (w - 40 - (sw - 1) * 4) / sw;
            palette.slice(0, 5).forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(100 + i * (bw + 4), 140, bw, 24); });
        }
    }, [color, bg, palette]);
    return <canvas ref={ref} className="w-full h-[200px] block rounded-2xl border border-white/10" style={{ width: '100%', height: 200 }} />;
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: 색상 변환
// ═══════════════════════════════════════════════════════════════════
function ColorConverter() {
    const [hex, setHex] = useState('#6366f1');
    const [previewBg, setPreviewBg] = useState('#020617');
    const [copied, setCopied] = useState('');
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

    const copyVal = (val, key) => { navigator.clipboard.writeText(val); setCopied(key); setTimeout(() => setCopied(''), 1500); };

    const handleHexInput = (v) => {
        const clean = v.startsWith('#') ? v : '#'+v;
        if (/^#[0-9a-fA-F]{0,6}$/.test(clean)) setHex(clean.length < 7 ? hex : clean);
    };

    const formats = [
        { key: 'hex',  label: 'HEX',  value: hex },
        { key: 'rgb',  label: 'RGB',  value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
        { key: 'hsl',  label: 'HSL',  value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
        { key: 'cmyk', label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
        { key: 'rgba', label: 'RGBA', value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
        { key: 'hsla', label: 'HSLA', value: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)` },
        { key: 'cssvar', label: 'CSS 변수', value: `--color: ${hex};` },
        { key: 'tw', label: 'TailwindCSS', value: `[${hex}]` },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 왼쪽: 색상 입력 + 미리보기 */}
            <div className="space-y-5">
                <PanelTitle icon="🎨" title="색상 입력" />
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <input type="color" value={hex} onChange={e => setHex(e.target.value)}
                            className="w-20 h-20 rounded-2xl cursor-pointer border-0 p-1" style={{ background: 'transparent' }} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase">HEX 직접 입력</label>
                        <input type="text" value={hex} onChange={e => handleHexInput(e.target.value)}
                            className="w-full bg-slate-800 text-white font-mono px-3 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 text-base font-bold uppercase" />
                        <div className="flex gap-1.5 flex-wrap">
                            {['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#a855f7','#ec4899','#ffffff','#1e293b'].map(c => (
                                <button key={c} onClick={() => setHex(c)} className="w-6 h-6 rounded-md border-2 border-transparent hover:border-white/50 transition-all hover:scale-110" style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                </div>
                {/* RGBA 정보 */}
                <div className="grid grid-cols-4 gap-2">
                    {[['R',rgb.r,'#ef4444'],['G',rgb.g,'#22c55e'],['B',rgb.b,'#3b82f6'],['α','100%','#a78bfa']].map(([label,val,color]) => (
                        <div key={label} className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
                            <div className="text-xs font-black uppercase mb-1" style={{ color }}>{label}</div>
                            <div className="text-lg font-black text-white">{val}</div>
                        </div>
                    ))}
                </div>

                {/* 미리보기 (배경색 조절) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">미리보기</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">배경색</span>
                            <input
                                type="color"
                                value={previewBg}
                                onChange={e => setPreviewBg(e.target.value)}
                                className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={previewBg}
                                onChange={e => /^#[0-9a-fA-F]{3,6}$/.test(e.target.value) && setPreviewBg(e.target.value)}
                                className="w-24 bg-slate-800 text-white font-mono px-2 py-1 rounded border border-slate-700 outline-none text-[11px]"
                            />
                        </div>
                    </div>
                    <ColorPreviewCanvas color={hex} background={previewBg} />
                </div>
            </div>

            {/* 오른쪽: 변환 결과 */}
            <div className="space-y-4">
                <PanelTitle icon="🔄" title="변환 결과" />
                {formats.map(({ key, label, value }) => (
                    <div key={key} className="flex items-center gap-3 bg-slate-800/60 px-3 py-2.5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all group">
                        <span className="text-[10px] font-black text-slate-500 uppercase w-14 shrink-0">{label}</span>
                        <code className="flex-1 text-xs text-slate-200 font-mono truncate">{value}</code>
                        <button onClick={() => copyVal(value, key)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${copied === key ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white'}`}>
                            {copied === key ? '✓' : '복사'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: 팔레트 생성
// ═══════════════════════════════════════════════════════════════════
function PaletteGenerator() {
    const [baseColor, setBaseColor] = useState('#6366f1');
    const [harmony, setHarmony] = useState('complementary');
    const [paletteSize, setPaletteSize] = useState(5);
    const [saved, setSaved] = useState([]);
    const [copied, setCopied] = useState(null);

    const palette = getHarmony(baseColor, harmony);

    const copyColor = (c) => { navigator.clipboard.writeText(c); setCopied(c); setTimeout(() => setCopied(null), 1200); };
    const copyAll = () => { navigator.clipboard.writeText(palette.join(', ')); };

    const harmonies = [
        { id: 'complementary', label: '보색', desc: '강한 대비' },
        { id: 'analogous', label: '유사색', desc: '자연스러운 조화' },
        { id: 'triadic', label: '3색', desc: '균형잡힌 3색' },
        { id: 'tetradic', label: '4색', desc: '풍부한 팔레트' },
        { id: 'splitComp', label: '분할보색', desc: '세련된 조화' },
        { id: 'monochromatic', label: '단색조', desc: '같은 색상 계열' },
    ];

    const shades = (() => {
        const {h,s} = hexToHsl(baseColor);
        return [10,20,30,40,50,60,70,80,90].map(l => ({ l, hex: hslToHex(h, s, l) }));
    })();

    return (
        <div className="space-y-6">
            <PanelTitle icon="🎭" title="팔레트 생성기" />
            <div className="flex gap-4 items-center">
                <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">기준 색상</label>
                    <input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value)}
                        className="w-16 h-16 rounded-xl cursor-pointer p-1 border border-slate-700" />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">조화 유형</label>
                    <div className="grid grid-cols-3 gap-1.5">
                        {harmonies.map(h => (
                            <button key={h.id} onClick={() => setHarmony(h.id)}
                                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${harmony === h.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
                                {h.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 생성된 팔레트 */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-300">생성된 팔레트</label>
                    <button onClick={copyAll} className="text-xs px-3 py-1 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">전체 복사</button>
                </div>
                <div className="flex gap-2">
                    {palette.map((c, i) => (
                        <div key={i} className="flex-1 group cursor-pointer" onClick={() => copyColor(c)}>
                            <div className="h-20 rounded-xl border-2 transition-all group-hover:scale-105 group-hover:shadow-lg" style={{ background: c, borderColor: copied === c ? 'white' : 'transparent' }} />
                            <div className="text-center mt-1 text-[10px] font-mono text-slate-400">{c.toUpperCase()}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 단색조 명도 */}
            <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">명도 스케일 (Shades)</label>
                <div className="flex gap-1 h-12 rounded-xl overflow-hidden">
                    {shades.map(({l, hex: c}) => (
                        <div key={l} className="flex-1 cursor-pointer group relative hover:flex-[2] transition-all duration-200" style={{ background: c }} onClick={() => copyColor(c)}>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-black/60 text-white font-mono">{c}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 저장된 팔레트 */}
            {saved.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">저장된 팔레트</label>
                    {saved.map((p, i) => (
                        <div key={i} className="flex gap-1 mb-2">
                            {p.map((c, j) => <div key={j} className="flex-1 h-8 rounded-lg" style={{ background: c }} />)}
                            <button onClick={() => setSaved(s => s.filter((_,idx) => idx !== i))} className="text-slate-500 hover:text-red-400 px-2">✕</button>
                        </div>
                    ))}
                </div>
            )}
            <button onClick={() => setSaved(s => [...s, [...palette]])} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors">
                현재 팔레트 저장
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: 그라데이션 생성기
// ═══════════════════════════════════════════════════════════════════
function GradientBuilder() {
    const [type, setType] = useState('linear');
    const [angle, setAngle] = useState(135);
    const [stops, setStops] = useState([
        { color: '#6366f1', pos: 0 },
        { color: '#8b5cf6', pos: 50 },
        { color: '#ec4899', pos: 100 },
    ]);
    const [copied, setCopied] = useState(false);

    const gradient = (() => {
        const stopsStr = stops.map(s => `${s.color} ${s.pos}%`).join(', ');
        if (type === 'linear') return `linear-gradient(${angle}deg, ${stopsStr})`;
        if (type === 'radial') return `radial-gradient(circle, ${stopsStr})`;
        return `conic-gradient(from ${angle}deg, ${stopsStr})`;
    })();

    const cssCode = `background: ${gradient};`;

    const addStop = () => setStops(s => [...s, { color: '#ffffff', pos: 75 }].sort((a,b) => a.pos - b.pos));
    const updateStop = (i, key, val) => setStops(s => s.map((stop, idx) => idx === i ? { ...stop, [key]: val } : stop));
    const removeStop = (i) => { if (stops.length > 2) setStops(s => s.filter((_,idx) => idx !== i)); };

    const copy = () => { navigator.clipboard.writeText(cssCode); setCopied(true); setTimeout(() => setCopied(false), 1500); };

    const presets = [
        { name: '오로라', stops: [{color:'#06b6d4',pos:0},{color:'#6366f1',pos:50},{color:'#8b5cf6',pos:100}] },
        { name: '일출', stops: [{color:'#f97316',pos:0},{color:'#ef4444',pos:50},{color:'#7c3aed',pos:100}] },
        { name: '바다', stops: [{color:'#0ea5e9',pos:0},{color:'#06b6d4',pos:100}] },
        { name: '숲', stops: [{color:'#22c55e',pos:0},{color:'#10b981',pos:100}] },
        { name: '불꽃', stops: [{color:'#fbbf24',pos:0},{color:'#f97316',pos:50},{color:'#ef4444',pos:100}] },
        { name: '미드나잇', stops: [{color:'#1e293b',pos:0},{color:'#0f172a',pos:100}] },
    ];

    return (
        <div className="space-y-5">
            <PanelTitle icon="🌈" title="그라데이션 생성기" />

            {/* 미리보기 */}
            <div className="h-32 rounded-2xl border border-white/10 shadow-lg" style={{ background: gradient }} />

            {/* 타입/각도 */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">타입</label>
                    <div className="flex gap-1">
                        {[['linear','선형'],['radial','원형'],['conic','코닉']].map(([v,l]) => (
                            <button key={v} onClick={() => setType(v)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${type === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>{l}</button>
                        ))}
                    </div>
                </div>
                {(type === 'linear' || type === 'conic') && (
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">각도: {angle}°</label>
                        <input type="range" min="0" max="360" value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full accent-indigo-500 h-2 rounded-full" />
                    </div>
                )}
            </div>

            {/* 색상 정지점 */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-300">색상 정지점</label>
                    <button onClick={addStop} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">+ 추가</button>
                </div>
                <div className="space-y-2">
                    {stops.map((stop, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700/50">
                            <input type="color" value={stop.color} onChange={e => updateStop(i, 'color', e.target.value)} className="w-10 h-8 rounded-lg p-0.5 border-0 cursor-pointer" />
                            <span className="text-xs font-mono text-slate-400 w-16">{stop.color}</span>
                            <div className="flex-1">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-0.5"><span>위치</span><span>{stop.pos}%</span></div>
                                <input type="range" min="0" max="100" value={stop.pos} onChange={e => updateStop(i, 'pos', Number(e.target.value))} className="w-full accent-indigo-500 h-1.5" />
                            </div>
                            <button onClick={() => removeStop(i)} className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* CSS 코드 */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-300">CSS 코드</label>
                    <button onClick={copy} className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{copied ? '복사됨!' : '복사'}</button>
                </div>
                <code className="block bg-slate-900 rounded-xl px-4 py-3 text-sm text-emerald-300 font-mono border border-slate-700 break-all">{cssCode}</code>
            </div>

            {/* 프리셋 */}
            <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">프리셋</label>
                <div className="grid grid-cols-3 gap-2">
                    {presets.map(p => (
                        <button key={p.name} onClick={() => setStops(p.stops)}
                            className="h-14 rounded-xl border border-white/10 hover:border-white/30 transition-all hover:scale-105 overflow-hidden relative group"
                            style={{ background: `linear-gradient(135deg, ${p.stops.map(s => `${s.color} ${s.pos}%`).join(', ')})` }}>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow bg-black/0 group-hover:bg-black/20 transition-colors">{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4: 색상 접근성 검사
// ═══════════════════════════════════════════════════════════════════
function AccessibilityChecker() {
    const [fg, setFg] = useState('#ffffff');
    const [bg, setBg] = useState('#6366f1');

    const getLuminance = (hex) => {
        const {r,g,b} = hexToRgb(hex);
        const toLinear = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
        return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
    };
    const l1 = getLuminance(fg), l2 = getLuminance(bg);
    const ratio = (Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05);
    const ratioFixed = ratio.toFixed(2);

    const levels = [
        { label: 'AA 일반 텍스트', min: 4.5, pass: ratio >= 4.5 },
        { label: 'AA 큰 텍스트 (18px+)', min: 3, pass: ratio >= 3 },
        { label: 'AAA 일반 텍스트', min: 7, pass: ratio >= 7 },
        { label: 'AAA 큰 텍스트', min: 4.5, pass: ratio >= 4.5 },
    ];

    return (
        <div className="space-y-5">
            <PanelTitle icon="♿" title="색상 접근성 검사 (WCAG)" />
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">전경 (텍스트)</label>
                    <div className="flex gap-2 items-center">
                        <input type="color" value={fg} onChange={e => setFg(e.target.value)} className="w-12 h-12 rounded-xl p-1 border border-slate-700 cursor-pointer" />
                        <input type="text" value={fg} onChange={e => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && setFg(e.target.value)} className="flex-1 bg-slate-800 text-white font-mono px-3 py-2 rounded-lg border border-slate-700 outline-none text-sm" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">배경</label>
                    <div className="flex gap-2 items-center">
                        <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-12 h-12 rounded-xl p-1 border border-slate-700 cursor-pointer" />
                        <input type="text" value={bg} onChange={e => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && setBg(e.target.value)} className="flex-1 bg-slate-800 text-white font-mono px-3 py-2 rounded-lg border border-slate-700 outline-none text-sm" />
                    </div>
                </div>
            </div>

            {/* 미리보기 */}
            <div className="rounded-2xl p-6 border border-white/10" style={{ background: bg }}>
                <p className="text-2xl font-black mb-2" style={{ color: fg }}>큰 텍스트 (Large Text)</p>
                <p className="text-sm" style={{ color: fg }}>일반 텍스트 크기의 샘플입니다. 이 텍스트가 잘 읽히나요?</p>
                <p className="text-xs mt-2" style={{ color: fg }}>작은 텍스트 (Small Text) — 12px 이하</p>
            </div>

            {/* 대비율 */}
            <div className="flex items-center gap-4 bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                <div className="text-center">
                    <div className="text-4xl font-black" style={{ color: ratio >= 4.5 ? '#22c55e' : ratio >= 3 ? '#f59e0b' : '#ef4444' }}>{ratioFixed}</div>
                    <div className="text-xs text-slate-400 mt-1">대비율</div>
                </div>
                <div className="flex-1 space-y-2">
                    {levels.map(lvl => (
                        <div key={lvl.label} className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${lvl.pass ? 'bg-emerald-500 text-white' : 'bg-red-500/30 text-red-400'}`}>
                                {lvl.pass ? '✓' : '✗'}
                            </span>
                            <span className={`text-xs ${lvl.pass ? 'text-slate-300' : 'text-slate-500'}`}>{lvl.label}</span>
                            <span className="text-[10px] text-slate-500 ml-auto">(최소 {lvl.min}:1)</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 5: 이미지 색상 추출기
// ═══════════════════════════════════════════════════════════════════
function ImageColorExtractor() {
    const [imgUrl, setImgUrl] = useState(null);
    const [palette, setPalette] = useState([]);
    const [count, setCount] = useState(8);
    const [copied, setCopied] = useState(null);

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImgUrl(URL.createObjectURL(file));
        setPalette([]);
    };

    const extract = async () => {
        if (!imgUrl) return;
        const img = new Image();
        await new Promise(resolve => { img.onload = resolve; img.src = imgUrl; });
        const canvas = document.createElement('canvas');
        const size = 220;
        canvas.width = size;
        canvas.height = Math.round((img.height / img.width) * size);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pixels = [];
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) continue;
            pixels.push([data[i], data[i + 1], data[i + 2]]);
        }
        const shuffle = [...pixels].sort(() => Math.random() - 0.5).slice(0, 3000);
        let centroids = shuffle.slice(0, count).map(p => [...p]);
        for (let iter = 0; iter < 20; iter++) {
            const clusters = Array.from({ length: count }, () => []);
            shuffle.forEach(p => {
                let minDist = Infinity, idx = 0;
                centroids.forEach((c, i) => {
                    const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
                    if (d < minDist) { minDist = d; idx = i; }
                });
                clusters[idx].push(p);
            });
            centroids = clusters.map(c => {
                if (!c.length) return centroids[Math.floor(Math.random() * count)];
                const avg = c.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]);
                return avg.map(v => Math.round(v / c.length));
            });
        }
        const toHex = ([r, g, b]) =>
            '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
        setPalette(centroids.map(c => toHex(c)));
    };

    const copy = (hex) => {
        navigator.clipboard.writeText(hex);
        setCopied(hex);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div className="space-y-6">
            <PanelTitle icon="🖼️" title="이미지에서 색상 추출" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="space-y-3">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        추출 색상 수 <span className="text-indigo-400 font-semibold">({count}개)</span>
                    </label>
                    <input
                        type="range"
                        min={3}
                        max={16}
                        value={count}
                        onChange={e => setCount(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: '#6366f1' }}
                    />

                    <label
                        className="mt-4 flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-indigo-500/60"
                        style={{
                            borderColor: imgUrl ? 'rgba(129,140,248,0.7)' : 'rgba(148,163,184,0.4)',
                            background: 'rgba(15,23,42,0.7)',
                        }}
                    >
                        {imgUrl ? (
                            <img
                                src={imgUrl}
                                className="max-h-52 max-w-full object-contain rounded-xl"
                                alt="source"
                            />
                        ) : (
                            <>
                                <span className="text-4xl">🎨</span>
                                <span className="text-sm text-slate-300">
                                    색상을 추출할 이미지를 선택하세요
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    PNG / JPG / WebP 지원
                                </span>
                            </>
                        )}
                        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                    </label>

                    <button
                        onClick={extract}
                        disabled={!imgUrl}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #6366f1cc, #6366f190)' }}
                    >
                        🎨 색상 팔레트 추출
                    </button>
                </div>

                <div className="lg:col-span-2">
                    {palette.length === 0 ? (
                        <div className="h-full min-h-[220px] flex items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 text-xs text-slate-500 text-center px-6">
                            이미지를 업로드하고 <span className="mx-1 font-semibold text-indigo-300">색상 팔레트 추출</span>을 눌러보세요.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                                {palette.map(hex => (
                                    <button
                                        key={hex}
                                        onClick={() => copy(hex)}
                                        title={`${hex} 클릭 시 복사`}
                                        className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
                                    >
                                        <div
                                            className="w-16 h-16 rounded-2xl shadow-lg"
                                            style={{
                                                background: hex,
                                                border: '2px solid rgba(255,255,255,0.12)',
                                            }}
                                        />
                                        <span
                                            className={`text-[10px] font-mono ${
                                                copied === hex ? 'text-emerald-300' : 'text-slate-400'
                                            }`}
                                        >
                                            {copied === hex ? '✓ 복사됨' : hex}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div
                                className="h-8 rounded-xl overflow-hidden flex"
                                style={{ border: '1px solid rgba(148,163,184,0.5)' }}
                            >
                                {palette.map(hex => (
                                    <div key={hex} className="flex-1" style={{ background: hex }} title={hex} />
                                ))}
                            </div>
                            <div className="rounded-2xl bg-slate-900/70 border border-slate-700/70 p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                        CSS 변수
                                    </span>
                                    <button
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                `:root {\n${palette
                                                    .map((h, i) => `  --color-${i + 1}: ${h};`)
                                                    .join('\n')}\n}`,
                                            )
                                        }
                                        className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-bold"
                                    >
                                        복사
                                    </button>
                                </div>
                                <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`:root {\n${palette.map((h,i) => `  --color-${i+1}: ${h};`).join('\n')}\n}`}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// ═══════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'converter', label: '색상 변환', icon: '🎨', desc: 'HEX · RGB · HSL · CMYK 상호 변환', component: ColorConverter, chipLabel: '변환' },
    { id: 'palette', label: '팔레트 생성', icon: '🎭', desc: '보색·유사색·삼색조 팔레트 자동 생성', component: PaletteGenerator, chipLabel: '팔레트' },
    { id: 'gradient', label: '그라데이션', icon: '🌈', desc: 'CSS linear/radial gradient 코드 생성', component: GradientBuilder, chipLabel: '그라데이션' },
    { id: 'accessibility', label: '접근성 검사', icon: '♿', desc: 'WCAG 2.1 색상 대비율 검사', component: AccessibilityChecker, chipLabel: '접근성' },
    { id: 'image-colors', label: '이미지 색상', icon: '🖼️', desc: '이미지에서 주요 색상 팔레트 자동 추출', component: ImageColorExtractor, chipLabel: '추출' },
];

export default function ColorStudio() {
    const [activeTab, setActiveTab] = useState('converter');
    const ActiveComp = TABS.find(t => t.id === activeTab)?.component;

    return (
        <StudioLayout
            color="#ec4899"
            icon="🎨"
            title="Color Studio"
            description="HEX/RGB/HSL/CMYK 색상 변환, 팔레트·그라데이션 생성, 접근성 대비율 검사, 이미지 색상 추출"
            tabs={TABS}
            tab={activeTab}
            setTab={setActiveTab}>
            {ActiveComp && <ActiveComp />}
        </StudioLayout>
    );
}
