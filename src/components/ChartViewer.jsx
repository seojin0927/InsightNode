import React, { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-plugin-datalabels';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Chart.js v3+에서 datalabels 플러그인 등록
Chart.register(ChartDataLabels);

const ChartViewer = ({ data, columns, watermarkEnabled: propWatermarkEnabled = false, watermarkText: propWatermarkText = 'CONFIDENTIAL', watermarkDesign: propWatermarkDesign = 'single' }) => {
    
    // 로컬 상태 (App에서 전달된 props가 없거나 활성화된 경우 사용)
    const [localWatermarkEnabled, setLocalWatermarkEnabled] = useState(false);
    const [localWatermarkText, setLocalWatermarkText] = useState('CONFIDENTIAL');
    const [localWatermarkDesign, setLocalWatermarkDesign] = useState('single');
    const [watermarkGridSize, setWatermarkGridSize] = useState(2); // 2x2, 3x3, 4x4... 최대 16x16
    
    // props가 제공되면 이를 사용, 그렇지 않으면 로컬 상태 사용
    // 디자인 선택은 local 상태를 우선 사용 (사용자 선택 적용)
    const watermarkEnabled = propWatermarkEnabled || localWatermarkEnabled;
    const watermarkText = propWatermarkEnabled ? propWatermarkText : localWatermarkText;
    const watermarkDesign = localWatermarkDesign; // 로컬 상태를 우선 사용
    
    // 로컬 상태를 업데이트하는 함수 (App에서 props를 전달하지 않은 경우 사용)
    const updateLocalWatermark = (setter) => (value) => {
        if (!propWatermarkEnabled) {
            setter(value);
        }
    };
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
    
    // 💡 획기적 기능: 상위 N개 외 '기타' 자동 묶기 (실무 필수)
    const [groupOthers, setGroupOthers] = useState(false);
    const [topNCount, setTopNCount] = useState(5);

    // ================= 디자인 & 포맷 상태 =================
    const [valueFormat, setValueFormat] = useState('none'); 
    const [colorTheme, setColorTheme] = useState('corporate'); 
    const [backgroundColor, setBackgroundColor] = useState('#0f172a');
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
    const [gridColor, setGridColor] = useState('#1e293b');
    const [labelColor, setLabelColor] = useState('#94a3b8');
    const [titleColor, setTitleColor] = useState('#e2e8f0');
    const [showTargetLine, setShowTargetLine] = useState(false);
    const [targetValue, setTargetValue] = useState('');
    const [activeDesignTab, setActiveDesignTab] = useState('theme');

    // ================= 텍스트/오버레이 관리 =================
    const [textOverlays, setTextOverlays] = useState([]);
    const [isAddingText, setIsAddingText] = useState(false);
    const [newTextValue, setNewTextValue] = useState('');
    const [overlayType, setOverlayType] = useState('text'); 
    const [newTextColor, setNewTextColor] = useState('#ffffff');
    const [newTextSize, setNewTextSize] = useState(14);
    const [draggingText, setDraggingText] = useState(null);

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
            // 대외비(워터마크) 자동 활성화 - 문서/보고서용에서만 적용
            if (!propWatermarkEnabled) {
                setLocalWatermarkEnabled(true);
                setLocalWatermarkText('CONFIDENTIAL');
                setLocalWatermarkDesign('single');
            }
            alert('인쇄/문서용(Report) 템플릿이 적용되었습니다. (대외비 워터마크 자동 적용)');
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
            // 다크/발표용에서는 워터마크 비활성화
            if (!propWatermarkEnabled) {
                setLocalWatermarkEnabled(false);
            }
            alert('프레젠테이션(Pitch) 템플릿이 적용되었습니다. (배경 투명화 됨)');
        }
    };

    // ================= 🤖 컨설팅 수준 AI 경영진 요약 생성 =================
    const generateSmartInsight = () => {
        const { labels, vals, average, growthRate } = chartDataObj;
        if (!vals.length) return;
        
        const sum = vals.reduce((a, b) => a + b, 0);
        const maxVal = Math.max(...vals);
        const minVal = Math.min(...vals);
        const maxLabel = labels[vals.indexOf(maxVal)];
        const minLabel = labels[vals.indexOf(minVal)];
        const maxPercent = ((maxVal / sum) * 100).toFixed(1);

        let lines = [];
        lines.push(`📊 [경영진 브리핑 요약]`);
        
        if (chartType === 'pie' || chartType === 'doughnut') {
            lines.push(`• 집중도: '${maxLabel}' 항목이 전체의 ${maxPercent}%를 점유하여 핵심 동인으로 작용 중입니다.`);
            lines.push(`• 파레토: 1위 항목과 최하위('${minLabel}') 간의 편차가 매우 큽니다.`);
        } else {
            lines.push(`• 핵심 성과: '${maxLabel}' 항목이 ${formatValue(maxVal)}로 가장 높으며, 평균치(${formatValue(average)}) 대비 우수합니다.`);
            if (labels.length > 2 && sortData === 'none') { // 시간 흐름으로 간주
                const trendIcon = growthRate > 0 ? '📈 상승' : '📉 하락';
                lines.push(`• 추세 분석: 초기 대비 현재 ${trendIcon} 국면이며, 약 ${Math.abs(growthRate).toFixed(1)}%의 증감이 발생했습니다.`);
            } else {
                lines.push(`• 위험 요인: '${minLabel}' 항목이 ${formatValue(minVal)}로 가장 저조하여 개선이 요구됩니다.`);
            }
        }
        
        const fullText = lines.join('\n');
        setTextOverlays(prev => [...prev, {
            id: Date.now(), text: fullText, x: 30, y: 30,
            color: backgroundColor === '#ffffff' ? '#1e293b' : '#f8fafc', 
            size: 14, fontFamily: fontFamily, type: 'exec-summary'
        }]);
    };

    // 워터마크 캔버스에 그리기
    const drawWatermark = (ctx, width, height, design, text, gridSize = 2) => {
        if (design === 'single') {
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(-Math.PI / 4);
            ctx.font = 'bold 100px sans-serif';
            ctx.fillStyle = 'rgba(200, 0, 0, 0.08)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 0, 0);
            ctx.restore();
        } else if (design === 'multiple') {
            const fontSize = Math.max(12, 60 - gridSize * 3);
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = 'rgba(200, 0, 0, 0.06)';
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    ctx.save();
                    ctx.translate(j * width / gridSize + width / (gridSize * 2), i * height / gridSize + height / (gridSize * 2));
                    ctx.rotate(-Math.PI / 4);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                }
            }
        } else if (design === 'corner') {
            // 4코너 배치
            ctx.font = 'bold 32px sans-serif';
            ctx.fillStyle = 'rgba(200, 0, 0, 0.12)';
            // 우상단
            ctx.textAlign = 'right';
            ctx.fillText(text, width - 30, 50);
            // 좌하단
            ctx.textAlign = 'left';
            ctx.fillText(text, 30, height - 30);
            // 좌상단
            ctx.textAlign = 'left';
            ctx.fillText(text, 30, 50);
            // 우하단
            ctx.textAlign = 'right';
            ctx.fillText(text, width - 30, height - 30);
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
            drawWatermark(ctx, tempCanvas.width, tempCanvas.height, watermarkDesign, watermarkText, watermarkGridSize);
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

        // 워터마크를 차트에 실시간으로 그리기 위한 플러그인
        const watermarkPlugin = {
            id: 'watermarkPlugin',
            beforeDraw: (chart) => {
                if (!watermarkEnabled) return;
                const ctx = chart.ctx;
                const width = chart.width;
                const height = chart.height;
                drawWatermark(ctx, width, height, watermarkDesign, watermarkText, watermarkGridSize);
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
    }, [chartDataObj, chartType, title, showLegend, legendPosition, colorTheme, backgroundColor, showGrid, barThickness, borderRadius, lineWidth, fontFamily, fonts, xAxisLabel, yAxisLabel, showHorizontal, showDataLabels, beginAtZero, gridColor, labelColor, titleColor, stacked, cutoutPercent, valueFormat, showAverageLine, customColors, autoHighlight, highlightNegative, enableGradient, dataLabelPosition, lineStyle, yMin, yMax, showPiePercent, chartPadding, watermarkEnabled, watermarkText, watermarkDesign, watermarkGridSize]);

    const activeTabClass = "px-4 py-3 text-sm font-bold text-brand-400 border-b-2 border-brand-500 bg-slate-800/80 transition-colors";
    const inactiveTabClass = "px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors";

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden font-sans" ref={containerRef}>
            
            {/* 1층 툴바: 데이터 및 피벗(집계) 설정 - 개선된 디자인 */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-slate-800/90 to-slate-800/50 border-b border-slate-700/50 shrink-0 z-20 backdrop-blur-sm">
                {/* 데이터 선택 카드 */}
                <div className="flex items-center bg-slate-900/80 rounded-xl border border-slate-700/50 p-2 shadow-lg shadow-black/20">
                    <div className="flex flex-col gap-1.5 pr-3 border-r border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-blue-400 font-bold w-5 text-center">X</span>
                            <div className="relative">
                                <select className="bg-slate-800/80 text-slate-200 px-2 py-1.5 text-xs w-36 outline-none border border-slate-600/50 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer" value={xAxis} onChange={e => setXAxis(e.target.value)}>
                                    {columns.map(c => <option className="bg-slate-900" key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 font-bold w-5 text-center">Y</span>
                            <div className="relative">
                                <select className="bg-slate-800/80 text-slate-200 px-2 py-1.5 text-xs w-36 outline-none border border-slate-600/50 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all appearance-none cursor-pointer" value={yAxis} onChange={e => setYAxis(e.target.value)}>
                                    {numericColumns.map(c => <option className="bg-slate-900" key={c} value={c}>{c}</option>)}
                                    {!numericColumns.length && columns.map(c => <option className="bg-slate-900" key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <button onClick={swapAxes} className="p-2 ml-2 bg-slate-700/50 text-slate-400 hover:text-white hover:bg-brand-600 rounded-lg transition-all shadow-md" title="X/Y축 스왑">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </button>
                </div>

                {/* 집계 선택 */}
                <div className="flex items-center bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-xl border border-purple-500/30 p-2 shadow-lg">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider px-1">집계방식</span>
                        <select className="bg-slate-800/80 text-purple-400 font-bold px-2 py-1.5 text-xs rounded-lg border border-purple-500/30 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 transition-all" value={aggregationType} onChange={e => setAggregationType(e.target.value)}>
                            <option value="sum">∑ 합계</option>
                            <option value="avg">ø 평균</option>
                            <option value="count"># 개수</option>
                            <option value="max">↑ 최대</option>
                            <option value="min">↓ 최소</option>
                        </select>
                    </div>
                </div>

                {/* 보조 Y축 (Combo일 때) */}
                {chartType === 'combo' && (
                    <div className="flex items-center bg-gradient-to-r from-indigo-900/30 to-indigo-800/20 rounded-xl border border-indigo-500/30 p-2 shadow-lg">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider px-1">보조 Y축</span>
                            <select className="bg-slate-800/80 text-indigo-300 px-2 py-1.5 text-xs rounded-lg border border-indigo-500/30 outline-none focus:border-indigo-400 w-32" value={yAxis2} onChange={e => setYAxis2(e.target.value)}>
                                {numericColumns.map(c => <option className="bg-slate-900" key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                )}
                
                <div className="w-px h-10 bg-slate-700/50 mx-1"></div>

                {/* 차트 유형 및 제목 */}
                <div className="flex flex-col gap-2 flex-1 min-w-[250px]">
                    <div className="relative">
                        <select className="w-full bg-slate-800/80 text-slate-200 px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-600/50 outline-none hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat" value={chartType} onChange={e => setChartType(e.target.value)}>
                            <option value="bar">📊 막대 차트</option>
                            <option value="line">📈 꺾은선</option>
                            <option value="area">📉 영역 차트</option>
                            <option value="combo">🔀 복합 차트</option>
                            <option value="pie">🥧 파이 차트</option>
                            <option value="doughnut">🍩 도넛 차트</option>
                        </select>
                    </div>
                    <input type="text" placeholder="차트 제목을 입력하세요..." value={title} onChange={e => setTitle(e.target.value)} className="bg-slate-800/60 text-slate-200 px-4 py-2 text-sm rounded-xl border border-slate-700/50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-500" />
                </div>
            </div>

            {/* 2층 툴바: 템플릿, AI, 내보내기 */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-900 border-b border-slate-800 shrink-0 z-10">
                <div className="flex items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold ml-1">🪄 퀵 템플릿:</span>
                    <button onClick={() => applyTemplate('report')} className="px-3 py-1 bg-white text-slate-800 text-xs font-bold rounded hover:bg-slate-200 transition-colors shadow-sm">문서/보고서용</button>
                    <button onClick={() => applyTemplate('pitch')} className="px-3 py-1 bg-slate-950 text-brand-400 border border-slate-700 text-xs font-bold rounded hover:bg-slate-900 transition-colors shadow-sm">다크/발표용</button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button onClick={generateSmartInsight} className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs rounded font-bold transition-all shadow-md flex items-center gap-1">
                        🤖 AI 경영진 요약
                    </button>
                    <button onClick={() => {setIsAddingText(!isAddingText); setOverlayType('text');}} className={`px-3 py-1.5 text-xs rounded font-bold transition-all ${isAddingText ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}`}>T 텍스트 추가</button>
                    <button onClick={() => document.getElementById('chart-design-panel').classList.toggle('hidden')} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-bold transition-colors flex items-center gap-1">🎨 세부 디자인</button>
                    <div className="w-px h-5 bg-slate-700 mx-1"></div>
                    <button onClick={copyToClipboard} disabled={!chartDataObj.labels.length} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-white text-xs rounded font-bold transition-colors">복사 (클립보드)</button>
                    <button onClick={exportAsPNG} disabled={!chartDataObj.labels.length} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-xs rounded font-bold transition-colors">PNG 저장</button>
                    {/* 🆕 집계 데이터 CSV 내보내기 */}
                    <button 
                        onClick={() => {
                            if (!chartDataObj.labels.length) return;
                            const csvRows = [['항목', '값', '비율(%)']];
                            const total = chartDataObj.vals.reduce((a, b) => a + b, 0);
                            chartDataObj.labels.forEach((label, i) => {
                                const val = chartDataObj.vals[i];
                                const percent = ((val / total) * 100).toFixed(2);
                                csvRows.push([label, val, percent + '%']);
                            });
                            const csvContent = csvRows.map(r => r.join(',')).join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `chart_data_${Date.now()}.csv`;
                            link.click();
                        }}
                        disabled={!chartDataObj.labels.length}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white text-xs rounded font-bold transition-colors flex items-center gap-1"
                    >
                        📊 CSV 내보내기
                    </button>
                    {/* 🆕 전체화면 버튼 */}
                    <button 
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                containerRef.current?.requestFullscreen();
                                setIsFullscreen(true);
                            } else {
                                document.exitFullscreen();
                                setIsFullscreen(false);
                            }
                        }}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded font-bold transition-colors flex items-center gap-1"
                    >
                        ⛶ 전체화면
                    </button>
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
                    <button onClick={() => setActiveDesignTab('theme')} className={activeDesignTab === 'theme' ? activeTabClass : inactiveTabClass}>🎨 색상/조건부서식</button>
                    <button onClick={() => setActiveDesignTab('axis')} className={activeDesignTab === 'axis' ? activeTabClass : inactiveTabClass}>📏 데이터포맷/축/기타묶기</button>
                    <button onClick={() => setActiveDesignTab('text')} className={activeDesignTab === 'text' ? activeTabClass : inactiveTabClass}>🔤 라벨/폰트크기</button>
                    <button onClick={() => setActiveDesignTab('options')} className={activeDesignTab === 'options' ? activeTabClass : inactiveTabClass}>⚙️ 차트 형태/옵션</button>
                    <button onClick={() => setActiveDesignTab('watermark')} className={activeDesignTab === 'watermark' ? activeTabClass : inactiveTabClass}>🔒 대외비</button>
                </div>
                
                <div className="bg-slate-900 p-6 max-h-[380px] overflow-y-auto custom-scrollbar">
                    
                    {/* 탭 1: 테마 및 서식 */}
                    {activeDesignTab === 'theme' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-6">
                                <div>
                                    <label className="text-sm text-slate-300 block mb-2 font-bold">보고서 맞춤형 색상 팔레트</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.keys(colorThemes).map(theme => (
                                            <button key={theme} onClick={() => {setColorTheme(theme); setAutoHighlight(false); setHighlightNegative(false); setCustomColors({});}} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${colorTheme === theme && !autoHighlight && !highlightNegative ? 'bg-slate-800 text-white ring-2 ring-brand-500 shadow-lg' : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-700'}`}>
                                                <div className="flex gap-0.5">
                                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: colorThemes[theme].bg[0]}}></div>
                                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: colorThemes[theme].bg[1]}}></div>
                                                </div>
                                                {theme === 'corporate' ? '신뢰도(기본)' : theme === 'mckinsey' ? '컨설팅(단정)' : theme === 'pastel' ? '파스텔(부드러움)' : '무채색(모던)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`border p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-colors ${autoHighlight ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`} onClick={() => {setAutoHighlight(!autoHighlight); if(!autoHighlight) {setHighlightNegative(false); setCustomColors({});}}}>
                                        <input type="checkbox" className="mt-1 w-4 h-4 accent-blue-500 pointer-events-none" checked={autoHighlight} readOnly />
                                        <div>
                                            <label className="text-sm font-bold text-blue-400 cursor-pointer block">스마트 강조 (최대/최소)</label>
                                            <p className="text-[10px] text-slate-400 mt-1">최대값(파랑)과 최소값(빨강) 자동 탐색.</p>
                                        </div>
                                    </div>
                                    
                                    <div className={`border p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-colors ${highlightNegative ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`} onClick={() => {setHighlightNegative(!highlightNegative); if(!highlightNegative) {setAutoHighlight(false); setCustomColors({});}}}>
                                        <input type="checkbox" className="mt-1 w-4 h-4 accent-red-500 pointer-events-none" checked={highlightNegative} readOnly />
                                        <div>
                                            <label className="text-sm font-bold text-red-400 cursor-pointer block">조건부 서식 (음수 빨강)</label>
                                            <p className="text-[10px] text-slate-400 mt-1">0보다 작은 적자/손실 데이터를 강조.</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-slate-300 block mb-2 font-bold">차트 배경 (PPT 삽입 시 투명화 필수)</label>
                                    <div className="flex gap-2 flex-wrap items-center">
                                        {['transparent', '#0f172a', '#1e293b', '#000000', '#ffffff', '#f8fafc'].map(color => (
                                            <button key={color} onClick={() => setBackgroundColor(color)} className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${backgroundColor === color ? 'border-brand-500 scale-110' : 'border-slate-600'} ${color === 'transparent' ? 'bg-[url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928GIEAEEAAEGADmIwQgf+mXpAAAAABJRU5ErkJggg==")]' : ''}`} style={{ backgroundColor: color !== 'transparent' ? color : undefined }} title={color === 'transparent' ? '투명 배경' : color} />
                                        ))}
                                        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-700">
                                            <label className="text-xs text-slate-400 font-medium">커스텀:</label>
                                            <input 
                                                type="color" 
                                                value={backgroundColor === 'transparent' ? '#0f172a' : backgroundColor} 
                                                onChange={(e) => setBackgroundColor(e.target.value)} 
                                                className="w-8 h-8 rounded-lg border-2 border-slate-600 cursor-pointer p-0.5 bg-transparent"
                                                title="사용자 정의 색상"
                                            />
                                        </div>
                                    </div>
                                    {backgroundColor !== 'transparent' && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-slate-500">선택된 색상:</span>
                                            <code className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{backgroundColor}</code>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-4 shrink-0">
                                    <label className="text-sm text-brand-400 font-bold flex items-center gap-2">개별 항목 색상 강제 덮어쓰기</label>
                                    <button onClick={() => setCustomColors({})} className="text-xs font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors">초기화</button>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 gap-3 flex-1">
                                    {chartDataObj.labels.map((label, idx) => {
                                        const defaultCol = colors.bg[idx % colors.bg.length];
                                        const currentVal = customColors[label] || (autoHighlight || highlightNegative ? undefined : defaultCol);
                                        return (
                                            <div key={label} className="flex items-center justify-between bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-700">
                                                <span className="text-xs text-slate-300 truncate font-medium flex-1 mr-2" title={label}>{label}</span>
                                                <input type="color" className="w-6 h-6 bg-transparent border-0 cursor-pointer p-0 rounded shrink-0" 
                                                    value={currentVal && currentVal.startsWith('#') ? currentVal : '#475569'} 
                                                    onChange={(e) => {setCustomColors(prev => ({...prev, [label]: e.target.value})); setAutoHighlight(false); setHighlightNegative(false);}} 
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 탭 2: 축, 데이터 포맷 및 기타 묶기 */}
                    {activeDesignTab === 'axis' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-emerald-500/10 p-5 rounded-xl border border-emerald-500/30 flex flex-col gap-4">
                                <label className="text-sm text-emerald-400 font-bold flex items-center gap-2">💰 숫자 단위 포맷팅</label>
                                <select className="bg-slate-900 text-slate-200 px-3 py-2.5 text-sm font-medium rounded-lg border border-slate-700 w-full focus:border-emerald-500 outline-none" value={valueFormat} onChange={e => setValueFormat(e.target.value)}>
                                    <option value="none">원본 수치 (예: 12000)</option>
                                    <option value="comma">천단위 콤마 (예: 12,000)</option>
                                    <option value="krw">원화 기호 ₩ (예: ₩12,000)</option>
                                    <option value="usd">달러 기호 $ (예: $12,000)</option>
                                    <option value="percent">퍼센트 % (예: 12.0%)</option>
                                    <option value="compact">요약 단위 (예: 1.2만)</option>
                                </select>
                                <label className="flex items-center gap-2 text-sm text-slate-200 font-bold mt-2 bg-slate-900 px-4 py-3 rounded-lg border border-slate-700 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={showDataLabels} onChange={e => setShowDataLabels(e.target.checked)} /> 차트 안에 실제 수치 라벨 표시
                                </label>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col gap-4">
                                    <label className="text-sm text-slate-300 font-bold">정렬 및 상위 항목 묶기 (롱테일)</label>
                                    <select className="bg-slate-900 text-slate-200 px-3 py-2 text-sm rounded-lg border border-slate-700 w-full outline-none" value={sortData} onChange={e => setSortData(e.target.value)}>
                                        <option value="desc">큰 값부터 (내림차순 정렬)</option>
                                        <option value="asc">작은 값부터 (오름차순 정렬)</option>
                                        <option value="none">데이터 원본 순서 유지</option>
                                    </select>
                                    <label className="flex items-center gap-2 text-sm text-brand-400 font-bold cursor-pointer mt-1">
                                        <input type="checkbox" className="w-4 h-4 accent-brand-500" checked={groupOthers} onChange={e => setGroupOthers(e.target.checked)} />
                                        상위 N개 제외 '기타'로 합치기
                                    </label>
                                    {groupOthers && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">표시할 상위 개수:</span>
                                            <input type="number" value={topNCount} onChange={e => setTopNCount(Number(e.target.value))} className="bg-slate-900 text-slate-200 px-2 py-1 text-sm rounded border border-slate-700 w-16 text-center" min="1" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col gap-3 h-full">
                                    <label className="text-sm text-slate-300 font-bold">Y축 범위 수동 설정 (차이 극대화)</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="number" placeholder="최소값(Min)" value={yMin} onChange={e => setYMin(e.target.value)} className="bg-slate-900 text-slate-200 px-3 py-2 text-sm font-bold rounded-lg border border-slate-700 w-full outline-none focus:border-brand-500" />
                                        <span className="text-slate-500 font-bold">~</span>
                                        <input type="number" placeholder="최대값(Max)" value={yMax} onChange={e => setYMax(e.target.value)} className="bg-slate-900 text-slate-200 px-3 py-2 text-sm font-bold rounded-lg border border-slate-700 w-full outline-none focus:border-brand-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 탭 3: 폰트 및 라벨 */}
                    {activeDesignTab === 'text' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="col-span-1 md:col-span-2 lg:col-span-4 border-b border-slate-800 pb-6 flex flex-wrap gap-8 items-end">
                                <div>
                                    <label className="text-sm text-slate-300 block mb-2 font-bold">차트 기본 글꼴</label>
                                    <select className="bg-slate-950 text-slate-200 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-700 w-64 outline-none focus:border-brand-500" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                                        <option value="'Pretendard', sans-serif">Pretendard (가독성 최상)</option>
                                        <option value="'Noto Sans KR', sans-serif">Noto Sans KR (본고딕)</option>
                                        <option value="'Malgun Gothic', sans-serif">맑은 고딕 (무난함)</option>
                                        <option value="Inter">Inter (영문 전용)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2 bg-slate-800/40 p-3 rounded-xl border border-slate-700 flex-1 min-w-[300px]">
                                    <label className="text-xs text-slate-300 font-bold">막대 차트 - 데이터 라벨 위치 조절</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setDataLabelPosition('top')} className={`px-4 py-2 text-xs font-bold rounded flex-1 transition-colors ${dataLabelPosition === 'top' ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>막대 위쪽 (기본)</button>
                                        <button onClick={() => setDataLabelPosition('center')} className={`px-4 py-2 text-xs font-bold rounded flex-1 transition-colors ${dataLabelPosition === 'center' ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>막대 정중앙</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <label className="text-sm text-slate-300 font-bold flex justify-between">타이틀 크기 <span className="text-brand-400 bg-brand-900/30 px-2 rounded">{fonts.title}px</span></label>
                                <input type="range" min="12" max="40" value={fonts.title} onChange={e => updateFont('title', e.target.value)} className="accent-brand-500" />
                            </div>
                            <div className="flex flex-col gap-3 bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <label className="text-sm text-slate-300 font-bold flex justify-between">축(X/Y) 라벨 크기 <span className="text-brand-400 bg-brand-900/30 px-2 rounded">{fonts.axis}px</span></label>
                                <input type="range" min="8" max="24" value={fonts.axis} onChange={e => updateFont('axis', e.target.value)} className="accent-brand-500" />
                            </div>
                            <div className="flex flex-col gap-3 bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <label className="text-sm text-slate-300 font-bold flex justify-between">범례 글자 크기 <span className="text-brand-400 bg-brand-900/30 px-2 rounded">{fonts.legend}px</span></label>
                                <input type="range" min="8" max="24" value={fonts.legend} onChange={e => updateFont('legend', e.target.value)} className="accent-brand-500" />
                            </div>
                            <div className="flex flex-col gap-3 bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <label className="text-sm text-slate-300 font-bold flex justify-between">데이터 수치 크기 <span className="text-brand-400 bg-brand-900/30 px-2 rounded">{fonts.dataLabel}px</span></label>
                                <input type="range" min="8" max="30" value={fonts.dataLabel} onChange={e => updateFont('dataLabel', e.target.value)} className="accent-brand-500" />
                            </div>
                        </div>
                    )}

                    {/* 탭 4: 고급 옵션 */}
                    {activeDesignTab === 'options' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
                                <label className="text-sm text-amber-400 font-bold flex items-center gap-2">선 및 가이드라인</label>
                                <label className="flex items-center gap-3 text-sm text-slate-300 font-medium cursor-pointer">
                                    <input type="checkbox" checked={showAverageLine} onChange={e => setShowAverageLine(e.target.checked)} className="w-4 h-4 accent-amber-500" disabled={chartType === 'pie' || chartType === 'doughnut'} /> 
                                    전체 평균선(점선) 표시
                                </label>
                                <div className="flex flex-col gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <label className="flex items-center gap-2 text-sm text-emerald-300 cursor-pointer font-bold">
                                        <input type="checkbox" checked={showTargetLine} onChange={e => setShowTargetLine(e.target.checked)} className="w-4 h-4 accent-emerald-500" disabled={chartType === 'pie' || chartType === 'doughnut'} /> 
                                        목표선(Target)
                                    </label>
                                    <input type="number" placeholder="목표 수치 (예: 10000)" value={targetValue} onChange={e => setTargetValue(e.target.value)} disabled={!showTargetLine} className="bg-slate-950 text-emerald-400 font-bold px-3 py-2 text-sm rounded border border-emerald-500/30 outline-none w-full disabled:opacity-50" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <label className="text-sm text-brand-400 font-bold">도형 외곽선 및 시각효과</label>
                                <label className="flex items-center gap-3 text-sm text-purple-300 cursor-pointer font-bold">
                                    <input type="checkbox" checked={enableGradient} onChange={e => setEnableGradient(e.target.checked)} className="w-4 h-4 accent-purple-500" disabled={chartType === 'pie' || chartType === 'doughnut'} /> 
                                    세로 그라데이션 적용
                                </label>
                                {(chartType === 'bar' || chartType === 'combo') && (
                                    <div className="flex flex-col gap-2 mt-1">
                                        <span className="text-xs text-slate-400">막대 두께 ({barThickness}px)</span>
                                        <input type="range" min="5" max="80" value={barThickness} onChange={e => setBarThickness(Number(e.target.value))} className="accent-brand-500" />
                                        <span className="text-xs text-slate-400 mt-1">막대 모서리 둥글기 ({borderRadius}px)</span>
                                        <input type="range" min="0" max="30" value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} className="accent-brand-500" />
                                    </div>
                                )}
                                {(chartType === 'line' || chartType === 'area' || chartType === 'combo') && (
                                    <div className="flex flex-col gap-3 mt-1">
                                        <select className="bg-slate-900 text-slate-200 px-3 py-2 text-xs rounded border border-slate-700 w-full" value={lineStyle} onChange={e => setLineStyle(e.target.value)}>
                                            <option value="smooth">곡선형 (부드럽게)</option>
                                            <option value="straight">직선형 (꺾이게)</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <label className="text-sm text-slate-300 font-bold mb-1">차트 레이아웃 설정</label>
                                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="w-4 h-4" /> 배경 눈금선(Grid) 켜기</label>
                                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={beginAtZero} onChange={e => setBeginAtZero(e.target.checked)} className="w-4 h-4" /> Y축 강제로 0부터 시작</label>
                                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={showHorizontal} onChange={e => setShowHorizontal(e.target.checked)} disabled={chartType === 'pie' || chartType === 'doughnut'} className="w-4 h-4" /> 누워있는 가로막대 전환</label>
                                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={stacked} onChange={e => setStacked(e.target.checked)} disabled={chartType !== 'bar' && chartType !== 'area'} className="w-4 h-4" /> 누적 막대 (Stacked)</label>
                                {/* 🆕 차트 주변 여백 (Clipping 방지) */}
                                <div className="pt-2 border-t border-slate-700 mt-2">
                                    <label className="text-xs text-orange-400 font-bold block mb-2">📐 차트 여백 (Clipping 방지)</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="80" 
                                            value={chartPadding} 
                                            onChange={e => setChartPadding(Number(e.target.value))}
                                            className="flex-1 accent-orange-500"
                                        />
                                        <span className="text-xs font-bold text-orange-400 w-10">{chartPadding}px</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">차트가 잘릴 때 여백을 늘리세요</p>
                                </div>
                                {/* 🆕 파이/도넛 차트 퍼센트 표시 */}
                                {(chartType === 'pie' || chartType === 'doughnut') && (
                                    <label className="flex items-center gap-3 text-sm text-cyan-300 cursor-pointer pt-2 border-t border-slate-800 mt-2">
                                        <input type="checkbox" checked={showPiePercent} onChange={e => setShowPiePercent(e.target.checked)} className="w-4 h-4 accent-cyan-500" /> 
                                        퍼센트 표시 (%)
                                    </label>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <label className="text-sm text-slate-300 font-bold">기타 고급 옵션</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                                        <input type="checkbox" checked={showLegend} onChange={e => setShowLegend(e.target.checked)} className="w-4 h-4 accent-brand-500" /> 범례 표시
                                    </label>
                                    <select className="bg-slate-900 text-slate-200 px-3 py-2 text-sm rounded border border-slate-700 w-full disabled:opacity-50" value={legendPosition} onChange={e => setLegendPosition(e.target.value)} disabled={!showLegend}>
                                        <option value="bottom">차트 아래쪽</option>
                                        <option value="top">차트 위쪽</option>
                                        <option value="right">오른쪽</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 탭 5: 대외비 (워터마크) */}
                    {activeDesignTab === 'watermark' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-6">
                                <div className="bg-red-500/10 p-5 rounded-xl border border-red-500/30">
                                    <label className="flex items-center gap-3 text-lg font-bold text-red-400 mb-4">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        워터마크 설정
                                    </label>
                                    
                                    <label className={`flex items-center gap-3 text-base font-medium mb-4 cursor-pointer ${!watermarkEnabled ? 'opacity-50' : ''}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={watermarkEnabled} 
                                            onChange={(e) => {
                                                if (!propWatermarkEnabled) {
                                                    setLocalWatermarkEnabled(e.target.checked);
                                                }
                                            }}
                                            className="w-5 h-5 accent-red-500"
                                            disabled={propWatermarkEnabled}
                                        />
                                        워터마크 활성화
                                        {propWatermarkEnabled && <span className="text-xs text-amber-400 ml-2">(문서/보고서용 템플릿에서만 사용)</span>}
                                    </label>

                                    <div className="mb-4">
                                        <label className="text-sm text-slate-400 block mb-2 font-bold">워터마크 텍스트</label>
                                        <input 
                                            type="text" 
                                            value={watermarkText}
                                            onChange={(e) => {
                                                if (!propWatermarkEnabled) {
                                                    setLocalWatermarkText(e.target.value);
                                                }
                                            }}
                                            placeholder="예: CONFIDENTIAL, 대외비, 비밀"
                                            className="w-full bg-slate-900 text-slate-200 px-4 py-3 text-sm rounded-lg border border-slate-700 outline-none focus:border-red-500"
                                            disabled={!watermarkEnabled}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-slate-400 block mb-3 font-bold">디자인 선택</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button 
                                                onClick={() => setLocalWatermarkDesign('single')}
                                                disabled={!watermarkEnabled}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${watermarkDesign === 'single' ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-slate-500 disabled:opacity-50'}`}
                                            >
                                                <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center">
                                                    <span className="text-[8px] text-red-500 -rotate-45 font-bold">텍스트</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-300">크게 하나</span>
                                            </button>
                                            <button 
                                                onClick={() => setLocalWatermarkDesign('multiple')}
                                                disabled={!watermarkEnabled}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${watermarkDesign === 'multiple' ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-slate-500 disabled:opacity-50'}`}
                                            >
                                                <div className="w-12 h-8 bg-slate-800 rounded grid grid-cols-2 gap-0.5 p-0.5">
                                                    <span className="text-[6px] text-red-500 -rotate-45 font-bold flex items-center justify-center">텍</span>
                                                    <span className="text-[6px] text-red-500 -rotate-45 font-bold flex items-center justify-center">텍</span>
                                                    <span className="text-[6px] text-red-500 -rotate-45 font-bold flex items-center justify-center">텍</span>
                                                    <span className="text-[6px] text-red-500 -rotate-45 font-bold flex items-center justify-center">텍</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-300">다수 배치</span>
                                            </button>
                                            <button 
                                                onClick={() => setLocalWatermarkDesign('corner')}
                                                disabled={!watermarkEnabled}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${watermarkDesign === 'corner' ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-slate-500 disabled:opacity-50'}`}
                                            >
                                                <div className="w-12 h-8 bg-slate-800 rounded relative">
                                                    <span className="text-[8px] text-red-500 absolute top-0.5 right-1 font-bold">텍</span>
                                                    <span className="text-[8px] text-red-500 absolute bottom-0.5 left-1 font-bold">텍</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-300">코너 배치</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 다수 배치 그리드 크기 조절 슬라이더 */}
                                    {watermarkDesign === 'multiple' && (
                                        <div className="mt-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm text-slate-300 font-bold">그리드 크기</label>
                                                <span className="text-lg font-bold text-red-400">{watermarkGridSize}x{watermarkGridSize}</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="2" 
                                                max="16" 
                                                value={watermarkGridSize}
                                                onChange={(e) => {
                                                    setWatermarkGridSize(Number(e.target.value));
                                                }}
                                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                                disabled={!watermarkEnabled}
                                            />
                                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                                <span>2x2</span>
                                                <span>16x16</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                                <h4 className="text-sm font-bold text-blue-400 mb-2">💡 정보</h4>
                                <ul className="text-xs text-slate-400 space-y-1">
                                    <li>• "문서/보고서용" 템플릿을 선택하면 워터마크가 자동 적용됩니다</li>
                                    <li>• 디자인 선택 시 즉시 차트에 적용됩니다</li>
                                    <li>• PNG 저장 시 워터마크가 이미지에 포함됩니다</li>
                                    <li>• 클립보드 복사 시 워터마크가 포함됩니다</li>
                                </ul>
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
                                        <span className="text-[100px] font-black text-red-600 -rotate-45 whitespace-nowrap select-none opacity-10">{watermarkText}</span>
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
                                            // 그리드 크기에 따라 글자 크기 자동 조절 (최대 60px, 최소 10px)
                                            const fontSize = Math.max(10, Math.min(60, 80 - watermarkGridSize * 4));
                                            return (
                                                <div key={i} className="flex items-center justify-center">
                                                    <span 
                                                        className="font-black text-red-600 -rotate-45 select-none whitespace-nowrap"
                                                        style={{ fontSize: `${fontSize}px` }}
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
                                        <span className="absolute top-8 right-8 text-[32px] font-black text-red-600 select-none opacity-15">{watermarkText}</span>
                                        <span className="absolute bottom-8 left-8 text-[32px] font-black text-red-600 select-none opacity-15">{watermarkText}</span>
                                        <span className="absolute top-8 left-8 text-[32px] font-black text-red-600 select-none opacity-15">{watermarkText}</span>
                                        <span className="absolute bottom-8 right-8 text-[32px] font-black text-red-600 select-none opacity-15">{watermarkText}</span>
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
                        
                        {/* 사용자 텍스트 오버레이 (일반 / 요약 박스) */}
                        {textOverlays.map(text => (
                            <div
                                key={text.id}
                                className={`absolute cursor-move transition-colors z-20 ${
                                    text.type === 'exec-summary' || text.type === 'box'
                                    ? `bg-slate-800/90 border-l-4 border-amber-500 p-4 rounded shadow-2xl backdrop-blur-sm` 
                                    : 'px-2 py-1 border border-transparent hover:border-amber-500/50 hover:bg-slate-900/30 rounded-lg'
                                } ${draggingText?.id === text.id ? 'opacity-70 scale-105' : ''}`}
                                style={{ left: text.x, top: text.y, color: text.color, fontSize: `${text.size}px`, fontFamily: text.fontFamily || fontFamily, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}
                                onMouseDown={(e) => handleTextMouseDown(e, text.id)}
                            >
                                {text.text}
                            </div>
                        ))}
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