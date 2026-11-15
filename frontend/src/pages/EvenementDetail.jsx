import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarPlus, Flame, Heart, MessageCircle, Share2 } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/Notifications';
import useCharger from '../utils/useCharger';
import useFavori from '../utils/useFavori';
import { partagerContenu } from '../utils/partage';
import { dateHeure, fcfa, formaterLibelle } from '../utils/libelles';
import { payerAvecKkiapay, TELEPHONE_TEST_SANDBOX } from '../utils/paiementKkiapay';
import { Champ, Etat, Image, MessageErreur, Retour } from '../components/ui';
import LienVideo from '../components/LienVideo';
import SondageEnDirect from '../components/SondageEnDirect';

const MOYENS = [
  { cle: 'KKIAPAY', libelle: 'Mobile Money / Carte (KKiaPay)' },
  { cle: 'AGENCE', libelle: 'Paiement en agence' },
];
const MOBILE_MONEY = ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'];

/** Pastille d'urgence quand le stock est bas. */
function urgence(restantes, capacite) {
  if (restantes == null) return null;
  if (restantes === 0) return { texte: 'COMPLET', classe: 'rouge' };
  if (restantes <= 10 || restantes / capacite <= 0.2) return { texte: `Plus que ${restantes} place${restantes > 1 ? 's' : ''} !`, classe: 'rouge' };
  return null;
}

