import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse'; // CSV 다운로드용

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ListDiffStudio = () => {
    // === 상태 관리 ===
    const [listA, setListA] = useState('');
    const [listB, setListB] = useState('');
    const [activeTab, setActiveTab] = useState('a_only'); // a_only, b_only, common, union
    
    // 설정 옵션
    const [config, setConfig] = useState({
        caseSensitive: false,
        ignoreWhitespace: true,
        removeDuplicates: true,
        sort: 'none', // none, asc, desc
        delimiter: 'newline' // newline, comma
    });

    // 샘플 데이터
    const sampleA = `Apple\nBanana\nCherry\nDate\nElderberry\nFig\nGrape`;
    const sampleB = `Banana\nDragonfruit\nElderberry\nFig\nHoneydew\nApple`;

    // === 데이터 처리 엔진 ===
    const processData = useCallback(() => {
        // 1. 파싱 (Split)
        const splitter = config.delimiter === 'comma' ? ',' : '\n';
        let arrA = listA.split(splitter);
        let arrB = listB.split(splitter);

        // 2. 전처리 (Clean)
        const clean = (item) => {
            let str = String(item);
            if (config.ignoreWhitespace) str = str.trim();
            if (!config.caseSensitive) str = str.toLowerCase();
            return str;
        };

        // 원본 유지를 위해 매핑 객체 생성 (Display용 vs Compare용)
        const mapA = arrA.map(item => ({ raw: item, key: clean(item) })).filter(i => i.key);
        const mapB = arrB.map(item => ({ raw: item, key: clean(item) })).filter(i => i.key);

        // 3. 중복 제거 (내부)
        let finalA = mapA;
        let finalB = mapB;

        if (config.removeDuplicates) {
            finalA = [...new Map(mapA.map(item => [item.key, item])).values()];
            finalB = [...new Map(mapB.map(item => [item.key, item])).values()];
        }

        // 4. 비교 연산 (Set Operations)
        const setA = new Set(finalA.map(i => i.key));
        const setB = new Set(finalB.map(i => i.key));

        const aOnly = finalA.filter(i => !setB.has(i.key));
        const bOnly = finalB.filter(i => !setA.has(i.key));
        const common = finalA.filter(i => setB.has(i.key)); // A의 표기 기준
        
        // 합집합 (A + B_Only)
        const union = [...finalA, ...bOnly];

        // 5. 정렬
        const sortFn = (a, b) => {
            if (config.sort === 'asc') return a.key.localeCompare(b.key);
            if (config.sort === 'desc') return b.key.localeCompare(a.key);
            return 0;
        };

        if (config.sort !== 'none') {
            aOnly.sort(sortFn);
            bOnly.sort(sortFn);
            common.sort(sortFn);
            union.sort(sortFn);
        }

        return {
            aOnly: aOnly.map(i => i.raw),
            bOnly: bOnly.map(i => i.raw),
            common: common.map(i => i.raw),
            union: union.map(i => i.raw),
            stats: {
                totalA: finalA.length,
                totalB: finalB.length,
                diffA: aOnly.length,
                diffB: bOnly.length,
                intersect: common.length,
                union: union.length
            }
        };

    }, [listA, listB, config]);

    // 결과 메모이제이션
    const results = useMemo(() => processData(), [processData]);

    // === 핸들러 ===
    const handleSwap = () => {
        setListA(listB);
        setListB(listA);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert('복사되었습니다.');
    };

    const handleDownload = (data, filename) => {
        const csv = Papa.unparse(data.map(item => ({ Value: item })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const getCurrentList = () => {
        switch(activeTab) {
            case 'a_only': return results.aOnly;
            case 'b_only': return results.bOnly;
            case 'common': return results.common;
            case 'union': return results.union;
            default: return [];
        }
    };

    // === 탭 정보 ===
    const tabs = [
        { id: 'a_only', label: 'A에만 있음', count: results.stats.diffA, color: 'text-blue-400', bg: 'bg-blue-500/20' },
        { id: 'b_only', label: 'B에만 있음', count: results.stats.diffB, color: 'text-orange-400', bg: 'bg-orange-500/20' },
        { id: 'common', label: '공통 (교집합)', count: results.stats.intersect, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        { id: 'union', label: '합집합 (전체)', count: results.stats.union, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    ];

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Icon path="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">List Diff Master Studio</h2>
                        <p className="text-slate-400 text-sm">목록 비교, 교집합/차집합 분석, 데이터 정제 도구</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setListA(sampleA); setListB(sampleB); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-600 transition-all">
                        샘플 데이터
                    </button>
                    <button onClick={() => { setListA(''); setListB(''); }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30 transition-all">
                        초기화
                    </button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 (Grid) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 입력 및 설정 (Col 5) */}
                <div className="lg:col-span-5 flex flex-col h-full min-h-0 gap-4">
                    
                    {/* 설정 패널 */}
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={config.caseSensitive} onChange={(e)=>setConfig({...config, caseSensitive: e.target.checked})} className="accent-indigo-500" />
                                대소문자 구분
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={config.removeDuplicates} onChange={(e)=>setConfig({...config, removeDuplicates: e.target.checked})} className="accent-indigo-500" />
                                중복 제거
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={config.ignoreWhitespace} onChange={(e)=>setConfig({...config, ignoreWhitespace: e.target.checked})} className="accent-indigo-500" />
                                공백 무시
                            </label>
                            <select 
                                value={config.delimiter} 
                                onChange={(e)=>setConfig({...config, delimiter: e.target.value})}
                                className="bg-slate-900 text-slate-300 text-xs p-1 rounded border border-slate-600 outline-none"
                            >
                                <option value="newline">줄바꿈 기준</option>
                                <option value="comma">콤마(,) 기준</option>
                            </select>
                        </div>
                    </div>

                    {/* 입력창 A & B */}
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                        {/* List A */}
                        <div className="flex-1 flex flex-col bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="flex justify-between items-center p-2 bg-slate-900/50 border-b border-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-blue-500/20 text-blue-400 text-xs font-bold rounded">A</span>
                                    <span className="text-xs font-bold text-slate-400">List A ({results.stats.totalA})</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setListA('')} className="text-[10px] text-slate-500 hover:text-red-400">비우기</button>
                                </div>
                            </div>
                            <textarea 
                                value={listA} 
                                onChange={(e) => setListA(e.target.value)} 
                                placeholder="데이터 입력 (Enter로 구분)"
                                className="flex-1 bg-transparent p-3 text-sm font-mono text-slate-300 resize-none outline-none custom-scrollbar"
                            />
                        </div>

                        {/* Swap Button */}
                        <div className="relative h-0 flex justify-center items-center z-10">
                            <button onClick={handleSwap} className="bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white p-2 rounded-full shadow-lg border border-slate-600 transition-all">
                                <Icon path="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </button>
                        </div>

                        {/* List B */}
                        <div className="flex-1 flex flex-col bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="flex justify-between items-center p-2 bg-slate-900/50 border-b border-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-orange-500/20 text-orange-400 text-xs font-bold rounded">B</span>
                                    <span className="text-xs font-bold text-slate-400">List B ({results.stats.totalB})</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setListB('')} className="text-[10px] text-slate-500 hover:text-red-400">비우기</button>
                                </div>
                            </div>
                            <textarea 
                                value={listB} 
                                onChange={(e) => setListB(e.target.value)} 
                                placeholder="데이터 입력 (Enter로 구분)"
                                className="flex-1 bg-transparent p-3 text-sm font-mono text-slate-300 resize-none outline-none custom-scrollbar"
                            />
                        </div>
                    </div>
                </div>

                {/* 우측: 분석 결과 및 시각화 (Col 7) */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50">
                        
                        {/* 상단: 시각화 (Venn Stats) */}
                        <div className="flex gap-4 mb-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 p-3 rounded-xl border transition-all ${
                                        activeTab === tab.id 
                                        ? `bg-slate-700 border-${tab.color.split('-')[1]}-500/50` 
                                        : 'bg-slate-900/50 border-transparent hover:bg-slate-700'
                                    }`}
                                >
                                    <div className={`text-xs font-bold mb-1 ${tab.color}`}>{tab.label}</div>
                                    <div className="text-2xl font-bold text-white">{tab.count}</div>
                                </button>
                            ))}
                        </div>

                        {/* 결과 리스트 */}
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${tabs.find(t=>t.id===activeTab).bg.replace('/20', '')}`}></span>
                                {tabs.find(t=>t.id===activeTab).label} 목록
                            </h3>
                            <div className="flex gap-2">
                                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                                    <button onClick={()=>setConfig({...config, sort: 'asc'})} className={`px-2 py-1 text-[10px] rounded ${config.sort==='asc' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>오름차순</button>
                                    <button onClick={()=>setConfig({...config, sort: 'desc'})} className={`px-2 py-1 text-[10px] rounded ${config.sort==='desc' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>내림차순</button>
                                </div>
                                <button 
                                    onClick={() => handleCopy(getCurrentList().join('\n'))}
                                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold"
                                >
                                    복사
                                </button>
                                <button 
                                    onClick={() => handleDownload(getCurrentList(), `${activeTab}_result.csv`)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md"
                                >
                                    다운로드
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden relative">
                            {getCurrentList().length > 0 ? (
                                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-2">
                                    {getCurrentList().map((item, idx) => (
                                        <div key={idx} className="flex gap-3 py-1.5 px-2 hover:bg-slate-800 rounded group border-b border-slate-800/50 last:border-0">
                                            <span className="text-slate-600 font-mono text-xs w-8 text-right select-none">{idx + 1}</span>
                                            <span className="text-slate-300 text-sm font-mono break-all">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                    <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 00-2 2 0-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    <span className="text-xs mt-2">해당되는 데이터가 없습니다</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ListDiffStudio;