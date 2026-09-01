# -*- coding: utf-8 -*-
"""Génère la suite du mémoire ESIG (chapitre 2 à table des matières)."""
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn, nsmap
from docx.oxml import OxmlElement

ROOT = Path(__file__).parent
FIG = ROOT / "figures"
OUT = ROOT.parent / "Memoire_SALT_VIP_Chapitres_2_a_4.docx"

NAVY = RGBColor(0x0B, 0x1C, 0x33)
GOLD = RGBColor(0x8F, 0x6A, 0x28)


def set_run_font(run, size=13, bold=False, italic=False, color=None, name="Times New Roman"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    run._r.append(fld1)
    run._r.append(instr)
    run._r.append(fld2)
    set_run_font(run, 11)


def setup_doc():
    doc = Document()
    for s in doc.sections:
        s.top_margin = Cm(2.5)
        s.bottom_margin = Cm(2.5)
        s.left_margin = Cm(3.0)
        s.right_margin = Cm(2.0)
        s.page_width = Cm(21.0)
        s.page_height = Cm(29.7)
        footer = s.footer
        footer.is_linked_to_previous = False
        p = footer.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        add_page_number(p)
        # distance footer
        s.footer_distance = Cm(1.5)
    styles = doc.styles["Normal"]
    styles.font.name = "Times New Roman"
    styles.font.size = Pt(13)
    styles._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    pf = styles.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.space_after = Pt(0)
    pf.space_before = Pt(0)
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return doc


def P(doc, text, *, first=False, italic=False, bold=False, center=False, size=13, space_after=8):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold, italic=italic)
    return p


