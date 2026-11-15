import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Search, Star } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import useCharger, { contenu } from '../utils/useCharger';
import { formaterLibelle } from '../utils/libelles';
import { Etat, EntetePage, Filtres, Image } from '../components/ui';
import Carrousel, { Diapo } from '../components/Carrousel';

const ONGLETS = [
  { valeur: 'TOUT', libelle: 'Toutes' },
  { valeur: 'A_LA_UNE', libelle: 'À la une' },
  { valeur: 'VIDEO', libelle: 'Vidéo / Clip' },
];

/** Articles, les liés à une chaîne suivie remontent en tête (recommandation, section 4.2). */
async function chargerArticles(estConnecte) {
  const { data } = await client.get('/api/media/articles', { params: { page: 0, size: 40 } });
  let articles = contenu(data);
  let recommande = false;
  if (estConnecte) {
    try {
      const { data: chaines } = await client.get('/api/live/mes-chaines-suivies');
      const suivis = new Set((chaines || []).map((c) => c.nom.toLowerCase()));
      const estReco = (a) => a.artisteLie && suivis.has(a.artisteLie.toLowerCase());
      if (suivis.size && articles.some(estReco)) {
        articles = [...articles.filter(estReco), ...articles.filter((a) => !estReco(a))];
        recommande = true;
      }
    } catch { /* recommandation facultative */ }
  }
  return { articles, recommande };
}

export default function Media() {
  const { estConnecte } = useAuth();
  const { data, chargement, erreur } = useCharger(() => chargerArticles(estConnecte), [estConnecte], { articles: [], recommande: false });
  const [onglet, setOnglet] = useState('TOUT');
  const [recherche, setRecherche] = useState('');

  const affiches = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return data.articles
      .filter((a) => onglet === 'TOUT' || (onglet === 'A_LA_UNE' ? a.aLaUne : a.categorie === onglet))
      .filter((a) => !q || a.titre?.toLowerCase().includes(q));
  }, [data.articles, onglet, recherche]);

  const unes = useMemo(() => {
    const aLaUne = data.articles.filter((a) => a.aLaUne);
    return (aLaUne.length ? aLaUne : data.articles).slice(0, 6);
  }, [data.articles]);

  return (
    <>
      <EntetePage titre="Média & actualités" sousTitre="À la une, actualités, showbiz et vidéos">
        <Link className="bouton secondaire petit" to="/offres-promotion">Offres de promotion</Link>
      </EntetePage>

      {unes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Carrousel>
            {unes.map((a) => <Diapo key={a.id} vers={`/media/articles/${a.id}`} image={a.imageUrl} etiquette={formaterLibelle(a.categorie)} titre={a.titre} />)}
          </Carrousel>
        </div>
      )}

      <div className="champ" style={{ position: 'relative', maxWidth: 420 }}>
        <input type="search" aria-label="Rechercher un article" placeholder="Rechercher un article…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ paddingLeft: 38 }} />
        <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--attenue)' }} />
      </div>
      <Filtres options={ONGLETS} valeur={onglet} onChoisir={setOnglet} />
      {data.recommande && onglet === 'TOUT' && <p className="petit or" style={{ marginBottom: 12 }}>Recommandé selon les artistes que vous suivez</p>}

      <Etat chargement={chargement} erreur={erreur} vide={affiches.length === 0}
        titreVide="Aucun article" texteVide={recherche ? 'Aucun résultat pour cette recherche.' : 'Rien dans cette catégorie pour le moment.'}>
        <div className="grille">
          {affiches.map((a) => (
            <Link key={a.id} to={`/media/articles/${a.id}`} className="carte-media">
              <div style={{ position: 'relative' }}>
                <Image className="image" src={a.imageUrl} alt="" />
                {a.categorie === 'VIDEO' && <PlayCircle size={34} color="#fff" style={{ position: 'absolute', right: 10, bottom: 10 }} />}
              </div>
              <div className="corps">
                {a.aLaUne && <span className="badge"><Star size={10} /> À la une</span>}
                <h3>{a.titre}</h3>
                <p className="petit attenue">{formaterLibelle(a.categorie)}{a.compteurVues > 0 ? ` · ${a.compteurVues} vues` : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      </Etat>
    </>
  );
}
