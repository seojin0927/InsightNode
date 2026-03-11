import React, { useState } from 'react';

const MORSE = {
    'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---',
    'K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-',
    'U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
    '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.','(':'-.--.',')':`-.--.-`,
    '&':'.-...',':':'---...',';':'-.-.-.','=':'-...-','+':'.-.-.','_':'..--.-','"':'.-..-.','$':'...-..-','@':'.--.-.',
    ' ':' | ',
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k,v]) => [v, k]));

const MorseConverter = () => {
    const [textInput, setTextInput] = useState('');
    const [morseInput, setMorseInput] = useState('');
    const [playingSound, setPlayingSound] = useState(false);

    const toMorse = (text) => {
        return text.toUpperCase().split('').map(c => MORSE[c] || '?').join(' ');
    };

    const fromMorse = (morse) => {
        return morse.trim().split(' | ').map(word =>
            word.trim().split(' ').map(symbol => {
                if (symbol === '') return '';
                return REVERSE[symbol] || '?';
            }).join('')
        ).join(' ');
    };

    const handleTextChange = (v) => {
        setTextInput(v);
        setMorseInput(toMorse(v));
    };

    const handleMorseChange = (v) => {
        setMorseInput(v);
        setTextInput(fromMorse(v));
    };

    const playSound = async () => {
        if (playingSound || !morseInput) return;
        setPlayingSound(true);
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const dot = 80, dash = 240, gap = 80;
        let t = ctx.currentTime + 0.1;
        const symbols = morseInput.split('');
        for (const s of symbols) {
            if (s === '.') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.value = 600;
                osc.start(t); osc.stop(t + dot / 1000);
                t += (dot + gap) / 1000;
            } else if (s === '-') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.value = 600;
                osc.start(t); osc.stop(t + dash / 1000);
                t += (dash + gap) / 1000;
            } else if (s === ' ') {
                t += gap / 1000 * 2;
            }
        }
        setTimeout(() => setPlayingSound(false), (t - ctx.currentTime) * 1000 + 200);
    };

    const copy = (v) => navigator.clipboard.writeText(v).catch(() => {});

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,146,60,0.1))', border: '1px solid rgba(251,191,36,0.2)' }}>📡</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">모스 부호 변환기</h1>
                        <p className="text-xs text-slate-500">텍스트 ↔ 모스 부호 · 소리로 재생 가능</p>
                    </div>
                    <button onClick={playSound} disabled={!morseInput || playingSound}
                        className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 12px rgba(245,158,11,0.3)' }}>
                        {playingSound ? '🔊 재생 중...' : '🔊 소리 재생'}
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
                    {/* 텍스트 */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">텍스트</label>
                            <button onClick={() => copy(textInput)} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">📋 복사</button>
                        </div>
                        <textarea
                            value={textInput}
                            onChange={e => handleTextChange(e.target.value)}
                            placeholder="텍스트를 입력하면 모스 부호로 변환됩니다..."
                            className="flex-1 w-full p-3 text-sm rounded-xl outline-none resize-none font-mono custom-scrollbar"
                            rows={6}
                        />
                    </div>

                    {/* 변환 화살표 */}
                    <div className="flex lg:flex-col items-center justify-center gap-2 shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <svg className="w-4 h-4 text-slate-400 lg:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>
                    </div>

                    {/* 모스 부호 */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">모스 부호</label>
                            <button onClick={() => copy(morseInput)} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">📋 복사</button>
                        </div>
                        <textarea
                            value={morseInput}
                            onChange={e => handleMorseChange(e.target.value)}
                            placeholder="모스 부호를 입력해도 텍스트로 변환됩니다... (. - 공백 사용)"
                            className="flex-1 w-full p-3 text-sm rounded-xl outline-none resize-none font-mono custom-scrollbar tracking-widest"
                            rows={6}
                        />
                    </div>
                </div>

                {/* 참조표 */}
                <div className="mt-4 shrink-0">
                    <details className="group">
                        <summary className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors">📖 모스 부호 참조표 (클릭하여 펼치기)</summary>
                        <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-1.5">
                            {Object.entries(MORSE).filter(([k]) => k !== ' ').map(([k, v]) => (
                                <div key={k} className="text-center p-1.5 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                    onClick={() => handleTextChange(textInput + k)}>
                                    <div className="text-xs font-bold text-slate-300">{k}</div>
                                    <div className="text-[10px] font-mono text-amber-400 tracking-widest">{v}</div>
                                </div>
                            ))}
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default MorseConverter;
