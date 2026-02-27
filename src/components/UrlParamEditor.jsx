import React, { useState, useCallback, useEffect } from 'react';
import Icons from '../utils/Icons';

const UrlParamEditor = () => {
    const [urlInput, setUrlInput] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [params, setParams] = useState([]);
    const [newParamKey, setNewParamKey] = useState('');
    const [newParamValue, setNewParamValue] = useState('');
    const [error, setError] = useState('');

    // 샘플 URL
    const sampleUrls = [
        { label: 'Google 검색', text: 'https://www.google.com/' },
        { label: 'Naver 검색', text: 'https://search.naver.com/' },
        { label: '카카오맵', text: 'https://map.kakao.com/' },
        { label: 'YouTube', text: 'https://www.youtube.com/' },
        { label: 'GitHub', text: 'https://github.com/' },
        { label: 'Zoom', text: 'https://zoom.us/' },
        { label: 'Google Forms', text: 'https://docs.google.com/forms/' },
    ];

    // UTM 템플릿 (더미 샘플 데이터 포함)
    const utmTemplates = [
        {
            label: 'Google UTM 전체',
            description: '전체 UTM 파라미터 세트',
            params: [
                { key: 'utm_source', value: 'google_sample', enabled: true },
                { key: 'utm_medium', value: 'cpc_sample', enabled: true },
                { key: 'utm_campaign', value: 'campaign_name_sample', enabled: true },
                { key: 'utm_term', value: 'keyword_sample', enabled: true },
                { key: 'utm_content', value: 'ad_variant_sample', enabled: true },
            ]
        },
        {
            label: 'Facebook/Instagram',
            description: '소셜 미디어 마케팅',
            params: [
                { key: 'utm_source', value: 'facebook', enabled: true },
                { key: 'utm_medium', value: 'social', enabled: true },
                { key: 'utm_campaign', value: 'social_campaign_2024', enabled: true },
                { key: 'utm_content', value: 'post_ad_sample', enabled: true },
            ]
        },
        {
            label: 'Google Ads',
            description: '구글 Paid Search',
            params: [
                { key: 'utm_source', value: 'google', enabled: true },
                { key: 'utm_medium', value: 'cpc', enabled: true },
                { key: 'utm_campaign', value: 'spring_sale_2024', enabled: true },
                { key: 'utm_term', value: 'sample_keyword', enabled: true },
                { key: 'utm_content', value: 'sample_ad', enabled: true },
            ]
        },
        {
            label: 'Naver 검색 광고',
            description: '네이버 검색광고 파라미터',
            params: [
                { key: 'n_id', value: 'sample_ad_id', enabled: true },
                { key: 'where', value: 'search', enabled: true },
                { key: 'query', value: '검색어샘플', enabled: true },
                { key: 'mra', value: '1100', enabled: true },
            ]
        },
        {
            label: '카카오톡 공유',
            description: '카카오톡 메시지 공유',
            params: [
                { key: 'kakao_agent', value: 'sdk', enabled: true },
                { key: 'kakao_os', value: 'ios', enabled: true },
                { key: 'kakao_ad', value: 'kakao_ad_sample', enabled: true },
            ]
        },
        {
            label: '이메일 마케팅',
            description: '이메일 뉴스레터',
            params: [
                { key: 'utm_source', value: 'newsletter', enabled: true },
                { key: 'utm_medium', value: 'email', enabled: true },
                { key: 'utm_campaign', value: 'newsletter_april_2024', enabled: true },
                { key: 'utm_term', value: 'email_sample', enabled: true },
            ]
        },
        {
            label: '블로그/커머스',
            description: '블로그/리퍼럴 트래픽',
            params: [
                { key: 'ref', value: 'blog_referral', enabled: true },
                { key: 'utm_source', value: 'blog', enabled: true },
                { key: 'utm_medium', value: 'referral', enabled: true },
            ]
        },
        {
            label: '유튜브 링크',
            description: '유튜브 동영상 링크',
            params: [
                { key: 'utm_source', value: 'youtube', enabled: true },
                { key: 'utm_medium', value: 'video', enabled: true },
                { key: 'utm_campaign', value: 'video_campaign_sample', enabled: true },
            ]
        },
    ];

    // URL 파싱
    const parseUrl = useCallback((url) => {
        if (!url.trim()) {
            setError('URL을 입력해주세요.');
            return;
        }

        try {
            const urlObj = new URL(url);
            setBaseUrl(urlObj.origin + urlObj.pathname);
            
            const paramArray = [];
            urlObj.searchParams.forEach((value, key) => {
                paramArray.push({ key, value, enabled: true });
            });
            setParams(paramArray);
            setError('');
        } catch (err) {
            setError('유효하지 않은 URL 형식입니다.');
        }
    }, []);

    // 파라미터 추가
    const addParam = useCallback(() => {
        if (!newParamKey.trim()) {
            setError('파라미터 키를 입력해주세요.');
            return;
        }

        setParams([...params, { key: newParamKey.trim(), value: newParamValue, enabled: true }]);
        setNewParamKey('');
        setNewParamValue('');
        setError('');
    }, [params, newParamKey, newParamValue]);

    // 파라미터 삭제
    const removeParam = useCallback((index) => {
        setParams(params.filter((_, i) => i !== index));
    }, [params]);

    // 파라미터 토글
    const toggleParam = useCallback((index) => {
        setParams(params.map((p, i) => i === index ? { ...p, enabled: !p.enabled } : p));
    }, [params]);

    // 파라미터 값 변경
    const updateParam = useCallback((index, field, value) => {
        setParams(params.map((p, i) => i === index ? { ...p, [field]: value } : p));
    }, [params]);

    // 최종 URL 생성
    const generateUrl = useCallback(() => {
        const urlObj = new URL(baseUrl || 'https://example.com');
        
        params.filter(p => p.enabled).forEach(p => {
            urlObj.searchParams.set(p.key, p.value);
        });

        return urlObj.toString();
    }, [baseUrl, params]);

    // 클립보드 복사
    const copyUrl = useCallback(() => {
        const finalUrl = generateUrl();
        navigator.clipboard.writeText(finalUrl).then(() => {
            alert('URL이 클립보드에 복사되었습니다!');
        });
    }, [generateUrl]);

    // URL 열기
    const openUrl = useCallback(() => {
        const finalUrl = generateUrl();
        window.open(finalUrl, '_blank');
    }, [generateUrl]);

    // 파라미터 순서 이동
    const moveParam = useCallback((index, direction) => {
        const newParams = [...params];
        if (direction === 'up' && index > 0) {
            [newParams[index], newParams[index - 1]] = [newParams[index - 1], newParams[index]];
        } else if (direction === 'down' && index < newParams.length - 1) {
            [newParams[index], newParams[index + 1]] = [newParams[index + 1], newParams[index]];
        }
        setParams(newParams);
    }, [params]);

    return (
        <>
            <h1 className="sr-only">URL 파라미터 편집기 - UTM 파라미터 추출/편집 도구</h1>
            
            <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            URL 파라미터 편집기
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            URL의 파라미터를 추출, 편집, 추가하거나 UTM 템플릿을 적용합니다
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden" style={{ minHeight: 'calc(100% - 80px)' }}>
                    {/* 좌측: URL 입력 및 파라미터 목록 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">URL 입력</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-auto">
                            {/* 빠른 샘플 */}
                            <div className="mb-4">
                                <label className="text-sm text-slate-400 mb-2 block">빠른 입력:</label>
                                <div className="flex flex-wrap gap-2">
                                    {sampleUrls.map((sample, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setUrlInput(sample.text);
                                                parseUrl(sample.text);
                                            }}
                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors border border-slate-700"
                                        >
                                            {sample.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm text-slate-400 mb-2 block">URL:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://example.com?param1=value1&param2=value2"
                                        className="flex-1 bg-[#0d1117] text-[#c9d1d9] px-4 py-3 font-mono text-sm rounded-lg border border-slate-700 outline-none focus:border-brand-500"
                                    />
                                    <button
                                        onClick={() => parseUrl(urlInput)}
                                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors"
                                    >
                                        파싱
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
                                    {error}
                                </div>
                            )}

                            {/* Base URL */}
                            {baseUrl && (
                                <div className="mb-4">
                                    <label className="text-sm text-slate-400 mb-2 block">기본 URL:</label>
                                    <input
                                        type="text"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                        className="w-full bg-slate-800 text-slate-200 px-4 py-2 font-mono text-sm rounded-lg border border-slate-700 outline-none focus:border-brand-500"
                                    />
                                </div>
                            )}

                            {/* UTM 템플릿 */}
                            <div className="mb-4">
                                <label className="text-sm text-slate-400 mb-2 block">UTM 템플릿:</label>
                                <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                    <p className="text-xs text-amber-400">
                                        💡 이 템플릿은 더미 샘플 데이터입니다. 파라미터를 추가한 후 실제 사용할 값으로 수정해주세요.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {utmTemplates.map((template, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setParams([...params, ...template.params]);
                                            }}
                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-700 transition-colors"
                                            title={template.description}
                                        >
                                            {template.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 파라미터 목록 */}
                            <div className="mb-4">
                                <label className="text-sm text-slate-400 mb-2 block">파라미터 ({params.length}):</label>
                                <div className="space-y-2 max-h-[250px] overflow-auto custom-scrollbar">
                                    {params.map((param, idx) => (
                                        <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg border ${param.enabled ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                                            <input
                                                type="checkbox"
                                                checked={param.enabled}
                                                onChange={() => toggleParam(idx)}
                                                className="w-4 h-4 accent-brand-500"
                                            />
                                            <input
                                                type="text"
                                                value={param.key}
                                                onChange={(e) => updateParam(idx, 'key', e.target.value)}
                                                placeholder="키"
                                                className="w-32 bg-slate-900 text-slate-200 px-2 py-1 font-mono text-sm rounded border border-slate-700"
                                            />
                                            <span className="text-slate-500">=</span>
                                            <input
                                                type="text"
                                                value={param.value}
                                                onChange={(e) => updateParam(idx, 'value', e.target.value)}
                                                placeholder="값"
                                                className="flex-1 bg-slate-900 text-slate-200 px-2 py-1 font-mono text-sm rounded border border-slate-700"
                                            />
                                            <button
                                                onClick={() => moveParam(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveParam(idx, 'down')}
                                                disabled={idx === params.length - 1}
                                                className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                onClick={() => removeParam(idx)}
                                                className="p-1 text-red-500 hover:text-red-400"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 새 파라미터 추가 */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newParamKey}
                                    onChange={(e) => setNewParamKey(e.target.value)}
                                    placeholder="새 파라미터 키"
                                    className="flex-1 bg-slate-800 text-slate-200 px-4 py-2 font-mono text-sm rounded-lg border border-slate-700 outline-none focus:border-brand-500"
                                />
                                <input
                                    type="text"
                                    value={newParamValue}
                                    onChange={(e) => setNewParamValue(e.target.value)}
                                    placeholder="값"
                                    className="flex-1 bg-slate-800 text-slate-200 px-4 py-2 font-mono text-sm rounded-lg border border-slate-700 outline-none focus:border-brand-500"
                                />
                                <button
                                    onClick={addParam}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    추가
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 우측: 결과 */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2 py-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                                </div>
                                <span className="ml-3 text-sm font-semibold text-slate-300">생성된 URL</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4">
                            {params.length > 0 ? (
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 p-4 bg-[#0d1117] rounded-lg border border-slate-700 overflow-auto">
                                        <code className="text-brand-400 font-mono text-sm break-all">
                                            {generateUrl()}
                                        </code>
                                    </div>
                                    
                                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <h4 className="text-sm font-medium text-slate-300 mb-2">파라미터 요약:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {params.filter(p => p.enabled).map((param, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-brand-500/20 text-brand-400 text-xs rounded">
                                                    {param.key}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 mb-4 opacity-20">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </div>
                                    <p>URL을 입력하면 파라미터가 여기에 표시됩니다</p>
                                </div>
                            )}
                        </div>
                        
                        {params.length > 0 && (
                            <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 flex gap-3">
                                <button
                                    onClick={copyUrl}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-600/50"
                                >
                                    <Icons.Copy /> 복사
                                </button>
                                <button
                                    onClick={openUrl}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    🌐 브라우저에서 열기
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default UrlParamEditor;
