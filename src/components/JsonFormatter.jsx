import React, { useState, useCallback, useEffect } from 'react';

const JsonStudio = () => {
    // === 상태 관리 ===
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState('code'); // code, tree, convert
    const [convertType, setConvertType] = useState('xml'); // xml, yaml, csv
    const [isValid, setIsValid] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [stats, setStats] = useState(null);
    const [jsonPath, setJsonPath] = useState(''); // 검색 필터

    // === 유틸리티 함수 ===
    const safeParse = (str) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    };

    // === 핵심 기능 로직 ===
    
    // 1. 포맷팅 & 정렬 (Beautify)
    const handleBeautify = useCallback(() => {
        const parsed = safeParse(input);
        if (parsed) {
            setOutput(JSON.stringify(parsed, null, 4)); // 4칸 들여쓰기
            setIsValid(true);
            setErrorMsg('');
            analyzeJson(parsed);
        } else {
            setIsValid(false);
            setErrorMsg('Invalid JSON format');
        }
    }, [input]);

    // 2. 최소화 (Minify)
    const handleMinify = useCallback(() => {
        const parsed = safeParse(input);
        if (parsed) {
            setOutput(JSON.stringify(parsed));
            setIsValid(true);
        } else {
            setIsValid(false);
            setErrorMsg('Invalid JSON format');
        }
    }, [input]);

    // 3. 키 정렬 (Sort Keys)
    const handleSortKeys = useCallback(() => {
        const parsed = safeParse(input);
        if (!parsed) return;

        const sortObject = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj;
            if (Array.isArray(obj)) return obj.map(sortObject);
            return Object.keys(obj).sort().reduce((acc, key) => {
                acc[key] = sortObject(obj[key]);
                return acc;
            }, {});
        };

        const sorted = sortObject(parsed);
        setOutput(JSON.stringify(sorted, null, 4));
        setInput(JSON.stringify(sorted, null, 4)); // 입력창도 업데이트
    }, [input]);

    // 4. 변환 (Converter) - 간이 구현
    const handleConvert = useCallback(() => {
        const parsed = safeParse(input);
        if (!parsed) {
            setOutput('Invalid JSON');
            return;
        }

        let res = '';
        if (convertType === 'xml') {
            // Simple XML Converter
            const toXml = (obj) => Object.keys(obj).map(k => {
                return `<${k}>${typeof obj[k] === 'object' ? toXml(obj[k]) : obj[k]}</${k}>`;
            }).join('');
            res = `<root>${toXml(parsed)}</root>`;
        } else if (convertType === 'yaml') {
            // Simple YAML Style
            res = JSON.stringify(parsed, null, 2).replace(/[{},"]/g, '').replace(/:/g, ': ');
        } else if (convertType === 'csv') {
            // Array of Objects only
            if (Array.isArray(parsed) && parsed.length > 0) {
                const keys = Object.keys(parsed[0]);
                res = keys.join(',') + '\n' + parsed.map(o => keys.map(k => o[k]).join(',')).join('\n');
            } else {
                res = 'CSV conversion requires an array of objects.';
            }
        }
        setOutput(res);
        setMode('convert');
    }, [input, convertType]);

    // 5. 타입 정의 생성 (TypeScript)
    const generateTypes = useCallback(() => {
        const parsed = safeParse(input);
        if (!parsed) return;

        // 아주 간단한 TS Interface 생성기
        const getType = (v) => Array.isArray(v) ? 'any[]' : typeof v;
        const keys = Object.keys(parsed);
        const types = keys.map(k => `  ${k}: ${getType(parsed[k])};`).join('\n');
        setOutput(`interface GeneratedType {\n${types}\n}`);
        setMode('convert'); // 출력창 사용
    }, [input]);

    // 6. JSONPath 필터링 (Mock)
    const applyJsonPath = useCallback(() => {
        if (!jsonPath) return;
        const parsed = safeParse(input);
        if (!parsed) return;
        
        try {
            // 실제 구현 시 jsonpath 라이브러리 사용 권장
            // 여기서는 간단히 최상위 키 검색만 지원
            if (jsonPath.startsWith('$.')) {
                const key = jsonPath.replace('$.', '');
                const result = parsed[key];
                setOutput(JSON.stringify(result, null, 4));
            } else {
                setOutput('Only simple path ($.key) supported in demo.');
            }
        } catch(e) { setOutput('Path Error'); }
    }, [input, jsonPath]);

    // 7. 분석기 (Analyzer)
    const analyzeJson = (obj) => {
        const str = JSON.stringify(obj);
        setStats({
            size: str.length,
            keys: (str.match(/"[^"]+":/g) || []).length,
            depth: (str.match(/\{/g) || []).length // 대략적 깊이
        });
    };

    // 8. 파일 로드
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            setInput(e.target.result);
            handleBeautify(); // 자동 포맷팅
        };
        reader.readAsText(file);
    };

    // 초기화
    const clearAll = () => {
        setInput('');
        setOutput('');
        setStats(null);
        setIsValid(true);
        setErrorMsg('');
    };

    // 샘플 로드
    useEffect(() => {
        if (!input) {
            setInput(JSON.stringify({
                "project": "VaultSheet",
                "version": 2.0,
                "features": ["JSON", "XML", "YAML"],
                "active": true,
                "meta": { "author": "User", "created": "2024-01-01" }
            }, null, 4));
        }
    }, []);

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">JSON Master Studio</h2>
                        <p className="text-slate-400 text-sm">정렬, 검증, 변환, 타입 생성까지 완벽하게</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        JSON 열기
                        <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button onClick={clearAll} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-500/30">
                        초기화
                    </button>
                </div>
            </div>

            {/* 2. 툴바 (기능 버튼 모음) */}
            <div className="bg-slate-800 p-2 rounded-xl mb-4 flex flex-wrap gap-2 items-center justify-between flex-shrink-0">
                <div className="flex gap-2">
                    <button onClick={handleBeautify} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">Beautify (정렬)</button>
                    <button onClick={handleMinify} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors">Minify (압축)</button>
                    <button onClick={handleSortKeys} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors">Sort Keys</button>
                    <button onClick={generateTypes} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors">TS Types</button>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400 font-bold">Convert to:</span>
                    {['xml', 'yaml', 'csv'].map(type => (
                        <button 
                            key={type}
                            onClick={() => { setConvertType(type); setTimeout(handleConvert, 0); }}
                            className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors ${convertType === type ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. 검색 바 (JSONPath) */}
            <div className="mb-4 flex gap-2 flex-shrink-0">
                <input 
                    type="text" 
                    value={jsonPath}
                    onChange={(e) => setJsonPath(e.target.value)}
                    placeholder="JSONPath 검색 (예: $.features)" 
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                />
                <button onClick={applyJsonPath} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold">
                    검색
                </button>
            </div>

            {/* 4. 메인 에디터 (Grid Layout - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* 좌측: 입력 */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-sm font-semibold text-slate-400">Input JSON</span>
                        <span className={`text-xs ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                            {isValid ? 'Valid JSON' : errorMsg}
                        </span>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="{ ... }"
                        className={`flex-1 w-full bg-slate-800 text-slate-200 p-4 rounded-xl border ${isValid ? 'border-slate-700 focus:border-emerald-500' : 'border-red-500/50 focus:border-red-500'} focus:outline-none font-mono text-sm resize-none shadow-inner custom-scrollbar`}
                        spellCheck="false"
                    />
                </div>

                {/* 우측: 출력 */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-sm font-semibold text-emerald-500">
                            {mode === 'convert' ? `Output (${convertType.toUpperCase()})` : 'Formatted Output'}
                        </span>
                        <button 
                            onClick={() => { navigator.clipboard.writeText(output); alert('Copied!'); }}
                            disabled={!output}
                            className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
                        >
                            복사하기
                        </button>
                    </div>
                    <textarea
                        value={output}
                        readOnly
                        placeholder="Result..."
                        className="flex-1 w-full bg-slate-950 text-emerald-50 text-opacity-90 p-4 rounded-xl border border-slate-800 focus:outline-none font-mono text-sm resize-none shadow-inner custom-scrollbar"
                    />
                </div>
            </div>

            {/* 5. 하단 통계 정보 */}
            {stats && (
                <div className="mt-4 grid grid-cols-3 gap-4 flex-shrink-0">
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                        <span className="text-xs text-slate-500">데이터 크기</span>
                        <span className="text-sm font-bold text-slate-200">{stats.size.toLocaleString()} B</span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                        <span className="text-xs text-slate-500">총 키(Key) 개수</span>
                        <span className="text-sm font-bold text-emerald-400">{stats.keys} 개</span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                        <span className="text-xs text-slate-500">구조 깊이(Depth)</span>
                        <span className="text-sm font-bold text-indigo-400">~{stats.depth} Level</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JsonStudio;