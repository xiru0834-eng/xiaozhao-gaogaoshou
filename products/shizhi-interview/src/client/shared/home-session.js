/** Creates chats without asking the user to choose a filesystem workspace.
 * @param {object} sessions Harness session service.
 * @param {object} navigation Harness navigation service.
 * @returns {object} Session creation and first-message submission actions.
 */
export function createHomeActions(sessions, navigation) {
  return {
    async createSession() {
      const sessionId = await sessions.create()
      navigation.openSession(sessionId)
      return sessionId
    },
    async sendMessage(sessionId, text) {
      const target = sessionId || await sessions.create()
      await sessions.using(target, { source: 'controllerOperation' }, async ({ binding }) => {
        const result = await binding.session.prompt([{ type: 'text', text }], 'queue')
        if (!result.ok) throw new Error(result.error.message)
        navigation.openSession(target)
      })
      return target
    },
  }
}

/** Occupies the conversation slot only while its selected session has no messages.
 * @param {object} slots Harness slot registry.
 * @param {object} sessions Harness session service.
 * @param {Function} component Product landing component.
 * @returns {Function} Releases the subscription and landing registration.
 */
export function registerProductHome(slots, sessions, component) {
  let disposeHome
  function refresh() {
    const current = Object.values(sessions.list.getSnapshot().byId)
      .find((session) => (session.retainedBy.mainView ?? 0) > 0)
    const showHome = !current || current.blank === true
    if (showHome && !disposeHome) disposeHome = slots.register({ name: 'main.conversation', priority: -10 }, component)
    if (!showHome && disposeHome) { disposeHome(); disposeHome = undefined }
  }
  const unsubscribe = sessions.list.subscribe(refresh)
  refresh()
  return () => { unsubscribe(); disposeHome?.() }
}
