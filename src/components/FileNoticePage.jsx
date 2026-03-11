import React, { useState } from 'react';

export default function FileNoticePage({ fileInfo, noticeType, onBack, onContinueJson, onGoTools }) {
    const isJson = noticeType === 'json';
    const isInvalid = noticeType === 'invalid';
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar" style={{ background: '#060c1a' }}>
            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-8xl mx-auto px-6 lg:px-10 py-10 flex flex-col gap-10">

                {/* ── JSON 안내 ── */}
                {isJson && (
                    <>
                        {/* 상단: JSON vs CSV, 안내, CSV 활용 카드 (데스크톱에서 좌우 배치) */}
                        <div className="grid gap-4 lg:grid-cols-3">
                            {/* 왼쪽: JSON vs CSV 비교 */}
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 flex flex-col gap-4">
                                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                    <span className="text-base">⚖️</span> JSON vs CSV — 무엇이 다를까요?
                                </h2>
                                {/* JSON 위, CSV 아래로 세로 배치 */}
                                <div className="space-y-3 text-xs">
                                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-2">
                                        <div className="text-sky-400 font-bold text-sm">📦 JSON</div>
                                        <ul className="space-y-1.5 text-slate-400">
                                            <li className="flex items-start gap-1.5"><span className="text-sky-400 mt-0.5">✓</span> 중첩 구조, 배열, 객체 표현 가능</li>
                                            <li className="flex items-start gap-1.5"><span className="text-sky-400 mt-0.5">✓</span> API 응답, 설정 파일에 적합</li>
                                            <li className="flex items-start gap-1.5"><span className="text-rose-400 mt-0.5">✗</span> 스프레드시트로 열기 어려움</li>
                                            <li className="flex items-start gap-1.5"><span className="text-rose-400 mt-0.5">✗</span> 통계 분석 도구와 호환성 낮음</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                                        <div className="text-emerald-400 font-bold text-sm">📊 CSV</div>
                                        <ul className="space-y-1.5 text-slate-400">
                                            <li className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">✓</span> Excel, Google Sheets에서 바로 오픈</li>
                                            <li className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">✓</span> 피벗·차트·SQL 쿼리 즉시 가능</li>
                                            <li className="flex items-start gap-1.5"><span className="text-rose-400 mt-0.5">✗</span> 단순 테이블 구조만 표현 가능</li>
                                            <li className="flex items-start gap-1.5"><span className="text-rose-400 mt-0.5">✗</span> 중첩 데이터 표현 불가</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* 가운데: JSON 파일 안내 카드 */}
                            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-6 flex flex-col gap-6 h-full">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-sky-500/15 flex items-center justify-center text-2xl shrink-0">📄</div>
                                    <div>
                                        <h1 className="text-xl font-bold text-white mb-1">JSON 파일 변환 안내</h1>
                                        <p className="text-sm text-slate-400">
                                            선택하신 JSON 파일은 곧바로 데이터셋으로 분석하기 어렵습니다.{' '}
                                            <span className="text-sky-400 font-semibold">CSV 형식으로 변환</span>한 후 데이터셋 도구에서 사용하는 것을 권장합니다.
                                        </p>
                                    </div>
                                </div>
                                {/* 파일명은 위에 단독, 크기/유형은 그 아래 가로 2개로 배치 (카드 중앙에 가깝게) */}
                                <div className="flex-1 flex items-center">
                                    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300 space-y-3 w-full">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-semibold uppercase text-sky-400">파일명</span>
                                            <span className="text-slate-200 text-[11px] truncate font-mono">{fileInfo?.name || '–'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <InfoCell label="크기" value={fileInfo?.size != null ? `${(fileInfo.size / 1024).toFixed(1)} KB` : '–'} color="sky" />
                                            <InfoCell label="유형" value={fileInfo?.type || 'application/json'} color="sky" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3 mt-auto">
                                    <button onClick={onBack} className="px-4 py-3 rounded-xl text-sm font-bold text-slate-200 border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-all">
                                        ← 다른 파일 선택
                                    </button>
                                    <button onClick={onContinueJson} className="px-4 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all">
                                        JSON → CSV 변환 도구로 이동 →
                                    </button>
                                </div>
                            </div>

                            {/* 오른쪽: CSV로 변환 후 가능한 작업들 */}
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 flex flex-col gap-3 h-full">
                                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                    <span className="text-base">🚀</span> CSV로 변환하면 이런 작업이 가능해요
                                </h2>
                                {/* 2 x 2 레이아웃으로 배치, 세로 공간도 채우기 */}
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 text-xs">
                                    <Capability icon="📊" title="피벗 테이블" desc="행·열 집계 요약표 자동 생성" color="violet" />
                                    <Capability icon="📈" title="차트 시각화" desc="막대·꺾선·파이 등 8가지" color="sky" />
                                    <Capability icon="🔍" title="SQL 쿼리" desc="브라우저에서 직접 쿼리 실행" color="emerald" />
                                    <Capability icon="💡" title="자동 인사이트" desc="분포·상관관계·파레토 분석" color="amber" />
                                </div>
                            </div>
                        </div>

                        {/* 하단: 관련 변환 도구 & FAQ를 좌우 배치 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* 변환 도구 홍보 */}
                            <div className="flex flex-col gap-3">
                                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">관련 변환 도구</div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <ToolPromo icon="🔄" title="JSON ↔ CSV 변환" desc="JSON 배열을 CSV로, CSV를 JSON으로 양방향 변환" accent="emerald" onClick={onContinueJson} />
                                    <ToolPromo icon="🧹" title="JSON 포매터" desc="JSON 구조 확인, 들여쓰기·압축·유효성 검사" accent="sky" onClick={onGoTools} />
                                    <ToolPromo icon="📊" title="Excel ↔ JSON 변환" desc=".xlsx/.xls 파일과 JSON 배열을 양방향 변환" accent="violet" onClick={onGoTools} />
                                    <ToolPromo icon="🗂️" title="CSV 병합·분할" desc="여러 CSV 합치기 또는 조건에 따라 분할" accent="amber" onClick={onGoTools} />
                                </div>
                                <button onClick={onGoTools} className="w-full px-4 py-3 rounded-xl text-sm font-bold text-violet-200 border border-violet-500/40 bg-violet-600/20 hover:bg-violet-600/30 transition-all">
                                    변환 도구 전체 보기 →
                                </button>
                            </div>

                            {/* FAQ */}
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 flex flex-col gap-3">
                                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                    <span className="text-base">❓</span> 자주 묻는 질문
                                </h2>
                                <div className="space-y-2">
                                    {[
                                        { q: 'JSON 파일이 배열 형태가 아니면 변환이 가능한가요?', a: '객체 배열([{...},{...}]) 형태만 CSV로 자동 변환됩니다. 중첩 구조나 단일 객체인 경우 JSON 포매터로 구조를 먼저 확인하세요.' },
                                        { q: '변환 시 데이터가 손실되지 않나요?', a: '중첩 값이나 배열 타입 필드는 문자열로 직렬화될 수 있습니다. 숫자·문자열·불리언 값은 그대로 유지됩니다.' },
                                        { q: '한글(UTF-8) 데이터도 정상 변환되나요?', a: '네, BOM(UTF-8) 인코딩으로 출력되어 Excel에서 한글이 깨지지 않습니다.' },
                                    ].map((item, i) => (
                                        <div key={i} className="border border-slate-700/70 rounded-xl overflow-hidden">
                                            <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800/50 transition-colors text-left gap-3">
                                                <span>{item.q}</span>
                                                <span className="text-slate-500 shrink-0">{openFaq === i ? '▲' : '▼'}</span>
                                            </button>
                                            {openFaq === i && (
                                                <div className="px-4 pb-3 text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-3 bg-slate-900/30">
                                                    {item.a}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── 지원 안 되는 파일 ── */}
                {isInvalid && (
                    <>
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-2xl shrink-0">⚠️</div>
                                <div>
                                    <h1 className="text-xl font-bold text-white mb-1">지원되지 않는 파일 형식</h1>
                                    <p className="text-sm text-slate-400">
                                        선택하신 파일은 데이터셋 분석에 바로 사용하기 어렵습니다. CSV 또는 JSON 형식의 테이블 데이터를 사용하는 것을 권장합니다.
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300 grid grid-cols-3 gap-3">
                                <InfoCell label="파일명" value={fileInfo?.name || '–'} color="amber" />
                                <InfoCell label="크기" value={fileInfo?.size != null ? `${(fileInfo.size / 1024).toFixed(1)} KB` : '–'} color="amber" />
                                <InfoCell label="유형" value={fileInfo?.type || '알 수 없음'} color="amber" />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <button onClick={onBack} className="px-4 py-3 rounded-xl text-sm font-bold text-slate-200 border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-all">
                                    ← 다른 파일 선택
                                </button>
                                <button onClick={onGoTools} className="px-4 py-3 rounded-xl text-sm font-bold text-violet-200 border border-violet-500/40 bg-violet-600/20 hover:bg-violet-600/30 transition-all">
                                    변환 도구 보러가기 →
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 flex flex-col gap-3">
                            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <span className="text-base">✅</span> 데이터셋 분석에 사용할 수 있는 파일
                            </h2>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <SupportedFormat ext=".csv" desc="쉼표로 구분된 테이블 데이터 (가장 권장)" color="emerald" />
                                <SupportedFormat ext=".json" desc="JSON 배열 형태의 데이터 (CSV 변환 후 사용)" color="sky" />
                            </div>
                            <div className="text-xs text-slate-500 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                                💡 <span className="text-slate-400">Excel(.xlsx), 텍스트(.txt), PDF 등은 아래 변환 도구를 이용해 먼저 CSV로 변환하세요.</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 flex flex-col gap-3">
                            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <span className="text-base">🛠️</span> 내 파일에 맞는 변환 도구
                            </h2>
                            <div className="space-y-2 text-xs">
                                <WorkflowStep n="1" label="파일 형식 파악" desc="어떤 형식인지 확인 후 적합한 변환 도구 선택" />
                                <WorkflowStep n="2" label="변환 도구에서 변환" desc="PDF·이미지·Excel → CSV 등으로 변환" />
                                <WorkflowStep n="3" label="데이터셋으로 불러오기" desc="변환된 CSV 파일을 #main 페이지에서 열기" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">추천 변환 도구</div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <ToolPromo icon="📑" title="PDF 변환 스튜디오" desc="PDF 병합·분할·이미지 추출" accent="rose" onClick={onGoTools} />
                                <ToolPromo icon="🖼️" title="이미지 변환 스튜디오" desc="포맷 변환·리사이즈·워터마크" accent="sky" onClick={onGoTools} />
                                <ToolPromo icon="📊" title="Excel ↔ JSON" desc=".xlsx/.xls와 JSON 배열 양방향 변환" accent="emerald" onClick={onGoTools} />
                                <ToolPromo icon="🔄" title="JSON ↔ CSV" desc="JSON 배열을 CSV로 즉시 변환" accent="violet" onClick={onGoTools} />
                                <ToolPromo icon="🔍" title="텍스트 정제 도구" desc="문서/텍스트에서 이메일·전화 추출" accent="amber" onClick={onGoTools} />
                                <ToolPromo icon="🗜️" title="ZIP 도구" desc="파일 압축·해제·내부 파일 추출" accent="teal" onClick={onGoTools} />
                            </div>
                            <button onClick={onGoTools} className="w-full px-4 py-3 rounded-xl text-sm font-bold text-violet-200 border border-violet-500/40 bg-violet-600/20 hover:bg-violet-600/30 transition-all">
                                변환 도구 전체 보기 →
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 flex flex-col gap-3">
                            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <span className="text-base">💎</span> 데이터 분석 꿀팁
                            </h2>
                            <div className="space-y-2">
                                {[
                                    { icon: '📌', tip: '헤더 행 포함', desc: 'CSV 첫 번째 행에 열 이름이 있어야 피벗·차트를 제대로 활용할 수 있습니다.' },
                                    { icon: '🔢', tip: '숫자 형식 통일', desc: '천 단위 쉼표(1,000)나 통화 기호($)가 있으면 자동 타입 인식이 안 될 수 있습니다.' },
                                    { icon: '📅', tip: '날짜 형식 통일', desc: 'YYYY-MM-DD 형식이 가장 인식률이 높습니다. 분석 전 통일하세요.' },
                                    { icon: '🧹', tip: '공백·특수문자 정리', desc: '열 이름에 공백이나 특수문자가 있으면 SQL 쿼리 작성 시 오류가 생길 수 있습니다.' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                        <span className="text-base shrink-0">{item.icon}</span>
                                        <div className="min-w-0">
                                            <div className="text-xs font-semibold text-slate-200">{item.tip}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* 하단 VaultSheet 브랜드 섹션 */}
                <div className="mt-4 rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-900/40 via-slate-900/60 to-sky-900/40 px-6 py-7 md:py-8 flex flex-col md:flex-row items-center gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-600/40 border border-violet-400/40 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">
                            VS
                        </div>
                        <div>
                            <div className="text-sm font-extrabold tracking-[0.18em] text-violet-200 uppercase">VaultSheet</div>
                            <div className="text-xs text-slate-400 mt-0.5">브라우저에서 끝내는 올인원 데이터 분석 워크스페이스</div>
                        </div>
                    </div>
                    <div className="flex-1 grid sm:grid-cols-3 gap-3 text-[11px]">
                        <div className="rounded-2xl bg-slate-900/60 border border-slate-700/70 px-3 py-2.5">
                            <div className="flex items-center gap-1.5 text-violet-200 font-semibold mb-1">
                                <span>📊</span><span>피벗 & 차트</span>
                            </div>
                            <p className="text-slate-400 leading-snug">수천 행 데이터도 즉시 피벗, 차트, 인사이트까지 한 번에.</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/60 border border-slate-700/70 px-3 py-2.5">
                            <div className="flex items-center gap-1.5 text-emerald-200 font-semibold mb-1">
                                <span>🧠</span><span>AI 인사이트</span>
                            </div>
                            <p className="text-slate-400 leading-snug">컬럼 품질·이상치·상관관계를 자동으로 분석해 요약 리포트 제공.</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/60 border border-slate-700/70 px-3 py-2.5">
                            <div className="flex items-center gap-1.5 text-sky-200 font-semibold mb-1">
                                <span>🧷</span><span>로컬 안전 보관</span>
                            </div>
                            <p className="text-slate-400 leading-snug">모든 연산은 브라우저 안에서만 처리되어, CSV·JSON이 외부로 나가지 않습니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}

function InfoCell({ label, value, color }) {
    const colors = { sky: 'text-sky-400', amber: 'text-amber-400', emerald: 'text-emerald-400' };
    return (
        <div className="flex flex-col gap-0.5">
            <span className={`text-[10px] font-semibold uppercase ${colors[color] || 'text-slate-400'}`}>{label}</span>
            <span className="text-slate-200 text-[11px] truncate font-mono">{value}</span>
        </div>
    );
}

function Capability({ icon, title, desc, color }) {
    const colors = { violet: 'border-violet-500/20 bg-violet-500/5', sky: 'border-sky-500/20 bg-sky-500/5', emerald: 'border-emerald-500/20 bg-emerald-500/5', amber: 'border-amber-500/20 bg-amber-500/5' };
    return (
        <div className={`rounded-xl border ${colors[color] || colors.sky} px-4 py-4 flex flex-col items-center justify-center gap-2 text-center h-full`}>
            <span className="text-2xl">{icon}</span>
            <div className="text-xs font-bold text-slate-200">{title}</div>
            <div className="text-[11px] text-slate-400 leading-snug">{desc}</div>
        </div>
    );
}

function SupportedFormat({ ext, desc, color }) {
    const colors = { emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300', sky: 'border-sky-500/30 bg-sky-500/5 text-sky-300' };
    return (
        <div className={`rounded-xl border ${colors[color] || colors.sky} p-3 flex items-start gap-3`}>
            <span className="font-mono font-black text-sm shrink-0">{ext}</span>
            <span className="text-slate-400 text-[11px] leading-snug">{desc}</span>
        </div>
    );
}

function WorkflowStep({ n, label, desc }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-[10px] font-black text-violet-300 shrink-0">{n}</div>
            <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-200">{label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
            </div>
        </div>
    );
}

const accentMap = {
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon: 'bg-emerald-500/15 text-emerald-400', title: 'text-emerald-300' },
    sky:     { border: 'border-sky-500/30',     bg: 'bg-sky-500/5',     icon: 'bg-sky-500/15 text-sky-400',         title: 'text-sky-300' },
    violet:  { border: 'border-violet-500/30',  bg: 'bg-violet-500/5',  icon: 'bg-violet-500/15 text-violet-400',   title: 'text-violet-300' },
    amber:   { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   icon: 'bg-amber-500/15 text-amber-400',     title: 'text-amber-300' },
    rose:    { border: 'border-rose-500/30',    bg: 'bg-rose-500/5',    icon: 'bg-rose-500/15 text-rose-400',       title: 'text-rose-300' },
    teal:    { border: 'border-teal-500/30',    bg: 'bg-teal-500/5',    icon: 'bg-teal-500/15 text-teal-400',       title: 'text-teal-300' },
};

function ToolPromo({ icon, title, desc, accent = 'sky', onClick }) {
    const c = accentMap[accent] || accentMap.sky;
    return (
        <button onClick={onClick} className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-start gap-3 hover:opacity-80 transition-opacity text-left w-full`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base ${c.icon}`}>{icon}</div>
            <div className="min-w-0">
                <div className={`text-[12px] font-semibold truncate ${c.title}`}>{title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{desc}</div>
            </div>
        </button>
    );
}
