import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Play } from 'lucide-react';
import client from '../api/client';
import useCharger from '../utils/useCharger';
import { urlIntegrable } from '../utils/youtube';
import { Etat, Image, Retour } from '../components/ui';

const rechercheYoutube = (...termes) => `https://www.youtube.com/results?search_query=${encodeURIComponent(termes.filter(Boolean).join(' '))}`;

export default function AlbumDetail() {
  const { id } = useParams();
  const { data: album, chargement, erreur } = useCharger(() => client.get(`/api/media/albums/${id}`).then((r) => r.data), [id]);
  const [lecture, setLecture] = useState(null);
  const piste = album?.pistes?.find((p) => p.id === lecture);
  const lien = piste?.videoUrl ? urlIntegrable(piste.videoUrl) : null;

  return (
    <article style={{ maxWidth: 860, margin: '0 auto' }}>
      <Retour vers="/media/albums" />
      <Etat chargement={chargement} erreur={erreur}>
        {album && (
          <>
            {lien && <iframe className="video-integree" src={lien} title={piste.titre} allow="autoplay; encrypted-media" allowFullScreen style={{ marginBottom: 18 }} />}
            <div className="profil-entete">
              <Image className="profil-photo carre" src={album.imageUrl} alt="" />
              <div>
                <h1 className="titre-page">{album.titre}</h1>
                <p className="attenue">{[album.artiste, album.annee, album.label].filter(Boolean).join(' · ')}</p>
                <p style={{ marginTop: 10 }}>
                  <a className="bouton secondaire petit" href={rechercheYoutube(album.artiste, album.titre)} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} /> Voir sur YouTube
                  </a>
                </p>
              </div>
            </div>

            <h2 className="titre-section">Titres ({album.pistes.length})</h2>
            <div className="liste">
              {album.pistes.map((p) => (
                <div key={p.id} className="ligne">
                  <span className="attenue" style={{ width: 26 }}>{p.ordre}</span>
                  <div className="grow">
                    <strong>{p.titre}</strong>
                    <p className="petit attenue">{[p.collaboration && `feat. ${p.collaboration}`, p.duree].filter(Boolean).join(' · ')}</p>
                  </div>
                  {p.videoUrl
                    ? <button type="button" className="bouton petit" onClick={() => { setLecture(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Play size={14} /> Clip</button>
                    : <a className="bouton secondaire petit" href={rechercheYoutube(album.artiste, p.titre)} target="_blank" rel="noreferrer">YouTube</a>}
                </div>
              ))}
            </div>
          </>
        )}
      </Etat>
    </article>
  );
}
