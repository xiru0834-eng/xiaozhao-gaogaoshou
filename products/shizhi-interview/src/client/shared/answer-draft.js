/** Debounced database saves with synchronous browser recovery for interrupted requests. */
import React from 'react'
import { t } from './coach-locale.js'

const writers = new Set()
/** Settings and backup wait for all mounted answer editors before restarting the host. */
export async function flushAnswerDrafts() { await Promise.all([...writers].map((flush) => flush())) }

async function request(input, save) {
  const response = await fetch(`/interview/api/draft${save ? '' : `?${new URLSearchParams(input)}`}`, save ? {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input), keepalive: false,
  } : undefined)
  const data = await response.json()
  if (!response.ok) { const error = new Error(data.error?.message || t('draftFailed')); error.code = data.error?.code; throw error }
  return data
}

/** Draft identity follows the practice/question and answer count, even in a new session. */
export function useAnswerDraft(practice, question, attempts) {
  const key = practice && question ? `sz-answer:${practice}:${question}:${attempts}` : ''
  const [state, setState] = React.useState({ key: '', text: '', status: '', ready: false })
  const [reload, setReload] = React.useState(0)
  const current = React.useRef(null)
  React.useEffect(() => {
    if (!key) return undefined
    const entry = { key, text: '', revision: 0, dirty: false, ready: false, alive: true, timer: null, pending: null, failure: '' }
    current.current = entry
    const paint = (status) => { if (entry.alive) setState({ key, text: entry.text, ready: entry.ready, conflict: entry.conflict, status }) }
    const stash = () => {
      try { localStorage.setItem(key, JSON.stringify({ text: entry.text, revision: entry.revision })) }
      catch (error) { entry.failure = t('draftRecoveryUnavailable') }
    }
    const flush = async () => {
      clearTimeout(entry.timer)
      if (entry.pending) return entry.pending
      if (entry.conflict) throw new Error(t('draftConflict'))
      if (!entry.ready || !entry.dirty) return
      entry.pending = (async () => {
        while (entry.dirty) {
          const text = entry.text
          const saved = await request({ practice, question, attempts, revision: entry.revision, text }, true)
          entry.revision = saved.revision
          entry.dirty = entry.text !== text
          try { if (!entry.dirty) localStorage.removeItem(key); else stash() } catch (error) { /* The database save is already durable. */ }
          paint(entry.dirty ? t('draftSaving') : t('draftSaved'))
        }
      })().catch(async (error) => {
        if (error.code === 'DRAFT_CONFLICT') {
          const saved = await request({ practice, question })
          entry.revision = saved.revision; entry.remote = saved.text; entry.conflict = true; entry.ready = false
        }
        entry.failure = error.message; paint(entry.conflict ? t('draftConflict') : error.message); throw error
      })
        .finally(() => { entry.pending = null })
      await entry.pending
    }
    entry.flush = flush
    entry.change = (text) => {
      entry.text = text; entry.dirty = true; stash(); paint(t('draftSaving'))
      clearTimeout(entry.timer); entry.timer = setTimeout(() => { void flush().catch(() => {}) }, 500)
    }
    entry.resolve = (mine) => {
      entry.conflict = false; entry.ready = true
      if (mine) entry.change(entry.text)
      else {
        entry.text = entry.remote; entry.dirty = false
        try { localStorage.removeItem(key) } catch (error) { /* Database revision still prevents silent overwrite. */ }
        paint(t('draftRestored'))
      }
    }
    writers.add(flush)
    void request({ practice, question }).then((saved) => {
      if (!entry.alive) return
      let pending
      try { pending = JSON.parse(localStorage.getItem(key) || 'null') } catch (error) { /* Database drafts still work when browser recovery storage is unavailable. */ }
      entry.revision = saved.revision; entry.text = saved.text; entry.ready = true
      if (pending && typeof pending.text === 'string' && pending.revision === saved.revision) entry.change(pending.text)
      else if (typeof pending?.text === 'string' && pending.text !== saved.text) {
        entry.text = pending.text; entry.ready = false; entry.conflict = true; entry.remote = saved.text
        paint(t('draftConflict')); return
      } else paint(saved.text ? t('draftRestored') : t('draftReady'))
    }).catch((error) => paint(error.message))
    const unload = (event) => { if (entry.dirty) { stash(); event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', unload)
    return () => { entry.alive = false; clearTimeout(entry.timer); writers.delete(flush); window.removeEventListener('beforeunload', unload); void flush().catch(() => {}) }
  }, [key, reload])
  return {
    text: state.key === key ? state.text : '', status: state.key === key ? state.status : t('draftLoading'),
    ready: state.key === key && state.ready,
    conflict: state.key === key && state.conflict,
    resolve: (mine) => current.current?.resolve(mine),
    change: (text) => current.current?.change(text),
    submitted: () => {
      const entry = current.current
      if (!entry) return
      entry.dirty = false; entry.text = ''
      try { localStorage.removeItem(entry.key) } catch (error) { /* Attempt-count identity excludes submitted recovery drafts. */ }
      setState((value) => ({ ...value, text: '', status: t('saved') }))
    },
    flush: async () => { await current.current?.flush() },
    retry: () => { if (!current.current?.ready) setReload((value) => value + 1); else void current.current.flush().catch(() => {}) },
  }
}
