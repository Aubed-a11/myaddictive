package bj.myaddictive.live.config;

import bj.myaddictive.live.domain.Chaine;
import bj.myaddictive.live.repository.ChaineRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Rattache a chaque artiste importe sa photo et son label de l'ancien site
 * (resources/legacy/photos_artistes.json ; photos hebergees sur
 * myaddictive.com/.../images/artistes/). Ne modifie jamais une image ou une
 * description deja renseignee. Rapprochement par nom exact.
 */
@Component
@Order(4) // apres ImporteurBiographiesArtistes : une biographie prime sur "Label : ..."
public class CompleteurPhotosArtistes implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CompleteurPhotosArtistes.class);

    private final ChaineRepository chaineRepository;
    private final ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public CompleteurPhotosArtistes(ChaineRepository chaineRepository) {
        this.chaineRepository = chaineRepository;
    }

    private record Ligne(String nom, String imageUrl, String label) {}

    @Override
    public void run(String... args) throws Exception {
        ClassPathResource ressource = new ClassPathResource("legacy/photos_artistes.json");
        if (!ressource.exists()) return;
        List<Ligne> lignes;
        try (InputStream in = ressource.getInputStream()) {
            lignes = mapper.readValue(in, mapper.getTypeFactory().constructCollectionType(List.class, Ligne.class));
        }
        Map<String, Ligne> parNom = new HashMap<>();
        for (Ligne l : lignes) parNom.putIfAbsent(l.nom().trim(), l);

        int maj = 0;
        for (Chaine c : chaineRepository.findAll()) {
            if (c.getNom() == null) continue;
            Ligne l = parNom.get(c.getNom().trim());
            if (l == null) continue;
            boolean change = false;
            if ((c.getImageUrl() == null || c.getImageUrl().isBlank()) && l.imageUrl() != null) {
                c.setImageUrl(l.imageUrl());
                change = true;
            }
            if ((c.getDescription() == null || c.getDescription().isBlank()) && l.label() != null) {
                c.setDescription("Label : " + l.label());
                change = true;
            }
            if (change) {
                chaineRepository.save(c);
                maj++;
            }
        }
        log.info("Photos et labels d'artistes : {} chaine(s) mise(s) a jour.", maj);
    }
}
