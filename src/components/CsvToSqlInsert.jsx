import React, { useState } from 'react';
import Papa from 'papaparse';

const CsvToSqlInsert = () => {
    const [mode, setMode] = useState('csvToSql'); // csvToSql | sqlToCsv
    const [csvInput, setCsvInput] = useState('');
    const [sqlOutput, setSqlOutput] = useState('');
    const [tableName, setTableName] = useState('my_table');
    const [batchSize, setBatchSize] = useState(100);
    const [dbType, setDbType] = useState('mysql');
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);
    const [copied, setCopied] = useState(false);

    const sqlToCsv = (sql) => {
        const colMatch = sql.match(/INSERT\s+INTO\s+[\w`"]+\s*\(([^)]+)\)\s*VALUES/i);
        if (!colMatch) return null;
        const cols = colMatch[1].replace(/[`"]/g, '').split(',').map(c => c.trim());
        const parseTuple = (s) => {
            const r = []; let cur = ''; let inQ = false;
            for (let i = 0; i < s.length; i++) {
                const c = s[i];
                if (c === "'" && s[i - 1] !== '\\') inQ = !inQ;
                else if (c === ',' && !inQ) { r.push(cur.trim()); cur = ''; continue; }
                cur += c;
            }
            r.push(cur.trim());
            return r.map(v => v === 'NULL' ? '' : v.replace(/^'|'$/g, '').replace(/''/g, "'"));
        };
        const valPart = sql.replace(/INSERT\s+INTO\s+[\w`"]+\s*\([^)]+\)\s*VALUES\s*/gi, '').trim();
        const tupleStrs = valPart.split(/\),\s*\(/).map((t, i, arr) => {
            let s = t.replace(/^\(|\)\s*;?\s*$/g, '');
            return s;
        });
        const rows = tupleStrs.map(t => parseTuple(t));
        const escapeCsv = (v) => (v.includes(',') || v.includes('"')) ? '"' + String(v).replace(/"/g, '""') + '"' : v;
        return [cols.join(','), ...rows.filter(r => r.length).map(r => r.map(escapeCsv).join(','))].join('\n');
    };

    const convert = () => {
        setError('');
        if (mode === 'csvToSql') {
            if (!csvInput.trim()) { setError('CSV 데이터를 입력하세요.'); return; }
            const { data, errors } = Papa.parse(csvInput.trim(), { header: true, skipEmptyLines: true });
            if (errors.length && data.length === 0) { setError('CSV 파싱 오류: ' + errors[0].message); return; }
            const columns = Object.keys(data[0] || {});
            if (columns.length === 0) { setError('컬럼을 감지할 수 없습니다.'); return; }
            const q = dbType === 'mysql' ? '`' : '"';
            const tbl = `${q}${tableName}${q}`;
            const cols = columns.map(c => `${q}${c}${q}`).join(', ');
            const escVal = (v) => {
                if (v == null || v === '') return 'NULL';
                const s = String(v);
                if (/^-?\d+(\.\d+)?$/.test(s)) return s;
                if (s.toLowerCase() === 'true') return '1';
                if (s.toLowerCase() === 'false') return '0';
                return `'${s.replace(/'/g, "''")}'`;
            };
            const lines = [];
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                const vals = batch.map(row => `  (${columns.map(c => escVal(row[c])).join(', ')})`).join(',\n');
                lines.push(`INSERT INTO ${tbl} (${cols})\nVALUES\n${vals};`);
            }
            setSqlOutput(lines.join('\n\n'));
            setStats({ rows: data.length, cols: columns.length, batches: lines.length });
        } else {
            if (!csvInput.trim()) { setError('SQL INSERT 문을 입력하세요.'); return; }
            const csv = sqlToCsv(csvInput);
            if (!csv) { setError('유효한 INSERT 문이 아닙니다.'); return; }
            setSqlOutput(csv);
            const lines = csv.split('\n');
            setStats({ rows: lines.length - 1, cols: lines[0]?.split(',').length || 0, batches: 1 });
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(sqlOutput).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(()=>{});
    };

    const download = () => {
        const isCsv = mode === 'sqlToCsv';
        const blob = new Blob([sqlOutput], { type: isCsv ? 'text/csv;charset=utf-8;' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = isCsv ? 'export.csv' : `${tableName}_insert.sql`; a.click();
        URL.revokeObjectURL(url);
    };

    const SAMPLE = `id,name,email,age,is_active\n1,Alice,alice@example.com,30,true\n2,Bob,bob@example.com,25,false\n3,Charlie,,35,true`;

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(245,158,11,0.1))', border: '1px solid rgba(251,146,60,0.2)' }}>🔄</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">CSV → SQL INSERT 변환기</h1>
                        <p className="text-xs text-slate-500">CSV 데이터를 SQL INSERT 문으로 즉시 변환</p>
                    </div>
                </div>

                {/* 옵션 */}
                <div className="flex flex-wrap items-center gap-3 mb-4 shrink-0">
                    <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button onClick={() => setMode('csvToSql')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${mode === 'csvToSql' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>CSV → SQL</button>
                        <button onClick={() => setMode('sqlToCsv')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${mode === 'sqlToCsv' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>SQL → CSV</button>
                    </div>
                    {mode === 'csvToSql' && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">테이블명</span>
                                <input type="text" value={tableName} onChange={e => setTableName(e.target.value)} className="px-3 py-1.5 text-xs rounded-lg outline-none w-28" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">DB 종류</span>
                                <select value={dbType} onChange={e => setDbType(e.target.value)} className="px-3 py-1.5 text-xs rounded-lg outline-none">
                                    <option value="mysql">MySQL</option>
                                    <option value="pg">PostgreSQL</option>
                                    <option value="sqlite">SQLite</option>
                                    <option value="mssql">MSSQL</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">배치 크기</span>
                                <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} className="px-3 py-1.5 text-xs rounded-lg outline-none">
                                    <option value={10}>10</option>
                                    <option value={100}>100</option>
                                    <option value={500}>500</option>
                                    <option value={1000}>1000</option>
                                </select>
                            </div>
                        </>
                    )}
                    <button onClick={() => { setCsvInput(mode === 'csvToSql' ? SAMPLE : 'INSERT INTO users (id,name) VALUES (1,\'Alice\'),(2,\'Bob\');'); setSqlOutput(''); }} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>예시</button>
                    <button onClick={convert} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 10px rgba(249,115,22,0.3)' }}>
                        변환
                    </button>
                </div>

                {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>⚠️ {error}</div>}

                {stats && (
                    <div className="flex gap-4 mb-3 shrink-0">
                        {[{ l: '행', v: stats.rows }, { l: '컬럼', v: stats.cols }, { l: '배치', v: stats.batches }].map(s => (
                            <div key={s.l} className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                                <span className="text-[10px] text-slate-500">{s.l}: </span>
                                <span className="text-xs font-bold text-orange-400">{s.v}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                    <div className="flex-1 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{mode === 'csvToSql' ? 'CSV 입력' : 'SQL INSERT 입력'}</label>
                        <textarea value={csvInput} onChange={e => setCsvInput(e.target.value)} placeholder={mode === 'csvToSql' ? '첫 줄은 헤더(컬럼명)로 인식됩니다...' : 'INSERT INTO ... VALUES ...'} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{mode === 'csvToSql' ? 'SQL INSERT 결과' : 'CSV 결과'}</label>
                            {sqlOutput && (
                                <div className="flex gap-1.5">
                                    <button onClick={copy} className="text-[10px] px-2 py-1 rounded font-bold transition-all" style={copied ? { color: '#22c55e', background: 'rgba(34,197,94,0.1)' } : { color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>{copied ? '✓ 복사됨' : '복사'}</button>
                                    <button onClick={download} className="text-[10px] px-2 py-1 rounded font-bold text-sky-400 transition-all" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>다운로드</button>
                                </div>
                            )}
                        </div>
                        <textarea readOnly value={sqlOutput || (mode === 'csvToSql' ? '여기에 SQL INSERT 문이 생성됩니다...' : '여기에 CSV가 생성됩니다...')} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" style={{ color: sqlOutput ? '#e2e8f0' : '#475569' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsvToSqlInsert;
