# Team AI Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 14 웹앱으로 사내 부서 전용 AI 챗봇 구현 — DB 반출입 관리, 대용량 메일 파일 반출 관리, 사내 Q&A 총 3개 탭.

**Architecture:** 단일 Next.js 앱(App Router)에 탭 3개 구성. 각 탭은 공통 ChatWindow 컴포넌트를 사용하며 `/api/chat` 라우트가 `type` 파라미터(db|mail|qna)로 분기 처리. 엑셀 master 파일은 Vercel Blob에 영구 저장하여 GPTs의 대화방 초기화 문제 해결.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Google Gemini 1.5 Flash API (`@google/generative-ai`), Vercel Blob (`@vercel/blob`), exceljs, pdf-parse, mammoth, Jest + Testing Library

---

## File Map

| 파일 | 역할 |
|------|------|
| `app/page.tsx` | 메인 페이지 (탭 상태 관리) |
| `app/layout.tsx` | 루트 레이아웃 |
| `app/globals.css` | 전역 스타일 |
| `app/api/chat/route.ts` | Gemini 호출 — type: db\|mail\|qna |
| `app/api/excel/read/route.ts` | Blob → 엑셀 읽기 |
| `app/api/excel/write/route.ts` | 엑셀 수정 → Blob 저장 |
| `app/api/excel/download/route.ts` | master 파일 다운로드 링크 |
| `app/api/documents/upload/route.ts` | Q&A 문서 업로드 |
| `components/PasswordGate.tsx` | 비밀번호 인증 화면 |
| `components/TabBar.tsx` | 탭 전환 |
| `components/ChatWindow.tsx` | 공통 채팅 UI |
| `components/MessageBubble.tsx` | 메시지 말풍선 |
| `components/FileDownloadButton.tsx` | master 파일 다운로드 버튼 |
| `lib/gemini.ts` | Gemini 클라이언트 |
| `lib/blob.ts` | Vercel Blob 헬퍼 |
| `lib/excel.ts` | exceljs 읽기/쓰기 로직 |
| `lib/documents.ts` | PDF·Word·Excel 텍스트 추출 |
| `lib/prompts/db-management.ts` | DB 반출입 시스템 프롬프트 |
| `lib/prompts/mail-export.ts` | 대용량 메일 반출 시스템 프롬프트 |
| `lib/prompts/qna.ts` | Q&A 시스템 프롬프트 |
| `middleware.ts` | 비밀번호 게이트 미들웨어 |
| `__tests__/lib/excel.test.ts` | 엑셀 유닛 테스트 |
| `__tests__/lib/documents.test.ts` | 문서 파싱 유닛 테스트 |
| `__tests__/components/TabBar.test.tsx` | TabBar 컴포넌트 테스트 |

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- Create: `.env.local`, `.gitignore`
- Create: `jest.config.ts`, `jest.setup.ts`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd "C:\Users\홍익준\Desktop\클로드\team-ai-chatbot"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Next.js 14 프로젝트 파일들 생성됨

- [ ] **Step 2: 의존성 설치**

```bash
npm install @google/generative-ai @vercel/blob exceljs pdf-parse mammoth
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest @types/pdf-parse @types/mammoth ts-jest
```

- [ ] **Step 3: Jest 설정**

`jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

`jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: 환경변수 파일 생성**

`.env.local`:
```
GEMINI_API_KEY=your_api_key_here
BLOB_READ_WRITE_TOKEN=your_blob_token_here
SITE_PASSWORD=your_password_here
```

`.env.local`을 `.gitignore`에 추가 확인 (create-next-app이 자동 추가함)

- [ ] **Step 5: 동작 확인**

```bash
npm run dev
```

Expected: http://localhost:3000 에서 Next.js 기본 페이지 로드

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with dependencies"
```

---

## Task 2: 비밀번호 미들웨어

**Files:**
- Create: `middleware.ts`
- Create: `components/PasswordGate.tsx`
- Create: `__tests__/components/PasswordGate.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/components/PasswordGate.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import PasswordGate from '@/components/PasswordGate'

