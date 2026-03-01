import React, { useState, useCallback, useEffect } from 'react';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const PdfStudio = () => {
    // === 상태 관리 ===
    const [tool, setTool] = useState('img-to-pdf'); // 현재 선택된 도구
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // 옵션 상태 (도구별 공용)
    const [options, setOptions] = useState({
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 'small',
        compressionLevel: 'medium',
        imageFormat: 'jpg',
        rotation: 90,
        watermarkText: '',
        watermarkOpacity: 50,
        password: '',
        metaTitle: '',
        splitRange: ''
    });

    // === 도구 목록 ===
    const tools = [
        { id: 'img-to-pdf', label: '이미지 to PDF', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'merge', label: 'PDF 병합', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
        { id: 'split', label: 'PDF 분할', icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z' },
        { id: 'compress', label: 'PDF 압축', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3' }, // Alternative icon needed for compress concept
        { id: 'pdf-to-img', label: 'PDF to 이미지', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
        { id: 'rotate', label: '회전', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
        { id: 'watermark', label: '워터마크', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
        { id: 'protect', label: '보안 설정', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    ];

    // === 파일 핸들링 ===
    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files);
        const newFiles = selected.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            preview: tool === 'img-to-pdf' ? URL.createObjectURL(file) : null // 이미지일 때만 미리보기
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // === 처리 로직 (Simulation) ===
    const executeProcess = () => {
        if (files.length === 0) return;
        
        setProcessing(true);
        setProgress(0);

        // 실제 구현 시: pdf-lib 또는 jspdf 라이브러리 사용
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setProcessing(false);
                    alert(`${tools.find(t => t.id === tool).label} 작업이 완료되었습니다! (데모)`);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    // 도구 변경 시 파일 초기화
    useEffect(() => {
        setFiles([]);
        setProgress(0);
        setProcessing(false);
    }, [tool]);

    // === 옵션 UI 렌더링 헬퍼 ===
    const renderOptions = () => {
        switch(tool) {
            case 'img-to-pdf':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">페이지 크기</label>
                            <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none">
                                <option value="a4">A4</option>
                                <option value="letter">Letter</option>
                                <option value="fit">이미지 크기에 맞춤</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">방향</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={()=>setOptions({...options, orientation: 'portrait'})} className={`py-2 text-sm rounded border ${options.orientation === 'portrait' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-600 text-slate-400'}`}>세로</button>
                                <button onClick={()=>setOptions({...options, orientation: 'landscape'})} className={`py-2 text-sm rounded border ${options.orientation === 'landscape' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-600 text-slate-400'}`}>가로</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">여백</label>
                            <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none">
                                <option value="none">없음</option>
                                <option value="small">좁게</option>
                                <option value="normal">보통</option>
                            </select>
                        </div>
                    </div>
                );
            case 'compress':
                return (
                    <div className="space-y-4">
                        <label className="text-xs text-slate-400 mb-1 block">압축 수준</label>
                        <div className="space-y-2">
                            {['low', 'medium', 'high'].map(level => (
                                <label key={level} className="flex items-center gap-2 p-3 rounded bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500">
                                    <input type="radio" name="compression" checked={options.compressionLevel === level} onChange={()=>setOptions({...options, compressionLevel: level})} className="accent-red-500" />
                                    <span className="text-sm text-slate-200 capitalize">{level} Compression</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'split':
                return (
                    <div className="space-y-4">
                        <label className="text-xs text-slate-400 mb-1 block">분할 범위 (예: 1-5, 8, 11-13)</label>
                        <input type="text" placeholder="1-3, 5" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-red-500" />
                        <div className="text-xs text-slate-500">입력하지 않으면 모든 페이지가 낱장으로 분할됩니다.</div>
                    </div>
                );
            case 'watermark':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">텍스트</label>
                            <input type="text" placeholder="Confidential" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-red-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">투명도 ({options.watermarkOpacity}%)</label>
                            <input type="range" min="10" max="100" value={options.watermarkOpacity} onChange={(e)=>setOptions({...options, watermarkOpacity: e.target.value})} className="w-full accent-red-500" />
                        </div>
                    </div>
                );
            case 'protect':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">비밀번호 설정</label>
                            <input type="password" placeholder="비밀번호 입력" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-red-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">비밀번호 확인</label>
                            <input type="password" placeholder="비밀번호 재입력" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-red-500" />
                        </div>
                    </div>
                );
            default:
                return <div className="text-slate-500 text-sm text-center py-4">이 도구는 추가 설정이 필요 없습니다.</div>;
        }
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                    <Icon path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">PDF Master Studio</h2>
                    <p className="text-slate-400 text-sm">변환, 병합, 분할, 보안 설정을 한 곳에서</p>
                </div>
            </div>

            {/* 2. 메인 레이아웃 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 도구 메뉴 (Col 3) */}
                <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-3 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 px-2">Tools</h3>
                        <div className="space-y-1">
                            {tools.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTool(t.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                                        tool === t.id 
                                        ? 'bg-red-600 text-white shadow-md' 
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <Icon path={t.icon} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 중앙: 작업 공간 (Col 6) */}
                <div className="lg:col-span-6 flex flex-col min-h-0">
                    <div className="bg-slate-800 rounded-xl border-2 border-dashed border-slate-700 flex flex-col h-full relative overflow-hidden group">
                        
                        {/* 파일 목록 영역 */}
                        {files.length > 0 ? (
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="relative group/item bg-slate-700 rounded-lg p-3 flex items-center gap-3 border border-slate-600">
                                            {/* 미리보기 (이미지인 경우) */}
                                            {file.preview ? (
                                                <div className="w-12 h-16 bg-slate-900 rounded overflow-hidden flex-shrink-0">
                                                    <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-16 bg-red-900/30 rounded flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] font-bold text-red-400">PDF</span>
                                                </div>
                                            )}
                                            
                                            <div className="min-w-0">
                                                <div className="text-sm text-slate-200 truncate font-medium">{file.name}</div>
                                                <div className="text-xs text-slate-400">{(file.size/1024/1024).toFixed(2)} MB</div>
                                            </div>

                                            <button 
                                                onClick={() => removeFile(idx)}
                                                className="absolute top-2 right-2 p-1 bg-slate-800 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors opacity-0 group-hover/item:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700/30 transition-colors">
                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-red-400 group-hover:scale-110 transition-all">
                                    <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </div>
                                <div className="text-lg font-medium text-slate-300">파일을 여기에 드롭하세요</div>
                                <div className="text-sm text-slate-500 mt-1">또는 클릭하여 선택</div>
                                <input type="file" multiple className="hidden" onChange={handleFileSelect} accept={tool === 'img-to-pdf' ? 'image/*' : '.pdf'} />
                            </label>
                        )}

                        {/* 하단 액션 바 */}
                        <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-between items-center">
                            <div className="text-xs text-slate-400">
                                {files.length}개 파일 선택됨
                            </div>
                            <div className="flex gap-3">
                                {files.length > 0 && <button onClick={() => setFiles([])} className="text-sm text-red-400 hover:underline">비우기</button>}
                                <button 
                                    onClick={executeProcess}
                                    disabled={files.length === 0 || processing}
                                    className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            처리 중... {progress}%
                                        </>
                                    ) : (
                                        <>
                                            <span>변환 시작</span>
                                            <Icon path="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        {processing && (
                            <div className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-300" style={{width: `${progress}%`}}></div>
                        )}
                    </div>
                </div>

                {/* 우측: 설정 패널 (Col 3) */}
                <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 border-b border-slate-700 pb-2">
                            Settings
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {renderOptions()}
                        </div>
                        
                        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-2 mb-1 text-slate-300 font-semibold text-xs">
                                <span>💡 Info</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {tool === 'merge' && '파일 목록의 순서대로 PDF가 병합됩니다. 드래그하여 순서를 변경할 수 있습니다.'}
                                {tool === 'split' && '특정 페이지를 추출하거나 파일을 여러 개로 나눌 수 있습니다.'}
                                {tool === 'protect' && '암호화된 PDF는 비밀번호 없이는 열 수 없습니다. 비밀번호를 잊지 않도록 주의하세요.'}
                                {tool === 'img-to-pdf' && '고화질 이미지는 파일 크기가 커질 수 있습니다. 필요시 압축 옵션을 사용하세요.'}
                                {tool === 'compress' && 'DPI를 낮추어 용량을 줄입니다. 화면 열람용으로 적합합니다.'}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PdfStudio;