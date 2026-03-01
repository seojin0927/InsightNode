import React, { useState, useEffect, useCallback } from 'react';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const UnitStudio = () => {
    // === 상태 관리 ===
    const [category, setCategory] = useState('length');
    const [fromUnit, setFromUnit] = useState('');
    const [toUnit, setToUnit] = useState('');
    const [value, setValue] = useState('');
    const [result, setResult] = useState('');
    const [precision, setPrecision] = useState(4);
    const [history, setHistory] = useState([]);

    // === 단위 데이터 ===
    const unitsData = {
        length: {
            label: '길이', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
            units: { m: 1, km: 0.001, cm: 100, mm: 1000, in: 39.3701, ft: 3.28084, yd: 1.09361, mi: 0.000621371 }
        },
        weight: {
            label: '무게', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
            units: { kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274, t: 0.001 }
        },
        temperature: {
            label: '온도', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            units: { C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' } // Special handling
        },
        area: {
            label: '면적', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
            units: { m2: 1, km2: 0.000001, ft2: 10.7639, ac: 0.000247105, ha: 0.0001, py: 0.3025 }
        },
        volume: {
            label: '부피', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
            units: { l: 1, ml: 1000, gal: 0.264172, qt: 1.05669, pt: 2.11338, cup: 4.22675 }
        },
        speed: {
            label: '속도', icon: 'M13 10V3L4 14h7v7l9-11h-7z',
            units: { 'm/s': 1, 'km/h': 3.6, mph: 2.23694, knot: 1.94384 }
        },
        time: {
            label: '시간', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            units: { s: 1, min: 1/60, h: 1/3600, d: 1/86400, wk: 1/604800 }
        },
        data: {
            label: '데이터', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
            units: { B: 1, KB: 1/1024, MB: 1/1048576, GB: 1/1073741824, TB: 1/1099511627776 }
        }
    };

    // === 초기화 ===
    useEffect(() => {
        const units = Object.keys(unitsData[category].units);
        setFromUnit(units[0]);
        setToUnit(units[1] || units[0]);
        setResult('');
    }, [category]);

    // === 변환 로직 ===
    const convert = useCallback(() => {
        if (!value || isNaN(parseFloat(value))) {
            setResult('');
            return;
        }

        let val = parseFloat(value);
        let res = 0;

        if (category === 'temperature') {
            // 온도 변환 (특수 공식)
            let celsius = val;
            if (fromUnit === 'F') celsius = (val - 32) * 5/9;
            if (fromUnit === 'K') celsius = val - 273.15;

            if (toUnit === 'C') res = celsius;
            else if (toUnit === 'F') res = celsius * 9/5 + 32;
            else if (toUnit === 'K') res = celsius + 273.15;
        } else {
            // 비율 변환
            const rates = unitsData[category].units;
            const base = val / rates[fromUnit]; // 기본 단위로 변환
            res = base * rates[toUnit]; // 목표 단위로 변환
        }

        // 결과 포맷팅
        const formatted = Number.isInteger(res) ? res : Number(res.toFixed(precision));
        setResult(formatted);

        // 히스토리 추가 (Debounce 처리 필요하나 여기선 생략)
        // setHistory(prev => [`${val} ${fromUnit} → ${formatted} ${toUnit}`, ...prev].slice(0, 10));
    }, [value, fromUnit, toUnit, category, precision]);

    useEffect(() => {
        convert();
    }, [convert]);

    // 히스토리 수동 추가 (엔터 키 등)
    const addToHistory = () => {
        if (result) {
            setHistory(prev => [`${value} ${fromUnit} = ${result} ${toUnit}`, ...prev].slice(0, 10));
        }
    };

    // 스왑 기능
    const swap = () => {
        setFromUnit(toUnit);
        setToUnit(fromUnit);
        setValue(result); // 결과값을 입력값으로
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
                    <Icon path="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Unit Master Studio</h2>
                    <p className="text-slate-400 text-sm">길이, 무게, 환율 등 모든 단위 변환 솔루션</p>
                </div>
            </div>

            {/* 2. 카테고리 탭 (스크롤) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
                {Object.entries(unitsData).map(([key, data]) => (
                    <button
                        key={key}
                        onClick={() => setCategory(key)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                            category === key 
                            ? 'bg-lime-600 text-white shadow-md' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                    >
                        <span className="w-4 h-4"><Icon path={data.icon} /></span>
                        {data.label}
                    </button>
                ))}
            </div>

            {/* 3. 메인 변환 영역 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 입력 패널 (Col 7) */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-6 flex flex-col h-full border border-slate-700 relative">
                        {/* 변환 카드 */}
                        <div className="flex flex-col gap-6 flex-1 justify-center">
                            
                            {/* FROM */}
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 transition-colors focus-within:border-lime-500">
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">From</label>
                                    <select 
                                        value={fromUnit} 
                                        onChange={(e) => setFromUnit(e.target.value)}
                                        className="bg-transparent text-lime-400 text-sm font-bold outline-none cursor-pointer"
                                    >
                                        {Object.keys(unitsData[category].units).map(u => (
                                            <option key={u} value={u}>{u.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <input 
                                    type="number" 
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addToHistory()}
                                    placeholder="0"
                                    className="w-full bg-transparent text-4xl text-white font-mono outline-none"
                                />
                            </div>

                            {/* Swap Button */}
                            <div className="flex justify-center -my-9 z-10">
                                <button 
                                    onClick={swap}
                                    className="w-12 h-12 bg-slate-700 hover:bg-lime-600 text-white rounded-full border-4 border-slate-800 flex items-center justify-center transition-all shadow-lg active:scale-95"
                                >
                                    <Icon path="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </button>
                            </div>

                            {/* TO */}
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 transition-colors focus-within:border-lime-500">
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">To</label>
                                    <select 
                                        value={toUnit} 
                                        onChange={(e) => setToUnit(e.target.value)}
                                        className="bg-transparent text-lime-400 text-sm font-bold outline-none cursor-pointer"
                                    >
                                        {Object.keys(unitsData[category].units).map(u => (
                                            <option key={u} value={u}>{u.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <input 
                                    type="text" 
                                    value={result}
                                    readOnly
                                    placeholder="0"
                                    className="w-full bg-transparent text-4xl text-white font-mono outline-none cursor-pointer"
                                    onClick={() => {navigator.clipboard.writeText(result); alert('복사되었습니다!')}}
                                />
                            </div>
                        </div>

                        {/* 옵션 바 */}
                        <div className="mt-6 flex justify-between items-center bg-slate-900/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">소수점:</span>
                                <div className="flex gap-1">
                                    {[0, 2, 4, 6].map(p => (
                                        <button 
                                            key={p} 
                                            onClick={() => setPrecision(p)}
                                            className={`w-6 h-6 text-xs rounded ${precision === p ? 'bg-lime-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={addToHistory} className="text-xs text-lime-400 hover:text-lime-300 font-bold">
                                결과 저장
                            </button>
                        </div>
                    </div>
                </div>

                {/* 우측: 히스토리 & 참조표 (Col 5) */}
                <div className="lg:col-span-5 flex flex-col h-full min-h-0 gap-4">
                    
                    {/* 히스토리 */}
                    <div className="bg-slate-800 rounded-xl p-4 flex-1 shadow-inner border border-slate-700/50 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-300 uppercase">History</h3>
                            <button onClick={() => setHistory([])} className="text-xs text-slate-500 hover:text-red-400">Clear</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {history.length > 0 ? history.map((item, idx) => (
                                <div key={idx} className="p-3 bg-slate-900 rounded-lg text-sm text-slate-300 flex justify-between group">
                                    <span>{item}</span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(item.split('=')[1].trim())}
                                        className="text-lime-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Copy
                                    </button>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                    <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <span className="text-xs mt-2">최근 기록이 없습니다</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 빠른 참조표 */}
                    <div className="bg-slate-800 rounded-xl p-4 h-1/3 min-h-[200px] border border-slate-700/50 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-300 uppercase mb-3">Quick Ref ({fromUnit.toUpperCase()})</h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                            {Object.entries(unitsData[category].units).map(([u, factor]) => {
                                if (u === fromUnit) return null;
                                let refVal = 0;
                                if (category === 'temperature') refVal = 'N/A'; // 복잡해서 생략
                                else refVal = (1 / unitsData[category].units[fromUnit] * factor).toPrecision(4);
                                
                                return (
                                    <div key={u} className="bg-slate-700/50 p-2 rounded text-xs flex justify-between">
                                        <span className="text-slate-400">1 {fromUnit}</span>
                                        <span className="text-slate-200 font-mono">= {refVal} {u}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UnitStudio;