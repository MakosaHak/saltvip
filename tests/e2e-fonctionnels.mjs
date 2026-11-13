// Recette fonctionnelle automatisée SALT VIP (Puppeteer / Chrome)
// Prérequis : `npx vite build` puis `npx vite preview --port 4173`
// Lancement   : node tests/e2e-fonctionnels.mjs
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
const XLSX = createRequire(import.meta.url)('xlsx')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://localhost:4173'
const ROOT = path.resolve('tests')
const DL = path.join(ROOT, 'downloads')
const SHOTS = path.join(ROOT, 'captures-echecs')
fs.rmSync(DL, { recursive: true, force: true })
fs.rmSync(SHOTS, { recursive: true, force: true })
fs.mkdirSync(DL, { recursive: true })
fs.mkdirSync(SHOTS, { recursive: true })

const sleep = ms => new Promise(r => setTimeout(r, ms))
const pad = n => String(n).padStart(2, '0')
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fr = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
const now = new Date()
const TODAY = iso(now)
const TODAY_FR = fr(now)
const plus = n => new Date(now.getFullYear(), now.getMonth(), now.getDate() + n)

const ACC = {
  admin: ['admin@salt.tg', 'SaltAdmin2026'],
  hostess: ['akosua@salt.tg', 'SaltHostess2026'],
  proto: ['afia@gouv.tg', 'SaltProto2026'],
  proto2: ['amara@boad.org', 'SaltProto2026'],
}

const results = []
const pageErrors = []
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
const cdp = await page.createCDPSession()
await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL })
page.on('pageerror', e => pageErrors.push(String(e.message || e)))
page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()) })

// Utilitaires injectés dans la page
await page.evaluateOnNewDocument(() => {
  const wait = ms => new Promise(r => setTimeout(r, ms))
  window.__t = {
    setVal(el, v) {
      const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
      el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
    },
    field(root, label) {
      const l = [...root.querySelectorAll('label')].find(x => x.textContent.trim().startsWith(label))
      if (!l) throw new Error(`Champ introuvable : ${label}`)
      return l.parentElement.querySelector('input,select')
    },
    async fill(root, map) {
      for (const [label, v] of Object.entries(map)) {
        window.__t.setVal(window.__t.field(root, label), v)
        await wait(25)
      }
    },
    find(selector, text, root = document) {
      return [...root.querySelectorAll(selector)].find(e => e.textContent.trim().includes(text))
    },
    click(selector, text, root = document) {
      const el = window.__t.find(selector, text, root)
      if (!el) throw new Error(`Élément introuvable : ${selector} « ${text} »`)
      el.click()
      return true
    },
    paxCard(i) {
      return [...document.querySelectorAll('div.card')].find(c => c.querySelector('h2')?.textContent.trim() === `Passager ${i}`)
    },
    companion(card, j) {
      const p = [...card.querySelectorAll('p')].find(x => x.textContent.trim() === `Accompagnateur ${j}`)
      return p?.parentElement
    },
    checkCards() {
      return [...document.querySelectorAll('div.card')].filter(c => c.querySelector('p.font-semibold.text-base'))
    },
    checkCard(name) {
      return window.__t.checkCards().find(c => c.querySelector('p.font-semibold.text-base').textContent.trim() === name)
    },
    toasts() { return [...document.querySelectorAll('.toast')].map(t => t.innerText.trim()) },
    row(text) { return [...document.querySelectorAll('tbody tr')].find(tr => tr.innerText.includes(text)) },
  }
})

const pathname = () => new URL(page.url()).pathname
const ev = (fn, ...args) => page.evaluate(fn, ...args)
const bodyText = () => ev(() => document.body.innerText)
const toasts = () => ev(() => window.__t.toasts())
const clearToasts = () => ev(() => document.querySelectorAll('.toast button').forEach(b => b.click()))
const go = async p => { await page.goto(BASE + p, { waitUntil: 'networkidle0' }); await sleep(250) }
const click = async (sel, text) => { await ev((s, t) => window.__t.click(s, t), sel, text); await sleep(300) }

async function logoutHard() {
  await page.goto(BASE + '/connexion', { waitUntil: 'networkidle0' })
  await ev(() => localStorage.setItem('salt4-user', 'null'))
  await go('/connexion')
}

async function login([email, pwd]) {
  await logoutHard()
  await ev(async (e, p) => {
    window.__t.setVal(document.querySelector('input[type=email]'), e)
    window.__t.setVal(document.querySelector('input[autocomplete=current-password]'), p)
    await new Promise(r => setTimeout(r, 30))
    document.querySelector('button[type=submit]').click()
  }, email, pwd)
  await page.waitForFunction(() => location.pathname !== '/connexion' || document.querySelector('.toast-error'), { timeout: 5000 }).catch(() => {})
  await sleep(300)
  return pathname()
}

const sidebar = () => ev(() => [...document.querySelectorAll('aside nav a')].map(a => a.innerText.trim().replace(/\s*\d+$/, '')))

async function waitFile(regex, timeout = 10000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    const f = fs.readdirSync(DL).find(n => regex.test(n) && !n.endsWith('.crdownload'))
    if (f) {
      const full = path.join(DL, f)
      await sleep(300)
      return { name: f, full, size: fs.statSync(full).size }
    }
    await sleep(200)
  }
  throw new Error(`Aucun fichier téléchargé correspondant à ${regex}`)
}

async function T(id, module, name, procedure, expected, fn) {
  process.stdout.write(`${id} ${name} ... `)
  try {
    const obtained = await fn()
    results.push({ id, module, name, procedure, expected, obtained, status: 'Réussi' })
    console.log('OK')
  } catch (e) {
    results.push({ id, module, name, procedure, expected, obtained: e.message, status: 'Échec' })
    console.log('ÉCHEC →', e.message)
    await page.screenshot({ path: path.join(SHOTS, `${id}.png`) }).catch(() => {})
  }
}

// ---------------------------------------------------------------- 0. Qualité
await T('TF-00', 'Qualité du code', 'Compilation TypeScript et build de production',
  'Exécuter `tsc --noEmit` puis `vite build`.',
  'Aucune erreur de typage ; bundle de production généré.',
  async () => {
    execSync('npx tsc --noEmit -p .', { stdio: 'pipe' })
    const out = execSync('npx vite build', { stdio: 'pipe' }).toString()
    assert(/built in/.test(out), 'Build non terminé')
    return '0 erreur TypeScript ; build réussi (dist/ généré).'
  })

// Base propre
await page.goto(BASE + '/connexion', { waitUntil: 'networkidle0' })
await ev(() => localStorage.clear())

