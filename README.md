# My Addictive — application web

Application web responsive (téléphone, tablette, ordinateur) :

| Dossier | Contenu | Technologie | Port |
|---|---|---|---|
| `backend/` | API (compte, média, live/billetterie, votes, boutique, paiement) | Spring Boot 3.2 / Java 17, base SQLite | 8080 |
| `frontend/` | Application web pour le public | React 18 + Vite + react-router (HTML/CSS classique) | 5173 |
| `admin-dashboard/` | Back-office administrateur | React + Vite | 5174 |

Rubriques : Média, Billetterie, Livestream, Votes, Boutique. Il n'y a ni Docker, ni CI/CD, ni passerelle : le backend est un seul programme Spring Boot.

Détail de chaque partie : [`backend/README.md`](backend/README.md) et [`frontend/README.md`](frontend/README.md).

## Lancer en local

Prérequis : Java 17, Maven 3.9+, Node 18+.

```bash
# 1) Backend  -> http://localhost:8080
cd backend
mvn spring-boot:run

# 2) Application web  -> http://localhost:5173
cd frontend
npm install
npm run dev

# 3) (facultatif) Back-office  -> http://localhost:5174
cd admin-dashboard
npm install
npm run dev
```

Vérification rapide du vrai backend une fois démarré : `./tester-api.sh` (routes publiques, routes protégées, blocages internes, inscription/connexion).

La base SQLite est créée au premier démarrage dans `backend/data/myaddictive.db`. Le compte administrateur initial vient de `ADMIN_EMAIL` / `ADMIN_MOT_DE_PASSE` (valeurs de développement par défaut dans `application.yml` : **à changer** hors développement).

## Configuration

Variables d'environnement du backend (toutes facultatives en développement) :

`JWT_SECRET`, `CORS_ORIGINS` (ex. `https://mon-site.com`), `APP_DB_PATH`, `MEDIA_UPLOADS_PATH`, `COMPTE_UPLOADS_PATH`, `ADMIN_EMAIL`, `ADMIN_MOT_DE_PASSE`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `KKIAPAY_*`, `MTN_MOMO_*`, `SPRING_PROFILES_ACTIVE=prod` (refuse de démarrer avec le secret JWT de développement).

Front / back-office : copier `.env.example` en `.env` et régler `VITE_API_BASE_URL` si le backend n'est pas sur `http://localhost:8080`.

## Produire les versions finales

```bash
cd backend && mvn clean package          # -> backend/target/*.jar  (java -jar ...)
cd frontend && npm run build             # -> frontend/dist/ (fichiers statiques)
cd admin-dashboard && npm run build      # -> admin-dashboard/dist/
```

`frontend/vercel.json` contient la règle de réécriture « une seule page » si le front est publié sur Vercel (ou tout hébergeur statique avec la même règle).

## Sécurité (ex-passerelle, maintenant dans le backend)

Le filtre `securite/FiltreAuthentification` vérifie le jeton JWT des routes protégées (achat, vote, panier, compte…), bloque `/api/interne/**`, la création externe de transactions et la confirmation générique de paiement. Les appels d'un domaine à l'autre utilisent un jeton interne aléatoire, régénéré à chaque démarrage.

## Base de données existante (migration Musique)

Si vous gardez une ancienne base `myaddictive.db`, les tables `musique_*` restent inertes. Pour que l'historique de paiements se charge, supprimez les anciennes transactions de titres/albums (sauvegardez d'abord le fichier) :

```sql
DELETE FROM paiement_transaction WHERE type_objet IN ('TITRE','ALBUM');
-- facultatif : DROP TABLE musique_titre; DROP TABLE musique_album; DROP TABLE musique_achat; DROP TABLE musique_ecoute;
```
