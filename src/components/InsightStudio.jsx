import React, { useState, useMemo, useCallback, useEffect } from 'react';

// ── 헬퍼 함수 ──────────────────────────────────────────────────
const isNumeric = (val) => val !== null && val !== undefined && val !== '' && !isNaN(Number(val));

function getColumnProfile(data, col) {
    const vals = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
    const nullCount = data.length - vals.length;
    const uniqueVals = [...new Set(vals.map(String))];
    const numericVals = vals.filter(isNumeric).map(Number);
    const isNum = numericVals.length / Math.max(vals.length, 1) > 0.7;

    let stats = {};
    if (isNum && numericVals.length > 0) {
        const sorted = [...numericVals].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        const mean = sum / sorted.length;
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        const variance = sorted.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / sorted.length;
        const stddev = Math.sqrt(variance);
        const q1 = sorted[Math.floor(sorted.length / 4)];
        const q3 = sorted[Math.floor((sorted.length * 3) / 4)];
        const iqr = q3 - q1;
        const outlierLow = q1 - 1.5 * iqr;
        const outlierHigh = q3 + 1.5 * iqr;
        const outliers = sorted.filter(v => v < outlierLow || v > outlierHigh);
        stats = { min: sorted[0], max: sorted[sorted.length - 1], mean, median, stddev, sum, q1, q3, iqr, outlierCount: outliers.length, zeroCount: sorted.filter(v => v === 0).length, negCount: sorted.filter(v => v < 0).length };
    }

    // 분포 히스토그램 (숫자형) 또는 빈도 (텍스트형)
    let distribution = [];
    if (isNum && numericVals.length > 1) {
        const min = stats.min, max = stats.max;
        const range = max - min;
        const bins = Math.min(8, Math.ceil(Math.sqrt(numericVals.length)));
        const binSize = range / bins || 1;
        const buckets = Array.from({ length: bins }, (_, i) => ({ label: `${(min + i * binSize).toFixed(1)}`, count: 0 }));
        numericVals.forEach(v => {
            const idx = Math.min(Math.floor((v - min) / binSize), bins - 1);
            if (buckets[idx]) buckets[idx].count++;
        });
        distribution = buckets;
    } else {
        const freq = {};
        vals.forEach(v => { const k = String(v); freq[k] = (freq[k] || 0) + 1; });
        distribution = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
    }

    return {
        col, type: isNum ? 'numeric' : 'text',
        total: data.length, filled: vals.length, nullCount,
        nullPct: ((nullCount / data.length) * 100).toFixed(1),
        uniqueCount: uniqueVals.length,
        uniquePct: ((uniqueVals.length / Math.max(vals.length, 1)) * 100).toFixed(1),
        topValues: uniqueVals.slice(0, 5),
        distribution, ...stats,
    };
}

function getPearsonCorrelation(data, col1, col2) {
    const pairs = data.map(r => [Number(r[col1]), Number(r[col2])]).filter(([a, b]) => !isNaN(a) && !isNaN(b));
    if (pairs.length < 3) return null;
    const n = pairs.length;
    const meanA = pairs.reduce((s, p) => s + p[0], 0) / n;
    const meanB = pairs.reduce((s, p) => s + p[1], 0) / n;
    const num = pairs.reduce((s, p) => s + (p[0] - meanA) * (p[1] - meanB), 0);
    const denA = Math.sqrt(pairs.reduce((s, p) => s + Math.pow(p[0] - meanA, 2), 0));
    const denB = Math.sqrt(pairs.reduce((s, p) => s + Math.pow(p[1] - meanB, 2), 0));
    return (denA * denB === 0) ? null : num / (denA * denB);
}

function getDataQualityScore(profiles) {
    if (!profiles.length) return 100;
    let score = 100;
    profiles.forEach(p => {
        const nullPenalty = Math.min(parseFloat(p.nullPct) * 0.3, 20);
        const dupPenalty = parseFloat(p.uniquePct) < 5 && p.type === 'text' ? 5 : 0;
        score -= nullPenalty + dupPenalty;
    });
    return Math.max(0, Math.round(score));
}

