import React, { useState, useMemo } from 'react';
import StudioLayout from './StudioLayout';

function diffLines(a, b) {
    const aLines = a.split('\n'), bLines = b.split('\n');
    const m = aLines.length, n = bLines.length;
    const dp = Array.from({ length: m+1 }, () => new Array(n+1).fill(0));
    for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
        dp[i][j] = aLines[i-1]===bLines[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j],dp[i][j-1]);
    const result = [];
    let i=m, j=n;
    while (i>0||j>0) {
        if (i>0&&j>0&&aLines[i-1]===bLines[j-1]) { result.unshift({type:'eq',val:aLines[i-1]}); i--;j--; }
        else if (j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])) { result.unshift({type:'add',val:bLines[j-1]}); j--; }
        else { result.unshift({type:'del',val:aLines[i-1]}); i--; }
    }
    return result;
}

export default function DiffChecker() {
    const [left, setLeft] = useState('');
    const [right, setRight] = useState('');
    const [mode, setMode] = useState('split');

    const diff = useMemo(() => diffLines(left, right), [left, right]);
    const stats = useMemo(() => ({
        added: diff.filter(d=>d.type==='add').length,
        removed: diff.filter(d=>d.type==='del').length,
        unchanged: diff.filter(d=>d.type==='eq').length,
    }), [diff]);

    const presets = [
        { name: '예시 비교', left: 'const greet = (name) => {\n  console.log("Hello, " + name);\n  return name;\n};', right: 'const greet = (name, greeting = "Hello") => {\n  console.log(greeting + ", " + name + "!");\n  return { name, greeting };\n};' }
    ];

    const PSEUDO_TABS = [{ id: 'diff', label: '비교', icon: '🔀', desc: '두 텍스트를 줄 단위로 비교 & 하이라이트' }];
    return (
        <StudioLayout
            color="#f59e0b"
            icon="🔀"
            title="Diff Checker"
            description="두 텍스트의 추가·삭제·동일 줄을 실시간으로 비교하고 분할/통합 뷰로 확인"
            tabs={PSEUDO_TABS}
            tab="diff"
            setTab={() => {}}>
            <div className="space-y-4">
                <div className="flex gap-2 items-center flex-wrap">
                    <button onClick={() => presets[0] && (setLeft(presets[0].left), setRight(presets[0].right))}
                        className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all text-slate-300 hover:text-white"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>예시 불러오기</button>
                    <button onClick={() => { setLeft(''); setRight(''); }}
                        className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all text-slate-500 hover:text-slate-300"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>초기화</button>
                    <div className="flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {[['split','분할 보기'], ['unified','통합 보기']].map(([v, l]) => (
                            <button key={v} onClick={() => setMode(v)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${mode === v ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                style={mode === v ? { background: 'linear-gradient(135deg, #f59e0bcc, #f59e0b90)' } : {}}>
                                {l}
                            </button>
                        ))}
                    </div>
                    {(left || right) && (
                        <div className="flex gap-2 ml-auto">
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>+{stats.added}</span>
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>-{stats.removed}</span>
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>{stats.unchanged} 동일</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">원본 (A)</label>
                        <textarea value={left} onChange={e => setLeft(e.target.value)} placeholder="원본 텍스트를 입력하세요..."
                            rows={mode === 'split' ? 8 : 6}
                            className="w-full bg-slate-900/60 text-slate-200 font-mono text-sm px-4 py-3 rounded-xl border border-slate-700/60 outline-none focus:border-amber-500/50 resize-none custom-scrollbar transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">수정본 (B)</label>
                        <textarea value={right} onChange={e => setRight(e.target.value)} placeholder="수정된 텍스트를 입력하세요..."
                            rows={mode === 'split' ? 8 : 6}
                            className="w-full bg-slate-900/60 text-slate-200 font-mono text-sm px-4 py-3 rounded-xl border border-slate-700/60 outline-none focus:border-amber-500/50 resize-none custom-scrollbar transition-all" />
                    </div>
                </div>

                {(left || right) && diff.length > 0 && (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">비교 결과</span>
                        </div>
                        <div className="overflow-x-auto">
                            {mode === 'split' ? (
                                <table className="w-full font-mono text-sm">
                                    <tbody>
                                        {(() => {
                                            const aOnly = diff.filter(d => d.type !== 'add'), bOnly = diff.filter(d => d.type !== 'del');
                                            const maxLen = Math.max(aOnly.length, bOnly.length);
                                            return Array.from({ length: maxLen }, (_, i) => {
                                                const a = aOnly[i], b = bOnly[i];
                                                return (
                                                    <tr key={i} className="border-b border-white/5 last:border-0">
                                                        <td className={`px-3 py-1.5 border-r border-white/5 ${a?.type === 'del' ? 'bg-red-900/20 text-red-300' : a?.type === 'eq' ? 'text-slate-300' : ''}`}>
                                                            {a?.type === 'del' && <span className="text-red-500 mr-1 font-black">–</span>}{a?.val ?? ''}
                                                        </td>
                                                        <td className={`px-3 py-1.5 ${b?.type === 'add' ? 'bg-emerald-900/20 text-emerald-300' : b?.type === 'eq' ? 'text-slate-300' : ''}`}>
                                                            {b?.type === 'add' && <span className="text-emerald-500 mr-1 font-black">+</span>}{b?.val ?? ''}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-3 space-y-0.5">
                                    {diff.map((d, i) => (
                                        <div key={i} className={`flex items-start gap-2 px-3 py-1 rounded font-mono text-sm ${d.type === 'add' ? 'bg-emerald-900/20 text-emerald-300' : d.type === 'del' ? 'bg-red-900/20 text-red-300' : 'text-slate-500'}`}>
                                            <span className="w-4 shrink-0 font-black">{d.type === 'add' ? '+' : d.type === 'del' ? '–' : ' '}</span>
                                            <span className="flex-1 whitespace-pre-wrap break-all">{d.val}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </StudioLayout>
    );
}
