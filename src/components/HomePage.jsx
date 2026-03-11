import React, { useState, useRef } from 'react';

const DATASET_TOOLS = [
    { icon: '📊', title: 'SQL 쿼리 분석', desc: '브라우저에서 직접 SQL 실행' },
    { icon: '📋', title: '결과 그리드', desc: '인터랙티브 데이터 테이블' },
    { icon: '🔄', title: '피벗 테이블', desc: '다차원 데이터 분석' },
    { icon: '📈', title: '차트 시각화', desc: '막대/선/원형 차트' },
    { icon: '✨', title: '매직 변환', desc: '60+ 데이터 변환 작업' },
    { icon: '🛡️', title: '100% 오프라인', desc: 'WASM 엔진, 데이터 유출 없음' },
];

const CONVERSION_TOOLS = [
    // ── 통합 스튜디오 (NEW) ──
    { page: 'colorStudio',          icon: '🎨', title: '컬러 스튜디오',        desc: '색상 변환·팔레트·그라데이션·접근성',   color: 'pink',   cat: 'design',   badge: 'NEW' },
    { page: 'textStudio',           icon: '✏️', title: '텍스트 스튜디오',      desc: '텍스트 통계·케이스 변환·인코딩',       color: 'blue',   cat: 'text',     badge: 'NEW' },
    { page: 'cssStudio',            icon: '🌑', title: 'CSS 스튜디오',          desc: '박스 그림자·모서리·글래스·플렉스·애니메이션', color: 'violet', cat: 'design',   badge: 'NEW' },
    { page: 'timeStudio',           icon: '🌏', title: '시간 스튜디오',         desc: '세계 시계·타임스탬프·카운트다운·뽀모도로', color: 'cyan',   cat: 'util',     badge: 'NEW' },
    { page: 'utilStudio',           icon: '⚙️', title: '유틸리티 스튜디오',    desc: '해시·대출·비밀번호·파일 해시',          color: 'emerald',cat: 'util',     badge: 'NEW' },
    { page: 'securityStudio',       icon: '🔒', title: '보안 스튜디오',         desc: 'chmod·AES 암호화·OTP 2FA·개인정보',     color: 'red',    cat: 'security', badge: 'NEW' },
    { page: 'dataToolsStudio',      icon: '🗂️', title: '데이터 도구 스튜디오', desc: 'Excel→JSON·CSV 병합·스키마·비교·전치', color: 'violet', cat: 'data',     badge: 'NEW' },
    // ── 데이터 ──
    { page: 'jsonFormatterPage',    icon: '🧹', title: 'JSON 포매터',          desc: '포맷·압축·키 정렬·들여쓰기',            color: 'emerald', cat: 'data'    },
    { page: 'jsonCsvPage',          icon: '↔', title: 'JSON ↔ CSV',           desc: 'JSON·CSV 양방향 즉시 변환',            color: 'violet', cat: 'data'    },
    { page: 'jsonFormatConvertPage',icon: '🔄', title: 'JSON 포맷 변환',       desc: 'JSON↔YAML·TOML·XML 상호 변환',        color: 'orange', cat: 'data'    },
    { page: 'jsonPathPage',         icon: '🔍', title: 'JSON Path',           desc: 'JSONPath 표현식으로 값 추출',          color: 'cyan',   cat: 'data'    },
    { page: 'jsonToSqlPage',        icon: '🗄️', title: 'JSON → SQL',          desc: 'INSERT·CREATE TABLE 자동 생성',        color: 'sky',    cat: 'data'    },
    { page: 'encoding',             icon: '🔤', title: '한글 깨짐 복구',      desc: 'EUC-KR ↔ UTF-8 변환',              color: 'amber',  cat: 'text'    },
    { page: 'htmlTable',            icon: '🌐', title: '웹 표 추출',          desc: 'HTML 테이블 → CSV',                 color: 'blue',   cat: 'data'    },
    { page: 'csvToSql',             icon: '🗃️', title: 'CSV ↔ SQL',           desc: 'CSV와 INSERT 문 양방향 변환',        color: 'orange', cat: 'data'    },
    { page: 'listComparator',       icon: '⚖️', title: '목록 비교',           desc: '두 목록의 차이/교집합',             color: 'rose',   cat: 'data'    },
    { page: 'mockDataGenerator',    icon: '🎲', title: 'Mock 데이터 생성',    desc: '테스트용 더미 데이터',              color: 'violet', cat: 'data'    },
    { page: 'pdfConverter',         icon: '📑', title: 'PDF 변환',            desc: 'PDF ↔ 이미지/병합/분할',            color: 'red',    cat: 'data'    },
    // ── 텍스트 ──
    { page: 'diffChecker',          icon: '🔀', title: '텍스트 차이 비교',    desc: '두 텍스트 줄 단위 차이 비교',       color: 'amber',  cat: 'text'    },
    { page: 'textExtractor',        icon: '🔍', title: '텍스트 정제',         desc: '이메일/전화번호 자동 추출',         color: 'purple', cat: 'text'    },
    { page: 'listToComma',          icon: '🔗', title: '줄바꿈 변환',         desc: '쉼표 ↔ 줄바꿈 상호 변환',          color: 'cyan',   cat: 'text'    },
    { page: 'markdownEditor',       icon: '✍️', title: '마크다운 에디터',     desc: '실시간 미리보기',                   color: 'indigo', cat: 'text'    },
    { page: 'loremIpsum',           icon: '📝', title: 'Lorem Ipsum 생성',    desc: '더미 텍스트 생성기',                color: 'green',  cat: 'text'    },
    { page: 'morseConverter',       icon: '📡', title: '모스 부호',           desc: '텍스트 ↔ 모스 부호 변환',           color: 'amber',  cat: 'text'    },
    { page: 'romanNumeral',         icon: '🏛️', title: '로마 숫자 변환',      desc: '아라비아 ↔ 로마 숫자',              color: 'amber',  cat: 'text'    },
    // ── 개발자 ──
    { page: 'codeMinifier',         icon: '💻', title: '코드 스튜디오',       desc: 'JS/CSS/HTML 압축·정렬',             color: 'green',  cat: 'dev'     },
    { page: 'regexTester',          icon: '🔎', title: '정규식 테스터',       desc: '패턴 매칭·검증·추출',               color: 'cyan',   cat: 'dev'     },
    { page: 'uuidGenerator',        icon: '🔑', title: 'ID 마스터',           desc: 'UUID/ULID/NanoID 생성',             color: 'slate',  cat: 'dev'     },
    { page: 'sqlFormatter',         icon: '🗄️', title: 'SQL 포맷터',          desc: 'SQL 코드 정렬 및 최적화',           color: 'cyan',   cat: 'dev'     },
    { page: 'numberBase',           icon: '🔢', title: '진법 변환기',         desc: '2진수/8진수/16진수 변환',            color: 'purple', cat: 'dev'     },
    { page: 'ogTagGenerator',       icon: '🔗', title: 'OG 태그 생성기',     desc: 'Open Graph 메타태그 생성',           color: 'sky',    cat: 'dev'     },
    { page: 'htmlToJsx',            icon: '⚛️', title: 'HTML → JSX',          desc: 'React 컴포넌트로 변환',             color: 'orange', cat: 'dev'     },
    // ── 미디어 ──
    { page: 'qrCode',               icon: '📱', title: 'QR 코드 생성',        desc: 'URL/텍스트 → QR 이미지',            color: 'teal',   cat: 'media'   },
    { page: 'imageCompressor',      icon: '🖼️', title: '이미지 압축',         desc: 'JPEG/PNG/WebP 최적화',              color: 'purple', cat: 'media'   },
    { page: 'imageTools',           icon: '🖼️', title: '이미지 변환',         desc: '형식 변환/리사이즈/회전',           color: 'sky',    cat: 'media'   },
    { page: 'videoTools',           icon: '🎬', title: '동영상 변환',         desc: '브라우저 기반 영상 처리',           color: 'violet', cat: 'media'   },
    { page: 'zipTools',             icon: '📦', title: '압축 도구',           desc: 'ZIP 압축·해제·관리',                color: 'amber',  cat: 'util'    },
    // ── 보안 ──
    { page: 'personalDataMasker',   icon: '🛡️', title: '개인정보 마스킹',     desc: '이름/전화/이메일 마스킹',           color: 'red',    cat: 'security'},
    { page: 'cryptoEncoder',        icon: '🔐', title: '암호화 & 인코더',     desc: 'Base64/Hash/JWT 변환',             color: 'emerald',cat: 'security'},
    // ── 디자인 ──
    { page: 'digitalStampSignStudio',icon: '🖊️', title: '도장·서명 스튜디오', desc: '디지털 도장 및 전자 서명',          color: 'rose',   cat: 'design'  },
    // ── 유틸 ──
    { page: 'calculator',           icon: '🧮', title: '만능 계산기',         desc: '과학계산·금융·건강·개발 35+',      color: 'blue',   cat: 'util'    },
    { page: 'unitConverter',        icon: '📏', title: '단위 변환기',         desc: '길이/무게/온도/환율 12개 카테고리', color: 'yellow', cat: 'util'    },
    { page: 'excelToJson',          icon: '📗', title: 'Excel → JSON',        desc: 'xlsx 파일을 JSON으로 변환',         color: 'green',  cat: 'data'    },
];

