import React from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { EntetePage, Etat, Image, Retour } from '../components/ui';

export default function Albums() {
  const { data: albums, chargement, erreur } = useCharger(() => client.get('/api/media/albums').then((r) => r.data), [], []);
  return (
    <>
      <Retour vers="/media" />
      <EntetePage titre="Albums & mixtapes" sousTitre="Les sorties de la scène urbaine, avec leurs clips" />
      <Etat chargement={chargement} erreur={erreur} vide={albums.length === 0} titreVide="Aucun album" texteVide="Les albums arrivent bientôt.">
        <div className="grille">
          {albums.map((a) => (
            <Link key={a.id} to={`/media/albums/${a.id}`} className="carte-media">
              <Image className="image carre" src={a.imageUrl} alt="" />
              <div className="corps">
                <h3>{a.titre}</h3>
                <p className="petit attenue">{[a.artiste, a.annee].filter(Boolean).join(' · ')}</p>
              </div>
            </Link>
          ))}
        </div>
      </Etat>
    </>
  );
}
