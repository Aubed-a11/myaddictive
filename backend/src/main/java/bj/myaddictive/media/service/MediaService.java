package bj.myaddictive.media.service;

import bj.myaddictive.media.domain.Article;
import bj.myaddictive.media.domain.OffrePromotion;
import bj.myaddictive.media.exception.ApiException;
import bj.myaddictive.media.repository.ArticleRepository;
import bj.myaddictive.media.repository.OffrePromotionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MediaService {

    private final ArticleRepository articleRepository;
    private final OffrePromotionRepository offrePromotionRepository;
    private final bj.myaddictive.media.repository.AlbumRepository albumRepository;
    private final bj.myaddictive.media.repository.PisteAlbumRepository pisteAlbumRepository;

    public MediaService(ArticleRepository articleRepository, OffrePromotionRepository offrePromotionRepository,
                        bj.myaddictive.media.repository.AlbumRepository albumRepository,
                        bj.myaddictive.media.repository.PisteAlbumRepository pisteAlbumRepository) {
        this.albumRepository = albumRepository;
        this.pisteAlbumRepository = pisteAlbumRepository;
        this.articleRepository = articleRepository;
        this.offrePromotionRepository = offrePromotionRepository;
    }

    public Page<Article> listerArticles(String categorie, boolean aLaUne, String q, String artiste, Pageable pageable) {
        return articleRepository.rechercher(
                categorie == null ? "" : categorie.trim(), aLaUne, q == null ? "" : q.trim(),
                artiste == null ? "" : artiste.trim(), pageable);
    }

    public java.util.List<bj.myaddictive.media.domain.Album> listerAlbums() {
        return albumRepository.findAllByOrderByAnneeDescIdDesc();
    }

    public bj.myaddictive.media.domain.Album obtenirAlbum(Long id) {
        bj.myaddictive.media.domain.Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Album introuvable."));
        album.setPistes(pisteAlbumRepository.findByAlbumIdOrderByOrdreAsc(id));
        return album;
    }

    @Transactional
    public Article obtenirArticle(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Article introuvable."));
        article.setCompteurVues(article.getCompteurVues() + 1);
        return articleRepository.save(article);
    }

    public Article creerArticle(Article article) {
        return articleRepository.save(article);
    }

    public Article modifierArticle(Long id, Article donnees) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Article introuvable."));
        article.setTitre(donnees.getTitre());
        article.setChapo(donnees.getChapo());
        article.setContenu(donnees.getContenu());
        article.setImageUrl(donnees.getImageUrl());
        article.setCategorie(donnees.getCategorie());
        article.setArtisteLie(donnees.getArtisteLie());
        article.setALaUne(donnees.isALaUne());
        article.setStatut(donnees.getStatut());
        return articleRepository.save(article);
    }

    public void supprimerArticle(Long id) {
        if (!articleRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Article introuvable.");
        articleRepository.deleteById(id);
    }

    public List<OffrePromotion> listerOffresPromotion() {
        return offrePromotionRepository.findAll();
    }
}
