import React, { useState, useMemo } from 'react';

// 기준: USD 대비 환율 (2024년 기준 근사치)
const RATES = {
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, KRW: 1330, CNY: 7.24,
    AUD: 1.53, CAD: 1.36, CHF: 0.89, HKD: 7.82, SGD: 1.34, INR: 83.1,
    MXN: 17.1, BRL: 4.97, ZAR: 18.6, THB: 35.1, MYR: 4.72, IDR: 15700,
    PHP: 56.5, VND: 24500, SAR: 3.75, AED: 3.67, TRY: 30.8, RUB: 91.2,
};

const CURRENCIES = [
    { code: 'KRW', name: '한국 원', flag: '🇰🇷', symbol: '₩' },
    { code: 'USD', name: '미국 달러', flag: '🇺🇸', symbol: '$' },
    { code: 'EUR', name: '유로', flag: '🇪🇺', symbol: '€' },
    { code: 'JPY', name: '일본 엔', flag: '🇯🇵', symbol: '¥' },
    { code: 'GBP', name: '영국 파운드', flag: '🇬🇧', symbol: '£' },
    { code: 'CNY', name: '중국 위안', flag: '🇨🇳', symbol: '¥' },
    { code: 'AUD', name: '호주 달러', flag: '🇦🇺', symbol: 'A$' },
    { code: 'CAD', name: '캐나다 달러', flag: '🇨🇦', symbol: 'C$' },
    { code: 'CHF', name: '스위스 프랑', flag: '🇨🇭', symbol: 'Fr' },
    { code: 'HKD', name: '홍콩 달러', flag: '🇭🇰', symbol: 'HK$' },
    { code: 'SGD', name: '싱가포르 달러', flag: '🇸🇬', symbol: 'S$' },
    { code: 'INR', name: '인도 루피', flag: '🇮🇳', symbol: '₹' },
    { code: 'THB', name: '태국 바트', flag: '🇹🇭', symbol: '฿' },
    { code: 'AED', name: '아랍에미리트 디르함', flag: '🇦🇪', symbol: 'د.إ' },
    { code: 'BRL', name: '브라질 헤알', flag: '🇧🇷', symbol: 'R$' },
    { code: 'MXN', name: '멕시코 페소', flag: '🇲🇽', symbol: '$' },
    { code: 'TRY', name: '터키 리라', flag: '🇹🇷', symbol: '₺' },
    { code: 'RUB', name: '러시아 루블', flag: '🇷🇺', symbol: '₽' },
    { code: 'SAR', name: '사우디 리얄', flag: '🇸🇦', symbol: '﷼' },
    { code: 'VND', name: '베트남 동', flag: '🇻🇳', symbol: '₫' },
];

function convert(amount, from, to) {
    const inUSD = amount / RATES[from];
    return inUSD * RATES[to];
}

function fmtNum(n, code) {
    if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
    if (n < 0.01) return n.toFixed(6);
    return n.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

export default function CurrencyConverter() {
    const [amount, setAmount] = useState('1');
    const [from, setFrom] = useState('USD');
    const [to, setTo] = useState('KRW');
    const [favorites] = useState(['KRW','USD','EUR','JPY','GBP','CNY']);

    const result = useMemo(() => {
        const n = parseFloat(amount);
        if (isNaN(n)) return null;
        return convert(n, from, to);
    }, [amount, from, to]);

    const fromCur = CURRENCIES.find(c => c.code === from);
    const toCur = CURRENCIES.find(c => c.code === to);

    const swap = () => { const tmp = from; setFrom(to); setTo(tmp); };

    const allResults = useMemo(() => {
        const n = parseFloat(amount);
        if (isNaN(n)) return [];
        return favorites.filter(c => c !== from).map(code => ({
            ...CURRENCIES.find(c => c.code === code),
            value: convert(n, from, code),
        }));
    }, [amount, from, favorites]);

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-white">환율 계산기</h1>
                        <p className="text-sm text-slate-500 mt-1">주요 통화 간 환율 변환 · 참고용 근사치</p>
                    </div>
                    <span className="text-[10px] text-amber-500/70 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">⚠️ 실시간 환율 아님</span>
                </div>

                {/* 메인 변환 */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">금액</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                                className="w-full bg-slate-800 text-white font-mono text-xl px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">변환 전</label>
                            <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 outline-none font-bold text-sm">
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} - {c.name}</option>)}
                            </select>
                        </div>
                        <button onClick={swap} className="p-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all mt-4 text-xl">⇄</button>
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">변환 후</label>
                            <select value={to} onChange={e => setTo(e.target.value)} className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 outline-none font-bold text-sm">
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} - {c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {result !== null && (
                        <div className="mt-4 p-4 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-center">
                            <div className="text-sm text-slate-400 mb-1">{fromCur?.flag} {amount} {from} =</div>
                            <div className="text-3xl font-black text-white">{toCur?.symbol} {fmtNum(result, to)}</div>
                            <div className="text-sm font-bold text-indigo-300 mt-1">{to}</div>
                            <div className="text-xs text-slate-600 mt-2">1 {from} = {fmtNum(RATES[to]/RATES[from], to)} {to}</div>
                        </div>
                    )}
                </div>

                {/* 즐겨찾기 통화 */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">주요 통화 한눈에</h3>
                    <div className="space-y-2">
                        {allResults.map(c => (
                            <div key={c.code} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                                <span className="text-lg">{c.flag}</span>
                                <span className="text-sm font-bold text-slate-300 w-12">{c.code}</span>
                                <span className="text-xs text-slate-500 flex-1">{c.name}</span>
                                <span className="text-sm font-bold text-white font-mono">{c.symbol} {fmtNum(c.value, c.code)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
