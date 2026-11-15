import React, { useEffect, useState } from 'react';

function calculer(dateCible, texteExpire) {
  const diff = new Date(dateCible).getTime() - Date.now();
  if (diff <= 0) return texteExpire;
  const j = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return j > 0 ? `${j}j ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}

/** Compte à rebours en direct (fin de phase de vote, drops limités). */
export default function CompteARebours({ dateCible, texteExpire = 'Disponible maintenant' }) {
  const [reste, setReste] = useState(() => calculer(dateCible, texteExpire));
  useEffect(() => {
    setReste(calculer(dateCible, texteExpire));
    const t = setInterval(() => setReste(calculer(dateCible, texteExpire)), 1000);
    return () => clearInterval(t);
  }, [dateCible, texteExpire]);
  return <span>{reste}</span>;
}