// ---------------------------------------------------------------- 1. Authentification
await T('TF-01', 'Authentification', 'Accès anonyme aux pages protégées',
  'Sans session, saisir directement /admin/checking, /admin/systeme, /reservation et /mes-reservations.',
  'Redirection systématique vers /connexion.',
  async () => {
    await logoutHard()
    const out = []
    for (const p of ['/admin/checking', '/admin/systeme', '/reservation', '/mes-reservations']) {
      await go(p)
      out.push(`${p} → ${pathname()}`)
      assert(pathname() === '/connexion', `${p} accessible sans connexion`)
    }
    return 'Les 4 URL redirigent vers /connexion.'
  })

await T('TF-02', 'Authentification', 'Soumission du formulaire vide',
  'Cliquer sur « Entrer » sans saisir email ni mot de passe.',
  'Formulaire bloqué (champs obligatoires), aucune connexion.',
  async () => {
    await logoutHard()
    await ev(() => document.querySelector('button[type=submit]').click())
    await sleep(600)
    const missing = await ev(() => document.querySelector('input[type=email]').validity.valueMissing)
    assert(missing && pathname() === '/connexion', 'Formulaire vide accepté')
    return 'Champ email signalé « obligatoire », l\'utilisateur reste sur /connexion.'
  })

await T('TF-03', 'Authentification', 'Email au format invalide',
  'Saisir « admin » (sans @) et un mot de passe, puis valider.',
  'Le navigateur refuse le format, aucune connexion.',
  async () => {
    await logoutHard()
    await ev(() => {
      window.__t.setVal(document.querySelector('input[type=email]'), 'admin')
      window.__t.setVal(document.querySelector('input[autocomplete=current-password]'), 'x')
      document.querySelector('button[type=submit]').click()
    })
    await sleep(600)
    const bad = await ev(() => document.querySelector('input[type=email]').validity.typeMismatch)
    assert(bad && pathname() === '/connexion', 'Email invalide accepté')
    return 'Format rejeté (typeMismatch), pas de connexion.'
  })

await T('TF-04', 'Authentification', 'Mot de passe erroné',
  'Saisir admin@salt.tg avec un mauvais mot de passe.',
  'Message « Identifiants incorrects ou compte inactif », accès refusé.',
  async () => {
    const p = await login(['admin@salt.tg', 'mauvais'])
    const t = await toasts()
    assert(p === '/connexion' && t.some(x => x.includes('Identifiants incorrects')), `Résultat : ${p} / ${t}`)
    return `Message d'erreur affiché : « ${t[0]} » ; reste sur /connexion.`
  })

await T('TF-05', 'Authentification', 'Compte inexistant',
  'Saisir inconnu@salt.tg / Test1234.',
  'Accès refusé avec message d\'erreur.',
  async () => {
    const p = await login(['inconnu@salt.tg', 'Test1234'])
    const t = await toasts()
    assert(p === '/connexion' && t.some(x => x.includes('Identifiants incorrects')), 'Compte inconnu accepté')
    return 'Accès refusé, message d\'erreur affiché.'
  })

await T('TF-06', 'Authentification', 'Connexion administrateur valide',
  'Se connecter avec admin@salt.tg / SaltAdmin2026.',
  'Redirection vers /admin/reservation et menu complet (8 entrées).',
  async () => {
    const p = await login(ACC.admin)
    const nav = await sidebar()
    assert(p === '/admin/reservation', `Redirigé vers ${p}`)
    assert(nav.length === 8, `Menu : ${nav.join(', ')}`)
    return `Arrivée sur ${p} ; menu : ${nav.join(', ')}.`
  })

await T('TF-07', 'Authentification', 'Email insensible à la casse',
  'Se connecter avec ADMIN@SALT.TG (majuscules) et le bon mot de passe.',
  'Connexion acceptée.',
  async () => {
    const p = await login(['ADMIN@SALT.TG', 'SaltAdmin2026'])
    assert(p === '/admin/reservation', `Redirigé vers ${p}`)
    return 'Connexion réussie, email normalisé.'
  })

await T('TF-08', 'Authentification', 'Utilisateur déjà connecté sur /connexion',
  'Connecté en admin, saisir l\'URL /connexion.',
  'Renvoi automatique vers l\'espace de l\'utilisateur.',
  async () => {
    await go('/connexion')
    assert(pathname() === '/admin/reservation', `Reste sur ${pathname()}`)
    return 'Redirigé vers /admin/reservation (pas de double connexion).'
  })

await T('TF-09', 'Authentification', 'Déconnexion',
  'Cliquer sur « Déconnexion » puis tenter de revenir sur /admin/checking.',
  'Retour à /connexion ; la page protégée n\'est plus accessible.',
  async () => {
    await click('aside button', 'Déconnexion')
    await sleep(400)
    const p1 = pathname()
    await go('/admin/checking')
    assert(p1 === '/connexion' && pathname() === '/connexion', `${p1} / ${pathname()}`)
    return 'Session détruite ; /admin/checking redirige vers /connexion.'
  })

// ---------------------------------------------------------------- 2. RBAC
await T('TF-10', 'Contrôle d\'accès (RBAC)', 'Menu restreint de l\'hôtesse',
  'Se connecter avec akosua@salt.tg (hôtesse).',
  '4 entrées seulement : Réserver, Checking, Réservation, État passagers.',
  async () => {
    const p = await login(ACC.hostess)
    const nav = await sidebar()
    assert(p === '/admin/reservation', `Redirigé vers ${p}`)
    assert(nav.length === 4 && !nav.some(n => /Supervision|Exports|Analytics|Comptes/.test(n)), `Menu : ${nav}`)
    return `Menu affiché : ${nav.join(', ')}.`
  })

await T('TF-11', 'Contrôle d\'accès (RBAC)', 'Hôtesse : saisie manuelle d\'URL admin',
  'Connectée en hôtesse, saisir /admin/systeme, /admin/supervision, /admin/exports, /admin/analytics.',
  'Chaque URL renvoie vers /admin/reservation.',
  async () => {
    for (const p of ['/admin/systeme', '/admin/supervision', '/admin/exports', '/admin/analytics']) {
      await go(p)
      assert(pathname() === '/admin/reservation', `${p} accessible à l'hôtesse`)
    }
    return 'Les 4 pages réservées à l\'admin sont inaccessibles (redirection).'
  })

