'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  type: 'db' | 'mail' | 'qna'
  initialValue: string
  onSave: (value: string) => void
  onClose: () => void
}

const TAB_LABELS: Record<string, string> = {
  db: 'DB 반출입 관리',
  mail: '대용량 메일 반출',
  qna: '사내 Q&A',
}

const TAB_PLACEHOLDERS: Record<string, string> = {
  db: `예시) 답변은 항상 한국어로 간결하게 해줘.\n보안담당자 이름은 항상 "홍길동"으로 기록해줘.`,
  mail: `예시) 반출 용도는 "업무용 외부 전송"으로 고정해줘.\n부서명은 꼭 확인해줘.`,
  qna: `예시) 문서에서 못 찾으면 "담당자에게 문의하세요" 라고 안내해줘.\n답변은 200자 이내로 짧게 해줘.`,
}

export default function InstructionsModal({ type, initialValue, onSave, onClose }: Props) {
  const [value, setValue] = useState(initialValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Esc 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-800">⚙️ AI 지침 설정</h2>
            <p className="text-xs text-gray-500 mt-0.5">{TAB_LABELS[type]} 탭 전용</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 설명 */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 leading-relaxed">
          이 탭의 AI에게 추가할 역할·지침을 자유롭게 작성하세요.
          GPTs의 &quot;지침&quot;처럼 매 대화에 자동으로 적용됩니다.
          비워두면 기본 지침만 사용합니다.
        </div>

        {/* 텍스트 영역 */}
        <div className="px-6 py-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={TAB_PLACEHOLDERS[type]}
            rows={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{value.length}자</p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 px-6 pb-5 justify-end">
          {value.trim() && (
            <button
              onClick={() => setValue('')}
              className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
            >
              지침 초기화
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
          >
            취소
          </button>
          <button
            onClick={() => onSave(value)}
            className="text-xs px-5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
