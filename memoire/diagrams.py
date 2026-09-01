"""Diagrammes UML et schémas pour le mémoire SALT VIP."""
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle
import matplotlib.lines as mlines

OUT = Path(__file__).parent / "figures"
OUT.mkdir(exist_ok=True)

NAVY = "#0B1C33"
GOLD = "#B8893A"
CREAM = "#F4F1EA"
BLUE = "#1B4F72"
GREEN = "#1F7A55"
GRAY = "#5B6578"
WHITE = "#FFFFFF"
SOFT = "#E8EDF4"

plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["axes.unicode_minus"] = False


def save(fig, name):
    fig.savefig(OUT / name, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("OK", name)


def box(ax, x, y, w, h, text, fc=NAVY, ec=NAVY, tc=WHITE, fs=8.5, r=0.08):
    p = FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0.02,rounding_size={r}",
                       facecolor=fc, edgecolor=ec, linewidth=1.2, zorder=2)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", color=tc,
            fontsize=fs, fontweight="medium", zorder=3, wrap=True)


def actor(ax, x, y, label):
    ax.add_patch(Circle((x, y + 1.15), 0.18, fill=False, ec=NAVY, lw=1.4))
    ax.plot([x, x], [y + 0.97, y + 0.45], color=NAVY, lw=1.4)
    ax.plot([x - 0.28, x + 0.28], [y + 0.78, y + 0.78], color=NAVY, lw=1.4)
    ax.plot([x, x - 0.22], [y + 0.45, y], color=NAVY, lw=1.4)
    ax.plot([x, x + 0.22], [y + 0.45, y], color=NAVY, lw=1.4)
    ax.text(x, y - 0.28, label, ha="center", va="top", fontsize=8, color=NAVY, fontweight="bold")


def arrow(ax, a, b, text=None):
    ax.annotate("", xy=b, xytext=a,
                arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.15))
    if text:
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        ax.text(mx, my + 0.12, text, fontsize=7, color=GOLD, ha="center")


def fig_architecture():
    fig, ax = plt.subplots(figsize=(11.2, 6.6))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Architecture logique de l'application SALT VIP", fontsize=13, color=NAVY, pad=12, fontweight="bold")

    layers = [
        (0.4, 5.2, 11.2, 1.5, "Couche présentation (React 19 + Tailwind CSS v4)", GOLD, [
            (0.7, 5.45, 2.4, 0.9, "Connexion"),
            (3.3, 5.45, 2.4, 0.9, "Espace protocole"),
            (5.9, 5.45, 2.6, 0.9, "Espace hôtesse"),
            (8.7, 5.45, 2.6, 0.9, "Espace administrateur"),
        ]),
        (0.4, 3.15, 11.2, 1.7, "Couche application (React Router + AppStore)", BLUE, [
            (0.7, 3.4, 2.5, 1.05, "RequireAuth\nRBAC"),
            (3.4, 3.4, 2.5, 1.05, "Réservations\n& passagers"),
            (6.1, 3.4, 2.5, 1.05, "Checking\n& audit"),
            (8.8, 3.4, 2.5, 1.05, "Exports CSV\nAnalytics"),
        ]),
        (0.4, 1.05, 11.2, 1.7, "Couche persistance (mode démonstration : localStorage)", GREEN, [
            (1.3, 1.3, 3.0, 1.05, "Comptes\n(salt4-accounts)"),
            (4.6, 1.3, 3.0, 1.05, "Réservations\n(salt4-resas)"),
            (7.9, 1.3, 3.0, 1.05, "Journal d'audit\n(salt3-audit)"),
        ]),
    ]
    for x, y, w, h, title, color, inner in layers:
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.12",
                                    facecolor=WHITE, edgecolor=color, linewidth=2))
        ax.text(x + 0.15, y + h - 0.22, title, fontsize=8.5, color=color, fontweight="bold", ha="left")
        for ix, iy, iw, ih, t in inner:
            box(ax, ix, iy, iw, ih, t, fc=color, fs=8)
    save(fig, "fig18_architecture.png")


