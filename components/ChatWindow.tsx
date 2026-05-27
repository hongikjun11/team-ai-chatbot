'use client'
import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import FileDownloadButton from './FileDownloadButton'
import InstructionsModal from './InstructionsModal'

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
  onAiReply?: () => void   // AI 응답 후 콜백 (엑셀 뷰어 새로고침용)
  heightClass?: string     // 커스텀 높이 클래스
}

const STORAGE_KEY = (type: string) => `chat_instructions_${type}`

export default function ChatWindow({
  type,
  placeholder = '메시지를 입력하세요...',
  showDownload = false,
  downloadType,
  downloadLabel,
  extraUI,
  onAiReply,
  heightClass = 'h-[calc(100vh-140px)]',
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [customInstructions, setCustomInstructions] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // localStorage에서 지침 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(type))
    if (saved) setCustomInstructions(saved)
  }, [type])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveInstructions = (value: string) => {
    setCustomInstructions(value)
    localStorage.setItem(STORAGE_KEY(type), value)
    setShowInstructions(false)
  }

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
        body: JSON.stringify({
          type,
          messages: [...messages, userMessage],
          customInstructions: customInstructions || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errMsg = data?.error || `서버 오류 (${res.status})`
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ ${errMsg}` },
        ])
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      onAiReply?.()  // 엑셀 뷰어 새로고침 트리거
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ 네트워크 오류: ${msg}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex flex-col ${heightClass} bg-white rounded-xl border border-gray-200`}>
      {/* 상단 툴바 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
        {showDownload && downloadType && downloadLabel && (
          <FileDownloadButton type={downloadType} label={downloadLabel} />
        )}
        {extraUI}
        {/* 지침 설정 버튼 */}
        <button
          onClick={() => setShowInstructions(true)}
          className={`ml-auto flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition ${
            customInstructions.trim()
              ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
              : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
          title="AI 지침/역할 설정"
        >
          ⚙️ 지침 설정
          {customInstructions.trim() && (
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block ml-0.5" />
          )}
        </button>
      </div>

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

      {/* 지침 설정 모달 */}
      {showInstructions && (
        <InstructionsModal
          type={type}
          initialValue={customInstructions}
          onSave={handleSaveInstructions}
          onClose={() => setShowInstructions(false)}
        />
      )}
    </div>
  )
}
