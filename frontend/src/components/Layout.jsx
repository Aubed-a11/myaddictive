import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Radio, ShoppingBag, TrendingUp, User, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { urlImage } from '../api/client';
import logo from '../assets/logo_myaddictive.png';

const LIENS = [
  { vers: '/', libelle: 'Accueil', fin: true },
  { vers: '/media', libelle: 'Media' },
  { vers: '/billetterie', libelle: 'Billetterie' },
  { vers: '/live', libelle: 'Livestream' },
  { vers: '/votes', libelle: 'Votes' },
  { vers: '/boutique', libelle: 'Boutique' },
];

const ONGLETS = [
  { vers: '/', libelle: 'Accueil', Icone: Home, fin: true },
  { vers: '/votes', libelle: 'Votes', Icone: TrendingUp },
  { vers: '/live', libelle: 'Live', Icone: Radio },
  { vers: '/boutique', libelle: 'Boutique', Icone: ShoppingBag },
  { vers: '/compte', libelle: 'Compte', Icone: User },
];

export function Avatar({ utilisateur, grand = false }) {
  const photo = urlImage(utilisateur?.photoUrl);
  return (
    <span className={`avatar${grand ? ' grand' : ''}`}>
      {photo ? <img src={photo} alt="" /> : (utilisateur?.nomComplet?.[0] || '?').toUpperCase()}
    </span>
  );
}

/** Page type : en-tete (navigation bureau), contenu, barre d'onglets (telephone). */
export default function Layout() {
  const { estConnecte, utilisateur } = useAuth();
  const { pathname } = useLocation();
  const classe = (actif) => (actif ? 'actif' : undefined);

  return (
    <div className="application">
      <header className="entete">
        <div className="entete-contenu">
          <Link to="/" aria-label="Accueil My Addictive"><img className="logo" src={logo} alt="My Addictive" /></Link>
          <nav className="navigation" aria-label="Navigation principale">
            {LIENS.map((l) => (
              <NavLink key={l.vers} to={l.vers} end={l.fin} className={({ isActive }) => classe(isActive)}>{l.libelle}</NavLink>
            ))}
          </nav>
          <div className="entete-droite">
            <Link to="/panier" className="bouton-icone" aria-label="Panier"><ShoppingCart size={18} /></Link>
            {estConnecte
              ? <Link to="/compte" aria-label="Mon compte"><Avatar utilisateur={utilisateur} /></Link>
              : <Link className="bouton petit" to={`/connexion?retour=${encodeURIComponent(pathname)}`}>Connexion</Link>}
          </div>
        </div>
      </header>

      <main className="contenu"><Outlet /></main>
      <footer className="pied">© {new Date().getFullYear()} My Addictive</footer>

      <nav className="onglets" aria-label="Navigation mobile">
        {ONGLETS.map(({ vers, libelle, Icone, fin }) => (
          <NavLink key={vers} to={vers} end={fin} className={({ isActive }) => classe(isActive)}>
            <Icone size={21} /> {libelle}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
