# -*- coding: utf-8 -*-
"""Documentation technique et d'utilisation de SALT VIP."""
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = Path(__file__).parent
FIG = ROOT / "figures"
OUT = ROOT.parent / "Documentation_fonctionnement_SALT_VIP.docx"
NAVY = RGBColor(0x0B, 0x1C, 0x33)


def font(run, size=12, bold=False, italic=False, color=None, name="Times New Roman"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color


def page_num(paragraph):
    run = paragraph.add_run()
    b = OxmlElement("w:fldChar")
    b.set(qn("w:fldCharType"), "begin")
    i = OxmlElement("w:instrText")
    i.set(qn("xml:space"), "preserve")
    i.text = " PAGE "
    e = OxmlElement("w:fldChar")
    e.set(qn("w:fldCharType"), "end")
    run._r.extend([b, i, e])
    font(run, 11)


def setup():
    doc = Document()
    for s in doc.sections:
        s.top_margin = Cm(2.2)
        s.bottom_margin = Cm(2.2)
        s.left_margin = Cm(2.5)
        s.right_margin = Cm(2.2)
        s.page_width = Cm(21)
        s.page_height = Cm(29.7)
        s.footer_distance = Cm(1.2)
        p = s.footer.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run("SALT VIP — Documentation de fonctionnement  ·  ")
        font(r, 9, italic=True, color=NAVY)
        page_num(p)
    st = doc.styles["Normal"]
    st.font.name = "Times New Roman"
    st.font.size = Pt(12)
    st._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    st.paragraph_format.line_spacing = 1.15
    st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return doc


def P(doc, text, *, size=12, bold=False, italic=False, center=False, after=8, color=None):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(after)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(text)
    font(r, size=size, bold=bold, italic=italic, color=color)
    return p


def H(doc, text, level=1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(16 if level > 1 else 22)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.keep_with_next = True
    sizes = {1: 16, 2: 14, 3: 12}
    r = p.add_run(text)
    font(r, size=sizes.get(level, 12), bold=True, color=NAVY)
    return p


def bullet(doc, items):
    for t in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(t)
        font(r, 12)


def code(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.left_indent = Cm(0.4)
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), "F4F1EA")
    shading.set(qn("w:val"), "clear")
    p._p.get_or_add_pPr().append(shading)
    r = p.add_run(text)
    font(r, size=9, name="Consolas")
    return p


def caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(12)
    r = p.add_run(text)
    font(r, 10, italic=True, bold=True)


def fig(doc, name, title, width=15.0):
    path = FIG / name
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    if path.exists():
        p.add_run().add_picture(str(path), width=Cm(width))
    else:
        r = p.add_run(f"[Capture absente : {name}]")
        font(r, 10, italic=True)
    caption(doc, title)


def table(doc, title, headers, rows):
    cap = doc.add_paragraph()
    cap.paragraph_format.space_before = Pt(10)
    cap.paragraph_format.space_after = Pt(6)
    r = cap.add_run(title)
    font(r, 11, bold=True)
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]
        c.text = ""
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h)
        font(run, 10, bold=True, color=RGBColor(255, 255, 255))
        sh = OxmlElement("w:shd")
        sh.set(qn("w:fill"), "0B1C33")
        sh.set(qn("w:val"), "clear")
        c._tc.get_or_add_tcPr().append(sh)
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            c = t.rows[ri + 1].cells[ci]
            c.text = ""
            p = c.paragraphs[0]
            run = p.add_run(str(val))
            font(run, 10)
            if ri % 2 == 1:
                sh = OxmlElement("w:shd")
                sh.set(qn("w:fill"), "F7F4EE")
                sh.set(qn("w:val"), "clear")
                c._tc.get_or_add_tcPr().append(sh)
    doc.add_paragraph()


