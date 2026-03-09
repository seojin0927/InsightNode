import React, { useState } from 'react';

// 공통 아이콘 컴포넌트
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ServiceCenter = () => {
    const [activeTab, setActiveTab] = useState('privacy'); // privacy, about, contact

    // 탭 메뉴 데이터 (아이콘 추가)
    const tabs = [
        { id: 'privacy', label: '개인정보처리방침', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'about', label: '서비스 소개', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'contact', label: '고객센터', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ];

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            
            {/* 1. 헤더 */}
                                <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Icon path="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Service Center</h2>
                    <p className="text-slate-400 text-sm">약관 · 소개 · 고객지원</p>
                </div>
            </div>

            {/* 2. 메인 레이아웃 (Grid 구조로 변경) */}
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 사이드바 메뉴 (Col 3) */}
                                <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-3 flex flex-col h-full shadow-inner border border-slate-700/50">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 px-2">Menu</h3>
                        <div className="space-y-1">
                            {tabs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all truncate ${
                                        activeTab === t.id 
                                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <Icon path={t.icon} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 우측: 컨텐츠 영역 (Col 9) */}
                                <div className="lg:col-span-9 flex flex-col min-h-0">
                    <div className="flex-1 bg-slate-800 rounded-xl shadow-inner border border-slate-700/50 relative overflow-hidden flex flex-col">
                        
                        {/* 배경 패턴 효과 */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" 
                             style={{ 
                                 backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', 
                                 backgroundSize: '20px 20px' 
                             }}>
                        </div>

                        {/* 스크롤 가능한 컨텐츠 영역 */}
                        <div className="relative z-10 p-8 overflow-y-auto h-full custom-scrollbar">
                            
                            {/* === TAB 1: 개인정보처리방침 === */}
                            {activeTab === 'privacy' && (
                                <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
                                    <div className="border-b border-slate-700 pb-6 mb-6">
                                        <h1 className="text-3xl font-bold text-white mb-2">개인정보 처리방침</h1>
                                        <p className="text-slate-400">이는 당사가 개인정보를 어떻게 수집, 이용, 보호하는지를 설명하는 문서입니다. 이 사이트에서 사용되는 데이터 셋 및 여러 파일들은 사용자의 컴퓨터 내에서만 사용되기 때문에 정보 유출관련 걱정은 하실 필요가 없습니다.</p>
                                        <p className="text-slate-400">아래의 내용은 사이트 필수 개인정보 관련 사항을 담고 있을 뿐 사이트는 개인정보를 필요로하지 않습니다.</p>
                                    </div>

                                    <div className="space-y-8">
                                        <Section title="1. 수집하는 개인정보">
                                            <p className="text-slate-300 leading-relaxed mb-3">
                                                당사는 서비스 제공을 위해 최소한의 개인정보를 수집합니다.
                                            </p>
                                            <ul className="list-disc list-inside space-y-2 text-slate-400 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                                <li>서비스 이용 기록 및 접속 로그</li>
                                            </ul>
                                        </Section>

                                        <Section title="2. 개인정보의 이용 목적">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {['서비스 계약 이행 및 요금 정산', '회원제 서비스 본인 확인', '고객 상담 및 불만 처리', '신규 서비스 안내'].map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                                        <span className="text-slate-300 text-sm">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Section>

                                        <Section title="3. 개인정보의 보유 및 이용 기간">
                                            <div className="grid gap-4">
                                                <InfoCard title="회사 내부 방침에 의한 보유" desc="부정이용 방지를 위해 6개월간 보관" />
                                                <InfoCard title="관련 법령에 의한 보유" desc="계약/철회/결제 기록 등 5년간 보관" />
                                            </div>
                                        </Section>

                                        <Section title="4. 개인정보의 파기 및 제3자 제공">
                                            <p className="text-slate-300 leading-relaxed">
                                                목적 달성 후 즉시 파기하며, 법령에 근거하거나 이용자 동의가 없는 한 제3자에게 제공하지 않습니다.
                                                파기 시 전자적 파일은 영구 삭제 기술을 사용합니다.
                                            </p>
                                        </Section>
                                    </div>
                                </div>
                            )}

                            {/* === TAB 2: 서비스 소개 === */}
                            {activeTab === 'about' && (
                                <div className="max-w-4xl mx-auto animate-in slide-in-from-right duration-500">
                                    <div className="text-center mb-12">
                                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-4">
                                            Innovation for Users
                                        </h1>
                                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                                            사용자 중심의 설계 철학과 최신 기술을 결합하여<br/>디지털 시대의 새로운 기준을 제시합니다.
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                                        <FeatureCard 
                                            icon={<Icon path="M13 10V3L4 14h7v7l9-11h-7z" />}
                                            title="Performance"
                                            desc="압도적인 처리 속도와 안정성을 경험하세요."
                                        />
                                        <FeatureCard 
                                            icon={<Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                                            title="Security"
                                            desc="첨단 암호화 기술로 데이터를 보호합니다."
                                        />
                                        <FeatureCard 
                                            icon={<Icon path="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />}
                                            title="Sync"
                                            desc="모든 디바이스에서 실시간 동기화됩니다."
                                        />
                                    </div>

                                    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8 flex flex-col items-center text-center">
                                        <h3 className="text-2xl font-bold text-white mb-4">Our Mission & Vision</h3>
                                        <p className="text-slate-400 leading-relaxed max-w-2xl">
                                            기술의 힘을 통해 사람들의 삶을 더 편리하고 안전하게 만드는 것이 우리의 미션입니다. 
                                            전 세계 사용자들에게 사랑받는 최고의 글로벌 서비스로 성장하겠습니다.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* === TAB 3: 고객센터 === */}
                            {activeTab === 'contact' && (
                                <div className="max-w-4xl mx-auto animate-in slide-in-from-right duration-500">
                                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                                        <ContactCard 
                                            title="이메일 문의" 
                                            value="aairavoxx@gmail.com" 
                                            sub="24시간 연중무휴 문의 가능"
                                            icon={<Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                                        />
                                    </div>

                                

                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-6">자주 묻는 질문 (FAQ)</h3>
                                        <div className="space-y-4">
                                            <FaqItem q="다른 도구 만들어 주실 수 있나요?" a="당연합니다! 필요한 도구가 있으시면 확인 후 추가해 드리겠습니다." />
                                            <FaqItem q="OOO 도구에 오류가 있어요!" a="죄송합니다. 해당 도구에 문제가 있는 경우 빠르게 수정하도록 하겠습니다." />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 서브 컴포넌트들 (스타일링 분리) ---

const Section = ({ title, children }) => (
    <section>
        <h3 className="text-xl font-bold text-white mb-3 border-l-4 border-violet-500 pl-3">{title}</h3>
        {children}
    </section>
);

const InfoCard = ({ title, desc }) => (
    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex flex-col gap-1">
        <span className="text-white font-bold">{title}</span>
        <span className="text-slate-400 text-sm">{desc}</span>
    </div>
);

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl hover:border-violet-500/50 transition-colors group">
        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-violet-500 mb-4 group-hover:bg-violet-500 group-hover:text-white transition-all">
            {icon}
        </div>
        <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const ContactCard = ({ icon, title, value, sub }) => (
    <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl flex items-start gap-4 hover:bg-slate-800/80 transition-colors">
        <div className="p-3 bg-violet-500/10 text-violet-400 rounded-lg">
            {icon}
        </div>
        <div>
            <h4 className="text-slate-400 text-sm font-bold mb-1">{title}</h4>
            <p className="text-xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-slate-500">{sub}</p>
        </div>
    </div>
);

const FaqItem = ({ q, a }) => (
    <div className="bg-slate-900/50 border border-slate-700 p-5 rounded-xl">
        <h4 className="text-violet-300 font-bold text-sm mb-2">Q. {q}</h4>
        <p className="text-slate-300 text-sm pl-4 border-l border-slate-600">{a}</p>
    </div>
);

export default ServiceCenter;