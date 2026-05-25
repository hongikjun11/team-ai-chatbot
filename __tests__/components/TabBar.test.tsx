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
