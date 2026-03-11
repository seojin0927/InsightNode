import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

const DataGrid = ({ data, columns, onUpdate, readOnly = false, watermarkEnabled = false, watermarkText = 'CONFIDENTIAL', watermarkDesign = 'single', onZoomChange, onRequestZoom, hideToolbar = false }) => {
    const [scroll, setScroll] = useState({ top: 0, left: 0 });
    const [edit, setEdit] = useState(null);
    const [colWidths, setColWidths] = useState({});
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);
    const [copyNotification, setCopyNotification] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef(null);
    const gridContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
                setExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleZoom = () => {
        if (onRequestZoom) { onRequestZoom(); return; }
        if (!gridContainerRef.current) return;
        if (!isZoomed) {
            // 확대: 현재 div 박스를 확장 (화면 전체 100%)
            gridContainerRef.current.style.position = 'fixed';
            gridContainerRef.current.style.top = '0';
            gridContainerRef.current.style.left = '0';
            gridContainerRef.current.style.right = '0';
            gridContainerRef.current.style.bottom = '0';
            gridContainerRef.current.style.width = '100%';
            gridContainerRef.current.style.height = '100%';
            gridContainerRef.current.style.zIndex = '9999';
            gridContainerRef.current.style.background = '#0f172a';
        } else {
            // 축소: 원래 상태로 복원
            gridContainerRef.current.style.position = '';
            gridContainerRef.current.style.top = '';
            gridContainerRef.current.style.left = '';
            gridContainerRef.current.style.right = '';
            gridContainerRef.current.style.bottom = '';
            gridContainerRef.current.style.width = '';
            gridContainerRef.current.style.height = '';
            gridContainerRef.current.style.zIndex = '';
            gridContainerRef.current.style.background = '';
        }
        setIsZoomed(!isZoomed);
        if (onZoomChange) onZoomChange(!isZoomed);
    };

    const rowH = 42;
    const rowNumW = 60;
    const viewH = 800;
    const over = 20;

    // 워터마크 생성 함수
    const generateWatermarkHTML = (design, text) => {
        if (design === 'single') {
            return `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: bold; color: rgba(200, 0, 0, 0.08); white-space: nowrap; pointer-events: none; z-index: 9999;">${text}</div>`;
        } else if (design === 'multiple') {
            const watermarks = [];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    watermarks.push(`<div style="position: fixed; top: ${i * 33 + 15}%; left: ${j * 33 + 10}%; transform: rotate(-45deg); font-size: 48px; font-weight: bold; color: rgba(200, 0, 0, 0.06); white-space: nowrap; pointer-events: none; z-index: 9999;">${text}</div>`);
                }
            }
            return watermarks.join('');
        } else if (design === 'corner') {
            return `
                <div style="position: fixed; top: 20px; right: 20px; font-size: 24px; font-weight: bold; color: rgba(200, 0, 0, 0.15); z-index: 9999;">${text}</div>
                <div style="position: fixed; bottom: 20px; left: 20px; font-size: 24px; font-weight: bold; color: rgba(200, 0, 0, 0.15); z-index: 9999;">${text}</div>
            `;
        }
        return '';
    };

    // Export functions
    const exportAsHTML = () => {
        const watermarkHTML = watermarkEnabled ? generateWatermarkHTML(watermarkDesign, watermarkText) : '';
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VaultSheet Data Export</title>
    <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; background: #0f172a; color: #e2e8f0; }
        h1 { color: #e2e8f0; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; background: #1e293b; }
        th { background: #334155; padding: 12px; text-align: left; border: 1px solid #475569; color: #94a3b8; font-weight: 600; }
        td { padding: 10px 12px; border: 1px solid #334155; color: #cbd5e1; }
        tr:nth-child(even) { background: #1e293b; }
        tr:hover { background: #334155; }
        .info { color: #64748b; margin-top: 10px; font-size: 12px; }
    </style>
</head>
<body>
    ${watermarkHTML}
    <h1>VaultSheet Data Export</h1>
    <table>
        <thead>
            <tr>
                <th>#</th>
                ${columns.map(c => `<th>${c}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${sortedData.map((row, idx) => `
            <tr>
                <td>${idx + 1}</td>
                ${columns.map(c => `<td>${row[c] ?? ''}</td>`).join('')}
            </tr>
            `).join('')}
        </tbody>
    </table>
    <p class="info">Total rows: ${sortedData.length} | Exported: ${new Date().toLocaleString()}</p>
</body>
</html>`;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.download = `data_${Date.now()}.html`;
        link.href = URL.createObjectURL(blob);
        link.click();
    };

    const exportAsJSON = () => {
        const jsonContent = JSON.stringify(sortedData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `data_${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
    };

    const exportAsExcel = () => {
        const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Data">
<Table>
<Row>
<Cell><Data ss:Type="String">#</Data></Cell>
${columns.map(c => `<Cell><Data ss:Type="String">${c}</Data></Cell>`).join('')}
</Row>
${sortedData.map((row, idx) => `
<Row>
<Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
${columns.map(c => `<Cell><Data ss:Type="String">${String(row[c] ?? '').replace(/</g, '<').replace(/>/g, '>')}</Data></Cell>`).join('')}
</Row>
`).join('')}
</Table>
</Worksheet>
</Workbook>`;
        
        const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.download = `data_${Date.now()}.xls`;
        link.href = URL.createObjectURL(blob);
        link.click();
    };

    // Sorting
    const sortedData = useMemo(() => {
        if (!sortCol) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortCol];
            const bVal = b[sortCol];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
            }
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
    }, [data, sortCol, sortDir]);

    // Filtering
    const filteredData = useMemo(() => {
        if (!searchTerm) return sortedData;
        const term = searchTerm.toLowerCase();
        return sortedData.filter(row => 
            Object.values(row).some(val => 
                val != null && String(val).toLowerCase().includes(term)
            )
        );
    }, [sortedData, searchTerm]);

    const start = Math.max(0, Math.floor(scroll.top / rowH) - over);
    const end = Math.min(filteredData.length, Math.floor((scroll.top + viewH) / rowH) + over);
    const visible = filteredData.slice(start, end);

    const save = useCallback(() => {
        if (edit && onUpdate) onUpdate(edit.id, edit.col, edit.val);
        setEdit(null);
    }, [edit, onUpdate]);

    const handleResize = (col, e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = colWidths[col] || 150;
        const onMouseMove = (moveE) => {
            const diff = moveE.clientX - startX;
            setColWidths(prev => ({ ...prev, [col]: Math.max(50, startWidth + diff) }));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
    };

    const handleCopy = (value) => {
        if (value != null) {
            navigator.clipboard.writeText(String(value));
            setCopyNotification(true);
            setTimeout(() => setCopyNotification(false), 1500);
        }
    };

    const handleCellContextMenu = (e, value) => {
        e.preventDefault();
        handleCopy(value);
    };

    if (!data.length) return (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-lg h-full">
            데이터가 없습니다.
        </div>
    );

    const totalWidth = rowNumW + columns.reduce((acc, c) => acc + (colWidths[c] || 150), 0);

    return (
        <div ref={gridContainerRef} className="flex-1 flex flex-col bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden h-full">
            {/* Toolbar */}
            {!hideToolbar && <div className="flex items-center gap-3 p-3 bg-slate-800/50 border-b border-slate-700 shrink-0 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <input
                        type="text"
                        placeholder="데이터 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 text-slate-200 px-4 py-2 pl-10 text-sm rounded-lg border border-slate-700 outline-none focus:border-brand-500"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="text-sm text-slate-400">
                    <span className="font-medium text-slate-200">{filteredData.length}</span>
                    {' / '}
                    <span>{data.length}</span>
                    {' 행'}
                </div>
                {sortCol && (
                    <button
                        onClick={() => { setSortCol(null); setSortDir('asc'); }}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                        정렬 초기화
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
                
                {/* Export Hamburger + Zoom */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* 내보내기 드롭다운 */}
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setExportMenuOpen(v => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
                            style={{
                                background: exportMenuOpen ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${exportMenuOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                color: exportMenuOpen ? '#a5b4fc' : '#94a3b8'
                            }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            내보내기
                            <svg className={`w-3 h-3 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {exportMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                                style={{ background: 'rgba(6,12,26,0.98)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
                                <div className="px-3 py-1.5 text-[10px] text-slate-600 font-bold uppercase tracking-widest border-b border-white/5 mb-1">포맷 선택</div>
                                {[
                                    { label: 'HTML 파일', icon: '🌐', desc: '웹 테이블 형식', action: exportAsHTML, color: '#a78bfa' },
                                    { label: 'JSON 파일', icon: '📄', desc: 'JSON 배열', action: exportAsJSON, color: '#fbbf24' },
                                    { label: 'Excel (TSV)', icon: '📊', desc: '엑셀 호환', action: exportAsExcel, color: '#34d399' },
                                ].map(item => (
                                    <button key={item.label} onClick={() => { item.action(); setExportMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left group">
                                        <span className="text-lg">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold" style={{ color: item.color }}>{item.label}</div>
                                            <div className="text-[10px] text-slate-600">{item.desc}</div>
                                        </div>
                                        <svg className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* 전체화면 버튼 */}
                    <button
                        onClick={toggleZoom}
                        className="p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}
                        title={isZoomed ? '원래 크기로' : '전체화면'}
                    >
                        {isZoomed ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>}

            {/* Copy Notification */}
            {copyNotification && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
                    ✓ 클립보드에 복사되었습니다
                </div>
            )}

            {/* Header */}
            <div className="overflow-hidden bg-slate-800/80 border-b border-slate-700 shrink-0">
                <div className="flex" style={{ width: totalWidth, transform: `translateX(-${scroll.left}px)` }}>
                    {/* Row Number Header */}
                    <div 
                        style={{ width: rowNumW }}
                        className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-700 bg-slate-900/50"
                    >
                        #
                    </div>
                    {columns.map(c => (
                        <div
                            key={c}
                            style={{ width: colWidths[c] || 150 }}
                            className="relative px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-r border-slate-700 select-none cursor-pointer hover:bg-slate-700/50 transition-colors group"
                            onClick={() => handleSort(c)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="truncate block">{c}</span>
                                {sortCol === c && (
                                    <svg className="w-3 h-3 text-brand-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        {sortDir === 'asc' ? (
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        ) : (
                                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                        )}
                                    </svg>
                                )}
                            </div>
                            <div className="resizer" onMouseDown={(e) => handleResize(c, e)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div
                className="flex-1 overflow-auto relative custom-scrollbar"
                onScroll={e => setScroll({ top: e.target.scrollTop, left: e.target.scrollLeft })}
            >
                <div style={{ height: filteredData.length * rowH, width: totalWidth, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${start * rowH}px)` }}>
                        {visible.map((row, idx) => (
                            <div
                                key={row._rowid || idx}
                                className={`flex border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors ${selectedRow === row._rowid ? 'bg-brand-500/10' : ''}`}
                                style={{ height: rowH }}
                                onClick={() => setSelectedRow(row._rowid)}
                            >
                                {/* Row Number */}
                                <div 
                                    style={{ width: rowNumW }}
                                    className="px-3 py-2 text-xs text-slate-500 border-r border-slate-700 bg-slate-900/30 flex items-center"
                                >
                                    {start + idx + 1}
                                </div>
                                {columns.map(col => {
                                    const isEd = edit?.id === row._rowid && edit?.col === col && !readOnly;
                                    const isSelected = selectedRow === row._rowid;
                                    const w = colWidths[col] || 150;
                                    return (
                                        <div
                                            key={col}
                                            onDoubleClick={() => {
                                                if (!readOnly) setEdit({ id: row._rowid, col, val: row[col] == null ? '' : String(row[col]) });
                                            }}
                                            onContextMenu={(e) => handleCellContextMenu(e, row[col])}
                                            style={{ width: w }}
                                            className={`shrink-0 px-3 py-2 text-sm text-slate-300 border-r border-slate-800/50 overflow-hidden ${readOnly ? '' : 'cursor-text data-grid-cell'} ${isSelected ? 'bg-brand-500/5' : ''}`}
                                        >
                                            {isEd ? (
                                                <input
                                                    autoFocus
                                                    className="w-full bg-slate-950 text-brand-400 outline-none border border-brand-500 px-2 py-1 rounded text-sm"
                                                    value={edit.val}
                                                    onChange={e => setEdit({ ...edit, val: e.target.value })}
                                                    onBlur={save}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') save();
                                                        if (e.key === 'Escape') setEdit(null);
                                                    }}
                                                />
                                            ) : (
                                                <span className="whitespace-nowrap block">
                                                    {row[col] == null ? <span className="text-slate-600 italic">null</span> : String(row[col])}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-800/50 border-t border-slate-700 px-3 py-2 text-xs text-slate-500 shrink-0 flex justify-between">
                <span>더블클릭: 편집 • 우클릭: 복사 • 헤더 클릭: 정렬</span>
                <span className="text-slate-400">HTML / JSON / Excel 내보내기 가능</span>
            </div>
        </div>
    );
};

export default DataGrid;
