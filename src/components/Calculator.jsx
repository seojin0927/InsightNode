import React, { useState, useEffect, useCallback } from 'react';

const SuperCalculator = () => {
    // === 상태 관리 ===
    const [activeTab, setActiveTab] = useState('general'); 
    const [history, setHistory] = useState([]);

    // 일반/공학 계산기 상태
    const [input, setInput] = useState('');
    const [calcResult, setCalcResult] = useState('');

    // 서브 모드 관리
    const [subMode, setSubMode] = useState('length'); 
    
    // 공통 입력 값 관리
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');
    const [val3, setVal3] = useState('');
    const [option1, setOption1] = useState('');
    const [option2, setOption2] = useState('');
    const [formResult, setFormResult] = useState(null);

    // === 탭 및 카테고리 정의 ===
    const tabs = [
        { id: 'general', label: '🧮 일반/공학', desc: '공학용 계산 및 사칙연산' },
        { id: 'unit', label: '📏 단위 변환', desc: '요리, 압력, 에너지 추가' },
        { id: 'date', label: '📅 날짜/시간', desc: '시간 차이, 만 나이' },
        { id: 'finance', label: '💰 금융/재무', desc: '연봉, 단가, 적금' },
        { id: 'health', label: '💪 건강/운동', desc: '1RM, 체지방, 칼로리' },
        { id: 'dev', label: '💻 개발/도구', desc: 'Unix, URL, 비번생성' },
    ];

    const subModes = {
        unit: [
            { id: 'length', label: '길이 (m, inch...)' }, { id: 'weight', label: '무게 (kg, lb...)' },
            { id: 'area', label: '넓이 (평, m²...)' }, { id: 'volume', label: '부피 (L, gal...)' },
            { id: 'cooking', label: '🍳 요리 계량 (컵, 스푼)' },
            { id: 'temp', label: '온도 (C, F, K)' }, { id: 'pressure', label: '압력 (psi, bar)' },
            { id: 'energy', label: '에너지 (J, cal)' },
            { id: 'speed', label: '속도 (km/h, mph)' }, { id: 'data', label: '데이터 (MB, GB)' }
        ],
        date: [
            { id: 'dday', label: 'D-Day (날짜 간격)' }, { id: 'add', label: '날짜 계산 (+/-)' },
            { id: 'time_diff', label: '⏱️ 시간 차이 (시급 계산)' },
            { id: 'age', label: '나이 계산 (만/연)' }, { id: 'workday', label: '평일(영업일) 계산' }
        ],
        finance: [
            { id: 'salary', label: '💸 연봉 실수령액 (단순)' },
            { id: 'unit_price', label: '⚖️ 가성비 (단가 비교)' },
            { id: 'discount', label: '할인율 계산' }, { id: 'vat', label: '부가세(VAT)' },
            { id: 'savings', label: '적금/예금 이자' }, { id: 'loan', label: '대출 상환금' },
            { id: 'dutch', label: 'N빵 (팁 포함)' }
        ],
        health: [
            { id: 'bmi', label: 'BMI (비만도)' }, { id: 'bmr', label: 'BMR (기초대사량)' },
            { id: '1rm', label: '🏋️‍♀️ 1RM (운동 최대중량)' },
            { id: 'bodyfat', label: '체지방률 (추정)' },
            { id: 'water', label: '물 섭취 권장량' }
        ],
        dev: [
            { id: 'text_len', label: '📝 글자 수 세기' },
            { id: 'password', label: '🔐 비밀번호 생성' },
            { id: 'unix', label: 'Unix Timestamp 변환' },
            { id: 'url', label: 'URL 인코딩/디코딩' },
            { id: 'base', label: '진수 변환 (2/8/10/16)' }, { id: 'color', label: 'HEX ↔ RGB' }
        ]
    };

    // 괄호 개수 카운트 헬퍼 함수
    const getMissingParentheses = (str) => {
        const openCount = (str.match(/\(/g) || []).length;
        const closeCount = (str.match(/\)/g) || []).length;
        return Math.max(0, openCount - closeCount);
    };

    // === 로직 1: 일반/공학 계산기 (괄호 자동 닫기 기능 추가) ===
    const handleGeneralInput = (val) => {
        if (val === 'C') {
            setInput('');
            setCalcResult('');
        } else if (val === 'back') {
            setInput(input.slice(0, -1));
        } else if (val === '=') {
            try {
                // [자동 닫기] '=' 누를 때 닫히지 않은 괄호가 있다면 자동으로 닫음
                let evalStr = input;
                const missing = getMissingParentheses(evalStr);
                if (missing > 0) {
                    evalStr += ')'.repeat(missing);
                    // UI에는 반영하지 않고 계산에만 쓸지, UI도 바꿀지 결정 (여기선 계산만)
                    // 만약 UI도 바꾸고 싶다면: setInput(evalStr);
                }

                // 1. 전처리: 공학용 표기를 JS Math 함수로 변환
                let processedStr = evalStr
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/π/g, 'Math.PI')
                    .replace(/e/g, 'Math.E')
                    .replace(/\^/g, '**')
                    .replace(/√\(/g, 'Math.sqrt(')
                    .replace(/√(\d+)/g, 'Math.sqrt($1)') 
                    .replace(/sin\(([^)]+)\)/g, 'Math.sin($1 * Math.PI / 180)')
                    .replace(/cos\(([^)]+)\)/g, 'Math.cos($1 * Math.PI / 180)')
                    .replace(/tan\(([^)]+)\)/g, 'Math.tan($1 * Math.PI / 180)')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(');

                if (processedStr.includes('!')) {
                    const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
                    processedStr = processedStr.replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)));
                }

                // eslint-disable-next-line no-new-func
                const rawRes = new Function('return ' + processedStr)();
                
                let formatted = Number.isInteger(rawRes) ? rawRes : parseFloat(rawRes.toFixed(8));
                if (isNaN(formatted)) throw new Error("NaN");
                
                // 결과 저장 시, 자동으로 닫은 괄호까지 보여줄지 여부 (여기선 원본+결과)
                // 만약 자동으로 닫힌 형태를 보여주고 싶다면 addToHistory(`${evalStr} = ${formatted}`)
                setCalcResult(formatted.toString());
                addToHistory(`${evalStr} = ${formatted}`);
                // 계산 후에는 보통 리셋 혹은 이어서 계산 (여기선 결과값만 남김)
            } catch (err) {
                setCalcResult('Error');
            }
        } else {
            // [자동 닫기] 연산자(+, -, *, /, ^, %) 입력 시 닫히지 않은 괄호 자동 닫기
            if (['+', '-', '×', '÷', '^', '%'].includes(val)) {
                let currentInput = input;
                const missing = getMissingParentheses(currentInput);
                
                // 괄호가 열려있고, 마지막 글자가 숫자거나 ')'일 때만 닫음 (sin(+ 처럼 되는것 방지)
                // 하지만 보통 log(9 + 이렇게 치면 log(9)+ 가 되길 원하므로 단순 개수 비교
                if (missing > 0) {
                    currentInput += ')'.repeat(missing);
                }
                setInput(currentInput + val);
            } else {
                // 일반 입력
                let add = val;
                if (['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(val)) {
                    add = val + '('; 
                }
                setInput(input + add);
            }
        }
    };

    // === 로직 2: 공통 유틸리티 ===
    const addToHistory = (text) => {
        setHistory(prev => [text, ...prev].slice(0, 30));
    };

    useEffect(() => {
        setVal1(''); setVal2(''); setVal3('');
        setOption1(''); setOption2('');
        setFormResult(null);
        if (subModes[activeTab]) setSubMode(subModes[activeTab][0].id);
    }, [activeTab]);

    // === 로직 3: 폼 기반 슈퍼 계산기 ===
    const calculateForm = useCallback(() => {
        if (!val1 && !['password', 'date'].includes(activeTab) && subMode !== 'time_diff') return; 

        let rText = '';

        try {
            const v1 = parseFloat(val1);
            const v2 = parseFloat(val2);
            const v3 = parseFloat(val3);

            // [단위 변환]
            if (activeTab === 'unit') {
                const rates = {
                    length: { m: 1, cm: 100, mm: 1000, km: 0.001, in: 39.37, ft: 3.28, yd: 1.09 },
                    weight: { kg: 1, g: 1000, lb: 2.204, oz: 35.27, ton: 0.001 },
                    area: { m2: 1, py: 0.3025, ft2: 10.76, ac: 0.000247, ha: 0.0001 },
                    volume: { L: 1, ml: 1000, gal: 0.264, oz: 33.81 },
                    cooking: { cup: 1, tbsp: 16, tsp: 48, ml: 240, oz: 8 }, 
                    pressure: { atm: 1, Pa: 101325, bar: 1.013, psi: 14.69 },
                    energy: { J: 1, cal: 0.239, kcal: 0.000239, kWh: 2.77e-7 },
                    data: { GB: 1, MB: 1024, KB: 1048576, TB: 0.00097 }
                };

                if (subMode === 'temp') {
                    let c = v1;
                    if (option1 === 'F') c = (v1 - 32) * 5/9;
                    if (option1 === 'K') c = v1 - 273.15;
                    let t = c;
                    if (option2 === 'F') t = c * 9/5 + 32;
                    if (option2 === 'K') t = c + 273.15;
                    rText = `${t.toFixed(2)} ${option2}`;
                } else if (rates[subMode]) {
                    const base = v1 / rates[subMode][option1];
                    const target = base * rates[subMode][option2];
                    rText = `${val1}${option1} = ${target.toLocaleString(undefined, {maximumFractionDigits:4})} ${option2}`;
                }
            }
            // [날짜/시간]
            else if (activeTab === 'date') {
                const d1 = new Date(val1);
                if (subMode === 'dday') {
                    const d2 = new Date(val2);
                    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
                    rText = diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
                } else if (subMode === 'add') {
                    d1.setDate(d1.getDate() + parseInt(val2));
                    rText = d1.toISOString().split('T')[0];
                } else if (subMode === 'age') {
                    const today = new Date();
                    let age = today.getFullYear() - d1.getFullYear();
                    const m = today.getMonth() - d1.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < d1.getDate())) age--;
                    rText = `만 ${age}세 (연 ${today.getFullYear() - d1.getFullYear()}세)`;
                } else if (subMode === 'time_diff') {
                    const [h1, m1] = val1.split(':').map(Number);
                    const [h2, m2] = val2.split(':').map(Number);
                    let minDiff = (h2 * 60 + m2) - (h1 * 60 + m1);
                    if (minDiff < 0) minDiff += 24 * 60; 
                    const hrs = Math.floor(minDiff / 60);
                    const mins = minDiff % 60;
                    rText = `${hrs}시간 ${mins}분 차이`;
                    if (v3) rText += ` (급여: ${(minDiff/60 * v3).toLocaleString()}원)`;
                }
            }
            // [금융]
            else if (activeTab === 'finance') {
                if (subMode === 'salary') {
                    const pension = v1 * 0.045; 
                    const health = v1 * 0.03545; 
                    const care = health * 0.1281; 
                    const emp = v1 * 0.009; 
                    const tax = v1 * 0.05; 
                    const totalTax = pension + health + care + emp + tax;
                    rText = `월 예상 실수령: ${Math.round((v1 - totalTax)/12).toLocaleString()}원`;
                } else if (subMode === 'unit_price') {
                    const unitP = v1 / v2;
                    rText = `1단위당 ${unitP.toFixed(1)}원`;
                } else if (subMode === 'discount') {
                    const dc = v1 * (v2 / 100);
                    rText = `최종가: ${(v1 - dc).toLocaleString()}원 (절약: ${dc.toLocaleString()})`;
                } else if (subMode === 'loan') { 
                    const r = (v2 / 100) / 12;
                    const res = (v1 * r * Math.pow(1+r, v3)) / (Math.pow(1+r, v3) - 1);
                    rText = `월 납입금: ${Math.round(res).toLocaleString()}원`;
                } else if (subMode === 'dutch') {
                    rText = `1인당: ${Math.ceil(v1 / v2).toLocaleString()}원`;
                }
            }
            // [건강]
            else if (activeTab === 'health') {
                if (subMode === 'bmi') {
                    const h = v1 / 100;
                    const bmi = v2 / (h * h);
                    rText = `BMI: ${bmi.toFixed(1)} (${bmi<23?'정상':bmi<25?'과체중':'비만'})`;
                } else if (subMode === '1rm') { 
                    const oneRm = v1 * (1 + v2/30);
                    rText = `추정 1RM: ${Math.round(oneRm)}kg`;
                } else if (subMode === 'bodyfat') { 
                    const res = 86.010 * Math.log10(v3 - v2) - 70.041 * Math.log10(v1) + 36.76;
                    rText = `추정 체지방률: ${res.toFixed(1)}%`;
                }
            }
            // [개발/도구]
            else if (activeTab === 'dev') {
                if (subMode === 'text_len') {
                    rText = `공백포함: ${val1.length}자 / 공백제외: ${val1.replace(/\s/g,'').length}자`;
                } else if (subMode === 'password') {
                    const len = parseInt(val1) || 12;
                    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                    let pwd = "";
                    for(let i=0; i<len; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                    rText = pwd;
                } else if (subMode === 'unix') {
                    const date = new Date(v1 * 1000);
                    rText = date.toLocaleString();
                } else if (subMode === 'url') {
                    rText = option1 === 'enc' ? encodeURIComponent(val1) : decodeURIComponent(val1);
                } else if (subMode === 'base') {
                    const n = parseInt(val1, parseInt(option1));
                    rText = n.toString(parseInt(option2)).toUpperCase();
                }
            }

            if (rText) {
                setFormResult(rText);
                addToHistory(activeTab === 'dev' && subMode === 'password' ? '비밀번호 생성됨' : rText);
            }
        } catch (e) {
            setFormResult('입력 값을 확인해주세요.');
        }
    }, [activeTab, subMode, val1, val2, val3, option1, option2]);

    // === UI 렌더링 헬퍼 ===
    const renderFormInputs = () => {
        const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 outline-none focus:border-cyan-500 transition-colors";
        const labelClass = "text-xs text-slate-400 mb-1 block";

        if (activeTab === 'unit') {
            const units = {
                length: ['m', 'cm', 'mm', 'km', 'in', 'ft', 'yd'],
                weight: ['kg', 'g', 'lb', 'oz', 'ton'],
                area: ['m2', 'py', 'ft2', 'ac'],
                volume: ['L', 'ml', 'gal', 'oz'],
                cooking: ['cup', 'tbsp', 'tsp', 'ml', 'oz'],
                pressure: ['atm', 'Pa', 'bar', 'psi'],
                energy: ['J', 'cal', 'kcal', 'kWh'],
                temp: ['C', 'F', 'K'],
                data: ['GB', 'MB', 'TB']
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
                            <label className={labelClass}>현재 단위</label>
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

        if (activeTab === 'date') {
            if (subMode === 'time_diff') {
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelClass}>시작 시간</label><input type="time" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>종료 시간</label><input type="time" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} /></div>
                        </div>
                        <div><label className={labelClass}>시급 (선택)</label><input type="number" value={val3} onChange={(e)=>setVal3(e.target.value)} className={inputClass} placeholder="예: 9860" /></div>
                    </div>
                )
            }
            return (
                <div className="space-y-4">
                    <div><label className={labelClass}>{subMode === 'age' ? '생년월일' : '기준 날짜'}</label><input type="date" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} /></div>
                    {subMode === 'dday' && <div><label className={labelClass}>목표 날짜</label><input type="date" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} /></div>}
                    {subMode === 'add' && <div><label className={labelClass}>더할 일 수 (+/-)</label><input type="number" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} placeholder="예: 100" /></div>}
                </div>
            );
        }

        if (activeTab === 'finance') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>{subMode === 'salary' ? '연봉 (원)' : subMode === 'unit_price' ? '가격 (원)' : subMode === 'loan' ? '대출 원금' : '금액'}</label>
                        <input type="number" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="숫자만 입력" />
                    </div>
                    {subMode !== 'vat' && (
                        <div>
                            <label className={labelClass}>
                                {subMode === 'salary' ? '비과세액 (선택)' : subMode === 'unit_price' ? '용량/개수' : subMode === 'loan' ? '연 이자율 (%)' : subMode === 'dutch' ? '인원 수' : '비율/이율 (%)'}
                            </label>
                            <input type="number" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} />
                        </div>
                    )}
                    {subMode === 'loan' && <div><label className={labelClass}>대출 기간 (개월)</label><input type="number" value={val3} onChange={(e)=>setVal3(e.target.value)} className={inputClass} placeholder="개월" /></div>}
                </div>
            );
        }

        if (activeTab === 'health') {
            return (
                <div className="space-y-4">
                    {subMode === '1rm' ? (
                        <>
                            <div><label className={labelClass}>들어올린 무게 (kg)</label><input type="number" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>반복 횟수 (reps)</label><input type="number" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} /></div>
                        </>
                    ) : (
                        <>
                            <div><label className={labelClass}>신장 (cm)</label><input type="number" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>{subMode==='bodyfat'?'목둘레 (cm)':'체중 (kg)'}</label><input type="number" value={val2} onChange={(e)=>setVal2(e.target.value)} className={inputClass} /></div>
                            {subMode === 'bodyfat' && <div><label className={labelClass}>허리둘레 (cm)</label><input type="number" value={val3} onChange={(e)=>setVal3(e.target.value)} className={inputClass} /></div>}
                        </>
                    )}
                </div>
            );
        }

        if (activeTab === 'dev') {
             if (subMode === 'text_len') return <div className="space-y-2"><label className={labelClass}>텍스트 입력</label><textarea value={val1} onChange={(e)=>setVal1(e.target.value)} className={`${inputClass} h-32 resize-none`} placeholder="내용을 붙여넣으세요" /></div>
             if (subMode === 'password') return <div><label className={labelClass}>비밀번호 길이</label><input type="number" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="기본 12자리" /></div>
             if (subMode === 'unix') return <div><label className={labelClass}>Unix Timestamp (Seconds)</label><input type="number" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="167..." /></div>
             if (subMode === 'url') return <div className="space-y-4"><select value={option1} onChange={(e)=>setOption1(e.target.value)} className={inputClass}><option value="enc">Encoding (특수문자 → %)</option><option value="dec">Decoding (% → 특수문자)</option></select><input type="text" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="URL 입력" /></div>
             return (
                <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelClass}>입력 진수</label><select value={option1} onChange={(e)=>setOption1(e.target.value)} className={inputClass}><option value="10">10진수</option><option value="2">2진수</option><option value="16">16진수</option><option value="8">8진수</option></select></div>
                        <div><label className={labelClass}>변환 진수</label><select value={option2} onChange={(e)=>setOption2(e.target.value)} className={inputClass}><option value="2">2진수</option><option value="10">10진수</option><option value="16">16진수</option></select></div>
                      </div>
                      <input type="text" value={val1} onChange={(e)=>setVal1(e.target.value)} className={inputClass} placeholder="값 입력" />
                </div>
             )
        }
        return <div className="text-slate-500">지원되지 않는 모드입니다.</div>;
    };

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* 1. 헤더 섹션 */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-100">슈퍼 만능 계산기 PRO</h2>
                    <p className="text-xs text-slate-500">35가지 기능을 탑재한 올인원 도구</p>
                </div>
            </div>

            {/* 2. 탭 네비게이션 */}
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

            {/* 3. 메인 컨텐츠 영역 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* 좌측 패널 */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-200">
                                {tabs.find(t=>t.id===activeTab)?.label}
                            </h3>
                            {activeTab !== 'general' && (
                                <div className="relative group">
                                    {/* Select 디자인 개선: 기본 화살표 숨기고 커스텀 디자인 적용 */}
                                    <select 
                                        value={subMode} 
                                        onChange={(e)=>setSubMode(e.target.value)}
                                        className="appearance-none bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 text-xs rounded-lg pl-3 pr-8 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all cursor-pointer shadow-sm min-w-[140px]"
                                    >
                                        {subModes[activeTab]?.map(m => (
                                            <option key={m.id} value={m.id}>{m.label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500 group-hover:text-cyan-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>

                        {activeTab === 'general' ? (
                            <div className="flex flex-col h-full">
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
                                <div className="grid grid-cols-5 gap-2 flex-1">
                                    {['sin','cos','tan','log','ln', '(',')','^','√','!', '7','8','9','÷','back', '4','5','6','×','C', '1','2','3','-','π', '0','.','%','+','='].map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => handleGeneralInput(key)}
                                            className={`rounded-lg font-bold text-lg transition-all active:scale-95 flex items-center justify-center
                                                ${key === '=' ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 col-span-1 row-span-1' : 
                                                  ['C','back'].includes(key) ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                                  ['sin','cos','tan','log','ln','^','√','!','π','(',')'].includes(key) ? 'bg-slate-700 text-cyan-300 text-sm hover:bg-slate-600' :
                                                  ['÷','×','-','+','%'].includes(key) ? 'bg-slate-700 text-cyan-400 hover:bg-slate-600' :
                                                  'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                }`}
                                        >
                                            {key === 'back' ? '←' : key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
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
                                        {activeTab === 'dev' && subMode === 'password' ? '비밀번호 생성' : '계산하기'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 우측 패널 */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                            <h3 className="text-lg font-semibold text-slate-200">
                                {activeTab === 'general' ? '📜 계산 기록' : '✨ 결과 확인'}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (!history.length) return;
                                        const csv = 'Expression\n' + history.join('\n');
                                        const blob = new Blob([csv], { type: 'text/csv' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a'); a.href = url; a.download = 'calc_history.csv'; a.click();
                                    }}
                                    disabled={!history.length}
                                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-30"
                                >CSV 저장</button>
                                <button onClick={()=>setHistory([])} className="text-xs text-slate-500 hover:text-red-400 transition-colors">기록 삭제</button>
                            </div>
                        </div>
                        
                        <div className="flex-1 bg-slate-900 rounded-lg p-4 border border-slate-700 overflow-y-auto custom-scrollbar relative">
                            {activeTab !== 'general' && formResult && (
                                <div className="mb-6 p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-500/30 text-center animate-fade-in">
                                    <div className="text-slate-400 text-xs mb-1">Result</div>
                                    <div className="text-2xl font-bold text-white break-words">{formResult}</div>
                                </div>
                            )}

                            {history.length > 0 ? (
                                <ul className="space-y-2">
                                    {history.map((h, i) => (
                                        <li 
                                            key={i} 
                                            onClick={() => {
                                                navigator.clipboard.writeText(h.includes('=') ? h.split('=')[1].trim() : h);
                                                alert('복사되었습니다.');
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
                                    <span className="text-sm">계산 결과가 여기에 쌓입니다</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 p-3 bg-slate-700/30 border border-slate-700 rounded-lg flex items-start gap-2">
                            <span className="text-lg">💡</span>
                            <div className="text-xs text-slate-400 leading-relaxed">
                                {activeTab === 'general' && "삼각함수(sin, cos)는 60분법(도)을 기준으로 계산됩니다. 예: sin(30) = 0.5"}
                                {activeTab === 'unit' && "요리 계량은 1컵=240ml(미국 기준)를 사용합니다."}
                                {activeTab === 'date' && "시급 계산: 휴게 시간은 제외하고 입력된 시간 차이로만 계산됩니다."}
                                {activeTab === 'finance' && "연봉 계산: 비과세액 및 부양가족 등에 따라 실제 수령액과 차이가 있을 수 있습니다."}
                                {activeTab === 'health' && "1RM: Epley 공식을 사용한 추정치입니다. 실제 운동 수행 능력과 다를 수 있습니다."}
                                {activeTab === 'dev' && "Unix Timestamp는 초(Second) 단위로 입력/변환됩니다."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperCalculator;