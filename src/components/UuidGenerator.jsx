import React, { useState, useEffect, useCallback } from 'react';

// UUID 생성 로직 (외부 라이브러리 없이 구현)
const generateUUID = (version = 4) => {
    if (version === 4) {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    } else if (version === 1) {
        // Mock v1 (Timestamp based)
        const now = Date.now();
        return `${now.toString(16).padEnd(8, '0')}-xxxx-1xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, c => (Math.random()*16|0).toString(16));
    }
    return '';
};

// NanoID 생성 로직
const generateNanoID = (size = 21, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-') => {
    let id = '';
    for (let i = 0; i < size; i++) {
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
};

// ObjectId (MongoDB) 생성 로직
const generateObjectId = () => {
    const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
};

const IdStudio = () => {
    // === 상태 관리 ===
    const [type, setType] = useState('uuid4'); // uuid1, uuid4, uuid7, nanoid, objectid
    const [count, setCount] = useState(1);
    const [ids, setIds] = useState([]);
    const [options, setOptions] = useState({
        hyphens: true,
        uppercase: false,
        braces: false,
        quotes: false, // for SQL/JSON
        format: 'list', // list, json, sql
        nanoLength: 21,
        nanoCustomChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
    });
    const [history, setHistory] = useState([]);

    // === ID 생성 엔진 ===
    const generate = useCallback(() => {
        let newIds = [];
        for (let i = 0; i < count; i++) {
            let id = '';
            if (type === 'uuid4') id = generateUUID(4);
            else if (type === 'uuid1') id = generateUUID(1);
            else if (type === 'nanoid') id = generateNanoID(options.nanoLength, options.nanoCustomChars);
            else if (type === 'objectid') id = generateObjectId();
            else if (type === 'guid') id = generateUUID(4); // GUID is basically UUID v4

            // 포맷팅 적용
            if (['uuid4', 'uuid1', 'guid'].includes(type)) {
                if (!options.hyphens) id = id.replace(/-/g, '');
                if (options.braces) id = `{${id}}`;
            }
            if (options.uppercase) id = id.toUpperCase();
            if (options.quotes) id = `"${id}"`;

            newIds.push(id);
        }
        setIds(newIds);
        
        // 히스토리에 첫 번째 ID 추가
        if (newIds.length > 0) {
            setHistory(prev => [{ id: newIds[0], type, date: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
        }
    }, [type, count, options]);

    // 초기 생성
    useEffect(() => {
        generate();
    }, [generate]); // 의존성 배열에 generate 추가

    // === 복사 및 다운로드 ===
    const copyToClipboard = () => {
        const text = formatOutput(ids);
        navigator.clipboard.writeText(text);
        alert(`클립보드에 ${ids.length}개의 ID가 복사되었습니다.`);
    };

    const downloadFile = (ext) => {
        const text = formatOutput(ids);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated_ids.${ext}`;
        a.click();
    };

    const formatOutput = (idList) => {
        if (options.format === 'json') return JSON.stringify(idList, null, 2);
        if (options.format === 'sql') return `INSERT INTO table (id) VALUES \n${idList.map(id => `('${id}')`).join(',\n')};`;
        return idList.join('\n');
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">ID Master Studio</h2>
                    <p className="text-slate-400 text-sm">UUID, GUID, NanoID 등 고유 식별자 대량 생성</p>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 설정 패널 (Col 4) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Configuration</h3>
                        
                        {/* ID 타입 선택 */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm text-slate-300 mb-2 block font-medium">ID 타입</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'uuid4', label: 'UUID v4 (Random)' },
                                        { id: 'uuid1', label: 'UUID v1 (Time)' },
                                        { id: 'nanoid', label: 'NanoID' },
                                        { id: 'objectid', label: 'MongoDB ObjectId' },
                                        { id: 'guid', label: 'GUID (Microsoft)' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setType(t.id)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-all ${
                                                type === t.id 
                                                ? 'bg-orange-600 text-white shadow-md' 
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 수량 조절 */}
                            <div>
                                <label className="text-sm text-slate-300 mb-2 block font-medium">생성 수량: {count}</label>
                                <input 
                                    type="range" min="1" max="100" 
                                    value={count} 
                                    onChange={(e) => setCount(parseInt(e.target.value))}
                                    className="w-full accent-orange-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>1</span>
                                    <span>50</span>
                                    <span>100</span>
                                </div>
                            </div>

                            {/* 세부 옵션 */}
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <label className="text-xs font-bold text-slate-400 block mb-2">Options</label>
                                <div className="space-y-2">
                                    {['uuid4', 'uuid1', 'guid'].includes(type) && (
                                        <>
                                            <label className="flex items-center justify-between text-sm text-slate-300 cursor-pointer">
                                                <span>하이픈 (-) 포함</span>
                                                <input type="checkbox" checked={options.hyphens} onChange={(e)=>setOptions({...options, hyphens: e.target.checked})} className="accent-orange-500" />
                                            </label>
                                            <label className="flex items-center justify-between text-sm text-slate-300 cursor-pointer">
                                                <span>중괄호 {'{}'} 포함</span>
                                                <input type="checkbox" checked={options.braces} onChange={(e)=>setOptions({...options, braces: e.target.checked})} className="accent-orange-500" />
                                            </label>
                                        </>
                                    )}
                                    <label className="flex items-center justify-between text-sm text-slate-300 cursor-pointer">
                                        <span>대문자 변환</span>
                                        <input type="checkbox" checked={options.uppercase} onChange={(e)=>setOptions({...options, uppercase: e.target.checked})} className="accent-orange-500" />
                                    </label>
                                    
                                    {type === 'nanoid' && (
                                        <div className="pt-2 border-t border-slate-700 mt-2">
                                            <label className="text-xs text-slate-400 block mb-1">길이: {options.nanoLength}</label>
                                            <input type="range" min="5" max="64" value={options.nanoLength} onChange={(e)=>setOptions({...options, nanoLength: parseInt(e.target.value)})} className="w-full accent-orange-500 mb-2" />
                                            <input type="text" value={options.nanoCustomChars} onChange={(e)=>setOptions({...options, nanoCustomChars: e.target.value})} className="w-full bg-slate-800 text-xs p-1 rounded border border-slate-600 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={generate}
                                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                재생성 (Re-Generate)
                            </button>
                        </div>

                        {/* 히스토리 */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">History</h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {history.map((h, i) => (
                                    <div key={i} className="p-2 bg-slate-700/50 rounded text-xs text-slate-300 border border-slate-600/50 flex justify-between items-center group cursor-pointer hover:bg-slate-700" onClick={() => navigator.clipboard.writeText(h.id)}>
                                        <div className="truncate w-3/4 font-mono">{h.id}</div>
                                        <span className="text-[10px] text-orange-400 opacity-0 group-hover:opacity-100">Copy</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 우측: 결과 출력 (Col 8) */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 relative">
                        {/* 툴바 */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                                {['list', 'json', 'sql'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setOptions({...options, format: f})}
                                        className={`px-3 py-1 text-xs font-bold rounded uppercase transition-colors ${options.format === f ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={copyToClipboard} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Copy All</button>
                                <button onClick={() => downloadFile('txt')} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Download</button>
                            </div>
                        </div>

                        {/* 결과창 */}
                        <textarea
                            readOnly
                            value={formatOutput(ids)}
                            className="flex-1 w-full bg-slate-900 text-orange-100 p-4 rounded-xl border border-slate-700 focus:outline-none font-mono text-sm resize-none shadow-inner leading-relaxed custom-scrollbar"
                        />
                        
                        {/* 하단 정보 */}
                        <div className="absolute bottom-6 right-6 text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
                            {count} IDs Generated
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default IdStudio;