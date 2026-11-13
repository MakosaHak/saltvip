import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://localhost:4173'
const OUT = 'captures'
const ADMIN = { id: 'A0', name: 'Administrateur SALT', role: 'admin', societe: 'SALT', salon: '—' }

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 2 },
})
const page = await browser.newPage()
const sleep = ms => new Promise(r => setTimeout(r, ms))

await page.evaluateOnNewDocument(u => {
  localStorage.setItem('salt4-user', JSON.stringify(u))
}, ADMIN)

// 1. Checking : valider toutes les entrées autorisées (jour J + dates passées)
await page.goto(BASE + '/admin/checking', { waitUntil: 'networkidle0' })
await sleep(1200)
for (let i = 0; i < 8; i++) {
  const btn = await page.evaluateHandle(() =>
    [...document.querySelectorAll('button')].find(b => b.textContent.includes("Valider l'entrée"))
  )
  const el = btn.asElement()
  if (!el) break
  await el.click()
  await sleep(700)
}

// 2. Onglet "Déjà entrés" puis capture
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Déjà entrés'))
  if (t) t.click()
})
await sleep(1500)
await page.addStyleTag({
  content: `
    .flex.h-screen.overflow-hidden { height: auto !important; overflow: visible !important; }
    .shell-main { overflow: visible !important; height: auto !important; }
  `,
})
await page.screenshot({ path: `${OUT}/05b-admin-checking-entres.png`, fullPage: true })
console.log('OK 05b-admin-checking-entres')

// 3. État passagers peuplé
await page.goto(BASE + '/admin/registre', { waitUntil: 'networkidle0' })
await sleep(1800)
await page.addStyleTag({
  content: `
    .flex.h-screen.overflow-hidden { height: auto !important; overflow: visible !important; }
    .shell-main { overflow: visible !important; height: auto !important; }
  `,
})
await page.screenshot({ path: `${OUT}/07-admin-etat-passagers.png`, fullPage: true })
console.log('OK 07-admin-etat-passagers')

await browser.close()
console.log('Terminé.')
