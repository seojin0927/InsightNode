import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse'; // CSV 처리를 위해 필요

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const MockDataStudio = () => {
    // === 상태 관리 ===
    const [rowCount, setRowCount] = useState(10);
    const [format, setFormat] = useState('json'); // json, csv, sql, xml
    const [locale, setLocale] = useState('ko'); // ko, us
    const [tableName, setTableName] = useState('USERS');
    const [activeView, setActiveView] = useState('table'); // table, code
    const [data, setData] = useState([]);
    
    // 필드 스키마 정의
    const [fields, setFields] = useState([
        { id: 1, name: 'id', type: 'uuid' },
        { id: 2, name: 'name', type: 'name' },
        { id: 3, name: 'email', type: 'email' },
        { id: 4, name: 'phone', type: 'phone' },
        { id: 5, name: 'role', type: 'job' },
    ]);

    // === 데이터셋 (Mini Faker) ===
    const datasets = {
        ko: {
            lastNames: ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'],
            firstNames: ['민준', '서준', '도윤', '예준', '시우', '서연', '지우', '서현', '하은', '민지'],
            cities: ['서울', '부산', '인천', '대구', '대전', '광주', '울산', '수원'],
            districts: ['강남구', '서초구', '송파구', '마포구', '영등포구', '종로구'],
            jobs: ['개발자', '디자이너', '기획자', '마케터', 'CEO', 'CTO', '매니저'],
            companies: ['삼성전자', 'LG전자', '현대자동차', '네이버', '카카오', '쿠팡', '배달의민족']
        },
        us: {
            lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'],
            firstNames: ['James', 'John', 'Robert', 'Michael', 'William', 'Mary', 'Patricia', 'Jennifer'],
            cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
            districts: ['Downtown', 'West Side', 'East Village', 'Brooklyn'],
            jobs: ['Developer', 'Designer', 'Product Manager', 'Analyst', 'Director'],
            companies: ['Google', 'Apple', 'Amazon', 'Microsoft', 'Tesla', 'Meta']
        }
    };

    // === 데이터 생성 엔진 ===
    const generateValue = (type, context) => {
        const set = datasets[locale];
        const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
        
        switch (type) {
            case 'uuid': 
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0).toString(16));
            case 'id': 
                return Math.floor(Math.random() * 10000) + 1;
            case 'name': 
                return locale === 'ko' ? random(set.lastNames) + random(set.firstNames) : random(set.firstNames) + ' ' + random(set.lastNames);
            case 'email':
                const namePart = context.name ? (locale === 'ko' ? 'user' : context.name.split(' ')[0].toLowerCase()) : 'user';
                return `${namePart}${Math.floor(Math.random()*999)}@example.com`;
            case 'phone':
                return `010-${Math.floor(Math.random()*9000)+1000}-${Math.floor(Math.random()*9000)+1000}`;
            case 'age':
                return Math.floor(Math.random() * 60) + 18;
            case 'city':
                return random(set.cities);
            case 'address':
                return `${random(set.cities)} ${random(set.districts)} ${Math.floor(Math.random()*100)}번길 ${Math.floor(Math.random()*50)}`;
            case 'company':
                return random(set.companies);
            case 'job':
                return random(set.jobs);
            case 'date':
                const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
                return date.toISOString().split('T')[0];
            case 'boolean':
                return Math.random() > 0.5;
            case 'price':
                return (Math.floor(Math.random() * 1000) * 1000).toLocaleString();
            case 'image':
                return `https://i.pravatar.cc/150?u=${Math.random()}`;
            default: return '';
        }
    };

    const generateData = useCallback(() => {
        const newData = [];
        for (let i = 0; i < rowCount; i++) {
            const row = {};
            // 순차적 생성 (name이 email 생성에 영향 줄 수 있도록)
            fields.forEach(field => {
                row[field.name] = generateValue(field.type, row);
            });
            newData.push(row);
        }
        setData(newData);
    }, [rowCount, fields, locale]);

    // 초기 로드 및 의존성 변경 시 자동 재생성
    useEffect(() => {
        generateData();
    }, [generateData]);

    // === 포맷터 ===
    const getFormattedOutput = () => {
        if (format === 'json') return JSON.stringify(data, null, 2);
        if (format === 'csv') return Papa.unparse(data);
        if (format === 'sql') {
            if (data.length === 0) return '';
            const cols = Object.keys(data[0]).join(', ');
            const vals = data.map(row => 
                `(${Object.values(row).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`
            ).join(',\n');
            return `INSERT INTO ${tableName} (${cols}) VALUES\n${vals};`;
        }
        if (format === 'xml') {
            return `<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n${data.map(row => 
                `  <row>\n${Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join('\n')}\n  </row>`
            ).join('\n')}\n</rows>`;
        }
        return '';
    };

    // === 핸들러 ===
    const addField = () => {
        setFields([...fields, { id: Date.now(), name: 'new_field', type: 'name' }]);
    };

    const removeField = (id) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id, key, val) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: val } : f));
    };

    const loadPreset = (type) => {
        if (type === 'user') {
            setFields([
                { id: 1, name: 'user_id', type: 'uuid' },
                { id: 2, name: 'username', type: 'name' },
                { id: 3, name: 'email', type: 'email' },
                { id: 4, name: 'is_active', type: 'boolean' }
            ]);
        } else if (type === 'product') {
            setFields([
                { id: 1, name: 'product_id', type: 'id' },
                { id: 2, name: 'product_name', type: 'company' }, // 임시
                { id: 3, name: 'price', type: 'price' },
                { id: 4, name: 'created_at', type: 'date' }
            ]);
        }
    };

    const downloadFile = () => {
        const content = getFormattedOutput();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mock_data.${format}`;
        a.click();
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Icon path="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Mock Data Master Studio</h2>
                        <p className="text-slate-400 text-sm">JSON, SQL, CSV 더미 데이터 생성 및 스키마 설계</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => loadPreset('user')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-600 transition-colors">유저 프리셋</button>
                    <button onClick={() => loadPreset('product')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-600 transition-colors">상품 프리셋</button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 설정 및 스키마 빌더 (Col 4) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar">
                        
                        {/* 기본 설정 */}
                        <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Settings</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">생성 개수</label>
                                    <input type="number" value={rowCount} onChange={(e) => setRowCount(Math.min(1000, Number(e.target.value)))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">언어 (Locale)</label>
                                    <select value={locale} onChange={(e) => setLocale(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white">
                                        <option value="ko">한국어 (KO)</option>
                                        <option value="us">English (US)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">출력 포맷</label>
                                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-600">
                                    {['json', 'csv', 'sql', 'xml'].map(f => (
                                        <button 
                                            key={f} 
                                            onClick={() => setFormat(f)}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded uppercase transition-colors ${format === f ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {format === 'sql' && (
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">테이블 이름</label>
                                    <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                                </div>
                            )}
                        </div>

                        {/* 스키마 빌더 */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Schema Builder</h3>
                                <button onClick={addField} className="text-xs text-violet-400 hover:text-violet-300 font-bold">+ 필드 추가</button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {fields.map((field) => (
                                    <div key={field.id} className="flex gap-2 items-center bg-slate-700/50 p-2 rounded-lg border border-slate-600 group">
                                        <input 
                                            type="text" 
                                            value={field.name} 
                                            onChange={(e) => updateField(field.id, 'name', e.target.value)}
                                            className="w-1/3 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white" 
                                            placeholder="필드명"
                                        />
                                        <select 
                                            value={field.type} 
                                            onChange={(e) => updateField(field.id, 'type', e.target.value)}
                                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300"
                                        >
                                            <option value="uuid">UUID</option>
                                            <option value="id">ID (숫자)</option>
                                            <option value="name">이름</option>
                                            <option value="email">이메일</option>
                                            <option value="phone">전화번호</option>
                                            <option value="age">나이</option>
                                            <option value="city">도시</option>
                                            <option value="address">주소</option>
                                            <option value="company">회사명</option>
                                            <option value="job">직업</option>
                                            <option value="date">날짜</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="price">가격</option>
                                            <option value="image">이미지 URL</option>
                                        </select>
                                        <button 
                                            onClick={() => removeField(field.id)}
                                            className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={generateData}
                            className="mt-4 w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Icon path="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            데이터 재생성
                        </button>
                    </div>
                </div>

                {/* 우측: 미리보기 및 코드 (Col 8) */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50">
                        {/* 뷰 탭 & 액션 */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-4 border-b border-slate-700">
                                <button 
                                    onClick={() => setActiveView('table')}
                                    className={`pb-2 text-sm font-bold transition-colors ${activeView === 'table' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Table View
                                </button>
                                <button 
                                    onClick={() => setActiveView('code')}
                                    className={`pb-2 text-sm font-bold transition-colors ${activeView === 'code' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Code View ({format.toUpperCase()})
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => navigator.clipboard.writeText(getFormattedOutput())}
                                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Copy
                                </button>
                                <button 
                                    onClick={downloadFile}
                                    className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-lg"
                                >
                                    Download
                                </button>
                            </div>
                        </div>

                        {/* 컨텐츠 영역 */}
                        <div className="flex-1 overflow-hidden bg-slate-900 rounded-xl border border-slate-700 relative">
                            {activeView === 'table' ? (
                                <div className="absolute inset-0 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-950 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 font-mono text-xs text-slate-500 border-b border-slate-800 w-10">#</th>
                                                {fields.map(f => (
                                                    <th key={f.id} className="p-3 font-bold text-slate-300 border-b border-slate-800 border-l border-slate-800/50">{f.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="font-mono text-xs text-slate-400">
                                            {data.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/50 border-b border-slate-800/50 last:border-0">
                                                    <td className="p-3 text-slate-600">{idx + 1}</td>
                                                    {fields.map(f => (
                                                        <td key={f.id} className="p-3 border-l border-slate-800/50">
                                                            {f.type === 'image' ? (
                                                                <img src={row[f.name]} alt="avatar" className="w-6 h-6 rounded-full" />
                                                            ) : String(row[f.name])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <textarea
                                    readOnly
                                    value={getFormattedOutput()}
                                    className="w-full h-full bg-slate-950 text-violet-100 p-4 font-mono text-sm resize-none outline-none custom-scrollbar leading-relaxed"
                                />
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MockDataStudio;