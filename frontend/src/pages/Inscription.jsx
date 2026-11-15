import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import BoiteAuth from '../components/BoiteAuth';
import { Champ, MessageErreur } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { formDataPhoto } from '../utils/uploadPhoto';
import { useRetour } from './Connexion';

export default function Inscription() {
  const { inscrire, rafraichirProfil } = useAuth();
  const { terminer, suffixe } = useRetour();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!photo) { setApercu(null); return undefined; }
    const url = URL.createObjectURL(photo);
    setApercu(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const valider = async (e) => {
    e.preventDefault();
    setErreur(null);
    if (mdp.length < 6) return setErreur('Le mot de passe doit contenir au moins 6 caractères.');
    if (mdp !== confirmation) return setErreur('La confirmation ne correspond pas au mot de passe.');
    setChargement(true);
    try {
      await inscrire(email.trim(), mdp, nom.trim());
      if (photo) {
        // Echec non bloquant : la photo pourra être ajoutée plus tard dans Paramètres.
        try {
          await client.post('/api/compte/moi/photo', formDataPhoto(photo));
          await rafraichirProfil();
        } catch { /* ignoré */ }
      }
      terminer();
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  };

  return (
    <BoiteAuth titre="Inscription" sousTitre="Créez votre compte My Addictive">
      <form onSubmit={valider}>
        <label className="centre" style={{ display: 'block', cursor: 'pointer', marginBottom: 16 }}>
          <span className="avatar grand" style={{ margin: '0 auto 6px', display: 'grid' }}>
            {apercu ? <img src={apercu} alt="Aperçu de la photo" /> : <Camera size={22} />}
          </span>
          <span className="petit attenue">{photo ? 'Changer la photo' : 'Ajouter une photo (optionnel)'}</span>
          <input type="file" accept="image/*" hidden onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </label>
        <Champ label="Nom complet" id="nom" autoComplete="name" required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="John Doe" />
        <Champ label="Email" id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        <Champ label="Mot de passe" id="mdp" type="password" autoComplete="new-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="Au moins 6 caractères" />
        <Champ label="Confirmer le mot de passe" id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        <MessageErreur message={erreur} />
        <button className="bouton degrade plein" disabled={chargement}>{chargement ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="centre petit attenue" style={{ marginTop: 18 }}>Déjà un compte ? <Link className="lien-or" to={`/connexion${suffixe}`}>Connectez-vous</Link></p>
    </BoiteAuth>
  );
}
