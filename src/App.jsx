import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import DataGrid from './components/DataGrid';
import ChartViewer from './components/ChartViewer';
import CmdPalette from './components/CmdPalette';
import Icons from './utils/Icons';
import { initSqlEngine, runQuery, createTableFromData, updateCell, detectColumnTypes, exportToCSV, exportToJSON } from './utils/sqlEngine';

// 수정됨: 10번째 줄 데이터 누락값(country, temp_c, rating 등)을 채워 18개 컬럼 수에 맞게 정렬했습니다.
const SAMPLE_DATA = `id,date,time,department,employee,email,phone,card_no,revenue,cost,satisfaction,is_active,tags,description,ip_address,country,temp_c,rating
1,2023-10-01,09:15:00,Engineering,Alice Smith,alice@example.com,01012345678,1234567812345678,15000,8000,4.8,true,#code #tech,Highly skilled lead developer.,192.168.0.1,Korea,22.5,5
2,2023-10-02,10:30:00,Sales,Bob Jones,bob.jones@salesforce.org,01098765432,5555666677778888,32000,12000,4.2,true,#sales #goal,Top salesperson of the month.,172.16.0.42,USA,18.2,4
3,2023-10-03,14:00:00,Marketing,Charlie Brown,charlie@marketing.com,01055554444,1111222233334444,8500,9000,3.9,false,#ads #creative,Creative director with vision.,10.0.0.5,UK,15.0,3
4,2023-10-04,11:45:00,Engineering,Diana Prince,diana@themyscira.io,01011112222,9999888877776666,18000,7500,4.9,true,#security #infra,Security specialist and admin.,192.168.1.10,Greece,28.4,5
5,2023-10-05,16:20:00,Sales,Evan Wright,evan@sales.net,01022223333,4444333322221111,29000,15000,4.0,true,#closing,Junior sales rep.,172.16.5.11,Canada,5.5,4
6,2023-10-06,08:50:00,HR,Fiona Gallagher,fiona@hr-plus.co,01033334444,8888777766665555,0,2000,4.5,true,#people,Human resources manager.,10.0.10.5,Ireland,12.0,5
7,2023-10-07,13:10:00,Engineering,George Miller,george@post-apoc.au,01044445555,7777666655554444,14500,13000,4.1,false,#mechanic,Hardware engineer.,192.168.10.2,Australia,35.2,4
8,2023-10-08,17:05:00,Sales,Hannah Abbott,hannah@potion.uk,01066667777,6666555544443333,31000,11000,4.7,true,#retail,Retail expert.,172.30.1.1,UK,14.5,5
9,2023-10-09,12:40:00,Marketing,Ian Somerhalder,ian@vamp.com,01077778888,2222111100009999,9200,4000,3.8,true,#social,Social media manager.,10.5.5.5,USA,21.0,3
10,2023-10-10,15:55:00,Executive,Jack Torrance,jack@overlook.hotel,01088889999,3333444455556666,55000,50000,2.5,true,#writer,Chief Executive Officer.,192.168.50.2,USA,20.0,4`;

