import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { urlImage } from '../api/client';
import iconeMarque from '../assets/icone_myaddictive.png';
import logoMarque from '../assets/logo_myaddictive.png';

export function Chargement() {
  return <div className="chargeur" role="progressbar" aria-label="Chargement" />;
}

export function Vide({ titre = 'Rien a afficher', texte, children }) {
  return (
    <div className="etat">
      <strong>{titre}</strong>
      {texte && <span>{texte}</span>}
      {children}
    </div>
  );
}

export function MessageErreur({ message }) {
  return message ? <div className="message-erreur" role="alert">{message}</div> : null;
}

/** Affiche chargement / erreur / liste vide, puis le contenu. */
export function Etat({ chargement, erreur, vide, titreVide, texteVide, children }) {
  if (chargement) return <Chargement />;
  if (erreur) return <MessageErreur message={erreur} />;
  if (vide) return <Vide titre={titreVide} texte={texteVide} />;
  return children;
}

export function Retour({ vers }) {
  const navigate = useNavigate();
  return (
    <button className="retour" onClick={() => (vers ? navigate(vers) : navigate(-1))}>
      <ArrowLeft size={16} /> Retour
    </button>
  );
}

export function EntetePage({ titre, sousTitre, children }) {
  return (
    <div className="entete-page">
      <div>
        <h1 className="titre-page">{titre}</h1>
        {sousTitre && <p className="sous-titre">{sousTitre}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>}
    </div>
  );
}

/** Image du backend, ou logo My Addictive quand il n'y en a pas (logo complet, ou icône seule en petit format). */
export function Image({ src, alt = '', className = '' }) {
  const url = urlImage(src);
  const [cassee, setCassee] = useState(false);
  if (!url || cassee) {
    return <div className={`${className} image-vide`} role="img" aria-label={alt}>
        <img className="logo-plein" src={logoMarque} alt="" />
        <img className="logo-icone" src={iconeMarque} alt="" />
      </div>;
  }
  return <img className={className} src={url} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setCassee(true)} />;
}

export function Champ({ label, id, children, ...props }) {
  const identifiant = id || `champ-${label}`.replace(/\W+/g, '-');
  return (
    <div className="champ">
      {label && <label htmlFor={identifiant}>{label}</label>}
      {children || <input id={identifiant} {...props} />}
    </div>
  );
}

export function Modal({ titre, onFermer, children }) {
  return (
    <div className="modal-fond" onClick={onFermer}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titre} onClick={(e) => e.stopPropagation()}>
        {titre && <h2>{titre}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Filtres({ options, valeur, onChoisir }) {
  return (
    <div className="filtres" role="tablist">
      {options.map((o) => {
        const cle = typeof o === 'string' ? o : o.valeur;
        const libelle = typeof o === 'string' ? o : o.libelle;
        return (
          <button key={cle ?? 'tous'} className={`filtre${valeur === cle ? ' actif' : ''}`} onClick={() => onChoisir(cle)} role="tab" aria-selected={valeur === cle}>
            {libelle}
          </button>
        );
      })}
    </div>
  );
}
