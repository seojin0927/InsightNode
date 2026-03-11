import React, { useState } from 'react';

const xmlToObj = (xml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error('XML 파싱 오류: ' + err.textContent.slice(0, 100));

    const nodeToObj = (node) => {
        if (node.nodeType === 3) return node.textContent.trim();
        const obj = {};
        if (node.attributes) {
            for (const attr of node.attributes) {
                obj['@' + attr.name] = attr.value;
            }
        }
        const children = Array.from(node.childNodes).filter(n => n.nodeType !== 3 || n.textContent.trim());
        if (children.length === 0) {
            const text = node.textContent.trim();
            if (Object.keys(obj).length === 0) return text;
            if (text) obj['#text'] = text;
            return obj;
        }
        const tagCounts = {};
        children.forEach(c => { if (c.nodeName) tagCounts[c.nodeName] = (tagCounts[c.nodeName] || 0) + 1; });

        children.forEach(c => {
            if (c.nodeType === 3) return;
            const val = nodeToObj(c);
            if (tagCounts[c.nodeName] > 1) {
                obj[c.nodeName] = obj[c.nodeName] || [];
                obj[c.nodeName].push(val);
            } else {
                obj[c.nodeName] = val;
            }
        });
        return obj;
    };
    const root = doc.documentElement;
    return { [root.nodeName]: nodeToObj(root) };
};

const objToXml = (obj, indent = 0) => {
    const sp = '  '.repeat(indent);
    if (typeof obj !== 'object' || obj === null) return String(obj);
    return Object.entries(obj).map(([k, v]) => {
        if (k.startsWith('@') || k === '#text') return '';
        if (Array.isArray(v)) return v.map(item => `${sp}<${k}>\n${typeof item === 'object' ? objToXml(item, indent + 1) : sp + '  ' + item}\n${sp}</${k}>`).join('\n');
        if (typeof v === 'object') {
            const attrs = Object.entries(v).filter(([ak]) => ak.startsWith('@')).map(([ak, av]) => ` ${ak.slice(1)}="${av}"`).join('');
            const text = v['#text'] || '';
            const children = objToXml(v, indent + 1);
            if (text) return `${sp}<${k}${attrs}>${text}</${k}>`;
            return `${sp}<${k}${attrs}>\n${children}\n${sp}</${k}>`;
        }
        return `${sp}<${k}>${v}</${k}>`;
    }).filter(Boolean).join('\n');
};

const XmlJsonConverter = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [direction, setDirection] = useState('xml2json');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const convert = () => {
        setError('');
        try {
            if (direction === 'xml2json') {
                const obj = xmlToObj(input);
                setOutput(JSON.stringify(obj, null, 2));
            } else {
                const obj = JSON.parse(input);
                const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${objToXml(obj)}`;
                setOutput(xml);
            }
        } catch (e) {
            setError(e.message);
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(()=>{});
    };

    const sampleXml = `<?xml version="1.0"?>\n<users>\n  <user id="1">\n    <name>Alice</name>\n    <email>alice@example.com</email>\n  </user>\n  <user id="2">\n    <name>Bob</name>\n    <email>bob@example.com</email>\n  </user>\n</users>`;
    const sampleJson = `{\n  "users": {\n    "user": [\n      { "@id": "1", "name": "Alice", "email": "alice@example.com" },\n      { "@id": "2", "name": "Bob", "email": "bob@example.com" }\n    ]\n  }\n}`;

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(14,165,233,0.1))', border: '1px solid rgba(96,165,250,0.2)' }}>🔄</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">XML ↔ JSON 변환기</h1>
                        <p className="text-xs text-slate-500">XML과 JSON 형식 상호 변환</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 shrink-0 flex-wrap">
                    <div className="flex rounded-xl p-0.5 gap-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <button onClick={() => { setDirection('xml2json'); setInput(''); setOutput(''); }}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={direction === 'xml2json' ? { background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', color: '#fff' } : { color: '#64748b' }}>
                            XML → JSON
                        </button>
                        <button onClick={() => { setDirection('json2xml'); setInput(''); setOutput(''); }}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={direction === 'json2xml' ? { background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', color: '#fff' } : { color: '#64748b' }}>
                            JSON → XML
                        </button>
                    </div>
                    <button onClick={() => { setInput(direction === 'xml2json' ? sampleXml : sampleJson); setOutput(''); setError(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>예시 로드</button>
                    <button onClick={convert} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 2px 10px rgba(59,130,246,0.3)' }}>
                        변환
                    </button>
                </div>

                {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>⚠️ {error}</div>}

                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                    <div className="flex-1 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{direction === 'xml2json' ? 'XML 입력' : 'JSON 입력'}</label>
                        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={`${direction === 'xml2json' ? 'XML' : 'JSON'} 데이터를 입력하세요...`} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{direction === 'xml2json' ? 'JSON 결과' : 'XML 결과'}</label>
                            {output && <button onClick={copy} className="text-[10px] px-2 py-1 rounded font-bold" style={copied ? { color: '#22c55e', background: 'rgba(34,197,94,0.1)' } : { color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>{copied ? '✓' : '복사'}</button>}
                        </div>
                        <textarea readOnly value={output || '결과가 여기에 표시됩니다...'} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" style={{ color: output ? '#e2e8f0' : '#475569' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default XmlJsonConverter;
