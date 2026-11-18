import React, { useEffect, useState } from 'react';
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

const TAILLE_PAGE = 24;

/** Une page d'articles depuis la base ; les liés à une chaîne suivie remontent en tête (recommandation, section 4.2). */
async function chargerPage({ page, onglet, recherche, estConnecte }) {
  const params = { page, size: TAILLE_PAGE };
  if (onglet === 'A_LA_UNE') params.aLaUne = true;
  else if (onglet !== 'TOUT') params.categorie = onglet;
  if (recherche) params.q = recherche;
  const { data } = await client.get('/api/media/articles', { params });
  let articles = contenu(data);
  let recommande = false;
  if (estConnecte && page === 0 && onglet === 'TOUT' && !recherche) {
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
  return { articles, recommande, derniere: data?.last !== false };
}

export default function Media() {
  const { estConnecte } = useAuth();
  const [onglet, setOnglet] = useState('TOUT');
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(0);
  const [derniere, setDerniere] = useState(true);
  const [recommande, setRecommande] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setRecherche(saisie.trim()), 350);
    return () => clearTimeout(t);
  }, [saisie]);

  useEffect(() => {
    let actif = true;
    setChargement(true); setErreur(null);
    chargerPage({ page: 0, onglet, recherche, estConnecte })
      .then((r) => { if (!actif) return; setArticles(r.articles); setPage(0); setDerniere(r.derniere); setRecommande(r.recommande); })
      .catch((e) => { if (actif) setErreur(e.message || 'Erreur de chargement.'); })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, [onglet, recherche, estConnecte]);

  const voirPlus = async () => {
    setChargement(true);
    try {
      const r = await chargerPage({ page: page + 1, onglet, recherche, estConnecte });
      setArticles((anciens) => [...anciens, ...r.articles]);
      setPage(page + 1); setDerniere(r.derniere);
    } catch (e) { setErreur(e.message || 'Erreur de chargement.'); } finally { setChargement(false); }
  };

  const { data: unes } = useCharger(
    () => client.get('/api/media/articles', { params: { aLaUne: true, page: 0, size: 6 } }).then((r) => contenu(r.data)), [], []);
  const affiches = articles;
  const data = { recommande };

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
        <input type="search" aria-label="Rechercher un article" placeholder="Rechercher un article…" value={saisie} onChange={(e) => setSaisie(e.target.value)} style={{ paddingLeft: 38 }} />
        <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--attenue)' }} />
      </div>
      <Filtres options={ONGLETS} valeur={onglet} onChoisir={setOnglet} />
      {data.recommande && onglet === 'TOUT' && <p className="petit or" style={{ marginBottom: 12 }}>Recommandé selon les artistes que vous suivez</p>}

      <Etat chargement={chargement && articles.length === 0} erreur={erreur} vide={!chargement && affiches.length === 0}
        titreVide="Aucun article" texteVide={recherche ? 'Aucun résultat pour cette recherche.' : 'Rien dans cette catégorie pour le moment.'}>
        <div className="grille">
          {affiches.map((a) => (
            <Link key={a.id} to={`/media/articles/${a.id}`} className="carte-media">
              <div style={{ position: 'relative' }}>
                <Image className="image" src={a.imageUrl} alt="" />
                {(a.categorie === 'VIDEO' || a.videoUrl) && <PlayCircle size={34} color="#fff" style={{ position: 'absolute', right: 10, bottom: 10 }} />}
              </div>
              <div className="corps">
                {a.aLaUne && <span className="badge"><Star size={10} /> À la une</span>}
                <h3>{a.titre}</h3>
                <p className="petit attenue">{formaterLibelle(a.categorie)}{a.compteurVues > 0 ? ` · ${a.compteurVues} vues` : ''}</p>
              </div>
            </Link>
          ))}
        </div>
        {!derniere && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button type="button" className="bouton secondaire" onClick={voirPlus} disabled={chargement}>Voir plus d’articles</button>
          </div>
        )}
      </Etat>
    </>
  );
}
