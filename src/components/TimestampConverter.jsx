import React, { useState, useEffect } from 'react';

const TimestampConverter = () => {
    const [tsInput, setTsInput] = useState('');
    const [dateInput, setDateInput] = useState('');
    const [result, setResult] = useState(null);
    const [nowTs, setNowTs] = useState(Date.now());

    useEffect(() => {
        const t = setInterval(() => setNowTs(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const convertTs = () => {
        const n = parseInt(tsInput);
        if (isNaN(n)) { setResult({ error: '유효한 숫자를 입력하세요.' }); return; }
        const ms = tsInput.length <= 10 ? n * 1000 : n;
        const d = new Date(ms);
        setResult({
            iso: d.toISOString(),
            utc: d.toUTCString(),
            local: d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
            unix_s: Math.floor(ms / 1000),
            unix_ms: ms,
            year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
            hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds(),
            weekday: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
        });
    };

    const convertDate = () => {
        if (!dateInput) return;
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) { setResult({ error: '유효한 날짜/시간을 입력하세요.' }); return; }
        setResult({
            iso: d.toISOString(),
            utc: d.toUTCString(),
            local: d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
            unix_s: Math.floor(d.getTime() / 1000),
            unix_ms: d.getTime(),
        });
    };

    const copy = (v) => navigator.clipboard.writeText(String(v)).catch(() => {});

    const Row = ({ label, value, mono }) => (
        <div className="flex items-center justify-between py-2 px-3 rounded-lg group" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-xs text-slate-500 shrink-0 mr-3">{label}</span>
            <span className={`text-xs text-slate-200 truncate ${mono ? 'font-mono' : ''}`}>{String(value)}</span>
            <button onClick={() => copy(value)} className="ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-sky-400 text-xs">복사</button>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(34,211,238,0.2)' }}>⏱️</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">Unix 타임스탬프 변환기</h1>
                        <p className="text-xs text-slate-500">Unix timestamp ↔ 사람이 읽을 수 있는 날짜 · 시간</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                        <span className="text-[10px] text-slate-600 uppercase tracking-wider">현재 Unix (ms)</span>
                        <span className="text-xs font-mono text-cyan-400">{nowTs}</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5 flex-1 overflow-hidden min-h-0">
                    {/* 입력 영역 */}
                    <div className="lg:w-72 shrink-0 space-y-4">
                        {/* 타임스탬프 → 날짜 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">① 타임스탬프 → 날짜</h3>
                            <input
                                type="text"
                                value={tsInput}
                                onChange={e => setTsInput(e.target.value)}
                                placeholder="예: 1700000000 또는 1700000000000"
                                className="w-full px-3 py-2 text-xs rounded-lg outline-none font-mono"
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={convertTs} className="flex-1 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>변환</button>
                                <button onClick={() => { setTsInput(String(Math.floor(Date.now() / 1000))); }} className="px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>지금</button>
                            </div>
                        </div>

                        {/* 날짜 → 타임스탬프 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">② 날짜 → 타임스탬프</h3>
                            <input
                                type="datetime-local"
                                value={dateInput}
                                onChange={e => setDateInput(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg outline-none"
                            />
                            <button onClick={convertDate} className="w-full mt-2 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>변환</button>
                        </div>

                        {/* 빠른 참조 */}
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">빠른 참조</h3>
                            <div className="space-y-1">
                                {[
                                    { label: '1분', val: 60 },
                                    { label: '1시간', val: 3600 },
                                    { label: '1일', val: 86400 },
                                    { label: '1주', val: 604800 },
                                    { label: '1달(30일)', val: 2592000 },
                                    { label: '1년(365일)', val: 31536000 },
                                ].map(r => (
                                    <div key={r.label} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">{r.label}</span>
                                        <span className="font-mono text-slate-300">{r.val}s</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 결과 영역 */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="text-4xl mb-4">⏱️</div>
                                <p className="text-slate-400 font-semibold">타임스탬프 또는 날짜를 입력하고</p>
                                <p className="text-slate-600 text-sm mt-1">변환 버튼을 눌러주세요</p>
                            </div>
                        ) : result.error ? (
                            <div className="h-32 flex items-center justify-center rounded-xl" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
                                <p className="text-red-400 text-sm">⚠️ {result.error}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-3">변환 결과</h3>
                                <Row label="ISO 8601" value={result.iso} mono />
                                <Row label="UTC" value={result.utc} mono />
                                <Row label="한국 시간 (KST)" value={result.local} />
                                <Row label="Unix (초)" value={result.unix_s} mono />
                                <Row label="Unix (밀리초)" value={result.unix_ms} mono />
                                {result.year && <>
                                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">분해 정보</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { l: '연도', v: result.year },
                                            { l: '월', v: result.month },
                                            { l: '일', v: result.day },
                                            { l: '요일', v: result.weekday + '요일' },
                                            { l: '시', v: result.hour },
                                            { l: '분', v: result.minute },
                                            { l: '초', v: result.second },
                                        ].map(item => (
                                            <div key={item.l} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div className="text-xs text-slate-500 mb-1">{item.l}</div>
                                                <div className="text-lg font-bold text-slate-100">{item.v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimestampConverter;
