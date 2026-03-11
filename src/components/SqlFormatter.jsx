import React, { useState } from 'react';

const KEYWORDS = ['SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','FULL','CROSS','ON','AS','AND','OR','NOT','IN','EXISTS','BETWEEN','LIKE','IS','NULL','ORDER','BY','GROUP','HAVING','LIMIT','OFFSET','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','INDEX','VIEW','DROP','ALTER','ADD','COLUMN','PRIMARY','KEY','FOREIGN','REFERENCES','UNIQUE','DEFAULT','CONSTRAINT','CHECK','DISTINCT','COUNT','SUM','AVG','MIN','MAX','CASE','WHEN','THEN','ELSE','END','WITH','UNION','ALL','EXCEPT','INTERSECT','ASC','DESC','IF','WHILE','BEGIN','COMMIT','ROLLBACK','TRANSACTION'];

const formatSQL = (sql, indentSize = 2, uppercase = true) => {
    const indent = ' '.repeat(indentSize);
    let result = sql.trim();
    if (uppercase) {
        const pattern = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'gi');
        result = result.replace(pattern, m => m.toUpperCase());
    }

    const mainKws = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','FULL JOIN','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','UNION','UNION ALL','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','DROP TABLE','ALTER TABLE'];
    mainKws.forEach(kw => {
        const pattern = new RegExp(`\\s*\\b${kw}\\b\\s*`, 'gi');
        result = result.replace(pattern, `\n${kw}\n${indent}`);
    });

    result = result.replace(/,(?!\s*\n)/g, `,\n${indent}`);
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.trim();
    return result;
};

const SqlFormatter = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [indent, setIndent] = useState(2);
    const [uppercase, setUppercase] = useState(true);
    const [mode, setMode] = useState('format'); // format | minify
    const [copied, setCopied] = useState(false);

    const convert = () => {
        if (!input.trim()) return;
        if (mode === 'format') {
            setOutput(formatSQL(input, indent, uppercase));
        } else {
            setOutput(input.replace(/\s+/g, ' ').trim());
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(()=>{});
    };

    const SAMPLE = `select u.id, u.name, count(o.id) as order_count, sum(o.total) as total_spent from users u left join orders o on u.id = o.user_id where u.created_at > '2024-01-01' and u.status = 'active' group by u.id, u.name having count(o.id) > 5 order by total_spent desc limit 10`;

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(14,165,233,0.1))', border: '1px solid rgba(34,211,238,0.2)' }}>🗄️</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">SQL 포맷터</h1>
                        <p className="text-xs text-slate-500">SQL 쿼리 자동 정렬 · 키워드 대문자 변환 · 압축</p>
                    </div>
                </div>

                {/* 옵션 바 */}
                <div className="flex items-center gap-3 mb-4 shrink-0 flex-wrap">
                    <div className="flex rounded-xl p-0.5 gap-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {[{ id: 'format', label: '✨ 포맷' }, { id: 'minify', label: '🗜️ 압축' }].map(m => (
                            <button key={m.id} onClick={() => setMode(m.id)}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={mode === m.id ? { background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', color: '#fff' } : { color: '#64748b' }}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                    {mode === 'format' && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">들여쓰기</span>
                                <select value={indent} onChange={e => setIndent(Number(e.target.value))} className="px-2 py-1 text-xs rounded-lg outline-none">
                                    <option value={2}>2칸</option>
                                    <option value={4}>4칸</option>
                                    <option value={0}>탭</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} className="accent-cyan-500 w-3.5 h-3.5" style={{ background: 'transparent', border: 'none' }} />
                                <span className="text-xs text-slate-400">키워드 대문자</span>
                            </label>
                        </>
                    )}
                    <button onClick={() => { setInput(SAMPLE); setOutput(''); }} className="ml-auto px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        예시 로드
                    </button>
                    <button onClick={convert} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', boxShadow: '0 2px 10px rgba(6,182,212,0.3)' }}>
                        변환
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                    <div className="flex-1 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">입력 SQL</label>
                        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="SQL 쿼리를 여기에 붙여넣으세요..." className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">결과</label>
                            {output && <button onClick={copy} className="text-[10px] px-2 py-1 rounded font-bold transition-all" style={copied ? { color: '#22c55e', background: 'rgba(34,197,94,0.1)' } : { color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>{copied ? '✓ 복사됨' : '복사'}</button>}
                        </div>
                        <textarea readOnly value={output || '여기에 결과가 표시됩니다...'} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" style={{ color: output ? '#e2e8f0' : '#475569' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SqlFormatter;
