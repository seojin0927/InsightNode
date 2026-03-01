import React, { useState, useEffect, useCallback } from 'react';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const PrivacyStudio = () => {
    // === 상태 관리 ===
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [maskChar, setMaskChar] = useState('*');
    const [maskMode, setMaskMode] = useState('partial'); // partial, full, text
    const [stats, setStats] = useState({ total: 0, details: {} });
    
    // 마스킹 옵션 (활성화 여부)
    const [options, setOptions] = useState({
        name: true,
        phone: true,
        email: true,
        resident: true,
        card: true,
        ip: true,
        address: true
    });

    // 샘플 데이터 (연속된 이름과 여러 줄 주소 테스트용)
    const sampleData = `[개인정보 샘플 데이터]
이름: 홍길동, 김철수, 이영희
전화: 010-1234-5678, 02-987-6543
이메일: user@example.com, admin@company.co.kr
주민번호: 900101-1234567
카드: 1234-5678-9012-3456
주소: 서울특별시 강남구 테헤란로 123
주소: 경기도 성남시 분당구 판교역로 100
IP: 192.168.0.1`;

    // === 마스킹 로직 엔진 ===
    const processText = useCallback(() => {
        let text = input;
        // 통계용 카운터
        let count = { name: 0, phone: 0, email: 0, resident: 0, card: 0, ip: 0, address: 0 };

        // 1. 주민등록번호 (Resident ID)
        if (options.resident) {
            const regex = /(\d{6})[- ]?([1-4]\d{6})/g;
            text = text.replace(regex, (match, front, back) => {
                count.resident++;
                if (maskMode === 'full') return maskChar.repeat(14);
                if (maskMode === 'text') return '[주민번호 삭제]';
                return `${front}-${maskChar.repeat(7)}`;
            });
        }

        // 2. 전화번호 (Phone)
        if (options.phone) {
            const regex = /(01[016789]|02|0[3-9][0-9])[- .]?(\d{3,4})[- .]?(\d{4})/g;
            text = text.replace(regex, (match, p1, p2, p3) => {
                count.phone++;
                if (maskMode === 'full') return maskChar.repeat(match.length);
                if (maskMode === 'text') return '[전화번호 삭제]';
                return `${p1}-${maskChar.repeat(p2.length)}-${p3}`;
            });
        }

        // 3. 이메일 (Email)
        if (options.email) {
            const regex = /([a-zA-Z0-9._-]+)(@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
            text = text.replace(regex, (match, id, domain) => {
                count.email++;
                if (maskMode === 'full') return maskChar.repeat(match.length);
                if (maskMode === 'text') return '[이메일 삭제]';
                const half = Math.ceil(id.length / 2);
                return id.substring(0, half) + maskChar.repeat(id.length - half) + domain;
            });
        }

        // 4. 신용카드 (Card)
        if (options.card) {
            const regex = /(\d{4})[- ]?(\d{4})[- ]?(\d{4})[- ]?(\d{4})/g;
            text = text.replace(regex, (match, a, b, c, d) => {
                count.card++;
                if (maskMode === 'full') return maskChar.repeat(match.length);
                if (maskMode === 'text') return '[카드번호 삭제]';
                return `${a}-${maskChar.repeat(4)}-${maskChar.repeat(4)}-${d}`;
            });
        }

        // 5. IP 주소
        if (options.ip) {
            const regex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
            text = text.replace(regex, (match) => {
                count.ip++;
                if (maskMode === 'full') return maskChar.repeat(match.length);
                const parts = match.split('.');
                return `${parts[0]}.${parts[1]}.${maskChar.repeat(3)}.${maskChar.repeat(3)}`;
            });
        }

        // 6. 주소 (Address) - [수정됨]
        // 핵심 수정: [^\n]* 를 사용하여 줄바꿈 문자를 만나면 매칭을 멈추게 함 (다음 줄 주소 침범 방지)
        if (options.address) {
            const regex = /((?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[가-힣]*)\s+([가-힣]+(?:시|군|구))\s+([^\n]*)/g;
            
            text = text.replace(regex, (match, city, district, detail) => {
                count.address++;
                if (maskMode === 'full') return maskChar.repeat(match.length);
                if (maskMode === 'text') return '[주소 삭제]';
                
                // 상세 주소 마스킹 (공백 포함 길이만큼)
                return `${city} ${district} ${maskChar.repeat(detail.length)}`;
            });
        }

        // 7. 한글 이름 (Name) - [수정됨]
        // 핵심 수정: '이름:' 라벨이 있는 줄을 먼저 찾고(lineMatch), 그 줄 안에서 이름 패턴을 반복해서 찾음(nameMatch)
        if (options.name) {
            // 이름: 뒤에 오는 줄 전체를 캡처
            text = text.replace(/(이름|성명|name)\s*:\s*([^\n]+)/gi, (lineMatch, label, content) => {
                
                // 해당 줄 안에서 한글 이름(2~4자)을 모두 찾아서 마스킹
                const maskedContent = content.replace(/([가-힣]{2,4})/g, (name) => {
                    // 일반 명사(예: 주소, 전화)가 섞여있지 않다는 가정 하에 처리
                    // (조사 등은 정규식 특성상 분리됨)
                    count.name++;
                    
                    if (maskMode === 'full') return maskChar.repeat(name.length);
                    if (maskMode === 'text') return '[이름]';
                    
                    // 부분 마스킹: 김철수 -> 김*수, 홍길동 -> 홍*동
                    if (name.length === 2) return name[0] + maskChar;
                    return name[0] + maskChar.repeat(name.length - 2) + name[name.length - 1];
                });

                return `${label}: ${maskedContent}`;
            });
        }

        setOutput(text);
        
        // 통계 업데이트
        const total = Object.values(count).reduce((a, b) => a + b, 0);
        setStats({ total, details: count });

    }, [input, options, maskMode, maskChar]);

    // 입력 변경 시 자동 처리 (Debounce)
    useEffect(() => {
        const timer = setTimeout(() => processText(), 300);
        return () => clearTimeout(timer);
    }, [input, processText]);

    // 파일 업로드
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setInput(e.target.result);
        reader.readAsText(file);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        alert('마스킹된 데이터가 복사되었습니다.');
    };

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'masked_data.txt';
        a.click();
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 1. 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Icon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Privacy Master Studio</h2>
                        <p className="text-slate-400 text-sm">개인정보 자동 감지 및 지능형 마스킹 솔루션</p>
                    </div>
                </div>
                
                {/* 상단 액션 버튼 */}
                <div className="flex gap-2">
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600 flex items-center gap-2">
                        <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        파일 열기
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button 
                        onClick={() => setInput(sampleData)}
                        className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
                    >
                        샘플 데이터
                    </button>
                </div>
            </div>

            {/* 2. 메인 컨텐츠 (Grid - Full Height) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 설정 패널 (Col 3) */}
                <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Detection Settings</h3>
                        
                        {/* 마스킹 대상 선택 */}
                        <div className="space-y-2 mb-6">
                            {[
                                { id: 'resident', label: '주민등록번호', desc: '900101-1******' },
                                { id: 'phone', label: '전화번호', desc: '010-****-1234' },
                                { id: 'email', label: '이메일', desc: 'user@****.com' },
                                { id: 'card', label: '신용카드', desc: '****-****-1234' },
                                { id: 'name', label: '이름 (Name)', desc: '김*수, 홍*동' },
                                { id: 'address', label: '주소 (Address)', desc: '서울 강남구 ****' },
                                { id: 'ip', label: 'IP 주소', desc: '192.168.*.*' },
                            ].map(opt => (
                                <label key={opt.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={options[opt.id]} 
                                        onChange={(e) => setOptions({...options, [opt.id]: e.target.checked})}
                                        className="mt-1 accent-emerald-500 w-4 h-4"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-slate-200">{opt.label}</div>
                                        <div className="text-xs text-slate-500">{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Masking Style</h3>
                        
                        {/* 스타일 설정 */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">마스킹 문자</label>
                                <div className="flex gap-2">
                                    {['*', '#', 'X', '-'].map(char => (
                                        <button
                                            key={char}
                                            onClick={() => setMaskChar(char)}
                                            className={`flex-1 py-2 rounded font-mono font-bold transition-colors ${maskChar === char ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                                        >
                                            {char}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">마스킹 모드</label>
                                <select 
                                    value={maskMode} 
                                    onChange={(e) => setMaskMode(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none"
                                >
                                    <option value="partial">부분 마스킹 (김*수)</option>
                                    <option value="full">전체 마스킹 (***)</option>
                                    <option value="text">텍스트 대체 ([삭제됨])</option>
                                </select>
                            </div>
                        </div>

                        {/* 보안 뱃지 */}
                        <div className="mt-auto pt-6">
                            <div className="bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-3">
                                <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                <div>
                                    <div className="text-xs font-bold text-emerald-400">100% 안전함</div>
                                    <div className="text-[10px] text-emerald-300/70">데이터가 서버로 전송되지 않습니다.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 중앙 & 우측: 작업 공간 (Col 9) */}
                <div className="lg:col-span-9 flex flex-col h-full min-h-0">
                    
                    {/* 상단: 입력/출력 (Grid) */}
                    <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 mb-4">
                        {/* 입력창 */}
                        <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="bg-slate-900/50 p-3 border-b border-slate-700 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Input Data</span>
                                <button onClick={() => setInput('')} className="text-xs text-red-400 hover:underline">Clear</button>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="여기에 텍스트를 입력하거나 파일을 드롭하세요..."
                                className="flex-1 bg-transparent p-4 text-sm font-mono text-slate-300 resize-none outline-none custom-scrollbar"
                                spellCheck="false"
                            />
                        </div>

                        {/* 출력창 */}
                        <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="bg-slate-900/50 p-3 border-b border-slate-700 flex justify-between items-center">
                                <span className="text-xs font-bold text-emerald-500 uppercase">Masked Output</span>
                                <div className="flex gap-2">
                                    <button onClick={handleCopy} className="text-xs bg-slate-700 px-2 py-1 rounded hover:text-white transition-colors">Copy</button>
                                    <button onClick={handleDownload} className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-500 transition-colors">Download</button>
                                </div>
                            </div>
                            <textarea
                                readOnly
                                value={output}
                                className="flex-1 bg-slate-950 p-4 text-sm font-mono text-emerald-100/90 resize-none outline-none custom-scrollbar"
                            />
                        </div>
                    </div>

                    {/* 하단: 분석 리포트 */}
                    <div className="h-32 bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase">Privacy Detection Report</h3>
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">총 {stats.total}개 항목 마스킹됨</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                            {Object.entries(stats.details).map(([key, count]) => (
                                <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${count > 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-700/30 border-transparent'}`}>
                                    <div className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                    <span className="text-xs font-medium text-slate-300 capitalize">{key}</span>
                                    <span className={`text-sm font-bold ${count > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PrivacyStudio;