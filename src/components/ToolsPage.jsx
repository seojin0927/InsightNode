import React, { useState, useMemo } from 'react';

const ALL_TOOLS = [
    // ── 통합 스튜디오 ──
    { page: 'colorStudio',          icon: '🎨', title: '색상 스튜디오',           desc: '색상 변환·팔레트·그라데이션·접근성 검사 통합', color: 'pink',   cat: 'design',   hot: true, badge: 'NEW' },
    { page: 'textStudio',           icon: '✏️', title: '텍스트 스튜디오',         desc: '텍스트 통계·케이스 변환·인코딩·숫자 변환',     color: 'blue',   cat: 'text',     hot: true, badge: 'NEW' },
    { page: 'cssStudio',            icon: '🌑', title: 'CSS 스튜디오',            desc: 'Shadow·Radius·Glass·Flexbox·Animation',        color: 'violet', cat: 'design',   hot: true, badge: 'NEW' },
    { page: 'timeStudio',           icon: '🌏', title: '시간 스튜디오',           desc: '세계 시계·타임스탬프·카운트다운·뽀모도로',      color: 'cyan',   cat: 'util',     hot: true, badge: 'NEW' },
    { page: 'utilStudio',           icon: '⚙️', title: '유틸리티 스튜디오',       desc: '해시·대출 계산·비밀번호·파일 해시',              color: 'emerald',cat: 'util',     hot: true, badge: 'NEW' },
    { page: 'securityStudio',       icon: '🔒', title: '보안 스튜디오',           desc: 'chmod·AES 암호화·TOTP 2FA·개인정보 분석',       color: 'red',    cat: 'security', hot: true, badge: 'NEW' },
    { page: 'dataToolsStudio',      icon: '🗂️', title: '데이터 도구 스튜디오',    desc: 'Schema·CSV 비교·행열 전치·데이터 검증',         color: 'violet', cat: 'data',     hot: true, badge: 'NEW' },
    { page: 'excelJsonPage',        icon: '📗', title: 'Excel ↔ JSON 변환',       desc: '.xlsx 파일과 JSON 배열 양방향 변환',            color: 'emerald',cat: 'data',     hot: true  },
    { page: 'csvMergeSplitPage',    icon: '🗃️', title: 'CSV 병합 / 분할',         desc: '여러 CSV 합치기 또는 조건에 따라 분할',         color: 'sky',    cat: 'data',     hot: true  },
    { page: 'diffChecker',          icon: '🔀', title: '텍스트 차이 비교기',      desc: '두 텍스트를 줄 단위로 비교 & 하이라이트',      color: 'amber',  cat: 'text',     hot: true  },
    // ── 데이터 ──
    { page: 'jsonFormatterPage',    icon: '{ }', title: 'JSON 포매터',            desc: '포맷·압축·키 정렬·들여쓰기',                    color: 'emerald', cat: 'data',     hot: true  },
    { page: 'jsonCsvPage',          icon: '↔', title: 'JSON ↔ CSV 변환',         desc: 'JSON·CSV 양방향 즉시 변환',                    color: 'violet', cat: 'data',     hot: true  },
    { page: 'jsonFormatConvertPage', icon: '🔄', title: 'JSON 포맷 변환',          desc: 'JSON↔YAML·TOML·XML 상호 변환',                color: 'orange', cat: 'data'                },
    { page: 'jsonPathPage',         icon: '🔍', title: 'JSON Path 테스터',        desc: 'JSONPath 표현식으로 값 추출',                  color: 'cyan',   cat: 'data'                },
    { page: 'jsonToSqlPage',        icon: '🗄️', title: 'JSON → SQL 생성',         desc: 'INSERT·CREATE TABLE 자동 생성',                color: 'sky',    cat: 'data'                },
    { page: 'encoding',             icon: '🔤', title: '한글 깨짐 복구',          desc: 'EUC-KR ↔ UTF-8 인코딩 변환',                  color: 'amber',  cat: 'text',     hot: true  },
    { page: 'htmlTable',            icon: '🌐', title: '웹 표 추출기',            desc: 'HTML 테이블을 CSV로 한 번에',                  color: 'blue',   cat: 'data'                },
    { page: 'csvToSql',             icon: '🗃️', title: 'CSV → SQL 변환',         desc: 'CSV를 INSERT 문으로 일괄 변환',                 color: 'orange', cat: 'data'                },
    { page: 'listComparator',       icon: '⚖️', title: '목록 비교기',             desc: '교집합/차집합/합집합 분석',                    color: 'rose',   cat: 'data',     hot: true  },
    { page: 'mockDataGenerator',    icon: '🎲', title: 'Mock 데이터 생성',        desc: '한국인 더미 데이터 생성기',                    color: 'violet', cat: 'data'                },
    { page: 'pdfConverter',         icon: '📑', title: 'PDF 변환 스튜디오',       desc: 'PDF 병합/분할/압축/변환 올인원',               color: 'red',    cat: 'data',     hot: true  },
    // ── 텍스트 ──
    { page: 'textExtractor',        icon: '🔍', title: '텍스트 정제 도구',        desc: '이메일/전화번호/URL 자동 추출',                 color: 'purple', cat: 'text'                },
    { page: 'listToComma',          icon: '🔗', title: '줄바꿈 ↔ 쉼표 변환',      desc: '줄바꿈과 쉼표를 상호 변환',                    color: 'cyan',   cat: 'text'                },
    { page: 'markdownEditor',       icon: '✍️', title: '마크다운 에디터',         desc: 'README/블로그 실시간 미리보기',                 color: 'indigo', cat: 'text'                },
    { page: 'loremIpsum',           icon: '📝', title: '더미 텍스트 생성기',       desc: '더미 텍스트 즉시 생성',                        color: 'green',  cat: 'text'                },
    { page: 'morseConverter',       icon: '📡', title: '모스 부호 변환',          desc: '텍스트 ↔ 모스 부호 양방향 변환',               color: 'amber',  cat: 'text'                },
    { page: 'romanNumeral',         icon: '🏛️', title: '로마 숫자 변환',          desc: '아라비아 ↔ 로마 숫자 변환',                    color: 'amber',  cat: 'text'                },
    // ── 개발자 ──
    { page: 'codeMinifier',         icon: '💻', title: '코드 개발 스튜디오',      desc: 'JS/CSS/HTML/SQL 압축·정렬 25+',                color: 'green',  cat: 'dev'                 },
    { page: 'regexTester',          icon: '🔎', title: '정규식 마스터',           desc: '실시간 매칭·치환·코드 생성',                   color: 'cyan',   cat: 'dev',      hot: true  },
    { page: 'uuidGenerator',        icon: '🔑', title: 'ID 생성 스튜디오',        desc: 'UUID/ULID/NanoID/ObjectId 생성',               color: 'slate',  cat: 'dev'                 },
    { page: 'sqlFormatter',         icon: '🗄️', title: 'SQL 포맷터',              desc: 'SQL 코드 정렬 및 최적화',                      color: 'cyan',   cat: 'dev'                 },
    { page: 'numberBase',           icon: '🔢', title: '진법 변환기',             desc: '2진수/8진수/10진수/16진수 변환',               color: 'purple', cat: 'dev'                 },
    { page: 'ogTagGenerator',       icon: '🔗', title: 'OG 태그 생성기',         desc: 'Open Graph 메타태그 자동 생성',                 color: 'sky',    cat: 'dev'                 },
    { page: 'htmlToJsx',            icon: '⚛️', title: 'HTML → JSX 변환기',      desc: 'HTML을 React JSX 컴포넌트로 변환',             color: 'orange', cat: 'dev'                 },
    // ── 미디어 ──
    { page: 'qrCode',               icon: '📱', title: 'QR 코드 생성기',         desc: 'URL/텍스트를 QR 이미지로 즉시 생성',           color: 'teal',   cat: 'media',    hot: true  },
    { page: 'imageCompressor',      icon: '🖼️', title: '이미지 압축 스튜디오',   desc: 'JPEG/PNG/WebP 최대 90% 압축',                  color: 'purple', cat: 'media',    hot: true  },
    { page: 'mediaStudio',          icon: '🖼️', title: '미디어 스튜디오',         desc: '리사이즈·파비콘·색상추출·SVG최적화·워터마크',  color: 'violet', cat: 'media',    hot: true, badge: 'NEW' },
    { page: 'imageTools',           icon: '🖼️', title: '이미지 변환 스튜디오',   desc: '포맷 변환/리사이즈/EXIF 제거',                 color: 'sky',    cat: 'media'               },
    { page: 'videoTools',           icon: '🎬', title: '동영상 변환 스튜디오',   desc: 'MP4/AVI/MOV 변환 & GIF 추출',                  color: 'violet', cat: 'media'               },
    { page: 'zipTools',             icon: '📦', title: '압축 변환 도구',          desc: 'ZIP/RAR/7Z 압축 & 해제',                       color: 'amber',  cat: 'util'                },
    // ── 보안 ──
    { page: 'personalDataMasker',   icon: '🛡️', title: '개인정보 마스킹',         desc: '주민번호/카드/전화/이메일 보호',               color: 'red',    cat: 'security', hot: true  },
    { page: 'cryptoEncoder',        icon: '🔐', title: '암호화 & 인코더',          desc: 'Base64/Hash/JWT/AES 변환',                     color: 'emerald',cat: 'security'            },
    // ── 디자인 ──
    { page: 'digitalStampSignStudio', icon: '🖊️', title: '도장·서명 스튜디오',   desc: 'PDF/이미지에 디지털 도장 & 서명',              color: 'rose',   cat: 'design'              },
    // ── 유틸 ──
    { page: 'calculator',           icon: '🧮', title: '슈퍼 만능 계산기 PRO',    desc: '공학·금융·건강·개발 35가지 계산기',            color: 'blue',   cat: 'util',     hot: true  },
    { page: 'unitConverter',        icon: '📏', title: '단위 마스터 스튜디오',     desc: '12개 카테고리 단위 변환 + 환율',               color: 'yellow', cat: 'util'                },
];

