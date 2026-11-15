import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vide } from './ui';

/** Affiche le contenu seulement si l'utilisateur est connecte ; sinon invite a se connecter (puis revient ici). */
export default function ExigerConnexion({ children, message = 'Connectez-vous pour acceder a cette page.' }) {
  const { estConnecte } = useAuth();
  const { pathname, search } = useLocation();
  if (estConnecte) return children;
  return (
    <Vide titre="Connexion requise" texte={message}>
      <div style={{ marginTop: 18 }}>
        <Link className="bouton" to={`/connexion?retour=${encodeURIComponent(pathname + search)}`}>Se connecter</Link>
      </div>
    </Vide>
  );
}
