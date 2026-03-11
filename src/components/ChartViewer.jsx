import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Chart from 'chart.js/auto';
import 'chartjs-plugin-datalabels';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Chart.js v3+에서 datalabels 플러그인 등록
Chart.register(ChartDataLabels);

const ChartViewer = ({ data, columns, watermarkEnabled: propWatermarkEnabled = false, watermarkText: propWatermarkText = 'CONFIDENTIAL', watermarkDesign: propWatermarkDesign = 'single', onZoomChange, onRequestZoom, hideToolbar = false }) => {
    
    // 로컬 상태 (App에서 전달된 props가 없거나 활성화된 경우 사용)
    const [localWatermarkEnabled, setLocalWatermarkEnabled] = useState(Boolean(propWatermarkEnabled));
    const [localWatermarkText, setLocalWatermarkText] = useState(propWatermarkText || 'CONFIDENTIAL');
    const [localWatermarkDesign, setLocalWatermarkDesign] = useState(propWatermarkDesign || 'single');
    const [localWatermarkColor, setLocalWatermarkColor] = useState('#dc2626');
    const [watermarkGridSize, setWatermarkGridSize] = useState(3);
    const [watermarkFontSize, setWatermarkFontSize] = useState(48);
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.12);
    const [watermarkPosition, setWatermarkPosition] = useState('center'); // center | top-left | top-right | bottom-left | bottom-right | all-corners
    const [watermarkAngle, setWatermarkAngle] = useState(-45);
    
    // 부모에서 값이 바뀌면 초기값처럼 동기화하되, 이후 UI 제어는 로컬에서 일관되게 처리한다.
    useEffect(() => {
        setLocalWatermarkEnabled(Boolean(propWatermarkEnabled));
    }, [propWatermarkEnabled]);

    useEffect(() => {
        setLocalWatermarkText(propWatermarkText || 'CONFIDENTIAL');
    }, [propWatermarkText]);

    useEffect(() => {
        setLocalWatermarkDesign(propWatermarkDesign || 'single');
    }, [propWatermarkDesign]);

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
    const [chartType, setChartType] = useState('bar'); 
    const [title, setTitle] = useState('');
    const [aggregationType, setAggregationType] = useState('sum'); 
    
    // 상위 N개 외 '기타' 자동 묶기
    const [groupOthers, setGroupOthers] = useState(false);
    const [topNCount, setTopNCount] = useState(5);
    
    // 트렌드 라인 (선형 회귀)
    const [showTrendLine, setShowTrendLine] = useState(false);
    // 데이터 테이블 표시
    const [showDataTable, setShowDataTable] = useState(false);
    // 누적 % 보기 (폭포/파레토)
    const [showCumulativeLine, setShowCumulativeLine] = useState(false);

    // ================= 디자인 & 포맷 상태 =================
    const [valueFormat, setValueFormat] = useState('none'); 
    const [colorTheme, setColorTheme] = useState('mckinsey'); 
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
    const [chartPadding, setChartPadding] = useState(20); // 차트 주변 여백
    const [isFullscreen, setIsFullscreen] = useState(false); // 전체화면 모드
    
    const [showLegend, setShowLegend] = useState(true);
    const [legendPosition, setLegendPosition] = useState('bottom');
    const [sortData, setSortData] = useState('desc'); // 기본 내림차순
    
    // 고급 시각 옵션
    const [showAverageLine, setShowAverageLine] = useState(false);
    const [autoHighlight, setAutoHighlight] = useState(false); 
    const [highlightNegative, setHighlightNegative] = useState(false); 
    const [enableGradient, setEnableGradient] = useState(false); 
    const [showWatermark, setShowWatermark] = useState(false);
    const [showPiePercent, setShowPiePercent] = useState(true); // 파이/도넛 차트 퍼센트 표시
    const [customColors, setCustomColors] = useState({});
    
    // 추가된 상태 변수
    const [xAxisLabel, setXAxisLabel] = useState('');
    const [yAxisLabel, setYAxisLabel] = useState('');
    const [gridColor, setGridColor] = useState('#334155');
    const [labelColor, setLabelColor] = useState('#94a3b8');
    const [titleColor, setTitleColor] = useState('#e2e8f0');
    const [showTargetLine, setShowTargetLine] = useState(false);
    const [targetValue, setTargetValue] = useState('');
    const [activeDesignTab, setActiveDesignTab] = useState('data');
    const [showDataSettings, setShowDataSettings] = useState(false);
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

    // 배경색 변경 시 격자 그물색상 자동 조정
    useEffect(() => {
        if (backgroundColor === '#1e293b') {
            setGridColor('#475569'); // 슬레이트 배경에 더 밝은 격자
        } else if (backgroundColor === '#0f172a') {
            setGridColor('#334155'); // 다크 배경에 밝은 격자
        } else if (backgroundColor === '#000000') {
            setGridColor('#374151'); // 블랙 배경에 밝은 격자
        } else if (backgroundColor === '#ffffff' || backgroundColor === '#f8fafc') {
            setGridColor('#f1f5f9'); // 화이트/라이트 배경에 어두운 격자
        } else {
            setGridColor('#334155'); // 기본값
        }
    }, [backgroundColor]);

    // ================= 텍스트/오버레이 관리 =================
    const [textOverlays, setTextOverlays] = useState([]);
    const [isAddingText, setIsAddingText] = useState(false);
    const [newTextValue, setNewTextValue] = useState('');
    const [overlayType, setOverlayType] = useState('text'); 
    const [newTextColor, setNewTextColor] = useState('#ffffff');
    const [newTextSize, setNewTextSize] = useState(14);
    const [draggingText, setDraggingText] = useState(null);
    
    // AI Insight 및 Text Add를 위한 탭 활성화 상태
    const [activeToolbarTab, setActiveToolbarTab] = useState(null); // 'ai' | 'text' | null

    const colorThemes = {
        corporate: { bg: ['rgba(59, 130, 246, 0.85)', 'rgba(16, 185, 129, 0.85)', 'rgba(245, 158, 11, 0.85)', 'rgba(239, 68, 68, 0.85)', 'rgba(139, 92, 246, 0.85)', 'rgba(99, 102, 241, 0.85)', 'rgba(236, 72, 153, 0.85)'], border: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#4f46e5', '#db2777'] },
        mckinsey: { bg: ['rgba(30, 58, 138, 0.85)', 'rgba(71, 85, 105, 0.85)', 'rgba(148, 163, 184, 0.85)', 'rgba(15, 23, 42, 0.85)', 'rgba(100, 116, 139, 0.85)'], border: ['#1e3a8a', '#475569', '#94a3b8', '#0f172a', '#64748b'] },
        pastel: { bg: ['rgba(147, 197, 253, 0.85)', 'rgba(167, 243, 208, 0.85)', 'rgba(253, 230, 138, 0.85)', 'rgba(254, 202, 202, 0.85)', 'rgba(221, 214, 254, 0.85)'], border: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'] },
        report: { bg: ['rgba(51, 65, 85, 0.9)', 'rgba(100, 116, 139, 0.9)', 'rgba(148, 163, 184, 0.9)', 'rgba(203, 213, 225, 0.9)', 'rgba(226, 232, 240, 0.9)'], border: ['#1e293b', '#334155', '#475569', '#94a3b8', '#cbd5e1'] },
    };
    const colors = colorThemes[colorTheme] || colorThemes.corporate;

    const formatValue = (val) => {
        if (isNaN(val) || val === null) return val;
        const num = Number(val);
        if (valueFormat === 'comma') return num.toLocaleString();
        if (valueFormat === 'krw') return '₩' + num.toLocaleString();
        if (valueFormat === 'usd') return '$' + num.toLocaleString();
        if (valueFormat === 'percent') return num.toFixed(1) + '%';
        if (valueFormat === 'compact') return new Intl.NumberFormat('ko-KR', { notation: "compact" }).format(num); // 1.2만, 1.5억 형식
        return num;
    };

    // ================= 데이터 프로세싱 & 집계 & 기타 묶기 =================
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

        // 정렬
        if (sortData === 'asc') processed.sort((a, b) => a.v - b.v);
        else if (sortData === 'desc') processed.sort((a, b) => b.v - a.v);

        // 상위 N개 묶기 (기타 처리)
        if (groupOthers && processed.length > topNCount) {
            // 정렬 상관없이 무조건 값이 큰 순서대로 Top N을 잡기 위해 임시 내림차순 정렬
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
        
        // 성장률 계산 (첫 항목 대비 마지막 항목)
        let growthRate = 0;
        if (vals.length > 1 && vals[0] !== 0) {
            growthRate = ((vals[vals.length - 1] - vals[0]) / Math.abs(vals[0])) * 100;
        }

        return { labels, vals, vals2, average, growthRate };
    }, [data, xAxis, yAxis, yAxis2, sortData, chartType, aggregationType, groupOthers, topNCount]);

    // ================= 🪄 원클릭 실무 템플릿 적용 =================
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
            setBackgroundColor('transparent'); // PPT 배경에 스며들도록
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

    // ================= 🤖 획기적 AI 경영진 브리핑 생성 =================
    const generateSmartInsight = () => {
        const { labels, vals, average, growthRate } = chartDataObj;
        if (!vals.length) return;
        
        // 이미 인사이트가 있으면 추가하지 않음
        const existingInsight = textOverlays.find(t => t.type === 'ai-insight');
        if (existingInsight) {
            alert('이미 AI 인사이트가 추가되어 있습니다. 삭제 후 다시 시도해주세요.');
            return;
        }
        
        const sum = vals.reduce((a, b) => a + b, 0);
        const maxVal = Math.max(...vals);
        const minVal = Math.min(...vals);
        const maxLabel = labels[vals.indexOf(maxVal)];
        const minLabel = labels[vals.indexOf(minVal)];
        const maxPercent = ((maxVal / sum) * 100).toFixed(1);
        
        // 추가 통계 계산
        const sortedVals = [...vals].sort((a, b) => a - b);
        const median = sortedVals.length % 2 === 0 
            ? (sortedVals[sortedVals.length/2 - 1] + sortedVals[sortedVals.length/2]) / 2 
            : sortedVals[Math.floor(sortedVals.length/2)];
        const variance = vals.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / vals.length;
        const stdDev = Math.sqrt(variance);
        const cv = (stdDev / average * 100).toFixed(1);
        
        // 상위 3개 항목
        const top3 = [...vals].map((v, i) => ({ val: v, label: labels[i] }))
            .sort((a, b) => b.val - a.val).slice(0, 3);
        
        // 집중도 분석
        const concentration = vals.filter(v => v >= average).length;
        const concentrationPercent = ((concentration / vals.length) * 100).toFixed(0);

        // 배경색에 따른 텍스트 색상 결정
        const isLightBg = backgroundColor === '#ffffff' || backgroundColor === '#f8fafc' || backgroundColor === 'transparent';
        const textColor = isLightBg ? '#1e293b' : '#f8fafc';
        const accentColor = isLightBg ? '#0ea5e9' : '#38bdf8';
        const boxBg = isLightBg ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.92)';
        const borderColor = isLightBg ? '#e2e8f0' : '#334155';

        let lines = [];
        
        // 🎯 핵심 한줄 요약
        let summary = '';
        if (chartType === 'pie' || chartType === 'doughnut') {
            summary = maxPercent > 50 
                ? `⚠️ '${maxLabel}' 항목이 시장 점유율 ${maxPercent}%로 지배적 위치입니다.` 
                : `📊 '${maxLabel}'(${maxPercent}%) 외 ${labels.length - 1}개 항목이 균형 있게 분포`;
        } else if (growthRate !== 0 && sortData === 'none') {
            summary = growthRate > 0 
                ? `🚀 전 기간 대비 +${growthRate.toFixed(1)}% 성장세, '${maxLabel}' 핵심 성장 동력` 
                : `📉 전 기간 대비 ${growthRate.toFixed(1)}% 감소, '${minLabel}' 개선 필요`;
        } else {
            const deviation = ((maxVal - average) / average * 100).toFixed(0);
            summary = deviation > 50 
                ? `⭐ '${maxLabel}' 평균 대비 ${deviation}% 초과, '${minLabel}' 주의 필요` 
                : `📈 전체 ${labels.length}개 항목 총합 ${formatValue(sum)}, 평균 ${formatValue(average)}`;
        }
        lines.push(`💡 ${summary}`);
        
        // 📊 핵심 지표
        lines.push('');
        lines.push(`┌─ 📈 핵심 성과 지표 ─`);
        lines.push(`│ ★ 1위: ${maxLabel} (${formatValue(maxVal)}, ${maxPercent}%)`);
        if (chartType !== 'pie' && chartType !== 'doughnut') {
            lines.push(`│ • 평균: ${formatValue(average)} | 중앙값: ${formatValue(median)}`);
            lines.push(`│ • 표준편차: ${formatValue(stdDev)} (변동계수: ${cv}%)`);
            lines.push(`│ • 평균 이상: ${concentration}개 (${concentrationPercent}%)`);
        }
        lines.push(`│ • 합계: ${formatValue(sum)}`);
        lines.push(`└`);
        
        // 🏆 TOP 3
        if (top3.length >= 2) {
            lines.push('');
            lines.push(`🏆 TOP 3 ${chartType === 'pie' || chartType === 'doughnut' ? '시장 점유' : '성과'}`);
            top3.forEach((item, idx) => {
                const rank = idx + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                const percent = ((item.val / sum) * 100).toFixed(1);
                lines.push(`   ${medal} ${item.label}: ${formatValue(item.val)} (${percent}%)`);
            });
        }
        
        // ⚡ 권고안
        lines.push('');
        lines.push(`⚡ 【경영진 브리핑】`);
        
        if (chartType === 'pie' || chartType === 'doughnut') {
            if (Number(maxPercent) > 70) {
                lines.push(`   → '${maxLabel}' 의존도 높음, 다변화 전략 필요`);
                lines.push(`   → 시장 이탈 위험 대비 필요`);
            } else if (Number(maxPercent) < 30) {
                lines.push(`   → 항목별 고른 분포, 건강한 포트폴리오`);
                lines.push(`   → 기존 전략 유지 권고`);
            } else {
                lines.push(`   → 2-3개 항목이 핵심 수익원`);
                lines.push(`   → 이들 성장 전략 집중 필요`);
            }
        } else {
            if (Number(cv) > 50) {
                lines.push(`   → 항목 간 편차 큼, 표준화 필요`);
                lines.push(`   → '${minLabel}' 개선 시급`);
            } else {
                lines.push(`   → 전체 항목 균등 수준`);
                lines.push(`   → '${maxLabel}' 모델 케이스 분석 권고`);
            }
            
            if (growthRate !== 0 && sortData === 'none') {
                if (growthRate > 10) {
                    lines.push(`   → 성장 모멘텀 +${growthRate.toFixed(1)}% 지속`);
                    lines.push(`   → 추가 투자 가속화 권고`);
                } else if (growthRate < -10) {
                    lines.push(`   → 성장률 -${Math.abs(growthRate).toFixed(1)}% 감소`);
                    lines.push(`   → 원인 분석 및 대응 필요`);
                }
            }
        }
        
        const fullText = lines.join('\n');
        setTextOverlays(prev => [...prev, {
            id: Date.now(), text: fullText, x: 30, y: 30,
            color: textColor, size: 12, fontFamily: fontFamily, type: 'ai-insight',
            boxBg, borderColor, accentColor
        }]);
    };

    // 워터마크 캔버스에 그리기
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

    // ================= 내보내기 & 복사 (멀티라인 텍스트 지원) =================
    const generateCanvasImage = () => {
        if (!canvasRef.current || !chartAreaRef.current) return null;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const ctx = tempCanvas.getContext('2d');

        ctx.fillStyle = backgroundColor === 'transparent' ? '#ffffff' : backgroundColor;
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvasRef.current, 0, 0);

        // 워터마크 그리기
        if (watermarkEnabled) {
            drawWatermark(ctx, tempCanvas.width, tempCanvas.height, watermarkDesign, watermarkText, watermarkGridSize, watermarkColor, watermarkFontSize, watermarkOpacity, watermarkPosition, watermarkAngle);
        }

        textOverlays.forEach(textObj => {
            ctx.font = `${textObj.type === 'exec-summary' ? 'bold ' : ''}${textObj.size}px ${textObj.fontFamily || fontFamily}`;
            ctx.fillStyle = textObj.color;
            ctx.textBaseline = 'top'; 
            
            const lines = textObj.text.split('\n');
            let y = textObj.y;
            
            // 경영진 요약 박스 배경 그리기
            if (textObj.type === 'exec-summary') {
                ctx.save();
                ctx.fillStyle = backgroundColor === '#ffffff' ? 'rgba(241, 245, 249, 0.95)' : 'rgba(15, 23, 42, 0.85)';
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.shadowBlur = 10;
                let maxWidth = 0;
                lines.forEach(l => { maxWidth = Math.max(maxWidth, ctx.measureText(l).width); });
                
                // Draw rounded rect
                const boxX = textObj.x - 15;
                const boxY = textObj.y - 15;
                const boxW = maxWidth + 30;
                const boxH = (lines.length * (textObj.size * 1.5)) + 20;
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxW, boxH, 8);
                ctx.fill();
                
                // Left Accent Line
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, 6, boxH, {tl: 8, bl: 8, tr: 0, br: 0});
                ctx.fill();
                ctx.restore();
            }

            lines.forEach(line => {
                ctx.fillText(line, textObj.x, y);
                y += textObj.size * 1.5; // line height
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

    // ================= 텍스트 마우스 이벤트 =================
    const handleAddTextClick = (e) => {
        if (!isAddingText || !chartAreaRef.current) return;
        const rect = chartAreaRef.current.getBoundingClientRect();
        if (newTextValue.trim()) {
            setTextOverlays(prev => [...prev, {
                id: Date.now(), text: newTextValue.replace(/\\n/g, '\n'), // \n 입력시 줄바꿈 처리
                x: e.clientX - rect.left, y: e.clientY - rect.top,
                color: newTextColor, size: newTextSize, fontFamily: fontFamily, type: overlayType
            }]);
            setNewTextValue(''); setIsAddingText(false);
        }
    };
    const handleTextMouseDown = (e, textId) => {
        e.stopPropagation();
        const text = textOverlays.find(t => t.id === textId);
        if (text) setDraggingText({ id: textId, startX: e.clientX, startY: e.clientY, origX: text.x, origY: text.y });
    };
    const handleMouseMove = (e) => {
        if (!draggingText) return;
        const dx = e.clientX - draggingText.startX;
        const dy = e.clientY - draggingText.startY;
        setTextOverlays(prev => prev.map(t => t.id === draggingText.id ? { ...t, x: draggingText.origX + dx, y: draggingText.origY + dy } : t));
    };
    const handleMouseUp = () => setDraggingText(null);
    const removeText = (textId) => setTextOverlays(prev => prev.filter(t => t.id !== textId));

    // ================= 차트 렌더링 =================
    useEffect(() => {
        if (!canvasRef.current || !chartDataObj.labels.length) return;
        const ctx = canvasRef.current.getContext('2d');
        if (chartRef.current) chartRef.current.destroy();

        const { labels, vals, vals2, average } = chartDataObj;

        // 스마트 조건부 서식
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
        
        // 그라데이션 매직
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

        const datasets = [];

        datasets.push({
            type: chartType === 'combo' ? 'bar' : chartType === 'area' ? 'line' : chartType,
            label: yAxis,
            data: vals,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: (chartType === 'line' || chartType === 'area') ? lineWidth : 1,
            fill: chartType === 'area',
            tension: lineStyle === 'smooth' ? 0.4 : 0,
            stepped: lineStyle === 'step',
            pointRadius: (chartType === 'line' || chartType === 'area') ? 5 : 0,
            pointHoverRadius: 7,
            pointBackgroundColor: borderColors,
            pointBorderColor: backgroundColor === 'transparent' ? '#fff' : backgroundColor,
            borderRadius: (chartType === 'bar' || chartType === 'combo') ? borderRadius : 0,
            barThickness: (chartType === 'bar' || chartType === 'combo') ? barThickness : undefined,
            cutout: chartType === 'doughnut' ? cutoutPercent + '%' : undefined,
            yAxisID: chartType === 'combo' ? 'y' : undefined,
            datalabels: {
                display: showDataLabels,
                // 파이/도넛 차트일 때 흰색 텍스트 + 텍스트 테두리로 가독성 확보
                color: isPie ? '#ffffff' : (highlightNegative ? (context) => context.dataset.data[context.dataIndex] < 0 ? '#ef4444' : labelColor : labelColor),
                textStrokeColor: isPie ? 'rgba(0,0,0,0.5)' : 'transparent',
                textStrokeWidth: isPie ? 2 : 0,
                font: { size: fonts.dataLabel, family: fontFamily, weight: 'bold' },
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
                offset: isPie ? 0 : 6
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
                    display: showDataLabels,
                    color: colors.border[1 % colors.border.length],
                    font: { size: fonts.dataLabel, family: fontFamily, weight: 'bold' },
                    formatter: (value) => formatValue(value),
                    align: 'top', offset: 8
                }
            });
        }

        if (showAverageLine && !isPie) {
            datasets.push({
                type: 'line', label: `평균 (${formatValue(average)})`, data: labels.map(() => average),
                borderColor: '#f59e0b', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false, datalabels: { display: false }
            });
        }

        // 트렌드 라인 (선형 회귀)
        if (showTrendLine && !isPie && vals.length >= 2) {
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

        // 워터마크를 차트에 실시간으로 그리기 위한 플러그인
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

        const config = {
            type: chartType === 'combo' || chartType === 'area' ? 'bar' : chartType, 
            data: { labels, datasets },
            options: {
                responsive: true, 
                maintainAspectRatio: false, 
                animation: { duration: 800, easing: 'easeOutQuart' },
                layout: { padding: chartPadding },
                indexAxis: showHorizontal && (chartType === 'bar' || chartType === 'line') ? 'y' : 'x',
                plugins: {
                    watermarkPlugin, // 실시간 워터마크 플러그인
                    title: { display: !!title, text: title, color: titleColor, font: { size: fonts.title, weight: '900', family: fontFamily }, padding: { top: 10, bottom: 25 } },
                    legend: { display: showLegend, position: legendPosition, labels: { color: labelColor, font: { size: fonts.legend, family: fontFamily, weight: '500' }, usePointStyle: true, padding: 20 } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderColor: gridColor, borderWidth: 1, padding: 14, cornerRadius: 8,
                        titleFont: { size: fonts.axis + 2, family: fontFamily, weight: 'bold' }, bodyFont: { size: fonts.axis, family: fontFamily },
                        callbacks: { label: (context) => `${context.dataset.label}: ${formatValue(context.parsed.y ?? context.parsed.x ?? context.parsed)}` }
                    },
                    // 전역 datalabels 플러그인 설정 (파이/도넛 차트용)
                    datalabels: {
                        // 파이/도넛 차트에서 라벨이 잘 보이도록 강제 설정
                        color: isPie ? '#ffffff' : labelColor,
                        textStrokeColor: isPie ? 'rgba(0,0,0,0.5)' : 'transparent',
                        textStrokeWidth: isPie ? 2 : 0,
                        font: { size: fonts.dataLabel, family: fontFamily, weight: 'bold' },
                        formatter: (value, context) => {
                            if (showPiePercent && isPie && chartDataObj.vals.length > 0) {
                                const total = chartDataObj.vals.reduce((a, b) => a + b, 0);
                                const percent = ((value / total) * 100).toFixed(1);
                                return percent + '%';
                            }
                            return formatValue(value);
                        }
                    }
                },
                scales: isPie ? {} : {
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

        chartRef.current = new Chart(ctx, config);
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [chartDataObj, chartType, title, showLegend, legendPosition, colorTheme, backgroundColor, showGrid, barThickness, borderRadius, lineWidth, fontFamily, fonts, xAxisLabel, yAxisLabel, showHorizontal, showDataLabels, beginAtZero, gridColor, labelColor, titleColor, stacked, cutoutPercent, valueFormat, showAverageLine, customColors, autoHighlight, highlightNegative, enableGradient, dataLabelPosition, lineStyle, yMin, yMax, showPiePercent, chartPadding, watermarkEnabled, watermarkText, watermarkDesign, watermarkGridSize, watermarkFontSize, watermarkOpacity, watermarkPosition, watermarkAngle, showTrendLine]);

    const activeTabClass = "px-4 py-3 text-sm font-bold text-brand-400 border-b-2 border-brand-500 bg-slate-800/80 transition-colors";
    const inactiveTabClass = "px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors";

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden font-sans" ref={containerRef}>
            
            {/* ── 통합 툴바 ── */}
            {!hideToolbar && <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
                {/* 차트 타입 빠른 선택 (텍스트) */}
                <div className="flex items-center gap-0.5 bg-slate-800/40 p-1 rounded-lg border border-slate-700/50">
                    {[
                        { type: 'bar', label: '막대' }, { type: 'line', label: '꺾선' }, { type: 'area', label: '영역' },
                        { type: 'pie', label: '파이' }, { type: 'doughnut', label: '도넛' }, { type: 'radar', label: '레이더' },
                        { type: 'combo', label: '복합' }, { type: 'polarArea', label: '폴라' },
                    ].map(t => (
                        <button key={t.type} onClick={() => setChartType(t.type)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${chartType === t.type ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                    {/* ⚙️ 설정 버튼 */}
                    <button ref={chartSettingsBtnRef} onClick={() => openChartPanel(chartPanelTab)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all hover:scale-105"
                        style={{ background: showChartPanel ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showChartPanel ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`, color: showChartPanel ? '#a5b4fc' : '#94a3b8' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        디자인
                </button>
                    {/* 내보내기 버튼들 */}
                    <button onClick={copyToClipboard} disabled={!chartDataObj.labels.length} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-30" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', color: '#a78bfa' }}>복사</button>
                    <button onClick={exportAsPNG} disabled={!chartDataObj.labels.length} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-30" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)', color: '#c4b5fd' }}>PNG</button>
                    <button onClick={() => {
                        if (!chartDataObj.labels.length) return;
                        const total = chartDataObj.vals.reduce((a,b)=>a+b,0);
                        const rows = [['항목','값','비율(%)'], ...chartDataObj.labels.map((l,i)=>[l,chartDataObj.vals[i],((chartDataObj.vals[i]/total)*100).toFixed(2)+'%'])];
                        const blob = new Blob(['\uFEFF'+rows.map(r=>r.join(',')).join('\n')],{type:'text/csv;charset=utf-8;'});
                        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`chart_${Date.now()}.csv`; a.click();
                    }} disabled={!chartDataObj.labels.length} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-30" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}>CSV</button>
                    {/* 전체화면 */}
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
                    {/* 헤더 */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                        <span className="text-sm font-bold text-slate-200 flex-1">차트 설정</span>
                        <button onClick={() => setShowChartPanel(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                    </div>
                    {/* 탭 */}
                    <div className="flex border-b border-white/8 shrink-0">
                        {[['data','📊 데이터'],['feature','✨ 기능'],['style','🎨 스타일'],['advanced','🔒 고급']].map(([id,label]) => (
                            <button key={id} onClick={() => setChartPanelTab(id)}
                                className={`flex-1 py-2.5 text-[10px] font-bold transition-colors ${chartPanelTab === id ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>
                                {label}
                    </button>
                        ))}
                    </div>
                    {/* 콘텐츠 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chartPanelTab === 'data' && (<>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">차트 타입</label>
                                <select value={chartType} onChange={e => setChartType(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none">
                                    <option value="bar">막대 차트</option>
                                    <option value="line">꺾은선 차트</option>
                                    <option value="area">영역 차트</option>
                                    <option value="combo">복합 차트</option>
                                    <option value="pie">파이 차트</option>
                                    <option value="doughnut">도넛 차트</option>
                                    <option value="radar">레이더 차트</option>
                                    <option value="polarArea">폴라 차트</option>
                                </select>
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
                            <div className="space-y-2">
                                {[
                                    [showTrendLine, setShowTrendLine, '추세선 표시', ['pie','doughnut','radar','polarArea'].includes(chartType)],
                                    [showDataTable, setShowDataTable, '데이터표 표시', false],
                                    [isAddingText, (v) => { setIsAddingText(v); setOverlayType('text'); }, 'T 텍스트 오버레이', false],
                                    [showLegend ?? true, setShowLegend, '범례 표시', false],
                                    [showDataLabels, setShowDataLabels, '데이터 라벨 표시', false],
                                    [beginAtZero, setBeginAtZero, 'Y축 0부터 시작', false],
                                    [showGrid ?? true, setShowGrid, '그리드 표시', false],
                                    [enableGradient, setEnableGradient, '그라데이션 효과', ['pie','doughnut','radar','polarArea'].includes(chartType)],
                                    [stacked, setStacked, '누적 차트', !['bar','area','combo'].includes(chartType)],
                                    [showHorizontal, setShowHorizontal, '수평 차트', chartType !== 'bar'],
                                    [autoHighlight, (v) => { setAutoHighlight(v); if(v) { setHighlightNegative(false); setCustomColors({}); } }, '스마트 강조 (최대/최소)', false],
                                    [highlightNegative, (v) => { setHighlightNegative(v); if(v) { setAutoHighlight(false); setCustomColors({}); } }, '음수 강조', false],
                                    [showAverageLine, setShowAverageLine, '평균선 표시', ['pie','doughnut'].includes(chartType)],
                                ].map(([val, setter, label, disabled]) => (
                                    <label key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${val && !disabled ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}>
                                        <input type="checkbox" checked={!!val} onChange={e => !disabled && setter(e.target.checked)} disabled={disabled} className="accent-indigo-500" /> {label}
                                    </label>
                                ))}
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">데이터 라벨 위치</label>
                                <div className="flex gap-1">
                                    {[['top','위'],['center','중앙']].map(([v,l]) => (
                                        <button key={v} onClick={() => setDataLabelPosition(v)} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${dataLabelPosition === v ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${showTargetLine ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}>
                                    <input type="checkbox" checked={showTargetLine} onChange={e => setShowTargetLine(e.target.checked)} className="accent-emerald-500" /> 목표선 표시
                                </label>
                                {showTargetLine && <input type="number" placeholder="목표 수치" value={targetValue} onChange={e => setTargetValue(e.target.value)} className="mt-2 w-full bg-slate-900/80 text-emerald-300 px-3 py-2 text-xs rounded-lg border border-emerald-500/30 outline-none" />}
                            </div>
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
                        </>)}
                        {chartPanelTab === 'style' && (<>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">색상 테마</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {Object.keys(colorThemes).map(theme => (
                                        <button key={theme} onClick={() => { setColorTheme(theme); setAutoHighlight(false); setHighlightNegative(false); setCustomColors({}); }}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${colorTheme === theme && !autoHighlight && !highlightNegative ? 'bg-indigo-500/20 border border-indigo-500/50 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>
                                            <div className="flex gap-0.5">
                                                <div className="w-3 h-3 rounded-full" style={{background: colorThemes[theme].bg[0]}}></div>
                                                <div className="w-3 h-3 rounded-full" style={{background: colorThemes[theme].bg[1]}}></div>
                                            </div>
                                            {theme === 'corporate' ? '신뢰도' : theme === 'mckinsey' ? '컨설팅' : theme === 'pastel' ? '파스텔' : '무채색'}
                    </button>
                                    ))}
                </div>
            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">차트 배경</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {[['transparent','투명'],['#0f172a','다크'],['#1e293b','슬레이트'],['#000000','블랙'],['#ffffff','화이트'],['#f8fafc','라이트']].map(([color,label]) => (
                                        <button key={color} onClick={() => setBackgroundColor(color)}
                                            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${backgroundColor === color ? 'border-2 border-indigo-500 text-white' : 'border border-slate-700/50 text-slate-400 hover:text-white'}`}
                                            style={{ background: color === 'transparent' ? 'repeating-linear-gradient(45deg,#334155 0,#334155 2px,#1e293b 0,#1e293b 8px)' : color }}>
                                            <span style={{ color: ['#ffffff','#f8fafc'].includes(color) ? '#1e293b' : 'inherit' }}>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">글꼴</label>
                                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none">
                                    <option value="'Pretendard', sans-serif">Pretendard</option>
                                    <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
                                    <option value="'Malgun Gothic', sans-serif">맑은 고딕</option>
                                    <option value="Inter">Inter</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[['title','타이틀',12,40],['axis','축 라벨',8,24],['legend','범례',8,24],['dataLabel','데이터 수치',8,30]].map(([key,label,min,max]) => (
                                    <div key={key}>
                                        <div className="flex justify-between mb-1"><label className="text-[10px] text-slate-500 font-bold">{label}</label><span className="text-[10px] text-slate-400 font-mono">{fonts[key]}px</span></div>
                                        <input type="range" min={min} max={max} value={fonts[key]} onChange={e => updateFont(key, e.target.value)} className="w-full accent-indigo-500 h-1.5" />
                                    </div>
                                ))}
                            </div>
                            {(chartType === 'bar' || chartType === 'combo') && (
                                <div>
                                    <div className="flex justify-between mb-1"><label className="text-[10px] text-slate-500 font-bold">막대 두께</label><span className="text-[10px] text-slate-400 font-mono">{barThickness}px</span></div>
                                    <input type="range" min="5" max="80" value={barThickness} onChange={e => setBarThickness(Number(e.target.value))} className="w-full accent-indigo-500 h-1.5" />
                                </div>
                            )}
                            {chartDataObj.labels.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">항목별 색상</label>
                                        <button onClick={() => setCustomColors({})} className="text-[10px] text-slate-500 hover:text-red-400 px-2 py-0.5 rounded border border-slate-700 hover:border-red-500/30 transition-colors">초기화</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                                        {chartDataObj.labels.map((label, idx) => {
                                            const defaultCol = colors.bg[idx % colors.bg.length];
                                            const cv = customColors[label] || defaultCol;
                                            return (
                                                <div key={label} className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-700/50">
                                                    <input type="color" value={cv.startsWith('#') ? cv : '#475569'} onChange={e => { setCustomColors(prev => ({...prev, [label]: e.target.value})); setAutoHighlight(false); setHighlightNegative(false); }} className="w-5 h-5 border-0 bg-transparent p-0 cursor-pointer rounded" />
                                                    <span className="text-[10px] text-slate-400 truncate max-w-[60px]" title={label}>{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>)}
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

            {/* 데이터 설정 패널 - 별도 (레거시 숨김) */}
            <div id="data-settings-panel" className="hidden border-b border-slate-700 p-4 bg-slate-900 shrink-0">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* X/Y축 선택 */}
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                        <label className="text-sm text-blue-400 font-bold flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            데이터 선택 (X/Y축)
                        </label>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1">
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1">X축 (그룹)</span>
                                <select className="w-full bg-slate-900 text-slate-200 px-2 py-2 text-xs rounded-lg border border-blue-500/30 outline-none focus:border-blue-500" value={xAxis} onChange={e => setXAxis(e.target.value)}>
                                    {columns.map(c => <option className="bg-slate-900" key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <button onClick={swapAxes} className="mt-4 p-1.5 bg-blue-600/20 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-all" title="X/Y축 스왑">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </button>
                            <div className="flex-1">
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">Y축 (수치)</span>
                                <select className="w-full bg-slate-900 text-slate-200 px-2 py-2 text-xs rounded-lg border border-emerald-500/30 outline-none focus:border-emerald-500" value={yAxis} onChange={e => setYAxis(e.target.value)}>
                                    {numericColumns.map(c => <option className="bg-slate-900" key={c} value={c}>{c}</option>)}
                                    {!numericColumns.length && columns.map(c => <option className="bg-slate-900" key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 차트 유형 및 제목 */}
                    <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
                        <label className="text-sm text-purple-400 font-bold flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            </svg>
                            차트 유형
                        </label>
                        <select className="w-full bg-slate-900 text-slate-200 px-3 py-2 text-sm font-bold rounded-lg border border-purple-500/30 outline-none focus:border-purple-500 mb-2" value={chartType} onChange={e => setChartType(e.target.value)}>
                            <option value="bar">📊 막대 차트</option>
                            <option value="line">📈 꺾은선</option>
                            <option value="area">📉 영역 차트</option>
                            <option value="combo">🔀 복합 차트</option>
                            <option value="pie">🥧 파이 차트</option>
                            <option value="doughnut">🍩 도넛 차트</option>
                            <option value="radar">🕸️ 레이더 차트</option>
                            <option value="polarArea">🎯 폴라 차트</option>
                        </select>
                        <input type="text" placeholder="차트 제목..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none focus:border-purple-500" />
                    </div>

                    {/* 집계 방식 */}
                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
                        <label className="text-sm text-emerald-400 font-bold flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            집계 방식
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { value: 'sum', label: '∑ 합계' },
                                { value: 'avg', label: 'ø 평균' },
                                { value: 'count', label: '# 개수' },
                                { value: 'max', label: '↑ 최대' },
                                { value: 'min', label: '↓ 최소' }
                            ].map(opt => (
                                <button 
                                    key={opt.value}
                                    onClick={() => setAggregationType(opt.value)}
                                    className={`px-2 py-1.5 text-xs font-bold rounded transition-all ${aggregationType === opt.value ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-700'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 보조 Y축 (Combo일 때만) */}
                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30">
                        {chartType === 'combo' ? (
                            <>
                                <label className="text-sm text-indigo-400 font-bold flex items-center gap-2 mb-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    보조 Y축 (라인)
                                </label>
                                <select className="w-full bg-slate-900 text-indigo-300 px-3 py-2 text-sm rounded-lg border border-indigo-500/30 outline-none focus:border-indigo-500" value={yAxis2} onChange={e => setYAxis2(e.target.value)}>
                                    {numericColumns.map(c => <option className="bg-slate-900" key={c} value={c}>{c}</option>)}
                                </select>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-xs">복합 차트 선택 시<br/>보조 Y축 표시</div>
                        )}
                    </div>
                </div>
            </div>

            {/* 텍스트/요약 추가 패널 */}
            {isAddingText && (
                <div className="bg-slate-900 border-b border-slate-700 p-3 shrink-0 flex items-center gap-4 flex-wrap shadow-inner animate-in fade-in slide-in-from-top-2">
                    <select className="bg-slate-950 text-amber-400 font-bold px-2 py-2 text-sm rounded border border-slate-700 outline-none" value={overlayType} onChange={e => setOverlayType(e.target.value)}>
                        <option value="text">일반 글자 투명</option>
                        <option value="exec-summary">배경 있는 박스형 (가독성↑)</option>
                    </select>
                    <input type="text" placeholder="문구를 입력하세요 (\n 입력 시 줄바꿈)" value={newTextValue} onChange={e => setNewTextValue(e.target.value)} className="bg-slate-950 text-slate-200 px-4 py-2 text-sm rounded border border-slate-700 min-w-[300px] outline-none focus:border-amber-500" />
                    <div className="flex gap-1.5 border-r border-slate-700 pr-4">
                        {['#ffffff', '#cbd5e1', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#000000'].map(color => (
                            <button key={color} onClick={() => setNewTextColor(color)} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${newTextColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300">크기:</span>
                        <input type="range" min="12" max="60" value={newTextSize} onChange={e => setNewTextSize(Number(e.target.value))} className="w-24 accent-amber-500" />
                        <span className="text-sm text-amber-400 font-bold w-6">{newTextSize}</span>
                    </div>
                    <span className="text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg ml-auto border border-amber-400/20">☝️ 차트 안을 클릭하면 생성됩니다.</span>
                </div>
            )}

            {/* Design Panel (Tabbed UI) */}
            <div id="chart-design-panel" className="hidden flex-col border-b border-slate-700 shrink-0 shadow-2xl z-10">
                <div className="flex bg-slate-900 border-b border-slate-700">
                    <button onClick={() => {setActiveDesignTab('theme'); document.getElementById('chart-design-panel').classList.remove('hidden');}} className={activeDesignTab === 'theme' ? activeTabClass : inactiveTabClass}>🎨 색상/조건부서식</button>
                    <button onClick={() => {setActiveDesignTab('axis'); document.getElementById('chart-design-panel').classList.remove('hidden');}} className={activeDesignTab === 'axis' ? activeTabClass : inactiveTabClass}>📏 데이터포맷/축/기타묶기</button>
                    <button onClick={() => {setActiveDesignTab('text'); document.getElementById('chart-design-panel').classList.remove('hidden');}} className={activeDesignTab === 'text' ? activeTabClass : inactiveTabClass}>🔤 라벨/폰트크기</button>
                    <button onClick={() => {setActiveDesignTab('options'); document.getElementById('chart-design-panel').classList.remove('hidden');}} className={activeDesignTab === 'options' ? activeTabClass : inactiveTabClass}>⚙️ 차트 형태/옵션</button>
                    <button onClick={() => {setActiveDesignTab('watermark'); document.getElementById('chart-design-panel').classList.remove('hidden');}} className={activeDesignTab === 'watermark' ? activeTabClass : inactiveTabClass}>🔒 대외비</button>
                </div>
                
                <div className="bg-slate-900 p-6 max-h-[380px] overflow-y-auto custom-scrollbar">

                    {/* 탭 1: 테마 및 서식 */}
                    {activeDesignTab === 'theme' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 좌측: 색상 팔레트 + 조건부 */}
                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                    <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
                                        색상 테마
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.keys(colorThemes).map(theme => (
                                            <button 
                                                key={theme} 
                                                onClick={() => {setColorTheme(theme); setAutoHighlight(false); setHighlightNegative(false); setCustomColors({});}} 
                                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${colorTheme === theme && !autoHighlight && !highlightNegative ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 text-white' : 'bg-slate-950/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'}`}
                                            >
                                                <div className="flex gap-0.5">
                                                    <div className="w-3 h-3 rounded-full ring-1 ring-white/20" style={{backgroundColor: colorThemes[theme].bg[0]}}></div>
                                                    <div className="w-3 h-3 rounded-full ring-1 ring-white/20" style={{backgroundColor: colorThemes[theme].bg[1]}}></div>
                                                </div>
                                                <span>{theme === 'corporate' ? '신뢰도' : theme === 'mckinsey' ? '컨설팅' : theme === 'pastel' ? '파스텔' : '무채색'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button 
                                        onClick={() => {setAutoHighlight(!autoHighlight); if(!autoHighlight) {setHighlightNegative(false); setCustomColors({});}}}
                                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${autoHighlight ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50' : 'bg-slate-800/50 border border-slate-700/30 hover:border-slate-600'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${autoHighlight ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
                                            <svg className={`w-5 h-5 ${autoHighlight ? 'text-blue-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-200">스마트 강조</div>
                                            <div className="text-[10px] text-slate-500">최대/최소값 자동 진開</div>
                                        </div>
                                        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${autoHighlight ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                                            {autoHighlight && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => {setHighlightNegative(!highlightNegative); if(!highlightNegative) {setAutoHighlight(false); setCustomColors({});}}}
                                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${highlightNegative ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50' : 'bg-slate-800/50 border border-slate-700/30 hover:border-slate-600'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highlightNegative ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
                                            <svg className={`w-5 h-5 ${highlightNegative ? 'text-red-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-200">음수 강조</div>
                                            <div className="text-[10px] text-slate-500">적자 데이터 강조</div>
                                        </div>
                                        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${highlightNegative ? 'border-red-500 bg-red-500' : 'border-slate-600'}`}>
                                            {highlightNegative && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* 우측: 배경색 + 항목별 */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                    <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                        차트 배경
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { color: 'transparent', label: '투명' },
                                            { color: '#0f172a', label: '다크' },
                                            { color: '#1e293b', label: '슬레이트' },
                                            { color: '#000000', label: '블랙' },
                                            { color: '#ffffff', label: '화이트' },
                                            { color: '#f8fafc', label: '라이트' }
                                        ].map(({ color, label }) => (
                                            <button 
                                                key={color} 
                                                onClick={() => setBackgroundColor(color)}
                                                className={`group relative px-3 py-2 rounded-lg text-xs font-medium transition-all ${backgroundColor === color ? 'bg-brand-500/20 border border-brand-500 text-brand-400' : 'bg-slate-950/50 border border-slate-700/50 text-slate-400 hover:border-slate-600'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded border ${color === 'transparent' ? 'border-slate-600 bg-[url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928GIEAEEAAEGADmIwQgf+mXpAAAAABJRU5ErkJggg==")]' : 'border-slate-500'}`} style={{ backgroundColor: color !== 'transparent' ? color : undefined }}></div>
                                                    {label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></span>
                                            항목별 색상 지정
                                        </h3>
                                        <button 
                                            onClick={() => setCustomColors({})} 
                                            className="text-xs text-slate-500 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                                        >
                                            초기화
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                        {chartDataObj.labels.map((label, idx) => {
                                            const defaultCol = colors.bg[idx % colors.bg.length];
                                            const currentVal = customColors[label] || (autoHighlight || highlightNegative ? undefined : defaultCol);
                                            return (
                                                <div 
                                                    key={label} 
                                                    className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1.5 rounded-lg border border-slate-700/50 hover:border-slate-500 transition-colors group"
                                                >
                                                    <input 
                                                        type="color" 
                                                        className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0 rounded ring-1 ring-slate-600 group-hover:ring-slate-500" 
                                                        value={currentVal && currentVal.startsWith('#') ? currentVal : '#475569'} 
                                                        onChange={(e) => {setCustomColors(prev => ({...prev, [label]: e.target.value})); setAutoHighlight(false); setHighlightNegative(false);}} 
                                                    />
                                                    <span className="text-[10px] text-slate-400 truncate max-w-[70px]" title={label}>{label}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 탭 2: 축, 데이터 포맷 및 기타 묶기 */}
                    {activeDesignTab === 'axis' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 카드 1: 숫자 포맷 */}
                            <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 p-4 rounded-xl border border-emerald-500/30">
                                <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    💰 숫자 단위 포맷팅
                                </h3>
                                <select className="w-full bg-slate-950/80 text-slate-200 px-3 py-2.5 text-sm font-medium rounded-lg border border-slate-700/50 focus:border-emerald-500 outline-none mb-3" value={valueFormat} onChange={e => setValueFormat(e.target.value)}>
                                    <option value="none">원본 수치 (예: 12000)</option>
                                    <option value="comma">천단위 콤마 (예: 12,000)</option>
                                    <option value="krw">원화 ₩ (예: ₩12,000)</option>
                                    <option value="usd">달러 $ (예: $12,000)</option>
                                    <option value="percent">퍼센트 % (예: 12.0%)</option>
                                    <option value="compact">요약 (예: 1.2만)</option>
                                </select>
                                <label className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 px-3 py-2.5 rounded-lg border border-slate-700/30 cursor-pointer hover:border-emerald-500/50 transition-colors">
                                    <input type="checkbox" className="w-4 h-4 accent-emerald-500" checked={showDataLabels} onChange={e => setShowDataLabels(e.target.checked)} /> 
                                    <span className="font-medium">데이터 라벨 표시</span>
                                </label>
                            </div>

                            {/* 카드 2: 정렬 및 묶기 */}
                            <div className="bg-gradient-to-br from-purple-900/30 to-slate-900 p-4 rounded-xl border border-purple-500/30">
                                <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    📊 정렬 및 상위 묶기
                                </h3>
                                <select className="w-full bg-slate-950/80 text-slate-200 px-3 py-2 text-sm rounded-lg border border-slate-700/50 focus:border-purple-500 outline-none mb-3" value={sortData} onChange={e => setSortData(e.target.value)}>
                                    <option value="desc">큰 값부터 (내림차순)</option>
                                    <option value="asc">작은 값부터 (오름차순)</option>
                                    <option value="none">원본 순서 유지</option>
                                </select>
                                <label className="flex items-center gap-3 text-sm text-purple-300 bg-slate-950/50 px-3 py-2.5 rounded-lg border border-slate-700/30 cursor-pointer hover:border-purple-500/50 transition-colors">
                                    <input type="checkbox" className="w-4 h-4 accent-purple-500" checked={groupOthers} onChange={e => setGroupOthers(e.target.checked)} />
                                    <span className="font-medium">상위 N개 → '기타'</span>
                                </label>
                                {groupOthers && (
                                    <div className="mt-3 flex items-center gap-2 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20">
                                        <span className="text-xs text-purple-300">상위:</span>
                                        <input type="number" value={topNCount} onChange={e => setTopNCount(Number(e.target.value))} className="bg-slate-950 text-purple-200 px-2 py-1 text-sm rounded border border-purple-500/30 w-16 text-center" min="1" />
                                        <span className="text-xs text-purple-300">개</span>
                                    </div>
                                )}
                            </div>

                            {/* 카드 3: Y축 범위 */}
                            <div className="bg-gradient-to-br from-orange-900/30 to-slate-900 p-4 rounded-xl border border-orange-500/30">
                                <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                    📏 Y축 범위 설정
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <span className="text-[10px] text-orange-400 font-bold uppercase block mb-1">최소값</span>
                                        <input type="number" placeholder="Min" value={yMin} onChange={e => setYMin(e.target.value)} className="w-full bg-slate-950/80 text-slate-200 px-3 py-2 text-sm font-bold rounded-lg border border-slate-700/50 focus:border-orange-500 outline-none" />
                                    </div>
                                    <span className="text-orange-400 font-bold mt-4">~</span>
                                    <div className="flex-1">
                                        <span className="text-[10px] text-orange-400 font-bold uppercase block mb-1">최대값</span>
                                        <input type="number" placeholder="Max" value={yMax} onChange={e => setYMax(e.target.value)} className="w-full bg-slate-950/80 text-slate-200 px-3 py-2 text-sm font-bold rounded-lg border border-slate-700/50 focus:border-orange-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 탭 3: 폰트 및 라벨 */}
                    {activeDesignTab === 'text' && (
                        <div className="space-y-4">
                            {/* 상단: 글꼴 선택 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></span>
                                    🔤 차트 기본 글꼴
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select className="bg-slate-950/80 text-slate-200 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-700/50 focus:border-brand-500 outline-none" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                                        <option value="'Pretendard', sans-serif">Pretendard (가독성 최상)</option>
                                        <option value="'Noto Sans KR', sans-serif">Noto Sans KR (본고딕)</option>
                                        <option value="'Malgun Gothic', sans-serif">맑은 고딕 (무난함)</option>
                                        <option value="Inter">Inter (영문 전용)</option>
                                    </select>
                                    <div className="flex items-center gap-3 bg-slate-950/50 px-4 py-2 rounded-lg border border-slate-700/30">
                                        <span className="text-sm text-slate-300 font-medium">데이터 라벨 위치:</span>
                                        <button onClick={() => setDataLabelPosition('top')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${dataLabelPosition === 'top' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>위쪽</button>
                                        <button onClick={() => setDataLabelPosition('center')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${dataLabelPosition === 'center' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>중앙</button>
                                    </div>
                                </div>
                            </div>

                            {/* 하단: 폰트 크기 슬라이더 4개 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-900/30 to-slate-900 p-4 rounded-xl border border-blue-500/30">
                                    <label className="text-xs text-blue-400 font-bold flex justify-between mb-2">타이틀 <span className="bg-blue-500/20 px-2 py-0.5 rounded text-[10px]">{fonts.title}px</span></label>
                                    <input type="range" min="12" max="40" value={fonts.title} onChange={e => updateFont('title', e.target.value)} className="w-full accent-blue-500" />
                                </div>
                                <div className="bg-gradient-to-br from-green-900/30 to-slate-900 p-4 rounded-xl border border-green-500/30">
                                    <label className="text-xs text-green-400 font-bold flex justify-between mb-2">축 라벨 <span className="bg-green-500/20 px-2 py-0.5 rounded text-[10px]">{fonts.axis}px</span></label>
                                    <input type="range" min="8" max="24" value={fonts.axis} onChange={e => updateFont('axis', e.target.value)} className="w-full accent-green-500" />
                                </div>
                                <div className="bg-gradient-to-br from-purple-900/30 to-slate-900 p-4 rounded-xl border border-purple-500/30">
                                    <label className="text-xs text-purple-400 font-bold flex justify-between mb-2">범례 <span className="bg-purple-500/20 px-2 py-0.5 rounded text-[10px]">{fonts.legend}px</span></label>
                                    <input type="range" min="8" max="24" value={fonts.legend} onChange={e => updateFont('legend', e.target.value)} className="w-full accent-purple-500" />
                                </div>
                                <div className="bg-gradient-to-br from-orange-900/30 to-slate-900 p-4 rounded-xl border border-orange-500/30">
                                    <label className="text-xs text-orange-400 font-bold flex justify-between mb-2">데이터 수치 <span className="bg-orange-500/20 px-2 py-0.5 rounded text-[10px]">{fonts.dataLabel}px</span></label>
                                    <input type="range" min="8" max="30" value={fonts.dataLabel} onChange={e => updateFont('dataLabel', e.target.value)} className="w-full accent-orange-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 탭 4: 고급 옵션 */}
                    {activeDesignTab === 'options' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* 카드 1: 가이드라인 */}
                            <div className="bg-gradient-to-br from-amber-900/30 to-slate-900 p-4 rounded-xl border border-amber-500/30">
                                <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    📈 가이드라인
                                </h3>
                                <label className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-700/30 cursor-pointer hover:border-amber-500/50 mb-2">
                                    <input type="checkbox" checked={showAverageLine} onChange={e => setShowAverageLine(e.target.checked)} className="w-4 h-4 accent-amber-500" disabled={chartType === 'pie' || chartType === 'doughnut'} /> 
                                    평균선 (점선)
                                </label>
                                <div className={`bg-slate-950/50 p-3 rounded-lg border border-slate-700/30 ${showTargetLine ? 'border-emerald-500/50' : ''}`}>
                                    <label className="flex items-center gap-2 text-sm text-emerald-300 cursor-pointer font-bold mb-2">
                                        <input type="checkbox" checked={showTargetLine} onChange={e => setShowTargetLine(e.target.checked)} className="w-4 h-4 accent-emerald-500" disabled={chartType === 'pie' || chartType === 'doughnut'} /> 
                                        목표선
                                    </label>
                                    <input type="number" placeholder="목표 수치" value={targetValue} onChange={e => setTargetValue(e.target.value)} disabled={!showTargetLine} className="w-full bg-slate-900 text-emerald-400 font-bold px-3 py-2 text-sm rounded border border-emerald-500/30 outline-none disabled:opacity-50" />
                                </div>
                            </div>

                            {/* 카드 2: 시각효과 */}
                            <div className="bg-gradient-to-br from-purple-900/30 to-slate-900 p-4 rounded-xl border border-purple-500/30">
                                <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    ✨ 시각효과
                                </h3>
                                <label className="flex items-center gap-3 text-sm text-purple-300 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-700/30 cursor-pointer hover:border-purple-500/50 mb-3">
                                    <input type="checkbox" checked={enableGradient} onChange={e => setEnableGradient(e.target.checked)} className="w-4 h-4 accent-purple-500" disabled={chartType === 'pie' || chartType === 'doughnut'} /> 
                                    세로 그라데이션
                                </label>
                                {(chartType === 'bar' || chartType === 'combo') && (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[10px] text-purple-300 mb-1">
                                                <span>막대 두께</span>
                                                <span className="font-bold">{barThickness}px</span>
                                            </div>
                                            <input type="range" min="5" max="80" value={barThickness} onChange={e => setBarThickness(Number(e.target.value))} className="w-full accent-purple-500" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] text-purple-300 mb-1">
                                                <span>모서리 둥글기</span>
                                                <span className="font-bold">{borderRadius}px</span>
                                            </div>
                                            <input type="range" min="0" max="30" value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} className="w-full accent-purple-500" />
                                        </div>
                                    </div>
                                )}
                                {(chartType === 'line' || chartType === 'area' || chartType === 'combo') && (
                                    <select className="w-full bg-slate-950/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700/50 outline-none" value={lineStyle} onChange={e => setLineStyle(e.target.value)}>
                                        <option value="smooth">🎢 곡선형</option>
                                        <option value="straight">📐 직선형</option>
                                    </select>
                                )}
                            </div>

                            {/* 카드 3: 레이아웃 */}
                            <div className="bg-gradient-to-br from-cyan-900/30 to-slate-900 p-4 rounded-xl border border-cyan-500/30">
                                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                    📐 레이아웃
                                </h3>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-700/30 cursor-pointer hover:border-cyan-500/50">
                                        <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="w-4 h-4 accent-cyan-500" /> 격자선
                                    </label>
                                    <label className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-700/30 cursor-pointer hover:border-cyan-500/50">
                                        <input type="checkbox" checked={beginAtZero} onChange={e => setBeginAtZero(e.target.checked)} className="w-4 h-4 accent-cyan-500" /> 0부터 시작
                                    </label>
                                    <label className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-700/30 cursor-pointer hover:border-cyan-500/50">
                                        <input type="checkbox" checked={showHorizontal} onChange={e => setShowHorizontal(e.target.checked)} disabled={chartType === 'pie' || chartType === 'doughnut'} className="w-4 h-4 accent-cyan-500" /> 가로막대
                                    </label>
                                    <label className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-700/30 cursor-pointer hover:border-cyan-500/50">
                                        <input type="checkbox" checked={stacked} onChange={e => setStacked(e.target.checked)} disabled={chartType !== 'bar' && chartType !== 'area'} className="w-4 h-4 accent-cyan-500" /> 누적 막대
                                    </label>
                                </div>
                                {/* 여백 */}
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                    <div className="flex justify-between text-[10px] text-orange-300 mb-1">
                                        <span>차트 여백</span>
                                        <span className="font-bold">{chartPadding}px</span>
                                    </div>
                                    <input type="range" min="0" max="80" value={chartPadding} onChange={e => setChartPadding(Number(e.target.value))} className="w-full accent-orange-500" />
                                </div>
                                {(chartType === 'pie' || chartType === 'doughnut') && (
                                    <label className="flex items-center gap-2 text-sm text-cyan-300 mt-3 pt-3 border-t border-slate-700/50">
                                        <input type="checkbox" checked={showPiePercent} onChange={e => setShowPiePercent(e.target.checked)} className="w-4 h-4 accent-cyan-500" /> 퍼센트 표시
                                    </label>
                                )}
                            </div>

                            {/* 카드 4: 범례 */}
                            <div className="bg-gradient-to-br from-pink-900/30 to-slate-900 p-4 rounded-xl border border-pink-500/30">
                                <h3 className="text-sm font-bold text-pink-400 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                    🏷️ 범례
                                </h3>
                                <label className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-700/30 cursor-pointer hover:border-pink-500/50 mb-3">
                                    <input type="checkbox" checked={showLegend} onChange={e => setShowLegend(e.target.checked)} className="w-4 h-4 accent-pink-500" /> 범례 표시
                                </label>
                                <select className="w-full bg-slate-950/80 text-slate-200 px-3 py-2 text-sm rounded-lg border border-slate-700/50 outline-none disabled:opacity-50" value={legendPosition} onChange={e => setLegendPosition(e.target.value)} disabled={!showLegend}>
                                    <option value="bottom">⬇️ 아래쪽</option>
                                    <option value="top">⬆️ 위쪽</option>
                                    <option value="right">➡️ 오른쪽</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* 탭 5: 대외비 (워터마크) */}
                    {activeDesignTab === 'watermark' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 왼쪽: 워터마크 설정 */}
                            <div className="bg-gradient-to-br from-red-900/40 to-slate-900 p-4 rounded-xl border border-red-500/30 shadow-lg shadow-red-500/5">
                                <h3 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span>
                                    🔒 워터마크 설정
                                </h3>
                                
                                <label className={`flex items-center gap-3 text-sm font-bold mb-4 bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-700/50 cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all ${!watermarkEnabled ? 'opacity-50' : ''}`}>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${watermarkEnabled ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-slate-700'}`}>
                                        {watermarkEnabled ? (
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                        )}
                                    </div>
                                    <span className="text-slate-200">워터마크 활성화</span>
                                </label>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">워터마크 텍스트</label>
                                        <input 
                                            type="text" 
                                            value={watermarkText}
                                            onChange={(e) => {
                                                setLocalWatermarkText(e.target.value);
                                            }}
                                            placeholder="예: CONFIDENTIAL"
                                            className="w-full bg-slate-950/80 text-slate-200 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-700/50 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                            disabled={!watermarkEnabled}
                                        />
                                    </div>
                                    
                                    {/* 자주 쓰이는 워터마크 색상 */}
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">워터마크 색상</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                { color: '#dc2626', name: '빨강' },
                                                { color: '#ea580c', name: '주황' },
                                                { color: '#ca8a04', name: '노랑' },
                                                { color: '#16a34a', name: '초록' },
                                                { color: '#0891b2', name: '청록' },
                                                { color: '#2563eb', name: '파랑' },
                                                { color: '#7c3aed', name: '보라' },
                                                { color: '#4b5563', name: '회색' }
                                            ].map(({ color, name }) => (
                                                <button 
                                                    key={color}
                                                    onClick={() => {
                                                        setLocalWatermarkColor(color);
                                                    }}
                                                    disabled={!watermarkEnabled}
                                                    className={`w-6 h-6 rounded-full border-2 hover:border-white transition-all disabled:opacity-50 ${localWatermarkColor === color ? 'border-white scale-110 shadow-lg' : 'border-slate-600'}`}
                                                    style={{ backgroundColor: color }}
                                                    title={name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* 도움말 */}
                                    <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/10">
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            • "문서/보고서용" 템플릿 선택 시 워터마크 자동 적용<br/>
                                            • PNG 저장 시 워터마크가 이미지에 포함
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 오른쪽: 디자인 선택 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl"></div>
                                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 relative z-10">
                                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"></span>
                                    🎨 디자인 선택
                                </h3>
                                <div className="grid grid-cols-3 gap-3 relative z-10">
                                    <button 
                                        onClick={() => setLocalWatermarkDesign('single')}
                                        disabled={!watermarkEnabled}
                                        className={`group p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${watermarkDesign === 'single' ? 'border-red-500 bg-gradient-to-br from-red-500/20 to-red-500/5 shadow-lg shadow-red-500/20' : 'border-slate-600/50 hover:border-slate-400 hover:bg-slate-700/30 disabled:opacity-40'}`}
                                    >
                                        <div className="w-14 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center shadow-inner border border-slate-600/30 group-hover:border-slate-500/50 transition-colors">
                                            <span className="text-[9px] text-red-500 -rotate-45 font-black tracking-wider">CONFIDENTIAL</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-bold text-slate-200 block">크게 하나</span>
                                            <span className="text-[10px] text-slate-500">중앙 배치</span>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => setLocalWatermarkDesign('multiple')}
                                        disabled={!watermarkEnabled}
                                        className={`group p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${watermarkDesign === 'multiple' ? 'border-red-500 bg-gradient-to-br from-red-500/20 to-red-500/5 shadow-lg shadow-red-500/20' : 'border-slate-600/50 hover:border-slate-400 hover:bg-slate-700/30 disabled:opacity-40'}`}
                                    >
                                        <div className="w-14 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg grid grid-cols-3 gap-0.5 p-1.5 shadow-inner border border-slate-600/30 group-hover:border-slate-500/50 transition-colors">
                                            {[...Array(9)].map((_, i) => (
                                                <span key={i} className="text-[4px] text-red-500 -rotate-45 font-bold flex items-center justify-center">C</span>
                                            ))}
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-bold text-slate-200 block">다수 배치</span>
                                            <span className="text-[10px] text-slate-500">그리드 반복</span>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => setLocalWatermarkDesign('corner')}
                                        disabled={!watermarkEnabled}
                                        className={`group p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${watermarkDesign === 'corner' ? 'border-red-500 bg-gradient-to-br from-red-500/20 to-red-500/5 shadow-lg shadow-red-500/20' : 'border-slate-600/50 hover:border-slate-400 hover:bg-slate-700/30 disabled:opacity-40'}`}
                                    >
                                        <div className="w-14 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg relative shadow-inner border border-slate-600/30 group-hover:border-slate-500/50 transition-colors">
                                            <span className="text-[5px] text-red-500 absolute top-1 right-1 font-bold">C</span>
                                            <span className="text-[5px] text-red-500 absolute bottom-1 left-1 font-bold">C</span>
                                            <span className="text-[5px] text-red-500 absolute top-1 left-1 font-bold">C</span>
                                            <span className="text-[5px] text-red-500 absolute bottom-1 right-1 font-bold">C</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-bold text-slate-200 block">코너 배치</span>
                                            <span className="text-[10px] text-slate-500">4방향</span>
                                        </div>
                                    </button>
                                </div>
                                
                                {/* 그리드 크기 조절 - 다수 배치 선택 시에만 표시 */}
                                {watermarkDesign === 'multiple' && (
                                    <div className="mt-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-red-300 font-bold">그리드 크기</span>
                                            <span className="text-sm font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-lg">{watermarkGridSize}×{watermarkGridSize}</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="2" 
                                            max="16" 
                                            value={watermarkGridSize}
                                            onChange={(e) => setWatermarkGridSize(Number(e.target.value))}
                                            className="w-full accent-red-500 h-2 cursor-pointer"
                                            disabled={!watermarkEnabled}
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                            <span>2×2</span>
                                            <span>16×16</span>
                                        </div>
                                    </div>
                                )}

                                {/* 워터마크 글자 크기 조절 */}
                                <div className="mt-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-red-300 font-bold">글자 크기</span>
                                        <span className="text-sm font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-lg">{watermarkFontSize}px</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="12" 
                                        max="120" 
                                        value={watermarkFontSize}
                                        onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                                        className="w-full accent-red-500 h-2 cursor-pointer"
                                        disabled={!watermarkEnabled}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                        <span>12px</span>
                                        <span>120px</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
                                            // 그리드 크기에 따라 글자 크기 자동 조절 (최대 watermarkFontSize, 최소 12px)
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
                            // AI 인사이트 타입인 경우 배경색에 따른 스타일 적용
                            const isAIInsight = text.type === 'ai-insight';
                            const isLight = !text.color || text.color === '#1e293b';
                            
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