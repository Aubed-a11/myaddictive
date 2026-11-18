package bj.myaddictive.media.config;

import bj.myaddictive.media.domain.Article;
import bj.myaddictive.media.repository.ArticleRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Import des articles et des clips video de l'ancien site My Addictive
 * (tables mya_actualites et mya_videosemaine) depuis
 * resources/legacy/articles_legacy.json et videos_legacy.json.
 *
 * Articles : import idempotent. Chaque ligne porte un sourceLegacyId
 * ("actu-<numero>"). Les articles deja importes par une ancienne version
 * (sans identifiant source) sont retrouves par leur titre et mis a jour
 * (images, date, vues, categorie). Les articles de demonstration "[DEMO]"
 * sont supprimes : seules les vraies donnees de l'ancienne base sont
 * affichees. Une fois tout importe, l'etape est ignoree aux demarrages suivants.
 */
@Component
@Order(1)
public class ImporteurLegacyArticles implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ImporteurLegacyArticles.class);
    private static final String PREFIXE_ACTU = "actu-";

    private final ArticleRepository articleRepository;
    private final ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public ImporteurLegacyArticles(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    private record LigneImport(
            String titre, String chapo, String contenu, String imageUrl, String videoUrl, String categorie,
            boolean aLaUne, String statut, Long compteurVues, String sourceLegacyId, String datePublication,
            String artisteLie) {
    }

    @Override
    public void run(String... args) throws Exception {
        supprimerArticlesDemo();
        importerArticles();
        importerVideos();
    }

    private void supprimerArticlesDemo() {
        List<Article> demos = articleRepository.findByTitreStartingWith("[DEMO]");
        if (!demos.isEmpty()) {
            articleRepository.deleteAll(demos);
            log.info("{} article(s) de demonstration supprime(s).", demos.size());
        }
    }

    private List<LigneImport> lire(String fichier) throws Exception {
        ClassPathResource ressource = new ClassPathResource(fichier);
        if (!ressource.exists()) {
            log.info("Aucun fichier {} trouve, import legacy ignore.", fichier);
            return List.of();
        }
        try (InputStream in = ressource.getInputStream()) {
            return mapper.readValue(in, mapper.getTypeFactory().constructCollectionType(List.class, LigneImport.class));
        }
    }

    private void importerArticles() throws Exception {
        List<LigneImport> lignes = lire("legacy/articles_legacy.json");
        if (lignes.isEmpty()) return;
        if (articleRepository.countBySourceLegacyIdStartingWith(PREFIXE_ACTU) >= lignes.size()) {
            log.info("Import legacy des articles deja effectue, etape ignoree.");
            return;
        }

        Map<String, Article> parSource = new HashMap<>();
        Map<String, Article> parTitre = new HashMap<>();
        for (Article a : articleRepository.findAll()) {
            if (a.getSourceLegacyId() != null) parSource.put(a.getSourceLegacyId(), a);
            else if (a.getTitre() != null && !"VIDEO".equals(a.getCategorie())) parTitre.putIfAbsent(a.getTitre().trim(), a);
        }

        int crees = 0, misAJour = 0, erreurs = 0;
        for (LigneImport l : lignes) {
            try {
                if (l.titre() == null || l.titre().isBlank()) continue;
                Article a = parSource.get(l.sourceLegacyId());
                if (a == null) a = parTitre.remove(l.titre().trim());
                boolean nouveau = (a == null);
                if (nouveau) a = new Article();
                a.setSourceLegacyId(l.sourceLegacyId());
                a.setTitre(l.titre());
                a.setChapo(l.chapo());
                a.setContenu(l.contenu() != null ? l.contenu() : "");
                a.setImageUrl(l.imageUrl());
                a.setCategorie(l.categorie() != null ? l.categorie() : "ACTUALITE");
                a.setArtisteLie(l.artisteLie());
                a.setALaUne(l.aLaUne());
                a.setStatut(l.statut() != null ? l.statut() : "PUBLIE");
                a.setCompteurVues(l.compteurVues() != null ? l.compteurVues() : 0L);
                if (l.datePublication() != null) a.setDatePublication(Instant.parse(l.datePublication()));
                articleRepository.save(a);
                if (nouveau) crees++; else misAJour++;
            } catch (Exception e) {
                erreurs++;
                log.warn("Article ignore (source id={}) : {}", l.sourceLegacyId(), e.getMessage());
            }
        }
        log.info("Import legacy des articles termine : {} crees, {} mis a jour, {} en erreur (sur {} lignes).",
                crees, misAJour, erreurs, lignes.size());
    }

    private void importerVideos() throws Exception {
        if (articleRepository.countByCategorie("VIDEO") > 3) {
            log.info("Import legacy des videos deja effectue, etape ignoree.");
            return;
        }
        int importes = 0;
        for (LigneImport l : lire("legacy/videos_legacy.json")) {
            try {
                if (l.titre() == null || l.titre().isBlank()) continue;
                Article a = new Article();
                a.setTitre(l.titre());
                a.setChapo(l.chapo());
                a.setContenu(l.contenu() != null ? l.contenu() : "");
                a.setImageUrl(l.imageUrl());
                a.setVideoUrl(l.videoUrl());
                a.setCategorie("VIDEO");
                a.setALaUne(l.aLaUne());
                a.setStatut(l.statut() != null ? l.statut() : "PUBLIE");
                a.setCompteurVues(l.compteurVues() != null ? l.compteurVues() : 0L);
                a.setSourceLegacyId(l.sourceLegacyId());
                articleRepository.save(a);
                importes++;
            } catch (Exception e) {
                log.warn("Video ignoree (source id={}) : {}", l.sourceLegacyId(), e.getMessage());
            }
        }
        log.info("Import legacy des videos termine : {} crees.", importes);
    }
}
