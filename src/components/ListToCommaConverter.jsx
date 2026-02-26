import React, { useState, useCallback } from 'react';
import Icons from '../utils/Icons';

const ListToCommaConverter = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [mode, setMode] = useState('listToComma'); // listToComma | commaToList
    const [separator, setSeparator] = useState(',');
    const [addQuotes, setAddQuotes] = useState(false);
    const [quoteType, setQuoteType] = useState("'"); // ' or "

    // 변환
    const handleConvert = useCallback(() => {
        if (!inputText) return;
        
        try {
            if (mode === 'listToComma') {
                // 줄바꿈 → 쉼표
                const lines = inputText.split('\n').map(line => line.trim()).filter(line => line);
                
                let result;
                if (addQuotes) {
                    result = lines.map(item => `${quoteType}${item}${quoteType}`).join(separator);
                } else {
                    result = lines.join(separator);
                }
                
                setOutputText(result);
            } else {
                // 쉼표 → 줄바꿈
                const items = inputText.split(separator).map(item => {
                    // 따옴표 제거
                    let cleaned = item.trim();
                    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
                        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                        cleaned = cleaned.slice(1, -1);
                    }
                    return cleaned;
                }).filter(item => item);
                
                setOutputText(items.join('\n'));
            }
        } catch (err) {
            console.error('변환 오류:', err);
        }
    }, [inputText, mode, separator, addQuotes, quoteType]);

    // 클립보드 복사
    const handleCopy = useCallback(() => {
        if (!outputText) return;
        
        navigator.clipboard.writeText(outputText).then(() => {
            alert('복사되었습니다!');
        });
    }, [outputText]);

    // 다운로드
    const handleDownload = useCallback(() => {
        if (!outputText) return;
        
        const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        if (mode === 'listToComma') {
            link.download = 'comma_text.txt';
        } else {
            link.download = 'list_text.txt';
        }
        
        link.click();
    }, [outputText, mode]);

    // 예시 데이터
    const sampleListToComma = `사과
오렌지
포도
바나나
딸기`;

    const sampleCommaToList = "사과,오렌지,포도,바나나,딸기";

    return (
        <>
            {/* SEO Heading (화면에 표시되지 않음) */}
            <h1 className="sr-only">줄바꿈 변환기 - 쉼표/줄바꿈 상호 변환 도구</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                            🔗 줄바꿈/구분자 변환기
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            세로로 나열된 텍스트를 쉼표로 연결하거나, 쉼표로 연결된 텍스트를 세로로 변환합니다
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden" style={{ minHeight: 'calc(100% - 80px)' }}>
                    {/* 좌측: 입력 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">원본 텍스트</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4">
                            {/* 변환 모드 선택 */}
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setMode('listToComma'); setInputText(sampleListToComma); }}
                                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                                            mode === 'listToComma'
                                                ? 'bg-brand-600 text-white'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        📝 줄바꿈 → 쉼표
                                    </button>
                                    <button
                                        onClick={() => { setMode('commaToList'); setInputText(sampleCommaToList); }}
                                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                                            mode === 'commaToList'
                                                ? 'bg-brand-600 text-white'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        🔄 쉼표 → 줄바꿈
                                    </button>
                                </div>
                            </div>
                            
                            {/* 옵션 */}
                            {mode === 'listToComma' && (
                                <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-slate-400">구분자:</label>
                                            <select
                                                value={separator}
                                                onChange={(e) => setSeparator(e.target.value)}
                                                className="bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600/30"
                                            >
                                                <option value=",">쉼표 (,)</option>
                                                <option value=";">세미콜론 (;)</option>
                                                <option value="|">파이프 (|)</option>
                                                <option value=" ">공백</option>
                                                <option value="tab">탭</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="addQuotes"
                                                checked={addQuotes}
                                                onChange={(e) => setAddQuotes(e.target.checked)}
                                                className="w-4 h-4 accent-brand-500"
                                            />
                                            <label htmlFor="addQuotes" className="text-sm text-slate-300">따옴표 추가</label>
                                        </div>
                                        
                                        {addQuotes && (
                                            <select
                                                value={quoteType}
                                                onChange={(e) => setQuoteType(e.target.value)}
                                                className="bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600/30"
                                            >
                                                <option value="'">작은따옴표 (')</option>
                                                <option value='"'>큰따옴표 (")</option>
                                            </select>
                                        )}
                                    </div>
                                    
                                    {/* 미리보기 */}
                                    <div className="text-xs text-slate-500">
                                        예: {addQuotes 
                                            ? `'사과'${separator}'오렌지'${separator}'포도'`
                                            : `사과${separator}오렌지${separator}포도`}
                                    </div>
                                </div>
                            )}
                            
                            <textarea
                                className="w-full h-[200px] bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700 mb-3"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={mode === 'listToComma' 
                                    ? '사과\n오렌지\n포도\n바나나\n딸기' 
                                    : '사과,오렌지,포도,바나나,딸기'}
                                spellCheck="false"
                            />
                            
                            <button
                                onClick={handleConvert}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                            >
                                <Icons.Play /> 변환
                            </button>
                        </div>
                    </div>

                    {/* 우측: 출력 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">변환 결과</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4">
                            {outputText ? (
                                <div className="h-full flex flex-col">
                                    <textarea
                                        className="flex-1 w-full bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700"
                                        value={outputText}
                                        readOnly
                                        spellCheck="false"
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500">변환 결과가 여기에 표시됩니다</p>
                                </div>
                            )}
                        </div>
                        
                        {outputText && (
                            <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 flex gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50"
                                >
                                    <Icons.Copy /> 복사
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    <Icons.Download /> 다운로드
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ListToCommaConverter;
