import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import StudioLayout, { S, CopyBtn } from './StudioLayout';

const ACCENT = '#06b6d4';

// ══════════════════════════════════════════════════════════════════
// TAB 1: 세계 시계
const CITIES = [
    {name:'서울',tz:'Asia/Seoul',flag:'🇰🇷'},{name:'도쿄',tz:'Asia/Tokyo',flag:'🇯🇵'},
    {name:'상하이',tz:'Asia/Shanghai',flag:'🇨🇳'},{name:'싱가포르',tz:'Asia/Singapore',flag:'🇸🇬'},
    {name:'두바이',tz:'Asia/Dubai',flag:'🇦🇪'},{name:'런던',tz:'Europe/London',flag:'🇬🇧'},
    {name:'파리',tz:'Europe/Paris',flag:'🇫🇷'},{name:'베를린',tz:'Europe/Berlin',flag:'🇩🇪'},
    {name:'뉴욕',tz:'America/New_York',flag:'🇺🇸'},{name:'로스앤젤레스',tz:'America/Los_Angeles',flag:'🇺🇸'},
    {name:'시카고',tz:'America/Chicago',flag:'🇺🇸'},{name:'시드니',tz:'Australia/Sydney',flag:'🇦🇺'},
    {name:'토론토',tz:'America/Toronto',flag:'🇨🇦'},{name:'상파울루',tz:'America/Sao_Paulo',flag:'🇧🇷'},
    {name:'모스크바',tz:'Europe/Moscow',flag:'🇷🇺'},{name:'이스탄불',tz:'Europe/Istanbul',flag:'🇹🇷'},
    {name:'뭄바이',tz:'Asia/Kolkata',flag:'🇮🇳'},{name:'홍콩',tz:'Asia/Hong_Kong',flag:'🇭🇰'},
];

