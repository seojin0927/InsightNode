import React, { useState, useMemo } from 'react';

const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const SAMPLE_JSON = `[
  {"id": 1, "name": "Alice", "age": 30, "city": "Seoul"},
  {"id": 2, "name": "Bob", "age": 25, "city": "New York"},
  {"id": 3, "name": "Charlie", "age": 28, "city": "Tokyo"}
]`;

const JsonToSqlPage = () => {
    const [input, setInput] = useState('');
    const [tableName, setTableName] = useState('my_table');
    const [mode, setMode] = useState('insert'); // insert | create
    const [fileName, setFileName] = useState('');
    const [copied, setCopied] = useState(false);

    const result = useMemo(() => {
        if (!input.trim()) return { text: '', error: null };
        try {
            const arr = JSON.parse(input);
            const rows = Array.isArray(arr) ? arr : [arr];
            if (!rows.length) return { text: '', error: null };

            if (mode === 'insert') {
                const cols = Object.keys(rows[0]);
                const vals = rows.map(r =>
                    `  (${cols.map(c =>
                        r[c] === null ? 'NULL' :
                        typeof r[c] === 'string' ? `'${String(r[c]).replace(/'/g, "''")}'` :
                        typeof r[c] === 'boolean' ? (r[c] ? 'TRUE' : 'FALSE') :
                        r[c]
                    ).join(', ')})`
                ).join(',\n');
                return { text: `INSERT INTO ${tableName}\n  (${cols.join(', ')})\nVALUES\n${vals};`, error: null };
            } else {
                const cols = Object.keys(rows[0]);
                const typeOf = (v) => {
                    if (typeof v === 'number') return Number.isInteger(v) ? 'INT' : 'DECIMAL(10,2)';
                    if (typeof v === 'boolean') return 'BOOLEAN';
                    if (typeof v === 'object' && v !== null) return 'JSON';
                    return 'VARCHAR(255)';
                };
                const defs = cols.map(c => `  ${c} ${typeOf(rows[0][c])}`).join(',\n');
                return { text: `CREATE TABLE ${tableName} (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n${defs}\n);`, error: null };
            }
        } catch (e) {
            return { text: '', error: e.message };
        }
    }, [input, tableName, mode]);

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

    const copy = () => {
        if (!result.text) return;
        navigator.clipboard.writeText(result.text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    };

    const handleDownload = () => {
        if (!result.text) return;
        const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName ? fileName.replace(/\.[^.]+$/, '.sql') : 'output.sql';
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
                        <Icon path="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">JSON → SQL</h2>
                        <p className="text-xs text-slate-500">INSERT SQL / CREATE TABLE 생성</p>
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
                {/* Left: Table name + Mode + Input */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">Mode</h3>
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setMode('insert')}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${mode === 'insert' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    INSERT SQL
                                </button>
                                <button
                                    onClick={() => setMode('create')}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${mode === 'create' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    CREATE TABLE
                                </button>
                            </div>
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">Table Name</h3>
                            <input
                                value={tableName}
                                onChange={(e) => setTableName(e.target.value)}
                                placeholder="테이블명"
                                className="w-full rounded-lg p-3 text-xs text-slate-300 font-mono bg-slate-900 border border-slate-600 focus:border-green-500 outline-none"
                            />
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Input Source</h3>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700/30 transition-colors mb-3">
                                <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                <span className="mt-2 text-xs text-slate-400">JSON 배열 파일 업로드</span>
                                <input type="file" className="hidden" accept=".json,.jsonl" onChange={handleFileUpload} />
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder='[{"id":1,"name":"Alice"},...]'
                                className="w-full h-40 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none focus:border-green-500 outline-none custom-scrollbar"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Result */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SQL 결과</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={copy}
                                    disabled={!result.text}
                                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    {copied ? '복사됨' : '복사'}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={!result.text}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    Download
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-700 overflow-hidden relative">
                            {result.error ? (
                                <div className="h-full flex items-center justify-center text-red-400 flex-col gap-2 p-4">
                                    <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <span>{result.error}</span>
                                </div>
                            ) : !result.text ? (
                                <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-2">
                                    <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    <span className="text-xs">JSON 배열을 입력하면 SQL이 생성됩니다</span>
                                </div>
                            ) : (
                                <textarea
                                    readOnly
                                    value={result.text}
                                    className="w-full h-full bg-transparent text-emerald-400/90 p-4 font-mono text-xs resize-none outline-none custom-scrollbar leading-relaxed whitespace-pre"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonToSqlPage;
