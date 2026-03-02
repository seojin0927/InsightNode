import React, { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// 아이콘 컴포넌트
const Icon = ({ path }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ZipTools = () => {
    // === 상태 관리 ===
    const [activeTab, setActiveTab] = useState('compress'); // compress, extract
    
    // 압축 관련
    const [filesToCompress, setFilesToCompress] = useState([]);
    const [zipName, setZipName] = useState('archive');
    const [compressionLevel, setCompressionLevel] = useState('DEFLATE'); // DEFLATE, STORE
    const [password, setPassword] = useState('');
    const [isCompressing, setIsCompressing] = useState(false);

    // 압축 해제 관련
    const [uploadedZip, setUploadedZip] = useState(null);
    const [extractedFiles, setExtractedFiles] = useState([]);
    const [isExtracting, setIsExtracting] = useState(false);

    const fileInputRef = useRef(null);
    const zipInputRef = useRef(null);

    // === 파일 포맷팅 ===
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // === 압축 로직 ===
    const handleFilesUpload = (e) => {
        const selected = Array.from(e.target.files);
        setFilesToCompress(prev => [...prev, ...selected]);
    };

    const removeFile = (index) => {
        setFilesToCompress(prev => prev.filter((_, i) => i !== index));
    };

    const compressFiles = async () => {
        if (filesToCompress.length === 0) return;
        setIsCompressing(true);

        try {
            const zip = new JSZip();
            // 암호화는 JSZip 기본 지원 아님 (여기선 UI만 구현)
            
            filesToCompress.forEach(file => {
                zip.file(file.name, file);
            });

            const content = await zip.generateAsync({
                type: 'blob',
                compression: compressionLevel,
                compressionOptions: { level: compressionLevel === 'STORE' ? 1 : 6 }
            });

            saveAs(content, `${zipName || 'archive'}.zip`);
        } catch (err) {
            alert('압축 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setIsCompressing(false);
        }
    };

    // === 압축 해제 로직 ===
    const handleZipUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedZip(file);
            extractZip(file);
        }
    };

    const extractZip = async (file) => {
        setIsExtracting(true);
        setExtractedFiles([]);

        try {
            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            const files = [];

            content.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    files.push(zipEntry);
                }
            });

            setExtractedFiles(files);
        } catch (err) {
            alert('ZIP 파일을 읽을 수 없습니다.');
            console.error(err);
        } finally {
            setIsExtracting(false);
        }
    };

    const downloadExtractedFile = async (zipEntry) => {
        const blob = await zipEntry.async('blob');
        saveAs(blob, zipEntry.name.split('/').pop());
    };

    const downloadAllExtracted = async () => {
        // 이미 압축 풀린 파일들을 다시 ZIP으로 묶는 것은 비효율적이나,
        // 원본 ZIP을 다시 다운로드하는 것으로 대체하거나 기능 제거 가능.
        // 여기서는 개별 다운로드를 권장.
        alert('개별 파일 다운로드를 이용해주세요.');
    };

    return (
        <div className="w-full h-full min-h-[850px] bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">Archive Master Studio</h2>
                        <p className="text-slate-400 text-sm">ZIP 압축 및 해제 · 파일 관리자</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    {[
                        { id: 'compress', label: '파일 압축' },
                        { id: 'extract', label: '압축 해제' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                activeTab === t.id ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 메인 그리드 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* 좌측: 컨트롤 및 목록 */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-6 flex flex-col h-full shadow-inner border border-slate-700/50">
                        
                        {activeTab === 'compress' ? (
                            <>
                                {/* 파일 드롭존 */}
                                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-600 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-all cursor-pointer group mb-6">
                                    <div className="p-3 bg-slate-700 rounded-full mb-3 group-hover:bg-amber-600 transition-colors">
                                        <Icon path="M12 4v16m8-8H4" />
                                    </div>
                                    <span className="text-slate-300 font-medium">여기에 파일을 추가하세요</span>
                                    <span className="text-xs text-slate-500 mt-1">다중 선택 가능</span>
                                    <input 
                                        type="file" 
                                        multiple 
                                        className="hidden" 
                                        onChange={handleFilesUpload} 
                                        ref={fileInputRef}
                                    />
                                </label>

                                {/* 파일 목록 */}
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase">File List ({filesToCompress.length})</h3>
                                    <button 
                                        onClick={() => setFilesToCompress([])} 
                                        className="text-xs text-red-400 hover:text-red-300"
                                        disabled={filesToCompress.length === 0}
                                    >
                                        전체 삭제
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900 rounded-lg border border-slate-700 p-2">
                                    {filesToCompress.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                                            <span>압축할 파일이 없습니다.</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {filesToCompress.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700 hover:border-slate-500 transition-colors">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <Icon path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        <div className="min-w-0">
                                                            <div className="text-sm text-slate-200 truncate">{file.name}</div>
                                                            <div className="text-xs text-slate-500">{formatSize(file.size)}</div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeFile(idx)} 
                                                        className="text-slate-500 hover:text-red-400 p-1"
                                                    >
                                                        <Icon path="M6 18L18 6M6 6l12 12" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* ZIP 파일 선택 */}
                                <label className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600 mb-6 cursor-pointer hover:bg-slate-700 transition-colors">
                                    <div className="p-3 bg-amber-600 rounded-lg text-white">
                                        <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-200">ZIP 파일 열기</div>
                                        <div className="text-xs text-slate-400">{uploadedZip ? uploadedZip.name : '압축 해제할 파일을 선택하세요'}</div>
                                    </div>
                                    <input type="file" accept=".zip" className="hidden" onChange={handleZipUpload} ref={zipInputRef} />
                                </label>

                                {/* 해제된 파일 목록 */}
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase">Contents ({extractedFiles.length})</h3>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900 rounded-lg border border-slate-700 p-2">
                                    {extractedFiles.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                                            <span>파일을 열면 내용이 여기에 표시됩니다.</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {extractedFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700 hover:border-amber-500/50 transition-colors group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        <div className="min-w-0">
                                                            <div className="text-sm text-slate-200 truncate">{file.name}</div>
                                                            <div className="text-xs text-slate-500">{new Date(file.date).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => downloadExtractedFile(file)}
                                                        className="px-3 py-1.5 bg-slate-700 hover:bg-amber-600 text-slate-300 hover:text-white rounded text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        다운로드
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 우측: 옵션 패널 */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <div className="bg-slate-800 rounded-xl p-6 flex flex-col h-full shadow-inner border border-slate-700/50">
                        
                        {activeTab === 'compress' ? (
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Compression Options</h3>
                                
                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">파일 이름</label>
                                    <div className="flex items-center bg-slate-900 border border-slate-600 rounded-lg overflow-hidden">
                                        <input 
                                            type="text" 
                                            value={zipName} 
                                            onChange={(e) => setZipName(e.target.value)} 
                                            className="flex-1 bg-transparent p-3 text-white outline-none"
                                            placeholder="archive"
                                        />
                                        <span className="pr-3 text-slate-500 text-sm font-bold">.zip</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">압축 방식</label>
                                    <select 
                                        value={compressionLevel} 
                                        onChange={(e) => setCompressionLevel(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white outline-none"
                                    >
                                        <option value="DEFLATE">표준 압축 (Deflate)</option>
                                        <option value="STORE">압축 안 함 (Store)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-slate-300 mb-2 block">비밀번호 (선택)</label>
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white outline-none placeholder:text-slate-600"
                                        placeholder="암호 설정 (미지원 시 공란)"
                                        disabled
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">* 브라우저 JSZip은 암호화를 공식 지원하지 않습니다.</p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-slate-700">
                                    <div className="flex justify-between text-sm text-slate-400 mb-4">
                                        <span>예상 크기</span>
                                        <span className="text-white font-bold">
                                            {formatSize(filesToCompress.reduce((acc, f) => acc + f.size, 0))}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={compressFiles}
                                        disabled={filesToCompress.length === 0 || isCompressing}
                                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCompressing ? '압축 중...' : 'ZIP 파일 생성하기'}
                                        {!isCompressing && <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Extraction Info</h3>
                                <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">파일명</span>
                                        <span className="text-slate-300 truncate w-32 text-right">{uploadedZip ? uploadedZip.name : '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">파일 크기</span>
                                        <span className="text-slate-300">{uploadedZip ? formatSize(uploadedZip.size) : '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">포함된 파일</span>
                                        <span className="text-slate-300">{extractedFiles.length}개</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                    <p className="text-xs text-amber-200 leading-relaxed">
                                        💡 <b>Tip:</b> 압축 해제된 파일 목록에서 <b>다운로드</b> 버튼을 눌러 필요한 파일만 골라서 저장할 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ZipTools;