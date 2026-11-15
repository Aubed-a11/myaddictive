import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo_myaddictive.png';
import scene from '../assets/scene_auth.jpg';

/** Cadre commun des pages de connexion / inscription / mot de passe. */
export default function BoiteAuth({ titre, sousTitre, children }) {
  return (
    <div className="fond-auth" style={{ '--fond-image': `url("${scene}")` }}>
      <div className="boite-auth">
        <Link to="/"><img className="logo" src={logo} alt="My Addictive" /></Link>
        <h1>{titre}</h1>
        {sousTitre && <p className="sous-titre">{sousTitre}</p>}
        {children}
      </div>
    </div>
  );
}
