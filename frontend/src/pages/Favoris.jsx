import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, ShoppingBag, Ticket, Trash2 } from 'lucide-react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { fcfa } from '../utils/libelles';
import { EntetePage, Etat, Image, Retour } from '../components/ui';
import ExigerConnexion from '../components/ExigerConnexion';

// Un favori ne contient que (type, id) : on charge le détail de chaque élément pour l'afficher.
const TYPES = {
  ARTICLE: { Icone: Newspaper, libelle: 'Article', vers: (id) => `/media/articles/${id}`, charger: (id) => client.get(`/api/media/articles/${id}`), extraire: (d) => ({ titre: d.titre, sousTitre: d.categorie, image: d.imageUrl }) },
  EVENEMENT: { Icone: Ticket, libelle: 'Événement', vers: (id) => `/evenements/${id}`, charger: (id) => client.get(`/api/live/evenements/${id}`), extraire: (d) => ({ titre: d.titre, sousTitre: d.lieu, image: d.imageUrl }) },
  PRODUIT: { Icone: ShoppingBag, libelle: 'Produit', vers: (id) => `/boutique/produits/${id}`, charger: (id) => client.get(`/api/boutique/produits/${id}`), extraire: (d) => ({ titre: d.nom, sousTitre: fcfa(d.prixFcfa), image: d.imageUrl }) },
};

async function charger() {
  const { data } = await client.get('/api/compte/favoris');
  return Promise.all((data || []).map(async (f) => {
    const type = TYPES[f.typeCible];
    if (!type) return { ...f, titre: f.typeCible, sousTitre: `Référence #${f.referenceId}` };
    try {
      const { data: detail } = await type.charger(f.referenceId);
      return { ...f, ...type.extraire(detail) };
    } catch {
      return { ...f, titre: 'Contenu indisponible', sousTitre: 'Cet élément a peut-être été supprimé' };
    }
  }));
}

function Liste() {
  const { data: favoris, chargement, erreur, setData, recharger } = useCharger(charger, [], []);
  const retirer = async (id) => {
    setData((prec) => prec.filter((f) => f.id !== id));
    try { await client.delete(`/api/compte/favoris/${id}`); } catch { recharger(); }
  };
  return (
    <Etat chargement={chargement} erreur={erreur} vide={!favoris?.length} titreVide="Aucun favori" texteVide="Ajoutez des articles, événements ou produits à vos favoris.">
      <div className="liste carte" style={{ padding: '4px 14px' }}>
        {favoris?.map((f) => {
          const type = TYPES[f.typeCible];
          const contenu = (
            <>
              <Image className="mini" src={f.image} alt="" />
              <div className="grow">
                <p className="petit or">{type && <type.Icone size={12} style={{ verticalAlign: -1 }} />} {type?.libelle || f.typeCible}</p>
                <strong>{f.titre}</strong>
                <p className="petit attenue">{f.sousTitre}</p>
              </div>
            </>
          );
          return (
            <div key={f.id} className="ligne">
              {type ? <Link to={type.vers(f.referenceId)} style={{ display: 'contents' }}>{contenu}</Link> : contenu}
              <button className="bouton-icone" onClick={() => retirer(f.id)} aria-label={`Retirer ${f.titre} des favoris`}><Trash2 size={16} /></button>
            </div>
          );
        })}
      </div>
    </Etat>
  );
}

export default function Favoris() {
  return (
    <>
      <Retour vers="/compte" />
      <EntetePage titre="Mes favoris" />
      <ExigerConnexion message="Connectez-vous pour retrouver vos favoris."><Liste /></ExigerConnexion>
    </>
  );
}
