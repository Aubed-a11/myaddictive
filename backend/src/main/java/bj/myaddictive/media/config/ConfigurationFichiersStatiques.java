package bj.myaddictive.media.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sert les fichiers importes pour les medias (images d'articles, visuels...) depuis le dossier
 * local configure par media.uploads-path (par defaut ./uploads/, relatif au dossier de lancement
 * du backend). Expose sous /api/media/fichiers/**.
 */
@Configuration
public class ConfigurationFichiersStatiques implements WebMvcConfigurer {

    @Value("${media.uploads-path:./uploads/}")
    private String cheminUploads;

    /** Copie locale du dossier "actualites" de l'ancien site (images d'articles). */
    @Value("${media.actualites-path:/opt/myaddictive/medias/actualites/}")
    private String cheminActualites;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String chemin = cheminUploads.endsWith("/") ? cheminUploads : cheminUploads + "/";
        registry.addResourceHandler("/api/media/fichiers/**")
                .addResourceLocations("file:" + chemin)
                .setCachePeriod(3600);
        String actu = cheminActualites.endsWith("/") ? cheminActualites : cheminActualites + "/";
        registry.addResourceHandler("/api/media/actualites/**")
                .addResourceLocations("file:" + actu)
                .setCachePeriod(86400);
    }
}