const CATEGORIES = [
    { id: 'data',     label: '데이터',  icon: '📊' },
    { id: 'text',     label: '텍스트',  icon: '📝' },
    { id: 'dev',      label: '개발자',  icon: '💻' },
    { id: 'media',    label: '미디어',  icon: '🖼️' },
    { id: 'security', label: '보안',    icon: '🔐' },
    { id: 'design',   label: '디자인',  icon: '🎨' },
    { id: 'util',     label: '유틸리티',icon: '⚙️' },
];

const COLOR_MAP = {
    sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/25',     text: 'text-sky-400',     glow: 'shadow-sky-500/20'     },
    violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/25',  text: 'text-violet-400',  glow: 'shadow-violet-500/20'  },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   text: 'text-amber-400',   glow: 'shadow-amber-500/20'   },
    blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/25',    text: 'text-blue-400',    glow: 'shadow-blue-500/20'    },
    purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/25',  text: 'text-purple-400',  glow: 'shadow-purple-500/20'  },
    cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/25',    text: 'text-cyan-400',    glow: 'shadow-cyan-500/20'    },
    rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    text: 'text-rose-400',    glow: 'shadow-rose-500/20'    },
    red:     { bg: 'bg-red-500/10',     border: 'border-red-500/25',     text: 'text-red-400',     glow: 'shadow-red-500/20'     },
    teal:    { bg: 'bg-teal-500/10',    border: 'border-teal-500/25',    text: 'text-teal-400',    glow: 'shadow-teal-500/20'    },
    pink:    { bg: 'bg-pink-500/10',    border: 'border-pink-500/25',    text: 'text-pink-400',    glow: 'shadow-pink-500/20'    },
    green:   { bg: 'bg-green-500/10',   border: 'border-green-500/25',   text: 'text-green-400',   glow: 'shadow-green-500/20'   },
    orange:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  text: 'text-orange-400',  glow: 'shadow-orange-500/20'  },
    indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/25',  text: 'text-indigo-400',  glow: 'shadow-indigo-500/20'  },
    yellow:  { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/25',  text: 'text-yellow-400',  glow: 'shadow-yellow-500/20'  },
    slate:   { bg: 'bg-slate-500/10',   border: 'border-slate-500/25',   text: 'text-slate-400',   glow: 'shadow-slate-500/20'   },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
};

