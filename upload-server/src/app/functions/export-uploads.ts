import { PassThrough, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { stringify } from 'csv-stringify'
import { asc, count, desc, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { db, pg } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { type Either, makeRight } from '@/shared/either'

const exportUploadsInput = z.object({
  searchQuery: z.string().optional(),
})

type ExportUploadsInput = z.input<typeof exportUploadsInput>

type ExportUploadsOutput = {
  reportUrl: string
}

export async function exportUploads(
  input: ExportUploadsInput
): Promise<Either<never, ExportUploadsOutput>> {
  const { searchQuery } = exportUploadsInput.parse(input)

  const { sql, params } = db
    .select({
      id: schema.uploads.id,
      name: schema.uploads.name,
      remoteUrl: schema.uploads.remoteUrl,
      createdAt: schema.uploads.createdAt,
    })
    .from(schema.uploads)
    .where(
      searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined
    )
    .toSQL()

  const cursor = pg.unsafe(sql, params as string[]).cursor(2)

  //   for await (const rows of cursor) {
  //     console.log(rows)
  //   }

  const csv = stringify({
    delimiter: ',',
    header: true,
    columns: [
      {
        key: 'id',
        header: 'ID',
      },
      {
        key: 'name',
        header: 'Name',
      },
      {
        key: 'remote_url',
        header: 'Remote URL',
      },
      {
        key: 'created_at',
        header: 'Created At',
      },
    ],
  })

  const uploadToStorageStream = new PassThrough()

  const convertToCSVPipeline = pipeline(
    cursor,
    new Transform({
      objectMode: true,
      transform(rows, encoding, callback) {
        for (const row of rows) {
          this.push(row)
        }
        callback()
      },
    }),
    csv,
    uploadToStorageStream
  )

  const uploadToStorage = uploadFileToStorage({
    folder: 'downloads',
    contentType: 'text/csv',
    fileName: `${new Date().toISOString()}-uploads.csv`,
    contentStream: uploadToStorageStream,
  })

  const [{ url }] = await Promise.all([uploadToStorage, convertToCSVPipeline])

  console.log(url.toJSON().toString())

  return makeRight({ reportUrl: url.toJSON().toString() })
}
