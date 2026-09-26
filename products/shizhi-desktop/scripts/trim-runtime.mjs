/** Removes compiler/debug sidecars from the private installed runtime, preserving code and licenses. */
import { readdir, lstat, unlink } from 'node:fs/promises'
import { join } from 'node:path'

export async function trimRuntime(directory) {
  let count = 0, bytes = 0
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = join(path, entry.name)
      if (entry.isSymbolicLink()) throw new Error('Runtime trimming refuses symbolic links')
      if (entry.isDirectory()) { if (entry.name !== '.bin') await visit(file); continue }
      if (/\.(?:[cm]?js|[cm]?ts)\.map$|\.d\.[cm]?ts$|\.pdb$/i.test(entry.name)) {
        bytes += (await lstat(file)).size
        await unlink(file); count++
      }
    }
  }
  await visit(directory)
  return { files: count, bytes }
}
