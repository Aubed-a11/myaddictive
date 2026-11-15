package bj.myaddictive.securite;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;

import java.util.Arrays;

@Configuration
public class EnregistrementFiltreAuthentification {
    private static final String SECRET_PAR_DEFAUT = "myaddictive-dev-secret-change-in-production-0123456789";

    @Bean
    public FilterRegistrationBean<FiltreAuthentification> filtreAuthentification(
            @Value("${jwt.secret:" + SECRET_PAR_DEFAUT + "}") String secret, Environment env) {
        boolean prod = Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (prod && (secret == null || secret.isBlank() || secret.equals(SECRET_PAR_DEFAUT))) {
            throw new IllegalStateException("JWT_SECRET manquant ou laisse a sa valeur de developpement en production. "
                    + "Genere une vraie valeur (ex. `openssl rand -base64 48`).");
        }
        FilterRegistrationBean<FiltreAuthentification> bean = new FilterRegistrationBean<>(new FiltreAuthentification(secret));
        bean.addUrlPatterns("/api/*");
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        return bean;
    }
}
