import React, { useState, useRef, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const StampSignStudio = () => {
    // === 상태 관리 ===
    const [mode, setMode] = useState('stamp'); // stamp, dateStamp, sign
    
    // 1. 도장 설정
    const [stampName, setStampName] = useState('홍길동');
    const [stampType, setStampType] = useState('square'); // square, circle, oval
    const [stampFont, setStampFont] = useState('Gungsuh'); 
    const [stampColor, setStampColor] = useState('#D32F2F'); 
    
    // 1-1. 도장 디테일 효과
    const [inkLevel, setInkLevel] = useState(0.8);
    const [bleedLevel, setBleedLevel] = useState(1);
    const [borderDamage, setBorderDamage] = useState(2);
    const [rotation, setRotation] = useState(0);
    const [autoAppendIn, setAutoAppendIn] = useState(true);
    const [inType, setInType] = useState('hanja'); // 'hangul' or 'hanja'

    // 2. 날짜 도장 설정
    const [dateText, setDateText] = useState('결 재');
    const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 10));

    // 3. 서명 설정
    const [signColor, setSignColor] = useState('#000000');
    const [signWidth, setSignWidth] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState([]);
    const [smoothing, setSmoothing] = useState(true); 

    // 캔버스 Refs
    const stampCanvasRef = useRef(null);
    const signCanvasRef = useRef(null);
    
    // === 헬퍼: 텍스트 배치 로직 ===
    const getLayoutText = (text) => {
        let chars = text.split('');
        if (text.length === 3 && autoAppendIn) {
            chars.push(inType === 'hanja' ? '印' : '인');
        }
        return chars;
    };

    // === 도장 생성 엔진 ===
    const drawStamp = useCallback(() => {
        const canvas = stampCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = 300; 
        const center = size / 2;
        
        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);

        // 회전 적용
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-center, -center);

        // 공통 스타일
        ctx.strokeStyle = stampColor;
        ctx.fillStyle = stampColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 번짐 효과
        if (bleedLevel > 0) {
            ctx.shadowColor = stampColor;
            ctx.shadowBlur = bleedLevel;
        }

        // 테두리 그리기
        ctx.lineWidth = 10;
        if (borderDamage > 0) {
            ctx.setLineDash([size * 0.5, borderDamage * 2, size * 0.2, borderDamage]); 
        } else {
            ctx.setLineDash([]);
        }

        const padding = 15;
        const radius = size / 2 - padding;

        if (stampType === 'circle') {
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(center, center, radius - 8, 0, Math.PI * 2);
            ctx.stroke();
        } else if (stampType === 'square') {
            const rectSize = size - (padding * 2);
            ctx.strokeRect(padding, padding, rectSize, rectSize);
            
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.strokeRect(padding + 8, padding + 8, rectSize - 16, rectSize - 16);
        } else if (stampType === 'oval') {
            ctx.beginPath();
            // 타원은 좌우가 좁으므로 radius-30 -> radius-40으로 더 좁혀서 안정감 확보
            ctx.ellipse(center, center, radius - 40, radius, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // === 텍스트 그리기 ===
        ctx.shadowBlur = 0;
        
        if (mode === 'dateStamp') {
            ctx.font = `bold ${size * 0.18}px ${stampFont}, sans-serif`;
            ctx.fillText(dateText, center, center - 50);
            
            ctx.beginPath();
            ctx.moveTo(padding + 20, center);
            ctx.lineTo(size - padding - 20, center);
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.font = `bold ${size * 0.15}px sans-serif`;
            ctx.fillText(dateValue, center, center + 50);

        } else {
            const chars = getLayoutText(stampName.slice(0, 4));
            const charCount = chars.length;
            
            // [수정] 모양별 폰트 크기 및 배치 간격(offsetRatio) 정밀 조정
            let fontSize;
            let offsetRatio;

            if (stampType === 'oval') {
                // 타원형: 공간이 매우 좁으므로 폰트를 줄이고 중앙으로 모음
                fontSize = size * 0.28; 
                offsetRatio = 0.18; 
            } else if (stampType === 'circle') {
                fontSize = size * 0.32;
                offsetRatio = 0.22;
            } else {
                // 사각형: 공간이 넓으므로 큼직하게
                fontSize = size * 0.38;
                offsetRatio = 0.25;
            }

            // 글자 수가 적으면 폰트를 키움
            if (charCount <= 2) fontSize *= 1.2;
            
            ctx.font = `bold ${fontSize}px ${stampFont}, serif`;

            const q = size * offsetRatio; 

            if (charCount === 1) {
                ctx.fillText(chars[0], center, center);
            } else if (charCount === 2) {
                // 세로 2글자
                ctx.fillText(chars[0], center, center - q * 1.2);
                ctx.fillText(chars[1], center, center + q * 1.2);
            } else if (charCount >= 3) {
                // 田자 배치
                ctx.fillText(chars[0], center - q, center - q); // 좌상
                ctx.fillText(chars[1], center + q, center - q); // 우상
                ctx.fillText(chars[2], center - q, center + q); // 좌하
                if (chars[3]) {
                    ctx.fillText(chars[3], center + q, center + q); // 우하
                }
            }
        }

        ctx.restore();

        // === 텍스처 효과 ===
        if (inkLevel < 1) {
            ctx.globalCompositeOperation = 'destination-out';
            const noiseCount = (1 - inkLevel) * 30000;
            for (let i = 0; i < noiseCount; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const r = Math.random() * 1.5;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        }

    }, [stampName, stampType, stampFont, stampColor, inkLevel, bleedLevel, borderDamage, rotation, autoAppendIn, mode, dateText, dateValue]);

    useEffect(() => {
        if (mode !== 'sign') drawStamp();
    }, [drawStamp, mode]);

    // === 서명 엔진 (좌표 오차 해결) ===
    const getPoint = (e) => {
        const canvas = signCanvasRef.current;
        if (!canvas) return { x: 0, y: 0, time: 0 };

        const rect = canvas.getBoundingClientRect();
        
        // [핵심 수정] 캔버스 해상도와 화면 크기 비율 계산 (Scale Factor)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (!clientX || !clientY) return { x: 0, y: 0, time: 0 };

        return { 
            x: (clientX - rect.left) * scaleX, 
            y: (clientY - rect.top) * scaleY, 
            time: Date.now() 
        };
    };

    const startSign = (e) => {
        e.preventDefault(); // 터치 스크롤 방지
        setIsDrawing(true);
        const point = getPoint(e);
        setPoints([point]);
    };

    const moveSign = (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const point = getPoint(e);
        const lastPoint = points[points.length - 1];
        
        const dist = Math.sqrt(Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2));
        const time = point.time - lastPoint.time;
        const speed = dist / (time || 1); 
        
        const targetWidth = Math.max(signWidth * 0.2, Math.min(signWidth * 2.5, signWidth * (1.5 - speed * 0.15)));
        
        const ctx = signCanvasRef.current.getContext('2d');
        ctx.beginPath();
        
        if (smoothing && points.length > 2) {
            const p0 = points[points.length - 2];
            const p1 = points[points.length - 1];
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;
            ctx.moveTo(midX, midY);
            ctx.quadraticCurveTo(p1.x, p1.y, point.x, point.y);
        } else {
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(point.x, point.y);
        }

        ctx.strokeStyle = signColor;
        ctx.lineWidth = targetWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        setPoints([...points, point]);
    };

    const endSign = () => setIsDrawing(false);
    
    const clearSign = () => {
        const canvas = signCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPoints([]);
    };

    const handleDownload = (ref, name) => {
        if (!ref.current) return;
        ref.current.toBlob(blob => {
            saveAs(blob, `${name}.png`);
        });
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Stamp & Sign Master</h2>
                        <p className="text-slate-400 text-sm">전자 도장 · 결재인 · 디지털 서명</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    {[
                        { id: 'stamp', label: '인감 도장' },
                        { id: 'dateStamp', label: '날짜 도장' },
                        { id: 'sign', label: '자필 서명' }
                    ].map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                mode === m.id ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 메인 그리드 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 설정 패널 */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar">
                        
                        {(mode === 'stamp' || mode === 'dateStamp') && (
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <Icon path="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    디자인 설정
                                </h3>

                                {mode === 'stamp' ? (
                                    <div>
                                        <label className="text-sm text-slate-300 mb-1 block">이름 (3글자 추천)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={stampName} 
                                                onChange={(e) => setStampName(e.target.value)} 
                                                maxLength={4}
                                                className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-red-500 outline-none"
                                            />
                                            <button 
                                                onClick={() => setAutoAppendIn(!autoAppendIn)}
                                                className={`px-3 py-1 rounded text-xs border ${autoAppendIn ? 'bg-red-500/20 border-red-500 text-red-300' : 'border-slate-600 text-slate-500'}`}
                                            >
                                                '인' 추가
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-sm text-slate-300 mb-1 block">상단 문구 / 날짜</label>
                                        <input 
                                            type="text" 
                                            value={dateText} 
                                            onChange={(e) => setDateText(e.target.value)} 
                                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-2"
                                        />
                                        <input 
                                            type="date" 
                                            value={dateValue} 
                                            onChange={(e) => setDateValue(e.target.value)} 
                                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                        />
                                    </div>
                                )}

                                {mode === 'stamp' && (
                                    <div>
                                        <label className="text-sm text-slate-300 mb-2 block">인 종류 선택</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'hanja', label: '印 (한자)', color: '#D32F2F' },
                                                { value: 'hangul', label: '인 (한글)', color: '#1976D2' }
                                            ].map(option => (
                                                <button 
                                                    key={option.value}
                                                    onClick={() => setInType(option.value)}
                                                    className={`p-2 rounded border text-xs transition-colors ${
                                                        inType === option.value 
                                                            ? `border-${option.value === 'hanja' ? 'red' : 'blue'}-500 bg-${option.value === 'hanja' ? 'red' : 'blue'}-500/20 text-white font-bold` 
                                                            : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 italic">
                                            * 한자/한글 변환 시 '인' 추가 버튼을 한번 눌러주세요
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">도장 모양</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['square', 'circle'].map(t => (
                                            <button 
                                                key={t}
                                                onClick={() => setStampType(t)}
                                                className={`p-2 rounded border text-xs transition-colors ${stampType === t ? 'border-red-500 bg-red-500/20 text-white font-bold' : 'border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                                            >
                                                {t === 'square' ? '사각형' : '원형'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-500">디테일 효과 (Realism)</h4>
                                    
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-slate-400">
                                            <span>선명도 (Ink)</span>
                                            <span>{Math.round(inkLevel * 100)}%</span>
                                        </div>
                                        <input type="range" min="0.5" max="1" step="0.05" value={inkLevel} onChange={(e) => setInkLevel(Number(e.target.value))} className="w-full accent-red-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-slate-400">
                                            <span>잉크 번짐 (Bleed)</span>
                                            <span>{bleedLevel}px</span>
                                        </div>
                                        <input type="range" min="0" max="5" step="0.5" value={bleedLevel} onChange={(e) => setBleedLevel(Number(e.target.value))} className="w-full accent-red-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-slate-400">
                                            <span>기울기 (Rotation)</span>
                                            <span>{rotation}°</span>
                                        </div>
                                        <input type="range" min="-15" max="15" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-red-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                    </div>

                                </div>
                            </div>
                        )}

                        {mode === 'sign' && (
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Signature Settings</h3>
                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">펜 색상</label>
                                    <div className="flex gap-3">
                                        {['#000000', '#0000FF', '#FF0000', '#10B981'].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setSignColor(c)}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform ${signColor === c ? 'border-white scale-110 ring-2 ring-white/50' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>펜 두께</span>
                                        <span>{signWidth}px</span>
                                    </div>
                                    <input type="range" min="1" max="15" value={signWidth} onChange={(e) => setSignWidth(Number(e.target.value))} className="w-full accent-white h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-700/50 p-3 rounded-lg">
                                    <input type="checkbox" checked={smoothing} onChange={(e) => setSmoothing(e.target.checked)} className="accent-blue-500 w-4 h-4" />
                                    <span>손떨림 보정 (Smoothing)</span>
                                </label>
                                <button 
                                    onClick={clearSign} 
                                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    다시 쓰기
                                </button>
                            </div>
                        )}

                        <div className="mt-auto pt-6">
                            <button 
                                onClick={() => handleDownload(mode === 'sign' ? signCanvasRef : stampCanvasRef, mode === 'sign' ? 'signature' : 'stamp')}
                                className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                            >
                                <span>투명 PNG 저장</span>
                                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </button>
                            <p className="text-[10px] text-center text-slate-500 mt-2">
                                * 배경이 투명한 고해상도 이미지로 저장됩니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 우측: 캔버스 영역 */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-8 flex flex-col h-full shadow-inner border border-slate-700/50 items-center justify-center relative overflow-hidden">
                        
                        {/* 문서 배경 (격자) */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" 
                             style={{ 
                                 backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                                 backgroundSize: '20px 20px' 
                             }}>
                        </div>

                        {/* 도장 모드 캔버스 */}
                        {mode !== 'sign' && (
                            <div className="relative group animate-in zoom-in duration-300">
                                {/* 종이 질감 효과 */}
                                <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full opacity-20 pointer-events-none"></div>
                                <canvas 
                                    ref={stampCanvasRef} 
                                    className="relative z-10 cursor-pointer transition-transform hover:scale-105 shadow-2xl rounded-lg"
                                    title="클릭하여 저장"
                                    onClick={() => handleDownload(stampCanvasRef, 'stamp')}
                                />
                            </div>
                        )}

                        {/* 서명 모드 캔버스 */}
                        {mode === 'sign' && (
                            <div className="w-full h-full max-w-2xl bg-white rounded-xl shadow-2xl relative cursor-crosshair overflow-hidden border border-slate-300 animate-in fade-in duration-300">
                                <div className="absolute top-4 left-4 text-slate-400 text-sm font-bold pointer-events-none select-none flex items-center gap-2">
                                    <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    이곳에 서명하세요
                                </div>
                                <canvas 
                                    ref={signCanvasRef}
                                    width={800}
                                    height={500}
                                    className="w-full h-full touch-none" // touch-none으로 터치 스크롤 방지
                                    onMouseDown={startSign}
                                    onMouseMove={moveSign}
                                    onMouseUp={endSign}
                                    onMouseLeave={endSign}
                                    onTouchStart={startSign}
                                    onTouchMove={moveSign}
                                    onTouchEnd={endSign}
                                />
                            </div>
                        )}
                        
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StampSignStudio;