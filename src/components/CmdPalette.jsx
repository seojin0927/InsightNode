import React, { useState } from 'react';
import Icons from '../utils/Icons';

const CommandPalette = ({ isOpen, onClose, actions, isDataReady, columns = [], colTypes = {}, previewData = [] }) => {
    // 모달 및 입력 상태 관리
    const [selectedAction, setSelectedAction] = useState(null);
    const [formValues, setFormValues] = useState({});

    if (!isOpen) return null;

    // 카테고리별로 액션 묶기
    const groupedActions = actions.reduce((acc, action) => {
        const cat = action.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(action);
        return acc;
    }, {});

    // 인풋 타입에 따라 선택 가능한 컬럼 필터링
    const getOptionsForType = (type) => {
        if (type === 'select_number') return columns.filter(c => colTypes[c] === 'number');
        if (type === 'select_date') return columns.filter(c => colTypes[c] === 'date');
        return columns; // 일반 select는 모든 컬럼
    };

    // 액션 클릭 시 실행 (인풋이 필요하면 모달 띄우기, 아니면 즉시 실행)
    const handleActionClick = (action) => {
        if (!action.condition()) return; // 조건 미충족 시 실행 차단

        if (action.inputs && action.inputs.length > 0) {
            // 인풋이 필요한 경우 초기값 세팅 후 모달 열기
            const initial = {};
            action.inputs.forEach(inp => {
                if (inp.type.startsWith('select')) {
                    const opts = getOptionsForType(inp.type);
                    initial[inp.id] = opts.length > 0 ? opts[0] : '';
                } else {
                    initial[inp.id] = inp.defaultValue || '';
                }
            });
            setFormValues(initial);
            setSelectedAction(action);
        } else {
            // 인풋이 필요 없으면 즉시 실행
            action.run({});
            onClose();
        }
    };

    // 모달 내 폼 제출
    const handleFormSubmit = () => {
        if (!selectedAction) return;
        selectedAction.run(formValues);
        setSelectedAction(null);
        setFormValues({});
        onClose();
    };

    // 좌우 분할 라이브 프리뷰 입력 모달 렌더링
    const renderInputModal = () => {
        if (!selectedAction) return null;

        // 폼에서 첫 번째로 선택된 컬럼명을 찾아서 미리보기에 활용
        // (보통 id가 'col' 이거나 'col1'인 경우가 대상 컬럼임)
        const selectedColName = formValues['col'] || formValues['col1'];
        const hasPreviewData = previewData && previewData.length > 0;

        return (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                {/* max-w-4xl로 넓히고 좌우 flex 레이아웃 적용 */}
                <div className="bg-slate-900 w-full max-w-5xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* 좌측: 입력 폼 영역 */}
                    <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 min-w-[320px]">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <Icons.Magic /> {selectedAction.name}
                            </h3>
                            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{selectedAction.desc}</p>
                        </div>
                        
                        <div className="p-6 space-y-5 flex-1 bg-slate-900">
                            {selectedAction.inputs.map(inp => {
                                const isSelect = inp.type.startsWith('select');
                                const options = isSelect ? getOptionsForType(inp.type) : [];

                                return (
                                    <div key={inp.id}>
                                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                                            {inp.label} {options.length === 0 && isSelect && <span className="text-red-400 text-xs ml-2">(사용 가능한 컬럼 없음)</span>}
                                        </label>
                                        
                                        {isSelect ? (
                                            <select
                                                value={formValues[inp.id] || ''}
                                                onChange={e => setFormValues({ ...formValues, [inp.id]: e.target.value })}
                                                className="w-full bg-slate-950 text-slate-200 px-4 py-3 text-sm rounded-xl border border-slate-700 outline-none focus:border-brand-500 transition-colors"
                                                disabled={options.length === 0}
                                            >
                                                {options.length === 0 ? (
                                                    <option value="">적용 가능한 컬럼이 없습니다</option>
                                                ) : (
                                                    options.map(c => <option key={c} value={c}>{c}</option>)
                                                )}
                                            </select>
                                        ) : (
                                            <input
                                                type={inp.type}
                                                value={formValues[inp.id] || ''}
                                                onChange={e => setFormValues({ ...formValues, [inp.id]: e.target.value })}
                                                placeholder={inp.placeholder}
                                                className="w-full bg-slate-950 text-slate-200 px-4 py-3 text-sm rounded-xl border border-slate-700 outline-none focus:border-brand-500 transition-colors"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="p-5 border-t border-slate-800 bg-slate-950/50 flex gap-3 justify-end shrink-0">
                            <button 
                                onClick={() => setSelectedAction(null)}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleFormSubmit}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg"
                            >
                                적용하기
                            </button>
                        </div>
                    </div>

                    {/* 우측: 실시간 데이터 미리보기 영역 */}
                    <div className="flex-[1.2] bg-slate-950 p-6 flex flex-col hidden md:flex">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-brand-400 flex items-center gap-2 uppercase tracking-wider">
                                <Icons.Table /> 원본 데이터 스냅샷
                            </h4>
                            <span className="text-xs text-slate-500 font-mono">TOP ROWS</span>
                        </div>
                        
                        {!selectedColName ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30 text-slate-500">
                                <div className="w-8 h-8 mb-2 opacity-50"><Icons.Columns /></div>
                                <p className="text-sm text-center leading-relaxed">좌측에서 대상 컬럼을 선택하시면<br/>실제 데이터가 이곳에 표시됩니다.</p>
                            </div>
                        ) : !hasPreviewData ? (
                            <div className="flex-1 flex items-center justify-center border border-slate-800 rounded-xl bg-slate-900/30 text-slate-500 text-sm">
                                표시할 데이터가 없습니다.
                            </div>
                        ) : (
                            <div className="border border-slate-700 rounded-xl overflow-hidden shadow-inner flex-1 bg-slate-900/50 flex flex-col">
                                <table className="w-full text-left border-collapse table-fixed">
                                    <thead>
                                        <tr className="bg-slate-800 border-b border-slate-700">
                                            <th className="py-3 px-4 text-xs font-semibold text-slate-400 w-16 border-r border-slate-700">#</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-slate-200">
                                                <span className="bg-brand-500/20 text-brand-400 px-2 py-1 rounded-md">{selectedColName}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="overflow-y-auto block h-full w-full" style={{ display: 'table-row-group' }}>
                                        {previewData.map((row, idx) => (
                                            <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-4 text-xs text-slate-500 font-mono border-r border-slate-800/50 w-16 truncate">
                                                    {row._rowid || idx + 1}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-300 font-mono truncate" title={String(row[selectedColName])}>
                                                    {row[selectedColName] === null || row[selectedColName] === undefined 
                                                        ? <span className="text-slate-600 italic">null</span> 
                                                        : String(row[selectedColName]) || <span className="text-slate-600 italic">empty</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 flex gap-3 items-start">
                            <div className="shrink-0 w-5 h-5 mt-0.5"><Icons.Alert /></div>
                            <p className="leading-relaxed">
                                선택하신 <strong className="text-blue-300">{selectedColName || '컬럼'}</strong> 데이터를 기준으로 변환 작업이 일괄 실행됩니다. 작업 후 언제든 상단의 [이전 결과로 되돌리기]가 가능합니다.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    // 카테고리별 테마 색상 (태그용)
    const categoryColors = {
        'Clean': 'bg-blue-500/10 text-blue-400',
        'Text': 'bg-green-500/10 text-green-400',
        'Math': 'bg-purple-500/10 text-purple-400',
        'Stats': 'bg-orange-500/10 text-orange-400',
        'Date': 'bg-yellow-500/10 text-yellow-400',
        'Security': 'bg-red-500/10 text-red-400',
        'Logic': 'bg-cyan-500/10 text-cyan-400',
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
        >
            <div 
                className="bg-slate-950 w-full max-w-7xl h-[90vh] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                {/* 상단 헤더 영역 */}
                <div className="p-6 md:px-8 md:py-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg">
                            <Icons.Magic />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">데이터 매직 도구함</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {isDataReady 
                                    ? '원하는 기능을 클릭하여 데이터를 손쉽게 가공하세요.'
                                    : '데이터를 먼저 불러오면 도구함이 활성화됩니다.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-800">
                        <Icons.Close />
                    </button>
                </div>

                {/* 내부에 뜨는 자체 모달 렌더링 (폼 클릭시 활성화) */}
                {renderInputModal()}

                {/* 액션 카드 리스트 영역 */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {Object.entries(groupedActions).map(([category, categoryActions]) => (
                        <div key={category} className="mb-10 last:mb-0">
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-md inline-block ${categoryColors[category] || 'bg-slate-800 text-slate-300'}`}>
                                {category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {categoryActions.map((a, i) => {
                                    // 조건 검사 (데이터가 없거나, 조건에 맞는 컬럼이 없으면 false)
                                    const isAvailable = isDataReady && a.condition();
                                    
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => handleActionClick(a)}
                                            // 어지러운 스케일 모션을 빼고 차분한 색상 전환(transition-colors)만 남겨 안정감을 부여함
                                            className={`flex flex-col p-5 rounded-2xl border transition-colors duration-200 ${
                                                isAvailable 
                                                    ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-brand-500/50 cursor-pointer shadow-sm'
                                                    : 'bg-slate-900/30 border-slate-800/50 opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <span className={`text-base font-bold leading-tight ${isAvailable ? 'text-slate-200' : 'text-slate-500'}`}>
                                                    {a.name}
                                                </span>
                                                {/* 사용 가능 여부 뱃지 추가 */}
                                                {!isAvailable && (
                                                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-500 flex items-center gap-1">
                                                        <Icons.Lock /> 조건 미달
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                                                {a.desc}
                                            </div>
                                            
                                            <div className="mt-auto pt-3 border-t border-slate-800/50">
                                                <div className="text-xs text-slate-400 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center">
                                                    <span className="text-brand-500/80 font-bold mr-2">EX</span>
                                                    <span className="truncate">{a.example}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;