await T('TF-12', 'Contrôle d\'accès (RBAC)', 'Connexion protocole',
  'Se connecter avec afia@gouv.tg (protocole).',
  'Arrivée sur /reservation ; nom et code protocole affichés.',
  async () => {
    const p = await login(ACC.proto)
    const txt = await bodyText()
    assert(p === '/reservation' && txt.includes('PTC-KODJO1'), `${p}`)
    return 'Arrivée sur /reservation, en-tête « Mme AFIA Kodjo — PTC-KODJO1 ».'
  })

await T('TF-13', 'Contrôle d\'accès (RBAC)', 'Protocole : accès aux pages staff',
  'Connecté en protocole, saisir /admin/checking puis /admin/systeme.',
  'Renvoi vers /reservation.',
  async () => {
    for (const p of ['/admin/checking', '/admin/systeme']) {
      await go(p)
      assert(pathname() === '/reservation', `${p} accessible au protocole`)
    }
    return 'Accès refusé, redirection vers /reservation.'
  })

await T('TF-14', 'Contrôle d\'accès (RBAC)', 'Admin : accès à l\'espace protocole',
  'Connecté en admin, saisir /reservation et /mes-reservations.',
  'Renvoi vers /admin/reservation (espaces cloisonnés).',
  async () => {
    await login(ACC.admin)
    for (const p of ['/reservation', '/mes-reservations']) {
      await go(p)
      assert(pathname() === '/admin/reservation', `${p} → ${pathname()}`)
    }
    return 'Redirection vers /admin/reservation.'
  })

// ---------------------------------------------------------------- 3. Réservation protocole
const fillPax = (i, data) => ev(async (i, d) => window.__t.fill(window.__t.paxCard(i), d), i, data)
const submitDisabled = () => ev(() => document.querySelector('button[type=submit]').disabled)

await T('TF-15', 'Réservation (protocole)', 'Formulaire vide',
  'Ouvrir /reservation sans rien saisir.',
  'Bouton « Enregistrer la réservation » désactivé.',
  async () => {
    await login(ACC.proto)
    assert(await submitDisabled(), 'Bouton actif sur formulaire vide')
    return 'Bouton désactivé.'
  })

await T('TF-16', 'Réservation (protocole)', 'Champ obligatoire manquant (n° de vol)',
  'Renseigner nom, prénom, profession, provenance, date, sans numéro de vol.',
  'Bouton toujours désactivé.',
  async () => {
    await fillPax(1, { 'Nom': 'TESTEUR', 'Prénom': 'Jean', 'Profession': 'Ministre', 'Provenance': 'Paris CDG', 'Date du vol': TODAY })
    assert(await submitDisabled(), 'Bouton actif sans numéro de vol')
    return 'Bouton désactivé tant que le vol n\'est pas saisi.'
  })

await T('TF-17', 'Réservation (protocole)', 'Accompagnateur incomplet',
  'Saisir le vol, choisir « Oui » accompagnateurs, porter le nombre à 2, laisser la profession du 2e vide.',
  'Bouton désactivé tant que chaque accompagnateur n\'a pas nom, prénom et profession.',
  async () => {
    await fillPax(1, { 'Numéro de vol': 'AF 999', 'Salon': 'Salon Plus', 'Heure du vol': '15:00' })
    await ev(() => window.__t.click('button', 'Oui', window.__t.paxCard(1)))
    await sleep(200)
    await ev(() => window.__t.paxCard(1).querySelector('button.btn-primary.w-10').click())
    await sleep(200)
    await ev(async () => {
      const c = window.__t.paxCard(1)
      await window.__t.fill(window.__t.companion(c, 1), { 'Nom': 'DUPONT', 'Prénom': 'Marie', 'Profession': 'Conseillère' })
      await window.__t.fill(window.__t.companion(c, 2), { 'Nom': 'KOMLAN', 'Prénom': 'Paul' })
    })
    const d1 = await submitDisabled()
    await ev(async () => window.__t.fill(window.__t.companion(window.__t.paxCard(1), 2), { 'Profession': 'Garde du corps' }))
    const d2 = await submitDisabled()
    assert(d1 && !d2, `disabled avant=${d1}, après=${d2}`)
    return 'Désactivé sans profession, activé une fois la profession saisie.'
  })

let refResa1 = ''
await T('TF-18', 'Réservation (protocole)', 'Enregistrement d\'une réservation complète',
  'Valider : 1 passager (Jean TESTEUR, AF 999, Salon Plus, date du jour) + 2 accompagnateurs.',
  'Écran « Réservation enregistrée » avec référence ; notification de succès.',
  async () => {
    await clearToasts()
    await ev(() => document.querySelector('button[type=submit]').click())
    await sleep(600)
    const txt = await bodyText()
    const t = await toasts()
    refResa1 = (txt.match(/Référence (R-[A-Z0-9]+)/) || [])[1] || ''
    assert(txt.includes('Réservation enregistrée') && refResa1, 'Pas d\'écran de confirmation')
    assert(t.some(x => x.includes('1 passager(s), 2 accompagnateur(s)')), `Toast : ${t}`)
    return `Confirmation affichée, référence ${refResa1} ; « ${t[0]} ».`
  })

await T('TF-19', 'Réservation (protocole)', 'Réservation multi-passagers',
  'Nouvelle réservation : « Ajouter un autre passager » ; P1 Afi ADJO (KP 100, aujourd\'hui), P2 Koffi BIOVA (KP 200, J+3).',
  'Les 2 passagers sont enregistrés, chacun avec son vol et sa date.',
  async () => {
    await click('button', 'Nouvelle réservation')
    await click('button', 'Ajouter un autre passager')
    await fillPax(1, { 'Nom': 'ADJO', 'Prénom': 'Afi', 'Profession': 'Directrice', 'Numéro de vol': 'KP 100', 'Provenance': 'Accra', 'Date du vol': TODAY })
    await fillPax(2, { 'Nom': 'BIOVA', 'Prénom': 'Koffi', 'Profession': 'Conseiller', 'Numéro de vol': 'KP 200', 'Provenance': 'Abidjan', 'Date du vol': iso(plus(3)) })
    await clearToasts()
    await ev(() => document.querySelector('button[type=submit]').click())
    await sleep(600)
    const t = await toasts()
    assert(t.some(x => x.includes('2 passager(s)')), `Toast : ${t}`)
    return `« ${t[0]} ».`
  })