def br(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def build():
    doc = setup()

    P(doc, "SOCIÉTÉ AÉROPORTUAIRE DU TOGO", center=True, bold=True, size=13, color=NAVY)
    P(doc, "Aéroport International Gnassingbé Eyadema — Lomé", center=True, italic=True, size=12)
    P(doc, "DOCUMENTATION DE FONCTIONNEMENT", center=True, bold=True, size=20, color=NAVY)
    P(doc, "Application SALT VIP", center=True, bold=True, size=16)
    P(doc, "Guide d'utilisation, architecture technique et mise en œuvre des fonctionnalités", center=True, italic=True)
    P(doc, "Version prototype — août 2026", center=True, bold=True)
    br(doc)

    H(doc, "1. À quoi sert l'application", 1)
    P(doc, "SALT VIP est une application web interne destinée à gérer l'accueil des personnalités et délégations dans les salons VIP de l'aéroport de Lomé. Elle remplace les listes papier et les échanges informels par une chaîne unique : quelqu'un dépose une demande, le salon reçoit les noms, l'hôtesse valide l'entrée à l'arrivée, l'administrateur pilote les comptes et les exports.")
    P(doc, "Ce n'est pas un site grand public. On ne peut rien faire sans se connecter. Le rôle du compte (protocole, hôtesse ou administrateur) décide ensuite des écrans visibles.")
    fig(doc, "fig27_processus.png", "Figure 1 — Chaîne métier : dépôt, accueil, traçabilité")

    H(doc, "2. Comment lancer l'application", 1)
    P(doc, "Le projet est une application React construite avec Vite. Dans le dossier du projet, installer les dépendances puis démarrer le serveur de développement :")
    code(doc, "npm install\nnpm run dev")
    P(doc, "L'application s'ouvre ensuite dans le navigateur à l'adresse http://localhost:8443/. Toute visite de la racine (/) redirige vers la connexion si l'utilisateur n'est pas authentifié, ou vers son espace de travail s'il l'est déjà.")
    P(doc, "Scripts disponibles dans package.json : npm run dev (développement), npm run build (compilation de production), npm run preview (aperçu du build).")

    H(doc, "3. Comptes de démonstration", 1)
    P(doc, "Il n'y a pas encore de base de données distante. Les comptes sont stockés dans le navigateur (localStorage). Ils ne s'affichent nulle part dans l'interface. Pour tester :")
    table(doc, "Tableau 1 — Identifiants de démonstration",
          ["Rôle", "Email", "Mot de passe", "Arrivée après connexion"],
          [
              ["Administrateur", "admin@salt.tg", "SaltAdmin2026", "/admin/reservation"],
              ["Hôtesse", "akosua@salt.tg", "SaltHostess2026", "/admin/reservation"],
              ["Hôtesse (2)", "adjoua@salt.tg", "SaltHostess2026", "/admin/reservation"],
              ["Protocole", "afia@gouv.tg", "SaltProto2026", "/reservation"],
              ["Protocole (2)", "amara@boad.org", "SaltProto2026", "/reservation"],
          ])
    P(doc, "L'administrateur peut ensuite créer d'autres hôtesses et d'autres protocoles depuis la page Comptes. Un compte inactif ne peut plus se connecter.")

    H(doc, "4. Fonctionnement général", 1)
    P(doc, "Le parcours type est le suivant.")
    bullet(doc, [
        "Un protocole (ministère, ambassade, entreprise) se connecte et saisit une réservation : vol, salon (Solidarité ou Plus), date, heure, et une fiche par personne (nom, profession, nationalité, société).",
        "Une hôtesse peut aussi enregistrer la même demande si le protocole a appelé le salon plutôt que de saisir lui-même. Dans ce cas elle choisit le protocole concerné.",
        "À l'arrivée, l'hôtesse ouvre Checking, cherche le nom, puis clique sur Valider l'entrée. Le système mémorise qui a validé et à quelle heure.",
        "Le registre et les exports reprennent toutes les personnes, pas seulement un « passager principal ».",
        "L'administrateur supervise, exporte, consulte les indicateurs et gère les comptes.",
    ])
    fig(doc, "fig28_cycle.png", "Figure 2 — Logique de construction du logiciel (itérations)")

    H(doc, "5. Les trois rôles", 1)
    table(doc, "Tableau 2 — Droits par rôle",
          ["Fonction", "Protocole", "Hôtesse", "Administrateur"],
          [
              ["Se connecter", "Oui", "Oui", "Oui"],
              ["Créer une réservation", "Pour lui-même", "Pour un protocole", "Oui"],
              ["Voir ses demandes", "Oui", "Non (voit le registre)", "Oui"],
              ["Checking nominatif", "Non", "Oui", "Oui"],
              ["Planning / registre", "Non", "Oui", "Oui"],
              ["Supervision, exports, analytics", "Non", "Non", "Oui"],
              ["Créer hôtesses et protocoles", "Non", "Non", "Oui"],
          ])
    fig(doc, "fig26_rbac.png", "Figure 3 — Matrice des privilèges (RBAC)")
    P(doc, "Le contrôle n'est pas seulement visuel. Si une hôtesse tape /admin/systeme dans la barre d'adresse, le composant RequireAuth la renvoie vers /admin/reservation. Un protocole qui tente /admin est renvoyé vers /reservation.")

    br(doc)
    H(doc, "6. Technologies utilisées", 1)
    P(doc, "L'application est une Single Page Application (SPA) : une seule page HTML, le reste est géré en JavaScript dans le navigateur.")
    table(doc, "Tableau 3 — Stack technique",
          ["Couche", "Technologie", "Rôle dans le projet"],
          [
              ["Langage", "TypeScript 5.7", "Typer les rôles, réservations, passagers"],
              ["UI", "React 19", "Composants d'écran et formulaires"],
              ["Rendu", "React DOM 19", "Montage dans #root"],
              ["Build", "Vite 8", "Serveur local port 8443 et bundle"],
              ["Routes", "React Router 7", "Pages /connexion, /admin/..., etc."],
              ["Styles", "Tailwind CSS v4", "Classes utilitaires + variables CSS"],
              ["Icônes", "Lucide React", "Barre latérale et mobile"],
              ["Graphiques", "Recharts", "Page Analytics"],
              ["État métier", "Context React (AppStore)", "Session, comptes, réservations"],
              ["Stockage actuel", "localStorage", "Mode démo sans serveur de données"],
          ])
    P(doc, "Le point d'entrée est src/main.tsx, qui importe les styles globaux et monte App.tsx. App.tsx enveloppe tout dans AppProvider (le magasin d'état) puis déclare les routes.")
    code(doc, """// src/main.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""")

    H(doc, "7. Organisation du code", 1)
    table(doc, "Tableau 4 — Fichiers importants",
          ["Fichier", "Rôle"],
          [
              ["src/App.tsx", "Toutes les routes et gardes d'accès"],
              ["src/store/AppStore.tsx", "État global, authentification, métier"],
              ["src/components/RequireAuth.tsx", "Redirection si non connecté / mauvais rôle"],
              ["src/components/ReservationForm.tsx", "Formulaire protocole et hôtesse"],
              ["src/layouts/AdminLayout.tsx", "Barre latérale PC + barre bas mobile staff"],
              ["src/layouts/PublicLayout.tsx", "Coquille de l'espace protocole"],
              ["src/pages/public/Auth.tsx", "Écran de connexion"],
              ["src/pages/admin/*.tsx", "Écrans opérations SALT"],
              ["src/data/salons.ts", "Les 6 salons ; 2 réservables en ligne"],
              ["src/data/constants.ts", "Fonctions, nationalités, mouvements"],
              ["src/index.css", "Thème navy / or, boutons, inputs, bottom-nav"],
              ["vite.config.ts", "Alias @, plugins React et Tailwind, port 8443"],
          ])
    fig(doc, "fig18_architecture.png", "Figure 4 — Architecture logique (présentation, métier, persistance)")

    H(doc, "8. Authentification — comment c'est implémenté", 1)
    P(doc, "Il n'y a plus de choix de profil sur l'écran de connexion. L'utilisateur saisit email et mot de passe. Le store cherche un compte actif dont l'email (sans tenir compte de la casse) et le mot de passe correspondent.")
    fig(doc, "fig03_connexion.png", "Figure 5 — Page de connexion")
    code(doc, """// AppStore — authenticate
authenticate: (email, password) => {
  const found = accounts.find(a =>
    a.actif &&
    a.email.toLowerCase() === email.trim().toLowerCase() &&
    a.password === password
  )
  return found ?? null
}""")
    P(doc, "Si la recherche réussit, Auth.tsx appelle login() avec une session (id, nom, rôle, email, société, salon) puis redirige : protocole vers /reservation, staff vers /admin/reservation.")
    code(doc, """if (acc.role === 'protocole') navigate('/reservation')
else navigate('/admin/reservation')""")
    P(doc, "Les routes sont protégées ainsi :")
    code(doc, """<Route path="/connexion" element={<GuestOnly><Auth /></GuestOnly>} />
<Route element={<RequireAuth roles={['protocole']}><PublicLayout /></RequireAuth>}>
  <Route path="/reservation" element={<Reservation />} />
  <Route path="/mes-reservations" element={<MyReservations />} />
</Route>
<Route path="/admin" element={<RequireAuth roles={['admin', 'hostess']}><AdminLayout /></RequireAuth>}>
  ...
  <Route path="systeme" element={<RequireAuth roles={['admin']}><SystemAdmin /></RequireAuth>} />
</Route>""")
    P(doc, "RequireAuth : pas d'utilisateur → /connexion. Mauvais rôle → page d'accueil de ce rôle. GuestOnly : si déjà connecté, on ne réaffiche pas le login.")
    code(doc, """if (!user) return <Navigate to="/connexion" replace />
if (roles && !roles.includes(user.role)) {
  return <Navigate to={homeFor(user.role)} replace />
}""")
    P(doc, "La session est persistée dans localStorage sous la clé salt4-user. Fermer l'onglet ne déconnecte pas ; le bouton Déconnexion remet user à null.")

    br(doc)
    H(doc, "9. Guide des pages — espace protocole", 1)

    H(doc, "9.1. Nouvelle réservation (/reservation)", 2)
    P(doc, "C'est l'écran principal du protocole. Le composant Reservation.tsx affiche un en-tête puis ReservationForm avec variant=\"protocole\".")
    P(doc, "Le protocole n'a pas à se sélectionner lui-même : son identifiant, son nom et sa société sont repris du compte connecté. Il peut s'inclure comme première personne de la liste. Il indique le nombre d'accompagnateurs : le formulaire ajoute ou retire des fiches. Chaque fiche exige nom et prénoms, profession (liste : ministre, ambassadeur, etc.), nationalité et société.")
    P(doc, "Côté vol : numéro, mouvement (Arrivée / Départ / Transit), provenance ou destination, salon limité à Solidarité ou Plus, date et heure. Rien n'est envoyé tant que tous les champs obligatoires ne sont pas remplis.")
    fig(doc, "fig14_protocole_reservation.png", "Figure 6 — Formulaire de réservation protocole")
    code(doc, """const canSubmit =
  vol && provenance && date && heure && salon &&
  (isHostess ? protocoleId : true) &&
  pax.length > 0 &&
  pax.every(p => p.nomPrenoms && p.profession && p.nationalite && p.societe)""")
    P(doc, "À la soumission, addReservation crée un identifiant (uid), pose statut « à venir », superStatut « valide », et une ligne Passenger par personne avec checkedIn = false. Un toast confirme, puis un écran de succès propose une nouvelle saisie ou Mes réservations.")

    H(doc, "9.2. Mes demandes (/mes-reservations)", 2)
    P(doc, "La page filtre les réservations dont le protocoleId, le nom de protocole ou le créateur correspond à l'utilisateur connecté. Pour chaque demande on voit le vol, le salon, la date, et chaque accompagnateur avec son état de checking (en attente ou déjà entré).")
    fig(doc, "fig15_protocole_demandes.png", "Figure 7 — Suivi des demandes du protocole")
    P(doc, "Navigation : sur ordinateur, liens Réserver / Mes demandes dans le bandeau marine. Sur téléphone, barre du bas uniquement (la barre latérale n'existe pas dans cet espace). Bouton Déconnexion dans l'en-tête.")
    fig(doc, "fig17_mobile_protocole.png", "Figure 8 — Espace protocole sur mobile", 8.2)

    H(doc, "10. Guide des pages — hôtesse et administrateur", 1)
    P(doc, "Le shell AdminLayout affiche à gauche, à partir de 768 px, une barre marine avec icônes. En dessous de 768 px, cette barre disparaît et une barre inférieure apparaît. Sur PC, la barre du bas est volontairement masquée (règle CSS .bottom-nav { display: none } hors mobile).")
    fig(doc, "fig16_mobile_admin.png", "Figure 9 — Navigation mobile staff", 8.2)

    H(doc, "10.1. Réservation staff (/admin/reservation)", 2)
    P(doc, "Même formulaire que le protocole, mais variant=\"hostess\". L'hôtesse doit choisir le protocole pour lequel elle saisit (appel téléphonique ou passage au salon). Son nom est enregistré dans hotesseNom. L'administrateur voit le même écran, avec en plus le reste du menu.")
    fig(doc, "fig04_admin_reservation.png", "Figure 10 — Réservation côté administrateur")
    fig(doc, "fig12_hotesse_reservation.png", "Figure 11 — Même module côté hôtesse (menu plus court)")

    H(doc, "10.2. Checking (/admin/checking)", 2)
    P(doc, "Toutes les personnes de toutes les réservations sont aplaties en une liste. On peut basculer « À valider » / « Déjà entrés » et filtrer par nom, vol, protocole ou société. Le bouton Valider l'entrée appelle checkInPassenger.")
    fig(doc, "fig05_checking.png", "Figure 12 — Checking nominatif")
    code(doc, """checkInPassenger: (reservationId, passengerId, by) => {
  setReservations(list => list.map(r => {
    if (r.id !== reservationId) return r
    return {
      ...r,
      passengers: r.passengers.map(p => p.id === passengerId
        ? { ...p, checkedIn: true, checkedAt: fmtTime(), checkedBy: by }
        : p),
    }
  }))
  addAudit({ action: 'Check-in', resa: reservationId, user: by, detail: `Passager validé à l'entrée` })
}""")
    P(doc, "Un compteur rouge sur l'icône Checking de la barre latérale indique le nombre de personnes encore en attente.")

    H(doc, "10.3. Planning (/admin/planning)", 2)
    P(doc, "Tableau de type kanban (attendus / au salon / embarqués) utilisé comme centre de contrôle visuel des présences. On peut déplacer un VIP d'une colonne à l'autre et enregistrer un passage « flash ». Dans le prototype, ce kanban s'appuie encore sur un jeu vips parallèle aux passengers des réservations : à fusionner plus tard avec le checking réel.")
    fig(doc, "fig06_planning.png", "Figure 13 — Planning / centre de contrôle")

    H(doc, "10.4. Registre (/admin/registre)", 2)
    P(doc, "Vue tabulaire une ligne par accompagnateur : date, vol, provenance, nom, nationalité, profession, société, protocole, hôtesse, salon, statut d'entrée. Recherche textuelle et export CSV possible. C'est le document de travail du salon, calqué sur les colonnes historiques SALT.")
    fig(doc, "fig07_registre.png", "Figure 14 — Registre passagers")

    H(doc, "10.5. Pages administrateur uniquement", 2)
    P(doc, "Supervision (/admin/supervision) : compteurs en attente / validée / annulée, actions valider, annuler, réassigner un salon.")
    fig(doc, "fig08_supervision.png", "Figure 15 — Supervision")
    P(doc, "Exports (/admin/exports) : génération de RESERVATION.csv, ETAT PASSAGER.csv et rapport d'activité, filtrables par dates et salon. Le fichier est téléchargé dans le navigateur via un Blob (fonctions downloadFile et toCsv dans src/lib/utils.ts).")
    fig(doc, "fig09_exports.png", "Figure 16 — Centre d'exports")
    P(doc, "Analytics (/admin/analytics) : KPIs et graphiques Recharts (fréquentation, répartition). Une partie des séries est encore illustrative, en attendant le SGBD.")
    fig(doc, "fig10_analytics.png", "Figure 17 — Tableau de bord analytics")
    P(doc, "Comptes (/admin/systeme) : créer / modifier / désactiver un utilisateur. Rôles proposés : Hôtesse, Protocole, Administrateur. Autres onglets : capacités des salons, compagnies aériennes, logs et sauvegarde JSON.")
    fig(doc, "fig11_administration.png", "Figure 18 — Administration des comptes")
    code(doc, """addAccount: (a) => setAccounts(list => [{ ...a, id: uid('A') }, ...list])
updateAccount: (id, patch) => setAccounts(list => list.map(x => x.id === id ? { ...x, ...patch } : x))""")

    br(doc)
    H(doc, "11. Données métier — comment une réservation est construite", 1)
    P(doc, "Une réservation n'est pas une fiche unique. Elle contient un tableau passengers[]. Chaque personne a son propre checking. Les champs passager / prenom / nom / fonction en tête de réservation sont recopiés à partir de la première personne, pour rester compatible avec les anciens écrans.")
    fig(doc, "fig23_classes.png", "Figure 19 — Objets du domaine (Account, Reservation, Passenger)")
    fig(doc, "fig20_sequence_reservation.png", "Figure 20 — Séquence de création d'une réservation")
    fig(doc, "fig21_sequence_checking.png", "Figure 21 — Séquence du checking")
    P(doc, "Les six salons sont décrits dans src/data/salons.ts. Seuls Salon Solidarité et Salon Plus sont ouverts à la réservation en ligne (RESERVATION_SALONS). Les autres existent pour le paramétrage, le planning et les exports.")

    H(doc, "12. Persistance actuelle (sans base de données)", 1)
    P(doc, "Tout vit dans le navigateur. C'est volontaire pour le prototype : on peut se connecter et travailler sans serveur SQL. Conséquence : deux ordinateurs ne partagent pas les mêmes données, et vider le cache du navigateur remet les comptes de démonstration (clés salt4-accounts).")
    table(doc, "Tableau 5 — Clés localStorage",
          ["Clé", "Contenu"],
          [
              ["salt4-user", "Session (qui est connecté)"],
              ["salt4-accounts", "Liste des comptes"],
              ["salt3-resas", "Réservations et passagers"],
              ["salt3-audit", "Journal (création, check-in, etc.)"],
              ["salt-theme", "Thème clair ou sombre"],
              ["salt-vips / salt-salons / salt-cie", "Planning, salons, compagnies"],
          ])
    fig(doc, "fig24_mcd.png", "Figure 22 — Modèle déjà prévu pour un futur SGBD")
    fig(doc, "fig25_deploiement.png", "Figure 23 — Aujourd'hui Vite + localStorage ; demain API + PostgreSQL")
    P(doc, "Les mots de passe du prototype sont en clair dans le JSON local. En production il faudra un backend, un hachage (bcrypt / argon2) et HTTPS. Le MCD (compte, réservation, passager, salon, audit, compagnie) est déjà aligné sur ce passage.")

    H(doc, "13. Interface : design et mobile", 1)
    P(doc, "Les couleurs (marine #0B1C33, or #B8893A) et les composants (.btn-primary, .input, .card, .side-link) sont dans src/index.css. Les polices sont Plus Jakarta Sans (texte) et Sora (titres), chargées depuis Google Fonts.")
    P(doc, "La barre du bas (.bottom-nav) n'est affichée que sous 768 px. Au-delà, display: none, pour ne pas doubler la barre latérale sur PC. Le thème clair/sombre bascule la classe .dark sur <html>.")

    H(doc, "14. Mode d'emploi rapide par profil", 1)
    H(doc, "14.1. Protocole", 2)
    bullet(doc, [
        "Ouvrir http://localhost:8443/ et se connecter.",
        "Remplir le vol et le nombre de personnes, une fiche par nom.",
        "Enregistrer, noter la référence affichée.",
        "Suivre l'entrée réelle dans Mes demandes (statut checking).",
        "Se déconnecter en fin de saisie.",
    ])
    H(doc, "14.2. Hôtesse", 2)
    bullet(doc, [
        "Se connecter avec le compte hôtesse.",
        "Si un protocole téléphone : menu Réservation, choisir le protocole, saisir les noms.",
        "À l'arrivée d'un visiteur : Checking, taper le nom, Valider l'entrée.",
        "Consulter le registre en cas de doute sur une orthographe.",
        "Ne pas chercher les menus Exports ou Comptes : ils n'existent pas pour ce rôle.",
    ])
    H(doc, "14.3. Administrateur", 2)
    bullet(doc, [
        "Se connecter avec admin@salt.tg.",
        "Créer les comptes réels des hôtesses et protocoles (page Comptes).",
        "Superviser les demandes, réassigner un salon si besoin.",
        "Exporter le CSV du jour pour le secrétariat.",
        "Consulter Analytics pour un aperçu d'activité.",
        "Déclencher une sauvegarde JSON depuis l'onglet sécurité si nécessaire.",
    ])

    H(doc, "15. Cas d'utilisation résumé", 1)
    fig(doc, "fig19_usecase.png", "Figure 24 — Cas d'utilisation de l'application")
    fig(doc, "fig22_activite.png", "Figure 25 — Parcours d'activités (connexion → rôle → checking)")

    H(doc, "16. Limites du prototype et suite prévue", 1)
    bullet(doc, [
        "Pas de partage multi-postes (localStorage par navigateur).",
        "Mots de passe non hashés, pas d'API.",
        "Analytics encore partiellement illustratifs.",
        "Le kanban planning n'est pas encore branché exclusivement sur les passagers des réservations.",
        "Suite prévue : PostgreSQL (ou équivalent), API REST, JWT / session httpOnly, recette au Salon Solidarité.",
    ])

    H(doc, "17. Synthèse", 1)
    P(doc, "SALT VIP est une application React / TypeScript qui digitalise le dépôt de délégations et le checking nominatif des salons VIP de la SALT. On se connecte obligatoirement. Le protocole dépose, l'hôtesse accueille, l'administrateur pilote. Les écrans, les routes et le store (AppStore) implémentent ce découpage. Le prototype fonctionne sans base de données pour la démonstration ; le modèle de données est déjà prêt pour l'industrialisation.")

    doc.save(OUT)
    print("OK", OUT)


if __name__ == "__main__":
    build()
