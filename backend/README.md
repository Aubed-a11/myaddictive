# Backend — Spring Boot

API REST unique (Java 17, Spring Boot 3.2, base SQLite). Démarrage : `mvn spring-boot:run` → http://localhost:8080

## Organisation (un dossier = un domaine)

```
src/main/java/bj/myaddictive/
├── app/         Démarrage de l'application (MyAddictiveApplication)
├── securite/    Connexion JWT, CORS, protection des routes (ex-passerelle)
├── compte/      Inscription, connexion, profil, favoris, utilisateurs
├── media/       Articles et actualités
├── live/        Événements, billetterie, chaînes, podcasts, chat en direct
├── votes/       Compétitions, candidats, votes, portefeuille de pièces
├── boutique/    Vendeurs, produits, panier, commandes
└── paiement/    Transactions, KKiaPay, MTN MoMo, confirmation
```

Chaque domaine suit le même découpage : `controller/` (routes HTTP) → `service/` (logique) → `repository/` (base de données) → `domain/` (entités), avec `dto/` pour les formats d'échange.

Configuration : `src/main/resources/application.yml` (secrets par variables d'environnement).

## Routes principales

| Préfixe | Domaine | Accès |
|---|---|---|
| `/api/compte/auth/**` | inscription, connexion | public |
| `/api/compte/moi`, `/favoris` | profil | connecté |
| `/api/media/articles` | articles | lecture publique, écriture admin |
| `/api/live/evenements`, `/chaines`, `/podcasts` | live et billetterie | lecture publique, écriture admin |
| `/api/votes/competitions`, `/voter` | votes | lecture publique, voter = connecté |
| `/api/boutique/produits`, `/panier`, `/commandes` | boutique | lecture publique, achat = connecté |
| `/api/paiement/**` | paiements | connecté ; webhooks publics |

Règles d'accès détaillées : `securite/FiltreAuthentification.java`.
