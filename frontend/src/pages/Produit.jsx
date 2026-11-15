import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Flame, Heart, Share2, Store } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/Notifications';
import useCharger from '../utils/useCharger';
import useFavori from '../utils/useFavori';
import { partagerContenu } from '../utils/partage';
import { fcfa } from '../utils/libelles';
import { Etat, Image, MessageErreur, Retour } from '../components/ui';
import CompteARebours from '../components/CompteARebours';

async function charger(id) {
  const { data: produit } = await client.get(`/api/boutique/produits/${id}`);
  let vendeur = null;
  try { vendeur = (await client.get(`/api/boutique/vendeurs/${produit.vendeurId}`)).data; } catch { /* vendeur facultatif */ }
  return { produit, vendeur };
}

export default function Produit() {
  const { id } = useParams();
  const { estConnecte } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifier = useNotifier();
  const { data, chargement, erreur } = useCharger(() => charger(id), [id]);
  const { favori, basculer } = useFavori('PRODUIT', id);
  const [quantite, setQuantite] = useState(1);
  const [taille, setTaille] = useState(null);
  const [erreurAjout, setErreurAjout] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const produit = data?.produit;
  const vendeur = data?.vendeur;
  const dropAVenir = produit?.dropLimite && produit.dateDebutDrop && new Date(produit.dateDebutDrop) > new Date();
  const tailles = produit?.taillesDisponibles ? produit.taillesDisponibles.split(',').filter(Boolean) : [];
  const versConnexion = () => navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);

  const ajouter = async () => {
    if (!estConnecte) return versConnexion();
    if (tailles.length && !taille) return setErreurAjout("Choisissez une taille avant d'ajouter ce produit au panier.");
    setErreurAjout(null);
    setEnCours(true);
    try {
      await client.post('/api/boutique/panier', { produitId: Number(id), quantite, taille: taille || undefined });
      notifier('Ajouté au panier 🛒', 'succes');
    } catch (e) {
      setErreurAjout(e.message);
    } finally {
      setEnCours(false);
    }
  };
  const partager = async () => {
    const m = await partagerContenu({ titre: produit.nom, message: `${produit.nom} - ${fcfa(produit.prixFcfa)} sur My Addictive !` });
    if (m) notifier(m);
  };

  return (
    <>
      <Retour vers="/boutique" />
      <Etat chargement={chargement} erreur={erreur}>
        {produit && (
          <div className="deux-colonnes">
            <Image className="visuel carre" src={produit.imageUrl} alt={produit.nom} />
            <div>
              {produit.dropLimite && <span className="badge rouge">DROP LIMITÉ</span>}
              <div className="entete-page" style={{ marginTop: 6 }}>
                <h1 className="titre-page">{produit.nom}</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`bouton-icone${favori ? ' actif' : ''}`} onClick={async () => { if (!(await basculer())) versConnexion(); }} aria-label="Favori" aria-pressed={favori}><Heart size={18} fill={favori ? 'currentColor' : 'none'} /></button>
                  <button className="bouton-icone" onClick={partager} aria-label="Partager"><Share2 size={18} /></button>
                </div>
              </div>
              {vendeur && <p><Link className="lien-or" to={`/boutique/vendeurs/${produit.vendeurId}`}><Store size={14} style={{ verticalAlign: -2 }} /> Vendu par {vendeur.nomBoutique}</Link></p>}
              <p className="prix" style={{ margin: '10px 0 4px' }}>{fcfa(produit.prixFcfa)}</p>
              <p className="attenue">{produit.stock > 0 ? `${produit.stock} en stock` : 'Rupture de stock'}</p>
              {produit.stock > 0 && produit.stock <= 5 && <span className="badge rouge"><Flame size={11} /> Plus que {produit.stock} en stock !</span>}
              {produit.description && <p style={{ margin: '14px 0', lineHeight: 1.6 }}>{produit.description}</p>}
              {dropAVenir && <p className="carte" style={{ margin: '14px 0' }}>Disponible dans : <strong className="or"><CompteARebours dateCible={produit.dateDebutDrop} /></strong></p>}

              {tailles.length > 0 && (
                <div className="champ">
                  <label>Taille</label>
                  <div className="filtres" style={{ marginBottom: 0 }}>
                    {tailles.map((t) => <button key={t} type="button" className={`filtre${taille === t ? ' actif' : ''}`} onClick={() => setTaille(t)}>{t}</button>)}
                  </div>
                </div>
              )}
              <div className="champ">
                <label>Quantité</label>
                <div className="quantite">
                  <button type="button" onClick={() => setQuantite(Math.max(1, quantite - 1))} aria-label="Moins">−</button>
                  <span>{quantite}</span>
                  <button type="button" onClick={() => setQuantite(Math.min(produit.stock || 1, quantite + 1))} aria-label="Plus">+</button>
                </div>
              </div>
              <MessageErreur message={erreurAjout} />
              <button className="bouton plein" onClick={ajouter} disabled={enCours || produit.stock <= 0 || dropAVenir}>
                {dropAVenir ? 'Pas encore en vente' : `Ajouter au panier · ${fcfa(produit.prixFcfa * quantite)}`}
              </button>
            </div>
          </div>
        )}
      </Etat>
    </>
  );
}
