import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BoiteAuth from '../components/BoiteAuth';
import { Champ, MessageErreur } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/Notifications';

function evaluerForce(mdp) {
  if (mdp.length >= 10) return { niveau: 3, libelle: 'Fort', couleur: '#22C55E' };
  if (mdp.length >= 6) return { niveau: 2, libelle: 'Moyen', couleur: '#F59E0B' };
  if (mdp.length > 0) return { niveau: 1, libelle: 'Faible', couleur: '#EF4444' };
  return { niveau: 0, libelle: '', couleur: 'transparent' };
}

export default function ReinitialiserMotDePasse() {
  const { reinitialiserMotDePasse } = useAuth();
  const notifier = useNotifier();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [mdp, setMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);
  const force = evaluerForce(mdp);

  const valider = async (e) => {
    e.preventDefault();
    setErreur(null);
    if (mdp !== confirmation) return setErreur('Les deux mots de passe ne correspondent pas.');
    setChargement(true);
    try {
      await reinitialiserMotDePasse(email.trim(), code.trim(), mdp);
      notifier('Mot de passe modifié. Connectez-vous.', 'succes');
      navigate('/connexion', { replace: true });
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  };

  return (
    <BoiteAuth titre="Nouveau mot de passe" sousTitre="Saisissez le code reçu par email puis votre nouveau mot de passe.">
      <form onSubmit={valider}>
        {!params.get('email') && <Champ label="Email" id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
        <Champ label="Code de vérification" id="code" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
        <Champ label="Nouveau mot de passe" id="mdp" type="password" autoComplete="new-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} />
        {force.niveau > 0 && (
          <div className="champ">
            <div className="force"><div style={{ width: `${(force.niveau / 3) * 100}%`, background: force.couleur }} /></div>
            <span className="petit" style={{ color: force.couleur }}>{force.libelle}</span>
          </div>
        )}
        <Champ label="Confirmer le mot de passe" id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        <MessageErreur message={erreur} />
        <button className="bouton degrade plein" disabled={chargement}>{chargement ? 'Validation…' : 'Réinitialiser le mot de passe'}</button>
      </form>
      <p className="centre petit" style={{ marginTop: 18 }}><Link className="lien-or" to="/connexion">Retour à la connexion</Link></p>
    </BoiteAuth>
  );
}
