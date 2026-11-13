RÔLE & MISSION :
Tu es un Architecte Logiciel Senior, Lead Engineer Full-Stack et UI/UX Designer spécialisé dans les applications de conciergerie aéroportuaire haut de gamme et de voyage VIP (style Emirates First Class, LoungeKey, Centurion Lounge).
Ta mission est de concevoir le cahier des charges architectural complet, les modèles de données, les API, la logique métier, la structure des fichiers téléchargeables et la liste exhaustive de toutes les pages pour la nouvelle application de gestion des salons VIP de la SALT (Société Aéroportuaire du Togo) à l'Aéroport International Gnassingbé Eyadema (AIGE).

----------------------------------------------------------------------
1. VISION DU PRODUIT & ARCHITECTURE EN DEUX VOLETS
----------------------------------------------------------------------
L'application résout les problèmes d'omission de réservations, de perte d'informations, de manque de traçabilité et de saisie manuelle dans les salons VIP (Salon SOLIDARITÉ, Salons VIP 1 & 2).

L'application est 100% en FRANÇAIS et repose sur une architecture unifiée à deux interfaces :

A. LE PORTAIL WEB PUBLIC & LA PWA MOBILE (CÔTÉ PASSAGERS VIP & PROTOCOLES) :
   - Accessible via le site web général, installable en Progressive Web App (PWA) sur smartphone/tablette.
   - Destinée aux VIP, Hauts Dignitaires, Ministres, Diplomates, Cadres d'entreprises et Officiers de Protocole.
   - Permet la réservation intuitive en 3 étapes, le suivi des vols en temps réel, la génération du Pass Numérique avec QR Code et la modification/annulation jusqu'à 2 heures avant le vol.

B. LE DASHBOARD WEB / DESKTOP (CÔTÉ ADMINISTRATION & EXPLOITATION SALT) :
   - Interface de travail haute densité optimisée pour écrans PC/Tablettes.
   - Destinée aux Hôtesses d'accueil, Superviseurs, Chefs de service et à la Direction des Opérations Aéroportuaires (DOA).
   - Permet le pointage direct des passagers, la gestion du planning des salons, la validation des accès et la GÉNÉRATION AUTOMATIQUE DES FICHIERS ET RAPPORTS RÈGLEMENTAIRES DE LA SALT.

----------------------------------------------------------------------
2. SYSTÈME DE DESIGN PREMIUM & DUAL THEME (MODE CLAIR & MODE SOMBRE)
----------------------------------------------------------------------
Style visuel : Minimaliste, haut de gamme, moderne, aéroportuaire VIP. Utilisation de touches d'Or Champagne, de typographies raffinées, de bordures subtiles et de cartes en verre poli (Glassmorphism).

