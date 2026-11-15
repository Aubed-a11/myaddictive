import React from 'react';
import { Award, ShoppingBag, Ticket, TrendingUp } from 'lucide-react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { EntetePage, Etat, Retour } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

const SEUILS = [
  { min: 0, libelle: 'Débutant', couleur: '#9A97AE' },
  { min: 5, libelle: 'Bronze', couleur: '#CD7F32' },
  { min: 15, libelle: 'Argent', couleur: '#C0C0C0' },
  { min: 30, libelle: 'Or', couleur: '#FFCC21' },
  { min: 50, libelle: 'Platine', couleur: '#8B5CF6' },
];

/** Agrège les historiques déjà exposés par chaque rubrique (aucune donnée supplémentaire côté backend). */
async function charger() {
  const r = await Promise.allSettled([
    client.get('/api/votes/mes-votes'),
    client.get('/api/live/billets/mes-billets'),
    client.get('/api/boutique/commandes'),
  ]);
  const compter = (x) => (x.status === 'fulfilled' ? x.value.data.length : 0);
  return { votes: compter(r[0]), billets: compter(r[1]), achats: compter(r[2]) };
}

function Contenu() {
  const { data, chargement, erreur } = useCharger(charger, [], { votes: 0, billets: 0, achats: 0 });
  const total = data.votes + data.billets + data.achats;
  const badge = [...SEUILS].reverse().find((s) => total >= s.min) || SEUILS[0];
  return (
    <Etat chargement={chargement} erreur={erreur}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="carte centre" style={{ borderColor: badge.couleur }}>
          <span className="bouton-icone" style={{ background: badge.couleur, color: '#0a0a0f', width: 56, height: 56 }}><Award size={28} /></span>
          <h2 style={{ marginTop: 8 }}>{badge.libelle}</h2>
          <p className="attenue">{total} action{total > 1 ? 's' : ''} au total</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
          {[[TrendingUp, 'Votes', data.votes, 'var(--c-votes)'], [Ticket, 'Billets', data.billets, 'var(--c-billetterie)'], [ShoppingBag, 'Achats', data.achats, 'var(--c-boutique)']].map(([Icone, libelle, valeur, couleur]) => (
            <div key={libelle} className="carte centre" style={{ padding: 14 }}>
              <Icone size={20} color={couleur} />
              <p style={{ fontSize: 24, fontWeight: 800 }}>{valeur}</p>
              <p className="petit attenue">{libelle}</p>
            </div>
          ))}
        </div>
        {SEUILS.some((s) => s.min > total) && <h2 className="titre-section">Prochains paliers</h2>}
        {SEUILS.filter((s) => s.min > total).map((s) => (
          <p key={s.libelle} style={{ margin: '8px 0' }}><span className="pastille-statut" style={{ background: s.couleur }} />{s.libelle} — à partir de {s.min} actions ({s.min - total} restantes)</p>
        ))}
      </div>
    </Etat>
  );
}

export default function Badges() {
  return (
    <>
      <Retour vers="/compte" />
      <EntetePage titre="Mes badges de fidélité" />
      <ExigerConnexion message="Connectez-vous pour voir vos badges."><Contenu /></ExigerConnexion>
    </>
  );
}
