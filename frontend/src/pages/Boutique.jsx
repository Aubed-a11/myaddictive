import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import client from '../api/client';
import useCharger, { contenu } from '../utils/useCharger';
import { formaterLibelle } from '../utils/libelles';
import { EntetePage, Etat, Filtres, Image } from '../components/ui';
import CarteProduit from '../components/CarteProduit';
import CompteARebours from '../components/CompteARebours';
import Carrousel from '../components/Carrousel';

const CATEGORIES = ['', 'MODE', 'HIGH_TECH', 'MAISON', 'BEAUTE', 'ALIMENTATION', 'ARTISANAT', 'AUTRE']
  .map((c) => ({ valeur: c, libelle: c ? formaterLibelle(c) : 'Tout' }));

export default function Boutique() {
  const [categorie, setCategorie] = useState('');
  const [recherche, setRecherche] = useState('');
  const { data: produits, chargement, erreur } = useCharger(
    () => client.get('/api/boutique/produits', { params: { categorie: categorie || undefined, page: 0, size: 30 } }).then((r) => contenu(r.data)),
    [categorie], [],
  );
  const { data: drops } = useCharger(
    () => client.get('/api/boutique/produits/drops', { params: { page: 0, size: 10 } }).then((r) => contenu(r.data)).catch(() => []),
    [], [],
  );
  const q = recherche.trim().toLowerCase();
  const affiches = produits.filter((p) => !q || p.nom?.toLowerCase().includes(q));

  return (
    <>
      <EntetePage titre="Boutique" sousTitre="Marketplace multi-vendeurs">
        <Link className="bouton secondaire petit" to="/favoris">Favoris</Link>
        <Link className="bouton secondaire petit" to="/mes-commandes">Commandes</Link>
        <Link className="bouton petit" to="/devenir-vendeur">Vendre</Link>
      </EntetePage>

      {drops?.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 className="titre-section">Drops limités</h2>
          <Carrousel>
            {drops.map((d) => (
              <Link key={d.id} to={`/boutique/produits/${d.id}`} className="carte-media" style={{ flexBasis: 220 }}>
                <Image className="image carre" src={d.imageUrl} alt="" />
                <div className="corps"><h3>{d.nom}</h3><p className="petit or">{d.dateDebutDrop && <CompteARebours dateCible={d.dateDebutDrop} />}</p></div>
              </Link>
            ))}
          </Carrousel>
        </section>
      )}

      <div className="champ" style={{ position: 'relative', maxWidth: 420 }}>
        <input type="search" aria-label="Rechercher un produit" placeholder="Rechercher un produit…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ paddingLeft: 38 }} />
        <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--attenue)' }} />
      </div>
      <Filtres options={CATEGORIES} valeur={categorie} onChoisir={setCategorie} />
      <Etat chargement={chargement} erreur={erreur} vide={affiches.length === 0} titreVide="Aucun produit" texteVide="Aucun produit dans cette catégorie.">
        <div className="grille etroite">{affiches.map((p) => <CarteProduit key={p.id} produit={p} />)}</div>
      </Etat>
    </>
  );
}