describe('PasswordGate', () => {
  it('renders password input', () => {
    render(<PasswordGate onSuccess={jest.fn()} />)
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument()
  })

  it('calls onSuccess when correct password submitted', () => {
    const onSuccess = jest.fn()
    render(<PasswordGate onSuccess={onSuccess} />)
    fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
      target: { value: 'test123' },
    })
    fireEvent.click(screen.getByRole('button', { name: '입장' }))
    expect(onSuccess).toHaveBeenCalledWith('test123')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/components/PasswordGate.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/PasswordGate'"

- [ ] **Step 3: PasswordGate 컴포넌트 구현**

`components/PasswordGate.tsx`:
```typescript
'use client'
import { useState } from 'react'

interface Props {
  onSuccess: (password: string) => void
}

export default function PasswordGate({ onSuccess }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSuccess(value.trim())
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          부서 AI 챗봇
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false) }}
            placeholder="비밀번호를 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm">비밀번호를 입력해주세요</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            입장
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 미들웨어 구현**

`middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // API 라우트는 미들웨어 제외
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const password = request.cookies.get('site-password')?.value
  const sitePassword = process.env.SITE_PASSWORD

  if (password === sitePassword) {
    return NextResponse.next()
  }

  // 비밀번호 없으면 홈으로 (page.tsx에서 PasswordGate 렌더링)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npx jest __tests__/components/PasswordGate.test.tsx
```

Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add middleware.ts components/PasswordGate.tsx __tests__/components/PasswordGate.test.tsx
git commit -m "feat: add password gate component and middleware"
```

---

## Task 3: 탭바 + 메인 레이아웃

**Files:**
- Create: `components/TabBar.tsx`
- Modify: `app/page.tsx`
- Create: `__tests__/components/TabBar.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/components/TabBar.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import TabBar from '@/components/TabBar'

const tabs = [
  { id: 'db', label: '설계 DB 반출입 관리' },
  { id: 'mail', label: '대용량 메일 파일 반출' },
  { id: 'qna', label: '사내 Q&A' },
]

describe('TabBar', () => {
  it('renders all 3 tabs', () => {
    render(<TabBar tabs={tabs} activeTab="db" onTabChange={jest.fn()} />)
    expect(screen.getByText('설계 DB 반출입 관리')).toBeInTheDocument()
    expect(screen.getByText('대용량 메일 파일 반출')).toBeInTheDocument()
    expect(screen.getByText('사내 Q&A')).toBeInTheDocument()
  })

  it('calls onTabChange when tab clicked', () => {
    const onTabChange = jest.fn()
    render(<TabBar tabs={tabs} activeTab="db" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByText('사내 Q&A'))
    expect(onTabChange).toHaveBeenCalledWith('qna')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/components/TabBar.test.tsx
```

Expected: FAIL

- [ ] **Step 3: TabBar 구현**

`components/TabBar.tsx`:
```typescript
'use client'

interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
}

export default function TabBar({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 메인 페이지 구현**

`app/page.tsx`:
```typescript
'use client'
import { useState, useEffect } from 'react'
import PasswordGate from '@/components/PasswordGate'
import TabBar from '@/components/TabBar'

const TABS = [
  { id: 'db', label: '설계 DB 반출입 관리' },
  { id: 'mail', label: '대용량 메일 파일 반출' },
  { id: 'qna', label: '사내 Q&A' },
]

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('db')

  const handlePasswordSubmit = async (password: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthenticated(true)
    } else {
      alert('비밀번호가 틀렸습니다')
    }
  }

  if (!authenticated) {
    return <PasswordGate onSuccess={handlePasswordSubmit} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-800">부서 AI 챗봇</h1>
      </header>
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-4">
        {/* 탭 컨텐츠는 Task 8, 10, 14에서 추가 */}
        <div className="text-gray-400 text-center mt-20">
          {activeTab === 'db' && <p>DB 반출입 관리 챗봇 (구현 예정)</p>}
          {activeTab === 'mail' && <p>대용량 메일 파일 반출 (구현 예정)</p>}
          {activeTab === 'qna' && <p>사내 Q&A (구현 예정)</p>}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 5: 인증 API 라우트 추가**

`app/api/auth/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password === process.env.SITE_PASSWORD) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('site-password', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8시간
    })
    return response
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npx jest __tests__/components/TabBar.test.tsx
```

Expected: PASS

- [ ] **Step 7: 브라우저 확인**

```bash
npm run dev
```

http://localhost:3000 → 비밀번호 화면 → 입장 후 탭 3개 표시 확인

- [ ] **Step 8: 커밋**

```bash
git add app/page.tsx app/api/auth/route.ts components/TabBar.tsx __tests__/components/TabBar.test.tsx
git commit -m "feat: add tab bar and main layout with password auth"
```

---

## Task 4: 채팅 UI 컴포넌트

**Files:**
- Create: `components/MessageBubble.tsx`
- Create: `components/ChatWindow.tsx`
- Create: `components/FileDownloadButton.tsx`

- [ ] **Step 1: MessageBubble 구현**

`components/MessageBubble.tsx`:
```typescript
interface Props {
  role: 'user' | 'assistant'
  content: string
}

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: FileDownloadButton 구현**

`components/FileDownloadButton.tsx`:
```typescript
'use client'
import { useState } from 'react'

interface Props {
  type: 'db' | 'mail'
  label: string
}

export default function FileDownloadButton({ type, label }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/excel/download?type=${type}`)
      if (!res.ok) throw new Error('다운로드 실패')
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch {
      alert('파일 다운로드에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
    >
      📥 {loading ? '준비 중...' : label}
    </button>
  )
}
```

- [ ] **Step 3: ChatWindow 구현**

`components/ChatWindow.tsx`:
```typescript
'use client'
import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import FileDownloadButton from './FileDownloadButton'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  type: 'db' | 'mail' | 'qna'
  placeholder?: string
  showDownload?: boolean
  downloadType?: 'db' | 'mail'
  downloadLabel?: string
  extraUI?: React.ReactNode
}

export default function ChatWindow({
  type,
  placeholder = '메시지를 입력하세요...',
  showDownload = false,
  downloadType,
  downloadLabel,
  extraUI,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, messages: [...messages, userMessage] }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200">
      {(showDownload || extraUI) && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          {showDownload && downloadType && downloadLabel && (
            <FileDownloadButton type={downloadType} label={downloadLabel} />
          )}
          {extraUI}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            메시지를 입력하여 시작하세요
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2">
              <span className="text-gray-400 text-sm">입력 중...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          전송
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add components/MessageBubble.tsx components/ChatWindow.tsx components/FileDownloadButton.tsx
git commit -m "feat: add chat UI components"
```

---

## Task 5: Gemini 클라이언트

**Files:**
- Create: `lib/gemini.ts`

- [ ] **Step 1: Gemini 클라이언트 구현**

`lib/gemini.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function generateReply(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const model = getGeminiModel()

  // Gemini는 system instruction + history + 마지막 user 메시지 구조 사용
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))

  const lastMessage = messages[messages.length - 1].content

  const chat = model.startChat({
    systemInstruction: systemPrompt,
    history,
  })

  const result = await chat.sendMessage(lastMessage)
  return result.response.text()
}
```

- [ ] **Step 2: 동작 확인 (API 키 필요)**

```bash
# .env.local에 실제 GEMINI_API_KEY 입력 후
npm run dev
```

- [ ] **Step 3: 커밋**

```bash
git add lib/gemini.ts
git commit -m "feat: add Gemini client"
```

---

## Task 6: Vercel Blob 헬퍼

**Files:**
- Create: `lib/blob.ts`

- [ ] **Step 1: Blob 헬퍼 구현**

`lib/blob.ts`:
```typescript
import { put, get, list } from '@vercel/blob'

export type BlobTarget = 'db' | 'mail'

const MASTER_KEYS: Record<BlobTarget, string> = {
  db: 'db-master.xlsx',
  mail: 'mail-master.xlsx',
}

export async function getMasterBuffer(target: BlobTarget): Promise<Buffer | null> {
  const { blobs } = await list({ prefix: MASTER_KEYS[target] })
  if (blobs.length === 0) return null

  const blob = blobs[0]
  const res = await fetch(blob.url)
  return Buffer.from(await res.arrayBuffer())
}

export async function saveMasterBuffer(target: BlobTarget, buffer: Buffer): Promise<string> {
  const { url } = await put(MASTER_KEYS[target], buffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return url
}

export async function uploadQnaDocument(filename: string, buffer: Buffer): Promise<string> {
  const { url } = await put(`qna-docs/${filename}`, buffer, {
    access: 'public',
    allowOverwrite: true,
  })
  return url
}

export async function listQnaDocs(): Promise<string[]> {
  const { blobs } = await list({ prefix: 'qna-docs/' })
  return blobs.map((b) => b.url)
}

export async function getMasterUrl(target: BlobTarget): Promise<string | null> {
  const { blobs } = await list({ prefix: MASTER_KEYS[target] })
  if (blobs.length === 0) return null
  return blobs[0].url
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/blob.ts
git commit -m "feat: add Vercel Blob helpers"
```

---

## Task 7: 엑셀 읽기/쓰기 라이브러리

**Files:**
- Create: `lib/excel.ts`
- Create: `__tests__/lib/excel.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/excel.test.ts`:
```typescript
import { createEmptyDbWorkbook, findLastDataRow, appendRowToSheet, serializeWorkbook } from '@/lib/excel'
import ExcelJS from 'exceljs'

describe('excel lib', () => {
  it('creates empty db workbook with correct headers', async () => {
    const wb = createEmptyDbWorkbook()
    const ws = wb.getWorksheet(1)!
    expect(ws.getCell('A1').value).toBe('신청일자')
    expect(ws.getCell('B1').value).toBe('신청자')
  })

  it('findLastDataRow returns 1 for header-only sheet', async () => {
    const wb = createEmptyDbWorkbook()
    const ws = wb.getWorksheet(1)!
    const last = findLastDataRow(ws, 8)
    expect(last).toBe(1)
  })

  it('appendRowToSheet adds row after last data row', async () => {
    const wb = createEmptyDbWorkbook()
    const ws = wb.getWorksheet(1)!
    const data = ['2026.05.22', '홍익준', 'O', '', 'test.db', '설계팀', '개발팀', '홍익준']
    appendRowToSheet(ws, data, 8)
    const last = findLastDataRow(ws, 8)
    expect(last).toBe(2)
    expect(ws.getCell('A2').value).toBe('2026.05.22')
  })

  it('serializeWorkbook returns Buffer', async () => {
    const wb = createEmptyDbWorkbook()
    const buf = await serializeWorkbook(wb)
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/lib/excel.test.ts
```

Expected: FAIL

- [ ] **Step 3: 엑셀 라이브러리 구현**

`lib/excel.ts`:
```typescript
import ExcelJS from 'exceljs'

// DB 반출입 헤더
const DB_HEADERS = ['신청일자', '신청자', '반입', '반출', '파일명', '용도(DB 출발지)', '반입반출 대상(DB 도착지)', '보안담당자 확인']

// 대용량 메일 반출 헤더
const MAIL_HEADERS = ['신청일자', '신청자', '부서', '반출', '파일명', '용도', '보안담당자 확인', '비고']

export function createEmptyDbWorkbook(): ExcelJS.Workbook {
  return createWorkbookWithHeaders(DB_HEADERS)
}

export function createEmptyMailWorkbook(): ExcelJS.Workbook {
  return createWorkbookWithHeaders(MAIL_HEADERS)
}

function createWorkbookWithHeaders(headers: string[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1')
  headers.forEach((h, i) => {
    ws.getCell(1, i + 1).value = h
  })
  return wb
}

export function findLastDataRow(ws: ExcelJS.Worksheet, colCount: number): number {
  let lastRow = 0
  ws.eachRow((row, rowNumber) => {
    const values = Array.from({ length: colCount }, (_, i) => row.getCell(i + 1).value)
    if (values.some((v) => v !== null && v !== '')) {
      lastRow = rowNumber
    }
  })
  return lastRow
}

export function appendRowToSheet(
  ws: ExcelJS.Worksheet,
  data: (string | null)[],
  colCount: number
): number {
  const lastRow = findLastDataRow(ws, colCount)
  const targetRow = lastRow + 1
  data.forEach((value, i) => {
    ws.getCell(targetRow, i + 1).value = value ?? ''
  })
  return targetRow
}

export async function serializeWorkbook(wb: ExcelJS.Workbook): Promise<Buffer> {
  const arrayBuffer = await wb.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

export async function loadWorkbookFromBuffer(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  return wb
}

export function verifyLastRow(
  ws: ExcelJS.Worksheet,
  expectedRow: number,
  colCount: number
): boolean {
  const actual = findLastDataRow(ws, colCount)
  return actual >= expectedRow
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/excel.test.ts
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/excel.ts __tests__/lib/excel.test.ts
git commit -m "feat: add Excel read/write library with tests"
```

---

## Task 8: 엑셀 API 라우트

**Files:**
- Create: `app/api/excel/read/route.ts`
- Create: `app/api/excel/write/route.ts`
- Create: `app/api/excel/download/route.ts`

- [ ] **Step 1: 읽기 라우트**

`app/api/excel/read/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMasterBuffer } from '@/lib/blob'
import { loadWorkbookFromBuffer, findLastDataRow } from '@/lib/excel'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as 'db' | 'mail'
  if (!type || !['db', 'mail'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const buffer = await getMasterBuffer(type)
  if (!buffer) {
    return NextResponse.json({ exists: false, rows: [] })
  }

  const wb = await loadWorkbookFromBuffer(buffer)
  const ws = wb.getWorksheet(1)!
  const colCount = type === 'db' ? 8 : 8
  const lastRow = findLastDataRow(ws, colCount)

  const rows: string[][] = []
  for (let r = 2; r <= lastRow; r++) {
    const row = Array.from({ length: colCount }, (_, i) =>
      String(ws.getCell(r, i + 1).value ?? '')
    )
    rows.push(row)
  }

  return NextResponse.json({ exists: true, rows })
}
```

- [ ] **Step 2: 쓰기 라우트**

`app/api/excel/write/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMasterBuffer, saveMasterBuffer } from '@/lib/blob'
import {
  loadWorkbookFromBuffer,
  createEmptyDbWorkbook,
  createEmptyMailWorkbook,
  appendRowToSheet,
  serializeWorkbook,
  verifyLastRow,
} from '@/lib/excel'

export async function POST(request: NextRequest) {
  const { type, data } = await request.json() as {
    type: 'db' | 'mail'
    data: string[]
  }

  if (!type || !data || !Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // 기존 master 파일 로드 (없으면 신규 생성)
  const existingBuffer = await getMasterBuffer(type)
  const wb = existingBuffer
    ? await loadWorkbookFromBuffer(existingBuffer)
    : type === 'db'
    ? createEmptyDbWorkbook()
    : createEmptyMailWorkbook()

  const ws = wb.getWorksheet(1)!
  const colCount = 8
  const targetRow = appendRowToSheet(ws, data, colCount)

  // 저장
  const newBuffer = await serializeWorkbook(wb)
  const url = await saveMasterBuffer(type, newBuffer)

  // 검증: 저장된 파일 재오픈
  const verifyWb = await loadWorkbookFromBuffer(newBuffer)
  const verifyWs = verifyWb.getWorksheet(1)!
  const verified = verifyLastRow(verifyWs, targetRow, colCount)

  if (!verified) {
    return NextResponse.json({ error: '저장 검증 실패' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, row: targetRow, url })
}
```

- [ ] **Step 3: 다운로드 라우트**

`app/api/excel/download/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMasterUrl } from '@/lib/blob'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as 'db' | 'mail'
  if (!type || !['db', 'mail'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const url = await getMasterUrl(type)
  if (!url) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 404 })
  }

  return NextResponse.json({ url })
}
```

- [ ] **Step 4: 커밋**

```bash
git add app/api/excel/
git commit -m "feat: add Excel read/write/download API routes"
```

---

## Task 9: DB 반출입 시스템 프롬프트 + 채팅 API

**Files:**
- Create: `lib/prompts/db-management.ts`
- Create: `lib/prompts/mail-export.ts`
- Create: `lib/prompts/qna.ts`
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: DB 반출입 시스템 프롬프트**

`lib/prompts/db-management.ts`:
```typescript
export const DB_MANAGEMENT_PROMPT = `
너는 설계 DB 반출입 관리 담당자이며, DB 반출입 이력을 정확하게 기록하고 관리하는 전문 시스템이다.

# 기본 원칙
1. 절대 임의로 답변을 지어내지 않는다.
2. 반드시 사용자 입력 데이터 기준으로만 처리한다.
3. 입력 정보가 부족하면 반드시 추가 정보를 요청한다.
4. 모든 데이터는 서버에 물리적으로 저장된다.

# 입력 폼
사용자로부터 아래 형식으로 입력 받는다:
- 신청일자 (YYYY.MM.DD)
- 신청자 (이름 + 직급)
- 구분: 반입 또는 반출
- 파일명
- 용도 (DB 출발지)
- 반입반출 대상 (DB 도착지)
- 보안담당자 확인 (수행자 이름)

항상 입력 폼을 사용자에게 먼저 보여준 뒤 입력을 받아라.

# 데이터 저장
입력이 완료되면 다음 형식의 JSON을 반드시 응답 마지막에 포함하라:
\`\`\`json
{"action":"save_db","data":["신청일자","신청자","반입O or 빈칸","반출O or 빈칸","파일명","용도","대상","보안담당자"]}
\`\`\`

반입이면 index 2에 "O", index 3은 빈칸.
반출이면 index 2는 빈칸, index 3에 "O".

# 리포트
사용자가 리포트를 요청하면 현재까지 기록된 데이터를 표 형태로 보여준다.
리포트용 별도 파일이 필요하면 \`{"action":"report_db"}\` 를 응답에 포함한다.
`.trim()
```

- [ ] **Step 2: 대용량 메일 반출 시스템 프롬프트**

`lib/prompts/mail-export.ts`:
```typescript
export const MAIL_EXPORT_PROMPT = `
너는 대용량 메일 파일 반출 관리 담당자이며, Outlook 대용량 첨부파일 반출 이력을 정확하게 기록하고 관리하는 전문 시스템이다.

# 기본 원칙
1. 절대 임의로 답변을 지어내지 않는다.
2. 반드시 사용자 입력 데이터 기준으로만 처리한다.
3. 입력 정보가 부족하면 반드시 추가 정보를 요청한다.

# 입력 폼
사용자로부터 아래 형식으로 입력 받는다:
- 신청일자 (YYYY.MM.DD)
- 신청자 (이름 + 직급)
- 부서
- 파일명 (파일명과 용량(MB/GB) 함께. 복수 파일 가능)
- 보안담당자 확인 (수행자 이름)
- 비고 (선택사항)

항상 입력 폼을 사용자에게 먼저 보여준 뒤 입력을 받아라.
용도는 항상 "OutLook 첨부"로 자동 기록된다. 사용자에게 묻지 않는다.

# 데이터 저장
입력이 완료되면 다음 형식의 JSON을 반드시 응답 마지막에 포함하라:
\`\`\`json
{"action":"save_mail","data":["신청일자","신청자","부서","O","파일명","OutLook 첨부","보안담당자","비고"]}
\`\`\`

반출 구분(index 3)은 항상 "O".
`.trim()
```

- [ ] **Step 3: Q&A 시스템 프롬프트**

`lib/prompts/qna.ts`:
```typescript
export function buildQnaPrompt(documentContents: string[]): string {
  const docsText = documentContents.length > 0
    ? documentContents.join('\n\n---\n\n')
    : '(업로드된 문서 없음)'

  return `
너는 사내 Q&A 전문 어시스턴트다. 아래 사내 문서들을 기반으로 질문에 답변한다.

# 원칙
1. 반드시 아래 제공된 문서 내용을 기반으로만 답변한다.
2. 문서에 없는 내용은 "해당 문서에서 찾을 수 없습니다"라고 답한다.
3. 출처 문서를 가능한 한 언급한다.

# 사내 문서 내용
${docsText}
`.trim()
}
```

- [ ] **Step 4: 채팅 API 라우트**

`app/api/chat/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateReply, type ChatMessage } from '@/lib/gemini'
import { DB_MANAGEMENT_PROMPT } from '@/lib/prompts/db-management'
import { MAIL_EXPORT_PROMPT } from '@/lib/prompts/mail-export'
import { buildQnaPrompt } from '@/lib/prompts/qna'
import { listQnaDocs } from '@/lib/blob'
import { extractTextFromUrl } from '@/lib/documents'
import { getMasterBuffer, saveMasterBuffer } from '@/lib/blob'
import {
  loadWorkbookFromBuffer,
  createEmptyDbWorkbook,
  createEmptyMailWorkbook,
  appendRowToSheet,
  serializeWorkbook,
  verifyLastRow,
} from '@/lib/excel'

export async function POST(request: NextRequest) {
  const { type, messages } = await request.json() as {
    type: 'db' | 'mail' | 'qna'
    messages: ChatMessage[]
  }

  let systemPrompt: string
  if (type === 'db') {
    systemPrompt = DB_MANAGEMENT_PROMPT
  } else if (type === 'mail') {
    systemPrompt = MAIL_EXPORT_PROMPT
  } else {
    const docUrls = await listQnaDocs()
    const contents = await Promise.all(docUrls.map(extractTextFromUrl))
    systemPrompt = buildQnaPrompt(contents)
  }

  const reply = await generateReply(systemPrompt, messages)

  // DB/Mail: AI 응답에서 save action 파싱 후 엑셀 저장
  if (type === 'db' || type === 'mail') {
    const actionMatch = reply.match(/```json\s*(\{.*?\})\s*```/s)
    if (actionMatch) {
      try {
        const action = JSON.parse(actionMatch[1])
        if (
          (type === 'db' && action.action === 'save_db') ||
          (type === 'mail' && action.action === 'save_mail')
        ) {
          await saveExcelRow(type, action.data)
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }
  }

  return NextResponse.json({ reply })
}

async function saveExcelRow(type: 'db' | 'mail', data: string[]) {
  const existingBuffer = await getMasterBuffer(type)
  const wb = existingBuffer
    ? await loadWorkbookFromBuffer(existingBuffer)
    : type === 'db'
    ? createEmptyDbWorkbook()
    : createEmptyMailWorkbook()

  const ws = wb.getWorksheet(1)!
  const targetRow = appendRowToSheet(ws, data, 8)
  const newBuffer = await serializeWorkbook(wb)
  await saveMasterBuffer(type, newBuffer)

  // 검증
  const verifyWb = await loadWorkbookFromBuffer(newBuffer)
  const verifyWs = verifyWb.getWorksheet(1)!
  verifyLastRow(verifyWs, targetRow, 8)
}
```

- [ ] **Step 5: 커밋**

```bash
git add lib/prompts/ app/api/chat/
git commit -m "feat: add system prompts and chat API route"
```

---

## Task 10: 탭 컨텐츠 연결 (DB + Mail)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: page.tsx에 탭 컨텐츠 추가**

`app/page.tsx` 의 `<main>` 부분을 교체:
```typescript
import ChatWindow from '@/components/ChatWindow'

// ... (기존 import 유지)

// main 부분:
<main className="flex-1 p-4 max-w-4xl mx-auto w-full">
  {activeTab === 'db' && (
    <ChatWindow
      type="db"
      placeholder="반출입 정보를 입력하거나 질문하세요..."
      showDownload
      downloadType="db"
      downloadLabel="DB 반출입 대장 다운로드"
    />
  )}
  {activeTab === 'mail' && (
    <ChatWindow
      type="mail"
      placeholder="메일 반출 정보를 입력하거나 질문하세요..."
      showDownload
      downloadType="mail"
      downloadLabel="메일 반출 대장 다운로드"
    />
  )}
  {activeTab === 'qna' && (
    <ChatWindow
      type="qna"
      placeholder="궁금한 점을 질문하세요..."
    />
  )}
</main>
```

- [ ] **Step 2: 브라우저에서 DB 반출입 탭 동작 확인**

```bash
npm run dev
```

1. 비밀번호 입력 후 입장
2. "설계 DB 반출입 관리" 탭 클릭
3. 메시지 입력 → AI가 입력 폼 안내 확인
4. 데이터 입력 → 저장 확인
5. "DB 반출입 대장 다운로드" 버튼 → 파일 다운로드 확인

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: wire up DB and Mail chat tabs"
```

---

## Task 11: 문서 파싱 라이브러리

**Files:**
- Create: `lib/documents.ts`
- Create: `__tests__/lib/documents.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/documents.test.ts`:
```typescript
import { extractTextFromBuffer } from '@/lib/documents'

describe('documents', () => {
  it('extracts text from plain text buffer as fallback', async () => {
    const buf = Buffer.from('Hello World')
    const text = await extractTextFromBuffer(buf, 'txt')
    expect(text).toContain('Hello World')
  })
})
```

- [ ] **Step 2: 문서 파싱 구현**

`lib/documents.ts`:
```typescript
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import ExcelJS from 'exceljs'

export async function extractTextFromBuffer(buffer: Buffer, ext: string): Promise<string> {
  const e = ext.toLowerCase().replace('.', '')

  if (e === 'pdf') {
    const data = await pdfParse(buffer)
    return data.text
  }

  if (e === 'docx' || e === 'doc') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (e === 'xlsx' || e === 'xls') {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)
    const lines: string[] = []
    wb.eachSheet((ws) => {
      ws.eachRow((row) => {
        const vals = (row.values as (string | null | undefined)[])
          .slice(1)
          .map((v) => String(v ?? ''))
          .filter(Boolean)
        if (vals.length > 0) lines.push(vals.join('\t'))
      })
    })
    return lines.join('\n')
  }

  // 기타: 텍스트로 처리
  return buffer.toString('utf-8')
}

export async function extractTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const buffer = Buffer.from(await res.arrayBuffer())
  const ext = url.split('.').pop() ?? 'txt'
  return extractTextFromBuffer(buffer, ext)
}
```

- [ ] **Step 3: 테스트 통과 확인**

```bash
npx jest __tests__/lib/documents.test.ts
```

Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add lib/documents.ts __tests__/lib/documents.test.ts
git commit -m "feat: add document parsing library"
```

---

## Task 12: Q&A 문서 업로드 API + 탭 연결

**Files:**
- Create: `app/api/documents/upload/route.ts`
- Create: `components/DocumentUploader.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 문서 업로드 API**

`app/api/documents/upload/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { uploadQnaDocument } from '@/lib/blob'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: '파일 없음' }, { status: 400 })
  }

  const allowed = ['pdf', 'docx', 'doc', 'xlsx', 'xls']
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: '지원하지 않는 형식' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadQnaDocument(file.name, buffer)

  return NextResponse.json({ ok: true, url, name: file.name })
}
```

- [ ] **Step 2: 문서 업로더 컴포넌트**

`components/DocumentUploader.tsx`:
```typescript
'use client'
import { useState } from 'react'

export default function DocumentUploader() {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<string[]>([])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.ok) {
        setUploaded((prev) => [...prev, data.name])
      } else {
        alert(data.error || '업로드 실패')
      }
    } catch {
      alert('업로드 실패')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
        📄 {uploading ? '업로드 중...' : '문서 업로드'}
        <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls" onChange={handleFile} className="hidden" />
      </label>
      {uploaded.length > 0 && (
        <span className="text-xs text-gray-500">{uploaded[uploaded.length - 1]} 업로드됨</span>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Q&A 탭에 업로더 연결**

`app/page.tsx`의 qna 탭 부분:
```typescript
import DocumentUploader from '@/components/DocumentUploader'

// qna 탭:
{activeTab === 'qna' && (
  <ChatWindow
    type="qna"
    placeholder="궁금한 점을 질문하세요..."
    extraUI={<DocumentUploader />}
  />
)}
```

- [ ] **Step 4: 브라우저에서 전체 동작 확인**

```bash
npm run dev
```

1. Q&A 탭 → 문서 업로드 → 질문 입력 → 문서 기반 답변 확인
2. DB 반출입 탭 → 데이터 입력 → 저장 → 다운로드 확인
3. 대용량 메일 탭 → 데이터 입력 → 저장 확인

- [ ] **Step 5: 커밋**

```bash
git add app/api/documents/ components/DocumentUploader.tsx app/page.tsx
git commit -m "feat: add Q&A document upload and complete all tabs"
```

---

## Task 13: Vercel 배포

**Files:**
- 없음 (설정만)

- [ ] **Step 1: GitHub push**

```bash
git push origin main
```

- [ ] **Step 2: Vercel 환경변수 설정**

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables:
```
GEMINI_API_KEY=실제값
BLOB_READ_WRITE_TOKEN=실제값
SITE_PASSWORD=실제값
```

- [ ] **Step 3: Vercel Blob 스토리지 활성화**

Vercel 대시보드 → Storage → Create Blob Store → 프로젝트에 연결

- [ ] **Step 4: 배포 후 동작 확인**

배포된 URL에서:
1. 비밀번호 인증 동작 확인
2. DB 반출입 탭에서 데이터 입력 및 저장 확인
3. 대용량 메일 탭에서 데이터 입력 및 저장 확인
4. Q&A 탭에서 문서 업로드 및 질문 확인

- [ ] **Step 5: 완료 커밋**

```bash
git commit --allow-empty -m "chore: deployed to Vercel"
```

---

## 전체 테스트 실행

```bash
npx jest --coverage
```

Expected: 모든 테스트 PASS
