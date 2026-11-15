import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PlayCircle, Share2 } from 'lucide-react';
import client, { urlImage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/Notifications';
import useCharger from '../utils/useCharger';
import { partagerContenu } from '../utils/partage';
import { formaterLibelle } from '../utils/libelles';
import { Etat, Image, MessageErreur, Retour } from '../components/ui';
import LienVideo from '../components/LienVideo';

async function charger(id) {
  const { data: candidat } = await client.get(`/api/votes/candidats/${id}`);
  let entree = null;
  try {
    const { data: classement } = await client.get(`/api/votes/competitions/${candidat.competitionId}/classement`);
    entree = classement.find((c) => c.candidatId === Number(id)) || null;
  } catch { /* classement facultatif */ }
  return { candidat, entree };
}

export default function CandidatDetail() {
  const { id } = useParams();
  const { estConnecte } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifier = useNotifier();
  const { data, chargement, erreur, recharger } = useCharger(() => charger(id), [id]);
  const [solde, setSolde] = useState(null);
  const [erreurVote, setErreurVote] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const rafraichirSolde = () => client.get('/api/votes/portefeuille').then(({ data: p }) => setSolde(p.solde)).catch(() => {});
  useEffect(() => { if (estConnecte) rafraichirSolde(); else setSolde(null); }, [estConnecte]);

  const voter = async () => {
    if (!estConnecte) return navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);
    setErreurVote(null);
    setEnCours(true);
    try {
      await client.post('/api/votes/voter', { candidatId: Number(id) });
      notifier('Vote enregistré 🎉', 'succes');
      await recharger();
      rafraichirSolde();
    } catch (e) {
      setErreurVote(e.message);
    } finally {
      setEnCours(false);
    }
  };

  const candidat = data?.candidat;
  const partager = async () => {
    const m = await partagerContenu({ titre: candidat.nom, message: `Vote pour ${candidat.nom} sur My Addictive !` });
    if (m) notifier(m);
  };

  return (
    <>
      <Retour vers={candidat?.competitionId ? `/votes/${candidat.competitionId}` : '/votes'} />
      <Etat chargement={chargement && !data} erreur={erreur}>
        {candidat && (
          <div className="deux-colonnes">
            <Image className="visuel carre" src={candidat.photoUrl} alt={candidat.nom} />
            <div>
              <div className="entete-page">
                <div>
                  <h1 className="titre-page">{candidat.nom}</h1>
                  <p className="attenue">{candidat.ville}</p>
                  <span className={`badge ${candidat.statut === 'ELIMINE' ? 'rouge' : 'vert'}`}>{formaterLibelle(candidat.statut)}</span>
                </div>
                <button className="bouton-icone" onClick={partager} aria-label="Partager"><Share2 size={18} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0' }}>
                <div className="carte centre"><p className="petit attenue">Note du jury</p><p className="prix" style={{ color: '#fff' }}>{candidat.noteJury ?? 0}/20</p></div>
                <div className="carte centre"><p className="petit attenue">Votes du public</p><p className="prix" style={{ color: 'var(--c-votes)' }}>{data.entree?.nombreVotes ?? 0}</p></div>
              </div>
              <MessageErreur message={erreurVote} />
              {estConnecte && solde !== null && <p style={{ marginBottom: 10 }}><Link className="badge" to="/portefeuille">🪙 Solde : {solde} pièce{solde > 1 ? 's' : ''}</Link></p>}
              {candidat.statut !== 'ELIMINE' && <button className="bouton plein" style={{ background: 'var(--c-votes)' }} onClick={voter} disabled={enCours}>{enCours ? 'Vote en cours…' : 'Voter pour ce candidat'}</button>}
              <div style={{ marginTop: 18 }}>
                {candidat.videoUrl
                  ? <LienVideo url={urlImage(candidat.videoUrl)} libelle="Voir l'extrait vidéo" />
                  : <p className="attenue"><PlayCircle size={18} style={{ verticalAlign: -4 }} /> Aucun extrait vidéo disponible pour ce candidat.</p>}
              </div>
            </div>
          </div>
        )}
      </Etat>
    </>
  );
}
