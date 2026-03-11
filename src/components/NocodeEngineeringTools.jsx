import React, { useState } from 'react';

const NocodeEngineeringTools = ({
    allColumns, colTypes, db, data, setData, query, executeSQL,
    saveHistoryBeforeMutation, setAllColumns, showAlert,
    // state props
    ncFindCol, setNcFindCol, ncFindVal, setNcFindVal, ncReplaceVal, setNcReplaceVal,
    ncSplitCol, setNcSplitCol, ncSplitDelim, setNcSplitDelim,
    ncMergeCol1, setNcMergeCol1, ncMergeCol2, setNcMergeCol2, ncMergeSep, setNcMergeSep, ncMergeNewName, setNcMergeNewName,
    ncRenameFrom, setNcRenameFrom, ncRenameTo, setNcRenameTo,
    ncFillCol, setNcFillCol, ncFillVal, setNcFillVal,
    ncCorr1, setNcCorr1, ncCorr2, setNcCorr2, ncCorrResult, setNcCorrResult,
    ncNewColName, setNcNewColName, ncNewColFormula, setNcNewColFormula,
    ncSampleN, setNcSampleN,
    ncRegexCol, setNcRegexCol, ncRegexPattern, setNcRegexPattern,
    ncProfileCol, setNcProfileCol, ncProfileResult, setNcProfileResult,
    ncOutlierCol, setNcOutlierCol, ncOutlierResult, setNcOutlierResult,
    ncTypeCol, setNcTypeCol, ncTargetType, setNcTargetType,
    ncDateRangeCol, setNcDateRangeCol, ncDateRangeStart, setNcDateRangeStart, ncDateRangeEnd, setNcDateRangeEnd,
    ncDedupCols, setNcDedupCols,
    ncExpandJsonCol, setNcExpandJsonCol,
    ncOpenSection, setNcOpenSection,
    isDataReady,
}) => {
    const sections = [
        {
            id: 'profile', icon: '📊', label: '컬럼 프로파일링',
            render: () => (
                <div className="space-y-2">
                    <select value={ncProfileCol} onChange={e => setNcProfileCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 컬럼 선택 --</option>
                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button disabled={!ncProfileCol || !db} onClick={() => {
                        const res = db.exec(`SELECT COUNT(*) as total, COUNT("${ncProfileCol}") as non_null, COUNT(DISTINCT "${ncProfileCol}") as unique_vals, MIN("${ncProfileCol}") as min_val, MAX("${ncProfileCol}") as max_val FROM main_table`);
                        if (res.length) {
                            const [total, nonNull, uniq, min, max] = res[0].values[0];
                            setNcProfileResult({ total, nonNull, nullCount: total - nonNull, unique: uniq, min, max, nullPct: Math.round((total - nonNull) / total * 100) });
                        }
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>프로파일링 실행</button>
                    {ncProfileResult && (
                        <div className="grid grid-cols-2 gap-1 mt-2">
                            {[['전체', ncProfileResult.total], ['비어있음', `${ncProfileResult.nullCount} (${ncProfileResult.nullPct}%)`], ['고유값', ncProfileResult.unique], ['최솟값', ncProfileResult.min], ['최댓값', ncProfileResult.max], ['채워진 값', ncProfileResult.nonNull]].map(([k, v]) => (
                                <div key={k} className="px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <div className="text-[10px] text-slate-600">{k}</div>
                                    <div className="text-xs font-bold text-slate-200 truncate">{String(v)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: 'outlier', icon: '⚠️', label: '이상값 탐지 (IQR)',
            render: () => (
                <div className="space-y-2">
                    <select value={ncOutlierCol} onChange={e => setNcOutlierCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 숫자 컬럼 선택 --</option>
                        {allColumns.filter(c => colTypes[c] === 'number').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button disabled={!ncOutlierCol || !db} onClick={() => {
                        const res = db.exec(`SELECT "${ncOutlierCol}" FROM main_table WHERE "${ncOutlierCol}" IS NOT NULL ORDER BY "${ncOutlierCol}"`);
                        if (res.length) {
                            const vals = res[0].values.map(r => Number(r[0]));
                            const q1 = vals[Math.floor(vals.length * 0.25)];
                            const q3 = vals[Math.floor(vals.length * 0.75)];
                            const iqr = q3 - q1;
                            const lower = q1 - 1.5 * iqr, upper = q3 + 1.5 * iqr;
                            const outliers = vals.filter(v => v < lower || v > upper);
                            setNcOutlierResult({ q1: q1.toFixed(2), q3: q3.toFixed(2), iqr: iqr.toFixed(2), lower: lower.toFixed(2), upper: upper.toFixed(2), outlierCount: outliers.length, pct: Math.round(outliers.length / vals.length * 100) });
                        }
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>이상값 분석</button>
                    {ncOutlierResult && (
                        <div className="space-y-1 text-xs">
                            {[['Q1', ncOutlierResult.q1], ['Q3', ncOutlierResult.q3], ['IQR', ncOutlierResult.iqr], ['정상 범위', `${ncOutlierResult.lower} ~ ${ncOutlierResult.upper}`]].map(([k, v]) => (
                                <div key={k} className="flex justify-between text-slate-400"><span>{k}</span><b className="text-white">{v}</b></div>
                            ))}
                            <div className="flex justify-between p-2 rounded-lg mt-1" style={{ background: ncOutlierResult.outlierCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${ncOutlierResult.outlierCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
                                <span className="text-slate-400">이상값</span><b style={{ color: ncOutlierResult.outlierCount > 0 ? '#f87171' : '#4ade80' }}>{ncOutlierResult.outlierCount}개 ({ncOutlierResult.pct}%)</b>
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: 'correlation', icon: '📈', label: '상관관계 분석',
            render: () => (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        {[{v: ncCorr1, s: setNcCorr1, l: '컬럼 A'}, {v: ncCorr2, s: setNcCorr2, l: '컬럼 B'}].map(({v, s, l}) => (
                            <div key={l}>
                                <div className="text-[10px] text-slate-500 mb-1">{l}</div>
                                <select value={v} onChange={e => s(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                                    <option value="">선택</option>
                                    {allColumns.filter(c => colTypes[c] === 'number').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <button disabled={!ncCorr1 || !ncCorr2 || !db || ncCorr1 === ncCorr2} onClick={() => {
                        const res = db.exec(`SELECT "${ncCorr1}", "${ncCorr2}" FROM main_table WHERE "${ncCorr1}" IS NOT NULL AND "${ncCorr2}" IS NOT NULL`);
                        if (res.length) {
                            const vals = res[0].values;
                            const n = vals.length;
                            const xa = vals.reduce((s,r) => s + r[0], 0) / n;
                            const ya = vals.reduce((s,r) => s + r[1], 0) / n;
                            const num = vals.reduce((s,r) => s + (r[0]-xa)*(r[1]-ya), 0);
                            const den = Math.sqrt(vals.reduce((s,r) => s + (r[0]-xa)**2, 0) * vals.reduce((s,r) => s + (r[1]-ya)**2, 0));
                            const r = den === 0 ? 0 : num / den;
                            const interp = Math.abs(r) > 0.7 ? '강한 상관관계' : Math.abs(r) > 0.4 ? '중간 상관관계' : Math.abs(r) > 0.2 ? '약한 상관관계' : '거의 무관계';
                            setNcCorrResult({ r: r.toFixed(4), interp, dir: r > 0 ? '양의' : '음의', n });
                        }
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>상관계수 계산</button>
                    {ncCorrResult && (
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}>
                            <div className="text-3xl font-bold text-sky-400 mb-1">{ncCorrResult.r}</div>
                            <div className="text-xs text-slate-300">{ncCorrResult.dir} {ncCorrResult.interp}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{ncCorrResult.n}개 데이터 포인트</div>
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: 'findreplace', icon: '🔍', label: '텍스트 찾아 바꾸기',
            render: () => (
                <div className="space-y-2">
                    <select value={ncFindCol} onChange={e => setNcFindCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 컬럼 선택 --</option>
                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="text" value={ncFindVal} onChange={e => setNcFindVal(e.target.value)} placeholder="찾을 텍스트" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none" />
                    <input type="text" value={ncReplaceVal} onChange={e => setNcReplaceVal(e.target.value)} placeholder="바꿀 텍스트" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none" />
                    <button disabled={!ncFindCol || !ncFindVal || !db} onClick={() => {
                        saveHistoryBeforeMutation();
                        db.run(`UPDATE main_table SET "${ncFindCol}" = REPLACE("${ncFindCol}", ?, ?)`, [ncFindVal, ncReplaceVal]);
                        executeSQL(query, true);
                        showAlert(`"${ncFindVal}" → "${ncReplaceVal}" 치환 완료`, 'success');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #22d3ee, #06b6d4)' }}>치환 실행</button>
                </div>
            ),
        },
        {
            id: 'splitcol', icon: '✂️', label: '컬럼 분할',
            render: () => (
                <div className="space-y-2">
                    <select value={ncSplitCol} onChange={e => setNcSplitCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 컬럼 선택 --</option>
                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="text" value={ncSplitDelim} onChange={e => setNcSplitDelim(e.target.value)} placeholder="구분자 (예: , ; - 공백)" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none font-mono" />
                    <button disabled={!ncSplitCol || !ncSplitDelim || !db} onClick={() => {
                        const res = db.exec(`SELECT rowid, "${ncSplitCol}" FROM main_table`);
                        if (res.length) {
                            saveHistoryBeforeMutation();
                            const delim = ncSplitDelim === '\\s' ? /\s+/ : ncSplitDelim;
                            const maxParts = Math.max(...res[0].values.map(r => String(r[1] || '').split(delim).length));
                            const cap = Math.min(maxParts, 5);
                            db.run('BEGIN;');
                            for (let i = 1; i <= cap; i++) {
                                try { db.run(`ALTER TABLE main_table ADD COLUMN "${ncSplitCol}_part${i}" TEXT`); } catch {}
                            }
                            const setClause = Array.from({length: cap}, (_, i) => `"${ncSplitCol}_part${i+1}" = ?`).join(', ');
                            const stmt = db.prepare(`UPDATE main_table SET ${setClause} WHERE rowid = ?`);
                            res[0].values.forEach(r => {
                                const parts = String(r[1] || '').split(delim);
                                stmt.run([...Array.from({length: cap}, (_, i) => parts[i] || null), r[0]]);
                            });
                            stmt.free(); db.run('COMMIT;');
                            setAllColumns([...allColumns, ...Array.from({length: cap}, (_, i) => `${ncSplitCol}_part${i+1}`)]);
                            executeSQL(query, true);
                            showAlert(`${cap}개 컬럼으로 분할 완료`, 'success');
                        }
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }}>분할 실행</button>
                    <p className="text-[10px] text-slate-600">최대 5개 컬럼으로 분할됩니다</p>
                </div>
            ),
        },
        {
            id: 'mergecol', icon: '🔗', label: '컬럼 합치기',
            render: () => (
                <div className="space-y-2">
                    {[{v: ncMergeCol1, s: setNcMergeCol1, l: '첫 번째 컬럼'}, {v: ncMergeCol2, s: setNcMergeCol2, l: '두 번째 컬럼'}].map(({v, s, l}) => (
                        <div key={l}>
                            <div className="text-[10px] text-slate-500 mb-1">{l}</div>
                            <select value={v} onChange={e => s(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                                <option value="">선택</option>
                                {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    ))}
                    <input type="text" value={ncMergeSep} onChange={e => setNcMergeSep(e.target.value)} placeholder="구분자 (기본: 공백)" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none font-mono" />
                    <input type="text" value={ncMergeNewName} onChange={e => setNcMergeNewName(e.target.value)} placeholder="새 컬럼명" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none" />
                    <button disabled={!ncMergeCol1 || !ncMergeCol2 || !ncMergeNewName || !db} onClick={() => {
                        saveHistoryBeforeMutation();
                        try { db.run(`ALTER TABLE main_table ADD COLUMN "${ncMergeNewName}" TEXT`); } catch {}
                        db.run(`UPDATE main_table SET "${ncMergeNewName}" = "${ncMergeCol1}" || ? || "${ncMergeCol2}"`, [ncMergeSep]);
                        setAllColumns([...allColumns, ncMergeNewName]);
                        executeSQL(query, true);
                        showAlert(`"${ncMergeNewName}" 컬럼이 생성되었습니다`, 'success');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #4ade80, #22d3ee)' }}>합치기 실행</button>
                </div>
            ),
        },
        {
            id: 'rename', icon: '✏️', label: '컬럼 이름 변경',
            render: () => (
                <div className="space-y-2">
                    <select value={ncRenameFrom} onChange={e => setNcRenameFrom(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 변경할 컬럼 --</option>
                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="text" value={ncRenameTo} onChange={e => setNcRenameTo(e.target.value)} placeholder="새 컬럼명" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none" />
                    <button disabled={!ncRenameFrom || !ncRenameTo.trim() || ncRenameFrom === ncRenameTo} onClick={() => {
                        saveHistoryBeforeMutation();
                        db.run(`ALTER TABLE main_table RENAME COLUMN "${ncRenameFrom}" TO "${ncRenameTo}"`);
                        setAllColumns(allColumns.map(c => c === ncRenameFrom ? ncRenameTo : c));
                        executeSQL(query.replace(new RegExp(`"${ncRenameFrom}"`, 'g'), `"${ncRenameTo}"`), true);
                        showAlert(`컬럼 "${ncRenameFrom}" → "${ncRenameTo}" 변경 완료`, 'success');
                        setNcRenameFrom(''); setNcRenameTo('');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)' }}>이름 변경</button>
                </div>
            ),
        },
        {
            id: 'fillnull', icon: '🪣', label: '빈 값(NULL) 채우기',
            render: () => (
                <div className="space-y-2">
                    <select value={ncFillCol} onChange={e => setNcFillCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 컬럼 선택 --</option>
                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex gap-2">
                        {[['0', '숫자 0'], ['N/A', 'N/A'], ['없음', '없음']].map(([v, l]) => (
                            <button key={v} onClick={() => setNcFillVal(v)} className="flex-1 py-1 rounded text-[11px] font-bold transition-all"
                                style={{ background: ncFillVal === v ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: ncFillVal === v ? '#818cf8' : '#64748b', border: `1px solid ${ncFillVal === v ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}` }}>{l}</button>
                        ))}
                    </div>
                    <input type="text" value={ncFillVal} onChange={e => setNcFillVal(e.target.value)} placeholder="또는 직접 입력" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none" />
                    <button disabled={!ncFillCol || !db} onClick={() => {
                        saveHistoryBeforeMutation();
                        db.run(`UPDATE main_table SET "${ncFillCol}" = ? WHERE "${ncFillCol}" IS NULL OR "${ncFillCol}" = ''`, [ncFillVal]);
                        executeSQL(query, true);
                        showAlert(`NULL 값이 "${ncFillVal}"으로 채워졌습니다`, 'success');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #60a5fa, #6366f1)' }}>채우기 실행</button>
                </div>
            ),
        },
        {
            id: 'regex', icon: '🧩', label: '정규식 필터',
            render: () => (
                <div className="space-y-2">
                    <select value={ncRegexCol} onChange={e => setNcRegexCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 컬럼 선택 --</option>
                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="text" value={ncRegexPattern} onChange={e => setNcRegexPattern(e.target.value)} placeholder="정규식 패턴 (예: ^[A-Z].*)" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none font-mono" />
                    <div className="flex gap-1 flex-wrap">
                        {['^[0-9]+$', '^[A-Za-z]+$', '@', '.com$'].map(p => (
                            <button key={p} onClick={() => setNcRegexPattern(p)} className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 hover:text-slate-200 transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>{p}</button>
                        ))}
                    </div>
                    <button disabled={!ncRegexCol || !ncRegexPattern} onClick={() => {
                        if (!data.length) return;
                        const regex = new RegExp(ncRegexPattern);
                        const matched = data.filter(row => regex.test(String(row[ncRegexCol] || '')));
                        saveHistoryBeforeMutation();
                        setData(matched);
                        showAlert(`${matched.length}개 행이 패턴과 일치합니다`, 'info');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>필터 적용</button>
                </div>
            ),
        },
        {
            id: 'sample', icon: '🎲', label: '랜덤 샘플링',
            render: () => (
                <div className="space-y-2">
                    <div className="text-xs text-slate-400">샘플 크기: <b className="text-sky-400">{ncSampleN}행</b></div>
                    <input type="range" min={10} max={Math.min(data.length || 1000, 1000)} value={ncSampleN} onChange={e => setNcSampleN(Number(e.target.value))} className="w-full accent-sky-500" style={{ background: 'transparent', border: 'none' }} />
                    <button disabled={!isDataReady} onClick={() => {
                        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, ncSampleN);
                        saveHistoryBeforeMutation();
                        setData(shuffled);
                        showAlert(`${ncSampleN}개 행이 랜덤 샘플링되었습니다`, 'success');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>샘플링 실행</button>
                </div>
            ),
        },
        {
            id: 'daterange', icon: '📅', label: '날짜 범위 필터',
            render: () => (
                <div className="space-y-2">
                    <select value={ncDateRangeCol} onChange={e => setNcDateRangeCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 날짜 컬럼 선택 --</option>
                        {allColumns.filter(c => colTypes[c] === 'date').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="text-[10px] text-slate-500 mb-1">시작일</div>
                            <input type="date" value={ncDateRangeStart} onChange={e => setNcDateRangeStart(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 mb-1">종료일</div>
                            <input type="date" value={ncDateRangeEnd} onChange={e => setNcDateRangeEnd(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none" />
                        </div>
                    </div>
                    <button disabled={!ncDateRangeCol || (!ncDateRangeStart && !ncDateRangeEnd) || !db} onClick={() => {
                        let q2 = `SELECT * FROM main_table WHERE 1=1`;
                        if (ncDateRangeStart) q2 += ` AND "${ncDateRangeCol}" >= '${ncDateRangeStart}'`;
                        if (ncDateRangeEnd) q2 += ` AND "${ncDateRangeCol}" <= '${ncDateRangeEnd}'`;
                        executeSQL(q2, true);
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)' }}>날짜 필터 적용</button>
                </div>
            ),
        },
        {
            id: 'formulacol', icon: '🧮', label: '수식 컬럼 추가',
            render: () => (
                <div className="space-y-2">
                    <input type="text" value={ncNewColName} onChange={e => setNcNewColName(e.target.value)} placeholder="새 컬럼명" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none" />
                    <input type="text" value={ncNewColFormula} onChange={e => setNcNewColFormula(e.target.value)} placeholder="SQL 표현식 (예: revenue - cost)" className="w-full px-3 py-1.5 text-xs rounded-lg outline-none font-mono" />
                    <div className="flex flex-wrap gap-1">
                        {allColumns.filter(c => colTypes[c] === 'number').slice(0, 3).map(c => (
                            <button key={c} onClick={() => setNcNewColFormula(f => f ? f + ' + "' + c + '"' : `"${c}"`)} className="px-2 py-0.5 rounded text-[10px] text-violet-400" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>{c}</button>
                        ))}
                    </div>
                    <button disabled={!ncNewColName || !ncNewColFormula || !db} onClick={() => {
                        saveHistoryBeforeMutation();
                        try { db.run(`ALTER TABLE main_table ADD COLUMN "${ncNewColName}" REAL`); } catch {}
                        db.run(`UPDATE main_table SET "${ncNewColName}" = ${ncNewColFormula}`);
                        setAllColumns([...allColumns, ncNewColName]);
                        executeSQL(query, true);
                        showAlert(`수식 컬럼 "${ncNewColName}" 추가 완료`, 'success');
                        setNcNewColName(''); setNcNewColFormula('');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #c084fc, #8b5cf6)' }}>컬럼 추가</button>
                </div>
            ),
        },
        {
            id: 'typecast', icon: '🔀', label: '컬럼 타입 변환',
            render: () => (
                <div className="space-y-2">
                    <select value={ncTypeCol} onChange={e => setNcTypeCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 컬럼 선택 --</option>
                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex gap-1">
                        {[['TEXT', '텍스트'], ['INTEGER', '정수'], ['REAL', '실수'], ['NUMERIC', '숫자']].map(([t, l]) => (
                            <button key={t} onClick={() => setNcTargetType(t)} className="flex-1 py-1 rounded text-[11px] font-bold" style={{ background: ncTargetType === t ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.04)', color: ncTargetType === t ? '#38bdf8' : '#475569', border: `1px solid ${ncTargetType === t ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.08)'}` }}>{l}</button>
                        ))}
                    </div>
                    <button disabled={!ncTypeCol || !db} onClick={() => {
                        saveHistoryBeforeMutation();
                        db.run(`UPDATE main_table SET "${ncTypeCol}" = CAST("${ncTypeCol}" AS ${ncTargetType})`);
                        executeSQL(query, true);
                        showAlert(`"${ncTypeCol}" → ${ncTargetType} 변환 완료`, 'success');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)' }}>타입 변환</button>
                </div>
            ),
        },
        {
            id: 'reverserows', icon: '↕️', label: '행 순서 뒤집기',
            render: () => (
                <div className="space-y-2">
                    <p className="text-xs text-slate-500">현재 {data.length}개 행의 순서를 역순으로 뒤집습니다.</p>
                    <button disabled={!isDataReady} onClick={() => {
                        saveHistoryBeforeMutation();
                        setData([...data].reverse());
                        showAlert('행 순서가 역순으로 변경되었습니다', 'success');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>뒤집기 실행</button>
                </div>
            ),
        },
        {
            id: 'expandjson', icon: '🧬', label: 'JSON 컬럼 펼치기',
            render: () => (
                <div className="space-y-2">
                    <select value={ncExpandJsonCol} onChange={e => setNcExpandJsonCol(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg outline-none">
                        <option value="">-- 컬럼 선택 --</option>
                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button disabled={!ncExpandJsonCol || !data.length} onClick={() => {
                        const firstVal = data[0][ncExpandJsonCol];
                        try {
                            const parsed = typeof firstVal === 'string' ? JSON.parse(firstVal) : firstVal;
                            if (typeof parsed !== 'object' || parsed === null) { showAlert('JSON 객체가 아닙니다', 'error'); return; }
                            const keys = Object.keys(parsed);
                            saveHistoryBeforeMutation();
                            const newData = data.map(row => {
                                let obj;
                                try { obj = typeof row[ncExpandJsonCol] === 'string' ? JSON.parse(row[ncExpandJsonCol]) : row[ncExpandJsonCol]; } catch { obj = {}; }
                                const expanded = { ...row };
                                keys.forEach(k => { expanded[`${ncExpandJsonCol}_${k}`] = obj?.[k] ?? null; });
                                return expanded;
                            });
                            setData(newData);
                            setAllColumns([...allColumns, ...keys.map(k => `${ncExpandJsonCol}_${k}`)]);
                            showAlert(`${keys.length}개 JSON 키가 컬럼으로 펼쳐졌습니다`, 'success');
                        } catch { showAlert('JSON 파싱 오류', 'error'); }
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #4ade80, #22d3ee)' }}>JSON 펼치기</button>
                </div>
            ),
        },
        {
            id: 'dedup', icon: '🧹', label: '특정 컬럼 기준 중복 제거',
            render: () => (
                <div className="space-y-2">
                    <p className="text-xs text-slate-500">선택한 컬럼 기준으로 중복 행을 제거합니다.</p>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                        {allColumns.map(c => (
                            <button key={c} onClick={() => setNcDedupCols(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])}
                                className="px-2 py-1 rounded text-[11px] font-semibold transition-all"
                                style={{ background: ncDedupCols.includes(c) ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)', color: ncDedupCols.includes(c) ? '#60a5fa' : '#64748b', border: `1px solid ${ncDedupCols.includes(c) ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                                {c}
                            </button>
                        ))}
                    </div>
                    <button disabled={ncDedupCols.length === 0 || !db} onClick={() => {
                        const colStr = ncDedupCols.map(c => `"${c}"`).join(', ');
                        const before = db.exec('SELECT COUNT(*) FROM main_table')[0].values[0][0];
                        saveHistoryBeforeMutation();
                        db.run(`DELETE FROM main_table WHERE rowid NOT IN (SELECT MIN(rowid) FROM main_table GROUP BY ${colStr})`);
                        const after = db.exec('SELECT COUNT(*) FROM main_table')[0].values[0][0];
                        executeSQL(query, true);
                        showAlert(`${before - after}개 중복 행 제거 완료 (${after}개 남음)`, 'success');
                    }} className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}>중복 제거 실행</button>
                </div>
            ),
        },
    ];

    const GROUPS = [
        {
            id: 'clean',
            label: '데이터 정제',
            icon: '🧹',
            color: '#22d3ee',
            colorBg: 'rgba(6,182,212,0.08)',
            colorBorder: 'rgba(6,182,212,0.2)',
            sections: ['findreplace', 'fillnull', 'dedup', 'regex', 'daterange'],
        },
        {
            id: 'column',
            label: '컬럼 관리',
            icon: '🗂️',
            color: '#a78bfa',
            colorBg: 'rgba(139,92,246,0.08)',
            colorBorder: 'rgba(139,92,246,0.2)',
            sections: ['splitcol', 'mergecol', 'rename', 'formulacol', 'typecast', 'expandjson'],
        },
        {
            id: 'analytics',
            label: '분석 & 탐색',
            icon: '📊',
            color: '#34d399',
            colorBg: 'rgba(52,211,153,0.08)',
            colorBorder: 'rgba(52,211,153,0.2)',
            sections: ['profile', 'outlier', 'correlation', 'sample', 'reverserows'],
        },
    ];

    const [openGroup, setOpenGroup] = useState(null);

    return (
        <div className="mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🔧 고급 엔지니어링 도구</p>
                <span className="text-[10px] text-slate-700">{sections.length}가지</span>
            </div>

            {GROUPS.map(group => {
                const groupSections = sections.filter(s => group.sections.includes(s.id));
                const isGroupOpen = openGroup === group.id;

                return (
                    <div key={group.id} className="rounded-xl overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${isGroupOpen ? group.colorBorder : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.2s' }}>
                        {/* 그룹 헤더 */}
                        <button
                            onClick={() => setOpenGroup(p => p === group.id ? null : group.id)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-white/[0.03]"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm" style={{ background: group.colorBg, border: `1px solid ${group.colorBorder}` }}>
                                    {group.icon}
                                </div>
                                <span className="text-xs font-bold" style={{ color: isGroupOpen ? group.color : '#94a3b8' }}>{group.label}</span>
                                <span className="text-[10px] text-slate-700 font-medium">{groupSections.length}가지</span>
                            </div>
                            <svg
                                className="w-3.5 h-3.5 text-slate-600 transition-transform"
                                style={{ transform: isGroupOpen ? 'rotate(180deg)' : 'none' }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* 그룹 내 섹션들 */}
                        {isGroupOpen && (
                            <div style={{ borderTop: `1px solid ${group.colorBorder}` }}>
                                {groupSections.map(({ id, icon, label, render }) => (
                                    <div key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <button
                                            onClick={() => setNcOpenSection(p => p === id ? null : id)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-left transition-all hover:bg-white/[0.03]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm w-5 text-center">{icon}</span>
                                                <span className="text-xs font-medium text-slate-400">{label}</span>
                                            </div>
                                            <span
                                                className="text-xs transition-transform"
                                                style={{ color: ncOpenSection === id ? group.color : '#475569', transform: ncOpenSection === id ? 'rotate(90deg)' : 'none' }}
                                            >›</span>
                                        </button>
                                        {ncOpenSection === id && (
                                            <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
                                                {render()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default NocodeEngineeringTools;
