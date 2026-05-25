'use client'
import { useState } from 'react'
import PasswordGate from '@/components/PasswordGate'
import TabBar from '@/components/TabBar'
import ChatWindow from '@/components/ChatWindow'
import DocumentUploader from '@/components/DocumentUploader'

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
            extraUI={<DocumentUploader />}
          />
        )}
      </main>
    </div>
  )
}
