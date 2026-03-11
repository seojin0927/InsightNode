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

const JsonFormatterPage = () => {
    const [input, setInput] = useState('');
    const [indent, setIndent] = useState(2);
    const [sortKeys, setSortKeys] = useState(false);
    const [copied, setCopied] = useState(false);
    const [fileName, setFileName] = useState('');

    const { formatted, minified, error, info } = useMemo(() => {
        if (!input.trim()) return { formatted: '', minified: '', error: null, info: null };
        try {
            const parsed = JSON.parse(input);
            const sorted = sortKeys ? JSON.parse(JSON.stringify(parsed, Object.keys(parsed).sort())) : parsed;
            const str = JSON.stringify(sorted, null, indent);
            const min = JSON.stringify(sorted);
            const lines = str.split('\n').length;
            const size = new Blob([str]).size;
            return { formatted: str, minified: min, error: null, info: { lines, size, keys: Object.keys(parsed).length } };
        } catch (e) {
            return { formatted: '', minified: '', error: e.message, info: null };
        }
    }, [input, indent, sortKeys]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setInput(event.target.result);
            setFileName(file.name);
        };
        reader.readAsText(file);
    };

    const copy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    };

    const handleDownload = (content, ext = 'json') => {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName ? fileName.replace(/\.[^.]+$/, `.${ext}`) : `formatted.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadSample = () => {
        setInput(SAMPLE_JSON);
        setFileName('sample.json');
    };

    const reset = () => {
        setInput('');
        setFileName('');
    };

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                        <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">JSON Formatter</h2>
                        <p className="text-xs text-slate-500">포맷, 압축, 키 정렬, 들여쓰기 조절</p>
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
                {/* Left: Options + Input */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Input Source</h3>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700/30 transition-colors mb-3">
                                <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                <span className="mt-2 text-xs text-slate-400">JSON 파일 업로드</span>
                                <input type="file" className="hidden" accept=".json,.jsonl" onChange={handleFileUpload} />
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="JSON 텍스트를 여기에 붙여넣으세요..."
                                className="w-full h-40 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none focus:border-green-500 outline-none custom-scrollbar"
                            />
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Options</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    {[2, 4].map((i) => (
                                        <button
                                            key={i}
                                            onClick={() => setIndent(i)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${indent === i ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            들여쓰기 {i}
                                        </button>
                                    ))}
                                </div>
                                <label className="flex items-center justify-between text-xs text-slate-300 p-2 rounded cursor-pointer">
                                    <span>키 정렬 (Sort Keys)</span>
                                    <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} className="accent-green-500" />
                                </label>
                            </div>
                        </div>

                        {info && (
                            <div className="mt-auto bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Statistics</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="text-slate-400">줄 수: <span className="text-white">{info.lines}</span></div>
                                    <div className="text-slate-400">용량: <span className="text-white">{info.size}B</span></div>
                                    <div className="text-slate-400">최상위 키: <span className="text-white">{info.keys}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Result */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => copy(formatted)}
                                    disabled={!formatted}
                                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    {copied ? '복사됨' : '복사'}
                                </button>
                                <button
                                    onClick={() => copy(minified)}
                                    disabled={!minified}
                                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    압축 복사
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(formatted)}
                                    disabled={!formatted}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    Download
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-700 overflow-hidden relative">
                            {error ? (
                                <div className="h-full flex items-center justify-center text-red-400 flex-col gap-2 p-4">
                                    <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <span>{error}</span>
                                </div>
                            ) : !formatted ? (
                                <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-2">
                                    <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    <span className="text-xs">JSON을 입력하면 포맷됩니다</span>
                                </div>
                            ) : (
                                <textarea
                                    readOnly
                                    value={formatted}
                                    className="w-full h-full bg-transparent text-slate-300 p-4 font-mono text-xs resize-none outline-none custom-scrollbar leading-relaxed whitespace-pre"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonFormatterPage;
