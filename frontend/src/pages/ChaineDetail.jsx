import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, Play, Star } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import useCharger, { contenu } from '../utils/useCharger';
import { formaterLibelle, dateCourte } from '../utils/libelles';
import { payerAvecFedapay } from '../utils/paiementFedapay';
import { Etat, Image, MessageErreur, Retour } from '../components/ui';


export default function ChaineDetail() {
  const { id } = useParams();
  const numero = Number(id);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { estConnecte } = useAuth();

  const { data: chaine, chargement, erreur, setData: setChaine } = useCharger(() => client.get(`/api/live/chaines/${id}`).then((r) => r.data), [id]);
  const { data: evenements } = useCharger(
    () => client.get('/api/live/evenements', { params: { page: 0, size: 30 } }).then((r) => contenu(r.data).filter((e) => e.chaineId === numero)).catch(() => []),
    [id], [],
  );
  const { data: fanClub, recharger: rechargerFanClub } = useCharger(
    () => (estConnecte ? client.get(`/api/live/chaines/${id}/fan-club/statut`).then((r) => r.data).catch(() => null) : Promise.resolve(null)),
    [id, estConnecte],
  );
  const { data: abonne, setData: setAbonne } = useCharger(
    () => (estConnecte ? client.get('/api/live/mes-chaines-suivies').then((r) => (r.data || []).some((c) => c.id === numero)).catch(() => false) : Promise.resolve(false)),
    [id, estConnecte], false,
  );

  const [enAbonnement, setEnAbonnement] = useState(false);
  const [choixOuvert, setChoixOuvert] = useState(false);
  const moyen = 'FEDAPAY';
  const [enCours, setEnCours] = useState(false);
  const [erreurAchat, setErreurAchat] = useState(null);
  const [message, setMessage] = useState(null);

  const versConnexion = () => navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);

  const basculerAbonnement = async () => {
    if (!estConnecte) return versConnexion();
    setEnAbonnement(true);
    try {
      if (abonne) await client.delete(`/api/live/abonnements-chaine/${id}`);
      else await client.post(`/api/live/abonnements-chaine/${id}`);
      setAbonne(!abonne);
      const { data } = await client.get(`/api/live/chaines/${id}`);
      setChaine(data);
    } catch (e) {
      setErreurAchat(e.message);
    } finally {
      setEnAbonnement(false);
    }
  };

  const rejoindre = async () => {
    if (!estConnecte) return versConnexion();
    setErreurAchat(null);
    setEnCours(true);
    try {
      const { data: transaction } = await client.post(`/api/live/chaines/${id}/fan-club/initier`, {
        moyenPaiement: moyen,
      });
      if (moyen === 'FEDAPAY') {
        setMessage('Redirection vers le paiement Mobile Money sécurisé…');
        payerAvecFedapay(transaction);
        return; // le client quitte le site : le résultat s'affiche à son retour (/paiement/retour/…)
      } else if (transaction.statut === 'REUSSI') {
        setMessage('Paiement confirmé : bienvenue dans le fan club !'); await rechargerFanClub();
            } else {
        setMessage('Demande envoyée sur votre téléphone. Validez avec votre code PIN pour activer votre accès.');
      }
      setChoixOuvert(false);
    } catch (e) {
      setErreurAchat(e.message);
    } finally {
      setEnCours(false);
    }
  };

  const estFan = fanClub?.actif;
  const { data: publications } = useCharger(
    () => (chaine?.nom
      ? client.get('/api/media/articles', { params: { artiste: chaine.nom, page: 0, size: 12 } }).then((r) => contenu(r.data)).catch(() => [])
      : Promise.resolve([])),
    [chaine?.nom], [],
  );

  return (
    <>
      <Retour vers="/chaines" />
      <Etat chargement={chargement} erreur={erreur}>
        {chaine && (
          <>
            <div className="profil-entete">
              <Image className="profil-photo carre" src={chaine.imageUrl} alt={chaine.nom} />
              <div className="grow">
                <h1 className="titre-page">{chaine.nom} {estFan && <span className="badge"><Star size={11} /> Fan club</span>}</h1>
                <p className="attenue">{chaine.nombreAbonnes} abonné{chaine.nombreAbonnes > 1 ? 's' : ''}</p>
                <p style={{ marginTop: 12 }}>
                  <button className={`bouton ${abonne ? 'secondaire' : ''}`} onClick={basculerAbonnement} disabled={enAbonnement}>
                    {abonne && <Check size={16} />} {abonne ? 'Abonné' : "S'abonner"}
                  </button>
                </p>
              </div>
            </div>
            {chaine.description && (
              <div className="carte" style={{ margin: '4px 0 18px' }}>
                <h2 className="titre-section" style={{ marginTop: 0 }}>Biographie</h2>
                <p style={{ lineHeight: 1.7, maxWidth: 760 }}>{chaine.description}</p>
              </div>
            )}
            {publications.length > 0 && (
              <>
                <h2 className="titre-section">Vidéos & articles</h2>
                <div className="grille" style={{ marginBottom: 20 }}>
                  {publications.map((a) => (
                    <Link key={a.id} to={`/media/articles/${a.id}`} className="carte-media">
                      <div style={{ position: 'relative' }}>
                        <Image className="image" src={a.imageUrl} secours={a.imageSecours} alt="" />
                        {(a.categorie === 'VIDEO' || a.videoUrl) && <Play size={34} color="#fff" style={{ position: 'absolute', right: 10, bottom: 10 }} />}
                      </div>
                      <div className="corps"><h3>{a.titre}</h3></div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            <MessageErreur message={erreurAchat} />
            {message && <p className="message-ok">{message}</p>}

            <div className="carte" style={{ maxWidth: 560, margin: '18px 0' }}>
              {estFan ? (
                <>
                  <strong>Vous êtes membre du fan club</strong>
                  <p className="petit attenue">Actif jusqu'au {dateCourte(fanClub.dateExpiration)} · accès anticipé et contenu exclusif</p>
                </>
              ) : !choixOuvert ? (
                <>
                  <button className="bouton degrade" onClick={() => (estConnecte ? setChoixOuvert(true) : versConnexion())}><Star size={16} /> Rejoindre le fan club — 2 000 FCFA / mois</button>
                  <p className="petit attenue" style={{ marginTop: 8 }}>Accès anticipé aux billets et contenu exclusif de cette chaîne.</p>
                </>
              ) : (
                <>
                  <p className="petit attenue">Paiement Mobile Money sécurisé par FedaPay (MTN, Moov, Celtiis). Vous serez redirigé pour valider.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="bouton degrade" onClick={rejoindre} disabled={enCours}>{enCours ? 'Traitement…' : 'Confirmer — 2 000 FCFA / mois'}</button>
                    <button className="bouton secondaire" onClick={() => setChoixOuvert(false)}>Annuler</button>
                  </div>
                </>
              )}
            </div>

            <h2 className="titre-section">Événements de la chaîne</h2>
            {evenements.length === 0
              ? <p className="attenue">Aucun événement pour cette chaîne.</p>
              : (
                <div className="liste">
                  {evenements.map((e) => (
                    <Link key={e.id} to={`/evenements/${e.id}`} className="ligne">
                      <div className="grow"><strong>{e.titre}</strong><p className="petit attenue">{e.lieu} · {formaterLibelle(e.statut)}</p></div>
                    </Link>
                  ))}
                </div>
              )}
          </>
        )}
      </Etat>
    </>
  );
}
