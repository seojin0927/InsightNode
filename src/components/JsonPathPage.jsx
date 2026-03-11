import React, { useState, useMemo } from 'react';

const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const SAMPLE_JSON = `{
  "name": "Alice",
  "age": 30,
  "city": "Seoul",
  "hobbies": ["reading", "coding"],
  "address": {
    "street": "123 Main St",
    "zip": "12345"
  }
}`;

const EXAMPLE_PATHS = ['$.name', '$.age', '$.hobbies[0]', '$.address.city', '$.address.zip', '$.hobbies', '$.address'];

const JsonPathPage = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [pathExpr, setPathExpr] = useState('');
    const [copied, setCopied] = useState(false);

    const result = useMemo(() => {
        if (!jsonInput.trim() || !pathExpr.trim()) return null;
        try {
            const obj = JSON.parse(jsonInput);
            const keys = pathExpr.replace(/^\$\.?/, '').split(/[\.\[\]]+/).filter(Boolean);
            let cur = obj;
            for (const k of keys) {
                if (cur === null || cur === undefined) return { value: undefined, error: null };
                cur = cur[isNaN(k) ? k : Number(k)];
            }
            return { value: cur, error: null };
        } catch (e) {
            return { value: null, error: e.message };
        }
    }, [jsonInput, pathExpr]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setJsonInput(event.target.result);
        reader.readAsText(file);
    };

    const copy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    };

    const loadSample = () => {
        setJsonInput(SAMPLE_JSON);
        setPathExpr('$.name');
    };

    const reset = () => {
        setJsonInput('');
        setPathExpr('');
    };

    const resultStr = result ? (result.error ? null : JSON.stringify(result.value, null, 2)) : null;

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                        <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">JSON Path Tester</h2>
                        <p className="text-xs text-slate-500">JSONPath 표현식으로 값 추출</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadSample} className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30 transition-all">
                        샘플 데이터
                    </button>
                    <button onClick={reset} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30 transition-all">
                        초기화
                    </button>
                </div>
            </div>

            {/* Main 2-column */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Left: Path + JSON Input */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">JSON Path 표현식</h3>
                            <input
                                value={pathExpr}
                                onChange={(e) => setPathExpr(e.target.value)}
                                placeholder="$.name 또는 $.hobbies[0]"
                                className="w-full rounded-lg p-3 text-xs text-slate-300 font-mono bg-slate-900 border border-slate-600 focus:border-green-500 outline-none"
                            />
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {EXAMPLE_PATHS.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPathExpr(p)}
                                        className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-mono border border-slate-700 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6 flex-1 min-h-0">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">Input Source</h3>
                            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700/30 transition-colors mb-3">
                                <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                <span className="mt-1 text-xs text-slate-400">JSON 파일 업로드</span>
                                <input type="file" className="hidden" accept=".json,.jsonl" onChange={handleFileUpload} />
                            </label>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder="JSON 데이터를 입력하세요..."
                                className="w-full h-40 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none focus:border-green-500 outline-none custom-scrollbar"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Result */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">추출 결과</span>
                            {resultStr && (
                                <button
                                    onClick={() => copy(resultStr)}
                                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                >
                                    <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    {copied ? '복사됨' : '복사'}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-700 overflow-hidden relative">
                            {!jsonInput.trim() || !pathExpr.trim() ? (
                                <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-2">
                                    <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    <span className="text-xs">JSON과 Path를 입력하면 결과가 표시됩니다</span>
                                </div>
                            ) : result?.error ? (
                                <div className="h-full flex items-center justify-center text-red-400 flex-col gap-2 p-4">
                                    <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <span>{result.error}</span>
                                </div>
                            ) : (
                                <div className="h-full p-4 overflow-y-auto custom-scrollbar">
                                    <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap break-words">
                                        {result?.value === undefined ? '(undefined)' : resultStr}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonPathPage;
