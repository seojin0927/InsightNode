import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Chart from 'chart.js/auto';
import 'chartjs-plugin-datalabels';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Chart.js v3+에서 datalabels 플러그인 등록
Chart.register(ChartDataLabels);

// 1. 차트 그룹 정의
const CHART_GROUPS = [
    { id: 'basic', title: '기본 및 범용 차트', description: '보고서와 발표 자료에 가장 많이 사용하는 필수 차트' },
    { id: 'analytics', title: '통계 · 데이터 분석용', description: '데이터의 분포, 상관관계, 이상치를 깊이 있게 분석' },
    { id: 'business', title: '비즈니스 · 특수 차트', description: '재무, 영업 흐름, 지리적 데이터 등 특수 목적 차트' },
    { id: 'management', title: '프로젝트 · KPI 대시보드', description: '일정 관리, 목표 달성률 등 현황판 구성에 최적화' },
    { id: 'flow_matrix', title: '흐름 및 매트릭스', description: '고급 데이터 흐름도 및 다차원 복합 분석' },
];

// 2. 목적별 스마트 필터
const PURPOSE_FILTERS = [
    { id: 'all', label: '전체 보기' },
    { id: 'compare', label: '📊 값 비교' },
    { id: 'trend', label: '📈 추세·흐름' },
    { id: 'proportion', label: '🍕 비율·비중' },
    { id: 'distribution', label: '🎯 분포·상관관계' },
    { id: 'schedule', label: '🗓️ 일정·진척도' },
    { id: 'flow', label: '🌊 유입·데이터 흐름' },
];

// 3. 차트 템플릿
const CHART_TEMPLATES = [
    // 기본 및 범용
    { id: 'column-basic',  group: 'basic', title: '세로 막대형',          subtitle: '항목 간 크기 비교',                             variants: ['묶은', '누적'],               chartType: 'bar',           purpose: ['compare'],               stacked: false, sort: 'none',   stylePreset: 'report',  valueFormat: 'comma' },
    { id: 'bar-basic',     group: 'basic', title: '가로 막대형',          subtitle: '항목 이름이 길거나 순위 표시',                 variants: ['묶은', '누적'],               chartType: 'horizontal-bar', purpose: ['compare'],              stacked: false, sort: 'desc',   stylePreset: 'report',  valueFormat: 'comma' },
    { id: 'line-trend',    group: 'basic', title: '꺾은선형',             subtitle: '시간에 따른 데이터 변화 추세',                 variants: ['표식 있는'],                 chartType: 'line',          purpose: ['trend'],                 showTrendLine: true,            sort: 'none',   stylePreset: 'pitch' },
    { id: 'area-basic',    group: 'basic', title: '영역형',               subtitle: '시간 흐름에 따른 누적 변화량 강조',           variants: ['누적'],                       chartType: 'area',          purpose: ['trend', 'compare'],     stacked: true,                  sort: 'none',   stylePreset: 'pitch' },
    { id: 'pie-basic',     group: 'basic', title: '원형',                 subtitle: '전체 중 각 항목이 차지하는 비율',             variants: ['쪼개진 원형'],               chartType: 'pie',           purpose: ['proportion'],           sort: 'desc',                   valueFormat: 'percent' },
    { id: 'doughnut-basic',group: 'basic', title: '도넛형',               subtitle: '여러 데이터 계열의 비율을 겹쳐 표현',         variants: ['멀티 계열'],                 chartType: 'doughnut',      purpose: ['proportion'],           sort: 'desc',                   valueFormat: 'percent' },
    { id: 'combo-basic',   group: 'basic', title: '혼합형 (막대+선)',     subtitle: '막대(값)와 꺾은선(추세)을 이중 축으로 표현', variants: ['보조 축 추가'],               chartType: 'combo',         purpose: ['compare', 'trend'],     stacked: false,                 sort: 'none',   stylePreset: 'report' },

    // 통계 및 분석용
    { id: 'scatter-basic', group: 'analytics', title: '분산형 (XY)',     subtitle: '두 변수 간의 패턴과 상관관계',                 variants: ['회귀선'],                     chartType: 'scatter',       purpose: ['distribution'],         showTrendLine: true,            sort: 'none' },
    { id: 'bubble-basic',  group: 'analytics', title: '거품형',          subtitle: '세 가지 변수를 위치와 크기로 시각화',         variants: ['3D 거품'],                   chartType: 'bubble',        purpose: ['distribution', 'compare'], sort: 'none' },
    { id: 'hist-basic',    group: 'analytics', title: '히스토그램',       subtitle: '데이터가 모여있는 빈도와 구간 분포',           variants: ['자동 구간'],                 chartType: 'histogram',     purpose: ['distribution'],         sort: 'none',                   stylePreset: 'report' },
    { id: 'pareto-basic',  group: 'analytics', title: '파레토 (80/20)',  subtitle: '가장 중요한 핵심 요인(불량 원인 등) 파악',     variants: ['막대+누적선'],               chartType: 'pareto',        purpose: ['distribution', 'proportion'], showCumulativeLine: true, sort: 'desc',   stylePreset: 'report', valueFormat: 'percent' },
    { id: 'box-basic',     group: 'analytics', title: '상자 수염',       subtitle: '중앙값, 사분위수, 이상치 한눈에 보기',        variants: ['가로/세로'],                 chartType: 'boxplot',       purpose: ['distribution'],         sort: 'none' },
    { id: 'radar-basic',   group: 'analytics', title: '방사형 (레이더)', subtitle: '여러 항목의 밸런스·평가 점수 비교',           variants: ['채워진 방사형'],             chartType: 'radar',         purpose: ['compare'],              sort: 'none',                   stylePreset: 'pitch' },

    // 비즈니스 및 특수
    { id: 'waterfall-basic', group: 'business', title: '폭포 차트',      subtitle: '재무 제표, 단계별 수익/지출 증감',             variants: ['누적 합계'],                 chartType: 'waterfall',     purpose: ['trend', 'compare'],     sort: 'none',                   stylePreset: 'report' },
    { id: 'funnel-basic',    group: 'business', title: '깔때기 (Funnel)',subtitle: '영업 파이프라인, 단계별 전환율',               variants: ['퍼센트 표시'],               chartType: 'funnel',        purpose: ['proportion', 'trend', 'flow'], sort: 'desc',          valueFormat: 'percent', stylePreset: 'pitch' },
    { id: 'treemap-basic',   group: 'business', title: '트리맵',         subtitle: '계층 구조 데이터를 사각형 면적으로 표현',     variants: ['비율+비교'],                 chartType: 'treemap',       purpose: ['proportion', 'compare'], sort: 'desc',                   valueFormat: 'percent' },
    { id: 'sunburst-basic',  group: 'business', title: '선버스트',       subtitle: '동심원 형태의 계층 구조',                     variants: ['다중 계층'],                 chartType: 'sunburst',      purpose: ['proportion'],           sort: 'desc',                   valueFormat: 'percent' },
    { id: 'stock-basic',     group: 'business', title: '주식형',         subtitle: '고가-저가-종가 등 금융 데이터',               variants: ['캔들스틱'],                   chartType: 'stock',         purpose: ['trend', 'distribution'], showTrendLine: true,         sort: 'none',   stylePreset: 'report' },

    // 프로젝트·KPI
    { id: 'gantt-basic',   group: 'management', title: '간트 차트 (Gantt)', subtitle: '프로젝트 일정, WBS, 진척도',          variants: ['마일스톤', '의존성 연결'], chartType: 'gantt',   purpose: ['schedule'],              sort: 'none',                   stylePreset: 'report' },
    { id: 'gauge-kpi',     group: 'management', title: '게이지 차트',       subtitle: '목표 달성률, KPI 현황',                  variants: ['반원형', '색상 밴드'],       chartType: 'gauge',  purpose: ['compare'],               sort: 'none',                   valueFormat: 'percent', stylePreset: 'pitch' },
    { id: 'bullet-basic',  group: 'management', title: '불릿 그래프',       subtitle: '목표 vs 실적을 좁은 공간에서 비교',       variants: ['가로형', '세로형'],         chartType: 'bullet', purpose: ['compare'],               sort: 'none',                   stylePreset: 'report' },
    
    // 흐름·매트릭스
    { id: 'sankey-basic',   group: 'flow_matrix', title: '생키 다이어그램', subtitle: '자금/사용자 흐름 경로',                  variants: ['다중 노드'],                 chartType: 'sankey',  purpose: ['flow', 'proportion'],   sort: 'none',                   stylePreset: 'report' },
    { id: 'heatmap-basic',  group: 'flow_matrix', title: '히트맵',          subtitle: '요일·시간대별 활성도 등 2차원 밀도',       variants: ['단일 색상', '분기 색상'],   chartType: 'heatmap', purpose: ['distribution', 'compare'], sort: 'none',                  stylePreset: 'report' },
    { id: 'marimekko-basic',group: 'flow_matrix', title: '메코 차트',       subtitle: '시장 점유율(높이)+시장 규모(너비)',         variants: ['모자이크 차트'],             chartType: 'marimekko', purpose: ['proportion', 'compare'], sort: 'desc',                  valueFormat: 'percent', stylePreset: 'report' },
    { id: 'tornado-basic',  group: 'flow_matrix', title: '토네이도 차트',   subtitle: '민감도 분석, 인구 피라미드',               variants: ['양방향 막대'],               chartType: 'tornado', purpose: ['compare', 'distribution'], sort: 'none',                  stylePreset: 'report' },
];

// 혁신 기능 1: CSS 미니 차트 생성기 (썸네일용)
const MiniChartVisual = ({ type }) => {
    switch(type) {
        case 'bar':
        case 'histogram':
        case 'waterfall':
            return (
                <div className="flex items-end justify-center h-full w-full gap-1 p-2">
                    <div className="w-1/4 h-1/2 bg-sky-500 rounded-t-sm"></div>
                    <div className="w-1/4 h-full bg-sky-400 rounded-t-sm"></div>
                    <div className="w-1/4 h-3/4 bg-sky-600 rounded-t-sm"></div>
                </div>
            );
        case 'horizontal-bar':
        case 'tornado':
            return (
                <div className="flex flex-col items-start justify-center h-full w-full gap-1 p-2">
                    <div className="h-1/4 w-3/4 bg-sky-500 rounded-r-sm"></div>
                    <div className="h-1/4 w-full bg-sky-400 rounded-r-sm"></div>
                    <div className="h-1/4 w-1/2 bg-sky-600 rounded-r-sm"></div>
                </div>
            );
        case 'line':
        case 'area':
        case 'combo':
            return (
                <div className="relative h-full w-full p-2">
                    <svg className="w-full h-full text-sky-400" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline points="0,80 30,50 60,70 100,20" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        {type === 'area' && <polygon points="0,100 0,80 30,50 60,70 100,20 100,100" fill="currentColor" opacity="0.2" />}
                    </svg>
                </div>
            );
        case 'pie':
        case 'doughnut':
        case 'sunburst':
            return (
                <div className="flex items-center justify-center h-full w-full">
                    <div className={`w-10 h-10 rounded-full border-4 border-slate-700 ${type !== 'doughnut' ? 'bg-sky-500' : 'border-t-sky-500 border-r-sky-400'}`} 
                         style={type === 'pie' ? { background: 'conic-gradient(#0ea5e9 0% 70%, #38bdf8 70% 100%)'} : {}}>
                    </div>
                </div>
            );
        case 'scatter':
        case 'bubble':
            return (
                <div className="relative h-full w-full p-2">
                    <div className="absolute top-2 right-3 w-2 h-2 rounded-full bg-sky-400"></div>
                    <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-sky-500"></div>
                    <div className="absolute bottom-3 right-5 w-4 h-4 rounded-full bg-sky-300 opacity-80"></div>
                    <div className="absolute bottom-5 left-3 w-2 h-2 rounded-full bg-sky-600"></div>
                </div>
            );
        case 'gantt':
            return (
                <div className="flex flex-col gap-1.5 h-full w-full justify-center p-2">
                    <div className="h-2 rounded bg-sky-500 w-2/3"></div>
                    <div className="h-2 rounded bg-indigo-400 w-1/2 ml-4"></div>
                    <div className="h-2 rounded bg-violet-500 w-3/4 ml-2"></div>
                </div>
            );
        case 'gauge':
            return (
                <div className="relative h-full w-full flex items-center justify-center">
                    <div className="w-16 h-8 overflow-hidden">
                        <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-sky-500 border-r-amber-400 border-l-emerald-400 rotate-45"></div>
                    </div>
                </div>
            );
        case 'bullet':
            return (
                <div className="flex flex-col gap-2 h-full w-full justify-center p-2">
                    <div className="relative h-3 w-full bg-slate-800 rounded-sm overflow-hidden">
                        <div className="absolute inset-y-1 left-1 right-6 bg-sky-500 rounded-sm"></div>
                        <div className="absolute inset-y-0 left-2 right-1 border-l-2 border-white/70"></div>
                    </div>
                    <div className="relative h-3 w-full bg-slate-800 rounded-sm overflow-hidden">
                        <div className="absolute inset-y-1 left-1 right-10 bg-emerald-500 rounded-sm"></div>
                        <div className="absolute inset-y-0 left-1/2 right-1 border-l-2 border-white/70"></div>
                    </div>
                </div>
            );
        case 'sankey':
            return (
                <div className="relative h-full w-full p-2">
                    <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                        <path d="M5,10 C30,20 40,30 95,35" fill="none" stroke="#0ea5e9" strokeWidth="6" strokeLinecap="round" />
                        <path d="M5,25 C30,30 40,20 95,15" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                </div>
            );
        case 'heatmap':
            return (
                <div className="grid grid-cols-4 gap-0.5 h-full w-full p-2">
                    {['10','40','80','30','60','90','20','50'].map((v, i) => (
                        <div
                            key={i}
                            className="rounded-sm bg-sky-500"
                            style={{ opacity: Number(v) / 100 }}
                        ></div>
                    ))}
                </div>
            );
        case 'marimekko':
            return (
                <div className="flex h-full w-full gap-0.5 p-2 items-end">
                    <div className="flex flex-col gap-0.5 h-full w-1/4">
                        <div className="bg-sky-500 h-2/3 rounded-sm" />
                        <div className="bg-slate-700 h-1/3 rounded-sm" />
                    </div>
                    <div className="flex flex-col gap-0.5 h-full w-2/4">
                        <div className="bg-sky-400 h-1/3 rounded-sm" />
                        <div className="bg-slate-700 h-2/3 rounded-sm" />
                    </div>
                    <div className="flex flex-col gap-0.5 h-full w-1/4">
                        <div className="bg-sky-300 h-4/5 rounded-sm" />
                        <div className="bg-slate-700 h-1/5 rounded-sm" />
                    </div>
                </div>
            );
        default:
            return (
                <div className="flex items-center justify-center h-full w-full text-xl opacity-50">
                    📊
                </div>
            );
    }
};

