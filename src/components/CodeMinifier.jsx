import React, { useState, useCallback, useEffect } from 'react';

const CodeMinifier = () => {
    // === 상태 관리 ===
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState('javascript'); // javascript, css, html, json, sql, markdown, base64, url
    const [action, setAction] = useState('minify'); // minify, beautify, convert
    const [stats, setStats] = useState({ 
        originalSize: 0, minifiedSize: 0, saved: 0, ratio: 0, 
        gzipOriginal: 0, gzipMinified: 0 
    });
    const [meta, setMeta] = useState({ lines: 0, chars: 0 });

    // === 샘플 데이터 ===
    const samples = {
        javascript: `// Sample Code
function hello(name) {
    if(name) {
        console.log("Hello, " + name);
    } else {
        console.log("Hello World");
    }
    return true;
}`,
        css: `/* Header Styles */
.header {
    background-color: #333;
    color: white;
    padding: 20px;
    display: flex;
}`,
        html: `<nav class="navbar">
    <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
    </ul>
</nav>`,
        json: `{"name":"John","age":30,"city":"New York","skills":["JS","React"]}`,
        sql: `SELECT * FROM users WHERE age > 25 ORDER BY name ASC;`,
        markdown: `# Title\n## Subtitle\n- Item 1\n- Item 2\n\n**Bold Text**`,
        base64: `Hello World`,
        url: `https://example.com/search?q=hello world&lang=ko`
    };

    // === 로직: 텍스트 처리 엔진 ===
    const processCode = useCallback(() => {
        if (!input) {
            setOutput('');
            return;
        }

        let res = input;

        try {
            // 1. Minify Logic
            if (action === 'minify') {
                if (mode === 'javascript') {
                    res = res
                        .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // 주석 제거
                        .replace(/\s+/g, ' ') // 공백 병합
                        .replace(/\s*([=+\-*/{}();,])\s*/g, '$1') // 연산자 주변 공백 제거
                        .replace(/;\}/g, '}'); // 마지막 세미콜론 제거
                } else if (mode === 'css') {
                    res = res
                        .replace(/\/\*[\s\S]*?\*\//g, '')
                        .replace(/\s+/g, ' ')
                        .replace(/\s*([:;{}])\s*/g, '$1')
                        .replace(/;}/g, '}');
                } else if (mode === 'html') {
                    // 여기가 수정된 부분입니다 (HTML 주석 제거 정규식 복구)
                    res = res
                        .replace(/<!--[\s\S]*?-->/g, '') 
                        .replace(/\s+/g, ' ')
                        .replace(/>\s+</g, '><');
                } else if (mode === 'json') {
                    res = JSON.stringify(JSON.parse(res));
                } else if (mode === 'sql') {
                    res = res.replace(/\s+/g, ' ').replace(/\s*([,;()])\s*/g, '$1');
                }
            } 
            // 2. Beautify Logic (간이 구현)
            else if (action === 'beautify') {
                if (mode === 'json') {
                    res = JSON.stringify(JSON.parse(res), null, 4);
                } else if (['javascript', 'css', 'sql'].includes(mode)) {
                    // 간단한 들여쓰기 로직
                    let indent = 0;
                    res = res.replace(/\s+/g, ' ')
                             .replace(/[{};]/g, m => m === '{' ? '{\n' : m === '}' ? '\n}' : ';\n')
                             .split('\n').map(line => {
                                 line = line.trim();
                                 if (line.includes('}')) indent--;
                                 const str = '    '.repeat(Math.max(0, indent)) + line;
                                 if (line.includes('{')) indent++;
                                 return str;
                             }).join('\n');
                } else if (mode === 'html') {
                     // HTML Beautify
                     let indent = 0;
                     res = res.replace(/>\s*</g, '>\n<')
                              .split('\n').map(line => {
                                  if (line.match(/^<\//)) indent--;
                                  const str = '    '.repeat(Math.max(0, indent)) + line;
                                  if (line.match(/^<[^/]/) && !line.match(/\/>$/) && !line.match(/<.*>.*<\/.*>/)) indent++;
                                  return str;
                              }).join('\n');
                }
            } 
            // 3. Convert/Encode Logic
            else if (action === 'convert') {
                if (mode === 'markdown') { // MD -> HTML
                    res = res
                        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                        .replace(/^\- (.*$)/gim, '<li>$1</li>')
                        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>');
                } else if (mode === 'base64') {
                    res = btoa(unescape(encodeURIComponent(res)));
                } else if (mode === 'url') {
                    res = encodeURIComponent(res);
                }
            } else if (action === 'decode') { // Base64/URL Decode
                 if (mode === 'base64') {
                    res = decodeURIComponent(escape(atob(res)));
                } else if (mode === 'url') {
                    res = decodeURIComponent(res);
                }
            }

            setOutput(res);
            calculateStats(input, res);
        } catch (e) {
            setOutput('Error: ' + e.message);
        }
    }, [input, mode, action]);

    // === 통계 계산 ===
    const calculateStats = (orig, mini) => {
        const origSize = new Blob([orig]).size;
        const miniSize = new Blob([mini]).size;
        const saved = origSize - miniSize;
        const ratio = origSize > 0 ? ((saved / origSize) * 100).toFixed(1) : 0;
        
        // Gzip 시뮬레이션 (텍스트 기준 약 60~70% 압축 효율 가정)
        const gzipOrig = Math.floor(origSize * 0.4); 
        const gzipMini = Math.floor(miniSize * 0.4);

        setStats({
            originalSize: origSize,
            minifiedSize: miniSize,
            saved: Math.max(0, saved),
            ratio: ratio,
            gzipOriginal: gzipOrig,
            gzipMinified: gzipMini
        });

        setMeta({
            lines: orig.split('\n').length,
            chars: orig.length
        });
    };

    // === 파일 핸들링 ===
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setInput(e.target.result);
        reader.readAsText(file);
    };

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = mode === 'javascript' ? 'js' : mode === 'markdown' ? 'html' : mode;
        a.download = `minified.${ext}`;
        a.click();
    };

    // === 초기화 및 자동 실행 ===
    useEffect(() => {
        processCode();
    }, [processCode]);

    // === 모드 변경 시 기본 동작 설정 ===
    useEffect(() => {
        if (['base64', 'url'].includes(mode)) setAction('convert');
        else if (mode === 'markdown') setAction('convert');
        else setAction('minify');
        
        // 샘플 로드 (입력이 비어있을 때만)
        if (!input) setInput(samples[mode] || '');
    }, [mode]);

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Dev Code Studio</h2>
                        <p className="text-slate-400 text-sm">압축, 정렬, 변환, 분석을 한 곳에서</p>
                    </div>
                </div>
                
                {/* 파일 업로드 버튼 */}
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    파일 열기
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>

            {/* 2. 툴바 (언어 및 액션 선택) */}
            <div className="bg-slate-800 p-2 rounded-xl mb-4 flex flex-wrap gap-2 items-center justify-between flex-shrink-0">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'javascript', label: 'JavaScript' },
                        { id: 'css', label: 'CSS' },
                        { id: 'html', label: 'HTML' },
                        { id: 'json', label: 'JSON' },
                        { id: 'sql', label: 'SQL' },
                        { id: 'markdown', label: 'Markdown' },
                        { id: 'base64', label: 'Base64' },
                        { id: 'url', label: 'URL' }
                    ].map(lang => (
                        <button
                            key={lang.id}
                            onClick={() => setMode(lang.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                mode === lang.id ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>

                <div className="flex bg-slate-900 rounded-lg p-1">
                    {!['markdown', 'base64', 'url'].includes(mode) ? (
                        <>
                            <button onClick={() => setAction('minify')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${action === 'minify' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>압축 (Minify)</button>
                            <button onClick={() => setAction('beautify')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${action === 'beautify' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>정렬 (Beautify)</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setAction(mode === 'markdown' ? 'convert' : 'convert')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${action === 'convert' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>{mode === 'markdown' ? 'To HTML' : 'Encode'}</button>
                            {!['markdown'].includes(mode) && <button onClick={() => setAction('decode')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${action === 'decode' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>Decode</button>}
                        </>
                    )}
                </div>
            </div>

            {/* 3. 메인 에디터 (Grid Layout - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* 좌측: 입력 */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-sm font-semibold text-slate-400">Input ({mode.toUpperCase()})</span>
                        <div className="flex gap-3 text-xs text-slate-500">
                            <span>Lines: {meta.lines}</span>
                            <span>Chars: {meta.chars}</span>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="// Paste your code here..."
                        className="flex-1 w-full bg-slate-800 text-slate-200 p-4 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none font-mono text-sm resize-none shadow-inner"
                        spellCheck="false"
                    />
                </div>

                {/* 우측: 출력 */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-sm font-semibold text-amber-500">Output</span>
                        <div className="flex gap-2">
                             <button 
                                onClick={handleDownload}
                                disabled={!output}
                                className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors disabled:opacity-50"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                다운로드
                            </button>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(output); alert('Copied!'); }}
                                disabled={!output}
                                className="text-xs flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                복사
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={output}
                        readOnly
                        placeholder="// Result will appear here..."
                        className="flex-1 w-full bg-slate-950 text-amber-50 text-opacity-90 p-4 rounded-xl border border-slate-800 focus:outline-none font-mono text-sm resize-none shadow-inner"
                    />
                </div>
            </div>

            {/* 4. 하단 통계 및 상태바 */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">원본 크기</div>
                    <div className="text-lg font-bold text-slate-200">{stats.originalSize.toLocaleString()} B</div>
                    <div className="text-xs text-slate-600">Gzip: ~{stats.gzipOriginal.toLocaleString()} B</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">결과 크기</div>
                    <div className="text-lg font-bold text-amber-400">{stats.minifiedSize.toLocaleString()} B</div>
                    <div className="text-xs text-slate-600">Gzip: ~{stats.gzipMinified.toLocaleString()} B</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">절감 효율</div>
                    <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-green-400">{stats.ratio}%</div>
                        <span className="text-xs text-slate-400">({stats.saved.toLocaleString()} B Saved)</span>
                    </div>
                </div>
                 <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col justify-center">
                    <div className="text-xs text-slate-500 mb-1">상태</div>
                    <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {action === 'minify' ? '압축 완료' : action === 'beautify' ? '정렬 완료' : '변환 완료'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeMinifier;