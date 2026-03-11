import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icons from '../utils/Icons';

/* ══════════════════════════════════════════════════════
   VaultSheet Smart Transform Hub v3
   혁신 기능:
   ① 변환 탐색  — 카테고리·검색·즐겨찾기·스마트 추천
   ② 파이프라인 빌더 — 여러 변환을 순서대로 쌓아 한 번에 실행
   ③ 변환 미리보기 — Before/After 데이터 스냅샷
   ④ 즐겨찾기/히스토리 — localStorage 저장
══════════════════════════════════════════════════════ */

const CAT = {
    'All':      { emoji: '⚡', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)',  border: 'rgba(148,163,184,0.2)'  },
    'Clean':    { emoji: '🧹', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.25)'  },
    'Text':     { emoji: '📝', color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.25)'  },
    'Math':     { emoji: '🔢', color: '#c084fc', bg: 'rgba(192,132,252,0.08)',  border: 'rgba(192,132,252,0.25)' },
    'Stats':    { emoji: '📊', color: '#fb923c', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.25)'  },
    'Date':     { emoji: '📅', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.25)'  },
    'Security': { emoji: '🔒', color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.25)' },
    'Logic':    { emoji: '⚙️', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',   border: 'rgba(34,211,238,0.25)'  },
};

const LS_FAV = 'vs_fav_v3';
const LS_PIPE = 'vs_pipelines_v3';

const CommandPalette = ({ isOpen, onClose, actions, isDataReady, columns = [], colTypes = {}, previewData = [] }) => {
    const [mainTab, setMainTab]           = useState('browse');    // 'browse' | 'pipeline'
    const [selectedAction, setSelectedAction] = useState(null);
    const [formValues, setFormValues]     = useState({});
    const [activeCat, setActiveCat]       = useState('All');
    const [search, setSearch]             = useState('');
    const [favorites, setFavorites]       = useState(() => { try { return JSON.parse(localStorage.getItem(LS_FAV) || '[]'); } catch { return []; } });
    const [history, setHistory]           = useState([]);
    // 파이프라인
    const [pipeline, setPipeline]         = useState([]); // [{id, action, params}]
    const [savedPipelines, setSavedPipelines] = useState(() => { try { return JSON.parse(localStorage.getItem(LS_PIPE) || '[]'); } catch { return []; } });
    const [pipelineName, setPipelineName] = useState('');

    useEffect(() => { localStorage.setItem(LS_FAV, JSON.stringify(favorites)); }, [favorites]);
    useEffect(() => { localStorage.setItem(LS_PIPE, JSON.stringify(savedPipelines)); }, [savedPipelines]);
    useEffect(() => { if (!isOpen) { setSearch(''); setSelectedAction(null); setFormValues({}); } }, [isOpen]);

    // ⚠️ React Rules of Hooks: useMemo는 조기 리턴 이전에 선언해야 함
    const getOpts = useCallback((t) => {
        if (t === 'select_number') return columns.filter(c => colTypes[c] === 'number');
        if (t === 'select_date')   return columns.filter(c => colTypes[c] === 'date');
        return columns;
    }, [columns, colTypes]);

    const isAvail = useCallback((a) => {
        if (!isDataReady || !a.condition()) return false;
        return !(a.inputs?.some(i => i.type.startsWith('select') && getOpts(i.type).length === 0));
    }, [isDataReady, getOpts]);

    // 스마트 추천 (hooks before early return)
    const smartRec = useMemo(() => {
        if (!isDataReady) return [];
        const hasNum = Object.values(colTypes).includes('number');
        const hasDate = Object.values(colTypes).includes('date');
        return actions
            .filter(isAvail)
            .map(a => ({
                ...a,
                score: (a.category === 'Clean' ? 3 : 0) +
                       (a.category === 'Math' && hasNum ? 4 : 0) +
                       (a.category === 'Date' && hasDate ? 4 : 0) +
                       (favorites.includes(a.name) ? 5 : 0),
            }))
            .filter(a => a.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
    }, [actions, colTypes, isDataReady, favorites, isAvail]);

    const filtered = useMemo(() =>
        actions.filter(a => {
            const mc = activeCat === 'All' || a.category === activeCat;
            const ms = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase());
            return mc && ms;
        }),
    [actions, activeCat, search]);

    if (!isOpen) return null;

    const toggleFav = n => setFavorites(p => p.includes(n) ? p.filter(f => f !== n) : [...p, n]);
    const addHistory = n => setHistory(p => [{ name: n, ts: Date.now() }, ...p].slice(0, 20));

    // 클리닝 번들
    const runBundle = () => {
        ['빈 값(NULL) 행 삭제', '공백 트림', '중복 행 제거'].forEach(n => {
            const a = actions.find(x => x.name === n);
            if (a && isAvail(a) && !a.inputs?.length) { a.run({}); }
        });
        addHistory('🧹 클리닝 번들');
        onClose();
    };

    const handleClick = (action) => {
        if (!isAvail(action)) return;
        if (action.inputs?.length > 0) {
            const init = {};
            action.inputs.forEach(i => {
                init[i.id] = i.type.startsWith('select') ? (getOpts(i.type)[0] || '') : (i.defaultValue || '');
            });
            setFormValues(init);
            setSelectedAction(action);
        } else {
            action.run({});
            addHistory(action.name);
            onClose();
        }
    };

    const handleFormSubmit = () => {
        if (!selectedAction) return;
        selectedAction.run(formValues);
        addHistory(selectedAction.name);
        setSelectedAction(null);
        setFormValues({});
        onClose();
    };

    // 파이프라인 추가
    const addToPipeline = (action, e) => {
        e.stopPropagation();
        if (!isAvail(action)) return;
        const params = {};
        if (action.inputs?.length > 0) {
            action.inputs.forEach(i => {
                params[i.id] = i.type.startsWith('select') ? (getOpts(i.type)[0] || '') : (i.defaultValue || '');
            });
        }
        setPipeline(p => [...p, { id: Date.now(), action, params }]);
        setMainTab('pipeline');
    };

    // 파이프라인 실행
    const runPipeline = () => {
        if (pipeline.length === 0) return;
        pipeline.forEach(step => {
            if (isAvail(step.action)) step.action.run(step.params);
        });
        addHistory(`🔗 파이프라인 (${pipeline.length}단계)`);
        onClose();
    };

    // 파이프라인 저장
    const savePipeline = () => {
        if (!pipelineName.trim() || pipeline.length === 0) return;
        const saved = { name: pipelineName.trim(), steps: pipeline.map(s => ({ name: s.action.name, params: s.params })), ts: Date.now() };
        setSavedPipelines(p => [saved, ...p].slice(0, 10));
        setPipelineName('');
    };

    const previewCol = formValues['col'] || formValues['col1'];
    const previewRows = previewData.slice(0, 3);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ background: 'rgba(4,8,20,0.85)', backdropFilter: 'blur(16px)' }} onClick={onClose}>
            <div className="w-full sm:max-w-6xl h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col" style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>

                {/* ══ HEADER ══ */}
                <div className="shrink-0 flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* 아이콘 */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
                        <Icons.Magic />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-bold text-slate-100">스마트 변환 허브</h2>
                        <p className="text-[11px] text-slate-600">{isDataReady ? `${columns.length}개 컬럼 · ${actions.length}가지 변환 · 파이프라인 빌더` : '데이터를 불러오면 모든 기능이 활성화됩니다'}</p>
                    </div>

                    {/* 메인 탭 */}
                    <div className="flex items-center gap-1 px-1 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                            { id: 'browse', label: '🔍 변환 탐색' },
                            { id: 'pipeline', label: `🔗 파이프라인 ${pipeline.length > 0 ? `(${pipeline.length})` : ''}` },
                        ].map(t => (
                            <button key={t.id} onClick={() => setMainTab(t.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={mainTab === t.id
                                    ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 2px 10px rgba(99,102,241,0.4)' }
                                    : { color: '#64748b' }}
                            >{t.label}</button>
                        ))}
                    </div>

                    {/* 클리닝 번들 */}
                    <button onClick={runBundle} disabled={!isDataReady}
                        className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                        style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
                        🧹 번들 클리닝
                    </button>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all shrink-0">
                        <Icons.Close />
                    </button>
                </div>

                {/* ══ BROWSE TAB ══ */}
                {mainTab === 'browse' && (
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        {/* 검색 + 카테고리 */}
                        <div className="shrink-0 px-5 py-3 space-y-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input type="text" placeholder="변환 검색..." value={search} onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-8 pr-4 py-2 text-sm text-slate-200 rounded-xl outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                                {Object.keys(CAT).map(cat => {
                                    const m = CAT[cat];
                                    const isA = activeCat === cat;
                                    return (
                                        <button key={cat} onClick={() => setActiveCat(cat)}
                                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                            style={{
                                                background: isA ? m.bg : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${isA ? m.border : 'rgba(255,255,255,0.06)'}`,
                                                color: isA ? m.color : '#475569',
                                            }}
                                        >
                                            {m.emoji} {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex min-h-0">
                            {/* 액션 영역 */}
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
                                {/* 스마트 추천 */}
                                {smartRec.length > 0 && activeCat === 'All' && !search && (
                                    <section>
                                        <SectionTitle icon="✨" label="스마트 추천" sub="현재 데이터 유형 기반" />
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                            {smartRec.map((a, i) => <ActionCard key={i} action={a} avail={true} fav={favorites.includes(a.name)} onFav={() => toggleFav(a.name)} onClick={() => handleClick(a)} onPipe={e => addToPipeline(a, e)} compact />)}
                                        </div>
                                    </section>
                                )}

                                {/* 즐겨찾기 */}
                                {favorites.length > 0 && activeCat === 'All' && !search && (
                                    <section>
                                        <SectionTitle icon="⭐" label="즐겨찾기" />
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {actions.filter(a => favorites.includes(a.name)).map((a, i) => <ActionCard key={i} action={a} avail={isAvail(a)} fav={true} onFav={() => toggleFav(a.name)} onClick={() => handleClick(a)} onPipe={e => addToPipeline(a, e)} />)}
                                        </div>
                                    </section>
                                )}

                                {/* 데이터 없음 */}
                                {!isDataReady && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>📂</div>
                                        <p className="text-slate-400 font-semibold mb-1">데이터를 먼저 불러와 주세요</p>
                                        <p className="text-slate-600 text-xs">CSV/JSON 파일 업로드 후 활성화됩니다</p>
                                    </div>
                                )}

                                {/* 전체/검색/카테고리 결과 */}
                                {isDataReady && (
                                    search
                                        ? (
                                            <section>
                                                <SectionTitle icon="🔍" label={`검색 결과`} sub={`${filtered.length}개`} />
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {filtered.map((a, i) => <ActionCard key={i} action={a} avail={isAvail(a)} fav={favorites.includes(a.name)} onFav={() => toggleFav(a.name)} onClick={() => handleClick(a)} onPipe={e => addToPipeline(a, e)} />)}
                                                </div>
                                                {filtered.length === 0 && <p className="text-slate-600 text-xs text-center py-8">검색 결과가 없습니다</p>}
                                            </section>
                                        )
                                        : Object.entries(
                                            filtered.reduce((acc, a) => { (acc[a.category || 'Other'] = acc[a.category || 'Other'] || []).push(a); return acc; }, {})
                                        ).map(([cat, items]) => {
                                            const m = CAT[cat] || CAT['All'];
                                            return (
                                                <section key={cat}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}>
                                                            {m.emoji} {cat}
                                                        </span>
                                                        <span className="text-xs text-slate-700">{items.length}개</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                        {items.map((a, i) => <ActionCard key={i} action={a} avail={isAvail(a)} fav={favorites.includes(a.name)} onFav={() => toggleFav(a.name)} onClick={() => handleClick(a)} onPipe={e => addToPipeline(a, e)} />)}
                                                    </div>
                                                </section>
                                            );
                                        })
                                )}
                            </div>

                            {/* 우측: 히스토리 + 컬럼 정보 */}
                            <div className="w-48 shrink-0 hidden lg:flex flex-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="p-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">🕒 최근 실행</p>
                                    {history.length === 0
                                        ? <p className="text-[11px] text-slate-700">없음</p>
                                        : <div className="space-y-1">
                                            {history.slice(0, 6).map((h, i) => (
                                                <div key={i} className="text-[11px] text-slate-400 px-2 py-1 rounded-lg truncate" style={{ background: 'rgba(255,255,255,0.03)' }} title={h.name}>{h.name}</div>
                                            ))}
                                        </div>
                                    }
                                </div>
                                <div className="p-3.5 flex-1 overflow-y-auto custom-scrollbar">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">📋 컬럼 ({columns.length})</p>
                                    <div className="space-y-1">
                                        {columns.map(c => (
                                            <div key={c} className="flex items-center justify-between gap-1">
                                                <span className="text-[11px] text-slate-400 truncate">{c}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0" style={{
                                                    background: colTypes[c] === 'number' ? 'rgba(192,132,252,0.15)' : colTypes[c] === 'date' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                                                    color: colTypes[c] === 'number' ? '#c084fc' : colTypes[c] === 'date' ? '#fbbf24' : '#475569'
                                                }}>{colTypes[c] || 'txt'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ PIPELINE TAB ══ */}
                {mainTab === 'pipeline' && (
                    <div className="flex-1 overflow-hidden flex min-h-0">
                        {/* 파이프라인 스텝 */}
                        <div className="flex-1 flex flex-col min-h-0 p-5">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-200">🔗 변환 파이프라인</h3>
                                    <p className="text-xs text-slate-600 mt-0.5">여러 변환을 순서대로 쌓아 한 번에 실행합니다</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPipeline([])} disabled={pipeline.length === 0}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 disabled:opacity-30 transition-all"
                                        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                                        초기화
                                    </button>
                                    <button onClick={runPipeline} disabled={pipeline.length === 0 || !isDataReady}
                                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-30 transition-all hover:scale-105"
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.4)' }}>
                                        ▶ 파이프라인 실행
                                    </button>
                                </div>
                            </div>

                            {pipeline.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center rounded-2xl" style={{ border: '2px dashed rgba(255,255,255,0.06)' }}>
                                    <div className="text-3xl mb-3">🔗</div>
                                    <p className="text-slate-400 font-semibold text-sm mb-1">파이프라인이 비어있습니다</p>
                                    <p className="text-slate-600 text-xs text-center">변환 탐색 탭에서 카드의 <span className="text-violet-400 font-bold">+ 파이프라인</span> 버튼을 누르세요</p>
                                    <button onClick={() => setMainTab('browse')} className="mt-4 px-4 py-2 rounded-lg text-xs font-bold text-violet-400 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
                                        변환 탐색으로 이동 →
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                    {pipeline.map((step, idx) => {
                                        const m = CAT[step.action.category] || CAT['All'];
                                        return (
                                            <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                {/* 순서 번호 */}
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                                                    {idx + 1}
                                                </div>
                                                {/* 카테고리 뱃지 */}
                                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0" style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}>
                                                    {m.emoji} {step.action.category}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-slate-200 truncate">{step.action.name}</div>
                                                    {Object.keys(step.params).length > 0 && (
                                                        <div className="flex gap-1.5 mt-1 flex-wrap">
                                                            {Object.entries(step.params).map(([k, v]) => (
                                                                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                                                    {k}: {v}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* 위/아래 이동 */}
                                                <div className="flex flex-col gap-0.5 shrink-0">
                                                    <button onClick={() => { if (idx > 0) { const p = [...pipeline]; [p[idx-1], p[idx]] = [p[idx], p[idx-1]]; setPipeline(p); } }}
                                                        disabled={idx === 0} className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-all text-xs">▲</button>
                                                    <button onClick={() => { if (idx < pipeline.length-1) { const p = [...pipeline]; [p[idx+1], p[idx]] = [p[idx], p[idx+1]]; setPipeline(p); } }}
                                                        disabled={idx === pipeline.length-1} className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-all text-xs">▼</button>
                                                </div>
                                                <button onClick={() => setPipeline(p => p.filter(s => s.id !== step.id))}
                                                    className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 text-sm">✕</button>
                                            </div>
                                        );
                                    })}
                                    {/* 커넥터 라인 시각화 */}
                                    {pipeline.length > 1 && (
                                        <div className="flex items-center gap-2 px-4 py-1">
                                            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))' }} />
                                            <span className="text-[10px] text-slate-700 font-bold">{pipeline.length}단계 연속 실행</span>
                                            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.4), rgba(99,102,241,0.4))' }} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 파이프라인 저장 */}
                            {pipeline.length > 0 && (
                                <div className="shrink-0 mt-3 flex gap-2">
                                    <input type="text" placeholder="파이프라인 이름 입력 후 저장..." value={pipelineName} onChange={e => setPipelineName(e.target.value)}
                                        className="flex-1 px-3 py-2 text-xs rounded-lg outline-none text-slate-200"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                    <button onClick={savePipeline} disabled={!pipelineName.trim()}
                                        className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-30 transition-all"
                                        style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                                        💾 저장
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 우측: 저장된 파이프라인 */}
                        <div className="w-56 shrink-0 flex flex-col p-4 hidden lg:flex" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">💾 저장된 파이프라인</p>
                            {savedPipelines.length === 0 ? (
                                <p className="text-[11px] text-slate-700">저장된 파이프라인이 없습니다</p>
                            ) : (
                                <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1">
                                    {savedPipelines.map((sp, i) => (
                                        <div key={i} className="rounded-xl p-3 cursor-pointer group transition-all hover:border-violet-500/30" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-bold text-slate-300 truncate">{sp.name}</span>
                                                <button onClick={() => setSavedPipelines(p => p.filter((_, j) => j !== i))} className="text-slate-700 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100">✕</button>
                                            </div>
                                            <div className="text-[10px] text-slate-600 mb-2">{sp.steps.length}단계</div>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {sp.steps.slice(0, 3).map((s, j) => (
                                                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate max-w-[80px]" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }} title={s.name}>{s.name}</span>
                                                ))}
                                                {sp.steps.length > 3 && <span className="text-[10px] text-slate-600">+{sp.steps.length - 3}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ══ 액션 입력 오버레이 ══ */}
            {selectedAction && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center p-6" style={{ background: 'rgba(4,8,20,0.75)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedAction(null)}>
                    <div className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        {/* 폼 */}
                        <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 className="text-sm font-bold text-slate-100 mb-1">{selectedAction.name}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{selectedAction.desc}</p>
                            </div>
                            <div className="p-5 space-y-4 flex-1">
                                {selectedAction.inputs.map(inp => {
                                    const isSelect = inp.type.startsWith('select');
                                    const opts = isSelect ? getOpts(inp.type) : [];
                                    return (
                                        <div key={inp.id}>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{inp.label}</label>
                                            {isSelect ? (
                                                <select value={formValues[inp.id] || ''} onChange={e => setFormValues({ ...formValues, [inp.id]: e.target.value })}
                                                    className="w-full px-3 py-2.5 text-sm text-slate-200 rounded-xl outline-none transition-all"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    {opts.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            ) : (
                                                <input type={inp.type} value={formValues[inp.id] || ''} onChange={e => setFormValues({ ...formValues, [inp.id]: e.target.value })}
                                                    placeholder={inp.placeholder}
                                                    className="w-full px-3 py-2.5 text-sm text-slate-200 rounded-xl outline-none transition-all"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-4 flex gap-2 justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <button onClick={() => setSelectedAction(null)} className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">취소</button>
                                <button onClick={handleFormSubmit} className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all hover:scale-105"
                                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 4px 16px rgba(14,165,233,0.3)' }}>
                                    적용하기
                                </button>
                            </div>
                        </div>

                        {/* 미리보기 */}
                        <div className="flex-1 p-5 hidden md:flex flex-col" style={{ background: 'rgba(255,255,255,0.01)' }}>
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3">📊 데이터 스냅샷</p>
                            {!previewCol ? (
                                <div className="flex-1 flex items-center justify-center rounded-xl text-slate-600 text-xs text-center" style={{ border: '2px dashed rgba(255,255,255,0.05)' }}>
                                    컬럼을 선택하면<br />실제 데이터가 표시됩니다
                                </div>
                            ) : (
                                <div className="flex-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead><tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                            <th className="py-2 px-3 text-slate-600 font-mono w-8">#</th>
                                            <th className="py-2 px-3 text-slate-400">{previewCol}</th>
                                        </tr></thead>
                                        <tbody>
                                            {previewRows.map((row, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <td className="py-2 px-3 text-slate-700 font-mono">{i+1}</td>
                                                    <td className="py-2 px-3 text-slate-300 font-mono truncate max-w-0">
                                                        {row[previewCol] == null ? <span className="text-slate-700 italic">null</span> : String(row[previewCol]) || <span className="text-slate-700 italic">empty</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="mt-3 p-3 rounded-xl text-xs text-sky-400 leading-relaxed" style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
                                ℹ️ <strong className="text-sky-300">{previewCol || '컬럼'}</strong> 전체에 일괄 적용됩니다. 취소하려면 상단 [이전 결과로] 버튼을 사용하세요.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionTitle = ({ icon, label, sub }) => (
    <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{icon}</span>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</h3>
        {sub && <span className="text-[10px] text-slate-700">{sub}</span>}
    </div>
);

const ActionCard = ({ action: a, avail, fav, onFav, onClick, onPipe, compact = false }) => {
    const [hov, setHov] = useState(false);
    const m = CAT[a.category] || CAT['All'];
    return (
        <div
            onClick={avail ? onClick : undefined}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            className={`relative flex flex-col rounded-xl transition-all duration-150 overflow-hidden select-none ${avail ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'} ${compact ? 'p-2.5' : 'p-3.5'}`}
            style={{
                background: hov && avail ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${hov && avail ? m.border : 'rgba(255,255,255,0.06)'}`,
                boxShadow: hov && avail ? `0 4px 20px ${m.bg}` : 'none',
            }}
        >
            {/* 즐겨찾기 */}
            <button onClick={e => { e.stopPropagation(); onFav(); }}
                className={`absolute top-2 right-2 text-xs transition-all ${fav || hov ? 'opacity-100' : 'opacity-0'}`}>
                {fav ? '⭐' : '☆'}
            </button>
            <div className="font-semibold text-slate-200 text-xs leading-tight pr-5 mb-1">{a.name}</div>
            {!compact && <div className="text-[11px] text-slate-600 leading-relaxed flex-1 mb-2">{a.desc}</div>}
            {!compact && <div className="text-[10px] font-mono px-2 py-1 rounded-lg truncate" style={{ background: 'rgba(255,255,255,0.03)', color: '#475569' }}>{a.example}</div>}
            {/* 파이프라인 추가 버튼 */}
            {avail && hov && (
                <button onClick={onPipe}
                    className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all"
                    style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8' }}>
                    + 파이프라인
                </button>
            )}
            {/* 하단 호버 라인 */}
            {avail && <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-200" style={{ width: hov ? '100%' : '0%', background: `linear-gradient(90deg, ${m.color}, transparent)` }} />}
        </div>
    );
};

export default CommandPalette;
