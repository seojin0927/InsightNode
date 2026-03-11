import React, { useState, useRef } from 'react';
import StudioLayout, { S, CopyBtn } from './StudioLayout';

const ACCENT = '#6366f1';

// ═══════════════════════════════
// TAB 1: 이미지 일괄 리사이즈
// ═══════════════════════════════
function ImageResizerTab() {
    const [files, setFiles] = useState([]);
    const [width, setWidth] = useState(800);
    const [height, setHeight] = useState(600);
    const [keepRatio, setKeepRatio] = useState(true);
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState(90);
    const [results, setResults] = useState([]);
    const [processing, setProcessing] = useState(false);

    const handleFiles = (e) => {
        const fs = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        setFiles(fs);
        setResults([]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const fs = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        setFiles(fs);
        setResults([]);
    };

    const resize = async () => {
        setProcessing(true);
        const newResults = [];
        for (const file of files) {
            const url = URL.createObjectURL(file);
            const img = new Image();
            await new Promise(resolve => { img.onload = resolve; img.src = url; });
            let tw = width, th = height;
            if (keepRatio) {
                const ratio = img.width / img.height;
                th = Math.round(tw / ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = tw; canvas.height = th;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, tw, th);
            const blob = await new Promise(res => canvas.toBlob(res, format, quality / 100));
            const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
            newResults.push({ name: file.name.replace(/\.[^.]+$/, `.${ext}`), blob, url: URL.createObjectURL(blob), size: blob.size, w: tw, h: th });
            URL.revokeObjectURL(url);
        }
        setResults(newResults);
        setProcessing(false);
    };

    const downloadAll = () => {
        results.forEach(r => {
            const a = document.createElement('a');
            a.href = r.url; a.download = r.name; a.click();
        });
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className={S.label}>너비 (px)</label>
                    <input type="number" value={width} onChange={e => setWidth(+e.target.value)} className={S.input} min={1} />
                </div>
                <div>
                    <label className={S.label}>높이 (px) {keepRatio && <span className="text-indigo-400">(자동)</span>}</label>
                    <input type="number" value={height} onChange={e => setHeight(+e.target.value)} disabled={keepRatio} className={S.input} min={1} style={keepRatio ? { opacity: 0.4 } : {}} />
                </div>
                <div>
                    <label className={S.label}>출력 포맷</label>
                    <select value={format} onChange={e => setFormat(e.target.value)} className={S.input}>
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
                <div>
                    <label className={S.label}>품질 ({quality}%)</label>
                    <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)} className="w-full mt-2.5" style={{ accentColor: ACCENT }} />
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                <input type="checkbox" checked={keepRatio} onChange={e => setKeepRatio(e.target.checked)} className="w-4 h-4" style={{ accentColor: ACCENT }} />
                가로세로 비율 유지 (너비 기준)
            </label>
            <label onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-indigo-500/60"
                style={{ borderColor: files.length ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-4xl">🖼️</span>
                <span className="text-sm text-slate-400">이미지 파일을 클릭하거나 드래그하세요</span>
                {files.length > 0
                    ? <span className="px-3 py-1 rounded-full text-xs font-bold text-indigo-300" style={{ background: 'rgba(99,102,241,0.15)' }}>{files.length}개 파일 선택됨</span>
                    : <span className="text-xs text-slate-600">JPG / PNG / WebP / GIF 지원</span>
                }
                <input type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />
            </label>
            <button onClick={resize} disabled={files.length === 0 || processing}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)` }}>
                {processing ? '⏳ 처리 중...' : `📐 ${files.length}개 이미지 리사이즈`}
            </button>
            {results.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">✓ {results.length}개 완료</span>
                        <button onClick={downloadAll} className="text-xs px-3 py-1.5 rounded-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            전체 다운로드
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {results.map((r, i) => (
                            <div key={i} className={`${S.card} p-3`}>
                                <img src={r.url} alt={r.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                                <div className="text-xs text-slate-300 font-medium truncate" title={r.name}>{r.name}</div>
                                <div className="text-[10px] text-slate-500">{r.w}×{r.h}px · {(r.size / 1024).toFixed(1)}KB</div>
                                <a href={r.url} download={r.name}
                                    className="mt-2 block text-center text-xs py-1.5 rounded-lg font-bold text-indigo-400 hover:text-white transition-colors"
                                    style={{ background: 'rgba(99,102,241,0.1)' }}>
                                    다운로드
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════
// TAB 2: 파비콘 생성기
// ═══════════════════════════════
function FaviconGeneratorTab() {
    const [srcUrl, setSrcUrl] = useState(null);
    const [favicons, setFavicons] = useState([]);
    const [bgColor, setBgColor] = useState('#ffffff');
    const [transparent, setTransparent] = useState(false);
    const [padding, setPadding] = useState(8);
    const [shape, setShape] = useState('square');
    const sizes = [16, 32, 48, 64, 128, 256];

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSrcUrl(URL.createObjectURL(file));
        setFavicons([]);
    };

    const generate = async () => {
        if (!srcUrl) return;
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = srcUrl; });
        const results = sizes.map(size => {
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!transparent) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, size, size); }
            if (shape === 'circle') {
                ctx.save();
                ctx.beginPath();
                ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
                ctx.clip();
            }
            const p = (padding / 100) * size;
            ctx.drawImage(img, p, p, size - p*2, size - p*2);
            if (shape === 'circle') ctx.restore();
            return { size, url: canvas.toDataURL('image/png') };
        });
        setFavicons(results);
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className={S.label}>배경 색상</label>
                    <div className="flex gap-2">
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} disabled={transparent}
                            className="w-10 h-9 rounded-lg border border-slate-700/60 cursor-pointer" style={transparent ? { opacity: 0.4 } : {}} />
                        <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} disabled={transparent} className={`${S.input} flex-1`} style={transparent ? { opacity: 0.4 } : {}} />
                    </div>
                </div>
                <div>
                    <label className={S.label}>모양</label>
                    <select value={shape} onChange={e => setShape(e.target.value)} className={S.input}>
                        <option value="square">정사각형</option>
                        <option value="circle">원형</option>
                    </select>
                </div>
                <div>
                    <label className={S.label}>패딩 ({padding}%)</label>
                    <input type="range" min={0} max={30} value={padding} onChange={e => setPadding(+e.target.value)} className="w-full mt-2.5" style={{ accentColor: ACCENT }} />
                </div>
                <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer mt-4">
                        <input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)} className="w-4 h-4" style={{ accentColor: ACCENT }} />
                        투명 배경
                    </label>
                </div>
            </div>
            <label className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-indigo-500/60"
                style={{ borderColor: srcUrl ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                {srcUrl
                    ? <img src={srcUrl} className="w-24 h-24 object-contain rounded-xl" alt="source" />
                    : <><span className="text-4xl">🌟</span><span className="text-sm text-slate-400">원본 이미지 업로드 (PNG/SVG 권장)</span></>
                }
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            <button onClick={generate} disabled={!srcUrl}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)` }}>
                🌟 파비콘 생성 ({sizes.length}가지 크기)
            </button>
            {favicons.length > 0 && (
                <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">생성된 파비콘</div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                        {favicons.map(f => (
                            <div key={f.size} className={`${S.card} p-3 text-center`}>
                                <div className="flex items-center justify-center mb-2 rounded-lg h-12 overflow-hidden"
                                    style={{ background: 'repeating-conic-gradient(#2d374880 0% 25%, #1a203580 0% 50%) 0 0/12px 12px' }}>
                                    <img src={f.url} style={{ width: Math.min(f.size, 48), height: Math.min(f.size, 48) }} alt={`${f.size}px`} />
                                </div>
                                <div className="text-xs text-slate-300 font-bold">{f.size}px</div>
                                <a href={f.url} download={`favicon-${f.size}.png`}
                                    className="mt-1.5 block text-[10px] py-1 rounded font-bold text-indigo-400 hover:text-indigo-300"
                                    style={{ background: 'rgba(99,102,241,0.1)' }}>
                                    다운로드
                                </a>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 rounded-xl text-xs text-slate-400" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        💡 HTML head에 추가: <code className="text-indigo-300">&lt;link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png"&gt;</code>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════
// TAB 3: 이미지 색상 추출기
// ═══════════════════════════════
function ColorExtractorTab() {
    const [imgUrl, setImgUrl] = useState(null);
    const [palette, setPalette] = useState([]);
    const [count, setCount] = useState(8);
    const [copied, setCopied] = useState(null);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImgUrl(URL.createObjectURL(file));
        setPalette([]);
    };

    const extract = async () => {
        if (!imgUrl) return;
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = imgUrl; });
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = Math.round((img.height / img.width) * size);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pixels = [];
        for (let i = 0; i < data.length; i += 4) {
            if (data[i+3] < 128) continue;
            pixels.push([data[i], data[i+1], data[i+2]]);
        }
        const shuffle = [...pixels].sort(() => Math.random() - 0.5).slice(0, 3000);
        let centroids = shuffle.slice(0, count).map(p => [...p]);
        for (let iter = 0; iter < 20; iter++) {
            const clusters = Array.from({ length: count }, () => []);
            shuffle.forEach(p => {
                let minDist = Infinity, idx = 0;
                centroids.forEach((c, i) => {
                    const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
                    if (d < minDist) { minDist = d; idx = i; }
                });
                clusters[idx].push(p);
            });
            centroids = clusters.map(c => {
                if (!c.length) return centroids[Math.floor(Math.random() * count)];
                const avg = c.reduce((a,b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], [0,0,0]);
                return avg.map(v => Math.round(v / c.length));
            });
        }
        const toHex = ([r,g,b]) => '#' + [r,g,b].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
        setPalette(centroids.map(c => toHex(c)));
    };

    const copy = (hex) => {
        navigator.clipboard.writeText(hex);
        setCopied(hex);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div className="space-y-5">
            <div>
                <label className={S.label}>추출 색상 수 ({count}개)</label>
                <input type="range" min={3} max={16} value={count} onChange={e => setCount(+e.target.value)} className="w-full" style={{ accentColor: ACCENT }} />
            </div>
            <label className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-indigo-500/60"
                style={{ borderColor: imgUrl ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                {imgUrl
                    ? <img src={imgUrl} className="max-h-48 max-w-full object-contain rounded-xl" alt="" />
                    : <><span className="text-4xl">🎨</span><span className="text-sm text-slate-400">색상을 추출할 이미지를 선택하세요</span></>
                }
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            <button onClick={extract} disabled={!imgUrl}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)` }}>
                🎨 색상 추출
            </button>
            {palette.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        {palette.map(hex => (
                            <button key={hex} onClick={() => copy(hex)} title={`${hex} 클릭 시 복사`}
                                className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105">
                                <div className="w-16 h-16 rounded-2xl shadow-lg" style={{ background: hex, border: '2px solid rgba(255,255,255,0.1)' }} />
                                <span className="text-[10px] font-mono text-slate-400 hover:text-white transition-colors">
                                    {copied === hex ? '✓ 복사됨' : hex}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="h-8 rounded-xl overflow-hidden flex" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        {palette.map(hex => <div key={hex} className="flex-1" style={{ background: hex }} title={hex} />)}
                    </div>
                    <div className={`${S.card} p-4`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CSS 변수</span>
                            <CopyBtn text={`:root {\n${palette.map((h,i) => `  --color-${i+1}: ${h};`).join('\n')}\n}`} />
                        </div>
                        <pre className="text-xs font-mono text-emerald-300 overflow-x-auto">
{`:root {\n${palette.map((h,i) => `  --color-${i+1}: ${h};`).join('\n')}\n}`}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════
// TAB 4: SVG 최적화
// ═══════════════════════════════
function SvgOptimizerTab() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [stats, setStats] = useState(null);
    const [options, setOptions] = useState({
        removeComments: true, removeWhitespace: true, removeMetadata: true,
        removeEmptyAttrs: true, removeHidden: true, shortenColors: true, removeXmlDecl: true
    });

    const optimize = () => {
        if (!input.trim()) return;
        let svg = input;
        const origSize = new TextEncoder().encode(svg).length;
        if (options.removeXmlDecl) svg = svg.replace(/<\?xml[^?]*\?>/g, '').trim();
        if (options.removeComments) svg = svg.replace(/<!--[\s\S]*?-->/g, '');
        if (options.removeMetadata) svg = svg.replace(/<(metadata|title|desc)[\s\S]*?<\/\1>/gi, '');
        if (options.removeHidden) svg = svg.replace(/<[^>]*\s(?:display\s*=\s*["']none["']|visibility\s*=\s*["']hidden["'])[^>]*(?:\/>|>[\s\S]*?<\/[^>]+>)/gi, '');
        if (options.removeEmptyAttrs) svg = svg.replace(/\s+\w[\w-]*=""/g, '');
        if (options.shortenColors) {
            svg = svg.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/gi, '#$1$2$3');
            svg = svg.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, (_,r,g,b) => {
                const hex = '#' + [r,g,b].map(v => parseInt(v).toString(16).padStart(2,'0')).join('');
                return hex;
            });
        }
        if (options.removeWhitespace) {
            svg = svg.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
        }
        const newSize = new TextEncoder().encode(svg).length;
        const saved = ((1 - newSize / origSize) * 100).toFixed(1);
        setOutput(svg);
        setStats({ origSize, newSize, saved });
    };

    const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"   width="100"  height="100">
  <!-- Circle element -->
  <metadata>Created with SVG Editor</metadata>
  <title>Sample SVG</title>
  <desc>A simple test SVG</desc>
  <circle cx="50" cy="50" r="40" fill="#ff0000" stroke="" stroke-width="0" />
  <rect x="10" y="10" width="80" height="80" fill="rgb(0, 0, 255)" opacity="1.0" display="none" />
  <path d="M 10 20 L 30 40" fill="#ff6600" />
</svg>`;

    const optionLabels = {
        removeXmlDecl: 'XML 선언 제거', removeComments: '주석 제거', removeMetadata: '메타데이터 제거',
        removeWhitespace: '공백 최소화', removeEmptyAttrs: '빈 속성 제거', removeHidden: '숨김 요소 제거', shortenColors: '색상 단축'
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {Object.entries(options).map(([k, v]) => (
                    <label key={k} onClick={() => setOptions({...options, [k]: !v})}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-all select-none"
                        style={{ background: v ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${v ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`, color: v ? '#a5b4fc' : '#64748b' }}>
                        {optionLabels[k]}
                    </label>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className={S.label}>원본 SVG</span>
                        <button onClick={() => { setInput(SAMPLE); setOutput(''); setStats(null); }} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold">샘플 삽입</button>
                    </div>
                    <textarea value={input} onChange={e => { setInput(e.target.value); setStats(null); }} rows={14}
                        className={S.textarea} placeholder="<svg>...</svg> 코드를 붙여넣으세요" />
                    <div className="text-[10px] text-slate-600 mt-1">{new TextEncoder().encode(input).length} bytes</div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className={S.label}>
                            최적화 결과 {stats && <span className="text-emerald-400 normal-case font-bold">(-{stats.saved}% 절약)</span>}
                        </span>
                        {output && <CopyBtn text={output} />}
                    </div>
                    <textarea readOnly value={output} rows={14} className={S.textarea}
                        style={{ background: output ? 'rgba(16,185,129,0.04)' : undefined, borderColor: output ? 'rgba(16,185,129,0.2)' : undefined }}
                        placeholder="최적화 결과가 여기에 표시됩니다" />
                    <div className="text-[10px] text-emerald-600 mt-1">{output ? `${new TextEncoder().encode(output).length} bytes` : ''}</div>
                </div>
            </div>
            <button onClick={optimize} disabled={!input.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)` }}>
                ✨ SVG 최적화
            </button>
            {stats && (
                <div className="grid grid-cols-3 gap-3">
                    {[['원본', `${(stats.origSize/1024).toFixed(2)} KB`], ['최적화', `${(stats.newSize/1024).toFixed(2)} KB`], ['절약', `${stats.saved}%`]].map(([l,v]) => (
                        <div key={l} className={`${S.card} p-3 text-center`}>
                            <div className="text-xl font-black" style={{ color: l === '절약' ? '#10b981' : '#e2e8f0' }}>{v}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{l}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════
// TAB 5: 이미지 워터마크
// ═══════════════════════════════
function WatermarkToolTab() {
    const [imgUrl, setImgUrl] = useState(null);
    const [imgFileName, setImgFileName] = useState('image.jpg');
    const [text, setText] = useState('© InsightNode');
    const [fontSize, setFontSize] = useState(32);
    const [opacity, setOpacity] = useState(70);
    const [color, setColor] = useState('#ffffff');
    const [position, setPosition] = useState('bottom-right');
    const [repeat, setRepeat] = useState(false);
    const [rotate, setRotate] = useState(-30);
    const [result, setResult] = useState(null);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImgFileName(file.name);
        setImgUrl(URL.createObjectURL(file));
        setResult(null);
    };

    const apply = async () => {
        if (!imgUrl) return;
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = imgUrl; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha = opacity / 100;
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;

        if (repeat) {
            const textWidth = ctx.measureText(text).width;
            const pattern = document.createElement('canvas');
            pattern.width = textWidth + 60;
            pattern.height = fontSize * 4;
            const pctx = pattern.getContext('2d');
            pctx.save();
            pctx.translate(pattern.width / 2, pattern.height / 2);
            pctx.rotate((rotate * Math.PI) / 180);
            pctx.globalAlpha = opacity / 100;
            pctx.fillStyle = color;
            pctx.font = `bold ${fontSize}px Arial, sans-serif`;
            pctx.textAlign = 'center';
            pctx.textBaseline = 'middle';
            pctx.fillText(text, 0, 0);
            pctx.restore();
            const pat = ctx.createPattern(pattern, 'repeat');
            ctx.globalAlpha = 1;
            ctx.fillStyle = pat;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            const margin = fontSize * 0.8;
            ctx.textBaseline = 'middle';
            let x, y;
            if (position === 'top-left')     { x = margin; y = margin; ctx.textAlign = 'left'; }
            else if (position === 'top-right')    { x = canvas.width - margin; y = margin; ctx.textAlign = 'right'; }
            else if (position === 'bottom-left')  { x = margin; y = canvas.height - margin; ctx.textAlign = 'left'; }
            else if (position === 'bottom-right') { x = canvas.width - margin; y = canvas.height - margin; ctx.textAlign = 'right'; }
            else                                  { x = canvas.width/2; y = canvas.height/2; ctx.textAlign = 'center'; }
            ctx.fillText(text, x, y);
        }

        setResult(canvas.toDataURL('image/jpeg', 0.95));
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label className={S.label}>워터마크 텍스트</label>
                    <input type="text" value={text} onChange={e => setText(e.target.value)} className={S.input} placeholder="© 워터마크 텍스트" />
                </div>
                <div>
                    <label className={S.label}>색상</label>
                    <div className="flex gap-2">
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-9 rounded-lg border border-slate-700/60 cursor-pointer" />
                        <input type="text" value={color} onChange={e => setColor(e.target.value)} className={`${S.input} flex-1`} />
                    </div>
                </div>
                <div>
                    <label className={S.label}>글자 크기 ({fontSize}px)</label>
                    <input type="range" min={12} max={200} value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full mt-2.5" style={{ accentColor: ACCENT }} />
                </div>
                <div>
                    <label className={S.label}>불투명도 ({opacity}%)</label>
                    <input type="range" min={10} max={100} value={opacity} onChange={e => setOpacity(+e.target.value)} className="w-full mt-2.5" style={{ accentColor: ACCENT }} />
                </div>
                <div>
                    <label className={S.label}>위치 {repeat && <span className="text-slate-600 normal-case">(반복 모드)</span>}</label>
                    <select value={position} onChange={e => setPosition(e.target.value)} disabled={repeat} className={S.input} style={repeat ? { opacity: 0.4 } : {}}>
                        <option value="top-left">좌상단</option>
                        <option value="top-right">우상단</option>
                        <option value="center">가운데</option>
                        <option value="bottom-left">좌하단</option>
                        <option value="bottom-right">우하단</option>
                    </select>
                </div>
            </div>
            <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} className="w-4 h-4" style={{ accentColor: ACCENT }} />
                    전체 반복 패턴
                </label>
                {repeat && (
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs text-slate-400 whitespace-nowrap">회전 ({rotate}°)</span>
                        <input type="range" min={-90} max={90} value={rotate} onChange={e => setRotate(+e.target.value)} className="flex-1" style={{ accentColor: ACCENT }} />
                    </div>
                )}
            </div>
            <label className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-indigo-500/60"
                style={{ borderColor: imgUrl ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                {imgUrl
                    ? <img src={imgUrl} className="max-h-48 max-w-full object-contain rounded-xl" alt="" />
                    : <><span className="text-4xl">🖊️</span><span className="text-sm text-slate-400">워터마크를 추가할 이미지를 선택하세요</span></>
                }
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            <button onClick={apply} disabled={!imgUrl || !text}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)` }}>
                🖊️ 워터마크 적용
            </button>
            {result && (
                <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">결과 미리보기</div>
                    <img src={result} className="max-h-72 max-w-full object-contain rounded-xl mb-3" style={{ border: '1px solid rgba(255,255,255,0.1)' }} alt="결과" />
                    <a href={result} download={`watermarked_${imgFileName}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        다운로드
                    </a>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════
// TABS & EXPORT
// ═══════════════════════════════
const TABS = [
    { id: 'resizer',   icon: '📐', label: '일괄 리사이즈',  desc: '여러 이미지를 원하는 크기로 일괄 조정 (JPEG/PNG/WebP)',   component: ImageResizerTab },
    { id: 'favicon',   icon: '🌟', label: '파비콘 생성기',  desc: 'PNG/SVG를 16~256px 파비콘 6가지 크기로 즉시 변환',        component: FaviconGeneratorTab },
    { id: 'svg',       icon: '✨', label: 'SVG 최적화',     desc: 'SVG 파일 크기 최소화 & 코드 최적화 (주석·메타데이터 제거)', component: SvgOptimizerTab },
    { id: 'watermark', icon: '🖊️', label: '워터마크',       desc: '이미지에 텍스트 워터마크 추가 (단일 위치 & 전체 반복 패턴)', component: WatermarkToolTab },
];

export default function MediaStudio() {
    const [tab, setTab] = useState('resizer');
    const Comp = TABS.find(t => t.id === tab)?.component;
    return (
        <StudioLayout
            color={ACCENT}
            icon="🖼️"
            title="Media Studio"
            description="이미지 리사이즈·파비콘·SVG 최적화·워터마크"
            tabs={TABS}
            tab={tab}
            setTab={setTab}>
            {Comp && <Comp />}
        </StudioLayout>
    );
}
