package bj.myaddictive.media.config;

import bj.myaddictive.media.domain.Album;
import bj.myaddictive.media.domain.PisteAlbum;
import bj.myaddictive.media.repository.AlbumRepository;
import bj.myaddictive.media.repository.PisteAlbumRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

/**
 * Import ponctuel des albums de l'ancien site (tables mya_album et
 * mya_albumtrack) depuis resources/legacy/albums_legacy.json, avec leurs
 * titres et les clips YouTube connus. Idempotent : ignore les albums deja
 * importes (par identifiant d'origine).
 */
@Component
@Order(2)
public class ImporteurLegacyAlbums implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ImporteurLegacyAlbums.class);

    private final AlbumRepository albumRepository;
    private final PisteAlbumRepository pisteRepository;
    private final ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public ImporteurLegacyAlbums(AlbumRepository albumRepository, PisteAlbumRepository pisteRepository) {
        this.albumRepository = albumRepository;
        this.pisteRepository = pisteRepository;
    }

    private record LignePiste(String titre, String duree, String collaboration, String videoUrl, Integer ordre) {}

    private record LigneAlbum(String sourceLegacyId, String titre, String artiste, String annee, String label,
                              String imageUrl, List<LignePiste> pistes) {}

    @Override
    public void run(String... args) throws Exception {
        ClassPathResource ressource = new ClassPathResource("legacy/albums_legacy.json");
        if (!ressource.exists()) return;
        List<LigneAlbum> lignes;
        try (InputStream in = ressource.getInputStream()) {
            lignes = mapper.readValue(in, mapper.getTypeFactory().constructCollectionType(List.class, LigneAlbum.class));
        }
        java.util.Set<String> existants = new java.util.HashSet<>();
        albumRepository.findAll().forEach(a -> existants.add(a.getSourceLegacyId()));

        int crees = 0;
        for (LigneAlbum l : lignes) {
            try {
                if (l.titre() == null || existants.contains(l.sourceLegacyId())) continue;
                Album a = new Album();
                a.setSourceLegacyId(l.sourceLegacyId());
                a.setTitre(l.titre());
                a.setArtiste(l.artiste());
                a.setAnnee(l.annee());
                a.setLabel(l.label());
                a.setImageUrl(l.imageUrl());
                a = albumRepository.save(a);
                if (l.pistes() != null) {
                    for (LignePiste lp : l.pistes()) {
                        PisteAlbum p = new PisteAlbum();
                        p.setAlbumId(a.getId());
                        p.setTitre(lp.titre() != null ? lp.titre() : "Sans titre");
                        p.setDuree(lp.duree());
                        p.setCollaboration(lp.collaboration());
                        p.setVideoUrl(lp.videoUrl());
                        p.setOrdre(lp.ordre());
                        pisteRepository.save(p);
                    }
                }
                crees++;
            } catch (Exception e) {
                log.warn("Album ignore (source id={}) : {}", l.sourceLegacyId(), e.getMessage());
            }
        }
        log.info("Import legacy des albums termine : {} cree(s) (sur {}).", crees, lignes.size());
    }
}
