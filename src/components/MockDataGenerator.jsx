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
    
    // 스키마 임포트 상태
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');

    // === 스키마 임포트 (JSON/CSV 자동 감지) ===
    const importSchema = () => {
        if (!importText.trim()) return;
        try {
            let sample = null;
            // JSON 시도
            try { sample = JSON.parse(importText); } catch {}
            if (!sample) {
                // CSV 시도
                const lines = importText.trim().split('\n');
                if (lines.length > 0) {
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                    sample = {};
                    if (lines.length > 1) {
                        const values = lines[1].split(',').map(v => v.trim().replace(/"/g, ''));
                        headers.forEach((h, i) => { sample[h] = values[i] || ''; });
                    } else {
                        headers.forEach(h => { sample[h] = ''; });
                    }
                }
            }
            if (!sample) return alert('JSON 또는 CSV 형식을 인식할 수 없습니다.');
            const obj = Array.isArray(sample) ? sample[0] : sample;
            if (!obj || typeof obj !== 'object') return alert('Object 형식의 데이터가 필요합니다.');
            const typeGuess = (key, val) => {
                const k = key.toLowerCase();
                if (k.includes('id') || k === '_id') return 'uuid';
                if (k.includes('email') || k.includes('mail')) return 'email';
                if (k.includes('phone') || k.includes('tel') || k.includes('mobile')) return 'phone';
                if (k.includes('name')) return 'name';
                if (k.includes('age')) return 'age';
                if (k.includes('city') || k.includes('address')) return 'city';
                if (k.includes('date') || k.includes('time') || k.includes('created') || k.includes('updated')) return 'date';
                if (k.includes('price') || k.includes('cost') || k.includes('amount') || k.includes('salary')) return 'price';
                if (k.includes('company') || k.includes('org')) return 'company';
                if (k.includes('job') || k.includes('role') || k.includes('position')) return 'job';
                if (typeof val === 'number') return 'number';
                if (typeof val === 'boolean') return 'boolean';
                return 'text';
            };
            const newFields = Object.entries(obj).map(([key, val], i) => ({
                id: Date.now() + i,
                name: key,
                type: typeGuess(key, val)
            }));
            setFields(newFields);
            setShowImport(false);
            setImportText('');
            alert(`✅ ${newFields.length}개 필드가 감지되었습니다!`);
        } catch (e) {
            alert('파싱 오류: ' + e.message);
        }
    };

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
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c =>
                    c === 'y' ? ((Math.random() * 4) | 8).toString(16) : (Math.random() * 16 | 0).toString(16)
                );
            case 'id': 
                return Math.floor(Math.random() * 10000) + 1;
            case 'name': 
                return locale === 'ko' ? random(set.lastNames) + random(set.firstNames) : random(set.firstNames) + ' ' + random(set.lastNames);
            case 'email': {
                const namePart = context.name ? (locale === 'ko' ? 'user' : context.name.split(' ')[0].toLowerCase()) : 'user';
                return `${namePart}${Math.floor(Math.random()*999)}@example.com`;
            }
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
            case 'date': {
                const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
                return date.toISOString().split('T')[0];
            }
            case 'boolean':
                return Math.random() > 0.5;
            case 'price':
                return Math.floor(Math.random() * 1000) * 1000;
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
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                        <Icon path="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">Mock Data Master Studio</h2>
                        <p className="text-xs text-slate-500">JSON, SQL, CSV 더미 데이터 생성 및 스키마 설계</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImport(v => !v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${showImport ? 'bg-violet-600/20 border-violet-500/40 text-violet-400' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                    >📥 스키마 임포트</button>
                    <button onClick={() => loadPreset('user')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-600 transition-colors">유저 프리셋</button>
                    <button onClick={() => loadPreset('product')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-600 transition-colors">상품 프리셋</button>
                </div>
            </div>

            {/* 스키마 임포트 패널 */}
            {showImport && (
                <div className="mb-4 p-4 bg-violet-900/20 border border-violet-500/30 rounded-xl flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-violet-400 uppercase">📥 JSON/CSV 스키마 자동 감지</h3>
                        <button onClick={() => setShowImport(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕ 닫기</button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">JSON 배열/객체 또는 CSV를 붙여넣으면 필드 구조를 자동으로 감지합니다.</p>
                    <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder={'[{"id":1,"name":"홍길동","email":"user@example.com"}]\n또는\nid,name,email\n1,홍길동,user@example.com'}
                        className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 outline-none focus:border-violet-500 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                        <button onClick={importSchema} className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors">
                            감지 후 필드 생성
                        </button>
                    </div>
                </div>
            )}

            {/* 2. 메인 컨텐츠 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 설정 및 스키마 빌더 (Col 4) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar">
                        
                        {/* 기본 설정 */}
                        <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Settings</h3>
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
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Schema Builder</h3>
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
                    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
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
                                                <th className="p-3 font-mono text-xs text-slate-500 border-b border-white/[0.05] w-10">#</th>
                                                {fields.map(f => (
                                                    <th key={f.id} className="p-3 font-bold text-slate-300 border-b border-white/[0.05] border-l border-white/[0.05]/50">{f.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="font-mono text-xs text-slate-400">
                                            {data.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/50 border-b border-white/[0.05]/50 last:border-0">
                                                    <td className="p-3 text-slate-600">{idx + 1}</td>
                                                    {fields.map(f => (
                                                        <td key={f.id} className="p-3 border-l border-white/[0.05]/50">
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