await T('TF-19b', 'Réservation (protocole)', 'Unicité des identifiants enregistrés',
  'Lire les réservations stockées et comparer les identifiants des passagers et accompagnateurs d\'une même réservation.',
  'Chaque personne possède un identifiant unique.',
  async () => {
    const dups = await ev(() => JSON.parse(localStorage.getItem('salt9-resas')).flatMap(r => {
      const ids = r.passengers.flatMap(p => [p.id, ...p.accompagnateurs.map(a => a.id)])
      return ids.filter((x, i) => ids.indexOf(x) !== i).map(x => `${r.id}:${x}`)
    }))
    assert(dups.length === 0, `Identifiants en double : ${[...new Set(dups)].join(', ')} — uid() repose sur Date.now() seul`)
    return 'Tous les identifiants sont uniques.'
  })

await T('TF-20', 'Réservation (protocole)', 'Suivi dans « Mes réservations »',
  'Ouvrir /mes-reservations.',
  'Les réservations créées apparaissent avec passagers, accompagnateurs et statut « En attente » de checking.',
  async () => {
    await go('/mes-reservations')
    const txt = await bodyText()
    for (const n of ['Jean TESTEUR', 'Marie DUPONT', 'Paul KOMLAN', 'Afi ADJO', 'Koffi BIOVA']) assert(txt.includes(n), `${n} absent`)
    assert(txt.includes('En attente'), 'Statut absent')
    return 'Les 5 personnes sont listées avec le statut « En attente ».'
  })

await T('TF-21', 'Réservation (protocole)', 'Cloisonnement entre protocoles',
  'Se connecter avec un autre protocole (amara@boad.org) et ouvrir « Mes réservations ».',
  'Les réservations de Mme AFIA ne sont pas visibles.',
  async () => {
    await login(ACC.proto2)
    await go('/mes-reservations')
    const txt = await bodyText()
    assert(!txt.includes('TESTEUR') && txt.includes('SAVI'), 'Fuite de données entre protocoles')
    return 'Seules ses propres réservations sont visibles (Yawa SAVI).'
  })

// ---------------------------------------------------------------- 4. Réservation hôtesse
await T('TF-22', 'Réservation (staff)', 'Hôtesse : protocole demandeur obligatoire',
  'Connectée en hôtesse, remplir un passager complet sans choisir de protocole.',
  'Bouton désactivé ; il s\'active après sélection du protocole.',
  async () => {
    await login(ACC.hostess)
    await fillPax(1, { 'Nom': 'AMEGAN', 'Prénom': 'Yao', 'Profession': 'Ambassadeur', 'Numéro de vol': 'ET 500', 'Provenance': 'Addis-Abeba', 'Date du vol': TODAY })
    const d1 = await submitDisabled()
    await ev(() => {
      const sel = window.__t.field(document, 'Protocole')
      window.__t.setVal(sel, [...sel.options].find(o => o.text.includes('Amara KOFFI')).value)
    })
    await sleep(200)
    const d2 = await submitDisabled()
    assert(d1 && !d2, `avant=${d1}, après=${d2}`)
    return 'Désactivé sans protocole, activé après sélection de « Amara KOFFI — PTC-KOFFI1 ».'
  })

await T('TF-23', 'Réservation (staff)', 'Hôtesse : réservation pour le compte d\'un protocole',
  'Valider la réservation de Yao AMEGAN puis ouvrir la liste « Réservation » (/admin/planning) et rechercher « AMEGAN ».',
  'Réservation visible, rattachée au protocole Amara KOFFI.',
  async () => {
    await ev(() => document.querySelector('button[type=submit]').click())
    await sleep(600)
    await go('/admin/planning')
    await ev(() => window.__t.setVal(document.querySelector('input[placeholder^="Rechercher"]'), 'AMEGAN'))
    await sleep(300)
    const row = await ev(() => window.__t.row('AMEGAN')?.innerText || '')
    assert(row.includes('Amara KOFFI') && row.includes('PTC-KOFFI1'), `Ligne : ${row}`)
    return 'Ligne trouvée : protocole « Amara KOFFI — PTC-KOFFI1 ».'
  })

await T('TF-24', 'Liste des réservations', 'Filtre par salon',
  'Sur /admin/planning, effacer la recherche et cliquer sur le filtre « Plus ».',
  'Seules les personnes du Salon Plus sont listées.',
  async () => {
    await ev(() => window.__t.setVal(document.querySelector('input[placeholder^="Rechercher"]'), ''))
    await click('button', 'Plus')
    const rows = await ev(() => [...document.querySelectorAll('tbody tr')].map(tr => ({ salon: tr.children[6].innerText, nom: `${tr.children[3].innerText} ${tr.children[2].innerText}` })))
    const salons = rows.map(r => r.salon)
    const intrus = rows.filter(r => r.salon !== 'Salon Plus').map(r => `${r.nom} (${r.salon})`)
    assert(salons.length > 0 && intrus.length === 0, `Ligne(s) hors filtre restée(s) affichée(s) : ${intrus.join(', ')} — rendu React perturbé par les clés en double`)
    return `${salons.length} ligne(s), toutes « Salon Plus ».`
  })

// ---------------------------------------------------------------- 5. Checking
const search = async q => { await ev(q => window.__t.setVal(document.querySelector('input[placeholder^="Rechercher passager"]'), q), q); await sleep(300) }

await T('TF-25', 'Checking', 'Recherche nominative',
  'Sur /admin/checking, rechercher « Afi ADJO » puis « TESTEUR ».',
  '« Afi ADJO » : seule la fiche d\'Afi ADJO ; « TESTEUR » : Jean TESTEUR et ses 2 accompagnateurs, chacun une seule fois.',
  async () => {
    await go('/admin/checking')
    const names = async q => { await search(q); return ev(() => window.__t.checkCards().map(c => c.querySelector('p.font-semibold.text-base').textContent.trim())) }
    const a = await names('Afi ADJO')
    const b = await names('TESTEUR')
    assert(a.join('|') === 'Afi ADJO', `« ADJO » → ${a}`)
    assert(b.length === 3 && ['Jean TESTEUR', 'Marie DUPONT', 'Paul KOMLAN'].every(n => b.includes(n)), `« TESTEUR » → ${b.join(', ')} (doublon d'affichage)`)
    return `« ADJO » → ${a.join(', ')} ; « TESTEUR » → ${b.join(', ')}.`
  })

await T('TF-26', 'Checking', 'Validation d\'entrée le jour J',
  'Cliquer « Valider l\'entrée » sur Jean TESTEUR (vol du jour).',
  'Notification « validé — entrée au salon autorisée » ; la fiche quitte la liste « À valider ».',
  async () => {
    await clearToasts()
    await ev(() => window.__t.click('button', 'Valider l\'entrée', window.__t.checkCard('Jean TESTEUR')))
    await sleep(500)
    const t = await toasts()
    const still = await ev(() => !!window.__t.checkCard('Jean TESTEUR'))
    assert(t.some(x => x.includes('entrée au salon autorisée')) && !still, `Toast : ${t}`)
    return `« ${t.find(x => x.includes('autorisée'))} ».`
  })

