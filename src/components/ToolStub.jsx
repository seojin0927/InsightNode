import React from 'react';

const TOOL_META = {
    // ── 데이터 ──
    excelToJson:     { icon: '📗', title: 'Excel → JSON 변환',     desc: 'xlsx/xls 파일을 JSON으로 즉시 변환', cat: '데이터', color: '#34d399' },
    csvMerger:       { icon: '🔗', title: 'CSV 파일 병합',          desc: '여러 CSV 파일을 하나로 합치기', cat: '데이터', color: '#60a5fa' },
    dataValidator:   { icon: '✅', title: '데이터 유효성 검사기',   desc: '컬럼 타입·범위·형식 일괄 검사', cat: '데이터', color: '#34d399' },
    schemaBuilder:   { icon: '🏗️', title: 'JSON Schema 빌더',       desc: 'JSON 데이터에서 스키마 자동 생성', cat: '데이터', color: '#fbbf24' },
    csvDiff:         { icon: '↔️', title: 'CSV 파일 비교',           desc: '두 CSV 파일 차이 분석 & 하이라이트', cat: '데이터', color: '#f87171' },
    jsonToExcel:     { icon: '📊', title: 'JSON → Excel 변환',      desc: 'JSON 배열을 xlsx로 내보내기', cat: '데이터', color: '#34d399' },
    csvPivot:        { icon: '🔄', title: 'CSV 피벗 생성기',        desc: 'CSV에서 피벗 테이블 즉시 생성', cat: '데이터', color: '#a78bfa' },
    dataTranspose:   { icon: '⟳', title: '행/열 전환기',            desc: '데이터 행과 열을 전치(transpose)', cat: '데이터', color: '#fb923c' },
    tomlJson:        { icon: '⚙️', title: 'TOML ↔ JSON 변환',       desc: 'TOML/JSON 상호 변환', cat: '데이터', color: '#60a5fa' },
    jsonFlattener:   { icon: '📐', title: 'JSON 평탄화 도구',       desc: '중첩 JSON을 플랫 구조로 변환', cat: '데이터', color: '#fbbf24' },
    csvColumnMapper: { icon: '🗂️', title: 'CSV 컬럼 매퍼',          desc: '컬럼명 일괄 변경 & 순서 조정', cat: '데이터', color: '#c084fc' },
    // ── 텍스트 ──
    diffChecker:     { icon: '🔀', title: '텍스트 차이 비교기',     desc: '두 텍스트의 차이를 줄 단위로 비교', cat: '텍스트', color: '#fbbf24' },
    wordCounter:     { icon: '📝', title: '단어/문자 카운터',       desc: '글자·단어·문장·공백 실시간 카운트', cat: '텍스트', color: '#60a5fa' },
    caseConverter:   { icon: '🔡', title: '케이스 변환기',          desc: 'camelCase·snake_case·PascalCase 변환', cat: '텍스트', color: '#a78bfa' },
    textToSlug:      { icon: '🔗', title: 'URL 슬러그 생성기',      desc: '텍스트를 URL 친화적 슬러그로 변환', cat: '텍스트', color: '#34d399' },
    numberToWords:   { icon: '🔢', title: '숫자 → 한글 변환',       desc: '금액·순서수를 한글로 표기', cat: '텍스트', color: '#fbbf24' },
    textTemplate:    { icon: '📋', title: '텍스트 템플릿 엔진',     desc: '변수를 이용한 텍스트 일괄 생성', cat: '텍스트', color: '#fb923c' },
    textStatistics:  { icon: '📊', title: '텍스트 통계 분석기',     desc: '가독성·복잡도·단어 빈도 분석', cat: '텍스트', color: '#c084fc' },
    // ── 개발자 ──
    jwtDecoder:      { icon: '🔑', title: 'JWT 디코더 & 검증',      desc: 'JWT 토큰 파싱·서명 검증·만료 확인', cat: '개발자', color: '#fbbf24' },
    httpStatus:      { icon: '🌐', title: 'HTTP 상태코드 사전',     desc: '200·404·500 등 모든 HTTP 코드 설명', cat: '개발자', color: '#60a5fa' },
    htmlEncoder:     { icon: '🔤', title: 'HTML 엔티티 인코더',     desc: '특수문자 ↔ HTML 엔티티 변환', cat: '개발자', color: '#fb923c' },
    semverHelper:    { icon: '🏷️', title: 'Semver 버전 관리',       desc: '시맨틱 버전 파싱·비교·유효성 검사', cat: '개발자', color: '#34d399' },
    cssUnit:         { icon: '📏', title: 'CSS 단위 변환기',         desc: 'px·em·rem·vw 상호 변환', cat: '개발자', color: '#a78bfa' },
    colorCodeHelper: { icon: '🎨', title: '색상 코드 도우미',       desc: 'CSS 색상명·HEX·RGB 즉시 조회', cat: '개발자', color: '#ec4899' },
    apiTester:       { icon: '🌐', title: 'API 요청 테스터',         desc: 'GET/POST/PUT 요청 즉시 테스트', cat: '개발자', color: '#60a5fa' },
    charsetConverter:{ icon: '🔤', title: '문자셋 변환기',           desc: 'UTF-8·EUC-KR·Base64 인코딩 변환', cat: '개발자', color: '#fbbf24' },
    jsonPathTester:  { icon: '📄', title: 'JSONPath 테스터',         desc: 'JSONPath 식 실시간 실행 & 결과 확인', cat: '개발자', color: '#a78bfa' },
    curlConverter:   { icon: '⚡', title: 'cURL 변환기',             desc: 'cURL → fetch·axios·Python 코드 변환', cat: '개발자', color: '#34d399' },
    // ── 미디어 ──
    svgOptimizer:    { icon: '✨', title: 'SVG 최적화 & 편집기',    desc: 'SVG 압축·코드 편집·미리보기', cat: '미디어', color: '#fbbf24' },
    faviconGenerator:{ icon: '🖼️', title: '파비콘 생성기',          desc: 'PNG를 16/32/48px 파비콘으로 변환', cat: '미디어', color: '#a78bfa' },
    imageResizer:    { icon: '📐', title: '이미지 일괄 리사이즈',   desc: '여러 이미지를 원하는 크기로 조정', cat: '미디어', color: '#60a5fa' },
    gifMaker:        { icon: '🎬', title: 'GIF 애니메이션 제작',    desc: '여러 이미지로 GIF 만들기', cat: '미디어', color: '#ec4899' },
    colorExtractor:  { icon: '🎨', title: '이미지 색상 추출기',     desc: '이미지에서 주요 색상 팔레트 추출', cat: '미디어', color: '#f87171' },
    barcodeGenerator:{ icon: '📊', title: '바코드 생성기',          desc: 'Code128·EAN·QR 바코드 즉시 생성', cat: '미디어', color: '#34d399' },
    watermarkTool:   { icon: '🖊️', title: '이미지 워터마크',        desc: '이미지에 텍스트/로고 워터마크 추가', cat: '미디어', color: '#fb923c' },
    metaPreview:     { icon: '🔗', title: 'OG 이미지 미리보기',     desc: 'URL 입력으로 SNS 공유 미리보기', cat: '미디어', color: '#60a5fa' },
    // ── 보안 ──
    twoFactorAuth:   { icon: '🔐', title: 'OTP/2FA 생성기',         desc: 'TOTP 기반 2단계 인증 코드 생성', cat: '보안', color: '#f87171' },
    fileHasher:      { icon: '🛡️', title: '파일 해시 검증기',       desc: 'MD5·SHA256 파일 무결성 검사', cat: '보안', color: '#34d399' },
    permissionCalc:  { icon: '🔢', title: 'chmod 권한 계산기',      desc: '리눅스 파일 권한 시각적 계산', cat: '보안', color: '#fbbf24' },
    secureNote:      { icon: '📝', title: '암호화 메모장',           desc: 'AES 암호화 로컬 메모 저장', cat: '보안', color: '#a78bfa' },
    randomToken:     { icon: '🎲', title: '랜덤 토큰 생성기',       desc: 'API 키·시크릿 안전한 난수 생성', cat: '보안', color: '#60a5fa' },
    // ── 디자인 ──
    shadowGenerator: { icon: '🌫️', title: 'CSS 그림자 생성기',      desc: 'box-shadow·text-shadow 시각적 편집', cat: '디자인', color: '#a78bfa' },
    borderRadius:    { icon: '⬜', title: 'Border Radius 빌더',      desc: '둥근 모서리 값 시각적으로 편집', cat: '디자인', color: '#60a5fa' },
    flexboxHelper:   { icon: '📐', title: 'Flexbox 레이아웃 도구',  desc: 'Flexbox 속성 인터랙티브 학습', cat: '디자인', color: '#34d399' },
    animationBuilder:{ icon: '🎞️', title: 'CSS 애니메이션 빌더',   desc: '@keyframes 코드 시각적 생성', cat: '디자인', color: '#ec4899' },
    typographyScale: { icon: '🔤', title: '타이포그래피 스케일',     desc: '폰트 크기·줄간격 시각적 설정', cat: '디자인', color: '#fbbf24' },
    glassmorphism:   { icon: '💎', title: '글래스모피즘 생성기',    desc: '유리 효과 CSS 코드 즉시 생성', cat: '디자인', color: '#c084fc' },
    neumorph:        { icon: '🖱️', title: '뉴모피즘 생성기',        desc: 'Neumorphism CSS 효과 생성기', cat: '디자인', color: '#a78bfa' },
    // ── 유틸 ──
    worldClock:      { icon: '🌍', title: '세계 시간대 시계',        desc: '전 세계 주요 도시 시간 실시간 확인', cat: '유틸', color: '#60a5fa' },
    calendarTool:    { icon: '📅', title: '달력 & 날짜 계산기',     desc: 'D-Day·근무일 수·날짜 차이 계산', cat: '유틸', color: '#34d399' },
    loanCalculator:  { icon: '💰', title: '대출 이자 계산기',        desc: '원리금 균등·원금 균등 상환 계산', cat: '유틸', color: '#fbbf24' },
    countdownTimer:  { icon: '⏱️', title: '카운트다운 타이머',      desc: '정밀 타이머·스톱워치·카운트다운', cat: '유틸', color: '#f87171' },
    pomodoro:        { icon: '🍅', title: '포모도로 타이머',         desc: '25분 집중·5분 휴식 생산성 타이머', cat: '유틸', color: '#ef4444' },
    currencyConverter:{ icon: '💱', title: '환율 변환기',            desc: '150+ 통화 실시간 환율 변환', cat: '유틸', color: '#34d399' },
    notepad:         { icon: '📋', title: '빠른 메모장',             desc: '자동 저장 브라우저 메모장', cat: '유틸', color: '#a78bfa' },
    hashGenerator:   { icon: '#️⃣', title: '해시 생성기',            desc: 'MD5·SHA1·SHA256·SHA512 즉시 생성', cat: '유틸', color: '#60a5fa' },
};

