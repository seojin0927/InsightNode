import React, { useState, useMemo, useEffect, useCallback } from 'react';
import StudioLayout, { S, CopyBtn } from './StudioLayout';

const ACCENT = '#ef4444';

// ══════════════════════════════════════════════════════════════════
// TAB 1: chmod 권한 계산기
function PermissionCalcTab() {
    const [perms, setPerms] = useState({ owner: [true,true,false], group: [true,false,false], other: [false,false,false] });

    const toggle = (who, idx) => setPerms(p => ({ ...p, [who]: p[who].map((v, i) => i === idx ? !v : v) }));

    const octal = useMemo(() => {
        const calc = (bits) => bits[0] * 4 + bits[1] * 2 + bits[2];
        return `${calc(perms.owner)}${calc(perms.group)}${calc(perms.other)}`;
    }, [perms]);

    const symbolic = useMemo(() => {
        const s = (bits) => (bits[0] ? 'r' : '-') + (bits[1] ? 'w' : '-') + (bits[2] ? 'x' : '-');
        return `-${s(perms.owner)}${s(perms.group)}${s(perms.other)}`;
    }, [perms]);

    const ROWS = [
        { key: 'owner', label: '소유자', color: '#ef4444' },
        { key: 'group', label: '그룹', color: '#f59e0b' },
        { key: 'other', label: '기타', color: '#22c55e' },
    ];
    const COLS = ['읽기 (r)', '쓰기 (w)', '실행 (x)'];
    const COL_VALS = ['4', '2', '1'];

    const PRESETS = [
        { label: '644 – 일반 파일', value: [[ true,true,false],[true,false,false],[true,false,false]] },
        { label: '755 – 실행 파일', value: [[ true,true,true],[true,false,true],[true,false,true]] },
        { label: '700 – 개인 파일', value: [[ true,true,true],[false,false,false],[false,false,false]] },
        { label: '777 – 전체 허용', value: [[ true,true,true],[true,true,true],[true,true,true]] },
        { label: '600 – SSH 키', value: [[ true,true,false],[false,false,false],[false,false,false]] },
        { label: '440 – 읽기 전용', value: [[ true,false,false],[true,false,false],[false,false,false]] },
    ];

    return (
        <div className="space-y-4">
            {/* 권한 그리드 */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="grid grid-cols-4 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div>대상</div>
                    {COLS.map((c, i) => <div key={c} className="text-center">{c}<span className="ml-1 text-slate-700">(+{COL_VALS[i]})</span></div>)}
                </div>
                {ROWS.map(row => (
                    <div key={row.key} className="grid grid-cols-4 items-center px-4 py-3 border-t border-white/5">
                        <div className="text-sm font-bold" style={{ color: row.color }}>{row.label}</div>
                        {perms[row.key].map((v, i) => (
                            <div key={i} className="flex justify-center">
                                <button onClick={() => toggle(row.key, i)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black transition-all hover:scale-110"
                                    style={v ? { background: `${row.color}25`, border: `1.5px solid ${row.color}60`, color: row.color } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                                    {v ? '✓' : '✕'}
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* 결과 */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border text-center" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">8진수 (Octal)</div>
                    <div className="text-4xl font-black font-mono" style={{ color: ACCENT }}>{octal}</div>
                    <div className="mt-2"><CopyBtn text={octal} /></div>
                </div>
                <div className="p-4 rounded-xl border text-center" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.15)' }}>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">심볼릭 (Symbolic)</div>
                    <div className="text-2xl font-black font-mono text-slate-200 mt-1">{symbolic}</div>
                    <div className="mt-2"><CopyBtn text={symbolic} /></div>
                </div>
            </div>

            {/* 명령어 */}
            <div className="p-4 rounded-xl border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex justify-between mb-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">chmod 명령어</span>
                    <CopyBtn text={`chmod ${octal} filename`} />
                </div>
                <code className="text-sm font-mono text-emerald-400">chmod {octal} filename</code>
            </div>

            {/* 프리셋 */}
            <div>
                <label className={S.label}>자주 쓰는 권한 프리셋</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESETS.map(p => (
                        <button key={p.label} onClick={() => setPerms({ owner: p.value[0], group: p.value[1], other: p.value[2] })}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-left transition-all hover:border-red-500/30"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 2: 암호화 메모장 (AES-GCM via Web Crypto)
function SecureNoteTab() {
    const [mode, setMode] = useState('encrypt');
    const [text, setText] = useState('');
    const [password, setPassword] = useState('');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getKey = async (pwd) => {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pwd), { name: 'PBKDF2' }, false, ['deriveKey']);
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: enc.encode('insightnode-salt'), iterations: 100000, hash: 'SHA-256' },
            keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
    };

    const encrypt = async () => {
        if (!text || !password) return;
        setLoading(true); setError('');
        try {
            const key = await getKey(password);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const enc = new TextEncoder();
            const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
            const combined = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
            setResult(btoa(String.fromCharCode(...combined)));
        } catch (e) { setError('암호화 실패: ' + e.message); }
        setLoading(false);
    };

    const decrypt = async () => {
        if (!text || !password) return;
        setLoading(true); setError('');
        try {
            const combined = new Uint8Array(atob(text).split('').map(c => c.charCodeAt(0)));
            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);
            const key = await getKey(password);
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
            setResult(new TextDecoder().decode(decrypted));
        } catch { setError('복호화 실패 – 비밀번호가 올바른지 확인하세요'); }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {[['encrypt', '🔒 암호화'], ['decrypt', '🔓 복호화']].map(([v, l]) => (
                    <button key={v} onClick={() => { setMode(v); setResult(''); setError(''); }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={mode === v ? { background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)`, color: '#fff' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                        {l}
                    </button>
                ))}
            </div>
            <div>
                <label className={S.label}>{mode === 'encrypt' ? '암호화할 텍스트' : '암호화된 텍스트 (Base64)'}</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={5} className={S.textarea}
                    placeholder={mode === 'encrypt' ? '암호화할 내용을 입력하세요...' : '암호화된 Base64 텍스트를 붙여넣으세요...'} />
            </div>
            <div>
                <label className={S.label}>비밀번호 (암호화 키)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={S.input} placeholder="강력한 비밀번호를 입력하세요..." />
            </div>
            <button onClick={mode === 'encrypt' ? encrypt : decrypt} disabled={!text || !password || loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)` }}>
                {loading ? '처리 중...' : mode === 'encrypt' ? '🔒 암호화' : '🔓 복호화'}
            </button>
            {error && <div className="text-sm text-red-400 px-4 py-3 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>{error}</div>}
            {result && (
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className={S.label}>결과</label>
                        <CopyBtn text={result} />
                    </div>
                    <textarea value={result} readOnly rows={5} className={S.textarea} style={{ background: 'rgba(0,0,0,0.4)' }} />
                </div>
            )}
            <div className="text-xs text-slate-600 flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span>🔐</span>
                <span>AES-256-GCM 암호화를 사용합니다. 비밀번호를 잊으면 복호화 불가능합니다.</span>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 3: OTP / 2FA 생성기 (TOTP 기반)
function TwoFactorTab() {
    const [secret, setSecret] = useState('');
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [generated, setGenerated] = useState(false);

    const generateSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const bytes = crypto.getRandomValues(new Uint8Array(20));
        setSecret(Array.from(bytes, b => chars[b % 32]).join(''));
        setGenerated(true);
    };

    // TOTP 계산 (RFC 6238)
    const computeTotp = useCallback(async (secretStr) => {
        if (!secretStr) return '';
        try {
            // Base32 디코딩
            const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            const cleanSecret = secretStr.toUpperCase().replace(/=+$/, '');
            let bits = '';
            for (const c of cleanSecret) {
                const idx = base32Chars.indexOf(c);
                if (idx === -1) continue;
                bits += idx.toString(2).padStart(5, '0');
            }
            const bytes = new Uint8Array(Math.floor(bits.length / 8));
            for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);

            const counter = Math.floor(Date.now() / 1000 / 30);
            const counterBytes = new Uint8Array(8);
            let c = counter;
            for (let i = 7; i >= 0; i--) { counterBytes[i] = c & 0xff; c = Math.floor(c / 256); }

            const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
            const sig = await crypto.subtle.sign('HMAC', key, counterBytes);
            const hmac = new Uint8Array(sig);
            const offset = hmac[19] & 0x0f;
            const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % 1000000;
            return code.toString().padStart(6, '0');
        } catch { return '------'; }
    }, []);

    useEffect(() => {
        if (!secret) return;
        computeTotp(secret).then(setOtp);
        const interval = setInterval(async () => {
            const left = 30 - (Math.floor(Date.now() / 1000) % 30);
            setTimeLeft(left);
            if (left === 30) computeTotp(secret).then(setOtp);
        }, 1000);
        return () => clearInterval(interval);
    }, [secret, computeTotp]);

    useEffect(() => {
        setTimeLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    }, []);

    const otpauthUrl = secret ? `otpauth://totp/InsightNode?secret=${secret}&issuer=InsightNode` : '';

    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between mb-1.5">
                    <label className={S.label}>Base32 시크릿 키</label>
                    <button onClick={generateSecret} className="text-xs font-bold transition-all hover:opacity-80" style={{ color: ACCENT }}>새 키 생성</button>
                </div>
                <div className="flex gap-2">
                    <input value={secret} onChange={e => setSecret(e.target.value.toUpperCase())} placeholder="JBSWY3DPEHPK3PXP" className={`${S.input} flex-1 font-mono`} />
                    {secret && <CopyBtn text={secret} />}
                </div>
            </div>

            {secret && (
                <>
                    <div className="p-6 rounded-2xl border text-center" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">현재 OTP 코드</div>
                        <div className="text-5xl font-black font-mono tracking-[0.2em]" style={{ color: timeLeft <= 5 ? '#ef4444' : ACCENT }}>
                            {otp || '------'}
                        </div>
                        {/* 타이머 바 */}
                        <div className="mt-4 h-1.5 rounded-full overflow-hidden mx-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <div className="h-full rounded-full transition-all duration-1000" style={{
                                width: `${(timeLeft / 30) * 100}%`,
                                background: timeLeft <= 5 ? '#ef4444' : ACCENT,
                            }} />
                        </div>
                        <div className="text-sm text-slate-500 mt-2">{timeLeft}초 후 갱신</div>
                    </div>

                    <div className="p-4 rounded-xl border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.07)' }}>
                        <div className="flex justify-between mb-2">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">OTPAuth URL</span>
                            <CopyBtn text={otpauthUrl} />
                        </div>
                        <code className="text-xs text-slate-400 font-mono break-all leading-relaxed">{otpauthUrl}</code>
                    </div>
                </>
            )}

            {!secret && (
                <div className="text-center py-8">
                    <div className="text-4xl mb-3">🔐</div>
                    <p className="text-sm text-slate-500">시크릿 키를 입력하거나 새로 생성하세요</p>
                    <button onClick={generateSecret} className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}cc, ${ACCENT}90)` }}>
                        새 시크릿 키 생성
                    </button>
                </div>
            )}

            <div className="text-xs text-slate-600 flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span>ℹ️</span>
                <span>Google Authenticator, Authy 등과 호환되는 RFC 6238 기반 TOTP입니다. 시크릿 키를 앱에 등록하면 동일한 코드가 생성됩니다.</span>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 4: 개인정보 패턴 분석기
function PrivacyAnalyzerTab() {
    const [text, setText] = useState('');
    const patterns = useMemo(() => {
        if (!text) return [];
        const checks = [
            { label: '이메일', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, color: '#3b82f6', icon: '📧' },
            { label: '전화번호', regex: /(?:010|011|016|017|018|019)-?\d{3,4}-?\d{4}/g, color: '#22c55e', icon: '📱' },
            { label: '주민등록번호', regex: /\d{6}-[1-4]\d{6}/g, color: '#ef4444', icon: '🪪' },
            { label: '신용카드', regex: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, color: '#f59e0b', icon: '💳' },
            { label: 'IP 주소', regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, color: '#8b5cf6', icon: '🌐' },
            { label: 'URL', regex: /https?:\/\/[^\s]+/g, color: '#06b6d4', icon: '🔗' },
        ];
        return checks.map(c => {
            const matches = [...text.matchAll(c.regex)].map(m => m[0]);
            return { ...c, matches, count: matches.length };
        }).filter(c => c.count > 0);
    }, [text]);

    const masked = useMemo(() => {
        if (!text) return '';
        let result = text;
        const checks = [
            { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, mask: (m) => m.slice(0, 2) + '***@***' },
            { regex: /(?:010|011|016|017|018|019)-?\d{3,4}-?\d{4}/g, mask: (m) => m.slice(0, 3) + '-****-****' },
            { regex: /\d{6}-[1-4]\d{6}/g, mask: () => '******-*******' },
            { regex: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, mask: () => '****-****-****-****' },
        ];
        checks.forEach(c => { result = result.replace(c.regex, c.mask); });
        return result;
    }, [text]);

    return (
        <div className="space-y-4">
            <div>
                <label className={S.label}>텍스트 입력 (분석할 내용)</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={6} className={S.textarea}
                    placeholder="이메일, 전화번호, 주민번호 등이 포함된 텍스트를 붙여넣으세요..." />
            </div>
            {patterns.length > 0 && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {patterns.map(p => (
                            <div key={p.label} className="p-3 rounded-xl border" style={{ background: `${p.color}10`, borderColor: `${p.color}30` }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span>{p.icon}</span>
                                    <span className="text-xs font-bold" style={{ color: p.color }}>{p.label}</span>
                                </div>
                                <div className="text-2xl font-black text-white">{p.count}</div>
                                <div className="text-[10px] text-slate-500 truncate">{p.matches[0]}</div>
                            </div>
                        ))}
                    </div>
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className={S.label}>마스킹된 결과</label>
                            <CopyBtn text={masked} />
                        </div>
                        <textarea value={masked} readOnly rows={6} className={S.textarea} style={{ background: 'rgba(0,0,0,0.4)' }} />
                    </div>
                </>
            )}
            {!text && (
                <div className="text-center py-6 text-slate-600 text-sm">
                    <div className="text-3xl mb-2">🛡️</div>
                    텍스트를 입력하면 개인정보를 자동으로 감지합니다
                </div>
            )}
            {text && patterns.length === 0 && (
                <div className="text-center py-4 text-emerald-400 text-sm">
                    ✓ 개인정보 패턴이 감지되지 않았습니다
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'chmod', label: 'chmod 계산기', icon: '🔢', desc: '리눅스 파일 권한 시각적 계산기', component: PermissionCalcTab, chipLabel: 'chmod' },
    { id: 'note', label: '암호화 메모장', icon: '📝', desc: 'AES-256-GCM 브라우저 암호화', component: SecureNoteTab, chipLabel: 'AES' },
    { id: 'otp', label: 'OTP / 2FA', icon: '🔐', desc: 'TOTP 기반 2단계 인증 코드 생성기', component: TwoFactorTab, chipLabel: 'OTP' },
    { id: 'privacy', label: '개인정보 분석', icon: '🛡️', desc: '개인정보 패턴 감지 및 자동 마스킹', component: PrivacyAnalyzerTab, chipLabel: '분석' },
];

export default function SecurityStudio() {
    const [tab, setTab] = useState('chmod');
    const Comp = TABS.find(t => t.id === tab)?.component;
    return (
        <StudioLayout
            color={ACCENT}
            icon="🔒"
            title="Security Studio"
            description="chmod 권한 계산기, AES 암호화 메모장, TOTP 2FA 생성기, 개인정보 패턴 분석 및 마스킹"
            tabs={TABS}
            tab={tab}
            setTab={setTab}>
            {Comp && <Comp />}
        </StudioLayout>
    );
}