def fig_usecase():
    fig, ax = plt.subplots(figsize=(11.4, 7.4))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis("off")
    ax.set_title("Diagramme de cas d'utilisation — SALT VIP", fontsize=13, color=NAVY, pad=8, fontweight="bold")

    actor(ax, 1.3, 6.8, "Protocole")
    actor(ax, 1.3, 3.6, "Hôtesse")
    actor(ax, 1.3, 1.1, "Administrateur")

    sys = FancyBboxPatch((3.3, 0.4), 8.0, 9.1, boxstyle="round,pad=0.04,rounding_size=0.2",
                         facecolor="#FAFBFD", edgecolor=NAVY, linewidth=1.6)
    ax.add_patch(sys)
    ax.text(7.3, 9.15, "Système SALT VIP", ha="center", fontsize=10, color=NAVY, fontweight="bold")

    cases = [
        (5.5, 8.15, "S'authentifier"),
        (5.5, 7.25, "Créer une réservation"),
        (5.5, 6.35, "Consulter ses demandes"),
        (5.5, 5.45, "Enregistrer un appel"),
        (5.5, 4.55, "Valider un checking"),
        (5.5, 3.65, "Consulter le registre"),
        (5.5, 2.75, "Superviser / réassigner"),
        (5.5, 1.85, "Exporter CSV / rapports"),
        (5.5, 0.95, "Créer hôtesses et protocoles"),
    ]
    for x, y, t in cases:
        e = mpatches.Ellipse((x + 1.6, y + 0.28), 4.6, 0.72, facecolor=WHITE, edgecolor=NAVY, lw=1.2)
        ax.add_patch(e)
        ax.text(x + 1.6, y + 0.28, t, ha="center", va="center", fontsize=8, color=NAVY)

    # associations
    links = [
        ((1.55, 7.55), (5.55, 8.43)),
        ((1.55, 7.4), (5.55, 7.53)),
        ((1.55, 7.25), (5.55, 6.63)),
        ((1.55, 4.35), (5.55, 8.35)),
        ((1.55, 4.2), (5.55, 5.73)),
        ((1.55, 4.05), (5.55, 4.83)),
        ((1.55, 3.9), (5.55, 3.93)),
        ((1.55, 1.85), (5.55, 8.35)),
        ((1.55, 1.7), (5.55, 3.03)),
        ((1.55, 1.55), (5.55, 2.13)),
        ((1.55, 1.4), (5.55, 1.23)),
    ]
    for a, b in links:
        ax.plot([a[0], b[0]], [a[1], b[1]], color=GRAY, lw=0.8)

    ax.text(11.7, 8.4, "<<include>>", fontsize=7, color=GOLD, rotation=0)
    save(fig, "fig19_usecase.png")


def fig_sequence_resa():
    fig, ax = plt.subplots(figsize=(11.2, 7.2))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Diagramme de séquence — création d'une réservation", fontsize=13, color=NAVY, pad=10, fontweight="bold")

    cols = [(1.4, "Acteur"), (4.0, "Interface\nformulaire"), (6.8, "AppStore"), (9.6, "localStorage")]
    for x, t in cols:
        ax.text(x, 7.55, t, ha="center", va="center", fontsize=8.5, color=NAVY, fontweight="bold")
        ax.plot([x, x], [0.4, 7.15], color=SOFT, lw=1.4, linestyle="--")
        box(ax, x - 0.85, 7.25, 1.7, 0.55, "", fc=NAVY, fs=1)
        ax.text(x, 7.52, t, ha="center", va="center", fontsize=8, color=WHITE, fontweight="bold")

    msgs = [
        (1.4, 4.0, 6.6, "1. Saisir vol, salon, accompagnateurs"),
        (4.0, 6.8, 5.8, "2. submit() / contrôles de saisie"),
        (6.8, 9.6, 5.0, "3. addReservation() + addAudit()"),
        (9.6, 6.8, 4.2, "4. Persistance JSON"),
        (6.8, 4.0, 3.4, "5. Objet Reservation créé"),
        (4.0, 1.4, 2.6, "6. Confirmation + référence"),
    ]
    for i, (x1, x2, y, t) in enumerate(msgs):
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle="-|>", color=NAVY if i % 2 == 0 else GOLD, lw=1.2))
        ax.text((x1 + x2) / 2, y + 0.18, t, ha="center", fontsize=7.4, color=NAVY)
        ax.add_patch(Rectangle((x1 - 0.08, y - 0.22), 0.16, 0.7 if i < 5 else 0.45, color=NAVY, zorder=2))
    save(fig, "fig20_sequence_reservation.png")


