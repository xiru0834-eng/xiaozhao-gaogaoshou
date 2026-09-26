/** Real renderer/backend round trips; native file choices use the smoke's private directory. */
import assert from 'node:assert/strict'
import { dialog } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

export async function verifyWorkspace({ product, until, clickText, output, temporary }) {
  const js = (code) => product.webContents.executeJavaScript(code)
  await until(() => js('document.querySelectorAll(".sz-today-grid button").length === 3'), 'next actions')
  assert.equal(await clickText('面试陪练', '.sz-product-nav'), true)
  await until(() => clickText('进入题库', '.sz-home'), 'practice overview')
  await until(() => js(`(() => { const button = document.querySelector('.sz-question-list button'); if (!button || button.disabled) return false; button.click(); return true })()`), 'start a bank question')
  await until(() => js('Boolean(document.querySelector(".sz-answer textarea:not([readonly])"))'), 'editable draft')
  const answer = '工具调用要校验参数和权限，并为有副作用的操作安排确认。'
  await js(`(() => { const area = document.querySelector('.sz-answer textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(area,${JSON.stringify(answer)}); area.dispatchEvent(new Event('input',{bubbles:true})); })()`)
  await until(() => js('document.querySelector(".sz-draft-status").textContent.includes("草稿已保存到本机")'), 'database draft save')
  assert.equal(await js('getComputedStyle(document.querySelector(".sz-coach-nav")).display'), 'none')
  assert.equal(await js('getComputedStyle(document.querySelector(".sz-product-nav")).display'), 'none')
  await writeFile(join(output, 'desktop-focused.png'), (await product.webContents.capturePage()).toPNG())
  await js('location.reload()')
  await until(() => js(`document.querySelector('.sz-answer textarea')?.value === ${JSON.stringify(answer)}`), 'draft survives refresh')
  await clickText('展开导航', '.sz-focus-bar')
  assert.equal(await clickText('校招工作台', '.sz-product-nav'), true)
  await until(() => js('document.querySelector(".sz-today-grid")?.textContent.includes("继续上次练习")'), 'resume on home')
  await until(() => js('document.querySelector(".sz-today-grid button")?.disabled === false'), 'next actions finish loading')
  await js('document.querySelector(".sz-today-grid button").click()')
  await until(() => js('document.querySelector(".sz-session")?.getClientRects().length > 0'), 'resume current practice with a saved draft')
  assert.equal(await js('document.querySelector(".sz-answer textarea").value'), answer)
  assert.equal(await clickText('校招工作台', '.sz-product-nav'), true)
  assert.equal(await js('typeof document.querySelector(".sz-career-frame").contentWindow.shizhiDesktop'), 'undefined', 'embedded workbench has no desktop privileges')
  await js('document.querySelector(".sz-open-settings").click()')
  await until(() => clickText('数据与备份', '.sz-settings-dialog'), 'unified backup settings')
  await until(() => js('document.querySelector(".sz-settings-content h3")?.textContent === "完整备份与恢复"'), 'backup content is displayed')
  await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  assert.equal(await js('document.querySelector(".sz-settings-dialog").open'), true)
  assert.equal(await js('Boolean(document.querySelector("[role=dialog]"))'), false, 'no duplicate framework onboarding overlays the settings')
  product.webContents.invalidate()
  await delay(250)
  await writeFile(join(output, 'desktop-data-settings.png'), (await product.webContents.capturePage()).toPNG())
  await js('document.querySelector(".sz-settings-dialog").close()')
  const file = join(temporary, 'roundtrip.szbackup')
  const originals = { save: dialog.showSaveDialog, open: dialog.showOpenDialog, message: dialog.showMessageBox, error: dialog.showErrorBox }
  const failures = [], completed = []
  dialog.showSaveDialog = async () => ({ canceled: false, filePath: file })
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
  dialog.showMessageBox = async (_window, options) => { completed.push(options.message); return { response: options.buttons ? 1 : 0 } }
  dialog.showErrorBox = (title, message) => failures.push({ title, message })
  try {
    void js(`window.shizhiDesktop.backup({password:'smoke-only-password'})`).catch(() => { /* Restart replaces the IPC caller document. */ })
    await until(() => completed.includes('完整备份已导出') || failures.length, 'encrypted backup export')
    assert.deepEqual(failures, [])
    assert.equal((await readFile(file)).subarray(0, 8).toString(), 'SZBACK01')
    await until(() => js('Boolean(document.querySelector(".sz-product"))'), 'backup restart')
    const key = await js(`fetch('/interview/api/question-bank').then(r=>r.json()).then(data=>data.items[0].key)`)
    await js(`fetch('/interview/api/question-bank',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:${JSON.stringify(key)},mastered:true})}).then(r=>r.json())`)
    void js(`window.shizhiDesktop.restore({password:'smoke-only-password'})`).catch(() => { /* Restore reloads the product after validation. */ })
    await until(() => completed.includes('备份已恢复') || failures.length, 'restore backup and restart')
    assert.deepEqual(failures, [])
    assert.equal(await js(`fetch('/interview/api/question-bank').then(r=>r.json()).then(data=>data.items.find(item=>item.key===${JSON.stringify(key)}).mastered)`), false)
    await until(() => js(`document.querySelector('.sz-answer textarea')?.value === ${JSON.stringify(answer)}`), 'restored draft after backend restart')
    await clickText('展开导航', '.sz-focus-bar')
    await clickText('校招工作台', '.sz-product-nav')
    await until(() => js('document.querySelector(".sz-today-grid button")?.disabled === false'), 'next actions reload')
    await writeFile(join(output, 'desktop-workbench.png'), (await product.webContents.capturePage()).toPNG())
    console.log('PASS: draft refresh/restart, focused answer, next actions, isolated preload, encrypted backup and real restore.')
  } finally {
    dialog.showSaveDialog = originals.save; dialog.showOpenDialog = originals.open
    dialog.showMessageBox = originals.message; dialog.showErrorBox = originals.error
  }
}
