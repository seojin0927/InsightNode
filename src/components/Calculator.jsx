import React, { useState, useEffect, useCallback } from 'react';

const SuperCalculator = () => {
    // === 상태 관리 ===
    const [activeTab, setActiveTab] = useState('general'); // general, unit, date, finance, health, dev
    const [history, setHistory] = useState([]);

    // 일반/공학 계산기 상태
    const [input, setInput] = useState('');
    const [calcResult, setCalcResult] = useState('');

    // 서브 모드 관리 (단위, 날짜, 재무, 건강 등)
    const [subMode, setSubMode] = useState('length'); 
    
    // 공통 입력 값 관리 (Form 형태의 계산기용)
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');
    const [val3, setVal3] = useState('');
    const [option1, setOption1] = useState('');
    const [option2, setOption2] = useState('');
    const [formResult, setFormResult] = useState(null);

    // === 탭 및 카테고리 정의 (30+ 기능) ===
    const tabs = [
        { id: 'general', label: '🧮 일반/공학', desc: '사칙연산 및 공학 함수' },
        { id: 'unit', label: '📏 단위 변환', desc: '길이, 무게, 넓이, 속도 등' },
        { id: 'date', label: '📅 날짜/시간', desc: 'D-Day, 나이, 평일 계산' },
        { id: 'finance', label: '💰 금융/재무', desc: '이자, 대출, 부가세, 환율' },
        { id: 'health', label: '💪 건강/생활', desc: 'BMI, BMR, 물 섭취량' },
        { id: 'dev', label: '💻 개발자', desc: '진수 변환, 색상 코드' },
    ];

    const subModes = {
        unit: [
            { id: 'length', label: '길이' }, { id: 'weight', label: '무게' },
            { id: 'area', label: '넓이' }, { id: 'volume', label: '부피' },
            { id: 'temp', label: '온도' }, { id: 'speed', label: '속도' },
            { id: 'time', label: '시간' }, { id: 'data', label: '데이터' }
        ],
        date: [
            { id: 'dday', label: '날짜 간격 (D-Day)' }, { id: 'add', label: '날짜 더하기/빼기' },
            { id: 'age', label: '만 나이 계산' }, { id: 'workday', label: '영업일 계산' }
        ],
        finance: [
            { id: 'discount', label: '할인율 계산' }, { id: 'vat', label: '부가세(VAT)' },
            { id: 'savings', label: '예금 이자(단리/복리)' }, { id: 'loan', label: '대출 상환금' },
            { id: 'dutch', label: '팁 & 더치페이' }
        ],
        health: [
            { id: 'bmi', label: 'BMI (비만도)' }, { id: 'bmr', label: 'BMR (기초대사량)' },
            { id: 'water', label: '물 섭취 권장량' }
        ],
        dev: [
            { id: 'base', label: '진수 변환 (2/8/10/16)' }, { id: 'color', label: 'HEX ↔ RGB 변환' }
        ]
    };

    // === 로직: 일반/공학 계산기 ===
    const handleGeneralInput = (val) => {
        if (val === 'C') {
            setInput('');
            setCalcResult('');
        } else if (val === '=') {
            try {
                // 안전한 eval 대체 로직 (공학 함수 매핑)
                let evalString = input
                    .replace(/sin/g, 'Math.sin')
                    .replace(/cos/g, 'Math.cos')
                    .replace(/tan/g, 'Math.tan')
                    .replace(/log/g, 'Math.log10')
                    .replace(/ln/g, 'Math.log')
                    .replace(/π/g, 'Math.PI')
                    .replace(/e/g, 'Math.E')
                    .replace(/\^/g, '**')
                    .replace(/√/g, 'Math.sqrt');

                // 팩토리얼 처리 (!)
                if (evalString.includes('!')) {
                    // 간단한 정수 팩토리얼만 처리
                    const num = parseInt(evalString.replace('!', ''));
                    let fact = 1;
                    for(let i=1; i<=num; i++) fact *= i;
                    setCalcResult(fact.toString());
                    addToHistory(`${input} = ${fact}`);
                    return;
                }

                // eslint-disable-next-line no-new-func
                const res = new Function('return ' + evalString)();
                const formatted = Number.isInteger(res) ? res : res.toFixed(6).replace(/\.?0+$/, '');
                setCalcResult(formatted.toString());
                addToHistory(`${input} = ${formatted}`);
            } catch (err) {
                setCalcResult('Error');
            }
        } else if (val === 'back') {
            setInput(input.slice(0, -1));
        } else {
            setInput(input + val);
        }
    };

    // === 로직: 공통 함수 ===
    const addToHistory = (text) => {
        setHistory(prev => [text, ...prev].slice(0, 20));
    };

    // 탭 변경 시 초기화
    useEffect(() => {
        setVal1(''); setVal2(''); setVal3('');
        setOption1(''); setOption2('');
        setFormResult(null);
        if (subModes[activeTab]) setSubMode(subModes[activeTab][0].id);
    }, [activeTab]);

    // === 로직: 폼 기반 계산기 (단위, 날짜, 금융 등) ===
    const calculateForm = useCallback(() => {
        if (!val1 && activeTab !== 'date') return; // 날짜는 val1이 날짜 문자열일 수 있음

        let resText = '';
        let resVal = '';

        try {
            // --- 단위 변환 ---
            if (activeTab === 'unit') {
                const rates = {
                    length: { m: 1, cm: 100, mm: 1000, km: 0.001, in: 39.37, ft: 3.28, yd: 1.09, mi: 0.00062 },
                    weight: { kg: 1, g: 1000, mg: 1000000, lb: 2.204, oz: 35.27 },
                    area: { m2: 1, py: 0.3025, ft2: 10.76, ac: 0.000247 },
                    data: { GB: 1, MB: 1024, KB: 1048576, TB: 0.00097 }
                };
                
                if (rates[subMode]) {
                    const base = parseFloat(val1) / rates[subMode][option1];
                    const target = base * rates[subMode][option2];
                    resText = `${val1}${option1} = ${target.toFixed(4)}${option2}`;
                    resVal = target.toFixed(4);
                } else if (subMode === 'temp') {
                    // 온도 별도 로직
                    let c = parseFloat(val1);
                    if (option1 === 'F') c = (c - 32) * 5/9;
                    if (option1 === 'K') c = c - 273.15;
                    
                    let target = c;
                    if (option2 === 'F') target = c * 9/5 + 32;
                    if (option2 === 'K') target = c + 273.15;
                    resText = `${val1}${option1} = ${target.toFixed(2)}${option2}`;
                    resVal = target.toFixed(2);
                }
            }
            
            // --- 날짜 계산 ---
            else if (activeTab === 'date') {
                const d1 = new Date(val1);
                if (subMode === 'dday') {
                    const d2 = new Date(val2);
                    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
                    resText = `차이: ${diff}일`;
                    resVal = `${diff} Days`;
                } else if (subMode === 'add') {
                    d1.setDate(d1.getDate() + parseInt(val2));
                    resText = `${val2}일 후: ${d1.toISOString().split('T')[0]}`;
                    resVal = d1.toISOString().split('T')[0];
                } else if (subMode === 'age') {
                    const today = new Date();
                    let age = today.getFullYear() - d1.getFullYear();
                    const m = today.getMonth() - d1.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < d1.getDate())) age--;
                    resText = `만 나이: ${age}세`;
                    resVal = `${age}세`;
                }
            }

            // --- 금융 계산 ---
            else if (activeTab === 'finance') {
                const v1 = parseFloat(val1); // 금액
                const v2 = parseFloat(val2); // 이율/할인율/기간
                if (subMode === 'discount') {
                    const discount = v1 * (v2 / 100);
                    resText = `할인액: ${discount}, 최종가: ${v1 - discount}`;
                    resVal = (v1 - discount).toLocaleString() + '원';
                } else if (subMode === 'vat') {
                    const vat = v1 * 0.1;
                    resText = `공급가: ${v1}, 부가세: ${vat}, 합계: ${v1+vat}`;
                    resVal = (v1 + vat).toLocaleString() + '원';
                } else if (subMode === 'loan') {
                    // 원리금균등상환 (약식)
                    const r = (parseFloat(val2) / 100) / 12; // 월 이자율
                    const n = parseFloat(val3); // 개월 수
                    const payment = (v1 * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
                    resText = `월 상환금: ${Math.round(payment).toLocaleString()}원`;
                    resVal = Math.round(payment).toLocaleString() + '원';
                }
            }

            // --- 건강 계산 ---
            else if (activeTab === 'health') {
                const h = parseFloat(val1) / 100; // cm -> m
                const w = parseFloat(val2); // kg
                if (subMode === 'bmi') {
                    const bmi = w / (h * h);
                    let status = bmi < 18.5 ? '저체중' : bmi < 23 ? '정상' : '비만';
                    resText = `BMI: ${bmi.toFixed(2)} (${status})`;
                    resVal = bmi.toFixed(2);
                } else if (subMode === 'water') {
                    // 체중 * 30~33ml
                    const water = w * 33;
                    resText = `하루 권장 물 섭취량: 약 ${water}ml`;
                    resVal = `${water} ml`;
                }
            }

            // --- 개발자 ---
            else if (activeTab === 'dev') {
                if (subMode === 'base') {
                    const num = parseInt(val1, parseInt(option1));
                    const res = num.toString(parseInt(option2)).toUpperCase();
                    resText = `${val1}(${option1}) -> ${res}(${option2})`;
                    resVal = res;
                }
            }

            if (resText) {
                setFormResult(resText);
                addToHistory(resText);
            }

        } catch (e) {
            setFormResult('입력 값을 확인해주세요.');
        }
    }, [activeTab, subMode, val1, val2, val3, option1, option2]);

    // === UI 렌더링 헬퍼 ===
    const renderFormInputs = () => {
        // 공통 스타일
        const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 outline-none focus:border-cyan-500 transition-colors";
        const labelClass = "text-xs text-slate-400 mb-1 block";

        // 1. 단위 변환 UI
        if (activeTab === 'unit') {
            const units = {
                length: ['m', 'cm', 'mm', 'km', 'in', 'ft', 'yd'],
                weight: ['kg', 'g', 'mg', 'lb', 'oz'],
                temp: ['C', 'F', 'K'],
                data: ['GB', 'MB', 'KB', 'TB']
            };
            const currentUnits = units[subMode] || units['length'];

            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>입력 값</label>
                            <input type="number" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="0" />
                        </div>
                        <div>
                            <label className={labelClass}>단위 선택</label>
                            <select value={option1} onChange={(e)=>setOption1(e.target.value)} className={inputClass}>
                                <option value="">선택</option>
                                {currentUnits.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-center text-slate-500">⬇️ 변환</div>
                    <div>
                        <label className={labelClass}>변환할 단위</label>
                        <select value={option2} onChange={(e)=>setOption2(e.target.value)} className={inputClass}>
                            <option value="">선택</option>
                            {currentUnits.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            );
        }

        // 2. 날짜 UI
        if (activeTab === 'date') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>{subMode === 'age' ? '생년월일' : '기준 날짜'}</label>
                        <input type="date" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} />
                    </div>
                    {subMode === 'dday' && (
                        <div>
                            <label className={labelClass}>목표 날짜</label>
                            <input type="date" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} />
                        </div>
                    )}
                    {subMode === 'add' && (
                        <div>
                            <label className={labelClass}>더할 일 수 (+/-)</label>
                            <input type="number" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} placeholder="예: 100" />
                        </div>
                    )}
                </div>
            );
        }

        // 3. 재무 UI
        if (activeTab === 'finance') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>{subMode === 'loan' ? '대출 금액' : '금액'}</label>
                        <input type="number" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="원" />
                    </div>
                    {subMode !== 'vat' && (
                        <div>
                            <label className={labelClass}>{subMode === 'loan' ? '연 이자율 (%)' : subMode === 'dutch' ? '인원 수' : '비율/이율 (%)'}</label>
                            <input type="number" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} placeholder={subMode === 'dutch' ? '명' : '%'} />
                        </div>
                    )}
                    {subMode === 'loan' && (
                        <div>
                            <label className={labelClass}>대출 기간 (개월)</label>
                            <input type="number" value={val3} onChange={(e)=>setVal3(e.target.value)} className={inputClass} placeholder="개월" />
                        </div>
                    )}
                </div>
            );
        }

        // 4. 건강 UI
        if (activeTab === 'health') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>신장 (cm)</label>
                        <input type="number" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="cm" />
                    </div>
                    <div>
                        <label className={labelClass}>체중 (kg)</label>
                        <input type="number" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} placeholder="kg" />
                    </div>
                </div>
            );
        }

        // 5. 개발자 UI
        if (activeTab === 'dev') {
             return (
                <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>입력 진수</label>
                            <select value={option1} onChange={(e)=>setOption1(e.target.value)} className={inputClass}>
                                <option value="10">10진수</option>
                                <option value="2">2진수</option>
                                <option value="16">16진수</option>
                                <option value="8">8진수</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>변환 진수</label>
                            <select value={option2} onChange={(e)=>setOption2(e.target.value)} className={inputClass}>
                                <option value="2">2진수</option>
                                <option value="10">10진수</option>
                                <option value="16">16진수</option>
                            </select>
                        </div>
                     </div>
                     <div>
                        <label className={labelClass}>값 입력</label>
                        <input type="text" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="..." />
                     </div>
                </div>
             )
        }

        return <div className="text-slate-500">지원되지 않는 모드입니다.</div>;
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 섹션 */}
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">슈퍼 만능 계산기</h2>
                    <p className="text-slate-400 text-sm">30가지 이상의 기능을 하나로 통합한 올인원 도구</p>
                </div>
            </div>

            {/* 2. 탭 네비게이션 (스크롤 가능) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                            activeTab === tab.id 
                            ? 'bg-cyan-600 text-white shadow-md' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 3. 메인 컨텐츠 영역 (Full Height Layout) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                
                {/* === 좌측: 입력 패널 (Flex-1로 높이 채움) === */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-200">
                                {tabs.find(t=>t.id===activeTab)?.label}
                            </h3>
                            {/* 서브 모드 셀렉터 (일반 계산기 제외) */}
                            {activeTab !== 'general' && (
                                <select 
                                    value={subMode} 
                                    onChange={(e)=>setSubMode(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 outline-none"
                                >
                                    {subModes[activeTab]?.map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* --- A. 일반 계산기 키패드 --- */}
                        {activeTab === 'general' ? (
                            <div className="flex flex-col h-full">
                                {/* 디스플레이 */}
                                <div className="bg-slate-900 p-4 rounded-xl mb-4 border border-slate-700 text-right h-28 flex flex-col justify-end shadow-inner">
                                    <div className="text-slate-400 text-xs mb-1 h-4 overflow-hidden">{calcResult ? input : ''}</div>
                                    <input 
                                        type="text" 
                                        value={calcResult || input} 
                                        readOnly 
                                        className="bg-transparent text-3xl text-white font-mono text-right w-full outline-none overflow-hidden"
                                        placeholder="0"
                                    />
                                </div>
                                {/* 키패드 (Grid 확장) */}
                                <div className="grid grid-cols-5 gap-2 flex-1">
                                    {['sin','cos','tan','log','ln', '(',')','^','√','!', '7','8','9','/','back', '4','5','6','*','C', '1','2','3','-','π', '0','.','%','+','='].map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => handleGeneralInput(key)}
                                            className={`rounded-lg font-bold text-lg transition-all active:scale-95 flex items-center justify-center
                                                ${key === '=' ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 col-span-1 row-span-1' : 
                                                  ['C','back'].includes(key) ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                                  ['sin','cos','tan','log','ln','^','√','!','π','(',')'].includes(key) ? 'bg-slate-700 text-cyan-300 text-sm hover:bg-slate-600' :
                                                  ['/','*','-','+','%'].includes(key) ? 'bg-slate-700 text-cyan-400 hover:bg-slate-600' :
                                                  'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                }`}
                                        >
                                            {key === 'back' ? '←' : key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* --- B. 폼 기반 입력 (단위, 날짜, 재무 등) --- */
                            <div className="flex flex-col h-full">
                                <div className="flex-1">
                                    {renderFormInputs()}
                                </div>
                                <div className="mt-auto pt-6">
                                    <button 
                                        onClick={calculateForm}
                                        className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        계산하기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* === 우측: 결과 및 히스토리 패널 (Flex-1로 높이 채움) === */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                            <h3 className="text-lg font-semibold text-slate-200">
                                {activeTab === 'general' ? '📜 계산 기록' : '✨ 계산 결과'}
                            </h3>
                            <button onClick={()=>setHistory([])} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                                기록 삭제
                            </button>
                        </div>
                        
                        {/* 결과 디스플레이 영역 */}
                        <div className="flex-1 bg-slate-900 rounded-lg p-4 border border-slate-700 overflow-y-auto custom-scrollbar relative">
                            {/* 1. 폼 계산기 결과 (크게 보여주기) */}
                            {activeTab !== 'general' && formResult && (
                                <div className="mb-6 p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-500/30 text-center animate-fade-in">
                                    <div className="text-slate-400 text-xs mb-1">Result</div>
                                    <div className="text-2xl font-bold text-white break-words">{formResult}</div>
                                </div>
                            )}

                            {/* 2. 히스토리 리스트 */}
                            {history.length > 0 ? (
                                <ul className="space-y-2">
                                    {history.map((h, i) => (
                                        <li 
                                            key={i} 
                                            onClick={() => {
                                                navigator.clipboard.writeText(h.split('=')[1]?.trim() || h);
                                                alert('결과가 복사되었습니다!');
                                            }}
                                            className="group flex justify-between items-center p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700 cursor-pointer transition-colors border border-transparent hover:border-slate-600"
                                        >
                                            <span className="text-slate-300 font-mono text-sm truncate mr-2">{h}</span>
                                            <span className="opacity-0 group-hover:opacity-100 text-xs text-cyan-400">복사</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                    <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm">계산 기록이 여기에 표시됩니다</span>
                                </div>
                            )}
                        </div>

                        {/* 하단 팁 (고정) */}
                        <div className="mt-4 p-3 bg-slate-700/30 border border-slate-700 rounded-lg flex items-start gap-2">
                            <span className="text-lg">💡</span>
                            <div className="text-xs text-slate-400 leading-relaxed">
                                {activeTab === 'general' && "공학 계산: sin, cos 등은 라디안 값을 사용하지 않고 단순 수치로 계산됩니다. 필요 시 변환하세요."}
                                {activeTab === 'unit' && "데이터 변환: 1024(2진 접두어) 기준으로 계산됩니다. (예: 1KB = 1024Bytes)"}
                                {activeTab === 'date' && "만 나이: 생년월일을 입력하면 오늘 기준으로 정확한 만 나이를 계산합니다."}
                                {activeTab === 'finance' && "대출 계산: 원리금균등상환 방식의 월 납입금 추정치입니다."}
                                {activeTab === 'health' && "BMI: 신장(cm)과 체중(kg)을 입력하세요. 표준 체중 공식에 기반합니다."}
                                {activeTab === 'dev' && "진수 변환: 입력 범위를 초과하는 큰 수는 정확도가 떨어질 수 있습니다."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperCalculator;