import React, { useState } from 'react';

export default function GlassmorphismGenerator() {
    const [blur, setBlur] = useState(16);
    const [opacity, setOpacity] = useState(15);
    const [saturation, setSaturation] = useState(180);
    const [borderOpacity, setBorderOpacity] = useState(20);
    const [shadowBlur, setShadowBlur] = useState(32);
    const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)');
    const [copied, setCopied] = useState(false);

    const glassStyle = {
        background: `rgba(255, 255, 255, ${opacity/100})`,
        backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
        border: `1px solid rgba(255, 255, 255, ${borderOpacity/100})`,
        boxShadow: `0 8px ${shadowBlur}px rgba(0, 0, 0, 0.1)`,
    };

    const cssCode = `.glass {
  background: rgba(255, 255, 255, ${opacity/100});
  backdrop-filter: blur(${blur}px) saturate(${saturation}%);
  -webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);
  border: 1px solid rgba(255, 255, 255, ${borderOpacity/100});
  box-shadow: 0 8px ${shadowBlur}px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
}`;

    const copy = () => { navigator.clipboard.writeText(cssCode); setCopied(true); setTimeout(() => setCopied(false), 1500); };

    const PRESETS = [
        { name: '기본 유리', blur:16, opacity:15, saturation:180, borderOpacity:20 },
        { name: '프로스트', blur:24, opacity:8, saturation:200, borderOpacity:15 },
        { name: '스모크', blur:8, opacity:30, saturation:120, borderOpacity:30 },
        { name: '밀키', blur:20, opacity:40, saturation:160, borderOpacity:40 },
        { name: '크리스탈', blur:12, opacity:5, saturation:250, borderOpacity:10 },
        { name: '다크 글래스', blur:20, opacity:5, saturation:160, borderOpacity:10 },
    ];

    const GRADIENTS = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)',
        'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
        'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    ];

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white">Glassmorphism Generator</h1>
                    <p className="text-sm text-slate-500 mt-1">유리 효과 UI 디자인 CSS를 즉시 생성합니다</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 미리보기 */}
                    <div className="space-y-4">
                        {/* 배경 그라데이션 선택 */}
                        <div>
                            <label className="text-xs font-bold text-slate-300 block mb-2">배경 그라데이션</label>
                            <div className="flex gap-2">
                                {GRADIENTS.map((g, i) => (
                                    <button key={i} onClick={() => setBgGradient(g)}
                                        className={`flex-1 h-8 rounded-xl border-2 transition-all hover:scale-105 ${bgGradient === g ? 'border-white' : 'border-transparent'}`}
                                        style={{ background: g }} />
                                ))}
                            </div>
                        </div>

                        {/* 미리보기 박스 */}
                        <div className="h-72 rounded-2xl flex items-center justify-center p-6 overflow-hidden" style={{ background: bgGradient }}>
                            <div className="w-full max-w-xs p-6 rounded-2xl text-white" style={glassStyle}>
                                <div className="text-lg font-black mb-2">유리 효과 카드</div>
                                <p className="text-sm opacity-80 mb-4">Glassmorphism 스타일의 UI 컴포넌트입니다.</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>확인</button>
                                    <button className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>취소</button>
                                </div>
                            </div>
                        </div>

                        {/* CSS 코드 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-300">CSS 코드</label>
                                <button onClick={copy} className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{copied ? '복사됨!' : '복사'}</button>
                            </div>
                            <pre className="bg-slate-900 rounded-xl px-4 py-3 text-xs text-emerald-300 font-mono border border-slate-700 overflow-x-auto">{cssCode}</pre>
                        </div>
                    </div>

                    {/* 슬라이더 */}
                    <div className="space-y-5">
                        {/* 프리셋 */}
                        <div>
                            <label className="text-xs font-bold text-slate-300 block mb-2">프리셋</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {PRESETS.map(p => (
                                    <button key={p.name} onClick={() => { setBlur(p.blur); setOpacity(p.opacity); setSaturation(p.saturation); setBorderOpacity(p.borderOpacity); }}
                                        className="py-2 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700 hover:bg-slate-700 hover:text-white transition-all">{p.name}</button>
                                ))}
                            </div>
                        </div>

                        {[
                            { label: `블러 강도 (${blur}px)`, val: blur, setter: setBlur, min:0, max:40, color:'#6366f1' },
                            { label: `배경 불투명도 (${opacity}%)`, val: opacity, setter: setOpacity, min:0, max:80, color:'#06b6d4' },
                            { label: `채도 (${saturation}%)`, val: saturation, setter: setSaturation, min:100, max:300, color:'#a855f7' },
                            { label: `테두리 불투명도 (${borderOpacity}%)`, val: borderOpacity, setter: setBorderOpacity, min:0, max:80, color:'#22c55e' },
                            { label: `그림자 블러 (${shadowBlur}px)`, val: shadowBlur, setter: setShadowBlur, min:0, max:80, color:'#f59e0b' },
                        ].map(({ label, val, setter, min, max, color }) => (
                            <div key={label}>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs text-slate-400 font-bold">{label}</label>
                                </div>
                                <input type="range" min={min} max={max} value={val} onChange={e => setter(Number(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                    style={{ accentColor: color }} />
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>{min}</span><span>{max}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