function WorldClockTab() {
    const [now, setNow] = useState(new Date());
    const [selected, setSelected] = useState(['서울','뉴욕','런던','도쿄']);
    const [search, setSearch] = useState('');
    useEffect(() => { const id = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id); }, []);

    const getTime = (tz) => now.toLocaleTimeString('ko-KR',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
    const getDate = (tz) => now.toLocaleDateString('ko-KR',{timeZone:tz,month:'short',day:'numeric',weekday:'short'});
    const getOffset = (tz) => {
        const d = new Date(now.toLocaleString('en-US',{timeZone:tz}));
        const diff = Math.round((d-now)/60000 + now.getTimezoneOffset());
        return `UTC${diff>=0?'+':''}${(diff/60).toFixed(1).replace('.0','')}`;
    };
    const toggle = (name) => setSelected(s => s.includes(name) ? s.filter(n=>n!==name) : [...s,name]);
    const filtered = CITIES.filter(c => c.name.includes(search) || c.tz.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selected.map(name => {
                    const city = CITIES.find(c=>c.name===name);
                    if (!city) return null;
                    const h = parseInt(getTime(city.tz).split(':')[0]);
                    const isDay = h>=7 && h<19;
                    return (
                        <div key={name} className={`${S.card} p-4`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{city.flag}</span>
                                    <span className="text-sm font-bold text-slate-200">{city.name}</span>
                                    <span className="text-[10px] text-slate-500">{getOffset(city.tz)}</span>
                                </div>
                                <span className="text-lg">{isDay?'☀️':'🌙'}</span>
                            </div>
                            <div className="font-black text-3xl text-white font-mono">{getTime(city.tz)}</div>
                            <div className="text-xs text-slate-500 mt-1">{getDate(city.tz)}</div>
                        </div>
                    );
                })}
            </div>
            <div>
                <label className={S.label}>도시 선택 (클릭으로 추가/제거)</label>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="도시 검색..." className={`${S.input} mb-2`} />
                <div className="flex flex-wrap gap-1.5">
                    {filtered.map(c=>(
                        <button key={c.name} onClick={()=>toggle(c.name)} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${selected.includes(c.name)?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
                            {c.flag} {c.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// TAB 2: 타임스탬프 변환기
function TimestampTab() {
    const [ts, setTs] = useState(String(Math.floor(Date.now()/1000)));
    const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0,16));
    const [unit, setUnit] = useState('s');

    const fromTs = useMemo(() => {
        const n = Number(ts);
        if (isNaN(n)) return null;
        const ms = unit === 'ms' ? n : n * 1000;
        const d = new Date(ms);
        if (isNaN(d.getTime())) return null;
        return {
            iso: d.toISOString(),
            local: d.toLocaleString('ko-KR'),
            date: d.toLocaleDateString('ko-KR'),
            time: d.toLocaleTimeString('ko-KR'),
            utc: d.toUTCString(),
        };
    }, [ts, unit]);

    const fromDate = useMemo(() => {
        if (!dateInput) return null;
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return null;
        return { sec: Math.floor(d.getTime()/1000), ms: d.getTime() };
    }, [dateInput]);

    const now = () => setTs(String(Math.floor(Date.now()/(unit==='ms'?1:1000))));

    return (
        <div className="space-y-4">
            <div className={`${S.card} p-4 space-y-3`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">타임스탬프 → 날짜</h3>
                <div className="flex gap-2">
                    <input value={ts} onChange={e=>setTs(e.target.value)} placeholder="예: 1716239022" className={`${S.input} flex-1`} />
                    <div className="flex gap-1">
                        {['s','ms'].map(u=><button key={u} onClick={()=>setUnit(u)} className={S.btn(unit===u)}>{u}</button>)}
                    </div>
                    <button onClick={now} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all">지금</button>
                </div>
                {fromTs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(fromTs).map(([k,v])=>(
                            <div key={k} className="flex justify-between items-center px-3 py-2 bg-slate-800/60 rounded-xl">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">{k}</span>
                                <div className="flex items-center gap-2"><span className="text-xs text-slate-200 font-mono">{v}</span><CopyBtn text={v} /></div>
                            </div>
                        ))}
                    </div>
                ) : ts && <div className="text-sm text-red-400">유효하지 않은 타임스탬프</div>}
            </div>
            <div className={`${S.card} p-4 space-y-3`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">날짜 → 타임스탬프</h3>
                <input type="datetime-local" value={dateInput} onChange={e=>setDateInput(e.target.value)} className={S.input} />
                {fromDate && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between items-center px-3 py-2 bg-slate-800/60 rounded-xl">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Unix (초)</span>
                            <div className="flex items-center gap-2"><code className="text-sm text-emerald-400 font-mono">{fromDate.sec}</code><CopyBtn text={String(fromDate.sec)} /></div>
                        </div>
                        <div className="flex justify-between items-center px-3 py-2 bg-slate-800/60 rounded-xl">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Milliseconds</span>
                            <div className="flex items-center gap-2"><code className="text-sm text-cyan-400 font-mono">{fromDate.ms}</code><CopyBtn text={String(fromDate.ms)} /></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// TAB 3: 카운트다운 타이머
function CountdownTab() {
    const [targetDate, setTargetDate] = useState('');
    const [eventName, setEventName] = useState('');
    const [now, setNow] = useState(new Date());
    useEffect(() => { const id = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id); }, []);

    const diff = useMemo(() => {
        if (!targetDate) return null;
        const target = new Date(targetDate);
        if (isNaN(target.getTime())) return null;
        const ms = target - now;
        if (ms < 0) return { past: true, ms: -ms };
        const sec = Math.floor(ms/1000);
        return { days: Math.floor(sec/86400), hours: Math.floor((sec%86400)/3600), minutes: Math.floor((sec%3600)/60), seconds: sec%60, past: false, ms };
    }, [targetDate, now]);

    const presets = [
        { label: '1시간 후', fn: () => { const d = new Date(Date.now()+3600000); setTargetDate(d.toISOString().slice(0,16)); } },
        { label: '내일', fn: () => { const d = new Date(Date.now()+86400000); setTargetDate(d.toISOString().slice(0,16)); } },
        { label: '1주일 후', fn: () => { const d = new Date(Date.now()+7*86400000); setTargetDate(d.toISOString().slice(0,16)); } },
        { label: '새해', fn: () => { const d = new Date(new Date().getFullYear()+1,0,1); setTargetDate(d.toISOString().slice(0,16)); } },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={S.label}>이벤트 이름</label>
                    <input value={eventName} onChange={e=>setEventName(e.target.value)} placeholder="예: 발표일, 출시일..." className={S.input} />
                </div>
                <div>
                    <label className={S.label}>목표 날짜/시간</label>
                    <input type="datetime-local" value={targetDate} onChange={e=>setTargetDate(e.target.value)} className={S.input} />
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {presets.map(p=><button key={p.label} onClick={p.fn} className={S.btn(false)}>{p.label}</button>)}
            </div>
            {diff && (
                diff.past ? (
                    <div className={`${S.card} p-6 text-center`}>
                        <div className="text-4xl mb-2">⏰</div>
                        <div className="text-lg font-bold text-slate-300">{eventName||'해당 날짜'}가 {Math.floor(diff.ms/86400000)}일 전에 지났습니다</div>
                    </div>
                ) : (
                    <div className={`${S.card} p-6`}>
                        {eventName && <div className="text-center text-sm font-bold text-indigo-400 mb-4">{eventName}까지</div>}
                        <div className="grid grid-cols-4 gap-3">
                            {[['일',diff.days,'#6366f1'],['시',diff.hours,'#22c55e'],['분',diff.minutes,'#f59e0b'],['초',diff.seconds,'#ef4444']].map(([unit,val,color])=>(
                                <div key={unit} className="text-center">
                                    <div className="text-3xl sm:text-4xl font-black font-mono" style={{color}}>{String(val).padStart(2,'0')}</div>
                                    <div className="text-xs text-slate-500 mt-1 font-bold">{unit}</div>
                                </div>
                            ))}
                        </div>
                        <div className="text-center text-xs text-slate-600 mt-4">{new Date(targetDate).toLocaleString('ko-KR')}</div>
                    </div>
                )
            )}
            {!targetDate && <div className="text-center text-slate-600 py-6 text-sm">목표 날짜를 설정하면 카운트다운이 시작됩니다</div>}
        </div>
    );
}

// TAB 4: 뽀모도로 타이머
function PomodoroTab() {
    const [mode, setMode] = useState('work');
    const [running, setRunning] = useState(false);
    const [secs, setSecs] = useState(25*60);
    const [sessions, setSessions] = useState(0);
    const [log, setLog] = useState([]);
    const customTimes = { work: 25*60, short: 5*60, long: 15*60 };

    useEffect(() => { setSecs(customTimes[mode]); setRunning(false); }, [mode]);
    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => {
            setSecs(s => {
                if (s <= 1) {
                    setRunning(false);
                    if (mode==='work') setSessions(n=>n+1);
                    setLog(l=>[{time:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}),mode},  ...l.slice(0,9)]);
                    return customTimes[mode];
                }
                return s-1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [running, mode]);

    const reset = () => { setRunning(false); setSecs(customTimes[mode]); };
    const total = customTimes[mode];
    const pct = ((total-secs)/total)*100;
    const min = String(Math.floor(secs/60)).padStart(2,'0');
    const sec = String(secs%60).padStart(2,'0');
    const r = 80;
    const circ = 2*Math.PI*r;

    const modeColors = { work:'#6366f1', short:'#22c55e', long:'#06b6d4' };
    const modeLabels = { work:'집중', short:'짧은 휴식', long:'긴 휴식' };

    return (
        <div className="space-y-4">
            <div className="flex justify-center gap-2">
                {[['work','🍅 집중'],['short','🌿 짧은 휴식'],['long','🌊 긴 휴식']].map(([v,l])=>(
                    <button key={v} onClick={()=>setMode(v)} className={S.btn(mode===v)}>{l}</button>
                ))}
            </div>
            <div className={`${S.card} p-8 flex flex-col items-center`}>
                <div className="relative w-48 h-48 mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 196 196">
                        <circle cx="98" cy="98" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="98" cy="98" r={r} fill="none" stroke={modeColors[mode]} strokeWidth="8"
                            strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
                            strokeLinecap="round" style={{transition:'stroke-dashoffset 0.5s ease'}} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-4xl font-black font-mono text-white">{min}:{sec}</div>
                        <div className="text-xs text-slate-500 mt-1 font-bold">{modeLabels[mode]}</div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={()=>setRunning(r=>!r)} className="w-20 h-10 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105" style={{background:`linear-gradient(135deg, ${modeColors[mode]}, ${modeColors[mode]}88)`}}>
                        {running?'⏸ 정지':'▶ 시작'}
                    </button>
                    <button onClick={reset} className="w-16 h-10 rounded-2xl font-bold text-sm bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-all">리셋</button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <span className="text-sm font-bold text-indigo-400">{sessions}</span>
                    <span className="text-xs text-slate-500">세션 완료</span>
                    <div className="flex gap-1 ml-2">{Array.from({length:4}).map((_,i)=><div key={i} className={`w-2.5 h-2.5 rounded-full ${i<sessions%4?'bg-indigo-500':'bg-slate-800'}`}/>)}</div>
                </div>
            </div>
            {log.length > 0 && (
                <div className={`${S.card} p-4`}>
                    <label className={S.label}>완료 기록</label>
                    <div className="space-y-1">
                        {log.map((entry,i)=>(
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="text-slate-600 font-mono w-12">{entry.time}</span>
                                <span className="px-2 py-0.5 rounded-lg font-bold" style={{background:`${modeColors[entry.mode]}20`,color:modeColors[entry.mode]}}>
                                    {modeLabels[entry.mode]}
                                </span>
                                <span className="text-slate-600">완료</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// TAB 5: 날짜 계산기
function DateCalcTab() {
    const [dateA, setDateA] = useState(new Date().toISOString().slice(0,10));
    const [dateB, setDateB] = useState('');
    const [addDate, setAddDate] = useState(new Date().toISOString().slice(0,10));
    const [addValue, setAddValue] = useState(30);
    const [addUnit, setAddUnit] = useState('days');

    const diff = useMemo(() => {
        if (!dateA || !dateB) return null;
        const a = new Date(dateA), b = new Date(dateB);
        if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
        const ms = Math.abs(b-a);
        const days = Math.floor(ms/86400000);
        return { days, weeks: Math.floor(days/7), months: Math.floor(days/30.44), years: (days/365.25).toFixed(1) };
    }, [dateA, dateB]);

    const added = useMemo(() => {
        if (!addDate || !addValue) return null;
        const d = new Date(addDate);
        if (isNaN(d.getTime())) return null;
        const n = Number(addValue);
        switch(addUnit) {
            case 'days': d.setDate(d.getDate()+n); break;
            case 'weeks': d.setDate(d.getDate()+n*7); break;
            case 'months': d.setMonth(d.getMonth()+n); break;
            case 'years': d.setFullYear(d.getFullYear()+n); break;
        }
        return d.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
    }, [addDate, addValue, addUnit]);

    return (
        <div className="space-y-4">
            <div className={`${S.card} p-4 space-y-3`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">두 날짜 사이 계산</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className={S.label}>시작 날짜</label><input type="date" value={dateA} onChange={e=>setDateA(e.target.value)} className={S.input} /></div>
                    <div><label className={S.label}>종료 날짜</label><input type="date" value={dateB} onChange={e=>setDateB(e.target.value)} className={S.input} /></div>
                </div>
                {diff && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {[['일',diff.days,'#6366f1'],['주',diff.weeks,'#22c55e'],['개월',diff.months,'#f59e0b'],['년',diff.years,'#ef4444']].map(([u,v,c])=>(
                            <div key={u} className="text-center py-3 bg-slate-800/60 rounded-xl">
                                <div className="text-2xl font-black font-mono" style={{color:c}}>{v}</div>
                                <div className="text-[10px] text-slate-500 font-bold mt-1">{u}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className={`${S.card} p-4 space-y-3`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">날짜 더하기/빼기</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input type="date" value={addDate} onChange={e=>setAddDate(e.target.value)} className={`${S.input} flex-1`} />
                    <input type="number" value={addValue} onChange={e=>setAddValue(e.target.value)} className={`${S.input} w-24`} />
                    <div className="flex gap-1">
                        {[['days','일'],['weeks','주'],['months','월'],['years','년']].map(([v,l])=>(
                            <button key={v} onClick={()=>setAddUnit(v)} className={S.btn(addUnit===v)}>{l}</button>
                        ))}
                    </div>
                </div>
                {added && (
                    <div className={`${S.card} p-4 flex justify-between items-center`}>
                        <span className="text-sm text-slate-400">{addValue}일 후:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{added}</span>
                            <CopyBtn text={added} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'worldclock', label: '세계 시계', icon: '🌍', desc: '전 세계 주요 도시 실시간 시간 표시', component: WorldClockTab, chipLabel: '세계시계' },
    { id: 'timestamp', label: '타임스탬프', icon: '🕐', desc: 'Unix 타임스탬프 ↔ 날짜 상호 변환', component: TimestampTab, chipLabel: 'TS변환' },
    { id: 'countdown', label: '카운트다운', icon: '⏳', desc: 'D-Day · 목표 날짜까지 남은 시간', component: CountdownTab, chipLabel: 'D-Day' },
    { id: 'pomodoro', label: '뽀모도로', icon: '🍅', desc: '25분 집중 / 5분 휴식 생산성 타이머', component: PomodoroTab, chipLabel: '뽀모도로' },
    { id: 'datecalc', label: '날짜 계산', icon: '📅', desc: '두 날짜 차이 · 날짜 더하기/빼기', component: DateCalcTab, chipLabel: '날짜계산' },
];

export default function TimeStudio() {
    const [tab, setTab] = useState('worldclock');
    const Comp = TABS.find(t => t.id === tab)?.component;
    return (
        <StudioLayout
            color={ACCENT}
            icon="🌏"
            title="Time Studio"
            description="세계 시계, Unix 타임스탬프 변환, D-Day 카운트다운, 뽀모도로 타이머, 날짜 계산기"
            tabs={TABS}
            tab={tab}
            setTab={setTab}>
            {Comp && <Comp />}
        </StudioLayout>
    );
}
