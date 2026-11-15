package bj.myaddictive.securite;

import org.springframework.boot.web.reactive.function.client.WebClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URI;

/**
 * Ajoute le jeton interne aux appels HTTP que l'application fait vers elle-meme (boucle locale).
 * Les appels vers des services externes (MTN, FedaPay...) utilisent leur propre WebClient et ne
 * recoivent jamais ce jeton ; ceux construits depuis le WebClient.Builder injecte ne l'ajoutent que
 * si l'adresse cible est localhost.
 */
@Configuration
public class ClientInterneConfig {

    @Bean
    public WebClientCustomizer jetonInterneCustomizer() {
        return (WebClient.Builder builder) -> builder.filter(ExchangeFilterFunction.ofRequestProcessor(requete -> {
            URI uri = requete.url();
            String hote = uri.getHost();
            if ("localhost".equalsIgnoreCase(hote) || "127.0.0.1".equals(hote)) {
                return reactor.core.publisher.Mono.just(
                        org.springframework.web.reactive.function.client.ClientRequest.from(requete)
                                .header(JetonInterne.ENTETE, JetonInterne.valeur()).build());
            }
            return reactor.core.publisher.Mono.just(requete);
        }));
    }
}
