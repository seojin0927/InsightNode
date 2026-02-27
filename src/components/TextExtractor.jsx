import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Icons from '../utils/Icons';

const TextExtractor = () => {
    const [inputText, setInputText] = useState('');
    const [extractedData, setExtractedData] = useState(null);
    const [extractionType, setExtractionType] = useState('email');
    const [customRegex, setCustomRegex] = useState('');
    const [error, setError] = useState('');

    // 샘플 텍스트
    const sampleText = ` contact info:
홍길동 (hong@example.com) / 010-1234-5678
김철수 (kim@company.co.kr) / 02-987-6543
이영희 (lee@business.kr) / 010-1111-2222
박지민 (park@startup.io) / 070-1234-5678

웹사이트: https://www.example.com, https://blog.test.kr
사업자번호: 123-45-67890, 234-56-78901
IP주소: 192.168.1.100, 10.0.0.1
날짜: 2024-01-15, 2024/02/20
주소: 서울특별시 강남구, 부산광역시 해운대구`;

    // 정규식 패턴
    const regexPatterns = {
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        phone: /0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/g,
        mobile: /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/g,
        businessNumber: /\d{3}[-\s]?\d{2}[-\s]?\d{5}/g,
        url: /https?:\/\/[^\s<>"{}|\\^`[\]]+/g,
        ip: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g,
        date: /\d{4}[-\/]\d{2}[-\/]\d{2}/g,
        korean: /[가-힣]+/g,
        english: /[a-zA-Z]+/g,
        number: /\d+(\.\d+)?/g,
    };

    // 텍스트 추출
    const handleExtract = useCallback(() => {
        if (!inputText) return;
        
        setError('');
        
        try {
            let pattern;
            
            if (extractionType === 'custom' && customRegex) {
                try {
                    pattern = new RegExp(customRegex, 'g');
                } catch (e) {
                    setError('유효하지 않은 정규식입니다.');
                    return;
                }
            } else if (regexPatterns[extractionType]) {
                pattern = regexPatterns[extractionType];
            } else {
                setError('알 수 없는 추출 타입입니다.');
                return;
            }
            
            const matches = inputText.match(pattern);
            
            if (!matches || matches.length === 0) {
                setError('추출된 데이터가 없습니다.');
                setExtractedData(null);
                return;
            }
            
            // 중복 제거 후 결과 생성
            const uniqueMatches = [...new Set(matches)];
            const data = uniqueMatches.map(item => ({ value: item }));
            setExtractedData(data);
            
        } catch (err) {
            setError('추출 오류: ' + err.message);
        }
    }, [inputText, extractionType, customRegex]);

    // CSV로 변환
    const handleConvertToCsv = useCallback(() => {
        if (!extractedData) return;
        
        const csv = Papa.unparse(extractedData);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `extracted_${extractionType}.csv`;
        link.click();
    }, [extractedData, extractionType]);

    // 클립보드 복사
    const handleCopy = useCallback(() => {
        if (!extractedData) return;
        
        const text = extractedData.map(d => d.value).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('추출된 텍스트가 클립보드에 복사되었습니다!');
        });
    }, [extractedData]);

    // 콤마로 연결된 텍스트로 복사
    const handleCopyAsCommaText = useCallback(() => {
        if (!extractedData) return;
        
        const text = extractedData.map(d => `'${d.value}'`).join(', ');
        navigator.clipboard.writeText(text).then(() => {
            alert('쉼표로 연결된 텍스트가 클립보드에 복사되었습니다!');
        });
    }, [extractedData]);

    return (
        <>
            {/* SEO Heading (화면에 표시되지 않음) */}
            <h1 className="sr-only">텍스트 정제 도구 - 이메일, 전화번호, URL 자동 추출</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            더티 텍스트 정제기
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            텍스트에서 이메일, 전화번호, 사업자번호 등 원하는 정보만 추출합니다
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden" style={{ minHeight: 'calc(100% - 80px)' }}>
                    {/* 좌측: 텍스트 입력 */}
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
                            <button 
                                onClick={() => setInputText(sampleText)}
                                className="ml-auto mr-4 px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-medium rounded-lg border border-brand-500/30 transition-all"
                            >
                                📋 샘플
                            </button>
                        </div>
                        
                        <div className="flex-1 p-4">
                            <textarea
                                className="w-full h-[200px] bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700 mb-3"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={`텍스트를 붙여넣으세요.
예: 
홍길동 (hong@example.com) / 010-1234-5678
김철수 (kim@company.co.kr) / 02-987-6543
이영희 (lee@business.kr) / 010-1111-2222`}
                                spellCheck="false"
                            />
                            
                            {/* 추출 옵션 */}
                            <div className="mb-3">
                                <label className="text-sm text-slate-400 mb-2 block">추출 타입:</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'email', label: '📧 이메일' },
                                        { id: 'phone', label: '📞 일반 전화' },
                                        { id: 'mobile', label: '📱 휴대전화' },
                                        { id: 'businessNumber', label: '🏢 사업자번호' },
                                        { id: 'url', label: '🔗 URL' },
                                        { id: 'date', label: '📅 날짜' },
                                        { id: 'korean', label: '🇰🇷 한글' },
                                        { id: 'number', label: '🔢 숫자' },
                                        { id: 'custom', label: '⚙️ 직접 입력' },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setExtractionType(opt.id)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                extractionType === opt.id 
                                                    ? 'bg-brand-600 text-white' 
                                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {extractionType === 'custom' && (
                                <div className="mb-3">
                                    <label className="text-sm text-slate-400 mb-2 block">정규식 패턴:</label>
                                    <input
                                        type="text"
                                        value={customRegex}
                                        onChange={(e) => setCustomRegex(e.target.value)}
                                        placeholder="예: \d{3}-\d{4}-\d{4}"
                                        className="w-full bg-slate-800 text-slate-200 px-4 py-2 rounded-lg border border-slate-600 font-mono text-sm"
                                    />
                                </div>
                            )}
                            
                            <button
                                onClick={handleExtract}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                            >
                                <Icons.Play /> 추출
                            </button>
                        </div>
                    </div>

                    {/* 우측: 추출 결과 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">추출 결과</span>
                            </div>
                            
                            {extractedData && (
                                <div className="ml-auto mr-4 my-auto text-sm text-slate-400">
                                    <span className="text-brand-400 font-bold">{extractedData.length}</span>개 추출됨
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-auto bg-[#0d1117] p-4">
                            {extractedData ? (
                                <div className="space-y-2">
                                    {extractedData.map((item, idx) => (
                                        <div 
                                            key={idx}
                                            className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                                        >
                                            <span className="w-8 h-8 flex items-center justify-center bg-brand-500/20 text-brand-400 rounded-lg font-bold text-sm">
                                                {idx + 1}
                                            </span>
                                            <span className="text-slate-200 font-mono text-sm">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500">추출된 결과가 여기에 표시됩니다</p>
                                </div>
                            )}
                        </div>
                        
                        {extractedData && (
                            <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopy}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50"
                                    >
                                        <Icons.Copy /> 줄바꿈으로 복사
                                    </button>
                                    <button
                                        onClick={handleCopyAsCommaText}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50"
                                    >
                                        <Icons.Copy /> 쉼표로 복사
                                    </button>
                                </div>
                                <button
                                    onClick={handleConvertToCsv}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    <Icons.Download /> CSV 다운로드
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default TextExtractor;
