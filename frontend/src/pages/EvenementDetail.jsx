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
import { payerAvecFedapay } from '../utils/paiementFedapay';
import { Champ, Etat, Image, MessageErreur, Retour } from '../components/ui';
import LienVideo from '../components/LienVideo';
import SondageEnDirect from '../components/SondageEnDirect';


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
  const { data: evenement, chargement, erreur, recharger } = useCharger(() => client.get(`/api/live/evenements/${id}`).then((r) => r.data), [id]);
  const { data: dispo } = useCharger(() => client.get(`/api/live/evenements/${id}/disponibilite`).then((r) => r.data).catch(() => null), [id]);
  const { favori, basculer } = useFavori('EVENEMENT', id);

  const [spectateurs, setSpectateurs] = useState(0);
  const [categorie, setCategorie] = useState('STANDARD');
  const moyen = 'FEDAPAY';
  const [enCours, setEnCours] = useState(false);
  const [erreurAchat, setErreurAchat] = useState(null);
  const [message, setMessage] = useState(null);
  const [monBillet, setMonBillet] = useState(null);
  const [codeLive, setCodeLive] = useState('');
  const [erreurCode, setErreurCode] = useState(null);
  const [verifCode, setVerifCode] = useState(false);
  const aBillet = !!monBillet;

  // Billet valide (paiement confirme) pour cet evenement ? Determine l'acces au direct, au replay et au chat.
  useEffect(() => {
    if (!estConnecte) { setMonBillet(null); return undefined; }
    let actif = true;
    client.get('/api/live/billets/mes-billets')
      .then(({ data }) => {
        if (!actif) return;
        const mes = (data || []).filter((b) => String(b.evenementId) === String(id) && b.statut !== 'ANNULE');
        setMonBillet(mes.find((b) => b.accesLiveDebloque) || mes[0] || null);
      })
      .catch(() => {});
    return () => { actif = false; };
  }, [estConnecte, id]);

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

  const peutVoirDirect = !evenement?.payant || !!monBillet?.accesLiveDebloque || !!evenement?.urlFlux;

  const debloquerLive = async (e) => {
    e.preventDefault();
    setErreurCode(null);
    setVerifCode(true);
    try {
      await client.post('/api/live/billets/debloquer-live', { evenementId: Number(id), code: codeLive.trim() });
      setMonBillet((b) => (b ? { ...b, accesLiveDebloque: true } : b));
      setCodeLive('');
      await recharger(); // recupere le lien du direct, maintenant autorise
    } catch (err) {
      setErreurCode(err.message);
    } finally {
      setVerifCode(false);
    }
  };

  const acheter = async () => {
    if (!estConnecte) return versConnexion();
    setErreurAchat(null);
    setMessage(null);
    setEnCours(true);
    try {
      const { data: transaction } = await client.post('/api/live/billets/initier-achat', {
        evenementId: Number(id), categorie, moyenPaiement: moyen,
      });
      if (moyen === 'FEDAPAY') {
        setMessage('Redirection vers le paiement Mobile Money sécurisé…');
        payerAvecFedapay(transaction);
        return; // le client quitte le site : le résultat s'affiche à son retour (/paiement/retour/…)
      } else if (transaction.statut === 'REUSSI') {
        setMessage('Paiement confirmé : retrouvez votre billet (QR code) dans « Mes billets ».');
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
                  {evenement.payant && !aBillet && !evenement.urlFlux && (evenement.statut === 'EN_DIRECT' || evenement.statut === 'REPLAY') && (
                    <p className="attenue petit">🔒 Un billet payé est nécessaire pour accéder {evenement.statut === 'REPLAY' ? 'au replay' : 'au direct'}. Réservez votre place ci-dessous.</p>
                  )}
                  {peutVoirDirect && enDirect && <LienVideo danger url={evenement.urlFlux} libelle="Regarder le direct" messageAbsent="Le direct n'est pas encore disponible." />}
                  {(!evenement.payant || aBillet || evenement.urlReplay) && evenement.statut === 'REPLAY' && <LienVideo url={evenement.urlReplay} libelle="Voir le replay" messageAbsent="Le replay n'est pas encore disponible." />}
                  {peutVoirDirect && enDirect && <Link className="bouton secondaire" to={`/evenements/${id}/chat`}><MessageCircle size={16} /> Chat en direct</Link>}
                  {evenement.payant && aBillet && <Link className="bouton secondaire" to="/mes-billets">🎟 Mon billet</Link>}
                </div>
                {evenement.payant && aBillet && enDirect && !peutVoirDirect && (
                  <form className="carte" onSubmit={debloquerLive} style={{ marginBottom: 16 }}>
                    <h2 className="titre-section">Le live a commencé 🔴</h2>
                    <p className="attenue petit">Saisissez le code d'accès de votre billet (visible dans « Mes billets ») pour débloquer le direct.</p>
                    <MessageErreur message={erreurCode} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input value={codeLive} onChange={(e) => setCodeLive(e.target.value)} placeholder="XXXX-XXXX" aria-label="Code d'accès au live" autoCapitalize="characters" autoComplete="off" style={{ flex: '1 1 160px', minWidth: 0, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'monospace' }} />
                      <button className="bouton" disabled={verifCode || !codeLive.trim()}>{verifCode ? 'Vérification…' : 'Débloquer le live'}</button>
                    </div>
                  </form>
                )}

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
                    <p className="petit attenue" style={{ marginTop: 14 }}>Paiement Mobile Money sécurisé par FedaPay (MTN, Moov, Celtiis). Vous serez redirigé pour valider.</p>
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
