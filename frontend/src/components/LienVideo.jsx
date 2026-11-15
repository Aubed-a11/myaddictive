import React from 'react';
import { PlayCircle } from 'lucide-react';

/** Bouton qui ouvre un lien vidéo (direct, replay, clip) dans un nouvel onglet. */
export default function LienVideo({ url, libelle = 'Regarder la vidéo', messageAbsent = 'Aucune vidéo disponible pour le moment.', danger = false }) {
  if (!url) return <p className="attenue petit">{messageAbsent}</p>;
  return (
    <a className={`bouton ${danger ? 'danger' : 'secondaire'}`} href={url} target="_blank" rel="noreferrer">
      <PlayCircle size={18} /> {libelle}
    </a>
  );
}
