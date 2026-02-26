# VaultSheet (볼트시트) - 직장인을 위한 마법의 금고

데이터 분석과 보안을 한 번에! 하이브리드 아키텍처 기반의 강력한 데이터 분석 플랫폼입니다.

## 아키텍처 개요

- **Frontend (React + WASM)**: 무거운 CSV 파일 파싱과 SQL 연산은 사용자의 브라우저에서 무료로 처리
- **Backend (Node.js)**: 회원가입, 대시보드 저장, 결과 화면 공유 (바이럴 URL 생성) 담당

## 프로젝트 구조

```
insightnode-workspace/
├── backend/                  # Node.js 백엔드
│   ├── server.js             # Express 서버
│   └── package.json
└── frontend/                 # React 프론트엔드
    ├── src/
    │   ├── App.jsx           # 메인 앱
    │   ├── components/       # UI 컴포넌트
    │   │   ├── DataGrid.jsx
    │   │   ├── ChartViewer.jsx
    │   │   └── CmdPalette.jsx
    │   └── utils/
    │       ├── sqlEngine.js   # WASM SQL 엔진
    │       └── Icons.jsx
    └── package.json
```

## 시작하기

### 1. Backend 실행

```bash
cd backend
npm install
npm start
```
-backend는 http://localhost:5000 에서 실행됩니다.

### 2. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```
- 프론트엔드는 http://localhost:3000 에서 실행됩니다.

## 주요 기능

### 데이터 처리 (WASM)
- CSV/JSON 파일 파싱
- 클라이언트 사이드 SQL 연산
- 데이터 타입 자동 감지
- 인라인 셀 편집

### 매직 도구함 (Ctrl+K)
- 결측치/중복 데이터 제거
- 텍스트 변환 (대소문자, 트림)
- 숫자 처리 (반올림, 정규화)
- 날짜 처리 (연도/요일 추출)
- 보안 (마스킹)
- 무작위 데이터 생성
- 이상치 제거

### 시각화
- 데이터 그리드 뷰
- Chart.js 차트 (Bar, Line, Pie, Doughnut)
- 피벗/그룹화

### 바이럴 공유
- 대시보드 설정 저장
- 고유 공유 URL 생성

## 기술 스택

- **Frontend**: React 18, Vite, TailwindCSS
- **Data Processing**: sql.js (WASM), PapaParse
- **Visualization**: Chart.js
- **Backend**: Node.js, Express, UUID
