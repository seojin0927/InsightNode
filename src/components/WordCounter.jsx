import React, { useState, useMemo } from 'react';

export default function WordCounter() {
    const [text, setText] = useState('');

    const stats = useMemo(() => {
        if (!text) return { chars: 0, charsNoSpace: 0, words: 0, sentences: 0, paragraphs: 0, lines: 0, readTime: '0분', avgWordLen: 0, topWords: [] };
        const words = text.trim().split(/\s+/).filter(Boolean);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length || 1;
        const lines = text.split('\n').length;
        const readTime = Math.ceil(words.length / 200);
        const avgWordLen = words.length ? (words.reduce((s,w)=>s+w.replace(/[^a-zA-Z가-힣]/g,'').length,0) / words.length).toFixed(1) : 0;

        const freq = {};
        words.forEach(w => {
            const k = w.toLowerCase().replace(/[^a-zA-Z가-힣]/g, '');
            if (k.length > 1) freq[k] = (freq[k]||0) + 1;
        });
        const topWords = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);

        return {
            chars: text.length,
            charsNoSpace: text.replace(/\s/g,'').length,
            words: words.length,
            sentences,
            paragraphs,
            lines,
            readTime: readTime < 1 ? '1분 미만' : `약 ${readTime}분`,
            avgWordLen,
            topWords,
        };
    }, [text]);

    const STAT_CARDS = [
        { label: '문자 수', value: stats.chars.toLocaleString(), color: '#6366f1', sub: `공백 제외: ${stats.charsNoSpace.toLocaleString()}` },
        { label: '단어 수', value: stats.words.toLocaleString(), color: '#22c55e', sub: `평균 길이: ${stats.avgWordLen}자` },
        { label: '문장 수', value: stats.sentences.toLocaleString(), color: '#06b6d4', sub: `문단: ${stats.paragraphs}개` },
        { label: '줄 수', value: stats.lines.toLocaleString(), color: '#f59e0b', sub: `읽기 시간: ${stats.readTime}` },
    ];

    const caseConversions = [
        { label: '대문자', fn: t => t.toUpperCase() },
        { label: '소문자', fn: t => t.toLowerCase() },
        { label: '제목 형식', fn: t => t.replace(/\b\w/g, c => c.toUpperCase()) },
        { label: '문장 형식', fn: t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() },
    ];

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white">Word Counter</h1>
                    <p className="text-sm text-slate-500 mt-1">텍스트 분석 · 단어/문장 수 · 읽기 시간 계산</p>
                </div>

                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="분석할 텍스트를 입력하거나 붙여넣으세요..."
                    className="w-full h-48 bg-slate-900 text-slate-200 text-sm px-4 py-3 rounded-2xl border border-slate-700 outline-none focus:border-indigo-500 resize-none custom-scrollbar mb-4" />

                {/* 케이스 변환 */}
                {text && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {caseConversions.map(c => (
                            <button key={c.label} onClick={() => setText(c.fn(text))} className="text-xs px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 hover:text-white transition-all">{c.label}</button>
                        ))}
                        <button onClick={() => { navigator.clipboard.writeText(text); }} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 ml-auto">복사</button>
                        <button onClick={() => setText('')} className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700">지우기</button>
                    </div>
                )}

                {/* 통계 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {STAT_CARDS.map(card => (
                        <div key={card.label} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                            <div className="text-3xl font-black mb-1" style={{ color: card.color }}>{card.value}</div>
                            <div className="text-xs font-bold text-slate-300">{card.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{card.sub}</div>
                        </div>
                    ))}
                </div>

                {/* 자주 쓰인 단어 */}
                {stats.topWords.length > 0 && (
                    <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                        <h3 className="text-sm font-bold text-slate-300 mb-3">자주 쓰인 단어 TOP 10</h3>
                        <div className="space-y-2">
                            {stats.topWords.map(([word, count], i) => (
                                <div key={word} className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-600 w-4 font-bold">{i+1}</span>
                                    <span className="text-sm text-slate-300 font-mono w-32 truncate">{word}</span>
                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${(count / stats.topWords[0][1]) * 100}%` }} />
                                    </div>
                                    <span className="text-xs text-indigo-400 font-bold w-8 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
