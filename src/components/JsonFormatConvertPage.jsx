import React, { useState, useMemo } from 'react';

const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

// ── JSON → YAML/TOML/XML (DataFormatStudio 로직) ──
function jsonToYaml(obj, indent = 0) {
    const pad = '  '.repeat(indent);
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return String(obj);
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'string') return obj.includes('\n') || obj.includes(':') || obj.startsWith('#') || obj === 'true' || obj === 'false' ? `"${obj.replace(/"/g, '\\"')}"` : obj;
    if (Array.isArray(obj)) {
        if (!obj.length) return '[]';
        return '\n' + obj.map(v => `${pad}- ${jsonToYaml(v, indent + 1)}`).join('\n');
    }
    const keys = Object.keys(obj);
    if (!keys.length) return '{}';
    return '\n' + keys.map(k => `${pad}${k}: ${jsonToYaml(obj[k], indent + 1)}`).join('\n');
}

function jsonToToml(obj, section = '') {
    const simple = [], complex = [];
    Object.entries(obj).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) complex.push([k, v]);
        else simple.push([k, v]);
    });
    let out = section ? `\n[${section}]\n` : '';
    simple.forEach(([k, v]) => {
        if (typeof v === 'string') out += `${k} = "${v}"\n`;
        else if (typeof v === 'boolean') out += `${k} = ${v}\n`;
        else if (typeof v === 'number') out += `${k} = ${v}\n`;
        else if (Array.isArray(v)) out += `${k} = [${v.map(i => typeof i === 'string' ? `"${i}"` : i).join(', ')}]\n`;
        else out += `${k} = "${JSON.stringify(v)}"\n`;
    });
    complex.forEach(([k, v]) => {
        out += jsonToToml(v, section ? `${section}.${k}` : k);
    });
    return out;
}

function jsonToXml(obj, root = 'root', indent = 0) {
    const pad = '  '.repeat(indent);
    if (typeof obj !== 'object' || obj === null) return `${pad}<${root}>${obj}</${root}>`;
    if (Array.isArray(obj)) return obj.map(v => jsonToXml(v, root, indent)).join('\n');
    const children = Object.entries(obj).map(([k, v]) => {
        const safe = k.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (Array.isArray(v)) return v.map(item => `${pad}  ${jsonToXml(item, safe, indent + 1).trimStart()}`).join('\n');
        if (typeof v === 'object' && v !== null) return `${pad}  <${safe}>\n${Object.entries(v).map(([k2, v2]) => jsonToXml(v2, k2.replace(/[^a-zA-Z0-9_-]/g, '_'), indent + 2)).join('\n')}\n${pad}  </${safe}>`;
        return `${pad}  <${safe}>${v}</${safe}>`;
    }).join('\n');
    return `${pad}<${root}>\n${children}\n${pad}</${root}>`;
}

function flattenJson(obj, prefix = '', result = {}) {
    if (typeof obj !== 'object' || obj === null) { result[prefix] = obj; return result; }
    if (Array.isArray(obj)) { obj.forEach((v, i) => flattenJson(v, `${prefix}[${i}]`, result)); return result; }
    Object.entries(obj).forEach(([k, v]) => flattenJson(v, prefix ? `${prefix}.${k}` : k, result));
    return result;
}

// ── YAML → JSON (YamlJsonConverter 로직) ──
const parseYaml = (yaml) => {
    const lines = yaml.split('\n');
    const result = {};
    const stack = [{ obj: result, indent: -1 }];
    for (const rawLine of lines) {
        if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
        const indentLevel = rawLine.match(/^(\s*)/)[1].length;
        const line = rawLine.trim();
        if (line.startsWith('- ')) {
            const parent = stack[stack.length - 1];
            const val = line.slice(2).trim();
            if (!Array.isArray(parent.arr)) parent.arr = [];
            parent.arr.push(parseValue(val));
            continue;
        }
        const colonIdx = line.indexOf(': ');
        if (colonIdx === -1 && !line.endsWith(':')) continue;
        const key = colonIdx === -1 ? line.slice(0, -1) : line.slice(0, colonIdx);
        const rawVal = colonIdx === -1 ? '' : line.slice(colonIdx + 2);
        while (stack.length > 1 && stack[stack.length - 1].indent >= indentLevel) stack.pop();
        const current = stack[stack.length - 1].obj;
        if (!rawVal) {
            current[key] = {};
            stack.push({ obj: current[key], indent: indentLevel });
        } else {
            current[key] = parseValue(rawVal);
        }
    }
    return result;
};

const parseValue = (v) => {
    if (v === 'null' || v === '~') return null;
    if (v === 'true' || v === 'yes' || v === 'on') return true;
    if (v === 'false' || v === 'no' || v === 'off') return false;
    if (!isNaN(Number(v)) && v !== '') return Number(v);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
    return v;
};

// ── XML → JSON (XmlJsonConverter 로직) ──
const xmlToObj = (xml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error('XML 파싱 오류: ' + err.textContent.slice(0, 100));
    const nodeToObj = (node) => {
        if (node.nodeType === 3) return node.textContent.trim();
        const obj = {};
        if (node.attributes) {
            for (const attr of node.attributes) obj['@' + attr.name] = attr.value;
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
            } else obj[c.nodeName] = val;
        });
        return obj;
    };
    return { [doc.documentElement.nodeName]: nodeToObj(doc.documentElement) };
};

