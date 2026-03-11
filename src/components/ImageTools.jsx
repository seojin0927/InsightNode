import React, { useState, useRef, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ImageMasterStudio = () => {
    // === 상태 관리 ===
    const [activeTab, setActiveTab] = useState('convert'); // convert, filter, watermark, exif
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [originalUrl, setOriginalUrl] = useState('');
    
    // 1. 변환 및 압축 설정
    const [format, setFormat] = useState('webp');
    const [quality, setQuality] = useState(80);
    const [resizePercent, setResizePercent] = useState(100);
    
    // 2. 필터 설정
    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        grayscale: 0,
        blur: 0
    });

    // 3. 워터마크 설정
    const [watermarkText, setWatermarkText] = useState('');
    const [wmColor, setWmColor] = useState('#ffffff');
    const [wmOpacity, setWmOpacity] = useState(0.5);
    const [wmPosition, setWmPosition] = useState('bottom-right'); // center, top-left, etc.

    // 4. EXIF 데이터
    const [exifData, setExifData] = useState(null);

    const canvasRef = useRef(null);

    // === 파일 핸들링 ===
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setOriginalUrl(url);
            setPreviewUrl(url);
            // EXIF 추출 시뮬레이션
            setExifData({
                Name: file.name,
                Size: `${(file.size / 1024).toFixed(2)} KB`,
                Type: file.type,
                Dimensions: "Loading...",
                "Last Modified": new Date(file.lastModified).toLocaleString()
            });
        }
    };

    // === 이미지 처리 엔진 (Effect 적용) ===
    const applyEffects = useCallback(() => {
        if (!originalUrl || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // 1. 리사이징
            const scale = resizePercent / 100;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            // 2. 필터 적용
            ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)`;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none'; // 필터 초기화 (워터마크엔 적용 안 함)

            // 3. 워터마크 적용
            if (watermarkText) {
                const fontSize = canvas.width * 0.05;
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.fillStyle = wmColor;
                ctx.globalAlpha = wmOpacity;
                
                const textMetrics = ctx.measureText(watermarkText);
                let x, y;
                const padding = canvas.width * 0.02;

                switch(wmPosition) {
                    case 'center':
                        x = (canvas.width - textMetrics.width) / 2;
                        y = canvas.height / 2;
                        break;
                    case 'top-left':
                        x = padding;
                        y = padding + fontSize;
                        break;
                    case 'bottom-right':
                    default:
                        x = canvas.width - textMetrics.width - padding;
                        y = canvas.height - padding;
                        break;
                }
                
                ctx.fillText(watermarkText, x, y);
                ctx.globalAlpha = 1.0;
            }

            // EXIF 사이즈 정보 업데이트
            setExifData(prev => ({ ...prev, Dimensions: `${img.width} x ${img.height}` }));
        };
        img.src = originalUrl;

    }, [originalUrl, resizePercent, filters, watermarkText, wmColor, wmOpacity, wmPosition]);

    // 설정 변경 시마다 미리보기 갱신
    useEffect(() => {
        applyEffects();
    }, [applyEffects]);

    // === 메타데이터 삭제 (새 캔버스로 EXIF 제거) ===
    const handleRemoveMetadata = () => {
        if (!canvasRef.current || !imageFile) return;
        // 이미 캔버스에 렌더링된 상태 = EXIF 없는 픽셀만 남아있음
        canvasRef.current.toBlob((blob) => {
            saveAs(blob, `no_metadata_${imageFile.name.replace(/\.[^.]+$/, '')}.png`);
        }, 'image/png');
        setExifData(prev => prev ? Object.fromEntries(
            Object.entries(prev).filter(([k]) => ['Name', 'Size', 'Type', 'Dimensions'].includes(k))
        ) : prev);
        alert('GPS 등 개인정보 메타데이터가 제거된 PNG로 저장됩니다.');
    };

    // === 다운로드 ===
    const handleDownload = () => {
        if (!canvasRef.current) return;
        
        // 포맷에 따른 MIME 타입 설정
        let mimeType = 'image/jpeg';
        if (format === 'png') mimeType = 'image/png';
        if (format === 'webp') mimeType = 'image/webp';

        canvasRef.current.toBlob((blob) => {
            saveAs(blob, `processed_image.${format}`);
        }, mimeType, Number(quality) / 100);
    };

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                        <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">Image Master Studio</h2>
                        <p className="text-xs text-slate-500">변환 · 필터 · 워터마크 · 최적화 올인원</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    {[
                        { id: 'convert', label: '변환/압축' },
                        { id: 'filter', label: '필터 보정' },
                        { id: 'watermark', label: '워터마크' },
                        { id: 'exif', label: '정보/EXIF' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                activeTab === t.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 메인 그리드 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 컨트롤 패널 */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar">
                        
                        {/* 파일 업로드 (공통) */}
                        <div className="mb-6">
                            <label className="flex items-center gap-3 w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 cursor-pointer transition-colors group">
                                <div className="p-2 bg-slate-600 rounded-lg group-hover:bg-indigo-500 transition-colors">
                                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-200">이미지 열기</div>
                                    <div className="text-xs text-slate-500">{imageFile ? imageFile.name : 'JPG, PNG, WebP 지원'}</div>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </div>

                        {/* 탭별 컨트롤 */}
                        {activeTab === 'convert' && (
                            <div className="space-y-6 animate-in slide-in-from-left duration-300">
                                <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Format & Quality</h3>
                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">변환 포맷</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['webp', 'jpg', 'png'].map(f => (
                                            <button key={f} onClick={()=>setFormat(f)} className={`p-2 rounded border uppercase text-xs font-bold ${format === f ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-slate-600 text-slate-400'}`}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>압축 품질</span>
                                        <span>{quality}%</span>
                                    </div>
                                    <input type="range" value={quality} onChange={(e)=>setQuality(e.target.value)} className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>크기 조절 (Resize)</span>
                                        <span>{resizePercent}%</span>
                                    </div>
                                    <input type="range" min="10" max="200" value={resizePercent} onChange={(e)=>setResizePercent(e.target.value)} className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'filter' && (
                            <div className="space-y-6 animate-in slide-in-from-left duration-300">
                                <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Color Correction</h3>
                                {[
                                    { id: 'brightness', label: '밝기', min: 0, max: 200, unit: '%' },
                                    { id: 'contrast', label: '대비', min: 0, max: 200, unit: '%' },
                                    { id: 'grayscale', label: '흑백', min: 0, max: 100, unit: '%' },
                                    { id: 'blur', label: '블러', min: 0, max: 20, unit: 'px' }
                                ].map(f => (
                                    <div key={f.id}>
                                        <div className="flex justify-between text-xs mb-1 text-slate-400">
                                            <span>{f.label}</span>
                                            <span>{filters[f.id]}{f.unit}</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min={f.min} max={f.max} 
                                            value={filters[f.id]} 
                                            onChange={(e)=>setFilters({...filters, [f.id]: e.target.value})} 
                                            className="w-full accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" 
                                        />
                                    </div>
                                ))}
                                <button onClick={()=>setFilters({brightness: 100, contrast: 100, grayscale: 0, blur: 0})} className="w-full py-2 text-xs border border-slate-600 rounded text-slate-400 hover:bg-slate-700">필터 초기화</button>
                            </div>
                        )}

                        {activeTab === 'watermark' && (
                            <div className="space-y-6 animate-in slide-in-from-left duration-300">
                                <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Text Watermark</h3>
                                <input 
                                    type="text" 
                                    placeholder="워터마크 텍스트 입력..." 
                                    value={watermarkText} 
                                    onChange={(e)=>setWatermarkText(e.target.value)} 
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="color" value={wmColor} onChange={(e)=>setWmColor(e.target.value)} className="w-full h-8 rounded bg-transparent cursor-pointer" />
                                    <select value={wmPosition} onChange={(e)=>setWmPosition(e.target.value)} className="bg-slate-900 border border-slate-600 rounded text-xs text-white">
                                        <option value="bottom-right">우측 하단</option>
                                        <option value="top-left">좌측 상단</option>
                                        <option value="center">중앙</option>
                                    </select>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>투명도</span>
                                        <span>{Math.round(wmOpacity * 100)}%</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.1" value={wmOpacity} onChange={(e)=>setWmOpacity(e.target.value)} className="w-full accent-pink-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'exif' && (
                            <div className="space-y-4 animate-in slide-in-from-left duration-300">
                                <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Image Metadata</h3>
                                {exifData ? (
                                    <div className="bg-slate-900 rounded-lg p-3 space-y-2">
                                        {Object.entries(exifData).map(([k, v]) => (
                                            <div key={k} className="flex justify-between text-xs border-b border-white/[0.05] pb-1 last:border-0">
                                                <span className="text-slate-500">{k}</span>
                                                <span className="text-slate-300 text-right truncate w-24">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 text-center py-4">이미지를 불러오면 정보가 표시됩니다.</div>
                                )}
                                <button 
                                    onClick={handleRemoveMetadata}
                                    disabled={!imageFile}
                                    className="w-full py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    개인정보(GPS) 포함 메타데이터 삭제
                                </button>
                            </div>
                        )}

                        <div className="mt-auto pt-6">
                            <button 
                                onClick={handleDownload}
                                disabled={!imageFile}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                처리된 이미지 다운로드
                            </button>
                        </div>
                    </div>
                </div>

                {/* 우측: 캔버스 영역 */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-8 flex flex-col h-full shadow-inner border border-white/[0.07] items-center justify-center relative overflow-hidden">
                        
                        {/* 배경 격자 */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" 
                             style={{ 
                                 backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', 
                                 backgroundSize: '20px 20px',
                                 backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' 
                             }}>
                        </div>

                        {imageFile ? (
                            <div className="relative z-10 max-w-full max-h-full flex items-center justify-center">
                                <canvas ref={canvasRef} className="max-w-full max-h-[700px] object-contain shadow-2xl rounded-lg border border-slate-600" />
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 z-10">
                                <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                    <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </div>
                                <p className="text-lg font-medium">이미지 미리보기</p>
                                <p className="text-sm opacity-70">좌측 메뉴에서 파일을 열어주세요</p>
                            </div>
                        )}
                        
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ImageMasterStudio;