# GP 포트폴리오 전자북 (Next.js 14)

병원 간판 전문 업체 GP의 포트폴리오 전자북 사이트입니다. Next.js 14(App Router) + TypeScript + Tailwind CSS 기반으로 제작되었으며, Notion Database를 콘텐츠 소스로 사용합니다.

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- @notionhq/client (Notion SDK)
- react-notion-x (선택, 필요 시 확장)
- Framer Motion (선택, 기본 애니메이션은 CSS로 처리)
- React Hook Form (문의 폼)
- Lucide React (아이콘)

## 폴더 구조
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx
│   └── portfolio/
│       ├── page.tsx
│       ├── loading.tsx
│       └── [id]/
│           ├── page.tsx
│           └── loading.tsx
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PortfolioCard.tsx
│   ├── Lightbox.tsx
│   └── ContactForm.tsx
├── lib/
│   ├── notion.ts
│   └── types.ts
└── app/globals.css
```

## Notion 데이터베이스 설정
- 데이터베이스 필드(속성) 이름은 아래를 사용하세요.
  1) 병원명 (Title)
  2) 위치 (Rich text)
  3) 간판종류 (Select) – LED채널, 아크릴, 네온, 복합, 기타
  4) 시공완료 (Date)
  5) 메인이미지 (Files & media)
  6) 추가이미지 (Files & media)
  7) 설명 (Rich text)
  8) 노출여부 (Checkbox)
  9) 작성일 (Created time)
- 공개 웹사이트에서 접근 가능하도록 Notion Integration에 데이터베이스를 연결하고 권한을 부여하세요.

## API 키 발급 방법
1. Notion Developers에서 Integration 생성
2. Internal Integration Token 발급
3. 대상 데이터베이스에 Integration 공유(Share) → 데이터 읽기 권한 부여

## 환경변수 설정
`.env.local` 파일을 프로젝트 루트에 생성하고 아래 값을 설정하세요.
```
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id
SITE_URL=http://localhost:3000
SITE_NAME=GP
SITE_DESCRIPTION=병원 간판의 새로운 기준 – GP 포트폴리오
```
참고: 예시는 `.env.example`에 포함되어 있습니다.

## 개발 서버 실행
```bash
npm install
npm run dev
```
- 브라우저에서 http://localhost:3000 접속

## 빌드 및 배포 (Vercel)
1) GitHub 저장소에 푸시
2) Vercel에서 새 프로젝트로 Import
3) Environment Variables에 위 환경변수 추가
4) Deploy

## 기능 요약
- ISR(Incremental Static Regeneration) 재검증 60초
- Notion Database 연동: 노출여부=체크, 작성일 최신순
- 필터 탭: 전체/LED채널/아크릴/네온/복합/기타
- 반응형 그리드(모바일 1열, 태블릿 2열, PC 3열)
- 이미지 최적화: Next/Image + Blur placeholder
- 라이트박스: 전체화면, 좌우 화살표, ESC 닫기, 배경 클릭 닫기
- 접근성: alt 텍스트, 시맨틱 마크업

## 주의사항
- 실제 운영에서는 API 키를 Git에 절대 커밋하지 마세요.
- Notion 파일 URL은 Notion의 CDN 서명 URL로 유효기간이 있으므로, 정기적으로 ISR/재요청을 통해 최신 URL을 사용합니다.
