import React, { useState } from 'react';

// Simple YAML ↔ JSON converter (no external lib)
const jsonToYaml = (obj, indent = 0) => {
    const sp = '  '.repeat(indent);
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'string') {
        if (/[:#{}[\],&*?|<>=!%@`]/.test(obj) || obj.includes('\n') || /^(true|false|null|yes|no|on|off)$/i.test(obj)) {
            return `"${obj.replace(/"/g, '\\"')}"`;
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map(item => {
            const val = jsonToYaml(item, indent + 1);
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                return `${sp}- ${val.trimStart()}`;
            }
            return `${sp}- ${val}`;
        }).join('\n');
    }
    if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        return keys.map(k => {
            const v = obj[k];
            if (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0) {
                return `${sp}${k}:\n${jsonToYaml(v, indent + 1)}`;
            }
            if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
                return `${sp}${k}:\n${jsonToYaml(v, indent + 1)}`;
            }
            return `${sp}${k}: ${jsonToYaml(v, indent)}`;
        }).join('\n');
    }
    return String(obj);
};

// Simple YAML parser (handles basic YAML)
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

const YamlJsonConverter = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [direction, setDirection] = useState('json2yaml');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const convert = () => {
        setError('');
        try {
            if (direction === 'json2yaml') {
                const obj = JSON.parse(input);
                setOutput(jsonToYaml(obj));
            } else {
                const obj = parseYaml(input);
                setOutput(JSON.stringify(obj, null, 2));
            }
        } catch (e) {
            setError('변환 오류: ' + e.message);
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(()=>{});
    };

    const sampleJson = `{\n  "server": {\n    "host": "localhost",\n    "port": 8080,\n    "debug": true\n  },\n  "database": {\n    "url": "postgresql://localhost:5432/mydb",\n    "pool_size": 10\n  },\n  "features": ["auth", "logging", "caching"]\n}`;
    const sampleYaml = `server:\n  host: localhost\n  port: 8080\n  debug: true\ndatabase:\n  url: "postgresql://localhost:5432/mydb"\n  pool_size: 10\nfeatures:\n  - auth\n  - logging\n  - caching`;

    return (
        <div className="w-full h-full flex flex-col p-5 overflow-hidden" style={{ background: '#08101e' }}>
            <div className="rounded-2xl p-5 flex flex-col h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(16,185,129,0.1))', border: '1px solid rgba(74,222,128,0.2)' }}>⚙️</div>
                    <div>
                        <h1 className="text-base font-bold text-slate-100">YAML ↔ JSON 변환기</h1>
                        <p className="text-xs text-slate-500">YAML과 JSON 형식 상호 변환 · 설정 파일 변환</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 shrink-0 flex-wrap">
                    <div className="flex rounded-xl p-0.5 gap-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <button onClick={() => { setDirection('json2yaml'); setInput(''); setOutput(''); }} className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all" style={direction === 'json2yaml' ? { background: 'linear-gradient(135deg, #4ade80, #22d3ee)', color: '#fff' } : { color: '#64748b' }}>JSON → YAML</button>
                        <button onClick={() => { setDirection('yaml2json'); setInput(''); setOutput(''); }} className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all" style={direction === 'yaml2json' ? { background: 'linear-gradient(135deg, #22d3ee, #4ade80)', color: '#fff' } : { color: '#64748b' }}>YAML → JSON</button>
                    </div>
                    <button onClick={() => { setInput(direction === 'json2yaml' ? sampleJson : sampleYaml); setOutput(''); setError(''); }} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>예시 로드</button>
                    <button onClick={convert} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #4ade80, #06b6d4)', boxShadow: '0 2px 10px rgba(74,222,128,0.3)' }}>변환</button>
                </div>

                {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>⚠️ {error}</div>}

                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                    <div className="flex-1 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{direction === 'json2yaml' ? 'JSON 입력' : 'YAML 입력'}</label>
                        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={`${direction === 'json2yaml' ? 'JSON' : 'YAML'} 데이터를 입력하세요...`} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{direction === 'json2yaml' ? 'YAML 결과' : 'JSON 결과'}</label>
                            {output && <button onClick={copy} className="text-[10px] px-2 py-1 rounded font-bold" style={copied ? { color: '#22c55e', background: 'rgba(34,197,94,0.1)' } : { color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>{copied ? '✓' : '복사'}</button>}
                        </div>
                        <textarea readOnly value={output || '결과가 여기에 표시됩니다...'} className="flex-1 w-full p-3 text-xs rounded-xl outline-none resize-none font-mono custom-scrollbar" style={{ color: output ? '#e2e8f0' : '#475569' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YamlJsonConverter;