await T('TF-27', 'Checking', 'Traçabilité et anti-double validation',
  'Ouvrir l\'onglet « Déjà entrés ».',
  'Jean TESTEUR affiché « Validé » avec heure et nom de l\'agent ; plus de bouton de validation.',
  async () => {
    await click('button', 'Déjà entrés')
    const card = await ev(() => { const c = window.__t.checkCard('Jean TESTEUR'); return c ? c.innerText : '' })
    assert(card.includes('Validé') && card.includes('par Akosua KPOTO') && !card.includes('Valider l\'entrée'), card)
    const line = card.split('\n').find(l => l.includes('par Akosua')) || ''
    return `Fiche « Validé — ${line.trim()} », aucun bouton de revalidation.`
  })

await T('TF-28', 'Checking', 'Blocage avant le jour J',
  'Onglet « À valider », rechercher « BIOVA » (vol à J+3).',
  'Bouton « Bloqué avant jour J » désactivé ; validation impossible.',
  async () => {
    await click('button', 'À valider')
    await search('BIOVA')
    const st = await ev(() => {
      const c = window.__t.checkCard('Koffi BIOVA')
      const b = c && window.__t.find('button', 'Bloqué avant jour J', c)
      return { found: !!c, disabled: b?.disabled, txt: c?.innerText || '' }
    })
    assert(st.found && st.disabled === true, JSON.stringify(st))
    return 'Bouton « Bloqué avant jour J » désactivé (mention « Dans 3 jours »).'
  })

await T('TF-29', 'Checking', 'Filtre par salon et par jour J',
  'Effacer la recherche, cliquer « Solidarité » puis « Aujourd\'hui (Jour J) ».',
  'Seules les personnes du Salon Solidarité prévues aujourd\'hui sont affichées.',
  async () => {
    await search('')
    await click('button', 'Solidarité')
    await click('button', 'Aujourd\'hui (Jour J)')
    const info = await ev(() => window.__t.checkCards().map(c => c.innerText))
    assert(info.length > 0 && info.every(t => t.includes('Solidarité') && t.includes(new Date().toLocaleDateString('fr-FR'))), `${info.length} fiches`)
    return `${info.length} fiche(s), toutes « Salon Solidarité » datées du ${TODAY_FR}.`
  })

await T('TF-30', 'Checking', 'Validation d\'un accompagnateur (isolation)',
  'Valider Marie DUPONT (accompagnatrice de Jean TESTEUR).',
  'Seule Marie DUPONT est validée ; Paul KOMLAN (2e accompagnateur) reste « À valider ».',
  async () => {
    await click('button', 'Effacer le filtre')
    await click('button', 'Tous')
    await search('DUPONT')
    await ev(() => window.__t.click('button', 'Valider l\'entrée', window.__t.checkCard('Marie DUPONT')))
    await sleep(400)
    await search('KOMLAN')
    const pending = await ev(() => !!window.__t.checkCard('Paul KOMLAN'))
    assert(pending, 'Paul KOMLAN a été validé en même temps que Marie DUPONT (identifiants dupliqués)')
    return 'Seule Marie DUPONT est validée.'
  })

await T('TF-31', 'Checking', 'Validation d\'un passager d\'une réservation multi-passagers',
  'Valider Afi ADJO (aujourd\'hui) ; vérifier Koffi BIOVA (même réservation, J+3).',
  'Koffi BIOVA reste non validé et bloqué jusqu\'au jour J.',
  async () => {
    await search('ADJO')
    await ev(() => window.__t.click('button', 'Valider l\'entrée', window.__t.checkCard('Afi ADJO')))
    await sleep(400)
    await search('BIOVA')
    const pending = await ev(() => !!window.__t.checkCard('Koffi BIOVA'))
    assert(pending, 'Koffi BIOVA (vol à J+3) a été validé en même temps qu\'Afi ADJO (identifiants dupliqués)')
    return 'Koffi BIOVA reste bloqué.'
  })

await T('TF-32', 'État passagers', 'Registre des entrées validées',
  'Ouvrir /admin/registre.',
  'Jean TESTEUR, Marie DUPONT et Afi ADJO apparaissent avec heure d\'entrée et « Akosua KPOTO » comme agent.',
  async () => {
    await go('/admin/registre')
    const rows = await ev(() => [...document.querySelectorAll('tbody tr')].map(tr => tr.innerText))
    for (const n of ['TESTEUR', 'DUPONT', 'ADJO']) {
      const r = rows.find(x => x.includes(n))
      assert(r && r.includes('Akosua KPOTO') && r.includes('✓'), `${n} absent ou non tracé`)
    }
    return `${rows.length} entrée(s) listée(s) avec horodatage et agent validateur.`
  })

await T('TF-33', 'Réservation (protocole)', 'Retour d\'information au protocole',
  'Se reconnecter en protocole (afia@gouv.tg) et ouvrir « Mes réservations ».',
  'Jean TESTEUR affiché « Entré <heure> ».',
  async () => {
    await login(ACC.proto)
    await go('/mes-reservations')
    const txt = await bodyText()
    assert(/Jean TESTEUR[\s\S]*?Entré \d/.test(txt), 'Statut « Entré » non visible')
    return 'Le protocole voit « Entré » avec l\'heure de validation.'
  })

// ---------------------------------------------------------------- 6. Supervision
await T('TF-34', 'Supervision', 'Réassignation de salon',
  'Admin, /admin/supervision : bouton « Réassigner le salon » sur la réservation de Yao AMEGAN → « Salon Plus ».',
  'Salon mis à jour, notification « Salon réassigné », entrée « Réassignation » dans le journal d\'audit.',
  async () => {
    await login(ACC.admin)
    await go('/admin/supervision')
    await ev(() => window.__t.row('AMEGAN').querySelector('button[title="Réassigner le salon"]').click())
    await sleep(200)
    await ev(() => window.__t.setVal(window.__t.row('AMEGAN').querySelector('select'), 'Salon Plus'))
    await sleep(400)
    const row = await ev(() => window.__t.row('AMEGAN').innerText)
    const txt = await bodyText()
    assert(row.includes('Salon Plus') && txt.includes('Salon réassigné → Salon Plus'), row)
    return 'Salon passé à « Salon Plus », audit « Salon réassigné → Salon Plus ».'
  })

