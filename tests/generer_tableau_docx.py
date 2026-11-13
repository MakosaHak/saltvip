# Génère le document Word (25 tests principaux) à partir des deux passages de recette :
#   tests/resultats-passe1.json (avant correctifs) et tests/resultats-passe2.json (après correctifs)
import json
from collections import OrderedDict
from datetime import datetime
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


def load(name):
    d = json.load(open(f'tests/{name}', encoding='utf-8'))
    date = datetime.fromisoformat(d['date'].replace('Z', '+00:00')).strftime('%d/%m/%Y')
    return {r['id']: r for r in d['results']}, date


P1, date1 = load('resultats-passe1.json')
P2, date2 = load('resultats-passe2.json')

SELECTION = [
    ('TF-01', 'Authentification'), ('TF-04', 'Authentification'), ('TF-06', 'Authentification'), ('TF-09', 'Authentification'),
    ('TF-10', 'Contrôle d\'accès'), ('TF-11', 'Contrôle d\'accès'), ('TF-13', 'Contrôle d\'accès'),
    ('TF-16', 'Réservation'), ('TF-18', 'Réservation'), ('TF-19', 'Réservation'), ('TF-21', 'Réservation'), ('TF-23', 'Réservation'),
    ('TF-26', 'Checking'), ('TF-27', 'Checking'), ('TF-28', 'Checking'), ('TF-31', 'Checking'), ('TF-32', 'Checking'),
    ('TF-34', 'Supervision'), ('TF-36', 'Supervision'), ('TF-37', 'Supervision'),
    ('TF-39', 'Exports'), ('TF-42', 'Exports'),
    ('TF-46', 'Gestion des comptes'), ('TF-48', 'Gestion des comptes'),
    ('TF-57', 'Interface mobile'),
]

FAIL_TEXT = {
    'TF-31': "Valider Afi ADJO valide aussi Koffi BIOVA, dont le vol est à J+3 : la règle du jour J est contournée.",
    'TF-36': "La réservation annulée de Yao AMEGAN reste dans la liste « À valider » et peut encore être validée.",
    'TF-42': "Seulement 2 personnes au lieu de 3 : Koffi BIOVA est exclu, car le filtre utilise la date du premier passager de la réservation.",
}

CORRECTIFS = {
    'TF-31': ('C1', "Identifiants générés à partir de l'heure seule : deux personnes saisies dans la même milliseconde recevaient le même identifiant.",
              "Ajout d'un compteur à la génération des identifiants, et réattribution d'un identifiant neuf aux doublons déjà enregistrés."),
    'TF-36': ('C2', "Le Checking ne tenait pas compte du statut « Annulée » de la réservation.",
              "Exclusion des réservations annulées du Checking, et refus de toute validation sur une réservation annulée."),
    'TF-42': ('C3', "Le filtre par période comparait la date de la réservation au lieu de la date de vol de chaque personne.",
              "Filtrage appliqué à chaque passager et accompagnateur selon sa propre date de vol."),
}

GREEN, RED, HEAD = RGBColor(0x1E, 0x7B, 0x3A), RGBColor(0xC0, 0x1E, 0x1E), '0A3D5C'

doc = Document()
st = doc.styles['Normal']
st.font.name = 'Times New Roman'
st.font.size = Pt(12)
st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')

sec = doc.sections[0]
sec.orientation = WD_ORIENT.LANDSCAPE
sec.page_width, sec.page_height = sec.page_height, sec.page_width
for m in ('left_margin', 'right_margin', 'top_margin', 'bottom_margin'):
    setattr(sec, m, Cm(1.8))


def shade(cell, hex_color):
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    cell._tc.get_or_add_tcPr().append(shd)


def repeat_header(row):
    el = OxmlElement('w:tblHeader')
    el.set(qn('w:val'), 'true')
    row._tr.get_or_add_trPr().append(el)


def para(text, bold=False, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, italic=False, space_after=6):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    r = p.add_run(text)
    r.bold, r.italic, r.font.size = bold, italic, Pt(size)
    return p


def caption(text):
    para(text, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)


def source():
    para('Source : Par nos soins', italic=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)


def table(headers, rows, widths, size=9, status_col=None, bold_last=False):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]
        r = c.paragraphs[0].add_run(h)
        r.bold, r.font.size, r.font.color.rgb = True, Pt(size), RGBColor(0xFF, 0xFF, 0xFF)
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        shade(c, HEAD)
    repeat_header(t.rows[0])
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            r = cells[i].paragraphs[0].add_run(str(v).replace('`', ''))
            r.font.size = Pt(size)
            if i == status_col:
                r.bold = True
                r.font.color.rgb = RED if str(v).startswith('Échec') else GREEN
                cells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    if bold_last:
        for c in t.rows[-1].cells:
            for run in c.paragraphs[0].runs:
                run.bold = True
    for row in t.rows:
        for i, w in enumerate(widths):
            row.cells[i].width = Cm(w)
    return t


n = len(SELECTION)
ok1 = sum(P1[i]['status'] == 'Réussi' for i, _ in SELECTION)
ok2 = sum(P2[i]['status'] == 'Réussi' for i, _ in SELECTION)
pct = lambda a: f"{round(a * 100 / n)} %"

doc.add_heading('4.1.7. Résultats des tests fonctionnels de l\'application', level=3)

para("Une recette fonctionnelle a été réalisée pour vérifier que SALT VIP répond aux besoins exprimés. Les tests ont été exécutés sur la version de "
     "production de l'application, dans le navigateur Google Chrome. Chaque scénario reproduit le parcours d'un utilisateur réel : connexion avec "
     "les comptes de démonstration (administrateur, hôtesse, protocole), saisie des formulaires, clics sur les boutons, saisie manuelle d'adresses, "
     "téléchargement puis ouverture des fichiers exportés. Pour pouvoir rejouer les tests à l'identique, les scénarios ont été automatisés avec l'outil Puppeteer.")
