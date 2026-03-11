import React, { useState } from 'react';

const WORD_SETS = {
    classic: ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit','voluptate','velit','esse','cillum','eu','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum','curabitur','pretium','tincidunt','lacus','nunc','pulvinar','sapien'],
    zombie: ['brains','braaains','zombie','undead','flesh','rotting','guts','gore','brain','eat','hungry','dead','walking','moan','groan','survive','apocalypse','survivor','bite','infected','virus','outbreak','horde','shamble','decay','corpse','scary','scream','run','hide'],
    hipster: ['artisan','craft','organic','sustainable','locally','sourced','handcrafted','boutique','curated','vintage','retro','minimalist','aesthetic','authentic','farm','to','table','cold','brew','pour','over','single','origin','fair','trade'],
};

const SEPARATORS = { comma: ', ', semicolon: '; ', pipe: ' | ', slash: ' / ', dash: ' - ', newline: '\n', space: ' ', custom: null };

const getWord = (words) => words[Math.floor(Math.random() * words.length)];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

const makeSentence = (words, wordSep, sentenceEnd) => {
    const len = 8 + Math.floor(Math.random() * 12);
    const w = Array.from({ length: len }, () => getWord(words));
    return cap(w.join(wordSep)) + (sentenceEnd || '.');
};

const makeParagraph = (words, wordSep, sentenceEnd, sentenceSep) => {
    const len = 4 + Math.floor(Math.random() * 4);
    return Array.from({ length: len }, () => makeSentence(words, wordSep, sentenceEnd)).join(sentenceSep || ' ');
};

