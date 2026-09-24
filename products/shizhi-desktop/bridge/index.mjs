/** Desktop IPC lifetime for an official dsh web profile. No HTTP shutdown endpoint. */
export const name = 'shizhi-desktop-bridge'
export const inject = ['webServer', 'connection']

/** Reports the private URL only to the owning parent and joins dsh's graceful shutdown.
 * @param {object} ctx Cordis context.
 */
export function apply(ctx) {
  if (!process.send) throw new Error('Desktop profile requires its parent IPC channel')
  ctx.effect(() => {
    let disposed = false
    const shutdown = () => process.emit('SIGTERM')
    const message = (value) => { if (value?.type === 'shizhi:shutdown') shutdown() }
    process.on('message', message)
    process.on('disconnect', shutdown)
    if (!process.connected) queueMicrotask(shutdown)
    void ctx.get('loader').await().then(() => {
      if (disposed || !process.connected) return
      const url = ctx.connection.authenticatedUrl(`http://127.0.0.1:${ctx.webServer.port}`)
      process.send({ type: 'shizhi:ready', url })
    }).catch(() => { /* The dsh startup owner reports failure and releases resources. */ })
    return () => {
      disposed = true
      process.off('message', message)
      process.off('disconnect', shutdown)
    }
  })
}
