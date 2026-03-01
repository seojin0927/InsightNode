import React, { useState, useRef, useEffect, useCallback } from 'react';

const MarkdownStudio = () => {
    // === 상태 관리 ===
    const [markdown, setMarkdown] = useState('');
    const [viewMode, setViewMode] = useState('split'); // split, editor, preview
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [stats, setStats] = useState({ chars: 0, words: 0, readTime: 0 });
    const [lastSaved, setLastSaved] = useState(null);
    const editorRef = useRef(null);

    // === 초기화 및 자동 저장 ===
    useEffect(() => {
        const savedData = localStorage.getItem('md_draft');
        if (savedData) {
            setMarkdown(savedData);
            setLastSaved('복구됨');
        } else {
            // 기본 템플릿
            setMarkdown('# 제목을 입력하세요\n\n여기에 내용을 작성하세요.');
        }
    }, []);

    // 자동 저장 로직 (Debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('md_draft', markdown);
            setLastSaved(new Date().toLocaleTimeString());
        }, 1000);
        
        // 통계 업데이트
        const text = markdown.replace(/[#*`[\]()\-!>]/g, '');
        const words = text.trim().split(/\s+/).filter(w => w).length;
        const chars = text.length;
        setStats({
            chars,
            words,
            readTime: Math.ceil(words / 200) // 평균 독서 속도
        });

        return () => clearTimeout(timer);
    }, [markdown]);

    // === 히스토리 (Undo/Redo) ===
    const updateMarkdown = (newText) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newText);
        if (newHistory.length > 50) newHistory.shift(); // 최대 50개 저장
        
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setMarkdown(newText);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setMarkdown(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setMarkdown(history[historyIndex + 1]);
        }
    };

    // === 편집 도구 (Insert) ===
    const insertSyntax = (prefix, suffix = '') => {
        const textarea = editorRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = markdown;
        const selection = text.substring(start, end);
        
        const replacement = `${prefix}${selection}${suffix}`;
        const newText = text.substring(0, start) + replacement + text.substring(end);
        
        updateMarkdown(newText);
        
        // 커서 위치 복구 및 포커스
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    // === 템플릿 로드 ===
    const loadTemplate = (type) => {
        if (!window.confirm('현재 내용이 사라집니다. 계속하시겠습니까?')) return;
        
        let content = '';
        switch(type) {
            case 'readme':
                content = `# Project Title\n\n## Description\n프로젝트 설명\n\n## Installation\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Features\n- Feature 1\n- Feature 2`;
                break;
            case 'blog':
                content = `---\ntitle: Blog Post\ndate: ${new Date().toISOString().split('T')[0]}\n---\n\n# 포스트 제목\n\n서론을 입력하세요.\n\n## 본문\n내용 작성...\n\n> 인용구\n\n## 결론\n마무리`;
                break;
            case 'todo':
                content = `# 할 일 목록\n\n- [ ] 기획서 작성\n- [ ] 디자인 시안 검토\n- [x] 개발 환경 설정`;
                break;
            default: return;
        }
        updateMarkdown(content);
    };

    // === 변환 엔진 (Custom Markdown Parser) ===
    const parseMarkdown = (text) => {
        if (!text) return '';
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 1. Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-violet-300 mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-violet-400 mt-6 mb-3 border-b border-slate-700 pb-1">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-violet-500 mt-2 mb-4">$1</h1>');

        // 2. Bold & Italic & Strikethrough
        html = html.replace(/\*\*(.*)\*\*/gim, '<strong class="text-violet-200">$1</strong>');
        html = html.replace(/\*(.*)\*/gim, '<em class="text-slate-300">$1</em>');
        html = html.replace(/~~(.*)~~/gim, '<del class="text-slate-500">$1</del>');

        // 3. Code Blocks
        html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-950 p-4 rounded-lg my-4 overflow-x-auto border border-slate-800"><code class="text-sm font-mono text-emerald-400">$1</code></pre>');
        html = html.replace(/`([^`]+)`/gim, '<code class="bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono text-emerald-300">$1</code>');

        // 4. Blockquotes
        html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-violet-500 pl-4 py-1 my-4 bg-slate-800/50 text-slate-300 italic">$1</blockquote>');

        // 5. Horizontal Rule
        html = html.replace(/^---$/gim, '<hr class="my-6 border-slate-700" />');

        // 6. Links & Images
        html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="max-w-full rounded-lg shadow-lg my-4 border border-slate-700" />');
        html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="text-blue-400 hover:underline">$1</a>');

        // 7. Checkbox (Task List)
        html = html.replace(/^\- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="accent-violet-500"><span class="text-slate-400 line-through">$1</span></div>');
        html = html.replace(/^\- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="accent-violet-500"><span class="text-slate-200">$1</span></div>');

        // 8. Lists (Simple)
        html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc marker:text-violet-500">$1</li>');
        html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal marker:text-violet-500">$1</li>');

        // 9. Tables (Simple regex - requires strict formatting)
        // | Header | Header | -> Table logic is complex for regex, skipping for simplicity in this demo or using simple replacement
        // Just handling simple new lines to <br> for non-block elements
        html = html.replace(/\n/gim, '<br />');

        return html;
    };

    // === 내보내기 ===
    const exportFile = (type) => {
        let content = markdown;
        let mime = 'text/markdown';
        let ext = 'md';

        if (type === 'html') {
            const body = parseMarkdown(markdown);
            content = `<!DOCTYPE html><html><head><style>body{background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:2rem;max-width:800px;margin:0 auto;}</style></head><body>${body}</body></html>`;
            mime = 'text/html';
            ext = 'html';
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document.${ext}`;
        a.click();
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 & 툴바 */}
            <div className="flex flex-col gap-4 mb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-100">Pro Markdown Studio</h2>
                            <p className="text-slate-400 text-sm">작성, 미리보기, 변환을 한 곳에서</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <select onChange={(e) => loadTemplate(e.target.value)} className="bg-slate-800 text-slate-300 text-sm px-3 py-2 rounded-lg border border-slate-600 outline-none">
                            <option value="">+ 템플릿 불러오기</option>
                            <option value="readme">README.md</option>
                            <option value="blog">블로그 포스트</option>
                            <option value="todo">할 일 목록</option>
                        </select>
                        <button onClick={() => exportFile('md')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg border border-slate-600 text-sm">MD 저장</button>
                        <button onClick={() => exportFile('html')} className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg shadow-violet-500/20">HTML 내보내기</button>
                    </div>
                </div>

                {/* 툴바 */}
                <div className="flex flex-wrap items-center justify-between bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide pr-2">
                        {/* Undo/Redo */}
                        <div className="flex gap-1 mr-2 border-r border-slate-600 pr-2">
                            <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30">↩</button>
                            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30">↪</button>
                        </div>
                        {/* Headers */}
                        <button onClick={() => insertSyntax('# ')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 font-bold">H1</button>
                        <button onClick={() => insertSyntax('## ')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 font-bold">H2</button>
                        <button onClick={() => insertSyntax('### ')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 font-bold">H3</button>
                        <div className="w-px bg-slate-600 mx-1 h-6 self-center"></div>
                        {/* Styles */}
                        <button onClick={() => insertSyntax('**', '**')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 font-bold">B</button>
                        <button onClick={() => insertSyntax('*', '*')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 italic">I</button>
                        <button onClick={() => insertSyntax('~~', '~~')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 line-through">S</button>
                        <div className="w-px bg-slate-600 mx-1 h-6 self-center"></div>
                        {/* Lists & Quotes */}
                        <button onClick={() => insertSyntax('- ')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300">• List</button>
                        <button onClick={() => insertSyntax('1. ')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300">1. List</button>
                        <button onClick={() => insertSyntax('- [ ] ')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300">☑ Task</button>
                        <button onClick={() => insertSyntax('> ')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300">❝ Quote</button>
                        <div className="w-px bg-slate-600 mx-1 h-6 self-center"></div>
                        {/* Code & Media */}
                        <button onClick={() => insertSyntax('`', '`')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 font-mono">Code</button>
                        <button onClick={() => insertSyntax('```\n', '\n```')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 font-mono">Block</button>
                        <button onClick={() => insertSyntax('![설명](', ')')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300">Image</button>
                        <button onClick={() => insertSyntax('[링크](', ')')} className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300">Link</button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-900 rounded-lg p-1">
                        {['editor', 'split', 'preview'].map(m => (
                            <button 
                                key={m}
                                onClick={() => setViewMode(m)}
                                className={`px-3 py-1 text-xs font-bold rounded capitalize transition-colors ${viewMode === m ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. 메인 에디터 영역 (Full Height Grid) */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 왼쪽: 에디터 */}
                {(viewMode === 'editor' || viewMode === 'split') && (
                    <div className={`flex flex-col h-full ${viewMode === 'editor' ? 'lg:col-span-2' : ''}`}>
                        <div className="bg-slate-800 rounded-t-xl p-2 border-b border-slate-700 flex justify-between items-center px-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">Editor</span>
                            <span className="text-[10px] text-slate-500">{lastSaved ? `저장됨: ${lastSaved}` : '작성 중...'}</span>
                        </div>
                        <textarea
                            ref={editorRef}
                            value={markdown}
                            onChange={(e) => updateMarkdown(e.target.value)}
                            placeholder="마크다운을 입력하세요..."
                            className="flex-1 w-full bg-slate-800 text-slate-200 p-4 rounded-b-xl border border-slate-700 border-t-0 focus:outline-none font-mono text-sm resize-none shadow-inner leading-relaxed"
                            spellCheck="false"
                        />
                    </div>
                )}

                {/* 오른쪽: 미리보기 */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className={`flex flex-col h-full ${viewMode === 'preview' ? 'lg:col-span-2' : ''}`}>
                        <div className="bg-slate-800 rounded-t-xl p-2 border-b border-slate-700 flex justify-between items-center px-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">Preview</span>
                            <button 
                                onClick={() => navigator.clipboard.writeText(parseMarkdown(markdown))} 
                                className="text-[10px] text-violet-400 hover:text-violet-300"
                            >
                                HTML 복사
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-900 rounded-b-xl border border-slate-700 border-t-0 p-6 overflow-y-auto custom-scrollbar">
                            <div 
                                className="prose prose-invert prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 하단 통계 바 */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400 bg-slate-800 p-3 rounded-xl border border-slate-700 items-center justify-between flex-shrink-0">
                <div className="flex gap-4">
                    <span>글자 수: <strong className="text-slate-200">{stats.chars}</strong></span>
                    <span>단어 수: <strong className="text-slate-200">{stats.words}</strong></span>
                    <span>예상 읽기 시간: <strong className="text-violet-400">{stats.readTime}분</strong></span>
                </div>
                <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-slate-700 rounded text-[10px]">UTF-8</span>
                    <span className="px-2 py-0.5 bg-slate-700 rounded text-[10px]">Markdown</span>
                </div>
            </div>
        </div>
    );
};

export default MarkdownStudio;