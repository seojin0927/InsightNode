import React, { useState, useEffect, useCallback, useRef } from 'react';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ColorStudio = () => {
    // === 상태 관리 ===
    const [hex, setHex] = useState('#3B82F6');
    const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
    const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
    const [cmyk, setCmyk] = useState({ c: 76, m: 47, y: 0, k: 4 });
    const [savedColors, setSavedColors] = useState([]);
    
    // 탭 상태
    const [activeTab, setActiveTab] = useState('picker'); // picker, harmony, image, gradient
    
    // 이미지 추출 관련
    const [image, setImage] = useState(null);
    const canvasRef = useRef(null);
    const magnifierRef = useRef(null);
    const [hoverColor, setHoverColor] = useState(null);
    const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, show: false });

    // 예시 이미지 (고화질, CORS 문제 없는 Base64 또는 호스팅 이미지)
    const exampleImageUrl = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop";

    // === 유틸리티 함수 ===
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHex = (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    };

    const rgbToHsl = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    };

    const rgbToCmyk = (r, g, b) => {
        let c = 1 - (r / 255);
        let m = 1 - (g / 255);
        let y = 1 - (b / 255);
        let k = Math.min(c, m, y);
        
        c = (c - k) / (1 - k) || 0;
        m = (m - k) / (1 - k) || 0;
        y = (y - k) / (1 - k) || 0;

        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    };

    const updateColor = (type, value) => {
        let newRgb = { ...rgb };

        if (type === 'hex') {
            setHex(value);
            const res = hexToRgb(value);
            if (res) newRgb = res;
        } else if (type === 'rgb') {
            newRgb = value;
        }

        if (type !== 'hex') setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        if (type !== 'rgb') setRgb(newRgb);
        
        setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
        setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
    };

    const getHarmony = () => {
        const { h, s, l } = hsl;
        return {
            complementary: { ...hsl, h: (h + 180) % 360 },
            analogous1: { ...hsl, h: (h + 30) % 360 },
            analogous2: { ...hsl, h: (h - 30 + 360) % 360 },
            triadic1: { ...hsl, h: (h + 120) % 360 },
            triadic2: { ...hsl, h: (h + 240) % 360 },
        };
    };
    const harmony = getHarmony();
    
    const harmonyLabels = {
        complementary: '보색 (Complementary)',
        analogous1: '유사색 1 (Analogous)',
        analogous2: '유사색 2 (Analogous)',
        triadic1: '삼각색 1 (Triadic)',
        triadic2: '삼각색 2 (Triadic)',
    };

    // === 이미지 핸들링 ===
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // 이미지가 로드되면 상태만 업데이트 (그리기는 useEffect에서 처리)
                setImage(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const loadExampleImage = () => {
        // 예시 이미지는 CrossOrigin 문제가 발생할 수 있으므로, 
        // 실제 서비스에서는 서버에 호스팅된 이미지를 사용하거나 프록시를 써야 합니다.
        // 여기서는 예시 URL을 상태에 설정합니다.
        setImage(exampleImageUrl);
    };

    // === 캔버스 그리기 로직 (useEffect로 관리) ===
    useEffect(() => {
        if (activeTab === 'image' && image && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const img = new Image();
            
            // CORS 설정 (외부 이미지 로드 시 캔버스 오염 방지)
            img.crossOrigin = 'Anonymous';
            
            img.onload = () => {
                // 캔버스 크기를 이미지 원본 크기에 맞춤
                canvas.width = img.width;
                canvas.height = img.height;
                // 이미지 그리기
                ctx.drawImage(img, 0, 0);
            };
            
            img.onerror = () => {
                alert('이미지를 불러오는데 실패했습니다. (CORS 보안 정책일 수 있습니다)');
            };

            img.src = image;
        }
    }, [image, activeTab]);

    // === 픽셀 선택 및 돋보기 로직 ===
    const pickColor = (e) => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const rect = canvas.getBoundingClientRect();
        
        // 마우스 좌표를 캔버스 내부 좌표로 변환 (비율 계산)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // 캔버스 범위 밖이면 무시
        if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) {
            setMagnifierPos(prev => ({ ...prev, show: false }));
            return;
        }

        // 픽셀 데이터 가져오기
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hexVal = rgbToHex(pixel[0], pixel[1], pixel[2]);
        setHoverColor(hexVal);
        
        // 돋보기 위치 업데이트 (마우스 위치 기준)
        setMagnifierPos({ x: e.clientX, y: e.clientY, show: true });

        // 돋보기 캔버스 그리기
        if (magnifierRef.current) {
            const magCtx = magnifierRef.current.getContext('2d');
            // 픽셀이 깨지지 않고 선명하게 보이도록 설정
            magCtx.imageSmoothingEnabled = false; 

            const zoom = 10; // 확대 배율 (픽셀이 잘 보이도록 크게)
            const size = 120; // 돋보기 캔버스 크기 (px)
            const sourceSize = size / zoom;

            // 배경 초기화
            magCtx.fillStyle = '#1a1a1a';
            magCtx.fillRect(0, 0, size, size);

            // 원본 캔버스에서 마우스 주변 영역을 잘라내어 확대해서 그림
            magCtx.drawImage(
                canvas,
                Math.floor(x - sourceSize / 2),
                Math.floor(y - sourceSize / 2),
                sourceSize,
                sourceSize,
                0,
                0,
                size,
                size
            );

            // 중앙 십자선 (선택 지점 표시)
            magCtx.lineWidth = 1;
            magCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            magCtx.beginPath();
            magCtx.moveTo(size / 2, 0);
            magCtx.lineTo(size / 2, size);
            magCtx.moveTo(0, size / 2);
            magCtx.lineTo(size, size / 2);
            magCtx.stroke();

            // 중앙 픽셀 강조 테두리
            magCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            magCtx.strokeRect((size - zoom) / 2, (size - zoom) / 2, zoom, zoom);
        }
        
        // 클릭 시 색상 선택
        if (e.type === 'click') {
            updateColor('hex', hexVal);
        }
    };

    const hideMagnifier = () => {
        setMagnifierPos(prev => ({ ...prev, show: false }));
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Icon path="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">컬러 마스터 스튜디오</h2>
                    <p className="text-slate-400 text-sm">색상 변환, 팔레트 생성, 이미지 색상 추출 통합 툴</p>
                </div>
            </div>

            {/* 2. 탭 메뉴 */}
            <div className="flex gap-2 mb-6 flex-shrink-0 overflow-x-auto scrollbar-hide">
                {[
                    { id: 'picker', label: '🎨 색상 선택 및 변환' },
                    { id: 'harmony', label: '🌈 색상 조화' },
                    { id: 'image', label: '🖼️ 이미지 추출' },
                    { id: 'gradient', label: '💈 그라디언트' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                            activeTab === tab.id 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 3. 메인 컨텐츠 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 메인 기능 영역 (Col 7) */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-6 flex flex-col h-full border border-slate-700 relative overflow-y-auto custom-scrollbar">
                        
                        {/* A. 색상 선택 및 변환 */}
                        {activeTab === 'picker' && (
                            <div className="flex flex-col gap-6">
                                {/* 색상 미리보기 */}
                                <div className="h-32 rounded-xl shadow-inner border border-slate-600 relative" style={{ backgroundColor: hex }}>
                                    <input 
                                        type="color" 
                                        value={hex} 
                                        onChange={(e) => updateColor('hex', e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/30 backdrop-blur px-2 py-1 rounded text-white font-mono text-sm">
                                        {hex}
                                    </div>
                                    <div className="absolute bottom-2 right-2 text-white/50 text-xs px-2 pointer-events-none">
                                        클릭하여 색상 변경
                                    </div>
                                </div>

                                {/* 입력 필드 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 font-bold">HEX</label>
                                        <div className="flex gap-2">
                                            <span className="bg-slate-700 px-3 py-2 rounded-l-lg text-slate-400 border border-slate-600 border-r-0">#</span>
                                            <input 
                                                type="text" 
                                                value={hex.replace('#', '')} 
                                                onChange={(e) => updateColor('hex', '#' + e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-600 rounded-r-lg px-3 py-2 text-white outline-none font-mono uppercase focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 font-bold">RGB</label>
                                        <div className="flex gap-2">
                                            <input type="number" value={rgb.r} onChange={(e) => updateColor('rgb', { ...rgb, r: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-center" />
                                            <input type="number" value={rgb.g} onChange={(e) => updateColor('rgb', { ...rgb, g: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-center" />
                                            <input type="number" value={rgb.b} onChange={(e) => updateColor('rgb', { ...rgb, b: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-center" />
                                        </div>
                                    </div>
                                </div>

                                {/* 슬라이더 (HSL) */}
                                <div className="space-y-4 pt-4 border-t border-slate-700">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>색상 (Hue)</span>
                                            <span>{hsl.h}°</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="360" 
                                            value={hsl.h} 
                                            onChange={(e) => {
                                                const newH = parseInt(e.target.value);
                                                const newRgb = (function(h,s,l){
                                                    s /= 100; l /= 100;
                                                    let c = (1 - Math.abs(2 * l - 1)) * s,
                                                        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
                                                        m = l - c / 2,
                                                        r = 0, g = 0, b = 0;
                                                    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
                                                    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
                                                    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
                                                    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
                                                    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
                                                    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
                                                    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
                                                })(newH, hsl.s, hsl.l);
                                                updateColor('rgb', newRgb);
                                            }}
                                            className="w-full accent-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* B. 색상 조화 */}
                        {activeTab === 'harmony' && (
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase">추천 배색 (Harmonies)</h3>
                                {['complementary', 'analogous1', 'analogous2', 'triadic1'].map((key) => {
                                    const h = harmony[key];
                                    const colorStyle = { backgroundColor: `hsl(${h.h}, ${h.s}%, ${h.l}%)` };
                                    return (
                                        <div key={key} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl">
                                            <div className="w-12 h-12 rounded-lg shadow-md" style={colorStyle}></div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-200">{harmonyLabels[key]}</div>
                                                <div className="text-xs text-slate-400 font-mono">hsl({h.h}, {h.s}%, {h.l}%)</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* C. 이미지 색상 추출 (개선됨) */}
                        {activeTab === 'image' && (
                            <div className="flex flex-col h-full">
                                {!image ? (
                                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-xl transition-colors bg-slate-800/50">
                                        <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        <p className="mt-4 text-slate-300 font-medium">이미지를 업로드하세요</p>
                                        <p className="text-slate-500 text-xs mt-1">또는 드래그 앤 드롭</p>
                                        
                                        <div className="flex gap-3 mt-6">
                                            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold cursor-pointer transition-colors shadow-lg shadow-blue-500/20">
                                                파일 선택
                                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            </label>
                                            <button 
                                                onClick={loadExampleImage}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                예시 이미지 보기
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // 투명 배경 패턴 (체크무늬) 적용
                                    <div className="relative flex-1 overflow-hidden border border-slate-600 rounded-xl bg-[#1a1a1a] flex items-center justify-center"
                                         style={{ 
                                             backgroundImage: `
                                                 linear-gradient(45deg, #262626 25%, transparent 25%), 
                                                 linear-gradient(-45deg, #262626 25%, transparent 25%), 
                                                 linear-gradient(45deg, transparent 75%, #262626 75%), 
                                                 linear-gradient(-45deg, transparent 75%, #262626 75%)`,
                                             backgroundSize: '20px 20px',
                                             backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                                         }}
                                    >
                                        {/* 메인 캔버스 */}
                                        <canvas 
                                            ref={canvasRef} 
                                            onMouseMove={pickColor} 
                                            onClick={pickColor}
                                            onMouseLeave={hideMagnifier}
                                            className="max-w-full max-h-full object-contain cursor-crosshair shadow-2xl"
                                        />
                                        
                                        {/* 돋보기 (커서 옆에 따라다님) */}
                                        {magnifierPos.show && (
                                            <div 
                                                className="fixed pointer-events-none z-50 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-black"
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    left: magnifierPos.x + 20, // 커서 우측 하단
                                                    top: magnifierPos.y + 20,
                                                }}
                                            >
                                                <canvas 
                                                    ref={magnifierRef}
                                                    width="120"
                                                    height="120"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        )}

                                        {/* 선택된 색상 정보 오버레이 */}
                                        {hoverColor && (
                                            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-600 flex items-center gap-3 shadow-xl z-10">
                                                <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: hoverColor }}></div>
                                                <span className="text-white font-mono text-sm font-bold">{hoverColor}</span>
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={()=>setImage(null)} 
                                            className="absolute top-4 left-4 bg-red-600/90 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg font-bold transition-colors z-10"
                                        >
                                            이미지 제거
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* D. 그라디언트 */}
                        {activeTab === 'gradient' && (
                            <div className="space-y-6">
                                <div 
                                    className="h-40 rounded-xl shadow-lg border border-slate-600" 
                                    style={{ background: `linear-gradient(90deg, ${hex}, #000000)` }}
                                ></div>
                                <div className="text-center text-slate-400 text-sm py-4">
                                    (그라디언트 생성기 기능 준비 중)
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* 우측: 정보 및 팔레트 (Col 5) */}
                <div className="lg:col-span-5 flex flex-col h-full min-h-0 gap-4">
                    
                    {/* 색상 정보 (Details) */}
                    <div className="bg-slate-800 rounded-xl p-5 flex-1 shadow-inner border border-slate-700/50 flex flex-col min-h-0">
                        <h3 className="text-sm font-bold text-slate-300 uppercase mb-4">색상 상세 정보</h3>
                        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                            {[
                                { label: 'HEX', val: hex },
                                { label: 'RGB', val: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                                { label: 'HSL', val: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
                                { label: 'CMYK', val: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-700 group cursor-pointer hover:border-blue-500 transition-colors"
                                     onClick={() => {navigator.clipboard.writeText(item.val); alert('복사되었습니다!')}}>
                                    <span className="text-xs font-bold text-slate-500">{item.label}</span>
                                    <span className="text-sm font-mono text-slate-200">{item.val}</span>
                                    <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100">복사</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 저장된 팔레트 (Palette) */}
                    <div className="bg-slate-800 rounded-xl p-5 h-1/3 min-h-[200px] border border-slate-700/50 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-300 uppercase">저장된 팔레트</h3>
                            <button onClick={() => setSavedColors([...savedColors, hex])} className="text-xs bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-500">+ 현재 색상 저장</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-5 gap-2 content-start">
                            {savedColors.map((c, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => updateColor('hex', c)}
                                    className="aspect-square rounded-lg cursor-pointer border border-slate-600 hover:border-white transition-all hover:scale-110 shadow-sm relative group"
                                    style={{ backgroundColor: c }}
                                    title={c}
                                >
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSavedColors(savedColors.filter((_, idx) => idx !== i)); }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {savedColors.length === 0 && (
                                <div className="col-span-5 text-center text-xs text-slate-600 py-4">저장된 색상이 없습니다</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ColorStudio;