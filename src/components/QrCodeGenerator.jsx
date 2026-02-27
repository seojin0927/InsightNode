import React, { useState, useCallback, useRef, useEffect } from 'react';
import Icons from '../utils/Icons';

const QrCodeGenerator = () => {
    const [inputText, setInputText] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [error, setError] = useState('');
    const qrRef = useRef(null);

    // 샘플 데이터
    const sampleTexts = [
        { label: 'URL', text: 'https://vaultsheet.com' },
        { label: '와이파이', text: 'WIFI:T:WPA;S:MyWiFi;P:password;;' },
        { label: '이메일', text: 'mailto:contact@example.com' },
        { label: '전화번호', text: 'tel:010-1234-5678' },
    ];

    // QR 코드 생성 using qrcode.react library via CDN
    const generateQR = useCallback(() => {
        if (!inputText.trim()) {
            setError('QR 코드로 변환할 텍스트 또는 URL을 입력해주세요.');
            return;
        }

        try {
            // QRServer API 사용 (대안)
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

    // QR 코드 다운로드
    const downloadQR = useCallback(() => {
        if (!qrCodeUrl) return;

        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = 'qrcode.png';
        link.click();
    }, [qrCodeUrl]);

    // 클립보드 복사
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
        <>
            <h1 className="sr-only">QR 코드 생성기 - URL, 텍스트, 와이파이 QR 코드 생성</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            QR 코드 생성기
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            URL, 텍스트, 와이파이, 연락처 등 다양한 정보를 QR 코드로 변환합니다
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
                                <span className="ml-3 text-sm font-semibold text-slate-300">QR 내용 입력</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4">
                            {/* 빠른 샘플 버튼 */}
                            <div className="mb-4">
                                <label className="text-sm text-slate-400 mb-2 block">빠른 입력:</label>
                                <div className="flex flex-wrap gap-2">
                                    {sampleTexts.map((sample, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setInputText(sample.text)}
                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors border border-slate-700"
                                        >
                                            {sample.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                className="w-full h-[150px] bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700 mb-4"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={`QR 코드로 변환할 내용을 입력하세요.

예시:
- URL: https://www.example.com
- 와이파이: WIFI:T:WPA;S:네트워크명;P:비밀번호;;
- 전화번호: tel:010-1234-5678
- 이메일: mailto:test@example.com`}
                                spellCheck="false"
                            />

                            {/* 옵션 */}
                            <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                <label className="text-sm text-slate-400 mb-3 block">QR 코드 설정</label>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">크기</label>
                                        <select
                                            value={size}
                                            onChange={(e) => setSize(Number(e.target.value))}
                                            className="w-full bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600"
                                        >
                                            <option value={128}>128x128</option>
                                            <option value={256}>256x256</option>
                                            <option value={512}>512x512</option>
                                            <option value={1024}>1024x1024</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">QR 색상</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="w-10 h-10 rounded-lg cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-400">{fgColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">배경 색상</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="w-10 h-10 rounded-lg cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-400">{bgColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
                                    {error}
                                </div>
                            )}
                            
                            <button
                                onClick={generateQR}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                            >
                                <Icons.Play /> QR 코드 생성
                            </button>
                        </div>
                    </div>

                    {/* 우측: QR 코드 결과 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">QR 코드</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto bg-[#0d1117] p-8 flex items-center justify-center">
                            {qrCodeUrl ? (
                                <div className="text-center">
                                    <div className="inline-block p-4 bg-white rounded-xl">
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="QR Code" 
                                            className="w-full h-auto"
                                            style={{ width: size, height: size }}
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-4">
                                        {inputText.length > 50 ? inputText.substring(0, 50) + '...' : inputText}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-24 h-24 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </div>
                                    <p>QR 코드가 여기에 표시됩니다</p>
                                </div>
                            )}
                        </div>
                        
                        {qrCodeUrl && (
                            <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 flex gap-3">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50"
                                >
                                    <Icons.Copy /> 클립보드 복사
                                </button>
                                <button
                                    onClick={downloadQR}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    <Icons.Download /> PNG 다운로드
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default QrCodeGenerator;
