import React, { useState } from 'react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { dateHeure, fcfa, formaterLibelle } from '../utils/libelles';
import { Champ, EntetePage, Etat, MessageErreur, Retour } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

const COULEUR = { REUSSI: 'var(--vert)', ECHEC: 'var(--rouge)' };

function Contenu() {
  const { data: transactions, chargement, erreur } = useCharger(() => client.get('/api/paiement/transactions').then((r) => r.data), [], []);
  const [numero, setNumero] = useState('');
  const [resultat, setResultat] = useState(null);
  const [erreurVerif, setErreurVerif] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const verifier = async (e) => {
    e.preventDefault();
    setErreurVerif(null); setResultat(null); setEnCours(true);
    try { setResultat((await client.get(`/api/paiement/transactions/${numero.trim()}`)).data); }
    catch (err) { setErreurVerif(err.message); }
    finally { setEnCours(false); }
  };

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      <form className="carte" style={{ maxWidth: 480 }} onSubmit={verifier}>
        <h2 className="titre-section">Vérifier une transaction</h2>
        <Champ label="Numéro de transaction" id="numero" inputMode="numeric" required value={numero} onChange={(e) => setNumero(e.target.value)} />
        <button className="bouton" disabled={enCours}>{enCours ? 'Vérification…' : 'Vérifier'}</button>
        <MessageErreur message={erreurVerif} />
        {resultat && (
          <div style={{ marginTop: 14 }}>
            <p>Statut : <strong>{formaterLibelle(resultat.statut)}</strong></p>
            <p>Montant : <strong>{fcfa(resultat.montantFcfa)}</strong></p>
            <p>Moyen : <strong>{resultat.moyenPaiement}</strong></p>
          </div>
        )}
      </form>

      <section>
        <h2 className="titre-section">Mes transactions</h2>
        <Etat chargement={chargement} erreur={erreur} vide={!transactions?.length} titreVide="Aucune transaction" texteVide="Aucune transaction pour le moment.">
          <div className="liste carte" style={{ padding: '4px 14px' }}>
            {transactions?.map((t) => (
              <div key={t.id} className="ligne">
                <div className="grow"><strong>#{t.id} · {formaterLibelle(t.typeObjet)}</strong><p className="petit attenue">{dateHeure(t.dateCreation)}</p></div>
                <div style={{ textAlign: 'right' }}><strong>{fcfa(t.montantFcfa)}</strong><p className="petit" style={{ color: COULEUR[t.statut] || 'var(--or)' }}>{formaterLibelle(t.statut)}</p></div>
              </div>
            ))}
          </div>
        </Etat>
      </section>
    </div>
  );
}

export default function Transactions() {
  return (
    <>
      <Retour vers="/compte" />
      <EntetePage titre="Mes transactions" />
      <ExigerConnexion message="Connectez-vous pour voir vos transactions."><Contenu /></ExigerConnexion>
    </>
  );
}