export default function ToolStub({ page }) {
    const meta = TOOL_META[page] || { icon: '🔧', title: page, desc: '곧 출시 예정입니다', cat: '도구', color: '#6366f1' };

    return (
        <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(2,5,15,0.95)' }}>
            <div className="max-w-2xl mx-auto px-6 py-16 text-center flex flex-col items-center gap-8">
                {/* 아이콘 */}
                <div className="relative">
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-2xl"
                        style={{ background: `linear-gradient(135deg, ${meta.color}20, ${meta.color}08)`, border: `1px solid ${meta.color}30` }}>
                        {meta.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        개발중
                    </div>
                </div>

                {/* 제목 & 설명 */}
                <div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full mb-3 inline-block"
                        style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                        {meta.cat}
                    </span>
                    <h1 className="text-3xl font-black text-white mt-2 mb-3">{meta.title}</h1>
                    <p className="text-slate-400 text-base leading-relaxed">{meta.desc}</p>
                </div>

                {/* 진행 상태 */}
                <div className="w-full max-w-xs p-6 rounded-2xl text-left"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400">개발 진행률</span>
                        <span className="text-xs font-bold text-indigo-400">계획됨</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full w-1/3 animate-pulse" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                    </div>
                    <p className="text-xs text-slate-600 mt-3">이 도구는 현재 개발 계획 중입니다. 곧 완성된 기능으로 만나보세요.</p>
                </div>

                {/* 돌아가기 */}
                <button onClick={() => { window.location.hash = 'tools'; }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    전체 도구 목록으로
                </button>
            </div>
        </div>
    );
}
