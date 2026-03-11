import React, { useState, useEffect } from 'react';

const CITIES = [
    { name: '서울', tz: 'Asia/Seoul', flag: '🇰🇷' },
    { name: '도쿄', tz: 'Asia/Tokyo', flag: '🇯🇵' },
    { name: '베이징', tz: 'Asia/Shanghai', flag: '🇨🇳' },
    { name: '싱가포르', tz: 'Asia/Singapore', flag: '🇸🇬' },
    { name: '두바이', tz: 'Asia/Dubai', flag: '🇦🇪' },
    { name: '프랑크푸르트', tz: 'Europe/Berlin', flag: '🇩🇪' },
    { name: '런던', tz: 'Europe/London', flag: '🇬🇧' },
    { name: '파리', tz: 'Europe/Paris', flag: '🇫🇷' },
    { name: '뉴욕', tz: 'America/New_York', flag: '🇺🇸' },
    { name: '시카고', tz: 'America/Chicago', flag: '🇺🇸' },
    { name: '로스앤젤레스', tz: 'America/Los_Angeles', flag: '🇺🇸' },
    { name: '상파울루', tz: 'America/Sao_Paulo', flag: '🇧🇷' },
    { name: '시드니', tz: 'Australia/Sydney', flag: '🇦🇺' },
    { name: '오클랜드', tz: 'Pacific/Auckland', flag: '🇳🇿' },
    { name: '모스크바', tz: 'Europe/Moscow', flag: '🇷🇺' },
    { name: '뭄바이', tz: 'Asia/Kolkata', flag: '🇮🇳' },
];

function getTimeInTZ(tz) {
    return new Date().toLocaleString('ko-KR', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function getDateInTZ(tz) {
    return new Date().toLocaleString('ko-KR', { timeZone: tz, month: 'long', day: 'numeric', weekday: 'short' });
}
function getOffsetInTZ(tz) {
    const d = new Date();
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    const tzDate = new Date(d.toLocaleString('en-US', { timeZone: tz }));
    const localDate = new Date(d.toLocaleString('en-US'));
    const diff = (tzDate - localDate) / 3600000;
    const hrs = Math.floor(Math.abs(diff)), mins = Math.round((Math.abs(diff) - hrs) * 60);
    return `UTC${diff >= 0 ? '+' : '-'}${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
}
function isBusinessHours(tz) {
    const h = Number(new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }));
    return h >= 9 && h < 18;
}
function isDaytime(tz) {
    const h = Number(new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }));
    return h >= 6 && h < 20;
}

export default function WorldClock() {
    const [now, setNow] = useState(new Date());
    const [selected, setSelected] = useState(['서울','도쿄','런던','뉴욕','시드니']);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const filtered = CITIES.filter(c => c.name.includes(search) || c.tz.toLowerCase().includes(search.toLowerCase()));
    const displayed = CITIES.filter(c => selected.includes(c.name));

    const toggleCity = (name) => {
        setSelected(s => s.includes(name) ? s.filter(n => n !== name) : [...s, name]);
    };

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white">세계 시간대 시계</h1>
                    <p className="text-sm text-slate-500 mt-1">전 세계 주요 도시의 현재 시간을 실시간으로 확인합니다</p>
                </div>

                {/* 도시 시계 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                    {displayed.map(city => {
                        const time = getTimeInTZ(city.tz);
                        const date = getDateInTZ(city.tz);
                        const offset = getOffsetInTZ(city.tz);
                        const biz = isBusinessHours(city.tz);
                        const day = isDaytime(city.tz);
                        return (
                            <div key={city.name} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 hover:border-indigo-500/30 transition-all relative group">
                                <button onClick={() => toggleCity(city.name)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-xs">✕</button>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{city.flag}</span>
                                    <span className="font-bold text-slate-200">{city.name}</span>
                                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${biz ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                                        {biz ? '근무중' : '오프'}
                                    </span>
                                </div>
                                <div className="text-3xl font-black tabular-nums" style={{ color: day ? '#e2e8f0' : '#64748b' }}>
                                    {time}
                                </div>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs text-slate-500">{date}</span>
                                    <span className="text-[10px] text-indigo-400 font-mono">{offset}</span>
                                </div>
                                <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${(Number(time.split(':')[0])/24)*100}%`, background: day ? '#6366f1' : '#1e293b' }} />
                                </div>
                            </div>
                        );
                    })}
                    {displayed.length < 12 && (
                        <button onClick={() => {}} className="rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 text-slate-600 hover:text-indigo-400 transition-all p-4 flex items-center justify-center gap-2 text-sm font-bold">
                            + 도시 추가
                        </button>
                    )}
                </div>

                {/* 도시 선택 */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-300">도시 선택</h3>
                        <input type="text" placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none w-32" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filtered.map(c => (
                            <button key={c.name} onClick={() => toggleCity(c.name)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selected.includes(c.name) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
                                {c.flag} {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
