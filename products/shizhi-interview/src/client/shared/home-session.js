/** Creates chats without asking the user to choose a filesystem workspace.
 * @param {object} sessions Harness session service.
 * @param {object} navigation Harness navigation service.
 * @param {object} api Persisted interview session queries.
 * @returns {object} Session creation and first-message submission actions.
 */
export function createHomeActions(sessions, navigation, api) {
  return {
    async createSession() {
      const sessionId = await sessions.create()
      navigation.openSession(sessionId)
      return sessionId
    },
    async sendMessage(sessionId, text) {
      const practice = sessionId ? (await api.session(sessionId)).resource.data.practice : null
      const target = sessionId && !practice?.config.coach ? sessionId : await sessions.create()
      await sessions.using(target, { source: 'controllerOperation' }, async ({ binding }) => {
        const result = await binding.session.prompt([{ type: 'text', text }], 'queue')
        if (!result.ok) throw new Error(result.error.message)
        navigation.openSession(target)
      })
      return target
    },
  }
}

/** Keeps empty sessions and persisted coach sessions in the product view, including during model turns.
 * @param {object} slots Harness slot registry.
 * @param {object} sessions Harness session service.
 * @param {Function} component Product landing component.
 * @param {object} api Persisted interview session queries and invalidation subscription.
 * @returns {Function} Releases the subscription and landing registration.
 */
export function registerProductHome(slots, sessions, component, api) {
  let disposeHome
  let selectedId, selectedBlank, revision = 0, disposed = false
  function showHome(visible) {
    if (visible && !disposeHome) disposeHome = slots.register({ name: 'main.conversation', priority: -10 }, component)
    if (!visible && disposeHome) { disposeHome(); disposeHome = undefined }
  }
  async function refresh(force = false) {
    if (disposed) return
    const current = Object.values(sessions.list.getSnapshot().byId)
      .find((session) => (session.retainedBy.mainView ?? 0) > 0)
    const changed = current?.id !== selectedId || current?.blank !== selectedBlank
    if (!changed && !force) return
    const request = ++revision
    selectedId = current?.id
    selectedBlank = current?.blank
    if (!current || current.blank) { showHome(true); return }
    if (changed) showHome(true)
    let result
    try {
      result = await api.session(current.id)
    } catch (_error) {
      // The product's session query displays connection errors; failed lookups do not redirect the user.
      return
    }
    if (!disposed && request === revision) showHome(Boolean(result.resource.data.practice?.config.coach))
  }
  const unsubscribe = sessions.list.subscribe(() => refresh())
  const unsubscribeApi = api.subscribe(() => refresh(true))
  void refresh(true)
  return () => { disposed = true; unsubscribe(); unsubscribeApi(); showHome(false) }
}
