import React, { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import Icons from '../utils/Icons';

const JsonToCsvConverter = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [csvOutput, setCsvOutput] = useState('');
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [previewRows, setPreviewRows] = useState(5);

    // 🆕 페이지 로드 시 sessionStorage에서 JSON 파일 확인 및 자동 로드
    useEffect(() => {
        const pendingJsonFile = sessionStorage.getItem('pendingJsonFile');
        if (pendingJsonFile) {
            try {
                const { name, content } = JSON.parse(pendingJsonFile);
                setFileName(name);
                setJsonInput(content);
                
                // JSON 파싱
                let data;
                try {
                    data = JSON.parse(content);
                } catch {
                    // JSON이 아니면 JSON Lines 형식 시도
                    const lines = content.trim().split('\n');
                    data = lines.map(line => {
                        try {
                            return JSON.parse(line);
                        } catch {
                            return line;
                        }
                    });
                }
                
                // 배열이 아닌 경우 배열로 감싸기
                if (!Array.isArray(data)) {
                    data = [data];
                }
                
                setParsedData(data);
                
                // CSV로 변환
                const csv = Papa.unparse(data);
                setCsvOutput(csv);
                
                // sessionStorage에서 제거 (한 번만 사용)
                sessionStorage.removeItem('pendingJsonFile');
            } catch (err) {
                setError('파일 로드 오류: ' + err.message);
                sessionStorage.removeItem('pendingJsonFile');
            }
        }
    }, []);

    // JSON 파일을 읽어서 처리
    const handleFileRead = useCallback((file) => {
        if (!file) return;
        
        setFileName(file.name);
        setError('');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            setJsonInput(content);
            
            try {
                // JSON 파싱 시도
                let data;
                try {
                    data = JSON.parse(content);
                } catch {
                    // JSON이 아니면 JSON Lines 형식尝试
                    const lines = content.trim().split('\n');
                    data = lines.map(line => {
                        try {
                            return JSON.parse(line);
                        } catch {
                            return line;
                        }
                    });
                }
                
                // 배열이 아닌 경우 배열로 감싸기
                if (!Array.isArray(data)) {
                    data = [data];
                }
                
                setParsedData(data);
                
                // CSV로 변환
                const csv = Papa.unparse(data);
                setCsvOutput(csv);
            } catch (err) {
                setError('JSON 파싱 오류: ' + err.message);
                setParsedData(null);
            }
        };
        reader.readAsText(file);
    }, []);

    // 파일 드롭 핸들러
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.json') || file.name.endsWith('.jsonl'))) {
            handleFileRead(file);
        } else {
            setError('JSON 파일만 지원됩니다.');
        }
    }, [handleFileRead]);

    // 드래그 오버 방지
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    // CSV 다운로드
    const handleDownload = useCallback(() => {
        if (!csvOutput) return;
        
        const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // 원본 파일명이 있으면 변환, 없으면 기본값
        const baseName = fileName ? fileName.replace(/\.(json|jsonl)$/i, '') : 'converted';
        link.setAttribute('href', url);
        link.setAttribute('download', `${baseName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [csvOutput, fileName]);

    // 클립보드 복사
    const handleCopyToClipboard = useCallback(() => {
        if (!csvOutput) return;
        navigator.clipboard.writeText(csvOutput).then(() => {
            alert('CSV가 클립보드에 복사되었습니다!');
        });
    }, [csvOutput]);

    // 미리보기 행 수 변경
    const handlePreviewRowsChange = useCallback((e) => {
        setPreviewRows(parseInt(e.target.value, 10));
    }, []);

    return (
        <>
            {/* SEO Heading (화면에 표시되지 않음) */}
            <h1 className="sr-only">JSON to CSV 변환기 - 무료 온라인 JSON 파일을 CSV로 변환</h1>
            
            {/* 메인 컨텐츠 - 좌우 분할 (main-content와 동일한 스타일) */}
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                
                {/* 헤더 */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                            </svg>
                            JSON to CSV 변환
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            JSON 파일을 CSV 형식으로 변환합니다
                        </p>
                    </div>
                    
                    {csvOutput && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCopyToClipboard}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50 shadow-lg"
                            >
                                <Icons.Copy /> 복사
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-600/20"
                            >
                                <Icons.Download /> CSV 다운로드
                            </button>
                        </div>
                    )}
                </div>

                {/* 컨텐츠 영역 - 좌우 분할 */}
                <div className="flex-1 flex gap-4 overflow-hidden" style={{ minHeight: 'calc(100% - 80px)' }}>
                    {/* 좌측: JSON 입력 (sidebar와 동일한 스타일) */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">JSON 입력</span>
                            </div>
                            <label className="ml-auto mr-4 my-auto px-4 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 rounded-lg text-sm font-medium cursor-pointer transition-all border border-slate-600/30 hover:border-brand-500/50">
                                파일 열기
                                <input 
                                    type="file" 
                                    accept=".json,.jsonl" 
                                    className="hidden" 
                                    onChange={(e) => handleFileRead(e.target.files[0])}
                                />
                            </label>
                        </div>
                        
                        <div 
                            className="flex-1 relative"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            {parsedData ? (
                                <div className="h-full flex flex-col">
                                    <textarea
                                        className="flex-1 w-full bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none outline-none custom-scrollbar"
                                        value={jsonInput}
                                        onChange={(e) => {
                                            setJsonInput(e.target.value);
                                            try {
                                                const data = JSON.parse(e.target.value);
                                                setParsedData(Array.isArray(data) ? data : [data]);
                                                setCsvOutput(Papa.unparse(Array.isArray(data) ? data : [data]));
                                                setError('');
                                            } catch {
                                                setError('유효하지 않은 JSON 형식');
                                            }
                                        }}
                                        placeholder={`{
  "name": "John",
  "age": 30,
  "city": "Seoul"
}`}
                                        spellCheck="false"
                                    />
                                </div>
                            ) : (
                                <div 
                                    className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700/30 m-4 rounded-xl bg-gradient-to-br from-slate-800/20 to-slate-900/20 hover:from-slate-800/30 hover:to-slate-900/40 hover:border-brand-500/30 transition-all cursor-pointer group"
                                    onClick={() => document.querySelector('input[type="file"]').click()}
                                >
                                    <div className="bg-slate-800/60 p-6 rounded-xl mb-4 text-slate-500 group-hover:text-brand-400 transition-colors shadow-lg">
                                        <Icons.Upload />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-200 mb-2">JSON 파일을 여기에 드롭하세요</h3>
                                    <p className="text-sm text-slate-500 mb-4">또는 클릭하여 파일 선택</p>
                                    <div className="text-xs text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/30">
                                        지원: .json, .jsonl
                                    </div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="absolute bottom-4 left-4 right-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2 shadow-lg">
                                    <Icons.Error />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 우측: CSV 출력 (main-content와 동일한 스타일) */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">CSV 출력</span>
                            </div>
                            
                            {parsedData && (
                                <div className="ml-auto mr-4 my-auto flex items-center gap-3">
                                    <span className="text-xs text-slate-500">미리보기:</span>
                                    <select
                                        value={previewRows}
                                        onChange={handlePreviewRowsChange}
                                        className="bg-slate-800/60 text-slate-200 text-sm px-3 py-1.5 rounded-lg border border-slate-600/30 outline-none hover:border-brand-500/50 transition-colors"
                                    >
                                        <option value={5}>5행</option>
                                        <option value={10}>10행</option>
                                        <option value={20}>20행</option>
                                        <option value={50}>50행</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-hidden bg-[#0d1117]">
                            {csvOutput ? (
                                <div className="h-full flex flex-col">
                                    {/* 데이터 정보 */}
                                    <div className="p-3 border-b border-slate-800/50 bg-gradient-to-r from-slate-800/20 to-transparent flex items-center gap-6 text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className="text-slate-500">총</span>
                                            <span className="text-brand-400 font-bold text-lg">{parsedData.length}</span>
                                            <span className="text-slate-500">행</span>
                                        </span>
                                        <span className="text-slate-700">|</span>
                                        <span className="flex items-center gap-2">
                                            <span className="text-slate-500">컬럼</span>
                                            <span className="text-brand-400 font-bold text-lg">{parsedData.length > 0 ? Object.keys(parsedData[0]).length : 0}</span>
                                        </span>
                                    </div>
                                    
                                    {/* CSV 미리보기 */}
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-800/80 backdrop-blur-sm">
                                                <tr>
                                                    {parsedData.length > 0 && Object.keys(parsedData[0]).map((key, idx) => (
                                                        <th 
                                                            key={idx} 
                                                            className="py-3 px-4 text-xs font-bold text-brand-400 border-b border-slate-700/50 whitespace-nowrap bg-transparent"
                                                        >
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.slice(0, previewRows).map((row, rowIdx) => (
                                                    <tr 
                                                        key={rowIdx} 
                                                        className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                                                    >
                                                        {Object.values(row).map((val, valIdx) => (
                                                            <td 
                                                                key={valIdx} 
                                                                className="py-3 px-4 text-sm text-slate-300 font-mono whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                                                                title={String(val)}
                                                            >
                                                                {val === null ? (
                                                                    <span className="text-slate-600 italic">null</span>
                                                                ) : val === '' ? (
                                                                    <span className="text-slate-600 italic">empty</span>
                                                                ) : (
                                                                    String(val)
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        
                                        {parsedData.length > previewRows && (
                                            <div className="p-3 text-center text-sm text-slate-500">
                                                ... 외 <span className="text-brand-400 font-semibold">{parsedData.length - previewRows}</span>행
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* 원본 CSV 텍스트 */}
                                    <div className="border-t border-slate-700/30 p-3 bg-slate-900/30">
                                        <details className="group">
                                            <summary className="cursor-pointer text-xs text-slate-500 hover:text-brand-400 flex items-center gap-2 transition-colors">
                                                <Icons.ChevronDown />
                                                CSV 원본 텍스트 보기
                                            </summary>
                                            <textarea
                                                className="w-full mt-3 h-32 bg-slate-950 text-slate-300 p-3 font-mono text-xs rounded-lg border border-slate-700/30 resize-none outline-none custom-scrollbar"
                                                value={csvOutput}
                                                readOnly
                                            />
                                        </details>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500">변환된 CSV가 여기에 표시됩니다</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default JsonToCsvConverter;
