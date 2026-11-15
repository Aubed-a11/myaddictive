package bj.myaddictive.securite;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

/**
 * Autorise l'application web (Vite, port 5173) et le back-office a appeler l'API depuis leur
 * propre adresse. En production, restreindre avec CORS_ORIGINS (liste separee par des virgules).
 * Place AVANT le filtre d'authentification pour que les requetes OPTIONS (preflight) passent.
 */
@Configuration
public class CorsConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter(@Value("${app.cors.allowed-origins:*}") String origines) {
        CorsConfiguration config = new CorsConfiguration();
        Arrays.stream(origines.split(",")).map(String::trim).filter(s -> !s.isEmpty())
                .forEach(config::addAllowedOriginPattern);
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}
