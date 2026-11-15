import { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Etat favori d'un contenu (ARTICLE, EVENEMENT, PRODUIT) pour l'utilisateur connecte.
 * `basculer()` renvoie false quand il faut d'abord se connecter.
 */
export default function useFavori(typeCible, referenceId) {
  const { estConnecte } = useAuth();
  const [favoriId, setFavoriId] = useState(null);

  useEffect(() => {
    setFavoriId(null);
    if (!estConnecte || referenceId == null) return undefined;
    let actif = true;
    client.get('/api/compte/favoris')
      .then(({ data }) => {
        const existant = (data || []).find((f) => f.typeCible === typeCible && String(f.referenceId) === String(referenceId));
        if (actif && existant) setFavoriId(existant.id);
      })
      .catch(() => {});
    return () => { actif = false; };
  }, [estConnecte, typeCible, referenceId]);

  const basculer = useCallback(async () => {
    if (!estConnecte) return false;
    if (favoriId) {
      const ancien = favoriId;
      setFavoriId(null);
      try { await client.delete(`/api/compte/favoris/${ancien}`); } catch { setFavoriId(ancien); }
    } else {
      try {
        const { data } = await client.post('/api/compte/favoris', { typeCible, referenceId: String(referenceId) });
        setFavoriId(data.id);
      } catch { /* inchange */ }
    }
    return true;
  }, [estConnecte, favoriId, typeCible, referenceId]);

  return { favori: !!favoriId, basculer };
}
