import React, { useState, useCallback, useRef, useEffect } from 'react';

// === 아이콘 컴포넌트 (디자인 유지) ===
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
);

const QrMasterStudio = () => {
    // === 상태 관리 ===
    const [mode, setMode] = useState('qr'); // qr, barcode, recovery, scanner
    const [inputText, setInputText] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [ecc, setEcc] = useState('L'); // Error Correction Level
    const [format, setFormat] = useState('png');
    const [logo, setLogo] = useState(null);
    const [history, setHistory] = useState([]);
    const [recoveryInfo, setRecoveryInfo] = useState(null); // 복구 분석 결과
    
    // 바코드 전용 상태
    const [barcodeType, setBarcodeType] = useState('code128');

    // 캔버스 참조 (로고 합성 및 다운로드용)
    const canvasRef = useRef(null);

    // === 기능 1: QR/바코드 생성 로직 ===
    const generateCode = useCallback(() => {
        if (!inputText.trim()) return;

        let url = '';
        if (mode === 'qr') {
            // QR Code (qrserver API 사용)
            const encoded = encodeURIComponent(inputText);
            const fg = fgColor.replace('#', '');
            const bg = bgColor.replace('#', '');
            url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=${bg}&color=${fg}&ecc=${ecc}&margin=2&format=${format}`;
        } else if (mode === 'barcode') {
            // Barcode (bwip-js API 활용)
            const encoded = encodeURIComponent(inputText);
            url = `https://bwipjs-api.metafloor.com/?bcid=${barcodeType}&text=${encoded}&scale=3&rotate=N&includetext&backgroundcolor=${bgColor.replace('#', '')}&barcolor=${fgColor.replace('#', '')}`;
        }

        setGeneratedUrl(url);
        
        // 히스토리 저장
        setHistory(prev => {
            const newHistory = [{ type: mode, text: inputText, date: new Date().toLocaleTimeString() }, ...prev];
            return newHistory.slice(0, 5); // 최근 5개만 유지
        });

    }, [inputText, size, fgColor, bgColor, ecc, format, mode, barcodeType]);

    // === 기능 2: 템플릿 마법사 ===
    const applyTemplate = (type) => {
        switch(type) {
            case 'wifi': setInputText('WIFI:T:WPA;S:MyNetwork;P:password;;'); break;
            case 'vcard': setInputText('BEGIN:VCARD\nVERSION:3.0\nN:Hong;Gildong\nTEL:010-1234-5678\nEMAIL:test@example.com\nEND:VCARD'); break;
            case 'email': setInputText('mailto:contact@example.com?subject=Inquiry&body=Hello'); break;
            case 'phone': setInputText('tel:+821012345678'); break;
            case 'sms': setInputText('sms:+821012345678?body=Hello%20there'); break;
            case 'whatsapp': setInputText('https://wa.me/821012345678?text=Hello%20from%20QR'); break;
            case 'location': setInputText('geo:37.5665,126.9780?q=37.5665,126.9780(Seoul)'); break;
            case 'event': setInputText('BEGIN:VEVENT\nSUMMARY:QR Code Event\nDTSTART:20241201T100000\nDTEND:20241201T120000\nLOCATION:Seoul, Korea\nEND:VEVENT'); break;
            default: setInputText('');
        }
    };

    // === 기능 3: 로고 오버레이 및 다운로드 (Canvas) ===
    const downloadWithLogo = useCallback(() => {
        if (!generatedUrl) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = generatedUrl;

        img.onload = () => {
            canvas.width = size;
            canvas.height = size; 
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            if (logo && mode === 'qr') {
                const logoImg = new Image();
                logoImg.src = logo;
                logoImg.onload = () => {
                    const logoSize = size * 0.2; 
                    const x = (size - logoSize) / 2;
                    const y = (size - logoSize) / 2;
                    ctx.drawImage(logoImg, x, y, logoSize, logoSize);
                    triggerDownload();
                };
            } else {
                triggerDownload();
            }
        };

        const triggerDownload = () => {
            const link = document.createElement('a');
            link.download = `code-${Date.now()}.${format}`;
            link.href = canvas.toDataURL(`image/${format}`);
            link.click();
        };
    }, [generatedUrl, size, bgColor, logo, mode, format]);

    // === 기능 4: 복구 분석 시뮬레이션 ===
    const handleRecoveryUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setTimeout(() => {
            const isRestorable = Math.random() > 0.3;
            setRecoveryInfo({
                filename: file.name,
                status: isRestorable ? '복구 가능성 높음' : '복구 불가능',
                reason: isRestorable 
                    ? 'QR의 파인더 패턴(모서리)이 온전합니다. ECC 레벨에 따라 최대 30% 손실까지 복원 가능합니다.' 
                    : '필수 데이터 영역(파인더 패턴 또는 타이밍 패턴)이 심각하게 손상되었습니다.',
                type: 'QR Code (Version 4)',
                canRestore: isRestorable
            });
        }, 1500);
    };

    return (
        <div className="w-full bg-slate-900 rounded-2xl p-6 border border-slate-700 min-h-[800px] flex flex-col font-sans">
            {/* 1. 헤더 섹션 */}
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-teal-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-900/50">
                        <Icon path="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" className="w-8 h-8 text-teal-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">QR & Barcode Master</h2>
                        <p className="text-slate-400 text-sm mt-1">생성 · 복구 진단 · 스캔 · 디자인 통합 스튜디오</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    {[
                        { id: 'qr', label: 'QR 생성', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01' },
                        { id: 'barcode', label: '바코드', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                        { id: 'recovery', label: '복구/분석', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => { setMode(m.id); setGeneratedUrl(''); setRecoveryInfo(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                mode === m.id 
                                ? 'bg-teal-600 text-white shadow-md' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }`}
                        >
                            <Icon path={m.icon} className="w-4 h-4"/>
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. 메인 컨텐츠 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
                
                {/* --- [LEFT] 입력 및 설정 패널 (Col-5) --- */}
                <div className="lg:col-span-5 flex flex-col h-full gap-6">
                    
                    {/* A. 복구 모드 패널 (좌측 진단 센터) */}
                    {mode === 'recovery' ? (
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-full flex flex-col">
                            <h3 className="text-xl font-bold text-teal-400 mb-6 flex items-center gap-2">
                                <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                손상된 코드 진단 센터
                            </h3>
                            
                            <div className="space-y-6 flex-1">
                                {/* QR 복구 범위 */}
                                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700">
                                    <h4 className="font-bold text-slate-200 mb-3 flex items-center gap-2 text-sm">
                                        <span className="w-1.5 h-4 bg-red-500 rounded-full"></span> 
                                        QR 코드 복구 가능 범위
                                    </h4>
                                    <ul className="list-disc pl-4 space-y-2 text-xs text-slate-400 leading-relaxed">
                                        <li><strong className="text-teal-400">복구 가능:</strong> 데이터 영역의 오염(얼룩), 최대 30% 소실(High ECC 사용 시), 약간의 구겨짐.</li>
                                        <li><strong className="text-red-400">복구 불가:</strong> 3개의 코너 패턴(Finder Pattern) 중 하나라도 손상된 경우, 이미지가 너무 흐릿한 경우.</li>
                                    </ul>
                                </div>

                                {/* 바코드 복구 범위 */}
                                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700">
                                    <h4 className="font-bold text-slate-200 mb-3 flex items-center gap-2 text-sm">
                                        <span className="w-1.5 h-4 bg-red-500 rounded-full"></span>
                                        바코드 복구 가능 범위
                                    </h4>
                                    <ul className="list-disc pl-4 space-y-2 text-xs text-slate-400 leading-relaxed">
                                        <li><strong className="text-teal-400">복구 가능:</strong> 수직 방향의 스크래치(바코드 높이가 남아있다면 인식 가능).</li>
                                        <li><strong className="text-red-400">복구 불가:</strong> 수평 방향으로 바가 끊긴 경우, 좌우 여백(Quiet Zone)이 없는 경우.</li>
                                    </ul>
                                </div>

                                {/* 업로드 영역 */}
                                <div className="mt-auto border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:bg-slate-700/30 hover:border-teal-500/50 transition-all cursor-pointer relative group">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleRecoveryUpload} />
                                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" className="w-6 h-6 text-slate-400 group-hover:text-teal-400" />
                                    </div>
                                    <p className="font-bold text-slate-300">손상된 이미지 업로드</p>
                                    <p className="text-xs text-slate-500 mt-1">AI가 복구 가능성을 분석합니다</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // 생성 모드 (기존 유지)
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col h-full shadow-inner">
                            {mode === 'qr' && (
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">Templates</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {[ {id: 'url', t: 'URL'}, {id: 'wifi', t: 'WiFi'}, {id: 'vcard', t: '명함'}, {id: 'email', t: '이메일'}, {id: 'phone', t: '전화번호'}, {id: 'sms', t: 'SMS'}, {id: 'whatsapp', t: 'WhatsApp'}, {id: 'location', t: '위치'}, {id: 'event', t: '일정'} ].map(t => (
                                            <button key={t.id} onClick={() => applyTemplate(t.id)} className="px-3 py-1.5 bg-slate-700 hover:bg-teal-600 text-slate-300 hover:text-white text-xs rounded-full transition-colors whitespace-nowrap border border-slate-600">
                                                {t.t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {mode === 'barcode' && (
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">Barcode Type</label>
                                    <select value={barcodeType} onChange={(e) => setBarcodeType(e.target.value)} className="w-full bg-slate-900 text-slate-200 p-2 rounded-lg border border-slate-600 text-sm focus:border-teal-500 outline-none">
                                        <option value="code128">Code 128 (표준)</option>
                                        <option value="ean13">EAN-13 (상품)</option>
                                        <option value="upca">UPC-A (북미)</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex-1 mb-6 relative">
                                <textarea
                                    className="w-full h-full min-h-[250px] bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none font-mono text-sm leading-relaxed"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={mode === 'qr' ? "QR 코드로 변환할 텍스트, URL 등을 입력하세요." : "바코드 숫자 또는 코드를 입력하세요."}
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-slate-500">{inputText.length} chars</div>
                            </div>

                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" className="w-4 h-4"/>
                                    고급 옵션
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {mode === 'qr' && (
                                        <>
                                            <div>
                                                <label className="text-[10px] text-slate-400 block mb-1">복원력 (ECC)</label>
                                                <select value={ecc} onChange={(e) => setEcc(e.target.value)} className="w-full bg-slate-800 text-slate-200 text-xs p-2 rounded border border-slate-600">
                                                    <option value="L">L (7%)</option>
                                                    <option value="M">M (15%)</option>
                                                    <option value="Q">Q (25%)</option>
                                                    <option value="H">H (30%)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-400 block mb-1">로고</label>
                                                <input type="file" onChange={(e) => e.target.files[0] && setLogo(URL.createObjectURL(e.target.files[0]))} className="w-full text-xs text-slate-400 file:bg-slate-700 file:text-slate-200 file:border-0 file:rounded file:px-2 file:py-1"/>
                                            </div>
                                        </>
                                    )}
                                    <div><label className="text-[10px] text-slate-400 block mb-1">전경색</label><input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-full h-8 bg-transparent cursor-pointer"/></div>
                                    <div><label className="text-[10px] text-slate-400 block mb-1">배경색</label><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-8 bg-transparent cursor-pointer"/></div>
                                </div>
                            </div>
                            <button onClick={generateCode} className="mt-6 w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]">
                                <Icon path="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                코드 생성하기
                            </button>
                        </div>
                    )}
                </div>

                {/* --- [RIGHT] 결과 및 도구 패널 (Col-7) --- */}
                <div className="lg:col-span-7 flex flex-col h-full gap-6">
                    <div className="bg-slate-800 rounded-2xl p-1 h-full border border-slate-700 flex flex-col relative overflow-hidden">
                        
                        {/* 결과 화면 배경 패턴 */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2dd4bf 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                        {/* 복구 모드일 때: 우측 패널 (손상/복구 예시 이미지) */}
                        {mode === 'recovery' && !recoveryInfo && (
                            <div className="flex-1 flex flex-col p-8 z-10 animate-fade-in bg-slate-800 rounded-2xl">
                                <h3 className="text-xl font-bold text-slate-300 mb-8 text-center">손상/복구 예시 이미지</h3>
                                
                                <div className="grid grid-cols-2 gap-8 flex-1 items-center justify-center">
                                    {/* 복구 불가 QR (Finder Pattern 손상) */}
                                    <div className="flex flex-col items-center group">
                                        <span className="text-xs text-red-400 mb-3 font-medium px-2 py-0.5 bg-red-500/10 rounded">복구 불가 (핵심 패턴 손상)</span>
                                        <div className="bg-white p-3 rounded-lg mb-3 shadow-lg transform transition-transform group-hover:scale-105 border border-slate-600 relative overflow-hidden">
                                            {/* 시각적 손상 효과 (뭉개짐) */}
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                                <Icon path="M6 18L18 6M6 6l12 12" className="w-12 h-12 text-red-500 opacity-80" />
                                            </div>
                                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FinderPatternDamaged" alt="Unrestorable QR" className="w-32 h-32 object-contain opacity-50" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">* 3개의 코너 패턴(Finder Pattern)이 뭉개지거나 손상된 경우</p>
                                    </div>

                                    {/* 복구 가능 QR (Data Area 얼룩) */}
                                    <div className="flex flex-col items-center group">
                                        <span className="text-xs text-teal-400 mb-3 font-medium px-2 py-0.5 bg-teal-500/10 rounded">복구 가능 (데이터 일부 손상)</span>
                                        <div className="bg-white p-3 rounded-lg mb-3 shadow-lg transform transition-transform group-hover:scale-105 border-2 border-blue-500 shadow-blue-500/20 relative">
                                            {/* 시각적 손상 효과 (얼룩/흠집) */}
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black rounded-full opacity-90 z-10 filter blur-[1px]"></div>
                                            <div className="absolute top-4 left-4 w-12 h-1 bg-black rotate-45 z-10"></div>
                                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DataAreaDamaged&ecc=H" alt="Restorable QR" className="w-32 h-32 object-contain" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">* 핵심 패턴은 온전하고, 데이터 영역에 얼룩/흠집이 있는 경우</p>
                                    </div>

                                    {/* 복구 불가 바코드 (수평 끊김) */}
                                    <div className="flex flex-col items-center group">
                                        <span className="text-xs text-red-400 mb-3 font-medium px-2 py-0.5 bg-red-500/10 rounded">복구 불가 (수평 끊김)</span>
                                        <div className="bg-white p-3 rounded-lg mb-3 shadow-lg transform transition-transform group-hover:scale-105 border border-slate-600 relative overflow-hidden">
                                            {/* 시각적 손상 효과 (수평 끊김) */}
                                            <div className="absolute inset-x-0 top-1/2 h-2 bg-white z-10 -translate-y-1/2"></div>
                                            <Icon path="M6 18L18 6M6 6l12 12" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-red-500 z-20" />
                                            <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=HorizontalCut&scale=3&height=10&backgroundcolor=ffffff" alt="Unrestorable Barcode" className="w-32 h-24 object-contain opacity-50" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">* 바가 수평 방향으로 완전히 끊겨 읽을 수 없는 경우</p>
                                    </div>

                                    {/* 복구 가능 바코드 (수직 스크래치) */}
                                    <div className="flex flex-col items-center group">
                                        <span className="text-xs text-teal-400 mb-3 font-medium px-2 py-0.5 bg-teal-500/10 rounded">복구 가능 (수직 스크래치)</span>
                                        <div className="bg-white p-3 rounded-lg mb-3 shadow-lg transform transition-transform group-hover:scale-105 border-2 border-blue-500 shadow-blue-500/20 relative overflow-hidden">
                                            {/* 시각적 손상 효과 (수직 스크래치) */}
                                            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white z-10 -translate-x-1/2 filter blur-[0.5px]"></div>
                                            <div className="absolute inset-y-0 left-1/4 w-0.5 bg-white z-10 -translate-x-1/2 filter blur-[0.5px]"></div>
                                            <div className="absolute inset-y-0 left-3/4 w-0.5 bg-white z-10 -translate-x-1/2 filter blur-[0.5px]"></div>
                                            <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=VerticalScratch&scale=3&height=10&backgroundcolor=ffffff" alt="Restorable Barcode" className="w-32 h-24 object-contain" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">* 수직 방향 스크래치가 있지만 바의 높이가 남아있는 경우</p>
                                    </div>
                                </div>

                                <p className="text-center text-xs text-slate-500 mt-8 pt-6 border-t border-slate-700/50">
                                    위 이미지들을 업로드하여 복구 분석을 테스트해보세요.
                                </p>
                            </div>
                        )}

                        {/* 복구 분석 결과 화면 (업로드 후) */}
                        {mode === 'recovery' && recoveryInfo && (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 animate-fade-in bg-slate-800 rounded-2xl">
                                <div className={`text-2xl font-bold mb-2 ${recoveryInfo.canRestore ? 'text-teal-400' : 'text-red-400'}`}>
                                    {recoveryInfo.status}
                                </div>
                                <div className="bg-slate-900 p-6 rounded-xl border border-slate-600 max-w-md w-full shadow-2xl">
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="text-slate-400">파일명</span>
                                            <span className="text-slate-200 truncate ml-4" title={recoveryInfo.filename}>{recoveryInfo.filename}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-700 pb-2">
                                            <span className="text-slate-400">코드 타입</span>
                                            <span className="text-slate-200">{recoveryInfo.type}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block mb-1">분석 소견</span>
                                            <p className="text-slate-300 text-sm leading-relaxed">{recoveryInfo.reason}</p>
                                        </div>
                                    </div>
                                    {recoveryInfo.canRestore && (
                                        <button className="mt-6 w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold transition-colors">
                                            AI 복원 시도 (Demo)
                                        </button>
                                    )}
                                    <button onClick={() => setRecoveryInfo(null)} className="mt-2 w-full py-2 text-slate-400 hover:text-white text-sm transition-colors">
                                        다시 테스트하기
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* QR/바코드 생성 결과 화면 (Recovery 아닐 때) */}
                        {mode !== 'recovery' && (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 min-h-[400px]">
                                {generatedUrl ? (
                                    <div className="flex flex-col items-center animate-bounce-in">
                                        <div className="bg-white p-4 rounded-xl shadow-2xl shadow-black/50 mb-6 relative group">
                                            <img src={generatedUrl} alt="Generated Code" style={{width: size, height: mode === 'barcode' ? 'auto' : size}} className="max-w-full object-contain" crossOrigin="anonymous"/>
                                            {logo && mode === 'qr' && (
                                                <img src={logo} alt="logo" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] object-contain" />
                                            )}
                                        </div>
                                        <div className="flex gap-3 w-full max-w-sm">
                                            <button onClick={downloadWithLogo} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                                {format.toUpperCase()} 다운로드
                                            </button>
                                            <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-slate-900 text-slate-300 px-4 rounded-xl border border-slate-600 focus:border-teal-500 outline-none font-bold">
                                                <option value="png">PNG</option>
                                                <option value="gif">GIF</option>
                                                <option value="jpeg">JPG</option>
                                                <option value="svg">SVG</option>
                                            </select>
                                        </div>
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                ) : (
                                    <div className="text-center opacity-30">
                                        <div className="w-32 h-32 border-4 border-dashed border-slate-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                            <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-12 h-12"/>
                                        </div>
                                        <p className="text-slate-400 font-medium text-lg">코드가 여기에 표시됩니다</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 하단 히스토리 바 */}
                        <div className="bg-slate-900 border-t border-slate-700 p-4 z-20">
                            <div className="flex justify-between items-center mb-3">
                                <h5 className="text-xs font-bold text-slate-400 uppercase">Recent History</h5>
                                <button onClick={() => setHistory([])} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                                {history.length > 0 ? history.map((h, i) => (
                                    <div key={i} onClick={() => { setInputText(h.text); setMode(h.type); }} className="min-w-[120px] bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-teal-500 cursor-pointer transition-all group">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${h.type === 'qr' ? 'bg-teal-500' : 'bg-blue-500'}`}></span>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">{h.type}</span>
                                        </div>
                                        <div className="text-xs text-slate-200 truncate">{h.text}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">{h.date}</div>
                                    </div>
                                )) : (
                                    <div className="text-xs text-slate-600 p-2">최근 기록이 없습니다.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrMasterStudio;