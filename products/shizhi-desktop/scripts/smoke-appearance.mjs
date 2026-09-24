/** Exercises settings, iframe appearance controls and export hit targets in the real desktop renderer. */
import assert from 'node:assert/strict'
import { nativeTheme } from 'electron'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Checks theme propagation and menu stacking using the smoke test's isolated desktop window.
 * @param {object} options Running window, state waiter, button helper and screenshot directory.
 * @returns {Promise<void>} Resolves after both appearances and narrow-window menus pass.
 */
export async function verifyAppearance({ product, until, clickText, output }) {
  const js = (source) => product.webContents.executeJavaScript(source)
  const frame = (source) => js(`(() => { const d = document.querySelector('.sz-career-frame').contentDocument; ${source} })()`)
  const mode = (value) => until(() => js(`document.documentElement.dataset.shizhiMode === '${value}' && document.querySelector('.sz-career-frame')?.contentDocument?.documentElement.dataset.theme === '${value}'`), `host and workbench ${value}`)
  const screenshot = async (name) => {
    await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
    await writeFile(join(output, name), (await product.webContents.capturePage()).toPNG())
  }
  const closeSettings = async () => {
    product.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
    product.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' })
    await until(() => js('!document.querySelector("[role=dialog]")'), 'settings closed')
  }
  const settings = async (label) => {
    await js('document.querySelector(".sz-shell-settings button[aria-haspopup=dialog]").click()')
    await until(() => clickText('通用设置', '[role="dialog"]'), 'general settings')
    await until(() => clickText(label, '[role="dialog"]'), `select ${label}`)
  }
  const menu = async (name) => {
    await frame('d.querySelector("#export-menu summary").click(); d.querySelector("#export-menu").scrollIntoView({block:"nearest"});')
    const result = await frame(`const panel = d.querySelector('#export-menu .menu-panel');
      const bounds = panel.getBoundingClientRect(), trigger = d.querySelector('#export-menu summary').getBoundingClientRect();
      return { open:d.querySelector('#export-menu').open, gap:bounds.top-trigger.bottom,
        fits:bounds.left >= 0 && bounds.right <= d.defaultView.innerWidth && bounds.bottom <= d.defaultView.innerHeight,
        overflow:d.documentElement.scrollWidth > d.defaultView.innerWidth,
        targets:[...panel.querySelectorAll('.action')].map(item => {
          const r = item.getBoundingClientRect();
          return [.2,.5,.8].every(y => item.contains(d.elementFromPoint(r.left+r.width/2,r.top+r.height*y)));
        }) };`)
    assert.equal(result.open, true)
    assert.ok(result.gap >= 7, 'menu clears the export trigger')
    assert.equal(result.fits, true, 'all export choices fit in the window')
    assert.equal(result.overflow, false)
    assert.deepEqual(result.targets, [true, true, true, true], 'characters and summary cards cannot cover export choices')
    await screenshot(name)
    await frame('d.querySelector("#export-menu summary").click()')
  }
  const previousSystem = nativeTheme.themeSource
  try {
    await until(() => frame('return Boolean(d.querySelector("#appearance-open")) && d.querySelector("#savenote")?.dataset.kind === "ready"'), 'workbench appearance ready')
    nativeTheme.themeSource = 'light'
    await settings('深色')
    await mode('dark')
    await screenshot('desktop-dark-settings.png')
    await closeSettings()
    await menu('desktop-dark-export.png')
    assert.equal(await clickText('面试陪练', '.sz-product-nav'), true)
    await until(() => js('document.querySelector(".sz-home")?.getClientRects().length > 0'), 'dark coach')
    const darkTokens = await js(`(() => {
      const header=getComputedStyle(document.querySelector('.sz-shell-header'));
      const coach=getComputedStyle(document.querySelector('.sz-home'));
      return { header:header.getPropertyValue('--sz-page'), coach:coach.getPropertyValue('--sz-page'), scheme:header.colorScheme };
    })()`)
    assert.equal(darkTokens.header, darkTokens.coach)
    assert.equal(darkTokens.scheme, 'dark')
    await screenshot('desktop-dark-coach.png')
    assert.equal(await clickText('校招工作台', '.sz-product-nav'), true)
    await frame('d.querySelector("#theme-toggle").click()')
    await mode('light')
    await settings('跟随系统')
    await closeSettings()
    nativeTheme.themeSource = 'dark'
    await mode('dark')
    nativeTheme.themeSource = 'light'
    await mode('light')
    await frame(`d.querySelector('#appearance-open').click(); d.querySelector('[name="skin-mode"][value="dark"]').click();`)
    await mode('light')
    await frame('d.querySelector("#appearance-dialog [data-a=close]").click()')
    await mode('light')
    await frame(`d.querySelector('#appearance-open').click(); d.querySelector('[name="skin-choice"][value="blue"]').click(); d.querySelector('[name="skin-mode"][value="dark"]').click(); d.querySelector('#appearance-dialog [data-a=apply]').click();`)
    await mode('dark')
    await until(() => frame('return d.documentElement.dataset.skin === "blue"'), 'skin applied')
    await settings('浅色')
    await closeSettings()
    await mode('light')
    product.setFullScreen(false)
    product.unmaximize()
    await until(() => !product.isMaximized() && !product.isFullScreen(), 'normal window')
    product.setSize(900, 740)
    await until(() => js('innerWidth < 1000'), 'narrow appearance window')
    await menu('desktop-light-export-narrow.png')
    nativeTheme.themeSource = 'dark'
    await mode('light')
    product.reload()
    await mode('light')
    await until(() => frame('return d.documentElement.dataset.skin === "blue"'), 'saved skin after reload')
    product.setSize(1440, 940)
    console.log('PASS: global light/dark/system, iframe theme controls, preview cancellation, reload persistence and export hit targets.')
  } finally {
    nativeTheme.themeSource = previousSystem
  }
}