def fig_sequence_check():
    fig, ax = plt.subplots(figsize=(11.2, 6.6))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7.2)
    ax.axis("off")
    ax.set_title("Diagramme de séquence — checking à l'arrivée", fontsize=13, color=NAVY, pad=10, fontweight="bold")
    cols = [(1.5, "Hôtesse"), (4.3, "Checking"), (7.1, "AppStore"), (9.9, "Registre")]
    for x, t in cols:
        box(ax, x - 0.9, 6.45, 1.8, 0.5, t, fc=NAVY, fs=8)
        ax.plot([x, x], [0.5, 6.4], color=SOFT, lw=1.4, linestyle="--")
    msgs = [
        (1.5, 4.3, 5.7, "1. Rechercher le nom"),
        (4.3, 7.1, 4.9, "2. Filtrer passengers[]"),
        (7.1, 4.3, 4.1, "3. Liste des accompagnateurs"),
        (1.5, 4.3, 3.3, "4. Valider l'entrée"),
        (4.3, 7.1, 2.5, "5. checkInPassenger()"),
        (7.1, 9.9, 1.7, "6. checkedIn = true + audit"),
        (4.3, 1.5, 0.9, "7. Confirmation visuelle"),
    ]
    for x1, x2, y, t in msgs:
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.15))
        ax.text((x1 + x2) / 2, y + 0.16, t, ha="center", fontsize=7.4, color=NAVY)
    save(fig, "fig21_sequence_checking.png")


