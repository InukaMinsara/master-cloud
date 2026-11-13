/**
 * scripts/ram-zstd-worker.mjs
 * Multi-core worker_threads engine for parallel Tier 2 Zstandard compression/decompression.
 */
import { parentPort } from 'worker_threads';
import zlib from 'zlib';

const hasNativeZstd = typeof zlib.zstdCompressSync === 'function';
const ZSTD_OPTS = hasNativeZstd
  ? { params: { [zlib.constants.ZSTD_c_compressionLevel]: 1 } }
  : undefined;

function compressOne(u8) {
  const buf = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
  if (buf.length < 128) return { data: u8, codec: 'raw' };
  const compressed = hasNativeZstd
    ? zlib.zstdCompressSync(buf, ZSTD_OPTS)
    : zlib.deflateRawSync(buf, { level: 1 });
  if (compressed.length >= buf.length * 0.96) {
    return { data: u8, codec: 'raw' };
  }
  // Copy into standalone ArrayBuffer so it can be zero-copy transferred
  const out = new Uint8Array(compressed.length);
  out.set(compressed);
  return { data: out, codec: hasNativeZstd ? 'zstd' : 'deflate' };
}

function decompressOne(u8, codec) {
  if (codec === 'raw') return u8;
  const buf = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
  const raw = codec === 'zstd' && hasNativeZstd
    ? zlib.zstdDecompressSync(buf)
    : zlib.inflateRawSync(buf);
  const out = new Uint8Array(raw.length);
  out.set(raw);
  return out;
}

if (parentPort) {
  parentPort.on('message', (msg) => {
    const { id, op, pages } = msg;
    try {
      if (op === 'compress') {
        const results = [];
        const transfer = [];
        for (const p of pages) {
          const r = compressOne(p.data);
          results.push(r);
          transfer.push(r.data.buffer);
        }
        parentPort.postMessage({ id, ok: true, results }, transfer);
      } else if (op === 'decompress') {
        const results = [];
        const transfer = [];
        for (const p of pages) {
          const data = decompressOne(p.data, p.codec);
          results.push({ data });
          transfer.push(data.buffer);
        }
        parentPort.postMessage({ id, ok: true, results }, transfer);
      } else if (op === 'bench') {
        // Timed batch compress + decompress inside worker thread
        const { pageSize, count } = msg;
        const sample = Buffer.alloc(pageSize);
        for (let i = 0; i < pageSize; i += 4) sample.writeUInt32LE((i * 2654435761) >>> 0, i);
        sample.fill(0x41, 0, pageSize / 2);

        const compList = [];
        let compBytes = 0;
        const tC0 = process.hrtime.bigint();
        for (let i = 0; i < count; i++) {
          const c = hasNativeZstd
            ? zlib.zstdCompressSync(sample, ZSTD_OPTS)
            : zlib.deflateRawSync(sample, { level: 1 });
          compList.push(c);
          compBytes += c.length;
        }
        const compNs = Number(process.hrtime.bigint() - tC0);

        const tD0 = process.hrtime.bigint();
        for (let i = 0; i < count; i++) {
          if (hasNativeZstd) zlib.zstdDecompressSync(compList[i]);
          else zlib.inflateRawSync(compList[i]);
        }
        const decompNs = Number(process.hrtime.bigint() - tD0);

        parentPort.postMessage({
          id,
          ok: true,
          rawBytes: pageSize * count,
          compBytes,
          compNs,
          decompNs,
        });
      }
    } catch (err) {
      parentPort.postMessage({ id, ok: false, error: err.message });
    }
  });
}
