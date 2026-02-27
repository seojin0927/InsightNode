import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Icons from '../utils/Icons';

const MockDataGenerator = () => {
    const [rowCount, setRowCount] = useState(10);
    const [generatedData, setGeneratedData] = useState(null);
    const [columns, setColumns] = useState({
        name: true,
        phone: true,
        email: false,
        address: false,
        company: false,
        department: false,
        position: false,
        age: false,
        businessNumber: false,
        cardNumber: false,
        bankAccount: false,
        revenue: false
    });

    // Korean name data
    const lastNames = ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Jang', 'Cho', 'Yoon', 'Kwon', 'Moon', 'Seo', 'Shin', 'Hwang', 'Ahn'];
    const firstNamesMale = ['Jun-ho', 'Seo-joon', 'Do-yun', 'Min-jun', 'Ji-hoon', 'Ha-joon', 'Tae-hyung', 'Woo-jun', 'Jae-won', 'Hyun-woo'];
    const firstNamesFemale = ['Seo-yeon', 'Ji-woo', 'Ha-eun', 'Ji-yeon', 'Min-ji', 'Soo-min', 'Eun-bi', 'Ye-ji', 'So-yeon', 'Hye-jin'];

    // Company names
    const companies = ['Samsung Electronics', 'SK Hynix', 'LG Electronics', 'Kakao', 'Naver', 'CJ ENM', 'Hyundai Motor', 'Kia Motors', 'POSCO', 'Lotte', 'Hanwha', 'Hyundai Heavy Industries', 'Korea Electric Power', 'KEPCO', 'Korea Aerospace Industries'];

    // Departments
    const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'R&D', 'IT', 'Legal', 'Customer Service'];

    // Positions
    const positions = ['Intern', 'Junior', 'Senior', 'Lead', 'Manager', 'Senior Manager', 'Director', 'Vice President', 'Senior Director', 'Chief'];

    // Cities
    const cities = ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Sejong', 'Suwon', 'Changwon'];

    // Generate random data
    const generateData = useCallback(() => {
        const data = [];
        
        for (let i = 0; i < rowCount; i++) {
            const row = {};
            const gender = Math.random() > 0.5 ? 'male' : 'female';
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const firstName = gender === 'male' 
                ? firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)]
                : firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)];
            
            if (columns.name) {
                row['Name'] = `${lastName} ${firstName}`;
            }
            
            if (columns.phone) {
                const phone1 = ['010', '011', '016', '017', '018', '019'][Math.floor(Math.random() * 6)];
                const phone2 = Math.floor(Math.random() * 9000) + 1000;
                const phone3 = Math.floor(Math.random() * 9000) + 1000;
                row['Phone'] = `${phone1}-${phone2}-${phone3}`;
            }
            
            if (columns.email) {
                const domains = ['gmail.com', 'naver.com', 'kakao.com', 'hanmail.net', 'nate.com', 'company.co.kr'];
                const domain = domains[Math.floor(Math.random() * domains.length)];
                const nameEng = firstName.replace('-', '').toLowerCase() + lastName.toLowerCase();
                row['Email'] = `${nameEng}${Math.floor(Math.random() * 100)}@${domain}`;
            }
            
            if (columns.address) {
                const districts = ['Gangnam-gu', 'Seocho-gu', 'Jongno-gu', 'Jung-gu', 'Yongsan-gu', 'Mapo-gu', 'Songpa-gu', 'Gwangjin-gu'];
                const city = cities[Math.floor(Math.random() * cities.length)];
                const district = districts[Math.floor(Math.random() * districts.length)];
                const streetNum = Math.floor(Math.random() * 500) + 1;
                row['Address'] = `${city}, ${district}, Street ${streetNum}`;
            }
            
            if (columns.company) {
                row['Company'] = companies[Math.floor(Math.random() * companies.length)];
            }
            
            if (columns.department) {
                row['Department'] = departments[Math.floor(Math.random() * departments.length)];
            }
            
            if (columns.position) {
                row['Position'] = positions[Math.floor(Math.random() * positions.length)];
            }
            
            if (columns.age) {
                row['Age'] = Math.floor(Math.random() * 40) + 22;
            }
            
            if (columns.businessNumber) {
                const bn1 = Math.floor(Math.random() * 900) + 100;
                const bn2 = Math.floor(Math.random() * 90) + 10;
                const bn3 = Math.floor(Math.random() * 90000) + 10000;
                row['BusinessNumber'] = `${bn1}-${bn2}-${bn3}`;
            }
            
            if (columns.cardNumber) {
                row['CardNumber'] = `${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
            }
            
            if (columns.bankAccount) {
                const banks = ['KB Kookmin Bank', 'Shinhan Bank', 'Kakao Bank', 'KBS Bank', 'IBK Industrial Bank of Korea'];
                const bank = banks[Math.floor(Math.random() * banks.length)];
                const account = Math.floor(Math.random() * 9000000000) + 1000000000;
                row['BankAccount'] = `${bank} ${account}`;
            }
            
            if (columns.revenue) {
                row['Revenue'] = Math.floor(Math.random() * 900000000) + 100000000;
            }
            
            data.push(row);
        }
        
        setGeneratedData(data);
    }, [rowCount, columns]);

    const handleCopy = useCallback(() => {
        if (!generatedData) return;
        
        const text = generatedData.map(row => Object.values(row).join('\t')).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    }, [generatedData]);

    const handleDownloadCSV = useCallback(() => {
        if (!generatedData) return;
        
        const csv = Papa.unparse(generatedData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'mock_data.csv';
        link.click();
    }, [generatedData]);

    const handleDownloadJSON = useCallback(() => {
        if (!generatedData) return;
        
        const json = JSON.stringify(generatedData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'mock_data.json';
        link.click();
    }, [generatedData]);

    return (
        <>
            <h1 className="sr-only">VaultSheet (볼트시트) - 더미 데이터 생성기 : 테스트용 한국인 정보 자동 생성</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            더미 데이터 생성기
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            프로토타입 및 테스트를 위한 현실적인 한국인 테스트 데이터를 생성합니다
                        </p>
                    </div>
                </div>

                {/* Options */}
                <div className="flex gap-4 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-400">행 수:</label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={rowCount}
                            onChange={(e) => setRowCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-20 bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600/30"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-slate-400">필드:</span>
                        {[
                            { key: 'name', label: '이름', icon: '👤' },
                            { key: 'phone', label: '전화번호', icon: '📱' },
                            { key: 'email', label: '이메일', icon: '📧' },
                            { key: 'address', label: '주소', icon: '🏠' },
                            { key: 'company', label: '회사', icon: '🏢' },
                            { key: 'department', label: '부서', icon: '📋' },
                            { key: 'position', label: '직급', icon: '💼' },
                            { key: 'age', label: '나이', icon: '🎂' },
                            { key: 'businessNumber', label: '사업자번호', icon: '🏭' },
                            { key: 'cardNumber', label: '카드번호', icon: '💳' },
                            { key: 'bankAccount', label: '계좌번호', icon: '🏦' },
                            { key: 'revenue', label: '매출', icon: '💰' }
                        ].map(opt => (
                            <label
                                key={opt.key}
                                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all border ${columns[opt.key] ? 'bg-brand-500/20 border-brand-500/50' : 'bg-slate-700/50 border-slate-600'}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={columns[opt.key]}
                                    onChange={(e) => setColumns({ ...columns, [opt.key]: e.target.checked })}
                                    className="w-3 h-3 accent-brand-500"
                                />
                                <span className="text-xs">{opt.icon} {opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={generateData}
                    className="w-full mb-4 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                    <Icons.Play /> 더미 데이터 생성
                </button>

                {/* Result */}
                <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
                    <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                        <div className="flex items-center gap-2 py-3 px-4">
                            <span className="text-sm font-semibold text-slate-300">생성된 데이터</span>
                            {generatedData && (
                                <span className="text-xs text-slate-500 ml-2">({generatedData.length}행)</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-[#0d1117] p-4">
                        {generatedData && generatedData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            {Object.keys(generatedData[0]).map((col, idx) => (
                                                <th key={idx} className="px-3 py-2 text-left text-slate-400 font-medium">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {generatedData.map((row, idx) => (
                                            <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                                                {Object.values(row).map((val, vIdx) => (
                                                    <td key={vIdx} className="px-3 py-2 text-slate-300 font-mono text-xs">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <div className="w-16 h-16 mb-4 opacity-20">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <p className="text-slate-500">생성 버튼을 클릭하여 더미 데이터를 만드세요</p>
                            </div>
                        )}
                    </div>
                    
                    {generatedData && generatedData.length > 0 && (
                        <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 flex gap-3">
                            <button
                                onClick={handleCopy}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50"
                            >
                                <Icons.Copy /> 복사
                            </button>
                            <button
                                onClick={handleDownloadCSV}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                            >
                                <Icons.Download /> CSV
                            </button>
                            <button
                                onClick={handleDownloadJSON}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                            >
                                <Icons.Download /> JSON
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MockDataGenerator;
