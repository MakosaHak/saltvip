# SALT VIP

Application de gestion des salons VIP de l’aéroport Gnassingbé Eyadema (Lomé).

Elle permet aux services de protocole de réserver un accueil salon, aux hôtesses d’enregistrer les passagers, et à l’administration SALT de superviser le planning, le registre, les exports et les analytics.

Le projet a été repris depuis [MakosaHak/saltvip](https://github.com/MakosaHak/saltvip).

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- React Router 7

Les données sont stockées en mémoire / `localStorage` (démo locale, sans backend).

## Lancer en local

Prérequis : Node.js 22.

```bash
npm install
npm run dev
```

L’application écoute sur [http://127.0.0.1:8443](http://127.0.0.1:8443) par défaut (`PORT` pour changer le port).

```bash
npm run build
npm run preview
```

Le build de production écrit dans `dist/` (HTML, CSS, JS). Pour un déploiement **glisser-déposer** (Netlify Drop, Cloudflare Pages, etc.) :

```bash
npm run build:deploy
```

Ça produit `dist/` et l’archive `saltvip-deploy.zip`. Dépose le **contenu de `dist/`** (ou le zip si l’hébergeur l’accepte). Les routes `/connexion`, `/admin`, etc. sont redirigées vers `index.html`.

## Comptes de démonstration

| Rôle      | Email            | Mot de passe      | Accès                          |
|-----------|------------------|-------------------|--------------------------------|
| Admin     | admin@salt.tg    | SaltAdmin2026     | Planning, supervision, exports |
| Hôtesse   | akosua@salt.tg   | SaltHostess2026   | Réservation, checking          |
| Protocole | afia@gouv.tg     | SaltProto2026     | Réservation publique           |

## Parcours

- `/connexion` — authentification
- `/reservation` — le protocole réserve pour un ou plusieurs passagers (chaque passager peut avoir des accompagnateurs)
- `/mes-reservations` — suivi des demandes
- `/admin/reservation` — saisie interne
- `/admin/checking` — enregistrement des passagers
- `/admin/planning` — centre de contrôle
- `/admin/registre` — registre passagers
- `/admin/supervision`, `/admin/exports`, `/admin/analytics`, `/admin/systeme` — administration

## Base de données Supabase (synchronisation temps réel)

L'application peut fonctionner en **mode local** (données dans le navigateur, comportement par défaut)
ou en **mode synchronisé** avec une base Supabase partagée entre tous les postes.

### Mise en place

1. Créer un projet sur [supabase.com](https://supabase.com) (offre gratuite suffisante).
2. Dans le tableau de bord, ouvrir **SQL Editor**, coller le contenu de `supabase/schema.sql` et cliquer sur **Run**.
   Cela crée les tables `accounts`, `reservations`, `vips`, `staff`, `salons`, `compagnies`, `audit`
   et active le temps réel dessus.
3. Copier `.env.example` en `.env` et renseigner :
   - `VITE_SUPABASE_URL` : *Project Settings > API > Project URL*
   - `VITE_SUPABASE_ANON_KEY` : *Project Settings > API > anon public*
4. Relancer `npm run dev` (ou refaire `npm run build`).

Au premier démarrage, si les tables sont vides, l'application y pousse ses données de démonstration.
Ensuite, chaque création, modification ou suppression est envoyée à Supabase et répercutée
en temps réel sur tous les navigateurs ouverts.

Un indicateur dans la barre latérale admin affiche l'état : **Base en ligne**, **Connexion…**,
**Mode local** (clés absentes) ou **Sync. en erreur** (détails dans la console du navigateur).

> Les règles d'accès créées par `schema.sql` sont ouvertes (démo). À restreindre avant une mise en production.
