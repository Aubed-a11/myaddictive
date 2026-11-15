import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import useCharger, { contenu } from '../utils/useCharger';
import { formaterLibelle, dateCourte } from '../utils/libelles';
import { payerAvecKkiapay, TELEPHONE_TEST_SANDBOX } from '../utils/paiementKkiapay';
import { Champ, Etat, MessageErreur, Retour } from '../components/ui';

const MOYENS = [
  { cle: 'KKIAPAY', libelle: 'Mobile Money / Carte (KKiaPay)' },
  { cle: 'AGENCE', libelle: 'Paiement en agence' },
];
const MOBILE_MONEY = ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'];

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
  const [moyen, setMoyen] = useState('KKIAPAY');
  const [telephone, setTelephone] = useState(TELEPHONE_TEST_SANDBOX);
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
    if (MOBILE_MONEY.includes(moyen) && telephone.trim().length < 8) return setErreurAchat('Renseignez un numéro Mobile Money valide.');
    setErreurAchat(null);
    setEnCours(true);
    try {
      const { data: transaction } = await client.post(`/api/live/chaines/${id}/fan-club/initier`, {
        moyenPaiement: moyen, telephonePayeur: MOBILE_MONEY.includes(moyen) ? telephone.trim() : undefined,
      });
      if (moyen === 'KKIAPAY') {
        setMessage('Ouverture du paiement KKiaPay…');
        const finale = await payerAvecKkiapay({ transactionId: transaction.id, montantFcfa: transaction.montantFcfa, motif: 'Fan club My Addictive' });
        if (finale.statut === 'REUSSI') { setMessage('Paiement confirmé : bienvenue dans le fan club !'); await rechargerFanClub(); }
        else setMessage("Le paiement n'a pas abouti. Vous pouvez réessayer.");
      } else if (transaction.statut === 'REUSSI') {
        setMessage('Paiement confirmé : bienvenue dans le fan club !'); await rechargerFanClub();
      } else if (moyen === 'AGENCE') {
        setMessage("Demande enregistrée. Votre accès fan club s'activera une fois le paiement vérifié en agence.");
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

  return (
    <>
      <Retour vers="/chaines" />
      <Etat chargement={chargement} erreur={erreur}>
        {chaine && (
          <>
            <div className="entete-page">
              <div>
                <h1 className="titre-page">{chaine.nom} {estFan && <span className="badge"><Star size={11} /> Fan club</span>}</h1>
                <p className="attenue">{chaine.nombreAbonnes} abonné{chaine.nombreAbonnes > 1 ? 's' : ''}</p>
              </div>
              <button className={`bouton ${abonne ? 'secondaire' : ''}`} onClick={basculerAbonnement} disabled={enAbonnement}>
                {abonne && <Check size={16} />} {abonne ? 'Abonné' : "S'abonner"}
              </button>
            </div>
            {chaine.description && <p style={{ lineHeight: 1.6, maxWidth: 760 }}>{chaine.description}</p>}

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
                  <div className="champ">
                    <label htmlFor="moyen">Moyen de paiement</label>
                    <select id="moyen" value={moyen} onChange={(e) => setMoyen(e.target.value)}>{MOYENS.map((m) => <option key={m.cle} value={m.cle}>{m.libelle}</option>)}</select>
                  </div>
                  {MOBILE_MONEY.includes(moyen) && <Champ label="Numéro Mobile Money" id="tel" inputMode="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />}
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
