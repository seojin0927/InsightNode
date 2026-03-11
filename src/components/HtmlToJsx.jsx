import React, { useState } from 'react';

const ATTR_MAP_HTML_TO_JSX = {
    'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'readonly': 'readOnly', 'maxlength': 'maxLength',
    'cellpadding': 'cellPadding', 'cellspacing': 'cellSpacing', 'rowspan': 'rowSpan', 'colspan': 'colSpan',
    'usemap': 'useMap', 'frameborder': 'frameBorder', 'contenteditable': 'contentEditable', 'crossorigin': 'crossOrigin',
    'accesskey': 'accessKey', 'autocomplete': 'autoComplete', 'autofocus': 'autoFocus', 'autoplay': 'autoPlay',
    'enctype': 'encType', 'hreflang': 'hrefLang', 'novalidate': 'noValidate',
};

const htmlToJsx = (html) => {
    let result = html;
    result = result.replace(/\sstyle="([^"]*)"/g, (_, style) => {
        const props = style.split(';').filter(Boolean).map(prop => {
            const [key, ...vals] = prop.split(':');
            const camelKey = key.trim().replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            const val = vals.join(':').trim();
            const numVal = parseFloat(val);
            const isNumeric = !isNaN(numVal) && val === String(numVal);
            return `${camelKey}: ${isNumeric ? numVal : `'${val}'`}`;
        }).join(', ');
        return ` style={{ ${props} }}`;
    });
    result = result.replace(/\s(on\w+)=/g, (_, attr) => ` ${attr.replace(/on(\w)/, (_, c) => 'on' + c.toUpperCase())}`);
    Object.entries(ATTR_MAP_HTML_TO_JSX).forEach(([html, jsx]) => {
        result = result.replace(new RegExp(`\\s${html}=`, 'g'), ` ${jsx}=`);
        result = result.replace(new RegExp(`\\s${html}\\s`, 'g'), ` ${jsx} `);
    });
    const selfClose = ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'];
    selfClose.forEach(tag => {
        result = result.replace(new RegExp(`<${tag}([^>]*)>`, 'gi'), `<${tag}$1 />`);
        result = result.replace(new RegExp(`<${tag}([^/]*)/>`, 'gi'), `<${tag}$1 />`);
    });
    result = result.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');
    return result;
};