def H(doc, text, level=1):
    """Titres ESIG : gras, non soulignés, alignés à gauche, interligne 2 avant/après."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(24)
    p.paragraph_format.space_after = Pt(24)
    p.paragraph_format.line_spacing = 2.0
    p.paragraph_format.keep_with_next = True
    sizes = {0: 16, 1: 14, 2: 13, 3: 13}
    upper = level <= 1
    run = p.add_run(text.upper() if upper and level == 0 else text)
    if level == 0:
        run.bold = True
        set_run_font(run, size=16, bold=True, color=NAVY)
    elif level == 1:
        set_run_font(run, size=14, bold=True, color=NAVY)
    else:
        set_run_font(run, size=13, bold=True)
    return p


def caption(doc, text, kind="Figure"):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(text)
    set_run_font(run, size=11, italic=True, bold=True)


def source(doc, text="Source : réalisation personnelle, 2026"):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(12)
    run = p.add_run(text)
    set_run_font(run, size=10, italic=True)


def add_fig(doc, filename, title, width=15.4):
    path = FIG / filename
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    if path.exists():
        run = p.add_run()
        run.add_picture(str(path), width=Cm(width))
    else:
        run = p.add_run(f"[Image manquante : {filename}]")
        set_run_font(run, size=11, italic=True)
    caption(doc, title)
    source(doc)


def add_table(doc, title, headers, rows, src="Source : réalisation personnelle, 2026"):
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.LEFT
    cap.paragraph_format.space_before = Pt(12)
    cap.paragraph_format.space_after = Pt(6)
    r = cap.add_run(title)
    set_run_font(r, size=12, bold=True)

    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h)
        set_run_font(run, size=11, bold=True, color=RGBColor(255, 255, 255))
        shading = OxmlElement("w:shd")
        shading.set(qn("w:fill"), "0B1C33")
        shading.set(qn("w:val"), "clear")
        cell._tePr = cell._tc.get_or_add_tcPr()
        cell._tc.get_or_add_tcPr().append(shading)
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = table.rows[ri + 1].cells[ci]
            cell.text = ""
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if ci == 0 else WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(str(val))
            set_run_font(run, size=11)
            if ri % 2 == 1:
                sh = OxmlElement("w:shd")
                sh.set(qn("w:fill"), "F4F1EA")
                sh.set(qn("w:val"), "clear")
                cell._tc.get_or_add_tcPr().append(sh)
    source(doc, src)


def page_break(doc):
    p = doc.add_paragraph()
    run = p.add_run()
    run.add_break(WD_BREAK.PAGE)


def cite_italic(doc, before, quote, after, ref):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(8)
    r1 = p.add_run(before)
    set_run_font(r1)
    r2 = p.add_run(quote)
    set_run_font(r2, italic=True)
    r3 = p.add_run(after + " " + ref)
    set_run_font(r3)
    return p


def build():
    doc = setup_doc()

    # ----- Page d'accroche de la suite -----
    P(doc, "ÉCOLE SUPÉRIEURE D'INFORMATIQUE ET DE GESTION (ESIG)", center=True, bold=True, size=14)
    P(doc, "Mémoire de licence professionnelle en sciences informatiques", center=True, italic=True)
    P(doc, "SUITE DU MÉMOIRE — DU CHAPITRE 2 À LA TABLE DES MATIÈRES", center=True, bold=True, size=16)
    P(doc, "Conception et réalisation d'une application web de gestion des réservations des salons VIP de la Société Aéroportuaire du Togo (SALT) à l'Aéroport International Gnassingbé Eyadema", center=True, italic=True)
    P(doc, "Le présent fascicule reprend le mémoire à partir du chapitre 2, le début jusqu'au chapitre 1 ayant déjà été rédigé par l'étudiant. La pagination continue le corps du mémoire.", center=True, italic=True, size=12)
    P(doc, "Année académique 2024-2025", center=True, bold=True)
    page_break(doc)

    # ========== CHAPITRE 2 ==========
    H(doc, "CHAPITRE 2 : REVUE DE LITTÉRATURE", 0)
    H(doc, "Introduction du chapitre", 1)

    P(doc, "Le chapitre précédent a situé la thématique dans son environnement aéroportuaire et organisationnel. Il convient à présent de fonder scientifiquement le travail en précisant le vocabulaire, les modèles théoriques et les solutions déjà disponibles. Une revue documentaire n'a pas pour but d'épuiser la littérature mondiale : elle vise à extraire les notions indispensables à la compréhension du projet, puis à montrer en quoi l'existant laisse un vide que l'application SALT VIP entend combler.")
    P(doc, "La démarche retenue est celle d'un mémoire professionnel. Comme le rappelle le guide de rédaction de l'ESIG, le texte doit rester tourné vers la pratique, tout en s'appuyant sur des références académiques présentées selon la norme APA. Les concepts sont donc définis, ensuite confrontés à des travaux similaires (systèmes d'information aéroportuaires, applications web métier, contrôle d'accès), enfin critiqués afin d'identifier les lacunes.")

    H(doc, "2.1. Définition des concepts clés", 1)
    P(doc, "La clarté du vocabulaire est une condition de la rigueur. Plusieurs termes, d'apparence familière, recouvrent des réalités distinctes dans le contexte des salons d'honneur de l'AIGE. Les définitions ci-dessous serviront de fil conducteur aux chapitres empiriques.")

    H(doc, "2.1.1. Système d'information et application web métier", 2)
    P(doc, "Un système d'information (SI) désigne l'ensemble organisé des ressources (humaines, matérielles, logicielles et organisationnelles) permettant de collecter, stocker, traiter et diffuser de l'information au sein d'une organisation (Reix et al., 2016). Dans un aéroport, le SI n'est pas un simple outil bureautique : il relie des métiers (accueil, sûreté, commercial, protocole) dont les temporisations sont très courtes.")
    P(doc, "L'application web constitue une modalité contemporaine du SI. Contrairement à un logiciel installé poste par poste, elle s'exécute dans un navigateur et se déploie plus facilement auprès d'utilisateurs dispersés (hôtesses en salon, protocoles en ville, administrateurs au siège). Pressman et Maxim (2015) soulignent que le génie logiciel web combine des exigences de qualité classiques (fiabilité, maintenabilité) et des exigences d'usage (rapidité perçue, lisibilité, adaptation mobile).")
    cite_italic(doc, "Sommerville (2016) rappelle que ", "« le logiciel n'est pas seulement un programme : il comprend aussi la documentation et les données de configuration nécessaires à son fonctionnement »", ".", "(Sommerville, 2016)")
    P(doc, "Dans le cas présent, l'application SALT VIP n'est donc pas un site vitrine. C'est un outil de production : chaque réservation, chaque checking, chaque export alimente une chaîne de traçabilité. Le choix d'une application monopage (Single Page Application, SPA) s'inscrit dans cette logique d'outil quotidien, où la navigation interne ne doit pas recharger inutilement l'ensemble de l'interface.")

    H(doc, "2.1.2. Salon VIP aéroportuaire et service d'honneur", 2)
    P(doc, "Un salon VIP aéroportuaire est un espace d'accueil différencié, réservé à des passagers bénéficiant d'un statut particulier (personnalités, délégations, voyageurs d'affaires, invités de l'exploitant). À Lomé, la SALT gère six salons (Solidarité, Plus, Paix Arrivée, Paix Départ, Union, Denyigban). Le service d'honneur ne se limite pas au confort : il comporte une dimension protocolaire, diplomatique et de sûreté.")
    P(doc, "La littérature aéroportuaire, notamment les manuels de l'Airport Council International et les référentiels IATA, insiste sur la qualité de service au sol (ground experience) comme composante de la compétitivité d'une plateforme. Un salon mal organisé produit des files, des erreurs d'identité et une perte d'image pour l'État hôte. D'où l'intérêt d'un SI capable de relier, avant l'arrivée du vol, la liste nominative des personnes attendues et, à l'entrée du salon, le contrôle réel.")

    H(doc, "2.1.3. Protocole, hôtesse et administrateur", 2)
    P(doc, "Trois rôles structurent le métier observé. L'officier de protocole représente une institution (ministère, ambassade, organisation internationale, entreprise) et dépose la demande d'accueil. L'hôtesse de salon, agent de la SALT, reçoit les appels, saisit éventuellement la réservation et, surtout, valide l'entrée physique. L'administrateur pilote le dispositif : comptes, supervision, exports, statistiques.")
    P(doc, "Cette tripartition n'est pas un artifice informatique. Elle correspond à une séparation des responsabilités (separation of duties), principe classique de contrôle interne (COSO, 2013). Un protocole ne doit pas pouvoir s'auto-accorder des privilèges d'administration ; une hôtesse n'a pas à créer des comptes ; un administrateur, en revanche, doit pouvoir créer hôtesses et protocoles. Le modèle RBAC (Role-Based Access Control) formalise précisément cette idée : les droits sont attachés à un rôle, non à une personne isolée (Ferraiolo et Kuhn, 1992 ; Sandhu et al., 1996).")

    H(doc, "2.1.4. Réservation, accompagnateur et checking nominatif", 2)
    P(doc, "La réservation, dans ce mémoire, n'est pas une réservation hôtelière classique. Elle relie un vol (numéro, mouvement, provenance ou destination, date, heure), un salon (Solidarité ou Plus pour le dépôt), un protocole responsable et une liste d'accompagnateurs. Chaque accompagnateur est une personne physique identifiée par nom et prénoms, profession, nationalité et société.")
    P(doc, "Le checking à l'arrivée désigne l'acte par lequel l'hôtesse, face au voyageur, recherche le nom dans le système et marque l'entrée comme effective. Il ne s'agit pas d'un enregistrement compagnie aérienne (check-in bagage / carte d'embarquement), mais d'un contrôle d'accès au salon. La traçabilité (qui a validé, à quelle heure) est essentielle pour le registre quotidien, document encore souvent tenu sur papier dans les aéroports ouest-africains.")

    H(doc, "2.1.5. Authentification, habilitation et audit", 2)
    P(doc, "L'authentification établit l'identité déclarée (ici : email et mot de passe). L'habilitation (autorisation) détermine ce que cette identité a le droit de faire. L'audit consigne les actions sensibles (création, checking, annulation, sauvegarde). Ces trois couches correspondent au triptyque AAA (Authentication, Authorization, Accounting) largement utilisé en sécurité des systèmes (Stallings et Brown, 2018).")
    P(doc, "OWASP (2021) place les défaillances d'identification et de contrôle d'accès parmi les risques majeurs des applications web. Une application de salon VIP qui resterait accessible sans connexion, ou qui afficherait des comptes de démonstration à l'écran, violerait ce principe. D'où le choix, dans la réalisation, d'une authentification obligatoire avant tout écran métier.")

    H(doc, "2.1.6. Expérience utilisateur et interface adaptative", 2)
    P(doc, "L'utilisabilité est « la mesure dans laquelle un produit peut être utilisé par des utilisateurs spécifiés pour atteindre des buts spécifiés avec efficacité, efficience et satisfaction » (ISO 9241-11, 2018). Nielsen (1994) a popularisé des heuristiques (visibilité du statut, correspondance avec le monde réel, prévention des erreurs) encore pertinentes pour un écran d'hôtesse en situation de rush.")
    P(doc, "L'interface adaptative (responsive design) n'est plus un luxe : une partie du personnel se déplace avec un téléphone. Le guide de ce projet impose une barre de navigation inférieure sur mobile et une barre latérale sur poste de travail. Cette distinction relève de l'ergonomie des patterns de navigation (Budiu, 2015).")

    H(doc, "2.2. Synthèse des recherches et travaux similaires", 1)

    H(doc, "2.2.1. Études antérieures, modèles théoriques et solutions existantes", 2)

    H(doc, "2.2.1.1. Modèles de conception logicielle", 3)
    P(doc, "Le génie logiciel dispose de plusieurs grilles pour passer du besoin au logiciel. Le Processus Unifié (UP) et son profil 2TUP (Two Tracks Unified Process) distinguent une branche fonctionnelle et une branche technique, ce qui convient bien à un mémoire professionnel : d'un côté les cas d'utilisation métier, de l'autre les choix d'architecture (Roques et Vallée, 2007). UML fournit le langage commun (cas d'utilisation, séquences, classes, activités, déploiement) (Booch et al., 2005).")
    P(doc, "Côté données, la méthode MERISE reste enseignée dans les écoles d'informatique francophones. Le MCD (modèle conceptuel de données) prépare le passage à un SGBD, même si le prototype actuel persiste encore en localStorage. Cette dualité n'est pas contradictoire : on conçoit déjà le schéma cible pendant que l'on démontre le métier sans serveur de base de données (Tardieu et al., 2000).")
    P(doc, "Les architectures web contemporaines s'organisent souvent en couches : présentation, application, persistance. Fowler (2003) a décrit les principaux styles. La SPA React correspond à une présentation riche, l'état applicatif étant, dans notre cas, centralisé dans un magasin (store) inspiré du patron Observer. Ce choix sera justifié au chapitre 3.")

    H(doc, "2.2.1.2. Solutions aéroportuaires et de lounge management", 3)
    P(doc, "Sur le marché international, plusieurs familles de solutions existent. Les programmes de salons (Priority Pass, LoungeKey, Plaza Premium) gèrent surtout l'éligibilité d'un voyageur porteur d'une carte. Les DCS (Departure Control Systems) des compagnies gèrent l'enregistrement et l'embarquement. Les AODB (Airport Operational Database) centralisent les données de vols d'une plateforme. Aucun de ces systèmes n'est, en l'état, un outil de protocole diplomatique local, centré sur une liste d'accompagnateurs déposée par un officier de protocole togolais.")
    P(doc, "Des travaux académiques africains ont porté sur la digitalisation de services publics et aéroportuaires (guichets uniques, e-visa, suivi de bagages). Ils convergent vers un constat : le papier reste présent, les Excel disparates se multiplient, et l'absence d'une source unique de vérité produit des écarts entre la liste attendue et les personnes réellement présentes. Notre application vise précisément cette source unique au niveau des salons SALT.")

    add_table(
        doc,
        "Tableau 1 : Comparaison des familles de solutions existantes",
        ["Famille", "Objet principal", "Limite vis-à-vis du besoin SALT"],
        [
            ["Programmes de lounges internationaux", "Éligibilité carte / abonnement", "Pas de fiche d'accompagnateurs ni de protocole d'État"],
            ["DCS compagnie", "Enregistrement et siège", "Ne couvre pas l'accueil salon SALT"],
            ["AODB aéroport", "Horaires et ressources piste", "Trop large, peu adapté au protocole VIP"],
            ["Registre papier / Excel", "Liste du jour", "Pas de rôles, pas d'audit, double saisie"],
            ["SALT VIP (présent travail)", "Réservation + checking nominatif", "Prototype encore sans SGBD central"],
        ],
        "Source : synthèse personnelle à partir de la littérature professionnelle aéroportuaire, 2026",
    )

    H(doc, "2.2.1.3. Authentification et applications métier web", 3)
    P(doc, "Les travaux sur l'IAM (Identity and Access Management) recommandent une authentification unique, des mots de passe robustes, puis, en production, une authentification multifactorielle (NIST SP 800-63B, 2017). Pour un prototype de licence, un couple email / mot de passe associé à un rôle stocké côté compte est un premier cran acceptable, à condition que l'écran de connexion ne divulgue pas les identifiants et que les routes soient protégées.")
    P(doc, "React Router, combiné à un garde (guard) de type RequireAuth, illustre le patron Front Controller / Filter : toute ressource métier passe par un contrôle de session. Ce mécanisme, simple, évite l'erreur fréquente des démonstrations universitaires où l'on peut « entrer en tant qu'admin » par un bouton magique.")

    H(doc, "2.2.2. Identification des lacunes des travaux existants", 2)
    P(doc, "La revue fait apparaître cinq lacunes que le projet adresse.")
    P(doc, "Premièrement, le métier protocole / hôtesse / administrateur n'est pas modélisé dans les lounges internationaux, pensés pour un passager autonome muni d'une carte. Deuxièmement, le checking nominatif (recherche par nom d'accompagnateur, validation d'entrée, horodatage) est rarement le cœur du logiciel : on trouve plutôt des QR codes, peu adaptés à une délégation diplomatique. Troisièmement, les registres SALT historiques (colonnes VOL, PROVENANCE, NOMS ET PRÉNOMS, PROFESSION, SOCIÉTÉ, HÔTESSE, PROTOCOLE) n'étaient pas reproduits à l'export. Quatrièmement, l'administration des comptes (créer une hôtesse, créer un protocole) restait hors système. Cinquièmement, l'ergonomie mobile des outils internes reste souvent un report d'écran PC illisible sur téléphone.")
    P(doc, "Ces lacunes justifient une application spécifique, ancrée dans les pratiques de l'AIGE, plutôt que l'achat d'un progiciel générique inadapté.")

    add_fig(doc, "fig27_processus.png", "Figure 1 : Processus métier en deux étapes (dépôt puis accueil)", 15.2)

    H(doc, "Conclusion du chapitre", 1)
    P(doc, "Ce chapitre a défini les notions de SI, d'application web, de salon VIP, de rôles, de réservation, de checking, d'authentification et d'utilisabilité. Il a situé le projet par rapport aux familles de solutions aéroportuaires et aux modèles UML / MERISE / RBAC. Les lacunes identifiées — absence d'un outil local de protocole, faiblesse du checking nominatif, registres non informatisés, comptes non administrés, mobile négligé — constituent le cahier des charges implicite de la partie empirique. Le chapitre 3 exposera la méthode et la mise en œuvre concrète de l'application.")

    page_break(doc)

    # ========== PARTIE 2 ==========
    H(doc, "DEUXIÈME PARTIE : CADRE EMPIRIQUE ET RÉSULTATS", 0)
    P(doc, "La seconde partie quitte le registre documentaire pour décrire ce qui a été effectivement conçu et réalisé. Le chapitre 3 présente la méthodologie, les outils et les diagrammes. Le chapitre 4 expose les écrans, discute les résultats et formule des suggestions, notamment le branchement ultérieur d'une base de données.")
    page_break(doc)

    # ========== CHAPITRE 3 ==========
    H(doc, "CHAPITRE 3 : MÉTHODOLOGIE ET MISE EN ŒUVRE DE LA RÉALISATION", 0)
    H(doc, "Introduction du chapitre", 1)
    P(doc, "Un mémoire professionnel se juge à la cohérence entre le problème posé et le chemin suivi pour le traiter. Ce chapitre rend compte de ce chemin : d'abord les approches et outils, ensuite le détail de la construction, enfin les schémas (UML, MCD, architecture) qui documentent le logiciel. L'objectif n'est pas de recopier la documentation technique, mais de montrer qu'un processus de génie logiciel a bien été appliqué.")

    H(doc, "3.1. Méthodologie", 1)

    H(doc, "3.1.1. Approches, méthodes et outils utilisés", 2)
    P(doc, "L'approche retenue est hybride. Sur le plan organisationnel, le travail a suivi une logique itérative proche de l'agilité : livraisons successives (portail, métiers de réservation, checking, authentification stricte, refonte visuelle, adaptation mobile). Chaque itération était recettée auprès du besoin métier (notes manuscrites de l'encadrement opérationnel : suppression du QR code, formulaire d'accompagnateurs, salons Solidarité et Plus, etc.).")
    P(doc, "Sur le plan de la modélisation, UML a été choisi comme langage de communication (cas d'utilisation, séquences, classes, activités, déploiement). MERISE a servi à esquisser le MCD en vue du futur SGBD. Le contrôle d'accès a été conçu selon RBAC. Les tests ont été essentiellement fonctionnels (scénarios de connexion par rôle, création de réservation, checking, refus d'accès aux pages admin pour une hôtesse).")

    add_fig(doc, "fig28_cycle.png", "Figure 2 : Cycle de réalisation itératif du projet", 15.0)

    add_table(
        doc,
        "Tableau 2 : Correspondance problématique / méthode",
        ["Question de travail", "Méthode", "Livrable"],
        [
            ["Comment digitaliser la demande protocole ?", "Cas d'utilisation + formulaire", "Module réservation"],
            ["Comment valider l'entrée réelle ?", "Séquence checking + registre", "Module checking"],
            ["Comment séparer les pouvoirs ?", "RBAC + gardes de routes", "RequireAuth"],
            ["Comment préparer l'industrialisation ?", "MCD + architecture cible", "Schéma PostgreSQL futur"],
        ],
    )

    H(doc, "3.1.2. Description des données, systèmes et plateformes", 2)
    P(doc, "Le système cible est une application web exécutée dans un navigateur moderne (Chrome, Edge, Firefox). L'environnement de développement repose sur Node.js, l'outil de construction Vite 8 et le langage TypeScript 5.7. L'interface est écrite en React 19. Les styles utilisent Tailwind CSS v4. Le routage est assuré par React Router 7. Les icônes proviennent de Lucide. Les graphiques d'analytics s'appuient sur Recharts.")
    P(doc, "Les données du prototype sont persistées dans le localStorage du navigateur, sous des clés dédiées (comptes, réservations, journal d'audit, thème). Ce choix, temporaire, permet de démontrer le métier sans serveur de bases de données, conformément à la demande de l'encadrement. Le modèle logique (comptes, réservations, passagers, salons, compagnies, audit) est néanmoins déjà normalisé pour un basculement PostgreSQL ou MySQL.")
    P(doc, "Trois profils de démonstration existent, communiqués hors interface : administrateur, hôtesse, protocole. L'application n'affiche plus ces identifiants à l'écran, afin de ne pas banaliser l'authentification.")

    add_table(
        doc,
        "Tableau 3 : Plateforme technique du prototype",
        ["Composant", "Technologie", "Rôle"],
        [
            ["Langage UI", "TypeScript / React 19", "Composants et typage"],
            ["Construction", "Vite 8", "Serveur de développement et bundle"],
            ["Routage", "React Router 7", "Pages publiques et admin"],
            ["Style", "Tailwind CSS v4", "Design system navy / or"],
            ["État", "Contexte React (AppStore)", "Métier et session"],
            ["Persistance actuelle", "localStorage", "Mode démonstration"],
            ["Persistance cible", "SGBD relationnel", "Industrialisation"],
        ],
    )

    H(doc, "3.1.3. Justification des choix méthodologiques", 2)
    P(doc, "React a été retenu pour la richesse de l'écosystème, la composabilité de l'interface (un formulaire d'accompagnateurs dynamiques s'y exprime naturellement) et la possibilité d'une SPA fluide. TypeScript réduit les erreurs de contrat (rôles, statuts, passagers). Vite accélère le cycle de recette. Tailwind évite une feuille CSS chaotique tout en permettant un design sur mesure.")
    P(doc, "Le localStorage n'est pas un SGBD. Il a été choisi comme rampe de lancement pédagogique et démonstrative : l'application reste utilisable hors ligne de serveur de données, ce qui facilite les soutenances et les tests sur un poste unique. La contrepartie (pas de multi-postes temps réel, volabilité si l'utilisateur vide son navigateur) est assumée et traitée en perspectives.")
    P(doc, "UML plutôt qu'un simple storytelling permet au jury de vérifier que les acteurs, messages et données ont été pensés. RBAC plutôt qu'une liste de if dispersés rend les privilèges de l'administrateur (création d'hôtesses et de protocoles, exports, analytics) explicites et opposables à ceux de l'hôtesse.")

    H(doc, "3.2. Mise en œuvre", 1)

    H(doc, "3.2.1. Description détaillée des étapes de développement", 2)
    P(doc, "La première étape a consisté à poser l'architecture de pages : écran de connexion, espace protocole (réservation, mes demandes), espace staff (réservation, checking, planning, registre) et espace administrateur étendu (supervision, exports, analytics, comptes).")
    P(doc, "La deuxième étape a modélisé le cœur métier. Une réservation n'est plus une fiche unique « passager principal + nombre d'accompagnateurs », mais une collection de personnes, chacune avec les champs du registre SALT. Le formulaire protocolaire préremplit l'identité du protocole connecté ; le formulaire hôtesse exige le choix du protocole concerné.")
    P(doc, "La troisième étape a introduit le checking : recherche par nom, distinction des personnes en attente et déjà entrées, action « Valider l'entrée » qui horodate et identifie l'agent. Le registre et les exports CSV reprennent les colonnes officielles.")
    P(doc, "La quatrième étape a durci la sécurité fonctionnelle : suppression des modes démo à l'écran, suppression de la navigation publique non authentifiée, garde RequireAuth, redirection selon le rôle, pages administration inaccessibles à l'hôtesse même par URL.")
    P(doc, "La cinquième étape a porté sur le design system (couleurs marine et or, typographies Plus Jakarta Sans et Sora, icônes) et sur l'ergonomie : barre latérale desktop, barre inférieure mobile uniquement, afin d'éviter la double navigation observée lors des tests PC.")

    add_fig(doc, "fig18_architecture.png", "Figure 3 : Architecture logique en trois couches", 15.4)

    H(doc, "3.2.2. Présentation des outils, technologies et langages", 2)
    P(doc, "L'environnement de développement est Windows 10, avec Visual Studio Code / Cursor, Node.js et le gestionnaire npm. Le serveur de développement Vite écoute le port 8443. Le code source est organisé de façon canonique : src/main.tsx monte l'application, src/App.tsx déclare les routes, src/store/AppStore.tsx concentre l'état, src/pages sépare public et admin, src/layouts distingue le shell protocole et le shell opérations, src/components contient RequireAuth et le formulaire de réservation.")
    P(doc, "Les principales fonctions métier du store sont : authenticate(email, password), addReservation, checkInPassenger, addAccount, updateAccount, validateReservation, reassignSalon, ainsi que les exports construits à partir des passagers. L'audit (addAudit) journalise les événements.")

    add_table(
        doc,
        "Tableau 4 : Modules fonctionnels livrés",
        ["Module", "Route", "Acteurs"],
        [
            ["Connexion", "/connexion", "Tous"],
            ["Réservation protocole", "/reservation", "Protocole"],
            ["Mes demandes", "/mes-reservations", "Protocole"],
            ["Réservation staff", "/admin/reservation", "Hôtesse, Admin"],
            ["Checking", "/admin/checking", "Hôtesse, Admin"],
            ["Planning", "/admin/planning", "Hôtesse, Admin"],
            ["Registre", "/admin/registre", "Hôtesse, Admin"],
            ["Supervision", "/admin/supervision", "Admin"],
            ["Exports", "/admin/exports", "Admin"],
            ["Analytics", "/admin/analytics", "Admin"],
            ["Comptes", "/admin/systeme", "Admin"],
        ],
    )

    H(doc, "3.2.3. Schémas, diagrammes et workflows", 2)
    P(doc, "Les diagrammes ci-après documentent le système. Ils ont été établis à partir du code réellement livré, et non d'une intention non implémentée.")

    add_fig(doc, "fig19_usecase.png", "Figure 4 : Diagramme de cas d'utilisation", 15.4)
    P(doc, "Le diagramme de cas d'utilisation montre que l'authentification est le point d'entrée commun. Le protocole se limite à déposer et consulter. L'hôtesse ajoute l'enregistrement d'appel, le checking et le registre. L'administrateur hérite de ces usages et gagne la supervision, les exports et la gestion des comptes.")

    add_fig(doc, "fig26_rbac.png", "Figure 5 : Matrice RBAC des privilèges", 15.4)
    P(doc, "La matrice rend visible l'exigence du commanditaire : l'administrateur possède des privilèges que l'hôtesse n'a pas, en particulier la création d'autres hôtesses et de protocoles.")

    add_fig(doc, "fig20_sequence_reservation.png", "Figure 6 : Séquence de création d'une réservation", 15.4)
    P(doc, "La séquence insiste sur les contrôles de saisie (vol, salon, fiches d'accompagnateurs complètes) avant l'appel à addReservation, lequel crée les identifiants, calcule le nombre de personnes et écrit l'audit.")

    add_fig(doc, "fig21_sequence_checking.png", "Figure 7 : Séquence du checking nominatif", 15.4)

    add_fig(doc, "fig22_activite.png", "Figure 8 : Diagramme d'activités du parcours global", 12.5)
    P(doc, "L'activité globale part de la connexion, se ramifie selon le rôle, converge sur l'enregistrement, puis sur le contrôle d'entrée. Un nom non trouvé ramène à la recherche, ce qui correspond à la pratique du salon (mauvaise orthographe, arrivée d'une personne non listée).")

    add_fig(doc, "fig23_classes.png", "Figure 9 : Diagramme de classes du domaine", 15.4)
    P(doc, "Les classes Account, Reservation et Passenger forment le cœur. UserSession est la projection authentifiée d'un compte. AuditEntry assure la piste. SalonConfig prépare le paramétrage des capacités.")

    add_fig(doc, "fig24_mcd.png", "Figure 10 : Modèle conceptuel de données (cible SGBD)", 15.4)
    P(doc, "Le MCD traduit les mêmes objets en entités-associations. Un compte (rôle protocole) dépose plusieurs réservations ; une réservation liste plusieurs passagers. Cette structure est prête pour des tables SQL (COMPTE, RESERVATION, PASSAGER, SALON, AUDIT, COMPAGNIE).")

    add_fig(doc, "fig25_deploiement.png", "Figure 11 : Déploiement actuel et cible", 15.2)
    P(doc, "Aujourd'hui, le navigateur dialogue avec le serveur Vite et persiste localement. La cible de production prévoit une API REST, un SGBD et HTTPS. Le prototype a volontairement isolé le métier avant d'introduire cette complexité opérationnelle.")

    H(doc, "Conclusion du chapitre", 1)
    P(doc, "La méthodologie mixte (itérative, UML, MERISE, RBAC, tests de scénarios) a permis de construire une application web typée, routée et authentifiée, dont le modèle de données anticipe le SGBD. Les diagrammes montrent que le logiciel n'est pas une succession d'écrans décoratifs : il implémente un workflow aéroportuaire. Le chapitre suivant présente les résultats visibles et en discute la portée.")

    page_break(doc)

    # ========== CHAPITRE 4 ==========
    H(doc, "CHAPITRE 4 : RÉSULTATS DE L'ÉTUDE", 0)
    H(doc, "Introduction du chapitre", 1)
    P(doc, "Ce chapitre confronte le logiciel aux objectifs. Il présente les écrans réellement obtenus, analyse leur conformité au besoin (authentification obligatoire, rôles, réservation par accompagnateurs, checking, administration des comptes, design desktop / mobile), discute les écarts et propose un plan d'évolution, au premier rang duquel la connexion d'une base de données.")

    H(doc, "4.1. Présentation et analyse des résultats", 1)

    H(doc, "4.1.1. Authentification obligatoire", 2)
    P(doc, "Toute URL métier redirige vers /connexion si aucune session n'existe. L'écran ne propose plus de « mode démo » ni de sélection de rôle : le rôle est une propriété du compte. L'utilisateur saisit son email et son mot de passe. En cas de succès, le protocole arrive sur le formulaire de réservation, le staff sur l'espace opérations.")
    add_fig(doc, "fig03_connexion.png", "Figure 12 : Écran de connexion SALT VIP", 15.0)
    P(doc, "Ce résultat répond à l'exigence de ne plus contourner l'authentification. Les identifiants de démonstration sont consignés dans le dossier de recette, pas dans l'interface, ce qui est plus conforme aux bonnes pratiques de sécurité applicative (OWASP, 2021).")

    H(doc, "4.1.2. Espace administrateur et privilèges étendus", 2)
    P(doc, "Connecté en administrateur, l'opérateur dispose d'une barre latérale complète : Réservation, Checking, Planning, Registre, Supervision, Exports, Analytics, Comptes. La création de comptes permet d'ajouter une hôtesse, un protocole ou un autre administrateur, avec email, mot de passe, société, téléphone et salon d'affectation.")
    add_fig(doc, "fig04_admin_reservation.png", "Figure 13 : Réservation côté staff (administrateur)", 15.2)
    add_fig(doc, "fig05_checking.png", "Figure 14 : Checking nominatif à l'arrivée", 15.2)
    P(doc, "Le checking matérialise le deuxième temps du processus. La recherche par nom réduit le temps d'accueil. La validation inscrit l'agent et l'heure, ce qui alimente le registre. Les personnes déjà entrées peuvent être consultées séparément, évitant les doubles validations.")
    add_fig(doc, "fig07_registre.png", "Figure 15 : Registre des passagers", 15.2)
    add_fig(doc, "fig06_planning.png", "Figure 16 : Centre de contrôle / planning des présences", 15.2)
    add_fig(doc, "fig08_supervision.png", "Figure 17 : Supervision (validation, annulation, réassignation de salon)", 15.2)
    add_fig(doc, "fig09_exports.png", "Figure 18 : Centre d'exports CSV et rapports", 15.2)
    P(doc, "Les exports reproduisent les fichiers métier (RESERVATION.csv, ETAT PASSAGER.csv, rapport d'activité), avec filtres de période et de salon. C'est un résultat directement actionnable pour le secrétariat des salons, aujourd'hui souvent tributaire d'une recopie manuelle.")
    add_fig(doc, "fig10_analytics.png", "Figure 19 : Tableau de bord analytics (KPIs)", 15.2)
    add_fig(doc, "fig11_administration.png", "Figure 20 : Administration — création d'hôtesses et de protocoles", 15.2)
    P(doc, "La page Comptes est le privilège le plus discriminant. Une hôtesse n'y a pas accès. L'administrateur peut y désactiver un compte sans le supprimer, ce qui préserve l'historique.")

    H(doc, "4.1.3. Espace hôtesse : un sous-ensemble contrôlé", 2)
    P(doc, "Le compte hôtesse ouvre les mêmes outils de production (réservation d'appel, checking, planning, registre) mais masque Supervision, Exports, Analytics et Comptes. Même une saisie manuelle de l'URL /admin/systeme ramène à la réservation. Ce résultat est essentiel : il prouve que le RBAC n'est pas seulement visuel.")
    add_fig(doc, "fig12_hotesse_reservation.png", "Figure 21 : Interface hôtesse — barre latérale restreinte", 15.2)

    H(doc, "4.1.4. Espace protocole", 2)
    P(doc, "L'officier de protocole ne voit pas le dashboard opérations. Il dispose d'un formulaire de réservation (vol, mouvement, provenance, salon Solidarité ou Plus, date, heure, nombre de personnes, fiches nominatives) et d'une liste « Mes demandes » où le statut de checking de chaque accompagnateur est visible.")
    add_fig(doc, "fig14_protocole_reservation.png", "Figure 22 : Formulaire de réservation protocole", 15.2)
    add_fig(doc, "fig15_protocole_demandes.png", "Figure 23 : Suivi des demandes du protocole", 15.2)

    H(doc, "4.1.5. Adaptation mobile et design", 2)
    P(doc, "Sur téléphone, une barre inférieure à icônes remplace la latérale. Sur PC, cette barre est masquée : seule la navigation latérale demeure. Ce correctif, issu des tests, évite la surcharge cognitive. Le design (fond clair, marine, or, icônes Lucide) vise un registre institutionnel plutôt qu'un site marketing.")
    add_fig(doc, "fig16_mobile_admin.png", "Figure 24 : Navigation mobile administrateur (barre inférieure)", 8.5)
    add_fig(doc, "fig17_mobile_protocole.png", "Figure 25 : Navigation mobile protocole", 8.5)

    H(doc, "4.1.6. Synthèse quantitative du prototype", 2)
    add_table(
        doc,
        "Tableau 5 : Indicateurs de réalisation du prototype",
        ["Indicateur", "Résultat observé"],
        [
            ["Rôles opérationnels", "3 (protocole, hôtesse, administrateur)"],
            ["Salons représentés", "6 (2 ouverts à la réservation en ligne)"],
            ["Modules écrans métier", "11 routes protégées"],
            ["Champs par accompagnateur", "4 (nom, profession, nationalité, société)"],
            ["Persistance démonstration", "localStorage (clés salt4-*)"],
            ["Authentification anonyme", "Impossible (redirection /connexion)"],
            ["Création de comptes", "Réservée à l'administrateur"],
        ],
    )

    H(doc, "4.2. Discussion des résultats", 1)

    H(doc, "4.2.1. Interprétation et comparaison aux attentes", 2)
    P(doc, "Par rapport au cahier des charges implicite (digitaliser le dépôt, fiabiliser l'entrée, séparer les rôles, préparer les registres), le prototype est conforme. Il se distingue des lounges internationaux en plaçant l'accompagnateur, et non la carte d'abonnement, au centre. Il se distingue d'un simple Excel par l'authentification, l'audit et les vues différenciées.")
    P(doc, "La comparaison avec les travaux cités au chapitre 2 confirme que le vide identifié (outil local de protocole SALT) est bien occupé, au moins au stade de démonstration. En revanche, les analytics du tableau de bord exécutif restent pour partie illustratifs (jeux de données de présentation), alors que le registre et le checking s'appuient sur les réservations réellement saisies. Cette hétérogénéité devra être levée lors du branchement SGBD.")

    H(doc, "4.2.2. Limites et difficultés rencontrées", 2)
    P(doc, "Plusieurs limites doivent être énoncées avec honnêteté, conformément au guide de l'ESIG.")
    P(doc, "La limite principale est l'absence de base de données multi-utilisateurs. Le localStorage est lié à un navigateur : deux postes ne partagent pas les mêmes réservations, et un vidage du cache efface le jeu d'essai. C'est acceptable pour une recette de licence, pas pour une mise en service à l'AIGE.")
    P(doc, "Deuxièmement, les mots de passe sont stockés en clair dans le prototype, ce qui serait inacceptable en production (il faudra un hachage de type bcrypt ou argon2, côté serveur). Troisièmement, il n'y a pas encore d'API, donc pas de journal d'authentification serveur, ni de politique de session expirée autre que la déconnexion manuelle. Quatrièmement, le planning kanban utilise encore un jeu VIP parallèle, qu'il faudra fusionner avec les passagers des réservations. Cinquièmement, les tests automatisés (unitaires, de bout en bout) n'ont pas été industrialisés : la recette a été manuelle.")
    P(doc, "Sur le plan humain, la difficulté a été de traduire des notes opérationnelles (souvent visuelles) en règles stables : deux salons réservables seulement, pas de QR, pas de titre de courtoisie, fonction obligatoire, checking par nom. L'itération a permis d'éviter un logiciel « trop générique ».")

    H(doc, "4.3. Suggestions", 1)
    P(doc, "Les suggestions ci-dessous s'accompagnent d'un plan de mise en œuvre réaliste.")

    H(doc, "4.3.1. Plan de bascule vers une base de données", 2)
    add_table(
        doc,
        "Tableau 6 : Plan de mise en œuvre de l'industrialisation",
        ["Phase", "Actions", "Livrable"],
        [
            ["1. Modèle physique", "DDL PostgreSQL d'après le MCD", "Script SQL"],
            ["2. API", "Endpoints REST (auth, résas, checking)", "Backend Node ou Laravel"],
            ["3. Sécurité", "JWT ou session httpOnly, mots de passe hashés", "IAM de base"],
            ["4. Migration", "Import des comptes et historiques Excel", "Jeu de production"],
            ["5. Recette terrain", "Pilote Salon Solidarité + Plus", "PV de recette SALT"],
            ["6. Déploiement", "HTTPS, sauvegardes, supervision", "Mise en service"],
        ],
    )
    P(doc, "En parallèle, il est suggéré de former les hôtesses (checking) et un référent protocole par institution, de rédiger une procédure d'habilitation des comptes, et d'aligner le kanban planning sur les passagers réels. Une authentification à deux facteurs pour les administrateurs serait un plus de sécurité.")

    H(doc, "4.3.2. Suggestions organisationnelles", 2)
    P(doc, "Le logiciel ne remplace pas l'organisation. Il est recommandé de désigner un administrateur métier SALT (création des comptes), d'interdire les comptes partagés, et de conserver un registre de secours papier uniquement en mode dégradé (panne réseau), puis de le ressaisir. Cette discipline évite la double vérité.")

    H(doc, "Conclusion du chapitre", 1)
    P(doc, "Les résultats montrent une application utilisable, authentifiée, différenciée par rôles, capable d'enregistrer des délégations et de valider des entrées. Les captures d'écran en attestent. Les limites (persistance locale, secrets non hashés, analytics encore partiellement illustratifs) sont claires et déjà converties en plan d'évolution. La conclusion générale reprend l'ensemble du raisonnement.")

    page_break(doc)

    # ========== CONCLUSION GENERALE ==========
    H(doc, "CONCLUSION GÉNÉRALE", 0)
    P(doc, "Le présent mémoire professionnel s'est donné pour objet de concevoir et de réaliser une application web de gestion des réservations des salons VIP de la SALT à l'Aéroport International Gnassingbé Eyadema. La problématique, posée dès l'introduction générale, était celle du passage d'un accueil d'honneur encore largement artisanal (appels, listes papier, mémoire humaine) à un système traçable, rôle par rôle, sans pour autant dénaturer le protocole.")
    P(doc, "Les objectifs étaient de modéliser le métier (protocole, hôtesse, administrateur), de permettre le dépôt d'une demande par accompagnateurs, de fiabiliser le checking nominatif, de produire les registres attendus, et de réserver à l'administrateur des privilèges étendus, notamment la création de comptes. La méthodologie a combiné une itération agile, UML, un MCD MERISE et un contrôle d'accès RBAC, sur une plateforme React / TypeScript / Vite.")
    P(doc, "Les réalisations principales sont : une authentification obligatoire ; trois espaces distincts ; un formulaire de réservation fidèle aux colonnes SALT ; un checking par recherche de nom ; un registre et des exports ; une administration des hôtesses et protocoles ; une interface desktop à barre latérale et une interface mobile à barre inférieure. Ces éléments répondent à la problématique initiale : oui, il est possible, avec les outils du génie logiciel enseignés, de matérialiser la chaîne dépôt-accueil-traçabilité des salons d'honneur.")
    P(doc, "Les limites ont été assumées : le prototype s'appuie sur le localStorage et non sur un SGBD partagé ; les mots de passe de démonstration ne sont pas hashés côté serveur ; une partie des analytics reste illustrative. Ces limites n'invalident pas le résultat pédagogique et démonstratif, mais elles interdisent une mise en production brute.")
    P(doc, "Les perspectives sont donc nettes. La première est le branchement d'une base de données relationnelle et d'une API sécurisée. La deuxième est l'unification du planning avec les passagers réels. La troisième est la recette de terrain au Salon Solidarité. La quatrième, plus lointaine, pourrait concerner l'interfaçage avec les horaires de vols de la plateforme. Ainsi, le mémoire referme la boucle exigée par l'ESIG : partir de l'expérience, interroger une pratique, construire un artefact, en mesurer la portée, et ouvrir un chemin d'amélioration.")

    page_break(doc)

    # ========== BIBLIOGRAPHIE ==========
    H(doc, "BIBLIOGRAPHIE", 0)
    P(doc, "Les références ci-dessous sont celles effectivement mobilisées dans le texte, présentées selon la norme APA.", italic=True)

    refs = [
        "Booch, G., Rumbaugh, J., & Jacobson, I. (2005). The unified modeling language user guide (2e éd.). Addison-Wesley.",
        "Budiu, R. (2015). Mobile: Native apps, web apps, and hybrid apps. Nielsen Norman Group.",
        "Committee of Sponsoring Organizations of the Treadway Commission. (2013). Internal control — Integrated framework. COSO.",
        "Ferraiolo, D. F., & Kuhn, D. R. (1992). Role-based access controls. Proceedings of the 15th National Computer Security Conference, 554-563.",
        "Fowler, M. (2003). Patterns of enterprise application architecture. Addison-Wesley.",
        "International Organization for Standardization. (2018). ISO 9241-11:2018. Ergonomics of human-system interaction — Usability: Definitions and concepts. ISO.",
        "International Organization for Standardization. (2019). ISO 9241-210:2019. Ergonomics of human-system interaction — Human-centred design. ISO.",
        "National Institute of Standards and Technology. (2017). Digital identity guidelines: Authentication and lifecycle management (NIST SP 800-63B). NIST.",
        "Nielsen, J. (1994). Usability engineering. Morgan Kaufmann.",
        "OWASP. (2021). OWASP Top 10: The ten most critical web application security risks. Open Web Application Security Project.",
        "Pressman, R. S., & Maxim, B. R. (2015). Software engineering: A practitioner's approach (8e éd.). McGraw-Hill.",
        "Reix, R., Fallery, B., Kalika, M., & Rowe, F. (2016). Systèmes d'information et management (7e éd.). Vuibert.",
        "Roques, P., & Vallée, F. (2007). UML 2 en action: De l'analyse des besoins à la conception (4e éd.). Eyrolles.",
        "Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. IEEE Computer, 29(2), 38-47. https://doi.org/10.1109/2.485845",
        "Sommerville, I. (2016). Software engineering (10e éd.). Pearson.",
        "Stallings, W., & Brown, L. (2018). Computer security: Principles and practice (4e éd.). Pearson.",
        "Tardieu, H., Rochfeld, A., & Colletti, R. (2000). La méthode MERISE: Principes et outils. Éditions d'Organisation.",
        "ESIG. (2024). Guide de rédaction de mémoire de licence professionnelle en sciences informatiques. École Supérieure d'Informatique et de Gestion.",
    ]
    for ref in refs:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(1.25)
        p.paragraph_format.first_line_indent = Cm(-1.25)
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(8)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        run = p.add_run(ref)
        set_run_font(run, size=12)

    page_break(doc)

    # ========== ANNEXES ==========
    H(doc, "ANNEXES", 0)
    H(doc, "Annexe 1 — Scénarios de recette", 1)
    P(doc, "Scénario A. Se connecter en protocole, créer une réservation de deux personnes sur le vol AF 714, salon Solidarité, puis vérifier l'apparition dans Mes demandes.")
    P(doc, "Scénario B. Se connecter en hôtesse, rechercher l'un des noms, valider l'entrée, constater le statut « Entré ».")
    P(doc, "Scénario C. Tenter, en hôtesse, d'ouvrir /admin/systeme : redirection attendue.")
    P(doc, "Scénario D. Se connecter en administrateur, créer un compte hôtesse, se déconnecter, se reconnecter avec ce compte.")
    P(doc, "Scénario E. Exporter ETAT PASSAGER.csv et contrôler les colonnes.")

    H(doc, "Annexe 2 — Structure des clés de persistance (prototype)", 1)
    add_table(
        doc,
        "Tableau A1 : Clés localStorage",
        ["Clé", "Contenu"],
        [
            ["salt4-user", "Session courante"],
            ["salt4-accounts", "Comptes (email, rôle, mot de passe prototype)"],
            ["salt3-resas", "Réservations et passagers"],
            ["salt3-audit", "Journal d'actions"],
            ["salt-theme", "Thème clair / sombre"],
        ],
        "Source : code source AppStore.tsx, 2026",
    )

    H(doc, "Annexe 3 — Règles de saisie du formulaire de réservation", 1)
    P(doc, "Champs vol, mouvement, provenance ou destination, salon, date et heure obligatoires. Pour chaque accompagnateur : nom et prénoms, profession, nationalité, société obligatoires. Côté hôtesse, le protocole destinataire est obligatoire. Côté protocole, l'identité est préremplie. Les salons ouverts à la réservation en ligne sont Solidarité et Plus.")

    page_break(doc)

    H(doc, "TABLE DES MATIÈRES", 0)
    P(doc, "La table des matières ci-dessous reprend les divisions du présent fascicule (chapitre 2 à annexes). Dans le volume relié, elle sera fusionnée avec celle du début du mémoire et générée automatiquement par le traitement de texte.", italic=True, size=12)

    toc = [
        "CHAPITRE 2 : REVUE DE LITTÉRATURE",
        "    Introduction du chapitre",
        "    2.1. Définition des concepts clés",
        "        2.1.1. Système d'information et application web métier",
        "        2.1.2. Salon VIP aéroportuaire et service d'honneur",
        "        2.1.3. Protocole, hôtesse et administrateur",
        "        2.1.4. Réservation, accompagnateur et checking nominatif",
        "        2.1.5. Authentification, habilitation et audit",
        "        2.1.6. Expérience utilisateur et interface adaptative",
        "    2.2. Synthèse des recherches et travaux similaires",
        "        2.2.1. Études antérieures, modèles théoriques et solutions existantes",
        "        2.2.2. Identification des lacunes des travaux existants",
        "    Conclusion du chapitre",
        "DEUXIÈME PARTIE : CADRE EMPIRIQUE ET RÉSULTATS",
        "CHAPITRE 3 : MÉTHODOLOGIE ET MISE EN ŒUVRE DE LA RÉALISATION",
        "    Introduction du chapitre",
        "    3.1. Méthodologie",
        "        3.1.1. Approches, méthodes et outils utilisés",
        "        3.1.2. Description des données, systèmes et plateformes",
        "        3.1.3. Justification des choix méthodologiques",
        "    3.2. Mise en œuvre",
        "        3.2.1. Description détaillée des étapes de développement",
        "        3.2.2. Présentation des outils, technologies et langages",
        "        3.2.3. Schémas, diagrammes et workflows",
        "    Conclusion du chapitre",
        "CHAPITRE 4 : RÉSULTATS DE L'ÉTUDE",
        "    Introduction du chapitre",
        "    4.1. Présentation et analyse des résultats",
        "        4.1.1. Authentification obligatoire",
        "        4.1.2. Espace administrateur et privilèges étendus",
        "        4.1.3. Espace hôtesse : un sous-ensemble contrôlé",
        "        4.1.4. Espace protocole",
        "        4.1.5. Adaptation mobile et design",
        "        4.1.6. Synthèse quantitative du prototype",
        "    4.2. Discussion des résultats",
        "        4.2.1. Interprétation et comparaison aux attentes",
        "        4.2.2. Limites et difficultés rencontrées",
        "    4.3. Suggestions",
        "        4.3.1. Plan de bascule vers une base de données",
        "        4.3.2. Suggestions organisationnelles",
        "    Conclusion du chapitre",
        "CONCLUSION GÉNÉRALE",
        "BIBLIOGRAPHIE",
        "ANNEXES",
        "TABLE DES MATIÈRES",
    ]
    for line in toc:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(2)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(line)
        bold = not line.startswith(" ")
        set_run_font(run, size=12, bold=bold)

    doc.save(OUT)
    print("Document enregistré :", OUT)


if __name__ == "__main__":
    build()
