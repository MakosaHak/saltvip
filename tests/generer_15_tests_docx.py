# Version condensée (15 tests fondamentaux) pour le mémoire — résultats issus de tests/resultats-passe1.json et resultats-passe2.json
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

TESTS = [
    ("Accès à une page sans être connecté", "Redirection vers la page de connexion", "Redirection vers /connexion", "Réussi"),
    ("Connexion avec un mot de passe erroné", "Accès refusé avec message d'erreur", "Message « Identifiants incorrects » affiché", "Réussi"),
    ("Connexion de l'administrateur", "Accès à l'espace administrateur complet", "Espace ouvert avec les 8 menus", "Réussi"),
    ("Déconnexion", "Fin de session, pages protégées inaccessibles", "Retour à la connexion, accès bloqué", "Réussi"),
    ("Hôtesse : accès par URL aux pages admin", "Accès refusé", "Redirection vers son espace", "Réussi"),
    ("Protocole : accès aux pages du staff", "Accès refusé", "Redirection vers son espace", "Réussi"),
    ("Réservation avec un champ obligatoire vide", "Enregistrement impossible", "Bouton d'enregistrement désactivé", "Réussi"),
    ("Réservation avec accompagnateurs", "Réservation enregistrée avec référence", "Confirmation et référence affichées", "Réussi"),
    ("Confidentialité entre protocoles", "Chaque protocole ne voit que ses demandes", "Seules ses réservations sont visibles", "Réussi"),
    ("Checking le jour du vol", "Entrée validée avec heure et agent", "Entrée validée, heure et agent enregistrés", "Réussi"),
    ("Checking avant le jour du vol", "Validation bloquée", "Bouton « Bloqué avant jour J »", "Réussi"),
    ("Checking d'un passager parmi plusieurs", "Seul ce passager est validé", "Seul le passager choisi est validé", "Réussi après correctif"),
    ("Checking d'une réservation annulée", "Validation impossible", "Réservation retirée du checking", "Réussi après correctif"),
    ("Export des registres (PDF, Excel)", "Fichiers générés et lisibles", "Fichiers téléchargés et lisibles", "Réussi"),
    ("Création d'un compte hôtesse par l'admin", "Compte créé et utilisable", "Connexion réussie avec le nouveau compte", "Réussi"),
]

doc = Document()
st = doc.styles['Normal']
st.font.name = 'Times New Roman'
st.font.size = Pt(12)
st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
for m in ('left_margin', 'right_margin'):
    setattr(doc.sections[0], m, Cm(2.5))


def para(text, size=12, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, after=6):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text)
    r.font.size, r.bold, r.italic = Pt(size), bold, italic


def shade(cell, color):
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:fill'), color)
    cell._tc.get_or_add_tcPr().append(shd)


doc.add_heading("4.1.7. Résultats des tests fonctionnels", level=3)
para("Les fonctionnalités fondamentales de l'application ont été testées en simulant l'utilisation réelle de chaque profil "
     "(administrateur, hôtesse, protocole). Le tableau 4.2 présente les résultats obtenus.")

para("Tableau 4.2 : Résultats des tests fonctionnels", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=4)
headers = ["N°", "Fonctionnalité testée", "Résultat attendu", "Résultat obtenu", "Statut"]
widths = [1.0, 4.6, 4.0, 4.4, 2.2]
t = doc.add_table(rows=1, cols=len(headers))
t.style = 'Table Grid'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, h in enumerate(headers):
    c = t.rows[0].cells[i]
    r = c.paragraphs[0].add_run(h)
    r.bold, r.font.size, r.font.color.rgb = True, Pt(10), RGBColor(0xFF, 0xFF, 0xFF)
    c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    shade(c, '0A3D5C')
for k, row in enumerate(TESTS, 1):
    cells = t.add_row().cells
    for i, v in enumerate((f"T{k:02d}",) + row):
        r = cells[i].paragraphs[0].add_run(v)
        r.font.size = Pt(10)
        if i == 4:
            r.bold = True
            r.font.color.rgb = RGBColor(0x1E, 0x7B, 0x3A)
        if i in (0, 4):
            cells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
for row in t.rows:
    for i, w in enumerate(widths):
        row.cells[i].width = Cm(w)
para("Source : Par nos soins", size=10, italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=10)

para("Commentaire : les 15 tests sont concluants. L'authentification, la séparation des rôles, la réservation, le checking "
     "et les exports fonctionnent comme prévu. Les tests T12 et T13 ont d'abord échoué : la validation d'un passager validait "
     "aussi un autre passager de la même réservation, et une réservation annulée pouvait encore être validée. Après correction "
     "du code, ces deux tests ont réussi. L'application répond donc aux besoins exprimés.")

out = 'Resultats_tests_fonctionnels_SALT_VIP_15_tests.docx'
doc.save(out)
print(out, 'généré')
