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
        // 연락처
        { label: '📧 이메일', regex: '[\\w.+%-]+@[\\w.-]+\\.[a-zA-Z]{2,}', sample: 'user@example.com, admin+test@company.co.kr', flags: 'gi' },
        { label: '📞 전화 (한국)', regex: '\\d{2,3}-\\d{3,4}-\\d{4}', sample: '010-1234-5678, 02-987-6543', flags: 'g' },
        { label: '📞 전화 (국제)', regex: '\\+?[1-9]\\d{1,14}', sample: '+821012345678, +14155552671', flags: 'g' },
        // 웹
        { label: '🔗 URL', regex: 'https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]+', sample: 'https://www.google.com/search?q=hello', flags: 'gi' },
        { label: '🌐 도메인', regex: '(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}', sample: 'google.com, sub.example.co.kr', flags: 'gi' },
        { label: '🖥️ IPv4', regex: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', sample: '192.168.0.1, 10.0.0.255', flags: 'g' },
        { label: '🖥️ IPv6', regex: '(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}', sample: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', flags: 'g' },
        // 날짜/시간
        { label: '📅 날짜 YYYY-MM-DD', regex: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])', sample: '2024-01-15, 2023-12-31', flags: 'g' },
        { label: '📅 날짜 YYYY/MM/DD', regex: '\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])', sample: '2024/01/15', flags: 'g' },
        { label: '⏰ 시간 HH:MM:SS', regex: '([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?', sample: '09:30:00, 23:59', flags: 'g' },
        // 금융
        { label: '💳 신용카드', regex: '\\b(?:\\d[ -]?){13,16}\\b', sample: '4111-1111-1111-1111', flags: 'g' },
        { label: '💰 통화 (USD)', regex: '\\$\\s?\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?', sample: '$1,234.56, $99.99', flags: 'g' },
        { label: '💰 통화 (KRW)', regex: '\\d{1,3}(?:,\\d{3})*원', sample: '1,234,000원, 99원', flags: 'g' },
        // 보안
        { label: '🔑 비밀번호 강도', regex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', sample: 'Abc@1234, weakpw', flags: 'gm' },
        { label: '🔐 JWT 토큰', regex: 'eyJ[a-zA-Z0-9_-]+\\.eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+', sample: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.sig123', flags: 'g' },
        // 한국 고유
        { label: '🪪 주민등록번호', regex: '\\d{6}-[1-4]\\d{6}', sample: '901201-1234567', flags: 'g' },
        { label: '🚗 자동차 번호', regex: '[가-힣]{2}\\s?\\d{2}\\s?[가-힣]\\s?\\d{4}', sample: '서울 12 가 3456', flags: 'g' },
        { label: '📮 우편번호 (5자리)', regex: '\\b\\d{5}\\b', sample: '06235, 03920', flags: 'g' },
        // 데이터
        { label: '📄 JSON 키', regex: '"([^"]+)"\\s*:', sample: '{"name": "John", "age": 30}', flags: 'g' },
        { label: '#️⃣ 해시태그', regex: '#[\\w가-힣]+', sample: '#coding #React #자바스크립트', flags: 'g' },
        { label: '@️ 멘션', regex: '@[\\w]+', sample: '@user1 @admin_team', flags: 'g' },
        // 코드
        { label: '💬 HTML 태그', regex: '<\\/?[a-zA-Z][^>]*>', sample: '<div class="test">Hello</div>', flags: 'gi' },
        { label: '🎨 CSS 색상 HEX', regex: '#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b', sample: 'color: #FF5733; background: #abc', flags: 'gi' },
        { label: '📝 마크다운 헤더', regex: '^#{1,6}\\s+.+$', sample: '# Title\n## Sub\n### Section', flags: 'gm' },
        { label: '🔢 정수', regex: '-?\\b\\d+\\b', sample: '100, -42, 3.14, 0', flags: 'g' },
        { label: '🔢 소수', regex: '-?\\d+\\.\\d+', sample: '3.14, -0.5, 100.0', flags: 'g' },
        // 파일
        { label: '📁 파일 경로 (Unix)', regex: '(?:\\/[\\w.-]+)+', sample: '/home/user/documents/file.txt', flags: 'g' },
        { label: '📁 파일 확장자', regex: '\\.[a-zA-Z0-9]{2,5}$', sample: 'document.pdf, image.PNG', flags: 'gm' },
        { label: '🔗 Base64', regex: '[A-Za-z0-9+\\/]{20,}={0,2}', sample: 'SGVsbG8gV29ybGQ=', flags: 'g' },
        { label: '📊 UUID', regex: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', sample: '550e8400-e29b-41d4-a716-446655440000', flags: 'gi' },
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
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">Regex Master Studio</h2>
                        <p className="text-xs text-slate-500">정규표현식 테스트, 치환, 코드 생성 및 디버깅</p>
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
                    <div className="bg-slate-800 rounded-xl p-2 flex flex-col h-full shadow-inner border border-white/[0.07]">
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
                                                    <tr key={i} className="hover:bg-slate-800/50 border-b border-white/[0.05] last:border-0">
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