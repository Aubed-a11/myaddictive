import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Layout';
import ExigerConnexion from '../components/ExigerConnexion';

const LIENS = [
  ['Mes billets', '/mes-billets'],
  ['Mes commandes Boutique', '/mes-commandes'],
  ['Mon wallet', '/portefeuille'],
  ['Historique de mes votes', '/historique-votes'],
  ['Mes transactions', '/transactions'],
  ['Mes badges de fidélité', '/badges'],
  ['Mes favoris', '/favoris'],
  ['Paramètres', '/parametres'],
];

function Profil() {
  const { utilisateur, deconnecter } = useAuth();
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="centre" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', placeItems: 'center' }}><Avatar utilisateur={utilisateur} grand /></div>
        <h1 className="titre-page" style={{ marginTop: 10 }}>{utilisateur?.nomComplet || 'Utilisateur'}</h1>
        <p className="attenue">{utilisateur?.email}</p>
      </div>
      <div className="liste carte" style={{ padding: '4px 14px' }}>
        {LIENS.map(([libelle, vers]) => (
          <Link key={vers} to={vers} className="ligne"><span className="grow">{libelle}</span><ChevronRight size={18} color="var(--attenue)" /></Link>
        ))}
      </div>
      <button className="bouton danger plein" style={{ marginTop: 20 }} onClick={deconnecter}>Se déconnecter</button>
    </div>
  );
}

export default function Compte() {
  return <ExigerConnexion message="Connectez-vous pour accéder à votre profil, vos billets, vos votes et vos achats."><Profil /></ExigerConnexion>;
}
