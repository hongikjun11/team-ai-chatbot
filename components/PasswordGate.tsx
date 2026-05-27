'use client'
import { useState } from 'react'

interface Props {
  onSuccess: (password: string, role: 'admin' | 'guest') => void
}

export default function PasswordGate({ onSuccess }: Props) {
  const [role, setRole] = useState<'admin' | 'guest'>('guest')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      onSuccess(password.trim(), role)
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        {/* 회사 로고 */}
        <div className="flex justify-center mb-5">
          <img src="/t2semi-logo.png" alt="T2SEMI" className="h-12 object-contain" />
        </div>
        <h1 className="text-lg font-semibold text-gray-800 mb-1 text-center" spellCheck={false}>
          TPSEMI 경영기획그룹 AI 챗봇
        </h1>
        <p className="text-sm text-gray-400 mb-6 text-center">로그인하여 시작하세요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 계정 구분 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">계정 구분</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => { setRole('guest'); setError(false) }}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  role === 'guest'
                    ? 'bg-gray-700 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                게스트
              </button>
              <button
                type="button"
                onClick={() => { setRole('admin'); setError(false) }}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  role === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                관리자
              </button>
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder={role === 'admin' ? '관리자 비밀번호' : '게스트 비밀번호'}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {error && <p className="text-red-500 text-sm">비밀번호를 입력해주세요</p>}

          <button
            type="submit"
            className={`w-full text-white py-2 rounded-lg transition text-sm font-medium ${
              role === 'admin'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-800'
            }`}
          >
            {role === 'admin' ? '관리자로 입장' : '게스트로 입장'}
          </button>
        </form>
      </div>
    </div>
  )
}
