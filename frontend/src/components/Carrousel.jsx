import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { chaineImages } from '../api/client';
import logoMarque from '../assets/logo_myaddictive_clair.png';

/** Piste horizontale a defilement tactile (une diapo ou une carte par element). */
export default function Carrousel({ children }) {
  return <div className="carrousel"><div className="carrousel-piste">{children}</div></div>;
}

/** Diapo plein cadre : image de fond, etiquette, titre, sous-titre. */
export function Diapo({ vers, image, secours, etiquette, titre, sousTitre }) {
  const [etape, setEtape] = useState(0);
  const url = chaineImages(image, secours)[etape];
  const affichee = !!url;
  return (
    <Link to={vers} className="diapo" style={affichee ? undefined
      : { backgroundImage: `url("${logoMarque}")`, backgroundSize: '46%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center 38%' }}>
      {affichee && <img key={url} className="diapo-image" src={url} alt="" referrerPolicy="no-referrer" onError={() => setEtape(etape + 1)} />}
      {etiquette && <span className="badge">{etiquette}</span>}
      <div>
        <h3>{titre}</h3>
        {sousTitre && <p className="petit" style={{ opacity: .85 }}>{sousTitre}</p>}
      </div>
    </Link>
  );
}
