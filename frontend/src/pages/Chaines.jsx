import React from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import useCharger, { contenu } from '../utils/useCharger';
import { EntetePage, Etat, Image, Retour } from '../components/ui';

export default function Chaines() {
  const { data: chaines, chargement, erreur } = useCharger(() => client.get('/api/live/chaines', { params: { page: 0, size: 30 } }).then((r) => contenu(r.data)), [], []);
  return (
    <>
      <Retour vers="/live" />
      <EntetePage titre="Chaînes" sousTitre="Artistes et organisateurs à suivre" />
      <Etat chargement={chargement} erreur={erreur} vide={!chaines?.length} titreVide="Aucune chaîne" texteVide="Aucune chaîne pour le moment.">
        <div className="grille etroite">
          {chaines?.map((c) => (
            <Link key={c.id} to={`/chaines/${c.id}`} className="carte-media">
              <Image className="image carre" src={c.imageUrl} alt="" />
              <div className="corps">
                <h3>{c.nom}</h3>
                <p className="petit attenue">{c.nombreAbonnes} abonné{c.nombreAbonnes > 1 ? 's' : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      </Etat>
    </>
  );
}
