import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ExtractStudio = () => {
    // === 상태 관리 ===
    const [input, setInput] = useState('');
    const [result, setResult] = useState([]);
    const [type, setType] = useState('email');
    const [customRegex, setCustomRegex] = useState('');
    const [stats, setStats] = useState({});
    
    // 옵션
    const [options, setOptions] = useState({
        unique: true,
        sort: 'asc', // asc, desc, none
        case: 'none', // upper, lower, none
        format: 'none', // hyphen, none (for phone)
        prefix: '',
        suffix: ''
    });

    // 샘플 데이터
    const sampleData = `
        Contact List:
        - John Doe: john.doe@example.com (010-1234-5678)
        - Jane Smith: jane_smith@work.org (02-987-6543)
        - Support Team: support@service.net, help@service.net
        - Website: https://www.example.com, http://blog.test.co.kr
        - IPs: 192.168.0.1, 10.0.0.5
        - Dates: 2024-01-01, 2023/12/25
        - Prices: $100.00, 50,000원
        - Colors: #FF5733, rgb(0, 255, 0)
        - Hashtags: #coding #react #javascript
    `;

    // === 정규식 패턴 라이브러리 (15+) ===
    const patterns = {
        email: { label: '📧 이메일', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
        url: { label: '🔗 URL', regex: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g },
        phone: { label: '📞 전화번호', regex: /(\d{2,3}[-.\s]?)?\d{3,4}[-.\s]?\d{4}/g },
        ip: { label: '🌐 IPv4', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
        date: { label: '📅 날짜 (YYYY-MM-DD)', regex: /\d{4}[-/]\d{2}[-/]\d{2}/g },
        time: { label: '⏰ 시간 (HH:MM)', regex: /\b([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?\b/g },
        creditCard: { label: '💳 신용카드', regex: /\b(?:\d[ -]*?){13,16}\b/g },
        businessNum: { label: '🏢 사업자번호', regex: /\d{3}-\d{2}-\d{5}/g },
        hashtag: { label: '#️⃣ 해시태그', regex: /#[a-zA-Z0-9_가-힣]+/g },
        mention: { label: '@ 멘션', regex: /@[a-zA-Z0-9_]+/g },
        hexColor: { label: '🎨 Hex Color', regex: /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/g },
        price: { label: '💰 금액', regex: /[$₩]\s?\d+(,\d{3})*(\.\d{2})?|\d+(,\d{3})*원/g },
        htmlTag: { label: 'HTML 태그', regex: /<[^>]+>/g },
        macAddress: { label: '🖥️ MAC 주소', regex: /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g },
        ipv6: { label: '🌐 IPv6', regex: /([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)/g }
    };

    // === 추출 엔진 ===
    const processExtraction = useCallback(() => {
        if (!input) {
            setResult([]);
            setStats({ count: 0, unique: 0 });
            return;
        }

        let regex;
        if (type === 'custom') {
            try {
                regex = new RegExp(customRegex, 'g');
            } catch {
                return; // Invalid Regex
            }
        } else {
            regex = patterns[type].regex;
        }

        let matches = input.match(regex) || [];

        // 1. 후처리 (Post-processing)
        matches = matches.map(m => {
            let val = m;
            // 전화번호 포맷팅 (하이픈 추가)
            if (type === 'phone' && options.format === 'hyphen') {
                val = val.replace(/[^0-9]/g, '').replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-"); 
            }
            // 대소문자
            if (options.case === 'upper') val = val.toUpperCase();
            if (options.case === 'lower') val = val.toLowerCase();
            
            // 접두/접미
            return `${options.prefix}${val}${options.suffix}`;
        });

        const totalCount = matches.length;

        // 2. 중복 제거
        if (options.unique) {
            matches = [...new Set(matches)];
        }

        // 3. 정렬
        if (options.sort === 'asc') matches.sort();
        if (options.sort === 'desc') matches.sort().reverse();

        setResult(matches);
        setStats({ count: totalCount, unique: new Set(matches).size });

    }, [input, type, customRegex, options]);

    // 자동 실행
    useEffect(() => {
        processExtraction();
    }, [processExtraction]);

    // === 내보내기 ===
    const handleDownload = (format) => {
        if (result.length === 0) return;
        
        let content = '';
        let typeStr = 'text/plain';
        let ext = 'txt';

        if (format === 'csv') {
            content = Papa.unparse(result.map(val => ({ Value: val })));
            typeStr = 'text/csv';
            ext = 'csv';
        } else if (format === 'json') {
            content = JSON.stringify(result, null, 2);
            typeStr = 'application/json';
            ext = 'json';
        } else {
            content = result.join('\n');
        }

        const blob = new Blob([content], { type: `${typeStr};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extracted_${type}.${ext}`;
        a.click();
    };

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                        <Icon path="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">Extract Master Studio</h2>
                        <p className="text-xs text-slate-500">텍스트 데이터 마이닝 및 정제 솔루션</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => setInput(sampleData)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-600 transition-all">
                        샘플 데이터
                    </button>
                    <button onClick={() => { setInput(''); setResult([]); }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30 transition-all">
                        초기화
                    </button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 입력 및 설정 (Col 4) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar">
                        
                        {/* 추출 대상 선택 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Target</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(patterns).map(([key, p]) => (
                                    <button
                                        key={key}
                                        onClick={() => setType(key)}
                                        className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-all ${
                                            type === key 
                                            ? 'bg-pink-600 text-white shadow-md' 
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setType('custom')}
                                    className={`col-span-2 px-3 py-2 text-xs font-medium rounded-lg text-left transition-all ${
                                        type === 'custom' 
                                        ? 'bg-pink-600 text-white shadow-md' 
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                                >
                                    ⚙️ 커스텀 정규식 (Custom Regex)
                                </button>
                            </div>
                            
                            {type === 'custom' && (
                                <div className="mt-3">
                                    <input 
                                        type="text" 
                                        value={customRegex}
                                        onChange={(e) => setCustomRegex(e.target.value)}
                                        placeholder="Regex 입력 (예: \d+)"
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white focus:border-pink-500 outline-none font-mono"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 옵션 설정 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Filters & Format</h3>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 bg-slate-700/50 rounded hover:bg-slate-700">
                                    <span>중복 제거 (Unique)</span>
                                    <input type="checkbox" checked={options.unique} onChange={(e)=>setOptions({...options, unique: e.target.checked})} className="accent-pink-500" />
                                </label>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">정렬</label>
                                        <select value={options.sort} onChange={(e)=>setOptions({...options, sort: e.target.value})} className="w-full bg-slate-900 text-xs p-1.5 rounded border border-slate-600 text-white outline-none">
                                            <option value="none">없음</option>
                                            <option value="asc">오름차순 (A-Z)</option>
                                            <option value="desc">내림차순 (Z-A)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">대소문자</label>
                                        <select value={options.case} onChange={(e)=>setOptions({...options, case: e.target.value})} className="w-full bg-slate-900 text-xs p-1.5 rounded border border-slate-600 text-white outline-none">
                                            <option value="none">유지</option>
                                            <option value="upper">대문자</option>
                                            <option value="lower">소문자</option>
                                        </select>
                                    </div>
                                </div>

                                {type === 'phone' && (
                                    <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 bg-slate-700/50 rounded hover:bg-slate-700">
                                        <span>하이픈(-) 포맷팅</span>
                                        <input type="checkbox" checked={options.format === 'hyphen'} onChange={(e)=>setOptions({...options, format: e.target.checked ? 'hyphen' : 'none'})} className="accent-pink-500" />
                                    </label>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                                    <input type="text" placeholder="접두사 (Prefix)" value={options.prefix} onChange={(e)=>setOptions({...options, prefix: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-white" />
                                    <input type="text" placeholder="접미사 (Suffix)" value={options.suffix} onChange={(e)=>setOptions({...options, suffix: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-white" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 중앙: 입력 (Col 4) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl flex flex-col h-full border border-slate-700 overflow-hidden">
                        <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Input Text</span>
                            <span className="text-[10px] text-slate-500">{input.length} chars</span>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="텍스트를 붙여넣으세요..."
                            className="flex-1 w-full bg-slate-800 text-slate-300 p-4 font-mono text-sm resize-none outline-none custom-scrollbar leading-relaxed"
                            spellCheck="false"
                        />
                    </div>
                </div>

                {/* 우측: 결과 (Col 4) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl flex flex-col h-full border border-slate-700 overflow-hidden shadow-lg">
                        <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-pink-500 uppercase">Result</span>
                                <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded-full">{result.length} Items</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => navigator.clipboard.writeText(result.join('\n'))} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">Copy</button>
                                <button onClick={() => handleDownload('txt')} className="text-[10px] bg-pink-600 hover:bg-pink-500 text-white px-2 py-1 rounded">Save</button>
                            </div>
                        </div>
                        
                        <div className="flex-1 bg-slate-950 overflow-y-auto custom-scrollbar p-2">
                            {result.length > 0 ? (
                                <div className="space-y-1">
                                    {result.map((item, idx) => (
                                        <div key={idx} className="text-xs font-mono text-emerald-400 p-1.5 hover:bg-slate-900 rounded border-b border-slate-900 break-all flex gap-2">
                                            <span className="text-slate-600 select-none w-6 text-right">{idx+1}.</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                    <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    <span className="text-xs">결과가 없습니다</span>
                                </div>
                            )}
                        </div>

                        {/* 하단 통계 */}
                        <div className="p-2 bg-slate-900 border-t border-slate-700 flex justify-between items-center text-[10px] text-slate-500 px-4">
                            <span>Found: {stats.count}</span>
                            <span>Unique: {stats.unique}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleDownload('csv')} className="hover:text-pink-400">CSV</button>
                                <button onClick={() => handleDownload('json')} className="hover:text-pink-400">JSON</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExtractStudio;