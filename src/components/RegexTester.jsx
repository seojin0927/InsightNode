import React, { useState, useCallback, useMemo, useEffect } from 'react';

const RegexStudio = () => {
    // === 상태 관리 ===
    const [pattern, setPattern] = useState('');
    const [flags, setFlags] = useState('gm'); // g, i, m, s, u, y
    const [testString, setTestString] = useState('Hello World!\nuser@example.com\n010-1234-5678\nPrice: $99.99');
    const [replaceString, setReplaceString] = useState('');
    const [mode, setMode] = useState('match'); // match, replace, unit
    const [matches, setMatches] = useState([]);
    const [error, setError] = useState(null);
    const [execTime, setExecTime] = useState(0);
    const [activeTab, setActiveTab] = useState('cheatsheet'); // cheatsheet, library, code

    // === 정규식 엔진 ===
    const runRegex = useCallback(() => {
        if (!pattern) {
            setMatches([]);
            setError(null);
            return;
        }

        const startTime = performance.now();
        try {
            const regex = new RegExp(pattern, flags);
            let results = [];
            
            // matchAll or exec loop for detailed info
            if (flags.includes('g')) {
                const iter = testString.matchAll(regex);
                results = Array.from(iter);
            } else {
                const match = testString.match(regex);
                if (match) results = [match];
            }

            setMatches(results);
            setError(null);
        } catch (e) {
            setError(e.message);
            setMatches([]);
        }
        setExecTime(performance.now() - startTime);
    }, [pattern, flags, testString]);

    useEffect(() => {
        runRegex();
    }, [runRegex]);

    // === 하이라이팅 로직 (HTML) ===
    const highlightedText = useMemo(() => {
        if (!pattern || error || matches.length === 0) return testString;

        let lastIndex = 0;
        let result = [];
        
        // 원본 문자열을 순회하며 매칭된 부분을 태그로 감쌈
        // 주의: 겹치는 매칭이나 복잡한 케이스는 단순화를 위해 첫 매칭 기준 처리
        try {
            // matchAll 결과를 이용해 문자열 재조립
            matches.forEach((m, i) => {
                // 매칭 전 텍스트
                if (m.index > lastIndex) {
                    result.push(testString.substring(lastIndex, m.index));
                }
                // 매칭된 텍스트
                result.push(
                    <span key={i} className="bg-emerald-500/30 text-emerald-200 border-b-2 border-emerald-500" title={`Match ${i+1}`}>
                        {m[0]}
                    </span>
                );
                lastIndex = m.index + m[0].length;
            });
            
            // 남은 텍스트
            if (lastIndex < testString.length) {
                result.push(testString.substring(lastIndex));
            }
            return result;
        } catch(e) {
            return testString;
        }
    }, [testString, matches, pattern, error]);

    // === 치환 결과 미리보기 ===
    const replaceResult = useMemo(() => {
        if (!pattern || error) return '';
        try {
            return testString.replace(new RegExp(pattern, flags), replaceString);
        } catch {
            return 'Error in replace';
        }
    }, [pattern, flags, testString, replaceString, error]);

    // === 플래그 토글 ===
    const toggleFlag = (flag) => {
        setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
    };

    // === 라이브러리 프리셋 ===
    const loadPreset = (p) => {
        setPattern(p.regex);
        setTestString(p.sample);
        if (p.flags) setFlags(p.flags);
    };

    const presets = [
        { label: 'Email', regex: '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}', sample: 'contact@vaultsheet.com' },
        { label: 'URL', regex: 'https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]+', sample: 'https://www.google.com' },
        { label: 'Phone (KR)', regex: '\\d{2,3}-\\d{3,4}-\\d{4}', sample: '010-1234-5678' },
        { label: 'Date (YYYY-MM-DD)', regex: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])', sample: '2023-12-25' },
        { label: 'IPv4', regex: '((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}', sample: '192.168.0.1' },
    ];

    // === 코드 생성 ===
    const generateCode = (lang) => {
        switch(lang) {
            case 'js': return `const regex = /${pattern}/${flags};\nconst str = \`${testString}\`;\nconst matches = str.match(regex);`;
            case 'python': return `import re\nregex = r"${pattern}"\ntest_str = "${testString}"\nmatches = re.finditer(regex, test_str, re.${flags.includes('i') ? 'IGNORECASE' : 'MULTILINE'})`;
            case 'java': return `String regex = "${pattern.replace(/\\/g, '\\\\')}";\nPattern p = Pattern.compile(regex);\nMatcher m = p.matcher("${testString}");`;
            default: return '';
        }
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Regex Master Studio</h2>
                        <p className="text-slate-400 text-sm">정규표현식 테스트, 치환, 코드 생성 및 디버깅</p>
                    </div>
                </div>
                
                {/* 모드 전환 탭 */}
                <div className="flex bg-slate-800 rounded-lg p-1">
                    {['match', 'replace'].map(m => (
                        <button 
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-4 py-2 text-sm font-bold rounded capitalize transition-colors ${mode === m ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {m}er
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. 정규식 입력바 (Sticky) */}
            <div className="bg-slate-800 p-4 rounded-xl mb-4 flex flex-col gap-3 shadow-lg border border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-xl">/</span>
                    <input 
                        type="text" 
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        placeholder="정규식 패턴 입력..." 
                        className={`flex-1 bg-slate-900 border-2 rounded-lg px-4 py-3 text-lg font-mono text-emerald-300 outline-none ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-emerald-500'}`}
                    />
                    <span className="text-slate-400 font-mono text-xl">/</span>
                    
                    {/* 플래그 선택 */}
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                        {['g', 'i', 'm', 's', 'u'].map(f => (
                            <button 
                                key={f}
                                onClick={() => toggleFlag(f)}
                                className={`w-8 h-8 rounded font-bold text-sm transition-colors ${flags.includes(f) ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
                                title={`${f} flag`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* 에러 메시지 */}
                {error && (
                    <div className="text-red-400 text-sm flex items-center gap-2 bg-red-900/20 p-2 rounded px-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}
            </div>

            {/* 3. 메인 작업 영역 (Grid - Full Height) */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 좌측: 사이드바 (도구 모음) (Col 3) */}
                <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-2 flex flex-col h-full shadow-inner border border-slate-700/50">
                        {/* 사이드바 탭 */}
                        <div className="flex gap-1 mb-2 p-1">
                            {['cheatsheet', 'library', 'code'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`flex-1 py-2 text-xs font-bold uppercase rounded ${activeTab === t ? 'bg-slate-700 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* 사이드바 컨텐츠 (스크롤) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                            {activeTab === 'cheatsheet' && (
                                <div className="space-y-4 text-sm">
                                    {[
                                        { title: 'Character classes', items: [['.', 'Any char'], ['\\w', 'Word'], ['\\d', 'Digit'], ['\\s', 'Whitespace'], ['[abc]', 'Any of a,b,c']] },
                                        { title: 'Anchors', items: [['^', 'Start'], ['$', 'End'], ['\\b', 'Word boundary']] },
                                        { title: 'Quantifiers', items: [['*', '0 or more'], ['+', '1 or more'], ['?', '0 or 1'], ['{3}', 'Exactly 3']] },
                                        { title: 'Groups', items: [['(...)', 'Capture'], ['(?:...)', 'Non-capture']] }
                                    ].map((section, idx) => (
                                        <div key={idx}>
                                            <h4 className="text-emerald-500 font-bold mb-2 text-xs uppercase">{section.title}</h4>
                                            <div className="space-y-1">
                                                {section.items.map(([code, desc], i) => (
                                                    <button key={i} onClick={() => setPattern(prev => prev + code)} className="w-full flex justify-between items-center p-2 rounded hover:bg-slate-700 group text-left">
                                                        <code className="text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs">{code}</code>
                                                        <span className="text-slate-400 text-xs group-hover:text-slate-200">{desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'library' && (
                                <div className="space-y-2">
                                    {presets.map((p, i) => (
                                        <button key={i} onClick={() => loadPreset(p)} className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left border border-slate-600 hover:border-emerald-500/50 transition-all">
                                            <div className="font-bold text-slate-200 text-sm mb-1">{p.label}</div>
                                            <code className="text-xs text-emerald-400 font-mono block truncate">{p.regex}</code>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'code' && (
                                <div className="space-y-4">
                                    {['js', 'python', 'java'].map(lang => (
                                        <div key={lang}>
                                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">{lang}</div>
                                            <div className="relative group">
                                                <textarea readOnly value={generateCode(lang)} className="w-full bg-slate-900 p-2 rounded text-xs font-mono text-slate-300 h-20 resize-none outline-none border border-slate-700" />
                                                <button onClick={() => navigator.clipboard.writeText(generateCode(lang))} className="absolute top-2 right-2 bg-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 중앙 & 우측: 테스트 영역 (Col 9) */}
                <div className="lg:col-span-9 flex flex-col h-full min-h-0 gap-4">
                    
                    {/* Test String Input */}
                    <div className="flex-1 bg-slate-800 rounded-xl p-4 flex flex-col min-h-0 border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-slate-300 uppercase">Test String</h3>
                            {mode === 'match' && <div className="text-xs text-slate-500">Highlighting enabled</div>}
                        </div>
                        <div className="flex-1 relative bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                            {/* 하이라이트 레이어 (Overlay) */}
                            <div className="absolute inset-0 p-4 font-mono text-sm whitespace-pre-wrap break-words pointer-events-none text-transparent z-10 overflow-y-auto">
                                {highlightedText}
                            </div>
                            {/* 실제 입력 레이어 */}
                            <textarea
                                value={testString}
                                onChange={(e) => setTestString(e.target.value)}
                                className="absolute inset-0 w-full h-full bg-transparent p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap break-words resize-none outline-none z-0 leading-relaxed"
                                spellCheck="false"
                            />
                        </div>
                    </div>

                    {/* Replace / Match Info Area */}
                    <div className="h-1/3 min-h-[200px] bg-slate-800 rounded-xl p-4 flex flex-col border border-slate-700">
                        {mode === 'replace' ? (
                            <>
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase">Substitution</h3>
                                    <input 
                                        type="text" 
                                        value={replaceString}
                                        onChange={(e) => setReplaceString(e.target.value)}
                                        placeholder="Replacement pattern (e.g. $1-$2)"
                                        className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-sm text-white flex-1 outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div className="flex-1 bg-slate-900 p-4 rounded-lg border border-slate-700 overflow-y-auto font-mono text-sm text-emerald-300 whitespace-pre-wrap">
                                    {replaceResult}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase">Match Information</h3>
                                    <div className="flex gap-4 text-xs">
                                        <span className="text-slate-400">Matches: <strong className="text-emerald-400">{matches.length}</strong></span>
                                        <span className="text-slate-400">Time: <strong className="text-emerald-400">{execTime.toFixed(2)}ms</strong></span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 overflow-y-auto custom-scrollbar p-2">
                                    {matches.length > 0 ? (
                                        <table className="w-full text-left text-sm border-collapse">
                                            <thead>
                                                <tr className="text-slate-500 border-b border-slate-700">
                                                    <th className="p-2 font-mono text-xs w-10">#</th>
                                                    <th className="p-2 font-mono text-xs">Match</th>
                                                    <th className="p-2 font-mono text-xs">Groups</th>
                                                    <th className="p-2 font-mono text-xs w-16">Index</th>
                                                </tr>
                                            </thead>
                                            <tbody className="font-mono text-xs">
                                                {matches.map((m, i) => (
                                                    <tr key={i} className="hover:bg-slate-800/50 border-b border-slate-800 last:border-0">
                                                        <td className="p-2 text-slate-500">{i+1}</td>
                                                        <td className="p-2 text-emerald-300 break-all">{m[0]}</td>
                                                        <td className="p-2 text-slate-300">
                                                            {m.length > 1 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Array.from(m).slice(1).map((g, gi) => (
                                                                        <span key={gi} className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px]" title={`Group ${gi+1}`}>
                                                                            ${gi+1}: {g}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : <span className="text-slate-600">-</span>}
                                                        </td>
                                                        <td className="p-2 text-slate-500">{m.index}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-600 text-sm">No matches found</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RegexStudio;