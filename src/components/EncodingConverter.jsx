import React, { useState, useEffect, useCallback } from 'react';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const EncodingStudio = () => {
    // === 상태 관리 ===
    const [file, setFile] = useState(null);
    const [previewText, setPreviewText] = useState('');
    const [hexPreview, setHexPreview] = useState('');
    
    // 인코딩 설정
    const [sourceEncoding, setSourceEncoding] = useState('UTF-8'); 
    const [targetEncoding, setTargetEncoding] = useState('UTF-8'); 
    
    const [options, setOptions] = useState({
        addBOM: true,
        lineEnding: 'keep',
    });
    
    const [status, setStatus] = useState({ type: 'idle', message: '파일을 선택하거나 샘플을 로드하세요' });
    const [showSampleMenu, setShowSampleMenu] = useState(false);
    
    // 미리보기 데이터 (각 인코딩별 디코딩 결과 저장)
    const [decodedPreviews, setDecodedPreviews] = useState({});
    
    // 워크플로우 상태
    const [workflowStep, setWorkflowStep] = useState('browse'); // browse, zoom, execute
    const [selectedEncoding, setSelectedEncoding] = useState('UTF-8');

    // 표준 인코딩 목록
    const encodings = [
        { val: 'UTF-8', label: '1. UTF-8 (유니코드)' },
        { val: 'EUC-KR', label: '2. EUC-KR (한국어)' },
        { val: 'Shift_JIS', label: '3. Shift_JIS (일본어)' },
        { val: 'windows-1252', label: '4. Windows-1252 (서유럽)' },
        { val: 'IBM866', label: '5. IBM866 (키릴/러시아)' },
        { val: 'ISO-8859-1', label: '6. ISO-8859-1 (라틴)' },
    ];

    // === 파일 로드 및 전체 인코딩 미리보기 생성 ===
    useEffect(() => {
        if (!file) {
            setDecodedPreviews({});
            setHexPreview('');
            return;
        }

        // 1. Hex 미리보기 생성
        const hexReader = new FileReader();
        hexReader.onload = (e) => {
            const buffer = new Uint8Array(e.target.result);
            const hex = Array.from(buffer).slice(0, 16).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
            setHexPreview(hex + (file.size > 16 ? ' ...' : ''));
        };
        hexReader.readAsArrayBuffer(file.slice(0, 32));

        // 2. 모든 인코딩에 대해 미리보기 생성 (비동기 병렬 처리)
        const generatePreviews = async () => {
            const previews = {};
            
            const readFileAs = (encoding) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = () => resolve('Error reading file');
                    reader.readAsText(file, encoding);
                });
            };

            // 모든 인코딩으로 미리 읽어둠
            for (const enc of encodings) {
                previews[enc.val] = await readFileAs(enc.val);
            }
            setDecodedPreviews(previews);
        };

        generatePreviews();

    }, [file]);

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setSourceEncoding('UTF-8');
            setStatus({ type: 'success', message: '파일이 로드되었습니다. 우측에서 올바른 인코딩을 확인하세요.' });
        }
    };

    // === 6가지 인코딩이 섞인 통합 샘플 데이터 생성 ===
    const loadUltimateSample = () => {
        const encoder = new TextEncoder(); // ASCII 변환용
        
        // 텍스트를 바이트 배열로 변환하는 헬퍼
        const strToBytes = (str) => Array.from(encoder.encode(str));

        // 각 인코딩별 바이너리 데이터 준비
        const parts = [
            strToBytes("=== Ultimate Encoding Test (1~6) ===\n\n"),

            // 1. UTF-8 (이모지 포함)
            strToBytes("1. [UTF-8] : "),
            [0xF0, 0x9F, 0x8C, 0x8D, 0x20, 0xED, 0x95, 0x9C, 0xEA, 0xB8, 0x80], // 🌍 한글
            strToBytes("\n"),

            // 2. EUC-KR (안녕하세요)
            strToBytes("2. [EUC-KR] : "),
            [0xBE, 0xC8, 0xB3, 0xE7, 0xC7, 0xCF, 0xBC, 0xBC, 0xBF, 0xE4], 
            strToBytes("\n"),
            // 3. Shift_JIS (곤니찌와)
            strToBytes("3. [Shift_JIS] : "),
            [0x82, 0xB1, 0x82, 0xF1, 0x82, 0xC9, 0x82, 0xBF, 0x82, 0xCD],
            strToBytes("\n"),
            // 4. Windows-1252 (Café ©)
            strToBytes("4. [Windows-1252] : "),
            [0x43, 0x61, 0x66, 0xE9, 0x20, 0xA9, 0x20, 0x32, 0x30, 0x32, 0x34],
            strToBytes("\n"),
            // 5. IBM866 (Привет - 러시아어)
            strToBytes("5. [IBM866] : "),
            [0x8F, 0xE0, 0xA8, 0xA2, 0xA5, 0xE2],
            strToBytes("\n"),
            // 6. ISO-8859-1 (Español)
            strToBytes("6. [ISO-8859-1] : "),
            [0x45, 0x73, 0x70, 0x61, 0xF1, 0x6F, 0x6C],
            strToBytes("\n"),
            strToBytes("========================================")
        ];

        // 배열 평탄화 및 Uint8Array 변환
        const flatBytes = parts.flat();
        const uint8Array = new Uint8Array(flatBytes);

        const blob = new Blob([uint8Array], { type: "text/plain" });
        blob.name = "ultimate_encoding_test.txt";
        
        setFile(blob);
        setSourceEncoding('UTF-8'); // 시작은 UTF-8
        setStatus({ type: 'warning', message: '⚠️ 왼쪽 [1. 원본 인코딩]을 변경하며 각 줄이 어떻게 변하는지 확인하세요.' });
        setShowSampleMenu(false);
    };

    // 다운로드
    const handleDownload = () => {
        const content = decodedPreviews[sourceEncoding];
        if (!content) return;
        
        let finalContent = content;
        if (options.lineEnding === 'crlf') finalContent = finalContent.replace(/\r?\n/g, '\r\n');
        else if (options.lineEnding === 'lf') finalContent = finalContent.replace(/\r\n/g, '\n');

        let blobParts = [finalContent];
        if (targetEncoding === 'UTF-8' && options.addBOM) blobParts = ['\uFEFF', finalContent];

        const blob = new Blob(blobParts, { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const originalName = file?.name || 'converted.txt';
        const nameParts = originalName.split('.');
        const ext = nameParts.pop();
        const baseName = nameParts.join('.');
        a.download = `${baseName}_${targetEncoding}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        
        // 다운로드 후 초기화
        setWorkflowStep('browse');
        setStatus({ type: 'success', message: '파일이 성공적으로 저장되었습니다.' });
    };

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                        <Icon path="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">Encoding Master Studio</h2>
                        <p className="text-xs text-slate-500">한글 깨짐 복구 및 인코딩 변환기</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={loadUltimateSample} 
                        className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/30 transition-all flex items-center gap-2"
                    >
                        <Icon path="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        통합 샘플 로드 (1~6번 테스트)
                    </button>
                    <button onClick={() => { 
                        setFile(null); 
                        setDecodedPreviews({}); 
                        setHexPreview(''); 
                        setStatus({type:'idle', message:''}); 
                        setWorkflowStep('browse');
                        setSelectedEncoding('UTF-8');
                    }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30 transition-all">
                        초기화
                    </button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 설정 */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar">
                        
                        {/* 파일 정보 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">File Input</h3>
                            {!file ? (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700/30 transition-colors">
                                    <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    <span className="mt-2 text-sm text-slate-400">파일 업로드 (.csv, .txt)</span>
                                    <input type="file" className="hidden" onChange={handleFileUpload} />
                                </label>
                            ) : (
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-600">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                                            <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm text-slate-200 font-bold truncate">{file.name}</div>
                                            <div className="text-xs text-slate-500">{(file.size).toLocaleString()} Bytes</div>
                                        </div>
                                    </div>
                                    {hexPreview && (
                                        <div className="mt-2 text-[10px] font-mono text-slate-500 bg-black/30 p-2 rounded break-all">
                                            HEX: {hexPreview}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 인코딩 설정 (핵심) */}
                        <div className="mb-6">
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                                <p className="text-xs text-amber-200 leading-relaxed">
                                    💡 <b>사용법:</b> 샘플 로드 후, 아래 <b>[1. 원본 인코딩]</b>을 <b>EUC-KR, Shift_JIS</b> 등으로 하나씩 변경해보세요. 선택한 인코딩에 해당하는 줄만 정상적으로 보입니다.
                                </p>
                            </div>

                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Encoding Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-amber-400 mb-1 block font-bold">1. 원본 인코딩 (깨짐 수정)</label>
                                    <select 
                                        value={sourceEncoding} 
                                        onChange={(e) => setSourceEncoding(e.target.value)}
                                        className="w-full bg-slate-900 border border-amber-500/50 rounded p-2 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                                    >
                                        {encodings.map(enc => (
                                            <option key={enc.val} value={enc.val}>{enc.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-center text-slate-500">
                                    <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block font-bold">2. 변환 대상 (저장)</label>
                                    <select 
                                        value={targetEncoding} 
                                        onChange={(e) => setTargetEncoding(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none"
                                    >
                                        <option value="UTF-8">UTF-8 (추천: 엑셀, 웹 호환)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 부가 옵션 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Export Options</h3>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 transition-colors">
                                    <span>BOM (Byte Order Mark) 추가</span>
                                    <input 
                                        type="checkbox" 
                                        checked={options.addBOM} 
                                        onChange={(e) => setOptions({...options, addBOM: e.target.checked})} 
                                        className="accent-amber-500" 
                                        disabled={targetEncoding !== 'UTF-8'}
                                    />
                                </label>
                                <p className="text-[10px] text-slate-500 px-2">
                                    * 엑셀 한글 깨짐 방지용 (필수)
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto space-y-3">
                            {workflowStep === 'browse' && (
                                <button 
                                    onClick={() => {
                                        setWorkflowStep('zoom');
                                        setSelectedEncoding(sourceEncoding);
                                    }}
                                    disabled={!file}
                                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    확정 및 다운로드
                                </button>
                            )}
                            
                            {workflowStep === 'zoom' && (
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => {
                                            setWorkflowStep('execute');
                                        }}
                                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        최종 확인 후 저장
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setWorkflowStep('browse');
                                        }}
                                        className="w-full py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        이전 단계로 돌아가기
                                    </button>
                                </div>
                            )}
                            
                            {workflowStep === 'execute' && (
                                <div className="space-y-2">
                                    <button 
                                        onClick={handleDownload}
                                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        파일 저장
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setWorkflowStep('zoom');
                                        }}
                                        className="w-full py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        이전 단계로 돌아가기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 우측: 인코딩별 미리보기 (Grid Layout) */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${status.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                {workflowStep === 'browse' && 'Encoding Preview (Compare)'}
                                {workflowStep === 'zoom' && '확정된 인코딩 확인'}
                                {workflowStep === 'execute' && '파일 저장 준비'}
                            </h3>
                            <div className="text-xs text-slate-500">
                                {status.message}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {workflowStep === 'browse' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                    {encodings.map((enc) => {
                                        const preview = decodedPreviews[enc.val];
                                        const isSelected = sourceEncoding === enc.val;
                                        
                                        return (
                                            <div 
                                                key={enc.val} 
                                                onClick={() => setSourceEncoding(enc.val)}
                                                className={`rounded-xl border cursor-pointer transition-all hover:shadow-lg flex flex-col h-56 overflow-hidden group ${
                                                    isSelected 
                                                    ? 'border-amber-500 bg-amber-500/10 shadow-amber-500/10' 
                                                    : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                                                }`}
                                            >
                                                <div className={`px-4 py-2 text-xs font-bold flex justify-between items-center border-b ${
                                                    isSelected ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-950 text-slate-400 border-slate-700'
                                                }`}>
                                                    <span>{enc.label}</span>
                                                    {isSelected && <span className="text-[10px] bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded font-bold">SELECTED</span>}
                                                </div>
                                                <div className="flex-1 relative">
                                                    {preview ? (
                                                        <textarea 
                                                            readOnly
                                                            value={preview}
                                                            className="w-full h-full bg-transparent text-slate-300 p-3 font-mono text-xs resize-none outline-none custom-scrollbar leading-relaxed cursor-pointer"
                                                        />
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                                                            (파일 없음)
                                                        </div>
                                                    )}
                                                    
                                                    {/* Hover Action */}
                                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(preview); }}
                                                            className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded border border-slate-600 hover:bg-slate-700"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {workflowStep === 'zoom' && (
                                <div className="space-y-4">
                                    <div className="bg-slate-950 rounded-xl border border-amber-500 overflow-hidden">
                                        <div className="bg-amber-500/20 px-4 py-3 border-b border-amber-500/30">
                                            <span className="text-sm font-bold text-amber-300">
                                                확정된 인코딩: {encodings.find(e => e.val === selectedEncoding)?.label}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            {decodedPreviews[selectedEncoding] ? (
                                                <textarea 
                                                    readOnly
                                                    value={decodedPreviews[selectedEncoding]}
                                                    className="w-full bg-transparent text-slate-300 font-mono text-lg resize-none outline-none custom-scrollbar leading-relaxed"
                                                    rows="8"
                                                />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-slate-600 text-lg">
                                                    (파일 없음)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-slate-500 text-center">
                                        위 내용이 맞는지 최종 확인 후 저장 버튼을 클릭하세요.
                                    </div>
                                </div>
                            )}

                            {workflowStep === 'execute' && (
                                <div className="space-y-4">
                                    <div className="bg-slate-950 rounded-xl border border-green-500 overflow-hidden">
                                        <div className="bg-green-500/20 px-4 py-3 border-b border-green-500/30">
                                            <span className="text-sm font-bold text-green-300">
                                                저장 준비 완료
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <div className="text-sm text-slate-300 mb-2">
                                                선택된 인코딩: {encodings.find(e => e.val === selectedEncoding)?.label}
                                            </div>
                                            <div className="text-xs text-slate-500 mb-4">
                                                파일 이름: {file?.name || 'converted.txt'}
                                            </div>
                                            {decodedPreviews[selectedEncoding] && (
                                                <div className="bg-slate-900 p-3 rounded">
                                                    <div className="text-xs text-slate-500 mb-2">미리보기:</div>
                                                    <div className="text-sm font-mono text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                                                        {decodedPreviews[selectedEncoding].slice(0, 200)}{decodedPreviews[selectedEncoding].length > 200 && '...'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-slate-500 text-center">
                                        저장 버튼을 클릭하면 파일이 다운로드됩니다.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EncodingStudio;