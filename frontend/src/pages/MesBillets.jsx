import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { dateHeure, formaterLibelle } from '../utils/libelles';
import { EntetePage, Etat, Image } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

function Billets() {
  const { data: billets, chargement, erreur } = useCharger(() => client.get('/api/live/billets/mes-billets').then((r) => r.data), [], []);
  return (
    <Etat chargement={chargement} erreur={erreur} vide={!billets?.length} titreVide="Aucun billet" texteVide="Vous n'avez pas encore de billet.">
      <div className="grille large">
        {billets?.map((b) => (
          <div key={b.id} className="carte">
            <div style={{ display: 'flex', gap: 12 }}>
              <Image className="mini" src={b.evenementImageUrl} alt="" />
              <div style={{ minWidth: 0 }}>
                <h3>{b.evenementTitre}</h3>
                <p className="petit attenue"><MapPin size={12} /> {b.evenementLieu}</p>
                <p className="petit attenue"><Clock size={12} /> {dateHeure(b.evenementDateDebut)}</p>
              </div>
            </div>
            <div style={{ background: '#fff', padding: 12, borderRadius: 12, width: 'fit-content', margin: '16px auto' }}>
              <QRCodeSVG value={b.codeQr || ''} size={140} />
            </div>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Catégorie {formaterLibelle(b.categorie)}</span>
              <span className={`badge ${b.statut === 'UTILISE' ? 'gris' : 'vert'}`}>
                {b.statut === 'UTILISE' && <CheckCircle2 size={11} />} {b.statut === 'UTILISE' ? 'Utilisé' : b.statut === 'VALIDE' ? 'Valide' : formaterLibelle(b.statut)}
              </span>
            </p>
            {b.statut === 'UTILISE' && b.dateScan && <p className="petit attenue">Scanné le {dateHeure(b.dateScan)}</p>}
            {b.statut !== 'ANNULE' && b.codeAcces && (
              <div style={{ background: 'var(--fond-2, rgba(128,128,128,.12))', borderRadius: 10, padding: '10px 12px', margin: '10px 0', textAlign: 'center' }}>
                <p className="petit attenue" style={{ margin: 0 }}>Code d'accès au live</p>
                <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, margin: '4px 0', fontFamily: 'monospace' }}>{b.codeAcces.slice(0, 4)}-{b.codeAcces.slice(4)}</p>
                <p className="petit attenue" style={{ margin: 0 }}>{b.accesLiveDebloque ? '✔ Live débloqué' : 'À saisir sur la page de l\'événement au début du live, pour débloquer le direct.'}</p>
              </div>
            )}
            <p className="petit attenue" style={{ marginTop: 8 }}>Présentez ce code QR à l'entrée : un agent le scannera pour valider votre accès. Chaque billet ne peut être scanné qu'une seule fois.</p>
          </div>
        ))}
      </div>
    </Etat>
  );
}

export default function MesBillets() {
  return (
    <>
      <EntetePage titre="Mes billets">
        <Link className="bouton secondaire petit" to="/billetterie">Voir les événements</Link>
      </EntetePage>
      <ExigerConnexion message="Connectez-vous pour retrouver vos billets."><Billets /></ExigerConnexion>
    </>
  );
}
