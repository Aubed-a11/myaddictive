import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Eye, Send } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import useCharger from '../utils/useCharger';
import { Retour } from '../components/ui';

const COULEURS = ['#F97316', '#22C55E', '#3B82F6', '#EC4899', '#A855F7', '#06B6D4', '#EAB308'];
const couleurPseudo = (pseudo = '') => COULEURS[[...pseudo].reduce((s, c) => s + c.charCodeAt(0), 0) % COULEURS.length];
const EMOJIS = ['❤️', '🔥', '👏', '😂', '🎉'];
let compteur = 0;

/** Chat plein écran d'un évènement : messages, spectateurs, réactions volantes (sondage REST toutes les 4 s / 1,5 s). */
export default function ChatLive() {
  const { id } = useParams();
  const { estConnecte } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: evenement } = useCharger(() => client.get(`/api/live/evenements/${id}`).then((r) => r.data).catch(() => null), [id]);
  const [messages, setMessages] = useState([]);
  const [spectateurs, setSpectateurs] = useState(0);
  const [texte, setTexte] = useState('');
  const [reactions, setReactions] = useState([]);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const fin = useRef(null);
  const derniereReaction = useRef(Date.now());

  const lancerReaction = (emoji) => {
    const cle = compteur++;
    setReactions((r) => [...r, { cle, emoji, gauche: 10 + Math.random() * 80 }]);
    setTimeout(() => setReactions((r) => r.filter((x) => x.cle !== cle)), 2300);
  };

  useEffect(() => {
    let actif = true;
    client.post(`/api/live/evenements/${id}/spectateurs/entrer`).catch(() => {});
    const rafraichir = async () => {
      try {
        const [{ data: msgs }, { data: nb }] = await Promise.all([
          client.get(`/api/live/evenements/${id}/messages`),
          client.get(`/api/live/evenements/${id}/spectateurs`),
        ]);
        if (actif) { setMessages(msgs || []); setSpectateurs(nb); setAccesRefuse(false); }
      } catch (e) { if (actif && /billet/i.test(e?.message || '')) setAccesRefuse(true); }
    };
    rafraichir();
    const t = setInterval(rafraichir, 4000);
    return () => { actif = false; clearInterval(t); client.post(`/api/live/evenements/${id}/spectateurs/sortir`).catch(() => {}); };
  }, [id]);

  useEffect(() => {
    let actif = true;
    const t = setInterval(async () => {
      try {
        const { data } = await client.get(`/api/live/evenements/${id}/reactions`, { params: { depuis: derniereReaction.current } });
        if (actif && data?.length) { derniereReaction.current = Date.now(); data.forEach(lancerReaction); }
      } catch { /* silencieux */ }
    }, 1500);
    return () => { actif = false; clearInterval(t); };
  }, [id]);

  useEffect(() => { fin.current?.scrollIntoView?.({ block: 'end' }); }, [messages]);

  const reagir = async (emoji) => {
    lancerReaction(emoji);
    try { await client.post(`/api/live/evenements/${id}/reactions`, { emoji }); } catch { /* ignoré */ }
  };

  const envoyer = async (e) => {
    e.preventDefault();
    const contenu = texte.trim();
    if (!contenu) return;
    if (!estConnecte) return navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);
    setTexte('');
    try {
      await client.post(`/api/live/evenements/${id}/messages`, { contenu });
      const { data } = await client.get(`/api/live/evenements/${id}/messages`);
      setMessages(data || []);
    } catch { /* ignoré */ }
  };

  if (accesRefuse) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Retour vers={`/evenements/${id}`} />
        <div className="carte" style={{ textAlign: 'center' }}>
          <h2>Billet requis</h2>
          <p className="attenue">Le chat en direct est réservé aux détenteurs d'un billet payé qui ont saisi leur code d'accès au live.</p>
          <div style={{ marginTop: 14 }}><Link className="bouton" to={`/evenements/${id}`}>Débloquer le live</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Retour vers={`/evenements/${id}`} />
      <div className="entete-page">
        <div>
          <h1 className="titre-page">{evenement?.titre || 'Chat en direct'}</h1>
          <p><span className="badge rouge">LIVE</span> <span className="petit attenue"><Eye size={13} style={{ verticalAlign: -2 }} /> {spectateurs >= 1000 ? `${(spectateurs / 1000).toFixed(1)}K` : spectateurs}</span></p>
        </div>
      </div>
      <div className="carte" style={{ padding: 12 }}>
        <div className="chat">
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 && <p className="attenue centre" style={{ margin: 'auto' }}>Aucun message pour l'instant. Soyez le premier à écrire !</p>}
            {messages.map((m, i) => (
              <div key={i} className="message">
                <span className="avatar" style={{ background: couleurPseudo(m.auteur) }}>{m.auteur?.[0]?.toUpperCase() || '?'}</span>
                <div>
                  <strong style={{ color: couleurPseudo(m.auteur), fontSize: 13 }}>{m.auteur}</strong>
                  <p>{m.contenu}</p>
                </div>
              </div>
            ))}
            <div ref={fin} />
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '8px 0' }}>
            {EMOJIS.map((em) => <button key={em} className="bouton-icone" onClick={() => reagir(em)} aria-label={`Réagir ${em}`}>{em}</button>)}
          </div>
          <form className="chat-saisie" onSubmit={envoyer}>
            <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={estConnecte ? 'Écrire un message…' : 'Connectez-vous pour écrire…'} aria-label="Message" />
            <button className="bouton" aria-label="Envoyer"><Send size={16} /></button>
          </form>
        </div>
      </div>
      {!estConnecte && <p className="petit attenue centre" style={{ marginTop: 10 }}><Link className="lien-or" to={`/connexion?retour=${encodeURIComponent(pathname)}`}>Connectez-vous</Link> pour participer au chat.</p>}
      {reactions.map((r) => <span key={r.cle} className="reaction-volante" style={{ left: `${r.gauche}%` }}>{r.emoji}</span>)}
    </div>
  );
}