const LoremIpsumGenerator = () => {
    const [type, setType] = useState('paragraphs');
    const [count, setCount] = useState(3);
    const [startOption, setStartOption] = useState('lorem'); // lorem | comma | random | custom
    const [customStart, setCustomStart] = useState('');
    const [wordSeparator, setWordSeparator] = useState('space');
    const [customWordSep, setCustomWordSep] = useState('');
    const [sentenceSeparator, setSentenceSeparator] = useState('space');
    const [customSentenceSep, setCustomSentenceSep] = useState('');
    const [outputFormat, setOutputFormat] = useState('plain'); // plain | html | bullet | csv | json
    const [theme, setTheme] = useState('classic');
    const [output, setOutput] = useState('');
    const [copied, setCopied] = useState(false);

    const getSep = (key, custom) => (key === 'custom' && custom) ? custom : (SEPARATORS[key] ?? ' ');

    const generate = () => {
        const words = WORD_SETS[theme] || WORD_SETS.classic;
        const wordSep = getSep(wordSeparator, customWordSep);
        const sentSep = getSep(sentenceSeparator, customSentenceSep);

        const getFirstSentence = () => {
            if (startOption === 'lorem') return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
            if (startOption === 'comma') return cap(getWord(words)) + ', ' + getWord(words) + ', ' + getWord(words) + '.';
            if (startOption === 'custom' && customStart.trim()) return customStart.trim();
            return makeSentence(words, wordSep, '.');
        };

        const getFirstWord = () => {
            if (startOption === 'lorem') return 'Lorem';
            if (startOption === 'comma') return cap(getWord(words));
            if (startOption === 'custom' && customStart.trim()) return customStart.trim().split(/\s+/)[0] || getWord(words);
            return cap(getWord(words));
        };

        let result = '';
        if (type === 'paragraphs') {
            const paras = Array.from({ length: count }, (_, i) => {
                const p = i === 0 ? getFirstSentence() : makeParagraph(words, wordSep, '.', sentSep);
                if (outputFormat === 'html') return `<p>${p}</p>`;
                if (outputFormat === 'bullet') return `• ${p}`;
                if (outputFormat === 'csv') return `"${p.replace(/"/g, '""')}"`;
                return p;
            });
            if (outputFormat === 'json') result = JSON.stringify(paras, null, 2);
            else result = paras.join(outputFormat === 'html' ? '\n' : '\n\n');
        } else if (type === 'sentences') {
            const sents = Array.from({ length: count }, (_, i) => i === 0 ? getFirstSentence() : makeSentence(words, wordSep, '.'));
            if (outputFormat === 'bullet') result = sents.map(s => `• ${s}`).join('\n');
            else if (outputFormat === 'csv') result = sents.map(s => `"${s.replace(/"/g, '""')}"`).join(',\n');
            else if (outputFormat === 'json') result = JSON.stringify(sents, null, 2);
            else result = sents.join(sentSep);
        } else {
            const w = Array.from({ length: count }, (_, i) => i === 0 ? getFirstWord() : getWord(words));
            if (outputFormat === 'bullet') result = w.map(x => `• ${x}`).join('\n');
            else if (outputFormat === 'csv') result = w.map(x => `"${x}"`).join(', ');
            else if (outputFormat === 'json') result = JSON.stringify(w, null, 2);
            else result = w.join(wordSep);
        }
        setOutput(result);
    };

    const copy = () => {
        navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(()=>{});
    };

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(16,185,129,0.1))', border: '1px solid rgba(74,222,128,0.2)' }}>📝</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">Lorem Ipsum 생성기</h1>
                        <p className="text-xs text-slate-500">더미 텍스트 즉시 생성 · 단락 / 문장 / 단어</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
                    {/* 설정 */}
                    <div className="lg:w-72 shrink-0 space-y-4 overflow-y-auto custom-scrollbar max-h-[70vh] lg:max-h-none">
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">생성 유형</h3>
                            <div className="space-y-1">
                                {[
                                    { id: 'paragraphs', label: '📄 단락' },
                                    { id: 'sentences', label: '💬 문장' },
                                    { id: 'words', label: '🔤 단어' },
                                ].map(t => (
                                    <button key={t.id} onClick={() => setType(t.id)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                                        style={type === t.id ? { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' } : { color: '#64748b', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                                개수: <span className="text-green-400">{count}</span>
                            </h3>
                            <input type="range" min={1} max={20} value={count} onChange={e => setCount(Number(e.target.value))}
                                className="w-full accent-green-500 cursor-pointer" style={{ background: 'transparent', border: 'none' }} />
                            <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>1</span><span>20</span></div>
                        </div>

                        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">시작 옵션</h3>
                            <div className="space-y-1">
                                {[
                                    { id: 'lorem', label: 'Lorem ipsum으로 시작' },
                                    { id: 'comma', label: '쉼표 스타일로 시작 (단어, 단어, 단어.)' },
                                    { id: 'random', label: '랜덤 단어로 시작' },
                                    { id: 'custom', label: '사용자 지정' },
                                ].map(o => (
                                    <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="start" checked={startOption === o.id} onChange={() => setStartOption(o.id)} className="accent-green-500 w-3.5 h-3.5" />
                                        <span className="text-xs text-slate-300">{o.label}</span>
                                    </label>
                                ))}
                                {startOption === 'custom' && (
                                    <input type="text" value={customStart} onChange={e => setCustomStart(e.target.value)} placeholder="시작 문장 입력" className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-600 outline-none focus:border-green-500" />
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">구분자</h3>
                            <div>
                                <span className="text-[10px] text-slate-500 block mb-1">단어 사이</span>
                                <select value={wordSeparator} onChange={e => setWordSeparator(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-600 outline-none">
                                    <option value="space">공백</option>
                                    <option value="comma">쉼표</option>
                                    <option value="semicolon">세미콜론</option>
                                    <option value="pipe">파이프 (|)</option>
                                    <option value="slash">슬래시 (/)</option>
                                    <option value="dash">대시 (-)</option>
                                    <option value="custom">사용자 지정</option>
                                </select>
                                {wordSeparator === 'custom' && (
                                    <input type="text" value={customWordSep} onChange={e => setCustomWordSep(e.target.value)} placeholder="예: @, #" className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-600 outline-none" />
                                )}
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 block mb-1">문장/항목 사이</span>
                                <select value={sentenceSeparator} onChange={e => setSentenceSeparator(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-600 outline-none">
                                    <option value="space">공백</option>
                                    <option value="comma">쉼표</option>
                                    <option value="semicolon">세미콜론</option>
                                    <option value="newline">줄바꿈</option>
                                    <option value="pipe">파이프</option>
                                    <option value="custom">사용자 지정</option>
                                </select>
                                {sentenceSeparator === 'custom' && (
                                    <input type="text" value={customSentenceSep} onChange={e => setCustomSentenceSep(e.target.value)} placeholder="구분자 입력" className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-600 outline-none" />
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">출력 형식</h3>
                            <div className="flex flex-wrap gap-1">
                                {[
                                    { id: 'plain', label: '일반' },
                                    { id: 'html', label: 'HTML' },
                                    { id: 'bullet', label: '불릿' },
                                    { id: 'csv', label: 'CSV' },
                                    { id: 'json', label: 'JSON' },
                                ].map(f => (
                                    <button key={f.id} onClick={() => setOutputFormat(f.id)}
                                        className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${outputFormat === f.id ? 'bg-green-600/30 text-green-400 border border-green-500/40' : 'bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-slate-500'}`}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">테마</h3>
                            <div className="flex flex-wrap gap-1">
                                {[
                                    { id: 'classic', label: '클래식' },
                                    { id: 'zombie', label: '좀비' },
                                    { id: 'hipster', label: '힙스터' },
                                ].map(t => (
                                    <button key={t.id} onClick={() => setTheme(t.id)}
                                        className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${theme === t.id ? 'bg-green-600/30 text-green-400 border border-green-500/40' : 'bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-slate-500'}`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={generate}
                            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #4ade80, #22d3ee)', boxShadow: '0 4px 20px rgba(74,222,128,0.25)' }}>
                            ✨ 생성하기
                        </button>
                    </div>

                    {/* 결과 */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">결과</span>
                            {output && (
                                <button onClick={copy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={copied ? { background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' } : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {copied ? '✓ 복사됨' : '📋 복사'}
                                </button>
                            )}
                        </div>
                        <textarea
                            readOnly
                            value={output || '위 설정을 조정하고 "생성하기" 버튼을 눌러주세요.'}
                            className="flex-1 w-full p-4 text-sm rounded-xl outline-none resize-none custom-scrollbar leading-relaxed"
                            style={{ color: output ? '#e2e8f0' : '#475569' }}
                        />
                        {output && (
                            <div className="flex gap-4 mt-2 text-[11px] text-slate-600">
                                <span>글자 수: <b className="text-slate-400">{output.length}</b></span>
                                <span>단어 수: <b className="text-slate-400">{output.split(/\s+/).filter(Boolean).length}</b></span>
                                <span>문장 수: <b className="text-slate-400">{output.split('.').filter(s => s.trim()).length}</b></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoremIpsumGenerator;