function App() {
    const [db, setDb] = useState(null);

    const [loading, setLoading] = useState('엔진 초기화 중...');
    const [leftTab, setLeftTab] = useState('nocode');
    const [viewMode, setViewMode] = useState('grid');
    const [originalData, setOriginalData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [allColumns, setAllColumns] = useState([]);
    const [data, setData] = useState([]);
    const [query, setQuery] = useState('SELECT rowid as _rowid, * FROM main_table LIMIT 1000;');
    const [cmdOpen, setCmdOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [colTypes, setColTypes] = useState({});

    const [ncFilters, setNcFilters] = useState([]);
    const [ncSortCol, setNcSortCol] = useState('');
    const [ncSortDir, setNcSortDir] = useState('ASC');
    const [ncGroupCol, setNcGroupCol] = useState('');
    const [ncAggFn, setNcAggFn] = useState('SUM');
    const [ncAggCol, setNcAggCol] = useState('');
    const [ncDistinct, setNcDistinct] = useState(false);
    const [ncLimit, setNcLimit] = useState(1000);
    const [ncSelectedCols, setNcSelectedCols] = useState([]);
    
    // 🆕 혁신적 기능들
    const [ncDateRollup, setNcDateRollup] = useState(''); // 날짜 주기 묶기
    const [ncGrowthRate, setNcGrowthRate] = useState(false); // 증감률 변환
    const [ncPareto80, setNcPareto80] = useState(false); // 파레토 80/20
    const [ncAutoBucket, setNcAutoBucket] = useState(''); // 자동 구간화
    const [ncIgnoreNull, setNcIgnoreNull] = useState(true); // 결측치 무시
    const [ncNaturalFilter, setNcNaturalFilter] = useState(''); // 자연어 필터

    // 🆕 워터마크 설정 (대외비)
    const [watermarkEnabled, setWatermarkEnabled] = useState(false);
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [watermarkDesign, setWatermarkDesign] = useState('single'); // single, multiple, corner

    // 결과 기록 관리 (이전 결과로 되돌리기 기능)
    const [resultHistory, setResultHistory] = useState([]);

    // 🆕 앱 로드 시 자동으로 샘플 데이터 로드
    useEffect(() => {
        const init = async () => {
            try {
                const database = await initSqlEngine();
                setDb(database);
                
                // 🆕 DB 준비 완료 후 자동으로 샘플 데이터 로드
                if (database) {
                    const parsed = Papa.parse(SAMPLE_DATA, { header: true, dynamicTyping: true });
                    if (parsed.data && parsed.data.length > 0) {
                        setOriginalData(parsed.data);
                        const cols = Object.keys(parsed.data[0]);
                        setAllColumns(cols);
                        setNcSelectedCols(cols);
                        setColTypes(detectColumnTypes(parsed.data));
                        createTableFromData(database, 'main_table', parsed.data);
                        const result = runQuery(database, 'SELECT rowid as _rowid, * FROM main_table LIMIT 1000;');
                        if (result && result.columns) {
                            const newCols = result.columns.filter(c => c !== '_rowid');
                            setColumns(newCols);
                            setData(result.data);
                            setQuery('SELECT rowid as _rowid, * FROM main_table LIMIT 1000;');
                        }
                    }
                }
                
                setLoading('');
            } catch (e) {
                setLoading('엔진 에러: ' + e.message);
            }
        };
        init();
        const handleKD = (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setCmdOpen(true);
            }
        };
        window.addEventListener('keydown', handleKD);
        return () => window.removeEventListener('keydown', handleKD);
    }, []);

    // 수정됨: DB 내용을 강제로 변경하기 전에 SQLite 원본 데이터까지 백업하는 전용 함수
    const saveHistoryBeforeMutation = useCallback(() => {
        if (!db || data.length === 0) return;
        let tableBackup = [];
        try {
            const res = runQuery(db, "SELECT * FROM main_table");
            if (res && res.data) {
                tableBackup = JSON.parse(JSON.stringify(res.data));
            }
        } catch (e) {
            console.error("백업 생성 중 오류 발생:", e);
        }

        const historyItem = {
            data: JSON.parse(JSON.stringify(data)),
            columns: [...columns],
            query: query,
            tableBackup: tableBackup, // 실제 DB 테이블 통째로 백업
            timestamp: Date.now()
        };
        setResultHistory(prev => [...prev, historyItem].slice(-20));
    }, [db, data, columns, query]);

    // 이전 결과로 되돌리기
    const goBackToPreviousResult = () => {
        if (resultHistory.length > 0) {
            const previousResult = resultHistory[resultHistory.length - 1];
            
            // 수정됨: React UI 데이터 복원뿐만 아니라, 백업된 실제 SQLite DB 상태도 롤백
            if (db && previousResult.tableBackup && previousResult.tableBackup.length > 0) {
                try {
                    db.run('DROP TABLE IF EXISTS main_table;');
                    createTableFromData(db, 'main_table', previousResult.tableBackup);
                } catch (e) {
                    console.error('DB 복원 에러:', e);
                }
            }

            setData(previousResult.data);
            setColumns(previousResult.columns);
            setQuery(previousResult.query);
            
            // 기록에서 제거
            setResultHistory(prev => prev.slice(0, -1));
        }
    };

    const executeSQL = useCallback((q, skipHistory = false) => {
        if (!db) return;
        
        // 수정됨: 쿼리 변동 시에도 DB 상태를 백업하여 동기화
        if (!skipHistory && data.length > 0 && q !== query) {
            let tableBackup = [];
            try {
                const res = runQuery(db, "SELECT * FROM main_table");
                if (res && res.data) tableBackup = JSON.parse(JSON.stringify(res.data));
            } catch (e) {}

            const historyItem = {
                data: JSON.parse(JSON.stringify(data)),
                columns: [...columns],
                query: query,
                tableBackup: tableBackup,
                timestamp: Date.now()
            };
            setResultHistory(prev => [...prev, historyItem].slice(-20));
        }
        
        try {
            const result = runQuery(db, q);
            if (result && result.columns) {
                const newCols = result.columns.filter(c => c !== '_rowid');
                setColumns(newCols);
                if (q.includes('main_table') && !q.includes('GROUP BY') && allColumns.length === 0) {
                    setAllColumns(newCols);
                }
                setData(result.data);
                setQuery(q);
            } else {
                setData([]);
            }
        } catch (e) {
            console.error("SQL 에러: " + e.message);
        }
    }, [db, allColumns, data, columns, query]);

    const executeSQLNoHistory = useCallback((q) => {
        return executeSQL(q, true);
    }, [executeSQL]);

    const applyNoCodeBuilder = () => {
        runNoCodeBuilder();
    };

    const processFile = (file) => {
        if (!file) return;
        setLoading(`${file.name} 파싱 중...`);
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                loadData(results.data);
            },
            error: (error) => {
                alert('파일 파싱 에러: ' + error.message);
                setLoading('');
            }
        });
    };

    const loadData = (arr) => {
        if (!db || !arr.length) return;
        setLoading('메모리 적재 중...');
        setTimeout(() => {
            try {
                setOriginalData(arr);
                const cols = Object.keys(arr[0]);
                setAllColumns(cols);
                setNcSelectedCols(cols);
                setColTypes(detectColumnTypes(arr));
                createTableFromData(db, 'main_table', arr);
                executeSQL('SELECT rowid as _rowid, * FROM main_table LIMIT 1000;', true);
                setViewMode('grid');
            } catch (e) {
                alert("적재 에러: " + e.message);
            } finally {
                setLoading('');
            }
        }, 50);
    };

    const handleCellUpdate = (id, col, val) => {
        if (!db || id == null) return;
        saveHistoryBeforeMutation(); // 수정됨: 셀 수정 전에도 백업
        updateCell(db, 'main_table', id, col, val);
        setData(prev => prev.map(r => r._rowid === id ? { ...r, [col]: val } : r));
    };

    const runNoCodeBuilder = useCallback(() => {
        if (!db || allColumns.length === 0) return;
        
        const selectedCols = ncSelectedCols.length > 0 
            ? allColumns.filter(c => ncSelectedCols.includes(c))
            : allColumns;
        
        let q = "SELECT ";
        if (ncDistinct) q += "DISTINCT ";
        
        if (ncGroupCol) {
            q += `"${ncGroupCol}", ${ncAggFn}("${ncAggCol || selectedCols[0]}") AS "${ncAggFn}_Result" FROM main_table`;
        } else {
            const sel = selectedCols.map(c => `"${c}"`).join(', ');
            q += `rowid as _rowid, ${sel} FROM main_table`;
        }
        
        if (ncFilters.length > 0) {
            const conds = ncFilters.filter(f => f.val !== '').map(f => {
                const safe = f.val.replace(/'/g, "''");
                if (f.op === 'LIKE') return `"${f.col}" LIKE '%${safe}%'`;
                if (f.op === 'NOT LIKE') return `"${f.col}" NOT LIKE '%${safe}%'`;
                if (f.op === 'gt') return `"${f.col}" > '${safe}'`;
                if (f.op === 'lt') return `"${f.col}" < '${safe}'`;
                return `"${f.col}" ${f.op} '${safe}'`;
            }).join(' AND ');
            if (conds) q += ` WHERE ${conds}`;
        }
        
        if (ncGroupCol) q += ` GROUP BY "${ncGroupCol}"`;
        if (ncSortCol) q += ` ORDER BY "${ncSortCol}" ${ncSortDir}`;
        q += ` LIMIT ${ncLimit};`;
        
        executeSQLNoHistory(q);
    }, [db, allColumns, ncFilters, ncSortCol, ncSortDir, ncGroupCol, ncAggFn, ncAggCol, ncDistinct, ncLimit, ncSelectedCols, executeSQLNoHistory]);

    const applyJSTransform = (colName, fn) => {
        if (!db || !allColumns.includes(colName)) return;
        saveHistoryBeforeMutation(); // 수정됨: 트랜스폼 적용 전 백업

        const res = db.exec(`SELECT rowid, "${colName}" FROM main_table`);
        if (!res.length) return;
        
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare(`UPDATE main_table SET "${colName}" = ? WHERE rowid = ?`);
        res[0].values.forEach(r => {
            let newVal = fn(r[1]);
            if (typeof newVal === 'number' && isNaN(newVal)) newVal = null;
            stmt.run([newVal != null ? String(newVal) : null, r[0]]);
        });
        stmt.free();
        db.run('COMMIT;');
        executeSQL(query, true); // 히스토리 저장을 스킵(미리 저장했으므로)
    };

    const addColumnAndTransform = (newCol, baseCol, fn) => {
        if (!db || !allColumns.includes(baseCol)) return;
        saveHistoryBeforeMutation(); // 수정됨: 새 컬럼 추가 전 백업

        try {
            db.run(`ALTER TABLE main_table ADD COLUMN "${newCol}" TEXT;`);
        } catch (e) {}
        
        if (!allColumns.includes(newCol)) setAllColumns([...allColumns, newCol]);
        
        const res = db.exec(`SELECT rowid, "${baseCol}" FROM main_table`);
        if (!res.length) return;
        
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare(`UPDATE main_table SET "${newCol}" = ? WHERE rowid = ?`);
        res[0].values.forEach(r => stmt.run([fn(r[1]) != null ? String(fn(r[1])) : null, r[0]]));
        stmt.free();
        db.run('COMMIT;');
        executeSQL(query, true);
    };

    const selectCol = (msg, filterType) => {
        const available = filterType ? allColumns.filter(c => colTypes[c] === filterType) : allColumns;
        const c = prompt(`${msg}\n사용가능한 컬럼:\n${available.join(', ')}`, available[0]);
        return allColumns.includes(c) ? c : null;
    };

    const selectTwoCols = (msg) => {
        const c = prompt(`${msg}\n사용가능한 컬럼:\n${allColumns.join(', ')}`, allColumns.slice(0, 2).join(', '));
        const parts = c ? c.split(',').map(x => x.trim()) : [];
        if (parts.length >= 2 && allColumns.includes(parts[0]) && allColumns.includes(parts[1])) {
            return parts;
        }
        alert('두 개의 컬럼을 쉼표로 구분하여 입력해주세요.');
        return null;
    };

    const actions = useMemo(() => [
        { 
            name: "결측치(Null) 행 제거", category: "Clean", desc: "비어있는 값이 하나라도 있는 행을 삭제합니다.", example: "Row with Null -> [Deleted]", 
            condition: () => allColumns.length > 0, 
            run: () => { saveHistoryBeforeMutation(); const c = allColumns.map(x => `"${x}" IS NULL OR "${x}"=''`).join(' OR '); db.run(`DELETE FROM main_table WHERE ${c}`); executeSQL(query, true); } 
        },
        { 
            name: "비정상 공백 제거 (Trim)", category: "Clean", desc: "텍스트 앞뒤의 불필요한 공백을 제거합니다.", example: " apple  -> apple", 
            condition: () => allColumns.length > 0, 
            inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }],
            run: ({ col }) => applyJSTransform(col, v => v ? String(v).trim() : v) 
        },
        { 
            name: "텍스트 쪼개기 (Split)", category: "Text", desc: "특정 기호를 기준으로 컬럼을 두 개로 분할합니다.", example: "a-b -> [a, b]", 
            condition: () => allColumns.length > 0, 
            inputs: [
                { id: 'col', type: 'select', label: '대상 컬럼' },
                { id: 'sep', type: 'text', label: '분할 기준 문자', placeholder: '예: -, _, ,' }
            ],
            run: ({ col, sep }) => {
                if (col && sep) {
                    addColumnAndTransform(`${col}_1`, col, v => v ? String(v).split(sep)[0] : '');
                    addColumnAndTransform(`${col}_2`, col, v => v ? String(v).split(sep)[1] || '' : '');
                }
            } 
        },
        { 
            name: "텍스트 찾기 및 바꾸기", category: "Text", desc: "특정 단어를 다른 단어로 모두 치환합니다.", example: "apple -> fruit", 
            condition: () => allColumns.length > 0, 
            inputs: [
                { id: 'col', type: 'select', label: '대상 컬럼' },
                { id: 'find', type: 'text', label: '찾을 단어', placeholder: '찾을 텍스트 입력' },
                { id: 'replace', type: 'text', label: '바꿀 단어', placeholder: '바꿀 텍스트 입력' }
            ],
            run: ({ col, find, replace }) => applyJSTransform(col, v => v ? String(v).split(find).join(replace || '') : v) 
        },
        { 
            name: "앞 N글자 자르기", category: "Text", desc: "텍스트 앞쪽부터 N글자를 잘라냅니다.", example: "Hello -> Hel (3글자)", 
            condition: () => allColumns.length > 0, 
            inputs: [
                { id: 'col', type: 'select', label: '대상 컬럼' },
                { id: 'n', type: 'number', label: '자를 글자 수', placeholder: '예: 3' }
            ],
            run: ({ col, n }) => { if(col && n) applyJSTransform(col, v => v ? String(v).slice(0, parseInt(n)) : v); } 
        },
        { 
            name: "대문자로 변환 (UPPER)", category: "Text", desc: "영문 소문자를 대문자로 바꿉니다.", example: "apple -> APPLE", 
            condition: () => allColumns.length > 0, 
            inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }],
            run: ({ col }) => applyJSTransform(col, v => v ? String(v).toUpperCase() : v) 
        },
        { 
            name: "반올림 (Round)", category: "Math", desc: "숫자를 정수로 반올림합니다.", example: "3.6 -> 4", 
            condition: () => Object.values(colTypes).includes('number'), 
            inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼 선택' }],
            run: ({ col }) => applyJSTransform(col, v => !isNaN(Number(v)) ? Math.round(Number(v)) : v) 
        },
        { 
            name: "값의 범위 제한 (Clipping)", category: "Stats", desc: "상하위 값을 특정 범위로 제한합니다.", example: "120 -> 100 (max 100)", 
            condition: () => Object.values(colTypes).includes('number'), 
            inputs: [
                { id: 'col', type: 'select_number', label: '대상 컬럼 (숫자형)' },
                { id: 'min', type: 'number', label: '최소값', placeholder: '예: 0' },
                { id: 'max', type: 'number', label: '최대값', placeholder: '예: 100' }
            ],
            run: ({ col, min, max }) => {
                if (col && min && max) applyJSTransform(col, v => {
                    const n = Number(v);
                    return !isNaN(n) ? Math.min(Math.max(n, parseFloat(min)), parseFloat(max)) : v;
                });
            } 
        },
        { 
            name: "날짜에서 연도 추출", category: "Date", desc: "날짜에서 4자리 연도만 가져옵니다.", example: "2023-10 -> 2023", 
            condition: () => Object.values(colTypes).includes('date'), 
            inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼 선택' }],
            run: ({ col }) => addColumnAndTransform(`${col}_year`, col, v => { const d = new Date(v); return isNaN(d) ? null : d.getFullYear(); }) 
        },
        { 
            name: "전화번호 마스킹", category: "Security", desc: "전화번호 중간 자리를 별표로 가립니다.", example: "010-1234-5678 -> 010-****-5678", 
            condition: () => allColumns.length > 0, 
            inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }],
            run: ({ col }) => applyJSTransform(col, v => { const s = String(v).replace(/\D/g, ''); return s.length === 11 ? s.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3') : v; }) 
        },
        { 
            name: "IF-THEN 조건부 생성", category: "Logic", desc: "조건을 만족하면 A, 아니면 B를 입력합니다.", example: "score>=60 -> Pass/Fail", 
            condition: () => Object.values(colTypes).includes('number'), 
            inputs: [
                { id: 'col', type: 'select_number', label: '기준 컬럼 (숫자형)' },
                { id: 'threshold', type: 'number', label: '기준값', placeholder: '예: 60' },
                { id: 'trueVal', type: 'text', label: '조건 충족 시 값', placeholder: '예: Pass' },
                { id: 'falseVal', type: 'text', label: '조건 미충족 시 값', placeholder: '예: Fail' }
            ],
            run: ({ col, threshold, trueVal, falseVal }) => {
                if (col && threshold) applyJSTransform(col, v => Number(v) >= parseFloat(threshold) ? trueVal : falseVal);
            } 
        },
        { 
            name: "텍스트 결합 (Merge)", category: "Text", desc: "두 개의 컬럼을 하나로 합칩니다.", example: "성 + 이름 -> 이름", 
            condition: () => allColumns.length >= 2, 
            inputs: [
                { id: 'col1', type: 'select', label: '첫 번째 컬럼' },
                { id: 'col2', type: 'select', label: '두 번째 컬럼' },
                { id: 'sep', type: 'text', label: '결합 구분자 (공백 가능)', placeholder: '예: 띄어쓰기 한 번' }
            ],
            run: ({ col1, col2, sep }) => {
                if (col1 && col2) addColumnAndTransform(`${col1}_${col2}`, col1, v => v ? String(v) + (sep || '') + String(originalData.find(r => r[col1] === v)?.[col2] || '') : '');
            } 
        }
        // (참고: 위 패턴처럼 기존 기능들의 selectCol과 prompt를 inputs 배열로만 정의해주시면, 새 모달이 자동으로 모든 폼을 생성해 줍니다!)
    ], [allColumns, colTypes, db, query, executeSQL, originalData, saveHistoryBeforeMutation]);

    const exportData = (type) => {
        if (!data.length) return alert('내보낼 데이터가 없습니다.');
        let content, mime, ext;
        if (type === 'csv') {
            content = exportToCSV(data, columns);
            mime = 'text/csv';
            ext = 'csv';
        } else if (type === 'json') {
            content = exportToJSON(data);
            mime = 'application/json';
            ext = 'json';
        }
        if (content) {
            const blob = new Blob([content], { type: mime });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `insightnode_export.${ext}`;
            a.click();
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const response = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    columns,
                    chartType: 'bar',
                    filters: ncFilters,
                    sortConfig: { column: ncSortCol, direction: ncSortDir },
                    groupConfig: { column: ncGroupCol, aggFn: ncAggFn, aggCol: ncAggCol }
                })
            });
            const result = await response.json();
            if (result.success) {
                alert(`공유 링크가 생성되었습니다!\nURL: http://localhost:3000/shared/${result.shareId}`);
            } else {
                alert('공유 실패: ' + result.error);
            }
        } catch (error) {
            console.error("공유 실패:", error);
            alert("공유 실패: 서버 연결을 확인해주세요.");
        }
        setIsSharing(false);
    };

    const isDataReady = allColumns.length > 0;

    return (
        <div className="app-wrapper bg-slate-950">
            <div className="max-w-[1800px] mx-auto w-full h-full flex flex-col">
                <header className="app-header border border-slate-700/50 bg-slate-900/80 backdrop-blur-md rounded-2xl flex items-center justify-between px-6 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg text-lg">IN</div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-100 tracking-tight">InsightNode (인사이트노드) - 직장인을 위한 마법의 스튜디오</h1>
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-slate-400 flex items-center gap-1"><Icons.Shield /> 100% Offline WASM Engine</p>
                                <p className="text-sm text-emerald-400 flex items-center gap-1">
                                    🔒 내 데이터가 서버로 넘어갈까 걱정? 개인의 대외비 데이터가 절대 외부로 유출되지 않습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCmdOpen(true)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-md text-base font-semibold border transition-all shadow-lg ${isDataReady ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 hover:border-brand-500' : 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'}`}
                        >
                            <Icons.Magic /> 매직 지능형 도구함 <span className="font-mono opacity-50 ml-1">Ctrl+K</span>
                        </button>
                        <button className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-md text-base font-medium transition-colors" onClick={() => document.getElementById('file-in').click()}>
                            데이터 열기
                        </button>
                        <input type="file" id="file-in" className="hidden" accept=".csv,.json" onChange={e => processFile(e.target.files[0])} />
                    </div>
                </header>

                {/* 🆕 워터마크 설정 패널 */}
                <div id="watermark-panel" className="hidden bg-slate-900 border-b border-slate-700 p-4">
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                <input 
                                    type="checkbox" 
                                    checked={watermarkEnabled} 
                                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                                    className="w-4 h-4 accent-red-500"
                                />
                                워터마크 활성화
                            </label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-400">텍스트:</label>
                            <input 
                                type="text" 
                                value={watermarkText}
                                onChange={(e) => setWatermarkText(e.target.value)}
                                placeholder="워터마크 텍스트"
                                className="bg-slate-800 text-slate-200 px-3 py-1.5 text-sm rounded border border-slate-600 outline-none focus:border-red-500 w-40"
                                disabled={!watermarkEnabled}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-400">디자인:</label>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setWatermarkDesign('single')}
                                    disabled={!watermarkEnabled}
                                    className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${watermarkDesign === 'single' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50'}`}
                                >
                                    크게 하나
                                </button>
                                <button 
                                    onClick={() => setWatermarkDesign('multiple')}
                                    disabled={!watermarkEnabled}
                                    className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${watermarkDesign === 'multiple' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50'}`}
                                >
                                    다수 배치
                                </button>
                                <button 
                                    onClick={() => setWatermarkDesign('corner')}
                                    disabled={!watermarkEnabled}
                                    className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${watermarkDesign === 'corner' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50'}`}
                                >
                                    코너 배치
                                </button>
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 ml-auto">
                            * 워터마크는 PNG/HTML/Excel 내보내기 시 적용됩니다
                        </div>
                    </div>
                </div>

                <div className="main-wrapper">
                    <div className="sidebar bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl flex flex-col z-10 shadow-xl overflow-hidden">
                        <div className="flex text-sm font-semibold border-b border-slate-800 bg-slate-950">
                            <button
                                onClick={() => setLeftTab('nocode')}
                                className={`flex-1 py-4 flex items-center justify-center gap-2 ${leftTab === 'nocode' ? 'text-brand-400 border-b-2 border-brand-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Icons.Wand /> 노코드 빌더
                            </button>
                            <button
                                onClick={() => setLeftTab('sql')}
                                className={`flex-1 py-4 flex items-center justify-center gap-2 ${leftTab === 'sql' ? 'text-brand-400 border-b-2 border-brand-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Icons.Code /> SQL 작성
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                            {!isDataReady ? (
                                <div className="text-center text-slate-500 text-base mt-10">
                                    파일을 불러오거나<br />
                                    <button onClick={() => loadData(Papa.parse(SAMPLE_DATA, { header: true, dynamicTyping: true }).data)} className="mt-4 text-brand-400 underline hover:text-brand-300 text-base">샘플 데이터 로드</button>
                                </div>
                            ) : leftTab === 'nocode' ? (
                                <div className="flex flex-col gap-6">
                                    {/* 🆕 자연어 필터 (NLP) */}
                                    <div className="p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/20 rounded-xl border border-indigo-500/30">
                                        <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            🔍 자연어 필터
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="예: revenue 10000 이상 and country USA" 
                                            value={ncNaturalFilter}
                                            onChange={e => setNcNaturalFilter(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && ncNaturalFilter.trim()) {
                                                    // 자연어를 필터로 변환
                                                    const text = ncNaturalFilter.toLowerCase();
                                                    let newFilters = [...ncFilters];
                                                    
                                                    // 숫자 + 이상/이하 패턴
                                                    const numMatch = text.match(/(\w+)\s*(\d+以上|이상|초과|이하|미만|小于)?/);
                                                    if (numMatch) {
                                                        const col = numMatch[1];
                                                        const op = text.includes('이상') || text.includes('>=') || text.includes('以上') ? '>=' : 
                                                                   text.includes('초과') || text.includes('>') ? '>' :
                                                                   text.includes('이하') || text.includes('<=') || text.includes('以下') ? '<=' : 
                                                                   text.includes('미만') || text.includes('<') ? '<' : '=';
                                                        const val = numMatch[2] ? numMatch[2].replace(/[^0-9]/g, '') : '';
                                                        if (val && allColumns.includes(col)) {
                                                            newFilters.push({ id: Date.now(), col, op, val });
                                                            setNcFilters(newFilters);
                                                            setNcNaturalFilter('');
                                                        }
                                                    }
                                                }
                                            }}
                                            className="w-full bg-slate-900/80 text-slate-200 px-4 py-2.5 text-sm rounded-lg border border-indigo-500/30 outline-none focus:border-indigo-400 placeholder:text-slate-500"
                                        />
                                        <p className="text-[10px] text-indigo-300/60 mt-1">엔터를 누르면 필터에 추가됩니다 (영문 지원)</p>
                                    </div>

                                    {/* 🆕 결측치 무시 토글 */}
                                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                        <span className="text-sm font-medium text-slate-300">빈 데이터(Null) 무시</span>
                                        <button 
                                            onClick={() => setNcIgnoreNull(!ncIgnoreNull)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${ncIgnoreNull ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                        >
                                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${ncIgnoreNull ? 'left-7' : 'left-1'}`}></span>
                                        </button>
                                    </div>

                                    {/* 🆕 날짜 주기 묶기 */}
                                    {ncGroupCol && colTypes[ncGroupCol] === 'date' && (
                                        <div className="p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/20 rounded-xl border border-amber-500/30">
                                            <label className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                📅 날짜 주기 묶기
                                            </label>
                                            <div className="flex gap-2 flex-wrap">
                                                {[
                                                    { val: '', label: '원본' },
                                                    { val: 'day', label: '일별' },
                                                    { val: 'week', label: '주별' },
                                                    { val: 'month', label: '월별' },
                                                    { val: 'quarter', label: '분기별' },
                                                    { val: 'year', label: '연도별' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => setNcDateRollup(opt.val)}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ncDateRollup === opt.val ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 🆕 자동 구간화 (Auto-Bucketing) */}
                                    {ncGroupCol && colTypes[ncGroupCol] === 'number' && (
                                        <div className="p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/20 rounded-xl border border-cyan-500/30">
                                            <label className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                📊 자동 구간화
                                            </label>
                                            <div className="flex gap-2 flex-wrap">
                                                {[
                                                    { val: '', label: '사용안함' },
                                                    { val: '10', label: '10단위' },
                                                    { val: '100', label: '100단위' },
                                                    { val: '1000', label: '1000단위' },
                                                    { val: '10000', label: '10000단위' },
                                                    { val: 'age', label: '연령대' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => setNcAutoBucket(opt.val)}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ncAutoBucket === opt.val ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 block">표시 컬럼 ({ncSelectedCols.length})</label>
                                        <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-2">
                                            {allColumns.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setNcSelectedCols(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                                                    className={`px-3 py-2 rounded text-sm font-medium transition-colors border ${ncSelectedCols.includes(c) ? 'bg-brand-500/10 text-brand-400 border-brand-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">조건 필터</label>
                                            <button onClick={() => setNcFilters([...ncFilters, { id: Date.now(), col: ncSelectedCols.length > 0 ? ncSelectedCols[0] : allColumns[0], op: '=', val: '' }])} className="text-sm text-brand-400 flex items-center gap-1">
                                                <Icons.Plus /> 추가
                                            </button>
                                        </div>
                                        {ncFilters.map(f => (
                                            <div key={f.id} className="flex gap-2 mb-3">
                                                <select
                                                    className="flex-1 bg-slate-950 text-sm text-slate-200 p-3 rounded border border-slate-700 outline-none"
                                                    value={f.col}
                                                    onChange={e => setNcFilters(ncFilters.map(i => i.id === f.id ? { ...i, col: e.target.value } : i))}
                                                >
                                                    {allColumns.map(c => <option key={c}>{c}</option>)}
                                                </select>
                                                <select
                                                    className="w-[80px] bg-slate-950 text-sm text-slate-200 p-3 rounded border border-slate-700 outline-none"
                                                    value={f.op}
                                                    onChange={e => setNcFilters(ncFilters.map(i => i.id === f.id ? { ...i, op: e.target.value } : i))}
                                                >
                                                    <option value="=">=</option>
                                                    <option value="gt">보다 큼</option>
                                                    <option value="lt">보다 작음</option>
                                                    <option value="LIKE">포함</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    className="w-[100px] bg-slate-950 text-sm text-slate-200 p-3 rounded border border-slate-700 outline-none"
                                                    value={f.val}
                                                    onChange={e => setNcFilters(ncFilters.map(i => i.id === f.id ? { ...i, val: e.target.value } : i))}
                                                />
                                                <button onClick={() => setNcFilters(ncFilters.filter(i => i.id !== f.id))} className="text-red-500">
                                                    <Icons.Trash />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
                                        <label className="text-sm font-bold text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Icons.Database /> 피벗 / 그룹화
                                        </label>
                                        <select
                                            className="bg-slate-900 text-slate-200 p-3 rounded border border-slate-700 w-full mb-3 text-base outline-none"
                                            value={ncGroupCol}
                                            onChange={e => setNcGroupCol(e.target.value)}
                                        >
                                            <option value="">-- 사용 안함 --</option>
                                            {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        {ncGroupCol && (
                                            <div className="flex gap-2 text-base">
                                                <select
                                                    className="w-1/3 bg-slate-900 text-slate-200 p-3 rounded border border-slate-700 outline-none"
                                                    value={ncAggFn}
                                                    onChange={e => setNcAggFn(e.target.value)}
                                                >
                                                    <option value="SUM">합계</option>
                                                    <option value="AVG">평균</option>
                                                    <option value="COUNT">개수</option>
                                                    <option value="MAX">최대</option>
                                                    <option value="MIN">최소</option>
                                                </select>
                                                <select
                                                    className="flex-1 bg-slate-900 text-slate-200 p-3 rounded border border-slate-700 outline-none"
                                                    value={ncAggCol}
                                                    onChange={e => setNcAggCol(e.target.value)}
                                                >
                                                    {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 bg-slate-950 text-sm text-slate-200 p-3 rounded border border-slate-700 outline-none"
                                            value={ncSortCol}
                                            onChange={e => setNcSortCol(e.target.value)}
                                        >
                                            <option value="">-- 정렬 안함 --</option>
                                            {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select
                                            className="w-28 bg-slate-950 text-sm text-slate-200 p-3 rounded border border-slate-700 outline-none"
                                            value={ncSortDir}
                                            onChange={e => setNcSortDir(e.target.value)}
                                        >
                                            <option value="ASC">오름차순</option>
                                            <option value="DESC">내림차순</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 block">Limit: {ncLimit}</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="10000"
                                            step="10"
                                            value={ncLimit}
                                            onChange={e => setNcLimit(Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>

                                    <button
                                        onClick={applyNoCodeBuilder}
                                        className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-base mt-2"
                                    >
                                        <Icons.Play /> 적용
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full gap-4">
                                    <textarea
                                        className="w-full h-[350px] bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm rounded-xl border border-slate-700 outline-none resize-none"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        spellCheck="false"
                                    />
                                    <button
                                        onClick={() => executeSQL(query)}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-base"
                                    >
                                        <Icons.Play /> 실행
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="main-content bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 overflow-hidden">
                        {loading && (
                            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                <div className="w-14 h-14 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-brand-400 font-medium animate-pulse text-lg">{loading}</p>
                            </div>
                        )}

                        {!isDataReady && !loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                                <div className="bg-slate-800/50 p-8 rounded-full mb-6 text-slate-500">
                                    <Icons.Upload />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-200 mb-3">데이터를 불러오세요</h2>
                                <button
                                    onClick={() => loadData(Papa.parse(SAMPLE_DATA, { header: true, dynamicTyping: true }).data)}
                                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold border border-slate-700 shadow-xl text-base"
                                >
                                    테스트 데이터셋 로드
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                <div className="flex justify-between items-center mb-4 shrink-0">
                                    {/* 🆕 샘플 데이터 표시 배너 */}
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-500/30 rounded-lg mr-4">
                                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="text-xs font-bold text-amber-400">📌 데모 데이터 (샘플)</span>
                                    </div>

                                    <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 shadow-inner">
                                        {[
                                            { id: 'raw', icon: <Icons.Eye />, label: '원본' },
                                            { id: 'grid', icon: <Icons.Table />, label: '결과 그리드' },
                                            { id: 'chart', icon: <Icons.Chart />, label: '차트' }
                                        ].map(mode => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setViewMode(mode.id)}
                                                className={`px-5 py-3 text-base font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === mode.id ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {mode.icon} {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {resultHistory.length > 0 && (
                                            <button
                                                onClick={goBackToPreviousResult}
                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md"
                                                title={`${resultHistory.length}개의 이전 결과로 되돌아가기`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                </svg>
                                                이전 결과로 ({resultHistory.length})
                                            </button>
                                        )}
                                        <div className="text-sm text-slate-500 bg-slate-900 px-5 py-3 rounded-xl border border-slate-800 font-mono">
                                            <span>ROWS: <b>{viewMode === 'raw' ? originalData.length : data.length}</b></span>
                                            <span className="mx-2">|</span>
                                            <span>COLS: <b>{columns.length}</b></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden relative">
                                    {viewMode === 'raw' && <DataGrid data={originalData} columns={Object.keys(originalData[0] || {})} readOnly={true} watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} />}
                                    {viewMode === 'grid' && <DataGrid data={data} columns={columns} onUpdate={handleCellUpdate} watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} />}
                                    {viewMode === 'chart' && <ChartViewer data={data} columns={columns} watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} />}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <CmdPalette 
                    isOpen={cmdOpen} 
                    onClose={() => setCmdOpen(false)} 
                    actions={actions} 
                    isDataReady={isDataReady}
                    columns={allColumns}
                    colTypes={colTypes}
		    previewData={data.slice(0, 5)}
                />
            </div>
        </div>
    );
}

export default App;