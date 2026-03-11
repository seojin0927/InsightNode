import React, { useState } from 'react';

// 모바일에서 사용 가능한 변환 도구 목록
const MOBILE_TOOLS = [
    {
        category: '텍스트 & 케이스',
        icon: '✏️',
        color: '#6366f1',
        tools: [
            { page: 'textStudio', icon: '📊', title: 'Text Studio', desc: '텍스트 통계 · 케이스 변환 · Base64 인코딩', tab: null },
        ]
    },
    {
        category: '색상 & 디자인',
        icon: '🎨',
        color: '#ec4899',
        tools: [
            { page: 'colorStudio', icon: '🎨', title: 'Color Studio', desc: 'HEX/RGB/HSL 변환 · 팔레트 · 그라데이션' },
            { page: 'cssStudio', icon: '🌑', title: 'CSS Studio', desc: 'Box Shadow · Border Radius · Glassmorphism' },
        ]
    },
    {
        category: '시간 & 날짜',
        icon: '🌏',
        color: '#06b6d4',
        tools: [
            { page: 'timeStudio', icon: '🌍', title: 'Time Studio', desc: '세계 시계 · 타임스탬프 · 뽀모도로 · 날짜 계산' },
        ]
    },
    {
        category: '개발자 도구',
        icon: '🛠️',
        color: '#f59e0b',
        tools: [
        ]
    },
    {
        category: '유틸리티',
        icon: '⚙️',
        color: '#10b981',
        tools: [
            { page: 'utilStudio', icon: '⚙️', title: 'Utility Studio', desc: '해시 생성 · 환율 · 비밀번호 · 파일 해시' },
            { page: 'qrCode', icon: '📱', title: 'QR 코드 생성', desc: 'URL/텍스트를 QR 이미지로 변환' },
            { page: 'unitConverter', icon: '📏', title: '단위 변환기', desc: '길이 · 무게 · 온도 12개 카테고리' },
            { page: 'calculator', icon: '🧮', title: '만능 계산기', desc: '과학 · 금융 · 건강 계산기 35+' },
        ]
    },
    {
        category: '텍스트 변환',
        icon: '🔤',
        color: '#8b5cf6',
        tools: [
            { page: 'diffChecker', icon: '🔀', title: '텍스트 비교', desc: '두 텍스트 차이 줄 단위 비교' },
            { page: 'markdownEditor', icon: '✍️', title: '마크다운 에디터', desc: '실시간 미리보기' },
            { page: 'listToComma', icon: '🔗', title: '줄바꿈 ↔ 쉼표', desc: '목록 형식 상호 변환' },
            { page: 'morseConverter', icon: '📡', title: '모스 부호', desc: '텍스트 ↔ 모스 부호' },
            { page: 'romanNumeral', icon: '🏛️', title: '로마 숫자', desc: '아라비아 ↔ 로마 숫자' },
            { page: 'loremIpsum', icon: '📝', title: 'Lorem Ipsum', desc: '더미 텍스트 생성기' },
        ]
    },
    {
        category: '보안',
        icon: '🔒',
        color: '#ef4444',
        tools: [
            { page: 'securityStudio', icon: '🔒', title: 'Security Studio', desc: 'chmod · AES 암호화 · OTP 2FA' },
            { page: 'cryptoEncoder', icon: '🔐', title: '암호화 & 인코더', desc: 'Base64 · Hash · AES 변환' },
        ]
    },
    {
        category: '데이터',
        icon: '📊',
        color: '#f97316',
        tools: [
            { page: 'dataFormatStudio', icon: '📊', title: 'Data Format Studio', desc: 'JSON 포매터 · CSV · YAML/XML 변환' },
            { page: 'numberBase', icon: '🔢', title: '진법 변환기', desc: '2진수 · 8진수 · 16진수' },
        ]
    },
];

// 데스크탑 전용 기능 안내
const DESKTOP_FEATURES = [
    { icon: '🗄️', title: 'SQL 분석 엔진', desc: 'WASM 기반 브라우저 SQLite · 복잡한 쿼리 실행' },
    { icon: '📊', title: '피벗 테이블', desc: '대용량 CSV 다차원 분석 및 요약' },
    { icon: '📈', title: '인터랙티브 차트', desc: '막대 · 선 · 원형 · 레이더 시각화' },
    { icon: '⚡', title: '노코드 빌더', desc: '60+ 데이터 변환 작업 자동화' },
    { icon: '📑', title: 'PDF 변환 스튜디오', desc: 'PDF 병합 · 분할 · 압축 · 변환' },
    { icon: '🎬', title: '동영상 변환', desc: 'MP4/AVI/MOV 형식 변환 · GIF 추출' },
];

