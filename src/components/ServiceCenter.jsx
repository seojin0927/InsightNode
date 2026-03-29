import React, { useState } from 'react';

const SITE_URL = 'https://vaultsheet.com';
const CONTACT_EMAIL = 'qquest.board@gmail.com';

const Icon = ({ path, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ServiceCenter = () => {
    const [activeTab, setActiveTab] = useState('privacy');

    const tabs = [
        { id: 'privacy', label: '개인정보처리방침', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'terms', label: '이용약관', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        { id: 'disclaimer', label: '면책 조항', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { id: 'about', label: '서비스 소개', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'contact', label: '문의하기', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ];

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                    <Icon path="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-100">고객센터 · VaultSheet</h2>
                    <p className="text-xs text-slate-500">{SITE_URL} — 약관 · 정책 · 문의</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-3 flex flex-col h-full shadow-inner border border-white/[0.07] overflow-y-auto custom-scrollbar max-h-[70vh] lg:max-h-none">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 px-2">메뉴</h3>
                        <div className="space-y-1">
                            {tabs.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                                        activeTab === t.id
                                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <Icon path={t.icon} />
                                    <span className="leading-tight">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-9 flex flex-col min-h-0">
                    <div className="flex-1 bg-slate-800 rounded-xl shadow-inner border border-white/[0.07] relative overflow-hidden flex flex-col">
                        <div
                            className="absolute inset-0 opacity-5 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                        />
                        <div className="relative z-10 p-6 md:p-8 overflow-y-auto h-full custom-scrollbar">
                            {activeTab === 'privacy' && <PrivacyPolicy />}
                            {activeTab === 'terms' && <TermsOfService />}
                            {activeTab === 'disclaimer' && <Disclaimer />}
                            {activeTab === 'about' && <AboutService />}
                            {activeTab === 'contact' && <ContactSection />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------- 개인정보처리방침 (AdSense·쿠키·맞춤 광고 포함) ---------- */
function PrivacyPolicy() {
    return (
        <article className="max-w-4xl mx-auto space-y-8 text-slate-300 leading-relaxed">
            <header className="border-b border-slate-700 pb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">개인정보 처리방침</h1>
                <p className="text-sm text-slate-500">사이트: {SITE_URL} (이하 &quot;본 사이트&quot;)</p>
                <p className="text-sm text-slate-400 mt-3">
                    본 방침은 vaultsheet.com 운영자가 방문자의 정보를 어떻게 처리하는지 설명합니다. Google 애드센스 등 광고 프로그램 이용 시 요구되는 쿠키·맞춤 광고 관련 고지를 포함합니다.
                </p>
            </header>

            <LegalSection title="1. 총칙">
                <p>
                    운영자는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다. 본 사이트의 <strong className="text-white">데이터 분석·변환 도구</strong>는 원칙적으로{' '}
                    <strong className="text-emerald-300">이용자 브라우저(기기) 내에서만</strong> 파일을 처리하도록 설계되어 있으며, 업로드한 표 데이터가 운영자 서버에 저장되도록 하지 않습니다. 다만{' '}
                    <strong className="text-white">접속 로그·쿠키·광고 식별자</strong> 등은 아래와 같이 제3자(구글 등)를 통해 수집·이용될 수 있습니다.
                </p>
            </LegalSection>

            <LegalSection title="2. 수집할 수 있는 정보">
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li>서비스 이용 시 자동으로 생성될 수 있는 <strong className="text-slate-300">접속 기록, IP, 브라우저 유형, 방문 일시</strong> 등(호스팅·분석 도구 설정에 따름)</li>
                    <li>문의 시 이용자가 <strong className="text-slate-300">자발적으로 입력한 이메일·문의 내용</strong></li>
                    <li>
                        <strong className="text-white">쿠키(Cookie) 및 유사 기술</strong>: 본 사이트는 Google 애드센스 등 <strong className="text-white">제3자 광고 공급업체</strong>를 사용할 수 있습니다. 이러한 제3자는 방문자가 본 사이트 및{' '}
                        <strong className="text-white">다른 웹사이트를 방문한 기록</strong>을 바탕으로 광고를 게재하기 위해 쿠키를 사용할 수 있습니다.
                    </li>
                </ul>
            </LegalSection>

            <LegalSection title="3. 쿠키·맞춤형 광고 (Google 애드센스 관련 고지)">
                <p className="mb-3">
                    <strong className="text-white">제3자 공급업체인 구글을 포함한 광고업체</strong>는 쿠키를 사용하여 이용자가 본 사이트 또는 다른 웹사이트를 방문한 이전 기록에 기반하여 광고를 게재할 수 있습니다. 구글은 광고 쿠키를 사용하여{' '}
                    <strong className="text-white">구글 및 파트너</strong>가 이용자에게 적절한 <strong className="text-white">맞춤형·타겟팅 광고</strong>를 제공할 수 있습니다.
                </p>
                <p className="mb-3">
                    이용자는 <strong className="text-white">맞춤 광고를 거부(Opt-out)</strong>할 수 있습니다. 예시:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li>
                        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline hover:text-sky-300">
                            Google 광고 설정
                        </a>
                        에서 맞춤설정 광고를 끌 수 있습니다.
                    </li>
                    <li>
                        미국 기준 제3자 맞춤 광고 거부 안내:{' '}
                        <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline hover:text-sky-300">
                            www.aboutads.info/choices
                        </a>{' '}
                        (해당 지역·브라우저에서 안내에 따라 이용)
                    </li>
                </ul>
                <p className="text-sm text-slate-500 mt-3">
                    브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
                </p>
            </LegalSection>

            <LegalSection title="4. 이용 목적">
                <p>서비스 제공·개선, 부정 이용 방지, 문의 응대, 통계, <strong className="text-white">광고 표시 및 성과 측정</strong>(설정된 경우)에 활용할 수 있습니다.</p>
            </LegalSection>

            <LegalSection title="5. 보관 및 파기">
                <p>
                    문의 메일 등 이용자가 제공한 정보는 응대 목적 달성 후 합리적인 기간 내 삭제하도록 노력합니다. 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다. 본 사이트의{' '}
                    <strong className="text-emerald-300">클라이언트 전용 분석 기능</strong>으로 처리된 파일 내용은 운영자가 수집하지 않는 것이 원칙입니다.
                </p>
            </LegalSection>

            <LegalSection title="6. 제3자 제공">
                <p>
                    법령에 따르거나 이용자 동의가 있는 경우를 제외하고, 개인정보를 제3자에게 판매·임대하지 않습니다. 광고·분석을 위해 <strong className="text-white">구글 등 광고·분석 사업자</strong>가 쿠키 등을 통해 정보를 처리할 수 있으며, 이는 해당 사업자의 정책을 따릅니다.
                </p>
            </LegalSection>

            <LegalSection title="7. 이용자 권리">
                <p>개인정보 열람·정정·삭제·처리 정지 요구 등은 관련 법령의 절차에 따라 요청할 수 있으며, 문의하기로 연락 주시면 안내하겠습니다.</p>
            </LegalSection>

            <LegalSection title="8. 문의">
                <p>
                    개인정보 처리와 관련한 문의:{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-400 underline">{CONTACT_EMAIL}</a>
                </p>
            </LegalSection>

            <LegalSection title="9. 방침 변경">
                <p className="text-sm text-slate-500">법령·서비스 변경에 따라 본 방침을 수정할 수 있으며, 변경 시 게시합니다.</p>
            </LegalSection>
        </article>
    );
}

/* ---------- 이용약관 ---------- */
function TermsOfService() {
    return (
        <article className="max-w-4xl mx-auto space-y-8 text-slate-300 leading-relaxed">
            <header className="border-b border-slate-700 pb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">이용약관</h1>
                <p className="text-sm text-slate-500">{SITE_URL}</p>
            </header>

            <LegalSection title="제1조 (목적)">
                <p>본 약관은 vaultsheet.com(이하 &quot;본 사이트&quot;)이 제공하는 서비스의 이용 조건 및 절차, 운영자와 이용자 간 권리·의무를 정합니다.</p>
            </LegalSection>

            <LegalSection title="제2조 (저작권 및 지적재산권)">
                <p>
                    본 사이트에 게시된 <strong className="text-white">텍스트, 디자인, 로고, 코드, 이미지, UI</strong> 등에 대한 저작권 및 지적재산권은 운영자 또는 정당한 권리자에게 있습니다. 이용자는 운영자의 사전 서면 동의 없이 이를{' '}
                    <strong className="text-white">복제, 배포, 2차적 저작물 작성, 영리 목적 이용</strong>할 수 없습니다. 개인적·비영리적 이용 범위 내에서의 접근·표시는 본 약관 및 법령이 허용하는 한도에 따릅니다.
                </p>
            </LegalSection>

            <LegalSection title="제3조 (이용자의 의무 및 금지 행위)">
                <p className="mb-2">이용자는 다음 행위를 하여서는 안 됩니다.</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    <li>본 사이트 또는 관련 시스템에 대한 <strong className="text-slate-300">무단 접근, 해킹, 악성코드 유포, 과부하 유발</strong></li>
                    <li>스팸, 허위 정보 유포, 타인의 권리를 침해하는 행위</li>
                    <li><strong className="text-slate-300">불법 목적</strong>으로 본 사이트를 이용하는 행위</li>
                    <li>운영자 또는 제3자의 명예를 훼손하거나 업무를 방해하는 행위</li>
                </ul>
            </LegalSection>

            <LegalSection title="제4조 (서비스의 변경 및 중단)">
                <p>
                    운영자는 <strong className="text-white">운영상·기술상의 사유</strong>로 서비스의 전부 또는 일부를 <strong className="text-white">변경, 일시 중단, 종료</strong>할 수 있습니다. 가능한 사전에 공지하도록 노력하나, 긴급한 경우 사후 공지할 수 있습니다. 이로 인한 이용자의 손해에 대해서는 면책 조항 및 관련 법령이 정하는 바에 따릅니다.
                </p>
            </LegalSection>

            <LegalSection title="제5조 (약관의 변경)">
                <p className="text-sm text-slate-500">운영자는 필요 시 약관을 변경할 수 있으며, 변경 내용을 본 사이트에 게시합니다.</p>
            </LegalSection>

            <LegalSection title="제6조 (준거법)">
                <p className="text-sm text-slate-500">본 약관은 대한민국 법령에 따르며, 분쟁은 관할 법원에 따릅니다.</p>
            </LegalSection>
        </article>
    );
}

/* ---------- 면책 조항 ---------- */
function Disclaimer() {
    return (
        <article className="max-w-4xl mx-auto space-y-8 text-slate-300 leading-relaxed">
            <header className="border-b border-slate-700 pb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">면책 조항 (Disclaimer)</h1>
                <p className="text-sm text-slate-500">{SITE_URL}</p>
            </header>

            <LegalSection title="1. 정보의 일반적 한계">
                <p>
                    본 사이트에서 제공하는 <strong className="text-white">설명, 가이드, 도구 실행 결과</strong>는 <strong className="text-amber-200">참고용</strong>입니다. 운영자는 내용의{' '}
                    <strong className="text-white">완전성·최신성·특정 목적에의 적합성</strong>을 보증하지 않습니다.
                </p>
            </LegalSection>

            <LegalSection title="2. 도구·분석 결과의 참고용">
                <p>
                    통계, 차트, 인사이트, 변환 결과, 샘플 코드 등 <strong className="text-white">모든 자동·반자동 산출물</strong>은 내부 검토·의사결정의 보조 자료로만 활용해야 하며, 금융·법률·의료 등 전문 분야의 최종 판단을 대체하지 않습니다.
                </p>
            </LegalSection>

            <LegalSection title="3. 기술 분석·탐지류 도구에 대한 특칙">
                <p>
                    본 사이트에 <strong className="text-white">이상 탐지, 품질 점수, 상관관계, 분류·예측</strong> 등이 포함된 경우, 그 결과는{' '}
                    <strong className="text-white">참고용 기술 지표</strong>에 불과하며, <strong className="text-rose-300">법적 증거·공식 감정·규제 신고의 유일한 근거</strong>로 사용될 수 없습니다. 결과의{' '}
                    <strong className="text-white">오류·누락·지연</strong>으로 인한 손해에 대해 운영자는 책임을 지지 않습니다.
                </p>
            </LegalSection>

            <LegalSection title="4. 손해배상의 제한">
                <p className="text-sm text-slate-500">
                    관련 법령이 허용하는 최대 한도 내에서, 본 사이트 이용으로 발생한 직접·간접 손해에 대해 운영자의 책임을 제한할 수 있습니다. 필수 규정이 있는 경우 해당 법령을 따릅니다.
                </p>
            </LegalSection>
        </article>
    );
}

/* ---------- 서비스 소개 ---------- */
function AboutService() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-3">VaultSheet</h1>
                <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                    <strong className="text-slate-300">{SITE_URL}</strong>은 브라우저에서 CSV·JSON 데이터를 불러와 필터링, 피벗, 차트, SQL, AI 인사이트 등을 제공하는{' '}
                    <strong className="text-white">올인원 데이터 워크스페이스</strong>입니다. 100개에 가까운 무료 변환·유틸리티 도구를 함께 제공합니다.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
                <FeatureCard icon={<Icon path="M13 10V3L4 14h7v7l9-11h-7z" />} title="성능" desc="클라이언트 측 처리로 민감 데이터를 기기 안에 유지하는 것을 목표로 합니다." />
                <FeatureCard icon={<Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />} title="보안" desc="가능한 한 브라우저 내에서만 연산하도록 설계되었습니다(기능별 상이할 수 있음)." />
                <FeatureCard icon={<Icon path="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />} title="도구 모음" desc="JSON·CSV, 인코딩, 이미지, PDF, 개발자 도구 등 다양한 변환기를 연결해 두었습니다." />
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-center text-slate-400 text-sm leading-relaxed">
                고객센터의 <strong className="text-slate-200">개인정보처리방침·이용약관·면책 조항</strong>을 함께 확인해 주세요.
            </div>
        </div>
    );
}

/* ---------- 문의하기 ---------- */
function ContactSection() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-white mb-2">문의하기</h1>
                <p className="text-slate-400 text-sm">
                    서비스 관련 문의·버그 신고·기능 제안은 아래 이메일로 보내 주세요.
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl">
                    <h3 className="text-xs text-slate-500 font-bold uppercase mb-2">관리자 이메일</h3>
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-xl font-bold text-sky-400 hover:text-sky-300 break-all">
                        {CONTACT_EMAIL}
                    </a>
                    <p className="text-xs text-slate-500 mt-2">영업일 기준 1~2일 내 답변을 목표로 합니다.</p>
                </div>
                <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl">
                    <h3 className="text-xs text-slate-500 font-bold uppercase mb-2">사이트</h3>
                    <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-violet-300 hover:text-violet-200">
                        {SITE_URL}
                    </a>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">자주 묻는 질문</h3>
                <FaqItem q="데이터가 서버로 전송되나요?" a="분석·변환 도구는 원칙적으로 브라우저 내에서 처리됩니다. 광고·접속 분석 등은 개인정보처리방침을 참고하세요." />
                <FaqItem q="도구 추가 요청은?" a="위 문의로 보내 주시면 검토 후 답변 드릴 수 있습니다." />
            </div>
        </div>
    );
}

const LegalSection = ({ title, children }) => (
    <section>
        <h3 className="text-lg font-bold text-white mb-3 border-l-4 border-violet-500 pl-3">{title}</h3>
        <div className="text-sm md:text-[15px] space-y-2">{children}</div>
    </section>
);

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-slate-900/80 border border-slate-700 p-5 rounded-xl hover:border-violet-500/40 transition-colors">
        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-violet-400 mb-3">{icon}</div>
        <h4 className="text-base font-bold text-white mb-1">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

const FaqItem = ({ q, a }) => (
    <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
        <h4 className="text-violet-300 font-bold text-sm mb-1">Q. {q}</h4>
        <p className="text-slate-400 text-sm pl-3 border-l border-slate-600">{a}</p>
    </div>
);

export default ServiceCenter;
