import { put, list, del } from '@vercel/blob'
import path from 'path'
import fs from 'fs'

export type BlobTarget = 'db' | 'mail'

const MASTER_KEYS: Record<BlobTarget, string> = {
  db: 'db-master.xlsx',
  mail: 'mail-master.xlsx',
}

/** Vercel Blob 연결 여부 확인 (토큰 방식 또는 OIDC 방식 모두 지원) */
function isLocalMode(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const storeId = process.env.BLOB_STORE_ID
  // OIDC 방식(BLOB_STORE_ID) 또는 토큰 방식(BLOB_READ_WRITE_TOKEN) 중 하나라도 있으면 Blob 모드
  const hasBlobConfig =
    (token && token !== 'your_blob_token_here') || !!storeId
  // Vercel 환경에서 Blob 설정이 없으면 로컬 파일 접근 불가 → 명확한 에러
  if (!hasBlobConfig && process.env.VERCEL) {
    throw new Error('Blob 스토어가 설정되지 않았습니다. Vercel Storage에서 Blob 스토어를 프로젝트에 연결하세요.')
  }
  return !hasBlobConfig
}

const LOCAL_DATA_DIR = path.join(process.cwd(), 'local-data')

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// ─────────────────────────────────────────────
// 로컬 파일 시스템 구현
// ─────────────────────────────────────────────

function localGetMasterBuffer(target: BlobTarget): Buffer | null {
  const filePath = path.join(LOCAL_DATA_DIR, MASTER_KEYS[target])
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath) as Buffer
}

function localSaveMasterBuffer(target: BlobTarget, buffer: Buffer): string {
  ensureDir(LOCAL_DATA_DIR)
  const filePath = path.join(LOCAL_DATA_DIR, MASTER_KEYS[target])
  fs.writeFileSync(filePath, buffer)
  return `local://${MASTER_KEYS[target]}`
}

function localUploadQnaDocument(filename: string, buffer: Buffer): string {
  const qnaDir = path.join(LOCAL_DATA_DIR, 'qna-docs')
  ensureDir(qnaDir)
  const filePath = path.join(qnaDir, filename)
  fs.writeFileSync(filePath, buffer)
  return `file://${filePath}`
}

function localListQnaDocs(): string[] {
  const qnaDir = path.join(LOCAL_DATA_DIR, 'qna-docs')
  if (!fs.existsSync(qnaDir)) return []
  return fs.readdirSync(qnaDir).map((f) => `file://${path.join(qnaDir, f)}`)
}

function localGetMasterUrl(target: BlobTarget): string | null {
  const filePath = path.join(LOCAL_DATA_DIR, MASTER_KEYS[target])
  if (!fs.existsSync(filePath)) return null
  return `/api/local-file?name=${encodeURIComponent(MASTER_KEYS[target])}`
}

// ─────────────────────────────────────────────
// Vercel Blob 구현
// ─────────────────────────────────────────────

async function blobGetMasterBuffer(target: BlobTarget): Promise<Buffer | null> {
  const { blobs } = await list({ prefix: MASTER_KEYS[target] })
  if (blobs.length === 0) return null
  const res = await fetch(blobs[0].url)
  return Buffer.from(await res.arrayBuffer()) as Buffer
}

async function blobSaveMasterBuffer(target: BlobTarget, buffer: Buffer): Promise<string> {
  const { url } = await put(MASTER_KEYS[target], buffer, {
    access: 'public',
    addRandomSuffix: false,
  })
  return url
}

async function blobUploadQnaDocument(filename: string, buffer: Buffer): Promise<string> {
  const { url } = await put(`qna-docs/${filename}`, buffer, {
    access: 'public',
    addRandomSuffix: false,
  })
  return url
}

async function blobListQnaDocs(): Promise<string[]> {
  const { blobs } = await list({ prefix: 'qna-docs/' })
  return blobs.map((b) => b.url)
}

async function blobGetMasterUrl(target: BlobTarget): Promise<string | null> {
  const { blobs } = await list({ prefix: MASTER_KEYS[target] })
  if (blobs.length === 0) return null
  return blobs[0].url
}

// ─────────────────────────────────────────────
// 공개 API (자동으로 모드 선택)
// ─────────────────────────────────────────────

export async function getMasterBuffer(target: BlobTarget): Promise<Buffer | null> {
  if (isLocalMode()) return localGetMasterBuffer(target)
  return blobGetMasterBuffer(target)
}

export async function saveMasterBuffer(target: BlobTarget, buffer: Buffer): Promise<string> {
  if (isLocalMode()) return localSaveMasterBuffer(target, buffer)
  return blobSaveMasterBuffer(target, buffer)
}

export async function uploadQnaDocument(filename: string, buffer: Buffer): Promise<string> {
  if (isLocalMode()) return localUploadQnaDocument(filename, buffer)
  return blobUploadQnaDocument(filename, buffer)
}

export async function listQnaDocs(): Promise<string[]> {
  if (isLocalMode()) return localListQnaDocs()
  return blobListQnaDocs()
}

export interface QnaDocMeta {
  name: string        // 파일명
  readUrl: string     // 텍스트 추출용 URL (file:// 또는 blob URL)
  downloadUrl: string // 사용자 다운로드용 URL
}

export async function listQnaDocsWithMeta(): Promise<QnaDocMeta[]> {
  if (isLocalMode()) {
    const qnaDir = path.join(LOCAL_DATA_DIR, 'qna-docs')
    if (!fs.existsSync(qnaDir)) return []
    return fs.readdirSync(qnaDir).map((filename) => ({
      name: filename,
      readUrl: `file://${path.join(qnaDir, filename)}`,
      downloadUrl: `/api/local-file?subdir=qna-docs&name=${encodeURIComponent(filename)}`,
    }))
  }
  // Blob 모드: public URL을 읽기 + 다운로드 모두 사용
  const { blobs } = await list({ prefix: 'qna-docs/' })
  return blobs.map((b) => ({
    name: b.pathname.replace('qna-docs/', ''),
    readUrl: b.url,
    downloadUrl: b.url,
  }))
}

export async function getMasterUrl(target: BlobTarget): Promise<string | null> {
  if (isLocalMode()) return localGetMasterUrl(target)
  return blobGetMasterUrl(target)
}

export async function deleteQnaDocument(filename: string): Promise<boolean> {
  if (isLocalMode()) {
    const filePath = path.join(LOCAL_DATA_DIR, 'qna-docs', filename)
    if (!fs.existsSync(filePath)) return false
    fs.unlinkSync(filePath)
    return true
  }
  // Vercel Blob
  const { blobs } = await list({ prefix: `qna-docs/${filename}` })
  if (blobs.length === 0) return false
  await del(blobs.map((b) => b.url))
  return true
}

export async function deleteMaster(target: BlobTarget): Promise<boolean> {
  if (isLocalMode()) {
    const filePath = path.join(LOCAL_DATA_DIR, MASTER_KEYS[target])
    if (!fs.existsSync(filePath)) return false
    fs.unlinkSync(filePath)
    return true
  }
  // Vercel Blob: URL 조회 후 삭제
  const { blobs } = await list({ prefix: MASTER_KEYS[target] })
  if (blobs.length === 0) return false
  await del(blobs.map((b) => b.url))
  return true
}
