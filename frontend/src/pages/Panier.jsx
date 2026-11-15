import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import client from '../api/client';
import { fcfa } from '../utils/libelles';
import { payerAvecKkiapay, TELEPHONE_TEST_SANDBOX } from '../utils/paiementKkiapay';
import { Champ, EntetePage, Image, MessageErreur, Chargement, Vide } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

const MOYENS = [
  { cle: 'KKIAPAY', libelle: 'Mobile Money / Carte (KKiaPay)' },
  { cle: 'AGENCE', libelle: 'Paiement en agence' },
];
const MOBILE_MONEY = ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'];

function PanierContenu() {
  const [items, setItems] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [moyen, setMoyen] = useState('KKIAPAY');
  const [telephone, setTelephone] = useState(TELEPHONE_TEST_SANDBOX);
  const [adresse, setAdresse] = useState('');
  const [frais, setFrais] = useState(0);

  const charger = useCallback(async () => {
    try {
      const { data } = await client.get('/api/boutique/panier');
      setItems(data);
    } catch (e) {
      setErreur(e.message);
      setItems([]);
    }
  }, []);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    client.get('/api/boutique/frais-livraison').then(({ data }) => setFrais(data.fraisLivraisonFcfa || 0)).catch(() => {});
  }, []);

  const retirer = async (id) => {
    try { await client.delete(`/api/boutique/panier/${id}`); } catch (e) { setErreur(e.message); }
    charger();
  };
  const changerQuantite = async (item, delta) => {
    const quantite = item.quantite + delta;
    if (quantite < 1) return retirer(item.id);
    setItems((prec) => prec.map((i) => (i.id === item.id ? { ...i, quantite } : i)));
    try { await client.put(`/api/boutique/panier/${item.id}`, { quantite }); } catch (e) { setErreur(e.message); charger(); }
  };

  const total = (items || []).reduce((s, i) => s + (i.prixFcfaProduit || 0) * i.quantite, 0);

  const commander = async (e) => {
    e.preventDefault();
    if (!adresse.trim()) return setErreur('Renseignez une adresse de livraison avant de valider la commande.');
    if (MOBILE_MONEY.includes(moyen) && telephone.trim().length < 8) return setErreur('Renseignez un numéro Mobile Money valide.');
    setErreur(null);
    setMessage(null);
    setEnCours(true);
    try {
      const { data: transaction } = await client.post('/api/boutique/commandes/initier', {
        moyenPaiement: moyen, adresseLivraison: adresse.trim(),
        telephonePayeur: MOBILE_MONEY.includes(moyen) ? telephone.trim() : undefined,
      });
      if (moyen === 'KKIAPAY') {
        setMessage('Ouverture du paiement KKiaPay…');
        const finale = await payerAvecKkiapay({ transactionId: transaction.id, montantFcfa: total + frais, motif: 'Commande My Addictive' });
        setMessage(finale.statut === 'REUSSI' ? 'Commande payée avec succès ! Retrouvez-la dans « Mes commandes ».' : "Le paiement n'a pas abouti. Vous pouvez réessayer.");
      } else if (transaction.statut === 'REUSSI') {
        setMessage('Commande payée avec succès ! Retrouvez-la dans « Mes commandes ».');
      } else if (moyen === 'AGENCE') {
        setMessage("Demande enregistrée. Présentez-vous à l'agence pour régler le montant : votre commande sera confirmée une fois le paiement vérifié.");
      } else {
        setMessage('Demande de paiement envoyée sur votre téléphone. Validez-la avec votre code PIN : votre commande sera confirmée dès réception.');
      }
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  };

  if (items === null) return <Chargement />;
  return (
    <>
      <MessageErreur message={erreur} />
      {message && <p className="message-ok">{message}</p>}
      {items.length === 0
        ? <Vide titre="Panier vide" texte="Votre panier est vide."><p style={{ marginTop: 16 }}><Link className="bouton" to="/boutique">Découvrir la boutique</Link></p></Vide>
        : (
          <div className="deux-colonnes">
            <div className="liste carte">
              {items.map((i) => (
                <div key={i.id} className="ligne">
                  <Image className="mini" src={i.imageUrlProduit} alt="" />
                  <div className="grow">
                    <strong>{i.nomProduit}</strong>
                    {i.taille && <span className="petit attenue"> · {i.taille}</span>}
                    <div className="quantite" style={{ marginTop: 6 }}>
                      <button type="button" onClick={() => changerQuantite(i, -1)} aria-label="Moins">−</button>
                      <span>{i.quantite}</span>
                      <button type="button" onClick={() => changerQuantite(i, 1)} aria-label="Plus">+</button>
                    </div>
                  </div>
                  <strong className="or">{fcfa(i.prixFcfaProduit * i.quantite)}</strong>
                  <button className="bouton-icone" onClick={() => retirer(i.id)} aria-label={`Retirer ${i.nomProduit}`}><Trash2 size={16} color="#f87171" /></button>
                </div>
              ))}
            </div>
            <form className="carte" onSubmit={commander}>
              <Champ label="Adresse de livraison" id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Quartier, rue, ville, point de repère" />
              <p style={{ display: 'flex', justifyContent: 'space-between' }}><span className="attenue">Sous-total</span><span>{fcfa(total)}</span></p>
              <p style={{ display: 'flex', justifyContent: 'space-between' }}><span className="attenue">Livraison</span><span>{fcfa(frais)}</span></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, margin: '8px 0 16px' }}><span>Total</span><span className="or">{fcfa(total + frais)}</span></p>
              <div className="champ">
                <label htmlFor="moyen">Moyen de paiement</label>
                <select id="moyen" value={moyen} onChange={(e) => setMoyen(e.target.value)}>{MOYENS.map((m) => <option key={m.cle} value={m.cle}>{m.libelle}</option>)}</select>
              </div>
              {MOBILE_MONEY.includes(moyen) && <Champ label="Numéro Mobile Money" id="tel" inputMode="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />}
              {moyen === 'AGENCE' && <p className="petit attenue">La commande ne sera confirmée qu'après vérification de votre paiement en agence.</p>}
              <button className="bouton plein" disabled={enCours}>{enCours ? 'Traitement…' : `Passer commande · ${fcfa(total + frais)}`}</button>
            </form>
          </div>
        )}
    </>
  );
}

export default function Panier() {
  return (
    <>
      <EntetePage titre="Mon panier" />
      <ExigerConnexion message="Connectez-vous pour voir votre panier."><PanierContenu /></ExigerConnexion>
    </>
  );
}
