# 팀 업무용 AI 챗봇 — 설계 문서

**작성일**: 2026-05-22  
**저장소**: https://github.com/hongikjun11/team-ai-chatbot  
**배포**: GitHub → Vercel 자동 배포

---

## 1. 프로젝트 개요

사내 부서 전용 AI 챗봇 웹 애플리케이션. 기존 OpenAI GPTs로 운영하던 DB 반출입 관리 챗봇의 한계(대화방 전환 시 엑셀 파일 초기화 문제)를 해결하고, 기능을 확장한다.

**핵심 해결 과제**: GPTs에서는 대화방이 바뀌면 master 엑셀 파일이 초기화되어 사용자가 매번 수동으로 재업로드해야 했음. 웹앱 + Vercel Blob으로 파일을 영구 저장하여 이 문제를 완전히 해결.

---

## 2. 기능 구성 (탭 3개)

### 탭 1 — 설계 DB 반출입 관리

보안 담당자가 설계 DB 반출입 이력을 기록하는 챗봇.

**입력 항목**:
| 필드 | 설명 |
|------|------|
| 신청일자 | YYYY.MM.DD 형식 |
| 신청자 | 이름 + 직급 |
| 반입/반출 | 반입이면 반입 열에 O, 반출이면 반출 열에 O |
| 파일명 | DB 파일명 |
| 용도 | DB 출발지 |
| 반입반출 대상 | DB 도착지 |
| 보안담당자 확인 | 수행자 이름 |

**동작**:
- AI가 입력 폼을 대화로 수집
- Vercel Blob에서 `db-master.xlsx` 읽기
- 마지막 실제 데이터 행 탐색 (max_row 단독 사용 금지)
- Cell(row, col) 방식으로 신규 행 직접 입력 (append() 금지)
- 저장 후 재오픈 검증 수행
- 저장된 파일 다운로드 링크 제공
- 리포트 생성 요청 시: 별도 리포트 파일 생성 (master 파일과 분리 유지)

**master 파일**: `db-master.xlsx`

---

### 탭 2 — 대용량 메일 파일 반출 관리

관리자(보안담당자)가 그룹웨어 Outlook에서 대용량 파일 첨부 링크를 생성해준 이력을 기록하는 챗봇.

**워크플로우**:
```
직원이 대용량 파일 발송 신청
        ↓
관리자가 그룹웨어에서 파일 첨부 링크 생성
        ↓
챗봇에 이력 입력 → master 엑셀 자동 저장
```

**입력 항목**:
| 필드 | 설명 |
|------|------|
| 신청일자 | YYYY.MM.DD 형식 |
| 신청자 | 이름 + 직급 |
| 부서 | 소속 부서명 |
| 파일명 | 파일명 + 용량(MB/GB), 복수 파일 가능 |
| 보안담당자 확인 | 수행자 이름 |
| 비고 | 선택 입력 |

**자동 고정값**: 용도 = "OutLook 첨부" (모든 경우 동일하므로 사용자 입력 없이 자동 기록)

**동작**: DB 반출입 관리와 동일한 엑셀 저장 규칙 적용

**master 파일**: `mail-master.xlsx`

---

### 탭 3 — 사내 Q&A

업로드된 사내 문서를 기반으로 질의응답하는 챗봇.

**지원 문서 형식**: PDF, Word(.docx), Excel(.xlsx)

**동작**:
- 관리자가 문서를 Vercel Blob(`qna-docs/`)에 업로드
- 질문 수신 시 Blob에서 문서 텍스트 추출
- Gemini 1.5 Flash 컨텍스트에 문서 내용 삽입하여 답변 생성
- 초기에는 RAG 없이 전체 문서를 컨텍스트에 삽입 (Gemini 100만 토큰 활용)

---

## 3. 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| AI | Google Gemini 1.5 Flash API (무료 티어) |
| 파일 영구 저장 | Vercel Blob (무료 500MB) |
| 엑셀 처리 | `exceljs` — Cell 단위 직접 입력 |
| PDF 파싱 | `pdf-parse` |
| Word 파싱 | `mammoth` |
| 스타일 | Tailwind CSS |
| 인증 | Next.js Middleware 비밀번호 게이트 (단일 공유 비밀번호) |
| 배포 | GitHub → Vercel 자동 배포 |

---

## 4. 파일 구조 (Vercel 배포 기준)

```
team-ai-chatbot/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 메인 페이지 (탭 3개 포함)
│   ├── globals.css
│   └── api/
│       ├── chat/
│       │   └── route.ts            # Gemini 호출 (type: 'db' | 'mail' | 'qna')
│       ├── excel/
│       │   ├── read/route.ts       # Blob → 엑셀 읽기
│       │   ├── write/route.ts      # 엑셀 수정 → Blob 저장
│       │   └── download/route.ts   # 최신 master 파일 다운로드
│       └── documents/
│           └── upload/route.ts     # Q&A 문서 업로드
├── components/
│   ├── ChatWindow.tsx              # 공통 채팅 UI
│   ├── TabBar.tsx                  # 탭 전환
│   ├── PasswordGate.tsx            # 비밀번호 인증
│   ├── MessageBubble.tsx
│   └── FileDownloadButton.tsx      # master 파일 다운로드 버튼
├── lib/
│   ├── gemini.ts                   # Gemini 클라이언트
│   ├── excel.ts                    # exceljs 읽기/쓰기 로직
│   ├── documents.ts                # PDF·Word 텍스트 추출
│   └── prompts/
│       ├── db-management.ts        # DB 반출입 시스템 프롬프트
│       ├── mail-export.ts          # 대용량 메일 반출 시스템 프롬프트
│       └── qna.ts                  # Q&A 시스템 프롬프트
├── .env.local                      # 로컬 환경변수 (gitignore)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 5. Vercel Blob 저장 구조

```
Vercel Blob
├── db-master.xlsx          ← DB 반출입 master (항상 최신 유지)
├── mail-master.xlsx        ← 대용량 메일 반출 master (항상 최신 유지)
└── qna-docs/
    ├── doc1.pdf
    ├── doc2.docx
    └── doc3.xlsx
```

---

## 6. 환경변수

```
GEMINI_API_KEY=...           # Google AI Studio에서 발급
BLOB_READ_WRITE_TOKEN=...    # Vercel Blob 토큰
SITE_PASSWORD=...            # 사이트 접근 비밀번호
```

---

## 7. 엑셀 저장 핵심 규칙 (GPTs 지침 계승)

1. 항상 최신 master 파일 기준으로 수정
2. 기존 데이터 삭제 금지
3. `append()` 사용 금지 — `Cell(row, col)` 방식으로 직접 입력
4. `max_row`만 단독 신뢰 금지 — 실제 셀 데이터 검사로 마지막 행 탐색
5. 저장 후 재오픈 검증 필수
6. 리포트 파일을 master 파일로 사용 금지
7. 다운로드 링크를 사용자에게 반드시 제공

---

## 8. 향후 확장 계획

- 탭 추가만으로 새 업무 챗봇 확장 가능한 구조
- 우선 추가 예정: 추가 보안 관리 대장류
- Q&A 문서량 증가 시 벡터 검색(RAG) 도입 검토
