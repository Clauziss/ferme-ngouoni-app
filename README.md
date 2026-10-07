# Ferme de Ngouoni — Appli web de gestion

Application de gestion pour ferme avicole multi-espèces (poulets de chair, canards,
pintades, pondeuses réforme, coquelets) : production, dépenses, ventes, reproduction,
abonnés (clients réguliers) et rappels/notifications.

Reprend le même modèle de données que le classeur Excel fourni précédemment, avec en
plus : comptes utilisateurs (admin/employé), rappels programmés (vaccination, alerte
de réforme des pondeuses...), et un graphique de tendance ventes/dépenses.

## Stack technique

- **Backend** : Node.js + Express, API REST, base PostgreSQL via Sequelize, auth JWT
- **Frontend** : React (Vite), React Router, Recharts (graphique)
- **Notifications** : tâche planifiée quotidienne + endpoint `/api/rappels/dus`

## 1. Prérequis

- Node.js 18+ et npm
- PostgreSQL (localement, ou via Docker)

## 2. Lancer la base de données

Avec Docker :
```bash
docker compose up -d
```
Cela démarre PostgreSQL sur `localhost:5432` (base `ferme_avicole`, utilisateur
`postgres`, mot de passe `postgres`).

Sans Docker : installe PostgreSQL, crée une base `ferme_avicole` (via pgAdmin par
exemple), et adapte `backend/.env` avec ton mot de passe.

## 3. Installer et lancer le backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed     # crée les tables + insère des données de test (facultatif mais conseillé)
npm run dev       # démarre l'API sur http://localhost:4000
```

Le compte créé par `npm run seed` :
- Email : `admin@ferme.local`
- Mot de passe : `admin1234`

Pour créer d'autres comptes (employés), utilise `POST /api/auth/inscrire` avec
`{ "nom": "...", "email": "...", "motDePasse": "...", "role": "employe" }`.

## 4. Installer et lancer le frontend

Dans un second terminal :
```bash
cd frontend
npm install
npm run dev
```
Ouvre ensuite `http://localhost:5173`. Le frontend redirige automatiquement les
appels `/api/...` vers le backend (voir `vite.config.js`).

## 5. Structure du projet

```
ferme-app/
  backend/
    src/
      config/database.js       # connexion Sequelize/PostgreSQL
      models/                  # Lot, ProductionOeuf, ProductionChair, Reproduction,
                                # Depense, Vente, Abonne, Rappel, Utilisateur
      controllers/              # auth, dashboard (rentabilité, alerte réforme, tendance), rappels
      routes/                   # montage des routes, CRUD générique par entité
      middleware/auth.js        # JWT + contrôle de rôle
      jobs/reminderCron.js      # tâche planifiée quotidienne
      seed.js                   # données de test
  frontend/
    src/
      assets/logo.jpg           # logo Ferme de Ngouoni
      pages/                    # une page par module
      components/EntityPage.jsx # tableau + formulaire CRUD générique
      components/Sidebar.jsx    # menu avec logo et bulles d'info au survol
      context/AuthContext.jsx   # session utilisateur
      api/client.js             # appels à l'API
  docker-compose.yml            # PostgreSQL prêt à l'emploi
```

## 6. Modules disponibles

| Module | Ce qu'il fait |
|---|---|
| Cheptel | Création/suivi des groupes d'animaux (type, effectif, mortalité, statut prêt/juvénile) |
| Production œufs | Pondus, cassés, livrés, en stock — en cartons + palettes (1 carton = 12 palettes) |
| Suivi de masse | Poids min/max/moyen par type d'animal (sujet) |
| Reproduction | Couvées, taux d'éclosion (non utilisé pour l'instant — la ferme achète ses poussins) |
| Dépenses | Par sujet (type d'animal ou "Ferme"), catégorisées (aliment, santé...) |
| Ventes | Œufs (grossiste/carton ou détail/palette), volaille vivante, viande — liées à un client |
| Abonnés | Clients réguliers |
| Rappels | Notifications programmées (vaccination...) |
| Tableau de bord | Ventes/dépenses par type, graphique de tendance 30 jours, suivi de la ponte |
| Analyse | Filtrable par type et période : effectifs, mortalité, production, ventes, dépenses |
| Rapport clients | Achats par client sur une période donnée, imprimable |

## 7. Rôles

- **Admin** : accès complet, y compris suppression de données et gestion des comptes
- **Employé** : peut consulter et ajouter des données, ne peut pas supprimer

## 8. Identité visuelle et impression

Palette tirée du logo Ferme de Ngouoni : vert forêt (`#1F4A2E`), or (`#C89B3C`),
fond crème (`#FBF7EC`), avec le rouge brique de la crête réservé aux alertes.
Le menu et la clochette de notifications affichent une bulle d'info au survol ;
les cartes du tableau de bord ont une animation d'entrée et un effet de survol.

Le Tableau de bord, l'Analyse et le Rapport clients ont un bouton "🖨️ Imprimer"
qui déclenche l'impression du navigateur avec une mise en page épurée (menu et
boutons masqués, en-tête avec logo).

## 9. Prochaines étapes possibles

- Photos des lots (santé, croissance)
- Notifications par e-mail (en plus de la clochette dans l'appli)
- Export Excel/PDF du tableau de bord
- Application mobile (React Native) pour la saisie terrain
