import React from 'react';

/**
 * 모든 도구 페이지 공통 래퍼 컴포넌트
 *
 * Props:
 *   icon       - 헤더 배지 아이콘 (이모지 or JSX)
 *   title      - 페이지 제목
 *   subtitle   - 페이지 부제목
 *   accent     - 헤더 배지 색상 테마 ('sky'|'violet'|'emerald'|'rose'|...)
 *   actions    - 헤더 우측 액션 버튼들 (JSX)
 *   tabs       - 탭 요소 (JSX, 옵션)
 *   children   - 페이지 본문
 *   noPadding  - true 시 children에 패딩 미적용 (스크롤 영역 직접 구현 시)
 */

const ACCENT_MAP = {
    sky:     { badge: 'bg-sky-500/10 border-sky-500/30 text-sky-400',       glow: 'from-sky-600/8'     },
    violet:  { badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400', glow: 'from-violet-600/8' },
    emerald: { badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', glow: 'from-emerald-600/8' },
    rose:    { badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',     glow: 'from-rose-600/8'    },
    amber:   { badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',  glow: 'from-amber-600/8'   },
    blue:    { badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',     glow: 'from-blue-600/8'    },
    purple:  { badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400', glow: 'from-purple-600/8' },
    teal:    { badge: 'bg-teal-500/10 border-teal-500/30 text-teal-400',     glow: 'from-teal-600/8'    },
    pink:    { badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',     glow: 'from-pink-600/8'    },
    green:   { badge: 'bg-green-500/10 border-green-500/30 text-green-400',  glow: 'from-green-600/8'   },
    orange:  { badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400', glow: 'from-orange-600/8' },
    indigo:  { badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', glow: 'from-indigo-600/8' },
    red:     { badge: 'bg-red-500/10 border-red-500/30 text-red-400',       glow: 'from-red-600/8'     },
    cyan:    { badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',     glow: 'from-cyan-600/8'    },
    yellow:  { badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', glow: 'from-yellow-600/8' },
    slate:   { badge: 'bg-slate-500/10 border-slate-500/30 text-slate-400', glow: 'from-slate-600/8'   },
};

export default function PageLayout({ icon, title, subtitle, accent = 'sky', actions, tabs, children, noPadding = false }) {
    const theme = ACCENT_MAP[accent] || ACCENT_MAP.sky;

    return (
        <div className="tool-page">
            {/* 배경 그라디언트 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow} to-transparent pointer-events-none`} />

            {/* 헤더 */}
            <div className="relative z-10 flex items-center gap-4 px-6 py-4 border-b border-slate-800/70 shrink-0 bg-slate-950/50 backdrop-blur-sm">
                {icon && (
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-xl border ${theme.badge}`}>
                        {icon}
                    </div>
                )}
                <div className="min-w-0">
                    <h1 className="text-base font-bold text-slate-100 leading-tight">{title}</h1>
                    {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
                </div>
                {actions && <div className="ml-auto flex items-center gap-2 shrink-0">{actions}</div>}
            </div>

            {/* 탭 영역 */}
            {tabs && (
                <div className="relative z-10 px-6 pt-3 shrink-0 border-b border-slate-800/40">
                    {tabs}
                </div>
            )}

            {/* 본문 */}
            <div className={`relative z-10 flex-1 overflow-hidden ${noPadding ? '' : 'p-5'}`}>
                {children}
            </div>
        </div>
    );
}
