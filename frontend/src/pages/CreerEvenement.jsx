import React, { useState } from 'react';
import client from '../api/client';
import { Champ, EntetePage, MessageErreur, Retour } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

function Formulaire() {
  const [champs, setChamps] = useState({ titre: '', lieu: '', dateDebut: '', prixStandard: '5000', capaciteStandard: '', capaciteVip: '' });
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [chargement, setChargement] = useState(false);
  const modifier = (cle) => (e) => setChamps((c) => ({ ...c, [cle]: e.target.value }));

  const creer = async (e) => {
    e.preventDefault();
    setErreur(null); setMessage(null);
    setChargement(true);
    try {
      const prix = Number(champs.prixStandard) || 0;
      await client.post('/api/live/evenements', {
        titre: champs.titre.trim(), lieu: champs.lieu.trim(),
        dateDebut: new Date(champs.dateDebut).toISOString(),
        statut: 'A_VENIR', payant: true,
        prixStandardFcfa: prix, prixVipFcfa: prix * 3,
        capaciteStandard: champs.capaciteStandard.trim() ? Number(champs.capaciteStandard) : null,
        capaciteVip: champs.capaciteVip.trim() ? Number(champs.capaciteVip) : null,
      });
      setMessage('Événement créé ! Retrouvez-le dans la liste des événements à venir.');
      setChamps((c) => ({ ...c, titre: '', lieu: '', dateDebut: '', capaciteStandard: '', capaciteVip: '' }));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={creer} className="carte" style={{ maxWidth: 560 }}>
      <Champ label="Titre de l'événement" id="titre" required value={champs.titre} onChange={modifier('titre')} placeholder="Ex. Nuit Afrobeat" />
      <Champ label="Lieu" id="lieu" required value={champs.lieu} onChange={modifier('lieu')} placeholder="Ex. Palais des Congrès, Cotonou" />
      <Champ label="Date et heure" id="date" type="datetime-local" required value={champs.dateDebut} onChange={modifier('dateDebut')} />
      <Champ label="Prix standard (FCFA)" id="prix" type="number" min="0" value={champs.prixStandard} onChange={modifier('prixStandard')} />
      <Champ label="Capacité standard (vide = illimitée)" id="capStd" type="number" min="1" value={champs.capaciteStandard} onChange={modifier('capaciteStandard')} />
      <Champ label="Capacité VIP (vide = illimitée)" id="capVip" type="number" min="1" value={champs.capaciteVip} onChange={modifier('capaciteVip')} />
      <MessageErreur message={erreur} />
      {message && <p className="message-ok">{message}</p>}
      <button className="bouton plein" disabled={chargement}>{chargement ? 'Création…' : "Créer l'événement"}</button>
      <p className="petit attenue" style={{ marginTop: 12 }}>Réservé aux comptes organisateurs. En cas d'erreur de permission, contactez l'administration.</p>
    </form>
  );
}

export default function CreerEvenement() {
  return (
    <>
      <Retour vers="/billetterie" />
      <EntetePage titre="Créer un événement" sousTitre="Organisez et diffusez votre propre spectacle sur My Addictive." />
      <ExigerConnexion message="Vous devez être connecté pour créer un événement."><Formulaire /></ExigerConnexion>
    </>
  );
}
