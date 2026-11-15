import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { dateCourte, fcfa, formaterLibelle } from '../utils/libelles';
import { EntetePage, Etat, Retour } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

const STATUT_COMMANDE = { EN_ATTENTE: ['En attente de paiement', 'badge'], PAYEE: ['Payée', 'badge vert'], ECHOUEE: ['Échouée', 'badge rouge'] };

function Commandes() {
  const { data: commandes, chargement, erreur } = useCharger(() => client.get('/api/boutique/commandes').then((r) => r.data), [], []);
  const [ouverte, setOuverte] = useState(null);
  const [lignes, setLignes] = useState({});
  const [erreurLignes, setErreurLignes] = useState(null);

  const basculer = async (id) => {
    if (ouverte === id) return setOuverte(null);
    if (!lignes[id]) {
      try {
        const { data } = await client.get(`/api/boutique/commandes/${id}/lignes`);
        setLignes((prec) => ({ ...prec, [id]: data }));
      } catch (e) {
        return setErreurLignes(e.message || 'Impossible de charger le détail de la commande.');
      }
    }
    setErreurLignes(null);
    setOuverte(id);
  };

  return (
    <Etat chargement={chargement} erreur={erreur || erreurLignes} vide={!commandes?.length} titreVide="Aucune commande" texteVide="Aucune commande pour le moment.">
      <div style={{ display: 'grid', gap: 12 }}>
        {commandes?.map((c) => {
          const [libelle, classe] = STATUT_COMMANDE[c.statut] || [formaterLibelle(c.statut), 'badge gris'];
          return (
            <div key={c.id} className="carte">
              <button className="ligne" style={{ width: '100%', background: 'none', border: 0, color: 'inherit', textAlign: 'left', padding: 0 }} onClick={() => basculer(c.id)} aria-expanded={ouverte === c.id}>
                <div className="grow">
                  <strong>Commande #{c.id}</strong>
                  <p className="petit attenue">{fcfa(c.montantTotalFcfa)} · {dateCourte(c.dateCommande)}</p>
                </div>
                <span className={classe}>{libelle}</span>
                {ouverte === c.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {ouverte === c.id && (
                <div className="liste" style={{ marginTop: 10 }}>
                  {(lignes[c.id] || []).map((l) => (
                    <div key={l.id} className="ligne">
                      <div className="grow"><span>{l.nomProduit} × {l.quantite}</span><p className="petit attenue">{formaterLibelle(l.statutLivraison)}</p></div>
                      <span>{fcfa(l.prixUnitaireFcfa * l.quantite)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Etat>
  );
}

export default function MesCommandes() {
  return (
    <>
      <Retour vers="/boutique" />
      <EntetePage titre="Mes commandes" />
      <ExigerConnexion message="Connectez-vous pour voir vos commandes."><Commandes /></ExigerConnexion>
    </>
  );
}