const CATEGORIES = [
    { id: 'all',      label: '전체',      icon: '🔧' },
    { id: 'data',     label: '데이터',    icon: '📊' },
    { id: 'text',     label: '텍스트',    icon: '📝' },
    { id: 'dev',      label: '개발자',    icon: '💻' },
    { id: 'media',    label: '미디어',    icon: '🖼️' },
    { id: 'security', label: '보안',      icon: '🔐' },
    { id: 'design',   label: '디자인',    icon: '🎨' },
    { id: 'util',     label: '유틸리티',  icon: '⚙️' },
];

const COLOR_MAP = {
    sky:     { bg: 'rgba(14,165,233,0.08)',   border: 'rgba(14,165,233,0.2)',   text: '#38bdf8'  },
    violet:  { bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.2)',   text: '#a78bfa'  },
    amber:   { bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)',   text: '#fbbf24'  },
    blue:    { bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.2)',   text: '#60a5fa'  },
    purple:  { bg: 'rgba(168,85,247,0.08)',   border: 'rgba(168,85,247,0.2)',   text: '#c084fc'  },
    cyan:    { bg: 'rgba(6,182,212,0.08)',    border: 'rgba(6,182,212,0.2)',    text: '#22d3ee'  },
    rose:    { bg: 'rgba(244,63,94,0.08)',    border: 'rgba(244,63,94,0.2)',    text: '#fb7185'  },
    red:     { bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)',    text: '#f87171'  },
    teal:    { bg: 'rgba(20,184,166,0.08)',   border: 'rgba(20,184,166,0.2)',   text: '#2dd4bf'  },
    pink:    { bg: 'rgba(236,72,153,0.08)',   border: 'rgba(236,72,153,0.2)',   text: '#f472b6'  },
    green:   { bg: 'rgba(34,197,94,0.08)',    border: 'rgba(34,197,94,0.2)',    text: '#4ade80'  },
    orange:  { bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.2)',   text: '#fb923c'  },
    indigo:  { bg: 'rgba(99,102,241,0.08)',   border: 'rgba(99,102,241,0.2)',   text: '#818cf8'  },
    yellow:  { bg: 'rgba(234,179,8,0.08)',    border: 'rgba(234,179,8,0.2)',    text: '#facc15'  },
    slate:   { bg: 'rgba(100,116,139,0.08)',  border: 'rgba(100,116,139,0.2)',  text: '#94a3b8'  },
    emerald: { bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.2)',   text: '#34d399'  },
};

