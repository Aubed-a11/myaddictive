import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search } from 'lucide-react';
import client from '../api/client';
import useCharger, { contenu } from '../utils/useCharger';
import { LIBELLES_PHASE } from '../utils/votes';
import { formaterLibelle } from '../utils/libelles';
import { EntetePage, Etat } from '../components/ui';
import CompteARebours from '../components/CompteARebours';

export default function Competitions() {
  const { data: competitions, chargement, erreur } = useCharger(() => client.get('/api/votes/competitions', { params: { page: 0, size: 30 } }).then((r) => contenu(r.data)), [], []);
  const [recherche, setRecherche] = useState('');
  const q = recherche.trim().toLowerCase();
  const affichees = competitions.filter((c) => !q || c.nom?.toLowerCase().includes(q));

  return (
    <>
      <EntetePage titre="Compétitions & votes" sousTitre="Musique, entrepreneuriat, tech… soutenez vos favoris">
        <Link className="bouton secondaire petit" to="/portefeuille">Mon portefeuille</Link>
        <Link className="bouton secondaire petit" to="/historique-votes">Mes votes</Link>
      </EntetePage>
      <div className="champ" style={{ position: 'relative', maxWidth: 420 }}>
        <input type="search" aria-label="Rechercher une compétition" placeholder="Rechercher une compétition…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ paddingLeft: 38 }} />
        <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--attenue)' }} />
      </div>
      <Etat chargement={chargement} erreur={erreur} vide={affichees.length === 0} titreVide="Aucune compétition" texteVide={recherche ? 'Aucun résultat pour cette recherche.' : 'Aucune compétition en cours.'}>
        <div className="grille large">
          {affichees.map((c) => (
            <Link key={c.id} to={`/votes/${c.id}`} className="carte cliquable">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start' }}>
                <h3>{c.nom}</h3>
                <span className="badge" style={{ background: 'rgba(168,85,247,.18)', color: '#d8b4fe' }}>{formaterLibelle(c.categorie || 'MUSIQUE')}</span>
              </div>
              <p className="petit attenue" style={{ marginTop: 6 }}>Saison {c.saison} · Phase : {LIBELLES_PHASE[c.phase] || formaterLibelle(c.phase)}</p>
              {c.dateFinPhase && c.phase !== 'TERMINEE' && (
                <p className="petit or" style={{ marginTop: 6 }}><Clock size={12} style={{ verticalAlign: -2 }} /> <CompteARebours dateCible={c.dateFinPhase} texteExpire="Phase terminée" /></p>
              )}
            </Link>
          ))}
        </div>
      </Etat>
    </>
  );
}