export default function EvenementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { estConnecte } = useAuth();
  const notifier = useNotifier();
  const { data: evenement, chargement, erreur } = useCharger(() => client.get(`/api/live/evenements/${id}`).then((r) => r.data), [id]);
  const { data: dispo } = useCharger(() => client.get(`/api/live/evenements/${id}/disponibilite`).then((r) => r.data).catch(() => null), [id]);
  const { favori, basculer } = useFavori('EVENEMENT', id);

  const [spectateurs, setSpectateurs] = useState(0);
  const [categorie, setCategorie] = useState('STANDARD');
  const [moyen, setMoyen] = useState('KKIAPAY');
  const [telephone, setTelephone] = useState(TELEPHONE_TEST_SANDBOX);
  const [enCours, setEnCours] = useState(false);
  const [erreurAchat, setErreurAchat] = useState(null);
  const [message, setMessage] = useState(null);

  const enDirect = evenement?.statut === 'EN_DIRECT';
  useEffect(() => {
    if (!enDirect) return undefined;
    let actif = true;
    const rafraichir = () => client.get(`/api/live/evenements/${id}/spectateurs`).then(({ data }) => actif && setSpectateurs(data)).catch(() => {});
    rafraichir();
    const t = setInterval(rafraichir, 4000);
    return () => { actif = false; clearInterval(t); };
  }, [enDirect, id]);

  const versConnexion = () => navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);
  const surFavori = async () => { if (!(await basculer())) versConnexion(); };
  const partager = async () => {
    const m = await partagerContenu({ titre: evenement.titre, message: `${evenement.titre} - ${evenement.lieu}\nDécouvre cet événement sur My Addictive !` });
    if (m) notifier(m);
  };
  const calendrier = () => {
    const debut = new Date(evenement.dateDebut);
    const fin = new Date(debut.getTime() + 3 * 3600 * 1000);
    const f = (d) => `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evenement.titre)}&dates=${f(debut)}/${f(fin)}&location=${encodeURIComponent(evenement.lieu || '')}`, '_blank', 'noopener');
  };

  const restantes = categorie === 'STANDARD' ? dispo?.standardRestantes : dispo?.vipRestantes;
  const complet = dispo != null && restantes === 0;

  const acheter = async () => {
    if (!estConnecte) return versConnexion();
    if (MOBILE_MONEY.includes(moyen) && telephone.trim().length < 8) return setErreurAchat('Renseignez un numéro Mobile Money valide.');
    setErreurAchat(null);
    setMessage(null);
    setEnCours(true);
    try {
      const { data: transaction } = await client.post('/api/live/billets/initier-achat', {
        evenementId: Number(id), categorie, moyenPaiement: moyen,
        telephonePayeur: MOBILE_MONEY.includes(moyen) ? telephone.trim() : undefined,
      });
      if (moyen === 'KKIAPAY') {
        setMessage('Ouverture du paiement KKiaPay…');
        const finale = await payerAvecKkiapay({
          transactionId: transaction.id,
          montantFcfa: categorie === 'VIP' ? evenement.prixVipFcfa : evenement.prixStandardFcfa,
          motif: `Billet ${evenement.titre}`,
        });
        setMessage(finale.statut === 'REUSSI'
          ? 'Paiement confirmé : retrouvez votre billet (QR code) dans « Mes billets ».'
          : "Le paiement n'a pas abouti. Vous pouvez réessayer.");
      } else if (transaction.statut === 'REUSSI') {
        setMessage('Paiement confirmé : retrouvez votre billet (QR code) dans « Mes billets ».');
      } else if (moyen === 'AGENCE') {
        setMessage("Demande enregistrée. Présentez-vous à l'agence pour régler le montant : votre billet sera disponible dans « Mes billets » une fois le paiement vérifié.");
      } else {
        setMessage('Paiement en cours de vérification. Votre billet apparaîtra dans « Mes billets » dès sa confirmation.');
      }
    } catch (e) {
      setErreurAchat(e.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <Retour vers="/billetterie" />
      <Etat chargement={chargement} erreur={erreur}>
        {evenement && (
          <>
            <div className="deux-colonnes">
              <Image className="visuel paysage" src={evenement.imageUrl} alt={evenement.titre} />
              <div>
                <div className="entete-page">
                  <h1 className="titre-page">{evenement.titre}</h1>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className={`bouton-icone${favori ? ' actif' : ''}`} onClick={surFavori} aria-label="Favori" aria-pressed={favori}><Heart size={18} fill={favori ? 'currentColor' : 'none'} /></button>
                    <button className="bouton-icone" onClick={partager} aria-label="Partager"><Share2 size={18} /></button>
                    {evenement.statut === 'A_VENIR' && <button className="bouton-icone" onClick={calendrier} aria-label="Ajouter au calendrier"><CalendarPlus size={18} /></button>}
                  </div>
                </div>
                <p className="attenue">{evenement.lieu}</p>
                {evenement.dateDebut && <p className="attenue">{dateHeure(evenement.dateDebut)}</p>}
                <p style={{ margin: '10px 0' }}>
                  <span className={`badge ${enDirect ? 'rouge' : ''}`}>{formaterLibelle(evenement.statut)}</span>
                  {enDirect && spectateurs > 0 && <span className="petit attenue"> · {spectateurs} spectateurs</span>}
                </p>
                {evenement.description && <p style={{ lineHeight: 1.6 }}>{evenement.description}</p>}

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
                  {enDirect && <LienVideo danger url={evenement.urlFlux} libelle="Regarder le direct" messageAbsent="Le direct n'est pas encore disponible." />}
                  {evenement.statut === 'REPLAY' && <LienVideo url={evenement.urlReplay} libelle="Voir le replay" messageAbsent="Le replay n'est pas encore disponible." />}
                  {enDirect && <Link className="bouton secondaire" to={`/evenements/${id}/chat`}><MessageCircle size={16} /> Chat en direct</Link>}
                </div>

                {evenement.payant && evenement.statut !== 'TERMINE' && (
                  <div className="carte">
                    <h2 className="titre-section">Réserver</h2>
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
                      {['STANDARD', 'VIP'].map((c) => {
                        const rest = c === 'STANDARD' ? dispo?.standardRestantes : dispo?.vipRestantes;
                        const cap = c === 'STANDARD' ? dispo?.standardCapacite : dispo?.vipCapacite;
                        const alerte = urgence(rest, cap);
                        return (
                          <button key={c} type="button" className={`bouton ${categorie === c ? '' : 'secondaire'}`} onClick={() => setCategorie(c)} style={{ flexDirection: 'column', height: 'auto', padding: 12 }}>
                            <span>{c === 'STANDARD' ? 'Standard' : 'VIP'}</span>
                            <strong>{fcfa(c === 'STANDARD' ? evenement.prixStandardFcfa : evenement.prixVipFcfa)}</strong>
                            {alerte && <span className={`badge ${alerte.classe}`}><Flame size={10} /> {alerte.texte}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="champ" style={{ marginTop: 14 }}>
                      <label htmlFor="moyen">Moyen de paiement</label>
                      <select id="moyen" value={moyen} onChange={(e) => setMoyen(e.target.value)}>
                        {MOYENS.map((m) => <option key={m.cle} value={m.cle}>{m.libelle}</option>)}
                      </select>
                    </div>
                    {MOBILE_MONEY.includes(moyen) && <Champ label="Numéro Mobile Money" id="tel" inputMode="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="ex. 90000000" />}
                    {moyen === 'AGENCE' && <p className="petit attenue">Le billet ne sera disponible qu'après vérification de votre paiement en agence.</p>}
                    <MessageErreur message={erreurAchat} />
                    {message && <p className="message-ok">{message}</p>}
                    <button className="bouton plein" onClick={acheter} disabled={enCours || complet}>{complet ? 'Complet' : enCours ? 'Traitement…' : 'Réserver maintenant'}</button>
                  </div>
                )}
              </div>
            </div>
            {enDirect && <SondageEnDirect evenementId={id} />}
          </>
        )}
      </Etat>
    </>
  );
}
