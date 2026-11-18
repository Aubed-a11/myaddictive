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
import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Renseigne la description (biographie) des artistes les plus presents dans
 * les articles, a partir de resources/legacy/biographies_artistes.json
 * (textes rediges d'apres des sources publiques). Ne touche jamais une
 * description deja renseignee. Rapprochement par nom sans accents ni casse.
 */
@Component
@Order(3)
public class ImporteurBiographiesArtistes implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ImporteurBiographiesArtistes.class);

    private final ChaineRepository chaineRepository;
    private final ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public ImporteurBiographiesArtistes(ChaineRepository chaineRepository) {
        this.chaineRepository = chaineRepository;
    }

    private record Bio(List<String> noms, String description) {}

    private static String cle(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    @Override
    public void run(String... args) throws Exception {
        ClassPathResource ressource = new ClassPathResource("legacy/biographies_artistes.json");
        if (!ressource.exists()) return;
        List<Bio> bios;
        try (InputStream in = ressource.getInputStream()) {
            bios = mapper.readValue(in, mapper.getTypeFactory().constructCollectionType(List.class, Bio.class));
        }
        Map<String, String> parNom = new HashMap<>();
        for (Bio b : bios) for (String n : b.noms()) parNom.put(cle(n), b.description());

        int maj = 0;
        for (Chaine c : chaineRepository.findAll()) {
            if (c.getDescription() != null && !c.getDescription().isBlank()) continue;
            String d = parNom.get(cle(c.getNom()));
            if (d == null) continue;
            c.setDescription(d);
            chaineRepository.save(c);
            maj++;
        }
        log.info("Biographies d'artistes : {} chaine(s) mise(s) a jour.", maj);
    }
}