await T('TF-35', 'Supervision', 'Révocation d\'une réservation',
  'Cliquer « Révoquer » sur la réservation de Yao AMEGAN.',
  'Statut « Annulée », compteur « Annulée » incrémenté, audit « Annulation ».',
  async () => {
    await ev(() => window.__t.row('AMEGAN').querySelector('button[title="Révoquer"]').click())
    await sleep(400)
    const row = await ev(() => window.__t.row('AMEGAN').innerText)
    const txt = await bodyText()
    assert(row.includes('Annulée') && txt.includes('Réservation annulée'), row)
    return 'Statut « Annulée », journal mis à jour.'
  })

await T('TF-36', 'Supervision', 'Réservation révoquée exclue du checking',
  'Ouvrir /admin/checking et rechercher « AMEGAN ».',
  'Une réservation annulée ne doit plus pouvoir être validée à l\'entrée.',
  async () => {
    await go('/admin/checking')
    await search('AMEGAN')
    const canValidate = await ev(() => { const c = window.__t.checkCard('Yao AMEGAN'); return !!(c && window.__t.find('button', 'Valider l\'entrée', c)) })
    assert(!canValidate, 'Yao AMEGAN (réservation annulée) reste validable au checking')
    return 'La réservation annulée n\'est plus proposée au checking.'
  })

await T('TF-37', 'Supervision', 'Journal d\'audit',
  'Consulter le « Journal d\'audit » de /admin/supervision.',
  'Les actions Création, Check-in, Réassignation, Annulation sont tracées avec leur auteur.',
  async () => {
    await go('/admin/supervision')
    const txt = await bodyText()
    for (const a of ['Création', 'Check-in', 'Réassignation', 'Annulation', 'par Akosua KPOTO', 'par Mme AFIA Kodjo', 'par Administrateur SALT']) assert(txt.includes(a), `${a} absent`)
    return 'Toutes les actions sont tracées (date/heure, référence, auteur).'
  })

await T('TF-38', 'Supervision', 'Suppression définitive avec confirmation',
  'Cliquer la corbeille sur la réservation AMEGAN puis confirmer « Oui ».',
  'Réservation retirée de la liste, audit « Suppression ».',
  async () => {
    await ev(() => window.__t.row('AMEGAN').querySelector('button[title="Supprimer définitivement"]').click())
    await sleep(200)
    const confirm = await ev(() => !!window.__t.row('AMEGAN').querySelector('button[title="Confirmer la suppression"]'))
    await ev(() => window.__t.row('AMEGAN').querySelector('button[title="Confirmer la suppression"]').click())
    await sleep(400)
    const gone = await ev(() => !window.__t.row('AMEGAN'))
    const txt = await bodyText()
    assert(confirm && gone && txt.includes('Suppression définitive'), 'Suppression non effective')
    return 'Demande de confirmation affichée, ligne supprimée, audit « Suppression ».'
  })

// ---------------------------------------------------------------- 7. Exports
const exportCard = (title, btn) => ev((t, b) => {
  const card = [...document.querySelectorAll('div.card')].find(c => c.querySelector('p.font-mono')?.textContent.includes(t))
  window.__t.click('button', b, card)
}, title, btn)

await T('TF-39', 'Exports', 'Export PDF « État passagers »',
  '/admin/exports → carte « ÉTAT PASSAGERS & CONTRÔLE » → « Exporter PDF ».',
  'Fichier PDF téléchargé et valide.',
  async () => {
    await go('/admin/exports')
    await exportCard('ÉTAT PASSAGERS', 'Exporter PDF')
    const f = await waitFile(/^etat-passagers-salt-.*\.pdf$/)
    const head = fs.readFileSync(f.full).subarray(0, 5).toString()
    assert(head === '%PDF-' && f.size > 1000, 'PDF invalide')
    return `${f.name} (${Math.round(f.size / 1024)} Ko, en-tête %PDF valide).`
  })

await T('TF-40', 'Exports', 'Export Excel « Registre des réservations »',
  'Carte « REGISTRE DES RÉSERVATIONS » → « Exporter Excel » ; ouvrir le fichier.',
  'Fichier .xlsx lisible contenant les en-têtes et les réservations (dont AF 999).',
  async () => {
    await exportCard('REGISTRE DES RÉSERVATIONS', 'Exporter Excel')
    const f = await waitFile(/^registre-reservations-salt-.*\.xlsx$/)
    const wb = XLSX.readFile(f.full)
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })
    const flat = rows.flat().join(' ')
    assert(flat.includes('N° VOL') && flat.includes('AF 999'), 'Contenu Excel incorrect')
    return `${f.name} : feuille « ${wb.SheetNames[0]} », ${rows.length} lignes, AF 999 présent.`
  })

await T('TF-41', 'Exports', 'Export PDF « Bilan d\'activité »',
  'Carte « BILAN D\'ACTIVITÉ DES SALONS » → « Exporter PDF ».',
  'Fichier PDF du rapport d\'activité téléchargé.',
  async () => {
    await exportCard('BILAN D\'ACTIVITÉ', 'Exporter PDF')
    const f = await waitFile(/^rapport-activite-salt-.*\.pdf$/)
    assert(f.size > 1000, 'PDF vide')
    return `${f.name} (${Math.round(f.size / 1024)} Ko).`
  })

await T('TF-42', 'Exports', 'Filtre par plage de dates',
  'Choisir « Par plage » du J+1 au J+10.',
  'Le total extrait se limite aux vols de la période (Koffi BIOVA, Yawa SAVI, Marc LAWSON).',
  async () => {
    const totalAll = await ev(() => Number(window.__t.find('div', 'Total extrait').querySelector('strong').textContent))
    await click('button', 'Par plage')
    await ev(async (a, b) => window.__t.fill(document, { 'Du': a, 'Au': b }), iso(plus(1)), iso(plus(10)))
    await sleep(300)
    const totalRange = await ev(() => Number(window.__t.find('div', 'Total extrait').querySelector('strong').textContent))
    assert(totalRange === 3 && totalRange < totalAll, `Toutes dates=${totalAll}, plage=${totalRange} au lieu de 3 : Koffi BIOVA (vol à J+3) exclu car le filtre utilise la date du 1er passager de la réservation (Afi ADJO, aujourd'hui)`)
    return `Total : ${totalAll} personnes (toutes dates) → ${totalRange} sur la plage.`
  })

