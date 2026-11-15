package bj.myaddictive.securite;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Verifie le jeton JWT sur les routes qui exigent une connexion (achat, vote, panier, publication...).
 * Les routes de consultation libre restent ouvertes (acces libre, restriction au passage a l'action).
 *
 * Le filtre pose X-User-Id / X-User-Role a partir du jeton verifie : les controleurs lisent ces
 * en-tetes comme avant. Toute valeur envoyee par le client est supprimee au prealable.
 */
public class FiltreAuthentification extends OncePerRequestFilter {

    // Prefixes qui exigent une connexion prealable, quelle que soit la methode.
    private static final List<String> PREFIXES_PROTEGES = List.of(
            "/api/compte/moi", "/api/compte/favoris", "/api/compte/admin",
            "/api/live/billets", "/api/live/abonnements-chaine", "/api/live/sondages",
            "/api/live/mes-chaines-suivies", "/api/live/mes-evenements",
            "/api/votes/voter", "/api/votes/portefeuille", "/api/votes/mes-votes",
            "/api/boutique/panier", "/api/boutique/commandes", "/api/boutique/vendeurs/inscription",
            "/api/boutique/vendeurs/admin",
            "/api/paiement/transactions"
            // /api/paiement/webhooks/** reste public : c'est l'agregateur mobile money/carte qui l'appelle.
    );

    // Contenu gere par le back-office : lecture (GET) libre, ecriture reservee aux administrateurs
    // (le controleur revalide le role via X-User-Role).
    private static final List<String> PREFIXES_ADMIN_ECRITURE = List.of(
            "/api/live/evenements", "/api/live/chaines",
            "/api/votes/competitions", "/api/votes/candidats",
            "/api/boutique/produits", "/api/boutique/vendeurs",
            "/api/media/articles", "/api/live/podcasts"
    );

    // Suffixes toujours publics, meme sous un prefixe d'ecriture protege.
    private static final List<String> SUFFIXES_TOUJOURS_PUBLICS = List.of(
            "/spectateurs/entrer", "/spectateurs/sortir", "/reactions"
    );

    private final SecretKey cle;

    public FiltreAuthentification(String secret) {
        this.cle = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chaine)
            throws ServletException, IOException {

        // Appel de l'application vers elle-meme : identite deja posee par le domaine appelant.
        if (JetonInterne.estValide(req.getHeader(JetonInterne.ENTETE))) {
            chaine.doFilter(req, res);
            return;
        }

        String chemin = req.getRequestURI();
        String methode = req.getMethod();

        // Reserve a l'application elle-meme : creation de transaction (montant calcule par le domaine
        // metier, jamais choisi par le client), confirmation generique sans signature, /api/interne.
        boolean creationTransaction = "POST".equals(methode)
                && (chemin.endsWith("/api/paiement/transactions") || chemin.endsWith("/api/paiement/transactions/"));
        if (creationTransaction || chemin.contains("/api/paiement/webhook/") || chemin.contains("/api/interne")) {
            erreur(res, HttpServletResponse.SC_FORBIDDEN, "Operation reservee aux services internes.");
            return;
        }

        // Jamais d'identite fournie par le client.
        HttpServletRequest propre = new SansIdentite(req, null, null);

        if (SUFFIXES_TOUJOURS_PUBLICS.stream().anyMatch(chemin::endsWith)) {
            chaine.doFilter(propre, res);
            return;
        }

        boolean exigeConnexion = PREFIXES_PROTEGES.stream().anyMatch(chemin::startsWith);
        if (!exigeConnexion && !"GET".equals(methode) && !"OPTIONS".equals(methode)) {
            exigeConnexion = PREFIXES_ADMIN_ECRITURE.stream().anyMatch(chemin::startsWith);
        }

        String autorisation = req.getHeader("Authorization");
        boolean jetonPresent = autorisation != null && autorisation.startsWith("Bearer ");

        if (!jetonPresent) {
            if (exigeConnexion) {
                erreur(res, HttpServletResponse.SC_UNAUTHORIZED, "Connexion requise pour effectuer cette action.");
            } else {
                chaine.doFilter(propre, res);
            }
            return;
        }

        try {
            Claims claims = Jwts.parser().verifyWith(cle).build()
                    .parseSignedClaims(autorisation.substring(7)).getPayload();
            chaine.doFilter(new SansIdentite(req, claims.getSubject(), String.valueOf(claims.get("role"))), res);
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            if (exigeConnexion) {
                erreur(res, HttpServletResponse.SC_UNAUTHORIZED, "Jeton invalide ou expire.");
            } else {
                // Route libre mais jeton invalide : on l'ignore plutot que de bloquer une consultation.
                chaine.doFilter(propre, res);
            }
        }
    }

    private static void erreur(HttpServletResponse res, int statut, String message) throws IOException {
        res.setStatus(statut);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    /** Requete dont X-User-Id / X-User-Role sont remplaces (ou absents si null). */
    private static final class SansIdentite extends HttpServletRequestWrapper {
        private static final String ID = "X-User-Id";
        private static final String ROLE = "X-User-Role";
        private final String userId;
        private final String role;

        SansIdentite(HttpServletRequest req, String userId, String role) {
            super(req);
            this.userId = userId;
            this.role = role;
        }

        @Override
        public String getHeader(String nom) {
            if (ID.equalsIgnoreCase(nom)) return userId;
            if (ROLE.equalsIgnoreCase(nom)) return role;
            return super.getHeader(nom);
        }

        @Override
        public Enumeration<String> getHeaders(String nom) {
            if (ID.equalsIgnoreCase(nom) || ROLE.equalsIgnoreCase(nom)) {
                String v = getHeader(nom);
                return v == null ? Collections.emptyEnumeration() : Collections.enumeration(List.of(v));
            }
            return super.getHeaders(nom);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            Set<String> noms = new LinkedHashSet<>();
            for (String n : Collections.list(super.getHeaderNames())) {
                if (!ID.equalsIgnoreCase(n) && !ROLE.equalsIgnoreCase(n)) noms.add(n);
            }
            if (userId != null) noms.add(ID);
            if (role != null) noms.add(ROLE);
            return Collections.enumeration(noms);
        }
    }
}
