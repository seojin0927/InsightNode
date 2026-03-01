import React, { useState, useEffect, useCallback } from 'react';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const TextTransformStudio = () => {
    // === 상태 관리 ===
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    
    // 옵션
    const [separator, setSeparator] = useState('newline'); // newline, comma, tab, space, pipe, semicolon
    const [outputSeparator, setOutputSeparator] = useState('comma'); 
    const [wrapper, setWrapper] = useState('none'); // none, single, double, backtick, paren, square, curly
    const [sort, setSort] = useState('none'); // none, asc, desc, length, random
    const [casing, setCasing] = useState('none'); // none, upper, lower, capitalize
    const [options, setOptions] = useState({
        trim: true,
        removeEmpty: true,
        removeDuplicates: false,
        prefix: '',
        suffix: '',
        numbering: false
    });

    // 샘플 데이터
    const sampleData = `Apple
banana
Cherry
date
Elderberry
Fig
grape`;

    // === 변환 엔진 ===
    const processText = useCallback(() => {
        if (!input) {
            setOutput('');
            return;
        }

        // 1. 분리 (Split)
        let splitChar = '\n';
        if (separator === 'comma') splitChar = ',';
        else if (separator === 'tab') splitChar = '\t';
        else if (separator === 'space') splitChar = ' ';
        else if (separator === 'pipe') splitChar = '|';
        else if (separator === 'semicolon') splitChar = ';';
        else if (separator === 'auto') {
            // 자동 감지 (가장 많이 나오는 구분자 추측)
            const counts = {
                '\n': (input.match(/\n/g) || []).length,
                ',': (input.match(/,/g) || []).length,
                '\t': (input.match(/\t/g) || []).length,
                '|': (input.match(/\|/g) || []).length
            };
            splitChar = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        }

        let items = input.split(splitChar);

        // 2. 가공 (Process Items)
        items = items.map(item => {
            let processed = item;
            if (options.trim) processed = processed.trim();
            if (casing === 'upper') processed = processed.toUpperCase();
            if (casing === 'lower') processed = processed.toLowerCase();
            if (casing === 'capitalize') processed = processed.charAt(0).toUpperCase() + processed.slice(1).toLowerCase();
            return processed;
        });

        // 3. 필터링 (Filter)
        if (options.removeEmpty) {
            items = items.filter(item => item !== '');
        }
        if (options.removeDuplicates) {
            items = [...new Set(items)];
        }

        // 4. 정렬 (Sort)
        if (sort === 'asc') items.sort((a, b) => a.localeCompare(b));
        else if (sort === 'desc') items.sort((a, b) => b.localeCompare(a));
        else if (sort === 'length') items.sort((a, b) => a.length - b.length);
        else if (sort === 'random') items.sort(() => Math.random() - 0.5);

        // 5. 래핑 및 추가 (Wrap & Append)
        items = items.map((item, idx) => {
            let wrapped = item;
            if (wrapper === 'single') wrapped = `'${item}'`;
            else if (wrapper === 'double') wrapped = `"${item}"`;
            else if (wrapper === 'backtick') wrapped = `\`${item}\``;
            else if (wrapper === 'paren') wrapped = `(${item})`;
            else if (wrapper === 'square') wrapped = `[${item}]`;
            else if (wrapper === 'curly') wrapped = `{${item}}`;

            if (options.prefix) wrapped = options.prefix + wrapped;
            if (options.suffix) wrapped = wrapped + options.suffix;
            if (options.numbering) wrapped = `${idx + 1}. ${wrapped}`;

            return wrapped;
        });

        // 6. 결합 (Join)
        let joinChar = '\n';
        if (outputSeparator === 'comma') joinChar = ', '; // 보기 좋게 공백 추가
        else if (outputSeparator === 'comma_raw') joinChar = ',';
        else if (outputSeparator === 'tab') joinChar = '\t';
        else if (outputSeparator === 'space') joinChar = ' ';
        else if (outputSeparator === 'pipe') joinChar = ' | ';
        else if (outputSeparator === 'semicolon') joinChar = '; ';
        else if (outputSeparator === 'sql') joinChar = ',\n'; // SQL용
        
        // SQL이나 JSON 포맷 등 특수 처리
        let result = items.join(joinChar);
        if (outputSeparator === 'json') result = JSON.stringify(items, null, 2);
        else if (outputSeparator === 'sql') result = `(${result})`;

        setOutput(result);
    }, [input, separator, outputSeparator, wrapper, sort, casing, options]);

    // 입력 변경 시 자동 처리 (Debounce)
    useEffect(() => {
        const timer = setTimeout(() => processText(), 100);
        return () => clearTimeout(timer);
    }, [input, processText]);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        alert('복사되었습니다.');
    };

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'transformed_text.txt';
        link.click();
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Icon path="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Text Transform Studio</h2>
                        <p className="text-slate-400 text-sm">리스트 변환, 정렬, 가공, 포맷팅 올인원 도구</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setInput(sampleData); setSeparator('newline'); }}
                        className="bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-cyan-500/30"
                    >
                        샘플 데이터
                    </button>
                    <button 
                        onClick={() => { setInput(''); setOutput(''); }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600"
                    >
                        초기화
                    </button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 설정 패널 (Col 3) */}
                <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar">
                        
                        {/* 1. 입력 설정 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Input Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">구분자 (Split by)</label>
                                    <select value={separator} onChange={(e) => setSeparator(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white">
                                        <option value="newline">줄바꿈 (Enter)</option>
                                        <option value="comma">쉼표 (,)</option>
                                        <option value="space">공백 (Space)</option>
                                        <option value="tab">탭 (Tab)</option>
                                        <option value="auto">자동 감지</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                        <input type="checkbox" checked={options.trim} onChange={(e)=>setOptions({...options, trim: e.target.checked})} className="accent-cyan-500" />
                                        공백 제거 (Trim)
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                        <input type="checkbox" checked={options.removeEmpty} onChange={(e)=>setOptions({...options, removeEmpty: e.target.checked})} className="accent-cyan-500" />
                                        빈 줄 제거
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                        <input type="checkbox" checked={options.removeDuplicates} onChange={(e)=>setOptions({...options, removeDuplicates: e.target.checked})} className="accent-cyan-500" />
                                        중복 제거 (Unique)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 2. 가공 설정 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Transform</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">정렬 (Sort)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={()=>setSort('asc')} className={`py-1.5 text-xs rounded border ${sort==='asc' ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-600 text-slate-400'}`}>A-Z</button>
                                        <button onClick={()=>setSort('desc')} className={`py-1.5 text-xs rounded border ${sort==='desc' ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-600 text-slate-400'}`}>Z-A</button>
                                        <button onClick={()=>setSort('length')} className={`py-1.5 text-xs rounded border ${sort==='length' ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-600 text-slate-400'}`}>길이순</button>
                                        <button onClick={()=>setSort('random')} className={`py-1.5 text-xs rounded border ${sort==='random' ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-600 text-slate-400'}`}>랜덤</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">대소문자</label>
                                    <select value={casing} onChange={(e) => setCasing(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white">
                                        <option value="none">변환 없음</option>
                                        <option value="upper">UPPER CASE</option>
                                        <option value="lower">lower case</option>
                                        <option value="capitalize">Capitalize</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. 출력 설정 */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Output Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">구분자 (Join by)</label>
                                    <select value={outputSeparator} onChange={(e) => setOutputSeparator(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white">
                                        <option value="newline">줄바꿈 (Enter)</option>
                                        <option value="comma">쉼표+공백 (, )</option>
                                        <option value="comma_raw">쉼표 (,)</option>
                                        <option value="sql">SQL Value (A), (B)</option>
                                        <option value="json">JSON Array</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">감싸기 (Wrap)</label>
                                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-600">
                                        {['none', 'single', 'double'].map(w => (
                                            <button 
                                                key={w} 
                                                onClick={() => setWrapper(w)}
                                                className={`flex-1 py-1 text-xs font-bold rounded capitalize ${wrapper === w ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                {w === 'none' ? 'None' : w === 'single' ? "'A'" : '"A"'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" placeholder="접두사 (Prefix)" value={options.prefix} onChange={(e)=>setOptions({...options, prefix: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white" />
                                    <input type="text" placeholder="접미사 (Suffix)" value={options.suffix} onChange={(e)=>setOptions({...options, suffix: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white" />
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input type="checkbox" checked={options.numbering} onChange={(e)=>setOptions({...options, numbering: e.target.checked})} className="accent-cyan-500" />
                                    번호 매기기 (1. 2. 3.)
                                </label>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 중앙 & 우측: 작업 공간 (Col 9) */}
                <div className="lg:col-span-9 flex flex-col h-full min-h-0">
                    
                    {/* 상단: 입력/출력 (Grid) */}
                    <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 mb-4">
                        {/* 입력창 */}
                        <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="bg-slate-900/50 p-3 border-b border-slate-700 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Input</span>
                                <div className="text-xs text-slate-500">
                                    {input ? `${input.split(separator === 'newline' ? '\n' : separator).length} Items` : '0 Items'}
                                </div>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="텍스트를 입력하거나 붙여넣으세요..."
                                className="flex-1 bg-transparent p-4 text-sm font-mono text-slate-300 resize-none outline-none custom-scrollbar leading-relaxed"
                                spellCheck="false"
                            />
                        </div>

                        {/* 출력창 */}
                        <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="bg-slate-900/50 p-3 border-b border-slate-700 flex justify-between items-center">
                                <span className="text-xs font-bold text-cyan-500 uppercase">Result</span>
                                <div className="flex gap-2">
                                    <button onClick={handleCopy} className="text-xs bg-slate-700 px-2 py-1 rounded hover:text-white transition-colors">Copy</button>
                                    <button onClick={handleDownload} className="text-xs bg-cyan-600 text-white px-2 py-1 rounded hover:bg-cyan-500 transition-colors">Download</button>
                                </div>
                            </div>
                            <textarea
                                readOnly
                                value={output}
                                className="flex-1 bg-slate-950 p-4 text-sm font-mono text-cyan-100/90 resize-none outline-none custom-scrollbar leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* 하단: 상태 바 */}
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex gap-4">
                            <span>글자 수: <strong className="text-slate-200">{input.length}</strong></span>
                            <span>결과 길이: <strong className="text-cyan-400">{output.length}</strong></span>
                        </div>
                        <div>
                            {sort !== 'none' && <span className="mr-3 text-cyan-500">Sorted ({sort})</span>}
                            {options.removeDuplicates && <span className="mr-3 text-cyan-500">Unique</span>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TextTransformStudio;