package bj.myaddictive.paiement.service;

import bj.myaddictive.paiement.domain.StatutTransaction;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

/**
 * Client serveur de l'API FedaPay (Mobile Money) :
 *   POST /v1/transactions            -> cree la transaction (montant fixe cote serveur)
 *   POST /v1/transactions/{id}/token -> renvoie l'adresse de la page de paiement
 *   GET  /v1/transactions/{id}       -> statut reel (source de verite, jamais le client ni le seul webhook)
 * Authentification : en-tete "Authorization: Bearer <cle secrete>".
 * Environnement : sandbox-api.fedapay.com (test) ou api.fedapay.com (reel).
 */
@Component
public class FedaPayClient {

    private static final Logger log = LoggerFactory.getLogger(FedaPayClient.class);

    public record Paiement(String idExterne, String url) {}
    public record Verification(StatutTransaction statut, Long montantFcfa) {}

    private final String cleSecrete;
    private final boolean sandbox;
    private final WebClient webClient;

    public FedaPayClient(
            @Value("${mobile-money.fedapay.secret-key:}") String cleSecrete,
            @Value("${mobile-money.fedapay.sandbox:true}") boolean sandbox) {
        this.cleSecrete = cleSecrete == null ? "" : cleSecrete.trim();
        this.sandbox = sandbox;
        // Client externe (l'hote est externe), distinct du client interne de l'application.
        this.webClient = WebClient.builder()
                .baseUrl(sandbox ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1")
                .build();
    }

    public boolean estConfigure() {
        return !cleSecrete.isBlank();
    }

    /** Cree la transaction FedaPay puis son adresse de paiement. Leve une exception si FedaPay refuse. */
    public Paiement creerPaiement(long montantFcfa, String description, String urlRetour) {
        Map<String, Object> corps = Map.of(
                "description", description,
                "amount", montantFcfa,
                "currency", Map.of("iso", "XOF"),
                "callback_url", urlRetour
        );
        JsonNode creee = webClient.post().uri("/transactions")
                .header("Authorization", "Bearer " + cleSecrete)
                .bodyValue(corps)
                .retrieve().bodyToMono(JsonNode.class)
                .block(Duration.ofSeconds(15));
        JsonNode transaction = noeudTransaction(creee);
        String id = transaction.path("id").asText("");
        if (id.isBlank()) {
            throw new IllegalStateException("Reponse FedaPay inattendue a la creation de la transaction.");
        }

        JsonNode jeton = webClient.post().uri("/transactions/" + id + "/token")
                .header("Authorization", "Bearer " + cleSecrete)
                .retrieve().bodyToMono(JsonNode.class)
                .block(Duration.ofSeconds(15));
        String url = jeton == null ? "" : jeton.path("url").asText("");
        if (url.isBlank() && jeton != null && !jeton.path("token").asText("").isBlank()) {
            url = (sandbox ? "https://sandbox-process.fedapay.com/" : "https://process.fedapay.com/")
                    + jeton.path("token").asText();
        }
        if (url.isBlank()) {
            throw new IllegalStateException("FedaPay n'a pas renvoye d'adresse de paiement.");
        }
        log.info("Transaction FedaPay {} creee ({} FCFA).", id, montantFcfa);
        return new Paiement(id, url);
    }

    /** Statut reel chez FedaPay, ou vide si encore en cours / inconnu / erreur reseau. */
    public Optional<Verification> verifier(String idExterne) {
        if (!estConfigure() || idExterne == null || idExterne.isBlank()) return Optional.empty();
        try {
            JsonNode reponse = webClient.get().uri("/transactions/" + idExterne)
                    .header("Authorization", "Bearer " + cleSecrete)
                    .retrieve().bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(10));
            JsonNode t = noeudTransaction(reponse);
            String statut = t.path("status").asText("").toLowerCase();
            Long montant = t.hasNonNull("amount") ? t.get("amount").asLong() : null;
            log.info("Verification FedaPay {} -> {} ({} FCFA)", idExterne, statut, montant);
            return switch (statut) {
                case "approved", "transferred" -> Optional.of(new Verification(StatutTransaction.REUSSI, montant));
                case "declined", "canceled", "cancelled", "expired" -> Optional.of(new Verification(StatutTransaction.ECHEC, montant));
                default -> Optional.empty(); // pending ou valeur inconnue : on reessaiera
            };
        } catch (Exception e) {
            log.warn("Verification FedaPay impossible pour {} : {}", idExterne, e.getMessage());
            return Optional.empty();
        }
    }

    /** FedaPay enveloppe l'objet sous "v1/transaction" (ou "transaction") selon l'endpoint. */
    private static JsonNode noeudTransaction(JsonNode racine) {
        if (racine == null) throw new IllegalStateException("Reponse FedaPay vide.");
        if (racine.has("v1/transaction")) return racine.get("v1/transaction");
        if (racine.has("transaction")) return racine.get("transaction");
        return racine;
    }
}
