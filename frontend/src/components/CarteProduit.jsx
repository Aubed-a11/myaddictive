import React from 'react';
import { Link } from 'react-router-dom';
import { fcfa } from '../utils/libelles';
import { Image } from './ui';

export default function CarteProduit({ produit }) {
  return (
    <Link to={`/boutique/produits/${produit.id}`} className="carte-media">
      <Image className="image carre" src={produit.imageUrl} alt="" />
      <div className="corps">
        <h3>{produit.nom}</h3>
        <p className="or" style={{ fontWeight: 800 }}>{fcfa(produit.prixFcfa)}</p>
      </div>
    </Link>
  );
}
