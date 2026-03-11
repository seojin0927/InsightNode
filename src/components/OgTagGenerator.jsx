import React, { useState } from 'react';

const OgTagGenerator = () => {
    const [fields, setFields] = useState({
        title: '',
        description: '',
        url: '',
        image: '',
        siteName: '',
        type: 'website',
        locale: 'ko_KR',
        twitterCard: 'summary_large_image',
        twitterSite: '',
        author: '',
        keywords: '',
    });
    const [copied, setCopied] = useState(false);
    const [tab, setTab] = useState('og');

    const set = (k, v) => setFields(p => ({ ...p, [k]: v }));

    const ogTags = `<!-- Open Graph / Facebook -->
<meta property="og:type" content="${fields.type}" />
<meta property="og:url" content="${fields.url}" />
<meta property="og:title" content="${fields.title}" />
<meta property="og:description" content="${fields.description}" />
${fields.image ? `<meta property="og:image" content="${fields.image}" />` : ''}
${fields.siteName ? `<meta property="og:site_name" content="${fields.siteName}" />` : ''}
${fields.locale ? `<meta property="og:locale" content="${fields.locale}" />` : ''}`;

    const twitterTags = `<!-- Twitter -->
<meta property="twitter:card" content="${fields.twitterCard}" />
<meta property="twitter:url" content="${fields.url}" />
<meta property="twitter:title" content="${fields.title}" />
<meta property="twitter:description" content="${fields.description}" />
${fields.image ? `<meta property="twitter:image" content="${fields.image}" />` : ''}
${fields.twitterSite ? `<meta property="twitter:site" content="${fields.twitterSite}" />` : ''}`;

    const seoTags = `<!-- SEO -->
<title>${fields.title}</title>
<meta name="description" content="${fields.description}" />
${fields.keywords ? `<meta name="keywords" content="${fields.keywords}" />` : ''}
${fields.author ? `<meta name="author" content="${fields.author}" />` : ''}
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${fields.url}" />`;

    const allTags = `${seoTags}\n\n${ogTags}\n\n${twitterTags}`;

    const outputMap = { og: ogTags, twitter: twitterTags, seo: seoTags, all: allTags };
    const output = outputMap[tab];

    const copy = () => {
        navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(()=>{});
    };

    const InputRow = ({ label, value, field, placeholder, type = 'text' }) => (
        <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{label}</label>
            <input type={type} value={value} onChange={e => set(field, e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2 text-xs rounded-lg outline-none" />
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(6,182,212,0.1))', border: '1px solid rgba(14,165,233,0.2)' }}>🔗</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">OG 태그 생성기</h1>
                        <p className="text-xs text-slate-500">SNS 공유 최적화 메타태그 · Open Graph · Twitter Card</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
                    {/* 입력 폼 */}
                    <div className="lg:w-72 shrink-0 overflow-y-auto custom-scrollbar space-y-3">
                        <InputRow label="제목 *" value={fields.title} field="title" placeholder="페이지 제목" />
                        <InputRow label="설명 *" value={fields.description} field="description" placeholder="140자 이내 설명" />
                        <InputRow label="URL *" value={fields.url} field="url" placeholder="https://example.com" type="url" />
                        <InputRow label="이미지 URL" value={fields.image} field="image" placeholder="https://example.com/og.png" type="url" />
                        <InputRow label="사이트명" value={fields.siteName} field="siteName" placeholder="My Website" />
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">유형</label>
                            <select value={fields.type} onChange={e => set('type', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg outline-none">
                                <option value="website">website</option>
                                <option value="article">article</option>
                                <option value="product">product</option>
                                <option value="profile">profile</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Twitter Card</label>
                            <select value={fields.twitterCard} onChange={e => set('twitterCard', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg outline-none">
                                <option value="summary_large_image">summary_large_image</option>
                                <option value="summary">summary</option>
                                <option value="app">app</option>
                            </select>
                        </div>
                        <InputRow label="Twitter @계정" value={fields.twitterSite} field="twitterSite" placeholder="@username" />
                        <InputRow label="키워드 (SEO)" value={fields.keywords} field="keywords" placeholder="키워드1, 키워드2" />
                        <InputRow label="작성자" value={fields.author} field="author" placeholder="이름 또는 URL" />
                    </div>

                    {/* 미리보기 + 결과 */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* SNS 미리보기 카드 */}
                        {(fields.title || fields.description) && (
                            <div className="mb-4 shrink-0 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {fields.image && <div className="h-24 w-full" style={{ background: `url(${fields.image}) center/cover no-repeat, rgba(30,40,60,0.8)` }} />}
                                <div className="p-3">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">{fields.url || 'example.com'}</div>
                                    <div className="text-sm font-bold text-slate-100 line-clamp-1">{fields.title || '제목이 여기에 표시됩니다'}</div>
                                    <div className="text-xs text-slate-400 line-clamp-2 mt-1">{fields.description || '설명이 여기에 표시됩니다'}</div>
                                </div>
                            </div>
                        )}

                        {/* 탭 */}
                        <div className="flex gap-1 p-1 rounded-xl mb-3 shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {[{ id: 'og', l: 'Open Graph' }, { id: 'twitter', l: 'Twitter' }, { id: 'seo', l: 'SEO' }, { id: 'all', l: '전체' }].map(t => (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={tab === t.id ? { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff' } : { color: '#64748b' }}>
                                    {t.l}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">생성된 HTML 태그</label>
                            <button onClick={copy} className="text-[10px] px-2 py-1 rounded font-bold" style={copied ? { color: '#22c55e', background: 'rgba(34,197,94,0.1)' } : { color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>{copied ? '✓ 복사됨' : '복사'}</button>
                        </div>
                        <textarea readOnly value={output} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OgTagGenerator;
