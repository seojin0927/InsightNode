import React, { useState, useMemo, useEffect, useRef } from 'react';

const PivotTable = ({ data, columns, colTypes, watermarkEnabled: propWatermarkEnabled = false, watermarkText: propWatermarkText = 'CONFIDENTIAL', watermarkDesign: propWatermarkDesign = 'single', onZoomChange }) => {
    // 피벗 테이블 설정 상태
    const [rowField, setRowField] = useState('');
    const [colField, setColField] = useState('');
    const [valueField, setValueField] = useState('');
    const [aggFunction, setAggFunction] = useState('SUM');
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [colorScheme, setColorScheme] = useState('blue'); // blue, green, red, purple
    const [showTotals, setShowTotals] = useState(true);
    const [valueFormat, setValueFormat] = useState('comma'); // comma, krw, usd, percent, none
    const [displayMode, setDisplayMode] = useState('value'); // value, grandTotalPct, rowPct, colPct
    const [sortByTotal, setSortByTotal] = useState(null); // null, 'desc', 'asc'
    const [isZoomed, setIsZoomed] = useState(false);
    const [containerRef, setContainerRef] = useState(null);
    const [drillDownData, setDrillDownData] = useState(null); // 드릴다운 데이터
    const [drillDownTitle, setDrillDownTitle] = useState('');
    
    // 🆕 디자인 & 워터마크 상태 (ChartViewer 스타일)
    const [activeDesignTab, setActiveDesignTab] = useState('display'); // display, design, watermark
    const [tableBgColor, setTableBgColor] = useState('#1e293b');
    const [headerBgColor, setHeaderBgColor] = useState('#334155');
    const [headerTextColor, setHeaderTextColor] = useState('#ffffff');
    const [textColor, setTextColor] = useState('#e2e8f0');
    const [borderColor, setBorderColor] = useState('#475569');
    const [fontFamily, setFontFamily] = useState("'Pretendard', sans-serif");
    
    // 표 스타일 상태
    const [cellPadding, setCellPadding] = useState(12);
    const [fontSize, setFontSize] = useState(14);
    const [textAlign, setTextAlign] = useState('right'); // left, center, right
    const [headerTextAlign, setHeaderTextAlign] = useState('center');
    const [borderWidth, setBorderWidth] = useState(1);
    const [borderStyle, setBorderStyle] = useState('solid'); // solid, dashed, dotted
    const [showRowStripe, setShowRowStripe] = useState(false);
    const [stripeColor, setStripeColor] = useState('#1e293b');
    const [frozenRowCount, setFrozenRowCount] = useState(0);
    const [frozenColCount, setFrozenColCount] = useState(1);
    const [compactMode, setCompactMode] = useState(false);
    
    // 로컬 워터마크 상태
    const [localWatermarkEnabled, setLocalWatermarkEnabled] = useState(false);
    const [localWatermarkText, setLocalWatermarkText] = useState('CONFIDENTIAL');
    const [localWatermarkDesign, setLocalWatermarkDesign] = useState('single');
    const [localWatermarkColor, setLocalWatermarkColor] = useState('#dc2626');
    const [watermarkGridSize, setWatermarkGridSize] = useState(4);
    
    // 최종 워터마크 값 (props 우선)
    const watermarkEnabled = propWatermarkEnabled || localWatermarkEnabled;
    const watermarkText = propWatermarkEnabled ? propWatermarkText : localWatermarkText;
    const watermarkDesign = localWatermarkDesign;
    const watermarkColor = localWatermarkColor;

    // 숫자형 컬럼 찾기
    const numericColumns = useMemo(() => 
        columns.filter(col => data.some(row => !isNaN(parseFloat(row[col])) && isFinite(row[col])))
    , [columns, data]);

    // 텍스트형 컬럼 찾기
    const textColumns = useMemo(() => 
        columns.filter(col => !numericColumns.includes(col))
    , [columns, numericColumns]);

    // 기본값 설정 (첫 번째 선택 가능한 값들)
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
        const rowColMap = {}; // 각 셀의 원본 데이터 추적

        // 데이터 순회하며 피벗 맵 생성
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
                rowColMap[key].push(idx); // 원본 데이터 인덱스 저장
            }
        });

        let sortedRowValues = Array.from(rowValues).sort();
        let sortedColValues = colField ? Array.from(colValues).sort() : ['Total'];

        // 총계 기준 정렬
        if (sortByTotal) {
            const rowTotalMap = {};
            sortedRowValues.forEach(rowVal => {
                let total = 0;
                sortedColValues.forEach(colVal => {
                    const key = `${rowVal}|${colVal}`;
                    const values = pivotMap[key] || [];
                    if (values.length > 0) {
                        switch (aggFunction) {
                            case 'SUM': total += values.reduce((a, b) => a + b, 0); break;
                            case 'AVG': total += values.reduce((a, b) => a + b, 0) / values.length; break;
                            case 'COUNT': total += values.length; break;
                            case 'MAX': total = Math.max(total, ...values); break;
                            case 'MIN': total = total === 0 ? Math.min(...values) : Math.min(total, ...values); break;
                            default: total += values.reduce((a, b) => a + b, 0);
                        }
                    }
                });
                rowTotalMap[rowVal] = total;
            });
            sortedRowValues.sort((a, b) => {
                const diff = (rowTotalMap[b] || 0) - (rowTotalMap[a] || 0);
                return sortByTotal === 'desc' ? diff : -diff;
            });
        }

        // 집계 계산
        const aggregated = {};
        sortedRowValues.forEach(rowVal => {
            aggregated[rowVal] = {};
            sortedColValues.forEach(colVal => {
                const key = `${rowVal}|${colVal}`;
                const values = pivotMap[key] || [];
                
                if (values.length === 0) {
                    aggregated[rowVal][colVal] = null;
                } else {
                    switch (aggFunction) {
                        case 'SUM':
                            aggregated[rowVal][colVal] = values.reduce((a, b) => a + b, 0);
                            break;
                        case 'AVG':
                            aggregated[rowVal][colVal] = values.reduce((a, b) => a + b, 0) / values.length;
                            break;
                        case 'COUNT':
                            aggregated[rowVal][colVal] = values.length;
                            break;
                        case 'MAX':
                            aggregated[rowVal][colVal] = Math.max(...values);
                            break;
                        case 'MIN':
                            aggregated[rowVal][colVal] = Math.min(...values);
                            break;
                        default:
                            aggregated[rowVal][colVal] = values.reduce((a, b) => a + b, 0);
                    }
                }
            });
        });

        // 행별 총계
        const rowTotals = {};
        sortedRowValues.forEach(rowVal => {
            const values = sortedColValues.map(colVal => aggregated[rowVal][colVal]).filter(v => v !== null);
            if (values.length > 0) {
                switch (aggFunction) {
                    case 'SUM':
                        rowTotals[rowVal] = values.reduce((a, b) => a + b, 0);
                        break;
                    case 'AVG':
                        rowTotals[rowVal] = values.reduce((a, b) => a + b, 0) / values.length;
                        break;
                    case 'COUNT':
                        rowTotals[rowVal] = values.length;
                        break;
                    case 'MAX':
                        rowTotals[rowVal] = Math.max(...values);
                        break;
                    case 'MIN':
                        rowTotals[rowVal] = Math.min(...values);
                        break;
                    default:
                        rowTotals[rowVal] = values.reduce((a, b) => a + b, 0);
                }
            } else {
                rowTotals[rowVal] = null;
            }
        });

        // 열별 총계
        const colTotals = {};
        sortedColValues.forEach(colVal => {
            const values = sortedRowValues.map(rowVal => aggregated[rowVal][colVal]).filter(v => v !== null);
            if (values.length > 0) {
                switch (aggFunction) {
                    case 'SUM':
                        colTotals[colVal] = values.reduce((a, b) => a + b, 0);
                        break;
                    case 'AVG':
                        colTotals[colVal] = values.reduce((a, b) => a + b, 0) / values.length;
                        break;
                    case 'COUNT':
                        colTotals[colVal] = values.length;
                        break;
                    case 'MAX':
                        colTotals[colVal] = Math.max(...values);
                        break;
                    case 'MIN':
                        colTotals[colVal] = Math.min(...values);
                        break;
                    default:
                        colTotals[colVal] = values.reduce((a, b) => a + b, 0);
                }
            } else {
                colTotals[colVal] = null;
            }
        });

        // 전체 총계
        const grandTotal = Object.values(rowTotals).filter(v => v !== null);
        const finalGrandTotal = grandTotal.length > 0 ? 
            (aggFunction === 'SUM' || aggFunction === 'COUNT' ? grandTotal.reduce((a, b) => a + b, 0) :
             aggFunction === 'AVG' ? grandTotal.reduce((a, b) => a + b, 0) / grandTotal.length :
             aggFunction === 'MAX' ? Math.max(...grandTotal) :
             aggFunction === 'MIN' ? Math.min(...grandTotal) : grandTotal.reduce((a, b) => a + b, 0)) : null;

        return {
            rows: sortedRowValues,
            cols: sortedColValues,
            data: aggregated,
            rowTotals,
            colTotals,
            grandTotal: finalGrandTotal,
            rowColMap // 원본 데이터 인덱스 반환
        };
    }, [data, rowField, colField, valueField, aggFunction, sortByTotal]);

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

    // 히트맵 색상 계산
    const getHeatmapColor = (displayValue, min, max, scheme) => {
        if (displayValue === null || min === max) return 'transparent';
        
        const ratio = (displayValue - min) / (max - min);
        
        const schemes = {
            blue: {
                low: [239, 246, 255],
                mid: [59, 130, 246],
                high: [29, 78, 216]
            },
            green: {
                low: [240, 253, 244],
                mid: [34, 197, 94],
                high: [21, 128, 61]
            },
            red: {
                low: [254, 242, 242],
                mid: [239, 68, 68],
                high: [153, 27, 27]
            },
            purple: {
                low: [250, 245, 255],
                mid: [168, 85, 247],
                high: [126, 34, 206]
            }
        };

        const colors = schemes[scheme] || schemes.blue;
        
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
        
        // 퍼센트 모드일 때
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

    // Min/Max 계산 (표시 모드에 따라)
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
        
        // 퍼센트 모드일 때는 0-100 범위로 조정
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
        if (!containerRef) return;
        if (!isZoomed) {
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
        setIsZoomed(!isZoomed);
        if (onZoomChange) onZoomChange(!isZoomed);
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

    // CSV 내보내기 - 개선된 버전
    const exportAsCSV = () => {
        if (!pivotData) return;
        
        const csvRows = [];
        
        // 값을 CSV 형식에 맞게 변환 (따옴표로 감싸기, 특수문자 이스케이프)
        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            // 따옴표가 있으면 두 개의 따옴표로 변경
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        // 헤더
        const headers = [rowField, ...pivotData.cols];
        if (showTotals) headers.push('총계');
        csvRows.push(headers.map(escapeCSV).join(','));
        
        // 데이터 행
        pivotData.rows.forEach(rowVal => {
            const row = [rowVal];
            pivotData.cols.forEach(colVal => {
                const val = pivotData.data[rowVal]?.[colVal];
                const displayVal = getDisplayValue(val, rowVal, colVal);
                // 표시 형식에 맞게 값 변환
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
        
        // 총계 행
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
        
        // BOM 추가 (Excel에서 한글 깨짐 방지)
        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pivot_${Date.now()}.csv`;
        link.click();
    };

    // 배경색에서 글자색을 계산하는 함수 (히트맵 포함)
    const getTextColor = (bgColor, isHeader = false, isTotal = false) => {
        // 총계 행인 경우
        if (isTotal) {
            return '#38bdf8'; // 총계는 밝은 청색
        }
        // 헤더인 경우
        if (isHeader) {
            return headerTextColor;
        }
        
        // 히트맵 색상인 경우
        if (bgColor && bgColor.startsWith('rgb')) {
            const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                // 밝기 계산
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                // 밝은 배경에는 검정, 어두운 배경에는 흰색
                return brightness > 150 ? '#1e293b' : '#ffffff';
            }
        }
        
        // 기본 색상
        return textColor;
    };

    // PNG 이미지로 저장 (테이블 그대로 캡처)
    const exportAsPNG = async () => {
        if (!pivotData || !containerRef) return;
        
        const tableEl = containerRef.querySelector('table');
        if (!tableEl) return;
        
        try {
            // html2canvas가 전역에 있는지 확인
            if (typeof html2canvas === 'undefined') {
                // html2canvas를 동적으로 로드 시도
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }
            
            if (typeof html2canvas === 'undefined') {
                // 그래도 없으면 수동 캔버스 방식 사용
                await manualCanvasExport(tableEl);
                return;
            }
            
            // 테이블의 실제 크기 계산
            const tableRect = tableEl.getBoundingClientRect();
            const scrollWidth = tableEl.scrollWidth;
            const scrollHeight = tableEl.scrollHeight;
            
            // 래퍼 div 생성하여 테이블을 정확한 크기로 렌더링
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
            
            // 테이블 클론 생성 (깊은 복사)
            const tableClone = tableEl.cloneNode(true);
            
            // 테이블 스타일 복사 - 화면에 보이는 그대로
            tableClone.style.backgroundColor = tableBgColor;
            tableClone.style.color = textColor;
            tableClone.style.fontSize = `${compactMode ? fontSize - 2 : fontSize}px`;
            tableClone.style.fontFamily = fontFamily;
            tableClone.style.width = scrollWidth + 'px';
            tableClone.style.minWidth = scrollWidth + 'px';
            tableClone.style.margin = '0';
            tableClone.style.borderCollapse = 'collapse';
            tableClone.style.tableLayout = 'auto';
            
            // 모든 행과 셀을 순회하며 스타일 복사
            const cloneRows = tableClone.querySelectorAll('tr');
            const originalRows = tableEl.querySelectorAll('tr');
            
            cloneRows.forEach((cloneRow, rowIdx) => {
                const originalRow = originalRows[rowIdx];
                if (!originalRow) return;
                
                // 행 스타일 복사
                const originalRowStyle = window.getComputedStyle(originalRow);
                cloneRow.style.backgroundColor = originalRowStyle.backgroundColor;
                
                const cloneCells = cloneRow.querySelectorAll('th, td');
                const originalCells = originalRow.querySelectorAll('th, td');
                
                cloneCells.forEach((cloneCell, cellIdx) => {
                    const originalCell = originalCells[cellIdx];
                    if (!originalCell) return;
                    
                    // 스타일 복사
                    const computedStyle = window.getComputedStyle(originalCell);
                    
                    // 셀의 실제 크기 유지
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
                    cloneCell.style.padding = `${compactMode ? cellPadding / 2 : cellPadding}px`;
                    cloneCell.style.textAlign = computedStyle.textAlign || textAlign;
                    cloneCell.style.fontWeight = computedStyle.fontWeight;
                    cloneCell.style.fontFamily = computedStyle.fontFamily;
                    cloneCell.style.fontSize = computedStyle.fontSize;
                    cloneCell.style.whiteSpace = 'nowrap';
                    cloneCell.style.overflow = 'visible';
                    cloneCell.style.boxSizing = 'border-box';
                    
                    // sticky 속성 제거 (캡처 시 문제가 됨)
                    cloneCell.style.position = 'static';
                    cloneCell.style.left = 'auto';
                    cloneCell.style.top = 'auto';
                    cloneCell.style.zIndex = 'auto';
                });
            });
            
            // thead 스타일 복사
            const cloneThead = tableClone.querySelector('thead');
            const originalThead = tableEl.querySelector('thead');
            if (cloneThead && originalThead) {
                cloneThead.style.backgroundColor = headerBgColor;
            }
            
            wrapper.appendChild(tableClone);
            document.body.appendChild(wrapper);
            
            // 테이블 영역만 캡처 (고화질)
            const canvas = await html2canvas(tableClone, {
                backgroundColor: tableBgColor,
                scale: 3, // 더 높은 해상도
                useCORS: true,
                logging: false,
                allowTaint: true,
                windowWidth: scrollWidth + 40,
                windowHeight: scrollHeight + 40,
                onclone: (clonedDoc, clonedElement) => {
                    // 클론된 문서에서 추가 조정
                    clonedElement.style.width = scrollWidth + 'px';
                }
            });
            
            // 래퍼 제거
            document.body.removeChild(wrapper);
            
            // 다운로드
            const link = document.createElement('a');
            link.download = `pivot_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
        } catch (err) {
            console.error('PNG export error:', err);
            // 폴백: 수동 캔버스 방식
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
    
    // 수동 캔버스 내보내기 (html2canvas 없는 경우)
    const manualCanvasExport = async (tableEl) => {
        const scale = 2;
        
        // 테이블 크기
        const width = tableEl.scrollWidth * scale;
        const height = tableEl.scrollHeight * scale;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // 배경색 설정
        ctx.fillStyle = tableBgColor;
        ctx.fillRect(0, 0, width, height);
        
        // 캡처 시작
        ctx.scale(scale, scale);
        ctx.textBaseline = 'middle';
        
        const rows = tableEl.querySelectorAll('tr');
        let y = 0;
        
        for (const row of rows) {
            const cells = row.querySelectorAll('th, td');
            let x = 0;
            let maxHeight = 0;
            
            for (const cell of cells) {
                const style = window.getComputedStyle(cell);
                
                // 셀 크기
                const cellWidth = cell.offsetWidth || 100;
                const cellHeight = cell.offsetHeight || 30;
                maxHeight = Math.max(maxHeight, cellHeight);
                
                // 배경색
                const bgColor = style.backgroundColor;
                if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(x, y, cellWidth, cellHeight);
                }
                
                // 테두리
                const borderColor = style.borderColor;
                const borderWidth = parseInt(style.borderWidth) || 1;
                if (borderWidth > 0 && borderColor) {
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = borderWidth;
                    ctx.strokeRect(x, y, cellWidth, cellHeight);
                }
                
                // 텍스트
                const color = style.color;
                const fontSize = parseInt(style.fontSize) || 14;
                const fontWeight = style.fontWeight || 'normal';
                const textAlign = style.textAlign || 'left';
                
                ctx.fillStyle = color;
                ctx.font = `${fontWeight} ${fontSize}px ${style.fontFamily || 'sans-serif'}`;
                
                const text = cell.textContent.trim();
                const textX = textAlign === 'center' ? x + cellWidth / 2 :
                              textAlign === 'right' ? x + cellWidth - 8 : x + 8;
                
                ctx.fillText(text, textX, y + cellHeight / 2);
                
                x += cellWidth;
            }
            y += maxHeight || 30;
        }
        
        // 다운로드
        const link = document.createElement('a');
        link.download = `pivot_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // 클립보드에 HTML 표 복사
    const copyToClipboard = async () => {
        if (!pivotData) return;
        
        let html = '<table border="1" style="border-collapse: collapse; font-family: Arial, sans-serif;">';
        
        // 헤더
        html += '<thead><tr>';
        html += `<th style="background: ${headerBgColor}; color: ${headerTextColor}; padding: 8px; text-align: center;">${rowField}</th>`;
        pivotData.cols.forEach(col => {
            html += `<th style="background: ${headerBgColor}; color: ${headerTextColor}; padding: 8px; text-align: center;">${col}</th>`;
        });
        if (showTotals) {
            html += `<th style="background: ${headerBgColor}; color: #38bdf8; padding: 8px; text-align: center;">총계</th>`;
        }
        html += '</tr></thead><tbody>';
        
        // 데이터 행
        pivotData.rows.forEach(rowVal => {
            html += '<tr>';
            html += `<td style="background: ${tableBgColor}; color: ${textColor}; padding: 8px; font-weight: bold; text-align: ${textAlign};">${rowVal}</td>`;
            pivotData.cols.forEach(colVal => {
                const rawVal = pivotData.data[rowVal]?.[colVal];
                const displayVal = getDisplayValue(rawVal, rowVal, colVal);
                const displayStr = formatValue(displayVal, displayMode !== 'value');
                
                // 히트맵 색상 계산 및 글자색 자동 조정
                let bgColor = 'transparent';
                let color = textColor;
                if (showHeatmap && rawVal !== null) {
                    bgColor = getHeatmapColor(displayVal, minVal, maxVal, colorScheme);
                    color = getTextColor(bgColor);
                }
                
                html += `<td style="background: ${bgColor}; color: ${color}; padding: 8px; text-align: ${textAlign};">${displayStr}</td>`;
            });
            if (showTotals) {
                const totalVal = pivotData.rowTotals[rowVal];
                const displayTotal = getDisplayValue(totalVal, rowVal, 'Total');
                html += `<td style="background: ${headerBgColor}; color: #38bdf8; padding: 8px; text-align: ${textAlign}; font-weight: bold;">${formatValue(displayTotal, displayMode !== 'value')}</td>`;
            }
            html += '</tr>';
        });
        
        // 총계 행
        if (showTotals) {
            html += '<tr>';
            html += `<td style="background: ${headerBgColor}; color: #38bdf8; padding: 8px; font-weight: bold; text-align: ${textAlign};">총계</td>`;
            pivotData.cols.forEach(colVal => {
                const val = pivotData.colTotals[colVal];
                const displayVal = getDisplayValue(val, 'Total', colVal);
                // 히트맵 색상 계산 및 글자색 자동 조정
                let bgColor = 'transparent';
                let color = textColor;
                if (showHeatmap && val !== null) {
                    bgColor = getHeatmapColor(displayVal, minVal, maxVal, colorScheme);
                    color = getTextColor(bgColor);
                }
                html += `<td style="background: ${bgColor}; color: ${color}; padding: 8px; text-align: ${textAlign}; font-weight: bold;">${formatValue(displayVal, displayMode !== 'value')}</td>`;
            });
            const grandVal = pivotData.grandTotal;
            const displayGrand = getDisplayValue(grandVal, 'Total', 'Total');
            html += `<td style="background: #0f172a; color: white; padding: 8px; text-align: ${textAlign}; font-weight: bold;">${formatValue(displayGrand, displayMode !== 'value')}</td>`;
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
        
        // HEX 색상을 RGB로 변환
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 밝기 계산 (YIQ 방식)
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        
        // 밝으면 검정, 어두우면 흰색
        return brightness > 128 ? '#1e293b' : '#e2e8f0';
    };

    // 배경색이 변경되면 텍스트색 자동 조정
    useEffect(() => {
        setTextColor(getContrastColor(tableBgColor));
    }, [tableBgColor]);

    // 헤더 배경색 변경 시 글자색 자동 조정
    useEffect(() => {
        setHeaderTextColor(getContrastColor(headerBgColor));
    }, [headerBgColor]);

    // 활성 탭 클래스
    const activeTabClass = "px-4 py-2 text-sm font-bold text-brand-400 border-b-2 border-brand-500 bg-slate-800/80 transition-colors";
    const inactiveTabClass = "px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors";

    // 워터마크 렌더링
    const renderWatermark = () => {
        if (!watermarkEnabled) return null;
        
        const style = {
            position: 'absolute',
            pointerEvents: 'none',
            color: watermarkColor,
            opacity: 0.15,
            fontWeight: 'bold',
            fontSize: '24px',
            transform: 'rotate(-45deg)',
            whiteSpace: 'nowrap',
            zIndex: 1,
        };
        
        if (watermarkDesign === 'single') {
            return (
                <div style={{ 
                    ...style, 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                    fontSize: '48px'
                }}>
                    {watermarkText}
                </div>
            );
        }
        
        if (watermarkDesign === 'multiple') {
            const items = [];
            for (let i = 0; i < watermarkGridSize; i++) {
                for (let j = 0; j < watermarkGridSize; j++) {
                    items.push(
                        <div key={`${i}-${j}`} style={{
                            ...style,
                            top: `${(i / watermarkGridSize) * 100}%`,
                            left: `${(j / watermarkGridSize) * 100}%`,
                        }}>
                            {watermarkText}
                        </div>
                    );
                }
            }
            return <div className="absolute inset-0 overflow-hidden">{items}</div>;
        }
        
        if (watermarkDesign === 'corner') {
            return (
                <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                    <div style={{ ...style, top: '10%', left: '10%', fontSize: '32px' }}>{watermarkText}</div>
                    <div style={{ ...style, top: '10%', right: '10%', fontSize: '32px' }}>{watermarkText}</div>
                    <div style={{ ...style, bottom: '10%', left: '10%', fontSize: '32px' }}>{watermarkText}</div>
                    <div style={{ ...style, bottom: '10%', right: '10%', fontSize: '32px' }}>{watermarkText}</div>
                </div>
            );
        }
        
        return null;
    };

    return (
        <div ref={setContainerRef} className="flex flex-col h-full relative rounded-lg overflow-hidden">
            {renderWatermark()}

            {/* 첫 번째 줄: 탭 (왼쪽) + 버튼 (오른쪽) */}
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 border-b border-slate-800 shrink-0 z-10">
                {/* 탭 - 왼쪽 정렬 */}
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setActiveDesignTab('display')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${activeDesignTab === 'display' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>📊 표시</button>
                    <button onClick={() => setActiveDesignTab('design')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${activeDesignTab === 'design' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>🎨 색상/배경</button>
                    <button onClick={() => setActiveDesignTab('watermark')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${activeDesignTab === 'watermark' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>🔒 대외비</button>
                </div>
                
                {/* 버튼들 - 오른쪽 정렬 */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={copyToClipboard}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                        📋 표 복사
                    </button>
                    <button 
                        onClick={exportAsPNG}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                        🖼️ PNG
                    </button>
                    <button 
                        onClick={exportAsCSV}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                        📊 CSV
                    </button>
                    <button 
                        onClick={toggleZoom}
                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                        {isZoomed ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                닫기
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                확대
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 디자인 패널 - 표시 탭 선택 시 */}
            {(activeDesignTab === 'display' || activeDesignTab === 'design' || activeDesignTab === 'watermark') && (
                <div className="bg-slate-900 border-b border-slate-700 p-4 shrink-0">
                    {/* 표시 탭: 피벗 설정 + 옵션 */}
                    {activeDesignTab === 'display' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 피벗 설정 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                                    📊 피벗 설정
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-400 w-8">행</label>
                                        <select 
                                            value={rowField} 
                                            onChange={e => setRowField(e.target.value)}
                                            className="flex-1 bg-slate-950/80 text-slate-200 px-3 py-2 text-sm rounded-lg border border-slate-700/50 outline-none focus:border-brand-500"
                                        >
                                            {textColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-400 w-8">열</label>
                                        <select 
                                            value={colField} 
                                            onChange={e => setColField(e.target.value)}
                                            className="flex-1 bg-slate-950/80 text-slate-200 px-3 py-2 text-sm rounded-lg border border-slate-700/50 outline-none focus:border-brand-500"
                                        >
                                            <option value="">-- 단일 열 --</option>
                                            {textColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-400 w-8">값</label>
                                        <select 
                                            value={valueField} 
                                            onChange={e => setValueField(e.target.value)}
                                            className="flex-1 bg-slate-950/80 text-slate-200 px-3 py-2 text-sm rounded-lg border border-slate-700/50 outline-none focus:border-brand-500"
                                        >
                                            {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-400 w-8">집계</label>
                                        <select 
                                            value={aggFunction} 
                                            onChange={e => setAggFunction(e.target.value)}
                                            className="flex-1 bg-slate-950/80 text-slate-200 px-3 py-2 text-sm rounded-lg border border-slate-700/50 outline-none focus:border-brand-500"
                                        >
                                            <option value="SUM">∑ 합계</option>
                                            <option value="AVG">ø 평균</option>
                                            <option value="COUNT"># 개수</option>
                                            <option value="MAX">↑ 최대</option>
                                            <option value="MIN">↓ 최소</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 시각화 옵션 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    🎨 시각화
                                </h3>
                                <div className="space-y-3">
                                    <label 
                                        className="flex items-center gap-3 text-sm font-medium bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-700/50 cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
                                        onClick={() => setShowHeatmap(!showHeatmap)}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${showHeatmap ? 'bg-brand-500' : 'bg-slate-600'}`}>
                                            {showHeatmap && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            )}
                                        </div>
                                        <span className="text-slate-200">히트맵 표시</span>
                                    </label>
                                    
                                    {showHeatmap && (
                                        <div className="flex gap-2 pl-4">
                                            {['blue', 'green', 'red', 'purple'].map(scheme => (
                                                <button
                                                    key={scheme}
                                                    onClick={() => setColorScheme(scheme)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${colorScheme === scheme ? 'border-white scale-110 shadow-lg' : 'border-slate-600 opacity-70 hover:opacity-100'}`}
                                                    style={{ 
                                                        background: scheme === 'blue' ? 'linear-gradient(135deg, #eff6ff, #1d4ed8)' :
                                                                   scheme === 'green' ? 'linear-gradient(135deg, #f0fdf4, #15803d)' :
                                                                   scheme === 'red' ? 'linear-gradient(135deg, #fef2f2, #991b1b)' :
                                                                   'linear-gradient(135deg, #faf5ff, #7e22ce)'
                                                    }}
                                                    title={scheme === 'blue' ? '파랑' : scheme === 'green' ? '초록' : scheme === 'red' ? '빨강' : '보라'}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <label 
                                        className="flex items-center gap-3 text-sm font-medium bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-700/50 cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
                                        onClick={() => setShowTotals(!showTotals)}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${showTotals ? 'bg-brand-500' : 'bg-slate-600'}`}>
                                            {showTotals && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            )}
                                        </div>
                                        <span className="text-slate-200">총계 표시</span>
                                    </label>
                                </div>
                            </div>

                            {/* 표시 형식 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    📋 표시 형식
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">표시 모드</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'value', label: '값', icon: '🔢' },
                                                { value: 'grandTotalPct', label: '총계 %', icon: '📊' },
                                                { value: 'rowPct', label: '행 %', icon: '📋' },
                                                { value: 'colPct', label: '열 %', icon: '📑' }
                                            ].map(({ value, label, icon }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setDisplayMode(value)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${displayMode === value ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-950/50 text-slate-400 hover:text-white border border-slate-700/50'}`}
                                                >
                                                    {icon} {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">값 서식</label>
                                        <select 
                                            value={valueFormat} 
                                            onChange={e => setValueFormat(e.target.value)}
                                            className="w-full bg-slate-950/80 text-slate-200 px-4 py-2.5 text-sm rounded-xl border border-slate-700/50 outline-none focus:border-brand-500"
                                        >
                                            <option value="comma">1,234 (쉼표)</option>
                                            <option value="krw">₩1,234 (원화)</option>
                                            <option value="usd">$1,234 (USD)</option>
                                            <option value="percent">12.3% (퍼센트)</option>
                                            <option value="compact">1.2만 (축약)</option>
                                            <option value="none">원본</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeDesignTab === 'design' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* 셀 크기 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    📏 셀 크기
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">셀 패딩: {cellPadding}px</label>
                                        <input 
                                            type="range" 
                                            min="4" 
                                            max="24" 
                                            value={cellPadding}
                                            onChange={(e) => setCellPadding(Number(e.target.value))}
                                            className="w-full accent-brand-500 h-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">글자 크기: {fontSize}px</label>
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="20" 
                                            value={fontSize}
                                            onChange={(e) => setFontSize(Number(e.target.value))}
                                            className="w-full accent-brand-500 h-2"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={compactMode} 
                                            onChange={e => setCompactMode(e.target.checked)}
                                            className="w-4 h-4 accent-brand-500" 
                                        />
                                        컴팩트 모드
                                    </label>
                                </div>
                            </div>

                            {/* 텍스트 정렬 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    ↔️ 텍스트 정렬
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">데이터 정렬</label>
                                        <div className="flex gap-1">
                                            {[
                                                { value: 'left', icon: '⬅️' },
                                                { value: 'center', icon: '↔️' },
                                                { value: 'right', icon: '➡️' }
                                            ].map(({ value, icon }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setTextAlign(value)}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${textAlign === value ? 'bg-brand-600 text-white' : 'bg-slate-950/50 text-slate-400 border border-slate-700/50 hover:text-white'}`}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">헤더 정렬</label>
                                        <div className="flex gap-1">
                                            {[
                                                { value: 'left', icon: '⬅️' },
                                                { value: 'center', icon: '↔️' },
                                                { value: 'right', icon: '➡️' }
                                            ].map(({ value, icon }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setHeaderTextAlign(value)}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${headerTextAlign === value ? 'bg-brand-600 text-white' : 'bg-slate-950/50 text-slate-400 border border-slate-700/50 hover:text-white'}`}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 테두리 스타일 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    🔲 테두리
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">두께: {borderWidth}px</label>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="3" 
                                            value={borderWidth}
                                            onChange={(e) => setBorderWidth(Number(e.target.value))}
                                            className="w-full accent-brand-500 h-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">스타일</label>
                                        <div className="flex gap-1">
                                            {['solid', 'dashed', 'dotted'].map(style => (
                                                <button
                                                    key={style}
                                                    onClick={() => setBorderStyle(style)}
                                                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${borderStyle === style ? 'bg-brand-600 text-white' : 'bg-slate-950/50 text-slate-400 border border-slate-700/50 hover:text-white'}`}
                                                >
                                                    {style === 'solid' ? '━' : style === 'dashed' ? ' - ' : ' · '}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 배경색 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    🎨 배경색
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">표 배경</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[
                                                { color: '#1e293b', label: '다크' },
                                                { color: '#0f172a', label: '더 다크' },
                                                { color: '#ffffff', label: '화이트' },
                                                { color: '#f1f5f9', label: '라이트' }
                                            ].map(({ color, label }) => (
                                                <button 
                                                    key={color} 
                                                    onClick={() => setTableBgColor(color)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tableBgColor === color ? 'bg-brand-500/20 border border-brand-500 text-brand-400' : 'bg-slate-950/50 border border-slate-700/50 text-slate-400 hover:text-white'}`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">헤더</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[
                                                { color: '#334155', label: '기본' },
                                                { color: '#1e293b', label: '다크' },
                                                { color: '#475569', label: '라이트' },
                                                { color: '#2563eb', label: '파랑' },
                                                { color: '#7c3aed', label: '보라' }
                                            ].map(({ color, label }) => (
                                                <button 
                                                    key={color} 
                                                    onClick={() => setHeaderBgColor(color)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${headerBgColor === color ? 'bg-brand-500/20 border border-brand-500 text-brand-400' : 'bg-slate-950/50 border border-slate-700/50 text-slate-400 hover:text-white'}`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={showRowStripe} 
                                            onChange={e => setShowRowStripe(e.target.checked)}
                                            className="w-4 h-4 accent-brand-500" 
                                        />
                                        줄무늬 표시
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeDesignTab === 'watermark' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 워터마크 설정 */}
                            <div className="bg-gradient-to-br from-red-900/40 to-slate-900 p-4 rounded-xl border border-red-500/30 shadow-lg shadow-red-500/5">
                                <h3 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span>
                                    🔒 워터마크 설정
                                </h3>
                                
                                <label 
                                    className="flex items-center gap-3 text-sm font-bold mb-4 bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-700/50 cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all"
                                    onClick={() => setLocalWatermarkEnabled(!localWatermarkEnabled)}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${localWatermarkEnabled ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-slate-700'}`}>
                                        {localWatermarkEnabled ? (
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
                                            value={localWatermarkText}
                                            onChange={(e) => {
                                                if (!propWatermarkEnabled) {
                                                    setLocalWatermarkText(e.target.value);
                                                }
                                            }}
                                            placeholder="예: CONFIDENTIAL"
                                            className="w-full bg-slate-950/80 text-slate-200 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-700/50 outline-none focus:border-red-500"
                                            disabled={!watermarkEnabled}
                                        />
                                    </div>
                                    
                                    {/* 색상 선택 */}
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
                                                        if (!propWatermarkEnabled) {
                                                            setLocalWatermarkColor(color);
                                                        }
                                                    }}
                                                    disabled={!watermarkEnabled}
                                                    className={`w-7 h-7 rounded-full border-2 hover:border-white transition-all disabled:opacity-50 ${localWatermarkColor === color ? 'border-white scale-110 shadow-lg' : 'border-slate-600'}`}
                                                    style={{ backgroundColor: color }}
                                                    title={name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 디자인 선택 */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    🎨 디자인 선택
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => setLocalWatermarkDesign('single')}
                                        disabled={!watermarkEnabled}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${watermarkDesign === 'single' ? 'border-red-500 bg-red-500/10' : 'border-slate-600/50 hover:border-slate-400 disabled:opacity-40'}`}
                                    >
                                        <span className="text-2xl font-black text-red-500 -rotate-45">CONFIDENTIAL</span>
                                        <span className="text-xs font-bold text-slate-400">크게 하나</span>
                                    </button>
                                    <button 
                                        onClick={() => setLocalWatermarkDesign('multiple')}
                                        disabled={!watermarkEnabled}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${watermarkDesign === 'multiple' ? 'border-red-500 bg-red-500/10' : 'border-slate-600/50 hover:border-slate-400 disabled:opacity-40'}`}
                                    >
                                        <div className="grid grid-cols-2 gap-1">
                                            {[...Array(4)].map((_, i) => (
                                                <span key={i} className="text-xs text-red-500 -rotate-45 font-bold">C</span>
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">다수 배치</span>
                                    </button>
                                    <button 
                                        onClick={() => setLocalWatermarkDesign('corner')}
                                        disabled={!watermarkEnabled}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${watermarkDesign === 'corner' ? 'border-red-500 bg-red-500/10' : 'border-slate-600/50 hover:border-slate-400 disabled:opacity-40'}`}
                                    >
                                        <div className="relative w-10 h-10">
                                            <span className="absolute top-0 left-0 text-xs text-red-500">C</span>
                                            <span className="absolute bottom-0 right-0 text-xs text-red-500">C</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">코너 배치</span>
                                    </button>
                                </div>
                                
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
                                            className="w-full accent-red-500 h-2"
                                            disabled={!watermarkEnabled}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
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
                                            color: headerTextColor,
                                            borderColor: borderColor,
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
                                                color: headerTextColor,
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
                                                color: sortByTotal ? 'white' : '#38bdf8' 
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
                                    <tr key={rowVal} style={showRowStripe && rowIndex % 2 === 1 ? { backgroundColor: stripeColor } : {}}>
                                        <td className="sticky left-0 z-10 font-semibold whitespace-nowrap" 
                                            style={{ 
                                                backgroundColor: tableBgColor, 
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
                                            const bgColor = showHeatmap && rawValue !== null 
                                                ? getHeatmapColor(displayValue, minVal, maxVal, colorScheme) 
                                                : 'transparent';
                                            const cellTextColor = showHeatmap && rawValue !== null && minVal !== maxVal
                                                ? getTextColor(bgColor)
                                                : textColor;
                                            
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
                                                    color: '#38bdf8' 
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
                                                color: '#38bdf8'
                                            }}>
                                            총계
                                        </td>
                                        {pivotData.cols.map(colVal => {
                                            const val = pivotData.colTotals[colVal];
                                            const displayVal = getDisplayValue(val, 'Total', colVal);
                                            const bgColor = showHeatmap && val !== null 
                                                ? getHeatmapColor(displayVal, minVal, maxVal, colorScheme)
                                                : 'transparent';
                                            const cellTextColor = showHeatmap && val !== null && minVal !== maxVal
                                                ? getTextColor(bgColor)
                                                : textColor;
                                            
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
                                                backgroundColor: '#0f172a', 
                                                borderColor: borderColor,
                                                borderWidth: `${borderWidth}px`,
                                                borderStyle: borderStyle,
                                                padding: `${compactMode ? cellPadding / 2 : cellPadding}px`,
                                                textAlign: textAlign,
                                                color: 'white'
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
            <div className="bg-slate-800/50 border-t border-slate-700 px-4 py-2 text-xs text-slate-500 shrink-0 flex justify-between">
                <span>
                    {pivotData && (
                        <>행: {pivotData.rows.length} × 열: {pivotData.cols.length} = {pivotData.rows.length * pivotData.cols.length}개 셀</>
                    )}
                </span>
                <span>💡 더블클릭: 상세 데이터 | 총계 클릭: 정렬</span>
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
