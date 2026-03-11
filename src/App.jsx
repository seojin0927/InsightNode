import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import Papa from 'papaparse';
import DataGrid from './components/DataGrid';
import NocodeEngineeringTools from './components/NocodeEngineeringTools';

const ChartViewer = lazy(() => import('./components/ChartViewer'));
const PivotTable = lazy(() => import('./components/PivotTable'));
const CmdPalette = lazy(() => import('./components/CmdPalette'));
const Calculator = lazy(() => import('./components/Calculator'));
const QrCodeGenerator = lazy(() => import('./components/QrCodeGenerator'));
const ImageTools = lazy(() => import('./components/ImageTools'));
const VideoTools = lazy(() => import('./components/VideoTools'));
const DigitalStampSignStudio = lazy(() => import('./components/DigitalStampSignStudio'));

import EncodingConverter from './components/EncodingConverter';
import HtmlTableExtractor from './components/HtmlTableExtractor';
import TextExtractor from './components/TextExtractor';
import ListToCommaConverter from './components/ListToCommaConverter';
import ListComparator from './components/ListComparator';
import PersonalDataMasker from './components/PersonalDataMasker';
import MockDataGenerator from './components/MockDataGenerator';
import CodeMinifier from './components/CodeMinifier';
import ImageCompressor from './components/ImageCompressor';
import JsonFormatter from './components/JsonFormatter';
import MarkdownEditor from './components/MarkdownEditor';
import PdfConverter from './components/PdfConverter';
import RegexTester from './components/RegexTester';
import UnitConverter from './components/UnitConverter';
import UuidGenerator from './components/UuidGenerator';
import ZipTools from './components/ZipTools';
import ServiceCenter from './components/ServiceCenter';
import Icons from './utils/Icons';
import HomePage from './components/HomePage';
import CryptoEncoder from './components/CryptoEncoder';
import NumberBaseConverter from './components/NumberBaseConverter';
import MorseConverter from './components/MorseConverter';
import LoremIpsumGenerator from './components/LoremIpsumGenerator';
import PasswordGenerator from './components/PasswordGenerator';
import SqlFormatter from './components/SqlFormatter';
import CsvToSqlInsert from './components/CsvToSqlInsert';
import XmlJsonConverter from './components/XmlJsonConverter';
import RomanNumeralConverter from './components/RomanNumeralConverter';
import CronParser from './components/CronParser';
import OgTagGenerator from './components/OgTagGenerator';
import YamlJsonConverter from './components/YamlJsonConverter';
import HtmlToJsx from './components/HtmlToJsx';
import JsonFormatterPage from './components/JsonFormatterPage';
import JsonCsvPage from './components/JsonCsvPage';
import JsonFormatConvertPage from './components/JsonFormatConvertPage';
import JsonPathPage from './components/JsonPathPage';
import JsonToSqlPage from './components/JsonToSqlPage';
import FileNoticePage from './components/FileNoticePage';
import ExcelJsonPage from './components/ExcelJsonPage';
import CsvMergeSplitPage from './components/CsvMergeSplitPage';
import { initSqlEngine, runQuery, createTableFromData, updateCell, detectColumnTypes, exportToCSV, exportToJSON } from './utils/sqlEngine';
import ToolsPage from './components/ToolsPage';
import InsightStudio from './components/InsightStudio';
import ToolStub from './components/ToolStub';
const ColorStudio = lazy(() => import('./components/ColorStudio'));
const DiffChecker = lazy(() => import('./components/DiffChecker'));
const TextStudio = lazy(() => import('./components/TextStudio'));
const CSSStudio = lazy(() => import('./components/CSSStudio'));
const TimeStudio = lazy(() => import('./components/TimeStudio'));
const UtilStudio = lazy(() => import('./components/UtilStudio'));
const SecurityStudio = lazy(() => import('./components/SecurityStudio'));
const DataToolsStudio = lazy(() => import('./components/DataToolsStudio'));
const MediaStudio = lazy(() => import('./components/MediaStudio'));
import MobilePage from './components/MobilePage';

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
    // URL 해시를 사용하여 페이지 라우팅 (새 페이지로 연결되는 효과)
    // ── 통합 스튜디오 및 구현 완료 도구 ──
    const STUDIO_PAGES = ['colorStudio','textStudio','cssStudio','timeStudio','utilStudio','diffChecker','securityStudio','dataToolsStudio','mediaStudio'];
    // ── 이전 경로 → 스튜디오 리다이렉트 맵 ──
    const PAGE_REDIRECTS = {
        wordCounter:'textStudio', textStatistics:'textStudio', caseConverter:'textStudio', textToSlug:'textStudio', numberToWords:'textStudio', textTemplate:'textStudio', htmlEncoder:'textStudio',
        shadowGenerator:'cssStudio', glassmorphism:'cssStudio', borderRadius:'cssStudio', flexboxHelper:'cssStudio', animationBuilder:'cssStudio',
        jwtDecoder:'codeMinifier', httpStatus:'codeMinifier', semverHelper:'codeMinifier', cssUnit:'codeMinifier', randomToken:'codeMinifier', apiTester:'codeMinifier', curlConverter:'codeMinifier', cronParser:'codeMinifier',
        worldClock:'timeStudio', pomodoro:'timeStudio', countdownTimer:'timeStudio', calendarTool:'timeStudio', timestampConverter:'timeStudio',
        hashGenerator:'utilStudio', loanCalculator:'utilStudio', currencyConverter:'utilStudio', passwordGenerator:'utilStudio', fileHasher:'utilStudio',
        jsonFormatter:'jsonFormatterPage', xmlJson:'jsonFormatConvertPage', yamlJson:'jsonFormatConvertPage', tomlJson:'jsonFormatConvertPage', jsonFlattener:'jsonFormatConvertPage', jsonPathTester:'jsonPathPage', jsonToCsv:'jsonCsvPage',
        colorConverter:'colorStudio', colorPalette:'colorStudio', gradientGenerator:'colorStudio',
        twoFactorAuth:'securityStudio', permissionCalc:'securityStudio', secureNote:'securityStudio',
        excelToJson:'dataToolsStudio', csvMerger:'dataToolsStudio', dataValidator:'dataToolsStudio', schemaBuilder:'dataToolsStudio', csvDiff:'dataToolsStudio', dataTranspose:'dataToolsStudio',
        svgOptimizer:'mediaStudio', faviconGenerator:'mediaStudio', imageResizer:'mediaStudio', colorExtractor:'mediaStudio', watermarkTool:'mediaStudio',
    };
    const STUB_TOOL_PAGES = ['jsonToExcel','csvPivot','csvColumnMapper','barcodeGenerator'];
    const VALID_PAGES = ['home', 'tools', 'mobile', 'main', 'mainZoom', 'fileNotice', 'insight', 'encoding', 'htmlTable', 'textExtractor', 'listToComma', 'listComparator', 'personalDataMasker', 'mockDataGenerator', 'qrCode', 'calculator', 'codeMinifier', 'imageCompressor', 'markdownEditor', 'pdfConverter', 'regexTester', 'unitConverter', 'uuidGenerator','digitalStampSignStudio','imageTools','videoTools','zipTools','serviceCenter','cryptoEncoder','numberBase','morseConverter','loremIpsum','sqlFormatter','csvToSql','romanNumeral','ogTagGenerator','htmlToJsx','jsonFormatterPage','jsonCsvPage','jsonFormatConvertPage','jsonPathPage','jsonToSqlPage','excelJsonPage','csvMergeSplitPage', ...STUDIO_PAGES, ...Object.keys(PAGE_REDIRECTS), ...STUB_TOOL_PAGES];
    const getInitialPage = () => {
        const hash = window.location.hash.replace('#', '');
        return VALID_PAGES.includes(hash) ? hash : 'home';
    };
    const [currentPage, setCurrentPage] = useState(getInitialPage());
    const [fileNoticeInfo, setFileNoticeInfo] = useState(null);
    const [fileNoticeType, setFileNoticeType] = useState(null);
    
    // ── 브라우저 스크롤 복원 비활성화 (hash 라우팅 + scale 트릭 충돌 방지) ──
    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    // 해시 변경 시 페이지 업데이트 (리다이렉트 포함)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const redirectTarget = PAGE_REDIRECTS[hash];
            if (redirectTarget) {
                window.location.hash = redirectTarget;
                setCurrentPage(redirectTarget);
            } else {
                setCurrentPage(VALID_PAGES.includes(hash) ? hash : 'home');
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // ── 페이지 전환 시 레이아웃 리셋 ──
    // 모달/다이얼로그가 body.overflow를 변경했거나, 스크롤 컨테이너가 남은 위치를
    // 유지하면 화면이 위로 밀리는 버그가 발생함. 페이지 변경마다 강제 초기화.
    useEffect(() => {
        document.body.style.overflow = '';
        document.body.style.overflowY = '';
        document.documentElement.style.overflow = '';
        window.scrollTo(0, 0);
        document.querySelectorAll('.overflow-y-auto, .overflow-auto, .custom-scrollbar').forEach(el => {
            el.scrollTop = 0;
        });
    }, [currentPage]);
    
    // 페이지 히스토리 (뒤로가기 지원)
    const pageHistoryRef = React.useRef([]);
    const navigateTo = (page) => {
        pageHistoryRef.current = [...pageHistoryRef.current, currentPage];
        window.location.hash = page;
    };
    const goBack = () => {
        const history = pageHistoryRef.current;
        if (history.length > 0) {
            const prev = history[history.length - 1];
            pageHistoryRef.current = history.slice(0, -1);
            window.location.hash = prev;
        } else {
            window.location.hash = 'tools';
        }
    };
    const canGoBack = pageHistoryRef.current.length > 0 || currentPage !== 'home';
    const [originalData, setOriginalData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [allColumns, setAllColumns] = useState([]);
    const [data, setData] = useState([]);
    const [query, setQuery] = useState('SELECT rowid as _rowid, * FROM main_table LIMIT 1000;');
    const [cmdOpen, setCmdOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [colTypes, setColTypes] = useState({});
    const numericColumns = useMemo(
        () => allColumns.filter(col => colTypes[col] === 'number'),
        [allColumns, colTypes]
    );

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
    // 🆕 혁신 기능 상태들
    const [ncFindCol, setNcFindCol] = useState('');
    const [ncFindVal, setNcFindVal] = useState('');
    const [ncReplaceVal, setNcReplaceVal] = useState('');
    const [ncSplitCol, setNcSplitCol] = useState('');
    const [ncSplitDelim, setNcSplitDelim] = useState(',');
    const [ncMergeCol1, setNcMergeCol1] = useState('');
    const [ncMergeCol2, setNcMergeCol2] = useState('');
    const [ncMergeSep, setNcMergeSep] = useState(' ');
    const [ncMergeNewName, setNcMergeNewName] = useState('');
    const [ncRenameFrom, setNcRenameFrom] = useState('');
    const [ncRenameTo, setNcRenameTo] = useState('');
    const [ncFillCol, setNcFillCol] = useState('');
    const [ncFillVal, setNcFillVal] = useState('');
    const [ncCorr1, setNcCorr1] = useState('');
    const [ncCorr2, setNcCorr2] = useState('');
    const [ncCorrResult, setNcCorrResult] = useState(null);
    const [ncNewColName, setNcNewColName] = useState('');
    const [ncNewColFormula, setNcNewColFormula] = useState('');
    const [ncSampleN, setNcSampleN] = useState(100);
    const [ncRegexCol, setNcRegexCol] = useState('');
    const [ncRegexPattern, setNcRegexPattern] = useState('');
    const [ncProfileCol, setNcProfileCol] = useState('');
    const [ncProfileResult, setNcProfileResult] = useState(null);
    const [ncOutlierCol, setNcOutlierCol] = useState('');
    const [ncOutlierResult, setNcOutlierResult] = useState(null);
    const [ncTypeCol, setNcTypeCol] = useState('');
    const [ncTargetType, setNcTargetType] = useState('TEXT');
    const [ncDateRangeCol, setNcDateRangeCol] = useState('');
    const [ncDateRangeStart, setNcDateRangeStart] = useState('');
    const [ncDateRangeEnd, setNcDateRangeEnd] = useState('');
    const [ncDedupCols, setNcDedupCols] = useState([]);
    const [ncTransposeActive, setNcTransposeActive] = useState(false);
    const [ncExpandJsonCol, setNcExpandJsonCol] = useState('');
    const [ncReverseRows, setNcReverseRows] = useState(false);
    const [ncOpenSection, setNcOpenSection] = useState(null); // 열린 아코디언 섹션

    // 🆕 현재 데이터 소스 이름 (파일명 또는 샘플)
    const [dataSourceName, setDataSourceName] = useState('데모 데이터 (샘플)');
    
    // 🆕 커스텀 알림 모달 상태
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
    
    // 🆕 커스텀 알림 함수 (세련된 모달)
    const showAlert = (message, type = 'info', title = '') => {
        const titles = {
            info: '알림',
            success: '성공',
            error: '오류',
            warning: '경고'
        };
        setAlertModal({
            show: true,
            title: title || titles[type] || '알림',
            message,
            type
        });
    };
    
    // 🆕 확인/취소 모달
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
    
    const showConfirm = (message, onConfirm, title = '확인') => {
        setConfirmModal({ show: true, title, message, onConfirm });
    };

    // 🆕 워터마크 설정 (대외비)
    const [watermarkEnabled, setWatermarkEnabled] = useState(true);
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [watermarkDesign, setWatermarkDesign] = useState('single'); // single, multiple, corner
    
    // 🆕 확대/전체화면 모드 상태 (좌측 사이드바 숨김용)
    const [isZoomed, setIsZoomed] = useState(false);

    // 결과 기록 관리 (이전 결과로 되돌리기 기능)
    const [resultHistory, setResultHistory] = useState([]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 🆕 앱 로드 시 자동으로 샘플 데이터 로드
    useEffect(() => {
        const init = async () => {
            try {
                const database = await initSqlEngine();
                setDb(database);
                
                // 🆕 DB 준비 완료 후 자동으로 샘플 데이터 로드
                if (database) {
                    const parsed = Papa.parse(SAMPLE_DATA, { header: true, dynamicTyping: false });
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
        const name = file.name || '';
        const lowerName = name.toLowerCase();

        // JSON 파일인 경우: 안내 페이지로 이동
        if (lowerName.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                try {
                    sessionStorage.setItem('pendingJsonFile', JSON.stringify({ name: file.name, content }));
                    setFileNoticeInfo({ name: file.name, size: file.size, type: file.type });
                    setFileNoticeType('json');
                    pageHistoryRef.current = [...pageHistoryRef.current, currentPage];
                    window.location.hash = 'fileNotice';
                    setCurrentPage('fileNotice');
                } catch (err) {
                    alert('파일 읽기 오류: ' + err.message);
                }
            };
            reader.onerror = () => { alert('파일을 읽는 중 오류가 발생했습니다.'); };
            reader.readAsText(file);
            return;
        }

        // CSV 이외의 파일: 지원되지 않는 형식 안내 페이지로 이동
        if (!lowerName.endsWith('.csv')) {
            setFileNoticeInfo({ name: file.name, size: file.size, type: file.type });
            setFileNoticeType('invalid');
            pageHistoryRef.current = [...pageHistoryRef.current, currentPage];
            window.location.hash = 'fileNotice';
            setCurrentPage('fileNotice');
            return;
        }

        setLoading(`${file.name} 파싱 중...`);
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                loadData(results.data, file.name);
            },
            error: (error) => {
                showAlert('파일 파싱 에러: ' + error.message, 'error', '파싱 실패');
                setLoading('');
            }
        });
    };
    const loadData = (arr, sourceName = null) => {
        if (!db || !arr.length) return;
        setLoading('메모리 적재 중...');
        
        // 🆕 파일명 또는 샘플 설정
        if (sourceName) {
            setDataSourceName(sourceName);
        } else {
            setDataSourceName('데모 데이터 (샘플)');
        }
        
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
                showAlert("적재 에러: " + e.message, 'error', '데이터 적재 실패');
            } finally {
                setLoading('');
            }
        }, 50);
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
        showAlert('두 개의 컬럼을 쉼표로 구분하여 입력해주세요.', 'warning', '입력 오류');
        return null;
    };
    const exportData = (type) => {
        if (!data.length) return showAlert('내보낼 데이터가 없습니다.', 'warning', '내보내기 실패');
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
            a.download = `vaultsheet_export.${ext}`;
            a.click();
        }
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


   

    const actions = useMemo(() => [
        // ========================================
        // 🧹 데이터 정리 (Clean) - 15개
        // ========================================
        { name: "결측치(Null) 행 제거", category: "Clean", desc: "비어있는 값이 하나라도 있는 행을 삭제합니다.", example: "Row with Null -> [Deleted]", condition: () => allColumns.length > 0, run: () => { saveHistoryBeforeMutation(); const c = allColumns.map(x => `"${x}" IS NULL OR "${x}"=''`).join(' OR '); db.run(`DELETE FROM main_table WHERE ${c}`); executeSQL(query, true); } },
        { name: "비정상 공백 제거 (Trim)", category: "Clean", desc: "텍스트 앞뒤의 불필요한 공백을 제거합니다.", example: " apple  -> apple", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).trim() : v) },
        { name: "중복 행 제거", category: "Clean", desc: "완전히 동일한 값을 가진 행을 삭제합니다.", example: "2개 이상 -> 1개", condition: () => allColumns.length > 0, run: () => { saveHistoryBeforeMutation(); db.run("DELETE FROM main_table WHERE rowid NOT IN (SELECT MIN(rowid) FROM main_table GROUP BY " + allColumns.map(c => `"${c}"`).join(', ') + ")"); executeSQL(query, true); } },
        { name: "특정 값 행 제거", category: "Clean", desc: "지정된 값을 포함하는 행을 삭제합니다.", example: "删除包含'test'的行", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'val', type: 'text', label: '삭제할 값', placeholder: '예: test' }], run: ({ col, val }) => { if (col && val) { saveHistoryBeforeMutation(); db.run(`DELETE FROM main_table WHERE "${col}" LIKE '%${val}%'`); executeSQL(query, true); } } },
        { name: "빈 문자열을 Null로", category: "Clean", desc: "빈 문자열을 Null 값으로 변환합니다.", example: "'' -> null", condition: () => allColumns.length > 0, run: () => { saveHistoryBeforeMutation(); allColumns.forEach(c => db.run(`UPDATE main_table SET "${c}" = NULL WHERE "${c}" = ''`)); executeSQL(query, true); } },
        { name: "Null을 빈 문자열로", category: "Clean", desc: "Null 값을 빈 문자열로 변환합니다.", example: "null -> ''", condition: () => allColumns.length > 0, run: () => { saveHistoryBeforeMutation(); allColumns.forEach(c => db.run(`UPDATE main_table SET "${c}" = '' WHERE "${c}" IS NULL`)); executeSQL(query, true); } },
        { name: "특정 값 대체", category: "Clean", desc: "지정된 값을 모두 다른 값으로 교체합니다.", example: "0 -> null", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'from', type: 'text', label: '변경할 값' }, { id: 'to', type: 'text', label: '변경될 값' }], run: ({ col, from, to }) => { if (col && from !== undefined) applyJSTransform(col, v => v === from ? to : v); } },
        { name: "공백 여러 개를 하나로", category: "Clean", desc: "연속된 공백을 하나의 공백으로 줄입니다.", example: "a  b -> a b", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).replace(/\s+/g, ' ').trim() : v) },
        { name: "줄바꿈 제거", category: "Clean", desc: "텍스트의 줄바꿈을 공백으로 변환합니다.", example: "a\\nb -> a b", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).replace(/[\r\n]+/g, ' ').trim() : v) },
        { name: "특수문자 제거", category: "Clean", desc: "영문자, 숫자, 한글 제외한 특수문자를 제거합니다.", example: "a@b#c! -> abc", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).replace(/[^a-zA-Z0-9가-힣\s]/g, '') : v) },
        { name: "숫자만 추출", category: "Clean", desc: "텍스트에서 숫자만 추출합니다.", example: "abc123 -> 123", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).replace(/\D/g, '') : v) },
        { name: "영문자만 추출", category: "Clean", desc: "텍스트에서 영문자만 추출합니다.", example: "abc123! -> abc", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).replace(/[^a-zA-Z]/g, '') : v) },
        { name: "한글만 추출", category: "Clean", desc: "텍스트에서 한글만 추출합니다.", example: "한글abc -> 한글", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).replace(/[^가-힣]/g, '') : v) },
        { name: "앞뒤 특정 문자 제거", category: "Clean", desc: "텍스트 앞뒤에서 지정한 문자를 제거합니다.", example: "-abc- -> abc", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'char', type: 'text', label: '제거할 문자', placeholder: '예: -' }], run: ({ col, char }) => { if (col && char) applyJSTransform(col, v => v ? String(v).replace(new RegExp(`^${char}+|${char}+$`, 'g'), '') : v); } },
        { name: "열 순서 정렬", category: "Clean", desc: "지정한 컬럼을 기준으로 행을 정렬합니다.", example: "A->Z, Z->A", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '정렬 기준 컬럼' }, { id: 'dir', type: 'text', label: '정렬 방향', placeholder: 'ASC 또는 DESC' }], run: ({ col, dir }) => { if (col && dir) executeSQL(`SELECT rowid as _rowid, * FROM main_table ORDER BY "${col}" ${dir === 'ASC' ? 'ASC' : 'DESC'}`, false); } },

        // ========================================
        // 📝 텍스트 처리 (Text) - 20개
        // ========================================
        { name: "텍스트 쪼개기 (Split)", category: "Text", desc: "특정 기호를 기준으로 컬럼을 두 개로 분할합니다.", example: "a-b -> [a, b]", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'sep', type: 'text', label: '분할 기준 문자', placeholder: '예: -, _, ,' }], run: ({ col, sep }) => { if (col && sep) { addColumnAndTransform(`${col}_1`, col, v => v ? String(v).split(sep)[0] : ''); addColumnAndTransform(`${col}_2`, col, v => v ? String(v).split(sep)[1] || '' : ''); } } },
        { name: "텍스트 찾기 및 바꾸기", category: "Text", desc: "특정 단어를 다른 단어로 모두 치환합니다.", example: "apple -> fruit", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'find', type: 'text', label: '찾을 단어' }, { id: 'replace', type: 'text', label: '바꿀 단어' }], run: ({ col, find, replace }) => applyJSTransform(col, v => v ? String(v).split(find).join(replace || '') : v) },
        { name: "앞 N글자 자르기", category: "Text", desc: "텍스트 앞쪽부터 N글자를 잘라냅니다.", example: "Hello -> Hel (3글자)", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'n', type: 'number', label: '자를 글자 수' }], run: ({ col, n }) => { if(col && n) applyJSTransform(col, v => v ? String(v).slice(0, parseInt(n)) : v); } },
        { name: "뒤 N글자 자르기", category: "Text", desc: "텍스트 뒤쪽부터 N글자를 잘라냅니다.", example: "Hello -> llo (3글자)", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'n', type: 'number', label: '자를 글자 수' }], run: ({ col, n }) => { if(col && n) applyJSTransform(col, v => v ? String(v).slice(-parseInt(n)) : v); } },
        { name: "대문자로 변환 (UPPER)", category: "Text", desc: "영문 소문자를 대문자로 바꿉니다.", example: "apple -> APPLE", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).toUpperCase() : v) },
        { name: "소문자로 변환 (lower)", category: "Text", desc: "영문 대문자를 소문자로 바꿉니다.", example: "APPLE -> apple", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).toLowerCase() : v) },
        { name: "첫 글자 대문자", category: "Text", desc: "각 단어의 첫 글자를 대문자로 변환합니다.", example: "hello world -> Hello World", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase()) : v) },
        { name: "텍스트 결합 (Merge)", category: "Text", desc: "두 개의 컬럼을 하나로 합칩니다.", example: "성 + 이름 -> 이름", condition: () => allColumns.length >= 2, inputs: [{ id: 'col1', type: 'select', label: '첫 번째 컬럼' }, { id: 'col2', type: 'select', label: '두 번째 컬럼' }, { id: 'sep', type: 'text', label: '결합 구분자' }], run: ({ col1, col2, sep }) => { if (col1 && col2) addColumnAndTransform(`${col1}_${col2}`, col1, v => v ? String(v) + (sep || '') + String(originalData.find(r => r[col1] === v)?.[col2] || '') : ''); } },
        { name: "문자열 길이 추가", category: "Text", desc: "텍스트 길이를 새로운 컬럼으로 추가합니다.", example: "abc -> 3", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_len`, col, v => v ? String(v).length : 0) },
        { name: "중앙부터 추출", category: "Text", desc: "지정 위치부터 N글자를 추출합니다.", example: "Hello(2,3) -> llo", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'start', type: 'number', label: '시작 위치(0부터)' }, { id: 'n', type: 'number', label: '글자 수' }], run: ({ col, start, n }) => { if(col && start !== undefined && n) applyJSTransform(col, v => v ? String(v).substr(parseInt(start), parseInt(n)) : v); } },
        { name: "값 없으면 기본값", category: "Text", desc: "빈 값에 기본 텍스트를 입력합니다.", example: "null -> 'N/A'", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'default', type: 'text', label: '기본값' }], run: ({ col, default: def }) => { if(col && def) applyJSTransform(col, v => !v || v === '' ? def : v); } },
        { name: "텍스트 반복", category: "Text", desc: "텍스트를 지정한 횟수만큼 반복합니다.", example: "abc x 2 -> abcabc", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'n', type: 'number', label: '반복 횟수' }], run: ({ col, n }) => { if(col && n) applyJSTransform(col, v => v ? String(v).repeat(parseInt(n)) : v); } },
        { name: "패딩 추가", category: "Text", desc: "텍스트 앞뒤에 지정한 문자를 채웁니다.", example: "a -> 000a", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'char', type: 'text', label: '채울 문자', placeholder: '예: 0' }, { id: 'len', type: 'number', label: '전체 길이' }, { id: 'pos', type: 'text', label: '위치', placeholder: 'start 또는 end' }], run: ({ col, char, len, pos }) => { if(col && char && len) applyJSTransform(col, v => { const s = String(v||''); return pos === 'end' ? s.padEnd(parseInt(len), char) : s.padStart(parseInt(len), char); }); } },
        { name: "이메일 도메인 추출", category: "Text", desc: "이메일에서 도메인 부분만 추출합니다.", example: "a@b.com -> b.com", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '이메일 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v && String(v).includes('@') ? String(v).split('@')[1] : v) },
        { name: "이메일 아이디 추출", category: "Text", desc: "이메일에서 아이디 부분만 추출합니다.", example: "a@b.com -> a", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '이메일 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v && String(v).includes('@') ? String(v).split('@')[0] : v) },
        { name: "URL 도메인 추출", category: "Text", desc: "URL에서 도메인만 추출합니다.", example: "https://a.com -> a.com", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: 'URL 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { try { return v ? new URL(String(v)).hostname : v; } catch { return v; } }) },
        { name: "파일 확장자 추출", category: "Text", desc: "파일명에서 확장자만 추출합니다.", example: "a.txt -> txt", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '파일명 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).split('.').pop() : v) },
        { name: "파일명 추출 (확장자 제외)", category: "Text", desc: "파일명에서 확장자를 제외하고 추출합니다.", example: "a.txt -> a", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '파일명 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).replace(/\.[^/.]+$/, '') : v) },
        { name: "텍스트 반전", category: "Text", desc: "텍스트 순서를 반전합니다.", example: "abc -> cba", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? String(v).split('').reverse().join('') : v) },
        { name: "단어 개수 세기", category: "Text", desc: "텍스트에서 단어 개수를 새 컬럼으로 추가합니다.", example: "hello world -> 2", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_wordcount`, col, v => v ? String(v).trim().split(/\s+/).length : 0) },

        // ========================================
        // 🔢 수학/통계 (Math/Stats) - 15개
        // ========================================
        { name: "반올림 (Round)", category: "Math", desc: "숫자를 정수로 반올림합니다.", example: "3.6 -> 4", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼' }], run: ({ col }) => applyJSTransform(col, v => !isNaN(Number(v)) ? Math.round(Number(v)) : v) },
        { name: "올림 (Ceil)", category: "Math", desc: "숫자를 올림합니다.", example: "3.1 -> 4", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼' }], run: ({ col }) => applyJSTransform(col, v => !isNaN(Number(v)) ? Math.ceil(Number(v)) : v) },
        { name: "내림 (Floor)", category: "Math", desc: "숫자를 내림합니다.", example: "3.9 -> 3", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼' }], run: ({ col }) => applyJSTransform(col, v => !isNaN(Number(v)) ? Math.floor(Number(v)) : v) },
        { name: "값의 범위 제한 (Clipping)", category: "Stats", desc: "상하위 값을 특정 범위로 제한합니다.", example: "120 -> 100", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '대상 컬럼' }, { id: 'min', type: 'number', label: '최소값' }, { id: 'max', type: 'number', label: '최대값' }], run: ({ col, min, max }) => { if (col && min !== undefined && max !== undefined) applyJSTransform(col, v => { const n = Number(v); return !isNaN(n) ? Math.min(Math.max(n, parseFloat(min)), parseFloat(max)) : v; }); } },
        { name: "절댓값 변환", category: "Math", desc: "숫자의 절댓값을 구합니다.", example: "-5 -> 5", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼' }], run: ({ col }) => applyJSTransform(col, v => !isNaN(Number(v)) ? Math.abs(Number(v)) : v) },
        { name: "제곱 계산", category: "Math", desc: "숫자를 제곱합니다.", example: "2 -> 4", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼' }, { id: 'n', type: 'number', label: '지수', placeholder: '2' }], run: ({ col, n }) => { if(col && n) applyJSTransform(col, v => !isNaN(Number(v)) ? Math.pow(Number(v), parseFloat(n)) : v); } },
        { name: "제곱근 계산", category: "Math", desc: "숫자의 제곱근을 구합니다.", example: "4 -> 2", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼' }], run: ({ col }) => applyJSTransform(col, v => !isNaN(Number(v)) && Number(v) >= 0 ? Math.sqrt(Number(v)) : v) },
        { name: "로그 계산", category: "Math", desc: "자연로그 값을 구합니다.", example: "e -> 1", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼' }], run: ({ col }) => applyJSTransform(col, v => !isNaN(Number(v)) && Number(v) > 0 ? Math.log(Number(v)) : v) },
        { name: "퍼센트 계산", category: "Math", desc: "값의 퍼센트를 계산합니다.", example: "50의 10% -> 5", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '숫자형 컬럼' }, { id: 'percent', type: 'number', label: '퍼센트', placeholder: '10' }], run: ({ col, percent }) => { if(col && percent) applyJSTransform(col, v => !isNaN(Number(v)) ? Number(v) * (parseFloat(percent) / 100) : v); } },
        { name: "증감률 계산", category: "Math", desc: "전후 값의 증감률을 계산합니다.", example: "100->150 -> 50%", condition: () => allColumns.length >= 2, inputs: [{ id: 'col1', type: 'select', label: '이전 값 컬럼' }, { id: 'col2', type: 'select', label: '이후 값 컬럼' }], run: ({ col1, col2 }) => { if(col1 && col2) { saveHistoryBeforeMutation(); const res = db.exec(`SELECT rowid, "${col1}", "${col2}" FROM main_table`); if (res.length) { db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col2}" = ? WHERE rowid = ?`); res[0].values.forEach(r => { const oldVal = Number(r[1]); const newVal = Number(r[2]); const rate = !isNaN(oldVal) && !isNaN(newVal) && oldVal !== 0 ? ((newVal - oldVal) / oldVal) * 100 : 0; stmt.run([rate, r[0]]); }); stmt.free(); db.run('COMMIT;'); executeSQL(query, true); } } } },
        { name: "합계 추가", category: "Math", desc: "모든 행의 합계를 새 컬럼에 추가합니다.", example: "합계: 1000", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '합계할 컬럼' }], run: ({ col }) => { if(col) { const res = db.exec(`SELECT SUM("${col}") FROM main_table`); const sum = res.length && res[0].values[0] ? res[0].values[0][0] : 0; addColumnAndTransform(`${col}_sum`, col, () => sum); } } },
        { name: "평균 추가", category: "Math", desc: "모든 행의 평균을 새 컬럼에 추가합니다.", example: "평균: 50", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '평균낼 컬럼' }], run: ({ col }) => { if(col) { const res = db.exec(`SELECT AVG("${col}") FROM main_table`); const avg = res.length && res[0].values[0] ? res[0].values[0][0] : 0; addColumnAndTransform(`${col}_avg`, col, () => avg); } } },
        { name: "순위 추가", category: "Stats", desc: "값의 순위를 새 컬럼에 추가합니다.", example: "값 -> 1, 2, 3...", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '순위화할 컬럼' }, { id: 'dir', type: 'text', label: '순서', placeholder: 'DESC 또는 ASC' }], run: ({ col, dir }) => { if(col) { saveHistoryBeforeMutation(); const res = db.exec(`SELECT rowid, "${col}" FROM main_table ORDER BY "${col}" ${dir === 'ASC' ? 'ASC' : 'DESC'}`); if(res.length) { const ranked = {}; let rank = 1; res[0].values.forEach((r, i) => { if(i > 0 && r[1] !== res[0].values[i-1][1]) rank = i + 1; ranked[r[0]] = rank; }); db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col}_rank" = ? WHERE rowid = ?`); Object.entries(ranked).forEach(([rowid, r]) => stmt.run([r, parseInt(rowid)])); stmt.free(); db.run('COMMIT;'); if(!allColumns.includes(`${col}_rank`)) setAllColumns([...allColumns, `${col}_rank`]); executeSQL(query, true); } } } },
        { name: "백분위수 추가", category: "Stats", desc: "값의 백분위수를 새 컬럼에 추가합니다.", example: "값 -> 25%, 50%...", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '대상 컬럼' }], run: ({ col }) => { if(col) { const res = db.exec(`SELECT rowid, "${col}" FROM main_table WHERE "${col}" IS NOT NULL ORDER BY "${col}"`); if(res.length) { const sorted = res[0].values.map(r => [r[0], Number(r[1])]).filter(r => !isNaN(r[1])); const n = sorted.length; const percentiles = {}; sorted.forEach((r, i) => { percentiles[r[0]] = Math.round((i / (n - 1)) * 100); }); saveHistoryBeforeMutation(); db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col}_percentile" = ? WHERE rowid = ?`); Object.entries(percentiles).forEach(([rowid, p]) => stmt.run([p, parseInt(rowid)])); stmt.free(); db.run('COMMIT;'); if(!allColumns.includes(`${col}_percentile`)) setAllColumns([...allColumns, `${col}_percentile`]); executeSQL(query, true); } } } },
        { name: "Z-Score 추가", category: "Stats", desc: "표준화 점수(Z-Score)를 새 컬럼에 추가합니다.", example: "값 -> 1.5, -0.5...", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '대상 컬럼' }], run: ({ col }) => { if(col) { const res = db.exec(`SELECT AVG("${col}"), STDEV("${col}") FROM main_table`); if(res.length && res[0].values[0][0] && res[0].values[0][1]) { const avg = res[0].values[0][0]; const std = res[0].values[0][1]; const res2 = db.exec(`SELECT rowid, "${col}" FROM main_table`); if(res2.length) { saveHistoryBeforeMutation(); db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col}_zscore" = ? WHERE rowid = ?`); res2[0].values.forEach(r => { const v = Number(r[1]); const z = !isNaN(v) ? (v - avg) / std : null; stmt.run([z, r[0]]); }); stmt.free(); db.run('COMMIT;'); if(!allColumns.includes(`${col}_zscore`)) setAllColumns([...allColumns, `${col}_zscore`]); executeSQL(query, true); } } } } },

        // ========================================
        // 📅 날짜/시간 (Date) - 15개
        // ========================================
        { name: "날짜에서 연도 추출", category: "Date", desc: "날짜에서 4자리 연도만 가져옵니다.", example: "2023-10 -> 2023", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_year`, col, v => { const d = new Date(v); return isNaN(d) ? null : d.getFullYear(); }) },
        { name: "날짜에서 월 추출", category: "Date", desc: "날짜에서 월(1-12)만 가져옵니다.", example: "2023-10 -> 10", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_month`, col, v => { const d = new Date(v); return isNaN(d) ? null : d.getMonth() + 1; }) },
        { name: "날짜에서 일 추출", category: "Date", desc: "날짜에서 일(1-31)만 가져옵니다.", example: "2023-10-15 -> 15", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_day`, col, v => { const d = new Date(v); return isNaN(d) ? null : d.getDate(); }) },
        { name: "날짜에서 요일 추출", category: "Date", desc: "날짜에서 요일 이름을 가져옵니다.", example: "2023-10-01 -> Sunday", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_weekday`, col, v => { const d = new Date(v); const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; return isNaN(d) ? null : days[d.getDay()]; }) },
        { name: "날짜에서 시 추출", category: "Date", desc: "시간에서 시(0-23)만 가져옵니다.", example: "14:30 -> 14", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '시간 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_hour`, col, v => { const d = new Date(`2000-01-01 ${v}`); return isNaN(d) ? null : d.getHours(); }) },
        { name: "날짜에서 분 추출", category: "Date", desc: "시간에서 분(0-59)만 가져옵니다.", example: "14:30 -> 30", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '시간 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_minute`, col, v => { const d = new Date(`2000-01-01 ${v}`); return isNaN(d) ? null : d.getMinutes(); }) },
        { name: "년-월 추가", category: "Date", desc: "년-월 형태의 컬럼을 추가합니다.", example: "2023-10", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_yearmonth`, col, v => { const d = new Date(v); return isNaN(d) ? null : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }) },
        { name: "년-주 추가", category: "Date", desc: "년-주차 형태의 컬럼을 추가합니다.", example: "2023-W40", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_week`, col, v => { const d = new Date(v); if(isNaN(d)) return null; const start = new Date(d.getFullYear(), 0, 1); const days = Math.floor((d - start) / 86400000); const week = Math.ceil((days + start.getDay() + 1) / 7); return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`; }) },
        { name: "날짜 더하기", category: "Date", desc: "날짜에 일수를 더합니다.", example: "2023-10-01 + 5 -> 2023-10-06", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }, { id: 'days', type: 'number', label: '더할 일수' }], run: ({ col, days }) => { if(col && days !== undefined) applyJSTransform(col, v => { const d = new Date(v); d.setDate(d.getDate() + parseInt(days)); return isNaN(d) ? v : d.toISOString().split('T')[0]; }); } },
        { name: "날짜 빼기", category: "Date", desc: "날짜에서 일수를 뺍니다.", example: "2023-10-06 - 5 -> 2023-10-01", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }, { id: 'days', type: 'number', label: '뺄 일수' }], run: ({ col, days }) => { if(col && days !== undefined) applyJSTransform(col, v => { const d = new Date(v); d.setDate(d.getDate() - parseInt(days)); return isNaN(d) ? v : d.toISOString().split('T')[0]; }); } },
        { name: "월 더하기", category: "Date", desc: "날짜에 개월수를 더합니다.", example: "2023-01 + 3 -> 2023-04", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }, { id: 'months', type: 'number', label: '더할 개월수' }], run: ({ col, months }) => { if(col && months) applyJSTransform(col, v => { const d = new Date(v); d.setMonth(d.getMonth() + parseInt(months)); return isNaN(d) ? v : d.toISOString().split('T')[0]; }); } },
        { name: "년 더하기", category: "Date", desc: "날짜에 년수를 더합니다.", example: "2023 + 1 -> 2024", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }, { id: 'years', type: 'number', label: '더할 년수' }], run: ({ col, years }) => { if(col && years) applyJSTransform(col, v => { const d = new Date(v); d.setFullYear(d.getFullYear() + parseInt(years)); return isNaN(d) ? v : d.toISOString().split('T')[0]; }); } },
        { name: "두 날짜 차이(일)", category: "Date", desc: "두 날짜 사이의 일수 차이를 계산합니다.", example: "2023-10-01 ~ 2023-10-05 = 4일", condition: () => allColumns.length >= 2 && Object.values(colTypes).includes('date'), inputs: [{ id: 'col1', type: 'select_date', label: '시작 날짜' }, { id: 'col2', type: 'select_date', label: '종료 날짜' }], run: ({ col1, col2 }) => { if(col1 && col2) addColumnAndTransform(`${col1}_${col2}_diff`, col1, v => { const d1 = new Date(v); const d2 = new Date(originalData.find(r => r[col1] === v)?.[col2]); return isNaN(d1) || isNaN(d2) ? null : Math.abs(Math.ceil((d2 - d1) / 86400000)); }); } },
        { name: "분기 계산", category: "Date", desc: "날짜의 분기(1-4)를 계산합니다.", example: "2023-05 -> 2분기", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_quarter`, col, v => { const d = new Date(v); return isNaN(d) ? null : Math.ceil((d.getMonth() + 1) / 3) + '분기'; }) },
        { name: "월 이름(한글)", category: "Date", desc: "월을 한글 이름으로 변환합니다.", example: "2023-05 -> 5월", condition: () => Object.values(colTypes).includes('date'), inputs: [{ id: 'col', type: 'select_date', label: '날짜형 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_month_kr`, col, v => { const d = new Date(v); const months = ['','1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']; return isNaN(d) ? null : months[d.getMonth() + 1]; }) },

        // ========================================
        // 🔐 보안/마스킹 (Security) - 10개
        // ========================================
        { name: "전화번호 마스킹", category: "Security", desc: "전화번호 중간 자리를 별표로 가립니다.", example: "010-1234-5678 -> 010-****-5678", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { const s = String(v).replace(/\D/g, ''); return s.length === 11 ? s.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3') : v; }) },
        { name: "이메일 마스킹", category: "Security", desc: "이메일 아이디 부분을 마스킹합니다.", example: "test@example.com -> t***@example.com", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '이메일 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { if(!v || !String(v).includes('@')) return v; const parts = String(v).split('@'); const id = parts[0]; const masked = id.length > 2 ? id[0] + '*'.repeat(id.length-2) + id[id.length-1] : id; return masked + '@' + parts[1]; }) },
        { name: "이름 마스킹", category: "Security", desc: "이름의 성을 제외하고 마스킹합니다.", example: "홍길동 -> 홍**", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '이름 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { if(!v) return v; const s = String(v).replace(/\s/g, ''); return s.length >= 2 ? s[0] + '*'.repeat(s.length - 1) : s; }) },
        { name: "주소 마스킹", category: "Security", desc: "주소에서 상세주소를 마스킹합니다.", example: "서울시 강남구 테헤란로 123 -> 서울시 강남구 테헤란로 ***", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '주소 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { if(!v) return v; const parts = String(v).split(' '); if(parts.length >= 3) { parts[parts.length-1] = '***'; return parts.join(' '); } return v; }) },
        { name: "신용카드 마스킹", category: "Security", desc: "신용카드 번호를 마스킹합니다.", example: "1234-5678-9012-3456 -> ****-****-****-3456", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '카드 번호 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { const s = String(v).replace(/\D/g, ''); return s.length >= 13 ? s.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '****-****-****-$4') : v; }) },
        { name: "비밀번호 필드 생성", category: "Security", desc: "모든 값을 *****로 변환합니다.", example: "password -> *****", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? '*****' : v) },
        { name: "IP 주소 마스킹", category: "Security", desc: "IP 주소 마지막 octet을 마스킹합니다.", example: "192.168.0.1 -> 192.168.0.*", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: 'IP 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { const parts = String(v).split('.'); return parts.length === 4 ? parts.slice(0,3).join('.') + '.*' : v; }) },
        { name: "사업자번호 마스킹", category: "Security", desc: "사업자등록번호를 마스킹합니다.", example: "123-45-67890 -> ***-**-67890", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '사업자번호 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { const s = String(v).replace(/\D/g, ''); return s.length === 10 ? '***-**-' + s.slice(6) : v; }) },
        { name: "주민등록번호 마스킹", category: "Security", desc: "주민등록번호를 마스킹합니다.", example: "123456-1234567 -> 123456-*******", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '주민등록번호 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { const s = String(v).replace(/\D/g, ''); return s.length === 13 ? s.slice(0,6) + '-*******' : v; }) },
        { name: "전체 마스킹", category: "Security", desc: "모든 문자를 별표로 변환합니다.", example: "Hello -> *****", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v ? '*'.repeat(String(v).length) : v) },

        // ========================================
        // 🧠 로직/조건 (Logic) - 15개
        // ========================================
        { name: "IF-THEN 조건부 생성", category: "Logic", desc: "조건을 만족하면 A, 아니면 B를 입력합니다.", example: "score>=60 -> Pass/Fail", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '기준 컬럼' }, { id: 'threshold', type: 'number', label: '기준값' }, { id: 'trueVal', type: 'text', label: '조건 충족 시 값' }, { id: 'falseVal', type: 'text', label: '조건 미충족 시 값' }], run: ({ col, threshold, trueVal, falseVal }) => { if (col && threshold) applyJSTransform(col, v => Number(v) >= parseFloat(threshold) ? trueVal : falseVal); } },
        { name: "여러 조건 (CASE)", category: "Logic", desc: "여러 조건에 따라 다른 값을 할당합니다.", example: "A->1, B->2, C->3", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'val1', type: 'text', label: '값1' }, { id: 'res1', type: 'text', label: '결과1' }, { id: 'val2', type: 'text', label: '값2' }, { id: 'res2', type: 'text', label: '결과2' }], run: ({ col, val1, res1, val2, res2 }) => { if(col && val1 && res1) applyJSTransform(col, v => v === val1 ? res1 : (val2 && v === val2 ? res2 : v)); } },
        { name: "포함 여부 체크", category: "Logic", desc: "텍스트가 특정 문자열을 포함하면 1, 아니면 0", example: "apple contains 'pl' -> 1", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'find', type: 'text', label: '찾을 문자열' }], run: ({ col, find }) => { if(col && find) addColumnAndTransform(`${col}_contains_${find}`, col, v => v && String(v).includes(find) ? '1' : '0'); } },
        { name: "시작 여부 체크", category: "Logic", desc: "텍스트가 특정 문자열로 시작하면 1", example: "hello starts 'he' -> 1", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'prefix', type: 'text', label: '시작 문자열' }], run: ({ col, prefix }) => { if(col && prefix) addColumnAndTransform(`${col}_starts_${prefix}`, col, v => v && String(v).startsWith(prefix) ? '1' : '0'); } },
        { name: "끝 여부 체크", category: "Logic", desc: "텍스트가 특정 문자열로 끝나면 1", example: "hello ends 'lo' -> 1", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }, { id: 'suffix', type: 'text', label: '끝 문자열' }], run: ({ col, suffix }) => { if(col && suffix) addColumnAndTransform(`${col}_ends_${suffix}`, col, v => v && String(v).endsWith(suffix) ? '1' : '0'); } },
        { name: "빈 값 체크", category: "Logic", desc: "값이 비어있으면 1, 아니면 0", example: "null -> 1, abc -> 0", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_is_empty`, col, v => !v || v === '' ? '1' : '0') },
        { name: "Null 체크", category: "Logic", desc: "값이 Null이면 1, 아니면 0", example: "null -> 1, abc -> 0", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_is_null`, col, v => v === null || v === undefined ? '1' : '0') },
        { name: "숫자 여부 체크", category: "Logic", desc: "값이 숫자면 1, 아니면 0", example: "123 -> 1, abc -> 0", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_is_number`, col, v => !isNaN(Number(v)) && v !== '' ? '1' : '0') },
        { name: "이메일 형식 체크", category: "Logic", desc: "값이 이메일 형식이면 1", example: "a@b.com -> 1, abc -> 0", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_is_email`, col, v => v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? '1' : '0') },
        { name: "URL 형식 체크", category: "Logic", desc: "값이 URL 형식이면 1", example: "https://a.com -> 1, abc -> 0", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_is_url`, col, v => { try { return v && !!new URL(String(v)); } catch { return '0'; } }) },
        { name: "범위 조건", category: "Logic", desc: "값이 범위 안에 있으면 지정값", example: "10~20 -> '중간', else -> '기타'", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '대상 컬럼' }, { id: 'min', type: 'number', label: '최소값' }, { id: 'max', type: 'number', label: '최대값' }, { id: 'inRange', type: 'text', label: '범위 내 값' }, { id: 'outRange', type: 'text', label: '범위 외 값' }], run: ({ col, min, max, inRange, outRange }) => { if(col && min !== undefined && max !== undefined) applyJSTransform(col, v => { const n = Number(v); return !isNaN(n) && n >= parseFloat(min) && n <= parseFloat(max) ? inRange : outRange; }); } },
        { name: "AND 조건", category: "Logic", desc: "두 컬럼이 모두 조건을 만족하면 1", example: "col1>5 AND col2<10 -> 1", condition: () => allColumns.length >= 2, inputs: [{ id: 'col1', type: 'select', label: '첫 번째 컬럼' }, { id: 'op1', type: 'text', label: '조건1', placeholder: '>5' }, { id: 'col2', type: 'select', label: '두 번째 컬럼' }, { id: 'op2', type: 'text', label: '조건2', placeholder: '<10' }], run: ({ col1, op1, col2, op2 }) => { if(col1 && col2 && op1 && op2) addColumnAndTransform(`${col1}_and_${col2}`, col1, v => { const v1 = Number(v); const v2 = Number(originalData.find(r => r[col1] === v)?.[col2]); const check1 = eval(`'${v}' ${op1}`); const check2 = eval(`${v2} ${op2}`); return (check1 && check2) ? '1' : '0'; }); } },
        { name: "OR 조건", category: "Logic", desc: "두 컬럼 중 하나라도 조건 만족하면 1", example: "col1>5 OR col2>5 -> 1", condition: () => allColumns.length >= 2, inputs: [{ id: 'col1', type: 'select', label: '첫 번째 컬럼' }, { id: 'op1', type: 'text', label: '조건1', placeholder: '>5' }, { id: 'col2', type: 'select', label: '두 번째 컬럼' }, { id: 'op2', type: 'text', label: '조건2', placeholder: '>5' }], run: ({ col1, op1, col2, op2 }) => { if(col1 && col2 && op1 && op2) addColumnAndTransform(`${col1}_or_${col2}`, col1, v => { const v1 = Number(v); const v2 = Number(originalData.find(r => r[col1] === v)?.[col2]); return (eval(`'${v}' ${op1}`) || eval(`${v2} ${op2}`)) ? '1' : '0'; }); } },
        { name: "최댓값 선택", category: "Logic", desc: "두 값 중 큰 값을 선택합니다.", example: "max(5, 8) -> 8", condition: () => allColumns.length >= 2, inputs: [{ id: 'col1', type: 'select', label: '첫 번째 컬럼' }, { id: 'col2', type: 'select', label: '두 번째 컬럼' }], run: ({ col1, col2 }) => { if(col1 && col2) addColumnAndTransform(`${col1}_max_${col2}`, col1, v => Math.max(Number(v), Number(originalData.find(r => r[col1] === v)?.[col2] || 0))); } },
        { name: "최솟값 선택", category: "Logic", desc: "두 값 중 작은 값을 선택합니다.", example: "min(5, 8) -> 5", condition: () => allColumns.length >= 2, inputs: [{ id: 'col1', type: 'select', label: '첫 번째 컬럼' }, { id: 'col2', type: 'select', label: '두 번째 컬럼' }], run: ({ col1, col2 }) => { if(col1 && col2) addColumnAndTransform(`${col1}_min_${col2}`, col1, v => Math.min(Number(v), Number(originalData.find(r => r[col1] === v)?.[col2] || 0))); } },

        // ========================================
        // 📊 분석/변환 (Analytics) - 10개
        // ========================================
        { name: "구간화 (Binning)", category: "Analytics", desc: "숫자를 구간으로 변환합니다.", example: "5 -> '1-10'", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '대상 컬럼' }, { id: 'size', type: 'number', label: '구간 크기' }], run: ({ col, size }) => { if(col && size) applyJSTransform(col, v => { const n = Number(v); if(isNaN(n)) return v; const bin = Math.floor(n / parseFloat(size)) * parseFloat(size); return `${bin}~${bin + parseFloat(size) - 1}`; }); } },
        { name: "연령대 계산", category: "Analytics", desc: "나이를 연령대로 변환합니다.", example: "25 -> '20대'", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '나이 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_age_group`, col, v => { const n = Number(v); if(isNaN(n)) return null; if(n < 20) return '10대'; if(n < 30) return '20대'; if(n < 40) return '30대'; if(n < 50) return '40대'; if(n < 60) return '50대'; return '60대 이상'; }) },
        { name: "점수 등급", category: "Analytics", desc: "점수를 등급으로 변환합니다.", example: "85 -> 'A'", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '점수 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { const n = Number(v); if(isNaN(n)) return v; if(n >= 90) return 'A'; if(n >= 80) return 'B'; if(n >= 70) return 'C'; if(n >= 60) return 'D'; return 'F'; }) },
        { name: "실적 달성 여부", category: "Analytics", desc: "목표 대비 실적 달성 여부 판단.", example: "실적 >= 목표 -> '달성'", condition: () => allColumns.length >= 2, inputs: [{ id: 'col1', type: 'select', label: '실적 컬럼' }, { id: 'col2', type: 'select', label: '목표 컬럼' }], run: ({ col1, col2 }) => { if(col1 && col2) addColumnAndTransform(`${col1}_achieved`, col1, v => Number(v) >= Number(originalData.find(r => r[col1] === v)?.[col2] || 0) ? '달성' : '미달성'); } },
        { name: "증감 방향", category: "Analytics", desc: "전월 대비 증감 방향 표시.", example: "증가->↑, 감소->↓", condition: () => allColumns.length >= 2, inputs: [{ id: 'col1', type: 'select', label: '현재 값' }, { id: 'col2', type: 'select', label: '이전 값' }], run: ({ col1, col2 }) => { if(col1 && col2) addColumnAndTransform(`${col1}_direction`, col1, v => { const curr = Number(v); const prev = Number(originalData.find(r => r[col1] === v)?.[col2]); if(curr > prev) return '↑'; if(curr < prev) return '↓'; return '-'; }); } },
        { name: "누적 합계", category: "Analytics", desc: "값의 누적 합계를 계산합니다.", example: "10, 20, 30 -> 10, 30, 60", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '대상 컬럼' }], run: ({ col }) => { if(col) { const res = db.exec(`SELECT rowid, "${col}" FROM main_table ORDER BY rowid`); if(res.length) { let sum = 0; const cum = {}; res[0].values.forEach(r => { sum += Number(r[1]) || 0; cum[r[0]] = sum; }); saveHistoryBeforeMutation(); db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col}_cumsum" = ? WHERE rowid = ?`); Object.entries(cum).forEach(([rowid, v]) => stmt.run([v, parseInt(rowid)])); stmt.free(); db.run('COMMIT;'); if(!allColumns.includes(`${col}_cumsum`)) setAllColumns([...allColumns, `${col}_cumsum`]); executeSQL(query, true); } } } },
        { name: "移動平均", category: "Analytics", desc: "이동 평균을 계산합니다.", example: "3기간 이동평균", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '대상 컬럼' }, { id: 'n', type: 'number', label: '기간', placeholder: '3' }], run: ({ col, n }) => { if(col && n) { const res = db.exec(`SELECT rowid, "${col}" FROM main_table ORDER BY rowid`); if(res.length) { const vals = res[0].values.map(r => Number(r[1]) || 0); const ma = {}; vals.forEach((v, i) => { if(i < n - 1) ma[res[0].values[i][0]] = null; else { let sum = 0; for(let j = 0; j < n; j++) sum += vals[i - j]; ma[res[0].values[i][0]] = sum / n; } }); saveHistoryBeforeMutation(); db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col}_ma${n}" = ? WHERE rowid = ?`); Object.entries(ma).forEach(([rowid, v]) => stmt.run([v, parseInt(rowid)])); stmt.free(); db.run('COMMIT;'); if(!allColumns.includes(`${col}_ma${n}`)) setAllColumns([...allColumns, `${col}_ma${n}`]); executeSQL(query, true); } } } },
        { name: "LABEL 인코딩", category: "Analytics", desc: "텍스트 값을 숫자로 변환합니다.", example: "A, B, C -> 1, 2, 3", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => { if(col) { const res = db.exec(`SELECT DISTINCT "${col}" FROM main_table WHERE "${col}" IS NOT NULL ORDER BY "${col}"`); if(res.length) { const map = {}; res[0].values.forEach((r, i) => map[r[0]] = i + 1); const res2 = db.exec(`SELECT rowid, "${col}" FROM main_table`); if(res2.length) { saveHistoryBeforeMutation(); db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col}_encoded" = ? WHERE rowid = ?`); res2[0].values.forEach(r => stmt.run([map[r[1]], r[0]])); stmt.free(); db.run('COMMIT;'); if(!allColumns.includes(`${col}_encoded`)) setAllColumns([...allColumns, `${col}_encoded`]); executeSQL(query, true); } } } } },
        { name: "원-핫 인코딩", category: "Analytics", desc: "값을 원-핫 형태로 변환합니다.", example: "A -> [1,0,0], B -> [0,1,0]", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '대상 컬럼' }], run: ({ col }) => { if(col) { const res = db.exec(`SELECT DISTINCT "${col}" FROM main_table WHERE "${col}" IS NOT NULL`); if(res.length) { res[0].values.forEach((r, i) => { const val = r[0]; const res2 = db.exec(`SELECT rowid FROM main_table WHERE "${col}" = '${val}'`); if(res2.length) { db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col}_oh_${i+1}" = '1' WHERE rowid = ?`); res2[0].values.forEach(r => stmt.run([r[0]])); stmt.free(); db.run('COMMIT;'); if(!allColumns.includes(`${col}_oh_${i+1}`)) setAllColumns([...allColumns, `${col}_oh_${i+1}`]); } }); executeSQL(query, true); } } } },
        { name: "정규화 (0-1)", category: "Analytics", desc: "값을 0~1 범위로 정규화합니다.", example: "값 -> (값-min)/(max-min)", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '대상 컬럼' }], run: ({ col }) => { if(col) { const res = db.exec(`SELECT MIN("${col}"), MAX("${col}") FROM main_table`); if(res.length && res[0].values[0][0] !== null) { const min = res[0].values[0][0]; const max = res[0].values[0][1]; const range = max - min; const res2 = db.exec(`SELECT rowid, "${col}" FROM main_table`); if(res2.length) { saveHistoryBeforeMutation(); db.run('BEGIN TRANSACTION;'); const stmt = db.prepare(`UPDATE main_table SET "${col}_norm" = ? WHERE rowid = ?`); res2[0].values.forEach(r => { const v = Number(r[1]); stmt.run([range !== 0 ? (v - min) / range : 0, r[0]]); }); stmt.free(); db.run('COMMIT;'); if(!allColumns.includes(`${col}_norm`)) setAllColumns([...allColumns, `${col}_norm`]); executeSQL(query, true); } } } } },

        // ========================================
        // 💼 직장인 편의 기능 (Office) - 10개
        // ========================================
        { name: "부서 추출", category: "Office", desc: "이메일에서 부서 정보를 추출합니다.", example: "dept@company.com -> dept", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '이메일 컬럼' }], run: ({ col }) => applyJSTransform(col, v => v && String(v).includes('@') ? String(v).split('@')[0] : v) },
        { name: "직급 추출", category: "Office", desc: "직함에서 직급을 추출합니다.", example: "사원 -> 사원", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '직함 컬럼' }, { id: 'keyword', type: 'text', label: '직급 키워드', placeholder: '예: 사장, 팀장, 과장' }], run: ({ col, keyword }) => { if(col && keyword) { const kw = keyword.split(',').map(k => k.trim()); applyJSTransform(col, v => { const s = String(v || ''); const found = kw.find(k => s.includes(k)); return found || s; }); } } },
        { name: "년차 계산", category: "Office", desc: "입사년도로부터 년차를 계산합니다.", example: "2020년 입사 -> 3년차", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '입사년도/날짜 컬럼' }], run: ({ col }) => addColumnAndTransform(`${col}_years`, col, v => { const year = parseInt(String(v).slice(0,4)); return !isNaN(year) ? new Date().getFullYear() - year + 1 : null; }) },
        { name: "퇴직予定일 계산", category: "Office", desc: "퇴직 예정일을 계산합니다.", example: "60세 퇴직予定일", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '생년월일 컬럼' }, { id: 'age', type: 'number', label: '퇴직年齢', placeholder: '60' }], run: ({ col, age }) => { if(col && age) applyJSTransform(col, v => { const d = new Date(v); if(isNaN(d)) return null; d.setFullYear(d.getFullYear() + parseInt(age)); return d.toISOString().split('T')[0]; }); } },
        { name: "급여 범위 설정", category: "Office", desc: "급여를 범위로 변환합니다.", example: "3000000 -> '200-300만원'", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '급여 컬럼' }, { id: 'unit', type: 'number', label: '단위(만원)', placeholder: '100' }], run: ({ col, unit }) => { if(col && unit) applyJSTransform(col, v => { const n = Number(v); if(isNaN(n)) return v; const range = Math.floor(n / (unit * 10000)) * unit; return `${range}~${range + unit - 1}만원`; }); } },
        { name: "평가 등급 변환", category: "Office", desc: "점수를 평가 등급으로 변환합니다.", example: "95 -> '최우수'", condition: () => Object.values(colTypes).includes('number'), inputs: [{ id: 'col', type: 'select_number', label: '점수 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { const n = Number(v); if(isNaN(n)) return v; if(n >= 95) return '최우수'; if(n >= 85) return '우수'; if(n >= 75) return '양호'; if(n >= 65) return '보통'; return '개선 필요'; }) },
        { name: "팀명 정규화", category: "Office", desc: "팀명을 표준 형태로 변환합니다.", example: "마케팅팀 -> 마케팅", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '팀명 컬럼' }, { id: 'suffix', type: 'text', label: '제거할 접미사', placeholder: '팀, 부서, Group' }], run: ({ col, suffix }) => { if(col && suffix) applyJSTransform(col, v => v ? String(v).replace(new RegExp(suffix + '$', 'g'), '').trim() : v); } },
        { name: "사번 생성", category: "Office", desc: "사번 형식을 변환합니다.", example: "12345 -> EMP-12345", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '사번 컬럼' }, { id: 'prefix', type: 'text', label: '접두사', placeholder: 'EMP' }], run: ({ col, prefix }) => { if(col && prefix) applyJSTransform(col, v => v ? `${prefix}-${String(v)}` : v); } },
        { name: "출장비 정산", category: "Office", desc: "출장비 영수증 여부 체크.", example: "영수증 있음/없음", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '금액 컬럼' }, { id: 'threshold', type: 'number', label: '기준금액' }], run: ({ col, threshold }) => { if(col && threshold) addColumnAndTransform(`${col}_approval`, col, v => Number(v) >= parseFloat(threshold) ? '승인 필요' : '자동 승인'); } },
        { name: "휴가 유형 분류", category: "Office", desc: "휴가 종류를 분류합니다.", example: "연차, 반차, 병가...", condition: () => allColumns.length > 0, inputs: [{ id: 'col', type: 'select', label: '휴가명 컬럼' }], run: ({ col }) => applyJSTransform(col, v => { const s = String(v || '').toLowerCase(); if(s.includes('연차') || s.includes('年休')) return '연차'; if(s.includes('반차') || s.includes('半休')) return '반차'; if(s.includes('병가') || s.includes('病假')) return '병가'; if(s.includes('휴가') || s.includes('휴식')) return '휴가'; return '기타'; }) },
    ], [allColumns, colTypes, db, query, executeSQL, originalData, saveHistoryBeforeMutation]);

    



    const isDataReady = allColumns.length > 0;

    return (
        <div className="app-wrapper">
            <div className={`max-w-[1800px] mx-auto w-full h-full flex flex-col ${currentPage === 'main' ? 'main-scroll-hidden' : ''}`}>
                {currentPage !== 'home' && (
                <header className="app-header flex items-center justify-between px-3 sm:px-5 relative z-[100]" style={{ background: 'rgba(6,12,26,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                    <div className="flex items-center gap-2.5">
                        <img src="/logo.svg" alt="VaultSheet" className="w-7 h-7 rounded-lg" />
                        <span className="font-bold text-slate-100 tracking-tight text-sm">VaultSheet</span>
                        <span className="hidden md:inline px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-sky-400" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
                            OFFLINE
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5">
                            {currentPage !== 'home' && currentPage !== 'main' && (
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    이전
                                </button>
                            )}
                        {currentPage === 'tools' ? (
                            /* 변환도구 페이지 브레드크럼 */
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-700 text-xs">/</span>
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-400" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                    <Icons.Grid /> 변환 도구 모음
                                </span>
                            </div>
                        ) : currentPage === 'main' ? (
                            /* 도구 버튼들 */
                            <div className="flex items-center gap-1.5">
                                {/* 이전 페이지 버튼 */}
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    <span className="hidden md:inline">이전</span>
                                </button>
                                {/* 변환 도구 페이지 버튼 */}
                                <button
                                    onClick={() => navigateTo('tools')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all"
                                >
                                    <Icons.Grid /> <span className="hidden md:inline">변환 도구</span>
                                </button>
                                {/* 레거시 드롭다운 (숨김 처리) */}
                                <div className="hidden">
                                    <div className="absolute top-full left-0 mt-2 w-[480px] rounded-xl shadow-2xl opacity-0 invisible z-[100]" style={{ background: 'rgba(6,12,26,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="grid grid-cols-2 gap-1 p-2">
                                            <button
                                                onClick={() => navigateTo('serviceCenter')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Shield />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">고객센터</div>
                                                    <div className="text-xs text-slate-500 truncate">서비스 문의 및 지원</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('encoding')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Alert />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">한글 깨짐 복구</div>
                                                    <div className="text-xs text-slate-500 truncate">EUC-KR ↔ UTF-8</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('htmlTable')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Globe />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">웹 표 추출</div>
                                                    <div className="text-xs text-slate-500 truncate">HTML → CSV</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('textExtractor')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Cleaning />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">텍스트 정제</div>
                                                    <div className="text-xs text-slate-500 truncate">이메일, 전화번호 추출</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('listToComma')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Link />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">줄바꿈 변환</div>
                                                    <div className="text-xs text-slate-500 truncate">쉼표 ↔ 줄바꿈</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('listComparator')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Compare />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">목록 비교</div>
                                                    <div className="text-xs text-slate-500 truncate">두 목록 차이점</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('personalDataMasker')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Shield />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">개인정보 마스킹</div>
                                                    <div className="text-xs text-slate-500 truncate">이름, 전화번호 등</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('mockDataGenerator')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Magic />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">Mock 데이터 생성</div>
                                                    <div className="text-xs text-slate-500 truncate">테스트용 데이터</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('qrCode')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-teal-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.QrCode />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">QR 코드 생성</div>
                                                    <div className="text-xs text-slate-500 truncate">URL/텍스트 → QR</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('colorConverter')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Palette />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">색상 변환기</div>
                                                    <div className="text-xs text-slate-500 truncate">HEX, RGB, HSL 변환</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('calculator')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Calc />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">계산기</div>
                                                    <div className="text-xs text-slate-500 truncate">과학계산, 통계, 함수</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('codeMinifier')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Compress />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">코드 미니파이어</div>
                                                    <div className="text-xs text-slate-500 truncate">JS, CSS, HTML 압축</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('imageCompressor')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Compress />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">이미지 압축기</div>
                                                    <div className="text-xs text-slate-500 truncate">JPEG, PNG, WebP</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('jsonFormatter')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.FileJson />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">JSON 포맷터</div>
                                                    <div className="text-xs text-slate-500 truncate">정렬, 검증, 뷰어</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('markdownEditor')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.FileJson />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">마크다운 에디터</div>
                                                    <div className="text-xs text-slate-500 truncate">실시간 미리보기</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('pdfConverter')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">PDF 변환기</div>
                                                    <div className="text-xs text-slate-500 truncate">PDF ↔ Word, Excel, PPT, 이미지</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('regexTester')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Search />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">정규식 테스터</div>
                                                    <div className="text-xs text-slate-500 truncate">패턴 매칭, 검증</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('unitConverter')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Convert />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">단위 변환기</div>
                                                    <div className="text-xs text-slate-500 truncate">길이, 무게, 온도</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('uuidGenerator')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-teal-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.ArrowRight />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">ID 마스터</div>
                                                    <div className="text-xs text-slate-500 truncate">고유 식별자 생성</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('imageTools')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Image />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">이미지 변환기</div>
                                                    <div className="text-xs text-slate-500 truncate">PNG, JPG, WebP 변환</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('videoTools')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Video />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">동영상 변환기</div>
                                                    <div className="text-xs text-slate-500 truncate">MP4, AVI, MOV 변환</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('zipTools')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Zip />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">압축 변환기</div>
                                                    <div className="text-xs text-slate-500 truncate">ZIP, RAR, 7Z 변환</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => navigateTo('digitalStampSignStudio')}
                                                className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-transparent transition-all rounded-lg group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover/item:scale-110 transition-transform shrink-0">
                                                    <Icons.Stamp />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <div className="font-medium text-sm">디지털 도장 & 서명</div>
                                                    <div className="text-xs text-slate-500 truncate">PDF/이미지에 서명 삽입</div>
                                                </div>
                                            </button>
                                        </div>
                                        {/* 🆕 신규 도구 섹션 */}
                                        <div className="px-3 pt-2 pb-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">🆕 신규 도구</div>
                                            <div className="grid grid-cols-2 gap-1">
                                                {[
                                                    { page: 'timestampConverter', icon: '⏱️', label: '타임스탬프 변환', color: 'cyan' },
                                                    { page: 'numberBase', icon: '🔢', label: '진법 변환기', color: 'purple' },
                                                    { page: 'morseConverter', icon: '📡', label: '모스 부호', color: 'amber' },
                                                    { page: 'loremIpsum', icon: '📝', label: 'Lorem Ipsum', color: 'green' },
                                                    { page: 'passwordGenerator', icon: '🔐', label: '비밀번호 생성', color: 'red' },
                                                    { page: 'sqlFormatter', icon: '🗄️', label: 'SQL 포맷터', color: 'cyan' },
                                                    { page: 'csvToSql', icon: '🔄', label: 'CSV → SQL', color: 'orange' },
                                                    { page: 'xmlJson', icon: '🔄', label: 'XML ↔ JSON', color: 'blue' },
                                                    { page: 'gradientGenerator', icon: '🎨', label: '그라데이션', color: 'pink' },
                                                    { page: 'colorPalette', icon: '🎨', label: '컬러 팔레트', color: 'violet' },
                                                    { page: 'romanNumeral', icon: '🏛️', label: '로마 숫자', color: 'amber' },
                                                    { page: 'cronParser', icon: '⏰', label: 'Cron 파서', color: 'cyan' },
                                                    { page: 'ogTagGenerator', icon: '🔗', label: 'OG 태그 생성', color: 'sky' },
                                                    { page: 'yamlJson', icon: '⚙️', label: 'YAML ↔ JSON', color: 'green' },
                                                    { page: 'htmlToJsx', icon: '⚛️', label: 'HTML → JSX', color: 'orange' },
                                                ].map(t => (
                                                    <button key={t.page} onClick={() => navigateTo(t.page)}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white transition-all text-left"
                                                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                        <span className="text-sm">{t.icon}</span>
                                                        <span className="text-xs font-medium truncate">{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 벽(구분선) */}
                                <div className="h-8 w-px bg-slate-600 mx-1"></div>
                                
                                <div className="h-4 w-px mx-1" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
                                
                                {/* 데이터 열기 버튼 */}
                                <button
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 2px 12px rgba(14,165,233,0.3)' }}
                                    onClick={() => document.getElementById('file-in').click()}
                                >
                                    <span className="hidden md:inline">데이터 열기</span>
                                    <span className="md:hidden">+</span>
                                </button>
                                <input type="file" id="file-in" className="hidden" accept=".csv,.json" onChange={e => processFile(e.target.files[0])} />
                            </div>
                        ) : null}
                        </div>
                    </div>
                </header>
                )}
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

                {/* 🆕 페이지에 따른 메인 컨텐츠 렌더링 */}
                <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-500">로딩 중...</div>}>
                {currentPage === 'home' ? (
                    <div className="flex-1 overflow-y-auto">
                        <HomePage navigateTo={navigateTo} />
                    </div>
                ) : currentPage === 'tools' ? (
                    <div className="flex-1 overflow-y-auto">
                        <ToolsPage navigateTo={navigateTo} />
                    </div>
                ) : currentPage === 'jsonCsvPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonCsvPage /></div>
                ) : currentPage === 'jsonFormatterPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonFormatterPage /></div>
                ) : currentPage === 'jsonFormatConvertPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonFormatConvertPage /></div>
                ) : currentPage === 'jsonPathPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonPathPage /></div>
                ) : currentPage === 'jsonToSqlPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonToSqlPage /></div>
                ) : currentPage === 'encoding' ? (
                    <div className="main-wrapper">
                        <EncodingConverter />
                    </div>
                ) : currentPage === 'htmlTable' ? (
                    <div className="main-wrapper">
                        <HtmlTableExtractor />
                    </div>
                ) : currentPage === 'textExtractor' ? (
                    <div className="main-wrapper">
                        <TextExtractor />
                    </div>
                ) : currentPage === 'listToComma' ? (
                    <div className="main-wrapper">
                        <ListToCommaConverter />
                    </div>
                ) : currentPage === 'listComparator' ? (
                    <div className="main-wrapper">
                        <ListComparator />
                    </div>
                ) : currentPage === 'personalDataMasker' ? (
                    <div className="main-wrapper">
                        <PersonalDataMasker />
                    </div>
                ) : currentPage === 'mockDataGenerator' ? (
                    <div className="main-wrapper">
                        <MockDataGenerator />
                    </div>
                ) : currentPage === 'qrCode' ? (
                    <div className="main-wrapper">
                        <QrCodeGenerator />
                    </div>
                ) : currentPage === 'colorStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-500">로딩 중...</div>}><ColorStudio /></Suspense></div>
                ) : currentPage === 'calculator' ? (
                    <div className="main-wrapper">
                        <Calculator />
                    </div>
                ) : currentPage === 'codeMinifier' ? (
                    <div className="main-wrapper">
                        <CodeMinifier />
                    </div>
                ) : currentPage === 'imageCompressor' ? (
                    <div className="main-wrapper">
                        <ImageCompressor />
                    </div>
                ) : currentPage === 'jsonFormatter' ? (
                    <div className="main-wrapper">
                        <JsonFormatter />
                    </div>
                ) : currentPage === 'markdownEditor' ? (
                    <div className="main-wrapper">
                        <MarkdownEditor />
                    </div>
                ) : currentPage === 'pdfConverter' ? (
                    <div className="main-wrapper">
                        <PdfConverter />
                    </div>
                ) : currentPage === 'regexTester' ? (
                    <div className="main-wrapper">
                        <RegexTester />
                    </div>
                ) : currentPage === 'unitConverter' ? (
                    <div className="main-wrapper">
                        <UnitConverter />
                    </div>
                ) : currentPage === 'uuidGenerator' ? (
                    <div className="main-wrapper">
                        <UuidGenerator />
                    </div>
                ) : currentPage === 'digitalStampSignStudio' ? (
                    <div className="main-wrapper">
                        <DigitalStampSignStudio />
                    </div>
                ) : currentPage === 'imageTools' ? (
                    <div className="main-wrapper">
                        <ImageTools />
                    </div>
                ) : currentPage === 'videoTools' ? (
                    <div className="main-wrapper">
                        <VideoTools />
                    </div>
                ) : currentPage === 'excelJsonPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><ExcelJsonPage /></div>
                ) : currentPage === 'csvMergeSplitPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><CsvMergeSplitPage /></div>
                ) : currentPage === 'mainZoom' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0 p-4">
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 overflow-hidden">
                                    <div className="w-full h-full">
                                        {viewMode === 'raw' && (
                                            <DataGrid data={originalData} columns={Object.keys(originalData[0] || {})} readOnly={true}
                                                watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} hideToolbar={true} />
                                        )}
                                        {viewMode === 'grid' && (
                                            <DataGrid data={data} columns={columns} onUpdate={handleCellUpdate}
                                                watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} hideToolbar={true} />
                                        )}
                                        {viewMode === 'insight' && (
                                            <InsightStudio data={data} columns={columns} colTypes={colTypes} />
                                        )}
                                        <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500 text-sm">로딩 중...</div>}>
                                            {viewMode === 'pivot' && (
                                                <PivotTable data={data} columns={columns} colTypes={colTypes} hideToolbar={true} />
                                            )}
                                            {viewMode === 'chart' && (
                                                <ChartViewer data={data} columns={columns}
                                                    watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} hideToolbar={true} />
                                            )}
                                        </Suspense>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : currentPage === 'fileNotice' ? (
                    <div className="main-wrapper">
                        <FileNoticePage
                            fileInfo={fileNoticeInfo}
                            noticeType={fileNoticeType}
                            onBack={() => { window.location.hash = 'main'; setCurrentPage('main'); }}
                            onContinueJson={() => { navigateTo('jsonCsvPage'); }}
                            onGoTools={() => { navigateTo('tools'); }}
                        />
                    </div>
                ) : currentPage === 'zipTools' ? (
                    <div className="main-wrapper">
                        <ZipTools />
                    </div>
                ) : currentPage === 'serviceCenter' ? (
                    <div className="main-wrapper">
                        <ServiceCenter />
                    </div>
                ) : currentPage === 'cryptoEncoder' ? (
                    <div className="main-wrapper">
                        <CryptoEncoder />
                    </div>
                ) : currentPage === 'numberBase' ? (
                    <div className="main-wrapper"><NumberBaseConverter /></div>
                ) : currentPage === 'morseConverter' ? (
                    <div className="main-wrapper"><MorseConverter /></div>
                ) : currentPage === 'loremIpsum' ? (
                    <div className="main-wrapper"><LoremIpsumGenerator /></div>
                ) : currentPage === 'passwordGenerator' ? (
                    <div className="main-wrapper"><PasswordGenerator /></div>
                ) : currentPage === 'sqlFormatter' ? (
                    <div className="main-wrapper"><SqlFormatter /></div>
                ) : currentPage === 'csvToSql' ? (
                    <div className="main-wrapper"><CsvToSqlInsert /></div>
                ) : currentPage === 'xmlJson' ? (
                    <div className="main-wrapper"><XmlJsonConverter /></div>
                ) : currentPage === 'romanNumeral' ? (
                    <div className="main-wrapper"><RomanNumeralConverter /></div>
                ) : currentPage === 'cronParser' ? (
                    <div className="main-wrapper"><CronParser /></div>
                ) : currentPage === 'ogTagGenerator' ? (
                    <div className="main-wrapper"><OgTagGenerator /></div>
                ) : currentPage === 'yamlJson' ? (
                    <div className="main-wrapper"><YamlJsonConverter /></div>
                ) : currentPage === 'htmlToJsx' ? (
                    <div className="main-wrapper"><HtmlToJsx /></div>
                ) : currentPage === 'jsonFormatterPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonFormatterPage /></div>
                ) : currentPage === 'jsonCsvPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonCsvPage /></div>
                ) : currentPage === 'jsonFormatConvertPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonFormatConvertPage /></div>
                ) : currentPage === 'jsonPathPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonPathPage /></div>
                ) : currentPage === 'jsonToSqlPage' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><JsonToSqlPage /></div>
                ) : currentPage === 'colorStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-500">로딩 중...</div>}><ColorStudio /></Suspense></div>
                ) : currentPage === 'diffChecker' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={null}><DiffChecker /></Suspense></div>
                ) : currentPage === 'textStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={null}><TextStudio /></Suspense></div>
                ) : currentPage === 'cssStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={null}><CSSStudio /></Suspense></div>
                ) : currentPage === 'timeStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={null}><TimeStudio /></Suspense></div>
                ) : currentPage === 'utilStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={null}><UtilStudio /></Suspense></div>
                ) : currentPage === 'securityStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={null}><SecurityStudio /></Suspense></div>
                ) : currentPage === 'dataToolsStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={null}><DataToolsStudio /></Suspense></div>
                ) : currentPage === 'mediaStudio' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><Suspense fallback={null}><MediaStudio /></Suspense></div>
                ) : currentPage === 'mobile' ? (
                    <div className="main-wrapper flex flex-col overflow-hidden"><MobilePage navigateTo={navigateTo} /></div>
                ) : STUB_TOOL_PAGES.includes(currentPage) || Object.keys(PAGE_REDIRECTS).includes(currentPage) ? (
                    <div className="main-wrapper flex flex-col overflow-y-auto" style={{ minHeight: '100%' }}>
                        <ToolStub page={currentPage} />
                    </div>
                ) : (
                    <div className="main-wrapper">
                        {/* 모바일: 우측 패널 토글 버튼 */}
                        <button
                            onClick={() => setIsMobileMenuOpen(v => !v)}
                            className="md:hidden fixed bottom-5 right-5 z-[200] w-12 h-12 rounded-full flex items-center justify-center shadow-2xl text-white"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}
                        >
                            {isMobileMenuOpen ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
                        </button>

                        {/* ── 오른쪽 Tools 패널 (노코드 빌더 + SQL) ── */}
                        <div className={`h-full shrink-0 order-2 ${isMobileMenuOpen ? 'fixed right-0 inset-y-0 z-[150] md:relative' : 'hidden md:flex md:flex-col'}`}>
                            {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 md:hidden" style={{ backdropFilter: 'blur(4px)' }} onClick={() => setIsMobileMenuOpen(false)} />}
                            <div className={`flex flex-col z-10 overflow-hidden transition-all duration-300 rounded-2xl h-full ${isZoomed ? 'hidden' : 'w-[380px] max-w-[90vw]'}`}
                                style={{ background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '-4px 0 24px rgba(0,0,0,0.3), inset 1px 0 0 rgba(255,255,255,0.04)', position: 'relative' }}>
                                <div className="flex shrink-0 p-2 gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <button
                                        onClick={() => setLeftTab('nocode')}
                                        className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl transition-all ${leftTab === 'nocode' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        style={leftTab === 'nocode' ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.3)' } : {}}
                                    >
                                        <Icons.Wand /> 노코드 빌더
                                    </button>
                                    <button
                                        onClick={() => setLeftTab('sql')}
                                        className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl transition-all ${leftTab === 'sql' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        style={leftTab === 'sql' ? { background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', boxShadow: '0 2px 12px rgba(14,165,233,0.3)' } : {}}
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
                                        <div className="flex flex-col gap-4">

                                            {/* ── 스마트 변환 허브 ── */}
                                            <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.06))', border: '1px solid rgba(139,92,246,0.25)' }}>
                                                <div className="flex items-center justify-between px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span>✨</span>
                                                        <span className="text-xs font-bold text-violet-300">스마트 변환 허브</span>
                                                        <span className="text-[10px] text-slate-600">60+ 작업</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setCmdOpen(true)}
                                                        disabled={!isDataReady}
                                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${isDataReady ? 'text-white hover:scale-105 active:scale-95' : 'text-slate-600 cursor-not-allowed opacity-40'}`}
                                                        style={isDataReady ? { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' } : {}}
                                                    >
                                                        <Icons.Magic /> 열기
                                                    </button>
                                                </div>
                                                <div className="px-3 pb-3 flex flex-wrap gap-1">
                                                    {['🧹 정제', '📝 텍스트', '🔢 수학', '📅 날짜', '📊 통계', '🔒 보안', '💼 직장인'].map(chip => (
                                                        <button key={chip} onClick={() => { if (isDataReady) setCmdOpen(true); }} disabled={!isDataReady}
                                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${isDataReady ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-700 cursor-not-allowed'}`}
                                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                            {chip}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ── 자연어 필터 ── */}
                                            <div className="p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                    자연어 필터
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="예: revenue 10000 이상 and country Korea"
                                                    value={ncNaturalFilter}
                                                    onChange={e => setNcNaturalFilter(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && ncNaturalFilter.trim()) {
                                                            const text = ncNaturalFilter.toLowerCase();
                                                            let newFilters = [...ncFilters];
                                                            const numMatch = text.match(/(\w+)\s*(\d+以上|이상|초과|이하|미만|小于)?/);
                                                            if (numMatch) {
                                                                const col = numMatch[1];
                                                                const op = text.includes('이상') || text.includes('>=') ? '>=' : text.includes('초과') || text.includes('>') ? '>' : text.includes('이하') || text.includes('<=') ? '<=' : text.includes('미만') || text.includes('<') ? '<' : '=';
                                                                const val = numMatch[2] ? numMatch[2].replace(/[^0-9]/g, '') : '';
                                                                if (val && allColumns.includes(col)) { newFilters.push({ id: Date.now(), col, op, val }); setNcFilters(newFilters); setNcNaturalFilter(''); }
                                                            }
                                                        }
                                                    }}
                                                    className="w-full bg-slate-900/80 text-slate-200 px-3 py-2 text-xs rounded-lg border border-indigo-500/25 outline-none focus:border-indigo-400 placeholder:text-slate-600"
                                                />
                                                <p className="text-[10px] text-slate-700 mt-1">엔터로 필터 추가</p>
                                            </div>

                                            {/* ── 고급 엔지니어링 도구 ── */}
                                            <NocodeEngineeringTools
                                                allColumns={allColumns}
                                                colTypes={colTypes}
                                                db={db}
                                                data={data}
                                                setData={setData}
                                                query={query}
                                                executeSQL={executeSQL}
                                                saveHistoryBeforeMutation={saveHistoryBeforeMutation}
                                                setAllColumns={setAllColumns}
                                                showAlert={showAlert}
                                                isDataReady={isDataReady}
                                                ncFindCol={ncFindCol} setNcFindCol={setNcFindCol}
                                                ncFindVal={ncFindVal} setNcFindVal={setNcFindVal}
                                                ncReplaceVal={ncReplaceVal} setNcReplaceVal={setNcReplaceVal}
                                                ncSplitCol={ncSplitCol} setNcSplitCol={setNcSplitCol}
                                                ncSplitDelim={ncSplitDelim} setNcSplitDelim={setNcSplitDelim}
                                                ncMergeCol1={ncMergeCol1} setNcMergeCol1={setNcMergeCol1}
                                                ncMergeCol2={ncMergeCol2} setNcMergeCol2={setNcMergeCol2}
                                                ncMergeSep={ncMergeSep} setNcMergeSep={setNcMergeSep}
                                                ncMergeNewName={ncMergeNewName} setNcMergeNewName={setNcMergeNewName}
                                                ncRenameFrom={ncRenameFrom} setNcRenameFrom={setNcRenameFrom}
                                                ncRenameTo={ncRenameTo} setNcRenameTo={setNcRenameTo}
                                                ncFillCol={ncFillCol} setNcFillCol={setNcFillCol}
                                                ncFillVal={ncFillVal} setNcFillVal={setNcFillVal}
                                                ncCorr1={ncCorr1} setNcCorr1={setNcCorr1}
                                                ncCorr2={ncCorr2} setNcCorr2={setNcCorr2}
                                                ncCorrResult={ncCorrResult} setNcCorrResult={setNcCorrResult}
                                                ncNewColName={ncNewColName} setNcNewColName={setNcNewColName}
                                                ncNewColFormula={ncNewColFormula} setNcNewColFormula={setNcNewColFormula}
                                                ncSampleN={ncSampleN} setNcSampleN={setNcSampleN}
                                                ncRegexCol={ncRegexCol} setNcRegexCol={setNcRegexCol}
                                                ncRegexPattern={ncRegexPattern} setNcRegexPattern={setNcRegexPattern}
                                                ncProfileCol={ncProfileCol} setNcProfileCol={setNcProfileCol}
                                                ncProfileResult={ncProfileResult} setNcProfileResult={setNcProfileResult}
                                                ncOutlierCol={ncOutlierCol} setNcOutlierCol={setNcOutlierCol}
                                                ncOutlierResult={ncOutlierResult} setNcOutlierResult={setNcOutlierResult}
                                                ncTypeCol={ncTypeCol} setNcTypeCol={setNcTypeCol}
                                                ncTargetType={ncTargetType} setNcTargetType={setNcTargetType}
                                                ncDateRangeCol={ncDateRangeCol} setNcDateRangeCol={setNcDateRangeCol}
                                                ncDateRangeStart={ncDateRangeStart} setNcDateRangeStart={setNcDateRangeStart}
                                                ncDateRangeEnd={ncDateRangeEnd} setNcDateRangeEnd={setNcDateRangeEnd}
                                                ncDedupCols={ncDedupCols} setNcDedupCols={setNcDedupCols}
                                                ncExpandJsonCol={ncExpandJsonCol} setNcExpandJsonCol={setNcExpandJsonCol}
                                                ncOpenSection={ncOpenSection} setNcOpenSection={setNcOpenSection}
                                            />

                                            {/* ── 기본 설정 그룹 ── */}
                                            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>

                                                {/* Null 무시 토글 */}
                                                <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <span className="text-xs font-medium text-slate-400">빈 데이터(Null) 무시</span>
                                                    <button onClick={() => setNcIgnoreNull(!ncIgnoreNull)}
                                                        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${ncIgnoreNull ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${ncIgnoreNull ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`}></span>
                                                    </button>
                                                </div>

                                                {/* DISTINCT 토글 */}
                                                <div className="flex items-center justify-between px-3 py-2.5">
                                                    <span className="text-xs font-medium text-slate-400">중복 제거 (DISTINCT)</span>
                                                    <button onClick={() => setNcDistinct(!ncDistinct)}
                                                        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${ncDistinct ? 'bg-violet-500' : 'bg-slate-700'}`}>
                                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${ncDistinct ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`}></span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ── 표시 컬럼 선택 ── */}
                                            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">표시 컬럼</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-slate-600">{ncSelectedCols.length}/{allColumns.length}</span>
                                                        <button onClick={() => setNcSelectedCols(allColumns)} className="text-[10px] text-sky-400 hover:text-sky-300 px-1.5 py-0.5 rounded" style={{ background: 'rgba(14,165,233,0.08)' }}>전체</button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 p-3 max-h-[130px] overflow-y-auto custom-scrollbar">
                                                    {allColumns.map(c => (
                                                        <button key={c}
                                                            onClick={() => setNcSelectedCols(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                                                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${ncSelectedCols.includes(c) ? 'text-sky-300' : 'text-slate-600'}`}
                                                            style={{
                                                                background: ncSelectedCols.includes(c) ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.03)',
                                                                border: `1px solid ${ncSelectedCols.includes(c) ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.06)'}`
                                                            }}>
                                                            {c}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ── 조건 필터 ── */}
                                            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">조건 필터</span>
                                                    <button onClick={() => setNcFilters([...ncFilters, { id: Date.now(), col: allColumns[0] || '', op: '=', val: '' }])}
                                                        className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 px-1.5 py-0.5 rounded transition-colors"
                                                        style={{ background: 'rgba(14,165,233,0.08)' }}>
                                                        <Icons.Plus /> 추가
                                                    </button>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {ncFilters.length === 0 && <p className="text-[11px] text-slate-700 text-center py-1">필터 없음</p>}
                                                    {ncFilters.map(f => (
                                                        <div key={f.id} className="flex gap-1.5 items-center">
                                                            <select className="flex-1 min-w-0 bg-slate-950 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 outline-none"
                                                                value={f.col} onChange={e => setNcFilters(ncFilters.map(i => i.id === f.id ? { ...i, col: e.target.value } : i))}>
                                                                {allColumns.map(c => <option key={c}>{c}</option>)}
                                                            </select>
                                                            <select className="w-16 bg-slate-950 text-xs text-slate-200 px-1 py-1.5 rounded border border-slate-700 outline-none"
                                                                value={f.op} onChange={e => setNcFilters(ncFilters.map(i => i.id === f.id ? { ...i, op: e.target.value } : i))}>
                                                                <option value="=">=</option>
                                                                <option value="gt">&gt;</option>
                                                                <option value="lt">&lt;</option>
                                                                <option value="LIKE">포함</option>
                                                                <option value="NOT LIKE">제외</option>
                                                            </select>
                                                            <input type="text" className="w-20 bg-slate-950 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 outline-none"
                                                                value={f.val} onChange={e => setNcFilters(ncFilters.map(i => i.id === f.id ? { ...i, val: e.target.value } : i))} />
                                                            <button onClick={() => setNcFilters(ncFilters.filter(i => i.id !== f.id))} className="text-red-500 hover:text-red-400 flex-shrink-0">
                                                                <Icons.Trash />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ── 피벗 / 그룹화 ── */}
                                            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <Icons.Database />
                                                        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">피벗 / 그룹화</span>
                                                    </div>
                                                    <select className="bg-slate-900 text-xs text-slate-200 px-2 py-2 rounded border border-slate-700 w-full outline-none"
                                                        value={ncGroupCol} onChange={e => setNcGroupCol(e.target.value)}>
                                                        <option value="">-- GROUP BY 사용 안함 --</option>
                                                        {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    {ncGroupCol && (
                                                        <div className="flex gap-1.5 mt-2">
                                                            <select className="w-1/3 bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 outline-none"
                                                                value={ncAggFn} onChange={e => setNcAggFn(e.target.value)}>
                                                                <option value="SUM">합계</option>
                                                                <option value="AVG">평균</option>
                                                                <option value="COUNT">개수</option>
                                                                <option value="MAX">최대</option>
                                                                <option value="MIN">최소</option>
                                                            </select>
                                                            <select className="flex-1 bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 outline-none"
                                                                value={ncAggCol} onChange={e => setNcAggCol(e.target.value)}>
                                                                {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 날짜 주기 묶기 */}
                                                {ncGroupCol && colTypes[ncGroupCol] === 'date' && (
                                                    <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.04)' }}>
                                                        <div className="text-[10px] font-bold text-amber-400 mb-2">📅 날짜 주기 묶기</div>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {[{val:'',label:'원본'},{val:'day',label:'일'},{val:'week',label:'주'},{val:'month',label:'월'},{val:'quarter',label:'분기'},{val:'year',label:'연도'}].map(opt => (
                                                                <button key={opt.val} onClick={() => setNcDateRollup(opt.val)}
                                                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${ncDateRollup === opt.val ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 자동 구간화 */}
                                                {ncGroupCol && colTypes[ncGroupCol] === 'number' && (
                                                    <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(6,182,212,0.15)', background: 'rgba(6,182,212,0.04)' }}>
                                                        <div className="text-[10px] font-bold text-cyan-400 mb-2">📊 자동 구간화</div>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {[{val:'',label:'없음'},{val:'10',label:'10단위'},{val:'100',label:'100단위'},{val:'1000',label:'1K단위'},{val:'age',label:'연령대'}].map(opt => (
                                                                <button key={opt.val} onClick={() => setNcAutoBucket(opt.val)}
                                                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${ncAutoBucket === opt.val ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── 정렬 & Limit ── */}
                                            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">정렬</div>
                                                    <div className="flex gap-1.5">
                                                        <select className="flex-1 bg-slate-950 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 outline-none"
                                                            value={ncSortCol} onChange={e => setNcSortCol(e.target.value)}>
                                                            <option value="">-- 정렬 안함 --</option>
                                                            {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                        <select className="w-20 bg-slate-950 text-xs text-slate-200 px-1 py-1.5 rounded border border-slate-700 outline-none"
                                                            value={ncSortDir} onChange={e => setNcSortDir(e.target.value)}>
                                                            <option value="ASC">오름차순</option>
                                                            <option value="DESC">내림차순</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-2.5">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Limit</span>
                                                        <span className="text-xs font-bold text-sky-400 font-mono">{ncLimit.toLocaleString()}</span>
                                                    </div>
                                                    <input type="range" min="10" max="10000" step="10" value={ncLimit}
                                                        onChange={e => setNcLimit(Number(e.target.value))} className="w-full accent-sky-500" />
                                                </div>
                                            </div>

                                            {/* ── 쿼리 실행 버튼 ── */}
                                            <button onClick={applyNoCodeBuilder}
                                                className="w-full py-2.5 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                                                <Icons.Play /> 쿼리 실행
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full gap-4">
                                            <textarea
                                                className="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm rounded-xl border border-slate-700 outline-none resize-none"
                                                value={query}
                                                onChange={e => setQuery(e.target.value)}
                                                spellCheck="false"
                                            />
                                            <button
                                                onClick={() => executeSQL(query)}
                                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-base shrink-0"
                                            >
                                                <Icons.Play /> 실행
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── 왼쪽 데이터 워크스페이스 (메인 콘텐츠) ── */}
                        <div className="main-content order-1 flex-1 rounded-2xl overflow-hidden h-full flex flex-col relative"
                            style={{
                                background: 'rgba(10,16,30,0.9)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                boxShadow: '0 0 0 1px rgba(99,102,241,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
                            }}>
                            {loading && (
                                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                                    <div className="w-12 h-12 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <p className="text-brand-400 font-semibold animate-pulse text-sm">{loading}</p>
                                </div>
                            )}

                            {!isDataReady && !loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                                    {/* 배경 장식 */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.07]" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
                                        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.05]" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
                                        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg px-8 text-center">
                                        {/* 아이콘 배지 */}
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-indigo-300" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(14,165,233,0.08))', border: '1px solid rgba(99,102,241,0.18)', boxShadow: '0 12px 40px rgba(99,102,241,0.12)' }}>
                                                <svg className="w-11 h-11" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-900 animate-pulse" />
                                        </div>
                                        {/* 텍스트 */}
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-100 mb-2 tracking-tight">데이터를 불러오세요</h2>
                                            <p className="text-sm text-slate-500 leading-relaxed">CSV / JSON 파일을 드래그하거나,<br />샘플 데이터로 모든 기능을 체험해보세요.</p>
                                        </div>
                                        {/* 샘플 데이터 버튼 */}
                                        <button
                                            onClick={() => loadData(Papa.parse(SAMPLE_DATA, { header: true, dynamicTyping: true }).data)}
                                            className="group px-8 py-3 text-sm font-bold text-white rounded-2xl transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-2.5"
                                            style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', boxShadow: '0 4px 28px rgba(99,102,241,0.35)' }}
                                        >
                                            <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            샘플 데이터셋 로드
                                        </button>
                                        {/* 지원 포맷 */}
                                        <div className="flex items-center gap-3">
                                            {['CSV', 'JSON', 'XLSX'].map(f => (
                                                <span key={f} className="px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-wider"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col h-full overflow-hidden">
                                    {/* ── 데이터 뷰 툴바 ── */}
                                    <div className="flex items-center gap-2 px-4 py-3.5 shrink-0 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                        {/* 데이터 소스 배지 */}
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                            <span className="text-xs font-semibold text-amber-400/90 truncate max-w-[130px]">{dataSourceName}</span>
                                        </div>

                                        {/* 뷰 모드 탭 */}
                                        <div className="flex flex-1 rounded-xl p-1 gap-0.5 min-w-0" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {[
                                                { id: 'raw',     icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: '원본' },
                                                { id: 'grid',    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18M3 3h18v18H3z" /></svg>, label: '결과 그리드' },
                                                { id: 'pivot',   icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>, label: '피벗' },
                                                { id: 'chart',   icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, label: '차트' },
                                                { id: 'insight', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, label: '인사이트', accent: true },
                                            ].map(mode => (
                                                <button key={mode.id} onClick={() => setViewMode(mode.id)}
                                                    className={`flex-1 px-2.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${viewMode === mode.id ? 'text-white' : 'text-slate-600 hover:text-slate-300'}`}
                                                    style={viewMode === mode.id ? {
                                                        background: mode.accent ? 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.2))' : 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(14,165,233,0.15))',
                                                        boxShadow: mode.accent ? '0 1px 8px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 1px 8px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                                                        border: mode.accent ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(99,102,241,0.25)',
                                                    } : {}}>
                                                    {mode.icon}
                                                    <span className="hidden lg:inline">{mode.label}</span>
                                                    {mode.accent && viewMode !== mode.id && <span className="hidden xl:inline-block w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />}
                                                </button>
                                            ))}
                                        </div>

                                        {/* 통계 + 이전결과 버튼 */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {resultHistory.length > 0 && (
                                                <button onClick={goBackToPreviousResult}
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                                                    style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', color: '#fbbf24' }}
                                                    title={`${resultHistory.length}개 이전 결과로 되돌리기`}>
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                    <span>되돌리기</span>
                                                    <span className="font-mono opacity-60">({resultHistory.length})</span>
                                                </button>
                                            )}
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <span className="text-slate-600">ROWS</span>
                                                <span className="font-bold text-sky-400">{(viewMode === 'raw' ? originalData.length : data.length).toLocaleString()}</span>
                                                <span className="text-slate-700 mx-0.5">·</span>
                                                <span className="text-slate-600">COLS</span>
                                                <span className="font-bold text-violet-400">{columns.length}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden relative p-3">
                                        {viewMode === 'raw' && <DataGrid data={originalData} columns={Object.keys(originalData[0] || {})} readOnly={true} watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} onZoomChange={setIsZoomed} onRequestZoom={() => navigateTo('mainZoom')} />}
                                        {viewMode === 'grid' && <DataGrid data={data} columns={columns} onUpdate={handleCellUpdate} watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} onZoomChange={setIsZoomed} onRequestZoom={() => navigateTo('mainZoom')} />}
                                        {viewMode === 'insight' && <InsightStudio data={data} columns={columns} colTypes={colTypes} />}
                                        <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500 text-sm">로딩 중...</div>}>
                                            {viewMode === 'pivot' && <PivotTable data={data} columns={columns} colTypes={colTypes} watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} onZoomChange={setIsZoomed} onRequestZoom={() => navigateTo('mainZoom')} />}
                                            {viewMode === 'chart' && <ChartViewer data={data} columns={columns} watermarkEnabled={watermarkEnabled} watermarkText={watermarkText} watermarkDesign={watermarkDesign} onZoomChange={setIsZoomed} onRequestZoom={() => navigateTo('mainZoom')} />}
                                        </Suspense>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                </Suspense>

                <Suspense fallback={null}>
                    <CmdPalette
                        isOpen={cmdOpen}
                        onClose={() => setCmdOpen(false)}
                        actions={actions}
                        isDataReady={isDataReady}
                        columns={columns}
                        colTypes={colTypes}
                        previewData={data.slice(0, 5)}
                    />
                </Suspense>
            </div>
        </div>
    );
}

export default App;