const SAMPLE_JSON = `{
  "name": "Alice",
  "age": 30,
  "city": "Seoul",
  "hobbies": ["reading", "coding"],
  "address": {
    "street": "123 Main St",
    "zip": "12345"
  }
}`;

const JsonFormatConvertPage = () => {
    const [input, setInput] = useState('');
    const [targetFormat, setTargetFormat] = useState('yaml'); // yaml, toml, xml, flat
    const [direction, setDirection] = useState('jsonToOther'); // jsonToOther | otherToJson
    const [fileName, setFileName] = useState('');
    const [copied, setCopied] = useState(false);

    const result = useMemo(() => {
        if (!input.trim()) return { text: '', error: null };
        try {
            if (direction === 'jsonToOther') {
                const parsed = JSON.parse(input);
                switch (targetFormat) {
                    case 'yaml': return { text: `---${jsonToYaml(parsed)}\n`, error: null };
                    case 'toml': return { text: jsonToToml(parsed).trim(), error: null };
                    case 'xml': return { text: `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXml(parsed)}`, error: null };
                    case 'flat': return { text: JSON.stringify(flattenJson(parsed), null, 2), error: null };
                    default: return { text: '', error: null };
                }
            } else {
                if (targetFormat === 'yaml') {
                    const obj = parseYaml(input);
                    return { text: JSON.stringify(obj, null, 2), error: null };
                }
                if (targetFormat === 'xml') {
                    const obj = xmlToObj(input);
                    return { text: JSON.stringify(obj, null, 2), error: null };
                }
                return { text: '', error: 'TOML → JSON 역변환은 현재 지원하지 않습니다.' };
            }
        } catch (e) {
            return { text: '', error: e.message };
        }
    }, [input, targetFormat, direction]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setInput(event.target.result);
            setFileName(file.name);
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'yaml' || ext === 'yml') { setTargetFormat('yaml'); setDirection('otherToJson'); }
            else if (ext === 'xml') { setTargetFormat('xml'); setDirection('otherToJson'); }
            else { setDirection('jsonToOther'); }
        };
        reader.readAsText(file);
    };

    const copy = () => {
        if (!result.text) return;
        navigator.clipboard.writeText(result.text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    };

    const handleDownload = () => {
        if (!result.text) return;
        const ext = direction === 'jsonToOther' ? (targetFormat === 'flat' ? 'json' : targetFormat) : 'json';
        const mime = ext === 'json' ? 'application/json' : ext === 'xml' ? 'application/xml' : 'text/plain';
        const blob = new Blob([result.text], { type: `${mime};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName ? fileName.replace(/\.[^.]+$/, `.${ext}`) : `converted.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadSample = () => {
        setInput(SAMPLE_JSON);
        setFileName('sample.json');
        setDirection('jsonToOther');
    };

    const reset = () => {
        setInput('');
        setFileName('');
    };

    const formats = [
        { id: 'yaml', label: 'YAML' },
        { id: 'toml', label: 'TOML' },
        { id: 'xml', label: 'XML' },
        { id: 'flat', label: '평탄화 JSON' },
    ];

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]">
                        <Icon path="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">JSON ↔ YAML/TOML/XML</h2>
                        <p className="text-xs text-slate-500">포맷 변환 · YAML/XML 역변환 지원</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadSample} className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30 transition-all">
                        샘플 데이터
                    </button>
                    <button onClick={reset} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30 transition-all">
                        초기화
                    </button>
                </div>
            </div>

            {/* Main 2-column */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Left: Target format + Input */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Direction</h3>
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setDirection('jsonToOther')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${direction === 'jsonToOther' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    JSON →
                                </button>
                                <button
                                    onClick={() => setDirection('otherToJson')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${direction === 'otherToJson' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    → JSON
                                </button>
                            </div>
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">Target Format</h3>
                            <div className="flex flex-wrap gap-2">
                                {formats.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setTargetFormat(f.id)}
                                        disabled={direction === 'otherToJson' && f.id === 'toml'}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${targetFormat === f.id ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 tracking-wider">Input Source</h3>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700/30 transition-colors mb-3">
                                <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                <span className="mt-2 text-xs text-slate-400">JSON/YAML/XML 파일 업로드</span>
                                <input type="file" className="hidden" accept=".json,.yaml,.yml,.xml" onChange={handleFileUpload} />
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={direction === 'jsonToOther' ? 'JSON 입력...' : `${targetFormat.toUpperCase()} 입력...`}
                                className="w-full h-40 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none focus:border-green-500 outline-none custom-scrollbar"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Result */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="rounded-xl p-5 flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {direction === 'jsonToOther' ? `${targetFormat.toUpperCase()} 결과` : 'JSON 결과'}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={copy}
                                    disabled={!result.text}
                                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    {copied ? '복사됨' : '복사'}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={!result.text}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    Download
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-700 overflow-hidden relative">
                            {result.error ? (
                                <div className="h-full flex items-center justify-center text-red-400 flex-col gap-2 p-4">
                                    <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <span>{result.error}</span>
                                </div>
                            ) : !result.text ? (
                                <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-2">
                                    <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    <span className="text-xs">입력하면 자동으로 변환됩니다</span>
                                </div>
                            ) : (
                                <textarea
                                    readOnly
                                    value={result.text}
                                    className="w-full h-full bg-transparent text-slate-300 p-4 font-mono text-xs resize-none outline-none custom-scrollbar leading-relaxed whitespace-pre"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonFormatConvertPage;
