import React from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import useCharger, { contenu } from '../utils/useCharger';
import { formaterLibelle } from '../utils/libelles';
import { EntetePage, Etat, Retour } from '../components/ui';
import CarteProduit from '../components/CarteProduit';

export default function BoutiqueVendeur() {
  const { vendeurId } = useParams();
  const { data, chargement, erreur } = useCharger(async () => {
    const [{ data: vendeur }, { data: p }] = await Promise.all([
      client.get(`/api/boutique/vendeurs/${vendeurId}`),
      client.get('/api/boutique/produits', { params: { vendeurId, page: 0, size: 50 } }),
    ]);
    return { vendeur, produits: contenu(p) };
  }, [vendeurId]);

  return (
    <>
      <Retour vers="/boutique" />
      <Etat chargement={chargement} erreur={erreur}>
        {data && (
          <>
            <EntetePage titre={data.vendeur.nomBoutique} sousTitre={formaterLibelle(data.vendeur.categorie)} />
            {data.produits.length === 0
              ? <p className="attenue">Cette boutique n'a pas encore de produits.</p>
              : <div className="grille etroite">{data.produits.map((p) => <CarteProduit key={p.id} produit={p} />)}</div>}
          </>
        )}
      </Etat>
    </>
  );
}
