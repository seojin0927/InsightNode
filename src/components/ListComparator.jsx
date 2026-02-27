import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Icons from '../utils/Icons';

const ListComparator = () => {
    const [listA, setListA] = useState('');
    const [listB, setListB] = useState('');
    const [result, setResult] = useState(null);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [trimSpaces, setTrimSpaces] = useState(true);

    const handleCompare = useCallback(() => {
        if (!listA && !listB) return;

        const parseList = (text) => {
            const lines = text.split(/[\n,]/).map(item => {
                let cleaned = item.trim();
                if (trimSpaces) {
                    cleaned = cleaned.replace(/^\s+|\s+$/g, '');
                }
                return caseSensitive ? cleaned : cleaned.toLowerCase();
            }).filter(item => item);
            return [...new Set(lines)];
        };

        const arrA = parseList(listA);
        const arrB = parseList(listB);

        const intersection = arrA.filter(item => arrB.includes(item));
        const onlyInA = arrA.filter(item => !arrB.includes(item));
        const onlyInB = arrB.filter(item => !arrA.includes(item));

        setResult({
            onlyInA,
            onlyInB,
            intersection,
            totalA: arrA.length,
            totalB: arrB.length,
            onlyInACount: onlyInA.length,
            onlyInBCount: onlyInB.length,
            intersectionCount: intersection.length
        });
    }, [listA, listB, caseSensitive, trimSpaces]);

    const handleDownloadCSV = useCallback((type) => {
        if (!result) return;

        let data = [];
        let filename = '';

        if (type === 'onlyA') {
            data = result.onlyInA.map(item => ({ item: item, category: 'A only' }));
            filename = 'only_in_A.csv';
        } else if (type === 'onlyB') {
            data = result.onlyInB.map(item => ({ item: item, category: 'B only' }));
            filename = 'only_in_B.csv';
        } else if (type === 'intersection') {
            data = result.intersection.map(item => ({ item: item, category: 'Both' }));
            filename = 'both_in_A_and_B.csv';
        } else if (type === 'all') {
            data = [
                ...result.onlyInA.map(item => ({ item: item, category: 'A only' })),
                ...result.onlyInB.map(item => ({ item: item, category: 'B only' })),
                ...result.intersection.map(item => ({ item: item, category: 'Both' }))
            ];
            filename = 'comparison_result.csv';
        }

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }, [result]);

    const handleCopy = useCallback((type) => {
        if (!result) return;

        let text = '';
        if (type === 'onlyA') {
            text = result.onlyInA.join('\n');
        } else if (type === 'onlyB') {
            text = result.onlyInB.join('\n');
        } else if (type === 'intersection') {
            text = result.intersection.join('\n');
        }

        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    }, [result]);

    const sampleA = `김철수
박지민
이영희
최민수
정수빈`;

    const sampleB = `박지민
이영희
강동원
김철수
정수빈`;

    return (
        <>
            <h1 className="sr-only">VaultSheet (볼트시트) - 목록 비교 도구 : 두 목록의 차이점 분석 (VLOOKUP 대안)</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            목록 비교 도구 (VLOOKUP 대안)
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            두 목록을 비교하여 A에만 있는 항목, B에만 있는 항목, 둘 다 있는 항목을 추출합니다
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={caseSensitive}
                            onChange={(e) => setCaseSensitive(e.target.checked)}
                            className="w-4 h-4 accent-brand-500"
                        />
                        대소문자 구분
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={trimSpaces}
                            onChange={(e) => setTrimSpaces(e.target.checked)}
                            className="w-4 h-4 accent-brand-500"
                        />
                        공백 제거
                    </label>
                </div>

                <div className="flex gap-4 overflow-hidden flex-1 min-h-0">
                        <div className="flex-1 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                            <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                                <div className="flex items-center gap-2 py-3 px-4">
                                    <span className="w-6 h-6 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded font-bold text-sm">A</span>
                                    <span className="text-sm font-semibold text-slate-300">목록 A (기준)</span>
                                </div>
                                <button 
                                    onClick={() => setListA(sampleA)}
                                    className="ml-auto mr-4 px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-medium rounded-lg border border-brand-500/30 transition-all"
                                >
                                    📋 샘플
                                </button>
                            </div>
                            <div className="flex-1 p-3">
                                <textarea
                                    className="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-3 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700"
                                    value={listA}
                                    onChange={(e) => setListA(e.target.value)}
                                    placeholder="항목을 한 줄에 하나씩 입력하세요"
                                    spellCheck="false"
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                            <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                                <div className="flex items-center gap-2 py-3 px-4">
                                    <span className="w-6 h-6 flex items-center justify-center bg-green-500/20 text-green-400 rounded font-bold text-sm">B</span>
                                    <span className="text-sm font-semibold text-slate-300">목록 B (비교)</span>
                                </div>
                                <button 
                                    onClick={() => setListB(sampleB)}
                                    className="ml-auto mr-4 px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-medium rounded-lg border border-brand-500/30 transition-all"
                                >
                                    📋 샘플
                                </button>
                            </div>
                            <div className="flex-1 p-3">
                                <textarea
                                    className="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-3 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700"
                                    value={listB}
                                    onChange={(e) => setListB(e.target.value)}
                                    placeholder="항목을 한 줄에 하나씩 입력하세요"
                                    spellCheck="false"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">비교 결과</span>
                            </div>
                        </div>

                        {result && (
                            <div className="p-3 border-b border-slate-700/30 bg-slate-800/30">
                                <div className="flex gap-3 text-sm">
                                    <div className="flex-1 text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                        <div className="text-blue-400 font-bold text-lg">{result.totalA}</div>
                                        <div className="text-slate-500 text-xs">목록 A 총계</div>
                                    </div>
                                    <div className="flex-1 text-center p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                                        <div className="text-green-400 font-bold text-lg">{result.totalB}</div>
                                        <div className="text-slate-500 text-xs">목록 B 총계</div>
                                    </div>
                                    <div className="flex-1 text-center p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                        <div className="text-purple-400 font-bold text-lg">{result.intersectionCount}</div>
                                        <div className="text-slate-500 text-xs">공통 (교집합)</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-auto bg-[#0d1117] p-4">
                            {result ? (
                                <div className="space-y-4">
                                    <div className="bg-red-500/5 rounded-xl border border-red-500/20 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-400 font-bold">A에만 있음</span>
                                                <span className="text-xs text-slate-500">({result.onlyInACount})</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopy('onlyA')}
                                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                                >
                                                    복사
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadCSV('onlyA')}
                                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                                >
                                                    CSV
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 max-h-[150px] overflow-auto custom-scrollbar">
                                            {result.onlyInA.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {result.onlyInA.map((item, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-sm font-mono">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 text-sm">A에만 있는 항목이 없습니다</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-orange-500/5 rounded-xl border border-orange-500/20 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2 bg-orange-500/10 border-b border-orange-500/20">
                                            <div className="flex items-center gap-2">
                                                <span className="text-orange-400 font-bold">B에만 있음</span>
                                                <span className="text-xs text-slate-500">({result.onlyInBCount})</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopy('onlyB')}
                                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                                >
                                                    복사
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadCSV('onlyB')}
                                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                                >
                                                    CSV
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 max-h-[150px] overflow-auto custom-scrollbar">
                                            {result.onlyInB.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {result.onlyInB.map((item, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-sm font-mono">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 text-sm">B에만 있는 항목이 없습니다</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-400 font-bold">공통 (교집합)</span>
                                                <span className="text-xs text-slate-500">({result.intersectionCount})</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopy('intersection')}
                                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                                >
                                                    복사
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadCSV('intersection')}
                                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                                >
                                                    CSV
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 max-h-[150px] overflow-auto custom-scrollbar">
                                            {result.intersection.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {result.intersection.map((item, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm font-mono">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 text-sm">공통 항목이 없습니다</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 00-2 2 0-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500">목록을 입력하고 비교 버튼을 클릭하세요</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 flex gap-3">
                            <button
                                onClick={handleCompare}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                            >
                                <Icons.Play /> 비교하기
                            </button>
                            {result && (
                                <button
                                    onClick={() => handleDownloadCSV('all')}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                                >
                                    <Icons.Download /> 전체 CSV
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ListComparator;
