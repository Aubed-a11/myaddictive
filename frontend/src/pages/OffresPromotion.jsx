import React from 'react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { fcfa } from '../utils/libelles';
import { EntetePage, Etat, Retour } from '../components/ui';

export default function OffresPromotion() {
  const { data: offres, chargement, erreur } = useCharger(() => client.get('/api/media/offres-promotion').then((r) => r.data), [], []);
  return (
    <>
      <Retour vers="/media" />
      <EntetePage titre="Offres de promotion" sousTitre="Mettez en avant votre musique et vos événements auprès de notre audience." />
      <Etat chargement={chargement} erreur={erreur} vide={!offres?.length} titreVide="Aucune offre" texteVide="Aucune offre disponible pour le moment.">
        <div className="grille">
          {offres?.map((o) => (
            <div key={o.id} className="carte">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge">{o.code}</span>
                <span className="prix" style={{ fontSize: 20 }}>{fcfa(o.prixFcfa)}</span>
              </div>
              <h3 style={{ marginTop: 10 }}>{o.nom}</h3>
              <p className="attenue">{o.description}</p>
              <p className="petit" style={{ marginTop: 8 }}>Durée : {o.dureeJours} jours</p>
            </div>
          ))}
        </div>
      </Etat>
    </>
  );
}
