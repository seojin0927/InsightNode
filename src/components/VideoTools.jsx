import React, { useState, useRef, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const VideoMasterStudio = () => {
    // === 상태 관리 ===
    const [activeTab, setActiveTab] = useState('convert'); // convert, gif, thumbnail
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // 1. 변환 설정
    const [format, setFormat] = useState('mp4');
    const [quality, setQuality] = useState('medium'); // low, medium, high
    const [resolution, setResolution] = useState('original'); // original, 1080p, 720p, 480p
    const [speed, setSpeed] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);

    // 2. GIF 설정
    const [gifStart, setGifStart] = useState(0);
    const [gifEnd, setGifEnd] = useState(5);
    const [gifFps, setGifFps] = useState(10);
    const [gifWidth, setGifWidth] = useState(480);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // === 파일 핸들링 ===
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setGifEnd(5); // 초기값 리셋
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const vidDuration = videoRef.current.duration;
            setDuration(vidDuration);
            setGifEnd(Math.min(5, vidDuration)); // 최대 5초 기본 설정
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    // === 썸네일 추출 ===
    const captureThumbnail = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            saveAs(blob, `thumbnail_${currentTime.toFixed(1)}s.jpg`);
        }, 'image/jpeg', 0.9);
    };

    // === 처리 시뮬레이션 (Convert / GIF) ===
    const startProcessing = (type) => {
        setProcessing(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setProcessing(false);
                    // 실제 구현시에는 여기서 FFmpeg.wasm 등을 통해 생성된 파일 다운로드
                    alert(`${type === 'gif' ? 'GIF' : '동영상'} 변환이 완료되었습니다! (데모)`);
                    return 100;
                }
                return prev + (type === 'gif' ? 5 : 2); // GIF가 더 빠름 가정
            });
        }, 100);
    };

    // 시간 포맷팅 (00:00)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Icon path="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Video Master Studio</h2>
                        <p className="text-slate-400 text-sm">변환 · 편집 · GIF 생성 · 썸네일 추출</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    {[
                        { id: 'convert', label: '포맷 변환' },
                        { id: 'gif', label: 'GIF 만들기' },
                        { id: 'thumbnail', label: '썸네일 추출' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                activeTab === t.id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 메인 그리드 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 컨트롤 패널 */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner border border-slate-700/50 overflow-y-auto custom-scrollbar">
                        
                        {/* 파일 업로드 (공통) */}
                        <div className="mb-6">
                            <label className="flex items-center gap-3 w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 cursor-pointer transition-colors group">
                                <div className="p-2 bg-slate-600 rounded-lg group-hover:bg-violet-500 transition-colors">
                                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-200">동영상 열기</div>
                                    <div className="text-xs text-slate-500 truncate">{videoFile ? videoFile.name : 'MP4, MOV, AVI 지원'}</div>
                                </div>
                                <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} />
                            </label>
                        </div>

                        {/* 탭별 컨트롤 */}
                        {activeTab === 'convert' && (
                            <div className="space-y-6 animate-in slide-in-from-left duration-300">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Convert Settings</h3>
                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">출력 포맷</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['mp4', 'webm', 'gif', 'avi', 'mov', 'mkv'].map(f => (
                                            <button key={f} onClick={()=>setFormat(f)} className={`p-2 rounded border uppercase text-xs font-bold ${format === f ? 'border-violet-500 bg-violet-500/20 text-white' : 'border-slate-600 text-slate-400'}`}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">해상도</label>
                                        <select value={resolution} onChange={(e)=>setResolution(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none">
                                            <option value="original">원본 유지</option>
                                            <option value="1080p">1080p (FHD)</option>
                                            <option value="720p">720p (HD)</option>
                                            <option value="480p">480p (SD)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">화질 (Bitrate)</label>
                                        <select value={quality} onChange={(e)=>setQuality(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none">
                                            <option value="high">높음 (High)</option>
                                            <option value="medium">보통 (Medium)</option>
                                            <option value="low">낮음 (Low)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>재생 속도</span>
                                        <span>x{speed}</span>
                                    </div>
                                    <input type="range" min="0.5" max="2.0" step="0.25" value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} className="w-full accent-violet-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                        <span>0.5x</span>
                                        <span>1.0x</span>
                                        <span>2.0x</span>
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-700/50 p-3 rounded-lg">
                                    <input type="checkbox" checked={isMuted} onChange={(e) => setIsMuted(e.target.checked)} className="accent-violet-500 w-4 h-4" />
                                    <span>오디오 제거 (Mute)</span>
                                </label>

                                <button 
                                    onClick={() => startProcessing('convert')}
                                    disabled={!videoFile || processing}
                                    className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? `처리 중... ${progress}%` : '변환 시작'}
                                </button>
                            </div>
                        )}

                        {activeTab === 'gif' && (
                            <div className="space-y-6 animate-in slide-in-from-left duration-300">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">GIF Maker</h3>
                                
                                {/* 구간 설정 슬라이더 (시뮬레이션) */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>구간 선택</span>
                                        <span>{formatTime(gifStart)} - {formatTime(gifEnd)} ({Math.max(0, (gifEnd - gifStart).toFixed(1))}s)</span>
                                    </div>
                                    <div className="relative h-1 bg-slate-700 rounded-lg mb-4">
                                        {/* Range Slider 구현은 복잡하므로 단순화 */}
                                        <div className="absolute h-full bg-violet-500 rounded-lg" style={{ left: `${(gifStart/duration)*100}%`, right: `${100-(gifEnd/duration)*100}%` }}></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" value={gifStart} onChange={(e)=>setGifStart(Math.min(Number(e.target.value), gifEnd))} className="bg-slate-900 border border-slate-600 rounded p-1 text-xs text-center text-white" />
                                        <input type="number" value={gifEnd} onChange={(e)=>setGifEnd(Math.max(Number(e.target.value), gifStart))} className="bg-slate-900 border border-slate-600 rounded p-1 text-xs text-center text-white" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                                        <span>프레임 수 (FPS)</span>
                                        <span>{gifFps} fps</span>
                                    </div>
                                    <input type="range" min="5" max="30" step="5" value={gifFps} onChange={(e)=>setGifFps(Number(e.target.value))} className="w-full accent-fuchsia-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">GIF 너비 (px)</label>
                                    <select value={gifWidth} onChange={(e)=>setGifWidth(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none">
                                        <option value="320">320px (소형)</option>
                                        <option value="480">480px (중형 - 추천)</option>
                                        <option value="640">640px (대형)</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={() => startProcessing('gif')}
                                    disabled={!videoFile || processing}
                                    className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? `생성 중... ${progress}%` : 'GIF 생성하기'}
                                </button>
                            </div>
                        )}

                        {activeTab === 'thumbnail' && (
                            <div className="space-y-6 animate-in slide-in-from-left duration-300">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Frame Capture</h3>
                                <p className="text-sm text-slate-300 bg-slate-700/50 p-3 rounded-lg">
                                    오른쪽 플레이어에서 원하는 장면을 일시정지한 후 아래 버튼을 누르세요.
                                </p>
                                <button 
                                    onClick={captureThumbnail}
                                    disabled={!videoFile}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Icon path="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    현재 화면 캡처
                                </button>
                                <div className="text-center text-xs text-slate-500">
                                    현재 위치: <span className="text-emerald-400 font-mono">{formatTime(currentTime)}</span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* 우측: 미리보기 플레이어 */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-8 flex flex-col h-full shadow-inner border border-slate-700/50 items-center justify-center relative overflow-hidden">
                        
                        {/* 배경 효과 */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" 
                             style={{ 
                                 backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', 
                                 backgroundSize: '20px 20px' 
                             }}>
                        </div>

                        {videoUrl ? (
                            <div className="relative w-full max-w-3xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden group">
                                <video 
                                    ref={videoRef}
                                    src={videoUrl}
                                    className="w-full h-full object-contain"
                                    controls
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                />
                                {/* 캔버스 (숨김 - 썸네일용) */}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 z-10">
                                <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
                                    <Icon path="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </div>
                                <p className="text-xl font-medium">비디오 미리보기</p>
                                <p className="text-sm opacity-70 mt-2">좌측 메뉴에서 파일을 열어주세요</p>
                            </div>
                        )}
                        
                        {/* 하단 정보 */}
                        {videoUrl && (
                            <div className="absolute bottom-6 flex gap-4 text-xs text-slate-400 bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-md border border-slate-700">
                                <span>{videoFile.name}</span>
                                <span className="w-px h-3 bg-slate-600 self-center"></span>
                                <span>{Math.round(videoFile.size / 1024 / 1024)} MB</span>
                                <span className="w-px h-3 bg-slate-600 self-center"></span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        )}
                        
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VideoMasterStudio;