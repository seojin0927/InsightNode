import React, { useState, useEffect } from 'react';

// 공통 아이콘 컴포넌트
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const MobileServiceCenter = () => {
    const [activeTab, setActiveTab] = useState('contact');
    const [scrolled, setScrolled] = useState(false);

    // 스크롤 감지
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 뒤로가기 핸들러
    const handleGoBack = () => {
        // 실제 앱 환경에 맞춰 수정 가능 (예: router.back() or navigate(-1))
        if (window.history.length > 1) {
            window.history.back();
        } else {
            console.log("No history to go back to");
            // 메인으로 이동하는 로직을 넣어도 됩니다.
        }
    };

    const tabs = [
        { id: 'privacy', label: '보안정책', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'about', label: '소개', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'contact', label: '문의', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ];

    return (
        <div className="w-full min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30 relative">
            
            {/* --- 배경 효과 (고정) --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent"></div>
                <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[50%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[50%] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
            </div>

            {/* --- 메인 컨테이너 --- */}
            <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen">
                
                {/* === 헤더 (뒤로가기 버튼 추가됨) === */}
                <div className={`sticky top-0 z-50 transition-all duration-300 px-5 py-3 flex items-center justify-between ${scrolled ? 'bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'}`}>
                    
                    <div className="flex items-center gap-3">
                        {/* 뒤로가기 버튼 */}
                        <button 
                            onClick={handleGoBack}
                            className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700 flex items-center justify-center text-slate-300 transition-all active:scale-90 group"
                            aria-label="Go Back"
                        >
                            <Icon path="M15 19l-7-7 7-7" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        {/* 로고 영역 */}
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] hidden xs:flex">
                                <Icon path="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </div>
                            <span className="font-black text-lg tracking-tight text-white">Vault<span className="text-emerald-400">Sheet</span></span>
                        </div>
                    </div>

                    {/* 우측 뱃지 */}
                    <div className="text-[10px] font-bold bg-slate-800/80 px-2.5 py-1 rounded-full text-emerald-500 border border-slate-700/50">
                        SUPPORT
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="px-5 pt-2 pb-6">
                    <div className="bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 flex gap-1 shadow-inner">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 relative overflow-hidden ${
                                    activeTab === tab.id 
                                        ? 'bg-slate-800 text-emerald-400 shadow-lg border border-slate-700' 
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                }`}
                            >
                                {activeTab === tab.id && (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 opacity-50"></div>
                                )}
                                <Icon path={tab.icon} className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`} />
                                <span className="z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 컨텐츠 영역 */}
                <div className="flex-1 px-5 pb-24 space-y-6">

                    {/* === TAB 1: 보안정책 === */}
                    {activeTab === 'privacy' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <h2 className="text-2xl font-bold text-white mb-2">데이터 보안 정책</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    VaultSheet는 귀하의 데이터를 서버로 전송하지 않습니다.<br/>
                                    모든 처리는 <span className="text-emerald-400 font-bold">로컬 브라우저</span> 내에서 안전하게 이루어집니다.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <SectionHeader title="System Log: Data Handling" />
                                <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-400 space-y-3 shadow-inner">
                                    <LogItem label="Data Collection" value="None" color="text-emerald-500" />
                                    <LogItem label="Server Storage" value="Disabled" color="text-emerald-500" />
                                    <LogItem label="Local Processing" value="Active" color="text-cyan-500" />
                                    <LogItem label="Cookie Usage" value="Minimal (Session)" color="text-amber-500" />
                                    
                                    <div className="w-full h-px bg-slate-800 my-2"></div>
                                    <p className="leading-relaxed opacity-70">
                                         본 서비스는 별도의 회원가입 없이 이용 가능하며, 
                                        입력하신 모든 정보는 새로고침 시 즉시 파기됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === TAB 2: 소개 === */}
                    {activeTab === 'about' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="text-center py-4">
                                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-4">
                                    Why VaultSheet?
                                </div>
                                <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                                    The Next Gen<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Mobile Utility</span>
                                </h2>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                    복잡한 PC 작업을 모바일에서 가장 직관적이고 아름답게 처리하는 방법입니다.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <FeatureCard 
                                    title="Zero Latency" 
                                    desc="서버 통신 없는 즉각적인 처리 속도"
                                    gradient="from-emerald-500/20 to-emerald-500/5"
                                    iconColor="text-emerald-400"
                                    icon="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                                <FeatureCard 
                                    title="Military Grade" 
                                    desc="데이터가 기기 밖으로 나가지 않는 보안"
                                    gradient="from-cyan-500/20 to-cyan-500/5"
                                    iconColor="text-cyan-400"
                                    icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </div>
                        </div>
                    )}

                    {/* === TAB 3: 문의 === */}
                    {activeTab === 'contact' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            
                            {/* Hero Contact Card */}
                            <div className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-800 p-6 shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <h3 className="text-emerald-100 text-xs font-bold tracking-widest uppercase mb-1">Direct Support</h3>
                                    <h2 className="text-2xl font-bold text-white mb-6">무엇을 도와드릴까요?</h2>
                                    
                                    <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white text-teal-700 p-2 rounded-lg">
                                                <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-emerald-100">Official Email</p>
                                                <p className="text-sm font-bold text-white">aairavoxx@gmail.com</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ Section */}
                            <div className="space-y-4">
                                <SectionHeader title="Frequently Asked" />
                                <div className="grid gap-3">
                                    <FaqItem 
                                        q="새로운 기능 제안이 가능한가요?" 
                                        a="언제든 환영합니다! 위 이메일로 제안해주시면 검토 후 다음 업데이트에 반영하도록 노력하겠습니다." 
                                    />
                                    <FaqItem 
                                        q="사용 중 오류가 발생했어요." 
                                        a="불편을 드려 죄송합니다. 오류 화면을 캡처하여 메일로 보내주시면 빠르게 수정 조치하겠습니다." 
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-8 text-center">
                                <div className="w-8 h-1 bg-slate-800 mx-auto rounded-full mb-4"></div>
                                <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                                    © 2024 VAULTSHEET CORE<br/>All rights reserved.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// --- 서브 컴포넌트들 (이전과 동일 유지) ---
const SectionHeader = ({ title }) => (
    <h3 className="flex items-center gap-2 text-sm font-bold text-white pl-1">
        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
        {title}
    </h3>
);

const LogItem = ({ label, value, color }) => (
    <div className="flex justify-between items-center border-b border-slate-800/50 last:border-0 pb-1 last:pb-0">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold ${color}`}>[{value}]</span>
    </div>
);

const FeatureCard = ({ title, desc, icon, gradient, iconColor }) => (
    <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 group hover:border-slate-700 transition-colors">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full blur-xl -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-700`}></div>
        <div className="relative z-10 flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-slate-800/80 border border-slate-700 ${iconColor}`}>
                <Icon path={icon} className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-base font-bold text-white mb-1">{title}</h4>
                <p className="text-sm text-slate-400 leading-snug">{desc}</p>
            </div>
        </div>
    </div>
);

const FaqItem = ({ q, a }) => (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 transition-all hover:bg-slate-800/40">
        <h4 className="text-emerald-400 font-bold text-sm mb-2 flex items-start gap-2">
            <span className="text-xs mt-0.5 opacity-50">Q.</span>
            {q}
        </h4>
        <p className="text-slate-400 text-xs leading-relaxed pl-5 border-l border-slate-700 ml-1">
            {a}
        </p>
    </div>
);

export default MobileServiceCenter;