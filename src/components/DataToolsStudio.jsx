import React, { useState, useMemo, useRef } from 'react';
import StudioLayout, { S, CopyBtn } from './StudioLayout';
import * as XLSX from 'xlsx';

const ACCENT = '#8b5cf6';

// ══════════════════════════════════════════════════════════════════
// TAB 1: Excel → JSON 변환
function ExcelToJsonTab() {
    const [data, setData] = useState(null);
    const [sheet, setSheet] = useState(0);
    const [sheets, setSheets] = useState([]);
    const [error, setError] = useState('');
    const fileRef = useRef();

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setError('');
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                setSheets(wb.SheetNames);
                const allSheets = {};
                wb.SheetNames.forEach(name => {
                    allSheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
                });
                setData(allSheets);
                setSheet(0);
            } catch (e) { setError('파일 읽기 실패: ' + e.message); }
        };
        reader.readAsBinaryString(file);
    };

    const currentData = data && sheets[sheet] ? data[sheets[sheet]] : null;
    const json = currentData ? JSON.stringify(currentData, null, 2) : '';

    return (
        <div className="space-y-4">
            <div>
                <label className={S.label}>Excel 파일 선택 (.xlsx / .xls)</label>
                <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-violet-500/50"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
                    onClick={() => fileRef.current?.click()}>
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-sm text-slate-400">클릭하거나 파일을 드래그하세요</div>
                    <div className="text-xs text-slate-600 mt-1">.xlsx, .xls 지원</div>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
                </div>
            </div>
            {error && <div className="text-sm text-red-400 px-4 py-3 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>{error}</div>}
            {data && (
                <>
                    {sheets.length > 1 && (
                        <div>
                            <label className={S.label}>시트 선택</label>
                            <div className="flex gap-2 flex-wrap">
                                {sheets.map((s, i) => (
                                    <button key={s} onClick={() => setSheet(i)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                        style={sheet === i ? { background: `${ACCENT}cc`, color: '#fff' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{currentData?.length || 0}개 행</span>
                        <CopyBtn text={json} label="JSON 복사" />
                    </div>
                    <pre className="text-xs font-mono text-slate-300 p-4 rounded-xl border max-h-96 overflow-auto custom-scrollbar leading-relaxed"
                        style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.07)' }}>
                        {json.slice(0, 10000)}{json.length > 10000 ? '\n... (더 보려면 복사 후 확인)' : ''}
                    </pre>
                </>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 2: CSV 파일 병합
function CsvMergerTab() {
    const [files, setFiles] = useState([]);
    const [headers, setHeaders] = useState('first');
    const [result, setResult] = useState('');
    const fileRef = useRef();

    const handleFiles = async (e) => {
        const newFiles = Array.from(e.target.files);
        const contents = await Promise.all(newFiles.map(f => f.text()));
        setFiles(prev => [...prev, ...newFiles.map((f, i) => ({ name: f.name, content: contents[i] }))]);
    };

    const merge = () => {
        if (files.length === 0) return;
        const parsed = files.map(f => {
            const lines = f.content.trim().split('\n').filter(Boolean);
            return { header: lines[0], rows: lines.slice(1) };
        });
        let merged = '';
        if (headers === 'first') {
            merged = parsed[0].header + '\n';
            parsed.forEach(f => { merged += f.rows.join('\n') + '\n'; });
        } else {
            parsed.forEach(f => { merged += f.header + '\n' + f.rows.join('\n') + '\n'; });
        }
        setResult(merged.trim());
    };

    const totalRows = files.reduce((acc, f) => acc + f.content.trim().split('\n').length - 1, 0);

    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between mb-1.5">
                    <label className={S.label}>CSV 파일 선택 (여러 파일)</label>
                    {files.length > 0 && <button onClick={() => setFiles([])} className="text-xs text-red-400 hover:text-red-300">초기화</button>}
                </div>
                <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-violet-500/50"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
                    onClick={() => fileRef.current?.click()}>
                    <div className="text-3xl mb-2">📂</div>
                    <div className="text-sm text-slate-400">CSV 파일 여러 개 선택</div>
                    <input ref={fileRef} type="file" accept=".csv" multiple className="hidden" onChange={handleFiles} />
                </div>
            </div>
            {files.length > 0 && (
                <>
                    <div className="space-y-1.5">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl border"
                                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                                <span className="text-sm text-slate-300 font-mono truncate flex-1">{f.name}</span>
                                <span className="text-xs text-slate-500 ml-2">{f.content.trim().split('\n').length - 1}행</span>
                                <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="ml-2 text-slate-600 hover:text-red-400 transition-all">✕</button>
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className={S.label}>헤더 처리 방식</label>
                        <div className="flex gap-2">
                            {[['first', '첫 번째 파일 헤더만 사용'], ['all', '모든 파일 헤더 포함']].map(([v, l]) => (
                                <button key={v} onClick={() => setHeaders(v)}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={headers === v ? { background: `${ACCENT}cc`, color: '#fff' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={merge} className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)` }}>
                        {files.length}개 파일 병합 ({totalRows}행)
                    </button>
                </>
            )}
            {result && (
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className={S.label}>병합 결과 (CSV)</label>
                        <div className="flex gap-2">
                            <CopyBtn text={result} />
                            <button onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([result], { type: 'text/csv' })); a.download = 'merged.csv'; a.click(); }}
                                className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all text-slate-300 hover:text-white"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                💾 저장
                            </button>
                        </div>
                    </div>
                    <textarea value={result.slice(0, 5000) + (result.length > 5000 ? '\n...(더 있음)' : '')} readOnly rows={10} className={S.textarea} style={{ background: 'rgba(0,0,0,0.4)' }} />
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 3: JSON Schema 빌더
function SchemaBuilderTab() {
    const SAMPLE = `[{"id": 1, "name": "Alice", "email": "alice@example.com", "age": 30, "active": true}]`;
    const [input, setInput] = useState(SAMPLE);
    const schema = useMemo(() => {
        try {
            const data = JSON.parse(input);
            const arr = Array.isArray(data) ? data : [data];
            if (arr.length === 0) return null;
            const inferType = (val) => {
                if (val === null) return 'null';
                if (Array.isArray(val)) return 'array';
                return typeof val;
            };
            const buildSchema = (obj) => {
                if (Array.isArray(obj)) {
                    return { type: 'array', items: obj.length > 0 ? buildSchema(obj[0]) : {} };
                }
                if (typeof obj === 'object' && obj !== null) {
                    const props = {};
                    const required = [];
                    for (const [k, v] of Object.entries(obj)) {
                        props[k] = buildSchema(v);
                        required.push(k);
                    }
                    return { type: 'object', properties: props, required };
                }
                return { type: inferType(obj) };
            };
            const schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'array',
                items: buildSchema(arr[0]),
            };
            return JSON.stringify(schema, null, 2);
        } catch { return null; }
    }, [input]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className={S.label}>JSON 데이터</label>
                        <button onClick={() => setInput(SAMPLE)} className="text-xs font-bold hover:opacity-80" style={{ color: ACCENT }}>샘플</button>
                    </div>
                    <textarea value={input} onChange={e => setInput(e.target.value)} rows={14} className={S.textarea} placeholder='[{"key": "value"}]' />
                </div>
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className={S.label}>JSON Schema (draft-07)</label>
                        {schema && <CopyBtn text={schema} />}
                    </div>
                    <textarea value={schema || (input ? '⚠ JSON 파싱 오류' : '')} readOnly rows={14} className={`${S.textarea}`} style={{ background: 'rgba(0,0,0,0.4)', color: schema ? '#86efac' : '#f87171' }} />
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 4: CSV 파일 비교
function CsvDiffTab() {
    const [csvA, setCsvA] = useState('');
    const [csvB, setCsvB] = useState('');
    const [keyCol, setKeyCol] = useState(0);

    const diff = useMemo(() => {
        if (!csvA.trim() || !csvB.trim()) return null;
        const parseCSV = (text) => text.trim().split('\n').map(line => line.split(',').map(v => v.trim().replace(/^"|"$/g, '')));
        try {
            const rowsA = parseCSV(csvA);
            const rowsB = parseCSV(csvB);
            const headerA = rowsA[0];
            const dataA = new Map(rowsA.slice(1).map(r => [r[keyCol], r]));
            const dataB = new Map(rowsB.slice(1).map(r => [r[keyCol], r]));
            const results = [];
            const allKeys = new Set([...dataA.keys(), ...dataB.keys()]);
            for (const key of allKeys) {
                const a = dataA.get(key);
                const b = dataB.get(key);
                if (!a) { results.push({ key, type: 'added', rowA: null, rowB: b }); }
                else if (!b) { results.push({ key, type: 'removed', rowA: a, rowB: null }); }
                else if (a.join(',') !== b.join(',')) { results.push({ key, type: 'modified', rowA: a, rowB: b }); }
                else { results.push({ key, type: 'same', rowA: a, rowB: b }); }
            }
            return { header: headerA, results };
        } catch { return null; }
    }, [csvA, csvB, keyCol]);

    const counts = diff ? {
        added: diff.results.filter(r => r.type === 'added').length,
        removed: diff.results.filter(r => r.type === 'removed').length,
        modified: diff.results.filter(r => r.type === 'modified').length,
        same: diff.results.filter(r => r.type === 'same').length,
    } : null;

    const typeStyle = { added: '#22c55e', removed: '#ef4444', modified: '#f59e0b', same: '#475569' };
    const typeLabel = { added: '추가', removed: '삭제', modified: '변경', same: '동일' };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={S.label}>CSV A (이전)</label>
                    <textarea value={csvA} onChange={e => setCsvA(e.target.value)} rows={8} className={S.textarea} placeholder="id,name,email&#10;1,Alice,alice@a.com&#10;2,Bob,bob@b.com" />
                </div>
                <div>
                    <label className={S.label}>CSV B (새 버전)</label>
                    <textarea value={csvB} onChange={e => setCsvB(e.target.value)} rows={8} className={S.textarea} placeholder="id,name,email&#10;1,Alice,alice@new.com&#10;3,Charlie,c@c.com" />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <label className={S.label + ' mb-0'}>키 컬럼 인덱스</label>
                <input type="number" value={keyCol} min={0} onChange={e => setKeyCol(Number(e.target.value))} className={S.input + ' max-w-[80px]'} />
            </div>
            {counts && (
                <>
                    <div className="grid grid-cols-4 gap-2">
                        {Object.entries(counts).map(([type, count]) => (
                            <div key={type} className="p-3 rounded-xl border text-center" style={{ background: `${typeStyle[type]}10`, borderColor: `${typeStyle[type]}30` }}>
                                <div className="text-2xl font-black" style={{ color: typeStyle[type] }}>{count}</div>
                                <div className="text-[10px] font-bold text-slate-500">{typeLabel[type]}</div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
                        {diff.results.filter(r => r.type !== 'same').map((r, i) => (
                            <div key={i} className="px-4 py-2.5 rounded-xl border flex items-center gap-3"
                                style={{ background: `${typeStyle[r.type]}08`, borderColor: `${typeStyle[r.type]}20` }}>
                                <span className="text-[10px] font-black w-8 shrink-0" style={{ color: typeStyle[r.type] }}>{typeLabel[r.type]}</span>
                                <span className="text-xs font-mono text-slate-400 flex-1 truncate">
                                    키: {r.key} | {r.type === 'modified' ? `${r.rowA?.join(',')} → ${r.rowB?.join(',')}` : r.rowA?.join(',') || r.rowB?.join(',')}
                                </span>
                            </div>
                        ))}
                        {diff.results.every(r => r.type === 'same') && (
                            <div className="text-center text-emerald-400 py-4 text-sm">✓ 두 CSV 파일이 동일합니다</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 5: 데이터 전치 (Transpose)
function DataTransposeTab() {
    const SAMPLE = 'name,Alice,Bob,Charlie\nage,30,25,35\ncity,Seoul,Busan,Daegu';
    const [input, setInput] = useState(SAMPLE);
    const [sep, setSep] = useState(',');

    const result = useMemo(() => {
        if (!input.trim()) return '';
        try {
            const rows = input.trim().split('\n').map(r => r.split(sep));
            const maxCols = Math.max(...rows.map(r => r.length));
            const padded = rows.map(r => [...r, ...Array(maxCols - r.length).fill('')]);
            const transposed = padded[0].map((_, colIdx) => padded.map(row => row[colIdx]));
            return transposed.map(r => r.join(sep)).join('\n');
        } catch { return '오류: 변환 실패'; }
    }, [input, sep]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <label className={S.label + ' mb-0'}>구분자</label>
                {[',', '\t', '|', ';'].map(s => (
                    <button key={s} onClick={() => setSep(s)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all"
                        style={sep === s ? { background: `${ACCENT}cc`, color: '#fff' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        {s === '\t' ? 'Tab' : s}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className={S.label}>원본 (행 × 열)</label>
                        <button onClick={() => setInput(SAMPLE)} className="text-xs font-bold hover:opacity-80" style={{ color: ACCENT }}>샘플</button>
                    </div>
                    <textarea value={input} onChange={e => setInput(e.target.value)} rows={10} className={S.textarea} />
                </div>
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className={S.label}>결과 (열 → 행)</label>
                        <CopyBtn text={result} />
                    </div>
                    <textarea value={result} readOnly rows={10} className={S.textarea} style={{ background: 'rgba(0,0,0,0.4)' }} />
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 6: 데이터 유효성 검사
function DataValidatorTab() {
    const SAMPLE = '[{"id":1,"name":"Alice","email":"alice@example.com","age":30},{"id":2,"name":"","email":"bad-email","age":-5}]';
    const [input, setInput] = useState(SAMPLE);

    const results = useMemo(() => {
        try {
            const data = JSON.parse(input);
            const arr = Array.isArray(data) ? data : [data];
            const issues = [];
            arr.forEach((row, i) => {
                Object.entries(row).forEach(([key, val]) => {
                    if (val === null || val === undefined || val === '') issues.push({ row: i + 1, key, val, issue: '빈 값', level: 'error' });
                    else if (key.toLowerCase().includes('email') && typeof val === 'string' && !val.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) issues.push({ row: i + 1, key, val, issue: '이메일 형식 오류', level: 'error' });
                    else if ((key === 'age' || key === 'count' || key === 'amount') && typeof val === 'number' && val < 0) issues.push({ row: i + 1, key, val, issue: '음수 값', level: 'warning' });
                    else if (key.toLowerCase().includes('phone') && typeof val === 'string' && !val.match(/^[\d\-+()\s]+$/)) issues.push({ row: i + 1, key, val, issue: '전화번호 형식 의심', level: 'warning' });
                });
            });
            return { total: arr.length, issues, errors: issues.filter(i => i.level === 'error').length, warnings: issues.filter(i => i.level === 'warning').length };
        } catch { return null; }
    }, [input]);

    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between mb-1.5">
                    <label className={S.label}>JSON 배열 입력</label>
                    <button onClick={() => setInput(SAMPLE)} className="text-xs font-bold hover:opacity-80" style={{ color: ACCENT }}>샘플</button>
                </div>
                <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} className={S.textarea} />
            </div>
            {results && (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        {[['전체 행', results.total, '#8b5cf6'], ['오류', results.errors, '#ef4444'], ['경고', results.warnings, '#f59e0b']].map(([label, count, color]) => (
                            <div key={label} className="p-4 rounded-xl border text-center" style={{ background: `${color}10`, borderColor: `${color}30` }}>
                                <div className="text-2xl font-black" style={{ color }}>{count}</div>
                                <div className="text-xs text-slate-500 mt-1">{label}</div>
                            </div>
                        ))}
                    </div>
                    {results.issues.length > 0 ? (
                        <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                            {results.issues.map((issue, i) => (
                                <div key={i} className="px-4 py-2.5 rounded-xl border flex items-center gap-3"
                                    style={{ background: issue.level === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', borderColor: issue.level === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)' }}>
                                    <span className="text-base shrink-0">{issue.level === 'error' ? '⚠' : '⚡'}</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-bold text-slate-300">행 {issue.row} · {issue.key}</span>
                                        <span className="text-xs text-slate-500 ml-2">{issue.issue}</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-500 truncate max-w-[120px]">{String(issue.val)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-emerald-400 py-4">✓ 검사 통과 – 발견된 문제 없음</div>
                    )}
                </>
            )}
            {!results && input && (
                <div className="text-sm text-red-400 px-4 py-3 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>⚠ JSON 파싱 실패</div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'schema', label: '스키마 빌더', icon: '🏗️', desc: 'JSON 데이터에서 JSON Schema 자동 생성', component: SchemaBuilderTab, chipLabel: '스키마' },
    { id: 'diff', label: 'CSV 비교', icon: '↔', desc: '두 CSV 파일의 행 단위 차이 분석', component: CsvDiffTab, chipLabel: '비교' },
    { id: 'transpose', label: '행/열 전치', icon: '⟳', desc: '데이터 행과 열을 뒤집기 (Transpose)', component: DataTransposeTab, chipLabel: '전치' },
    { id: 'validate', label: '데이터 검증', icon: '✅', desc: '이메일·빈값·타입 오류 일괄 검사', component: DataValidatorTab, chipLabel: '검증' },
];

export default function DataToolsStudio() {
    const [tab, setTab] = useState('schema');
    const Comp = TABS.find(t => t.id === tab)?.component;
    return (
        <StudioLayout
            color={ACCENT}
            icon="🗂️"
            title="Data Tools Studio"
            description="JSON Schema 빌더, CSV 비교, 행/열 전치, 데이터 유효성 검사"
            tabs={TABS}
            tab={tab}
            setTab={setTab}>
            {Comp && <Comp />}
        </StudioLayout>
    );
}
