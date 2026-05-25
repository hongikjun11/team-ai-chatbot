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