function getSmartInsights(profiles, numericCols, data) {
    const insights = [];
    const highNull = profiles.filter(p => parseFloat(p.nullPct) > 10);
    if (highNull.length > 0) insights.push({ type: 'warning', icon: '⚠️', title: '높은 결측치 비율', desc: `${highNull.map(p => p.col).join(', ')} 컬럼에 ${highNull.map(p => p.nullPct + '%').join(', ')} 결측치가 있습니다.` });
    const highOutlier = profiles.filter(p => p.type === 'numeric' && p.outlierCount > 0);
    if (highOutlier.length > 0) insights.push({ type: 'alert', icon: '🔍', title: '이상치 감지', desc: `${highOutlier.map(p => `${p.col}(${p.outlierCount}개)`).join(', ')}에서 이상치가 발견됐습니다.` });
    const highUnique = profiles.filter(p => p.type === 'text' && parseFloat(p.uniquePct) > 90);
    if (highUnique.length > 0) insights.push({ type: 'info', icon: '🔑', title: '고유 식별자 의심', desc: `${highUnique.map(p => p.col).join(', ')} 컬럼이 ID/키 컬럼일 수 있습니다.` });
    const lowUnique = profiles.filter(p => p.type === 'text' && p.uniqueCount <= 5 && p.filled > 10);
    if (lowUnique.length > 0) insights.push({ type: 'info', icon: '📂', title: '범주형 컬럼 감지', desc: `${lowUnique.map(p => `${p.col}(${p.uniqueCount}개)`).join(', ')}은 카테고리로 다루기 좋습니다.` });
    if (numericCols.length >= 2 && data.length >= 5) {
        const corrs = [];
        for (let i = 0; i < Math.min(numericCols.length, 5); i++) {
            for (let j = i + 1; j < Math.min(numericCols.length, 5); j++) {
                const r = getPearsonCorrelation(data, numericCols[i], numericCols[j]);
                if (r !== null && Math.abs(r) > 0.7) corrs.push({ a: numericCols[i], b: numericCols[j], r: r.toFixed(2) });
            }
        }
        if (corrs.length > 0) insights.push({ type: 'success', icon: '🔗', title: '강한 상관관계 발견', desc: corrs.map(c => `${c.a} ↔ ${c.b} (r=${c.r})`).join(', ') });
    }
    const negCols = profiles.filter(p => p.type === 'numeric' && p.negCount > 0);
    if (negCols.length > 0) insights.push({ type: 'info', icon: '📉', title: '음수 값 존재', desc: `${negCols.map(p => p.col).join(', ')}에 음수 값이 포함되어 있습니다.` });
    if (insights.length === 0) insights.push({ type: 'success', icon: '✅', title: '데이터 품질 우수', desc: '심각한 품질 문제가 발견되지 않았습니다.' });
    return insights;
}

// ── 색상 헬퍼 ──────────────────────────────────────────────────
const corrColor = (r) => {
    if (r === null) return 'rgba(255,255,255,0.03)';
    const abs = Math.abs(r);
    if (r > 0) return `rgba(16,185,129,${abs * 0.8})`;
    return `rgba(239,68,68,${abs * 0.8})`;
};
const corrTextColor = (r) => {
    if (r === null) return '#334155';
    return Math.abs(r) > 0.4 ? '#fff' : '#94a3b8';
};

