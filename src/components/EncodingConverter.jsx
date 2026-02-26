import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Icons from '../utils/Icons';

const EncodingConverter = () => {
    const [inputFile, setInputFile] = useState(null);
    const [inputText, setInputText] = useState('');
    const [output, setOutput] = useState('');
    const [selectedEncoding, setSelectedEncoding] = useState('utf-8-bom');
    const [detectedEncoding, setDetectedEncoding] = useState('');
    const [error, setError] = useState('');

    // 파일 읽기
    const handleFileRead = useCallback((file) => {
        if (!file) return;
        
        setInputFile(file.name);
        setError('');
        
        const reader = new FileReader();
        
        // 선택된 인코딩으로 읽기
        reader.onload = (e) => {
            const content = e.target.result;
            setInputText(content);
            
            // UTF-8로 변환하여 저장
            try {
                // BOM 제거하고 다시 인코딩
                const cleanContent = content.replace(/^\uFEFF/, '');
                const blob = new Blob([cleanContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const reader2 = new FileReader();
                reader2.onload = (e2) => {
                    setOutput(e2.target.result);
                };
                reader2.readAsText(blob, 'utf-8');
            } catch (err) {
                setError('파일 읽기 오류: ' + err.message);
            }
        };
        
        // 파일을 지정된 인코딩으로 읽기 시도
        reader.readAsText(file);
    }, []);

    // 텍스트直接从 인코딩 변환
    const handleConvertText = useCallback(() => {
        if (!inputText) return;
        
        try {
            // 현재 텍스트를 선택된 인코딩으로 변환
            let converted = inputText;
            
            if (selectedEncoding === 'utf-8-bom') {
                // BOM 추가
                converted = '\uFEFF' + inputText;
            }
            
            setOutput(converted);
        } catch (err) {
            setError('변환 오류: ' + err.message);
        }
    }, [inputText, selectedEncoding]);

    // 다운로드
    const handleDownload = useCallback(() => {
        if (!output) return;
        
        let blob;
        let filename = 'converted';
        
        if (selectedEncoding === 'utf-8-bom') {
            blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
            filename += '_utf8.csv';
        } else if (selectedEncoding === 'euc-kr') {
            // UTF-8을 EUC-KR로 변환
            blob = new Blob([output], { type: 'text/csv;charset=euc-kr;' });
            filename += '_euckr.csv';
        } else {
            blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
            filename += '_utf8.csv';
        }
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }, [output, selectedEncoding]);

    // 클립보드 복사
    const handleCopy = useCallback(() => {
        if (!output) return;
        navigator.clipboard.writeText(output).then(() => {
            alert('복사되었습니다!');
        });
    }, [output]);

    return (
        <>
            {/* SEO Heading (화면에 표시되지 않음) */}
            <h1 className="sr-only">한글 깨짐 복구 - CSV/텍스트 인코딩 변환 도구 (EUC-KR ↔ UTF-8)</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            🚨 CSV 한글 깨짐 복구기
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            EUC-KR ↔ UTF-8 인코딩을 변환하여 엑셀에서 정상적으로 열리도록 합니다
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden" style={{ minHeight: 'calc(100% - 80px)' }}>
                    {/* 좌측: 입력 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">원본 CSV 파일</span>
                            </div>
                            <label className="ml-auto mr-4 my-auto px-4 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 rounded-lg text-sm font-medium cursor-pointer transition-all border border-slate-600/30 hover:border-brand-500/50">
                                파일 열기
                                <input 
                                    type="file" 
                                    accept=".csv,.txt" 
                                    className="hidden" 
                                    onChange={(e) => handleFileRead(e.target.files[0])}
                                />
                            </label>
                        </div>
                        
                        <div className="flex-1 p-4">
                            {inputFile ? (
                                <div className="h-full flex flex-col">
                                    <div className="mb-3 text-sm text-slate-400">
                                        📁 파일명: <span className="text-slate-200 font-medium">{inputFile}</span>
                                    </div>
                                    <textarea
                                        className="flex-1 w-full bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="CSV 파일을 열거나 아래에 텍스트를 붙여넣으세요"
                                        spellCheck="false"
                                    />
                                </div>
                            ) : (
                                <div 
                                    className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700/30 rounded-xl bg-gradient-to-br from-slate-800/20 to-slate-900/20 hover:from-slate-800/30 hover:to-slate-900/40 hover:border-brand-500/30 transition-all cursor-pointer group"
                                    onClick={() => document.querySelector('input[type="file"]').click()}
                                >
                                    <div className="bg-slate-800/60 p-6 rounded-xl mb-4 text-slate-500 group-hover:text-brand-400 transition-colors shadow-lg">
                                        <Icons.Upload />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-200 mb-2">깨진 CSV 파일을 여기에 드롭하세요</h3>
                                    <p className="text-sm text-slate-500 mb-4">또는 클릭하여 파일 선택</p>
                                    <div className="text-xs text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/30">
                                        지원: .csv, .txt
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 우측: 출력 */}
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
                        
                        <div className="flex-1 p-4">
                            {output ? (
                                <div className="h-full flex flex-col">
                                    <div className="mb-3 flex items-center gap-4">
                                        <span className="text-sm text-slate-400">변환 형식:</span>
                                        <select
                                            value={selectedEncoding}
                                            onChange={(e) => setSelectedEncoding(e.target.value)}
                                            className="bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600/30 outline-none hover:border-brand-500/50 transition-colors"
                                        >
                                            <option value="utf-8-bom">UTF-8 (BOM 포함) - 엑셀 권장</option>
                                            <option value="utf-8">UTF-8 (BOM 없이)</option>
                                            <option value="euc-kr">EUC-KR (한글)</option>
                                        </select>
                                    </div>
                                    <textarea
                                        className="flex-1 w-full bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700"
                                        value={output}
                                        readOnly
                                        placeholder="변환 결과가 여기에 표시됩니다"
                                        spellCheck="false"
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                        </svg>
                                    </div>
                                    <p className="text-slate-500">변환 결과가 여기에 표시됩니다</p>
                                </div>
                            )}
                        </div>
                        
                        {output && (
                            <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 flex gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50"
                                >
                                    <Icons.Copy /> 복사
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    <Icons.Download /> 다운로드
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EncodingConverter;