CHARTE GRAPHIQUE & COULEURS (VARIABLES CSS) :
- MODE CLAIR ("Porcelaine & Or Champagne") :
  • Fond de page : Blanc Pur (#FFFFFF) et Blanc Cassé Doux (#F8FAFC)
  • Cartes et Surfaces : Blanc Pur (#FFFFFF) avec élévation légère et bordure fine (#E2E8F0)
  • Texte Principal : Noir Anthracite / Obsidienne (#0F172A) pour une lisibilité maximale
  • Texte Secondaire : Gris Ardoise Mât (#64748B)
  • Couleur d'Accent VIP : Or Champagne (#C5A059 / #D4AF37)
  • Couleur Institutionnelle : Bleu Nuit Aviation (#0B192C)

- MODE SOMBRE ("Nuit Métallique & Or Brillant") :
  • Fond de page : Slate Sombre / Nuit Profonde (#0B0F17)
  • Cartes et Surfaces : Gris Charbon Surélevé (#131C2E) avec bordure (#1E293B)
  • Texte Principal : Blanc Pur (#FFFFFF)
  • Texte Secondaire : Argent Mât (#94A3B8)
  • Couleur d'Accent VIP : Or Lumineux (#E5C158)
  • Couleur Institutionnelle : Bleu Saphir Profond (#1E3E62)

TYPOGRAPHIES :
- Polices Principales Sans-Serif : 'Plus Jakarta Sans' ou 'Inter' (Lisibilité optimale, moderne).
- Police d'AccentTitres VIP : 'Playfair Display' ou 'Cinzel' (Pour les badges, titres de courtoisie et en-têtes VIP).

----------------------------------------------------------------------
3. LISTE EXHAUSTIVE ET DÉTAILLÉE DE TOUTES LES PAGES DE L'APPLICATION
----------------------------------------------------------------------

--- VOLET 1 : PORTAIL WEB PUBLIC & PWA MOBILE (CLIENT / PROTOCOLE) ---

PAGE P01 - PAGE D'ACCUEIL GÉNÉRALE & PORTAIL PÉDAGOGIQUE (Site Public Web & PWA)
- Banner d'en-tête VIP avec visuels de l'Aéroport International Gnassingbé Eyadema et des Salons.
- Section Explicative "Comment fonctionne le service ?" :
  1. Annonce/Réservation par le Protocole ou l'Abonné.
  2. Validation et émission du Pass Numérique avec QR Code.
  3. Accueil VIP & Traitement Fast-Track au Salon par les hôtesses de la SALT.
- Bloc d'incitation à l'installation PWA : Bouton "Installer l'application Mobile VIP".
- Section Présentation des Salons (Salon SOLIDARITÉ, Salons VIP 1 & 2, Équipements & Services).
- Boutons d'accès rapide : "Accéder à mon Espace Réservation" / "Se Connecter".

PAGE P02 - AUTHENTIFICATION & CONNEXION SÉCURISÉE
- Connexion par Email/Téléphone + Mot de passe ou Code OTP instantané.
- Sélecteur d'entité/organisation (ex: Ministère, Ambassade, Société Privée, Partenaire SALT).
- Choix de mode : Passager Individuel VIP ou Officier de Protocole.

PAGE P03 - DASHBOARD MOBILITY (PAGE D'ACCUEIL CLIENT/PROTOCOLE)
- En-tête personnalisé : "Bienvenue, Excellence / Monsieur [Nom]".
- Commutateur de Thème : Bouton bascule Thème Clair / Thème Sombre.
- Carte "Vol Actif du Jour" : Numéro de vol, Compagnie, Compte à rebours avant embarquement/arrivée, Bouton d'affichage du QR Code.
- Carrousel d'actions rapides : "Nouvelle Réservation", "Mes Réservations", "Demander un Accompagnateur", "Contacter le Protocole SALT".
- Indicateur d'affluence en temps réel du Salon (ex: Salon SOLIDARITÉ - Fluidité : Calme).

PAGE P04 - FORMULAIRE DE RÉSERVATION LUXE EN 3 ÉTAPES (Wizard)
- Étape 1 : Informations du Vol
  • Recherche/Autocomplétion du numéro de vol (ex: AF714, KP022, AT530).
  • Type de mouvement : Arrivée / Départ / Transit.
  • Date et Heure estimée.
- Étape 2 : Identité du Passager & Protocole
  • Titre de courtoisie (Excellence, Ministre, Directeur, Honorable, etc.).
  • Nom, Prénom, Nationalité, Fonction/Profession, Société/Entité.
  • Protocole responsable (Nom & Téléphone direct).
  • Nombre d'accompagnateurs prévus.
- Étape 3 : Choix du Salon & Exigences Particulières
  • Sélection du salon (Salon SOLIDARITÉ, Salons VIP).
  • Besoins spécifiques (Régime alimentaire, Assistance PMR, Traitement bagages).
  • Confirmation et génération immédiate du Pass.

PAGE P05 - LISTE "MES RÉSERVATIONS" & SUIVI DES VOLS
- Onglets de filtrage : "À venir", "Passages Passés", "Annulées".
- Cartes de réservation dépliables avec détails complets.
- RÈGLE MÉTIER : Bouton "Modifier" / "Annuler" disponible jusqu'à 2 HEURES avant le vol. Passé ce délai, contact direct requis avec la supervision.

PAGE P06 - PASS NUMÉRIQUE VIP & QR CODE
- Affichage plein écran élégant du Pass VIP avec bordure Or.
- QR Code dynamique sécurisé pour scan instantané à l'entrée du salon par l'hôtesse.
- Alertes en direct sur les changements de porte ou retard de vol.

PAGE P07 - PROFIL & PARAMÈTRES
- Gestion des informations de l'organisation et des contacts protocolaires.
- Préférences d'affichage (Mode Clair / Mode Sombre).
- Historique global des facturations/quotas d'accès de la société.

--- VOLET 2 : DASHBOARD WEB / DESKTOP (ADMINISTRATION & EXPLOITATION SALT) ---

PAGE D01 - CENTRE DE CONTRÔLE & PLANNING SALON EN TEMPS RÉEL (Vue Hôtesses & Agents)
- En-tête : Horloge Aéroportuaire GMT, Sélecteur de Salon actif, Barre de recherche rapide (Nom passager, Vol, Société).
- Tableau de Bord / Kanban Interactif "Aujourd'hui au Salon" :
  • Colonne 1 : VIP Attendus (Réservations confirmées à venir).
  • Colonne 2 : VIP Présents au Salon (Passagers ayant effectué le Check-in).
  • Colonne 3 : VIP Embarqués / Partis.
- Bouton Action Flash "Check-in Passager" : Scan QR Code ou validation en 1 clic.
- Modal d'enregistrement rapide pour "Passages Impromptus / VIP Sans Réservation préalable".

PAGE D02 - GESTION DU REGISTRE EN DIRECT "ÉTAT PASSAGER"
- Grille de données miroir du registre officiel : Date, N°, Vol, Provenance/Destination, Noms & Prénoms, Nationalité, Profession, Société, Accompagnateurs, Hôtesse Affectée.
- Filtres avancés par plage de dates, par compagnie aérienne ou par entité.
- Affectation des hôtesses responsables du suivi de chaque VIP.

PAGE D03 - VALIDATION & SUPERVISION DES RÉSERVATIONS (Vue Superviseur & Chef Service)
- Vue tabulaire complète de toutes les demandes émises par les protocoles.
- Actions de supervision : Valider, Réassigner de salon, Modifier les détails (sans restriction de temps), Annuler, Marquer comme "Non Présent".
- Journal d'audit complet (Traçabilité : Qui a créé, modifié ou annulé quelle réservation et à quelle heure).

PAGE D04 - CENTRE D'EXPORTATION & GESTION DES FICHIERS CONFORMES (Téléchargements)
- Zone dédiée au téléchargement des rapports officiels générés automatiquement au format Excel et PDF/Word conforme aux grilles de la SALT (voir Section 4).

PAGE D05 - TABLEAU DE BORD EXÉCUTIF & ANALYTICS (Vue Directrice DOA & Direction SALT)
- Indicateurs Clés de Performance (KPIs) : Total Passagers du mois, Taux d'occupation par heure, Répartition Invités SALT vs Abonnés vs Passages Ponctuels.
- Graphiques interactifs de fréquentation hebdomadaire et mensuelle.
- Bilan synthétique par entité/ministère abonné.

PAGE D06 - ADMINISTRATION DU SYSTÈME & DROITS
- Gestion des utilisateurs et profils (Admin, Directrice, Superviseur, Hôtesse, Protocole/Abonné).
- Configuration des salons, des quotas des entreprises et des compagnies aériennes.
- Sauvegardes de la base de données et logs de sécurité.

----------------------------------------------------------------------
4. MODULE DE GÉNÉRATION ET TÉLÉCHARGEMENT DES FICHIERS OFFICIELS
----------------------------------------------------------------------
L'application doit intégrer un moteur d'exportation de données (ex: Pandas, OpenPyXL, WeasyPrint) capable de reconstituer EXACTEMENT la structure, les en-têtes, les colonnes et le style des fichiers historiques fournis par la SALT.

FICHIERS GÉNÉRÉS ET TÉLÉCHARGEABLES EN 1 CLIC :

1. FICHIER `RESERVATION.xlsx` (Registre Quotidien/Mensuel des Réservations) :
   - Format : Tableur Excel (.xlsx).
   - Structure des colonnes conforme : `VOL`, `PROVENANCE`, `NOMS ET PRENOMS`, `PROFESSION`, `DATE`, `SOCIETE`, `HOTESSE`, `PROTOCOLE`.
   - Utilisation : Exportable par jour ou par mois pour l'archivage du service de réservation.

2. FICHIER `ETAT PASSAGER.xlsx` (Registre Officiel de Contrôle des Présences) :
   - Format : Tableur Excel (.xlsx).
   - En-tête officiel : "ETAT PASSAGERS DE [MOIS] [ANNÉE]".
   - Structure des colonnes conforme : `DATE`, `NUM`, `VOL`, `PROVENANCE`, `NOMS ET PRENOMS`, `NATIONALITE`, `PROFESSION`, `SOCIETE`, `ACCOMPAGNATEUR`.
   - Utilisation : Téléchargeable à la fin de chaque journée ou de chaque mois par l'Hôtesse et le Superviseur.

3. FICHIER `RAPPORT D'ACTIVITE SOLIDARITE JUIN 2026.docx` / PDF (Bilan Mensuel Activité Salon) :
   - Format : Document Word (.docx) ou PDF Imprimable.
   - En-tête : SALT / DE / SAE - "Détail mensuel des traitements VIP au Salon SOLIDARITE".
   - Structure du tableau matriciel conforme :
     • Découpage par périodes : DU 01 AU 07, DU 08 AU 14, DU 15 AU 21, DU 22 AU 28, DU 29 AU 30 + TOTAL.
     • Colonnes par jours de la semaine : L, M, M, J, V, S, D, Total, Observations.
     • Sections de synthèse : Invités SALT, Passages Ponctuels, Abonnés, Commentaires.

----------------------------------------------------------------------
5. PILE TECHNIQUE & SÉCURITÉ
----------------------------------------------------------------------
- Backend : Python / Django 5.x + Django REST Framework (DRF).
- Base de Données : PostgreSQL avec support JSONB & Index sur les vols et dates.
- Frontend : Next.js (React) ou Vite + React (TypeScript) configuré en PWA avec Service Workers.
- CSS & UI : Tailwind CSS v3/v4 + Shadcn UI + Lucide Icons.
- Temps Réel : WebSockets (Django Channels) pour la mise à jour instantanée du planning des hôtesses lors d'une nouvelle réservation.
- Moteur d'export : OpenPyXL (Excel), python-docx (Word) et ReportLab/WeasyPrint (PDF).

----------------------------------------------------------------------
RÉSULTAT ATTENDU :
Génère la spécification technique complète du projet, la modélisation de la base de données (modèles Django/SQL), les endpoints de l'API REST, la configuration des thèmes Clair/Sombre Tailwind, ainsi que le code exemple pour l'exportation exacte du fichier `ETAT PASSAGER.xlsx`.