// ── AI 자동 요약 리포트 생성 ──────────────────────────────────
function generateAutoReport(profiles, numericCols, data, qualityScore) {
    const rows = data.length;
    const cols = profiles.length;
    const numCount = numericCols.length;
    const textCount = cols - numCount;
    const nullCols = profiles.filter(p => parseFloat(p.nullPct) > 10);
    const cleanCols = profiles.filter(p => parseFloat(p.nullPct) === 0);
    const highCard = profiles.filter(p => p.type === 'text' && p.uniqueCount > rows * 0.8);
    const lowCard = profiles.filter(p => p.type === 'text' && p.uniqueCount <= 5 && p.filled > 10);
    const outlierCols = profiles.filter(p => p.type === 'numeric' && p.outlierCount > 0);

    const sections = [];

    sections.push({
        icon: '📋',
        title: '데이터셋 개요',
        content: `총 ${rows.toLocaleString()}행 × ${cols}컬럼으로 구성된 데이터셋입니다. 수치형 ${numCount}개, 텍스트형 ${textCount}개 컬럼이 있으며 전체 데이터 품질 점수는 ${qualityScore}점입니다.`
    });

    if (cleanCols.length > 0) {
        sections.push({
            icon: '✅',
            title: '결측치 없는 컬럼',
            content: `${cleanCols.map(p => p.col).join(', ')} 컬럼은 결측치가 전혀 없습니다.`
        });
    }

    if (nullCols.length > 0) {
        sections.push({
            icon: '⚠️',
            title: '결측치 주의 컬럼',
            content: `${nullCols.map(p => `${p.col}(${p.nullPct}%)`).join(', ')}에 높은 결측치 비율이 감지되었습니다. 분석 전 처리를 권장합니다.`
        });
    }

    if (lowCard.length > 0) {
        sections.push({
            icon: '📂',
            title: '범주형 컬럼 추천',
            content: `${lowCard.map(p => `${p.col}(${p.uniqueCount}가지)`).join(', ')}은 고유값이 적어 피벗 테이블의 그룹/열 축에 사용하기 적합합니다.`
        });
    }

    if (highCard.length > 0) {
        sections.push({
            icon: '🔑',
            title: '식별자(ID) 컬럼 의심',
            content: `${highCard.map(p => p.col).join(', ')}은 고유값이 전체의 80% 이상입니다. ID나 키 컬럼일 가능성이 높아 집계 시 주의가 필요합니다.`
        });
    }

    if (numericCols.length > 0) {
        const numProfiles = profiles.filter(p => p.type === 'numeric');
        const largest = numProfiles.reduce((a, b) => (a.max || 0) > (b.max || 0) ? a : b, numProfiles[0]);
        if (largest) {
            sections.push({
                icon: '📈',
                title: '수치 컬럼 요약',
                content: `가장 큰 값 범위를 가진 컬럼은 "${largest.col}"입니다 (${largest.min?.toFixed(1)} ~ ${largest.max?.toFixed(1)}). 평균 ${largest.mean?.toFixed(1)}, 중앙값 ${largest.median?.toFixed(1)}.`
            });
        }
    }

    if (outlierCols.length > 0) {
        sections.push({
            icon: '🔍',
            title: '이상치 감지',
            content: `${outlierCols.map(p => `${p.col}(${p.outlierCount}개)`).join(', ')}에서 IQR 기반 이상치가 발견되었습니다. 이상치가 분석 결과를 왜곡할 수 있으므로 확인이 필요합니다.`
        });
    }

    const recActions = [];
    if (numericCols.length >= 1 && lowCard.length >= 1) recActions.push('피벗 테이블: ' + lowCard[0].col + ' 기준으로 ' + numericCols[0] + ' 집계 추천');
    if (numericCols.length >= 1) recActions.push('차트: ' + numericCols[0] + ' 컬럼으로 막대/꺾선 차트 시각화 추천');
    if (nullCols.length > 0) recActions.push('SQL: IS NULL 조건으로 결측치 행 먼저 조회 후 처리 추천');

    if (recActions.length > 0) {
        sections.push({
            icon: '💡',
            title: '추천 분석 액션',
            content: recActions.join(' / ')
        });
    }

    return sections;
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function InsightStudio({ data, columns, colTypes }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCol, setSelectedCol] = useState(null);
    const [corrHighlight, setCorrHighlight] = useState(null);

    const numericCols = useMemo(() =>
        columns.filter(col => data.some(row => isNumeric(row[col]))),
        [columns, data]
    );

    const profiles = useMemo(() =>
        columns.map(col => getColumnProfile(data, col)),
        [columns, data]
    );

    const qualityScore = useMemo(() => getDataQualityScore(profiles), [profiles]);
    const insights = useMemo(() => getSmartInsights(profiles, numericCols, data), [profiles, numericCols, data]);

    const corrMatrix = useMemo(() => {
        if (numericCols.length < 2) return null;
        const cols = numericCols.slice(0, 8);
        const matrix = {};
        cols.forEach(a => {
            matrix[a] = {};
            cols.forEach(b => {
                matrix[a][b] = a === b ? 1 : getPearsonCorrelation(data, a, b);
            });
        });
        return { cols, matrix };
    }, [numericCols, data]);

    const scoreColor = qualityScore >= 80 ? '#10b981' : qualityScore >= 60 ? '#f59e0b' : '#ef4444';
    const scoreLabel = qualityScore >= 80 ? '우수' : qualityScore >= 60 ? '보통' : '주의 필요';

    const autoReport = useMemo(() => generateAutoReport(profiles, numericCols, data, qualityScore), [profiles, numericCols, data, qualityScore]);

    // 첫 컬럼 자동 선택 (컬럼 프로파일 탭에서 빈칸 방지)
    useEffect(() => {
        if (profiles.length > 0 && !selectedCol) {
            setSelectedCol(profiles[0].col);
        }
    }, [profiles]);

    if (!data.length) {
        return (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-slate-500">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>🔬</div>
                <p className="text-sm font-medium">데이터를 불러오면 인사이트 분석을 시작합니다</p>
            </div>
        );
    }

    const selectedProfile = selectedCol ? profiles.find(p => p.col === selectedCol) : null;
    const maxDistCount = selectedProfile?.distribution ? Math.max(...selectedProfile.distribution.map(d => d.count), 1) : 1;

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: 'transparent' }}>
            {/* 탭 헤더 */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 shrink-0 flex-wrap">
                {[
                    { id: 'overview', icon: '🔬', label: '데이터 개요' },
                    { id: 'columns', icon: '📊', label: '컬럼 프로파일' },
                    { id: 'correlation', icon: '🔗', label: '상관관계' },
                    { id: 'quality', icon: '✅', label: '품질 보고서' },
                    { id: 'auto', icon: '🤖', label: 'AI 자동 분석' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        style={activeTab === tab.id ? { background: 'rgba(99,102,241,0.15)', borderBottom: '2px solid #6366f1' } : {}}>
                        <span>{tab.icon}</span>{tab.label}
                        {tab.id === 'auto' && <span className="px-1 py-0.5 rounded text-[9px] font-black" style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>NEW</span>}
                    </button>
                ))}
            </div>
            <div className="w-full h-px" style={{ background: 'rgba(99,102,241,0.2)' }} />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {/* ── 개요 탭 ── */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* 데이터셋 통계 카드 */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: '총 행 수', value: data.length.toLocaleString(), icon: '📋', color: '#60a5fa' },
                                { label: '총 컬럼 수', value: columns.length, icon: '📐', color: '#a78bfa' },
                                { label: '숫자형 컬럼', value: numericCols.length, icon: '🔢', color: '#34d399' },
                                { label: '데이터 품질', value: qualityScore + '점', icon: '⭐', color: scoreColor },
                            ].map(card => (
                                <div key={card.label} className="p-4 rounded-xl flex items-center gap-3"
                                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <span className="text-2xl">{card.icon}</span>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-0.5">{card.label}</div>
                                        <div className="text-xl font-bold" style={{ color: card.color }}>{card.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 스마트 인사이트 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center text-xs">✨</span>
                                AI 스마트 인사이트
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {insights.map((ins, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg"
                                        style={{ background: ins.type === 'warning' ? 'rgba(245,158,11,0.07)' : ins.type === 'alert' ? 'rgba(239,68,68,0.07)' : ins.type === 'success' ? 'rgba(16,185,129,0.07)' : 'rgba(99,102,241,0.07)', border: `1px solid ${ins.type === 'warning' ? 'rgba(245,158,11,0.2)' : ins.type === 'alert' ? 'rgba(239,68,68,0.2)' : ins.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
                                        <span className="text-lg shrink-0">{ins.icon}</span>
                                        <div>
                                            <div className="text-xs font-bold text-slate-200 mb-0.5">{ins.title}</div>
                                            <div className="text-[11px] text-slate-500 leading-relaxed">{ins.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 컬럼 타입 분포 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-sm font-bold text-slate-200 mb-3">📂 컬럼 타입 분포</h3>
                            <div className="flex flex-wrap gap-2">
                                {profiles.map(p => (
                                    <button key={p.col} onClick={() => { setSelectedCol(p.col); setActiveTab('columns'); }}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                                        style={{ background: p.type === 'numeric' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${p.type === 'numeric' ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`, color: p.type === 'numeric' ? '#34d399' : '#a78bfa' }}>
                                        {p.type === 'numeric' ? '🔢' : '🔤'} {p.col}
                                        {parseFloat(p.nullPct) > 10 && <span className="text-amber-400">⚠</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 컬럼 프로파일 탭 ── */}
                {activeTab === 'columns' && (
                    <div className="flex gap-4 h-full min-h-0">
                        {/* 컬럼 목록 사이드바 */}
                        <div className="w-44 shrink-0 space-y-1 overflow-y-auto custom-scrollbar">
                            {profiles.map(p => (
                                <button key={p.col} onClick={() => setSelectedCol(p.col)}
                                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${selectedCol === p.col ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    style={selectedCol === p.col ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)' } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span>{p.type === 'numeric' ? '🔢' : '🔤'}</span>
                                    <span className="truncate">{p.col}</span>
                                    {parseFloat(p.nullPct) > 10 && <span className="text-amber-400 shrink-0">!</span>}
                                </button>
                            ))}
                        </div>

                        {/* 컬럼 상세 */}
                        {selectedProfile ? (
                            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-base font-bold text-slate-100">{selectedProfile.col}</h2>
                                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: selectedProfile.type === 'numeric' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', color: selectedProfile.type === 'numeric' ? '#34d399' : '#a78bfa' }}>
                                        {selectedProfile.type === 'numeric' ? '숫자형' : '텍스트형'}
                                    </span>
                                </div>

                                {/* 기본 통계 */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: '전체', value: selectedProfile.total.toLocaleString(), color: '#94a3b8' },
                                        { label: '채워진 값', value: selectedProfile.filled.toLocaleString(), color: '#34d399' },
                                        { label: '결측치', value: `${selectedProfile.nullCount} (${selectedProfile.nullPct}%)`, color: parseFloat(selectedProfile.nullPct) > 10 ? '#f59e0b' : '#64748b' },
                                        { label: '고유 값', value: `${selectedProfile.uniqueCount} (${selectedProfile.uniquePct}%)`, color: '#a78bfa' },
                                        ...(selectedProfile.type === 'numeric' ? [
                                            { label: '최솟값', value: selectedProfile.min?.toLocaleString(), color: '#60a5fa' },
                                            { label: '최댓값', value: selectedProfile.max?.toLocaleString(), color: '#f87171' },
                                            { label: '평균', value: selectedProfile.mean?.toFixed(2), color: '#fbbf24' },
                                            { label: '중앙값', value: selectedProfile.median?.toFixed(2), color: '#fb923c' },
                                            { label: '표준편차', value: selectedProfile.stddev?.toFixed(2), color: '#c084fc' },
                                        ] : []),
                                    ].map(stat => (
                                        <div key={stat.label} className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div className="text-[10px] text-slate-600 mb-1">{stat.label}</div>
                                            <div className="text-sm font-bold" style={{ color: stat.color }}>{stat.value ?? '-'}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* 분포 히스토그램 */}
                                {selectedProfile.distribution?.length > 0 && (
                                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="text-xs font-bold text-slate-400 mb-3">{selectedProfile.type === 'numeric' ? '📊 값 분포' : '📋 상위 빈도 값'}</div>
                                        <div className="space-y-1.5">
                                            {selectedProfile.distribution.map((bin, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-20 text-[10px] text-slate-500 truncate text-right shrink-0">{bin.label}</div>
                                                    <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                        <div className="h-full rounded transition-all duration-500"
                                                            style={{ width: `${(bin.count / maxDistCount) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                                                    </div>
                                                    <div className="w-8 text-[10px] text-slate-500 text-right shrink-0">{bin.count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 이상치 정보 */}
                                {selectedProfile.type === 'numeric' && selectedProfile.outlierCount > 0 && (
                                    <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <div className="text-xs font-bold text-red-400 mb-1">🔍 이상치 감지 (IQR 방법)</div>
                                        <p className="text-[11px] text-slate-400">Q1({selectedProfile.q1?.toFixed(1)}) ~ Q3({selectedProfile.q3?.toFixed(1)}) 범위를 벗어난 <span className="text-red-300 font-bold">{selectedProfile.outlierCount}개</span> 이상치 존재</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                                왼쪽에서 컬럼을 선택하세요
                            </div>
                        )}
                    </div>
                )}

                {/* ── 상관관계 탭 ── */}
                {activeTab === 'correlation' && (
                    <div className="space-y-4">
                        {corrMatrix ? (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-sm font-bold text-slate-200">피어슨 상관계수 매트릭스</h3>
                                    <span className="text-xs text-slate-500">(-1 ~ 1, 절댓값이 클수록 강한 상관)</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="text-xs border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="w-24 h-8 text-slate-600 text-right pr-2"></th>
                                                {corrMatrix.cols.map(col => (
                                                    <th key={col} className="h-8 px-1 text-center font-bold text-slate-400 min-w-[60px]">
                                                        <span className="block truncate max-w-[60px]" title={col}>{col.length > 6 ? col.slice(0, 6) + '…' : col}</span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {corrMatrix.cols.map(rowCol => (
                                                <tr key={rowCol}>
                                                    <td className="py-1 pr-2 text-right text-slate-400 font-bold truncate max-w-[90px]" title={rowCol}>
                                                        {rowCol.length > 9 ? rowCol.slice(0, 9) + '…' : rowCol}
                                                    </td>
                                                    {corrMatrix.cols.map(colCol => {
                                                        const r = corrMatrix.matrix[rowCol][colCol];
                                                        const isHl = corrHighlight === `${rowCol}-${colCol}` || corrHighlight === `${colCol}-${rowCol}`;
                                                        return (
                                                            <td key={colCol}
                                                                onMouseEnter={() => setCorrHighlight(`${rowCol}-${colCol}`)}
                                                                onMouseLeave={() => setCorrHighlight(null)}
                                                                className="p-0.5 text-center cursor-default transition-all"
                                                                style={{ outline: isHl ? '2px solid rgba(255,255,255,0.3)' : 'none', borderRadius: '4px' }}>
                                                                <div className="w-14 h-10 flex items-center justify-center rounded text-[11px] font-bold transition-all"
                                                                    style={{ background: corrColor(r), color: corrTextColor(r), outline: isHl ? '2px solid rgba(255,255,255,0.5)' : 'none' }}>
                                                                    {r !== null ? r.toFixed(2) : '-'}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* 범례 */}
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[-1, -0.7, -0.4, 0, 0.4, 0.7, 1].map(v => (
                                                <div key={v} className="w-6 h-4 rounded" style={{ background: corrColor(v) }} title={v.toString()} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-slate-500">-1 (음의 상관) ~ +1 (양의 상관)</span>
                                    </div>
                                </div>
                                {/* 강한 상관관계 목록 */}
                                {(() => {
                                    const strong = [];
                                    corrMatrix.cols.forEach((a, i) => corrMatrix.cols.forEach((b, j) => {
                                        if (j > i) { const r = corrMatrix.matrix[a][b]; if (r !== null && Math.abs(r) >= 0.5) strong.push({ a, b, r }); }
                                    }));
                                    if (!strong.length) return null;
                                    return (
                                        <div className="p-3 rounded-xl mt-2" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                            <div className="text-xs font-bold text-indigo-400 mb-2">🔗 주목할 상관관계 (|r| ≥ 0.5)</div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {strong.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).map(item => (
                                                    <div key={`${item.a}-${item.b}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                                                        style={{ background: item.r > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                                                        <span style={{ color: item.r > 0 ? '#34d399' : '#f87171' }}>{item.r > 0 ? '↑' : '↓'}</span>
                                                        <span className="text-slate-300 font-medium truncate">{item.a}</span>
                                                        <span className="text-slate-600">↔</span>
                                                        <span className="text-slate-300 font-medium truncate">{item.b}</span>
                                                        <span className="font-bold shrink-0" style={{ color: item.r > 0 ? '#34d399' : '#f87171' }}>({item.r.toFixed(2)})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                                상관관계 분석을 위해 2개 이상의 숫자형 컬럼이 필요합니다
                            </div>
                        )}
                    </div>
                )}

                {/* ── 품질 보고서 탭 ── */}
                {activeTab === 'quality' && (
                    <div className="space-y-4">
                        {/* 품질 점수 */}
                        <div className="flex items-center gap-6 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="relative w-24 h-24 shrink-0">
                                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                                        strokeDasharray={`${qualityScore} ${100 - qualityScore}`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black" style={{ color: scoreColor }}>{qualityScore}</span>
                                    <span className="text-[10px] text-slate-500">/ 100</span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: scoreColor }}>{scoreLabel}</h2>
                                <p className="text-sm text-slate-400 mt-1">데이터 품질 종합 점수</p>
                                <p className="text-xs text-slate-600 mt-2">{data.length}행 × {columns.length}컬럼 분석 완료</p>
                            </div>
                        </div>

                        {/* 컬럼별 품질 지표 */}
                        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="grid grid-cols-6 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                                <div className="col-span-2">컬럼</div>
                                <div className="text-right">타입</div>
                                <div className="text-right">채워진 값</div>
                                <div className="text-right">고유 값</div>
                                <div className="text-right">품질</div>
                            </div>
                            {profiles.map(p => {
                                const fillRate = ((p.filled / p.total) * 100).toFixed(0);
                                const colScore = Math.max(0, 100 - parseFloat(p.nullPct) * 1.5);
                                return (
                                    <button key={p.col} onClick={() => { setSelectedCol(p.col); setActiveTab('columns'); }}
                                        className="w-full grid grid-cols-6 px-3 py-2.5 hover:bg-white/3 transition-colors text-xs items-center border-b border-white/3">
                                        <div className="col-span-2 font-medium text-slate-300 truncate text-left">{p.col}</div>
                                        <div className="text-right">
                                            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: p.type === 'numeric' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)', color: p.type === 'numeric' ? '#34d399' : '#a78bfa' }}>
                                                {p.type === 'numeric' ? '숫자' : '텍스트'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                    <div className="h-full rounded-full" style={{ width: fillRate + '%', background: parseFloat(fillRate) > 90 ? '#10b981' : parseFloat(fillRate) > 70 ? '#f59e0b' : '#ef4444' }} />
                                                </div>
                                                <span style={{ color: parseFloat(fillRate) > 90 ? '#34d399' : '#f59e0b' }}>{fillRate}%</span>
                                            </div>
                                        </div>
                                        <div className="text-right text-slate-400">{p.uniqueCount}</div>
                                        <div className="text-right">
                                            <span className="font-bold" style={{ color: colScore >= 90 ? '#34d399' : colScore >= 70 ? '#fbbf24' : '#f87171' }}>
                                                {Math.round(colScore)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── AI 자동 분석 탭 ── */}
                {activeTab === 'auto' && (
                    <div className="space-y-4">
                        {/* 헤더 */}
                        <div className="rounded-xl p-4 flex items-start gap-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'rgba(99,102,241,0.2)' }}>🤖</div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-100 mb-1">AI 자동 데이터 분석 리포트</h2>
                                <p className="text-xs text-slate-400">데이터셋의 구조, 품질, 패턴을 자동으로 분석하여 실행 가능한 인사이트를 제공합니다.</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-[11px]" style={{ color: scoreColor }}>
                                        <span className="font-black text-lg">{qualityScore}</span>
                                        <span className="text-slate-500">/ 100점 ({scoreLabel})</span>
                                    </span>
                                    <span className="text-slate-600 text-[10px]">{data.length.toLocaleString()}행 · {columns.length}컬럼 분석</span>
                                </div>
                            </div>
                        </div>

                        {/* 분석 섹션들 */}
                        {autoReport.map((section, i) => (
                            <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl shrink-0">{section.icon}</span>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200 mb-1">{section.title}</div>
                                        <p className="text-xs text-slate-400 leading-relaxed">{section.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 스마트 인사이트 */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">🔬 자동 감지 인사이트</h3>
                            <div className="space-y-2">
                                {insights.map((ins, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                                        style={{ background: ins.type === 'warning' ? 'rgba(245,158,11,0.06)' : ins.type === 'alert' ? 'rgba(239,68,68,0.06)' : ins.type === 'success' ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)', border: `1px solid ${ins.type === 'warning' ? 'rgba(245,158,11,0.2)' : ins.type === 'alert' ? 'rgba(239,68,68,0.2)' : ins.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
                                        <span className="text-base shrink-0">{ins.icon}</span>
                                        <div>
                                            <div className="text-xs font-bold text-slate-200 mb-0.5">{ins.title}</div>
                                            <p className="text-xs text-slate-400">{ins.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 컬럼별 미니 요약 */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">📐 컬럼별 요약</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {profiles.map(p => (
                                    <div key={p.col} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                                        onClick={() => { setSelectedCol(p.col); setActiveTab('columns'); }}>
                                        <span className="text-base shrink-0">{p.type === 'numeric' ? '🔢' : '🔤'}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-slate-200 truncate">{p.col}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                {p.type === 'numeric'
                                                    ? `범위: ${p.min?.toFixed(1)} ~ ${p.max?.toFixed(1)} · 평균: ${p.mean?.toFixed(2)} · 결측 ${p.nullPct}%`
                                                    : `고유값: ${p.uniqueCount}개 · 결측 ${p.nullPct}% · 최빈: "${p.topValues?.[0] ?? '-'}"`}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold shrink-0"
                                            style={{ color: parseFloat(p.nullPct) === 0 ? '#34d399' : parseFloat(p.nullPct) < 5 ? '#fbbf24' : '#f87171' }}>
                                            {parseFloat(p.nullPct) === 0 ? '✓ 완전' : `⚠ ${p.nullPct}%`}
                                        </div>
                                        <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
