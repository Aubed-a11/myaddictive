import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Eye, Heart, PlayCircle, Share2 } from 'lucide-react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import useFavori from '../utils/useFavori';
import { partagerContenu } from '../utils/partage';
import { formaterLibelle } from '../utils/libelles';
import { urlIntegrable } from '../utils/youtube';
import { useNotifier } from '../context/Notifications';
import { Etat, Image, Retour } from '../components/ui';

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifier = useNotifier();
  const { data: article, chargement, erreur } = useCharger(() => client.get(`/api/media/articles/${id}`).then((r) => r.data), [id]);
  const { favori, basculer } = useFavori('ARTICLE', id);
  const integrable = article?.videoUrl ? urlIntegrable(article.videoUrl, article.categorie === 'VIDEO') : null;

  const surFavori = async () => {
    if (!(await basculer())) navigate(`/connexion?retour=${encodeURIComponent(pathname)}`);
  };
  const partager = async () => {
    const message = await partagerContenu({ titre: article.titre, message: `${article.titre}\n\n${article.chapo || ''}\n\nA lire sur My Addictive.` });
    if (message) notifier(message);
  };

  return (
    <article style={{ maxWidth: 820, margin: '0 auto' }}>
      <Retour vers="/media" />
      <Etat chargement={chargement} erreur={erreur}>
        {article && (
          <>
            {integrable
              ? <iframe className="video-integree" src={integrable} title={article.titre} allowFullScreen />
              : article.videoUrl
                ? (
                  <a href={article.videoUrl} target="_blank" rel="noreferrer" style={{ position: 'relative', display: 'block' }} aria-label="Lire la vidéo">
                    <Image className="visuel paysage" src={article.imageUrl} alt="" />
                    <PlayCircle size={64} color="#fff" style={{ position: 'absolute', inset: 0, margin: 'auto' }} />
                  </a>
                )
                : article.imageUrl && <Image className="visuel paysage" src={article.imageUrl} alt="" />}

            <div className="entete-page" style={{ marginTop: 18 }}>
              <h1 className="titre-page">{article.titre}</h1>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`bouton-icone${favori ? ' actif' : ''}`} onClick={surFavori} aria-label="Favori" aria-pressed={favori}><Heart size={18} fill={favori ? 'currentColor' : 'none'} /></button>
                <button className="bouton-icone" onClick={partager} aria-label="Partager"><Share2 size={18} /></button>
              </div>
            </div>
            <p style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 18px' }}>
              <span className="badge bleu">{formaterLibelle(article.categorie)}</span>
              {article.auteur && <span className="badge">Par {article.auteur}</span>}
              {article.compteurVues > 0 && <span className="badge"><Eye size={11} /> {article.compteurVues} vues</span>}
            </p>
            {article.chapo && <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{article.chapo}</p>}
            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{article.contenu}</div>
          </>
        )}
      </Etat>
    </article>
  );
}
