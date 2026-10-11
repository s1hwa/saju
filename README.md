# 인생 흐름 주기

saju - life flow graphs

기존 Excel 통합문서의 첫 번째 시트를 기준으로 만든 오프라인 Windows 상담 프로그램입니다.

## 개발 실행

```powershell
npm install
npm run dev
```

개발 서버 기본 주소는 `http://127.0.0.1:5173`입니다.

## 검증

```powershell
npm test
npm run typecheck
npm run build
```

## Windows 설치 파일

```powershell
npm run dist
```

완성된 설치 파일은 `release` 폴더에 생성됩니다.

Excel 분석 근거는 `docs/excel-analysis.md`, 구현 판단은 `docs/decision-log.md`에 기록되어 있습니다.