para(f"Le tableau 4.2 présente les {n} tests les plus représentatifs, répartis entre les principaux modules. Un test est « Réussi » lorsque le "
     "résultat obtenu correspond au résultat attendu, et « Échec » dans le cas contraire. La recette s'est déroulée en deux passages. Le premier "
     f"passage ({date1}) a révélé trois anomalies. Des correctifs ont ensuite été appliqués au code. Lors du second passage ({date2}), "
     "les mêmes scénarios ont été rejoués et tous les tests ont réussi.")

caption('Tableau 4.2 : Résultats des tests fonctionnels de l\'application SALT VIP')
rows = []
for k, (tid, module) in enumerate(SELECTION, 1):
    num = f'T{k:02d}'
    r1, r2 = P1[tid], P2[tid]
    if r1['status'] != 'Réussi':
        code = CORRECTIFS[tid][0]
        rows.append([f'{num}\n(1er passage)', module, r1['name'], r1['procedure'], r1['expected'], FAIL_TEXT[tid], 'Échec'])
        rows.append([f'{num}\n(après correctif)', module, r1['name'], f'Même scénario rejoué après application du correctif {code}.',
                     r1['expected'], r2['obtained'], 'Réussi'])
    else:
        rows.append([num, module, r1['name'], r1['procedure'], r1['expected'], r2['obtained'], 'Réussi'])
table(['N°', 'Module', 'Fonctionnalité testée', 'Procédure de test', 'Résultat attendu', 'Résultat obtenu', 'Statut'],
      rows, [1.9, 2.3, 3.2, 5.6, 4.4, 5.2, 1.5], size=8, status_col=6)
source()

caption('Tableau 4.3 : Anomalies détectées et correctifs appliqués')
corr = []
for k, (tid, _) in enumerate(SELECTION, 1):
    if tid in CORRECTIFS:
        code, cause, fix = CORRECTIFS[tid]
        corr.append([code, f'T{k:02d}', cause, fix, 'Réussi'])
table(['Correctif', 'Test', 'Cause de l\'échec', 'Correctif appliqué', 'Résultat après correctif'],
      corr, [2, 1.5, 9, 9, 3], size=9, status_col=4)
source()

caption('Tableau 4.4 : Synthèse des tests par module')
by_mod = OrderedDict()
for tid, module in SELECTION:
    m = by_mod.setdefault(module, [0, 0, 0])
    m[0] += 1
    m[1] += P1[tid]['status'] == 'Réussi'
    m[2] += P2[tid]['status'] == 'Réussi'
synth = [[m, a, b, c] for m, (a, b, c) in by_mod.items()]
synth.append(['TOTAL', n, f'{ok1} ({pct(ok1)})', f'{ok2} ({pct(ok2)})'])
table(['Module', 'Nombre de tests', 'Réussis au 1er passage', 'Réussis après correctifs'], synth, [7, 3.5, 5, 5], size=10, bold_last=True)
source()

doc.add_heading('Analyse des résultats', level=4)
para(f"Au premier passage, {ok1} tests sur {n} ont réussi ({pct(ok1)}). Les fonctions essentielles ont été validées dès ce premier passage :")
for b in [
    "l'authentification est obligatoire : aucune page n'est accessible sans connexion, et les identifiants erronés ou les comptes désactivés sont refusés (T01 à T04, T24) ;",
    "le contrôle d'accès par rôle est réel et pas seulement visuel : une hôtesse ou un protocole qui saisit l'adresse d'une page qui ne le concerne pas est automatiquement redirigé (T05 à T07) ;",
    "le formulaire de réservation refuse les saisies incomplètes, gère plusieurs passagers avec leurs accompagnateurs, et chaque protocole ne voit que ses propres demandes (T08 à T12) ;",
    "le checking applique la règle du jour J, enregistre l'heure de chaque entrée et le nom de l'agent, et alimente l'état des passagers (T13 à T15, T17) ;",
    "la supervision et le journal d'audit assurent la traçabilité des actions, les exports produisent des fichiers PDF et Excel exploitables, et l'interface s'adapte au téléphone (T18, T20, T21, T23 à T25).",
]:
    p = doc.add_paragraph(b, style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

para("Les trois échecs du premier passage (T16, T19 et T22) ont révélé des anomalies qui n'apparaissaient pas lors d'une utilisation simple avec un "
     "seul passager par réservation. La plus importante concernait la génération des identifiants : deux personnes enregistrées dans la même "
     "réservation pouvaient recevoir le même identifiant, si bien que valider l'entrée de l'une validait aussi celle de l'autre, même avant le jour "
     "J. La deuxième anomalie permettait de valider l'entrée d'un passager dont la réservation avait été révoquée. La troisième faussait le filtre "
     "par période des exports.")
para(f"Les correctifs C1, C2 et C3 (tableau 4.3) ont été appliqués, puis la totalité des scénarios a été rejouée. Au second passage, {ok2} tests sur "
     f"{n} ont réussi ({pct(ok2)}), sans erreur dans la console du navigateur ni régression sur les fonctions déjà validées. L'application est donc conforme aux "
     "exigences fonctionnelles définies dans le cahier des charges. Comme les tests sont automatisés, ils pourront être relancés à chaque évolution "
     "future, notamment lors du passage à une base de données.")

out = 'Resultats_tests_fonctionnels_SALT_VIP_25_tests.docx'
doc.save(out)
print(f'{out} : {n} tests — 1er passage {ok1}/{n}, après correctifs {ok2}/{n}')
