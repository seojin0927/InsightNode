import React, { useState, useCallback } from 'react';

async function sha(algorithm, message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64Encode(str) { try { return btoa(unescape(encodeURIComponent(str))); } catch { return ''; } }
function base64Decode(str) { try { return decodeURIComponent(escape(atob(str))); } catch { return '오류: 올바른 Base64가 아닙니다'; } }
function md5(str) {
    // Simple CRC32 as lightweight hash substitute
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i);
        for (let j = 0; j < 8; j++) crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0') + (Math.abs(str.split('').reduce((a,c)=>a*31+c.charCodeAt(0)|0,0))).toString(16).padStart(8,'0');
}

export default function HashGenerator() {
    const [input, setInput] = useState('');
    const [hashes, setHashes] = useState({});
    const [copied, setCopied] = useState('');
    const [mode, setMode] = useState('hash'); // hash | base64

    const generate = useCallback(async () => {
        if (!input) return setHashes({});
        const [h1, h224, h256, h384, h512] = await Promise.all([
            sha('SHA-1', input), sha('SHA-224', input), sha('SHA-256', input),
            sha('SHA-384', input), sha('SHA-512', input)
        ]);
        setHashes({ 'CRC32(근사)': md5(input), 'SHA-1': h1, 'SHA-224': h224, 'SHA-256': h256, 'SHA-384': h384, 'SHA-512': h512 });
    }, [input]);

    const copy = (key, val) => { navigator.clipboard.writeText(val); setCopied(key); setTimeout(() => setCopied(''), 1500); };

    const b64 = base64Encode(input);
    const b64Dec = mode === 'base64' ? base64Decode(input) : '';

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white">Hash & Encode</h1>
                    <p className="text-sm text-slate-500 mt-1">SHA-1/256/512 해시 생성 · Base64 인코딩/디코딩</p>
                </div>

                {/* 모드 탭 */}
                <div className="flex gap-2 mb-4">
                    {[['hash','🔐 해시 생성'],['base64','📦 Base64']].map(([v,l]) => (
                        <button key={v} onClick={() => setMode(v)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode===v?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>{l}</button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase">{mode === 'hash' ? '입력 텍스트' : mode === 'base64' ? '인코딩할 텍스트' : '입력'}</label>
                            <button onClick={() => setInput('')} className="text-xs text-slate-600 hover:text-slate-400">지우기</button>
                        </div>
                        <textarea value={input} onChange={e => setInput(e.target.value)}
                            placeholder={mode === 'hash' ? '해시를 생성할 텍스트...' : 'Base64로 인코딩할 텍스트...'}
                            className="w-full h-28 bg-slate-900 text-slate-200 font-mono text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 resize-none" />
                    </div>

                    {mode === 'hash' && (
                        <>
                            <button onClick={generate} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors">
                                🔐 해시 생성
                            </button>
                            {Object.keys(hashes).length > 0 && (
                                <div className="space-y-2">
                                    {Object.entries(hashes).map(([algo, hash]) => (
                                        <div key={algo} className="flex items-center gap-3 bg-slate-900/80 rounded-xl px-4 py-3 border border-slate-800 group">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase w-20 shrink-0">{algo}</span>
                                            <code className="flex-1 text-xs font-mono text-slate-300 break-all">{hash}</code>
                                            <button onClick={() => copy(algo, hash)} className={`text-xs px-2 py-1 rounded font-bold shrink-0 transition-all ${copied===algo?'bg-emerald-600 text-white':'bg-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white'}`}>{copied===algo?'✓':'복사'}</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {mode === 'base64' && input && (
                        <div className="space-y-3">
                            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-emerald-400">Base64 인코딩 결과</span>
                                    <button onClick={() => copy('enc', b64)} className={`text-xs px-2 py-1 rounded font-bold transition-all ${copied==='enc'?'bg-emerald-600 text-white':'bg-slate-700 text-slate-400 hover:text-white'}`}>{copied==='enc'?'복사됨':'복사'}</button>
                                </div>
                                <code className="text-xs font-mono text-emerald-300 break-all">{b64}</code>
                            </div>
                            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-blue-400">Base64 디코딩 결과 (입력이 Base64인 경우)</span>
                                    <button onClick={() => copy('dec', b64Dec)} className={`text-xs px-2 py-1 rounded font-bold transition-all ${copied==='dec'?'bg-emerald-600 text-white':'bg-slate-700 text-slate-400 hover:text-white'}`}>{copied==='dec'?'복사됨':'복사'}</button>
                                </div>
                                <code className="text-xs font-mono text-blue-300 break-all">{b64Dec || '(입력을 Base64로 디코딩합니다)'}</code>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