await T('TF-43', 'Exports', 'Export CSV de l\'état passagers',
  '/admin/registre → « Exporter » → « CSV ».',
  'Fichier CSV contenant les entrées validées.',
  async () => {
    await go('/admin/registre')
    await click('button', 'Exporter')
    await click('button', 'CSV')
    const f = await waitFile(/^ETAT-PASSAGER-.*\.csv$/)
    const c = fs.readFileSync(f.full, 'utf8')
    assert(c.includes('TESTEUR') && c.includes('VALIDÉ PAR'), 'Contenu CSV incorrect')
    return `${f.name} : ${c.trim().split('\n').length - 1} ligne(s) de données.`
  })

await T('TF-44', 'Exports', 'Export Excel de la liste de checking',
  '/admin/checking → « Exporter la liste » → « Exporter en Excel ».',
  'Fichier .xlsx de la liste de checking.',
  async () => {
    await go('/admin/checking')
    await click('button', 'Exporter la liste')
    await click('button', 'Exporter en Excel')
    const f = await waitFile(/^checking-salt-.*\.xlsx$/)
    return `${f.name} (${Math.round(f.size / 1024)} Ko).`
  })

// ---------------------------------------------------------------- 8. Comptes
const openUserForm = () => click('button', 'Nouvel utilisateur')
const fillUser = (d) => ev(async d => {
  const form = document.querySelector('input[placeholder="Nom complet"]').parentElement
  const set = (ph, v) => window.__t.setVal(form.querySelector(`input[placeholder="${ph}"]`), v)
  set('Nom complet', d.name); set('Email de connexion', d.email); set('Mot de passe', d.pwd)
  await new Promise(r => setTimeout(r, 30))
  window.__t.setVal(form.querySelectorAll('select')[0], d.role)
  if (d.salon) window.__t.setVal(form.querySelectorAll('select')[1], d.salon)
  await new Promise(r => setTimeout(r, 30))
}, d)

await T('TF-45', 'Gestion des comptes', 'Création sans mot de passe',
  'Admin, /admin/systeme → « Nouvel utilisateur », saisir nom et email sans mot de passe → « Enregistrer ».',
  'Message « Nom, email et mot de passe requis », aucun compte créé.',
  async () => {
    await go('/admin/systeme')
    await openUserForm()
    await fillUser({ name: 'Test Incomplet', email: 'incomplet@salt.tg', pwd: '', role: 'hostess' })
    await clearToasts()
    await click('button', 'Enregistrer')
    const t = await toasts()
    const txt = await bodyText()
    assert(t.some(x => x.includes('requis')) && !txt.includes('incomplet@salt.tg\t'), `Toast : ${t}`)
    return `« ${t[0]} ».`
  })

await T('TF-46', 'Gestion des comptes', 'Création d\'une hôtesse puis connexion',
  'Créer « Hôtesse Recette » (recette.hotesse@salt.tg / Recette2026, Salon Plus), se déconnecter, se connecter avec ce compte.',
  'Compte créé ; connexion réussie avec le menu hôtesse.',
  async () => {
    await fillUser({ name: 'Hôtesse Recette', email: 'recette.hotesse@salt.tg', pwd: 'Recette2026', role: 'hostess', salon: 'Salon Plus' })
    await click('button', 'Enregistrer')
    const ok = await ev(() => !!window.__t.row('recette.hotesse@salt.tg'))
    const p = await login(['recette.hotesse@salt.tg', 'Recette2026'])
    const nav = await sidebar()
    assert(ok && p === '/admin/reservation' && nav.length === 4, `${ok} ${p} ${nav}`)
    return 'Compte créé et utilisable ; 4 menus hôtesse.'
  })

await T('TF-47', 'Gestion des comptes', 'Création d\'un protocole (code auto)',
  'Admin : créer « Protocole Recette » (rôle Protocole).',
  'Code protocole unique généré automatiquement (format PTC-XXXXXX).',
  async () => {
    await login(ACC.admin)
    await go('/admin/systeme')
    await openUserForm()
    await fillUser({ name: 'Protocole Recette', email: 'recette.proto@gouv.tg', pwd: 'Recette2026', role: 'protocole' })
    await clearToasts()
    await click('button', 'Enregistrer')
    const t = await toasts()
    const row = await ev(() => window.__t.row('recette.proto@gouv.tg')?.innerText || '')
    const code = (row.match(/PTC-[A-Z0-9]{6}/) || [])[0]
    assert(code && t.some(x => x.includes(code)), `Toast : ${t} / ${row}`)
    return `« ${t[0]} ».`
  })

await T('TF-48', 'Gestion des comptes', 'Désactivation d\'un compte',
  'Basculer le statut de recette.hotesse@salt.tg sur « Inactif » puis tenter de se connecter.',
  'Connexion refusée ; le compte est conservé (historique préservé).',
  async () => {
    await ev(() => window.__t.row('recette.hotesse@salt.tg').querySelector('button.chip').click())
    await sleep(300)
    const st = await ev(() => window.__t.row('recette.hotesse@salt.tg').innerText)
    const p = await login(['recette.hotesse@salt.tg', 'Recette2026'])
    assert(st.includes('Inactif') && p === '/connexion', `${st} / ${p}`)
    return 'Statut « Inactif » ; connexion refusée (« compte inactif »).'
  })

await T('TF-49', 'Gestion des comptes', 'Import CSV de protocoles',
  'Importer un CSV (nom,prenom,email,telephone,societe,code) contenant 1 protocole, puis réimporter le même fichier.',
  '1er import : « 1 protocole(s) importé(s) » ; 2e import : doublon ignoré.',
  async () => {
    await login(ACC.admin)
    await go('/admin/systeme')
    const csv = path.join(ROOT, 'downloads', 'import-protocoles.csv')
    fs.writeFileSync(csv, 'nom,prenom,email,telephone,societe,code\nIMPORT,Kafui,kafui.import@gouv.tg,+228 90 99 99 99,Ministère de la Santé,PTC-IMP001\n')
    const up = async () => {
      await clearToasts()
      const input = await page.$('input[type=file]')
      await input.uploadFile(csv)
      await sleep(600)
      return (await toasts())[0] || ''
    }
    const t1 = await up()
    const t2 = await up()
    assert(t1.includes('1 protocole(s) importé(s)') && t2.includes('Aucun nouveau protocole'), `${t1} / ${t2}`)
    return `« ${t1} » puis « ${t2} ».`
  })

await T('TF-50', 'Gestion des comptes', 'Export de la liste des protocoles',
  '« Exporter protocoles » → « Excel ».',
  'Fichier .xlsx du répertoire des protocoles.',
  async () => {
    await click('button', 'Exporter protocoles')
    await click('button', 'Excel')
    const f = await waitFile(/^protocoles-salt-.*\.xlsx$/)
    const wb = XLSX.readFile(f.full)
    const flat = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).flat().join(' ')
    assert(flat.includes('PTC-KODJO1') && flat.includes('PTC-IMP001'), 'Contenu incomplet')
    return `${f.name} contenant les protocoles (dont l'importé PTC-IMP001).`
  })

