import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx'; // 엑셀 다운로드를 위해 필요 (npm install xlsx)

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const HtmlTableStudio = () => {
    // === 상태 관리 ===
    const [inputHtml, setInputHtml] = useState('');
    const [tables, setTables] = useState([]);
    const [selectedTableIndex, setSelectedTableIndex] = useState(0);
    const [tableData, setTableData] = useState({ headers: [], rows: [] });
    const [filterText, setFilterText] = useState('');
    const [error, setError] = useState('');
    const [options, setOptions] = useState({
        fillMergedCells: true,
        trim: true,
        removeTags: true
    });

    // 샘플 데이터
    const sampleHtml = `
    <h3>직원 목록</h3>
    <table>
        <thead><tr><th>이름</th><th>부서</th><th>직책</th><th>이메일</th></tr></thead>
        <tbody>
            <tr><td>홍길동</td><td>영업팀</td><td>팀장</td><td>hong@example.com</td></tr>
            <tr><td>김철수</td><td>마케팅팀</td><td>과장</td><td>kim@company.co.kr</td></tr>
        </tbody>
    </table>
    <h3>프로젝트 현황</h3>
    <table>
        <thead><tr><th>프로젝트명</th><th>기간</th><th>상태</th></tr></thead>
        <tbody>
            <tr><td>웹 리뉴얼</td><td>2024.01~2024.03</td><td>진행중</td></tr>
            <tr><td>앱 개발</td><td>2024.02~2024.06</td><td>기획</td></tr>
        </tbody>
    </table>
    `;

    // === 파싱 엔진 ===
    const parseHtml = useCallback(() => {
        if (!inputHtml) {
            setTables([]);
            setTableData({ headers: [], rows: [] });
            return;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(inputHtml, 'text/html');
            const foundTables = Array.from(doc.querySelectorAll('table'));
            
            if (foundTables.length === 0) {
                setError('HTML에서 테이블을 찾을 수 없습니다.');
                setTables([]);
                return;
            }

            setTables(foundTables);
            setError('');
            // 현재 선택된 인덱스가 범위를 벗어나면 0으로 초기화
            if (selectedTableIndex >= foundTables.length) setSelectedTableIndex(0);

            // 데이터 추출
            extractDataFromTable(foundTables[selectedTableIndex]);

        } catch (err) {
            setError('파싱 오류: ' + err.message);
        }
    }, [inputHtml, selectedTableIndex, options]);

    // 테이블에서 데이터 추출 로직
    const extractDataFromTable = (table) => {
        if (!table) return;

        let rows = Array.from(table.rows).map(row => 
            Array.from(row.cells).map(cell => {
                let text = cell.innerText;
                if (options.trim) text = text.trim();
                return text;
            })
        );

        // 헤더 분리 (첫 번째 행을 헤더로 가정)
        let headers = [];
        if (rows.length > 0) {
            // th 태그가 있는지 확인
            const hasTh = table.querySelector('th');
            if (hasTh) {
                headers = rows[0];
                rows = rows.slice(1);
            } else {
                // 없으면 Column 1, Column 2... 자동 생성
                headers = rows[0].map((_, i) => `Column ${i + 1}`);
            }
        }

        setTableData({ headers, rows });
    };

    // 자동 파싱 실행
    useEffect(() => {
        parseHtml();
    }, [parseHtml]);

    // === 데이터 처리 ===
    // 필터링된 데이터 계산
    const filteredRows = tableData.rows.filter(row => 
        row.some(cell => cell.toLowerCase().includes(filterText.toLowerCase()))
    );

    // 셀 수정 핸들러
    const handleCellChange = (rowIndex, cellIndex, value) => {
        const newRows = [...tableData.rows];
        newRows[rowIndex][cellIndex] = value;
        setTableData(prev => ({ ...prev, rows: newRows }));
    };

    // === 내보내기 ===
    const downloadData = (format) => {
        if (filteredRows.length === 0) return;

        const data = [tableData.headers, ...filteredRows];

        if (format === 'csv') {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveFile(blob, 'table_data.csv');
        } else if (format === 'json') {
            // Array of Objects 형태로 변환
            const jsonData = filteredRows.map(row => {
                const obj = {};
                tableData.headers.forEach((h, i) => obj[h] = row[i]);
                return obj;
            });
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            saveFile(blob, 'table_data.json');
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, "table_data.xlsx");
        }
    };

    const saveFile = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Icon path="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Web Table Master Studio</h2>
                        <p className="text-slate-400 text-sm">HTML 테이블 추출, 편집, 변환 솔루션</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => setInputHtml(sampleHtml)} className="bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-teal-500/30">
                        샘플 데이터
                    </button>
                    <button onClick={() => { setInputHtml(''); setTables([]); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600">
                        초기화
                    </button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: HTML 입력 및 설정 (Col 4) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0 gap-4">
                    <div className="bg-slate-800 rounded-xl p-4 flex flex-col h-1/2 min-h-0 border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">HTML Input</span>
                            <span className="text-[10px] text-slate-500">Paste code here</span>
                        </div>
                        <textarea
                            value={inputHtml}
                            onChange={(e) => setInputHtml(e.target.value)}
                            placeholder="<table>...</table> 코드를 붙여넣으세요"
                            className="flex-1 w-full bg-slate-900 text-slate-300 p-3 font-mono text-xs resize-none outline-none custom-scrollbar rounded-lg border border-slate-700 focus:border-teal-500"
                            spellCheck="false"
                        />
                    </div>

                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-1/2 min-h-0 border border-slate-700 overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Detection & Options</h3>
                        
                        {/* 테이블 선택 */}
                        {tables.length > 0 ? (
                            <div className="mb-6">
                                <label className="text-xs text-slate-500 mb-2 block">감지된 테이블 ({tables.length})</label>
                                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar bg-slate-900 p-2 rounded-lg border border-slate-600">
                                    {tables.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedTableIndex(idx)}
                                            className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors flex justify-between items-center ${
                                                selectedTableIndex === idx 
                                                ? 'bg-teal-600 text-white' 
                                                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                            }`}
                                        >
                                            <span>Table {idx + 1}</span>
                                            {selectedTableIndex === idx && <span className="text-[10px]">●</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-4 bg-slate-700/30 rounded-lg text-center text-xs text-slate-500">
                                HTML을 입력하면 테이블이 감지됩니다.
                            </div>
                        )}

                        {/* 옵션 */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={options.trim} onChange={(e)=>setOptions({...options, trim: e.target.checked})} className="accent-teal-500" />
                                공백 제거 (Trim)
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={options.fillMergedCells} onChange={(e)=>setOptions({...options, fillMergedCells: e.target.checked})} className="accent-teal-500" />
                                병합된 셀(Rowspan) 채우기 (구현중)
                            </label>
                        </div>
                    </div>
                </div>

                {/* 우측: 데이터 그리드 및 액션 (Col 8) */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50">
                        
                        {/* 툴바 */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-bold text-slate-300 uppercase">Table Data</h3>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={filterText}
                                        onChange={(e) => setFilterText(e.target.value)}
                                        placeholder="데이터 검색..." 
                                        className="bg-slate-900 border border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none w-48 focus:border-teal-500"
                                    />
                                    <span className="absolute left-2.5 top-1.5 text-slate-500">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => downloadData('csv')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors">CSV</button>
                                <button onClick={() => downloadData('json')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors">JSON</button>
                                <button onClick={() => downloadData('xlsx')} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-lg transition-colors">Excel</button>
                            </div>
                        </div>

                        {/* 데이터 테이블 */}
                        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden relative">
                            {tableData.rows.length > 0 ? (
                                <div className="absolute inset-0 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-3 font-mono text-xs text-slate-500 border-b border-slate-800 w-10 text-center bg-slate-950">#</th>
                                                {tableData.headers.map((h, i) => (
                                                    <th key={i} className="p-3 text-xs font-bold text-teal-400 border-b border-slate-800 border-l border-slate-800/50 bg-slate-950 whitespace-nowrap min-w-[100px]">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="font-mono text-xs text-slate-400">
                                            {filteredRows.map((row, rowIdx) => (
                                                <tr key={rowIdx} className="hover:bg-slate-800/30 border-b border-slate-800/30 last:border-0 group">
                                                    <td className="p-3 text-slate-600 text-center bg-slate-900/50">{rowIdx + 1}</td>
                                                    {row.map((cell, cellIdx) => (
                                                        <td key={cellIdx} className="p-0 border-l border-slate-800/30 relative">
                                                            <input 
                                                                type="text" 
                                                                value={cell} 
                                                                onChange={(e) => handleCellChange(rowIdx, cellIdx, e.target.value)}
                                                                className="w-full bg-transparent p-3 outline-none focus:bg-teal-500/10 focus:text-teal-200 transition-colors"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                    <Icon path="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    <span className="text-xs">데이터가 없습니다</span>
                                </div>
                            )}
                        </div>
                        
                        {/* 하단 정보 */}
                        <div className="mt-3 flex justify-between text-[10px] text-slate-500 px-1">
                            <span>Total Rows: {tableData.rows.length}</span>
                            <span>Filtered: {filteredRows.length}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HtmlTableStudio;