package bj.myaddictive.media.repository;

import bj.myaddictive.media.domain.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    Page<Article> findByStatutAndCategorie(String statut, String categorie, Pageable pageable);
    Page<Article> findByStatutAndALaUneTrue(String statut, Pageable pageable);
    Page<Article> findByStatut(String statut, Pageable pageable);
    @org.springframework.data.jpa.repository.Query("""
            select a from Article a where a.statut = 'PUBLIE'
              and (:categorie = '' or a.categorie = :categorie)
              and (:aLaUne = false or a.aLaUne = true)
              and (:q = '' or lower(a.titre) like lower(concat('%', :q, '%')))""")
    Page<Article> rechercher(@org.springframework.data.repository.query.Param("categorie") String categorie,
                             @org.springframework.data.repository.query.Param("aLaUne") boolean aLaUne,
                             @org.springframework.data.repository.query.Param("q") String q,
                             Pageable pageable);
    long countBySourceLegacyIdStartingWith(String prefixe);
    java.util.List<Article> findByTitreStartingWith(String prefixe);
    long countByCategorie(String categorie);
}
