import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/Notifications';
import { formDataPhoto } from '../utils/uploadPhoto';
import { Champ, EntetePage, MessageErreur, Retour } from '../components/ui';
import { Avatar } from '../components/Layout';
import ExigerConnexion from '../components/ExigerConnexion';

function Formulaires() {
  const { utilisateur, rafraichirProfil } = useAuth();
  const notifier = useNotifier();
  const [nom, setNom] = useState(utilisateur?.nomComplet || '');
  const [email, setEmail] = useState(utilisateur?.email || '');
  const [erreurProfil, setErreurProfil] = useState(null);
  const [enProfil, setEnProfil] = useState(false);
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreurMdp, setErreurMdp] = useState(null);
  const [enMdp, setEnMdp] = useState(false);
  const [enPhoto, setEnPhoto] = useState(false);
  const [erreurPhoto, setErreurPhoto] = useState(null);

  useEffect(() => { setNom(utilisateur?.nomComplet || ''); setEmail(utilisateur?.email || ''); }, [utilisateur]);

  const enregistrer = async (e) => {
    e.preventDefault();
    setErreurProfil(null);
    setEnProfil(true);
    try {
      await client.put('/api/compte/moi', { nomComplet: nom.trim(), email: email.trim() });
      await rafraichirProfil();
      notifier('Profil mis à jour.', 'succes');
    } catch (err) { setErreurProfil(err.message); } finally { setEnProfil(false); }
  };

  const changerMdp = async (e) => {
    e.preventDefault();
    setErreurMdp(null);
    if (nouveau.length < 6) return setErreurMdp('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    if (nouveau !== confirmation) return setErreurMdp('La confirmation ne correspond pas au nouveau mot de passe.');
    setEnMdp(true);
    try {
      await client.post('/api/compte/moi/changer-mot-de-passe', { ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });
      notifier('Mot de passe modifié.', 'succes');
      setAncien(''); setNouveau(''); setConfirmation('');
    } catch (err) { setErreurMdp(err.message); } finally { setEnMdp(false); }
  };

  const changerPhoto = async (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    setErreurPhoto(null);
    setEnPhoto(true);
    try {
      await client.post('/api/compte/moi/photo', formDataPhoto(fichier));
      await rafraichirProfil();
      notifier('Photo mise à jour.', 'succes');
    } catch (err) { setErreurPhoto(err.message); } finally { setEnPhoto(false); }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'grid', gap: 20 }}>
      <div className="carte centre">
        <label style={{ cursor: 'pointer', display: 'inline-block' }}>
          <Avatar utilisateur={utilisateur} grand />
          <p className="petit lien-or" style={{ marginTop: 8 }}><Camera size={13} style={{ verticalAlign: -2 }} /> {enPhoto ? 'Envoi en cours…' : 'Modifier la photo de profil'}</p>
          <input type="file" accept="image/*" hidden onChange={changerPhoto} disabled={enPhoto} />
        </label>
        <MessageErreur message={erreurPhoto} />
      </div>

      <form className="carte" onSubmit={enregistrer}>
        <h2 className="titre-section">Informations personnelles</h2>
        <Champ label="Nom complet" id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
        <Champ label="Email" id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <MessageErreur message={erreurProfil} />
        <button className="bouton plein" disabled={enProfil}>{enProfil ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>

      <form className="carte" onSubmit={changerMdp}>
        <h2 className="titre-section">Changer le mot de passe</h2>
        <Champ label="Mot de passe actuel" id="ancien" type="password" autoComplete="current-password" required value={ancien} onChange={(e) => setAncien(e.target.value)} />
        <Champ label="Nouveau mot de passe" id="nouveau" type="password" autoComplete="new-password" required value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
        <Champ label="Confirmer le nouveau mot de passe" id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        <MessageErreur message={erreurMdp} />
        <button className="bouton plein" disabled={enMdp}>{enMdp ? 'Modification…' : 'Modifier le mot de passe'}</button>
      </form>
    </div>
  );
}

export default function Parametres() {
  return (
    <>
      <Retour vers="/compte" />
      <EntetePage titre="Paramètres" />
      <ExigerConnexion message="Connectez-vous pour modifier votre profil."><Formulaires /></ExigerConnexion>
    </>
  );
}
