/** Generates the desktop book mark as a 256px Windows icon from source. */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

/** Writes the reproducible icon used by the executable and installer.
 * @param {string} file Icon destination.
 */
export async function writeIcon(file) {
  const size = 256, maskBytes = size * size / 8, pixels = Buffer.alloc(size * size * 4), bitmap = Buffer.alloc(40)
  bitmap.writeUInt32LE(40); bitmap.writeInt32LE(size, 4); bitmap.writeInt32LE(size * 2, 8)
  bitmap.writeUInt16LE(1, 12); bitmap.writeUInt16LE(32, 14); bitmap.writeUInt32LE(pixels.length + maskBytes, 20)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sx = x / 4, sy = y / 4
    const edge = Math.hypot(Math.max(13 - sx, sx - 50, 0), Math.max(13 - sy, sy - 50, 0)) > 13
    const book = sy >= 17 && sy <= 46 && ((sx >= 15 && sx <= 29) || (sx >= 34 && sx <= 48))
    const line = sy >= 47 && sy <= 49 && sx >= 14 && sx <= 49
    const index = ((size - y - 1) * size + x) * 4
    const color = book || line ? [236, 245, 243] : [36, 101, 93]
    pixels.set([color[2], color[1], color[0], edge ? 0 : 255], index)
  }
  const header = Buffer.alloc(22)
  header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4)
  header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(40 + pixels.length + maskBytes, 14); header.writeUInt32LE(22, 18)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, Buffer.concat([header, bitmap, pixels, Buffer.alloc(maskBytes)]))
}
