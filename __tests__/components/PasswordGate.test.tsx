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