def fig_activite():
    fig, ax = plt.subplots(figsize=(8.6, 10.4))
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 12)
    ax.axis("off")
    ax.set_title("Diagramme d'activités — parcours métier", fontsize=13, color=NAVY, pad=8, fontweight="bold")

    def dmd(x, y, t):
        ax.add_patch(mpatches.FancyBboxPatch((x, y), 3.6, 0.7, boxstyle="round,pad=0.02,rounding_size=0.35",
                                             fc=NAVY, ec=NAVY))
        ax.text(x + 1.8, y + 0.35, t, ha="center", va="center", color=WHITE, fontsize=8)

    def act(x, y, t, c=BLUE):
        box(ax, x, y, 3.6, 0.72, t, fc=c, fs=8)

    def los(x, y, t):
        ax.add_patch(mpatches.RegularPolygon((x, y), 4, radius=0.62, orientation=0.785, fc=WHITE, ec=GOLD, lw=1.4))
        ax.text(x, y, t, ha="center", va="center", fontsize=7, color=NAVY)

    dmd(2.2, 11.1, "Début")
    act(2.2, 10.05, "Connexion (email + mot de passe)")
    los(4.0, 9.15, "Rôle ?")
    act(0.3, 7.85, "Formulaire protocole", GOLD)
    act(4.1, 7.85, "Formulaire hôtesse", BLUE)
    act(2.2, 6.55, "Enregistrement réservation + passagers")
    act(2.2, 5.4, "Arrivée au salon")
    act(2.2, 4.25, "Recherche nominative")
    los(4.0, 3.35, "Trouvé ?")
    act(2.2, 2.05, "Valider l'entrée (checking)")
    box(ax, 5.35, 2.05, 2.35, 0.72, "Nouvelle recherche", fc="#8B3A3A", fs=8)
    dmd(2.2, 0.7, "Fin — traçabilité")

    for y1, y2 in [(11.1, 10.77), (10.05, 9.55)]:
        pass
    ax.annotate("", xy=(4.0, 10.05 + 0.72), xytext=(4.0, 11.1), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(4.0, 9.77), xytext=(4.0, 10.05), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(2.1, 8.57), xytext=(3.5, 8.85), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(5.9, 8.57), xytext=(4.5, 8.85), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.text(1.5, 8.55, "Protocole", fontsize=7, color=GOLD)
    ax.text(6.2, 8.55, "Staff", fontsize=7, color=BLUE)
    ax.annotate("", xy=(4.0, 7.27), xytext=(2.1, 7.85), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(4.0, 7.27), xytext=(5.9, 7.85), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(4.0, 6.12), xytext=(4.0, 6.55 + 0.72), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(4.0, 4.97), xytext=(4.0, 5.4 + 0.72), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(4.0, 3.97), xytext=(4.0, 4.25 + 0.72), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(4.0, 2.77), xytext=(4.0, 2.95), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    ax.annotate("", xy=(4.0, 1.42), xytext=(4.0, 2.05), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=1.1))
    save(fig, "fig22_activite.png")


def fig_classes():
    fig, ax = plt.subplots(figsize=(11.5, 7.6))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Diagramme de classes (extrait du domaine)", fontsize=13, color=NAVY, pad=10, fontweight="bold")

    def clazz(x, y, w, h, title, attrs):
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="square,pad=0", fc=WHITE, ec=NAVY, lw=1.3))
        ax.add_patch(Rectangle((x, y + h - 0.48), w, 0.48, fc=NAVY))
        ax.text(x + w / 2, y + h - 0.24, title, ha="center", va="center", color=WHITE, fontsize=8.5, fontweight="bold")
        ax.text(x + 0.12, y + h - 0.62, attrs, ha="left", va="top", fontsize=7.2, color=NAVY, family="DejaVu Sans Mono")

    clazz(0.3, 4.6, 3.5, 2.9, "Account",
          "- id : string\n- name : string\n- email : string\n- password : string\n- role : AccountRole\n- societe : string\n- actif : boolean")
    clazz(4.25, 4.6, 3.6, 2.9, "Reservation",
          "- id : string\n- vol : string\n- date : string\n- salon : string\n- protocoleId : string\n- superStatut : enum\n+ addReservation()")
    clazz(8.3, 4.6, 3.4, 2.9, "Passenger",
          "- id : string\n- nomPrenoms : string\n- profession : string\n- nationalite : string\n- societe : string\n- checkedIn : boolean")
    clazz(0.3, 0.5, 3.5, 2.5, "UserSession",
          "- id : string\n- name : string\n- role : Role\n- email : string")
    clazz(4.25, 0.5, 3.6, 2.5, "AuditEntry",
          "- time : string\n- action : string\n- resa : string\n- user : string\n- detail : string")
    clazz(8.3, 0.5, 3.4, 2.5, "SalonConfig",
          "- id : string\n- nom : string\n- capacite : number\n- quota : number\n- actif : boolean")

    ax.annotate("", xy=(4.25, 6.0), xytext=(3.8, 6.0), arrowprops=dict(arrowstyle="-|>", color=GOLD, lw=1.2))
    ax.text(4.0, 6.18, "1", fontsize=7, color=GOLD)
    ax.annotate("", xy=(8.3, 6.0), xytext=(7.85, 6.0), arrowprops=dict(arrowstyle="-|>", color=GOLD, lw=1.2))
    ax.text(8.05, 6.18, "1..*", fontsize=7, color=GOLD)
    ax.text(6.0, 3.95, "crée / appartient", fontsize=7, color=GRAY, ha="center")
    ax.text(8.1, 3.95, "contient", fontsize=7, color=GRAY, ha="center")
    save(fig, "fig23_classes.png")


