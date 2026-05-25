import { put, list } from '@vercel/blob'

export type BlobTarget = 'db' | 'mail'

const MASTER_KEYS: Record<BlobTarget, string> = {
  db: 'db-master.xlsx',
  mail: 'mail-master.xlsx',
}

export async function getMasterBuffer(target: BlobTarget): Promise<Buffer | null> {
  const { blobs } = await list({ prefix: MASTER_KEYS[target] })
  if (blobs.length === 0) return null

  const blob = blobs[0]
  const res = await fetch(blob.url)
  return Buffer.from(await res.arrayBuffer())
}

export async function saveMasterBuffer(target: BlobTarget, buffer: Buffer): Promise<string> {
  const { url } = await put(MASTER_KEYS[target], buffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return url
}

export async function uploadQnaDocument(filename: string, buffer: Buffer): Promise<string> {
  const { url } = await put(`qna-docs/${filename}`, buffer, {
    access: 'public',
    allowOverwrite: true,
  })
  return url
}

export async function listQnaDocs(): Promise<string[]> {
  const { blobs } = await list({ prefix: 'qna-docs/' })
  return blobs.map((b) => b.url)
}

export async function getMasterUrl(target: BlobTarget): Promise<string | null> {
  const { blobs } = await list({ prefix: MASTER_KEYS[target] })
  if (blobs.length === 0) return null
  return blobs[0].url
}
