import React, { useState, useCallback } from 'react';
// import Icons from '../utils/Icons';

const QrCodeGenerator = () => {
    const [inputText, setInputText] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [error, setError] = useState('');

    const sampleTexts = [
        { label: 'URL', text: 'https://vaultsheet.com' },
        { label: '와이파이', text: 'WIFI:T:WPA;S:MyWiFi;P:password;;' },
        { label: '이메일', text: 'mailto:contact@example.com' },
        { label: '전화번호', text: 'tel:010-1234-5678' },
    ];

    const generateQR = useCallback(() => {
        if (!inputText.trim()) {
            setError('QR 코드로 변환할 텍스트 또는 URL을 입력해주세요.');
            return;
        }
        try {
            const encoded = encodeURIComponent(inputText);
            const fg = fgColor.replace('#', '');
            const bg = bgColor.replace('#', '');
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=${bg}&color=${fg}&format=png`;
            setQrCodeUrl(url);
            setError('');
        } catch (err) {
            setError('QR 코드 생성 오류: ' + err.message);
        }
    }, [inputText, size, fgColor, bgColor]);

    const downloadQR = useCallback(() => {
        if (!qrCodeUrl) return;
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = 'qrcode.png';
        link.click();
    }, [qrCodeUrl]);

    const copyToClipboard = useCallback(async () => {
        if (!qrCodeUrl) return;
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            alert('QR 코드가 클립보드에 복사되었습니다!');
        } catch (err) {
            alert('클립보드 복사 실패: ' + err.message);
        }
    }, [qrCodeUrl]);

    return (
        <div className="qr-code-generator w-full bg-slate-900 rounded-2xl p-6 border border-slate-700">
            {/* 헤더 섹션 */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">QR 코드 생성기</h2>
                    <p className="text-slate-400">URL, 텍스트, 와이파이, 연락처 등 다양한 정보를 QR 코드로 변환</p>
                </div>
            </div>

            {/* 메인 컨텐츠 그리드: items-stretch를 통해 양쪽 높이를 맞춤 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* 왼쪽: 입력 및 설정 영역 */}
                <div className="flex flex-col h-full">
                    <div className="bg-slate-800 rounded-xl p-4 flex flex-col h-full">
                        <h3 className="text-lg font-semibold text-slate-200 mb-3">QR 내용 입력</h3>
                        
                        <div className="mb-4">
                            <label className="text-sm text-slate-400 mb-2 block">빠른 입력:</label>
                            <div className="flex flex-wrap gap-2">
                                {sampleTexts.map((sample, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setInputText(sample.text)}
                                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors"
                                    >
                                        {sample.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* flex-1을 주어 남는 공간을 모두 차지하게 함 */}
                        <textarea
                            className="w-full flex-1 min-h-[350px] bg-slate-900 text-slate-100 px-4 py-3 rounded-lg border border-slate-700 focus:border-teal-500 focus:outline-none resize-none font-mono mb-4"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={`QR 코드로 변환할 내용을 입력하세요.

예시:
- URL: https://www.example.com
- 와이파이: WIFI:T:WPA;S:네트워크명;P:비밀번호;;
- 전화번호: tel:010-1234-5678`}
                            spellCheck="false"
                        />
                        
                        {/* 설정 영역: 하단에 고정 */}
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">크기</label>
                                    <select
                                        value={size}
                                        onChange={(e) => setSize(Number(e.target.value))}
                                        className="w-full bg-slate-700 text-slate-200 px-2 py-2 rounded-lg border border-slate-600 text-sm"
                                    >
                                        <option value={128}>128px</option>
                                        <option value={256}>256px</option>
                                        <option value={512}>512px</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">QR 색상</label>
                                    <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1 border border-slate-600 h-[38px] px-2">
                                        <input
                                            type="color"
                                            value={fgColor}
                                            onChange={(e) => setFgColor(e.target.value)}
                                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                        />
                                        <span className="text-xs text-slate-300">{fgColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">배경 색상</label>
                                    <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1 border border-slate-600 h-[38px] px-2">
                                        <input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                        />
                                        <span className="text-xs text-slate-300">{bgColor}</span>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            
                            <button
                                onClick={generateQR}
                                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                QR 코드 생성
                            </button>
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 결과 확인 영역 */}
                <div className="flex flex-col h-full">
                    <div className="bg-slate-800 rounded-xl p-4 h-full flex flex-col">
                        <h3 className="text-lg font-semibold text-slate-200 mb-3">QR 코드 확인</h3>
                        
                        {/* flex-1로 왼쪽 텍스트 에리어와 높이를 맞춤 */}
                        <div className="flex-1 bg-slate-900 rounded-lg p-6 border border-slate-700 flex flex-col items-center justify-center min-h-[350px]">
                            {qrCodeUrl ? (
                                <div className="text-center w-full flex flex-col items-center justify-center flex-1">
                                    <div className="inline-block p-4 bg-white rounded-xl shadow-xl">
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="QR Code" 
                                            className="max-w-full h-auto"
                                            style={{ width: size, height: size }}
                                        />
                                    </div>
                                    <p className="text-slate-500 text-sm mt-4 break-all max-w-[80%]">
                                         {inputText.length > 50 ? inputText.substring(0, 50) + '...' : inputText}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-24 h-24 mb-6 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium">QR 코드가 여기에 표시됩니다</p>
                                    <p className="text-sm opacity-70 mt-2">왼쪽에서 내용을 입력하고 생성 버튼을 눌러주세요</p>
                                </div>
                            )}
                        </div>

                        {/* 버튼 영역: 내용이 있을 때만 하단에 표시 */}
                        {qrCodeUrl && (
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                    </svg>
                                    클립보드 복사
                                </button>
                                <button
                                    onClick={downloadQR}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                    </svg>
                                    다운로드
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 하단 팁 영역 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-200 mb-2">📱 활용 분야</h4>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li>• 명함, 전단지, 포스터 삽입</li>
                        <li>• 와이파이 간편 접속</li>
                        <li>• 웹사이트 및 SNS 홍보</li>
                    </ul>
                </div>
                
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-200 mb-2">🎨 디자인 팁</h4>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li>• 배경과 QR 색상의 명도 대비 권장</li>
                        <li>• 복잡한 로고 삽입 시 인식률 주의</li>
                        <li>• 최소 2cm x 2cm 이상 크기 권장</li>
                    </ul>
                </div>
                
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-200 mb-2">⚠️ 주의사항</h4>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li>• QR 코드 주변 여백(Quiet Zone) 확보</li>
                        <li>• 인쇄 전 반드시 스캔 테스트 진행</li>
                        <li>• 개인정보가 포함된 내용은 주의 필요</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default QrCodeGenerator;