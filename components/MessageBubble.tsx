'use client'
import { renderMarkdown } from '@/lib/markdown'

interface Props {
  role: 'user' | 'assistant'
  content: string
}

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {isUser ? (
        // 사용자 메시지: 흰 배경 없이 파란 버블, 줄바꿈만 처리
        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-blue-600 text-white text-sm whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        // AI 메시지: 마크다운 렌더링
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-gray-200 text-gray-800 text-sm">
          <div
            className="prose-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      )}
    </div>
  )
}