const jsxToHtml = (jsx) => {
    let result = jsx;
    result = result.replace(/\sstyle=\{\{\s*([^}]+)\}\}/g, (_, inner) => {
        const props = inner.split(',').map(p => {
            const [key, ...vals] = p.split(':');
            const k = (key.trim().replace(/([A-Z])/g, '-$1').toLowerCase()).replace(/^-/, '');
            const v = vals.join(':').trim().replace(/^['"]|['"]$/g, '');
            return `${k}: ${v}`;
        }).join('; ');
        return ` style="${props}"`;
    });
    result = result.replace(/\s(on[A-Z]\w+)=/g, (_, attr) => ` ${attr.replace(/([A-Z])/, (_, c) => 'on' + c.toLowerCase())}=`);
    Object.entries(ATTR_MAP_HTML_TO_JSX).forEach(([htmlAttr, jsxAttr]) => {
        result = result.replace(new RegExp(`\\s${jsxAttr}=`, 'g'), ` ${htmlAttr}=`);
        result = result.replace(new RegExp(`\\s${jsxAttr}\\s`, 'g'), ` ${htmlAttr} `);
    });
    const selfClose = ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'];
    selfClose.forEach(tag => {
        result = result.replace(new RegExp(`<${tag}([^>]*)\\s*/>`, 'gi'), `<${tag}$1>`);
    });
    result = result.replace(/\{\/\*([\s\S]*?)\*\/\}/g, '<!--$1-->');
    return result;
};

const SAMPLE_HTML = `<div class="container" style="background-color: #fff; padding: 20px;">
  <h1 class="title" onclick="handleClick()">Hello World</h1>
  <input type="text" class="input" placeholder="Enter text" readonly>
  <label for="myInput">Label</label>
  <img src="image.jpg" alt="Image">
  <!-- This is a comment -->
</div>`;

const SAMPLE_JSX = `<div className="container" style={{ backgroundColor: '#fff', padding: '20px' }}>
  <h1 className="title" onClick="handleClick()">Hello World</h1>
  <input type="text" className="input" placeholder="Enter text" readOnly />
  <label htmlFor="myInput">Label</label>
  <img src="image.jpg" alt="Image" />
  {/* This is a comment */}
</div>`;

const HtmlToJsx = () => {
    const [mode, setMode] = useState('htmlToJsx'); // htmlToJsx | jsxToHtml
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [wrapComponent, setWrapComponent] = useState(false);
    const [copied, setCopied] = useState(false);

    const convert = () => {
        if (!input.trim()) return;
        if (mode === 'htmlToJsx') {
            let jsx = htmlToJsx(input);
            if (wrapComponent) {
                jsx = `const MyComponent = () => {\n  return (\n${jsx.split('\n').map(l => '    ' + l).join('\n')}\n  );\n};\n\nexport default MyComponent;`;
            }
            setOutput(jsx);
        } else {
            setOutput(jsxToHtml(input));
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(()=>{});
    };

    const loadSample = () => {
        if (mode === 'htmlToJsx') { setInput(SAMPLE_HTML); setOutput(''); }
        else { setInput(SAMPLE_JSX); setOutput(''); }
    };

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(249,115,22,0.1))', border: '1px solid rgba(251,146,60,0.2)' }}>⚛️</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">HTML ↔ JSX 변환기</h1>
                        <p className="text-xs text-slate-500">양방향 변환 · class↔className, style 변환</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4 shrink-0">
                    <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button onClick={() => setMode('htmlToJsx')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${mode === 'htmlToJsx' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>HTML → JSX</button>
                        <button onClick={() => setMode('jsxToHtml')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${mode === 'jsxToHtml' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>JSX → HTML</button>
                    </div>
                    {mode === 'htmlToJsx' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={wrapComponent} onChange={e => setWrapComponent(e.target.checked)} className="accent-orange-500 w-4 h-4" style={{ background: 'transparent', border: 'none' }} />
                            <span className="text-xs text-slate-400">React 컴포넌트로 감싸기</span>
                        </label>
                    )}
                    <button onClick={loadSample} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>예시 로드</button>
                    <button onClick={convert} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 10px rgba(249,115,22,0.3)' }}>변환</button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 shrink-0">
                    {[
                        { from: 'class', to: 'className' },
                        { from: 'for', to: 'htmlFor' },
                        { from: 'style=""', to: 'style={{}}' },
                        { from: 'onclick', to: 'onClick' },
                        { from: '<br>', to: '<br />' },
                        { from: '<!-- -->', to: '{/* */}' },
                    ].map(r => (
                        <div key={r.from} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px]" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                            <span className="font-mono text-slate-500">{r.from}</span>
                            <span className="text-slate-600">↔</span>
                            <span className="font-mono text-orange-400">{r.to}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                    <div className="flex-1 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{mode === 'htmlToJsx' ? 'HTML 입력' : 'JSX 입력'}</label>
                        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'htmlToJsx' ? 'HTML 코드를 붙여넣으세요...' : 'JSX 코드를 붙여넣으세요...'} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{mode === 'htmlToJsx' ? 'JSX 결과' : 'HTML 결과'}</label>
                            {output && <button onClick={copy} className="text-[10px] px-2 py-1 rounded font-bold" style={copied ? { color: '#22c55e', background: 'rgba(34,197,94,0.1)' } : { color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>{copied ? '✓' : '복사'}</button>}
                        </div>
                        <textarea readOnly value={output || (mode === 'htmlToJsx' ? 'JSX 결과가 여기에 표시됩니다...' : 'HTML 결과가 여기에 표시됩니다...')} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" style={{ color: output ? '#e2e8f0' : '#475569' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HtmlToJsx;
