# Frontend — React (web responsive)

Application **React 18 + Vite**, en HTML/CSS classique (aucune bibliothèque mobile) :
téléphone, tablette et ordinateur partagent les mêmes pages.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # version finale dans dist/
```

Adresse du backend : variable `VITE_API_BASE_URL` (voir `.env.example`), par défaut `http://localhost:8080`.

## Organisation

```
src/
├── main.jsx          Point d'entrée
├── App.jsx           Liste de toutes les adresses (routes) de l'application
├── pages/            Une page = un fichier (Hub, Media, Billetterie, Boutique, Panier…)
├── components/       Éléments réutilisables : Layout (en-tête + onglets mobiles), ui (états, champs, modale), Carrousel…
├── api/client.js     Appels au backend (jeton de connexion ajouté automatiquement)
├── context/          Session de l'utilisateur (AuthContext) et messages à l'écran (Notifications)
├── styles/base.css   Tout le design : couleurs, boutons, cartes, grilles, responsive
├── utils/            Fonctions utilitaires (formats, paiement KKiaPay, favoris, partage…)
└── assets/           Logo et images
```

## Comment ça marche

- **Routage** : `react-router-dom`. Chaque rubrique a ses adresses (`/media`, `/billetterie`, `/live`, `/votes`, `/boutique`, `/compte`…), voir `App.jsx`.
- **Accès libre** : on peut tout consulter sans compte. Les pages qui demandent une connexion (panier, billets, wallet…) affichent un bouton « Se connecter » puis ramènent à la page d'origine (`?retour=`).
- **Chargement des données** : le hook `useCharger` (dans `utils/`) gère chargement, erreur et rechargement ; les composants `Etat`/`Vide` affichent les cas « liste vide » ou « erreur ».
- **Responsive** : en-tête de navigation sur ordinateur, barre d'onglets en bas sur téléphone (voir `Layout.jsx` et `base.css`).
- **Paiement** : KKiaPay (Mobile Money / carte) ou paiement en agence — les clés privées restent côté backend.
