import React from 'react';
import { Link } from 'react-router-dom';
import { urlImage } from '../api/client';

/** Piste horizontale a defilement tactile (une diapo ou une carte par element). */
export default function Carrousel({ children }) {
  return <div className="carrousel"><div className="carrousel-piste">{children}</div></div>;
}

/** Diapo plein cadre : image de fond, etiquette, titre, sous-titre. */
export function Diapo({ vers, image, etiquette, titre, sousTitre }) {
  const url = urlImage(image);
  return (
    <Link to={vers} className="diapo" style={url ? { backgroundImage: `url("${url}")` } : undefined}>
      {etiquette && <span className="badge">{etiquette}</span>}
      <div>
        <h3>{titre}</h3>
        {sousTitre && <p className="petit" style={{ opacity: .85 }}>{sousTitre}</p>}
      </div>
    </Link>
  );
}
