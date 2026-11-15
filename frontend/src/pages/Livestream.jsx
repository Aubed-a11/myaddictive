import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import client from '../api/client';
import useCharger, { contenu } from '../utils/useCharger';
import { EntetePage, Etat, Filtres, Image } from '../components/ui';
import Carrousel, { Diapo } from '../components/Carrousel';

const FILTRES = [
  { valeur: '', libelle: 'Tous les lives' },
  { valeur: 'EN_DIRECT', libelle: 'En direct' },
  { valeur: 'REPLAY', libelle: 'Replay' },
];

export default function Livestream() {
  const [statut, setStatut] = useState('');
  const { data: evenements, chargement, erreur } = useCharger(
    () => client.get('/api/live/evenements', { params: { statut: statut || undefined, page: 0, size: 30 } }).then((r) => contenu(r.data)),
    [statut], [],
  );
  const { data: directs } = useCharger(
    () => client.get('/api/live/evenements', { params: { statut: 'EN_DIRECT', page: 0, size: 6 } }).then((r) => contenu(r.data)).catch(() => []),
    [], [],
  );
  const affiches = evenements.filter((e) => statut !== '' || e.statut !== 'A_VENIR');

  return (
    <>
      <EntetePage titre="Livestream" sousTitre="Directs, replays et chat en temps réel">
        <Link className="bouton secondaire petit" to="/chaines">Chaînes</Link>
        <Link className="bouton secondaire petit" to="/podcasts">Podcasts</Link>
        <Link className="bouton secondaire petit" to="/favoris">Favoris</Link>
      </EntetePage>

      {directs?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Carrousel>
            {directs.map((e) => <Diapo key={e.id} vers={`/evenements/${e.id}`} image={e.imageUrl} etiquette="En direct" titre={e.titre} sousTitre={e.lieu} />)}
          </Carrousel>
        </div>
      )}

      <Filtres options={FILTRES} valeur={statut} onChoisir={setStatut} />
      <Etat chargement={chargement} erreur={erreur} vide={affiches.length === 0} titreVide="Aucun contenu" texteVide="Aucun direct ou replay pour le moment.">
        <div className="grille">
          {affiches.map((e) => (
            <Link key={e.id} to={`/evenements/${e.id}`} className="carte-media">
              <div style={{ position: 'relative' }}>
                <Image className="image" src={e.imageUrl} alt="" />
                <PlayCircle size={34} color="#fff" style={{ position: 'absolute', inset: 0, margin: 'auto' }} />
                {e.statut === 'EN_DIRECT' && <span className="puce-live" style={{ position: 'absolute', top: 10, left: 10 }}>EN DIRECT</span>}
              </div>
              <div className="corps">
                <h3>{e.titre}</h3>
                <p className="petit attenue">{e.lieu}</p>
                <p className="lien-or petit">{e.statut === 'EN_DIRECT' ? 'Regarder en direct' : 'Voir le replay'}</p>
              </div>
            </Link>
          ))}
        </div>
      </Etat>
    </>
  );
}
