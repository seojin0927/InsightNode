import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip'; // jszip 라이브러리 필요 (npm install jszip)
import { saveAs } from 'file-saver'; // file-saver 라이브러리 필요 (npm install file-saver)

// 아이콘 컴포넌트 대체 (없을 경우를 대비해 내부 정의)
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ImageStudio = () => {
    // === 상태 관리 ===
    const [files, setFiles] = useState([]); // 업로드된 파일 목록
    const [selectedFileIndex, setSelectedFileIndex] = useState(0); // 현재 선택된 파일 인덱스
    const [previewUrl, setPreviewUrl] = useState(null); // 원본 미리보기 URL
    const [processedUrl, setProcessedUrl] = useState(null); // 처리된 이미지 URL
    
    // 처리 옵션
    const [options, setOptions] = useState({
        quality: 80,
        format: 'webp', // webp, jpeg, png
        width: 100, // %
        resizeMode: 'percent', // percent, fixed
        fixedWidth: 0,
        fixedHeight: 0,
        rotate: 0,
        flipH: false,
        flipV: false,
        grayscale: false,
        removeExif: true,
        watermark: ''
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState({ original: 0, compressed: 0, saved: 0 });
    
    // Canvas Ref
    const canvasRef = useRef(null);

    // === 파일 핸들링 ===
    const handleFileSelect = useCallback((e) => {
        const selected = Array.from(e.target.files);
        if (selected.length === 0) return;

        // 기존 파일에 추가
        const newFiles = selected.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            type: file.type
        }));

        setFiles(prev => [...prev, ...newFiles]);
        if (files.length === 0) {
            setSelectedFileIndex(0); // 첫 파일 선택
        }
    }, [files]);

    // 현재 선택된 파일 변경 시 미리보기 업데이트
    useEffect(() => {
        if (files.length > 0 && files[selectedFileIndex]) {
            setPreviewUrl(files[selectedFileIndex].preview);
            // 초기 고정 크기 설정 (원본 크기)
            const img = new Image();
            img.onload = () => {
                setOptions(prev => ({
                    ...prev,
                    fixedWidth: img.width,
                    fixedHeight: img.height
                }));
            };
            img.src = files[selectedFileIndex].preview;
        } else {
            setPreviewUrl(null);
            setProcessedUrl(null);
        }
    }, [files, selectedFileIndex]);

    // === 이미지 처리 엔진 (Core Logic) ===
    const processImage = useCallback(async () => {
        if (!files[selectedFileIndex] || !canvasRef.current) return;

        setIsProcessing(true);
        const file = files[selectedFileIndex];
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = file.preview;

        img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // 1. 크기 계산 (Resize)
            let w = img.width;
            let h = img.height;

            if (options.resizeMode === 'percent') {
                w = w * (options.width / 100);
                h = h * (options.width / 100);
            } else {
                w = options.fixedWidth || w;
                h = options.fixedHeight || h;
            }

            // 회전 시 캔버스 크기 조정
            if (options.rotate % 180 !== 0) {
                canvas.width = h;
                canvas.height = w;
            } else {
                canvas.width = w;
                canvas.height = h;
            }

            // 2. 변환 적용 (Rotate, Flip)
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((options.rotate * Math.PI) / 180);
            ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);
            if (options.rotate % 180 !== 0) {
                 ctx.drawImage(img, -w / 2, -h / 2, w, h);
            } else {
                 ctx.drawImage(img, -w / 2, -h / 2, w, h);
            }
            ctx.restore();

            // 3. 필터 적용 (Grayscale)
            if (options.grayscale) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg; // R
                    data[i + 1] = avg; // G
                    data[i + 2] = avg; // B
                }
                ctx.putImageData(imageData, 0, 0);
            }

            // 4. 워터마크
            if (options.watermark) {
                ctx.font = `${w * 0.05}px Arial`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(options.watermark, canvas.width - 20, canvas.height - 20);
            }

            // 5. 내보내기 (Compress & Format)
            const mimeType = `image/${options.format}`;
            const dataUrl = canvas.toDataURL(mimeType, options.quality / 100);
            
            setProcessedUrl(dataUrl);
            
            // 용량 계산
            const head = 'data:' + mimeType + ';base64,';
            const size = Math.round((dataUrl.length - head.length) * 3 / 4);
            setStats({
                original: file.size,
                compressed: size,
                saved: Math.max(0, file.size - size)
            });
            
            setIsProcessing(false);
        };
    }, [files, selectedFileIndex, options]);

    // 옵션 변경 시 자동 처리 (Debounce 적용 가능)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (files.length > 0) processImage();
        }, 500);
        return () => clearTimeout(timer);
    }, [processImage, options]);

    // === 다운로드 로직 ===
    const handleDownload = () => {
        if (!processedUrl) return;
        saveAs(processedUrl, `processed_${files[selectedFileIndex].name.split('.')[0]}.${options.format}`);
    };

    // 전체 다운로드 (ZIP)
    const handleDownloadAll = async () => {
        if (files.length === 0) return;
        const zip = new JSZip();
        
        // 현재 옵션으로 모든 파일 처리 (순차 처리)
        setIsProcessing(true);
        
        // 주의: 실제 프로덕션에서는 Web Worker 등을 사용하는 것이 좋음
        // 여기서는 간단히 구현
        for (let i = 0; i < files.length; i++) {
            // ... (각 파일 처리 로직 반복 - 여기서는 생략하고 현재 선택된 파일만 예시)
            // 실제 구현 시 processImage 로직을 분리하여 재사용해야 함
        }
        
        alert('전체 다운로드는 현재 데모 버전에서 지원하지 않습니다. (로직 추가 필요)');
        setIsProcessing(false);
    };

    // 파일 삭제
    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        if (index === selectedFileIndex) setSelectedFileIndex(0);
        else if (index < selectedFileIndex) setSelectedFileIndex(selectedFileIndex - 1);
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            <canvas ref={canvasRef} className="hidden" />
            
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Pro Image Studio</h2>
                        <p className="text-slate-400 text-sm">압축, 변환, 편집, 워터마크를 한 번에</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600 flex items-center gap-2">
                        <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        이미지 추가
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                    <button 
                        onClick={handleDownloadAll}
                        disabled={files.length === 0}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600 disabled:opacity-50"
                    >
                        전체 다운로드 (ZIP)
                    </button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 (Grid Layout) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 파일 목록 및 미리보기 (Col 3) */}
                <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
                    <div className="bg-slate-800 rounded-xl p-4 flex flex-col h-full shadow-inner border border-slate-700/50">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex justify-between">
                            <span>파일 목록 ({files.length})</span>
                            <button onClick={()=>setFiles([])} className="text-xs text-rose-400 hover:underline">모두 삭제</button>
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {files.length > 0 ? files.map((file, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedFileIndex(idx)}
                                    className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                        selectedFileIndex === idx ? 'bg-pink-600/20 border border-pink-500/50' : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                                    }`}
                                >
                                    <img src={file.preview} alt="th" className="w-10 h-10 object-cover rounded bg-slate-900" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-slate-200 truncate">{file.name}</div>
                                        <div className="text-[10px] text-slate-400">{(file.size/1024).toFixed(1)} KB</div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400"
                                    >
                                        <Icon path="M6 18L18 6M6 6l12 12" />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center text-slate-500 py-10 text-xs">
                                    이미지를 추가하세요
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 중앙: 작업 공간 (미리보기) (Col 6) */}
                <div className="lg:col-span-6 flex flex-col min-h-0">
                     <div className="bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 flex flex-col h-full relative overflow-hidden group">
                        {previewUrl ? (
                            <div className="flex-1 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-slate-800">
                                {/* 비교 슬라이더 구현 가능 (여기선 결과물만 표시) */}
                                <img 
                                    src={processedUrl || previewUrl} 
                                    alt="Preview" 
                                    className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
                                    style={{ 
                                        filter: isProcessing ? 'blur(2px)' : 'none',
                                        transform: `scale(${isProcessing ? 0.98 : 1})`
                                    }} 
                                />
                                {isProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                                        <div className="text-white font-bold animate-pulse">처리 중...</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                <p className="mt-2 text-sm">이미지를 선택하세요</p>
                            </div>
                        )}
                        
                        {/* 하단 정보 바 */}
                        {processedUrl && (
                            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg flex justify-between items-center shadow-lg text-xs">
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-slate-500">원본</div>
                                        <div className="text-slate-200 font-bold">{(stats.original/1024).toFixed(1)} KB</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500">결과</div>
                                        <div className="text-pink-400 font-bold">{(stats.compressed/1024).toFixed(1)} KB</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500">절감</div>
                                        <div className="text-green-400 font-bold">
                                            {((stats.saved/stats.original)*100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleDownload}
                                    className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-transform active:scale-95"
                                >
                                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    저장
                                </button>
                            </div>
                        )}
                     </div>
                </div>

                {/* 우측: 도구 패널 (Col 3) */}
                <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar space-y-6">
                        
                        {/* 1. 포맷 & 품질 */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Format & Quality</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {['webp', 'jpeg', 'png'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setOptions({...options, format: f})}
                                        className={`py-2 rounded text-xs font-bold uppercase border ${
                                            options.format === f ? 'bg-pink-600 border-pink-600 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-slate-300 mb-1">
                                    <span>Quality</span>
                                    <span>{options.quality}%</span>
                                </div>
                                <input 
                                    type="range" min="10" max="100" 
                                    value={options.quality}
                                    onChange={(e) => setOptions({...options, quality: parseInt(e.target.value)})}
                                    className="w-full accent-pink-500"
                                />
                            </div>
                        </div>

                        {/* 2. 크기 조절 (Resize) */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                                Resize
                                <button 
                                    onClick={() => setOptions({...options, resizeMode: options.resizeMode === 'percent' ? 'fixed' : 'percent'})}
                                    className="text-[10px] text-pink-400"
                                >
                                    {options.resizeMode === 'percent' ? 'Switch to Fixed' : 'Switch to %'}
                                </button>
                            </h4>
                            {options.resizeMode === 'percent' ? (
                                <div>
                                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                                        <span>Scale</span>
                                        <span>{options.width}%</span>
                                    </div>
                                    <input 
                                        type="range" min="10" max="100" step="10"
                                        value={options.width}
                                        onChange={(e) => setOptions({...options, width: parseInt(e.target.value)})}
                                        className="w-full accent-pink-500"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-slate-500">Width (px)</label>
                                        <input 
                                            type="number" value={options.fixedWidth}
                                            onChange={(e) => setOptions({...options, fixedWidth: parseInt(e.target.value)})}
                                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500">Height (px)</label>
                                        <input 
                                            type="number" value={options.fixedHeight}
                                            onChange={(e) => setOptions({...options, fixedHeight: parseInt(e.target.value)})}
                                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. 편집 (Edit) */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Edit</h4>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => setOptions({...options, rotate: options.rotate - 90})} className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-slate-300" title="Rotate Left">↺</button>
                                <button onClick={() => setOptions({...options, rotate: options.rotate + 90})} className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-slate-300" title="Rotate Right">↻</button>
                                <button onClick={() => setOptions({...options, flipH: !options.flipH})} className={`p-2 rounded hover:bg-slate-600 ${options.flipH ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300'}`} title="Flip Horizontal">↔</button>
                                <button onClick={() => setOptions({...options, flipV: !options.flipV})} className={`p-2 rounded hover:bg-slate-600 ${options.flipV ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300'}`} title="Flip Vertical">↕</button>
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={options.grayscale} 
                                    onChange={(e) => setOptions({...options, grayscale: e.target.checked})}
                                    className="accent-pink-500" 
                                />
                                흑백 모드 (Grayscale)
                            </label>
                        </div>

                        {/* 4. 워터마크 & 기타 */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Extras</h4>
                            <input 
                                type="text" 
                                placeholder="워터마크 텍스트 입력..."
                                value={options.watermark}
                                onChange={(e) => setOptions({...options, watermark: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white placeholder-slate-500 focus:border-pink-500 outline-none"
                            />
                            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={options.removeExif} 
                                    onChange={(e) => setOptions({...options, removeExif: e.target.checked})}
                                    className="accent-pink-500" 
                                />
                                메타데이터(EXIF) 제거 (보안)
                            </label>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ImageStudio;