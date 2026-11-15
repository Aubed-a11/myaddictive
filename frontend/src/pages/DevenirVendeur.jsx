import React, { useState } from 'react';
import client from '../api/client';
import { formaterLibelle } from '../utils/libelles';
import { Champ, EntetePage, MessageErreur, Retour } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

const CATEGORIES = ['MODE', 'HIGH_TECH', 'MAISON', 'BEAUTE', 'ALIMENTATION', 'ARTISANAT', 'AUTRE'];

function Formulaire() {
  const [nomBoutique, setNomBoutique] = useState('');
  const [categorie, setCategorie] = useState('MODE');
  const [description, setDescription] = useState('');
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [chargement, setChargement] = useState(false);

  const envoyer = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await client.post('/api/boutique/vendeurs/inscription', { nomBoutique: nomBoutique.trim(), categorie, description });
      setMessage("Demande envoyée. Votre boutique sera visible après validation par l'administration.");
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <form className="carte" style={{ maxWidth: 520 }} onSubmit={envoyer}>
      <Champ label="Nom de la boutique" id="nom" required value={nomBoutique} onChange={(e) => setNomBoutique(e.target.value)} />
      <div className="champ">
        <label htmlFor="cat">Catégorie</label>
        <select id="cat" value={categorie} onChange={(e) => setCategorie(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{formaterLibelle(c)}</option>)}</select>
      </div>
      <div className="champ">
        <label htmlFor="desc">Description</label>
        <textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <MessageErreur message={erreur} />
      {message && <p className="message-ok">{message}</p>}
      <button className="bouton plein" disabled={chargement || !!message}>{chargement ? 'Envoi…' : 'Envoyer la demande'}</button>
    </form>
  );
}

export default function DevenirVendeur() {
  return (
    <>
      <Retour vers="/boutique" />
      <EntetePage titre="Ouvrir ma boutique" sousTitre="Accessible à tout vendeur, artiste ou non." />
      <ExigerConnexion message="Connectez-vous pour ouvrir votre boutique."><Formulaire /></ExigerConnexion>
    </>
  );
}