export default function MobilePage({ navigateTo }) {
    const [activeCategory, setActiveCategory] = useState(null);

    return (
        <div className="min-h-screen overflow-y-auto custom-scrollbar" style={{ background: 'linear-gradient(150deg, #020813 0%, #070d20 55%, #030a18 100%)' }}>
            {/* 배경 장식 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
                <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
            </div>

            <div className="relative px-4 py-6 max-w-lg mx-auto" style={{ zIndex: 1 }}>
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo.svg" alt="InsightNode" className="w-9 h-9 rounded-xl" onError={e => { e.target.style.display = 'none'; }} />
                        <div>
                            <div className="text-base font-black text-white">InsightNode</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">모바일 도구 센터</div>
                        </div>
                    </div>
                    <button onClick={() => navigateTo('home')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        홈
                    </button>
                </div>

                {/* 데스크탑 유도 배너 */}
                <div className="mb-6 p-5 rounded-2xl border" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', borderColor: 'rgba(99,102,241,0.25)' }}>
                    <div className="flex items-start gap-3">
                        <div className="text-3xl shrink-0">🖥️</div>
                        <div className="flex-1">
                            <div className="font-black text-white text-sm mb-1">완벽한 데이터 분석은 PC에서</div>
                            <div className="text-xs text-slate-400 leading-relaxed">
                                SQL 엔진, 피벗 테이블, 차트 시각화, 대용량 데이터 처리 등 고급 기능은 데스크탑 브라우저에서 최상의 경험을 제공합니다.
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-1.5">
                        {DESKTOP_FEATURES.map(f => (
                            <div key={f.title} className="px-3 py-2 rounded-xl flex items-center gap-2"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="text-sm shrink-0">{f.icon}</span>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-300">{f.title}</div>
                                    <div className="text-[9px] text-slate-600 leading-tight">{f.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 모바일 도구 섹션 */}
                <div className="mb-4">
                    <div className="text-sm font-black text-white mb-1">📱 모바일 변환 도구</div>
                    <div className="text-xs text-slate-500">모바일에서 완벽하게 사용 가능한 도구들입니다</div>
                </div>

                <div className="space-y-3">
                    {MOBILE_TOOLS.map(cat => (
                        <div key={cat.category} className="rounded-2xl border overflow-hidden"
                            style={{ background: 'rgba(8,13,28,0.85)', borderColor: 'rgba(255,255,255,0.07)' }}>
                            {/* 카테고리 헤더 */}
                            <button
                                onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                                className="w-full px-4 py-3.5 flex items-center justify-between"
                                style={{ background: activeCategory === cat.category ? `${cat.color}10` : 'transparent' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                                        style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}>
                                        {cat.icon}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-white">{cat.category}</div>
                                        <div className="text-[10px] text-slate-500">{cat.tools.length}개 도구</div>
                                    </div>
                                </div>
                                <svg className={`w-4 h-4 text-slate-500 transition-transform ${activeCategory === cat.category ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {/* 도구 목록 */}
                            {activeCategory === cat.category && (
                                <div className="border-t border-white/5">
                                    {cat.tools.map(tool => (
                                        <button key={tool.page} onClick={() => navigateTo(tool.page)}
                                            className="w-full px-4 py-3 flex items-center gap-3 transition-all border-b border-white/5 last:border-0 hover:bg-white/5 active:bg-white/10">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                                                style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}>
                                                {tool.icon}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="text-sm font-bold text-slate-200">{tool.title}</div>
                                                <div className="text-[11px] text-slate-500 truncate">{tool.desc}</div>
                                            </div>
                                            <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 전체 도구 목록 버튼 */}
                <button onClick={() => navigateTo('tools')}
                    className="w-full mt-5 py-4 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(139,92,246,0.8))', border: '1px solid rgba(99,102,241,0.3)' }}>
                    🔧 전체 변환 도구 목록 보기
                </button>

                {/* 하단 여백 */}
                <div className="h-8" />
            </div>
        </div>
    );
}