def fig_mcd():
    fig, ax = plt.subplots(figsize=(11.2, 6.8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Modèle conceptuel de données (préparé pour le SGBD)", fontsize=13, color=NAVY, pad=10, fontweight="bold")

    def ent(x, y, w, h, title, attrs):
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.08",
                                    fc=WHITE, ec=NAVY, lw=1.4))
        ax.add_patch(Rectangle((x, y + h - 0.45), w, 0.45, fc=GOLD))
        ax.text(x + w / 2, y + h - 0.22, title, ha="center", va="center", fontsize=8.5, color=NAVY, fontweight="bold")
        ax.text(x + 0.15, y + h - 0.58, attrs, ha="left", va="top", fontsize=7.3, color=NAVY)

    def rel(x, y, t):
        ax.add_patch(mpatches.RegularPolygon((x, y), 4, radius=0.55, orientation=0.785, fc=WHITE, ec=GOLD, lw=1.3))
        ax.text(x, y, t, ha="center", va="center", fontsize=7, color=NAVY)

    ent(0.3, 3.6, 3.1, 2.8, "COMPTE", "#id\nnom\nemail\nmot_de_passe\nrole\nsociete")
    ent(4.45, 3.6, 3.2, 2.8, "RESERVATION", "#id\nvol\ndate\nheure\nsalon\nmouvement")
    ent(8.6, 3.6, 3.1, 2.8, "PASSAGER", "#id\nnom_prenoms\nprofession\nnationalite\nchecked_in")
    ent(0.3, 0.35, 3.1, 2.2, "SALON", "#id\nnom\ncapacite\nquota")
    ent(4.45, 0.35, 3.2, 2.2, "AUDIT", "#id\naction\ndate_heure\ndetail")
    ent(8.6, 0.35, 3.1, 2.2, "COMPAGNIE", "#id\nnom\ncode_iata")

    rel(3.9, 5.1, "dépose")
    rel(8.05, 5.1, "liste")
    ax.plot([3.4, 3.55], [5.1, 5.1], color=NAVY, lw=1)
    ax.plot([4.25, 4.45], [5.1, 5.1], color=NAVY, lw=1)
    ax.plot([7.65, 7.75], [5.1, 5.1], color=NAVY, lw=1)
    ax.plot([8.4, 8.6], [5.1, 5.1], color=NAVY, lw=1)
    ax.text(3.5, 5.32, "1,n", fontsize=7, color=GOLD)
    ax.text(4.2, 5.32, "1,1", fontsize=7, color=GOLD)
    ax.text(7.7, 5.32, "1,1", fontsize=7, color=GOLD)
    ax.text(8.35, 5.32, "1,n", fontsize=7, color=GOLD)
    save(fig, "fig24_mcd.png")