export default function ToolsPage({ navigateTo }) {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        let tools = activeFilter === 'all' ? ALL_TOOLS : ALL_TOOLS.filter(t => t.cat === activeFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            tools = tools.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.desc.toLowerCase().includes(q) ||
                t.cat.toLowerCase().includes(q)
            );
        }
        return tools;
    }, [activeFilter, searchQuery]);

    const hotTools = ALL_TOOLS.filter(t => t.hot);

    return (
        <div className="w-full h-full text-slate-100 overflow-y-auto custom-scrollbar" style={{ background: '#060c1a' }}>

            <div className="w-full px-4 sm:px-6 pb-16">

                {/* ── HERO ── */}
                <section className="pt-12 pb-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/3 w-[400px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
                    <div className="absolute top-0 right-1/3 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none opacity-15" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 text-violet-400 text-xs font-semibold mb-5" style={{ background: 'rgba(139,92,246,0.07)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            {ALL_TOOLS.length}가지 무료 변환 도구
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-3">
                            <span className="text-slate-100">변환 도구 </span>
                            <span style={{ background: 'linear-gradient(135deg, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>전체 모음</span>
                        </h1>
                        <p className="text-slate-400 text-sm max-w-md mx-auto mb-4 leading-relaxed">
                            설치 없이 브라우저에서 바로 사용하세요.<br />
                            <span className="text-slate-300">100% 오프라인 · 서버 전송 없음 · 완전 무료</span>
                        </p>
                        <button onClick={() => navigateTo('mobile')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8 transition-all hover:scale-105"
                            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                            📱 모바일에서 사용하기
                        </button>

                        {/* 검색창 */}
                        <div className="max-w-md mx-auto relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="도구 검색... (예: JSON, QR, 색상, 압축)"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-slate-200 outline-none transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                                >✕</button>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── HOT TOOLS ── */}
                {!searchQuery && activeFilter === 'all' && (
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-base">🔥</span>
                            <h2 className="text-sm font-bold text-slate-200">인기 도구</h2>
                            <span className="text-xs text-slate-600">많이 사용하는 도구들</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {hotTools.map(tool => {
                                const c = COLOR_MAP[tool.color] || COLOR_MAP.slate;
                                return (
                                    <button
                                        key={`hot-${tool.page}`}
                                        onClick={() => navigateTo(tool.page)}
                                        className="group flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: `1px solid rgba(255,255,255,0.07)`,
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = c.bg;
                                            e.currentTarget.style.borderColor = c.border;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                        }}
                                    >
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-110"
                                            style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                                            {tool.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-xs text-slate-200 leading-tight truncate">{tool.title}</div>
                                            <div className="text-[10px] text-slate-600 mt-0.5 truncate">{tool.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── CATEGORY FILTER ── */}
                <section className="mb-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {CATEGORIES.map(cat => {
                            const count = cat.id === 'all' ? ALL_TOOLS.length : ALL_TOOLS.filter(t => t.cat === cat.id).length;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => { setActiveFilter(cat.id); setSearchQuery(''); }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        activeFilter === cat.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                    style={activeFilter === cat.id
                                        ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.3)', border: '1px solid transparent' }
                                        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }
                                    }
                                >
                                    <span>{cat.icon}</span>
                                    {cat.label}
                                    <span className="opacity-50">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ── TOOLS GRID ── */}
                <section>
                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-slate-600">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-sm">'{searchQuery}'에 해당하는 도구를 찾지 못했어요.</p>
                            <button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }} className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline">
                                전체 도구 보기
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-xs text-slate-600 mb-4">
                                {searchQuery ? `'${searchQuery}' 검색 결과 ` : ''}<span className="text-slate-400 font-semibold">{filtered.length}</span>개 도구
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
                                {filtered.map(tool => {
                                    const c = COLOR_MAP[tool.color] || COLOR_MAP.slate;
                                    return (
                                        <button
                                            key={tool.page}
                                            onClick={() => navigateTo(tool.page)}
                                            className="group flex flex-col gap-3 p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] relative"
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = c.bg;
                                                e.currentTarget.style.borderColor = c.border;
                                                e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3)`;
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {tool.badge ? (
                                                <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-indigo-400" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                                    {tool.badge}
                                                </span>
                                            ) : tool.hot && (
                                                <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-orange-400" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                                                    HOT
                                                </span>
                                            )}
                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform group-hover:scale-110"
                                                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                                                {tool.icon}
                                            </div>
                                            <div className="min-w-0 w-full">
                                                <div className="font-semibold text-xs text-slate-300 leading-tight group-hover:text-white transition-colors" style={{ color: undefined }}>
                                                    {tool.title}
                                                </div>
                                                <div className="text-[10px] text-slate-600 mt-1 leading-tight line-clamp-2">{tool.desc}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                {/* ── FOOTER ── */}
                <footer className="mt-16 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <img src="/logo.svg" alt="VaultSheet" className="w-4 h-4 rounded opacity-30" />
                        <span className="text-[11px] text-slate-700">© 2024 VaultSheet · All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span>100% Client-Side · No Server · No Tracking</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
