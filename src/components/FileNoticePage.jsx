import React from 'react';

export default function FileNoticePage({ fileInfo, noticeType, onBack, onContinueJson, onGoTools }) {
    const isJson = noticeType === 'json';
    const isInvalid = noticeType === 'invalid';

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar" style={{ background: '#060c1a' }}>
            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-8xl mx-auto px-6 lg:px-10 py-10 flex flex-col gap-10">

                {/* 공통: vaultsheet.com 파일 안내 — 직접 주소로 들어온 경우에도 본문이 풍부하도록 */}
                <article className="rounded-2xl border border-violet-500/25 bg-slate-900/70 p-6 md:p-8 space-y-4 shadow-lg shadow-black/20" itemScope itemType="https://schema.org/WebPage">
                    <meta itemProp="name" content="VaultSheet 파일 형식 안내" />
                    <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
                        VaultSheet(<span className="text-violet-300">vaultsheet.com</span>) 파일 처리 안내
                    </h2>
                    <p className="text-sm md:text-[15px] text-slate-300 leading-relaxed">
                        이 화면은 <strong className="text-slate-100">업로드한 파일이 바로 데이터셋으로 열리기 어려울 때</strong> 안내를 드리는 경유 페이지입니다.
                        <strong className="text-slate-100"> JSON만 선택한 경우</strong>에는 표 형태 CSV로 바꾼 뒤 피벗·차트·SQL 분석을 쓰는 것이 가장 빠르고,
                        <strong className="text-slate-100"> 지원하지 않는 확장자</strong>인 경우에는 PDF·이미지·엑셀 등 <strong className="text-emerald-300">변환 도구로 먼저 CSV 또는 JSON 배열</strong>을 만든 후
                        메인(<code className="text-sky-300 bg-slate-800/80 px-1 rounded">#main</code>)에서 다시 열어 주세요. 모든 변환·분석은 가능한 한 <strong className="text-slate-100">브라우저 안에서만</strong> 처리되도록 설계되어 있어 외부 서버로 원본이 전송되지 않습니다.
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        vaultsheet.com은 직장인·개발자·마케터가 <strong className="text-slate-300">CSV·JSON 기반 데이터를 업로드하고 자연어에 가깝게 필터링</strong>한 뒤,
                        피벗 테이블·고품질 차트·AI 인사이트까지 한 워크스페이스에서 다루도록 만든 <strong className="text-slate-300">무료 온라인 데이터 도구</strong>입니다.
                        아래에서 파일 유형별 안내를 확인하거나, 변환 도구 모음으로 이동해 형식을 맞춘 뒤 다시 시도해 주세요.
                    </p>
                    <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5 marker:text-violet-400">
                        <li><strong className="text-slate-300">권장 형식:</strong> 첫 행에 헤더가 있는 UTF-8 CSV, 또는 <code className="text-xs text-sky-300">객체를 담은 JSON 배열</code> (예: 표로 풀 수 있는 행 단위 데이터)</li>
                        <li><strong className="text-slate-300">JSON만 있는 경우:</strong> 아래 &quot;JSON → CSV 변환&quot;으로 이동해 표 데이터를 만든 다음 메인에서 데이터셋으로 열기</li>
                        <li><strong className="text-slate-300">형식을 모르겠을 때:</strong> 변환 도구 전체 보기에서 PDF, 이미지, Excel, ZIP 등 입맞에 맞는 도구를 선택</li>
                    </ul>
                </article>

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
                                💡 <span className="text-slate-400">Excel(.xlsx), 텍스트(.txt), PDF 등은 변환 도구 전체 보기에서 먼저 CSV로 변환하세요.</span>
                            </div>
                        </div>
                    </>
                )}

                {/* ── 유형 미지정: 직접 #fileNotice 로 들어온 경우 등 ── */}
                {!isJson && !isInvalid && (
                    <div className="rounded-2xl border border-slate-600 bg-slate-900/70 p-6 md:p-8 space-y-5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="text-xl">📂</span> 파일 안내 화면 (일반)
                        </h2>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            지금은 <strong className="text-amber-300">업로드 직후 자동으로 구분된 안내(JSON 전용·미지원 형식)</strong>가 아닌 상태입니다. 주소창에 <code className="text-sky-300 bg-slate-800 px-1 rounded">#fileNotice</code>만 입력해 들어오셨거나, 세션이 초기화된 경우일 수 있습니다.
                            <strong className="text-slate-100"> vaultsheet.com</strong> 메인에서 <strong className="text-slate-100">CSV 또는 지원 형식의 파일</strong>을 다시 선택하시거나, 아래 버튼으로 변환 도구·메인 화면으로 이동해 주세요.
                        </p>
                        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                            <li>데이터 분석을 시작하려면: 메인에서 표 형식 CSV 또는 변환된 JSON 배열을 불러오기</li>
                            <li>JSON만 있는 경우: JSON → CSV 변환 후 메인에서 열기</li>
                            <li>형식이 맞지 않으면: PDF·이미지·엑셀 등은 전용 변환 도구 이용</li>
                        </ul>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <button type="button" onClick={onBack} className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
                                메인에서 파일 다시 선택
                            </button>
                            <button type="button" onClick={onContinueJson} className="px-5 py-3 rounded-xl text-sm font-bold text-slate-200 border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors">
                                JSON ↔ CSV 변환 도구
                            </button>
                            <button type="button" onClick={onGoTools} className="px-5 py-3 rounded-xl text-sm font-bold text-emerald-200 border border-emerald-500/40 bg-emerald-900/30 hover:bg-emerald-900/50 transition-colors">
                                변환 도구 모음
                            </button>
                        </div>
                    </div>
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

