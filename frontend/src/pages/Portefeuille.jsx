import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { dateCourte, fcfa } from '../utils/libelles';
import { TAUX_PIECE_FCFA } from '../utils/votes';
import { payerAvecKkiapay, TELEPHONE_TEST_SANDBOX } from '../utils/paiementKkiapay';
import { Champ, EntetePage, Etat, MessageErreur, Modal } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

const PACKS = [
  { pieces: 10, prix: 10 * TAUX_PIECE_FCFA },
  { pieces: 55, prix: 50 * TAUX_PIECE_FCFA, bonus: '10 % de pièces offertes' },
  { pieces: 140, prix: 120 * TAUX_PIECE_FCFA, bonus: '15 % de pièces offertes' },
];
const MOYENS = [
  { cle: 'KKIAPAY', libelle: 'Mobile Money / Carte (KKiaPay)' },
  { cle: 'AGENCE', libelle: 'Paiement en agence' },
];
const MOBILE_MONEY = ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'];

function WalletContenu() {
  const { data, chargement, erreur, recharger } = useCharger(async () => {
    const [{ data: p }, { data: m }] = await Promise.all([client.get('/api/votes/portefeuille'), client.get('/api/votes/portefeuille/mouvements')]);
    return { solde: p.solde, mouvements: m };
  }, [], { solde: 0, mouvements: [] });
  const [ouvert, setOuvert] = useState(false);
  const [pack, setPack] = useState(null);
  const [moyen, setMoyen] = useState('KKIAPAY');
  const [telephone, setTelephone] = useState(TELEPHONE_TEST_SANDBOX);
  const [erreurAchat, setErreurAchat] = useState(null);
  const [message, setMessage] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const fermer = () => { setOuvert(false); setPack(null); setErreurAchat(null); };

  const acheter = async () => {
    if (MOBILE_MONEY.includes(moyen) && telephone.trim().length < 8) return setErreurAchat('Renseignez un numéro Mobile Money valide.');
    setErreurAchat(null);
    setEnCours(true);
    try {
      const { data: transaction } = await client.post('/api/votes/portefeuille/acheter-pieces', {
        nombrePieces: pack.pieces, montantFcfa: pack.prix, moyenPaiement: moyen,
        telephonePayeur: MOBILE_MONEY.includes(moyen) ? telephone.trim() : undefined,
      });
      if (moyen === 'KKIAPAY') {
        setMessage('Ouverture du paiement KKiaPay…');
        const finale = await payerAvecKkiapay({ transactionId: transaction.id, montantFcfa: pack.prix, motif: `${pack.pieces} pièces My Addictive` });
        setMessage(finale.statut === 'REUSSI' ? `${pack.pieces} pièces créditées.` : "Le paiement n'a pas abouti. Vous pouvez réessayer.");
      } else if (transaction.statut === 'REUSSI') {
        setMessage(`${pack.pieces} pièces créditées.`);
      } else if (moyen === 'AGENCE') {
        setMessage("Demande enregistrée. Présentez-vous à l'agence : vos pièces seront créditées une fois le paiement vérifié.");
      } else {
        setMessage('Demande envoyée sur votre téléphone. Validez avec votre code PIN : vos pièces seront créditées dès confirmation.');
      }
      fermer();
      await recharger();
    } catch (e) {
      setErreurAchat(e.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <div className="carte centre" style={{ maxWidth: 420, margin: '0 auto 24px' }}>
        <Wallet size={24} color="var(--or)" />
        <p className="attenue">Solde actuel</p>
        <p style={{ fontSize: 40, fontWeight: 800 }}>{data.solde} <span className="petit attenue">pièces</span></p>
        <p className="petit attenue">1 pièce = {TAUX_PIECE_FCFA} FCFA</p>
        <button className="bouton degrade" style={{ marginTop: 12 }} onClick={() => setOuvert(true)}>Recharger</button>
      </div>
      {message && <p className="message-ok">{message}</p>}

      <h2 className="titre-section">Historique</h2>
      <Etat chargement={chargement && !data.mouvements.length} erreur={erreur} vide={data.mouvements.length === 0} titreVide="Aucun mouvement" texteVide="Aucun mouvement pour le moment.">
        <div className="liste">
          {data.mouvements.map((m) => {
            const positif = m.montant > 0;
            return (
              <div key={m.id} className="ligne">
                <span className="bouton-icone" style={{ color: positif ? 'var(--vert)' : 'var(--rouge)' }}>{positif ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</span>
                <div className="grow"><strong>{m.motif}</strong><p className="petit attenue">{dateCourte(m.dateMouvement)}</p></div>
                <strong style={{ color: positif ? 'var(--vert)' : 'var(--rouge)' }}>{positif ? '+' : ''}{m.montant}</strong>
              </div>
            );
          })}
        </div>
      </Etat>

      {ouvert && (
        <Modal titre={pack ? `${pack.pieces} pièces · ${fcfa(pack.prix)}` : 'Acheter des pièces'} onFermer={fermer}>
          {!pack ? (
            <>
              <p className="petit attenue" style={{ marginBottom: 12 }}>Non remboursables une fois utilisées pour voter.</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {PACKS.map((p) => (
                  <button key={p.pieces} className="bouton secondaire" onClick={() => setPack(p)} style={{ height: 'auto', padding: 12, flexDirection: 'column' }}>
                    <strong>{p.pieces} pièces · {fcfa(p.prix)}</strong>
                    {p.bonus && <span className="petit or">{p.bonus}</span>}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <MessageErreur message={erreurAchat} />
              <div className="champ">
                <label htmlFor="moyen">Moyen de paiement</label>
                <select id="moyen" value={moyen} onChange={(e) => setMoyen(e.target.value)}>{MOYENS.map((m) => <option key={m.cle} value={m.cle}>{m.libelle}</option>)}</select>
              </div>
              {MOBILE_MONEY.includes(moyen) && <Champ label="Numéro Mobile Money" id="tel" inputMode="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />}
              {moyen === 'AGENCE' && <p className="petit attenue">Les pièces ne seront créditées qu'après vérification de votre paiement en agence.</p>}
              <button className="bouton degrade plein" onClick={acheter} disabled={enCours}>{enCours ? 'Traitement…' : "Confirmer l'achat"}</button>
              <button className="bouton secondaire plein" style={{ marginTop: 8 }} onClick={() => setPack(null)}>← Changer de pack</button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

export default function Portefeuille() {
  return (
    <>
      <EntetePage titre="Mon wallet" sousTitre="Pièces pour voter, recharge et historique" />
      <ExigerConnexion message="Connectez-vous pour accéder à votre portefeuille."><WalletContenu /></ExigerConnexion>
    </>
  );
}
