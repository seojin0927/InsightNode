import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

const IC = ({ d, cls = 'w-4 h-4' }) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

function downloadCsv(data, filename) {
    const csv = Papa.unparse(data);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function readCsvFile(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true, dynamicTyping: true, skipEmptyLines: true,
            complete: (r) => resolve({ name: file.name, data: r.data, fields: r.meta.fields }),
            error: reject,
        });
    });
}

// ── CSV 병합 ──────────────────────────────────────
function CsvMerge() {
    const [files, setFiles] = useState([]);
    const [strategy, setStrategy] = useState('union');
    const [merging, setMerging] = useState(false);
    const [result, setResult] = useState(null);
    const fileRef = useRef();

    const handleFiles = async (e) => {
        const selected = Array.from(e.target.files);
        if (!selected.length) return;
        setResult(null);
        const parsed = await Promise.all(selected.map(readCsvFile));
        setFiles(prev => [...prev, ...parsed]);
        e.target.value = '';
    };

    const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

    const merge = () => {
        if (!files.length) return;
        setMerging(true);
        setTimeout(() => {
            try {
                let allFields = [];
                files.forEach(f => {
                    f.fields.forEach(field => {
                        if (!allFields.includes(field)) allFields.push(field);
                    });
                });

                if (strategy === 'intersection') {
                    const commonFields = files.reduce((acc, f) => acc.filter(field => f.fields.includes(field)), [...files[0].fields]);
                    allFields = commonFields;
                }

                const merged = files.flatMap(f =>
                    f.data.map(row => {
                        const newRow = {};
                        allFields.forEach(field => { newRow[field] = row[field] ?? ''; });
                        return newRow;
                    })
                );
                setResult({ data: merged, fields: allFields });
            } catch (e) { alert('병합 실패: ' + e.message); }
            setMerging(false);
        }, 100);
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:border-violet-500/50 transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
                onClick={() => fileRef.current?.click()}>
                <div className="text-3xl mb-2">📂</div>
                <div className="text-sm font-semibold text-slate-300">CSV 파일 선택 (여러 개 가능)</div>
                <div className="text-xs text-slate-500 mt-1">클릭하거나 파일을 드래그하세요</div>
                <input ref={fileRef} type="file" accept=".csv" multiple className="hidden" onChange={handleFiles} />
            </div>

            {files.length > 0 && (
                <>
                    <div className="space-y-2">
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">선택된 파일 ({files.length}개)</div>
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-base shrink-0">📄</span>
                                    <span className="text-sm text-slate-200 truncate">{f.name}</span>
                                    <span className="text-xs text-slate-500 shrink-0">{f.data.length}행</span>
                                </div>
                                <button onClick={() => removeFile(i)} className="shrink-0 text-slate-500 hover:text-rose-400 transition-colors ml-3">
                                    <IC d="M6 18L18 6M6 6l12 12" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">열 병합 방식</div>
                        <div className="grid grid-cols-2 gap-2">
                            {[['union', '합집합 (모든 열 포함)', '파일마다 없는 열은 빈 값으로'], ['intersection', '교집합 (공통 열만)', '모든 파일에 공통으로 있는 열만']].map(([v, l, d]) => (
                                <button key={v} onClick={() => setStrategy(v)}
                                    className={`text-left p-3 rounded-xl border text-xs transition-all ${strategy === v ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}`}>
                                    <div className={`font-bold ${strategy === v ? 'text-violet-300' : 'text-slate-300'}`}>{l}</div>
                                    <div className="text-slate-500 mt-0.5">{d}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={merge} disabled={merging}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white shadow-lg transition-all flex items-center justify-center gap-2">
                        <IC d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        {merging ? '병합 중...' : 'CSV 병합하기'}
                    </button>

                    {result && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-emerald-300">
                                    병합 완료: {result.data.length}행 · {result.fields.length}열
                                </div>
                                <button onClick={() => downloadCsv(result.data, 'merged.csv')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
                                    <IC d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    저장
                                </button>
                            </div>
                            <div className="text-xs text-emerald-400/70">열: {result.fields.slice(0, 8).join(', ')}{result.fields.length > 8 ? ` ...외 ${result.fields.length - 8}개` : ''}</div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── CSV 분할 ──────────────────────────────────────
function CsvSplit() {
    const [fileData, setFileData] = useState(null);
    const [splitBy, setSplitBy] = useState('rows');
    const [rowCount, setRowCount] = useState(500);
    const [splitCol, setSplitCol] = useState('');
    const [preview, setPreview] = useState(null);
    const fileRef = useRef();

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPreview(null);
        const parsed = await readCsvFile(file);
        setFileData(parsed);
        if (parsed.fields.length > 0) setSplitCol(parsed.fields[0]);
        e.target.value = '';
    };

    const split = () => {
        if (!fileData) return;
        let chunks = [];

        if (splitBy === 'rows') {
            for (let i = 0; i < fileData.data.length; i += rowCount) {
                chunks.push({ name: `part_${Math.floor(i / rowCount) + 1}`, data: fileData.data.slice(i, i + rowCount) });
            }
        } else {
            const groups = {};
            fileData.data.forEach(row => {
                const key = String(row[splitCol] ?? '_unknown');
                if (!groups[key]) groups[key] = [];
                groups[key].push(row);
            });
            chunks = Object.entries(groups).map(([k, data]) => ({ name: k.replace(/[\\/:*?"<>|]/g, '_'), data }));
        }

        setPreview(chunks);
    };

    const downloadAll = () => {
        if (!preview) return;
        preview.forEach((chunk, i) => {
            setTimeout(() => downloadCsv(chunk.data, `${chunk.name}.csv`), i * 200);
        });
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:border-sky-500/50 transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
                onClick={() => fileRef.current?.click()}>
                <div className="text-3xl mb-2">✂️</div>
                <div className="text-sm font-semibold text-slate-300">
                    {fileData ? fileData.name : 'CSV 파일 선택'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                    {fileData ? `${fileData.data.length}행 · ${fileData.fields.length}열` : '클릭하거나 파일을 드래그하세요'}
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>

            {fileData && (
                <>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">분할 기준</div>
                        <div className="grid grid-cols-2 gap-2">
                            {[['rows', '행 수 기준', '지정한 행 수마다 파일 분리'], ['column', '열 값 기준', '특정 열의 고유 값마다 파일 분리']].map(([v, l, d]) => (
                                <button key={v} onClick={() => setSplitBy(v)}
                                    className={`text-left p-3 rounded-xl border text-xs transition-all ${splitBy === v ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}`}>
                                    <div className={`font-bold ${splitBy === v ? 'text-sky-300' : 'text-slate-300'}`}>{l}</div>
                                    <div className="text-slate-500 mt-0.5">{d}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {splitBy === 'rows' ? (
                        <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                <span className="font-semibold uppercase">파일당 최대 행 수</span>
                                <span className="text-sky-300 font-mono">{rowCount}행 → 약 {Math.ceil(fileData.data.length / rowCount)}개 파일</span>
                            </div>
                            <input type="range" min={100} max={Math.max(100, fileData.data.length)} step={100} value={rowCount} onChange={e => setRowCount(Number(e.target.value))}
                                className="w-full accent-sky-500 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer" />
                            <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>100</span><span>{Math.max(100, fileData.data.length)}</span></div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">기준 열 선택</div>
                            <select value={splitCol} onChange={e => setSplitCol(e.target.value)}
                                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500">
                                {fileData.fields.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                    )}

                    <button onClick={split}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition-all flex items-center justify-center gap-2">
                        <IC d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        CSV 분할하기
                    </button>

                    {preview && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-sky-300">{preview.length}개 파일로 분할됨</span>
                                <button onClick={downloadAll}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all">
                                    <IC d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    전체 저장
                                </button>
                            </div>
                            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1.5">
                                {preview.map((chunk, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-700/60 bg-slate-800/40">
                                        <span className="text-xs text-slate-300 font-mono">{chunk.name}.csv</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500">{chunk.data.length}행</span>
                                            <button onClick={() => downloadCsv(chunk.data, `${chunk.name}.csv`)}
                                                className="text-xs font-bold text-sky-400 hover:text-sky-300">저장</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── 메인 컴포넌트 ──────────────────────────────────
export default function CsvMergeSplitPage() {
    const [tab, setTab] = useState('merge');

    return (
        <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto w-full px-5 py-8 flex flex-col gap-6">
                    {/* 헤더 */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-white/10"
                            style={{ background: 'rgba(14,165,233,0.15)' }}>🗃️</div>
                        <div>
                            <h1 className="text-xl font-black text-white">CSV 병합 / 분할</h1>
                            <p className="text-sm text-slate-500 mt-0.5">여러 CSV를 하나로 합치거나, 하나의 CSV를 여러 파일로 나눕니다</p>
                        </div>
                    </div>

                    {/* 탭 */}
                    <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 gap-0.5">
                        {[['merge', '🔗 CSV 병합'], ['split', '✂️ CSV 분할']].map(([id, label]) => (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === id ? (id === 'merge' ? 'bg-violet-600' : 'bg-sky-600') + ' text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* 탭 내용 */}
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6">
                        {tab === 'merge' ? <CsvMerge /> : <CsvSplit />}
                    </div>

                    {/* 안내 */}
                    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 text-xs text-slate-500 space-y-1">
                        <div className="text-slate-400 font-semibold mb-2">💡 사용 팁</div>
                        <div>• 병합 (합집합): 파일마다 없는 열은 빈 값으로 채워집니다</div>
                        <div>• 병합 (교집합): 모든 파일에 공통으로 있는 열만 유지됩니다</div>
                        <div>• 분할 (행 수): 지정한 행 수마다 새로운 파일로 나뉩니다 (part_1, part_2, ...)</div>
                        <div>• 분할 (열 값): 특정 열의 고유 값마다 별도 파일로 저장됩니다 (예: 지역별 분리)</div>
                        <div>• BOM(UTF-8) 인코딩으로 저장되어 Excel에서 한글이 깨지지 않습니다</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
