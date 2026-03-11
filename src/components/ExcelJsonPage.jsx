import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const IC = ({ d, cls = 'w-4 h-4' }) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

function copyText(text) {
    navigator.clipboard.writeText(text).catch(() => {});
}

// ── Excel → JSON ──────────────────────────────────
function ExcelToJson() {
    const [sheets, setSheets] = useState([]);
    const [allData, setAllData] = useState({});
    const [activeSheet, setActiveSheet] = useState(0);
    const [indent, setIndent] = useState(2);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const fileRef = useRef();

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setError('');
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const data = {};
                wb.SheetNames.forEach(name => {
                    data[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
                });
                setSheets(wb.SheetNames);
                setAllData(data);
                setActiveSheet(0);
            } catch (e) { setError('파일 읽기 실패: ' + e.message); }
        };
        reader.readAsBinaryString(file);
    };

    const currentData = sheets[activeSheet] ? allData[sheets[activeSheet]] : null;
    const json = currentData ? JSON.stringify(currentData, null, indent) : '';

    const download = () => {
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${sheets[activeSheet] || 'sheet'}.json`;
        a.click();
    };

    const handleCopy = () => {
        copyText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex flex-col gap-5">
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer hover:border-violet-500/60 transition-colors gap-3"
                style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-4xl">📗</span>
                <div className="text-center">
                    <div className="text-sm font-semibold text-slate-300">Excel 파일 선택</div>
                    <div className="text-xs text-slate-500 mt-1">.xlsx, .xls 지원 · 드래그 & 드롭</div>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
            </label>

            {error && (
                <div className="px-4 py-3 rounded-xl border text-sm text-rose-400" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>{error}</div>
            )}

            {sheets.length > 0 && (
                <>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">시트</span>
                        <div className="flex gap-1.5 flex-wrap">
                            {sheets.map((s, i) => (
                                <button key={s} onClick={() => setActiveSheet(i)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSheet === i ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-slate-500">들여쓰기</span>
                            {[0, 2, 4].map(v => (
                                <button key={v} onClick={() => setIndent(v)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${indent === v ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                    {v === 0 ? '압' : v}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">{currentData?.length || 0}행 · {currentData?.[0] ? Object.keys(currentData[0]).length : 0}열</span>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, color: copied ? '#34d399' : '#94a3b8' }}>
                                <IC d={copied ? 'M5 13l4 4L19 7' : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'} />
                                {copied ? '복사됨' : '복사'}
                            </button>
                            <button onClick={download} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all">
                                <IC d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                JSON 저장
                            </button>
                        </div>
                    </div>
                    <textarea readOnly value={json} rows={16}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 p-4 text-xs font-mono text-slate-300 outline-none resize-none custom-scrollbar" />
                </>
            )}
        </div>
    );
}

// ── JSON → Excel ──────────────────────────────────
function JsonToExcel() {
    const [input, setInput] = useState('');
    const [sheetName, setSheetName] = useState('Sheet1');
    const [fileName, setFileName] = useState('output');
    const [error, setError] = useState('');

    const parsed = (() => {
        if (!input.trim()) return null;
        try { return JSON.parse(input); } catch { return null; }
    })();

    const download = () => {
        if (!parsed) { setError('JSON 파싱 실패. 배열 형태인지 확인하세요.'); return; }
        if (!Array.isArray(parsed)) { setError('JSON 배열([{...}, ...]) 형태만 지원합니다.'); return; }
        setError('');
        const ws = XLSX.utils.json_to_sheet(parsed);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    };

    return (
        <div className="flex flex-col gap-5">
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">JSON 배열 입력</label>
                    <button onClick={() => setInput(JSON.stringify([{name:'홍길동',age:30,city:'서울'},{name:'이영희',age:25,city:'부산'}], null, 2))}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300">샘플</button>
                </div>
                <textarea value={input} onChange={e => { setInput(e.target.value); setError(''); }} rows={10}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 p-4 text-xs font-mono text-slate-300 outline-none resize-none focus:border-violet-500 transition-colors custom-scrollbar"
                    placeholder='[{"name":"홍길동","age":30},...]' />
            </div>

            {error && <div className="px-4 py-3 rounded-xl border text-sm text-rose-400" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>{error}</div>}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">시트 이름</label>
                    <input value={sheetName} onChange={e => setSheetName(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">파일명 (.xlsx)</label>
                    <input value={fileName} onChange={e => setFileName(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors" />
                </div>
            </div>

            {parsed && Array.isArray(parsed) && (
                <div className="flex gap-4 text-xs text-slate-500 px-1">
                    <span>행 <span className="text-violet-300 font-bold">{parsed.length}</span></span>
                    <span>열 <span className="text-violet-300 font-bold">{parsed[0] ? Object.keys(parsed[0]).length : 0}</span></span>
                </div>
            )}

            <button onClick={download} disabled={!input.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white shadow-lg transition-all flex items-center justify-center gap-2">
                <IC d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                Excel 파일 저장 (.xlsx)
            </button>
        </div>
    );
}

// ── 메인 컴포넌트 ──────────────────────────────────
export default function ExcelJsonPage() {
    const [tab, setTab] = useState('toJson');

    return (
        <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto w-full px-5 py-8 flex flex-col gap-6">
                    {/* 헤더 */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-white/10"
                            style={{ background: 'rgba(139,92,246,0.15)' }}>📗</div>
                        <div>
                            <h1 className="text-xl font-black text-white">Excel ↔ JSON 변환기</h1>
                            <p className="text-sm text-slate-500 mt-0.5">.xlsx / .xls 파일과 JSON 배열을 양방향으로 변환합니다</p>
                        </div>
                    </div>

                    {/* 탭 */}
                    <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 gap-0.5">
                        {[['toJson', '📗 Excel → JSON'], ['toExcel', '📊 JSON → Excel']].map(([id, label]) => (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* 탭 내용 */}
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6">
                        {tab === 'toJson' ? <ExcelToJson /> : <JsonToExcel />}
                    </div>

                    {/* 안내 */}
                    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 text-xs text-slate-500 space-y-1">
                        <div className="text-slate-400 font-semibold mb-2">💡 사용 팁</div>
                        <div>• Excel → JSON: 첫 번째 행을 자동으로 키(column header)로 인식합니다</div>
                        <div>• 여러 시트가 있는 경우 각 시트를 개별적으로 변환할 수 있습니다</div>
                        <div>• JSON → Excel: JSON 배열([&#123;...&#125;]) 형태만 지원합니다</div>
                        <div>• 모든 처리는 브라우저 내에서만 이루어지며 서버로 파일이 전송되지 않습니다</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