export default function HomePage({ navigateTo, showAllTools = false }) {
    const [activeFilter, setActiveFilter] = useState('data');
    const [hoveredTool, setHoveredTool] = useState(null);
    const toolsSectionRef = useRef(null);

    const filtered = CONVERSION_TOOLS.filter(t => t.cat === activeFilter);

    const scrollToTools = () => {
        toolsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="w-full h-full text-slate-100 overflow-y-auto custom-scrollbar" style={{ background: '#060c1a' }}>

            {/* ══ NAVBAR ══ */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-14 border-b border-white/5 backdrop-blur-xl" style={{ background: 'rgba(6,12,26,0.85)' }}>
                <div className="flex items-center gap-3">
                    <img src="/logo.svg" alt="VS" className="w-7 h-7 rounded-lg" />
                    <span className="font-bold text-slate-100 tracking-tight">VaultSheet</span>
                    <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-sky-400 border border-sky-500/30" style={{ background: 'rgba(14,165,233,0.08)' }}>
                        OFFLINE
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => navigateTo('main')} className="px-4 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all font-medium">
                        데이터셋
                    </button>
                    <button onClick={() => navigateTo('tools')} className="px-4 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all font-medium">
                        변환 도구
                    </button>
                    <button onClick={() => navigateTo('serviceCenter')} className="px-4 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all font-medium">
                        고객센터
                    </button>
                    <button
                        onClick={() => navigateTo('main')}
                        className="ml-2 px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
                    >
                        시작하기 →
                    </button>
                </div>
            </nav>

            <div className="w-full px-4 sm:px-6 pb-16">

                {/* ══ HERO ══ */}
                <section className="relative flex flex-col items-center justify-center text-center pt-16 pb-14 overflow-hidden">
                    {/* 배경 orbs */}
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

                    <div className="relative z-10">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/30 text-sky-400 text-xs font-semibold mb-7 tracking-wide"
                            style={{ background: 'rgba(14,165,233,0.07)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                            100% Offline · WASM Engine · 데이터 유출 0건
                        </div>

                        {/* Title */}
                        <h1 className="text-6xl font-black tracking-tight mb-4 leading-none">
                            <span className="text-slate-100">Vault</span>
                            <span style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sheet</span>
                        </h1>

                        {/* Sub */}
                        <p className="text-slate-400 text-lg max-w-lg mx-auto mb-3 leading-relaxed">
                            브라우저에서 바로 실행되는<br />
                            <span className="text-slate-200 font-semibold">데이터 분석 & 변환 올인원 도구</span>
                        </p>
                        <p className="text-sm text-emerald-400/80 mb-10">
                            ✓ 설치 불필요 &nbsp;·&nbsp; ✓ 서버 전송 없음 &nbsp;·&nbsp; ✓ 완전 무료
                        </p>

                        {/* CTA */}
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <button
                                onClick={() => navigateTo('main')}
                                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 8px 32px rgba(14,165,233,0.3)' }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                                데이터셋 열기
                            </button>
                            <button
                                onClick={scrollToTools}
                                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-slate-300 border border-white/10 hover:border-white/20 hover:text-white transition-all hover:scale-105"
                                style={{ background: 'rgba(255,255,255,0.04)' }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                변환 도구 보기
                            </button>
                            <button
                                onClick={() => navigateTo('serviceCenter')}
                                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-slate-300 border border-white/10 hover:border-white/20 hover:text-white transition-all hover:scale-105"
                                style={{ background: 'rgba(255,255,255,0.04)' }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                고객센터
                            </button>
                        </div>
                    </div>
                </section>


                {/* ══ DATASET SECTION ══ */}
                <section className="mb-14">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)' }}>📊</div>
                            <div>
                                <h2 className="text-base font-bold text-slate-100">데이터셋 도구</h2>
                                <p className="text-xs text-slate-600 mt-0.5">CSV/JSON 파일을 불러와 SQL 쿼리, 피벗, 차트를 즉시 생성</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigateTo('main')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-sky-400 border border-sky-500/25 hover:border-sky-500/50 hover:text-sky-300 transition-all"
                            style={{ background: 'rgba(14,165,233,0.06)' }}
                        >
                            열기
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div
                        onClick={() => navigateTo('main')}
                        className="group relative rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-sky-500/30"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.04), transparent)' }} />
                        <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {DATASET_TOOLS.map((tool, i) => (
                                <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.04] group-hover:border-sky-500/15 transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <span className="text-lg shrink-0">{tool.icon}</span>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-slate-200 text-xs leading-tight">{tool.title}</div>
                                        <div className="text-[10px] text-slate-600 mt-0.5 leading-tight truncate">{tool.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-4 flex items-center justify-center gap-1.5 text-sky-400/70 text-xs font-medium group-hover:text-sky-400 transition-colors">
                            <span>클릭하여 데이터셋 도구 열기</span>
                            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                </section>

                {/* ══ TOOLS SECTION ══ */}
                <section id="tools-section" ref={toolsSectionRef} className="mb-14">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>🔧</div>
                            <div>
                                <h2 className="text-base font-bold text-slate-100">변환 도구</h2>
                                <p className="text-xs text-slate-600 mt-0.5">파일 변환, 텍스트 처리, 암호화, 이미지 편집 등</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-violet-400 border border-violet-500/25" style={{ background: 'rgba(139,92,246,0.08)' }}>
                            {CONVERSION_TOOLS.length}가지
                        </span>
                    </div>

                    {/* 전체 도구 페이지 링크 */}
                    <div className="mb-5 p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="text-violet-400">🔧</span>
                            <span>모든 도구를 한 곳에서 검색하고 찾아보세요</span>
                        </div>
                        <button
                            onClick={() => navigateTo('tools')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-300 hover:text-white transition-all hover:scale-105"
                            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}
                        >
                            전체 모음 보기
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* 카테고리 필터 */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-5">
                        {CATEGORIES.map(cat => {
                            const count = cat.id === 'all' ? CONVERSION_TOOLS.length : CONVERSION_TOOLS.filter(t => t.cat === cat.id).length;
                            return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveFilter(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    activeFilter === cat.id
                                        ? 'text-white'
                                        : 'text-slate-500 hover:text-slate-300 border border-white/[0.04] hover:border-white/[0.08]'
                                }`}
                                style={activeFilter === cat.id
                                    ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.3)' }
                                    : { background: 'rgba(255,255,255,0.02)' }
                                }
                            >
                                <span>{cat.icon}</span>
                                {cat.label}
                                <span className="ml-0.5 opacity-50">{count}</span>
                            </button>
                            );
                        })}
                    </div>

                    {/* 도구 그리드 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                        {filtered.map((tool) => {
                            const c = COLOR_MAP[tool.color] || COLOR_MAP.slate;
                            const isHov = hoveredTool === tool.page;
                            return (
                                <button
                                    key={tool.page}
                                    onClick={() => navigateTo(tool.page)}
                                    onMouseEnter={() => setHoveredTool(tool.page)}
                                    onMouseLeave={() => setHoveredTool(null)}
                                    className="group flex flex-col items-start gap-2.5 p-3.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] relative"
                                    style={{
                                        background: isHov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isHov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                                        boxShadow: isHov ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
                                    }}
                                >
                                    {tool.badge && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold text-indigo-400" style={{background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)'}}>{tool.badge}</span>}
                                    <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center text-base group-hover:scale-110 transition-transform`}>
                                        {tool.icon}
                                    </div>
                                    <div className="min-w-0 w-full">
                                        <div className={`font-semibold text-xs leading-tight ${isHov ? c.text : 'text-slate-300'} transition-colors`}>
                                            {tool.title}
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5 truncate leading-tight">{tool.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ══ CUSTOMER CENTER ══ */}
                <section className="mb-14">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>💬</div>
                            <div>
                                <h2 className="text-base font-bold text-slate-100">고객센터</h2>
                                <p className="text-xs text-slate-600 mt-0.5">문의, 버그 리포트, 기능 제안 및 이용 가이드</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigateTo('serviceCenter')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-500/25 hover:border-emerald-500/50 transition-all"
                            style={{ background: 'rgba(52,211,153,0.06)' }}
                        >
                            열기
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div
                        onClick={() => navigateTo('serviceCenter')}
                        className="group relative rounded-2xl p-6 cursor-pointer transition-all duration-300"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.04), transparent)' }} />
                        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { icon: '📨', title: '1:1 문의', desc: '이용 중 불편한 점을 직접 문의해 주세요.' },
                                { icon: '🐛', title: '버그 리포트', desc: '발견한 버그는 빠르게 수정해 드립니다.' },
                                { icon: '💡', title: '기능 제안', desc: '원하는 기능 아이디어를 자유롭게 제안해 주세요.' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.04] group-hover:border-emerald-500/15 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <span className="text-2xl shrink-0">{item.icon}</span>
                                    <div>
                                        <div className="font-semibold text-slate-200 text-sm mb-0.5">{item.title}</div>
                                        <div className="text-xs text-slate-600 leading-relaxed">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-4 flex items-center justify-center gap-1.5 text-emerald-400/70 text-xs font-medium group-hover:text-emerald-400 transition-colors">
                            <span>클릭하여 고객센터 열기</span>
                            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                </section>

                {/* ══ FOOTER ══ */}
                <footer className="pt-6 border-t border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.svg" alt="VaultSheet" className="w-5 h-5 rounded opacity-30" />
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
