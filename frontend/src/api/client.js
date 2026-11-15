import axios from 'axios';

/** Adresse du backend Spring Boot : VITE_API_BASE_URL (voir .env.example), sinon http://localhost:8080. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

// Ajoute automatiquement le jeton de connexion a chaque appel.
client.interceptors.request.use((config) => {
  const jeton = lireStockage('jeton');
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  return config;
});

// Quand le jeton expire en cours d'usage, AuthContext est prevenu pour repasser en visiteur.
let surDeconnexionAuto = null;
export function definirGestionnaireDeconnexionAutomatique(fn) {
  surDeconnexionAuto = fn;
}

// Transforme les erreurs du backend ({ error: "message" }) en messages lisibles.
client.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response) {
      const message = erreur.response.data?.error || erreur.response.data?.message || `Erreur du serveur (code ${erreur.response.status}).`;
      if (erreur.response.status === 401 && lireStockage('jeton')) {
        supprimerStockage('jeton', 'utilisateur');
        surDeconnexionAuto?.();
      }
      return Promise.reject(new Error(message));
    }
    if (erreur.request) {
      return Promise.reject(new Error(`Impossible de joindre le serveur (${API_BASE_URL}). Verifiez que le backend est demarre.`));
    }
    return Promise.reject(new Error(`Erreur inattendue : ${erreur.message}`));
  }
);

/** Acces au stockage du navigateur, sans jamais planter (navigation privee, stockage bloque...). */
export function lireStockage(cle) {
  try { return window.localStorage.getItem(cle); } catch { return null; }
}
export function ecrireStockage(cle, valeur) {
  try { window.localStorage.setItem(cle, valeur); } catch { /* stockage indisponible */ }
}
export function supprimerStockage(...cles) {
  try { cles.forEach((c) => window.localStorage.removeItem(c)); } catch { /* stockage indisponible */ }
}

/** Adresse complete d'une image renvoyee par le backend (chemin relatif ou URL absolue). */
export function urlImage(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default client;
