import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import client from '../api/client';
import useCharger, { contenu } from '../utils/useCharger';
import { dateHeure, formaterLibelle, fcfa } from '../utils/libelles';
import { Etat, EntetePage, Filtres, Image } from '../components/ui';

const FILTRES = [
  { valeur: '', libelle: 'Tous' },
  { valeur: 'A_VENIR', libelle: 'À venir' },
  { valeur: 'TERMINE', libelle: 'Terminés' },
];

export default function Billetterie() {
  const [statut, setStatut] = useState('');
  const [recherche, setRecherche] = useState('');
  const { data: evenements, chargement, erreur } = useCharger(
    () => client.get('/api/live/evenements', { params: { statut: statut || undefined, page: 0, size: 30 } }).then((r) => contenu(r.data)),
    [statut], [],
  );
  const q = recherche.trim().toLowerCase();
  const affiches = evenements.filter((e) => !q || e.titre?.toLowerCase().includes(q) || e.lieu?.toLowerCase().includes(q));

  return (
    <>
      <EntetePage titre="Billetterie" sousTitre="Réservez vos places pour les événements">
        <Link className="bouton secondaire petit" to="/mes-billets">Mes billets</Link>
        <Link className="bouton petit" to="/evenements/nouveau">Créer un événement</Link>
      </EntetePage>
      <div className="champ" style={{ position: 'relative', maxWidth: 420 }}>
        <input type="search" aria-label="Rechercher un événement" placeholder="Rechercher un événement…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ paddingLeft: 38 }} />
        <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--attenue)' }} />
      </div>
      <Filtres options={FILTRES} valeur={statut} onChoisir={setStatut} />
      <Etat chargement={chargement} erreur={erreur} vide={affiches.length === 0} titreVide="Aucun événement" texteVide={recherche ? 'Aucun résultat pour cette recherche.' : 'Aucun événement pour ce filtre.'}>
        <div className="grille">
          {affiches.map((e) => (
            <Link key={e.id} to={`/evenements/${e.id}`} className="carte-media">
              <Image className="image" src={e.imageUrl} alt="" />
              <div className="corps">
                <span className={`badge ${e.statut === 'EN_DIRECT' ? 'rouge' : ''}`}>{formaterLibelle(e.statut)}</span>
                <h3>{e.titre}</h3>
                <p className="petit attenue">{e.lieu}</p>
                {e.dateDebut && <p className="petit attenue">{dateHeure(e.dateDebut)}</p>}
                {e.payant && <p className="or" style={{ fontWeight: 700 }}>{fcfa(e.prixStandardFcfa)}</p>}
              </div>
            </Link>
          ))}
        </div>
      </Etat>
    </>
  );
}
