import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Icons from '../utils/Icons';

const PersonalDataMasker = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [maskOptions, setMaskOptions] = useState({
        name: true,
        phone: true,
        email: true,
        address: false,
        businessNumber: false,
        cardNumber: false,
        ipAddress: false,
        residentNumber: false
    });
    const [maskChar, setMaskChar] = useState('*');
    const [mode, setMode] = useState('text'); // text or csv

    const maskName = (name) => {
        if (!name) return name;
        const str = String(name).trim();
        if (str.length >= 2) {
            return str[0] + maskChar.repeat(str.length - 1);
        }
        return str;
    };

    // 전화번호: 02 지역번호 및 다양한 자릿수 대응 (이전 수정사항 유지)
    const maskPhone = (phone) => {
        if (!phone) return phone;
        const s = String(phone).replace(/\D/g, '');
        
        if (s.length === 11) { // 010-1234-5678
            return s.replace(/(\d{3})(\d{4})(\d{4})/, `$1-${maskChar.repeat(4)}-$3`);
        } else if (s.length === 10) {
            if (s.startsWith('02')) { // 02-1234-5678
                return s.replace(/(\d{2})(\d{4})(\d{4})/, `$1-${maskChar.repeat(4)}-$3`);
            }
            // 031-123-4567
            return s.replace(/(\d{3})(\d{3})(\d{4})/, `$1-${maskChar.repeat(3)}-$3`);
        } else if (s.length === 9) { // 02-123-4567
            return s.replace(/(\d{2})(\d{3})(\d{4})/, `$1-${maskChar.repeat(3)}-$3`);
        }
        return phone;
    };

    const maskEmail = (email) => {
        if (!email || !String(email).includes('@')) return email;
        const parts = String(email).split('@');
        const id = parts[0];
        if (id.length > 2) {
            return id[0] + maskChar.repeat(id.length - 2) + id[id.length - 1] + '@' + parts[1];
        }
        return maskChar.repeat(id.length) + '@' + parts[1];
    };

    // [수정됨] 주소: 도로명(3번째 어절)부터 마스킹 처리
    const maskAddress = (address) => {
        if (!address) return address;
        const str = String(address).trim();
        const parts = str.split(' ');
        
        // 주소가 3어절 이상인 경우 (예: 서울 강남구 테헤란로 123)
        if (parts.length >= 3) {
            // 시/도, 구/군 (앞 2어절)만 보여줌
            // 기존 3어절 -> 2어절로 변경하여 '테헤란로' 같은 도로명부터 마스킹
            const visibleCount = 2; 
            const visible = parts.slice(0, visibleCount).join(' ');
            
            // 나머지 부분은 길이만큼 마스킹 문자로 대체
            const remainingLen = str.length - visible.length;
            return visible + maskChar.repeat(remainingLen);
        } else if (str.length > 5) {
            // 주소가 짧은 경우 절반만 마스킹
            const half = Math.floor(str.length / 2);
            return str.slice(0, half) + maskChar.repeat(str.length - half);
        }
        return address;
    };

    // 사업자번호: 뒷자리 5자리 유지 (이전 수정사항 유지)
    const maskBusinessNumber = (num) => {
        if (!num) return num;
        const s = String(num).replace(/\D/g, '');
        if (s.length === 10) {
            // 123-45-67890 -> ***-**-67890
            return maskChar.repeat(3) + '-' + maskChar.repeat(2) + '-' + s.slice(5);
        }
        return num;
    };

    const maskCardNumber = (num) => {
        if (!num) return num;
        const s = String(num).replace(/\D/g, '');
        if (s.length >= 13) {
            return maskChar.repeat(s.length - 4) + s.slice(-4);
        }
        return num;
    };

    const maskIPAddress = (ip) => {
        if (!ip) return ip;
        const s = String(ip).trim();
        const parts = s.split('.');
        if (parts.length === 4) {
            return parts[0] + '.' + parts[1] + '.' + parts[2] + '.' + maskChar;
        }
        return ip;
    };

    const maskResidentNumber = (num) => {
        if (!num) return num;
        const s = String(num).replace(/\D/g, '');
        if (s.length === 13) {
            return s.slice(0, 6) + '-' + maskChar.repeat(7);
        }
        return num;
    };

    const handleMask = useCallback(() => {
        if (!inputText) return;

        try {
            let result = inputText;

            if (mode === 'csv') {
                const parsed = Papa.parse(inputText, { header: true, skipEmptyLines: true });
                if (parsed.data && parsed.data.length > 0) {
                    const maskedData = parsed.data.map(row => {
                        const newRow = { ...row };
                        Object.keys(newRow).forEach(col => {
                            const val = newRow[col];
                            const colLower = col.toLowerCase();
                            
                            if (maskOptions.name && (colLower.includes('name') || colLower.includes('성명') || colLower.includes('이름'))) {
                                newRow[col] = maskName(val);
                            }
                            if (maskOptions.phone && (colLower.includes('phone') || colLower.includes('tel') || colLower.includes('전화') || colLower.includes('휴대'))) {
                                newRow[col] = maskPhone(val);
                            }
                            if (maskOptions.email && (colLower.includes('email') || colLower.includes('메일'))) {
                                newRow[col] = maskEmail(val);
                            }
                            if (maskOptions.address && (colLower.includes('address') || colLower.includes('주소'))) {
                                newRow[col] = maskAddress(val);
                            }
                            if (maskOptions.businessNumber && (colLower.includes('business') || colLower.includes('사업자'))) {
                                newRow[col] = maskBusinessNumber(val);
                            }
                            if (maskOptions.cardNumber && (colLower.includes('card') || colLower.includes('카드'))) {
                                newRow[col] = maskCardNumber(val);
                            }
                            if (maskOptions.ipAddress && colLower.includes('ip')) {
                                newRow[col] = maskIPAddress(val);
                            }
                            if (maskOptions.residentNumber && (colLower.includes('resident') || colLower.includes('주민'))) {
                                newRow[col] = maskResidentNumber(val);
                            }
                        });
                        return newRow;
                    });
                    result = Papa.unparse(maskedData);
                }
            } else {
                let masked = inputText;
                
                if (maskOptions.name) {
                    masked = masked.replace(/(?:이름|성명|name)[:\s]*([가-힣]{2,4})/gi, (match, name) => {
                        return match.replace(name, maskName(name));
                    });
                }
                
                if (maskOptions.email) {
                    masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => maskEmail(match));
                }
                
                if (maskOptions.phone) {
                    masked = masked.replace(/(?:전화|전화번호|phone|tel|휴대)[:\s]*0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/gi, (match) => {
                        const phoneMatch = match.match(/0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/);
                        if (phoneMatch) {
                            return match.replace(phoneMatch[0], maskPhone(phoneMatch[0]));
                        }
                        return match;
                    });
                    masked = masked.replace(/0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/g, (match) => maskPhone(match));
                }
                
                if (maskOptions.businessNumber) {
                    masked = masked.replace(/(?:사업자번호|business)[:\s]*(\d{3}[-\s]?\d{2}[-\s]?\d{5})/gi, (match, num) => {
                        return match.replace(num, maskBusinessNumber(num));
                    });
                }
                
                if (maskOptions.cardNumber) {
                    masked = masked.replace(/(?:카드번호|card)[:\s]*(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})/gi, (match, num) => {
                        return match.replace(num, maskCardNumber(num));
                    });
                    masked = masked.replace(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, (match) => maskCardNumber(match));
                }
                
                if (maskOptions.ipAddress) {
                    masked = masked.replace(/(?:IP주소|ip)[:\s]*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gi, (match, ip) => {
                        return match.replace(ip, maskIPAddress(ip));
                    });
                    masked = masked.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, (match) => maskIPAddress(match));
                }
                
                if (maskOptions.residentNumber) {
                    masked = masked.replace(/(?:주민번호|resident)[:\s]*(\d{6}[-\s]?\d{7})/gi, (match, num) => {
                        return match.replace(num, maskResidentNumber(num));
                    });
                }
                
                if (maskOptions.address) {
                    masked = masked.replace(/(?:주소|address)[:\s]*(.+?)(?=,|$)/gi, (match, addr) => {
                        return match.replace(addr, maskAddress(addr));
                    });
                }
                
                result = masked;
            }

            setOutputText(result);
        } catch (err) {
            alert('Masking error: ' + err.message);
        }
    }, [inputText, maskOptions, maskChar, mode]);

    const handleCopy = useCallback(() => {
        if (!outputText) return;
        navigator.clipboard.writeText(outputText).then(() => {
            alert('Copied to clipboard!');
        });
    }, [outputText]);

    const handleDownloadCSV = useCallback(() => {
        if (!outputText) return;
        const blob = new Blob([outputText], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'masked_data.csv';
        link.click();
    }, [outputText]);

    const handleDownloadText = useCallback(() => {
        if (!outputText) return;
        const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'masked_data.txt';
        link.click();
    }, [outputText]);

    const sampleText = `이름: 김철수, 전화번호: 010-1234-5678, 이메일: kim@example.com
이름: 박지민, 전화번호: 02-987-6543, 이메일: park@company.co.kr
이름: 이영희, 전화번호: 010-5555-8888, 이메일: lee@test.kr
주소: 서울 강남구 테헤란로 123,-ip주소: 192.168.1.100
사업자번호: 123-45-67890, 카드번호: 1234-5678-9012-3456
주민번호: 123456-1234567`;

    const sampleCSV = `이름,전화번호,이메일,주소,사업자번호,카드번호,주민번호,IP주소
김철수,010-1234-5678,kim@example.com,서울 강남구 테헤란로 123,123-45-67890,1234-5678-9012-3456,123456-1234567,192.168.1.100
박지민,02-987-6543,park@company.co.kr,부산 해운대구 해운대로 456,234-56-78901,9876-5432-1098-7654,234567-2345678,10.0.0.1
이영희,010-5555-8888,lee@test.kr,대구 수성구 수성대로 789,345-67-89012,1111-2222-3333-4444,345678-3456789,172.16.0.50`;

    return (
        <>
            <h1 className="sr-only">VaultSheet (볼트시트) - 개인정보 마스킹 도구 : 이름, 전화번호, 이메일 등 개인정보 자동 마스킹</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            개인정보 마스킹 도구
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            이름, 전화번호, 이메일 등 개인정보를 자동으로 마스킹합니다
                        </p>
                    </div>
                </div>

                {/* Options */}
                <div className="flex gap-4 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">마스킹 문자:</label>
                        <select
                            value={maskChar}
                            onChange={(e) => setMaskChar(e.target.value)}
                            className="bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600/30"
                        >
                            <option value="*">* (별표)</option>
                            <option value="#"># (샵)</option>
                            <option value="X">X</option>
                            <option value="-">- (대시)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">모드:</label>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setMode('text')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'text' ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                일반 텍스트
                            </button>
                            <button
                                onClick={() => setMode('csv')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'csv' ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                CSV 데이터
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mask Options */}
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                    {[
                        { key: 'name', label: '이름', icon: '👤' },
                        { key: 'phone', label: '전화번호', icon: '📱' },
                        { key: 'email', label: '이메일', icon: '📧' },
                        { key: 'address', label: '주소', icon: '🏠' },
                        { key: 'businessNumber', label: '사업자번호', icon: '🏢' },
                        { key: 'cardNumber', label: '카드번호', icon: '💳' },
                        { key: 'ipAddress', label: 'IP 주소', icon: '🌐' },
                        { key: 'residentNumber', label: '주민번호', icon: '🔐' }
                    ].map(opt => (
                        <label
                            key={opt.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border ${maskOptions[opt.key] ? 'bg-brand-500/20 border-brand-500/50' : 'bg-slate-800/50 border-slate-700'}`}
                        >
                            <input
                                type="checkbox"
                                checked={maskOptions[opt.key]}
                                onChange={(e) => setMaskOptions({ ...maskOptions, [opt.key]: e.target.checked })}
                                className="w-4 h-4 accent-brand-500"
                            />
                            <span className="text-sm">{opt.icon} {opt.label}</span>
                        </label>
                    ))}
                </div>

                <div className="flex gap-4 overflow-hidden flex-1 min-h-0">
                    {/* Input */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <span className="text-sm font-semibold text-slate-300">원본 데이터</span>
                            </div>
                            <button 
                                onClick={() => {
                                    setInputText(mode === 'csv' ? sampleCSV : sampleText);
                                    setMaskOptions({
                                        name: true,
                                        phone: true,
                                        email: true,
                                        address: true,
                                        businessNumber: true,
                                        cardNumber: true,
                                        ipAddress: true,
                                        residentNumber: true
                                    });
                                }}
                                className="ml-auto mr-4 px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-medium rounded-lg border border-brand-500/30 transition-all"
                            >
                                📋 샘플
                            </button>
                        </div>
                        <div className="flex-1 p-3">
                            <textarea
                                className="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-3 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={mode === 'csv' ? 'CSV 데이터를 여기에 붙여넣으세요...' : '개인정보가 포함된 텍스트를 입력하세요...'}
                                spellCheck="false"
                            />
                        </div>
                    </div>

                    {/* Output */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <span className="text-sm font-semibold text-slate-300">마스킹 결과</span>
                            </div>
                        </div>
                        <div className="flex-1 p-3">
                            {outputText ? (
                                <textarea
                                    className="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-3 font-mono text-sm resize-none outline-none custom-scrollbar rounded-lg border border-slate-700"
                                    value={outputText}
                                    readOnly
                                    spellCheck="false"
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500">마스킹 결과가 여기에 표시됩니다</p>
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
                                    onClick={mode === 'csv' ? handleDownloadCSV : handleDownloadText}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    <Icons.Download /> 다운로드
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleMask}
                    className="w-full mt-4 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                    <Icons.Play /> 마스킹 적용
                </button>
            </div>
        </>
    );
};

export default PersonalDataMasker;