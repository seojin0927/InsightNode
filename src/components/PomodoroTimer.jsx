import React, { useState, useEffect, useRef } from 'react';

const MODES = [
    { id: 'work', label: '집중', default: 25, color: '#ef4444' },
    { id: 'short', label: '짧은 휴식', default: 5, color: '#22c55e' },
    { id: 'long', label: '긴 휴식', default: 15, color: '#06b6d4' },
];

export default function PomodoroTimer() {
    const [mode, setMode] = useState('work');
    const [durations, setDurations] = useState({ work: 25, short: 5, long: 15 });
    const [seconds, setSeconds] = useState(25 * 60);
    const [running, setRunning] = useState(false);
    const [session, setSession] = useState(0);
    const [logs, setLogs] = useState([]);
    const intervalRef = useRef(null);
    const curMode = MODES.find(m => m.id === mode);

    const totalSecs = durations[mode] * 60;
    const progress = ((totalSecs - seconds) / totalSecs) * 100;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSeconds(s => {
                    if (s <= 1) {
                        clearInterval(intervalRef.current);
                        setRunning(false);
                        setLogs(l => [...l, { mode, duration: durations[mode], time: new Date().toLocaleTimeString('ko-KR') }]);
                        if (mode === 'work') setSession(n => n + 1);
                        try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...').play(); } catch {}
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        } else clearInterval(intervalRef.current);
        return () => clearInterval(intervalRef.current);
    }, [running]);

    const switchMode = (m) => {
        clearInterval(intervalRef.current);
        setMode(m);
        setSeconds(durations[m] * 60);
        setRunning(false);
    };

    const reset = () => { clearInterval(intervalRef.current); setRunning(false); setSeconds(durations[mode] * 60); };
    const updateDuration = (m, val) => { setDurations(d => ({...d, [m]: val})); if (m === mode) { setSeconds(val * 60); setRunning(false); } };

    // SVG circle
    const R = 90, C = 2 * Math.PI * R;
    const dash = C - (progress / 100) * C;

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-lg mx-auto px-4 py-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-black text-white">뽀모도로 타이머</h1>
                    <p className="text-sm text-slate-500 mt-1">집중과 휴식을 반복하는 시간 관리 기법</p>
                </div>

                {/* 모드 선택 */}
                <div className="flex gap-2 mb-8">
                    {MODES.map(m => (
                        <button key={m.id} onClick={() => switchMode(m.id)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m.id ? 'text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            style={mode === m.id ? { background: m.color, boxShadow: `0 0 20px ${m.color}66` } : {}}>
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* 원형 타이머 */}
                <div className="flex justify-center mb-8 relative">
                    <svg width="220" height="220" className="-rotate-90">
                        <circle cx="110" cy="110" r={R} fill="none" stroke="#1e293b" strokeWidth="8" />
                        <circle cx="110" cy="110" r={R} fill="none" stroke={curMode.color} strokeWidth="8"
                            strokeDasharray={C} strokeDashoffset={dash} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-5xl font-black text-white tabular-nums">{mins}:{secs}</div>
                        <div className="text-sm font-bold mt-1" style={{ color: curMode.color }}>{curMode.label}</div>
                        <div className="text-xs text-slate-500 mt-1">세션 #{session + 1}</div>
                    </div>
                </div>

                {/* 컨트롤 */}
                <div className="flex gap-3 mb-6">
                    <button onClick={() => setRunning(v => !v)}
                        className="flex-1 py-3.5 rounded-2xl text-white font-black text-lg transition-all hover:scale-105 shadow-lg"
                        style={{ background: curMode.color, boxShadow: `0 4px 20px ${curMode.color}66` }}>
                        {running ? '⏸ 일시정지' : '▶ 시작'}
                    </button>
                    <button onClick={reset} className="px-6 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all">↺ 리셋</button>
                </div>

                {/* 세션 카운터 */}
                <div className="flex gap-1.5 justify-center mb-6">
                    {Array.from({length: Math.max(4, session + 1)}, (_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < session ? 'bg-red-500 scale-110' : 'bg-slate-700'}`} />
                    ))}
                    {session >= 4 && session % 4 === 0 && <span className="text-xs text-amber-400 font-bold ml-2">🎉 긴 휴식 시간!</span>}
                </div>

                {/* 타이머 설정 */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">시간 설정 (분)</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {MODES.map(m => (
                            <div key={m.id}>
                                <label className="text-[10px] font-bold block mb-1" style={{ color: m.color }}>{m.label}</label>
                                <input type="number" min="1" max="90" value={durations[m.id]} onChange={e => updateDuration(m.id, Number(e.target.value))}
                                    className="w-full bg-slate-800 text-white font-mono text-sm px-3 py-2 rounded-lg border border-slate-700 outline-none text-center"
                                    style={{ borderColor: mode === m.id ? m.color : undefined }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 세션 로그 */}
                {logs.length > 0 && (
                    <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">완료 기록</h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {[...logs].reverse().map((log, i) => {
                                const m = MODES.find(x => x.id === log.mode);
                                return (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="w-2 h-2 rounded-full" style={{ background: m?.color }}></span>
                                        <span className="font-medium">{m?.label}</span>
                                        <span className="text-slate-600">{log.duration}분</span>
                                        <span className="ml-auto text-slate-600">{log.time}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
