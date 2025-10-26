Because Neon is fully PostgreSQL-compatible, you can store small PDFs/Word docs directly in a table. The two common ways:

BYTEA (recommended for small files)

Store the file bytes in a single column.

Simple to query/backup; TOAST handles compression/chunking.

Practical rule of thumb: keep files <5–20 MB each; it’ll work above that, but latency/costs rise.

Large Objects (LO)

Streamable and better for very large files, but adds operational complexity (OID management, special APIs, permissions, dump/restore caveats). For most app use cases, BYTEA is simpler.

Minimal schema (BYTEA)
CREATE TABLE documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      text NOT NULL,
  mime_type     text NOT NULL,        -- e.g., application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  byte_size     integer NOT NULL,
  sha256_hex    text NOT NULL,        -- integrity/dup detection
  content       bytea NOT NULL,       -- your PDF/DOC bytes
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Useful index if you’ll lookup by name:
CREATE INDEX ON documents (filename);

Insert example (parameterized SQL)
INSERT INTO documents (filename, mime_type, byte_size, sha256_hex, content)
VALUES ($1, $2, $3, $4, $5);

Read example
SELECT filename, mime_type, byte_size, content
FROM documents
WHERE id = $1;

Node (serverless) with Neon

If you’re using Neon’s HTTP driver:

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

// Upload
export async function saveDoc({ filename, mimeType, bytes }: { filename: string; mimeType: string; bytes: Uint8Array }) {
  const crypto = await import('crypto');
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const res = await sql`
    INSERT INTO documents (filename, mime_type, byte_size, sha256_hex, content)
    VALUES (${filename}, ${mimeType}, ${bytes.length}, ${sha256}, ${bytes})
    RETURNING id
  `;
  return res[0].id;
}

// Download
export async function getDoc(id: string) {
  const rows = await sql`SELECT filename, mime_type, byte_size, content FROM documents WHERE id = ${id}`;
  if (!rows.length) return null;
  const { filename, mime_type, byte_size, content } = rows[0];
  // content is a Uint8Array; return as-is or base64-encode for HTTP
  return { filename, mimeType: mime_type, byteSize: byte_size, bytes: content as Uint8Array };
}

Practical tips

Keep them small: for anything above ~20–50 MB or high traffic, consider object storage (e.g., S3/Cloudflare R2/Netlify Blobs) and store only the URL + metadata in Neon.

Add constraints: check byte_size <= 20_000_000 if you want to enforce size caps.

Set caching headers at your API edge when serving downloads.

Consider a simple antivirus scan step before insert (even basic mime sniffing).

For Word docs, normalize MIME: .docx → application/vnd.openxmlformats-officedocument.wordprocessingml.document, .pdf → application/pdf.