import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, Share2 } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/Notifications';
import useCharger from '../utils/useCharger';
import { partagerContenu } from '../utils/partage';
import { formaterLibelle } from '../utils/libelles';
import { TAUX_PIECE_FCFA } from '../utils/votes';
import { Etat, Image, MessageErreur, Retour } from '../components/ui';
import CompteARebours from '../components/CompteARebours';

const MEDAILLES = ['#FFD700', '#C0C0C0', '#CD7F32'];

async function chargerCompetition(id) {
  const [{ data: candidats }, { data: classement }, { data: competition }] = await Promise.all([
    client.get(`/api/votes/competitions/${id}/candidats`),
    client.get(`/api/votes/competitions/${id}/classement`),
    client.get(`/api/votes/competitions/${id}`),
  ]);
  return { candidats, classement, competition };
}

export default function Candidats() {
  const { competitionId } = useParams();
  const { estConnecte } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifier = useNotifier();
  const { data, chargement, erreur, recharger } = useCharger(() => chargerCompetition(competitionId), [competitionId], { candidats: [], classement: [], competition: null });
  const [solde, setSolde] = useState(null);
  const [erreurVote, setErreurVote] = useState(null);

  // Classement mis à jour toutes les 8 s.
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) recharger(); }, 8000);
    return () => clearInterval(t);
  }, [recharger]);

  const rafraichirSolde = () => client.get('/api/votes/portefeuille').then(({ data: p }) => setSolde(p.solde)).catch(() => {});
  useEffect(() => { if (estConnecte) rafraichirSolde(); else setSolde(null); }, [estConnecte]);

  const voter = async (candidat) => {
    if (!estConnecte) return navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);
    setErreurVote(null);
    try {
      await client.post('/api/votes/voter', { candidatId: candidat.id });
      notifier(`Vote enregistré pour ${candidat.nom} 🎉`, 'succes');
      recharger();
      rafraichirSolde();
    } catch (e) {
      setErreurVote(e.message);
    }
  };

  const partager = async (candidat) => {
    const m = await partagerContenu({ titre: candidat.nom, message: `Vote pour ${candidat.nom} dans « ${data.competition?.nom || ''} » sur My Addictive !` });
    if (m) notifier(m);
  };

  const parId = new Map(data.classement.map((c) => [c.candidatId, c]));
  const tries = [...data.candidats].sort((a, b) => (parId.get(b.id)?.scoreFinal ?? -1) - (parId.get(a.id)?.scoreFinal ?? -1));
  const totalVotes = data.classement.reduce((s, c) => s + (c.nombreVotes || 0), 0);
  const { competition } = data;

  return (
    <>
      <Retour vers="/votes" />
      <div className="entete-page">
        <div>
          <h1 className="titre-page">{competition?.nom || 'Compétition'}</h1>
          <p className="sous-titre">Classement pondéré : vote du public + note du jury · 1 pièce = {TAUX_PIECE_FCFA} FCFA</p>
          {competition?.dateFinPhase && (
            <p className="petit or"><Clock size={13} style={{ verticalAlign: -2 }} /> Fin de la phase {competition.phase?.toLowerCase()} dans <CompteARebours dateCible={competition.dateFinPhase} texteExpire="phase terminée" /></p>
          )}
        </div>
        {estConnecte && solde !== null && <Link className="bouton secondaire petit" to="/portefeuille">🪙 {solde} pièce{solde > 1 ? 's' : ''}</Link>}
      </div>
      {!estConnecte && <p className="message-ok"><Link className="lien-or" to={`/connexion?retour=${encodeURIComponent(pathname)}`}>Connectez-vous</Link> pour voter.</p>}
      <MessageErreur message={erreurVote} />

      <Etat chargement={chargement && !data.candidats.length} erreur={erreur} vide={tries.length === 0} titreVide="Aucun candidat" texteVide="Aucun candidat pour cette compétition.">
        <div className="liste">
          {tries.map((c, i) => {
            const e = parId.get(c.id);
            const couleur = MEDAILLES[i] || 'var(--c-votes)';
            const part = totalVotes > 0 ? (e?.nombreVotes || 0) / totalVotes : 0;
            return (
              <div key={c.id} className="ligne" style={{ flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: couleur, color: i < 3 ? '#0a0a0f' : '#fff', width: 30, textAlign: 'center' }}>{i + 1}</span>
                <Link to={`/candidats/${c.id}`} style={{ display: 'contents' }}>
                  <Image className="mini" src={c.photoUrl} alt="" />
                  <div className="grow">
                    <strong>{c.nom}</strong>
                    <p className="petit attenue">{c.ville} · {formaterLibelle(c.statut)}</p>
                    <p className="petit">{e?.nombreVotes ?? 0} votes · Jury {e?.noteJury ?? 0}/20 · <span className="or">Score {e ? Number(e.scoreFinal || 0).toFixed(1) : '0.0'}</span></p>
                  </div>
                </Link>
                <button className="bouton-icone" onClick={() => partager(c)} aria-label={`Partager ${c.nom}`}><Share2 size={16} /></button>
                <button className="bouton petit" onClick={() => voter(c)} disabled={c.statut === 'ELIMINE'}>Voter</button>
                {totalVotes > 0 && <div className="barre-progression" style={{ flexBasis: '100%' }}><div style={{ width: `${Math.max(2, part * 100)}%`, background: couleur }} /></div>}
              </div>
            );
          })}
        </div>
      </Etat>
    </>
  );
}
