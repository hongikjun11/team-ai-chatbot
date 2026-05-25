import { extractTextFromBuffer } from '@/lib/documents'

describe('documents', () => {
  it('extracts text from plain text buffer as fallback', async () => {
    const buf = Buffer.from('Hello World')
    const text = await extractTextFromBuffer(buf, 'txt')
    expect(text).toContain('Hello World')
  })
})
