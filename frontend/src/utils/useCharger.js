import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Charge des donnees au montage (et quand les dependances changent).
 * Renvoie { data, chargement, erreur, recharger, setData }.
 *   const { data: articles, chargement, erreur } = useCharger(() => client.get('/api/media/articles').then(r => r.data), []);
 */
export default function useCharger(chargeur, deps = [], initial = null) {
  const [data, setData] = useState(initial);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const actif = useRef(true);
  const chargeurRef = useRef(chargeur);
  chargeurRef.current = chargeur;

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const resultat = await chargeurRef.current();
      if (actif.current) setData(resultat);
    } catch (e) {
      if (actif.current) setErreur(e.message || 'Erreur de chargement.');
    } finally {
      if (actif.current) setChargement(false);
    }
  }, []);

  useEffect(() => {
    actif.current = true;
    recharger();
    return () => { actif.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, chargement, erreur, recharger, setData };
}

/** Une page (Spring Page) -> tableau d'elements. */
export const contenu = (reponse) => (Array.isArray(reponse) ? reponse : reponse?.content || []);