def fig_deploiement():
    fig, ax = plt.subplots(figsize=(11.2, 5.8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6)
    ax.axis("off")
    ax.set_title("Diagramme de déploiement (actuel et cible)", fontsize=13, color=NAVY, pad=10, fontweight="bold")

    box(ax, 0.4, 2.2, 3.3, 2.8, "Poste utilisateur\nNavigateur Chrome / Edge\nReact SPA", fc=NAVY, fs=9)
    box(ax, 4.35, 2.2, 3.3, 2.8, "Serveur de développement\nVite 8 — port 8443\nNode.js", fc=BLUE, fs=9)
    box(ax, 8.3, 2.2, 3.3, 2.8, "Cible production\nAPI REST + PostgreSQL\nHTTPS / reverse proxy", fc=GREEN, fs=9)
    arrow(ax, (3.7, 3.6), (4.35, 3.6), "HTTP")
    arrow(ax, (7.65, 3.6), (8.3, 3.6), "évolution")
    ax.text(6.0, 1.2, "Aujourd'hui : persistance navigateur (localStorage). Demain : base de données centralisée.",
            ha="center", fontsize=8.5, color=GRAY)
    save(fig, "fig25_deploiement.png")


def fig_rbac():
    fig, ax = plt.subplots(figsize=(11.2, 5.4))
    ax.axis("off")
    ax.set_title("Matrice des privilèges par rôle (RBAC)", fontsize=13, color=NAVY, pad=8, fontweight="bold")
    cols = ["Module", "Protocole", "Hôtesse", "Administrateur"]
    rows = [
        ["Connexion authentifiée", "Oui", "Oui", "Oui"],
        ["Créer une réservation", "Oui (soi)", "Oui (pour un protocole)", "Oui"],
        ["Checking nominatif", "Non", "Oui", "Oui"],
        ["Registre / planning", "Ses demandes", "Oui", "Oui"],
        ["Supervision / exports", "Non", "Non", "Oui"],
        ["Création de comptes", "Non", "Non", "Oui"],
    ]
    table = ax.table(cellText=rows, colLabels=cols, loc="center", cellLoc="center")
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1.15, 1.7)
    for (r, c), cell in table.get_celld().items():
        cell.set_edgecolor(SOFT)
        if r == 0:
            cell.set_facecolor(NAVY)
            cell.set_text_props(color=WHITE, fontweight="bold")
        elif r % 2 == 0:
            cell.set_facecolor("#F7F4EE")
        if c == 0 and r > 0:
            cell.set_text_props(ha="left")
        if r > 0 and cell.get_text().get_text() == "Oui":
            cell.set_text_props(color=GREEN, fontweight="bold")
        if r > 0 and cell.get_text().get_text() == "Non":
            cell.set_text_props(color="#B42318")
    save(fig, "fig26_rbac.png")


def fig_processus():
    fig, ax = plt.subplots(figsize=(11.4, 3.8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 4)
    ax.axis("off")
    ax.set_title("Processus métier en deux étapes", fontsize=13, color=NAVY, pad=8, fontweight="bold")
    box(ax, 0.3, 1.3, 3.3, 1.6, "1. Dépôt de la demande\nProtocole ou hôtesse\nVol + accompagnateurs", fc=GOLD, fs=8.5)
    box(ax, 4.35, 1.3, 3.3, 1.6, "2. Accueil SALT\nChecking nominatif\nEntrée validée", fc=NAVY, fs=8.5)
    box(ax, 8.4, 1.3, 3.3, 1.6, "3. Traçabilité\nRegistre, audit, exports", fc=GREEN, fs=8.5)
    arrow(ax, (3.6, 2.1), (4.35, 2.1))
    arrow(ax, (7.65, 2.1), (8.4, 2.1))
    save(fig, "fig27_processus.png")


def fig_cycle():
    fig, ax = plt.subplots(figsize=(11.2, 4.2))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 4.2)
    ax.axis("off")
    ax.set_title("Cycle de réalisation (approche itérative)", fontsize=13, color=NAVY, pad=8, fontweight="bold")
    steps = [
        (0.3, "Analyse\ndu besoin"),
        (2.6, "Modélisation\nUML / MCD"),
        (4.9, "Maquettes\n& design"),
        (7.2, "Développement\nReact / TS"),
        (9.5, "Tests &\nrecette métier"),
    ]
    for i, (x, t) in enumerate(steps):
        box(ax, x, 1.4, 2.1, 1.5, t, fc=NAVY if i % 2 == 0 else BLUE, fs=8.5)
        if i < len(steps) - 1:
            arrow(ax, (x + 2.1, 2.15), (steps[i + 1][0], 2.15))
    save(fig, "fig28_cycle.png")


if __name__ == "__main__":
    fig_architecture()
    fig_usecase()
    fig_sequence_resa()
    fig_sequence_check()
    fig_activite()
    fig_classes()
    fig_mcd()
    fig_deploiement()
    fig_rbac()
    fig_processus()
    fig_cycle()
    print("Diagrammes générés.")
