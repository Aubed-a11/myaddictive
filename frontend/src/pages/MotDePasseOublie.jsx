import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BoiteAuth from '../components/BoiteAuth';
import { Champ, MessageErreur } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function MotDePasseOublie() {
  const { demanderReinitialisation } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const envoyer = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await demanderReinitialisation(email.trim());
      navigate(`/reinitialiser-mot-de-passe?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  };

  return (
    <BoiteAuth titre="Mot de passe oublié" sousTitre="Entrez votre email pour recevoir un code de réinitialisation.">
      <form onSubmit={envoyer}>
        <Champ label="Email" id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        <MessageErreur message={erreur} />
        <button className="bouton degrade plein" disabled={chargement}>{chargement ? 'Envoi…' : 'Envoyer le code'}</button>
      </form>
      <p className="centre petit" style={{ marginTop: 18 }}><Link className="lien-or" to="/connexion">Retour à la connexion</Link></p>
    </BoiteAuth>
  );
}