// 4. 카드 컴포넌트
const ChartPreviewCard = ({ template, onPreview }) => (
    <div
        className="group relative flex flex-col items-stretch gap-2 p-3 rounded-xl text-left bg-slate-900/60 border border-slate-700/60 hover:border-sky-500/60 hover:bg-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
        onClick={() => onPreview(template)}
    >
        <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-950/80 flex items-center justify-center border border-slate-800/50 group-hover:border-sky-500/30 transition-colors">
            <MiniChartVisual type={template.chartType} />
            <span className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700/50 backdrop-blur-sm">
                {template.chartType.toUpperCase()}
            </span>
        </div>
        
        <div className="flex flex-col mt-1">
            <span className="text-sm font-bold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
                {template.title}
            </span>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight mt-0.5 min-h-[2.5rem]">
                {template.subtitle}
            </p>
        </div>

        {template.variants && (
            <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-slate-800/50">
                {template.variants.slice(0, 2).map((variant, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                        {variant}
                    </span>
                ))}
            </div>
        )}
    </div>
);

// 혁신 기능 2: 디테일 미리보기 모달 컴포넌트
const PreviewModal = ({ template, onClose, onSelect }) => {
    if (!template) return null;

    const dataGuide = useMemo(() => {
        if (['pie', 'doughnut', 'funnel'].includes(template.chartType)) {
            return [
                { category: "A", value: 40 },
                { category: "B", value: 30 },
                { category: "C", value: 20 }
            ];
        } else if (['scatter', 'bubble'].includes(template.chartType)) {
            return [
                { x: 10, y: 20, r: 5 },
                { x: 15, y: 35, r: 10 },
                { x: 22, y: 15, r: 8 }
            ];
        } else if (template.chartType === 'treemap' || template.chartType === 'marimekko') {
            return [
                { segment: "A", value: 50, sub: [{ name: "A1", value: 30 }, { name: "A2", value: 20 }] },
                { segment: "B", value: 30, sub: [{ name: "B1", value: 15 }, { name: "B2", value: 15 }] },
                { segment: "C", value: 20, sub: [{ name: "C1", value: 20 }] }
            ];
        } else if (template.chartType === 'sankey') {
            return [
                { from: "Landing", to: "Signup", value: 60 },
                { from: "Signup", to: "Purchase", value: 30 },
                { from: "Landing", to: "Exit", value: 40 }
            ];
        } else if (template.chartType === 'heatmap') {
            return [
                { row: "Mon", col: "AM", value: 10 },
                { row: "Mon", col: "PM", value: 30 },
                { row: "Tue", col: "AM", value: 50 },
                { row: "Tue", col: "PM", value: 80 }
            ];
        } else if (template.chartType === 'tornado') {
            return [
                { category: "Factor A", left: 30, right: 20 },
                { category: "Factor B", left: 10, right: 40 },
                { category: "Factor C", left: 25, right: 25 }
            ];
        }
        return [
            { label: "Jan", sales: 120, profit: 40 },
            { label: "Feb", sales: 150, profit: 55 },
            { label: "Mar", sales: 90,  profit: 25 }
        ];
    }, [template.chartType]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/30">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                {template.group.toUpperCase()}
                            </span>
                            <h2 className="text-xl font-bold text-white">{template.title}</h2>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{template.subtitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">✕</button>
                </div>
                <div className="p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent"></div>
                        <div className="w-48 h-48 relative z-10">
                            <MiniChartVisual type={template.chartType} />
                        </div>
                        <span className="absolute bottom-3 right-3 text-xs text-slate-500">Live Preview</span>
                    </div>
                    <div className="flex-1 space-y-5">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1">💡 지원하는 배리에이션</h3>
                            <div className="flex flex-wrap gap-2">
                                {template.variants?.map((v, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-300">{v}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1">📋 요구 데이터 구조 (JSON)</h3>
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto custom-scrollbar">
                                <pre className="text-[11px] text-sky-300 font-mono">
                                    {JSON.stringify(dataGuide, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">취소</button>
                    <button onClick={() => { onSelect(template); onClose(); }} className="px-5 py-2 rounded-lg text-sm font-bold bg-sky-500 text-white hover:bg-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all">
                        이 차트로 디자인하기 ➡️
                    </button>
                </div>
            </div>
        </div>
    );
};

// 5. 갤러리 메인 페이지 컴포넌트
export function ChartDesignPage({ onSelectTemplate, onBack }) {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewTemplate, setPreviewTemplate] = useState(null);

    return (
        <div className="main-wrapper flex flex-col h-full bg-slate-950 overflow-hidden text-slate-200">
            <div className="flex flex-col gap-4 px-6 py-5 border-b border-slate-800/80 bg-slate-900/60 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">←</button>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-wide">차트 디자인 갤러리</h1>
                            <p className="text-xs text-slate-400 mt-0.5">데이터를 가장 잘 표현할 수 있는 시각화 템플릿을 선택하세요.</p>
                        </div>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                        <input 
                            type="text" 
                            placeholder="차트 이름, 용도 검색..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-full text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[12px] font-semibold text-slate-400 mr-2 flex items-center gap-1">🎯 목적별 뷰:</span>
                    {PURPOSE_FILTERS.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                                activeFilter === filter.id
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 pb-12">
                {CHART_GROUPS.map((group) => {
                    const filtered = CHART_TEMPLATES.filter(t => {
                        const matchGroup = t.group === group.id;
                        const matchFilter = activeFilter === 'all' || t.purpose.includes(activeFilter);
                        const matchSearch = !searchQuery || 
                            t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchGroup && matchFilter && matchSearch;
                    });
                    if (!filtered.length) return null;

                    return (
                        <section key={group.id} className="space-y-4">
                            <div className="flex items-end justify-between border-b border-slate-800/60 pb-2">
                                <div>
                                    <h2 className="text-base font-bold text-slate-50 flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-sky-500 rounded-full" />
                                        {group.title}
                                    </h2>
                                    <p className="text-[13px] text-slate-400 mt-1 pl-3.5">{group.description}</p>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                                    {filtered.length}개
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {filtered.map(tpl => (
                                    <ChartPreviewCard key={tpl.id} template={tpl} onPreview={setPreviewTemplate} />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            {previewTemplate && (
                <PreviewModal 
                    template={previewTemplate} 
                    onClose={() => setPreviewTemplate(null)} 
                    onSelect={(sel) => {
                        setPreviewTemplate(null);
                        if (onSelectTemplate) onSelectTemplate(sel);
                    }}
                />
            )}
        </div>
    );
}

// 6. 차트 뷰어 컴포넌트
const ChartViewer = ({
    data,
    columns,
    watermarkEnabled: propWatermarkEnabled = false,
    watermarkText: propWatermarkText = 'CONFIDENTIAL',
    watermarkDesign: propWatermarkDesign = 'single',
    onZoomChange,
    onRequestZoom,
    hideToolbar = false,
    designTemplate = null,
    onDesignTemplateApplied,
    // 메인 ↔ 확대(mainZoom) 등 여러 ChartViewer 인스턴스 간 상태 동기화를 위한 키
    syncId = null,
}) => {
    
    // 로컬 상태
    const [localWatermarkEnabled, setLocalWatermarkEnabled] = useState(Boolean(propWatermarkEnabled));
    const [localWatermarkText, setLocalWatermarkText] = useState(propWatermarkText || 'CONFIDENTIAL');
    const [localWatermarkDesign, setLocalWatermarkDesign] = useState(propWatermarkDesign || 'single');
    const [localWatermarkColor, setLocalWatermarkColor] = useState('#dc2626');
    const [watermarkGridSize, setWatermarkGridSize] = useState(3);
    const [watermarkFontSize, setWatermarkFontSize] = useState(48);
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.12);
    const [watermarkPosition, setWatermarkPosition] = useState('center');
    const [watermarkAngle, setWatermarkAngle] = useState(-45);

    // 메인 ↔ 확대(mainZoom) 동기화가 실제로 한 번이라도 복원되었는지 여부
    const [isSyncRestored, setIsSyncRestored] = useState(false);
    
    useEffect(() => { setLocalWatermarkEnabled(Boolean(propWatermarkEnabled)); }, [propWatermarkEnabled]);
    useEffect(() => { setLocalWatermarkText(propWatermarkText || 'CONFIDENTIAL'); }, [propWatermarkText]);
    useEffect(() => { setLocalWatermarkDesign(propWatermarkDesign || 'single'); }, [propWatermarkDesign]);

    const watermarkEnabled = localWatermarkEnabled;
    const watermarkText = localWatermarkText;
    const watermarkDesign = localWatermarkDesign;
    const watermarkColor = localWatermarkColor;
    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const containerRef = useRef(null);
    const chartAreaRef = useRef(null);
    
    const numericColumns = useMemo(() => 
        columns.filter(col => data.some(row => !isNaN(parseFloat(row[col])) && isFinite(row[col])))
    , [columns, data]);
    
    // ================= 데이터 매핑 및 집계 =================
    const [xAxis, setXAxis] = useState(columns[0] || '');
    const [yAxis, setYAxis] = useState(numericColumns[0] || columns[1] || columns[0] || '');
    const [yAxis2, setYAxis2] = useState(numericColumns[1] || numericColumns[0] || ''); 

    // 핵심 수정사항: Chart.js용 껍데기 타입과 우리가 그릴 실제 고급 타입을 분리
    const [chartType, setChartType] = useState('bar'); 
    const [actualChartType, setActualChartType] = useState('bar'); 

    const [title, setTitle] = useState('');
    const [aggregationType, setAggregationType] = useState('sum'); 
    const [groupOthers, setGroupOthers] = useState(false);
    const [topNCount, setTopNCount] = useState(5);
    const [showTrendLine, setShowTrendLine] = useState(false);
    const [showDataTable, setShowDataTable] = useState(false);
    const [showCumulativeLine, setShowCumulativeLine] = useState(false);

    // ================= 디자인 & 포맷 상태 =================
    const [valueFormat, setValueFormat] = useState('none'); 
    const [colorTheme, setColorTheme] = useState('corporate'); 
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [fontFamily, setFontFamily] = useState('Pretendard'); 
    const [fonts, setFonts] = useState({ title: 20, axis: 13, legend: 12, dataLabel: 12 });
    const updateFont = (key, val) => setFonts(prev => ({ ...prev, [key]: Number(val) }));

    const [showGrid, setShowGrid] = useState(true);
    const [showHorizontal, setShowHorizontal] = useState(false);
    const [beginAtZero, setBeginAtZero] = useState(true);
    const [yMin, setYMin] = useState('');
    const [yMax, setYMax] = useState('');

    const [showDataLabels, setShowDataLabels] = useState(true); 
    const [dataLabelPosition, setDataLabelPosition] = useState('top'); 
    const [stacked, setStacked] = useState(false);
    const [lineStyle, setLineStyle] = useState('smooth'); 
    
    const [barThickness, setBarThickness] = useState(25);
    const [borderRadius, setBorderRadius] = useState(6); 
    const [lineWidth, setLineWidth] = useState(3);
    const [cutoutPercent, setCutoutPercent] = useState(60);
    const [chartPadding, setChartPadding] = useState(20);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const [showLegend, setShowLegend] = useState(true);
    const [legendPosition, setLegendPosition] = useState('bottom');
    const [sortData, setSortData] = useState('desc');
    
    const [showAverageLine, setShowAverageLine] = useState(false);
    const [autoHighlight, setAutoHighlight] = useState(false); 
    const [highlightNegative, setHighlightNegative] = useState(false); 
    const [enableGradient, setEnableGradient] = useState(false); 
    const [showPiePercent, setShowPiePercent] = useState(true);
    const [customColors, setCustomColors] = useState({});
    
    const [xAxisLabel, setXAxisLabel] = useState('');
    const [yAxisLabel, setYAxisLabel] = useState('');
    const [gridColor, setGridColor] = useState('#d4d4d8');
    const [labelColor, setLabelColor] = useState('#111827');
    const [titleColor, setTitleColor] = useState('#111827');
    // 목표선 기능은 제거 (요청에 따라 비활성화)
    const [activeDesignTab, setActiveDesignTab] = useState('data');
    const [showChartPanel, setShowChartPanel] = useState(false);
    const [chartPanelTab, setChartPanelTab] = useState('data');
    const [chartPanelPos, setChartPanelPos] = useState({ top: 0, right: 0 });
    const chartSettingsBtnRef = useRef(null);

    const openChartPanel = (tab = 'data') => {
        if (chartSettingsBtnRef.current) {
            const rect = chartSettingsBtnRef.current.getBoundingClientRect();
            setChartPanelPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
        }
        setChartPanelTab(tab);
        setShowChartPanel(v => !v);
    };

    useEffect(() => {
        const handleClose = (e) => {
            if (showChartPanel && chartSettingsBtnRef.current && !chartSettingsBtnRef.current.contains(e.target)) {
                const panel = document.getElementById('chart-floating-panel');
                if (panel && !panel.contains(e.target)) setShowChartPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClose);
        return () => document.removeEventListener('mousedown', handleClose);
    }, [showChartPanel]);

    // 배경/테마 변경 시 격자선 색만 조정 (라벨은 항상 검은색 유지)
    useEffect(() => {
        if (backgroundColor === '#1e293b') setGridColor('#64748b');
        else if (backgroundColor === '#0f172a') setGridColor('#475569');
        else if (backgroundColor === '#000000') setGridColor('#4b5563');
        else if (backgroundColor === '#ffffff' || backgroundColor === '#f8fafc' || backgroundColor === 'transparent') setGridColor('#d4d4d8');
        else setGridColor('#d4d4d8');

        // 축/범례/제목/데이터 라벨은 항상 검정 계열
        setLabelColor('#111827');
        setTitleColor('#111827');
    }, [backgroundColor, colorTheme]);

    const [textOverlays, setTextOverlays] = useState([]);
    const [isAddingText, setIsAddingText] = useState(false);
    const [newTextValue, setNewTextValue] = useState('');
    const [overlayType, setOverlayType] = useState('text'); 
    const [newTextColor, setNewTextColor] = useState('#ffffff');
    const [newTextSize, setNewTextSize] = useState(14);
    const [draggingText, setDraggingText] = useState(null); // { id }
    const dragFrameRef = useRef(null);
    const draggingTextRef = useRef(null); // { id, offsetX, offsetY, el }

    const colorThemes = {
        // 기본 비즈니스용 (기존 corporate 유지)
        corporate: {
            bg: [
                'rgba(59, 130, 246, 0.9)',   // 파랑
                'rgba(16, 185, 129, 0.9)',   // 초록
                'rgba(245, 158, 11, 0.9)',   // 노랑
                'rgba(239, 68, 68, 0.9)',    // 빨강
                'rgba(139, 92, 246, 0.9)',   // 보라
                'rgba(99, 102, 241, 0.9)',   // 인디고
                'rgba(236, 72, 153, 0.9)',   // 핑크
            ],
            border: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#4f46e5', '#db2777'],
        },
        // 밝은 파스텔 계열
        pastel: {
            bg: [
                'rgba(191, 219, 254, 0.95)',
                'rgba(167, 243, 208, 0.95)',
                'rgba(254, 249, 195, 0.95)',
                'rgba(254, 226, 226, 0.95)',
                'rgba(221, 214, 254, 0.95)',
            ],
            border: ['#60a5fa', '#34d399', '#eab308', '#f97373', '#a78bfa'],
        },
        // 보고서용 라이트 그레이 계열
        report: {
            bg: [
                'rgba(226, 232, 240, 0.95)',
                'rgba(209, 213, 219, 0.95)',
                'rgba(248, 250, 252, 0.95)',
                'rgba(254, 243, 199, 0.95)',
                'rgba(254, 226, 226, 0.95)',
            ],
            border: ['#1f2933', '#4b5563', '#111827', '#92400e', '#b91c1c'],
        },
        // 하이라이트용 비비드 라이트
        vivid: {
            bg: [
                'rgba(96, 165, 250, 0.95)',   // 밝은 블루
                'rgba(52, 211, 153, 0.95)',   // 밝은 그린
                'rgba(250, 204, 21, 0.95)',   // 밝은 옐로우
                'rgba(248, 113, 113, 0.95)',  // 밝은 레드
                'rgba(129, 140, 248, 0.95)',  // 밝은 퍼플
            ],
            border: ['#1d4ed8', '#0f766e', '#a16207', '#b91c1c', '#4f46e5'],
        },
        // 추가 테마 1: 오션 (블루/민트 계열)
        ocean: {
            bg: [
                'rgba(59, 130, 246, 0.9)',
                'rgba(56, 189, 248, 0.9)',
                'rgba(34, 197, 235, 0.9)',
                'rgba(45, 212, 191, 0.9)',
                'rgba(74, 222, 128, 0.9)',
            ],
            border: ['#1d4ed8', '#0284c7', '#0e7490', '#0f766e', '#16a34a'],
        },
        // 추가 테마 2: 선라이즈 (옐로/오렌지/레드 계열)
        sunrise: {
            bg: [
                'rgba(254, 240, 138, 0.95)',
                'rgba(253, 224, 171, 0.95)',
                'rgba(252, 165, 165, 0.95)',
                'rgba(251, 113, 133, 0.95)',
                'rgba(251, 146, 60, 0.95)',
            ],
            border: ['#eab308', '#ea580c', '#f97316', '#be123c', '#c2410c'],
        },
    };
    const colors = colorThemes[colorTheme] || colorThemes.corporate;

    const formatValue = (val) => {
        if (isNaN(val) || val === null) return val;
        const num = Number(val);
        if (valueFormat === 'comma') return num.toLocaleString();
        if (valueFormat === 'krw') return '₩' + num.toLocaleString();
        if (valueFormat === 'usd') return '$' + num.toLocaleString();
        if (valueFormat === 'percent') return num.toFixed(1) + '%';
        if (valueFormat === 'compact') return new Intl.NumberFormat('ko-KR', { notation: "compact" }).format(num); 
        return num;
    };

    // ================= 메인 ↔ 확대(mainZoom) 등 ChartViewer 인스턴스 간 상태 동기화 =================
    // 1) 메인 인스턴스가 window 전역에 현재 설정을 저장
    // 2) 확대(mainZoom) 인스턴스가 이를 한 번 복원한 뒤, 이후부터만 자신의 변경사항을 다시 저장
    useEffect(() => {
        if (!syncId || typeof window === 'undefined') return;
        const store = window.__insightnodeCharts || {};
        const saved = store[syncId];

        // 저장된 값이 없으면, 현재 인스턴스를 기준으로 최초값을 저장하고 바로 동기화 완료 상태로 표시
        if (!saved) {
            const baseStore = (window.__insightnodeCharts = window.__insightnodeCharts || {});
            baseStore[syncId] = {
                chartType,
                actualChartType,
                xAxis,
                yAxis,
                yAxis2,
                aggregationType,
                groupOthers,
                topNCount,
                sortData,
                showTrendLine,
                showCumulativeLine,
                showAverageLine,
                valueFormat,
                colorTheme,
                backgroundColor,
                fontFamily,
                fonts,
                showGrid,
                showHorizontal,
                beginAtZero,
                showDataLabels,
                dataLabelPosition,
                stacked,
                lineStyle,
                barThickness,
                borderRadius,
                lineWidth,
                cutoutPercent,
                chartPadding,
                showLegend,
                legendPosition,
                showPiePercent,
                customColors,
            };
            setIsSyncRestored(true);
            return;
        }

        // 저장된 값이 있으면, 한 번만 복원
        if (saved.chartType) setChartType(saved.chartType);
        if (saved.actualChartType) setActualChartType(saved.actualChartType);
        if (saved.xAxis) setXAxis(saved.xAxis);
        if (saved.yAxis) setYAxis(saved.yAxis);
        if (saved.yAxis2) setYAxis2(saved.yAxis2);
        if (saved.aggregationType) setAggregationType(saved.aggregationType);
        if (typeof saved.groupOthers === 'boolean') setGroupOthers(saved.groupOthers);
        if (typeof saved.topNCount === 'number') setTopNCount(saved.topNCount);
        if (saved.sortData) setSortData(saved.sortData);
        if (typeof saved.showTrendLine === 'boolean') setShowTrendLine(saved.showTrendLine);
        if (typeof saved.showCumulativeLine === 'boolean') setShowCumulativeLine(saved.showCumulativeLine);
        if (typeof saved.showAverageLine === 'boolean') setShowAverageLine(saved.showAverageLine);
        if (saved.valueFormat) setValueFormat(saved.valueFormat);
        if (saved.colorTheme) setColorTheme(saved.colorTheme);
        if (saved.backgroundColor) setBackgroundColor(saved.backgroundColor);
        if (saved.fontFamily) setFontFamily(saved.fontFamily);
        if (saved.fonts) setFonts(saved.fonts);
        if (typeof saved.showGrid === 'boolean') setShowGrid(saved.showGrid);
        if (typeof saved.showHorizontal === 'boolean') setShowHorizontal(saved.showHorizontal);
        if (typeof saved.beginAtZero === 'boolean') setBeginAtZero(saved.beginAtZero);
        if (typeof saved.showDataLabels === 'boolean') setShowDataLabels(saved.showDataLabels);
        if (saved.dataLabelPosition) setDataLabelPosition(saved.dataLabelPosition);
        if (typeof saved.stacked === 'boolean') setStacked(saved.stacked);
        if (saved.lineStyle) setLineStyle(saved.lineStyle);
        if (typeof saved.barThickness === 'number') setBarThickness(saved.barThickness);
        if (typeof saved.borderRadius === 'number') setBorderRadius(saved.borderRadius);
        if (typeof saved.lineWidth === 'number') setLineWidth(saved.lineWidth);
        if (typeof saved.cutoutPercent === 'number') setCutoutPercent(saved.cutoutPercent);
        if (typeof saved.chartPadding === 'number') setChartPadding(saved.chartPadding);
        if (typeof saved.showLegend === 'boolean') setShowLegend(saved.showLegend);
        if (saved.legendPosition) setLegendPosition(saved.legendPosition);
        if (typeof saved.showPiePercent === 'boolean') setShowPiePercent(saved.showPiePercent);
        if (saved.customColors) setCustomColors(saved.customColors);

        setIsSyncRestored(true);
    // syncId가 바뀌거나, 차트의 핵심 설정이 바뀐 경우에만 재평가
    }, [syncId]);

    // 실제 설정이 바뀔 때마다, "동기화가 한 번 이상 복원된 상태"에서만 전역 저장소를 업데이트
    useEffect(() => {
        if (!syncId || typeof window === 'undefined' || !isSyncRestored) return;
        const store = (window.__insightnodeCharts = window.__insightnodeCharts || {});
        store[syncId] = {
            chartType,
            actualChartType,
            xAxis,
            yAxis,
            yAxis2,
            aggregationType,
            groupOthers,
            topNCount,
            sortData,
            showTrendLine,
            showCumulativeLine,
            showAverageLine,
            valueFormat,
            colorTheme,
            backgroundColor,
            fontFamily,
            fonts,
            showGrid,
            showHorizontal,
            beginAtZero,
            showDataLabels,
            dataLabelPosition,
            stacked,
            lineStyle,
            barThickness,
            borderRadius,
            lineWidth,
            cutoutPercent,
            chartPadding,
            showLegend,
            legendPosition,
            showPiePercent,
            customColors,
        };
    }, [
        syncId,
        isSyncRestored,
        chartType,
        actualChartType,
        xAxis,
        yAxis,
        yAxis2,
        aggregationType,
        groupOthers,
        topNCount,
        sortData,
        showTrendLine,
        showCumulativeLine,
        showAverageLine,
        valueFormat,
        colorTheme,
        backgroundColor,
        fontFamily,
        fonts,
        showGrid,
        showHorizontal,
        beginAtZero,
        showDataLabels,
        dataLabelPosition,
        stacked,
        lineStyle,
        barThickness,
        borderRadius,
        lineWidth,
        cutoutPercent,
        chartPadding,
        showLegend,
        legendPosition,
        showPiePercent,
        customColors,
    ]);

    const chartDataObj = useMemo(() => {
        if (!data.length || !xAxis || !yAxis) return { labels: [], vals: [], vals2: [], average: 0, growthRate: 0 };
        let grouped = {};
        data.forEach(row => {
            const key = String(row[xAxis] || 'N/A');
            if (!grouped[key]) grouped[key] = { v1: [], v2: [] };
            const v1 = parseFloat(row[yAxis]);
            if (!isNaN(v1)) grouped[key].v1.push(v1);
            if (chartType === 'combo') {
                const v2 = parseFloat(row[yAxis2]);
                if (!isNaN(v2)) grouped[key].v2.push(v2);
            }
        });

        const calculateAgg = (arr) => {
            if (!arr.length) return 0;
            const sum = arr.reduce((a, b) => a + b, 0);
            if (aggregationType === 'sum') return sum;
            if (aggregationType === 'avg') return sum / arr.length;
            if (aggregationType === 'count') return arr.length;
            if (aggregationType === 'max') return Math.max(...arr);
            if (aggregationType === 'min') return Math.min(...arr);
            return sum;
        };

        let processed = Object.keys(grouped).map(k => ({
            label: k,
            v: calculateAgg(grouped[k].v1),
            v2: chartType === 'combo' ? calculateAgg(grouped[k].v2) : 0
        }));

        if (sortData === 'asc') processed.sort((a, b) => a.v - b.v);
        else if (sortData === 'desc') processed.sort((a, b) => b.v - a.v);

        if (groupOthers && processed.length > topNCount) {
            let tempSorted = [...processed].sort((a, b) => b.v - a.v);
            const topItems = tempSorted.slice(0, topNCount);
            const othersItems = tempSorted.slice(topNCount);
            const othersSum = othersItems.reduce((acc, curr) => acc + curr.v, 0);
            const othersSum2 = othersItems.reduce((acc, curr) => acc + curr.v2, 0);
            processed = [...topItems, { label: `기타 (${othersItems.length}개 항목)`, v: othersSum, v2: othersSum2 }];
        }

        const labels = processed.map(p => p.label);
        const vals = processed.map(p => p.v);
        const vals2 = processed.map(p => p.v2);
        const average = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        
        let growthRate = 0;
        if (vals.length > 1 && vals[0] !== 0) {
            growthRate = ((vals[vals.length - 1] - vals[0]) / Math.abs(vals[0])) * 100;
        }
        return { labels, vals, vals2, average, growthRate };
    }, [data, xAxis, yAxis, yAxis2, sortData, chartType, aggregationType, groupOthers, topNCount]);

    const applyTemplate = (type) => {
        if (type === 'report') {
            setBackgroundColor('#ffffff');
            setColorTheme('mckinsey');
            setFontFamily("'Malgun Gothic', sans-serif");
            setGridColor('#f1f5f9');
            setLabelColor('#475569');
            setTitleColor('#1e293b');
            setEnableGradient(false);
            setShowGrid(true);
            setBarThickness(30);
            setBorderRadius(2);
            setShowDataLabels(true);
            setDataLabelPosition('top');
            setLocalWatermarkEnabled(true);
            setLocalWatermarkText('CONFIDENTIAL');
            setLocalWatermarkDesign('single');
            setWatermarkPosition('center');
        } else if (type === 'pitch') {
            setBackgroundColor('transparent'); 
            setColorTheme('corporate');
            setFontFamily('Pretendard');
            setGridColor('rgba(255,255,255,0.05)');
            setLabelColor('#cbd5e1');
            setTitleColor('#ffffff');
            setEnableGradient(true);
            setShowGrid(false);
            setBarThickness(40);
            setBorderRadius(8);
            setShowDataLabels(true);
            setDataLabelPosition('center');
            setLocalWatermarkEnabled(false);
        }
    };

    // 템플릿 적용 (핵심 수정 부분)
    useEffect(() => {
        if (!designTemplate) return;

        const tpl = designTemplate;
        let normalizedType = tpl.chartType || chartType;

        // 실제 선택된 고급/기본 타입 기억
        if (tpl.chartType) {
            setActualChartType(tpl.chartType);
        }

        // Chart.js가 이해할 수 있도록 native 타입으로 매핑
        switch (tpl.chartType) {
            case 'horizontal-bar':
                normalizedType = 'bar';
                setShowHorizontal(true); // 자동 가로막대 적용
                break;
            case 'histogram':
            case 'pareto':
            case 'waterfall':
            case 'treemap':
            case 'stock':
            case 'gantt':
            case 'bullet':
            case 'sankey':
            case 'heatmap':
            case 'marimekko':
            case 'tornado':
            case 'boxplot':
            case 'funnel':
                normalizedType = 'bar';
                setShowHorizontal(false);
                if (tpl.chartType === 'pareto') {
                    setShowCumulativeLine(true);
                    setSortData('desc');
                }
                break;
            case 'area':
                normalizedType = 'line';
                break;
            case 'sunburst':
            case 'gauge':
                normalizedType = 'doughnut';
                break;
            case 'scatter':
            case 'bubble':
                normalizedType = 'line';
                break;
            default:
                setShowHorizontal(false);
                break;
        }

        setChartType(normalizedType);

        if (typeof tpl.stacked === 'boolean') setStacked(tpl.stacked);
        if (tpl.sort === 'asc' || tpl.sort === 'desc' || tpl.sort === 'none') setSortData(tpl.sort);
        if (typeof tpl.showCumulativeLine === 'boolean') setShowCumulativeLine(tpl.showCumulativeLine);
        if (typeof tpl.showTrendLine === 'boolean') setShowTrendLine(tpl.showTrendLine);
        if (tpl.valueFormat) setValueFormat(tpl.valueFormat);
        if (tpl.stylePreset) applyTemplate(tpl.stylePreset);
        if (onDesignTemplateApplied) onDesignTemplateApplied(tpl);

    }, [designTemplate]);

    const drawWatermark = (ctx, width, height, design, text, gridSize = 3, color = '#dc2626', fontSize = 48, opacity = 0.12, position = 'center', angle = -45) => {
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        const rad = (angle * Math.PI) / 180;
        const getPosXY = (pos) => {
            const pad = 40;
            const map = {
                'center': [width / 2, height / 2],
                'top-left': [pad, pad + fontSize / 2],
                'top-right': [width - pad, pad + fontSize / 2],
                'bottom-left': [pad, height - pad],
                'bottom-right': [width - pad, height - pad],
            };
            return map[pos] || map['center'];
        };

        if (design === 'single') {
            const [x, y] = getPosXY(position);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rad);
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = hexToRgba(color, opacity);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 0, 0);
            ctx.restore();
        } else if (design === 'multiple') {
            const n = Math.max(1, gridSize);
            const adjustedFontSize = Math.max(10, Math.round(fontSize / Math.sqrt(n)));
            ctx.font = `bold ${adjustedFontSize}px sans-serif`;
            ctx.fillStyle = hexToRgba(color, opacity * 0.7);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    ctx.save();
                    ctx.translate(j * width / n + width / (n * 2), i * height / n + height / (n * 2));
                    ctx.rotate(rad);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                }
            }
        } else if (design === 'corner') {
            const cornerFontSize = Math.max(16, fontSize * 0.55);
            ctx.font = `bold ${cornerFontSize}px sans-serif`;
            ctx.fillStyle = hexToRgba(color, opacity + 0.05);
            const pad = 30;
            [['right', width - pad, pad + cornerFontSize / 2],
             ['left',  pad,         pad + cornerFontSize / 2],
             ['left',  pad,         height - pad],
             ['right', width - pad, height - pad]].forEach(([align, x, y]) => {
                ctx.textAlign = align;
                ctx.textBaseline = 'middle';
                ctx.fillText(text, x, y);
            });
        }
    };

    const generateCanvasImage = () => {
        if (!canvasRef.current || !chartAreaRef.current) return null;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const ctx = tempCanvas.getContext('2d');

        ctx.fillStyle = backgroundColor === 'transparent' ? '#ffffff' : backgroundColor;
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvasRef.current, 0, 0);

        if (watermarkEnabled) {
            drawWatermark(ctx, tempCanvas.width, tempCanvas.height, watermarkDesign, watermarkText, watermarkGridSize, watermarkColor, watermarkFontSize, watermarkOpacity, watermarkPosition, watermarkAngle);
        }

        textOverlays.forEach(textObj => {
            ctx.font = `${textObj.type === 'exec-summary' ? 'bold ' : ''}${textObj.size}px ${textObj.fontFamily || fontFamily}`;
            ctx.fillStyle = textObj.color;
            ctx.textBaseline = 'top'; 
            
            const lines = textObj.text.split('\n');
            let y = textObj.y;
            
            if (textObj.type === 'exec-summary') {
                ctx.save();
                ctx.fillStyle = backgroundColor === '#ffffff' ? 'rgba(241, 245, 249, 0.95)' : 'rgba(15, 23, 42, 0.85)';
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.shadowBlur = 10;
                let maxWidth = 0;
                lines.forEach(l => { maxWidth = Math.max(maxWidth, ctx.measureText(l).width); });
                
                const boxX = textObj.x - 15;
                const boxY = textObj.y - 15;
                const boxW = maxWidth + 30;
                const boxH = (lines.length * (textObj.size * 1.5)) + 20;
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxW, boxH, 8);
                ctx.fill();
                
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, 6, boxH, {tl: 8, bl: 8, tr: 0, br: 0});
                ctx.fill();
                ctx.restore();
            }

            lines.forEach(line => {
                ctx.fillText(line, textObj.x, y);
                y += textObj.size * 1.5; 
            });
        });
        return tempCanvas;
    };

    const copyToClipboard = async () => {
        const canvas = generateCanvasImage();
        if (!canvas) return;
        try {
            canvas.toBlob(async (blob) => {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                alert('✨ 차트가 복사되었습니다! PPT나 Word에 붙여넣기(Ctrl+V) 하세요.');
            });
        } catch (err) { alert('복사 권한이 없거나 브라우저에서 지원하지 않습니다. [PNG 저장]을 이용해주세요.'); }
    };

    const exportAsPNG = () => {
        const canvas = generateCanvasImage();
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `Report_Chart_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const swapAxes = () => { const temp = xAxis; setXAxis(yAxis); setYAxis(temp); };

    const handleAddTextClick = (e) => {
        if (!isAddingText || !chartAreaRef.current) return;
        const rect = chartAreaRef.current.getBoundingClientRect();
        if (newTextValue.trim()) {
            setTextOverlays(prev => [...prev, {
                id: Date.now(), text: newTextValue.replace(/\\n/g, '\n'),
                x: e.clientX - rect.left, y: e.clientY - rect.top,
                color: newTextColor, size: newTextSize, fontFamily: fontFamily, type: overlayType
            }]);
            setNewTextValue(''); setIsAddingText(false);
        }
    };
    const handleTextMouseDown = (e, textId) => {
        e.stopPropagation();
        if (!chartAreaRef.current) return;
        const rect = chartAreaRef.current.getBoundingClientRect();
        const text = textOverlays.find(t => t.id === textId);
        if (!text) return;

        // 마우스 위치와 텍스트 기준점(x, y) 사이의 오프셋을 저장
        const offsetX = e.clientX - rect.left - text.x;
        const offsetY = e.clientY - rect.top - text.y;

        draggingTextRef.current = {
            id: textId,
            offsetX,
            offsetY,
            el: e.currentTarget,
        };
        setDraggingText({ id: textId });
    };

    const handleMouseMove = (e) => {
        if (!draggingTextRef.current || !chartAreaRef.current) return;
        const rect = chartAreaRef.current.getBoundingClientRect();
        const { clientX, clientY } = e;
        const { offsetX, offsetY, el, id } = draggingTextRef.current;
        if (!el) return;

        const newX = clientX - rect.left - offsetX;
        const newY = clientY - rect.top - offsetY;

        // requestAnimationFrame으로 DOM 위치만 직접 갱신 (리렌더 최소화)
        if (dragFrameRef.current) cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = requestAnimationFrame(() => {
            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;
            dragFrameRef.current = null;
        });
    };
    const handleMouseUp = () => {
        if (dragFrameRef.current) {
            cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = null;
        }

        // 드래그가 끝난 시점의 위치를 상태에 반영
        if (draggingTextRef.current && chartAreaRef.current) {
            const { id, el } = draggingTextRef.current;
            if (el) {
                const areaRect = chartAreaRef.current.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const finalX = elRect.left - areaRect.left;
                const finalY = elRect.top - areaRect.top;

                setTextOverlays(prev =>
                    prev.map(t =>
                        t.id === id
                            ? { ...t, x: finalX, y: finalY }
                            : t
                    )
                );
            }
        }

        draggingTextRef.current = null;
        setDraggingText(null);
    };
    const removeText = (textId) => setTextOverlays(prev => prev.filter(t => t.id !== textId));

    // ================= 차트 렌더링 =================
    useEffect(() => {
        if (!canvasRef.current || !chartDataObj.labels.length) return;
        const ctx = canvasRef.current.getContext('2d');
        if (chartRef.current) chartRef.current.destroy();

        const { labels, vals, vals2, average } = chartDataObj;

        let highlightColors = null;
        if (autoHighlight && vals.length > 0 && chartType !== 'line' && chartType !== 'area') {
            const maxVal = Math.max(...vals);
            const minVal = Math.min(...vals);
            highlightColors = vals.map(v => v === maxVal ? '#3b82f6' : v === minVal ? '#ef4444' : '#94a3b8');
        }

        const negativeColors = highlightNegative ? vals.map(v => v < 0 ? '#ef4444' : null) : null;
        const isPie = chartType === 'pie' || chartType === 'doughnut';
        
        let bgColors = labels.map((l, i) => {
            if (negativeColors && negativeColors[i]) return negativeColors[i];
            return customColors[l] || (highlightColors ? highlightColors[i] : (chartType === 'line' || chartType === 'area' ? colors.bg[0] : colors.bg[i % colors.bg.length]));
        });
        
        if (enableGradient && (chartType === 'bar' || chartType === 'area' || chartType === 'combo')) {
            bgColors = bgColors.map((color) => {
                const grad = ctx.createLinearGradient(0, 0, 0, canvasRef.current.height);
                const baseColor = color.replace(/[\d.]+\)$/g, '0.9)');
                grad.addColorStop(0, baseColor);
                grad.addColorStop(1, color.replace(/[\d.]+\)$/g, '0.2)'));
                return grad;
            });
        }
        
        const borderColors = labels.map((l, i) => {
            if (negativeColors && negativeColors[i]) return '#dc2626';
            return customColors[l] || (highlightColors ? highlightColors[i] : (chartType === 'line' || chartType === 'area' ? colors.border[0] : colors.border[i % colors.border.length]));
        });

        // 고급/특수 차트 판별 (ChartDesign 템플릿 기반 전체)
        const isAdvancedChart = [
            'treemap', 'marimekko', 'sankey', 'heatmap', 'tornado',
            'scatter', 'bubble', 'histogram', 'pareto', 'boxplot', 'radar',
            'waterfall', 'funnel', 'sunburst', 'stock',
            'gantt', 'gauge', 'bullet'
        ].includes(actualChartType);

        const datasets = [];
        datasets.push({
            type: chartType === 'combo' ? 'bar' : actualChartType === 'area' ? 'line' : chartType,
            label: yAxis,
            data: vals,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: (chartType === 'line' || actualChartType === 'area') ? lineWidth : 1,
            fill: actualChartType === 'area',
            tension: lineStyle === 'smooth' ? 0.4 : 0,
            stepped: lineStyle === 'step',
            pointRadius: (chartType === 'line' || actualChartType === 'area') ? 5 : 0,
            pointHoverRadius: 7,
            pointBackgroundColor: borderColors,
            pointBorderColor: backgroundColor === 'transparent' ? '#fff' : backgroundColor,
            borderRadius: (chartType === 'bar' || chartType === 'combo') ? borderRadius : 0,
            barThickness: (chartType === 'bar' || chartType === 'combo') ? barThickness : undefined,
            cutout: chartType === 'doughnut' ? cutoutPercent + '%' : undefined,
            yAxisID: chartType === 'combo' ? 'y' : undefined,
            datalabels: {
                display: isAdvancedChart ? false : showDataLabels, // 고급 차트일 땐 네이티브 라벨 끄기
                // 차트 내 모든 데이터 라벨은 항상 검은색 계열
                color: '#111827',
                textStrokeColor: 'transparent',
                textStrokeWidth: 0,
                font: { size: Math.max(10, fonts.dataLabel), family: fontFamily, weight: '600' },
                formatter: (value, context) => {
                    if (showPiePercent && isPie && chartDataObj.vals.length > 0) {
                        const total = chartDataObj.vals.reduce((a, b) => a + b, 0);
                        const percent = ((value / total) * 100).toFixed(1);
                        return percent + '%';
                    }
                    return formatValue(value);
                },
                anchor: isPie ? 'center' : (dataLabelPosition === 'top' ? 'end' : dataLabelPosition === 'center' ? 'center' : 'start'),
                align: isPie ? 'center' : (dataLabelPosition === 'top' ? 'top' : dataLabelPosition === 'center' ? 'center' : 'bottom'),
                offset: isPie ? 0 : 6,
                clamp: true,
                clip: false
            }
        });

        if (chartType === 'combo' && vals2.length > 0) {
            datasets.push({
                type: 'line',
                label: yAxis2,
                data: vals2,
                backgroundColor: colors.bg[1 % colors.bg.length],
                borderColor: colors.border[1 % colors.border.length],
                borderWidth: lineWidth + 1,
                fill: false,
                tension: lineStyle === 'smooth' ? 0.4 : 0,
                pointRadius: 6,
                pointBackgroundColor: colors.border[1 % colors.border.length],
                yAxisID: 'y1',
                datalabels: {
                    display: isAdvancedChart ? false : showDataLabels,
                    // 보조축 라인도 항상 검은색 라벨
                    color: '#111827',
                    font: { size: fonts.dataLabel, family: fontFamily, weight: 'bold' },
                    formatter: (value) => formatValue(value),
                    align: 'top', offset: 8
                }
            });
        }

        if (showAverageLine && !isPie && !isAdvancedChart) {
            datasets.push({
                type: 'line', label: `평균 (${formatValue(average)})`, data: labels.map(() => average),
                borderColor: '#f59e0b', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false, datalabels: { display: false }
            });
        }

        if (showTrendLine && !isPie && !isAdvancedChart && vals.length >= 2) {
            const n = vals.length;
            const xSum = vals.reduce((s, _, i) => s + i, 0);
            const ySum = vals.reduce((s, v) => s + v, 0);
            const xySum = vals.reduce((s, v, i) => s + i * v, 0);
            const x2Sum = vals.reduce((s, _, i) => s + i * i, 0);
            const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum) || 0;
            const intercept = (ySum - slope * xSum) / n;
            const trendData = vals.map((_, i) => parseFloat((slope * i + intercept).toFixed(2)));
            datasets.push({
                type: 'line', label: '추세선', data: trendData,
                borderColor: 'rgba(99,102,241,0.9)', borderWidth: 2, borderDash: [8, 4],
                pointRadius: 0, fill: false, datalabels: { display: false }
            });
        }

        const watermarkPlugin = {
            id: 'watermarkPlugin',
            beforeDraw: (chart) => {
                if (!watermarkEnabled) return;
                const ctx = chart.ctx;
                const width = chart.width;
                const height = chart.height;
                drawWatermark(ctx, width, height, watermarkDesign, watermarkText, watermarkGridSize, watermarkColor, watermarkFontSize, watermarkOpacity, watermarkPosition, watermarkAngle);
            }
        };

        // 고급 차트용 커스텀 렌더링 플러그인
        const advancedChartPlugin = {
            id: 'advancedChartPlugin',
            afterDraw: (chart) => {
                if (!isAdvancedChart) return;
                const { ctx, chartArea } = chart;
                if (!chartArea) return;
                
                const { left, right, top, bottom } = chartArea;
                const width = right - left;
                const height = bottom - top;
                const vals = chartDataObj.vals || [];
                const labelsArr = chartDataObj.labels || [];
                if (!vals.length) return;

                ctx.save();
                ctx.clearRect(left, top, width, height);

                const total = vals.reduce((a, b) => a + Math.abs(b), 0) || 1;

                // 항목별 색상(customColors)을 반영하는 헬퍼
                const getElementColor = (idx, fallbackBg, fallbackBorder) => {
                    const key = String(labelsArr[idx] ?? idx);
                    const custom = customColors[key];
                    if (custom && typeof custom === 'string') {
                        return { fill: custom, stroke: custom };
                    }
                    return { fill: fallbackBg, stroke: fallbackBorder ?? fallbackBg };
                };

                if (actualChartType === 'treemap') {
                    let x = left;
                    vals.forEach((v, idx) => {
                        const w = (Math.abs(v) / total) * width;
                        const baseFill = colors.bg[idx % colors.bg.length];
                        const baseStroke = colors.border[idx % colors.border.length];
                        const { fill, stroke } = getElementColor(idx, baseFill, baseStroke);
                        ctx.fillStyle = fill;
                        ctx.strokeStyle = stroke;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.rect(x + 1, top + 1, w - 2, height - 2);
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = '#e2e8f0';
                        ctx.font = `${Math.max(10, fonts.axis)}px ${fontFamily}`;
                        ctx.textBaseline = 'top';
                        const label = `${labelsArr[idx]} (${formatValue(v)})`;
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(x + 4, top + 4, w - 8, height - 8);
                        ctx.clip();
                        ctx.fillText(label, x + 6, top + 6);
                        ctx.restore();
                        x += w;
                    });
                } else if (actualChartType === 'marimekko') {
                    let x = left;
                    vals.forEach((v, idx) => {
                        const w = (Math.abs(v) / total) * width;
                        const upperRatio = 0.6;
                        const baseFill = colors.bg[idx % colors.bg.length];
                        const { fill: color1 } = getElementColor(idx, baseFill);
                        const color2 = 'rgba(148,163,184,0.85)';

                        ctx.fillStyle = color1;
                        ctx.fillRect(x + 1, top + 1, w - 2, height * upperRatio - 2);
                        ctx.fillStyle = color2;
                        ctx.fillRect(x + 1, top + height * upperRatio + 1, w - 2, height * (1 - upperRatio) - 2);

                        ctx.strokeStyle = '#020617';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x + 1, top + 1, w - 2, height - 2);

                        ctx.fillStyle = '#e2e8f0';
                        ctx.font = `${Math.max(10, fonts.axis)}px ${fontFamily}`;
                        ctx.textBaseline = 'top';
                        const label = labelsArr[idx];
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(x + 4, top + 4, w - 8, height * upperRatio - 8);
                        ctx.clip();
                        ctx.fillText(label, x + 6, top + 6);
                        ctx.restore();
                        x += w;
                    });
                } else if (actualChartType === 'sankey') {
                    const nodeRadius = 10;
                    const lanes = Math.min(vals.length, 5);
                    const laneHeight = height / (lanes + 1);
                    const leftX = left + width * 0.2;
                    const rightX = left + width * 0.8;

                    for (let i = 0; i < lanes; i++) {
                        const v = vals[i];
                        const thickness = Math.max(4, (Math.abs(v) / total) * (laneHeight * 0.8));
                        const startY = top + laneHeight * (i + 1);
                        const endY = top + laneHeight * (lanes - i);
                        const baseFill = colors.bg[i % colors.bg.length];
                        const baseStroke = colors.border[i % colors.border.length] || baseFill;
                        const { fill: colorFill, stroke: colorStroke } = getElementColor(i, baseFill, baseStroke);
                        
                        ctx.strokeStyle = colorStroke;
                        ctx.lineWidth = thickness;
                        ctx.beginPath();
                        ctx.moveTo(leftX, startY);
                        const cp1x = leftX + width * 0.15;
                        const cp2x = rightX - width * 0.15;
                        ctx.bezierCurveTo(cp1x, startY, cp2x, endY, rightX, endY);
                        ctx.stroke();

                        ctx.fillStyle = 'rgba(15,23,42,0.95)';
                        ctx.strokeStyle = colorStroke;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(leftX, startY, nodeRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(rightX, endY, nodeRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();

                        // 링크 중간에 값 라벨 표시 (배경에 따라 색상 변경)
                        const labelX = (leftX + rightX) / 2;
                        const labelY = (startY + endY) / 2;
                        const useDarkSankey = backgroundColor === '#ffffff' || backgroundColor === '#f8fafc' || backgroundColor === 'transparent';
                        ctx.fillStyle = useDarkSankey ? '#111827' : '#e5e7eb';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(formatValue(v), labelX, labelY);
                    }
                } else if (actualChartType === 'heatmap') {
                    const cols = Math.min(vals.length, 4);
                    const rows = Math.ceil(vals.length / cols);
                    const cellW = width / cols;
                    const cellH = height / rows;
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);

                    vals.forEach((v, idx) => {
                        const c = idx % cols;
                        const r = Math.floor(idx / cols);
                        const intensity = Math.abs(v) / maxVal;
                        const baseColor = colors.bg[0] || 'rgba(59,130,246,0.9)';
                        ctx.fillStyle = baseColor.replace(/0\.85|0\.9|1\)/, `${Math.max(0.2, intensity)})`);
                        const x = left + c * cellW;
                        const y = top + r * cellH;
                        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

                        ctx.fillStyle = intensity > 0.6 ? '#0f172a' : '#e2e8f0';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(formatValue(v), x + cellW / 2, y + cellH / 2);
                    });
                } else if (actualChartType === 'tornado') {
                    const centerX = left + width / 2;
                    const barH = Math.min(26, height / (vals.length * 1.8));
                    const gap = barH * 0.6;
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);

                    vals.forEach((v, idx) => {
                        const dir = idx % 2 === 0 ? -1 : 1;
                        const len = (Math.abs(v) / maxVal) * (width * 0.4);
                        const y = top + (barH + gap) * idx + barH / 2 + 10;
                        const color = dir < 0 ? 'rgba(59,130,246,0.9)' : 'rgba(248,113,113,0.9)';

                        ctx.fillStyle = color;
                        ctx.beginPath();
                        const startX = centerX;
                        const endX = centerX + dir * len;
                        const radius = barH / 2;
                        const x1 = Math.min(startX, endX);
                        const x2 = Math.max(startX, endX);
                        ctx.moveTo(x1, y - radius);
                        ctx.lineTo(x2, y - radius);
                        ctx.quadraticCurveTo(x2 + dir * radius, y, x2, y + radius);
                        ctx.lineTo(x1, y + radius);
                        ctx.quadraticCurveTo(x1 - dir * radius, y, x1, y - radius);
                        ctx.closePath();
                        ctx.fill();

                        // 토네이도 값 라벨: 항상 검은색
                        ctx.fillStyle = '#111827';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = dir < 0 ? 'right' : 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(formatValue(v), endX + (dir < 0 ? -4 : 4), y);
                    });

                    ctx.strokeStyle = '#64748b';
                    ctx.setLineDash([4, 4]);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(centerX, top);
                    ctx.lineTo(centerX, bottom);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else if (actualChartType === 'scatter' || actualChartType === 'bubble') {
                    // 분산형/거품형: 점 위치와 크기로 표현
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    const pointCount = vals.length;
                    vals.forEach((v, idx) => {
                        const t = pointCount === 1 ? 0.5 : idx / (pointCount - 1);
                        const x = left + t * width;
                        const y = bottom - (Math.abs(v) / maxVal) * height * 0.8;
                        const baseRadius = actualChartType === 'bubble' ? 8 : 5;
                        const r = baseRadius + (Math.abs(v) / maxVal) * (actualChartType === 'bubble' ? 12 : 4);
                        const color = colors.bg[idx % colors.bg.length];
                        ctx.beginPath();
                        ctx.fillStyle = color;
                        ctx.globalAlpha = 0.85;
                        ctx.arc(x, y, r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;

                        // 각 점 위에 값 라벨 표시 (항상 검은색)
                        ctx.fillStyle = '#111827';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(formatValue(v), x, y - r - 4);
                    });
                } else if (actualChartType === 'histogram') {
                    // 히스토그램: 막대 간격 거의 없이 연속 막대
                    const n = vals.length;
                    const binW = width / Math.max(n, 1);
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    vals.forEach((v, idx) => {
                        const h = (Math.abs(v) / maxVal) * height * 0.9;
                        const x = left + idx * binW;
                        const y = bottom - h;
                        const color = colors.bg[idx % colors.bg.length];
                        ctx.fillStyle = color;
                        ctx.fillRect(x + 1, y, binW - 2, h);

                        // 막대 위에 값 라벨 표시 (항상 검은색)
                        ctx.fillStyle = '#111827';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(formatValue(v), x + binW / 2, y - 4);
                    });
                } else if (actualChartType === 'pareto') {
                    // 파레토: 막대 + 누적선
                    const n = vals.length;
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    const barW = width / Math.max(n, 1) * 0.7;
                    const step = width / Math.max(n, 1);
                    let cum = 0;
                    const cumPoints = [];
                    vals.forEach((v, idx) => {
                        const h = (Math.abs(v) / maxVal) * height * 0.7;
                        const cx = left + step * idx + step / 2;
                        const barX = cx - barW / 2;
                        const barY = bottom - h;
                        const color = colors.bg[idx % colors.bg.length];
                        ctx.fillStyle = color;
                        ctx.fillRect(barX, barY, barW, h);

                        // 막대 위에 값 라벨 표시 (항상 검은색)
                        ctx.fillStyle = '#111827';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(formatValue(v), cx, barY - 4);
                        cum += v;
                        cumPoints.push({ x: cx, v: cum });
                    });
                    const total = cumPoints[cumPoints.length - 1]?.v || 1;
                    ctx.strokeStyle = '#f97316';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    cumPoints.forEach((p, i) => {
                        const ratio = p.v / total;
                        const y = bottom - ratio * height * 0.9;
                        if (i === 0) ctx.moveTo(p.x, y);
                        else ctx.lineTo(p.x, y);
                    });
                    ctx.stroke();
                } else if (actualChartType === 'boxplot') {
                    // 상자수염: 단순화 (값을 중앙값으로 보고 박스/수염 렌더)
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    const n = vals.length;
                    const slotW = width / Math.max(n, 1);
                    vals.forEach((v, idx) => {
                        const cx = left + slotW * idx + slotW / 2;
                        const midY = bottom - (Math.abs(v) / maxVal) * height * 0.7;
                        const boxH = 20;
                        const boxW = slotW * 0.4;
                        const color = colors.bg[idx % colors.bg.length];
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        // 중앙 박스
                        ctx.strokeRect(cx - boxW / 2, midY - boxH / 2, boxW, boxH);
                        // 수염
                        ctx.beginPath();
                        ctx.moveTo(cx, midY - boxH / 2 - 10);
                        ctx.lineTo(cx, midY + boxH / 2 + 10);
                        ctx.moveTo(cx - boxW / 3, midY - boxH / 2 - 10);
                        ctx.lineTo(cx + boxW / 3, midY - boxH / 2 - 10);
                        ctx.moveTo(cx - boxW / 3, midY + boxH / 2 + 10);
                        ctx.lineTo(cx + boxW / 3, midY + boxH / 2 + 10);
                        ctx.stroke();

                        // 박스 위에 값 라벨 표시 (배경에 따라 색상 변경)
                        const useDarkBox = backgroundColor === '#ffffff' || backgroundColor === '#f8fafc' || backgroundColor === 'transparent';
                        ctx.fillStyle = useDarkBox ? '#111827' : '#e5e7eb';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(formatValue(v), cx, midY - boxH / 2 - 6);
                    });
                } else if (actualChartType === 'radar') {
                    // 방사형 차트: 간단 스파이더 웹 + 값/레이블 라벨
                    const n = vals.length;
                    if (n === 0) { ctx.restore(); return; }
                    const centerX = left + width / 2;
                    const centerY = top + height / 2;
                    const maxRadius = Math.min(width, height) / 2 * 0.85;
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    // 축
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 1;
                    for (let level = 1; level <= 3; level++) {
                        const r = (level / 3) * maxRadius;
                        ctx.beginPath();
                        for (let i = 0; i < n; i++) {
                            const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
                            const x = centerX + Math.cos(angle) * r;
                            const y = centerY + Math.sin(angle) * r;
                            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    }
                    // 값 폴리곤
                    ctx.beginPath();
                    vals.forEach((v, idx) => {
                        const angle = (Math.PI * 2 * idx / n) - Math.PI / 2;
                        const r = (Math.abs(v) / maxVal) * maxRadius;
                        const x = centerX + Math.cos(angle) * r;
                        const y = centerY + Math.sin(angle) * r;
                        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    });
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(56,189,248,0.25)';
                    ctx.strokeStyle = '#0ea5e9';
                    ctx.lineWidth = 2;
                    ctx.fill();
                    ctx.stroke();

                    // 각 꼭짓점에 값 + 축 레이블 라벨 표시
                    const useDarkRadar = backgroundColor === '#ffffff' || backgroundColor === '#f8fafc' || backgroundColor === 'transparent';
                    ctx.fillStyle = useDarkRadar ? '#111827' : '#e5e7eb';
                    ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    vals.forEach((v, idx) => {
                        const angle = (Math.PI * 2 * idx / n) - Math.PI / 2;
                        const r = (Math.abs(v) / maxVal) * maxRadius;
                        const x = centerX + Math.cos(angle) * r;
                        const y = centerY + Math.sin(angle) * r;
                        const axisLabel = labelsArr[idx] ?? `항목 ${idx + 1}`;
                        const valueText = formatValue(v);
                        ctx.fillText(`${axisLabel}: ${valueText}`, x, y);
                    });
                } else if (actualChartType === 'waterfall') {
                    // 폭포 차트: 누적 합을 위/아래로 보여줌
                    let acc = 0;
                    const n = vals.length;
                    const step = width / Math.max(n, 1);
                    const barW = step * 0.6;
                    const maxAbs = Math.max(...vals.map(v => Math.abs(v + acc)), 1);
                    vals.forEach((v, idx) => {
                        const start = acc;
                        acc += v;
                        const from = Math.min(start, acc);
                        const to = Math.max(start, acc);
                        const hFrom = (from / maxAbs) * height * 0.7;
                        const hTo = (to / maxAbs) * height * 0.7;
                        const x = left + step * idx + step / 2 - barW / 2;
                        const y = bottom - hTo;
                        const h = hTo - hFrom || 4;
                        ctx.fillStyle = v >= 0 ? 'rgba(34,197,94,0.9)' : 'rgba(248,113,113,0.9)';
                        ctx.fillRect(x, y, barW, h);

                        // 막대 위에 값 라벨 표시
                        ctx.fillStyle = '#e5e7eb';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(formatValue(v), x + barW / 2, y - 4);
                    });
                } else if (actualChartType === 'funnel') {
                    // 깔때기: 단계별로 넓이가 줄어드는 사다리꼴
                    const n = vals.length;
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    const stepH = height / Math.max(n, 1);
                    vals.forEach((v, idx) => {
                        const ratio = Math.abs(v) / maxVal;
                        const topWidth = width * (1 - idx / (n * 3));
                        const bottomWidth = width * (1 - (idx + 1) / (n * 3));
                        const centerX = left + width / 2;
                        const topY = top + idx * stepH;
                        const bottomY = top + (idx + 1) * stepH;
                        const color = colors.bg[idx % colors.bg.length];
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.moveTo(centerX - topWidth * ratio / 2, topY);
                        ctx.lineTo(centerX + topWidth * ratio / 2, topY);
                        ctx.lineTo(centerX + bottomWidth * ratio / 2, bottomY);
                        ctx.lineTo(centerX - bottomWidth * ratio / 2, bottomY);
                        ctx.closePath();
                        ctx.fill();

                        // 각 단계 중앙에 값 라벨 표시
                        const labelY = (topY + bottomY) / 2;
                        ctx.fillStyle = '#e5e7eb';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(formatValue(v), centerX, labelY);
                    });
                } else if (actualChartType === 'sunburst') {
                    // 선버스트: 하나의 링을 비율에 따라 분할 + 각 조각에 라벨
                    const centerX = left + width / 2;
                    const centerY = top + height / 2;
                    const radius = Math.min(width, height) / 2 * 0.9;
                    let startAngle = -Math.PI / 2;
                    vals.forEach((v, idx) => {
                        const angle = (Math.abs(v) / total) * Math.PI * 2;
                        const endAngle = startAngle + angle;
                        const color = colors.bg[idx % colors.bg.length];
                        ctx.beginPath();
                        ctx.moveTo(centerX, centerY);
                        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                        ctx.closePath();
                        ctx.fillStyle = color;
                        ctx.fill();

                        // 조각 중앙 위치에 값/퍼센트 라벨 표시
                        const midAngle = startAngle + angle / 2;
                        const labelRadius = radius * 0.65;
                        const lx = centerX + Math.cos(midAngle) * labelRadius;
                        const ly = centerY + Math.sin(midAngle) * labelRadius;
                        ctx.fillStyle = '#e5e7eb';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const percent = (Math.abs(v) / total) * 100;
                        const text = showPiePercent ? `${percent.toFixed(1)}%` : formatValue(v);
                        ctx.fillText(text, lx, ly);

                        startAngle = endAngle;
                    });
                } else if (actualChartType === 'stock') {
                    // 주식형: 캔들스틱 유사 표현 (값을 고/저/종으로 단순 해석)
                    const n = vals.length;
                    const step = width / Math.max(n, 1);
                    const candleW = step * 0.4;
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    vals.forEach((v, idx) => {
                        const center = bottom - (Math.abs(v) / maxVal) * height * 0.6;
                        const high = center - 15;
                        const low = center + 15;
                        const open = center - 5;
                        const close = center + 5;
                        const x = left + step * idx + step / 2;
                        const color = colors.bg[idx % colors.bg.length];
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        // 심(고/저)
                        ctx.beginPath();
                        ctx.moveTo(x, high);
                        ctx.lineTo(x, low);
                        ctx.stroke();
                        // 몸통
                        ctx.fillStyle = 'rgba(15,23,42,0.95)';
                        ctx.fillRect(x - candleW / 2, open, candleW, close - open);
                        ctx.strokeRect(x - candleW / 2, open, candleW, close - open);

                        // 각 캔들 오른쪽에 값 라벨 표시
                        ctx.fillStyle = '#e5e7eb';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(formatValue(v), x + candleW, center);
                    });
                } else if (actualChartType === 'gantt') {
                    // 간트 차트: 작업 막대를 좌->우로 렌더
                    const n = vals.length;
                    const rowH = height / Math.max(n, 1);
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    vals.forEach((v, idx) => {
                        const y = top + idx * rowH + rowH * 0.2;
                        const barH = rowH * 0.6;
                        const w = (Math.abs(v) / maxVal) * width * 0.8;
                        const x = left + width * 0.1;
                        const color = colors.bg[idx % colors.bg.length];
                        ctx.fillStyle = color;
                        ctx.roundRect(x, y, w, barH, 6);
                        ctx.fill();

                        // 막대 내부에 작업명 또는 값 라벨 표시
                        ctx.fillStyle = '#e5e7eb';
                        ctx.font = `${Math.max(9, fonts.dataLabel)}px ${fontFamily}`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        const label = labelsArr[idx] ?? formatValue(v);
                        ctx.fillText(label, x + 8, y + barH / 2);
                    });
                } else if (actualChartType === 'gauge') {
                    // 게이지 차트: 반원형 게이지
                    const centerX = left + width / 2;
                    const centerY = bottom;
                    const radius = Math.min(width, height * 2) / 2 * 0.9;
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    const current = vals[0] || 0;
                    const percent = Math.max(0, Math.min(1, Math.abs(current) / maxVal));
                    // 배경 반원
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, Math.PI, 0);
                    ctx.strokeStyle = '#1f2937';
                    ctx.lineWidth = 14;
                    ctx.stroke();
                    // 값 반원
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + Math.PI * percent);
                    ctx.strokeStyle = '#22c55e';
                    ctx.lineWidth = 14;
                        ctx.stroke();
                        // 중앙 값 텍스트
                        ctx.fillStyle = '#e5e7eb';
                        ctx.font = `${Math.max(14, fonts.axis + 2)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(formatValue(current), centerX, centerY - radius * 0.3);
                } else if (actualChartType === 'bullet') {
                    // 불릿 차트: 기준/목표/실적을 한 줄에
                    const n = vals.length;
                    const rowH = height / Math.max(n, 1);
                    const maxVal = Math.max(...vals.map(v => Math.abs(v)), 1);
                    vals.forEach((v, idx) => {
                        const yCenter = top + rowH * idx + rowH / 2;
                        const trackH = rowH * 0.4;
                        const xStart = left + width * 0.05;
                        const xEnd = left + width * 0.95;
                        // 트랙
                        ctx.fillStyle = '#1f2937';
                        ctx.roundRect(xStart, yCenter - trackH / 2, xEnd - xStart, trackH, 4);
                        ctx.fill();
                        // 실적
                        const w = (Math.abs(v) / maxVal) * (xEnd - xStart);
                        ctx.fillStyle = colors.bg[idx % colors.bg.length];
                        ctx.roundRect(xStart, yCenter - trackH / 4, w, trackH / 2, 4);
                        ctx.fill();
                    });
                }

                ctx.restore();
            }
        };

        // 고급 차트일 경우 기본 막대는 보이지 않게 처리
        if (isAdvancedChart && datasets[0]) {
            datasets[0].backgroundColor = 'rgba(0,0,0,0)';
            datasets[0].borderColor = 'rgba(0,0,0,0)';
            datasets[0].borderWidth = 0;
            datasets[0].pointRadius = 0;
            datasets[0].pointHoverRadius = 0;
        }

        const config = {
            type: chartType, 
            data: { labels, datasets },
            options: {
                responsive: true, 
                maintainAspectRatio: false, 
                animation: { duration: 800, easing: 'easeOutQuart' },
                layout: { padding: chartPadding },
                indexAxis: showHorizontal ? 'y' : 'x',
                plugins: {
                    title: { display: !!title, text: title, color: titleColor, font: { size: fonts.title, weight: '900', family: fontFamily }, padding: { top: 10, bottom: 25 } },
                    legend: { display: showLegend, position: legendPosition, labels: { color: labelColor, font: { size: fonts.legend, family: fontFamily, weight: '500' }, usePointStyle: true, padding: 20 } },
                    tooltip: {
                        enabled: !isAdvancedChart, // 고급 차트일 땐 네이티브 툴팁 비활성화
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderColor: gridColor, borderWidth: 1, padding: 14, cornerRadius: 8,
                        titleFont: { size: fonts.axis + 2, family: fontFamily, weight: 'bold' }, bodyFont: { size: fonts.axis, family: fontFamily },
                        callbacks: { label: (context) => `${context.dataset.label}: ${formatValue(context.parsed.y ?? context.parsed.x ?? context.parsed)}` }
                    },
                },
                scales: (isPie || isAdvancedChart) ? {
                    x: { display: false },
                    y: { display: false }
                } : {
                    x: {
                        display: true,
                        title: { display: !!xAxisLabel, text: xAxisLabel, color: labelColor, font: { size: fonts.axis, family: fontFamily, weight: 'bold' } },
                        ticks: { color: labelColor, font: { size: fonts.axis, family: fontFamily } },
                        grid: { color: showGrid ? gridColor : 'transparent', drawBorder: false }, stacked: stacked
                    },
                    y: {
                        display: true,
                        title: { display: !!yAxisLabel, text: yAxisLabel, color: labelColor, font: { size: fonts.axis, family: fontFamily, weight: 'bold' } },
                        ticks: { color: labelColor, font: { size: fonts.axis, family: fontFamily }, callback: (value) => formatValue(value) },
                        grid: { color: showGrid ? gridColor : 'transparent', drawBorder: false }, beginAtZero: beginAtZero, stacked: stacked,
                        min: yMin !== '' && !isNaN(yMin) ? Number(yMin) : undefined,
                        max: yMax !== '' && !isNaN(yMax) ? Number(yMax) : undefined,
                    },
                    ...(chartType === 'combo' && {
                        y1: {
                            type: 'linear', display: true, position: 'right',
                            ticks: { color: colors.border[1 % colors.border.length], font: { size: fonts.axis, family: fontFamily }, callback: (value) => formatValue(value) },
                            grid: { drawOnChartArea: false } 
                        }
                    })
                }
            }
        };

        chartRef.current = new Chart(ctx, {
            ...config,
            plugins: [watermarkPlugin, advancedChartPlugin]
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [chartDataObj, chartType, actualChartType, title, showLegend, legendPosition, colorTheme, backgroundColor, showGrid, barThickness, borderRadius, lineWidth, fontFamily, fonts, xAxisLabel, yAxisLabel, showHorizontal, showDataLabels, beginAtZero, gridColor, labelColor, titleColor, stacked, cutoutPercent, valueFormat, showAverageLine, customColors, autoHighlight, highlightNegative, enableGradient, dataLabelPosition, lineStyle, yMin, yMax, showPiePercent, chartPadding, watermarkEnabled, watermarkText, watermarkDesign, watermarkGridSize, watermarkFontSize, watermarkOpacity, watermarkPosition, watermarkAngle, showTrendLine]);

    const activeTabClass = "px-4 py-3 text-sm font-bold text-brand-400 border-b-2 border-brand-500 bg-slate-800/80 transition-colors";
    const inactiveTabClass = "px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors";

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden font-sans" ref={containerRef}>
            
            {/* ── 통합 툴바 ── */}
            {!hideToolbar && <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5 ml-auto">
                    <button
                        ref={chartSettingsBtnRef}
                        onClick={() => openChartPanel(chartPanelTab)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all hover:scale-105"
                        style={{ background: showChartPanel ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showChartPanel ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`, color: showChartPanel ? '#a5b4fc' : '#94a3b8' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        디자인
                    </button>
                    <button onClick={copyToClipboard} disabled={!chartDataObj.labels.length} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-30" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', color: '#a78bfa' }}>복사</button>
                    <button onClick={exportAsPNG} disabled={!chartDataObj.labels.length} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-30" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)', color: '#c4b5fd' }}>PNG</button>
                    <button onClick={() => {
                        if (!chartDataObj.labels.length) return;
                        const total = chartDataObj.vals.reduce((a,b)=>a+b,0);
                        const rows = [['항목','값','비율(%)'], ...chartDataObj.labels.map((l,i)=>[l,chartDataObj.vals[i],((chartDataObj.vals[i]/total)*100).toFixed(2)+'%'])];
                        const blob = new Blob(['\uFEFF'+rows.map(r=>r.join(',')).join('\n')],{type:'text/csv;charset=utf-8;'});
                        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`chart_${Date.now()}.csv`; a.click();
                    }} disabled={!chartDataObj.labels.length} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-30" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}>CSV</button>
                    <button onClick={() => {
                        if (onRequestZoom) { onRequestZoom(); return; }
                        if (!containerRef.current) return;
                        if (!isFullscreen) { ['position','top','left','right','bottom','width','height','zIndex','background'].forEach((k,i) => { containerRef.current.style[k] = ['fixed','0','0','0','0','100%','100%','9999','#0f172a'][i]; }); }
                        else { ['position','top','left','right','bottom','width','height','zIndex','background'].forEach(k => { containerRef.current.style[k] = ''; }); }
                        setIsFullscreen(!isFullscreen); if (onZoomChange) onZoomChange(!isFullscreen);
                    }} className="p-1.5 rounded-lg transition-all hover:scale-105" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }} title={isFullscreen ? '원래 크기로' : '전체화면'}>
                        {isFullscreen ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
                    </button>
                </div>
            </div>}

            {/* ── Portal: 플로팅 차트 설정 패널 ── */}
            {showChartPanel && createPortal(
                <div id="chart-floating-panel"
                    className="flex flex-col rounded-2xl shadow-2xl overflow-hidden"
                    style={{ position: 'fixed', top: chartPanelPos.top, right: chartPanelPos.right, width: 340, maxHeight: '82vh', zIndex: 9999, background: 'rgba(5,10,24,0.98)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                        <span className="text-sm font-bold text-slate-200 flex-1">차트 설정</span>
                        <button onClick={() => setShowChartPanel(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex border-b border-white/8 shrink-0">
                        {[['data','📊 데이터'],['feature','✨ 기능'],['overlay','📝 텍스트'],['style','🎨 스타일'],['advanced','🔒 고급']].map(([id,label]) => (
                            <button key={id} onClick={() => setChartPanelTab(id)}
                                className={`flex-1 py-2.5 text-[10px] font-bold transition-colors ${chartPanelTab === id ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chartPanelTab === 'data' && (<>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">차트 타입</label>
                                <div className="text-[11px] text-slate-300 leading-relaxed">
                                    
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {[
                                            ['bar', ' 세로 막대형'],
                                            ['horizontal-bar', ' 가로 막대형'],
                                            ['line', ' 꺾은선형'],
                                            ['area', ' 영역형'],
                                            ['combo', ' 혼합형'],
                                            ['pie', ' 원형'],
                                            ['doughnut', ' 도넛형'],
                                            ['treemap', ' 트리맵'],
                                            ['sankey', ' 생키'],
                                            ['heatmap', ' 히트맵'],
                                            ['marimekko', ' 메코'],
                                            ['tornado', ' 토네이도'],
                                            ['scatter', '· 분산형'],
                                            ['bubble', '· 거품형'],
                                            ['histogram', '· 히스토그램'],
                                            ['pareto', '· 파레토'],
                                            ['boxplot', '· 상자수염'],
                                            ['radar', '· 레이더'],
                                            ['waterfall', '· 폭포'],
                                            ['stock', '· 주식형'],
                                            ['gantt', '· 간트'],
                                            ['gauge', '· 게이지'],
                                            ['bullet', '· 불릿'],
                                        ].map(([type, label]) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    const newType = type;
                                                    setActualChartType(newType);
                                                    let nType = newType;
                                                    if (['horizontal-bar', 'histogram', 'pareto', 'waterfall', 'treemap', 'stock', 'gantt', 'bullet', 'sankey', 'heatmap', 'marimekko', 'tornado', 'boxplot', 'funnel'].includes(newType)) {
                                                        nType = 'bar';
                                                        if (newType === 'horizontal-bar') setShowHorizontal(true);
                                                        else setShowHorizontal(false);
                                                    } else if (['area'].includes(newType)) {
                                                        nType = 'line';
                                                    } else if (['sunburst', 'gauge'].includes(newType)) {
                                                        nType = 'doughnut';
                                                    } else if (['scatter', 'bubble'].includes(newType)) {
                                                        nType = 'line';
                                                    }
                                                    setChartType(nType);
                                                }}
                                                className={`px-2 py-1 rounded-full border text-[10px] font-semibold transition-all ${
                                                    actualChartType === type
                                                        ? 'bg-sky-600/80 border-sky-400 text-white'
                                                        : 'bg-slate-800/70 border-slate-600 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">차트 제목</label>
                                <input type="text" placeholder="차트 제목..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none" />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1.5">X축 (그룹)</label>
                                    <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-2 py-2 text-xs rounded-lg border border-blue-500/25 outline-none">
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <button onClick={swapAxes} className="mt-5 p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 rounded-lg transition-all shrink-0" title="스왑">⇄</button>
                                <div className="flex-1">
                                    <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1.5">Y축 (수치)</label>
                                    <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-2 py-2 text-xs rounded-lg border border-emerald-500/25 outline-none">
                                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                        {!numericColumns.length && columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            {chartType === 'combo' && (
                                <div>
                                    <label className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1.5">보조 Y축 (라인)</label>
                                    <select value={yAxis2} onChange={e => setYAxis2(e.target.value)} className="w-full bg-slate-900/80 text-indigo-300 px-3 py-2 text-xs rounded-lg border border-indigo-500/25 outline-none">
                                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1.5">집계 방식</label>
                                <div className="grid grid-cols-5 gap-1">
                                    {[['sum','합계'],['avg','평균'],['count','개수'],['max','최대'],['min','최소']].map(([v,l]) => (
                                        <button key={v} onClick={() => setAggregationType(v)} className={`py-1.5 text-[10px] font-bold rounded transition-all ${aggregationType === v ? 'bg-amber-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">정렬</label>
                                <div className="flex gap-1">
                                    {[['desc','내림차순'],['asc','오름차순'],['none','원본']].map(([v,l]) => (
                                        <button key={v} onClick={() => setSortData(v)} className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${sortData === v ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">값 서식</label>
                                <select value={valueFormat} onChange={e => setValueFormat(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none">
                                    <option value="none">원본</option>
                                    <option value="comma">천단위 콤마</option>
                                    <option value="krw">₩ 원화</option>
                                    <option value="usd">$ 달러</option>
                                    <option value="percent">% 퍼센트</option>
                                    <option value="compact">축약 (1.2만)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${groupOthers ? 'bg-purple-500/15 border-purple-500/40 text-purple-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}>
                                    <input type="checkbox" checked={groupOthers} onChange={e => setGroupOthers(e.target.checked)} className="accent-purple-500" /> 상위 N개 → 기타
                                </label>
                                {groupOthers && <input type="number" value={topNCount} onChange={e => setTopNCount(Number(e.target.value))} className="w-16 bg-slate-900/80 text-slate-200 px-2 py-2 text-xs rounded-lg border border-slate-700 outline-none text-center" min="1" />}
                            </div>
                        </>)}
                        {chartPanelTab === 'feature' && (<>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">기본 표시 옵션</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            [showLegend ?? true, setShowLegend, '범례 표시', false],
                                            [showDataLabels, setShowDataLabels, '데이터 라벨', false],
                                            [showGrid ?? true, setShowGrid, '그리드 표시', false],
                                            [beginAtZero, setBeginAtZero, 'Y축 0부터', false],
                                            [showDataTable, setShowDataTable, '데이터표 표시', false],
                                            [showTrendLine, setShowTrendLine, '추세선 표시', ['pie','doughnut','radar','polarArea'].includes(chartType)],
                                        ].map(([val, setter, label, disabled]) => (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => !disabled && setter(!val)}
                                                disabled={disabled}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                                                    disabled
                                                        ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-500'
                                                        : val
                                                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200 shadow-[0_0_0_1px_rgba(129,140,248,0.2)]'
                                                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800/70'
                                                }`}
                                            >
                                                <span>{label}</span>
                                                {!disabled && (
                                                    <span
                                                        className={`w-7 h-4 rounded-full flex items-center px-0.5 ${
                                                            val ? 'bg-indigo-500/80 justify-end' : 'bg-slate-700 justify-start'
                                                        }`}
                                                    >
                                                        <span className="w-3 h-3 rounded-full bg-white/95 shadow" />
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">차트 모양</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            [stacked, setStacked, '누적 차트', !['bar','area','combo'].includes(chartType)],
                                            [showHorizontal, setShowHorizontal, '수평 차트', chartType !== 'bar'],
                                            [enableGradient, setEnableGradient, '그라데이션', ['pie','doughnut','radar','polarArea'].includes(chartType)],
                                            [showAverageLine, setShowAverageLine, '평균선 표시', ['pie','doughnut'].includes(chartType)],
                                        ].map(([val, setter, label, disabled]) => (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => !disabled && setter(!val)}
                                                disabled={disabled}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                                                    disabled
                                                        ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-500'
                                                        : val
                                                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]'
                                                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800/70'
                                                }`}
                                            >
                                                <span>{label}</span>
                                                {!disabled && (
                                                    <span
                                                        className={`w-7 h-4 rounded-full flex items-center px-0.5 ${
                                                            val ? 'bg-sky-500/80 justify-end' : 'bg-slate-700 justify-start'
                                                        }`}
                                                    >
                                                        <span className="w-3 h-3 rounded-full bg-white/95 shadow" />
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">강조</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            [autoHighlight, (v) => { setAutoHighlight(v); if(v) { setHighlightNegative(false); setCustomColors({}); } }, '최대 최소 강조'],
                                            [highlightNegative, (v) => { setHighlightNegative(v); if(v) { setAutoHighlight(false); setCustomColors({}); } }, '음수 강조'],
                                        ].map(([val, setter, label]) => (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => setter(!val)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                                                    val
                                                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.25)]'
                                                        : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800/70'
                                                }`}
                                            >
                                                <span>{label}</span>
                                                <span
                                                    className={`w-7 h-4 rounded-full flex items-center px-0.5 ${
                                                        val ? 'bg-amber-500/80 justify-end' : 'bg-slate-700 justify-start'
                                                    }`}
                                                >
                                                    <span className="w-3 h-3 rounded-full bg-white/95 shadow" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-1 border-t border-slate-800/60 space-y-3">
                                    {showDataLabels && (
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">데이터 라벨 위치</label>
                                            <div className="flex gap-1">
                                                {[['top','위'],['center','중앙']].map(([v,l]) => (
                                                    <button key={v} onClick={() => setDataLabelPosition(v)} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${dataLabelPosition === v ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Y축 범위</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-[10px] text-slate-600 block mb-1">최소</span>
                                                <input type="number" placeholder="자동" value={yMin} onChange={e => setYMin(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-2 py-2 text-xs rounded-lg border border-slate-700 outline-none" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-600 block mb-1">최대</span>
                                                <input type="number" placeholder="자동" value={yMax} onChange={e => setYMax(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-2 py-2 text-xs rounded-lg border border-slate-700 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>)}
                        {chartPanelTab === 'overlay' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">텍스트 오버레이 모드</label>
                                    <p className="text-[11px] text-slate-500 mb-2">
                                        아래에서 텍스트를 입력한 뒤, 차트 영역으로 드래그하여 원하는 위치에 배치하세요.
                                    </p>
                                    <textarea
                                        value={newTextValue}
                                        onChange={e => setNewTextValue(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-900/80 text-slate-100 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none resize-y"
                                        placeholder={'예) 주요 인사이트 요약을 적어주세요.\n줄바꿈도 가능합니다.'}
                                        onFocus={() => { setIsAddingText(true); setOverlayType('text'); }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">텍스트 색상</label>
                                        <input
                                            type="color"
                                            value={newTextColor}
                                            onChange={e => setNewTextColor(e.target.value)}
                                            className="w-full h-8 rounded cursor-pointer bg-slate-900/80 border border-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">텍스트 크기</label>
                                        <input
                                            type="number"
                                            min={8}
                                            max={64}
                                            value={newTextSize}
                                            onChange={e => setNewTextSize(Number(e.target.value) || 12)}
                                            className="w-full bg-slate-900/80 text-slate-100 px-2 py-1.5 text-xs rounded-lg border border-slate-700 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400">현재 오버레이</span>
                                        <button
                                            type="button"
                                            onClick={() => setTextOverlays([])}
                                            className="px-2 py-1 rounded-md text-[10px] font-semibold text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition-colors"
                                        >
                                            모두 삭제
                                        </button>
                                    </div>
                                    {textOverlays.length === 0 ? (
                                        <div className="text-[11px] text-slate-500 px-3 py-2 rounded-lg bg-slate-900/60 border border-dashed border-slate-700">
                                            아래 `텍스트 블록`을 드래그해 차트 영역에 놓으면 오버레이가 생성됩니다.
                                        </div>
                                    ) : (
                                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                            {textOverlays.map(text => (
                                                <div
                                                    key={text.id}
                                                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700/60 text-[11px] text-slate-200"
                                                >
                                                    <span className="truncate max-w-[150px]">{text.text}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTextOverlays(prev => prev.filter(t => t.id !== text.id))}
                                                        className="ml-2 text-slate-500 hover:text-red-400 text-xs"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!newTextValue.trim() || !chartAreaRef.current) return;
                                                const rect = chartAreaRef.current.getBoundingClientRect();
                                                const centerX = rect.width / 2;
                                                const centerY = rect.height / 2;
                                                setTextOverlays(prev => [
                                                    ...prev,
                                                    {
                                                        id: Date.now(),
                                                        text: newTextValue.replace(/\\n/g, '\n'),
                                                        x: centerX,
                                                        y: centerY,
                                                        color: newTextColor,
                                                        size: newTextSize,
                                                        fontFamily: fontFamily,
                                                        type: 'text',
                                                    },
                                                ]);
                                                setNewTextValue('');
                                            }}
                                            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-sky-500/60 bg-sky-500/15 text-[11px] text-sky-100 hover:bg-sky-500/25 hover:border-sky-400 transition-all"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-sky-500/80 flex items-center justify-center text-[11px] font-bold text-white">T</span>
                                            <span>차트 중앙에 텍스트 삽입</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {chartPanelTab === 'style' && (
                            <div className="space-y-6">
                                {/* 1. 공통: 테마 · 배경 · 글꼴 */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">색상 테마</label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {Object.keys(colorThemes).map(theme => (
                                                <button
                                                    key={theme}
                                                    onClick={() => { setColorTheme(theme); setAutoHighlight(false); setHighlightNegative(false); setCustomColors({}); }}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                                                        colorTheme === theme && !autoHighlight && !highlightNegative
                                                            ? 'bg-indigo-500/20 border border-indigo-500/50 text-white'
                                                            : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="flex gap-0.5">
                                                        <div className="w-3 h-3 rounded-full" style={{background: colorThemes[theme].bg[0]}}></div>
                                                        <div className="w-3 h-3 rounded-full" style={{background: colorThemes[theme].bg[1]}}></div>
                                                    </div>
                                                    {theme === 'corporate'
                                                        ? '비즈니스'
                                                        : theme === 'pastel'
                                                            ? '파스텔'
                                                            : theme === 'report'
                                                                ? '보고서'
                                                                : theme === 'vivid'
                                                                    ? '비비드'
                                                                    : theme === 'ocean'
                                                                        ? '오션'
                                                                        : theme === 'sunrise'
                                                                            ? '선라이즈'
                                                                            : theme}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">차트 배경</label>
                                            <select
                                                value={backgroundColor}
                                                onChange={e => setBackgroundColor(e.target.value)}
                                                className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none"
                                            >
                                                <option value="transparent">투명</option>
                                                <option value="#0f172a">다크 (Dark)</option>
                                                <option value="#1e293b">슬레이트 (Slate)</option>
                                                <option value="#000000">블랙 (Black)</option>
                                                <option value="#ffffff">화이트 (White)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">글꼴</label>
                                            <select
                                                value={fontFamily}
                                                onChange={e => setFontFamily(e.target.value)}
                                                className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none"
                                            >
                                                <option value="'Pretendard', sans-serif">Pretendard</option>
                                                <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
                                                <option value="'Malgun Gothic', sans-serif">맑은 고딕</option>
                                                <option value="Inter">Inter</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        {[['title','타이틀',12,40],['axis','축 라벨',8,24],['legend','범례',8,24],['dataLabel','데이터 수치',8,30]].map(([key,label,min,max]) => (
                                            <div key={key}>
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-[10px] text-slate-500 font-bold">{label}</label>
                                                    <span className="text-[10px] text-slate-400 font-mono">{fonts[key]}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={min}
                                                    max={max}
                                                    value={fonts[key]}
                                                    onChange={e => updateFont(key, e.target.value)}
                                                    className="w-full accent-indigo-500 h-1.5"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. 차트 타입별 유동적 디자인 옵션 */}
                                <div className="space-y-4 pt-4 border-t border-slate-700/50">
                                    <h3 className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2">요소 스타일링</h3>

                                    {/* 막대형 계열: 막대 두께 & 둥근 모서리 */}
                                    {['bar','horizontal-bar','combo','waterfall','histogram','tornado','pareto','treemap','marimekko','funnel','boxplot','bullet','gantt'].includes(actualChartType) && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-[10px] text-slate-500 font-bold">막대 두께</label>
                                                    <span className="text-[10px] text-slate-400 font-mono">{barThickness}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="80"
                                                    value={barThickness}
                                                    onChange={e => setBarThickness(Number(e.target.value))}
                                                    className="w-full accent-indigo-500 h-1.5"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-[10px] text-slate-500 font-bold">모서리 둥글기</label>
                                                    <span className="text-[10px] text-slate-400 font-mono">{borderRadius}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="25"
                                                    value={borderRadius}
                                                    onChange={e => setBorderRadius(Number(e.target.value))}
                                                    className="w-full accent-indigo-500 h-1.5"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* 선/영역/분산 계열: 선 두께 & 스타일 */}
                                    {['line','area','scatter','bubble','stock','radar'].includes(actualChartType) && (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-[10px] text-slate-500 font-bold">선 두께</label>
                                                        <span className="text-[10px] text-slate-400 font-mono">{lineWidth}px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="8"
                                                        value={lineWidth}
                                                        onChange={e => setLineWidth(Number(e.target.value))}
                                                        className="w-full accent-indigo-500 h-1.5"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[10px] text-slate-500 font-bold mb-1">선 스타일</div>
                                                    <div className="flex gap-1">
                                                        {[['smooth','부드럽게'],['straight','직선'],['step','계단형']].map(([v,l]) => (
                                                            <button
                                                                key={v}
                                                                onClick={() => setLineStyle(v)}
                                                                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${
                                                                    lineStyle === v ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'
                                                                }`}
                                                            >
                                                                {l}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 파이/도넛/선버스트/게이지 계열 */}
                                    {['pie','doughnut','sunburst','gauge'].includes(actualChartType) && (
                                        <div className="space-y-2">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-[10px] text-slate-500 font-bold">도넛 두께</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{cutoutPercent}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="20"
                                                    max="90"
                                                    value={cutoutPercent}
                                                    onChange={e => setCutoutPercent(Number(e.target.value))}
                                                    className="w-full accent-indigo-500 h-1.5"
                                                />
                                            </div>
                                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${showPiePercent ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}>
                                                <input type="checkbox" checked={showPiePercent} onChange={e => setShowPiePercent(e.target.checked)} className="accent-emerald-500" /> 퍼센트 라벨 표시
                                            </label>
                                        </div>
                                    )}

                                    {/* 히트맵/맵/서피스/트리맵/흐름 계열 */}
                                    {['heatmap','treemap','sankey','gantt'].includes(actualChartType) && (
                                        <div className="space-y-2">
                                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${enableGradient ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}>
                                                <input type="checkbox" checked={enableGradient} onChange={e => setEnableGradient(e.target.checked)} className="accent-indigo-500" /> 셀 그라데이션 강조
                                            </label>
                                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${showGrid ? 'bg-slate-700/40 border-slate-500/60 text-slate-200' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}>
                                                <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="accent-slate-400" /> 격자선 표시
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* 3. 요소별 색상 커스터마이징 (데이터가 있을 때만) */}
                                {chartDataObj.labels && chartDataObj.labels.length > 0 && (
                                    <div className="pt-4 border-t border-slate-700/50 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">요소별 색상</label>
                                                <p className="text-[10px] text-slate-500">
                                                    막대·선·면·노드 등 각 요소의 색을 직접 지정합니다.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setCustomColors({})}
                                                className="text-[10px] text-slate-500 hover:text-red-400 px-2 py-0.5 rounded border border-slate-700 hover:border-red-500/30 transition-colors"
                                            >
                                                초기화
                                            </button>
                                        </div>
                                        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                            {chartDataObj.labels.map((label, idx) => {
                                                const key = String(label);
                                                const current = customColors[key];
                                                const fallbackHex = '#3b82f6';
                                                const colorValue = typeof current === 'string' && current.startsWith('#')
                                                    ? current
                                                    : fallbackHex;

                                                return (
                                                    <div
                                                        key={key}
                                                        className="flex items-center justify-between gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div
                                                                className="w-7 h-4 rounded border border-slate-600"
                                                                style={{ background: current || colors.bg[idx % colors.bg.length] }}
                                                            />
                                                            <div className="flex flex-col min-w-0">
                                                                <span
                                                                    className="text-[11px] text-slate-200 font-medium truncate max-w-[140px]"
                                                                    title={key}
                                                                >
                                                                    {key}
                                                                </span>
                                                                <span className="text-[9px] text-slate-500">
                                                                    요소 #{idx + 1}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="color"
                                                            value={colorValue}
                                                            onChange={e => {
                                                                const hex = e.target.value;
                                                                setCustomColors(prev => ({ ...prev, [key]: hex }));
                                                                setAutoHighlight(false);
                                                                setHighlightNegative(false);
                                                            }}
                                                            className="w-6 h-6 border-0 bg-transparent p-0 cursor-pointer rounded shrink-0"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {chartPanelTab === 'advanced' && (<>
                            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-red-300">🔒 워터마크 (대외비)</span>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={watermarkEnabled} onChange={e => setLocalWatermarkEnabled(e.target.checked)} className="accent-red-500" />
                                        <span className={watermarkEnabled ? 'text-red-300 font-bold' : 'text-slate-500'}>{watermarkEnabled ? '켜짐' : '꺼짐'}</span>
                                    </label>
                                </div>
                                {watermarkEnabled && (<>
                                    <input type="text" value={watermarkText} onChange={e => setLocalWatermarkText(e.target.value)} placeholder="워터마크 텍스트..." className="w-full bg-slate-900/80 text-red-300 px-3 py-2 text-xs rounded-lg border border-red-500/30 outline-none" />
                                    <div>
                                        <label className="text-[10px] text-red-300 font-bold block mb-1.5">배치 방식</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {[['single','가운데'],['multiple','격자'],['corner','4코너']].map(([v,l]) => (
                                                <button key={v} onClick={() => setLocalWatermarkDesign(v)} className={`py-1.5 text-[10px] font-bold rounded transition-all ${localWatermarkDesign===v ? 'bg-red-700 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50'}`}>{l}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {localWatermarkDesign === 'multiple' && (
                                        <div>
                                            <label className="text-[10px] text-red-300 font-bold block mb-1">격자 수: {watermarkGridSize}×{watermarkGridSize}</label>
                                            <input type="range" min="2" max="8" value={watermarkGridSize} onChange={e => setWatermarkGridSize(Number(e.target.value))} className="w-full accent-red-500 h-1.5" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[10px] text-red-300 font-bold block mb-1">크기: {watermarkFontSize}px</label>
                                        <input type="range" min="12" max="120" value={watermarkFontSize} onChange={e => setWatermarkFontSize(Number(e.target.value))} className="w-full accent-red-500 h-1.5" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['#dc2626','#ea580c','#ca8a04','#16a34a','#2563eb','#7c3aed','#4b5563','#0f172a'].map(color => (
                                            <button key={color} onClick={() => setLocalWatermarkColor(color)} className={`w-6 h-6 rounded-full border-2 transition-all ${localWatermarkColor === color ? 'border-white scale-110' : 'border-transparent'}`} style={{background: color}} />
                                        ))}
                                    </div>
                                </>)}
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">퀵 템플릿</label>
                                {[
                                    { id: 'report', label: '📄 문서·보고서용', desc: '화이트 배경, 깔끔한 스타일' },
                                    { id: 'pitch', label: '🌙 다크·발표용', desc: '진한 배경, 선명한 색상' },
                                ].map(t => (
                                    <button key={t.id} onClick={() => { applyTemplate(t.id); setShowChartPanel(false); }}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-white/5 border border-white/5 transition-all mb-1.5 hover:border-indigo-500/30">
                                        <div>
                                            <div className="text-xs font-bold text-slate-200">{t.label}</div>
                                            <div className="text-[10px] text-slate-500">{t.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>)}
                    </div>
                </div>,
                document.body
            )}

            {/* 텍스트/포스트잇 관리 상태바 */}
            {textOverlays.length > 0 && (
                <div className="bg-slate-800 px-4 py-2.5 flex gap-3 overflow-x-auto shrink-0 border-b border-slate-700 items-center">
                    <span className="text-xs font-bold text-amber-400 flex items-center shrink-0">추가된 텍스트/인사이트:</span>
                    {textOverlays.map(text => (
                        <div key={text.id} className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-1.5 text-sm flex items-center gap-3 whitespace-nowrap shadow-sm hover:border-amber-500 transition-colors">
                            <span style={{ color: text.color }} className="truncate max-w-[150px] font-bold">{text.text.split('\n')[0]}</span>
                            <button onClick={() => removeText(text.id)} className="text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center font-bold">✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* 데이터 테이블 */}
            {showDataTable && chartDataObj.labels.length > 0 && (
                <div className="shrink-0 border-t border-slate-700 bg-slate-900/80 overflow-x-auto max-h-[160px]">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="px-3 py-2 text-left text-slate-400 font-bold sticky left-0 bg-slate-900">{xAxis}</th>
                                {chartDataObj.labels.map((l, i) => (
                                    <th key={i} className="px-3 py-2 text-right text-slate-400 font-bold whitespace-nowrap">{l}</th>
                                ))}
                                <th className="px-3 py-2 text-right text-sky-400 font-bold">합계</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="px-3 py-1.5 text-slate-300 font-semibold sticky left-0 bg-slate-900">{yAxis}</td>
                                {chartDataObj.vals.map((v, i) => (
                                    <td key={i} className="px-3 py-1.5 text-right text-slate-200 tabular-nums">{typeof v === 'number' ? v.toLocaleString() : v}</td>
                                ))}
                                <td className="px-3 py-1.5 text-right text-sky-300 font-bold tabular-nums">
                                    {chartDataObj.vals.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0).toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Chart Area */}
            <div 
                className="flex-1 relative p-6 min-h-[450px] select-none overflow-auto"
                style={{ backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor }}
                ref={chartAreaRef}
                onClick={handleAddTextClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {!data.length || !numericColumns.length ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full gap-4">
                        <div className="p-5 bg-slate-800/50 rounded-2xl shadow-inner border border-slate-700">
                            <svg className="w-16 h-16 opacity-40 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <span className="text-lg font-bold text-slate-300">표시할 데이터가 없거나 숫자 데이터가 포함되지 않았습니다.</span>
                    </div>
                ) : (
                    <>
                        {watermarkEnabled && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                                {watermarkDesign === 'single' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="font-black -rotate-45 whitespace-nowrap select-none opacity-10" style={{ color: watermarkColor, fontSize: `${watermarkFontSize}px` }}>{watermarkText}</span>
                                    </div>
                                )}
                                {watermarkDesign === 'multiple' && (
                                    <div 
                                        className="absolute inset-0 grid pointer-events-none opacity-10"
                                        style={{ 
                                            gridTemplateColumns: `repeat(${watermarkGridSize}, 1fr)`,
                                            gridTemplateRows: `repeat(${watermarkGridSize}, 1fr)`
                                        }}
                                    >
                                        {Array.from({ length: watermarkGridSize * watermarkGridSize }).map((_, i) => {
                                            const adjustedFontSize = Math.max(12, Math.min(watermarkFontSize, watermarkFontSize - watermarkGridSize * 2));
                                            return (
                                                <div key={i} className="flex items-center justify-center">
                                                    <span 
                                                        className="font-black -rotate-45 select-none whitespace-nowrap"
                                                        style={{ fontSize: `${adjustedFontSize}px`, color: watermarkColor }}
                                                    >
                                                        {watermarkText}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {watermarkDesign === 'corner' && (
                                    <>
                                        <span className="absolute font-black select-none opacity-15" style={{ color: watermarkColor, fontSize: `${Math.max(24, watermarkFontSize * 0.6)}px`, top: '2rem', right: '2rem' }}>{watermarkText}</span>
                                        <span className="absolute font-black select-none opacity-15" style={{ color: watermarkColor, fontSize: `${Math.max(24, watermarkFontSize * 0.6)}px`, bottom: '2rem', left: '2rem' }}>{watermarkText}</span>
                                        <span className="absolute font-black select-none opacity-15" style={{ color: watermarkColor, fontSize: `${Math.max(24, watermarkFontSize * 0.6)}px`, top: '2rem', left: '2rem' }}>{watermarkText}</span>
                                        <span className="absolute font-black select-none opacity-15" style={{ color: watermarkColor, fontSize: `${Math.max(24, watermarkFontSize * 0.6)}px`, bottom: '2rem', right: '2rem' }}>{watermarkText}</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 우측 상단 자동 트렌드 뱃지 */}
                        {chartType !== 'pie' && chartType !== 'doughnut' && chartDataObj.vals.length > 1 && sortData === 'none' && !groupOthers && (
                            <div className="absolute top-4 right-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-lg shadow-lg pointer-events-none flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-bold">성장 추세:</span>
                                <span className={`text-sm font-bold flex items-center gap-1 ${chartDataObj.growthRate > 0 ? 'text-emerald-400' : chartDataObj.growthRate < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                    {chartDataObj.growthRate > 0 ? '📈 +' : chartDataObj.growthRate < 0 ? '📉 ' : '➖ '}{chartDataObj.growthRate.toFixed(1)}%
                                </span>
                            </div>
                        )}

                        <canvas ref={canvasRef} className="pointer-events-auto z-10 relative"></canvas>
                        
                        {/* 사용자 텍스트 오버레이 (일반 / 요약 박스 / AI 인사이트) */}
                        {textOverlays.map(text => {
                            const isAIInsight = text.type === 'ai-insight';
                            
                            return (
                            <div
                                key={text.id}
                                className={`absolute cursor-move transition-all z-20 ${
                                    isAIInsight 
                                    ? 'p-0 rounded-xl shadow-2xl overflow-hidden' 
                                    : text.type === 'exec-summary' || text.type === 'box'
                                    ? 'bg-slate-800/90 border-l-4 border-amber-500 p-4 rounded shadow-2xl backdrop-blur-sm' 
                                    : 'px-2 py-1 border border-transparent hover:border-amber-500/50 hover:bg-slate-900/30 rounded-lg'
                                } ${draggingText?.id === text.id ? 'opacity-70 scale-105' : ''}`}
                                style={{ 
                                    left: text.x, 
                                    top: text.y, 
                                    color: text.color, 
                                    fontSize: `${text.size}px`, 
                                    fontFamily: text.fontFamily || fontFamily, 
                                    lineHeight: 1.5, 
                                    whiteSpace: 'pre-wrap',
                                    backgroundColor: isAIInsight ? (text.boxBg || 'rgba(15,23,42,0.92)') : undefined,
                                    border: isAIInsight ? `1px solid ${text.borderColor || '#334155'}` : undefined,
                                    borderLeft: isAIInsight ? `4px solid ${text.accentColor || '#38bdf8'}` : undefined,
                                }}
                                onMouseDown={(e) => handleTextMouseDown(e, text.id)}
                            >
                                {isAIInsight && (
                                    <div className="px-4 py-3 border-b" style={{ borderColor: text.borderColor }}>
                                        <span className="text-xs font-bold tracking-wider uppercase" style={{ color: text.accentColor }}>
                                            🤖 AI 경영진 브리핑
                                        </span>
                                    </div>
                                )}
                                <div className={isAIInsight ? 'px-4 py-3' : ''}>
                                    {text.text}
                                </div>
                            </div>
                        )})}
                    </>
                )}
            </div>
            
            {/* Footer Status Bar */}
            <div className="bg-slate-900 border-t border-slate-800 px-5 py-3 text-xs text-slate-400 shrink-0 flex justify-between items-center font-medium">
                <div className="flex items-center gap-4">
                    {groupOthers && <span className="text-brand-400 flex items-center gap-1.5 bg-brand-900/20 px-2 py-1 rounded">✂️ 상위 {topNCount}개 제외 나머지를 '기타'로 합쳤습니다.</span>}
                </div>
                <div className="flex gap-4">
                    <span>X 그룹 수: <strong className="text-slate-200">{chartDataObj.labels.length}</strong></span>
                    <span>원본 행 데이터: <strong className="text-slate-200">{data.length}</strong></span>
                </div>
            </div>
        </div>
    );
};

export default ChartViewer;