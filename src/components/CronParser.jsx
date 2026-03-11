import React, { useState, useMemo } from 'react';

const FIELD_INFO = [
    { name: '초', range: '0-59', desc: '선택사항', special: '* , - /' },
    { name: '분', range: '0-59', desc: '필수', special: '* , - /' },
    { name: '시', range: '0-23', desc: '필수', special: '* , - /' },
    { name: '일', range: '1-31', desc: '필수', special: '* , - / ? L W' },
    { name: '월', range: '1-12', desc: '필수', special: '* , - /' },
    { name: '요일', range: '0-6', desc: '필수 (0=일)', special: '* , - / ? L #' },
    { name: '연도', range: '1970-2099', desc: '선택사항', special: '* , - /' },
];

const PRESETS = [
    { label: '매분', cron: '* * * * *', desc: '매 분마다' },
    { label: '매시간', cron: '0 * * * *', desc: '매 시간 0분' },
    { label: '매일 자정', cron: '0 0 * * *', desc: '매일 00:00' },
    { label: '매일 정오', cron: '0 12 * * *', desc: '매일 12:00' },
    { label: '매주 월요일', cron: '0 9 * * 1', desc: '월요일 09:00' },
    { label: '매월 1일', cron: '0 0 1 * *', desc: '매월 1일 자정' },
    { label: '매 5분', cron: '*/5 * * * *', desc: '5분마다' },
    { label: '매 15분', cron: '*/15 * * * *', desc: '15분마다' },
    { label: '평일 9시', cron: '0 9 * * 1-5', desc: '월-금 09:00' },
    { label: '야간 작업', cron: '0 2 * * *', desc: '매일 02:00' },
    { label: '분기별', cron: '0 0 1 */3 *', desc: '분기 첫날 자정' },
    { label: '매년', cron: '0 0 1 1 *', desc: '매년 1월 1일' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['일','월','화','수','목','금','토'];

const explainPart = (expr, type) => {
    if (expr === '*') return type === '분' ? '매분' : type === '시' ? '매시간' : type === '일' ? '매일' : type === '월' ? '매월' : type === '요일' ? '매요일' : '매년';
    if (expr.startsWith('*/')) return `${expr.slice(2)}${type}마다`;
    if (expr.includes('-')) { const [s, e] = expr.split('-'); return `${s}~${e} ${type}`; }
    if (expr.includes(',')) return `${expr.replace(/,/g, ', ')} ${type}`;
    return `${type} ${expr}`;
};

const CronParser = () => {
    const [cron, setCron] = useState('0 9 * * 1-5');
    const [error, setError] = useState('');

    const explanation = useMemo(() => {
        if (!cron.trim()) return '';
        const parts = cron.trim().split(/\s+/);
        if (parts.length < 5 || parts.length > 7) { setError(`${parts.length}개 필드가 입력되었습니다. 5~7개가 필요합니다.`); return ''; }
        setError('');
        const [min, hour, day, month, weekday] = parts.length === 5 ? parts : parts.slice(-5);
        return `${explainPart(min, '분')} ${explainPart(hour, '시')} ${explainPart(day, '일')} ${explainPart(month, '월')} ${explainPart(weekday, '요일')}마다 실행`;
    }, [cron]);

    const nextDates = useMemo(() => {
        const parts = cron.trim().split(/\s+/);
        if (parts.length < 5) return [];
        const [minStr, hourStr] = parts.length === 5 ? parts : parts.slice(-5);
        const mins = minStr === '*' ? [0] : minStr.startsWith('*/') ? Array.from({ length: Math.ceil(60 / Number(minStr.slice(2))) }, (_, i) => i * Number(minStr.slice(2))) : minStr.split(',').map(Number);
        const hours = hourStr === '*' ? [0] : hourStr.startsWith('*/') ? Array.from({ length: Math.ceil(24 / Number(hourStr.slice(2))) }, (_, i) => i * Number(hourStr.slice(2))) : hourStr.split(',').map(Number);
        const now = new Date();
        const results = [];
        for (let d = 0; d < 7 && results.length < 5; d++) {
            const date = new Date(now); date.setDate(date.getDate() + d);
            for (const h of hours) {
                for (const m of mins) {
                    date.setHours(h, m, 0, 0);
                    if (date > now) results.push(new Date(date));
                    if (results.length >= 5) break;
                }
                if (results.length >= 5) break;
            }
        }
        return results;
    }, [cron]);

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(14,165,233,0.1))', border: '1px solid rgba(34,211,238,0.2)' }}>⏰</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">Cron 표현식 파서</h1>
                        <p className="text-xs text-slate-500">Cron 표현식 분석 · 설명 · 다음 실행 시간 계산</p>
                    </div>
                </div>

                {/* 입력 */}
                <div className="mb-4 shrink-0">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Cron 표현식</label>
                    <input type="text" value={cron} onChange={e => setCron(e.target.value)} placeholder="예: 0 9 * * 1-5"
                        className="w-full px-4 py-3 text-base rounded-xl outline-none font-mono tracking-wider" />
                    {explanation && !error && (
                        <div className="mt-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                            <span className="text-xs text-cyan-400">💡 </span>
                            <span className="text-sm text-cyan-300 font-semibold">{explanation}</span>
                        </div>
                    )}
                    {error && <div className="mt-2 px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>⚠️ {error}</div>}
                </div>

                <div className="flex flex-col lg:flex-row gap-5 flex-1">
                    {/* 필드 가이드 */}
                    <div className="lg:w-64 shrink-0 space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">필드 설명</h3>
                        <div className="flex gap-1 font-mono text-xs px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {cron.trim().split(/\s+/).map((p, i) => (
                                <span key={i} className="px-2 py-1 rounded font-bold" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }}>{p}</span>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {FIELD_INFO.slice(0, 6).map((f, i) => (
                                <div key={i} className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300">{f.name}</span>
                                        <span className="text-[10px] font-mono text-slate-600">{f.range}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-0.5">특수기호: {f.special}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        {/* 다음 실행 시간 */}
                        {nextDates.length > 0 && (
                            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">⏭️ 다음 실행 시간 (예상)</h3>
                                <div className="space-y-1.5">
                                    {nextDates.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                            <span className="text-[10px] font-bold text-cyan-600">#{i+1}</span>
                                            <span className="text-xs font-mono text-slate-200">{d.toLocaleString('ko-KR')}</span>
                                            <span className="ml-auto text-[10px] text-slate-600">{DAYS[d.getDay()]}요일</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 프리셋 */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">자주 쓰는 표현</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {PRESETS.map(p => (
                                    <button key={p.cron} onClick={() => setCron(p.cron)}
                                        className="text-left px-3 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div className="text-xs font-bold text-slate-200 mb-0.5">{p.label}</div>
                                        <div className="text-[10px] font-mono text-cyan-600">{p.cron}</div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CronParser;
