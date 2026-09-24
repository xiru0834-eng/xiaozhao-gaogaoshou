const form = document.querySelector('#settings')
const message = document.querySelector('#message')
async function launch(input) {
  for (const element of form.elements) element.disabled = true
  message.className = ''
  message.textContent = '正在打开你的工作台，首次启动可能需要稍候…'
  try {
    const result = await window.desktop.launch(input)
    if (result.error) throw new Error(result.error)
  } catch (error) {
    message.className = 'error'
    message.textContent = error.message
    for (const element of form.elements) element.disabled = false
  }
}
form.addEventListener('submit', (event) => {
  event.preventDefault()
  const data = new FormData(form)
  void launch({ deepseekKey: data.get('deepseekKey'), qwenKey: data.get('qwenKey'),
    cleardeepseekKey: data.has('cleardeepseekKey'), clearqwenKey: data.has('clearqwenKey') })
})
document.querySelector('#skip').addEventListener('click', () => void launch({}))
window.desktop.status().then((status) => {
  if (status.deepseek) document.querySelector('#model-status').textContent = '已保存密钥'
  if (status.qwen) document.querySelector('#voice-status').textContent = '已保存密钥'
  document.querySelector('#restart-note').hidden = !status.running
  if (status.running) document.querySelector('#save').textContent = '保存并重启工作台'
  if (new URLSearchParams(location.search).get('auto') === '1') void launch(null)
}).catch(() => { message.textContent = '无法读取桌面配置，请重新打开应用。' })
