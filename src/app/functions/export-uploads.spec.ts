import { randomUUID } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import * as upload from '@/infra/storage/upload-file-to-storage'
import { isRight, unwrapEither } from '@/shared/either'
import { makeUpload } from '@/test/factories/make-upload'
import { exportUploads } from './export-uploads'

vi.mock('@/infra/storage/upload-file-to-storage', () => {
  return {
    uploadFileToStorage: vi.fn().mockImplementation(() => {
      return {
        key: `${randomUUID()}.jpg`,
        url: 'https://storage.com/image.jpg',
      }
    }),
  }
})

describe('export uploads', () => {
  it('should be able to export uploads', async () => {
    // spy = monitorar que algo foi executado
    // stub = modificar o comportamento de algo

    const uploadStub = vi
      .spyOn(upload, 'uploadFileToStorage')
      .mockImplementationOnce(async () => {
        return {
          key: `${randomUUID()}.csv`,
          url: 'https://storage.com/file.csv',
        }
      })
    const namePattern = randomUUID()

    const upload1 = await makeUpload({ name: `${namePattern}.webp` })
    const upload2 = await makeUpload({ name: `${namePattern}.webp` })
    const upload3 = await makeUpload({ name: `${namePattern}.webp` })
    const upload4 = await makeUpload({ name: `${namePattern}.webp` })
    const upload5 = await makeUpload({ name: `${namePattern}.webp` })

    // sut = system under test
    const sut = await exportUploads({
      searchQuery: namePattern,
    })

    const generateCSVStream = uploadStub.mock.calls[0][0].contentStream

    const csvAsString = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []

      generateCSVStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      generateCSVStream.on('end', () => {
        const csv = Buffer.concat(chunks).toString('utf-8')
        resolve(csv)
      })

      generateCSVStream.on('error', error => {
        reject(error)
      })
    })

    const csvAsArray = csvAsString
      .trim()
      .split('\n')
      .map(row => row.split(','))

    expect(isRight(sut)).toBe(true)
    expect(unwrapEither(sut)).toEqual({
      reportUrl: 'https://storage.com/file.csv',
    })
    expect(csvAsArray).toEqual([
      ['ID', 'Name', 'Remote URL', 'Created At'],
      [upload1.id, upload1.name, upload1.remoteUrl, expect.any(String)],
      [upload2.id, upload2.name, upload2.remoteUrl, expect.any(String)],
      [upload3.id, upload3.name, upload3.remoteUrl, expect.any(String)],
      [upload4.id, upload4.name, upload4.remoteUrl, expect.any(String)],
      [upload5.id, upload5.name, upload5.remoteUrl, expect.any(String)],
    ])
  })
})
