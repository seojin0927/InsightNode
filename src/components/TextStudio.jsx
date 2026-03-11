import React, { useState, useMemo } from 'react';
import StudioLayout, { S, CopyBtn } from './StudioLayout';

const toCamel = s => s.replace(/[-_\s]+(.)/g, (_,c) => c.toUpperCase());
const toPascal = s => { const c = toCamel(s); return c.charAt(0).toUpperCase() + c.slice(1); };
const toSnake = s => s.replace(/[\s-]+/g,'_').replace(/([A-Z])/g,'_$1').replace(/^_/,'').toLowerCase();
const toKebab = s => toSnake(s).replace(/_/g,'-');
const toSlug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const toConstant = s => toSnake(s).toUpperCase();

const ACCENT = '#6366f1';

// ─── 통합 탭: 인코딩 + 케이스 + 글자수 세기 ─────────────────────────
function EncodeCaseCountTab() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [encodeMode, setEncodeMode] = useState('htmlEncode');
    const [lastAction, setLastAction] = useState('');

    const encodeResult = useMemo(() => {
        if (!input) return '';
        switch (encodeMode) {
            case 'htmlEncode': return input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
            case 'htmlDecode': return input.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
            case 'urlEncode': return encodeURIComponent(input);
            case 'urlDecode': try { return decodeURIComponent(input); } catch { return '오류: 올바른 URL 인코딩이 아닙니다'; }
            case 'base64Encode': try { return btoa(unescape(encodeURIComponent(input))); } catch { return '오류'; }
            case 'base64Decode': try { return decodeURIComponent(escape(atob(input))); } catch { return '오류: 올바른 Base64가 아닙니다'; }
            case 'escapeJson': return JSON.stringify(input);
            case 'removeHtml': return input.replace(/<[^>]*>/g, '');
            default: return input;
        }
    }, [input, encodeMode]);

    const transforms = [
        { label: 'UPPERCASE', fn: t => t.toUpperCase(), color: '#ef4444' },
        { label: 'lowercase', fn: t => t.toLowerCase(), color: '#3b82f6' },
        { label: 'Title Case', fn: t => t.replace(/\b\w/g, c => c.toUpperCase()), color: '#8b5cf6' },
        { label: 'camelCase', fn: toCamel, color: '#f59e0b' },
        { label: 'PascalCase', fn: toPascal, color: '#ec4899' },
        { label: 'snake_case', fn: toSnake, color: '#06b6d4' },
        { label: 'kebab-case', fn: toKebab, color: '#84cc16' },
        { label: 'CONSTANT_CASE', fn: toConstant, color: '#f97316' },
        { label: 'slug-url', fn: toSlug, color: '#6366f1' },
        { label: '공백 제거', fn: t => t.replace(/\s+/g,''), color: '#94a3b8' },
        { label: '중복 공백 정리', fn: t => t.replace(/\s+/g,' ').trim(), color: '#94a3b8' },
        { label: '줄별 트림', fn: t => t.split('\n').map(l=>l.trim()).join('\n'), color: '#94a3b8' },
        { label: '역순 텍스트', fn: t => t.split('').reverse().join(''), color: '#a78bfa' },
        { label: '역순 줄', fn: t => t.split('\n').reverse().join('\n'), color: '#a78bfa' },
        { label: '중복 줄 제거', fn: t => [...new Set(t.split('\n'))].join('\n'), color: '#34d399' },
        { label: '빈 줄 제거', fn: t => t.split('\n').filter(l=>l.trim()).join('\n'), color: '#34d399' },
        { label: '정렬 (ABC)', fn: t => t.split('\n').sort().join('\n'), color: '#fbbf24' },
    ];

    const applyTransform = fn => { const r = fn(input); setResult(r); setLastAction('case'); };
    const displayResult = lastAction === 'case' ? result : encodeResult;

    const stats = useMemo(() => {
        if (!input.trim()) return null;
        const words = input.trim().split(/\s+/).filter(Boolean);
        const sentences = input.split(/[.!?]+/).filter(s => s.trim()).length;
        const paragraphs = input.split(/\n\s*\n/).filter(p => p.trim()).length || 1;
        const lines = input.split('\n').length;
        const charsNoSpace = input.replace(/\s/g,'').length;
        const readTime = Math.ceil(words.length / 200);
        return { chars: input.length, charsNoSpace, words: words.length, sentences, paragraphs, lines, readTime };
    }, [input]);

    const encodeModes = [
        ['htmlEncode','HTML 인코딩'],['htmlDecode','HTML 디코딩'],
        ['urlEncode','URL 인코딩'],['urlDecode','URL 디코딩'],
        ['base64Encode','Base64 인코딩'],['base64Decode','Base64 디코딩'],
        ['escapeJson','JSON 이스케이프'],['removeHtml','HTML 태그 제거'],
    ];

    return (
        <div className="space-y-5">
            {/* 글자수 세기 */}
            <div className={`${S.card} p-4`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">글자수 세기</h3>
                {stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {[['문자',stats.chars,'#6366f1'],['공백제외',stats.charsNoSpace,'#64748b'],['단어',stats.words,'#22c55e'],['문장',stats.sentences,'#06b6d4'],['줄',stats.lines,'#f59e0b'],['읽기시간',`${stats.readTime}분`,'#a78bfa']].map(([l,v,c])=>(
                            <div key={l} className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
                                <div className="text-xl font-black" style={{color:c}}>{v}</div>
                                <div className="text-[10px] text-slate-500 font-bold mt-1">{l}</div>
                            </div>
                        ))}
                    </div>
                ) : <div className="text-center text-slate-600 py-4 text-sm">텍스트를 입력하면 통계가 표시됩니다</div>}
            </div>

            {/* 인코딩/디코딩 */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">인코딩 · 디코딩</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {encodeModes.map(([v,l]) => <button key={v} onClick={()=>{setEncodeMode(v);setLastAction('encode');}} className={S.btn(encodeMode===v)}>{l}</button>)}
                </div>
            </div>

            {/* 케이스 변환 */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">케이스 변환</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {transforms.map(t => (
                        <button key={t.label} onClick={() => applyTransform(t.fn)} className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold border border-slate-700 hover:border-indigo-500/50 transition-all" style={{ background: 'rgba(255,255,255,0.03)', color: t.color }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 입력/출력 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={S.label}>입력 텍스트</label>
                    <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="변환할 텍스트를 입력하세요..." rows={10} className={S.textarea} />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className={S.label.replace('block mb-1.5','')}>결과</label>
                        {displayResult && !displayResult.startsWith('오류') && <CopyBtn text={displayResult} />}
                    </div>
                    <textarea value={displayResult} readOnly rows={10} placeholder="결과가 여기에 표시됩니다" className={`${S.textarea} bg-slate-950/80 ${displayResult.startsWith('오류')?'text-red-400':''}`} />
                </div>
            </div>
        </div>
    );
}

const TABS = [
    { id: 'main', label: '인코딩 · 케이스 · 글자수', icon: '✏️', desc: '인코딩/디코딩, 케이스 변환, 글자수 세기 통합', component: EncodeCaseCountTab, chipLabel: '통합' },
];

export default function TextStudio() {
    const [tab, setTab] = useState('main');
    const Comp = TABS.find(t => t.id === tab)?.component;

    return (
        <StudioLayout
            color={ACCENT}
            icon="✏️"
            title="텍스트 스튜디오"
            description="인코딩·케이스 변환·글자수 세기 통합"
            tabs={TABS}
            tab={tab}
            setTab={setTab}>
            {Comp && <Comp />}
        </StudioLayout>
    );
}
