'use client'
import { useState } from 'react'
import PasswordGate from '@/components/PasswordGate'
import TabBar from '@/components/TabBar'
import ChatWindow from '@/components/ChatWindow'
import DocumentUploader from '@/components/DocumentUploader'
import MasterFileUploader from '@/components/MasterFileUploader'

const TABS = [
  { id: 'db', label: '설계 DB 반출입 관리' },
  { id: 'mail', label: '대용량 메일 파일 반출' },
  { id: 'qna', label: '사내 Q&A' },
]

export default function Home() {
  const [role, setRole] = useState<'admin' | 'guest' | null>(null)
  const [activeTab, setActiveTab] = useState('db')

  const isAdmin = role === 'admin'

  const handleLogout = () => {
    setRole(null)
  }

  const handlePasswordSubmit = async (password: string, selectedRole: 'admin' | 'guest') => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, role: selectedRole }),
    })
    if (res.ok) {
      const data = await res.json()
      setRole(data.role)
    } else {
      alert('비밀번호가 틀렸습니다')
    }
  }

  if (!role) {
    return <PasswordGate onSuccess={handlePasswordSubmit} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center">
          {/* 좌측: 타이틀 */}
          <div className="flex-1">
            <span className="text-base font-semibold text-gray-800">TPSEMI 경영기획그룹 AI 챗봇</span>
          </div>
          {/* 중앙: 로고 */}
          <div className="flex-1 flex justify-center">
            <img src="/t2semi-logo.png" alt="T2SEMI" className="h-9 object-contain" />
          </div>
          {/* 우측: 로그아웃 */}
          <div className="flex-1 flex justify-end items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {isAdmin ? '관리자' : '게스트'}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* 탭 전환 시 언마운트하지 않고 CSS로 숨김 → 대화 기록 유지 */}
        <div className={activeTab === 'db' ? 'block' : 'hidden'}>
          <ChatWindow
            type="db"
            placeholder="반출입 정보를 입력하거나 질문하세요..."
            showDownload
            downloadType="db"
            downloadLabel="DB 반출입 대장 다운로드"
            extraUI={isAdmin ? <MasterFileUploader type="db" /> : undefined}
          />
        </div>
        <div className={activeTab === 'mail' ? 'block' : 'hidden'}>
          <ChatWindow
            type="mail"
            placeholder="메일 반출 정보를 입력하거나 질문하세요..."
            showDownload
            downloadType="mail"
            downloadLabel="메일 반출 대장 다운로드"
            extraUI={isAdmin ? <MasterFileUploader type="mail" /> : undefined}
          />
        </div>
        <div className={activeTab === 'qna' ? 'block' : 'hidden'}>
          <ChatWindow
            type="qna"
            placeholder="궁금한 점을 질문하세요..."
            extraUI={<DocumentUploader isAdmin={isAdmin} />}
          />
        </div>
      </main>
    </div>
  )
}
