import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/Notifications';
import useCharger, { contenu } from '../utils/useCharger';
import { EntetePage, Etat, Image, Retour } from '../components/ui';

export default function Podcasts() {
  const { estConnecte } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifier = useNotifier();
  const { data: podcasts, chargement, erreur } = useCharger(() => client.get('/api/live/podcasts', { params: { page: 0, size: 30 } }).then((r) => contenu(r.data)), [], []);
  const [episodes, setEpisodes] = useState({});
  const [abonnes, setAbonnes] = useState({});

  const voirEpisodes = async (id) => {
    try {
      const { data } = await client.get(`/api/live/podcasts/${id}/episodes`);
      setEpisodes((p) => ({ ...p, [id]: data }));
    } catch (e) { notifier(e.message || 'Impossible de charger les épisodes.', 'erreur'); }
  };
  const abonner = async (id) => {
    if (!estConnecte) return navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);
    try {
      await client.post(`/api/live/podcasts/${id}/abonnement`);
      setAbonnes((p) => ({ ...p, [id]: true }));
      notifier('Abonnement enregistré.', 'succes');
    } catch (e) { notifier(e.message || 'Abonnement impossible pour le moment.', 'erreur'); }
  };

  return (
    <>
      <Retour vers="/live" />
      <EntetePage titre="Podcasts" sousTitre="Émissions et épisodes" />
      <Etat chargement={chargement} erreur={erreur} vide={!podcasts?.length} titreVide="Aucun podcast" texteVide="Aucun podcast pour le moment.">
        <div className="grille large">
          {podcasts?.map((p) => (
            <div key={p.id} className="carte">
              <div style={{ display: 'flex', gap: 12 }}>
                <Image className="mini" src={p.imageUrl} alt="" />
                <div style={{ minWidth: 0 }}>
                  <h3>{p.titre}</h3>
                  {p.editeur && <p className="petit or">Par {p.editeur}</p>}
                  <p className="petit attenue">{p.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="bouton secondaire petit" onClick={() => voirEpisodes(p.id)}>Voir les épisodes</button>
                <button className={`bouton petit ${abonnes[p.id] ? 'secondaire' : ''}`} onClick={() => abonner(p.id)} disabled={abonnes[p.id]}>{abonnes[p.id] ? 'Abonné ✓' : "S'abonner"}</button>
              </div>
              {(episodes[p.id] || []).map((ep) => <p key={ep.id} className="petit" style={{ marginTop: 8 }}>S{ep.numeroSaison} E{ep.numeroEpisode} · {ep.titre}</p>)}
            </div>
          ))}
        </div>
      </Etat>
    </>
  );
}
