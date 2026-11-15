import React from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { EntetePage, Etat, Image, Retour } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

async function charger() {
  const { data: votes } = await client.get('/api/votes/mes-votes');
  const candidats = {};
  await Promise.all(votes.map(async (v) => {
    try { candidats[v.candidatId] = (await client.get(`/api/votes/candidats/${v.candidatId}`)).data; } catch { /* candidat supprimé */ }
  }));
  return { votes, candidats };
}

function Liste() {
  const { data, chargement, erreur } = useCharger(charger, [], { votes: [], candidats: {} });
  return (
    <Etat chargement={chargement} erreur={erreur} vide={!data.votes.length} titreVide="Aucun vote" texteVide="Vous n'avez pas encore voté.">
      <div className="liste">
        {data.votes.map((v) => {
          const c = data.candidats[v.candidatId];
          return (
            <Link key={v.id} to={c ? `/candidats/${v.candidatId}` : '#'} className="ligne">
              <Image className="mini" src={c?.photoUrl} alt="" />
              <div className="grow"><strong>{c ? c.nom : `Candidat #${v.candidatId}`}</strong><p className="petit attenue">{new Date(v.dateVote).toLocaleString('fr-FR')}</p></div>
            </Link>
          );
        })}
      </div>
    </Etat>
  );
}

export default function HistoriqueVotes() {
  return (
    <>
      <Retour vers="/compte" />
      <EntetePage titre="Historique de mes votes" sousTitre="Chaque vote correspond à une pièce définitivement dépensée." />
      <ExigerConnexion message="Connectez-vous pour voir vos votes."><Liste /></ExigerConnexion>
    </>
  );
}
