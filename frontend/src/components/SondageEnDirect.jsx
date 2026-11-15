import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

/** Sondages d'un évènement en direct : un vote par utilisateur, résultats rafraîchis toutes les 5 s. */
export default function SondageEnDirect({ evenementId }) {
  const { estConnecte } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sondages, setSondages] = useState([]);
  const [enVote, setEnVote] = useState(null);

  const charger = useCallback(async () => {
    try {
      const { data } = await client.get(`/api/live/evenements/${evenementId}/sondages`);
      setSondages(data || []);
    } catch { /* silencieux */ }
  }, [evenementId]);

  useEffect(() => {
    charger();
    const t = setInterval(charger, 5000);
    return () => clearInterval(t);
  }, [charger]);

  const voter = async (sondageId, optionId) => {
    if (!estConnecte) return navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);
    setEnVote(optionId);
    try {
      await client.post(`/api/live/sondages/${sondageId}/voter`, { optionId });
      await charger();
    } catch { /* 409 attendu si déjà voté */ } finally { setEnVote(null); }
  };

  if (!sondages.length) return null;
  return (
    <section style={{ marginTop: 24 }}>
      <h2 className="titre-section">Sondages en direct</h2>
      <div style={{ display: 'grid', gap: 14 }}>
        {sondages.map((s) => {
          const aVote = s.optionVoteeParMoi != null;
          return (
            <div key={s.sondageId} className="carte">
              <strong>{s.question}</strong>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {s.options.map((o) => (
                  <button key={o.optionId} className="bouton secondaire" disabled={aVote || enVote === o.optionId} onClick={() => voter(s.sondageId, o.optionId)}
                    style={{ position: 'relative', overflow: 'hidden', justifyContent: 'space-between' }}>
                    <span style={{ position: 'absolute', inset: 0, width: `${o.pourcentage}%`, background: s.optionVoteeParMoi === o.optionId ? 'rgba(255,204,33,.35)' : 'rgba(255,255,255,.08)' }} />
                    <span style={{ position: 'relative' }}>{o.texte}{s.optionVoteeParMoi === o.optionId ? ' ✓' : ''}</span>
                    {aVote && <span style={{ position: 'relative' }}>{Number(o.pourcentage).toFixed(0)} %</span>}
                  </button>
                ))}
              </div>
              <p className="petit attenue" style={{ marginTop: 8 }}>{s.totalVotes} vote{s.totalVotes > 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
