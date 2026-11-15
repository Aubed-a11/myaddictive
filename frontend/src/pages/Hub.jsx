import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Ticket, Radio, TrendingUp, ShoppingBag } from 'lucide-react';
import client, { urlImage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useCharger, { contenu } from '../utils/useCharger';
import Carrousel, { Diapo } from '../components/Carrousel';
import banniere from '../assets/banniere_accueil.jpg';

const RUBRIQUES = [
  { vers: '/media', titre: 'Media', texte: 'Actualités, showbiz et vidéos', Icone: Newspaper, couleurs: ['#3B82F6', '#1D4ED8'] },
  { vers: '/billetterie', titre: 'Billetterie', texte: 'Billets et places de concerts', Icone: Ticket, couleurs: ['#F97316', '#C2410C'] },
  { vers: '/live', titre: 'Livestream', texte: 'Direct, replay et chat', Icone: Radio, couleurs: ['#EF4444', '#B91C1C'] },
  { vers: '/votes', titre: 'Votes', texte: 'Talent shows et classements', Icone: TrendingUp, couleurs: ['#A855F7', '#6D28D9'] },
  { vers: '/boutique', titre: 'Boutique', texte: 'Marketplace multi-vendeurs', Icone: ShoppingBag, couleurs: ['#D97706', '#92400E'] },
];

const vide = { data: { content: [] } };

/** Articles et événements récents mélangés, du plus récent au plus ancien. */
async function chargerALaUne() {
  const [articles, ...evenements] = await Promise.all([
    client.get('/api/media/articles', { params: { page: 0, size: 8 } }).catch(() => vide),
    ...['A_VENIR', 'EN_DIRECT', 'TERMINE'].map((statut) =>
      client.get('/api/live/evenements', { params: { statut, page: 0, size: 4 } }).catch(() => vide)),
  ]);
  const a = contenu(articles.data).map((x) => ({
    cle: `a${x.id}`, vers: `/media/articles/${x.id}`, titre: x.titre, sousTitre: x.categorie,
    image: x.imageUrl, date: x.datePublication, etiquette: 'Actualité',
  }));
  const e = evenements.flatMap((r) => contenu(r.data)).map((x) => ({
    cle: `e${x.id}`, vers: `/evenements/${x.id}`, titre: x.titre, sousTitre: x.lieu, image: x.imageUrl, date: x.dateDebut,
    etiquette: x.statut === 'EN_DIRECT' ? 'En direct' : x.statut === 'TERMINE' ? 'Replay' : 'Événement',
  }));
  return [...a, ...e].sort((p, q) => new Date(q.date || 0) - new Date(p.date || 0)).slice(0, 12);
}

export default function Hub() {
  const { estConnecte, utilisateur } = useAuth();
  const { data: unes } = useCharger(chargerALaUne, [], []);
  const prenom = utilisateur?.nomComplet?.split(' ')[0];

  return (
    <>
      <section className="hero" style={{ backgroundImage: `url("${banniere}")`, minHeight: 220 }}>
        <div className="hero-contenu">
          <h2>{estConnecte ? `Bienvenue${prenom ? `, ${prenom}` : ''} sur My Addictive` : 'Vivez. Participez. Profitez.'}</h2>
          <p className="attenue">Médias, billetterie, live, votes et boutique : tout votre univers au même endroit.</p>
          {!estConnecte && (
            <p style={{ marginTop: 12 }}>
              <Link className="bouton" to="/connexion">Se connecter</Link>{' '}
              <Link className="bouton secondaire" to="/inscription">Créer un compte</Link>
            </p>
          )}
        </div>
      </section>

      {unes?.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2 className="titre-section">À la une</h2>
          <Carrousel>
            {unes.map((u) => <Diapo key={u.cle} vers={u.vers} image={u.image} etiquette={u.etiquette} titre={u.titre} sousTitre={u.sousTitre} />)}
          </Carrousel>
        </section>
      )}

      <section style={{ marginTop: 28 }}>
        <h2 className="titre-section">Rubriques</h2>
        <div className="tuiles">
          {RUBRIQUES.map(({ vers, titre, texte, Icone, couleurs }) => (
            <Link key={vers} to={vers} className="tuile" style={{ background: `linear-gradient(135deg, ${couleurs[0]}, ${couleurs[1]})` }}>
              <span className="icone"><Icone size={20} /></span>
              <h3>{titre}</h3>
              <p>{texte}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
