import React, { useState, useRef, useCallback } from 'react';

const IC = ({ d }) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

const fmt = (sec) => {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};
const fmtSize = (bytes) => {
    if (!bytes) return '–';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const VideoMasterStudio = () => {
    const [activeTab, setActiveTab] = useState('clip');
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [status, setStatus] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const [clipStart, setClipStart] = useState(0);
    const [clipEnd, setClipEnd] = useState(10);
    const [clipSpeed, setClipSpeed] = useState(1.0);
    const [clipMuted, setClipMuted] = useState(false);

    const [gifStart, setGifStart] = useState(0);
    const [gifEnd, setGifEnd] = useState(5);
    const [gifFps, setGifFps] = useState(10);
    const [gifWidth, setGifWidth] = useState(480);
    const [gifQuality, setGifQuality] = useState('medium');

    const [thumbCount, setThumbCount] = useState(1);
    const [thumbFormat, setThumbFormat] = useState('jpeg');
    const [capturedThumbs, setCapturedThumbs] = useState([]);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const abortRef = useRef(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setStatus(null);
        setCapturedThumbs([]);
    };

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        const d = videoRef.current.duration;
        setDuration(d);
        setClipEnd(Math.min(30, d));
        setGifEnd(Math.min(5, d));
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
    };

    const extractClip = useCallback(async () => {
        const video = videoRef.current, canvas = canvasRef.current;
        if (!video || !canvas) return;
        abortRef.current = false;
        setIsProcessing(true); setProgress(0);
        setStatus({ type: 'progress', msg: '클립 추출 준비 중...' });
        try {
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            const stream = canvas.captureStream(30);
            if (!clipMuted && video.captureStream) {
                try { video.captureStream().getAudioTracks().forEach(t => stream.addTrack(t)); } catch (_) {}
            }
            chunksRef.current = [];
            recorderRef.current = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
            recorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            await new Promise((resolve, reject) => {
                recorderRef.current.onstop = resolve;
                recorderRef.current.onerror = reject;
                recorderRef.current.start(100);
                const segLen = clipEnd - clipStart;
                video.currentTime = clipStart;
                video.playbackRate = clipSpeed;
                if (clipMuted) video.muted = true;
                video.onseeked = () => {
                    video.play();
                    const startReal = performance.now();
                    const drawLoop = () => {
                        if (abortRef.current) { recorderRef.current.stop(); video.pause(); reject(new Error('취소됨')); return; }
                        const elapsed = (performance.now() - startReal) / 1000 * clipSpeed;
                        const pct = Math.min(elapsed / segLen, 1);
                        setProgress(Math.round(pct * 100));
                        setStatus({ type: 'progress', msg: `클립 추출 중... ${fmt(clipStart + elapsed)} / ${fmt(clipEnd)}` });
                        ctx.drawImage(video, 0, 0);
                        if (pct < 1 && video.currentTime < clipEnd) requestAnimationFrame(drawLoop);
                        else { video.pause(); video.playbackRate = 1; video.muted = false; recorderRef.current.stop(); }
                    };
                    requestAnimationFrame(drawLoop);
                };
            });
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `clip_${clipStart.toFixed(0)}s-${clipEnd.toFixed(0)}s.webm`; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            setStatus({ type: 'success', msg: `클립 저장 완료 (${fmtSize(blob.size)}, .webm)` });
        } catch (err) {
            setStatus({ type: 'error', msg: err.message === '취소됨' ? '취소되었습니다.' : `오류: ${err.message}` });
        } finally { setIsProcessing(false); setProgress(0); }
    }, [clipStart, clipEnd, clipSpeed, clipMuted]);

    const generateGif = useCallback(async () => {
        const video = videoRef.current, canvas = canvasRef.current;
        if (!video || !canvas) return;
        abortRef.current = false;
        setIsProcessing(true); setProgress(0);
        setStatus({ type: 'progress', msg: 'GIF 프레임 캡처 중...' });
        try {
            const scaledH = Math.round(video.videoHeight * (gifWidth / video.videoWidth));
            canvas.width = gifWidth; canvas.height = scaledH;
            const ctx = canvas.getContext('2d');
            const totalFrames = Math.ceil((gifEnd - gifStart) * gifFps);
            const frames = [];
            for (let i = 0; i < totalFrames; i++) {
                if (abortRef.current) break;
                await new Promise(res => { video.currentTime = gifStart + i / gifFps; video.onseeked = res; });
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                frames.push(canvas.toDataURL(`image/${gifQuality === 'high' ? 'png' : 'jpeg'}`, gifQuality === 'low' ? 0.5 : 0.85));
                setProgress(Math.round(((i + 1) / totalFrames) * 80));
                setStatus({ type: 'progress', msg: `프레임 캡처 중... ${i + 1}/${totalFrames}` });
            }
            if (!frames.length) { setStatus({ type: 'error', msg: '캡처된 프레임이 없습니다.' }); return; }
            setProgress(85); setStatus({ type: 'progress', msg: 'WebM 클립으로 저장 중...' });
            const stream = canvas.captureStream(gifFps);
            chunksRef.current = [];
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
            recorderRef.current = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_000_000 });
            recorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            await new Promise((resolve, reject) => {
                recorderRef.current.onstop = resolve; recorderRef.current.onerror = reject;
                recorderRef.current.start(100);
                let fi = 0;
                const playFrames = () => {
                    if (fi >= frames.length) { recorderRef.current.stop(); return; }
                    const img = new Image();
                    img.onload = () => { ctx.drawImage(img, 0, 0); setProgress(85 + Math.round((fi / frames.length) * 14)); fi++; setTimeout(playFrames, 1000 / gifFps); };
                    img.src = frames[fi];
                };
                playFrames();
            });
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `gif_${gifStart.toFixed(0)}s-${gifEnd.toFixed(0)}s_${gifFps}fps.webm`; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            setProgress(100);
            setStatus({ type: 'success', msg: `WebM 애니메이션 저장 완료 (${fmtSize(blob.size)}, ${frames.length}프레임)` });
        } catch (err) {
            setStatus({ type: 'error', msg: `오류: ${err.message}` });
        } finally { setIsProcessing(false); setProgress(0); }
    }, [gifStart, gifEnd, gifFps, gifWidth, gifQuality]);

    const captureThumbnails = useCallback(async () => {
        const video = videoRef.current, canvas = canvasRef.current;
        if (!video || !canvas) return;
        setIsProcessing(true); setStatus({ type: 'progress', msg: '썸네일 추출 중...' });
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        const times = thumbCount === 1 ? [currentTime]
            : Array.from({ length: thumbCount }, (_, i) => (duration / (thumbCount + 1)) * (i + 1));
        const results = [];
        for (let i = 0; i < times.length; i++) {
            await new Promise(res => { video.currentTime = times[i]; video.onseeked = res; });
            ctx.drawImage(video, 0, 0);
            results.push({ dataUrl: canvas.toDataURL(thumbFormat === 'png' ? 'image/png' : 'image/jpeg', 0.92), time: times[i] });
            setProgress(Math.round(((i + 1) / times.length) * 100));
        }
        setCapturedThumbs(results);
        setStatus({ type: 'success', msg: `썸네일 ${results.length}장 추출 완료` });
        setIsProcessing(false); setProgress(0);
    }, [thumbCount, thumbFormat, currentTime, duration]);

    const downloadThumb = (dataUrl, time) => {
        const a = document.createElement('a');
        a.href = dataUrl; a.download = `thumb_${time.toFixed(1)}s.${thumbFormat}`; a.click();
    };

    const cancelProcessing = () => {
        abortRef.current = true;
        if (recorderRef.current && recorderRef.current.state !== 'inactive') { try { recorderRef.current.stop(); } catch (_) {} }
        if (videoRef.current) { videoRef.current.pause(); videoRef.current.playbackRate = 1; videoRef.current.muted = false; }
        setIsProcessing(false); setProgress(0);
        setStatus({ type: 'error', msg: '처리가 취소되었습니다.' });
    };

    const tabs = [
        { id: 'clip', label: '클립 추출', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
        { id: 'gif', label: 'GIF / WebM', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
        { id: 'thumbnail', label: '썸네일', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
    ];

    return (
        <div className="w-full h-full p-5 flex flex-col overflow-hidden" style={{ background: '#08101e' }}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]" style={{ background: 'rgba(139,92,246,0.15)' }}>
                        <IC d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-100">Video Master Studio</h2>
                        <p className="text-xs text-slate-500">클립 추출 · GIF/WebM · 썸네일 추출</p>
                    </div>
                </div>
                <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 gap-0.5">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === t.id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                            <IC d={t.icon} />{t.label}
                        </button>
                    ))}
                </div>
            </div>

            {status && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 shrink-0 ${
                    status.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' :
                    status.type === 'error'   ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300' :
                    'bg-violet-500/10 border border-violet-500/30 text-violet-300'}`}>
                    {status.type === 'progress' && (
                        <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                    )}
                    <span className="flex-1">{status.msg}</span>
                    {status.type === 'progress' && (
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-violet-900">
                                <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-mono">{progress}%</span>
                        </div>
                    )}
                    <button onClick={() => setStatus(null)} className="shrink-0 opacity-50 hover:opacity-100">✕</button>
                </div>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                <div className="lg:col-span-4 flex flex-col min-h-0">
                    <div className="flex-1 bg-slate-800/40 rounded-xl border border-slate-700/60 p-5 overflow-y-auto custom-scrollbar space-y-5">
                        <label className="flex items-center gap-3 w-full p-3 bg-slate-700/40 hover:bg-slate-700/70 rounded-xl border border-slate-600/60 cursor-pointer transition-colors group">
                            <div className="p-2 bg-slate-600/60 rounded-lg group-hover:bg-violet-600 transition-colors shrink-0">
                                <IC d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-200">동영상 열기</div>
                                <div className="text-xs text-slate-500 truncate">{videoFile ? `${videoFile.name} · ${fmtSize(videoFile.size)}` : 'MP4, MOV, WebM, AVI 지원'}</div>
                            </div>
                            <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} />
                        </label>

                        {activeTab === 'clip' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    선택한 구간을 <span className="text-violet-300 font-semibold">WebM 영상 파일</span>로 내보냅니다. 브라우저 내에서 직접 인코딩합니다.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] text-slate-500 mb-1 block font-semibold uppercase">시작 (초)</label>
                                        <input type="number" min={0} max={clipEnd - 0.1} step={0.5} value={clipStart}
                                            onChange={e => setClipStart(Math.max(0, Math.min(Number(e.target.value), clipEnd - 0.1)))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-500 mb-1 block font-semibold uppercase">끝 (초)</label>
                                        <input type="number" min={clipStart + 0.1} max={duration || 9999} step={0.5} value={clipEnd}
                                            onChange={e => setClipEnd(Math.max(clipStart + 0.1, Number(e.target.value)))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
                                    </div>
                                </div>
                                {duration > 0 && <div className="text-xs text-slate-500 text-center">구간: <span className="text-violet-300 font-semibold">{fmt(clipStart)} ~ {fmt(clipEnd)}</span> ({(clipEnd - clipStart).toFixed(1)}초)</div>}
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span className="font-semibold uppercase">재생 속도</span><span className="text-violet-300 font-mono">x{clipSpeed}</span></div>
                                    <input type="range" min={0.25} max={4} step={0.25} value={clipSpeed} onChange={e => setClipSpeed(Number(e.target.value))} className="w-full accent-violet-500 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer" />
                                </div>
                                <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                                    <input type="checkbox" checked={clipMuted} onChange={e => setClipMuted(e.target.checked)} className="accent-violet-500 w-4 h-4 rounded" />
                                    <span>오디오 제거 (무음 클립)</span>
                                </label>
                                {isProcessing ? (
                                    <button onClick={cancelProcessing} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                        <IC d="M6 18L18 6M6 6l12 12" /> 취소
                                    </button>
                                ) : (
                                    <button onClick={extractClip} disabled={!videoFile} className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                        <IC d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /> 클립 추출 시작
                                    </button>
                                )}
                            </div>
                        )}

                        {activeTab === 'gif' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    선택 구간을 <span className="text-fuchsia-300 font-semibold">프레임별로 캡처</span>하여 WebM 애니메이션으로 저장합니다.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] text-slate-500 mb-1 block font-semibold uppercase">시작 (초)</label>
                                        <input type="number" min={0} max={gifEnd - 0.1} step={0.5} value={gifStart} onChange={e => setGifStart(Math.max(0, Number(e.target.value)))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-500" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-500 mb-1 block font-semibold uppercase">끝 (초)</label>
                                        <input type="number" min={gifStart + 0.1} max={Math.min(gifStart + 10, duration || 10)} step={0.5} value={gifEnd} onChange={e => setGifEnd(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-500" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span className="font-semibold uppercase">FPS</span><span className="text-fuchsia-300 font-mono">{gifFps}fps · {Math.ceil((gifEnd-gifStart)*gifFps)}프레임</span></div>
                                    <input type="range" min={5} max={30} step={5} value={gifFps} onChange={e => setGifFps(Number(e.target.value))} className="w-full accent-fuchsia-500 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 mb-1 block font-semibold uppercase">출력 너비 (px)</label>
                                    <select value={gifWidth} onChange={e => setGifWidth(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
                                        <option value={320}>320px — 소형</option>
                                        <option value={480}>480px — 중형 (추천)</option>
                                        <option value={640}>640px — 대형</option>
                                        <option value={960}>960px — 고화질</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 mb-1 block font-semibold uppercase">프레임 품질</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[['low','저'],['medium','중'],['high','고']].map(([v,l]) => (
                                            <button key={v} onClick={() => setGifQuality(v)} className={`py-2 rounded-lg text-xs font-bold border transition-all ${gifQuality===v ? 'border-fuchsia-500 bg-fuchsia-500/20 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>{l}</button>
                                        ))}
                                    </div>
                                </div>
                                {isProcessing ? (
                                    <button onClick={cancelProcessing} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                        <IC d="M6 18L18 6M6 6l12 12" /> 취소
                                    </button>
                                ) : (
                                    <button onClick={generateGif} disabled={!videoFile} className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                        <IC d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /> GIF/WebM 생성
                                    </button>
                                )}
                            </div>
                        )}

                        {activeTab === 'thumbnail' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    동영상에서 <span className="text-emerald-300 font-semibold">원하는 장면을 이미지로 저장</span>합니다.
                                </p>
                                <div className="text-xs text-slate-400 bg-slate-800/60 rounded-lg p-3 flex items-center gap-2 border border-slate-700/50">
                                    <IC d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    현재 위치: <span className="text-emerald-400 font-mono font-bold">{fmt(currentTime)}</span>
                                    <span className="text-slate-600">/ {fmt(duration)}</span>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span className="font-semibold uppercase">추출 장 수</span><span className="text-emerald-300 font-mono">{thumbCount}장</span></div>
                                    <input type="range" min={1} max={12} step={1} value={thumbCount} onChange={e => setThumbCount(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer" />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 mb-1 block font-semibold uppercase">출력 포맷</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[['jpeg','JPEG (작은 용량)'],['png','PNG (무손실)']].map(([v,l]) => (
                                            <button key={v} onClick={() => setThumbFormat(v)} className={`py-2 rounded-lg text-xs font-bold border transition-all ${thumbFormat===v ? 'border-emerald-500 bg-emerald-500/20 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>{l}</button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={captureThumbnails} disabled={!videoFile || isProcessing} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                    <IC d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /> 썸네일 추출
                                </button>
                                {capturedThumbs.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-[11px] text-slate-500 font-semibold uppercase">추출된 썸네일</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {capturedThumbs.map((th, i) => (
                                                <div key={i} onClick={() => downloadThumb(th.dataUrl, th.time)} className="relative rounded-lg overflow-hidden border border-slate-700 cursor-pointer group hover:border-emerald-500 transition-colors">
                                                    <img src={th.dataUrl} alt={`thumb_${i}`} className="w-full aspect-video object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">다운로드</span>
                                                    </div>
                                                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{fmt(th.time)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-8 flex flex-col min-h-0">
                    <div className="flex-1 bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                        {videoUrl ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
                                <div className="relative w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl bg-black">
                                    <video ref={videoRef} src={videoUrl} className="w-full" controls onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} />
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-400 bg-slate-900/80 px-5 py-2 rounded-full border border-slate-700">
                                    <span className="font-medium truncate max-w-[180px]">{videoFile?.name}</span>
                                    <span className="w-px h-3 bg-slate-600" />
                                    <span>{fmtSize(videoFile?.size)}</span>
                                    <span className="w-px h-3 bg-slate-600" />
                                    <span>{fmt(duration)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 z-10 space-y-3 p-8">
                                <div className="w-20 h-20 bg-slate-700/60 rounded-2xl flex items-center justify-center mx-auto">
                                    <IC d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </div>
                                <p className="text-lg font-semibold">비디오 미리보기</p>
                                <p className="text-sm opacity-60">좌측 패널에서 동영상 파일을 열어주세요</p>
                                <div className="text-xs text-slate-600 space-y-1 mt-4">
                                    <div>• MP4, WebM, MOV, AVI 등 대부분의 형식 지원</div>
                                    <div>• 파일은 브라우저 내에서만 처리됩니다 (업로드 없음)</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default VideoMasterStudio;
