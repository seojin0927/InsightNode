import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const PivotTable = ({ data, columns, colTypes, onZoomChange, onRequestZoom, hideToolbar = false }) => {
    // 피벗 테이블 설정 상태
    const [rowField, setRowField] = useState('');
    const [colField, setColField] = useState('');
    const [valueField, setValueField] = useState('');
    const [aggFunction, setAggFunction] = useState('SUM');
    const [topNRows, setTopNRows] = useState(0); // 0 = 전체, N = 상위 N개만 표시
    const [secondValueField, setSecondValueField] = useState(''); // 2번째 집계 컬럼
    const [secondAggFunction, setSecondAggFunction] = useState('COUNT'); // 2번째 집계 함수
    const [showSecondValue, setShowSecondValue] = useState(false); // 2번째 집계 표시 여부
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showTotals, setShowTotals] = useState(true);
    const [valueFormat, setValueFormat] = useState('comma'); // comma, krw, usd, percent, none
    const [displayMode, setDisplayMode] = useState('value'); // value, grandTotalPct, rowPct, colPct
    const [sortByTotal, setSortByTotal] = useState(null); // null, 'desc', 'asc'
    const [containerRef, setContainerRef] = useState(null);
    const [drillDownData, setDrillDownData] = useState(null); // 드릴다운 데이터
    const [drillDownTitle, setDrillDownTitle] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // 디자인 상태
    const [activeDesignTab, setActiveDesignTab] = useState('display'); // display, design
    const [showDataSettings, setShowDataSettings] = useState(false);
    const [showPivotPanel, setShowPivotPanel] = useState(false);
    const [pivotPanelTab, setPivotPanelTab] = useState('data');
    const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
    const settingsBtnRef = useRef(null);

    const openPanel = (tab = 'data') => {
        if (settingsBtnRef.current) {
            const rect = settingsBtnRef.current.getBoundingClientRect();
            setPanelPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
        }
        setPivotPanelTab(tab);
        setShowPivotPanel(v => !v);
    };

    useEffect(() => {
        const handleClose = (e) => {
            if (showPivotPanel && settingsBtnRef.current && !settingsBtnRef.current.contains(e.target)) {
                const panel = document.getElementById('pivot-floating-panel');
                if (panel && !panel.contains(e.target)) setShowPivotPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClose);
        return () => document.removeEventListener('mousedown', handleClose);
    }, [showPivotPanel]);
    
    // 표 스타일 상태
    const [tableBgColor, setTableBgColor] = useState('#1e293b');
    const [textColor, setTextColor] = useState('#e2e8f0');
    const [borderColor, setBorderColor] = useState('#475569');
    const [fontFamily, setFontFamily] = useState("'Pretendard', sans-serif");
    const [cellPadding, setCellPadding] = useState(12);
    const [fontSize, setFontSize] = useState(14);
    const [textAlign, setTextAlign] = useState('right');
    const [headerTextAlign, setHeaderTextAlign] = useState('center');
    const [borderWidth, setBorderWidth] = useState(1);
    const [borderStyle, setBorderStyle] = useState('solid');
    const [showRowStripe, setShowRowStripe] = useState(false);
    const [stripeColor, setStripeColor] = useState('#1e293b');
    const [compactMode, setCompactMode] = useState(false);

    // 🎨 색상 팔레트 정의 - 배경색별로 최적의 색상 조합
    const colorPalettes = {
        // 다크 배경들
        '#1e293b': { header: '#334155', headerText: '#ffffff', total: '#38bdf8', border: '#475569', heatmap: 'blueDark', stripe: '#0f172a' },
        '#0f172a': { header: '#1e293b', headerText: '#ffffff', total: '#38bdf8', border: '#334155', heatmap: 'blueDark', stripe: '#020617' },
        
        // 밝은 배경들
        '#ffffff': { header: '#f1f5f9', headerText: '#1e293b', total: '#0d9488', border: '#e2e8f0', heatmap: 'teal', stripe: '#f8fafc' },
        '#f8fafc': { header: '#e2e8f0', headerText: '#1e293b', total: '#0d9488', border: '#cbd5e1', heatmap: 'teal', stripe: '#f1f5f9' },
        '#f1f5f9': { header: '#e2e8f0', headerText: '#1e293b', total: '#0d9488', border: '#cbd5e1', heatmap: 'teal', stripe: '#e2e8f0' },
        '#e2e8f0': { header: '#cbd5e1', headerText: '#1e293b', total: '#0891b2', border: '#94a3b8', heatmap: 'cyan', stripe: '#cbd5e1' },
        
        // 색상 배경들
        '#f0f9ff': { header: '#e0f2fe', headerText: '#0369a1', total: '#0284c7', border: '#bae6fd', heatmap: 'sky', stripe: '#e0f2fe' },
        '#ecfeff': { header: '#cffafe', headerText: '#0891b2', total: '#06b6d4', border: '#a5f3fc', heatmap: 'cyan', stripe: '#cffafe' },
        '#f0fdf4': { header: '#dcfce7', headerText: '#15803d', total: '#16a34a', border: '#bbf7d0', heatmap: 'green', stripe: '#dcfce7' },
        '#fefce8': { header: '#fef9c3', headerText: '#a16207', total: '#ca8a04', border: '#fef08a', heatmap: 'yellow', stripe: '#fef9c3' },
        '#fff7ed': { header: '#ffedd5', headerText: '#c2410c', total: '#ea580c', border: '#fed7aa', heatmap: 'orange', stripe: '#ffedd5' },
        '#faf5ff': { header: '#f3e8ff', headerText: '#7e22ce', total: '#9333ea', border: '#e9d5ff', heatmap: 'purple', stripe: '#f3e8ff' },
    };
    
    // 기본 팔레트 (다크)
    const defaultPalette = { header: '#334155', headerText: '#ffffff', total: '#38bdf8', border: '#475569', heatmap: 'blueDark', stripe: '#0f172a' };
    
    // 현재 팔레트 선택
    const palette = colorPalettes[tableBgColor] || defaultPalette;
    
    // 파생 상태
    const isLightBg = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#f0f9ff', '#ecfeff', '#f0fdf4', '#fefce8', '#fff7ed', '#faf5ff'].includes(tableBgColor);
    const isDarkBg = ['#1e293b', '#0f172a'].includes(tableBgColor);
    const headerBgColor = palette.header;
    const headerTextColor = palette.headerText;
    const totalColor = palette.total;
    const currentBorderColor = palette.border;
    const heatmapScheme = palette.heatmap;

    // 추가 옵션 상태
    const [alternatingColors, setAlternatingColors] = useState(false);
    const [hoverHighlight, setHoverHighlight] = useState(true);

    // 🎨 셀/행/열 색상 커스터마이징
    const [cellColors, setCellColors] = useState({}); // { 'rowVal|colVal': '#hex' }
    const [rowColors, setRowColors] = useState({});   // { 'rowVal': '#hex' }
    const [colColors, setColColors] = useState({});   // { 'colVal': '#hex' }
    const [colorTarget, setColorTarget] = useState('cell'); // 'cell' | 'row' | 'col'
    const [selectedRowForColor, setSelectedRowForColor] = useState('');
    const [selectedColForColor, setSelectedColForColor] = useState('');
    const [pickedColor, setPickedColor] = useState('#3b82f6');

    const applyColor = () => {
        if (colorTarget === 'cell' && selectedRowForColor && selectedColForColor) {
            setCellColors(prev => ({ ...prev, [`${selectedRowForColor}|${selectedColForColor}`]: pickedColor }));
        } else if (colorTarget === 'row' && selectedRowForColor) {
            setRowColors(prev => ({ ...prev, [selectedRowForColor]: pickedColor }));
        } else if (colorTarget === 'col' && selectedColForColor) {
            setColColors(prev => ({ ...prev, [selectedColForColor]: pickedColor }));
        }
    };

    const clearAllColors = () => { setCellColors({}); setRowColors({}); setColColors({}); };

    // 🪄 퀵 템플릿 적용 함수
    const applyTemplate = (type) => {
        clearAllColors();
        if (type === 'report') {
            setTableBgColor('#ffffff');
            setTextColor('#1e293b');
            setBorderColor('#e2e8f0');
            setShowHeatmap(false);
            setCompactMode(false);
            setCellPadding(12);
            setFontSize(14);
            setBorderWidth(1);
            setBorderStyle('solid');
            setShowRowStripe(true);
            setStripeColor('#f8fafc');
            setTextAlign('right');
            setFontFamily("'Pretendard', sans-serif");
        } else if (type === 'pitch') {
            setTableBgColor('#1e293b');
            setTextColor('#f1f5f9');
            setBorderColor('#334155');
            setShowHeatmap(false);
            setCompactMode(false);
            setCellPadding(14);
            setFontSize(15);
            setBorderWidth(1);
            setBorderStyle('solid');
            setShowRowStripe(true);
            setStripeColor('#0f172a');
            setTextAlign('right');
            setFontFamily("'Pretendard', sans-serif");
        } else if (type === 'compact') {
            setTableBgColor('#0f172a');
            setTextColor('#cbd5e1');
            setBorderColor('#1e293b');
            setShowHeatmap(false);
            setCompactMode(true);
            setCellPadding(6);
            setFontSize(11);
            setBorderWidth(1);
            setBorderStyle('solid');
            setShowRowStripe(false);
            setTextAlign('right');
            setFontFamily("'Pretendard', sans-serif");
        } else if (type === 'neon') {
            setTableBgColor('#0f172a');
            setTextColor('#e2e8f0');
            setBorderColor('#6366f1');
            setShowHeatmap(false);
            setCompactMode(false);
            setCellPadding(12);
            setFontSize(13);
            setBorderWidth(1);
            setBorderStyle('solid');
            setShowRowStripe(false);
            setTextAlign('right');
            setFontFamily("'Courier New', monospace");
        } else if (type === 'pastel') {
            setTableBgColor('#faf5ff');
            setTextColor('#4c1d95');
            setBorderColor('#e9d5ff');
            setShowHeatmap(false);
            setCompactMode(false);
            setCellPadding(12);
            setFontSize(13);
            setBorderWidth(1);
            setBorderStyle('solid');
            setShowRowStripe(true);
            setStripeColor('#f3e8ff');
            setTextAlign('right');
            setFontFamily("'Pretendard', sans-serif");
        } else if (type === 'minimal') {
            setTableBgColor('#ffffff');
            setTextColor('#374151');
            setBorderColor('#f3f4f6');
            setShowHeatmap(false);
            setCompactMode(false);
            setCellPadding(10);
            setFontSize(13);
            setBorderWidth(0);
            setBorderStyle('solid');
            setShowRowStripe(false);
            setTextAlign('right');
            setFontFamily("'Pretendard', sans-serif");
        }
    };

    // 숫자형 컬럼 찾기
    const numericColumns = useMemo(() => 
        columns.filter(col => data.some(row => !isNaN(parseFloat(row[col])) && isFinite(row[col])))
    , [columns, data]);

    // 텍스트형 컬럼 찾기
    const textColumns = useMemo(() => 
        columns.filter(col => !numericColumns.includes(col))
    , [columns, numericColumns]);

    // 기본값 설정
    useEffect(() => {
        if (!rowField && textColumns.length > 0) setRowField(textColumns[0]);
        if (!colField && textColumns.length > 1) setColField(textColumns[1]);
        if (!valueField && numericColumns.length > 0) setValueField(numericColumns[0]);
    }, [textColumns, numericColumns]);

    // 피벗 데이터 계산
    const pivotData = useMemo(() => {
        if (!data.length || !rowField || !valueField) return null;

        const rowValues = new Set();
        const colValues = new Set();
        const pivotMap = {};
        const rowColMap = {};

        data.forEach((row, idx) => {
            const rowVal = String(row[rowField] || 'N/A');
            const colVal = colField ? String(row[colField] || 'N/A') : 'Total';
            const numVal = parseFloat(row[valueField]);

            rowValues.add(rowVal);
            colValues.add(colVal);

            const key = `${rowVal}|${colVal}`;
            if (!pivotMap[key]) {
                pivotMap[key] = [];
                rowColMap[key] = [];
            }
            if (!isNaN(numVal)) {
                pivotMap[key].push(numVal);
                rowColMap[key].push(idx);
            }
        });

        let sortedRowValues = Array.from(rowValues).sort();
        let sortedColValues = colField ? Array.from(colValues).sort() : ['Total'];

        // 집계 헬퍼 함수 (MEDIAN, STDEV 포함)
        const calcAgg = (values, fn) => {
            if (!values.length) return null;
            switch (fn) {
                case 'SUM': return values.reduce((a, b) => a + b, 0);
                case 'AVG': return values.reduce((a, b) => a + b, 0) / values.length;
                case 'COUNT': return values.length;
                case 'MAX': return Math.max(...values);
                case 'MIN': return Math.min(...values);
                case 'MEDIAN': {
                    const sorted = [...values].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                }
                case 'STDEV': {
                    if (values.length < 2) return 0;
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
                    return Math.sqrt(variance);
                }
                case 'COUNT_DIST': return new Set(values.map(String)).size;
                default: return values.reduce((a, b) => a + b, 0);
            }
        };

        // 총계 기준 정렬
        if (sortByTotal) {
            const rowTotalMap = {};
            sortedRowValues.forEach(rowVal => {
                let total = 0;
                sortedColValues.forEach(colVal => {
                    const key = `${rowVal}|${colVal}`;
                    const values = pivotMap[key] || [];
                    if (values.length > 0) total += calcAgg(values, aggFunction) || 0;
                });
                rowTotalMap[rowVal] = total;
            });
            sortedRowValues.sort((a, b) => {
                const diff = (rowTotalMap[b] || 0) - (rowTotalMap[a] || 0);
                return sortByTotal === 'desc' ? diff : -diff;
            });
        }

        // Top-N 필터 적용
        if (topNRows > 0) {
            sortedRowValues = sortedRowValues.slice(0, topNRows);
        }

        // 집계 계산
        const aggregated = {};
        sortedRowValues.forEach(rowVal => {
            aggregated[rowVal] = {};
            sortedColValues.forEach(colVal => {
                const key = `${rowVal}|${colVal}`;
                const values = pivotMap[key] || [];
                aggregated[rowVal][colVal] = calcAgg(values, aggFunction);
            });
        });

        // 행별 총계
        const rowTotals = {};
        sortedRowValues.forEach(rowVal => {
            const values = sortedColValues.map(colVal => aggregated[rowVal][colVal]).filter(v => v !== null);
            rowTotals[rowVal] = calcAgg(values, aggFunction);
        });

        // 열별 총계
        const colTotals = {};
        sortedColValues.forEach(colVal => {
            const values = sortedRowValues.map(rowVal => aggregated[rowVal][colVal]).filter(v => v !== null);
            colTotals[colVal] = calcAgg(values, aggFunction);
        });

        // 전체 총계
        const grandTotalValues = Object.values(rowTotals).filter(v => v !== null);
        const finalGrandTotal = calcAgg(grandTotalValues, aggFunction);

        return {
            rows: sortedRowValues,
            cols: sortedColValues,
            data: aggregated,
            rowTotals,
            colTotals,
            grandTotal: finalGrandTotal,
            rowColMap
        };
    }, [data, rowField, colField, valueField, aggFunction, sortByTotal, topNRows]);

    // 표시 모드에 따른 값 계산
    const getDisplayValue = (value, rowVal, colVal) => {
        if (value === null || value === undefined) return null;
        
        if (displayMode === 'value') {
            return value;
        } else if (displayMode === 'grandTotalPct' && pivotData?.grandTotal) {
            return (value / pivotData.grandTotal) * 100;
        } else if (displayMode === 'rowPct' && pivotData?.rowTotals[rowVal]) {
            return (value / pivotData.rowTotals[rowVal]) * 100;
        } else if (displayMode === 'colPct' && pivotData?.colTotals[colVal]) {
            return (value / pivotData.colTotals[colVal]) * 100;
        }
        return value;
    };

    // 히트맵 색상 계산 - 팔레트 기반
    const getHeatmapColor = (displayValue, min, max, scheme) => {
        if (displayValue === null || min === max) return 'transparent';
        
        const ratio = (displayValue - min) / (max - min);
        
        // 팔레트의 히트맵 색상에 맞는 색상 schemes
        const schemes = {
            // 다크 배경용
            blueDark: { low: [30, 58, 138], mid: [59, 130, 246], high: [56, 189, 248] },  // 다크 blues
            
            // 밝은 배경용 - 각각의 배경색에 어울리는 색상
            teal: { low: [240, 253, 250], mid: [45, 212, 191], high: [13, 148, 136] },      // teal greens
            cyan: { low: [236, 254, 255], mid: [34, 211, 238], high: [8, 145, 178] },        // cyans
            sky: { low: [224, 242, 254], mid: [14, 165, 233], high: [2, 132, 199] },        // sky blues
            green: { low: [240, 253, 244], mid: [74, 222, 128], high: [22, 163, 74] },       // greens
            yellow: { low: [254, 249, 195], mid: [253, 224, 71], high: [202, 138, 4] },      // yellows
            orange: { low: [255, 247, 237], mid: [251, 146, 60], high: [234, 88, 12] },      // oranges
            purple: { low: [250, 245, 255], mid: [192, 132, 252], high: [147, 51, 234] },    // purples
        };

        const colors = schemes[scheme] || schemes.blueDark;
        
        let r, g, b;
        if (ratio < 0.5) {
            const t = ratio * 2;
            r = Math.round(colors.low[0] + (colors.mid[0] - colors.low[0]) * t);
            g = Math.round(colors.low[1] + (colors.mid[1] - colors.low[1]) * t);
            b = Math.round(colors.low[2] + (colors.mid[2] - colors.low[2]) * t);
        } else {
            const t = (ratio - 0.5) * 2;
            r = Math.round(colors.mid[0] + (colors.high[0] - colors.mid[0]) * t);
            g = Math.round(colors.mid[1] + (colors.high[1] - colors.mid[1]) * t);
            b = Math.round(colors.mid[2] + (colors.high[2] - colors.mid[2]) * t);
        }
        
        return `rgb(${r}, ${g}, ${b})`;
    };

    // 값 서식
    const formatValue = (val, isPct = false) => {
        if (val === null || val === undefined) return '-';
        if (isNaN(val)) return val;
        
        const num = Number(val);
        
        if (isPct || displayMode !== 'value') {
            if (displayMode === 'grandTotalPct' || displayMode === 'rowPct' || displayMode === 'colPct') {
                return num.toFixed(1) + '%';
            }
        }
        
        if (valueFormat === 'comma') return num.toLocaleString();
        if (valueFormat === 'krw') return '₩' + num.toLocaleString();
        if (valueFormat === 'usd') return '$' + num.toLocaleString();
        if (valueFormat === 'percent') return num.toFixed(1) + '%';
        if (valueFormat === 'compact') return new Intl.NumberFormat('ko-KR', { notation: "compact" }).format(num);
        return num.toLocaleString();
    };

    // Min/Max 계산
    const { minVal, maxVal } = useMemo(() => {
        if (!pivotData || !showHeatmap) return { minVal: 0, maxVal: 1 };
        
        const values = [];
        pivotData.rows.forEach(rowVal => {
            pivotData.cols.forEach(colVal => {
                const rawVal = pivotData.data[rowVal]?.[colVal];
                if (rawVal !== null && rawVal !== undefined) {
                    const displayVal = getDisplayValue(rawVal, rowVal, colVal);
                    values.push(displayVal);
                }
            });
        });
        
        if (values.length === 0) return { minVal: 0, maxVal: 1 };
        
        let min = Math.min(...values);
        let max = Math.max(...values);
        
        if (displayMode !== 'value') {
            min = 0;
            max = 100;
        }
        
        return { minVal: min, maxVal: max };
    }, [pivotData, showHeatmap, displayMode]);

    // 확대/축소 토글
    const toggleZoom = () => {
        if (onRequestZoom) { onRequestZoom(); return; }
        if (!containerRef) return;
        if (!isFullscreen) {
            containerRef.style.position = 'fixed';
            containerRef.style.top = '0';
            containerRef.style.left = '0';
            containerRef.style.right = '0';
            containerRef.style.bottom = '0';
            containerRef.style.width = '100%';
            containerRef.style.height = '100%';
            containerRef.style.zIndex = '9999';
            containerRef.style.background = '#0f172a';
            containerRef.style.padding = '20px';
        } else {
            containerRef.style.position = '';
            containerRef.style.top = '';
            containerRef.style.left = '';
            containerRef.style.right = '';
            containerRef.style.bottom = '';
            containerRef.style.width = '';
            containerRef.style.height = '';
            containerRef.style.zIndex = '';
            containerRef.style.background = '';
            containerRef.style.padding = '';
        }
        setIsFullscreen(!isFullscreen);
        if (onZoomChange) onZoomChange(!isFullscreen);
    };

    // 드릴다운 핸들러
    const handleCellDoubleClick = (rowVal, colVal) => {
        if (!pivotData?.rowColMap) return;
        
        const key = `${rowVal}|${colVal}`;
        const originalIndices = pivotData.rowColMap[key];
        
        if (originalIndices && originalIndices.length > 0) {
            const drillDownRows = originalIndices.map(idx => data[idx]);
            setDrillDownData(drillDownRows);
            setDrillDownTitle(`${rowVal} × ${colField ? colVal : '전체'} (${drillDownRows.length}개 행)`);
        }
    };

    // CSV 내보내기
    const exportAsCSV = () => {
        if (!pivotData) return;
        
        const csvRows = [];
        
        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        const headers = [rowField, ...pivotData.cols];
        if (showTotals) headers.push('총계');
        csvRows.push(headers.map(escapeCSV).join(','));
        
        pivotData.rows.forEach(rowVal => {
            const row = [rowVal];
            pivotData.cols.forEach(colVal => {
                const val = pivotData.data[rowVal]?.[colVal];
                const displayVal = getDisplayValue(val, rowVal, colVal);
                const formattedVal = displayVal !== null ? formatValue(displayVal, displayMode !== 'value') : '';
                row.push(formattedVal);
            });
            if (showTotals) {
                const totalVal = pivotData.rowTotals[rowVal];
                const displayTotal = getDisplayValue(totalVal, rowVal, 'Total');
                const formattedTotal = displayTotal !== null ? formatValue(displayTotal, displayMode !== 'value') : '';
                row.push(formattedTotal);
            }
            csvRows.push(row.map(escapeCSV).join(','));
        });
        
        if (showTotals) {
            const totalRow = ['총계'];
            pivotData.cols.forEach(colVal => {
                const val = pivotData.colTotals[colVal];
                const displayVal = getDisplayValue(val, 'Total', colVal);
                const formattedVal = displayVal !== null ? formatValue(displayVal, displayMode !== 'value') : '';
                totalRow.push(formattedVal);
            });
            const grandVal = pivotData.grandTotal;
            const displayGrand = getDisplayValue(grandVal, 'Total', 'Total');
            const formattedGrand = displayGrand !== null ? formatValue(displayGrand, displayMode !== 'value') : '';
            totalRow.push(formattedGrand);
            csvRows.push(totalRow.map(escapeCSV).join(','));
        }
        
        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pivot_${Date.now()}.csv`;
        link.click();
    };

    // 배경색에서 글자색을 계산하는 함수 - 다크/더다크 배경은 흰색, 나머지는 검은색
    const getTextColor = (bgColor, isHeader = false, isTotal = false) => {
        // 다크(#1e293b) 또는 더다크(#0f172a) 배경에서는 모든 글자를 흰색으로
        if (tableBgColor === '#1e293b' || tableBgColor === '#0f172a') {
            return '#ffffff';
        }
        // 나머지 배경에서는 모든 글자를 검은색으로
        return '#000000';
    };


    // PNG 이미지로 저장
    const exportAsPNG = async () => {
        if (!pivotData || !containerRef) return;
        
        const tableEl = containerRef.querySelector('table');
        if (!tableEl) return;
        
        try {
            if (typeof html2canvas === 'undefined') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }
            
            if (typeof html2canvas === 'undefined') {
                await manualCanvasExport(tableEl);
                return;
            }
            
            const tableRect = tableEl.getBoundingClientRect();
            const scrollWidth = tableEl.scrollWidth;
            const scrollHeight = tableEl.scrollHeight;
            
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.left = '-99999px';
            wrapper.style.top = '0';
            wrapper.style.width = Math.max(scrollWidth, tableRect.width) + 'px';
            wrapper.style.height = Math.max(scrollHeight, tableRect.height) + 'px';
            wrapper.style.backgroundColor = tableBgColor;
            wrapper.style.padding = '20px';
            wrapper.style.boxSizing = 'border-box';
            wrapper.style.overflow = 'visible';
            
            const tableClone = tableEl.cloneNode(true);
            
            tableClone.style.backgroundColor = tableBgColor;
            tableClone.style.color = textColor;
            tableClone.style.fontSize = `${compactMode ? fontSize - 2 : fontSize}px`;
            tableClone.style.fontFamily = fontFamily;
            tableClone.style.width = scrollWidth + 'px';
            tableClone.style.minWidth = scrollWidth + 'px';
            tableClone.style.margin = '0';
            tableClone.style.borderCollapse = 'collapse';
            tableClone.style.tableLayout = 'auto';
            
            const cloneRows = tableClone.querySelectorAll('tr');
            const originalRows = tableEl.querySelectorAll('tr');
            
            cloneRows.forEach((cloneRow, rowIdx) => {
                const originalRow = originalRows[rowIdx];
                if (!originalRow) return;
                
                const originalRowStyle = window.getComputedStyle(originalRow);
                cloneRow.style.backgroundColor = originalRowStyle.backgroundColor;
                
                const cloneCells = cloneRow.querySelectorAll('th, td');
                const originalCells = originalRow.querySelectorAll('th, td');
                
                cloneCells.forEach((cloneCell, cellIdx) => {
                    const originalCell = originalCells[cellIdx];
                    if (!originalCell) return;
                    
                    const computedStyle = window.getComputedStyle(originalCell);
                    
                    const cellWidth = originalCell.offsetWidth;
                    const cellHeight = originalCell.offsetHeight;
                    
                    cloneCell.style.width = cellWidth + 'px';
                    cloneCell.style.minWidth = cellWidth + 'px';
                    cloneCell.style.height = cellHeight + 'px';
                    cloneCell.style.minHeight = cellHeight + 'px';
                    cloneCell.style.maxWidth = cellWidth + 'px';
                    cloneCell.style.backgroundColor = computedStyle.backgroundColor;
                    cloneCell.style.color = computedStyle.color;
                    cloneCell.style.borderColor = borderColor;
                    cloneCell.style.borderWidth = `${borderWidth}px`;
                    cloneCell.style.borderStyle = borderStyle;

                    const basePadding = compactMode ? cellPadding / 2 : cellPadding;
                    cloneCell.style.paddingTop = `${Math.max(0, basePadding - 8)}px`;
                    cloneCell.style.paddingBottom = `${basePadding + 8}px`;
                    cloneCell.style.paddingLeft = `${basePadding}px`;
                    cloneCell.style.paddingRight = `${basePadding}px`;
                    
                    cloneCell.style.textAlign = originalCell.tagName === 'TH' ? headerTextAlign : textAlign;
                    cloneCell.style.fontWeight = computedStyle.fontWeight;
                    cloneCell.style.fontFamily = computedStyle.fontFamily;
                    cloneCell.style.fontSize = computedStyle.fontSize;
                    cloneCell.style.whiteSpace = 'nowrap';
                    cloneCell.style.overflow = 'visible';
                    cloneCell.style.boxSizing = 'border-box';
                    
                    cloneCell.style.verticalAlign = 'middle';
                    cloneCell.style.display = 'table-cell';
                    
                    cloneCell.style.position = 'static';
                    cloneCell.style.left = 'auto';
                    cloneCell.style.top = 'auto';
                    cloneCell.style.zIndex = 'auto';
                });
            });
            
            const cloneThead = tableClone.querySelector('thead');
            const originalThead = tableEl.querySelector('thead');
            if (cloneThead && originalThead) {
                cloneThead.style.backgroundColor = headerBgColor;
            }
            
            wrapper.appendChild(tableClone);
            document.body.appendChild(wrapper);
            
            const canvas = await html2canvas(tableClone, {
                backgroundColor: tableBgColor,
                scale: 3,
                useCORS: true,
                logging: false,
                allowTaint: true,
                windowWidth: scrollWidth + 40,
                windowHeight: scrollHeight + 40,
                onclone: (clonedDoc, clonedElement) => {
                    clonedElement.style.width = scrollWidth + 'px';
                    const cells = clonedElement.querySelectorAll('th, td');
                    cells.forEach(cell => {
                        cell.style.lineHeight = 'normal';
                        cell.style.display = 'table-cell';
                    });
                }
            });
            
            document.body.removeChild(wrapper);
            
            const link = document.createElement('a');
            link.download = `pivot_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
        } catch (err) {
            console.error('PNG export error:', err);
            try {
                await manualCanvasExport(tableEl);
            } catch (fallbackErr) {
                alert('PNG 내보내기에 실패했습니다: ' + fallbackErr.message);
            }
        }
    };
    
    // 스크립트 동적 로드
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };
    
    // 수동 캔버스 내보내기
    const manualCanvasExport = async (tableEl) => {
        const scale = 2;
        
        const width = tableEl.scrollWidth * scale;
        const height = tableEl.scrollHeight * scale;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.fillStyle = tableBgColor;
        ctx.fillRect(0, 0, width, height);
        
        ctx.scale(scale, scale);
        ctx.textBaseline = 'central';
        
        const rows = tableEl.querySelectorAll('tr');
        let y = 0;
        
        for (const row of rows) {
            const cells = row.querySelectorAll('th, td');
            let x = 0;
            let maxHeight = 0;
            
            for (const cell of cells) {
                const style = window.getComputedStyle(cell);
                
                const cellWidth = cell.offsetWidth || 100;
                const cellHeight = cell.offsetHeight || 30;
                maxHeight = Math.max(maxHeight, cellHeight);
                
                const bgColor = style.backgroundColor;
                if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(x, y, cellWidth, cellHeight);
                }
                
                const borderColor = style.borderColor;
                const borderWidth = parseInt(style.borderWidth) || 1;
                if (borderWidth > 0 && borderColor) {
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = borderWidth;
                    ctx.strokeRect(x, y, cellWidth, cellHeight);
                }
                
                const color = style.color;
                const fontSize = parseInt(style.fontSize) || 14;
                const fontWeight = style.fontWeight || 'normal';
                
                ctx.fillStyle = color;
                ctx.font = `${fontWeight} ${fontSize}px ${style.fontFamily || 'sans-serif'}`;
                
                const text = cell.textContent.trim();
                const cellTextAlign = cell.tagName === 'TH' ? headerTextAlign : textAlign;
                const textX = cellTextAlign === 'center' ? x + cellWidth / 2 :
                              cellTextAlign === 'right' ? x + cellWidth - 8 : x + 8;
                
                ctx.fillText(text, textX, y + cellHeight / 2);
                
                x += cellWidth;
            }
            y += maxHeight || 30;
        }
        
        const link = document.createElement('a');
        link.download = `pivot_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // 클립보드에 HTML 표 복사
    const copyToClipboard = async () => {
        if (!pivotData) return;
        
        let html = '<table border="1" style="border-collapse: collapse; font-family: Arial, sans-serif;">';
        
        html += '<thead><tr>';
        html += `<th style="background: ${headerBgColor}; color: ${headerTextColor}; padding: 8px; text-align: center;">${rowField}</th>`;
        pivotData.cols.forEach(col => {
            html += `<th style="background: ${headerBgColor}; color: ${headerTextColor}; padding: 8px; text-align: center;">${col}</th>`;
        });
        if (showTotals) {
            html += `<th style="background: ${headerBgColor}; color: ${totalColor}; padding: 8px; text-align: center;">총계</th>`;
        }
        html += '</tr></thead><tbody>';
        
        pivotData.rows.forEach(rowVal => {
            html += '<tr>';
            html += `<td style="background: ${tableBgColor}; color: ${textColor}; padding: 8px; font-weight: bold; text-align: ${textAlign};">${rowVal}</td>`;
            pivotData.cols.forEach(colVal => {
                const rawVal = pivotData.data[rowVal]?.[colVal];
                const displayVal = getDisplayValue(rawVal, rowVal, colVal);
                const displayStr = formatValue(displayVal, displayMode !== 'value');
                
                let bgColor = 'transparent';
                let color = textColor;
                if (showHeatmap && rawVal !== null) {
                    bgColor = getHeatmapColor(displayVal, minVal, maxVal, heatmapScheme);
                    color = getTextColor(bgColor);
                }
                
                html += `<td style="background: ${bgColor}; color: ${color}; padding: 8px; text-align: ${textAlign};">${displayStr}</td>`;
            });
            if (showTotals) {
                const totalVal = pivotData.rowTotals[rowVal];
                const displayTotal = getDisplayValue(totalVal, rowVal, 'Total');
                html += `<td style="background: ${headerBgColor}; color: ${totalColor}; padding: 8px; text-align: ${textAlign}; font-weight: bold;">${formatValue(displayTotal, displayMode !== 'value')}</td>`;
            }
            html += '</tr>';
        });
        
        if (showTotals) {
            html += '<tr>';
            html += `<td style="background: ${headerBgColor}; color: ${totalColor}; padding: 8px; font-weight: bold; text-align: ${textAlign};">총계</td>`;
            pivotData.cols.forEach(colVal => {
                const val = pivotData.colTotals[colVal];
                const displayVal = getDisplayValue(val, 'Total', colVal);
                const bgColor = headerBgColor;
                const color = getTextColor(headerBgColor, false, true);
                html += `<td style="background: ${bgColor}; color: ${color}; padding: 8px; text-align: ${textAlign}; font-weight: bold;">${formatValue(displayVal, displayMode !== 'value')}</td>`;
            });
            const grandVal = pivotData.grandTotal;
            const displayGrand = getDisplayValue(grandVal, 'Total', 'Total');
            html += `<td style="background: ${headerBgColor}; color: ${totalColor}; padding: 8px; text-align: ${textAlign}; font-weight: bold;">${formatValue(displayGrand, displayMode !== 'value')}</td>`;
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        
        try {
            await navigator.clipboard.writeText(html);
            alert('✨ 표가 클립보드에 복사되었습니다! 엑셀이나 파워포인트에서 Ctrl+V로 붙여넣기 하세요.');
        } catch (err) {
            alert('복사 실패: 브라우저가 클립보드 접근을 지원하지 않습니다.');
        }
    };

    // 총계 정렬 토글
    const toggleSortByTotal = () => {
        if (sortByTotal === null) {
            setSortByTotal('desc');
        } else if (sortByTotal === 'desc') {
            setSortByTotal('asc');
        } else {
            setSortByTotal(null);
        }
    };

    if (!data.length) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-lg h-full">
                데이터가 없습니다.
            </div>
        );
    }

    const isPctMode = displayMode !== 'value';

    // 배경색에 따라 글자색 자동 결정
    const getContrastColor = (bgColor) => {
        if (!bgColor) return '#e2e8f0';
        
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        
        return brightness > 128 ? '#1e293b' : '#e2e8f0';
    };

    // 배경색 변경 시 텍스트색 및 줄무늬색 자동 조정
    useEffect(() => {
        // 다크 배경(#1e293b, #0f172a)은 흰색, 나머지는 검은색으로 고정
        if (tableBgColor === '#1e293b' || tableBgColor === '#0f172a') {
            setTextColor('#ffffff');
        } else {
            setTextColor('#000000');
        }
        
        // 줄무늬 색상을 배경색에 맞게 자동 조절
        const hex = tableBgColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        
        // 밝은 배경에서는 더 어두운 줄무늬, 어두운 배경에서는 더 밝은 줄무늬
        if (brightness > 128) {
            const stripeR = Math.max(0, r - 25);
            const stripeG = Math.max(0, g - 25);
            const stripeB = Math.max(0, b - 25);
            setStripeColor(`rgb(${stripeR}, ${stripeG}, ${stripeB})`);
        } else {
            const stripeR = Math.min(255, r + 25);
            const stripeG = Math.min(255, g + 25);
            const stripeB = Math.min(255, b + 25);
            setStripeColor(`rgb(${stripeR}, ${stripeG}, ${stripeB})`);
        }
    }, [tableBgColor]);

    // useEffect for header text color - removed since headerBgColor is now derived

    // 활성 탭 클래스
    const activeTabClass = "px-4 py-3 text-sm font-bold text-brand-400 border-b-2 border-brand-500 bg-slate-800/80 transition-colors";
    const inactiveTabClass = "px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors";

    return (
        <div ref={setContainerRef} className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden font-sans relative">

            {/* ── 툴바 ── */}
            {!hideToolbar && <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
                <span className="text-xs font-bold text-slate-500 mr-auto">피벗 테이블</span>
                {/* ⚙️ 설정 버튼 */}
                <button ref={settingsBtnRef} onClick={() => openPanel(pivotPanelTab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all hover:scale-105"
                    style={{ background: showPivotPanel ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showPivotPanel ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`, color: showPivotPanel ? '#a5b4fc' : '#94a3b8' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    디자인
                </button>
                {/* 내보내기 버튼들 */}
                <button onClick={copyToClipboard} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.22)', color: '#fbbf24' }}>복사</button>
                <button onClick={exportAsPNG} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)', color: '#a78bfa' }}>PNG</button>
                <button onClick={exportAsCSV} className="px-2.5 py-1.5 text-xs rounded-lg font-semibold hover:scale-105 transition-all" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}>CSV</button>
                <button onClick={toggleZoom} className="p-1.5 rounded-lg transition-all hover:scale-105" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }} title={isFullscreen ? '원래 크기로' : '전체화면'}>
                    {isFullscreen ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
                </button>
            </div>}

            {/* ── Portal: 플로팅 설정 패널 ── */}
            {showPivotPanel && createPortal(
                <div id="pivot-floating-panel"
                    className="flex flex-col rounded-2xl shadow-2xl overflow-hidden"
                    style={{ position: 'fixed', top: panelPos.top, right: panelPos.right, width: 320, maxHeight: '80vh', zIndex: 9999, background: 'rgba(5,10,24,0.98)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}>
                    {/* 패널 헤더 */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                        <span className="text-sm font-bold text-slate-200 flex-1">피벗 설정</span>
                        <button onClick={() => setShowPivotPanel(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    {/* 탭 */}
                    <div className="flex border-b border-white/8 shrink-0">
                        {[['data','📊 데이터'],['display','📋 표시'],['design','🎨 디자인'],['template','⚡ 템플릿']].map(([id,label]) => (
                            <button key={id} onClick={() => setPivotPanelTab(id)}
                                className={`flex-1 py-2.5 text-xs font-bold transition-colors ${pivotPanelTab === id ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    {/* 탭 콘텐츠 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {pivotPanelTab === 'data' && (<>
                            <div>
                                <label className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1.5">행 (Row)</label>
                                <select value={rowField} onChange={e => setRowField(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-blue-500/25 outline-none">
                                    {textColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1.5">열 (Column)</label>
                                <select value={colField} onChange={e => setColField(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-purple-500/25 outline-none">
                                    <option value="">-- 단일 열 --</option>
                                    {textColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1.5">값 (Value)</label>
                                <select value={valueField} onChange={e => setValueField(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-emerald-500/25 outline-none">
                                    {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1.5">집계 방식</label>
                                <div className="grid grid-cols-4 gap-1">
                                    {[['SUM','합계'],['AVG','평균'],['COUNT','개수'],['MAX','최대'],['MIN','최소'],['MEDIAN','중앙값'],['STDEV','표준편차'],['COUNT_DIST','고유개수']].map(([v,l]) => (
                                        <button key={v} onClick={() => setAggFunction(v)} className={`py-1.5 text-[10px] font-bold rounded transition-all ${aggFunction === v ? 'bg-amber-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">상위 N행만</label>
                                    <span className="text-[10px] font-bold text-cyan-300 font-mono">{topNRows === 0 ? '전체' : `TOP ${topNRows}`}</span>
                                </div>
                                <input type="range" min="0" max="50" value={topNRows} onChange={e => setTopNRows(Number(e.target.value))} className="w-full accent-cyan-500 h-1.5 rounded-full" />
                            </div>
                            <div>
                                <label className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block mb-1.5">총계 기준 정렬</label>
                                <div className="flex gap-1">
                                    {[['desc','내림차순'],['asc','오름차순'],[null,'원본']].map(([v,l]) => (
                                        <button key={String(v)} onClick={() => setSortByTotal(v)} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${sortByTotal === v ? 'bg-orange-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${showTotals ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}>
                                <input type="checkbox" checked={showTotals} onChange={e => setShowTotals(e.target.checked)} className="accent-orange-500" /> 총계 표시
                            </label>
                        </>)}
                        {pivotPanelTab === 'display' && (<>
                            <div>
                                <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1.5">표시 모드</label>
                                <div className="grid grid-cols-2 gap-1">
                                    {[['value','값'],['grandTotalPct','전체%'],['rowPct','행%'],['colPct','열%']].map(([v,l]) => (
                                        <button key={v} onClick={() => setDisplayMode(v)} className={`py-1.5 text-xs font-bold rounded transition-all ${displayMode === v ? 'bg-emerald-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">값 서식</label>
                                <select value={valueFormat} onChange={e => setValueFormat(e.target.value)} className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-slate-700 outline-none">
                                    <option value="comma">1,234 (쉼표)</option>
                                    <option value="krw">₩1,234 (원화)</option>
                                    <option value="usd">$1,234 (USD)</option>
                                    <option value="percent">12.3% (퍼센트)</option>
                                    <option value="compact">1.2만 (축약)</option>
                                    <option value="none">원본</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">데이터 정렬</label>
                                <div className="flex gap-1">
                                    {[['left','왼쪽'],['center','가운데'],['right','오른쪽']].map(([v,l]) => (
                                        <button key={v} onClick={() => setTextAlign(v)} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${textAlign === v ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">글자 크기: {fontSize}px</label>
                                <input type="range" min="10" max="20" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-indigo-500 h-1.5 rounded-full" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">셀 패딩: {cellPadding}px</label>
                                <input type="range" min="4" max="24" value={cellPadding} onChange={e => setCellPadding(Number(e.target.value))} className="w-full accent-indigo-500 h-1.5 rounded-full" />
                            </div>
                        </>)}
                        {pivotPanelTab === 'design' && (<>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">표 배경색</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[['#1e293b','다크'],['#0f172a','블랙'],['#ffffff','화이트'],['#f8fafc','스노우'],['#f0f9ff','스카이'],['#ecfeff','시안'],['#f0fdf4','민트'],['#faf5ff','라벤더'],['#fff7ed','오렌지'],['#fefce8','옐로우'],['#f1f5f9','라이트'],['#e2e8f0','실버']].map(([color, label]) => (
                                        <button key={color} onClick={() => setTableBgColor(color)} title={label}
                                            className={`h-8 rounded-lg border-2 transition-all ${tableBgColor === color ? 'border-indigo-500 scale-110' : 'border-transparent hover:border-white/30'}`}
                                            style={{ background: color }} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">테두리 두께: {borderWidth}px</label>
                                <input type="range" min="0" max="3" value={borderWidth} onChange={e => setBorderWidth(Number(e.target.value))} className="w-full accent-indigo-500 h-1.5 rounded-full" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">테두리 스타일</label>
                                <div className="flex gap-1">
                                    {[['solid','실선'],['dashed','점선'],['dotted','점']].map(([v,l]) => (
                                        <button key={v} onClick={() => setBorderStyle(v)} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${borderStyle === v ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-white'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${showRowStripe ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}>
                                <input type="checkbox" checked={showRowStripe} onChange={e => setShowRowStripe(e.target.checked)} className="accent-indigo-500" /> 줄무늬 표시
                            </label>

                            {/* 셀/행/열 색상 편집 */}
                            <div className="border-t border-white/5 pt-3">
                                <div className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-2">🎨 색상 직접 편집</div>
                                <div className="grid grid-cols-3 gap-1 mb-2">
                                    {[['cell','셀'],['row','행'],['col','열']].map(([v,l]) => (
                                        <button key={v} onClick={() => setColorTarget(v)} className={`py-1.5 text-[10px] font-bold rounded transition-all ${colorTarget===v ? 'bg-violet-600 text-white' : 'bg-slate-900/60 text-slate-400 border border-slate-700/50'}`}>{l}</button>
                                    ))}
                                </div>
                                {(colorTarget === 'row' || colorTarget === 'cell') && pivotData && (
                                    <div className="mb-2">
                                        <div className="text-[10px] text-slate-500 mb-1">행 선택</div>
                                        <select value={selectedRowForColor} onChange={e => setSelectedRowForColor(e.target.value)} className="w-full bg-slate-900 text-slate-200 px-2 py-1.5 text-xs rounded-lg border border-slate-700 outline-none">
                                            <option value="">-- 선택 --</option>
                                            {pivotData.rows.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                )}
                                {(colorTarget === 'col' || colorTarget === 'cell') && pivotData && (
                                    <div className="mb-2">
                                        <div className="text-[10px] text-slate-500 mb-1">열 선택</div>
                                        <select value={selectedColForColor} onChange={e => setSelectedColForColor(e.target.value)} className="w-full bg-slate-900 text-slate-200 px-2 py-1.5 text-xs rounded-lg border border-slate-700 outline-none">
                                            <option value="">-- 선택 --</option>
                                            {pivotData.cols.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <input type="color" value={pickedColor} onChange={e => setPickedColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer border border-slate-700" />
                                    <input type="text" value={pickedColor} onChange={e => setPickedColor(e.target.value)} className="flex-1 bg-slate-900 text-slate-200 px-2 py-1.5 text-xs rounded-lg border border-slate-700 outline-none font-mono" />
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button onClick={applyColor} className="py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all">적용</button>
                                    <button onClick={clearAllColors} className="py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all">전체 초기화</button>
                                </div>
                            </div>
                        </>)}
                        {pivotPanelTab === 'template' && (<>
                            <p className="text-xs text-slate-500 mb-3">클릭 한 번으로 모든 스타일이 즉시 적용됩니다.</p>
                            <div className="space-y-2">
                            {[
                                { id: 'report',  icon: '📄', label: '문서·보고서용',  desc: '밝은 배경, 줄무늬, 깔끔한 인쇄용 레이아웃', preview: ['#ffffff','#f8fafc','#e2e8f0'] },
                                { id: 'pitch',   icon: '🌙', label: '다크·발표용',    desc: '다크 배경, 줄무늬, 선명한 대비', preview: ['#1e293b','#0f172a','#334155'] },
                                { id: 'compact', icon: '📱', label: '컴팩트',         desc: '초소형 글씨, 빽빽한 레이아웃', preview: ['#0f172a','#1e293b','#475569'] },
                                { id: 'neon',    icon: '💜', label: '네온·개발자',    desc: '다크+보라 테두리, 모노스페이스 폰트', preview: ['#0f172a','#6366f1','#1e293b'] },
                                { id: 'pastel',  icon: '🌸', label: '파스텔',         desc: '연한 보라 배경, 부드러운 색조', preview: ['#faf5ff','#e9d5ff','#f3e8ff'] },
                                { id: 'minimal', icon: '⬜', label: '미니멀',         desc: '테두리 없음, 여백 최소화, 화이트 배경', preview: ['#ffffff','#f3f4f6','#e5e7eb'] },
                            ].map(t => (
                                <button key={t.id} onClick={() => { applyTemplate(t.id); setShowPivotPanel(false); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-white/5 border border-white/5 transition-all hover:border-indigo-500/30">
                                    <span className="text-xl">{t.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-slate-200">{t.label}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {t.preview.map((c,i) => <div key={i} className="w-4 h-4 rounded" style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }} />)}
                                    </div>
                                </button>
                            ))}
                            </div>
                        </>)}
                    </div>
                </div>,
                document.body
            )}

            {/* 피벗 테이블 */}
            <div className="flex-1 overflow-auto custom-scrollbar p-4" style={{ backgroundColor: tableBgColor }}>
                {pivotData ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{ 
                            backgroundColor: tableBgColor, 
                            color: textColor,
                            fontSize: `${compactMode ? fontSize - 2 : fontSize}px`,
                            fontFamily: fontFamily
                        }}>
                            <thead>
                                <tr>
                                    <th className="sticky top-0 left-0 z-30 font-bold text-xs uppercase tracking-wider min-w-[150px]" 
                                        style={{ 
                                            backgroundColor: headerBgColor, 
                                            color: getTextColor(headerBgColor, true, false),
                                            borderColor: currentBorderColor,
                                            borderWidth: `${borderWidth}px`,
                                            borderStyle: borderStyle,
                                            padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                            textAlign: headerTextAlign
                                        }}>
                                        {rowField}
                                    </th>
                                    {pivotData.cols.map(col => (
                                        <th key={col} className="sticky top-0 z-20 font-bold text-xs uppercase tracking-wider min-w-[100px] whitespace-nowrap" 
                                            style={{ 
                                                backgroundColor: headerBgColor, 
                                                color: getTextColor(headerBgColor, true, false),
                                                borderColor: borderColor,
                                                borderWidth: `${borderWidth}px`,
                                                borderStyle: borderStyle,
                                                padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                textAlign: headerTextAlign
                                            }}>
                                            {col}
                                        </th>
                                    ))}
                                    {showTotals && (
                                        <th 
                                            className="sticky top-0 z-20 font-bold text-xs uppercase tracking-wider min-w-[100px] cursor-pointer hover:opacity-80 transition-colors"
                                            style={{ 
                                                backgroundColor: sortByTotal ? '#4f46e5' : headerBgColor, 
                                                borderColor: borderColor,
                                                borderWidth: `${borderWidth}px`,
                                                borderStyle: borderStyle,
                                                padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                textAlign: headerTextAlign,
                                                color: getTextColor(headerBgColor, false, true)
                                            }}
                                            onClick={toggleSortByTotal}
                                            title="총계 클릭 시 정렬"
                                        >
                                            총계 {sortByTotal === 'desc' ? '↓' : sortByTotal === 'asc' ? '↑' : ''}
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {pivotData.rows.map((rowVal, rowIndex) => (
                                    <tr 
                                        key={rowVal} 
                                        style={
                                            alternatingColors && rowIndex % 2 === 1 
                                                ? { backgroundColor: 'rgba(255,255,255,0.05)' }  // alternating일 때 은은한 하이라이트
                                                : (showRowStripe && rowIndex % 2 === 1 ? { backgroundColor: stripeColor } : {})
                                        }
                                        className={hoverHighlight ? 'hover:bg-white/10 transition-colors' : ''}
                                    >
                                        <td className="sticky left-0 z-10 font-semibold whitespace-nowrap" 
                                            style={{ 
                                                backgroundColor: tableBgColor, 
                                                color: getTextColor(tableBgColor),
                                                borderColor: borderColor,
                                                borderWidth: `${borderWidth}px`,
                                                borderStyle: borderStyle,
                                                padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                textAlign: textAlign
                                            }}>
                                            {rowVal}
                                        </td>
                                        {pivotData.cols.map(colVal => {
                                            const rawValue = pivotData.data[rowVal]?.[colVal];
                                            const displayValue = getDisplayValue(rawValue, rowVal, colVal);
                                            const customCellBg = cellColors[`${rowVal}|${colVal}`] || rowColors[rowVal] || colColors[colVal];
                                            const bgColor = customCellBg || 'transparent';
                                            const cellTextColor = customCellBg ? getTextColor(customCellBg) : getTextColor(tableBgColor);
                                            
                                            return (
                                                <td 
                                                    key={colVal} 
                                                    className="font-mono cursor-pointer hover:opacity-80 transition-colors"
                                                    style={{ 
                                                        backgroundColor: bgColor,
                                                        color: cellTextColor,
                                                        borderColor: borderColor,
                                                        borderWidth: `${borderWidth}px`,
                                                        borderStyle: borderStyle,
                                                        padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                        textAlign: textAlign
                                                    }}
                                                    onDoubleClick={() => handleCellDoubleClick(rowVal, colVal)}
                                                    title="더블클릭: 원본 데이터 보기"
                                                >
                                                    {formatValue(displayValue, isPctMode)}
                                                </td>
                                            );
                                        })}
                                        {showTotals && (
                                            <td className="font-bold font-mono" 
                                                style={{ 
                                                    backgroundColor: headerBgColor, 
                                                    borderColor: borderColor,
                                                    borderWidth: `${borderWidth}px`,
                                                    borderStyle: borderStyle,
                                                    padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                    textAlign: textAlign,
                                                    color: getTextColor(headerBgColor, false, true)
                                                }}>
                                                {formatValue(getDisplayValue(pivotData.rowTotals[rowVal], rowVal, 'Total'), isPctMode)}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {showTotals && (
                                    <tr className="font-bold" style={{ backgroundColor: showRowStripe ? stripeColor : 'rgba(0,0,0,0.1)' }}>
                                        <td className="sticky left-0 z-10 font-bold" 
                                            style={{ 
                                                backgroundColor: headerBgColor, 
                                                borderColor: borderColor,
                                                borderWidth: `${borderWidth}px`,
                                                borderStyle: borderStyle,
                                                padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                textAlign: textAlign,
                                                color: getTextColor(headerBgColor, false, true)
                                            }}>
                                            총계
                                        </td>
                                        {pivotData.cols.map(colVal => {
                                            const val = pivotData.colTotals[colVal];
                                            const displayVal = getDisplayValue(val, 'Total', colVal);
                                            const bgColor = headerBgColor;
                                            const cellTextColor = getTextColor(headerBgColor, false, true);
                                            
                                            return (
                                                <td 
                                                    key={colVal}
                                                    className="font-mono"
                                                    style={{ 
                                                        backgroundColor: bgColor,
                                                        color: cellTextColor,
                                                        borderColor: borderColor,
                                                        borderWidth: `${borderWidth}px`,
                                                        borderStyle: borderStyle,
                                                        padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                        textAlign: textAlign
                                                    }}
                                                >
                                                    {formatValue(displayVal, isPctMode)}
                                                </td>
                                            );
                                        })}
                                        <td className="font-bold font-mono" 
                                            style={{ 
                                                backgroundColor: headerBgColor, 
                                                borderColor: borderColor,
                                                borderWidth: `${borderWidth}px`,
                                                borderStyle: borderStyle,
                                                padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                textAlign: textAlign,
                                                color: getTextColor(headerBgColor, false, true)
                                            }}>
                                            {formatValue(getDisplayValue(pivotData.grandTotal, 'Total', 'Total'), isPctMode)}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                            <svg className="w-16 h-16 mx-auto text-brand-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-300 mb-2">피벗 테이블을 설정하세요</p>
                            <p className="text-sm text-slate-500">행, 열, 값을 선택하여 크로스탭 분석을 시작하세요</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 푸터 */}
          <div className="bg-slate-900 border-t border-slate-800 px-5 py-3 text-xs text-slate-400 shrink-0 flex justify-between items-center font-medium">
                <div className="flex items-center gap-4">
                    {pivotData && (
                        <>행: {pivotData.rows.length} × 열: {pivotData.cols.length} = {pivotData.rows.length * pivotData.cols.length}개 셀</>
                    )}
                </div>
                <div className="flex gap-4">
                    <span>💡 더블클릭: 상세 데이터 | 총계 클릭: 정렬</span>
                </div>
            </div>

            {/* 드릴다운 모달 */}
            {drillDownData && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setDrillDownData(null)}>
                    <div className="bg-slate-900 rounded-xl border border-slate-600 max-w-4xl max-h-[80vh] w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                            <div>
                                <h3 className="text-lg font-bold text-white">{drillDownTitle}</h3>
                                <p className="text-sm text-slate-400">원본 데이터 ({drillDownData.length}개 행)</p>
                            </div>
                            <button 
                                onClick={() => setDrillDownData(null)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="overflow-auto max-h-[60vh]">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-800">
                                    <tr>
                                        {columns.map(col => (
                                            <th key={col} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-700 whitespace-nowrap">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {drillDownData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/50">
                                            {columns.map(col => (
                                                <td key={col} className="px-4 py-3 text-slate-300 border-b border-slate-800 whitespace-nowrap">
                                                    {row[col] ?? '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PivotTable;
