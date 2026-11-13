import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://localhost:4173'
const OUT = 'captures'
fs.mkdirSync(OUT, { recursive: true })

const ADMIN = { id: 'A0', name: 'Administrateur SALT', role: 'admin', societe: 'SALT', salon: '—' }
const PROTO = { id: 'P1', name: 'Mme AFIA Kodjo', role: 'protocole', societe: 'Ministère des Affaires Étrangères', codeProtocole: 'PTC-KODJO1' }

const SHOTS = [
  { file: '01-connexion', path: '/connexion', user: null },
  { file: '02-protocole-reservation', path: '/reservation', user: PROTO },
  { file: '03-protocole-mes-reservations', path: '/mes-reservations', user: PROTO },
  { file: '04-admin-faire-reservation', path: '/admin/reservation', user: ADMIN },
  { file: '05-admin-checking', path: '/admin/checking', user: ADMIN },
  { file: '06-admin-reservations', path: '/admin/planning', user: ADMIN },
  { file: '07-admin-etat-passagers', path: '/admin/registre', user: ADMIN },
  { file: '08-admin-supervision', path: '/admin/supervision', user: ADMIN },
  { file: '09-admin-exports', path: '/admin/exports', user: ADMIN },
  { file: '10-admin-analytics', path: '/admin/analytics', user: ADMIN },
  { file: '11-admin-comptes', path: '/admin/systeme', user: ADMIN },
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 2 },
})

const page = await browser.newPage()
const sleep = ms => new Promise(r => setTimeout(r, ms))

for (const s of SHOTS) {
  // Injecte la session AVANT le chargement de l'app (localStorage salt4-user)
  await page.evaluateOnNewDocument(u => {
    if (u) localStorage.setItem('salt4-user', JSON.stringify(u))
    else localStorage.removeItem('salt4-user')
  }, s.user)

  await page.goto(BASE + s.path, { waitUntil: 'networkidle0', timeout: 30000 })
  // Laisse le layout déborder : les pages admin scrollent dans un conteneur interne
  await page.addStyleTag({
    content: `
      .flex.h-screen.overflow-hidden { height: auto !important; overflow: visible !important; }
      .shell-main { overflow: visible !important; height: auto !important; }
    `,
  })
  await sleep(1800)
  await page.screenshot({ path: `${OUT}/${s.file}.png`, fullPage: true })
  console.log(`OK ${s.file} -> ${page.url()}`)
}

await browser.close()
console.log('Terminé.')
