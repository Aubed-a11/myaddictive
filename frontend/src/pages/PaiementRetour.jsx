import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import { fcfa } from '../utils/libelles';
import { EntetePage, Chargement, MessageErreur } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

const SUITE = {
  BILLET: { vers: () => '/mes-billets', libelle: 'Voir mes billets' },
  COMMANDE: { vers: () => '/mes-commandes', libelle: 'Voir mes commandes' },
  PORTEFEUILLE_PIECES: { vers: () => '/portefeuille', libelle: 'Voir mon portefeuille' },
  FAN_CLUB: { vers: (t) => `/chaines/${t.referenceId}`, libelle: "Retourner à l'artiste" },
};

function RetourContenu() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [delaiDepasse, setDelaiDepasse] = useState(false);

  useEffect(() => {
    let actif = true;
    let tentatives = 0;
    const verifier = async () => {
      try {
        const { data } = await client.post(`/api/paiement/transactions/${id}/verifier`);
        if (!actif) return;
        setTransaction(data);
        if (data.statut !== 'EN_ATTENTE') return;
      } catch (e) {
        if (!actif) return;
        setErreur(e.message);
        return;
      }
      tentatives += 1;
      if (tentatives >= 40) { setDelaiDepasse(true); return; } // ~2 minutes
      setTimeout(verifier, 3000);
    };
    verifier();
    return () => { actif = false; };
  }, [id]);

  if (erreur) return <MessageErreur message={erreur} />;
  if (!transaction) return <Chargement />;

  const suite = SUITE[transaction.typeObjet];
  const reussi = transaction.statut === 'REUSSI';
  const echec = transaction.statut === 'ECHEC';

  return (
    <div className="carte" style={{ textAlign: 'center' }}>
      {reussi && (
        <>
          <h2>Paiement confirmé ✔</h2>
          <p className="attenue">Merci ! Votre paiement de {fcfa(transaction.montantFcfa)} a bien été reçu.</p>
        </>
      )}
      {echec && (
        <>
          <h2>Paiement non abouti</h2>
          <p className="attenue">Le paiement a été refusé ou annulé. Vous n'avez pas été débité. Vous pouvez réessayer.</p>
        </>
      )}
      {!reussi && !echec && (
        <>
          <h2>Vérification du paiement…</h2>
          <p className="attenue">
            {delaiDepasse
              ? "La confirmation prend plus de temps que prévu. Si vous avez validé le paiement sur votre téléphone, il sera pris en compte automatiquement : retrouvez son statut dans « Mes transactions »."
              : 'Validez la demande sur votre téléphone si ce n’est pas déjà fait. Cette page se met à jour toute seule.'}
          </p>
        </>
      )}
      <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {reussi && suite && <Link className="bouton" to={suite.vers(transaction)}>{suite.libelle}</Link>}
        {echec && <Link className="bouton" to="/">Retour à l'accueil</Link>}
        <Link className="bouton secondaire" to="/transactions">Mes transactions</Link>
      </div>
    </div>
  );
}

export default function PaiementRetour() {
  return (
    <>
      <EntetePage titre="Paiement" />
      <ExigerConnexion message="Connectez-vous pour voir le résultat de votre paiement."><RetourContenu /></ExigerConnexion>
    </>
  );
}
