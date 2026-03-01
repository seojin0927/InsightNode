import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const JsonToCsvConverter = () => {
    // === 상태 관리 ===
    const [jsonInput, setJsonInput] = useState('');
    const [csvOutput, setCsvOutput] = useState('');
    const [parsedData, setParsedData] = useState(null); // 초기값 null
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    
    // UI 상태
    const [activeTab, setActiveTab] = useState('raw'); // raw, preview
    const [isConverting, setIsConverting] = useState(false);

    // 변환 옵션
    const [options, setOptions] = useState({
        delimiter: ',',
        header: true,
        addBOM: true, // 엑셀 호환
        flatten: false, // 중첩 객체 평탄화
    });

    // 통계 정보 (초기값을 0으로 설정하여 null 참조 방지)
    const [stats, setStats] = useState({
        totalRows: 0,
        totalColumns: 0,
        dataSize: 0,
        processingTime: 0,
    });

    // === 유틸리티: 객체 평탄화 (Flatten) ===
    const flattenObject = (obj, prefix = '', res = {}) => {
        for (const key in obj) {
            const val = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                flattenObject(val, newKey, res);
            } else {
                res[newKey] = val;
            }
        }
        return res;
    };

    // === 핵심: 변환 엔진 ===
    const processConversion = useCallback(() => {
        if (!jsonInput) {
            setParsedData(null);
            setCsvOutput('');
            setStats({ totalRows: 0, totalColumns: 0, dataSize: 0, processingTime: 0 });
            return;
        }

        setIsConverting(true);
        const startTime = performance.now();

        try {
            // 1. JSON 파싱
            let data;
            try {
                data = JSON.parse(jsonInput);
            } catch {
                // JSON Lines 지원 시도
                const lines = jsonInput.trim().split('\n');
                data = lines.map(line => JSON.parse(line));
            }

            // 배열로 정규화
            if (!Array.isArray(data)) data = [data];

            // 2. 평탄화 (Flatten) 적용
            if (options.flatten) {
                data = data.map(item => flattenObject(item));
            }

            // 파싱된 데이터 상태 업데이트
            setParsedData(data); 

            // 3. CSV 변환 (PapaParse)
            const csv = Papa.unparse(data, {
                delimiter: options.delimiter,
                header: options.header,
            });

            // 4. BOM 추가 (한글 깨짐 방지)
            const finalCsv = options.addBOM ? '\uFEFF' + csv : csv;
            setCsvOutput(finalCsv);

            const endTime = performance.now();
            
            // 통계 업데이트 (데이터가 있을 때만 계산)
            setStats({
                totalRows: data.length,
                totalColumns: data.length > 0 ? Object.keys(data[0]).length : 0,
                dataSize: new Blob([finalCsv]).size,
                processingTime: endTime - startTime
            });
            setError('');

        } catch (err) {
            console.error(err);
            setError('JSON 파싱 오류: 올바른 JSON 형식이 아닙니다.');
            setParsedData(null);
            setCsvOutput('');
        } finally {
            setIsConverting(false);
        }
    }, [jsonInput, options]);

    // 옵션 변경 시 자동 변환 (Debounce)
    useEffect(() => {
        const timer = setTimeout(() => processConversion(), 500); 
        return () => clearTimeout(timer);
    }, [processConversion]);

    // === 파일 처리 ===
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setJsonInput(event.target.result);
            setFileName(file.name);
        };
        reader.readAsText(file);
    };

    const loadSampleData = () => {
        const sample = [
            { id: 1, name: "홍길동", info: { city: "Seoul", age: 30 }, skills: ["React", "JS"] },
            { id: 2, name: "Jane", info: { city: "New York", age: 25 }, skills: ["Design"] },
            { id: 3, name: "Yuki", info: { city: "Tokyo", age: 28 }, skills: ["Java"] }
        ];
        setJsonInput(JSON.stringify(sample, null, 2));
        setFileName('sample_data.json');
    };

    // 다운로드
    const handleDownload = () => {
        if (!csvOutput) return;
        const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName ? fileName.replace('.json', '.csv') : 'converted.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                        <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">JSON to CSV Master</h2>
                        <p className="text-slate-400 text-sm">중첩 데이터 평탄화 및 대용량 변환 지원</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={loadSampleData} className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30 transition-all">
                        샘플 데이터
                    </button>
                    <button onClick={() => { setJsonInput(''); setCsvOutput(''); setParsedData(null); }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30 transition-all">
                        초기화
                    </button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 설정 및 입력 (Col 4) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar">
                        
                        {/* 파일 입력 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Input Source</h3>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700/30 transition-colors mb-3">
                                <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                <span className="mt-2 text-xs text-slate-400">JSON 파일 업로드</span>
                                <input type="file" className="hidden" accept=".json,.jsonl" onChange={handleFileUpload} />
                            </label>
                            <textarea 
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder='또는 JSON 텍스트를 여기에 직접 붙여넣으세요...'
                                className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none focus:border-green-500 outline-none custom-scrollbar"
                            />
                        </div>

                        {/* 옵션 설정 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Options</h3>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between text-xs text-slate-300 bg-slate-700/30 p-2 rounded cursor-pointer hover:bg-slate-700/50">
                                    <span>Flatten Objects (평탄화)</span>
                                    <input type="checkbox" checked={options.flatten} onChange={(e) => setOptions({...options, flatten: e.target.checked})} className="accent-green-500" />
                                </label>
                                <label className="flex items-center justify-between text-xs text-slate-300 bg-slate-700/30 p-2 rounded cursor-pointer hover:bg-slate-700/50">
                                    <span>BOM 추가 (Excel 호환)</span>
                                    <input type="checkbox" checked={options.addBOM} onChange={(e) => setOptions({...options, addBOM: e.target.checked})} className="accent-green-500" />
                                </label>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">구분자 (Delimiter)</label>
                                    <select 
                                        value={options.delimiter}
                                        onChange={(e) => setOptions({...options, delimiter: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-white outline-none"
                                    >
                                        <option value=",">Comma (,)</option>
                                        <option value=";">Semicolon (;)</option>
                                        <option value="|">Pipe (|)</option>
                                        <option value="\t">Tab</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 통계 (오류 발생 지점 수정됨: stats는 초기값이 있으므로 안전함) */}
                        <div className="mt-auto bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Statistics</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-slate-400">Rows: <span className="text-white">{stats.totalRows.toLocaleString()}</span></div>
                                <div className="text-slate-400">Cols: <span className="text-white">{stats.totalColumns}</span></div>
                                <div className="text-slate-400">Time: <span className="text-green-400">{stats.processingTime.toFixed(2)}ms</span></div>
                                <div className="text-slate-400">Size: <span className="text-white">{(stats.dataSize/1024).toFixed(1)}KB</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 우측: 결과 (Col 8) */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setActiveTab('raw')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'raw' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                >
                                    CSV Raw Text
                                </button>
                                <button 
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'preview' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                >
                                    Table Preview
                                </button>
                            </div>
                            
                            <button 
                                onClick={handleDownload}
                                disabled={!csvOutput}
                                className="flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                Download CSV
                            </button>
                        </div>

                        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-700 overflow-hidden relative">
                            {error ? (
                                <div className="h-full flex items-center justify-center text-red-400 flex-col gap-2">
                                    <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <span>{error}</span>
                                </div>
                            ) : !csvOutput ? (
                                <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-2">
                                    <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    <span className="text-xs">JSON을 입력하면 자동으로 변환됩니다</span>
                                </div>
                            ) : activeTab === 'raw' ? (
                                <textarea 
                                    readOnly
                                    value={csvOutput}
                                    className="w-full h-full bg-transparent text-slate-300 p-4 font-mono text-xs resize-none outline-none custom-scrollbar leading-relaxed whitespace-pre"
                                />
                            ) : (
                                <div className="h-full overflow-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-900 sticky top-0">
                                            <tr>
                                                {/* 핵심 수정: Optional Chaining 사용 */}
                                                {parsedData && parsedData.length > 0 && Object.keys(parsedData[0]).map((key) => (
                                                    <th key={key} className="p-3 border-b border-slate-700 text-green-400 font-mono whitespace-nowrap bg-slate-900">
                                                        {key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-300 font-mono">
                                            {/* 핵심 수정: parsedData가 null일 경우 안전하게 처리 */}
                                            {parsedData?.slice(0, 50).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/50 border-b border-slate-800/50">
                                                    {Object.values(row).map((val, vIdx) => (
                                                        <td key={vIdx} className="p-3 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default JsonToCsvConverter;