import React, { useState, useMemo } from 'react';

function fmt(n) { return n.toLocaleString('ko-KR') + '원'; }

export default function LoanCalculator() {
    const [principal, setPrincipal] = useState(30000000);
    const [rate, setRate] = useState(4.5);
    const [months, setMonths] = useState(60);
    const [method, setMethod] = useState('equal'); // equal=원리금균등, principal=원금균등, bullet=만기일시

    const result2 = useMemo(() => {
        const p = principal, r = rate / 100 / 12, n = months;
        if (!p || !r || !n) return null;
        if (method === 'equal') {
            const monthly = p * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
            const total = monthly * n;
            const totalInterest = total - p;
            let balance = p;
            const rows = [];
            for (let i=1; i<=Math.min(n,12); i++) {
                const interest = balance * r;
                const princ = monthly - interest;
                balance = Math.max(0, balance - princ);
                rows.push({ month:i, payment:monthly, principal:princ, interest, balance });
            }
            return { monthly, total, totalInterest, rows };
        }
        if (method === 'principal') {
            const monthlyPrinc = p / n;
            let balance = p, fullInt = 0, bal2 = p;
            for (let i=1; i<=n; i++) { fullInt += bal2*r; bal2 -= monthlyPrinc; }
            const rows = [];
            for (let i=1; i<=Math.min(n,12); i++) {
                const interest = balance * r;
                const payment = monthlyPrinc + interest;
                balance = Math.max(0, balance - monthlyPrinc);
                rows.push({ month:i, payment, principal:monthlyPrinc, interest, balance });
            }
            return { monthly: rows[0]?.payment, total: p+fullInt, totalInterest:fullInt, rows };
        }
        if (method === 'bullet') {
            const monthlyInterest = p * r;
            const totalInterest = monthlyInterest * n;
            return {
                monthly: monthlyInterest,
                total: p + totalInterest,
                totalInterest,
                rows: [{ month:'이자만', payment:monthlyInterest, principal:0, interest:monthlyInterest, balance:p }]
            };
        }
        return null;
    }, [principal, rate, months, method]);

    const res = result2;

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white">대출 계산기</h1>
                    <p className="text-sm text-slate-500 mt-1">원리금균등 · 원금균등 · 만기일시 상환 방식 계산</p>
                </div>

                {/* 상환 방식 */}
                <div className="flex gap-2 mb-6">
                    {[['equal','원리금균등'],['principal','원금균등'],['bullet','만기일시']].map(([v,l]) => (
                        <button key={v} onClick={() => setMethod(v)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${method===v?'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>{l}</button>
                    ))}
                </div>

                {/* 입력 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                        { label:'대출 금액 (원)', val:principal, setter:setPrincipal, type:'number', step:1000000, min:0, placeholder:'30,000,000' },
                        { label:'연이율 (%)', val:rate, setter:setRate, type:'number', step:0.1, min:0, max:30, placeholder:'4.5' },
                        { label:'대출 기간 (개월)', val:months, setter:setMonths, type:'number', step:12, min:1, max:600, placeholder:'60' },
                    ].map(({ label, val, setter, type, step, min, max, placeholder }) => (
                        <div key={label}>
                            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">{label}</label>
                            <input type={type} value={val} onChange={e => setter(Number(e.target.value))} step={step} min={min} max={max} placeholder={placeholder}
                                className="w-full bg-slate-900 text-white font-mono px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 text-sm" />
                        </div>
                    ))}
                </div>

                {/* 결과 */}
                {res && (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[
                                { label:'월 납입금', value:fmt(Math.round(res.monthly)), color:'#6366f1', sub: method==='principal'?'(첫달 기준)':'' },
                                { label:'총 상환액', value:fmt(Math.round(res.total)), color:'#22c55e', sub:'' },
                                { label:'총 이자', value:fmt(Math.round(res.totalInterest)), color:'#ef4444', sub:`원금의 ${((res.totalInterest/principal)*100).toFixed(1)}%` },
                            ].map(c => (
                                <div key={c.label} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-center">
                                    <div className="text-xl font-black mb-1" style={{ color: c.color }}>{c.value}</div>
                                    <div className="text-xs font-bold text-slate-300">{c.label}</div>
                                    {c.sub && <div className="text-[10px] text-slate-500 mt-0.5">{c.sub}</div>}
                                </div>
                            ))}
                        </div>

                        {/* 원금/이자 비율 */}
                        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 mb-4">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>원금 {((principal/res.total)*100).toFixed(0)}%</span>
                                <span>이자 {((res.totalInterest/res.total)*100).toFixed(0)}%</span>
                            </div>
                            <div className="h-3 rounded-full overflow-hidden bg-slate-700">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(principal/res.total)*100}%` }} />
                            </div>
                        </div>

                        {/* 상환 일정 */}
                        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-800">
                                <span className="text-xs font-bold text-slate-300">상환 일정 (첫 12개월)</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-500">
                                            {['회차','월납입금','원금','이자','잔금'].map(h => <th key={h} className="px-4 py-2 text-right first:text-left font-bold">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {res.rows.map((row, i) => (
                                            <tr key={i} className="border-b border-slate-800/50 hover:bg-white/3 transition-colors">
                                                <td className="px-4 py-2 text-slate-400">{row.month}회</td>
                                                <td className="px-4 py-2 text-right text-slate-200 font-mono">{(row.payment/10000).toFixed(0)}만</td>
                                                <td className="px-4 py-2 text-right text-indigo-400 font-mono">{(row.principal/10000).toFixed(0)}만</td>
                                                <td className="px-4 py-2 text-right text-red-400 font-mono">{(row.interest/10000).toFixed(0)}만</td>
                                                <td className="px-4 py-2 text-right text-slate-400 font-mono">{(row.balance/10000).toFixed(0)}만</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
