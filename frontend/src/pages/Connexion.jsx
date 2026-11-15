import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Chrome } from 'lucide-react';
import BoiteAuth from '../components/BoiteAuth';
import { Champ, MessageErreur } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/Notifications';
import { demanderConnexionGoogle } from '../utils/googleAuth';

/** Destination après connexion : paramètre ?retour=, limité aux chemins internes. */
export function useRetour() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const retour = params.get('retour');
  const cible = retour && retour.startsWith('/') && !retour.startsWith('//') ? retour : '/';
  return { retour: cible, terminer: () => navigate(cible, { replace: true }), suffixe: retour ? `?retour=${encodeURIComponent(cible)}` : '' };
}

export default function Connexion() {
  const { connecter, connecterAvecGoogle } = useAuth();
  const notifier = useNotifier();
  const { terminer, suffixe } = useRetour();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const valider = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await connecter(email.trim(), motDePasse);
      terminer();
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  };

  const avecGoogle = async () => {
    setErreur(null);
    try {
      await connecterAvecGoogle(await demanderConnexionGoogle());
      terminer();
    } catch (err) {
      setErreur(err.message);
    }
  };

  return (
    <BoiteAuth titre="Connexion" sousTitre="Entrez vos identifiants pour accéder à tous nos services.">
      <form onSubmit={valider}>
        <Champ label="Email" id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        <Champ label="Mot de passe" id="mdp" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="********" />
        <MessageErreur message={erreur} />
        <button className="bouton degrade plein" disabled={chargement}>{chargement ? 'Connexion…' : 'Continuer'}</button>
      </form>
      <div className="separateur">ou continuer avec</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <button type="button" className="bouton secondaire plein" onClick={avecGoogle}><Chrome size={16} /> Google</button>
        <button type="button" className="bouton secondaire plein" onClick={() => notifier("La connexion Facebook n'est pas encore disponible.", 'info')}>Facebook (bientôt)</button>
        <button type="button" className="bouton secondaire plein" onClick={() => notifier("La connexion Apple n'est pas encore disponible.", 'info')}>Apple (bientôt)</button>
      </div>
      <p className="centre" style={{ marginTop: 18 }}><Link className="lien-or" to="/mot-de-passe-oublie">Mot de passe oublié ?</Link></p>
      <p className="centre petit attenue" style={{ marginTop: 8 }}>Pas de compte ? <Link className="lien-or" to={`/inscription${suffixe}`}>Inscrivez-vous</Link></p>
    </BoiteAuth>
  );
}