await T('TF-51', 'Administration', 'Ajout d\'une compagnie aérienne',
  'Onglet « Compagnies » → « Ajouter » : Air Burkina / 2J → « Enregistrer ».',
  'Compagnie ajoutée à la liste.',
  async () => {
    await click('button', 'Compagnies')
    await click('button', 'Ajouter')
    await ev(() => {
      window.__t.setVal(document.querySelector('input[placeholder="Nom"]'), 'Air Burkina')
      window.__t.setVal(document.querySelector('input[placeholder="Code"]'), '2J')
    })
    await sleep(100)
    await click('button', 'Enregistrer')
    const txt = await bodyText()
    assert(txt.includes('Air Burkina (2J)'), 'Compagnie absente')
    return '« Air Burkina (2J) » affichée.'
  })

await T('TF-52', 'Administration', 'Sauvegarde manuelle des données',
  'Onglet « Sécurité » → « Déclencher une sauvegarde ».',
  'Fichier JSON téléchargé contenant comptes, salons et compagnies ; événement journalisé.',
  async () => {
    await click('button', 'Sécurité')
    await click('button', 'Déclencher une sauvegarde')
    const f = await waitFile(/^sauvegarde-salt-.*\.json$/)
    const j = JSON.parse(fs.readFileSync(f.full, 'utf8'))
    const txt = await bodyText()
    assert(j.accounts?.length >= 7 && j.compagnies?.length && txt.includes('Sauvegarde manuelle'), 'Sauvegarde incomplète')
    return `${f.name} : ${j.accounts.length} comptes, ${j.salons.length} salons, ${j.compagnies.length} compagnies.`
  })

// ---------------------------------------------------------------- 9. Analytics & transversal
await T('TF-53', 'Analytics', 'Tableau de bord',
  'Ouvrir /admin/analytics.',
  'Indicateurs (KPI) et graphiques affichés.',
  async () => {
    await go('/admin/analytics')
    await sleep(600)
    const n = await ev(() => document.querySelectorAll('.recharts-surface').length)
    const txt = await bodyText()
    assert(n >= 3 && txt.includes('Passagers'), `${n} graphiques`)
    return `${n} graphiques rendus + 4 KPI.`
  })

await T('TF-54', 'Persistance', 'Conservation des données après rechargement',
  'Recharger le navigateur (F5) sur /admin/planning.',
  'Session et réservations conservées.',
  async () => {
    await go('/admin/planning')
    await page.reload({ waitUntil: 'networkidle0' })
    await sleep(300)
    const txt = await bodyText()
    assert(pathname() === '/admin/planning' && txt.includes('TESTEUR'), 'Données perdues')
    return 'Toujours connecté, réservation AF 999 / TESTEUR présente.'
  })

await T('TF-55', 'Interface', 'Thème sombre',
  'Cliquer « Thème sombre » puis recharger la page.',
  'Passage en thème sombre, conservé après rechargement.',
  async () => {
    await click('aside button', 'Thème sombre')
    await page.reload({ waitUntil: 'networkidle0' })
    const dark = await ev(() => document.documentElement.classList.contains('dark'))
    await click('aside button', 'Thème clair')
    assert(dark, 'Thème non appliqué')
    return 'Classe « dark » appliquée et mémorisée.'
  })

await T('TF-56', 'Responsive', 'Navigation sur PC',
  'Fenêtre 1440×900, espace admin.',
  'Barre latérale visible, barre inférieure mobile masquée.',
  async () => {
    const st = await ev(() => ({ aside: getComputedStyle(document.querySelector('aside')).display, bottom: getComputedStyle(document.querySelector('.bottom-nav')).display }))
    assert(st.aside === 'flex' && st.bottom === 'none', JSON.stringify(st))
    return 'Sidebar affichée, barre inférieure masquée.'
  })

await T('TF-57', 'Responsive', 'Navigation sur téléphone (admin)',
  'Viewport 390×844 ; ouvrir le menu « Plus » de la barre inférieure.',
  'Barre inférieure visible, sidebar masquée ; « Plus » donne accès à Supervision, Exports, Analytics, Comptes.',
  async () => {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await go('/admin/checking')
    const st = await ev(() => ({ aside: getComputedStyle(document.querySelector('aside')).display, bottom: getComputedStyle(document.querySelector('.bottom-nav')).display }))
    await click('.bottom-nav button', 'Plus')
    const txt = await bodyText()
    assert(st.aside === 'none' && st.bottom === 'flex' && ['Supervision', 'Exports', 'Analytics', 'Comptes'].every(x => txt.includes(x)), JSON.stringify(st))
    return 'Barre inférieure à icônes ; menu « Plus » complet.'
  })

await T('TF-58', 'Responsive', 'Navigation sur téléphone (protocole)',
  'Viewport 390×844, connecté en protocole.',
  'Barre inférieure : Réserver, Mes demandes, Sortir.',
  async () => {
    await login(ACC.proto)
    const items = await ev(() => [...document.querySelectorAll('.bottom-nav a, .bottom-nav button')].map(e => e.innerText.trim()))
    const disp = await ev(() => getComputedStyle(document.querySelector('.bottom-nav')).display)
    await page.setViewport({ width: 1440, height: 900 })
    assert(disp === 'flex' && items.join('|') === 'Réserver|Mes demandes|Sortir', items.join('|'))
    return `Barre inférieure : ${items.join(', ')}.`
  })

await T('TF-59', 'Stabilité', 'Erreurs JavaScript pendant la recette',
  'Surveiller la console du navigateur pendant l\'ensemble des scénarios.',
  'Aucune erreur JavaScript.',
  async () => {
    assert(pageErrors.length === 0, `${pageErrors.length} erreur(s) : ${pageErrors.slice(0, 3).join(' | ')}`)
    return 'Aucune erreur JavaScript relevée.'
  })

await browser.close()

fs.writeFileSync(path.join(ROOT, 'resultats-tests.json'), JSON.stringify({ date: new Date().toISOString(), results }, null, 2))
const ok = results.filter(r => r.status === 'Réussi').length
console.log(`\n${ok}/${results.length} tests réussis`)
for (const r of results.filter(r => r.status !== 'Réussi')) console.log(`  ✗ ${r.id} ${r.name} : ${r.obtained}`)
