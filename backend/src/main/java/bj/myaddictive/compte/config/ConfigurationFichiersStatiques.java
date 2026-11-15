package bj.myaddictive.compte.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sert les photos de profil uploadees par les utilisateurs (section 9.2,
 * modification de la photo), depuis un dossier local hors du jar. Dossier
 * local configure par compte.uploads-path (par defaut ./data/uploads/).
 */
@Configuration
public class ConfigurationFichiersStatiques implements WebMvcConfigurer {

    @Value("${compte.uploads-path:./data/uploads/}")
    private String cheminUploads;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String chemin = cheminUploads.endsWith("/") ? cheminUploads : cheminUploads + "/";
        registry.addResourceHandler("/api/compte/fichiers/**")
                .addResourceLocations("file:" + chemin)
                .setCachePeriod(3600);
    }
}
