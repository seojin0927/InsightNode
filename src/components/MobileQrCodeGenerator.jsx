import React, { useState, useEffect, useCallback, useRef } from 'react';

// 공통 아이콘 컴포넌트
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const MobileQrCodeGenerator = () => {
    // 페이지 이동을 위한 navigate 함수
    const navigateTo = (page) => {
        window.location.hash = page;
    };
    const [activeTab, setActiveTab] = useState('generator');
    const [scrolled, setScrolled] = useState(false);
    const [inputText, setInputText] = useState('https://vaultsheet.com');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [ecc, setEcc] = useState('L'); // Error Correction Level
    const [format, setFormat] = useState('png');
    const [logo, setLogo] = useState(null);
    const [history, setHistory] = useState([]);
    const [recoveryInfo, setRecoveryInfo] = useState(null); // 복구 분석 결과
    const [mode, setMode] = useState('qr'); // qr, barcode, recovery, scanner
    const [barcodeType, setBarcodeType] = useState('code128');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // 캔버스 참조 (로고 합성 및 다운로드용)
    const canvasRef = useRef(null);

    // 스크롤 감지
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 뒤로가기 핸들러
    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            console.log("No history to go back to");
        }
    };

    // QR 코드 생성 로직 (qrserver API 사용)
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

    // 템플릿 마법사
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

    // [수정됨] 통합 다운로드 핸들러 (PNG, SVG 모두 처리)
    const handleDownload = useCallback(async (downloadFormat) => {
        if (!inputText.trim()) return;
        
        let urlToFetch = '';

        // 1. 다운로드할 URL 결정 (SVG인 경우 강제로 format=svg 파라미터 적용)
        if (mode === 'qr') {
            const encoded = encodeURIComponent(inputText);
            const fg = fgColor.replace('#', '');
            const bg = bgColor.replace('#', '');
            // SVG 요청 시에는 format=svg로 변경, 그 외에는 현재 설정된 format 사용
            const fmt = downloadFormat === 'svg' ? 'svg' : format;
            urlToFetch = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=${bg}&color=${fg}&ecc=${ecc}&margin=2&format=${fmt}`;
        } else {
            urlToFetch = generatedUrl;
        }

        try {
            // 2. 로고가 있고 PNG인 경우에만 Canvas 사용 (CORS 에러 가능성 있음)
            if (logo && downloadFormat !== 'svg' && mode === 'qr') {
                 const canvas = canvasRef.current;
                 const ctx = canvas.getContext('2d');
                 const img = new Image();
                 img.crossOrigin = "Anonymous"; // CORS 시도
                 img.src = urlToFetch;

                 img.onload = () => {
                     canvas.width = size;
                     canvas.height = size;
                     ctx.fillStyle = bgColor;
                     ctx.fillRect(0, 0, size, size);
                     ctx.drawImage(img, 0, 0, size, size);

                     const logoImg = new Image();
                     logoImg.src = logo;
                     logoImg.onload = () => {
                         const logoSize = size * 0.2;
                         const x = (size - logoSize) / 2;
                         const y = (size - logoSize) / 2;
                         ctx.drawImage(logoImg, x, y, logoSize, logoSize);
                         
                         // 다운로드 트리거
                         const link = document.createElement('a');
                         link.download = `qrcode-${Date.now()}.png`;
                         link.href = canvas.toDataURL('image/png');
                         link.click();
                     };
                 };
                 img.onerror = () => {
                     alert("이미지 로드 실패 (CORS 제한으로 인해 로고 합성이 불가능할 수 있습니다. 로고 없이 다운로드합니다.)");
                     // 실패 시 직접 다운로드로 폴백
                     fetchAndDownload(urlToFetch, downloadFormat);
                 };
            } else {
                // 3. 로고가 없거나 SVG인 경우: 직접 Fetch 후 Blob으로 저장 (Canvas 오염 회피)
                await fetchAndDownload(urlToFetch, downloadFormat);
            }
        } catch (error) {
            console.error("Download failed:", error);
            alert("다운로드 중 오류가 발생했습니다.");
        }
    }, [generatedUrl, inputText, size, fgColor, bgColor, ecc, format, logo, mode]);

    // [추가됨] Blob 데이터 Fetch 및 다운로드 헬퍼 함수
    const fetchAndDownload = async (url, ext) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `qrcode-${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    };

    // 복구 분석 시뮬레이션
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

    useEffect(() => {
        generateCode();
    }, [inputText, size, fgColor, bgColor, ecc, format, mode, barcodeType, generateCode]);

    const tabs = [
        { id: 'generator', label: 'QR 생성', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'about', label: '소개', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'guide', label: '사용법', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];

    return (
        <div className="w-full min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30 relative">
            
            {/* --- 배경 효과 (고정) --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent"></div>
                <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[50%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[50%] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
            </div>

            {/* --- 메인 컨테이너 --- */}
            <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen">
                
                {/* === 헤더 (뒤로가기 버튼 추가됨) === */}
                <div className={`sticky top-0 z-50 transition-all duration-300 px-5 py-3 flex items-center justify-between ${scrolled ? 'bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'}`}>
                    
                    <div className="flex items-center gap-3">
                        {/* 뒤로가기 버튼 */}
                        <button 
                            onClick={handleGoBack}
                            className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700 flex items-center justify-center text-slate-300 transition-all active:scale-90 group"
                            aria-label="Go Back"
                        >
                            <Icon path="M15 19l-7-7 7-7" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        {/* 로고 영역 */}
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] hidden xs:flex">
                                <Icon path="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </div>
                            <span className="font-black text-lg tracking-tight text-white">QR<span className="text-emerald-400">Code</span></span>
                        </div>
                    </div>

                    {/* 우측 뱃지 */}
                    <div className="text-[10px] font-bold bg-slate-800/80 px-2.5 py-1 rounded-full text-emerald-500 border border-slate-700/50">
                        GENERATOR
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="px-5 pt-2 pb-6">
                    <div className="bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 flex gap-1 shadow-inner">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 relative overflow-hidden ${
                                    activeTab === tab.id 
                                        ? 'bg-slate-800 text-emerald-400 shadow-lg border border-slate-700' 
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                }`}
                            >
                                {activeTab === tab.id && (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 opacity-50"></div>
                                )}
                                <Icon path={tab.icon} className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`} />
                                <span className="z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 컨텐츠 영역 */}
                <div className="flex-1 px-5 pb-24 space-y-6">

                    {/* === TAB 1: QR 생성 === */}
                    {activeTab === 'generator' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            
                            {/* QR 코드 디스플레이 */}
                            <div className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-800 p-6 shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <h3 className="text-emerald-100 text-xs font-bold tracking-widest uppercase mb-1">Live Preview</h3>
                                    <h2 className="text-2xl font-bold text-white mb-6">QR 코드 미리보기</h2>
                                    
                                    <div className="bg-white rounded-xl p-4 shadow-xl flex flex-col items-center gap-4">
                                        {generatedUrl && (
                                            <img 
                                                src={generatedUrl} 
                                                alt="QR Code" 
                                                className="w-48 h-48 border-2 border-slate-200 rounded-lg shadow-md"
                                                style={{ filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.1))` }}
                                                crossOrigin="anonymous"
                                            />
                                        )}
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600 mb-1">입력 내용</p>
                                            <p className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-full">{inputText}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 설정 옵션 */}
                            <div className="space-y-4">
                                <SectionHeader title="QR Code Settings" />
                                
                                <div className="grid gap-4">
                                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                                        <label className="block text-xs text-slate-400 mb-2">URL/텍스트 입력</label>
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                                            placeholder="https://vaultsheet.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                                            <label className="block text-xs text-slate-400 mb-2">크기</label>
                                            <input
                                                type="range"
                                                min="100"
                                                max="400"
                                                value={size}
                                                onChange={(e) => setSize(parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <p className="text-xs text-slate-500 text-center mt-1">{size}px</p>
                                        </div>

                                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                                            <label className="block text-xs text-slate-400 mb-2">색상</label>
                                            <input
                                                type="color"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-slate-700 bg-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                                        <label className="block text-xs text-slate-400 mb-2">배경색</label>
                                        <input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-slate-700 bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* [수정됨] 다운로드 버튼 */}
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleDownload('png')}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl font-bold transition-colors shadow-lg"
                                    >
                                        <Icon path="M12 10v6m0 0l-3-3m3-3v12" className="w-5 h-5 inline-block mr-2" />
                                        PNG로 저장
                                    </button>
                                    <button 
                                        onClick={() => handleDownload('svg')}
                                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 px-4 rounded-xl font-bold transition-colors shadow-lg"
                                    >
                                        <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-5 h-5 inline-block mr-2" />
                                        SVG로 저장
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === TAB 2: 소개 === */}
                    {activeTab === 'about' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="text-center py-4">
                                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-4">
                                    QR Technology
                                </div>
                                <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                                    Quick Response<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Code System</span>
                                </h2>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                    빠르게 정보를 저장하고 공유할 수 있는 2차원 바코드 기술입니다.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                <FeatureCard 
                                    title="High Capacity" 
                                    desc="텍스트, URL, 연락처 등 다양한 정보 저장 가능"
                                    gradient="from-emerald-500/20 to-emerald-500/5"
                                    iconColor="text-emerald-400"
                                    icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                                <FeatureCard 
                                    title="Fast Scanning" 
                                    desc="스마트폰 카메라로 즉시 인식 가능"
                                    gradient="from-cyan-500/20 to-cyan-500/5"
                                    iconColor="text-cyan-400"
                                    icon="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                                <FeatureCard 
                                    title="Error Correction" 
                                    desc="일부 손상 시에도 데이터 복구 가능"
                                    gradient="from-amber-500/20 to-amber-500/5"
                                    iconColor="text-amber-400"
                                    icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </div>
                        </div>
                    )}

                    {/* === TAB 3: 사용법 === */}
                    {activeTab === 'guide' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <h2 className="text-2xl font-bold text-white mb-2">QR 코드 사용 가이드</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    QR 코드를 효과적으로 사용하는 방법을 안내드립니다.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <SectionHeader title="Step by Step" />
                                
                                <div className="grid gap-3">
                                    <GuideStep 
                                        step="1"
                                        title="QR 코드 생성"
                                        desc="원하는 내용을 입력하고 QR 코드를 생성합니다."
                                    />
                                    <GuideStep 
                                        step="2"
                                        title="다운로드 저장"
                                        desc="PNG 또는 SVG 형식으로 저장합니다."
                                    />
                                    <GuideStep 
                                        step="3"
                                        title="사용 및 배포"
                                        desc="웹사이트, 명함, 포스터 등에 활용합니다."
                                    />
                                    <GuideStep 
                                        step="4"
                                        title="스캔 테스트"
                                        desc="스마트폰으로 스캔하여 정상 작동 확인합니다."
                                    />
                                </div>

                                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                                    <h4 className="text-emerald-400 font-bold text-sm mb-2">Tip</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        QR 코드는 최소 2cm 크기 이상으로 출력하는 것이 좋으며, 
                                        배경과의 색상 대비가 뚜렷할수록 스캔 정확도가 높아집니다.
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-8 text-center">
                                <div className="w-8 h-1 bg-slate-800 mx-auto rounded-full mb-4"></div>
                                <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                                    © 2024 QR CODE GENERATOR<br/>All rights reserved.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {/* 캔버스 요소 (화면에는 보이지 않음) */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

// --- 서브 컴포넌트들 ---
const SectionHeader = ({ title }) => (
    <h3 className="flex items-center gap-2 text-sm font-bold text-white pl-1">
        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
        {title}
    </h3>
);

const FeatureCard = ({ title, desc, icon, gradient, iconColor }) => (
    <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 group hover:border-slate-700 transition-colors">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full blur-xl -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-700`}></div>
        <div className="relative z-10 flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-slate-800/80 border border-slate-700 ${iconColor}`}>
                <Icon path={icon} className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-base font-bold text-white mb-1">{title}</h4>
                <p className="text-sm text-slate-400 leading-snug">{desc}</p>
            </div>
        </div>
    </div>
);

const GuideStep = ({ step, title, desc }) => (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 transition-all hover:bg-slate-800/40">
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-xs">
                {step}
            </div>
            <div>
                <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
        </div>
    </div>
);

export default MobileQrCodeGenerator;