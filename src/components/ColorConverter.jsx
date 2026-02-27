import React, { useState, useCallback, useEffect } from 'react';
import Icons from '../utils/Icons';

const ColorConverter = () => {
    const [hexInput, setHexInput] = useState('#3B82F6');
    const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
    const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
    const [cmyk, setCmyk] = useState({ c: 76, g: 47, y: 0, k: 4 });
    const [error, setError] = useState('');
    const [imageUrl, setImageUrl] = useState(null);
    const [extractedColors, setExtractedColors] = useState([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [hoverColor, setHoverColor] = useState(null);
    const [hoverPosition, setHoverPosition] = useState(null);
    const [imageCanvas, setImageCanvas] = useState(null);

    // 샘플 색상
    const sampleColors = [
        { label: '볼트시트 블루', hex: '#3B82F6' },
        { label: '성공 그린', hex: '#10B981' },
        { label: '경고 앰버', hex: '#F59E0B' },
        { label: '위험 레드', hex: '#EF4444' },
        { label: '다크', hex: '#1F2937' },
        { label: '라이트', hex: '#F3F4F6' },
    ];

    // 사이트 로고 이미지 (public 폴더에서 로드)
    const logoImageUrl = '/logo.svg';

    // HEX → RGB 변환
    const hexToRgb = useCallback((hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) {
            // 3자리 HEX 처리
            const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
            if (shortResult) {
                return {
                    r: parseInt(shortResult[1] + shortResult[1], 16),
                    g: parseInt(shortResult[2] + shortResult[2], 16),
                    b: parseInt(shortResult[3] + shortResult[3], 16),
                };
            }
            return null;
        }
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        };
    }, []);

    // RGB → HEX 변환
    const rgbToHex = useCallback((r, g, b) => {
        return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }, []);

    // RGB → HSL 변환
    const rgbToHsl = useCallback((r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s;
        const l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    }, []);

    // HSL → RGB 변환
    const hslToRgb = useCallback((h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
        };
    }, []);

    // RGB → CMYK 변환
    const rgbToCmyk = useCallback((r, g, b) => {
        if (r === 0 && g === 0 && b === 0) {
            return { c: 0, m: 0, y: 0, k: 100 };
        }

        const c = 1 - (r / 255);
        const m = 1 - (g / 255);
        const y = 1 - (b / 255);
        const k = Math.min(c, m, y);

        return {
            c: Math.round(((c - k) / (1 - k)) * 100),
            m: Math.round(((m - k) / (1 - k)) * 100),
            y: Math.round(((y - k) / (1 - k)) * 100),
            k: Math.round(k * 100),
        };
    }, []);

    // CMYK → RGB 변환
    const cmykToRgb = useCallback((c, m, y, k) => {
        c /= 100;
        m /= 100;
        y /= 100;
        k /= 100;

        return {
            r: Math.round(255 * (1 - c) * (1 - k)),
            g: Math.round(255 * (1 - m) * (1 - k)),
            b: Math.round(255 * (1 - y) * (1 - k)),
        };
    }, []);

    // 색상 업데이트
    const updateFromHex = useCallback((hex) => {
        const rgbVal = hexToRgb(hex);
        if (rgbVal) {
            setRgb(rgbVal);
            setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
            setCmyk(rgbToCmyk(rgbVal.r, rgbVal.g, rgbVal.b));
            setError('');
        } else {
            setError('유효하지 않은 HEX 색상 코드입니다.');
        }
    }, [hexToRgb, rgbToHsl, rgbToCmyk]);

    const updateFromRgb = useCallback((r, g, b) => {
        r = Math.max(0, Math.min(255, parseInt(r) || 0));
        g = Math.max(0, Math.min(255, parseInt(g) || 0));
        b = Math.max(0, Math.min(255, parseInt(b) || 0));
        
        setRgb({ r, g, b });
        setHexInput(rgbToHex(r, g, b));
        setHsl(rgbToHsl(r, g, b));
        setCmyk(rgbToCmyk(r, g, b));
    }, [rgbToHex, rgbToHsl, rgbToCmyk]);

    const updateFromHsl = useCallback((h, s, l) => {
        h = Math.max(0, Math.min(360, parseInt(h) || 0));
        s = Math.max(0, Math.min(100, parseInt(s) || 0));
        l = Math.max(0, Math.min(100, parseInt(l) || 0));
        
        const rgbVal = hslToRgb(h, s, l);
        setRgb(rgbVal);
        setHsl({ h, s, l });
        setHexInput(rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b));
        setCmyk(rgbToCmyk(rgbVal.r, rgbVal.g, rgbVal.b));
    }, [hslToRgb, rgbToHex, rgbToCmyk]);

    const updateFromCmyk = useCallback((c, m, y, k) => {
        c = Math.max(0, Math.min(100, parseInt(c) || 0));
        m = Math.max(0, Math.min(100, parseInt(m) || 0));
        y = Math.max(0, Math.min(100, parseInt(y) || 0));
        k = Math.max(0, Math.min(100, parseInt(k) || 0));
        
        const rgbVal = cmykToRgb(c, m, y, k);
        setRgb(rgbVal);
        setCmyk({ c, m, y, k });
        setHexInput(rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b));
        setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
    }, [cmykToRgb, rgbToHex, rgbToHsl]);

    // HEX 입력 변경 시
    useEffect(() => {
        if (hexInput.startsWith('#') && hexInput.length >= 4) {
            updateFromHex(hexInput);
        }
    }, [hexInput, updateFromHex]);

    // 클립보드 복사
    const copyToClipboard = useCallback((text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`${text}가 클립보드에 복사되었습니다!`);
        });
    }, []);

    // 색상 이름 추출 (대략적)
    const getColorName = useCallback((hex) => {
        const colorNames = {
            '#FF0000': '빨강', '#00FF00': '초록', '#0000FF': '파랑',
            '#FFFF00': '노랑', '#FF00FF': '마젠타', '#00FFFF': '시안',
            '#FFFFFF': '흰색', '#000000': '검정', '#808080': '회색',
            '#3B82F6': '볼트시트 블루', '#10B981': '에메랄드',
            '#F59E0B': '앰버', '#EF4444': '레드', '#8B5CF6': '바이올렛',
        };
        return colorNames[hex.toUpperCase()] || '사용자 정의';
    }, []);

    // 이미지 업로드 핸들러
    const handleImageUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageUrl(event.target.result);
                extractColorsFromImage(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    // 이미지에서 색상 추출
    const extractColorsFromImage = useCallback((imgSrc) => {
        setIsExtracting(true);
        
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 이미지 크기를 줄여서 처리 (성능 향상)
            const maxSize = 100;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, width, height);
            const pixels = imageData.data;
            
            // 색상 빈도수 계산
            const colorMap = {};
            for (let i = 0; i < pixels.length; i += 4) {
                const r = Math.round(pixels[i] / 16) * 16;
                const g = Math.round(pixels[i + 1] / 16) * 16;
                const b = Math.round(pixels[i + 2] / 16) * 16;
                
                // 투명도 제외
                if (pixels[i + 3] < 128) continue;
                
                const hex = rgbToHex(r, g, b);
                if (colorMap[hex]) {
                    colorMap[hex]++;
                } else {
                    colorMap[hex] = 1;
                }
            }
            
            // 빈도수로 정렬 후 상위 색상 추출
            const sortedColors = Object.entries(colorMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([hex]) => hex);
            
            setExtractedColors(sortedColors);
            setIsExtracting(false);
        };
        
        img.onerror = () => {
            setError('이미지를 불러올 수 없습니다.');
            setIsExtracting(false);
        };
        
        img.src = imgSrc;
    }, [rgbToHex]);

    // 추출된 색상 선택
    const selectExtractedColor = useCallback((hex) => {
        setHexInput(hex);
    }, []);

    // 이미지 초기화
    const clearImage = useCallback(() => {
        setImageUrl(null);
        setExtractedColors([]);
        setHoverColor(null);
        setHoverPosition(null);
        setImageCanvas(null);
    }, []);

    // 이미지에서 픽셀 색상 가져오기
    const getColorFromImage = useCallback((e) => {
        if (!imageCanvas) return null;
        
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 캔버스 크기에 비율 계산
        const scaleX = imageCanvas.width / rect.width;
        const scaleY = imageCanvas.height / rect.height;
        
        const canvasX = Math.floor(x * scaleX);
        const canvasY = Math.floor(y * scaleY);
        
        const ctx = imageCanvas.getContext('2d');
        const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
        
        return rgbToHex(pixel[0], pixel[1], pixel[2]);
    }, [imageCanvas, rgbToHex]);

    // 이미지 마우스 호버
    const handleImageHover = useCallback((e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 백분율 계산
        const bgX = (x / rect.width) * 100;
        const bgY = (y / rect.height) * 100;
        
        setHoverPosition({
            x: x,
            y: y,
            bgX: bgX,
            bgY: bgY,
            zoomLevel: 800 // 8배 확대
        });
        
        const color = getColorFromImage(e);
        if (color) {
            setHoverColor(color);
        }
    }, [getColorFromImage]);

    // 이미지 마우스 리브
    const handleImageLeave = useCallback(() => {
        setHoverColor(null);
        setHoverPosition(null);
    }, []);

    // 이미지 클릭
    const handleImageClick = useCallback((e) => {
        const color = getColorFromImage(e);
        if (color) {
            setHexInput(color);
        }
    }, [getColorFromImage]);

    // 이미지 로드 후 캔버스 설정
    useEffect(() => {
        if (imageUrl) {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const maxSize = 128;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                setImageCanvas(canvas);
            };
            img.src = imageUrl;
        }
    }, [imageUrl]);

    return (
        <>
            <h1 className="sr-only">이미지, 사진 색 추출 / 색상 코드 변환기 - HEX, RGB, HSL, CMYK 상호 변환</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            🎨 이미지, 사진 색 추출 / 색상 코드 변환기
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            HEX, RGB, HSL, CMYK 색상 코드를 상호 변환합니다
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden" style={{ minHeight: 'calc(100% - 80px)' }}>
                    {/* 좌측: 색상 미리보기 및 입력 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">색상 선택</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-auto">
                            {/* 색상 미리보기 */}
                            <div className="mb-6">
                                <div 
                                    className="w-full h-32 rounded-xl border-4 border-slate-700 shadow-inner"
                                    style={{ backgroundColor: hexInput }}
                                ></div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-lg font-bold text-slate-200">{getColorName(hexInput)}</span>
                                    <span className="text-sm text-slate-400">{hexInput}</span>
                                </div>
                            </div>

                            {/* 빠른 샘플 */}
                            <div className="mb-6">
                                <label className="text-sm text-slate-400 mb-2 block">빠른 선택:</label>
                                <div className="flex flex-wrap gap-2">
                                    {sampleColors.map((color, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setHexInput(color.hex)}
                                            className="w-10 h-10 rounded-lg border-2 border-slate-600 hover:border-slate-400 transition-colors shadow-md"
                                            style={{ backgroundColor: color.hex }}
                                            title={color.label}
                                        ></button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{sampleColors.map(c => c.label).join(', ')}</p>
                            </div>

                            {/* 색상 피커 */}
                            <div className="mb-6">
                                <label className="text-sm text-slate-400 mb-2 block">색상 피커:</label>
                                <input
                                    type="color"
                                    value={hexInput}
                                    onChange={(e) => setHexInput(e.target.value)}
                                    className="w-full h-12 rounded-lg cursor-pointer"
                                />
                            </div>

                            {/* 이미지에서 색상 추출 */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-slate-400">이미지에서 색상 추출:</label>
                                    <button
                                        onClick={() => {
                                            setImageUrl(logoImageUrl);
                                            extractColorsFromImage(logoImageUrl);
                                        }}
                                        className="text-xs text-brand-400 hover:text-brand-300"
                                    >
                                        🎨 로고 색상 추출
                                    </button>
                                </div>
                                <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition-colors">
                                    {imageUrl ? (
                                        <div className="space-y-3">
                                            <div className="relative inline-block cursor-crosshair">
                                                <div className="relative">
                                                    <img 
                                                        src={imageUrl} 
                                                        alt="Uploaded" 
                                                        className="max-h-32 mx-auto rounded-lg"
                                                        onClick={handleImageClick}
                                                        onMouseMove={handleImageHover}
                                                        onMouseLeave={handleImageLeave}
                                                    />
                                                    {/* 돋보기 확대 보기 */}
                                                    {hoverPosition && (
                                                        <div 
                                                            className="absolute w-24 h-24 rounded-full border-2 border-white shadow-lg overflow-hidden pointer-events-none"
                                                            style={{
                                                                left: `${hoverPosition.x + 20}px`,
                                                                top: `${hoverPosition.y - 130}px`,
                                                                backgroundImage: `url(${imageUrl})`,
                                                                backgroundPosition: `${hoverPosition.bgX}% ${hoverPosition.bgY}%`,
                                                                backgroundSize: `${hoverPosition.zoomLevel}%`,
                                                                backgroundRepeat: 'no-repeat'
                                                            }}
                                                        >
                                                            {/* 중심 십자가 */}
                                                            <div className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 bg-white/50 rounded-full"></div>
                                                            <div className="absolute top-1/2 left-1/2 w-px h-6 -mt-3 -ml-px bg-white/30"></div>
                                                            <div className="absolute top-1/2 left-1/2 h-px w-6 -mt-px -ml-3 bg-white/30"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                {hoverColor && (
                                                    <div 
                                                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 rounded text-xs text-white whitespace-nowrap"
                                                    >
                                                        {hoverColor}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={clearImage}
                                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg"
                                                >
                                                    초기화
                                                </button>
                                                <label className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded-lg cursor-pointer">
                                                    다른 이미지
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                            <p className="text-xs text-slate-500">이미지 위에서 마우스를 움직이거나 클릭하여 색상을 선택하세요</p>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <svg className="w-10 h-10 mx-auto text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-slate-400 text-sm">이미지를 업로드하세요</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                                
                                {isExtracting && (
                                    <div className="mt-2 text-center text-sm text-slate-400">
                                        색상 추출 중...
                                    </div>
                                )}
                                
                                {extractedColors.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs text-slate-400 mb-2">추출된 색상 (클릭하여 선택):</p>
                                        <div className="flex flex-wrap gap-2">
                                            {extractedColors.map((color, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => selectExtractedColor(color)}
                                                    className="w-8 h-8 rounded-lg border-2 border-slate-600 hover:border-slate-400 transition-colors shadow-sm"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                ></button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 우측: 변환 결과 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">변환 결과</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-auto">
                            <div className="space-y-4">
                                {/* HEX */}
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-300">HEX</label>
                                        <button
                                            onClick={() => copyToClipboard(hexInput)}
                                            className="text-xs text-brand-400 hover:text-brand-300"
                                        >
                                            복사
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={hexInput}
                                        onChange={(e) => setHexInput(e.target.value)}
                                        className="w-full bg-[#0d1117] text-brand-400 px-4 py-2 font-mono text-lg rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                    />
                                </div>

                                {/* RGB */}
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-300">RGB</label>
                                        <button
                                            onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                                            className="text-xs text-brand-400 hover:text-brand-300"
                                        >
                                            복사
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">R</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="255"
                                                value={rgb.r}
                                                onChange={(e) => updateFromRgb(e.target.value, rgb.g, rgb.b)}
                                                className="w-full bg-[#0d1117] text-red-400 px-3 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">G</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="255"
                                                value={rgb.g}
                                                onChange={(e) => updateFromRgb(rgb.r, e.target.value, rgb.b)}
                                                className="w-full bg-[#0d1117] text-green-400 px-3 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">B</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="255"
                                                value={rgb.b}
                                                onChange={(e) => updateFromRgb(rgb.r, rgb.g, e.target.value)}
                                                className="w-full bg-[#0d1117] text-blue-400 px-3 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center text-sm text-slate-400 font-mono">
                                        rgb({rgb.r}, {rgb.g}, {rgb.b})
                                    </div>
                                </div>

                                {/* HSL */}
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-300">HSL</label>
                                        <button
                                            onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                                            className="text-xs text-brand-400 hover:text-brand-300"
                                        >
                                            복사
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">H (색상)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="360"
                                                value={hsl.h}
                                                onChange={(e) => updateFromHsl(e.target.value, hsl.s, hsl.l)}
                                                className="w-full bg-[#0d1117] text-slate-300 px-3 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">S (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={hsl.s}
                                                onChange={(e) => updateFromHsl(hsl.h, e.target.value, hsl.l)}
                                                className="w-full bg-[#0d1117] text-slate-300 px-3 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">L (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={hsl.l}
                                                onChange={(e) => updateFromHsl(hsl.h, hsl.s, e.target.value)}
                                                className="w-full bg-[#0d1117] text-slate-300 px-3 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center text-sm text-slate-400 font-mono">
                                        hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
                                    </div>
                                </div>

                                {/* CMYK */}
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-300">CMYK</label>
                                        <button
                                            onClick={() => copyToClipboard(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`)}
                                            className="text-xs text-brand-400 hover:text-brand-300"
                                        >
                                            복사
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">C</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={cmyk.c}
                                                onChange={(e) => updateFromCmyk(e.target.value, cmyk.m, cmyk.y, cmyk.k)}
                                                className="w-full bg-[#0d1117] text-cyan-400 px-2 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">M</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={cmyk.m}
                                                onChange={(e) => updateFromCmyk(cmyk.c, e.target.value, cmyk.y, cmyk.k)}
                                                className="w-full bg-[#0d1117] text-pink-400 px-2 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Y</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={cmyk.y}
                                                onChange={(e) => updateFromCmyk(cmyk.c, cmyk.m, e.target.value, cmyk.k)}
                                                className="w-full bg-[#0d1117] text-yellow-400 px-2 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">K</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={cmyk.k}
                                                onChange={(e) => updateFromCmyk(cmyk.c, cmyk.m, cmyk.y, e.target.value)}
                                                className="w-full bg-[#0d1117] text-slate-300 px-2 py-2 font-mono text-center rounded-lg border border-slate-600 outline-none focus:border-brand-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center text-sm text-slate-400 font-mono">
                                        cmyk({cmyk.c}%, {cmyk.m}%, {cmyk.y}%, {cmyk.k}%)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ColorConverter;
