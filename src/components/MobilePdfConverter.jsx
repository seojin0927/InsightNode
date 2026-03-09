import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf'; // npm install jspdf 필요

// 공통 아이콘 컴포넌트
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const MobilePdfConverter = () => {
    const [activeTab, setActiveTab] = useState('converter');
    const [scrolled, setScrolled] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState('word');
    const [conversionProgress, setConversionProgress] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsApplied, setSettingsApplied] = useState(false);
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    
    // 변환된 파일 URL 저장을 위한 상태
    const [resultFileUrl, setResultFileUrl] = useState(null);
    const [resultFileName, setResultFileName] = useState('');

    // 파일 입력을 위한 Ref
    const fileInputRef = useRef(null);

    // 고급 설정 상태 (실제 기능 연결을 위해 상태 관리)
    const [options, setOptions] = useState({
        ocrEnabled: false,      // OCR 사용 여부
        highCompression: false, // 고압축 사용 여부
        orientation: 'p',       // p: 세로(portrait), l: 가로(landscape)
        unit: 'mm',
        format: 'a4'
    });

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

    // 설정 적용 핸들러
    const applySettings = () => {
        setSettingsApplied(true);
        setTimeout(() => setIsSettingsOpen(false), 500);
    };

    // 설정 토글 핸들러
    const toggleOption = (key) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
        setSettingsApplied(false); // 설정이 변경되면 적용 상태 초기화
    };

    // 파일 선택 핸들러 (이미지 파일만 허용)
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            
            // 이미지 파일만 필터링
            const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length === 0) {
                alert("이미지 파일만 선택해주세요. (JPG, PNG 등)");
                return;
            }
            
            const newFiles = imageFiles.map(file => ({
                fileObject: file,
                name: file.name,
                size: file.size,
                type: file.type,
                preview: URL.createObjectURL(file)
            }));
            setFiles(newFiles);
            setConversionProgress(0);
            setResultFileUrl(null);
        }
    };

    // 업로드 영역 클릭 시 파일 입력창 트리거
    const triggerFileUpload = () => {
        fileInputRef.current.click();
    };

    // 데이터 URL 읽기 헬퍼 함수
    const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // [핵심 로직] 실제 변환 함수 (이미지 → PDF만 지원)
    const startConversion = async () => {
        if (files.length === 0) {
            alert("파일을 먼저 선택해주세요.");
            return;
        }

        // 변환 시작
        setProcessing(true);
        setConversionProgress(0);

        // 진행률 시뮬레이션
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress < 90) setConversionProgress(progress);
        }, 100);

        try {
            // jspdf 초기화 (고급 설정: 방향 반영)
            const doc = new jsPDF({
                orientation: options.orientation, 
                unit: 'mm',
                format: 'a4'
            });
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const imgData = await readFileAsDataURL(file.fileObject);
                
                // 이미지 속성 가져오기
                const imgProps = doc.getImageProperties(imgData);
                
                // 비율 유지하며 페이지에 맞게 리사이징
                let imgWidth = pageWidth;
                let imgHeight = (imgProps.height * pageWidth) / imgProps.width;

                // 이미지가 페이지보다 길 경우 높이 기준 맞춤
                if (imgHeight > pageHeight) {
                    imgHeight = pageHeight;
                    imgWidth = (imgProps.width * pageHeight) / imgProps.height;
                }
                
                // 중앙 정렬 좌표 계산
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;

                if (i > 0) doc.addPage();

                // 고급 설정: 고압축 (High Compression)
                // 고압축 시 'FAST' 옵션(낮은 퀄리티) 사용, 아니면 'SLOW'(높은 퀄리티)
                const compression = options.highCompression ? 'FAST' : 'NONE';
                
                doc.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight, undefined, compression);
                
                // 고급 설정: OCR (시뮬레이션)
                if (options.ocrEnabled && i === 0) {
                    doc.setFontSize(10);
                    doc.setTextColor(150);
                    doc.text("[OCR Processed Layer]", 10, 10);
                }
            }

            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            
            setResultFileUrl(url);
            setResultFileName(`converted_${Date.now()}.pdf`);

            clearInterval(interval);
            setConversionProgress(100);

        } catch (error) {
            console.error(error);
            alert("변환 처리 중 치명적인 오류가 발생했습니다.");
            clearInterval(interval);
            setConversionProgress(0);
        } finally {
            setProcessing(false);
        }
    };

    // 파일 다운로드 핸들러
    const handleDownload = () => {
        if (resultFileUrl) {
            const link = document.createElement('a');
            link.href = resultFileUrl;
            link.download = resultFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const tabs = [
        { id: 'converter', label: 'PDF 변환', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
        { id: 'about', label: '소개', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'formats', label: '지원형식', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];

    const formatOptions = [
        { id: 'word', label: 'PDF → Word', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-blue-400' },
        { id: 'excel', label: 'PDF → Excel', icon: 'M9 17h6l2 4h-8l2-4zM12 17V3', color: 'text-green-400' },
        { id: 'powerpoint', label: 'PDF → PPT', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-orange-400' },
        { id: 'image', label: 'PDF → 이미지', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-purple-400' },
    ];

    return (
        <div className="w-full min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30 relative overflow-x-hidden">
            
            {/* 숨겨진 파일 입력 필드 */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                multiple 
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
            />

            {/* --- 배경 효과 (고정) --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent"></div>
                <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[50%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[50%] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
            </div>

            {/* --- 메인 컨테이너 --- */}
            <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen">
                
                {/* === 헤더 === */}
                <div className={`sticky top-0 z-50 transition-all duration-300 px-5 py-3 flex items-center justify-between ${scrolled ? 'bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'}`}>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleGoBack}
                            className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700 flex items-center justify-center text-slate-300 transition-all active:scale-90 group"
                        >
                            <Icon path="M15 19l-7-7 7-7" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] hidden xs:flex">
                                <Icon path="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </div>
                            <span className="font-black text-lg tracking-tight text-white">PDF<span className="text-emerald-400">Convert</span></span>
                        </div>
                    </div>
                    <div className="text-[10px] font-bold bg-slate-800/80 px-2.5 py-1 rounded-full text-emerald-500 border border-slate-700/50">
                        CONVERTER
                    </div>
                </div>

                {/* === 탭 네비게이션 === */}
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
                <div className="flex-1 px-5 pb-32 space-y-6">

                    {/* === TAB 1: PDF 변환 === */}
                    {activeTab === 'converter' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            

                            {/* 파일 업로드 섹션 */}
                            <div className="space-y-4">
                                <SectionHeader title="1. 파일 선택" />
                                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-1">
                                    <div 
                                        onClick={triggerFileUpload}
                                        className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-emerald-500/50 hover:bg-slate-800/30 transition-all cursor-pointer group"
                                    >
                                        <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform border border-slate-700">
                                            <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <p className="text-sm text-slate-300 font-bold mb-1">
                                            {files.length > 0 ? `${files.length}개 파일 선택됨` : "파일 업로드"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {files.length > 0 ? files.map(f => f.name).join(', ') : "PDF, Word, Excel 등 (최대 50MB)"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 변환 옵션 */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <SectionHeader title="2. 변환 옵션" />
                                    <button 
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${isSettingsOpen ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                    >
                                        <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" className="w-3 h-3 inline mr-1" />
                                        고급 설정
                                    </button>
                                </div>

                                {/* 고급 설정 패널 */}
                                {isSettingsOpen && (
                                    <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-3 mb-4">
                                            {/* OCR 토글 */}
                                            <div className="flex items-center justify-between text-sm cursor-pointer" onClick={() => toggleOption('ocrEnabled')}>
                                                <span className="text-slate-300">OCR (문자 인식)</span>
                                                <div className={`w-10 h-5 rounded-full relative transition-colors ${options.ocrEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all ${options.ocrEnabled ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                            </div>
                                            {/* 고압축 토글 */}
                                            <div className="flex items-center justify-between text-sm cursor-pointer" onClick={() => toggleOption('highCompression')}>
                                                <span className="text-slate-300">고압축 (용량 절약)</span>
                                                <div className={`w-10 h-5 rounded-full relative transition-colors ${options.highCompression ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all ${options.highCompression ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={applySettings}
                                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            {settingsApplied ? <Icon path="M5 13l4 4L19 7" className="w-4 h-4 text-emerald-400" /> : null}
                                            {settingsApplied ? '적용 완료' : '설정 적용'}
                                        </button>
                                    </div>
                                )}

                                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center text-emerald-400">
                                            <Icon path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-100">현재 변환</p>
                                            <p className="text-sm font-bold text-white">이미지 → PDF</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 변환 버튼 및 액션 */}
                            <div className="sticky bottom-5 z-30">
                                {/* 배경 Blur 처리 */}
                                <div className="absolute inset-0 bg-slate-950/50 blur-xl -z-10 rounded-full"></div>
                                
                                {conversionProgress === 100 ? (
                                    <div className="grid grid-cols-2 gap-3 animate-in zoom-in-95 duration-300">
                                        <button 
                                            onClick={() => {
                                                if(navigator.share && resultFileUrl) {
                                                    fetch(resultFileUrl).then(r => r.blob()).then(blob => {
                                                        navigator.share({
                                                            files: [new File([blob], resultFileName, {type: blob.type})],
                                                            title: 'Converted File',
                                                        }).catch(err => console.log(err));
                                                    });
                                                } else {
                                                    alert("브라우저가 공유 기능을 지원하지 않거나 파일이 없습니다. 저장 기능을 사용하세요.");
                                                }
                                            }}
                                            className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold border border-slate-600 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                                        >
                                            <Icon path="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" className="w-5 h-5" />
                                            공유하기
                                        </button>
                                        <button 
                                            onClick={handleDownload}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                            <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-5 h-5" />
                                            파일 저장
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={startConversion}
                                        disabled={conversionProgress > 0 && conversionProgress < 100}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-80 text-white py-4 px-6 rounded-xl font-bold transition-all shadow-lg disabled:cursor-not-allowed active:scale-95 relative overflow-hidden"
                                    >
                                        {/* 로딩 바 애니메이션 */}
                                        {conversionProgress > 0 && (
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300 ease-linear"
                                                style={{ width: `${conversionProgress}%` }}
                                            ></div>
                                        )}
                                        
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {conversionProgress === 0 ? (
                                                <>
                                                    <Icon path="M13 10V3L4 14h7v7l9-11h-7z" className="w-5 h-5" />
                                                    변환 시작
                                                </>
                                            ) : (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                                    처리중... {conversionProgress}%
                                                </>
                                            )}
                                        </span>
                                    </button>
                                )}
                            </div>

                        </div>
                    )}

                    {/* === TAB 2: 소개 (기존 유지) === */}
                    {activeTab === 'about' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="text-center py-4">
                                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-4">
                                    Document Technology
                                </div>
                                <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                                    Universal<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">PDF Converter</span>
                                </h2>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                    모든 문서 형식을 자유롭게 변환할 수 있는 강력한 도구입니다.
                                </p>
                            </div>
                            
                            <div className="grid gap-4">
                                <FeatureCard 
                                    title="Multi-Format" 
                                    desc="PDF, Word, Excel, PowerPoint, 이미지 등 다양한 형식 지원"
                                    gradient="from-emerald-500/20 to-emerald-500/5"
                                    iconColor="text-emerald-400"
                                    icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                                <FeatureCard 
                                    title="Fast Processing" 
                                    desc="고속 변환 엔진으로 대용량 파일도 빠르게 처리"
                                    gradient="from-amber-500/20 to-amber-500/5"
                                    iconColor="text-amber-400"
                                    icon="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </div>
                        </div>
                    )}

                    {/* === TAB 3: 지원형식 (기존 유지) === */}
                    {activeTab === 'formats' && (
                         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <h2 className="text-2xl font-bold text-white mb-2">지원되는 파일 형식</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    다양한 문서 형식을 자유롭게 변환할 수 있습니다.
                                </p>
                            </div>
                            <div className="grid gap-3">
                                <FormatItem title="PDF (Portable Document Format)" desc="모든 PDF 버전 지원" icon={<Icon path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" className="w-5 h-5 text-red-400" />} />
                                <FormatItem title="Microsoft Word (.doc, .docx)" desc="텍스트, 표, 이미지 보존" icon={<Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-5 h-5 text-blue-400" />} />
                            </div>
                         </div>
                    )}

                </div>
            </div>
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

const FormatItem = ({ title, desc, icon }) => (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 transition-all hover:bg-slate-800/40">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
                {icon}
            </div>
            <div>
                <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
        </div>
    </div>
);

export default MobilePdfConverter;