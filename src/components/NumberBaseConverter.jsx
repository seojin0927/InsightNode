import React, { useState } from 'react';

const BASES = [
    { id: 'bin', label: '2진수 (BIN)', base: 2, color: '#60a5fa', prefix: '0b' },
    { id: 'oct', label: '8진수 (OCT)', base: 8, color: '#4ade80', prefix: '0o' },
    { id: 'dec', label: '10진수 (DEC)', base: 10, color: '#c084fc', prefix: '' },
    { id: 'hex', label: '16진수 (HEX)', base: 16, color: '#fb923c', prefix: '0x' },
];

const NumberBaseConverter = () => {
    const [inputs, setInputs] = useState({ bin: '', oct: '', dec: '', hex: '' });
    const [error, setError] = useState('');
    const [bitView, setBitView] = useState(8);

    const handleChange = (id, base, value) => {
        setError('');
        const cleaned = value.replace(/\s/g, '').toUpperCase();
        try {
            const decimal = parseInt(cleaned, base);
            if (cleaned === '') {
                setInputs({ bin: '', oct: '', dec: '', hex: '' });
                return;
            }
            if (isNaN(decimal)) { setError('유효하지 않은 값입니다.'); return; }
            setInputs({
                bin: decimal.toString(2),
                oct: decimal.toString(8),
                dec: decimal.toString(10),
                hex: decimal.toString(16).toUpperCase(),
            });
        } catch {
            setError('변환 중 오류가 발생했습니다.');
        }
    };

    const decimalValue = inputs.dec ? parseInt(inputs.dec, 10) : null;

    const BitGrid = () => {
        if (decimalValue === null) return null;
        const bits = decimalValue.toString(2).padStart(bitView, '0').split('');
        return (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">비트 시각화</h3>
                    <div className="flex gap-1">
                        {[8, 16, 32].map(b => (
                            <button key={b} onClick={() => setBitView(b)}
                                className="px-2 py-0.5 rounded text-[11px] font-bold transition-all"
                                style={bitView === b ? { background: 'rgba(99,102,241,0.3)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.4)' } : { color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {b}bit
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-1">
                    {bits.map((bit, i) => (
                        <div key={i} className="w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold transition-all"
                            style={{
                                background: bit === '1' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${bit === '1' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                color: bit === '1' ? '#818cf8' : '#334155',
                            }}>
                            {bit}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-mono">
                    <span>MSB</span><span>LSB</span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(192,132,252,0.2)' }}>🔢</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">진법 변환기</h1>
                        <p className="text-xs text-slate-500">2진수 · 8진수 · 10진수 · 16진수 상호 변환</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 px-4 py-2 rounded-xl text-xs text-red-400" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                        ⚠️ {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    {BASES.map(b => (
                        <div key={b.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)` }}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color }} />
                                <span className="text-xs font-bold tracking-wider" style={{ color: b.color }}>{b.label}</span>
                                {b.prefix && <span className="text-[10px] font-mono text-slate-600">{b.prefix}</span>}
                            </div>
                            <input
                                type="text"
                                value={inputs[b.id]}
                                onChange={e => handleChange(b.id, b.base, e.target.value)}
                                placeholder={`${b.label} 입력`}
                                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none font-mono transition-all"
                                style={{ focusBorderColor: b.color }}
                            />
                            {inputs[b.id] && (
                                <button onClick={() => navigator.clipboard.writeText(inputs[b.id]).catch(()=>{})}
                                    className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                                    📋 복사
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <BitGrid />

                {/* 색상 정보 카드 */}
                {inputs.hex && inputs.hex.length === 6 && (
                    <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">16진수 색상 미리보기</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl border border-white/10 shrink-0" style={{ background: `#${inputs.hex}` }} />
                            <div>
                                <p className="text-sm font-mono text-slate-200">#{inputs.hex}</p>
                                <p className="text-xs text-slate-500 mt-1">RGB: {parseInt(inputs.hex.slice(0,2),16)}, {parseInt(inputs.hex.slice(2,4),16)}, {parseInt(inputs.hex.slice(4,6),16)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NumberBaseConverter;
