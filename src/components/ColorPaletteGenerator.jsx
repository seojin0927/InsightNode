import React, { useState, useMemo } from 'react';

const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
};

const rgbToHsl = ({ r, g, b }) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex = (h, s, l) => {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

const HARMONY_TYPES = [
    { id: 'shades', label: '명도 단계' },
    { id: 'complementary', label: '보색' },
    { id: 'triadic', label: '삼색 배합' },
    { id: 'analogous', label: '유사색' },
    { id: 'split', label: '분할 보색' },
];

const ColorPaletteGenerator = () => {
    const [baseColor, setBaseColor] = useState('#6366f1');
    const [harmonyType, setHarmonyType] = useState('shades');
    const [copiedColor, setCopiedColor] = useState(null);

    const palette = useMemo(() => {
        const rgb = hexToRgb(baseColor);
        const hsl = rgbToHsl(rgb);
        const { h, s } = hsl;

        if (harmonyType === 'shades') {
            return [10, 20, 30, 40, 50, 60, 70, 80, 90].map(l => ({
                hex: hslToHex(h, s, l),
                label: `L${l}`,
            }));
        }
        if (harmonyType === 'complementary') {
            return [
                { hex: baseColor, label: '기본' },
                { hex: hslToHex((h + 180) % 360, s, hsl.l), label: '보색' },
                { hex: hslToHex(h, s, 30), label: '어두운 기본' },
                { hex: hslToHex((h + 180) % 360, s, 30), label: '어두운 보색' },
                { hex: hslToHex(h, s, 70), label: '밝은 기본' },
                { hex: hslToHex((h + 180) % 360, s, 70), label: '밝은 보색' },
            ];
        }
        if (harmonyType === 'triadic') {
            return [0, 120, 240].flatMap(offset => [
                { hex: hslToHex((h + offset) % 360, s, hsl.l), label: `삼색 ${offset + 1}` },
                { hex: hslToHex((h + offset) % 360, s, 70), label: `밝은 삼색 ${offset + 1}` },
            ]);
        }
        if (harmonyType === 'analogous') {
            return [-60, -30, 0, 30, 60].map(offset => ({
                hex: hslToHex((h + offset + 360) % 360, s, hsl.l),
                label: offset === 0 ? '기본' : `${offset > 0 ? '+' : ''}${offset}°`,
            }));
        }
        if (harmonyType === 'split') {
            return [
                { hex: baseColor, label: '기본' },
                { hex: hslToHex((h + 150) % 360, s, hsl.l), label: '분할 보색 1' },
                { hex: hslToHex((h + 210) % 360, s, hsl.l), label: '분할 보색 2' },
                { hex: hslToHex(h, s, 30), label: '어두운 기본' },
                { hex: hslToHex((h + 150) % 360, s, 30), label: '어두운 분할1' },
                { hex: hslToHex((h + 210) % 360, s, 70), label: '밝은 분할2' },
            ];
        }
        return [];
    }, [baseColor, harmonyType]);

    const copy = (hex) => {
        navigator.clipboard.writeText(hex).then(() => { setCopiedColor(hex); setTimeout(() => setCopiedColor(null), 2000); }).catch(()=>{});
    };

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(236,72,153,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>🎨</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">컬러 팔레트 생성기</h1>
                        <p className="text-xs text-slate-500">색상 이론 기반 팔레트 자동 생성 · 보색 · 유사색</p>
                    </div>
                </div>

                {/* 컨트롤 */}
                <div className="flex flex-wrap items-center gap-4 mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-400">기본 색상</label>
                        <input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer" style={{ background: 'transparent', border: 'none', padding: 0 }} />
                        <input type="text" value={baseColor} onChange={e => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setBaseColor(e.target.value); }} className="w-24 px-3 py-1.5 text-xs rounded-lg outline-none font-mono" />
                    </div>
                    <div className="flex rounded-xl p-0.5 gap-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {HARMONY_TYPES.map(t => (
                            <button key={t.id} onClick={() => setHarmonyType(t.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={harmonyType === t.id ? { background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff' } : { color: '#64748b' }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 팔레트 그리드 */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
                    {palette.map((c, i) => {
                        const rgb = hexToRgb(c.hex);
                        const isDark = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) < 128;
                        return (
                            <div key={i} className="rounded-xl overflow-hidden cursor-pointer group hover:scale-105 transition-transform"
                                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                onClick={() => copy(c.hex)}>
                                <div className="h-20" style={{ background: c.hex }} />
                                <div className="p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <div className="text-xs font-mono text-slate-300">{c.hex}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{c.label}</div>
                                    {copiedColor === c.hex && <div className="text-[10px] text-green-400 mt-0.5">✓ 복사됨</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CSS 변수 출력 */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">CSS 변수</h3>
                        <button onClick={() => copy(palette.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n'))} className="text-[10px] text-slate-500 hover:text-slate-300">복사</button>
                    </div>
                    <code className="text-[11px] font-mono text-slate-400 block whitespace-pre">
{`:root {\n${palette.map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.label} */`).join('\n')}\n}`}
                    </code>
                </div>
            </div>
        </div>
    );
};

export default ColorPaletteGenerator;
