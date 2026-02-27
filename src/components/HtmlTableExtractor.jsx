import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Icons from '../utils/Icons';

const HtmlTableExtractor = () => {
    const [inputHtml, setInputHtml] = useState('');
    const [url, setUrl] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState('');
    const [previewRows, setPreviewRows] = useState(10);

    // 샘플 HTML
    const sampleHtml = `<table>
  <tr><th>이름</th><th>부서</th><th>직책</th><th>이메일</th></tr>
  <tr><td>홍길동</td><td>영업팀</td><td>팀장</td><td>hong@example.com</td></tr>
  <tr><td>김철수</td><td>마케팅팀</td><td>과장</td><td>kim@company.co.kr</td></tr>
  <tr><td>박지민</td><td>개발팀</td><td>대리</td><td>park@dev.kr</td></tr>
  <tr><td>이영희</td><td>인사팀</td><td>팀장</td><td>lee@hr.co.kr</td></tr>
</table>`;

    // HTML에서 테이블 추출
    const extractTables = useCallback((html) => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const tables = doc.querySelectorAll('table');
            
            if (tables.length === 0) {
                setError('HTML에서 테이블을 찾을 수 없습니다.');
                return null;
            }

            // 첫 번째 테이블 사용
            const table = tables[0];
            const rows = [];
            const headers = [];
            
            // 헤더 추출
            const headerCells = table.querySelectorAll('th');
            if (headerCells.length > 0) {
                headerCells.forEach(cell => {
                    headers.push(cell.textContent.trim());
                });
            } else {
                // th가 없으면 첫 번째 행을 헤더로 사용
                const firstRow = table.querySelector('tr');
                if (firstRow) {
                    firstRow.querySelectorAll('td').forEach(cell => {
                        headers.push(cell.textContent.trim());
                    });
                }
            }
            
            // 데이터 행 추출
            const dataRows = table.querySelectorAll('tr');
            dataRows.forEach((row, idx) => {
                if (headerCells.length === 0 && idx === 0) return; // 첫 번째 행이 헤더인 경우 스킵
                
                const rowData = {};
                const cells = row.querySelectorAll('td');
                
                if (headers.length > 0) {
                    cells.forEach((cell, cellIdx) => {
                        if (headers[cellIdx]) {
                            rowData[headers[cellIdx]] = cell.textContent.trim();
                        }
                    });
                    if (Object.keys(rowData).length > 0) {
                        rows.push(rowData);
                    }
                }
            });
            
            return rows;
        } catch (err) {
            setError('HTML 파싱 오류: ' + err.message);
            return null;
        }
    }, []);

    // HTML 텍스트로 추출
    const handleExtractFromHtml = useCallback(() => {
        if (!inputHtml) return;
        
        const data = extractTables(inputHtml);
        if (data) {
            setParsedData(data);
        }
    }, [inputHtml, extractTables]);

    // URL에서_fetch (간단한 방식)
    const handleExtractFromUrl = useCallback(async () => {
        if (!url) return;
        
        setError('');
        try {
            // CORS 이슈로 직접_fetch는困难하므로 사용자에게 HTML 복사 안내
            setError('⚠️ 웹페이지의 테이블을 추출하려면:\n1. 해당 웹페이지에서 테이블을 선택하고 복사\n2. 왼쪽 박스에 HTML을 붙여넣으세요.\n\n(브라우저 보안 정책으로 직접 URL 접근이 제한됩니다)');
        } catch (err) {
            setError('오류: ' + err.message);
        }
    }, [url]);

    // CSV로 변환
    const handleConvertToCsv = useCallback(() => {
        if (!parsedData) return;
        
        const csv = Papa.unparse(parsedData);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'extracted_table.csv';
        link.click();
    }, [parsedData]);

    // 클립보드 복사
    const handleCopy = useCallback(() => {
        if (!parsedData) return;
        
        const csv = Papa.unparse(parsedData);
        navigator.clipboard.writeText(csv).then(() => {
            alert('CSV가 클립보드에 복사되었습니다!');
        });
    }, [parsedData]);

    // 미리보기 행 수 변경
    const handlePreviewRowsChange = useCallback((e) => {
        setPreviewRows(parseInt(e.target.value, 10));
    }, []);

    return (
        <>
            {/* SEO Heading (화면에 표시되지 않음) */}
            <h1 className="sr-only">웹 테이블 추출기 - HTML 테이블을 CSV로 내보내기</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            🌐 웹 표 (HTML Table) 추출기
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            웹페이지의 표를 깔끔한 CSV/Excel 데이터로 변환합니다
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden" style={{ minHeight: 'calc(100% - 80px)' }}>
                    {/* 좌측: HTML 입력 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">HTML 입력</span>
                            </div>
                            <button 
                                onClick={() => setInputHtml(sampleHtml)}
                                className="ml-auto mr-4 px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-medium rounded-lg border border-brand-500/30 transition-all"
                            >
                                📋 샘플
                            </button>
                        </div>
                        
                        <div className="flex-1 p-4">
                            <textarea
                                className="w-full h-[200px] bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700 mb-3"
                                value={inputHtml}
                                onChange={(e) => setInputHtml(e.target.value)}
                                placeholder={`<!-- 웹페이지에서 테이블을 복사해서 붙여넣으세요 -->
<table>
  <tr><th>이름</th><th>부서</th></tr>
  <tr><td>홍길동</td><td>영업팀</td></tr>
  <tr><td>김철수</td><td>마케팅팀</td></tr>
</table>`}
                                spellCheck="false"
                            />
                            
                            {error && !parsedData && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm mb-3 whitespace-pre-line">
                                    {error}
                                </div>
                            )}
                            
                            <button
                                onClick={handleExtractFromHtml}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                            >
                                <Icons.Play /> 테이블 추출
                            </button>
                        </div>
                    </div>

                    {/* 우측: 추출 결과 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">추출 결과</span>
                            </div>
                            
                            {parsedData && (
                                <div className="ml-auto mr-4 my-auto flex items-center gap-3">
                                    <span className="text-xs text-slate-500">미리보기:</span>
                                    <select
                                        value={previewRows}
                                        onChange={handlePreviewRowsChange}
                                        className="bg-slate-800 text-slate-200 text-sm px-3 py-1.5 rounded-lg border border-slate-600/30"
                                    >
                                        <option value={5}>5행</option>
                                        <option value={10}>10행</option>
                                        <option value={20}>20행</option>
                                        <option value={50}>50행</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-hidden bg-[#0d1117]">
                            {parsedData ? (
                                <div className="h-full flex flex-col">
                                    {/* 데이터 정보 */}
                                    <div className="p-3 border-b border-slate-800/50 bg-gradient-to-r from-slate-800/20 to-transparent flex items-center gap-6 text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className="text-slate-500">총</span>
                                            <span className="text-brand-400 font-bold text-lg">{parsedData.length}</span>
                                            <span className="text-slate-500">행</span>
                                        </span>
                                        <span className="text-slate-700">|</span>
                                        <span className="flex items-center gap-2">
                                            <span className="text-slate-500">컬럼</span>
                                            <span className="text-brand-400 font-bold text-lg">{parsedData.length > 0 ? Object.keys(parsedData[0]).length : 0}</span>
                                        </span>
                                    </div>
                                    
                                    {/* 테이블 미리보기 */}
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-800/80">
                                                <tr>
                                                    {parsedData.length > 0 && Object.keys(parsedData[0]).map((key, idx) => (
                                                        <th key={idx} className="py-3 px-4 text-xs font-bold text-brand-400 border-b border-slate-700/50 whitespace-nowrap">
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.slice(0, previewRows).map((row, rowIdx) => (
                                                    <tr key={rowIdx} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                                                        {Object.values(row).map((val, valIdx) => (
                                                            <td key={valIdx} className="py-3 px-4 text-sm text-slate-300 font-mono whitespace-nowrap">
                                                                {String(val)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        
                                        {parsedData.length > previewRows && (
                                            <div className="p-3 text-center text-sm text-slate-500">
                                                ... 외 <span className="text-brand-400 font-semibold">{parsedData.length - previewRows}</span>행
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500">추출된 테이블이 여기에 표시됩니다</p>
                                </div>
                            )}
                        </div>
                        
                        {parsedData && (
                            <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 flex gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50"
                                >
                                    <Icons.Copy /> 복사
                                </button>
                                <button
                                    onClick={handleConvertToCsv}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    <Icons.Download /> CSV 다운로드
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default HtmlTableExtractor;
